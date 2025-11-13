package redis

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

var (
	Client *redis.Client
	ctx    = context.Background()
)

func InitRedis(redisURL string) error {
	if redisURL == "" {
		redisURL = "localhost:6379"
	}

	if strings.HasPrefix(redisURL, "redis://") {
		redisURL = strings.TrimPrefix(redisURL, "redis://")
	}

	Client = redis.NewClient(&redis.Options{
		Addr:        redisURL,
		Password:    "",
		DB:          0,
		DialTimeout: 5 * time.Second,
	})

	_, err := Client.Ping(ctx).Result()
	if err != nil {
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return nil
}

func TestConnection() error {
	if Client == nil {
		return fmt.Errorf("Redis client not initialized")
	}
	
	// Test basic operations
	err := Client.Set(ctx, "test_key", "test_value", 0).Err()
	if err != nil {
		return fmt.Errorf("failed to set test key: %w", err)
	}
	
	val, err := Client.Get(ctx, "test_key").Result()
	if err != nil {
		return fmt.Errorf("failed to get test key: %w", err)
	}
	
	if val != "test_value" {
		return fmt.Errorf("test value mismatch: expected 'test_value', got '%s'", val)
	}
	
	// Clean up
	Client.Del(ctx, "test_key")
	
	return nil
}

func IndexProduct(id, name, category, productType, imageURL string) error {
	if Client == nil {
		return fmt.Errorf("Redis client not initialized")
	}
	
	fmt.Printf("IndexProduct called with: id=%s, name=%s, category=%s, type=%s\n", id, name, category, productType)

	key := "autocomplete:titles"
	name = strings.ToLower(strings.TrimSpace(name))
	category = strings.ToLower(strings.TrimSpace(category))
	productType = strings.ToLower(strings.TrimSpace(productType))
	
	// Create all possible search combinations
	combinations := []string{
		name,
		category,
		productType,
		name + " " + category,
		name + " " + productType,
		category + " " + productType,
		name + " " + category + " " + productType,
		category + " " + name,
		productType + " " + name,
		category + " " + productType + " " + name,
		productType + " " + category,
		productType + " " + name + " " + category,
	}
	
	pipe := Client.Pipeline()
	for _, combination := range combinations {
		prefixes := generatePrefixes(combination)
		for _, prefix := range prefixes {
			// Store as: prefix|id|name|category|type|imageURL
			member := fmt.Sprintf("%s|%s|%s|%s|%s|%s", prefix, id, name, category, productType, imageURL)
			pipe.ZAdd(ctx, key, redis.Z{Score: 0, Member: member})
		}
	}
	
	_, err := pipe.Exec(ctx)
	if err != nil {
		fmt.Printf("Redis pipeline execution failed: %v\n", err)
	} else {
		fmt.Printf("Successfully indexed product %s with %d combinations\n", name, len(combinations))
	}
	return err
}

func AutocompleteSearch(prefix string, limit int) ([]map[string]string, error) {
	if Client == nil {
		return nil, fmt.Errorf("Redis client not initialized")
	}

	key := "autocomplete:titles"
	prefix = strings.ToLower(strings.TrimSpace(prefix))
	
	if prefix == "" {
		return []map[string]string{}, nil
	}

	min := "[" + prefix
	max := "[" + prefix + "\xff"
	
	members, err := Client.ZRangeByLex(ctx, key, &redis.ZRangeBy{
		Min:    min,
		Max:    max,
		Offset: 0,
		Count:  int64(limit * 3),
	}).Result()
	
	if err != nil {
		return nil, err
	}

	results := make([]map[string]string, 0, limit)
	seen := make(map[string]bool)
	
	for _, member := range members {
		parts := strings.SplitN(member, "|", 6)
		if len(parts) == 6 {
			id := parts[1]
			name := parts[2]
			category := parts[3]
			productType := parts[4]
			imageURL := parts[5]
			
			if !seen[id] && len(results) < limit {
				title := fmt.Sprintf("%s - %s %s", name, category, productType)
				results = append(results, map[string]string{
					"id":       id,
					"title":    title,
					"name":     name,
					"category": category,
					"type":     productType,
					"image":    imageURL,
				})
				seen[id] = true
			}
		}
	}
	
	return results, nil
}

func generatePrefixes(s string) []string {
	var prefixes []string
	
	words := strings.Fields(s)
	joined := strings.Join(words, "")
	
	for i := 1; i <= len(joined); i++ {
		prefixes = append(prefixes, joined[:i])
	}
	
	for _, word := range words {
		for i := 1; i <= len(word); i++ {
			prefixes = append(prefixes, word[:i])
		}
	}
	
	return prefixes
}
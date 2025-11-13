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
	
	fmt.Printf("Redis client options: %+v\n", Client.Options())
	
	// Test basic operations
	err := Client.Set(ctx, "test_key", "test_value", 0).Err()
	if err != nil {
		return fmt.Errorf("failed to set test key: %w", err)
	}
	fmt.Printf("Successfully set test_key\n")
	
	val, err := Client.Get(ctx, "test_key").Result()
	if err != nil {
		return fmt.Errorf("failed to get test key: %w", err)
	}
	fmt.Printf("Successfully got test_key: %s\n", val)
	
	if val != "test_value" {
		return fmt.Errorf("test value mismatch: expected 'test_value', got '%s'", val)
	}
	
	// Test ZADD operation
	err = Client.ZAdd(ctx, "test_zset", redis.Z{Score: 1, Member: "test_member"}).Err()
	if err != nil {
		return fmt.Errorf("failed to zadd: %w", err)
	}
	fmt.Printf("Successfully added to test_zset\n")
	
	// Check if it exists
	count, err := Client.ZCard(ctx, "test_zset").Result()
	if err != nil {
		return fmt.Errorf("failed to zcard: %w", err)
	}
	fmt.Printf("test_zset has %d members\n", count)
	
	// Clean up
	Client.Del(ctx, "test_key", "test_zset")
	
	return nil
}

func IndexProduct(id, name, category, productType, imageURL string) error {
	if Client == nil {
		return fmt.Errorf("Redis client not initialized")
	}
	


	// Validate inputs
	if id == "" || name == "" {
		return fmt.Errorf("id and name are required")
	}

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
	
	// Use individual commands instead of pipeline for better error handling
	totalAdded := 0
	for _, combination := range combinations {
		if combination == "" {
			continue
		}
		prefixes := generatePrefixes(combination)
		for _, prefix := range prefixes {
			if prefix == "" {
				continue
			}
			// Store as: prefix|id|name|category|type|imageURL
			member := fmt.Sprintf("%s|%s|%s|%s|%s|%s", prefix, id, name, category, productType, imageURL)
			result := Client.ZAdd(ctx, key, redis.Z{Score: 0, Member: member})
			if result.Err() != nil {
				fmt.Printf("Failed to add member %s: %v\n", member, result.Err())
				return fmt.Errorf("failed to add Redis member: %w", result.Err())
			}

			totalAdded++
		}
	}
	

	

	return nil
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

func AutocompleteSearchWithOffset(prefix string, limit int, offset int) ([]map[string]string, error) {
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
		Offset: int64(offset),
		Count:  int64(limit * 3),
	}).Result()
	
	if err != nil {
		return nil, err
	}

	results := make([]map[string]string, 0, limit)
	seen := make(map[string]bool)
	skipped := 0
	
	for _, member := range members {
		parts := strings.SplitN(member, "|", 6)
		if len(parts) == 6 {
			id := parts[1]
			name := parts[2]
			category := parts[3]
			productType := parts[4]
			imageURL := parts[5]
			
			if !seen[id] {
				if skipped < offset {
					skipped++
					continue
				}
				
				if len(results) >= limit {
					break
				}
				
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
	if s == "" {
		return []string{}
	}
	
	var prefixes []string
	seenPrefixes := make(map[string]bool)
	
	// Generate prefixes for the full string (no spaces)
	joined := strings.ReplaceAll(s, " ", "")
	for i := 1; i <= len(joined); i++ {
		prefix := joined[:i]
		if !seenPrefixes[prefix] {
			prefixes = append(prefixes, prefix)
			seenPrefixes[prefix] = true
		}
	}
	
	// Generate prefixes for individual words
	words := strings.Fields(s)
	for _, word := range words {
		for i := 1; i <= len(word); i++ {
			prefix := word[:i]
			if !seenPrefixes[prefix] {
				prefixes = append(prefixes, prefix)
				seenPrefixes[prefix] = true
			}
		}
	}
	
	return prefixes
}

func RemoveProduct(productID string) error {
	if Client == nil {
		return fmt.Errorf("Redis client not initialized")
	}

	key := "autocomplete:titles"
	fmt.Printf("Removing product %s from Redis\n", productID)
	
	// Use Lua script to remove all entries containing the product ID
	luaScript := `
		local key = KEYS[1]
		local productId = ARGV[1]
		local members = redis.call('ZRANGE', key, 0, -1)
		local removed = 0
		for i = 1, #members do
			local parts = {}
			for part in string.gmatch(members[i], "([^|]+)") do
				table.insert(parts, part)
			end
			if #parts >= 2 and parts[2] == productId then
				redis.call('ZREM', key, members[i])
				removed = removed + 1
			end
		end
		return removed
	`
	
	removed, err := Client.Eval(ctx, luaScript, []string{key}, productID).Result()
	if err != nil {
		return fmt.Errorf("failed to remove product entries: %w", err)
	}
	
	fmt.Printf("Successfully removed %v entries for product %s\n", removed, productID)
	return nil
}
package gapi

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

var rdb *redis.Client
var ctx = context.Background()

func InitRedis(addr string) {
	if addr == "" {
		addr = "localhost:6379"
	}
	// Remove redis:// prefix if present
	if strings.HasPrefix(addr, "redis://") {
		addr = strings.TrimPrefix(addr, "redis://")
	}
	rdb = redis.NewClient(&redis.Options{
		Addr:        addr,
		Password:    "",
		DB:          0,
		DialTimeout: 5 * time.Second,
	})
}

// build prefixes for a given string
func prefixes(s string) []string {
	s = strings.ToLower(strings.TrimSpace(s))
	var out []string
	joined := strings.ReplaceAll(s, " ", "")
	for i := 1; i <= len(joined); i++ {
		out = append(out, joined[:i])
	}
	return out
}

// Index a product into sorted set
func IndexProduct(id int64, name, category, productType string) error {
	key := "autocomplete:products"
	fullText := fmt.Sprintf("%s %s %s", name, category, productType)
	token := fmt.Sprintf("P|%d|%s", id, fullText)

	pfxs := prefixes(fullText)
	zs := make([]redis.Z, 0, len(pfxs))
	for _, p := range pfxs {
		zs = append(zs, redis.Z{Score: 0, Member: p + "|" + token})
	}

	pipe := rdb.Pipeline()
	for _, z := range zs {
		pipe.ZAdd(ctx, key, z)
	}
	_, err := pipe.Exec(ctx)
	return err
}

// Product suggestion struct
type ProductSuggestion struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	ImageURL string `json:"image_url"`
	Category string `json:"category"`
	Type     string `json:"type"`
}

// Autocomplete query returning product data
func AutocompleteProducts(q string, limit int64) ([]ProductSuggestion, error) {
	key := "autocomplete:products"
	q = strings.ToLower(strings.ReplaceAll(strings.TrimSpace(q), " ", ""))
	if q == "" {
		return nil, nil
	}

	min := "[" + q
	max := "[" + q + string('\xff')
	opt := &redis.ZRangeBy{
		Min:    min,
		Max:    max,
		Offset: 0,
		Count:  limit * 2, // Get more to filter duplicates
	}

	members, err := rdb.ZRangeByLex(ctx, key, opt).Result()
	if err != nil {
		return nil, err
	}

	results := make([]ProductSuggestion, 0, limit)
	seen := map[string]bool{}
	for _, mem := range members {
		parts := strings.SplitN(mem, "|", 4)
		if len(parts) >= 3 {
			productID := parts[1]
			if !seen[productID] {
				// Get product data from cache or DB
				product, err := getProductData(productID)
				if err == nil {
					results = append(results, product)
					seen[productID] = true
				}
			}
		}
		if int64(len(results)) >= limit {
			break
		}
	}
	return results, nil
}

// Get product data from Redis cache or database
func getProductData(productID string) (ProductSuggestion, error) {
	// Try Redis cache first
	productData, err := rdb.HGetAll(ctx, "product:"+productID).Result()
	if err == nil && len(productData) > 0 {
		return ProductSuggestion{
			ID:       productData["id"],
			Name:     productData["name"],
			ImageURL: productData["product_url"],
			Category: productData["category"],
			Type:     productData["type"],
		}, nil
	}
	
	// Fallback: return basic data
	return ProductSuggestion{
		ID:       productID,
		Name:     "Product " + productID,
		ImageURL: "/placeholder.jpg",
		Category: "unknown",
		Type:     "unknown",
	}, nil
}
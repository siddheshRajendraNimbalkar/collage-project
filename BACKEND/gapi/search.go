package gapi

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	db "github.com/siddheshRajendraNimbalkar/collage-prject-backend/db/sqlc"
	"github.com/siddheshRajendraNimbalkar/collage-prject-backend/pb"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (server *Server) SearchProducts(ctx context.Context, req *pb.SearchProductsRequest) (*pb.SearchProductsResponse, error) {
	query := strings.ToUpper(strings.TrimSpace(req.GetQuery()))
	if len(query) < 1 {
		return &pb.SearchProductsResponse{Products: []*pb.Product{}}, nil
	}

	results := []*pb.Product{}

	// Use Redis for fast autocomplete if available
	if server.redis != nil {
		// Get autocomplete suggestions
		suggestions := server.getAutocompleteSuggestions(ctx, query)
		
		// Convert suggestions to products
		for _, suggestion := range suggestions {
			productIDs, err := server.redis.SMembers(ctx, "search:"+suggestion).Result()
			if err == nil {
				for _, productID := range productIDs {
					product, err := server.getProductFromCache(ctx, productID)
					if err == nil && !containsProduct(results, product) {
						results = append(results, product)
						if len(results) >= 10 { // Limit results
							break
						}
					}
				}
			}
			if len(results) >= 10 {
				break
			}
		}
	}

	// If no Redis results or Redis unavailable, fallback to database
	if len(results) == 0 {
		return server.fallbackSearch(ctx, req.GetQuery())
	}

	return &pb.SearchProductsResponse{Products: results}, nil
}

func (server *Server) getAutocompleteSuggestions(ctx context.Context, query string) []string {
	query = strings.ToLower(strings.TrimSpace(query))
	suggestions := []string{}
	
	// Get matches that start with the query
	matches, err := server.redis.ZRangeByScore(ctx, "autocomplete", &redis.ZRangeBy{
		Min: fmt.Sprintf("[%s", query),
		Max: fmt.Sprintf("[%s\xff", query),
		Offset: 0,
		Count: 50,
	}).Result()
	
	if err == nil {
		// Prioritize complete sentences (with *) first
		completeSentences := []string{}
		partialMatches := []string{}
		
		for _, match := range matches {
			if strings.HasPrefix(match, query) {
				if strings.HasSuffix(match, "*") {
					completeSentences = append(completeSentences, match)
				} else {
					partialMatches = append(partialMatches, match)
				}
			}
		}
		
		// Return complete sentences first, then partial matches
		suggestions = append(suggestions, completeSentences...)
		suggestions = append(suggestions, partialMatches...)
	}
	
	return suggestions
}

func (server *Server) getProductFromCache(ctx context.Context, productID string) (*pb.Product, error) {
	// Try to get from Redis cache first
	productData, err := server.redis.HGetAll(ctx, "product:"+productID).Result()
	if err == nil && len(productData) > 0 {
		// Convert cached data to Product
		price, _ := strconv.ParseFloat(productData["price"], 64)
		stock, _ := strconv.ParseInt(productData["stock"], 10, 32)
		
		return &pb.Product{
			Id:          productData["id"],
			Name:        productData["name"],
			Description: productData["description"],
			Price:       price,
			Stock:       int32(stock),
			CreatedBy:   productData["created_by"],
			CreatedAt:   productData["created_at"],
			ProductUrl:  productData["product_url"],
			Category:    productData["category"],
			Type:        productData["type"],
		}, nil
	}
	
	// Fallback to database
	productUUID, err := uuid.Parse(productID)
	if err != nil {
		return nil, err
	}
	
	product, err := server.store.GetProductByID(ctx, productUUID)
	if err != nil {
		return nil, err
	}
	
	// Cache the product for future use
	server.cacheProduct(ctx, product)
	
	return &pb.Product{
		Id:          product.ID.String(),
		Name:        product.Name,
		Description: product.Description,
		Price:       parseFloat(product.Price),
		Stock:       product.Stock,
		CreatedBy:   product.CreatedBy.UUID.String(),
		CreatedAt:   product.CreatedAt.Time.Format("2006-01-02 15:04:05"),
		ProductUrl:  product.ProductUrl,
		Category:    product.Category,
		Type:        product.Type,
	}, nil
}

func (server *Server) cacheProduct(ctx context.Context, product db.Product) {
	if server.redis == nil {
		return
	}
	
	productData := map[string]interface{}{
		"id":          product.ID.String(),
		"name":        product.Name,
		"description": product.Description,
		"price":       product.Price,
		"stock":       product.Stock,
		"created_by":  product.CreatedBy.UUID.String(),
		"created_at":  product.CreatedAt.Time.Format("2006-01-02 15:04:05"),
		"product_url": product.ProductUrl,
		"category":    product.Category,
		"type":        product.Type,
	}
	
	server.redis.HMSet(ctx, "product:"+product.ID.String(), productData)
	server.redis.Expire(ctx, "product:"+product.ID.String(), time.Hour*24) // Cache for 24 hours
}

func (server *Server) fallbackSearch(ctx context.Context, query string) (*pb.SearchProductsResponse, error) {
	products, err := server.store.GetProductByName(ctx, query)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to search products: %v", err)
	}

	results := []*pb.Product{}
	for _, product := range products {
		results = append(results, &pb.Product{
			Id:          product.ID.String(),
			Name:        product.Name,
			Description: product.Description,
			Price:       parseFloat(product.Price),
			CreatedBy:   product.CreatedBy.UUID.String(),
			CreatedAt:   product.CreatedAt.Time.Format("2006-01-02 15:04:05"),
			ProductUrl:  product.ProductUrl,
			Category:    product.Category,
			Type:        product.Type,
			Stock:       product.Stock,
		})
	}

	return &pb.SearchProductsResponse{Products: results}, nil
}

func (server *Server) getProductByIDString(ctx context.Context, productIDStr string) (*pb.Product, error) {
	// This would need to be implemented based on your existing GetProductByID logic
	// For now, return a placeholder
	return &pb.Product{
		Id:   productIDStr,
		Name: "Sample Product",
	}, nil
}

func containsProduct(products []*pb.Product, product *pb.Product) bool {
	for _, p := range products {
		if p.Id == product.Id {
			return true
		}
	}
	return false
}
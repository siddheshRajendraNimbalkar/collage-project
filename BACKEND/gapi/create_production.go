package gapi

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	db "github.com/siddheshRajendraNimbalkar/collage-prject-backend/db/sqlc"
	"github.com/siddheshRajendraNimbalkar/collage-prject-backend/pb"
	"github.com/siddheshRajendraNimbalkar/collage-prject-backend/util"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func parseFloat(price string) float64 {
	parsedPrice, err := strconv.ParseFloat(price, 64)
	if err != nil {
		return 0
	}
	return parsedPrice
}

func saveProductInRedis(ctx context.Context, client *redis.Client, productID string, name, category, productType string) error {
	pipe := client.Pipeline()

	// Clean inputs
	name = strings.TrimSpace(strings.ToLower(name))
	category = strings.TrimSpace(strings.ToLower(category))
	productType = strings.TrimSpace(strings.ToLower(productType))

	// Add the complete sentence with *
	fullSentence := fmt.Sprintf("%s %s %s*", name, category, productType)
	pipe.ZAdd(ctx, "autocomplete", redis.Z{Score: 0, Member: fullSentence})
	pipe.SAdd(ctx, "search:"+fullSentence, productID)

	// Generate all combinations as specified
	combinations := []string{
		// Name prefixes
		name[:1], name[:2], name,
		// Name + category prefixes
		name + " " + category[:1], name + " " + category,
		// Name + category + type
		name + " " + category + " " + productType,
		// Category prefixes
		category[:1], category,
		// Category + type prefixes
		category + " " + productType[:1], category + " " + productType,
		// Category + type + name prefixes
		category + " " + productType + " " + name[:1],
		category + " " + productType + " " + name[:2],
		category + " " + productType + " " + name,
		// Type prefixes
		productType[:1], productType,
		// Type + name prefixes
		productType + " " + name[:1], productType + " " + name[:2], productType + " " + name,
		// Type + name + category prefixes
		productType + " " + name + " " + category[:1], productType + " " + name + " " + category,
		// Type + category prefixes
		productType + " " + category[:1], productType + " " + category,
		// Type + category + name prefixes
		productType + " " + category + " " + name[:1],
		productType + " " + category + " " + name[:2],
		productType + " " + category + " " + name,
	}

	// Add all valid combinations
	for _, combo := range combinations {
		if len(combo) > 0 && !strings.Contains(combo, "[:]") {
			pipe.ZAdd(ctx, "autocomplete", redis.Z{Score: 0, Member: combo})
			pipe.SAdd(ctx, "search:"+combo, productID)
		}
	}

	_, err := pipe.Exec(ctx)
	if err != nil {
		return fmt.Errorf("redis pipeline execution failed: %w", err)
	}

	return nil
}



func (server *Server) CreateProduct(ctx context.Context, req *pb.CreateProductRequest) (*pb.ProductResponse, error) {
	if err := util.ValidateCreateProductInput(req); err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid product details: %v", err)
	}

	token, err := server.AuthInterceptor(ctx)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "error in auth token: %v", err)
	}

	productParams := db.CreateProductParams{
		Name:        req.GetName(),
		Description: req.GetDescription(),
		Price:       fmt.Sprintf("%.2f", req.Price),
		CreatedBy:   uuid.NullUUID{UUID: token.ID, Valid: true},
		Stock:       req.GetStock(),
		ProductUrl:  req.GetProductUrl(),
		Category:    strings.ToLower(req.GetCategory()),
		Type:        strings.ToLower(req.GetType()),
	}

	product, err := server.store.CreateProduct(ctx, productParams)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create product: %v", err)
	}

	// Save to Redis for advanced autocomplete
	if server.redis != nil {
		// Cache the product data
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
		server.redis.Expire(ctx, "product:"+product.ID.String(), time.Hour*24)

		// Index product for autocomplete
		if err := IndexProduct(int64(product.ID.ID()), product.Name, product.Category, product.Type); err != nil {
			log.Printf("Failed to index product: %v", err)
		}
	}



	resp := &pb.ProductResponse{
		Product: &pb.Product{
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
		},
	}

	return resp, nil
}

func (server *Server) GetProductByID(ctx context.Context, req *pb.GetProductRequest) (*pb.ProductResponse, error) {
	if req.GetId() == "" {
		return nil, status.Errorf(codes.InvalidArgument, "product ID is required")
	}

	token, err := server.AuthInterceptor(ctx)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "Error in Auth Token: %v", err)
	}

	productID, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid product ID format")
	}

	product, err := server.store.GetProductByID(ctx, productID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Errorf(codes.NotFound, "product not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to fetch product: %v", err)
	}

	if product.CreatedBy.UUID != token.ID {
		return nil, status.Errorf(codes.InvalidArgument, "Wrong User")
	}

	resp := &pb.ProductResponse{
		Product: &pb.Product{
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
		},
	}

	return resp, nil
}

func (server *Server) UpdateProduct(ctx context.Context, req *pb.UpdateProductRequest) (*pb.ProductResponse, error) {
	token, err := server.AuthInterceptor(ctx)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "Error in Auth Token: %v", err)
	}

	productID, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid product ID format")
	}

	product, err := server.store.GetProductByID(ctx, productID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Errorf(codes.NotFound, "product not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to fetch product: %v", err)
	}

	if err := util.ValidateUpdateProductInput(req); err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid input: %v", err)
	}

	if product.CreatedBy.UUID != token.ID {
		return nil, status.Errorf(codes.InvalidArgument, "Only Product Creator can change product data")
	}

	updateParams := db.UpdateProductParams{
		ID:          productID,
		Name:        req.GetName(),
		Description: req.GetDescription(),
		Price:       fmt.Sprintf("%.2f", req.GetPrice()),
		Stock:       req.GetStock(),
		ProductUrl:  req.GetProductUrl(),
		Category:    strings.ToLower(req.GetCategory()),
		Type:        strings.ToLower(req.GetType()),
	}

	updatedProduct, err := server.store.UpdateProduct(ctx, updateParams)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update product: %v", err)
	}



	resp := &pb.ProductResponse{
		Product: &pb.Product{
			Id:          updatedProduct.ID.String(),
			Name:        updatedProduct.Name,
			Description: updatedProduct.Description,
			Price:       parseFloat(updatedProduct.Price),
			CreatedBy:   product.CreatedBy.UUID.String(),
			CreatedAt:   product.CreatedAt.Time.Format("2006-01-02 15:04:05"),
			ProductUrl:  updatedProduct.ProductUrl,
			Category:    updatedProduct.Category,
			Type:        updatedProduct.Type,
			Stock:       updatedProduct.Stock,
		},
	}

	return resp, nil
}

func (server *Server) ListProducts(ctx context.Context, req *pb.ListAllProductsRequest) (*pb.ListProductsResponse, error) {
	limit := req.GetLimit()
	if limit <= 0 {
		limit = 10
	}

	offset := req.GetOffset()
	if offset < 0 {
		offset = 0
	}

	products, err := server.store.GetAllProducts(ctx, db.GetAllProductsParams{
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list products: %v", err)
	}

	productResponses := []*pb.Product{}
	for _, product := range products {
		productResponses = append(productResponses, &pb.Product{
			Id:          product.ID.String(),
			Name:        product.Name,
			ProductUrl:  product.ProductUrl,
			Category:    product.Category,
			Type:        product.Type,
			Description: product.Description,
			Price:       parseFloat(product.Price),
			CreatedBy:   product.CreatedBy.UUID.String(),
			CreatedAt:   product.CreatedAt.Time.Format("2006-01-02 15:04:05"),
			Stock:       product.Stock,
		})
	}

	resp := &pb.ListProductsResponse{
		Products: productResponses,
	}

	return resp, nil
}

func (server *Server) ListProductsByName(ctx context.Context, req *pb.ListAllProductsByNameRequest) (*pb.ListAllProductsByNameResponse, error) {
	if len(strings.TrimSpace(req.GetName())) < 1 {
		return &pb.ListAllProductsByNameResponse{Products: []*pb.Product{}}, nil
	}
	// Use partial matching - try exact match first, then LIKE pattern
	query := strings.TrimSpace(req.GetName())
	log.Printf("Searching for products with name: '%s'", query)
	
	// First try exact match
	products, err := server.store.GetProductByName(ctx, query)
	if err != nil || len(products) == 0 {
		// Try with LIKE pattern
		searchPattern := "%" + strings.ToLower(query) + "%"
		log.Printf("Trying LIKE pattern: '%s'", searchPattern)
		products, err = server.store.GetProductByName(ctx, searchPattern)
	}
	
	log.Printf("Found %d products", len(products))
	
	// If still no results, get some recent products as fallback
	if err != nil || len(products) == 0 {
		log.Println("No products found, getting recent products as fallback")
		allProducts, fallbackErr := server.store.GetAllProducts(ctx, db.GetAllProductsParams{
			Limit:  5,
			Offset: 0,
		})
		if fallbackErr == nil {
			products = []db.Product{}
			for _, p := range allProducts {
				products = append(products, db.Product{
					ID:          p.ID,
					Name:        p.Name,
					Description: p.Description,
					Price:       p.Price,
					CreatedBy:   p.CreatedBy,
					CreatedAt:   p.CreatedAt,
					ProductUrl:  p.ProductUrl,
					Category:    p.Category,
					Type:        p.Type,
					Stock:       p.Stock,
				})
			}
		}
	}

	productResponses := []*pb.Product{}
	for _, product := range products {
		productResponses = append(productResponses, &pb.Product{
			Id:          product.ID.String(),
			Name:        product.Name,
			Description: product.Description,
			Price:       parseFloat(product.Price),
			CreatedBy:   product.CreatedBy.UUID.String(),
			ProductUrl:  product.ProductUrl,
			Category:    product.Category,
			Type:        product.Type,
			CreatedAt:   product.CreatedAt.Time.Format("2006-01-02 15:04:05"),
			Stock:       product.Stock,
		})
	}

	resp := &pb.ListAllProductsByNameResponse{
		Products: productResponses,
	}

	return resp, nil
}

func (server *Server) GetProductByUserID(ctx context.Context, req *pb.ListAllProductsByCreateBy) (*pb.ListAllProductsByNameResponse, error) {
	token, err := server.AuthInterceptor(ctx)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "Error in Auth Token: %v", err)
	}
	products, err := server.store.GetProductByUserID(ctx, uuid.NullUUID{UUID: token.ID, Valid: true})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to grt products: %v", err)
	}

	productResponses := []*pb.Product{}
	for _, product := range products {
		productResponses = append(productResponses, &pb.Product{
			Id:          product.ID.String(),
			Name:        product.Name,
			Description: product.Description,
			Price:       parseFloat(product.Price),
			CreatedBy:   product.CreatedBy.UUID.String(),
			ProductUrl:  product.ProductUrl,
			Category:    product.Category,
			Type:        product.Type,
			CreatedAt:   product.CreatedAt.Time.Format("2006-01-02 15:04:05"),
			Stock:       product.Stock,
		})
	}

	resp := &pb.ListAllProductsByNameResponse{
		Products: productResponses,
	}

	return resp, nil
}

func (server *Server) GetOnlyProductRequest(ctx context.Context, req *pb.GetProductRequest) (*pb.ProductResponse, error) {
	if req.GetId() == "" {
		return nil, status.Errorf(codes.InvalidArgument, "product ID is required")
	}

	productID, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid product ID format")
	}

	product, err := server.store.GetProductByID(ctx, productID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Errorf(codes.NotFound, "product not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to fetch product: %v", err)
	}

	resp := &pb.ProductResponse{
		Product: &pb.Product{
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
		},
	}

	return resp, nil
}

func (server *Server) ListProductsByCategory(ctx context.Context, req *pb.ListAllProductsByCategoryRequest) (*pb.ListAllProductsByCategoryResponse, error) {

	products, err := server.store.ListProductsByCategory(ctx, strings.ToLower(req.GetCategory()))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list products: %v", err)
	}

	productResponses := []*pb.Product{}

	for _, product := range products {
		productResponses = append(productResponses, &pb.Product{
			Id:          product.ID.String(),
			Name:        product.Name,
			Description: product.Description,
			Price:       parseFloat(product.Price),
			CreatedBy:   product.CreatedBy.UUID.String(),
			ProductUrl:  product.ProductUrl,
			Category:    product.Category,
			Type:        product.Type,
			CreatedAt:   product.CreatedAt.Time.Format("2006-01-02 15:04:05"),
			Stock:       product.Stock,
		})
	}

	resp := &pb.ListAllProductsByCategoryResponse{
		Products: productResponses,
	}

	return resp, nil
}

func (server *Server) ListProductsByType(ctx context.Context, req *pb.ListAllProductsByTypeRequest) (*pb.ListAllProductsByCategoryResponse, error) {

	data := db.ListProductsByTypeParams{
		Category: strings.ToLower(req.GetCategory()),
		Type:     strings.ToLower(req.GetType()),
	}

	products, err := server.store.ListProductsByType(ctx, data)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list products: %v", err)
	}

	productResponses := []*pb.Product{}

	for _, product := range products {
		productResponses = append(productResponses, &pb.Product{
			Id:          product.ID.String(),
			Name:        product.Name,
			Description: product.Description,
			Price:       parseFloat(product.Price),
			CreatedBy:   product.CreatedBy.UUID.String(),
			ProductUrl:  product.ProductUrl,
			Category:    product.Category,
			Type:        product.Type,
			CreatedAt:   product.CreatedAt.Time.Format("2006-01-02 15:04:05"),
			Stock:       product.Stock,
		})
	}

	resp := &pb.ListAllProductsByCategoryResponse{
		Products: productResponses,
	}

	return resp, nil
}

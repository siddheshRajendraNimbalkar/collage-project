package gapi

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"strconv"
	"strings"

	"github.com/google/uuid"
	db "github.com/siddheshRajendraNimbalkar/collage-prject-backend/db/sqlc"
	redisClient "github.com/siddheshRajendraNimbalkar/collage-prject-backend/internal/redis"
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





func (server *Server) CreateProduct(ctx context.Context, req *pb.CreateProductRequest) (*pb.ProductResponse, error) {
	if err := util.ValidateCreateProductInput(req); err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid product details: %v", err)
	}

	token, err := server.AuthInterceptor(ctx)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "error in auth token: %v", err)
	}

	// Verify user exists before creating product
	_, err = server.store.GetUserByID(ctx, token.ID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to verify user: %v", err)
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

	// Save to Redis for advanced autocomplete AFTER successful DB commit
	log.Printf("Attempting to index product: ID=%s, Name=%s, Category=%s, Type=%s", product.ID.String(), product.Name, product.Category, product.Type)
	if err := redisClient.IndexProduct(product.ID.String(), product.Name, product.Category, product.Type, product.ProductUrl); err != nil {
		log.Printf("CRITICAL: Failed to index product in Redis: %v", err)
		// Don't fail the request, but log the error prominently
	} else {
		log.Printf("SUCCESS: Indexed product in Redis: %s", product.Name)
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

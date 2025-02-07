package gapi

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"

	"github.com/google/uuid"
	db "github.com/siddheshRajendraNimbalkar/collage-prject-backend/db/sqlc"
	"github.com/siddheshRajendraNimbalkar/collage-prject-backend/pb"
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

	if req.Name == "" || req.Price <= 0 || req.GetCreatedBy() == "" || req.GetStock() < 0 {
		return nil, status.Errorf(codes.InvalidArgument, "invalid product details")
	}

	productParams := db.CreateProductParams{
		Name:        req.GetName(),
		Description: sql.NullString{String: req.GetDescription(), Valid: req.GetDescription() != ""},
		Price:       fmt.Sprintf("%.2f", req.Price),
		CreatedBy:   uuid.NullUUID{UUID: uuid.Must(uuid.Parse(req.GetCreatedBy())), Valid: req.GetCreatedBy() != ""},
		Stock:       req.GetStock(),
	}

	product, err := server.store.CreateProduct(ctx, productParams)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create product: %v", err)
	}

	resp := &pb.ProductResponse{
		Product: &pb.Product{
			Id:          product.ID.String(),
			Name:        product.Name,
			Description: product.Description.String,
			Price:       parseFloat(product.Price),
			CreatedBy:   product.CreatedBy.UUID.String(),
			CreatedAt:   product.CreatedAt.Time.Format("2006-01-02 15:04:05"),
		},
	}

	return resp, nil
}

func (server *Server) GetProductByID(ctx context.Context, req *pb.GetProductRequest) (*pb.ProductResponse, error) {
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

	// Construct response
	resp := &pb.ProductResponse{
		Product: &pb.Product{
			Id:          product.ID.String(),
			Name:        product.Name,
			Description: product.Description.String,
			Price:       parseFloat(product.Price),
			CreatedBy:   product.CreatedBy.UUID.String(),
			CreatedAt:   product.CreatedAt.Time.Format("2006-01-02 15:04:05"),
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
			Description: product.Description.String,
			Price:       parseFloat(product.Price),
			CreatedBy:   product.CreatedBy.UUID.String(),
			CreatedAt:   product.CreatedAt.Time.Format("2006-01-02 15:04:05"),
		})
	}

	resp := &pb.ListProductsResponse{
		Products: productResponses,
	}

	return resp, nil
}

func (server *Server) UpdateProduct(ctx context.Context, req *pb.UpdateProductRequest) (*pb.ProductResponse, error) {
	if req.GetId() == "" {
		return nil, status.Errorf(codes.InvalidArgument, "product ID is required")
	}

	productID, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid product ID format")
	}

	existingProduct, err := server.store.GetProductByID(ctx, productID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Errorf(codes.NotFound, "product not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to fetch product: %v", err)
	}

	updateParams := db.UpdateProductParams{
		ID:          productID,
		Name:        req.GetName(),
		Description: sql.NullString{String: req.GetDescription(), Valid: req.GetDescription() != ""},
		Price:       fmt.Sprintf("%.2f", req.GetPrice()),
		Stock:       req.GetStock(),
	}

	updatedProduct, err := server.store.UpdateProduct(ctx, updateParams)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update product: %v", err)
	}

	resp := &pb.ProductResponse{
		Product: &pb.Product{
			Id:          updatedProduct.ID.String(),
			Name:        updatedProduct.Name,
			Description: updatedProduct.Description.String,
			Price:       parseFloat(updatedProduct.Price),
			CreatedBy:   existingProduct.CreatedBy.UUID.String(),
			CreatedAt:   existingProduct.CreatedAt.Time.Format("2006-01-02 15:04:05"),
		},
	}

	return resp, nil
}

func (server *Server) DeleteProduct(ctx context.Context, req *pb.DeleteProductRequest) (*pb.DeleteProductResponse, error) {
	if req.GetId() == "" {
		return nil, status.Errorf(codes.InvalidArgument, "product ID is required")
	}

	productID, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid product ID format")
	}

	err = server.store.DeleteProduct(ctx, productID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Errorf(codes.NotFound, "product not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to delete product: %v", err)
	}

	return &pb.DeleteProductResponse{Message: "true"}, nil
}

func (server *Server) ListProductsByName(ctx context.Context, req *pb.ListAllProductsByNameRequest) (*pb.ListAllProductsByNameResponse, error) {
	if req.GetName() == "" {
		return nil, status.Errorf(codes.InvalidArgument, "product name is required")
	}
	products, err := server.store.GetProductByName(ctx, req.GetName())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list products: %v", err)
	}

	productResponses := []*pb.Product{}
	for _, product := range products {
		productResponses = append(productResponses, &pb.Product{
			Id:          product.ID.String(),
			Name:        product.Name,
			Description: product.Description.String,
			Price:       parseFloat(product.Price),
			CreatedBy:   product.CreatedBy.UUID.String(),
			CreatedAt:   product.CreatedAt.Time.Format("2006-01-02 15:04:05"),
		})
	}

	resp := &pb.ListAllProductsByNameResponse{
		Products: productResponses,
	}

	return resp, nil
}

package gapi

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
	"strings"

	"github.com/google/uuid"
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

func (server *Server) CreateProduct(ctx context.Context, req *pb.CreateProductRequest) (*pb.ProductResponse, error) {

	if err := util.ValidateCreateProductInput(req); err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid product details: %v", err)
	}

	token, err := server.AuthInterceptor(ctx)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "Error in Auth Token: %v", err)
	}

	productParams := db.CreateProductParams{
		Name:        req.GetName(),
		Description: req.GetDescription(),
		Price:       fmt.Sprintf("%.2f", req.Price),
		CreatedBy:   uuid.NullUUID{UUID: token.ID, Valid: true},
		Stock:       req.GetStock(),
		ProductUrl:  req.GetProductUrl(),
		Category:    req.GetCategory(),
		Type:        req.GetType(),
	}

	product, err := server.store.CreateProduct(ctx, productParams)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create product: %v", err)
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
		},
	}

	return resp, nil
}

func (server *Server) UpdateProduct(ctx context.Context, req *pb.UpdateProductRequest) (*pb.ProductResponse, error) {
	if err := util.ValidateUpdateProductInput(req); err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid input: %v", err)
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
		Description: req.GetDescription(),
		Price:       fmt.Sprintf("%.2f", req.GetPrice()),
		Stock:       req.GetStock(),
		ProductUrl:  req.GetProductUrl(),
		Category:    req.GetCategory(),
		Type:        req.GetType(),
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
			CreatedBy:   existingProduct.CreatedBy.UUID.String(),
			CreatedAt:   existingProduct.CreatedAt.Time.Format("2006-01-02 15:04:05"),
			ProductUrl:  updatedProduct.ProductUrl,
			Category:    updatedProduct.Category,
			Type:        updatedProduct.Type,
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
		})
	}

	resp := &pb.ListProductsResponse{
		Products: productResponses,
	}

	return resp, nil
}

func (server *Server) ListProductsByName(ctx context.Context, req *pb.ListAllProductsByNameRequest) (*pb.ListAllProductsByNameResponse, error) {
	if len(strings.TrimSpace(req.GetName())) >= 2 {
		return nil, status.Errorf(codes.InvalidArgument, "product name at list contain 3 char")
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
			Description: product.Description,
			Price:       parseFloat(product.Price),
			CreatedBy:   product.CreatedBy.UUID.String(),
			ProductUrl:  product.ProductUrl,
			Category:    product.Category,
			Type:        product.Type,
			CreatedAt:   product.CreatedAt.Time.Format("2006-01-02 15:04:05"),
		})
	}

	resp := &pb.ListAllProductsByNameResponse{
		Products: productResponses,
	}

	return resp, nil
}

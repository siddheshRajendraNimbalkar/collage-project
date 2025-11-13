package gapi

import (
	"context"
	"database/sql"
	"log"

	"github.com/google/uuid"
	redisClient "github.com/siddheshRajendraNimbalkar/collage-prject-backend/internal/redis"
	"github.com/siddheshRajendraNimbalkar/collage-prject-backend/pb"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (server *Server) DeleteProduct(ctx context.Context, req *pb.DeleteProductRequest) (*pb.DeleteProductResponse, error) {
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
		return nil, status.Errorf(codes.PermissionDenied, "Only product creator can delete this product")
	}

	err = server.store.DeleteProduct(ctx, productID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to delete product: %v", err)
	}

	// Remove from Redis autocomplete index
	log.Printf("Attempting to remove product %s from Redis autocomplete", product.ID.String())
	if err := redisClient.RemoveProduct(product.ID.String()); err != nil {
		log.Printf("FAILED to remove product from Redis: %v", err)
	} else {
		log.Printf("SUCCESS: Removed product %s from Redis autocomplete", product.ID.String())
	}

	resp := &pb.DeleteProductResponse{
		Message: "Product deleted successfully",
	}

	return resp, nil
}
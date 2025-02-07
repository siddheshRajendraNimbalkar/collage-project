package gapi

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	db "github.com/siddheshRajendraNimbalkar/collage-prject-backend/db/sqlc"
	"github.com/siddheshRajendraNimbalkar/collage-prject-backend/pb"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (server *Server) AddToCart(ctx context.Context, req *pb.AddToCartRequest) (*pb.CartResponse, error) {
	// Validate request
	if req.GetUserId() == "" || req.GetProductId() == "" || req.GetQuantity() <= 0 {
		return nil, status.Errorf(codes.InvalidArgument, "invalid cart details")
	}

	// Convert UUIDs
	userID, err := uuid.Parse(req.GetUserId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user ID format")
	}
	productID, err := uuid.Parse(req.GetProductId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid product ID format")
	}

	// Fetch product details
	product, err := server.store.GetProductByID(ctx, productID)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "product not found")
	}

	// Check stock availability
	if product.Stock < req.GetQuantity() {
		return nil, status.Errorf(codes.FailedPrecondition, "insufficient stock")
	}

	// Create cart item
	cartParams := db.AddToCartParams{
		UserID:    uuid.NullUUID{UUID: userID, Valid: true},
		ProductID: uuid.NullUUID{UUID: productID, Valid: true},
		Quantity:  req.GetQuantity(),
	}
	_, err = server.store.AddToCart(ctx, cartParams)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to add item to cart: %v", err)
	}

	return &pb.CartResponse{Message: "Item added to cart successfully"}, nil
}

func (server *Server) GetCartByUser(ctx context.Context, req *pb.GetCartRequest) (*pb.CartListResponse, error) {
	// Validate request
	if req.GetUserId() == "" {
		return nil, status.Errorf(codes.InvalidArgument, "user ID is required")
	}

	// Convert UUID
	userID, err := uuid.Parse(req.GetUserId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user ID format")
	}

	// Fetch cart items
	cartItems, err := server.store.GetCartByUserID(ctx, uuid.NullUUID{UUID: userID, Valid: true})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to fetch cart items")
	}

	// Convert to protobuf response
	var pbCartItems []*pb.CartItem
	for _, item := range cartItems {
		pbCartItems = append(pbCartItems, &pb.CartItem{
			Id:        item.ID.String(),
			UserId:    item.UserID.UUID.String(),
			ProductId: item.ProductID.UUID.String(),
			Quantity:  item.Quantity,
			CreatedAt: item.CreatedAt.Time.Format("2006-01-02 15:04:05"),
		})
	}

	return &pb.CartListResponse{Items: pbCartItems}, nil
}

func (server *Server) UpdateCartQuantity(ctx context.Context, req *pb.UpdateCartQuantityRequest) (*pb.CartResponse, error) {
	// Validate request
	if req.GetUserId() == "" || req.GetProductId() == "" || req.GetQuantity() <= 0 {
		return nil, status.Errorf(codes.InvalidArgument, "invalid cart details")
	}

	// Convert UUIDs
	userID, err := uuid.Parse(req.GetUserId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user ID format")
	}
	productID, err := uuid.Parse(req.GetProductId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid product ID format")
	}

	// Check if the cart item exists
	myCart, err := server.store.GetCartItem(ctx, db.GetCartItemParams{
		UserID:    uuid.NullUUID{UUID: userID, Valid: true},
		ProductID: uuid.NullUUID{UUID: productID, Valid: true},
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Errorf(codes.NotFound, "cart item not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to fetch cart item")
	}

	// Fetch product details
	product, err := server.store.GetProductByID(ctx, productID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Errorf(codes.NotFound, "product not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to fetch product details")
	}

	// Check stock availability
	if product.Stock < req.GetQuantity() {
		return nil, status.Errorf(codes.FailedPrecondition, "insufficient stock")
	}

	// Update cart quantity
	_, err = server.store.UpdateCartQuantity(ctx, db.UpdateCartQuantityParams{
		ID:       myCart.ID,
		Quantity: req.GetQuantity(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update cart quantity")
	}

	return &pb.CartResponse{Message: "Cart quantity updated successfully"}, nil
}

func (server *Server) RemoveFromCart(ctx context.Context, req *pb.RemoveFromCartRequest) (*pb.CartResponse, error) {
	// Validate request
	if req.GetUserId() == "" || req.GetProductId() == "" {
		return nil, status.Errorf(codes.InvalidArgument, "invalid cart details")
	}

	// Convert UUIDs
	userID, err := uuid.Parse(req.GetUserId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user ID format")
	}
	productID, err := uuid.Parse(req.GetProductId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid product ID format")
	}

	// Check if cart item exists
	myCart, err := server.store.GetCartItem(ctx, db.GetCartItemParams{
		UserID:    uuid.NullUUID{UUID: userID, Valid: true},
		ProductID: uuid.NullUUID{UUID: productID, Valid: true},
	})
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "cart item not found")
	}

	// Remove item from cart
	err = server.store.DeleteCartItem(ctx, myCart.ID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to remove cart item")
	}

	return &pb.CartResponse{Message: "Cart item removed successfully"}, nil
}

func (server *Server) ClearCart(ctx context.Context, req *pb.ClearCartRequest) (*pb.CartResponse, error) {
	// Validate request
	if req.GetUserId() == "" {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user ID")
	}

	// Convert UUID
	userID, err := uuid.Parse(req.GetUserId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user ID format")
	}

	// Clear all items in the cart for the user
	err = server.store.ClearCartByUserID(ctx, uuid.NullUUID{UUID: userID, Valid: true})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to clear cart")
	}

	return &pb.CartResponse{Message: "Cart cleared successfully"}, nil
}

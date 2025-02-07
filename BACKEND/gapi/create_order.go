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

func (server *Server) CreateOrder(ctx context.Context, req *pb.CreateOrderRequest) (*pb.OrderResponse, error) {
	result, err := server.store.OrderTx(ctx, req)
	if err != nil {
		if err.Error() == "user not found" || err.Error() == "product not found" {
			return nil, status.Errorf(codes.Internal, "%v", err)
		}
		if err.Error() == "insufficient stock" {
			return nil, status.Errorf(codes.FailedPrecondition, "%v", err)
		}
		return nil, status.Errorf(codes.Internal, "failed to create order: %v", err)
	}
	return result, nil
}

func (server *Server) GetOrderByID(ctx context.Context, req *pb.GetOrderRequest) (*pb.OrderResponse, error) {
	if req.GetId() == "" {
		return nil, status.Errorf(codes.InvalidArgument, "order ID is required")
	}

	orderID, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid order ID format")
	}

	order, err := server.store.GetOrderByID(ctx, orderID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Errorf(codes.NotFound, "order not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to fetch order: %v", err)
	}

	resp := &pb.OrderResponse{
		Order: &pb.Order{
			Id:         order.ID.String(),
			UserId:     order.UserID.UUID.String(),
			ProductId:  order.ProductID.UUID.String(),
			TotalPrice: parseFloat(order.TotalPrice),
			Status:     order.Status.String,
			CreatedAt:  order.CreatedAt.Time.Format("2006-01-02 15:04:05"),
		},
	}

	return resp, nil
}

// ListOrders - Retrieves all orders with pagination
func (server *Server) ListOrders(ctx context.Context, req *pb.ListOrdersByUserRequest) (*pb.ListOrdersResponse, error) {
	if req.UserId == "" {
		return nil, status.Errorf(codes.InvalidArgument, "order ID is required")
	}

	userID, err := uuid.Parse(req.GetUserId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user ID format")
	}
	orders, err := server.store.GetOrdersByUser(ctx, uuid.NullUUID{UUID: userID, Valid: true})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list orders: %v", err)
	}

	orderResponses := []*pb.Order{}
	for _, order := range orders {
		orderResponses = append(orderResponses, &pb.Order{
			Id:         order.ID.String(),
			UserId:     order.UserID.UUID.String(),
			ProductId:  order.ProductID.UUID.String(),
			TotalPrice: parseFloat(order.TotalPrice),
			Status:     order.Status.String,
			CreatedAt:  order.CreatedAt.Time.Format("2006-01-02 15:04:05"),
		})
	}

	return &pb.ListOrdersResponse{Orders: orderResponses}, nil
}

// UpdateOrderStatus - Updates the status of an order
func (server *Server) UpdateOrderStatus(ctx context.Context, req *pb.UpdateOrderStatusRequest) (*pb.OrderResponse, error) {
	if req.GetId() == "" || req.GetStatus() == "" {
		return nil, status.Errorf(codes.InvalidArgument, "order ID and status are required")
	}

	orderID, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid order ID format")
	}

	order, err := server.store.UpdateOrderStatus(ctx, db.UpdateOrderStatusParams{
		ID:     orderID,
		Status: sql.NullString{String: req.GetStatus(), Valid: true},
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update order status: %v", err)
	}

	resp := &pb.OrderResponse{
		Order: &pb.Order{
			Id:         order.ID.String(),
			UserId:     order.UserID.UUID.String(),
			ProductId:  order.ProductID.UUID.String(),
			TotalPrice: parseFloat(order.TotalPrice),
			Status:     order.Status.String,
			CreatedAt:  order.CreatedAt.Time.Format("2006-01-02 15:04:05"),
		},
	}

	return resp, nil
}

// DeleteOrder - Deletes an order
func (server *Server) DeleteOrder(ctx context.Context, req *pb.DeleteOrderRequest) (*pb.DeleteOrderResponse, error) {
	if req.GetId() == "" {
		return nil, status.Errorf(codes.InvalidArgument, "order ID is required")
	}

	orderID, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid order ID format")
	}

	err = server.store.CancelOrder(ctx, orderID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Errorf(codes.NotFound, "order not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to delete order: %v", err)
	}

	return &pb.DeleteOrderResponse{Message: "order deleteted successfuly"}, nil
}

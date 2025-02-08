package db

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"

	"github.com/google/uuid"
	"github.com/siddheshRajendraNimbalkar/collage-prject-backend/pb"
)

type SQLStore struct {
	*Queries
	db *sql.DB
}

func NewStore(db *sql.DB) *SQLStore {
	return &SQLStore{
		Queries: New(db),
		db:      db,
	}
}

func (store *SQLStore) execTx(ctx context.Context, fn func(*Queries) error) error {
	tx, err := store.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	q := New(tx)

	err = fn(q)
	if err != nil {
		rbErr := tx.Rollback()
		if rbErr != nil {
			return fmt.Errorf("tx err: %v, rb err: %v", err, rbErr)
		}
		return err
	}
	return tx.Commit()
}

var txKey = struct{}{}

func (store *SQLStore) OrderTx(ctx context.Context, arg *pb.CreateOrderRequest) (*pb.OrderResponse, error) {
	var result *pb.OrderResponse

	err := store.execTx(ctx, func(q *Queries) error {
		var err error
		txName := ctx.Value(txKey)
		fmt.Println(txName, "Start Order Process")

		// Validate input
		if arg.GetUserId() == "" || arg.GetProductId() == "" {
			return fmt.Errorf("invalid order details")
		}

		userID, err := uuid.Parse(arg.GetUserId())
		if err != nil {
			return fmt.Errorf("invalid user ID format: %v", err)
		}

		user, err := q.GetUserByID(ctx, userID)
		if err != nil {
			return fmt.Errorf("user not found: %v", err)
		}

		productID, err := uuid.Parse(arg.GetProductId())
		if err != nil {
			return fmt.Errorf("invalid product ID format: %v", err)
		}

		product, err := q.GetProductByID(ctx, productID)
		if err != nil {
			return fmt.Errorf("product not found: %v", err)
		}

		if product.Stock < arg.GetQuantity() {
			return fmt.Errorf("insufficient stock")
		}

		// Convert product.Price (string) to float
		productPrice, err := strconv.ParseFloat(product.Price, 32)
		if err != nil {
			return fmt.Errorf("invalid price format: %v", err)
		}

		// Calculate total price
		totalPrice := float32(productPrice) * float32(arg.GetQuantity())
		totalPriceStr := fmt.Sprintf("%.2f", totalPrice)
		// Create Order
		orderParams := CreateOrderParams{
			UserID:     uuid.NullUUID{UUID: user.ID, Valid: true},
			ProductID:  uuid.NullUUID{UUID: product.ID, Valid: true},
			Quantity:   arg.GetQuantity(),
			TotalPrice: totalPriceStr, // Fixed
		}

		order, err := q.CreateOrder(ctx, orderParams)
		if err != nil {
			return fmt.Errorf("error creating order: %v", err)
		}

		// Update Stock
		err = q.UpdateProductStock(ctx, UpdateProductStockParams{
			ID:    product.ID,
			Stock: product.Stock - order.Quantity,
		})
		if err != nil {
			return fmt.Errorf("failed to update stock: %v", err)
		}

		// Build Response
		resp := &pb.OrderResponse{
			Order: &pb.Order{
				Id:         order.ID.String(),
				UserId:     order.UserID.UUID.String(),
				ProductId:  order.ProductID.UUID.String(),
				TotalPrice: float64(totalPrice),
				Status:     order.Status.String,
				CreatedAt:  order.CreatedAt.Time.Format("2006-01-02 15:04:05"),
				Quantity:   order.Quantity,
			},
		}

		result = resp
		return nil
	})

	if err != nil {
		return nil, err
	}

	return result, nil
}

func (store *SQLStore) DeleteOrderTx(ctx context.Context, arg *pb.DeleteOrderRequest) (*pb.DeleteOrderResponse, error) {
	var result = &pb.DeleteOrderResponse{}

	err := store.execTx(ctx, func(q *Queries) error {
		if arg.GetId() == "" {
			return fmt.Errorf("order ID is required")
		}

		orderID, err := uuid.Parse(arg.GetId())
		if err != nil {
			return fmt.Errorf("invalid order ID format: %v", err)
		}

		orderData, err := q.CancelOrder(ctx, orderID)
		if err != nil {
			if err == sql.ErrNoRows {
				return fmt.Errorf("order not found")
			}
			return fmt.Errorf("failed to delete order: %v", err)
		}

		if !orderData.ProductID.Valid {
			return fmt.Errorf("invalid product ID for order")
		}

		getProduct, err := q.GetProductByID(ctx, orderData.ProductID.UUID)
		if err != nil {
			return fmt.Errorf("failed to get product: %v", err)
		}

		changeProd := UpdateProductStockParams{
			ID:    orderData.ProductID.UUID,
			Stock: orderData.Quantity + getProduct.Stock,
		}

		if err := q.UpdateProductStock(ctx, changeProd); err != nil {
			return fmt.Errorf("failed to update product stock: %v", err)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	result.Message = "order deleted successfully"
	return result, nil
}

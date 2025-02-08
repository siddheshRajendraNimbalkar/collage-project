-- name: CreateOrder :one
INSERT INTO orders (user_id, product_id, quantity, total_price, status)
VALUES ($1, $2, $3, $4, 'pending')
RETURNING *;

-- name: GetOrderByID :one
SELECT * FROM orders WHERE id = $1;

-- name: GetOrdersByUser :many
SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC;

-- name: UpdateOrderStatus :one
UPDATE orders
SET status = $2
WHERE id = $1
RETURNING *;

-- name: CancelOrder :one
UPDATE orders
SET status = 'cancelled'
WHERE id = $1
RETURNING *;

-- name: AddToCart :one
INSERT INTO cart (user_id, product_id, quantity)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetCartByUserID :many
SELECT * FROM cart WHERE user_id = $1;

-- name: GetCartByID :one
SELECT * FROM cart WHERE id = $1;

-- name: UpdateCartQuantity :one
UPDATE cart
SET quantity = $2
WHERE id = $1
RETURNING *;

-- name: DeleteCartItem :exec
DELETE FROM cart WHERE id = $1;

-- name: ClearCartByUserID :exec
DELETE FROM cart WHERE user_id = $1;

-- name: GetCartItem :one
SELECT * FROM cart WHERE user_id = $1 AND product_id = $2;
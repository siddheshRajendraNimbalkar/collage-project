-- name: AddToCart :exec
INSERT INTO cart (user_id, product_id, quantity)
VALUES ($1, $2, $3);

-- name: GetCartByUser :many
SELECT * FROM cart WHERE user_id = $1;

-- name: UpdateCartQuantity :exec
UPDATE cart
SET quantity = $3
WHERE user_id = $1 AND product_id = $2;


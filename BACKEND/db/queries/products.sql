-- name: CreateProduct :one
INSERT INTO products (name, description, price, stock, product_url, category, type, created_by)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: GetProductByID :one
SELECT * FROM products WHERE id = $1;

-- name: GetProductByUserID :many
SELECT * FROM products WHERE created_by = $1;

-- name: GetProductByName :many
SELECT * FROM products WHERE name = $1;

-- name: GetAllProducts :many
SELECT * FROM products
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateProduct :one
UPDATE products
SET 
    name = $2,
    description = $3,
    price = $4,
    stock = $5,
    product_url = $6,
    category = $7,
    type = $8
WHERE id = $1
RETURNING *;

-- name: UpdateProductStock :exec
UPDATE products
SET stock = $2
WHERE id = $1;

-- name: DeleteProduct :exec
DELETE FROM products WHERE id = $1;

-- name: ListProductsByCategory :many
SELECT * FROM products WHERE category = $1
ORDER BY created_at DESC;

-- name: ListProductsByType :many
SELECT * FROM products WHERE type = $1 AND category = $2
ORDER BY created_at DESC;
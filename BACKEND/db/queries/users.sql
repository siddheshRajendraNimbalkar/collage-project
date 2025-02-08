-- name: CreateUser :one
INSERT INTO users (name, email, password_hash, role, organization_name, user_image)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: UpdateUser :one
UPDATE users
SET name = $2, email = $3, password_hash = $4, role = $5, organization_name = $6, user_image = $7
WHERE id = $1
RETURNING id, name, email, password_hash, role, organization_name, user_image, created_at;

-- name: DeleteUser :exec
DELETE FROM users WHERE id = $1;

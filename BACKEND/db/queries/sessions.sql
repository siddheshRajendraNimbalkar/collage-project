-- name: CreateSession :one
INSERT INTO sessions (user_id, token, expires_at, token_block)
VALUES ($1, $2, $3, false) 
RETURNING id, user_id, token, created_at, expires_at, token_block;


-- name: GetSessionByToken :one
SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW();

-- name: UpdateSessionTokenBlock :exec
UPDATE sessions
SET token_block = $2
WHERE token = $1;

-- name: DeleteSessionByToken :exec
DELETE FROM sessions WHERE token = $1;

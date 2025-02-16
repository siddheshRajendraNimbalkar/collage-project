package gapi

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"google.golang.org/grpc/metadata"
)

type AuthContextKey string

type TokenPayload struct {
	ID        uuid.UUID `json:"id"`
	Email     string    `json:"email"`
	IssuedAt  time.Time `json:"issued_at"`
	ExpiresAt time.Time `json:"expires_at"`
}

const AuthPayloadKey AuthContextKey = "auth_payload"

func (server *Server) AuthInterceptor(
	ctx context.Context,
) (*TokenPayload, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, errors.New("missing metadata in context")
	}

	tokens := md.Get("authorization")
	if len(tokens) == 0 {
		return nil, errors.New("authorization token not found")
	}

	parts := strings.SplitN(tokens[0], " ", 2)
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return nil, errors.New("invalid token format")
	}

	tokenPayload, err := server.tokenMaker.VerifyToken(parts[1])
	if err != nil {
		return nil, err
	}

	return (*TokenPayload)(tokenPayload), nil
}

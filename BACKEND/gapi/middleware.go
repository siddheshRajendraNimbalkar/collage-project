package gapi

import (
	"context"
	"errors"
	"log"
	"strings"

	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

type AuthContextKey string

const AuthPayloadKey AuthContextKey = "auth_payload"

func (server *Server) AuthInterceptor(
	ctx context.Context,
	req interface{},
	info *grpc.UnaryServerInfo,
	handler grpc.UnaryHandler,
) (interface{}, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, errors.New("missing metadata in context")
	}

	tokens := md.Get("authorization")
	log.Println("Extracted Metadata:", tokens)
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

	ctx = context.WithValue(ctx, AuthPayloadKey, tokenPayload)

	return handler(ctx, req)
}

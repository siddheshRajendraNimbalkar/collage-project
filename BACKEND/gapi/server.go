package gapi

import (
	"context"
	"fmt"
	"log"

	"github.com/redis/go-redis/v9"

	db "github.com/siddheshRajendraNimbalkar/collage-prject-backend/db/sqlc"
	"github.com/siddheshRajendraNimbalkar/collage-prject-backend/pb"
	"github.com/siddheshRajendraNimbalkar/collage-prject-backend/token"
	"github.com/siddheshRajendraNimbalkar/collage-prject-backend/util"

	_ "github.com/lib/pq"
)

type Server struct {
	pb.UnimplementedCollageProjectServer
	config     util.Config
	store      *db.SQLStore
	tokenMaker *token.PastoMaker
	redis      *redis.Client
	ctx        context.Context
}

func NewServer(config util.Config, store *db.SQLStore) (*Server, error) {
	tokenMaker, err := token.NewMaker(config.SecretKey)
	if err != nil {
		err := fmt.Errorf("tokenMaker %s", err.Error())
		return nil, err
	}

	opt, err := redis.ParseURL("rediss://default:Ab1RAAIjcDFmNGViZmUzZmEzMTA0MjYyYWI2YmIxYTFmNDY2Y2U5Y3AxMA@delicate-teal-48465.upstash.io:6379")
	if err != nil {
		log.Fatal("Error parsing Redis URL:", err)
	}

	client := redis.NewClient(opt)
	ctx := context.Background()

	_, err = client.Ping(ctx).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	server := &Server{
		config:     config,
		store:      store,
		tokenMaker: tokenMaker,
		redis:      client,
		ctx:        ctx,
	}

	return server, nil
}

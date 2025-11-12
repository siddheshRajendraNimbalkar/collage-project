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
}

func NewServer(config util.Config, store *db.SQLStore) (*Server, error) {
	tokenMaker, err := token.NewMaker(config.SecretKey)
	if err != nil {
		err := fmt.Errorf("tokenMaker %s", err.Error())
		return nil, err
	}

	// Initialize Redis client (optional)
	var client *redis.Client
	redisURL := config.RedisURL
	if redisURL != "" {
		opt, err := redis.ParseURL(redisURL)
		if err == nil {
			client = redis.NewClient(opt)
			ctx := context.Background()
			_, err = client.Ping(ctx).Result()
			if err != nil {
				log.Printf("Redis connection failed: %v, continuing without Redis", err)
				client = nil
			} else {
				log.Println("Redis connected successfully")
			}
		} else {
			log.Printf("Error parsing Redis URL: %v, continuing without Redis", err)
		}
	}

	server := &Server{
		config:     config,
		store:      store,
		tokenMaker: tokenMaker,
		redis:      client,
	}

	return server, nil
}

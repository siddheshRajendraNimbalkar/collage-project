package main

import (
	"context"
	"database/sql"
	"log"

	_ "github.com/lib/pq"
	db "github.com/siddheshRajendraNimbalkar/collage-prject-backend/db/sqlc"
	redisClient "github.com/siddheshRajendraNimbalkar/collage-prject-backend/internal/redis"
	"github.com/siddheshRajendraNimbalkar/collage-prject-backend/util"
)

func main() {
	config, err := util.LoadConfig(".")
	if err != nil {
		log.Fatalf("Error loading config: %v", err)
	}

	redisURL := config.RedisURL
	if redisURL == "" {
		redisURL = "localhost:6379"
	}
	log.Printf("Using Redis URL: %s", redisURL)
	
	if err := redisClient.InitRedis(redisURL); err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	
	// Test Redis connection
	log.Printf("Testing Redis connection...")
	if err := redisClient.TestConnection(); err != nil {
		log.Fatalf("Redis connection test failed: %v", err)
	}
	log.Printf("Redis connection test successful")

	conn, err := sql.Open(config.DBDriver, config.DBSource)
	if err != nil {
		log.Fatalf("Cannot connect to database: %v", err)
	}
	defer conn.Close()

	store := db.NewStore(conn)

	log.Println("Starting bulk indexing of products...")
	
	products, err := store.GetAllProducts(context.Background(), db.GetAllProductsParams{
		Limit:  1000,
		Offset: 0,
	})
	if err != nil {
		log.Fatalf("Failed to get products: %v", err)
	}

	indexed := 0
	for _, product := range products {
		if err := redisClient.IndexProduct(product.ID.String(), product.Name, product.Category, product.Type, product.ProductUrl); err != nil {
			log.Printf("Failed to index product %s: %v", product.ID.String(), err)
		} else {
			indexed++
		}
	}

	log.Printf("Successfully indexed %d products", indexed)
}
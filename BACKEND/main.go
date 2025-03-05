package main

import (
	"context"
	"database/sql"
	"log"
	"net"
	"net/http"

	runtime "github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/rs/cors"

	db "github.com/siddheshRajendraNimbalkar/collage-prject-backend/db/sqlc"
	"github.com/siddheshRajendraNimbalkar/collage-prject-backend/gapi"
	"github.com/siddheshRajendraNimbalkar/collage-prject-backend/pb"
	"github.com/siddheshRajendraNimbalkar/collage-prject-backend/util"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
	"google.golang.org/protobuf/encoding/protojson"
)

var ctx = context.Background()

func main() {
	config, err := util.LoadConfig(".")
	if err != nil {
		log.Fatalf("Error loading config: %v", err)
	}
	conn, err := sql.Open(config.DBDriver, config.DBSource)
	if err != nil {
		log.Fatalf("cannot connect to database: %v", err)
	}
	if err = conn.Ping(); err != nil {
		log.Fatalf("Database is not reachable: %v", err)
	} else {
		log.Println("Database connection successful!")
	}

	store := db.NewStore(conn)

	go grpcClient(*store, config)
	grpcApiClient(*store, config)
}

func grpcApiClient(store db.SQLStore, config util.Config) {
	server, err := gapi.NewServer(config, &store)
	if err != nil {
		log.Fatalf("[Can't get server]: %v", err)
	}

	grpcMux := runtime.NewServeMux(runtime.WithMarshalerOption(runtime.MIMEWildcard, &runtime.JSONPb{
		MarshalOptions: protojson.MarshalOptions{
			UseProtoNames: true,
		},
		UnmarshalOptions: protojson.UnmarshalOptions{
			DiscardUnknown: true,
		},
	}))

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	err = pb.RegisterCollageProjectHandlerServer(ctx, grpcMux, server)
	if err != nil {
		log.Fatal("cann't connect to listener ", err)
	}

	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	mux := http.NewServeMux()
	mux.Handle("/", grpcMux)

	listener, err := net.Listen("tcp", config.APIADDR)

	if err != nil {
		log.Fatalln("err while listeneing server at ", listener.Addr().String(), ": ", err.Error())
	}

	log.Println("http server is listening at ", listener.Addr().String())

	err = http.Serve(listener, corsHandler.Handler(mux))
	if err != nil {
		log.Fatalf("cannot start gRPC server: %v", err)
	}
}

func grpcClient(store db.SQLStore, config util.Config) {
	server, err := gapi.NewServer(config, &store)
	if err != nil {
		log.Fatalf("[Can't get server]: %v", err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterCollageProjectServer(grpcServer, server)
	reflection.Register(grpcServer)

	listener, err := net.Listen("tcp", config.Addr)

	if err != nil {
		log.Fatalln("err while listeneing server at ", listener.Addr().String(), ": ", err.Error())
	}

	log.Println("server is listening at ", listener.Addr().String())

	err = grpcServer.Serve(listener)
	if err != nil {
		log.Fatalf("cannot start gRPC server: %v", err)
	}
}

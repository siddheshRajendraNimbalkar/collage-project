package main

import (
	"database/sql"
	"log"
	"net"

	db "github.com/siddheshRajendraNimbalkar/collage-prject-backend/db/sqlc"
	"github.com/siddheshRajendraNimbalkar/collage-prject-backend/gapi"
	"github.com/siddheshRajendraNimbalkar/collage-prject-backend/pb"
	"github.com/siddheshRajendraNimbalkar/collage-prject-backend/util"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

func main() {
	config, err := util.LoadConfig(".")
	if err != nil {
		log.Fatalf("Error loading config: %v", err)
	}

	conn, err := sql.Open(config.DBDriver, config.DBSource)

	if err != nil {
		log.Fatalf("cannot connect to database: %v", err)
	}

	store := db.NewStore(conn)

	server, err := gapi.NewServer(config, store)
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

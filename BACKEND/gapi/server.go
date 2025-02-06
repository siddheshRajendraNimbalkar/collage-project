package gapi

import (
	"fmt"

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
}

func NewServer(config util.Config, store *db.SQLStore) (*Server, error) {
	tokenMaker, err := token.NewMaker(config.SecretKey)
	if err != nil {
		err := fmt.Errorf("tokenMaker %s", err.Error())
		return nil, err
	}

	server := &Server{
		config:     config,
		store:      store,
		tokenMaker: tokenMaker,
	}

	return server, nil
}

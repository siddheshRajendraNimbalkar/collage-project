package db

import (
	"database/sql"
)

type SQLStore struct {
	*Queries
	db *sql.DB
}

func NewStore(db *sql.DB) *SQLStore {
	return &SQLStore{
		Queries: New(db),
		db:      db,
	}
}

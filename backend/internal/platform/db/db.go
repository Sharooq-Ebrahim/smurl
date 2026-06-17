package db

import (
	"database/sql"
	"smurl/internal/config"

	_ "github.com/lib/pq"
)

func ConnectToDB(cfg *config.Config) (*sql.DB, error) {

	db, err := sql.Open("postgres", cfg.DBURL)
	if err != nil {
		return nil, err
	}

	if err = db.Ping(); err != nil {
		return nil, err
	}

	return db, nil
}

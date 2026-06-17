package db

import (
	"database/sql"
	"fmt"
	"smurl/internal/config"

	_ "github.com/lib/pq"
)

func ConnectToDB(cfg *config.Config) (*sql.DB, error) {

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.DB_HOST, cfg.DB_PORT, cfg.DB_USER, cfg.DB_PASSWORD, cfg.DB_NAME, cfg.DB_SSLMODE)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	if err = db.Ping(); err != nil {
		return nil, err
	}

	return db, nil
}

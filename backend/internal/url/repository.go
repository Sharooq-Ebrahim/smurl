package url

import (
	"context"
	"database/sql"
	"errors"
)

type Repository interface {
	Create(ctx context.Context, link *ShortLink) error
	GetByShortCode(ctx context.Context, shortCode string) (*ShortLink, error)
	GetAll(ctx context.Context) ([]*ShortLink, error)
	Update(ctx context.Context, shortCode string, originalURL string) error
	Delete(ctx context.Context, shortCode string) error
}

type repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(ctx context.Context, link *ShortLink) error {
	query := `
		INSERT INTO short_links (user_id, short_code, original_url, expires_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at
	`
	err := r.db.QueryRowContext(
		ctx,
		query,
		link.UserID,
		link.ShortCode,
		link.OriginalURL,
		link.ExpiresAt,
	).Scan(&link.ID, &link.CreatedAt, &link.UpdatedAt)

	return err
}

func (r *repository) GetByShortCode(ctx context.Context, shortCode string) (*ShortLink, error) {

	query := `
		SELECT id, user_id, short_code, original_url, expires_at, created_at, updated_at
		FROM short_links
		WHERE short_code = $1 AND deleted_at IS NULL
	`
	link := &ShortLink{}

	err := r.db.QueryRowContext(ctx, query, shortCode).Scan(
		&link.ID,
		&link.UserID,
		&link.ShortCode,
		&link.OriginalURL,
		&link.ExpiresAt,
		&link.CreatedAt,
		&link.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return link, nil
}

func (r *repository) GetAll(ctx context.Context) ([]*ShortLink, error) {
	query := `
		SELECT id, user_id, short_code, original_url, expires_at, created_at, updated_at
		FROM short_links
		WHERE deleted_at IS NULL
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var links []*ShortLink
	for rows.Next() {
		link := &ShortLink{}
		err := rows.Scan(
			&link.ID,
			&link.UserID,
			&link.ShortCode,
			&link.OriginalURL,
			&link.ExpiresAt,
			&link.CreatedAt,
			&link.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		links = append(links, link)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return links, nil
}

func (r *repository) Update(ctx context.Context, shortCode string, originalURL string) error {
	query := `
		UPDATE short_links
		SET original_url = $1, updated_at = NOW()
		WHERE short_code = $2 AND deleted_at IS NULL
	`
	res, err := r.db.ExecContext(ctx, query, originalURL, shortCode)
	if err != nil {
		return err
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func (r *repository) Delete(ctx context.Context, shortCode string) error {
	query := `
		UPDATE short_links
		SET deleted_at = NOW()
		WHERE short_code = $1 AND deleted_at IS NULL
	`
	res, err := r.db.ExecContext(ctx, query, shortCode)
	if err != nil {
		return err
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

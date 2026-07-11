package url

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"errors"
	"regexp"
	"strings"
	"time"
)

var ErrNotFound = errors.New("short link not found")
var ErrExpired = errors.New("this link has expired")

var reservedShortCodes = map[string]bool{
	"login":    true,
	"register": true,
	"admin":    true,
	"api":      true,
	"docs":     true,
}

var customShortCodeRegex = regexp.MustCompile(`^[a-zA-Z0-9_-]{3,20}$`)

type Service interface {
	CreateShortLink(ctx context.Context, req CreateShortLinkRequest) (*CreateShortLinkResponse, error)
	GetShortLink(ctx context.Context, shortCode string) (*ShortLink, error)
	GetShortLinkForRedirect(ctx context.Context, shortCode string) (*ShortLink, error)
	GetAllURLs(ctx context.Context, userID int64) ([]*ShortLink, error)
	UpdateShortLink(ctx context.Context, shortCode string, req UpdateShortLinkRequest, userID int64) error
	UpdateShortLinkStatus(ctx context.Context, shortCode string, isActive bool, userID int64) error
	DeleteShortLink(ctx context.Context, shortCode string, userID int64) error
	GetQRCode(ctx context.Context, shortCode string) ([]byte, error)
}

type service struct {
	repo    Repository
	baseURL string
}

func NewService(repo Repository, baseURL string) Service {
	return &service{
		repo:    repo,
		baseURL: baseURL,
	}
}

func (s *service) CreateShortLink(ctx context.Context, req CreateShortLinkRequest) (*CreateShortLinkResponse, error) {

	var shortCode string
	var err error

	if req.CustomShortCode != "" {

		if _, exists := reservedShortCodes[req.CustomShortCode]; exists {
			return nil, errors.New("custom short code is reserved")
		}

		if !customShortCodeRegex.MatchString(req.CustomShortCode) {
			return nil, errors.New("custom short code must be 3-20 characters and contain only letters, numbers, hyphens, and underscores")
		}

		existingLink, err := s.repo.GetByShortCode(ctx, req.CustomShortCode)
		if err != nil {
			return nil, err
		}
		if existingLink != nil {
			return nil, errors.New("custom short code already taken")
		}

		shortCode = req.CustomShortCode
	} else {
		shortCode, err = generateShortCode(8)
		if err != nil {
			return nil, err
		}
	}

	if req.ExpiresAt != nil {
		utcTime := req.ExpiresAt.UTC()
		if utcTime.Before(time.Now().UTC()) {
			return nil, errors.New("expiration time cannot be in the past")
		}
		req.ExpiresAt = &utcTime
	}

	link := &ShortLink{
		UserID:      req.UserID,
		ShortCode:   shortCode,
		OriginalURL: req.OriginalURL,
		ExpiresAt:   req.ExpiresAt,
	}

	if err := s.repo.Create(ctx, link); err != nil {
		return nil, err
	}

	return &CreateShortLinkResponse{
		ShortCode:   link.ShortCode,
		OriginalURL: link.OriginalURL,
		ShortURL:    s.baseURL + "/" + link.ShortCode,
		IsActive:    link.IsActive,
		ExpiresAt:   link.ExpiresAt,
	}, nil
}

func (s *service) GetShortLink(ctx context.Context, shortCode string) (*ShortLink, error) {

	link, err := s.repo.GetByShortCode(ctx, shortCode)
	if err != nil {
		return nil, err
	}
	if link == nil {
		return nil, ErrNotFound
	}

	return link, nil
}

func (s *service) GetShortLinkForRedirect(ctx context.Context, shortCode string) (*ShortLink, error) {
	link, err := s.repo.GetByShortCode(ctx, shortCode)
	if err != nil {
		return nil, err
	}
	if link == nil {
		return nil, ErrNotFound
	}

	if link.ExpiresAt != nil && link.ExpiresAt.Before(time.Now().UTC()) {
		return link, ErrExpired
	}

	return link, nil
}

func generateShortCode(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	code := base64.URLEncoding.EncodeToString(bytes)

	code = strings.ReplaceAll(code, "=", "")
	code = strings.ReplaceAll(code, "-", "")
	code = strings.ReplaceAll(code, "_", "")

	if len(code) > length {
		code = code[:length]
	}
	return code, nil
}

func (s *service) GetAllURLs(ctx context.Context, userID int64) ([]*ShortLink, error) {
	return s.repo.GetAll(ctx, userID)
}

func (s *service) UpdateShortLink(ctx context.Context, shortCode string, req UpdateShortLinkRequest, userID int64) error {
	if req.ExpiresAt != nil {
		utcTime := req.ExpiresAt.UTC()
		if utcTime.Before(time.Now().UTC()) {
			return errors.New("expiration time cannot be in the past")
		}
		req.ExpiresAt = &utcTime
	}

	err := s.repo.Update(ctx, shortCode, req, userID)
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	return err
}

func (s *service) UpdateShortLinkStatus(ctx context.Context, shortCode string, isActive bool, userID int64) error {
	err := s.repo.UpdateStatus(ctx, shortCode, isActive, userID)
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	return err
}

func (s *service) DeleteShortLink(ctx context.Context, shortCode string, userID int64) error {
	err := s.repo.Delete(ctx, shortCode, userID)
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	return err
}

func (s *service) GetQRCode(ctx context.Context, shortCode string) ([]byte, error) {
	link, err := s.GetShortLink(ctx, shortCode)
	if err != nil {
		return nil, err
	}
	return GenerateQRCode(s.baseURL + "/" + link.ShortCode)
}

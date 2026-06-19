package url

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"strings"
)

var ErrNotFound = errors.New("short link not found")

type Service interface {
	CreateShortLink(ctx context.Context, req CreateShortLinkRequest) (*CreateShortLinkResponse, error)
	GetOriginalURL(ctx context.Context, shortCode string) (string, error)
	GetAllURLs(ctx context.Context) ([]*ShortLink, error)
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
	shortCode, err := generateShortCode(8)
	if err != nil {
		return nil, err
	}

	link := &ShortLink{
		UserID:      req.UserID,
		ShortCode:   shortCode,
		OriginalURL: req.OriginalURL,
	}

	if err := s.repo.Create(ctx, link); err != nil {
		return nil, err
	}

	return &CreateShortLinkResponse{
		ShortCode:   link.ShortCode,
		OriginalURL: link.OriginalURL,
		ShortURL:    s.baseURL + "/" + link.ShortCode,
	}, nil
}

func (s *service) GetOriginalURL(ctx context.Context, shortCode string) (string, error) {

	link, err := s.repo.GetByShortCode(ctx, shortCode)
	if err != nil {
		return "", err
	}
	if link == nil {
		return "", ErrNotFound
	}

	return link.OriginalURL, nil
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

func (s *service) GetAllURLs(ctx context.Context) ([]*ShortLink, error) {
	return s.repo.GetAll(ctx)
}

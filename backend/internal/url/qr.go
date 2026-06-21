package url

import (
	"fmt"

	"github.com/skip2/go-qrcode"
)

func GenerateQRCode(url string) ([]byte, error) {
	qrCodeBytes, err := qrcode.Encode(url, qrcode.Medium, 256)
	if err != nil {
		return nil, fmt.Errorf("failed to generate QR code: %w", err)
	}

	return qrCodeBytes, nil
}

package util

import (
	"fmt"
	"net/url"
	"regexp"
	"strings"

	"github.com/siddheshRajendraNimbalkar/collage-prject-backend/pb"
)

func ValidateCreateProductInput(req *pb.CreateProductRequest) error {
	// Name validation
	if len(strings.TrimSpace(req.GetName())) <= 3 {
		return fmt.Errorf("name must be at list 3 character long")
	}

	// Price validation
	if req.GetPrice() <= 0 {
		return fmt.Errorf("price must be greater than zero")
	}

	// Stock validation (should be non-negative)
	if req.GetStock() < 0 {
		return fmt.Errorf("stock cannot be negative")
	}

	// Category validation
	if len(req.GetCategory()) == 0 {
		return fmt.Errorf("category cannot be empty")
	}

	// Type validation
	if len(req.GetType()) == 0 {
		return fmt.Errorf("type cannot be empty")
	}

	// Description length validation (optional, max 500 chars)
	if len(req.GetDescription()) > 500 {
		return fmt.Errorf("description should not exceed 500 characters")
	}

	// Product URL validation (must be a valid URL)
	if err := validateURL(req.GetProductUrl()); err != nil {
		return fmt.Errorf("invalid product URL")
	}

	return nil
}

// validateURL ensures the provided URL is valid
func validateURL(productUrl string) error {
	// Check for valid URL format
	parsedUrl, err := url.ParseRequestURI(productUrl)
	if err != nil || parsedUrl.Scheme == "" || parsedUrl.Host == "" {
		return fmt.Errorf("invalid product URL format")
	}

	// Optional: Regex to allow only HTTP and HTTPS URLs
	urlPattern := `^https?://[^\s/$.?#].[^\s]*$`
	matched, _ := regexp.MatchString(urlPattern, productUrl)
	if !matched {
		return fmt.Errorf("invalid product URL")
	}

	return nil
}

func ValidateUpdateProductInput(req *pb.UpdateProductRequest) error {
	// Name validation
	if len(strings.TrimSpace(req.GetName())) <= 2 {
		return fmt.Errorf("name must be at list 2 character long")
	}

	// Price validation
	if req.GetPrice() <= 0 {
		return fmt.Errorf("price must be greater than zero")
	}

	// Stock validation (should be non-negative)
	if req.GetStock() < 0 {
		return fmt.Errorf("stock cannot be negative")
	}

	// Category validation
	if len(req.GetCategory()) == 0 {
		return fmt.Errorf("category cannot be empty")
	}

	// Type validation
	if len(req.GetType()) == 0 {
		return fmt.Errorf("type cannot be empty")
	}

	// Description length validation (optional, max 500 chars)
	if len(req.GetDescription()) > 500 {
		return fmt.Errorf("description should not exceed 500 characters")
	}

	// Product URL validation (must be a valid URL)
	if err := validateURL(req.GetProductUrl()); err != nil {
		return fmt.Errorf("invalid product URL")
	}

	return nil
}

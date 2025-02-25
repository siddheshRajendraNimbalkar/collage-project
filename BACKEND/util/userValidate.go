package util

import (
	"errors"
	"net/mail"
	"regexp"

	"github.com/siddheshRajendraNimbalkar/collage-prject-backend/pb"
)

func ValidateSignUpInput(req *pb.SignUpRequest) error {
	// Validate name
	if len(req.GetName()) == 0 {
		return errors.New("name cannot be empty")
	}

	// Validate email format
	if _, err := mail.ParseAddress(req.GetEmail()); err != nil {
		return errors.New("invalid email format")
	}

	// Validate password length (minimum 8 characters)
	if len(req.GetPassword()) < 8 {
		return errors.New("password must be at least 8 characters long")
	}

	validRoles := map[string]bool{"college_staff": true, "ngo_staff": true, "self_staff": true}
	if !validRoles[req.GetRole()] {
		return errors.New("invalid role")
	}

	// Validate optional organization name (max length 100)
	if len(req.GetOrganizationName()) > 100 {
		return errors.New("organization name must not exceed 100 characters")
	}

	// Validate optional user image (if provided, should be a valid URL)
	if len(req.GetUserImage()) > 0 {
		urlPattern := `^https?://[^\s/$.?#].[^\s]*$`
		matched, _ := regexp.MatchString(urlPattern, req.GetUserImage())
		if !matched {
			return errors.New("invalid user image URL")
		}
	}

	return nil
}

func ValidateLogInInput(req *pb.LoginRequest) error {

	// Validate email format
	if _, err := mail.ParseAddress(req.GetEmail()); err != nil {
		return errors.New("invalid email format")
	}

	// Validate password length (minimum 8 characters)
	if len(req.GetPassword()) < 8 {
		return errors.New("password must be at least 8 characters long")
	}

	return nil
}

func ValidateUpdateInput(req *pb.UpdateUserRequest) error {
	// Validate name
	if len(req.GetName()) == 0 {
		return errors.New("name cannot be empty")
	}

	validRoles := map[string]bool{"college_staff": true, "ngo_staff": true, "self_staff": true}
	if !validRoles[req.GetRole()] {
		return errors.New("invalid role")
	}

	// Validate optional organization name (max length 100)
	if len(req.GetOrganizationName()) > 100 {
		return errors.New("organization name must not exceed 100 characters")
	}

	// Validate optional user image (if provided, should be a valid URL)
	if len(req.GetUserImage()) > 0 {
		urlPattern := `^https?://[^\s/$.?#].[^\s]*$`
		matched, _ := regexp.MatchString(urlPattern, req.GetUserImage())
		if !matched {
			return errors.New("invalid user image URL")
		}
	}

	return nil
}

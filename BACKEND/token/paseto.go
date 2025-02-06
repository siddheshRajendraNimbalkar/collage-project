package token

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/o1egl/paseto"
)

var ErrTokenExpired = errors.New("token has expired")

var ErrInvalidKey = errors.New("invalid key: must be exactly 32 bytes")

type TokenPayload struct {
	ID        uuid.UUID `json:"id"`
	Email     string    `json:"email"`
	IssuedAt  time.Time `json:"issued_at"`
	ExpiresAt time.Time `json:"expires_at"`
}

type PastoMaker struct {
	paseto    *paseto.V2
	secretKey string
}

func NewMaker(secretKey string) (*PastoMaker, error) {
	if len(secretKey) != 32 {
		return nil, ErrInvalidKey
	}
	return &PastoMaker{
		paseto:    paseto.NewV2(),
		secretKey: secretKey,
	}, nil
}

func (maker *PastoMaker) GenerateToken(userID uuid.UUID, email string, expireTime string) (string, error) {
	now := time.Now()
	duration, err := time.ParseDuration(expireTime)
	if err != nil {
		return "", err
	}
	expiration := now.Add(duration)

	payload := TokenPayload{
		ID:        userID,
		Email:     email,
		IssuedAt:  now,
		ExpiresAt: expiration,
	}

	token, err := maker.paseto.Encrypt([]byte(maker.secretKey), payload, nil)
	if err != nil {
		return "", err
	}

	return token, nil
}

func (maker *PastoMaker) VerifyToken(token string) (*TokenPayload, error) {
	var payload TokenPayload

	err := maker.paseto.Decrypt(token, []byte(maker.secretKey), &payload, nil)
	if err != nil {
		return nil, err
	}

	if time.Now().After(payload.ExpiresAt) {
		return nil, ErrTokenExpired
	}

	return &payload, nil
}

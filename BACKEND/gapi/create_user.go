package gapi

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
	db "github.com/siddheshRajendraNimbalkar/collage-prject-backend/db/sqlc"
	"github.com/siddheshRajendraNimbalkar/collage-prject-backend/pb"
	"github.com/siddheshRajendraNimbalkar/collage-prject-backend/util"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Config struct {
	AccessTokenExpiresIn  time.Duration
	RefreshTokenExpiresIn time.Duration
}

func (server *Server) SignUpUser(ctx context.Context, req *pb.SignUpRequest) (*pb.AuthResponse, error) {

	if err := util.ValidateSignUpInput(req); err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid input: %v", err)
	}

	_, err := server.store.GetUserByEmail(ctx, req.Email)
	if err == nil {
		return nil, status.Errorf(codes.AlreadyExists, "email already in use")
	}
	if err != sql.ErrNoRows {
		return nil, status.Errorf(codes.Internal, "failed to check if email exists: %v", err)
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.GetPassword()), bcrypt.DefaultCost)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to hash password: %v", err)
	}

	arg := db.CreateUserParams{
		Name:             req.GetName(),
		Email:            req.GetEmail(),
		PasswordHash:     string(hashedPassword),
		Role:             req.GetRole(),
		OrganizationName: req.GetOrganizationName(),
		UserImage:        req.GetUserImage(),
	}

	user, err := server.store.CreateUser(ctx, arg)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create user: %v", err)
	}

	accessToken, err := server.tokenMaker.GenerateToken(user.ID, user.Email, server.config.ACCESSTOKENEXPIRESIN)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to generate access token: %v", err)
	}

	refreshToken, err := server.tokenMaker.GenerateToken(user.ID, user.Email, server.config.REFRESHTOKENEXPIRESIN)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to generate refresh token: %v", err)
	}

	duration, err := time.ParseDuration(server.config.REFRESHTOKENEXPIRESIN)
	if err != nil {
		return nil, err
	}

	session, err := server.store.CreateSession(ctx, db.CreateSessionParams{
		UserID:    uuid.NullUUID{UUID: user.ID, Valid: true},
		Token:     refreshToken,
		ExpiresAt: time.Now().Add(duration),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create session: %v", err)
	}

	now := time.Now()
	duration, _ = time.ParseDuration(server.config.ACCESSTOKENEXPIRESIN)
	expirationTime := now.Add(duration)

	return &pb.AuthResponse{
		AccessToken:        accessToken,
		RefreshToken:       session.Token,
		ExpireAccessToken:  expirationTime.Format(time.RFC3339),
		ExpireRefreshToken: session.ExpiresAt.Format(time.RFC3339),
		User: &pb.User{
			Id:               user.ID.String(),
			Name:             user.Name,
			Email:            user.Email,
			UserImage:        user.UserImage,
			Role:             user.Role,
			OrganizationName: user.OrganizationName,
			CreatedAt:        user.CreatedAt.Time.Format("2006-01-02 15:04:05"),
		},
	}, nil
}

func (server *Server) LoginUser(ctx context.Context, req *pb.LoginRequest) (*pb.AuthResponse, error) {

	if err := util.ValidateLogInInput(req); err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid input: %v", err)
	}

	user, err := server.store.GetUserByEmail(ctx, req.GetEmail())
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to retrieve user: %v", err)
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.GetPassword()))
	if err != nil {
		return nil, status.Errorf(codes.Unauthenticated, "invalid credentials")
	}

	accessToken, err := server.tokenMaker.GenerateToken(user.ID, user.Email, server.config.ACCESSTOKENEXPIRESIN)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to generate access token: %v", err)
	}

	refreshToken, err := server.tokenMaker.GenerateToken(user.ID, user.Email, server.config.REFRESHTOKENEXPIRESIN)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to generate refresh token: %v", err)
	}

	refreshTokenDuration, err := time.ParseDuration(server.config.REFRESHTOKENEXPIRESIN)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "invalid refresh token expiration: %v", err)
	}

	session, err := server.store.CreateSession(ctx, db.CreateSessionParams{
		UserID:    uuid.NullUUID{UUID: user.ID, Valid: true},
		Token:     refreshToken,
		ExpiresAt: time.Now().Add(refreshTokenDuration),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create session: %v", err)
	}

	now := time.Now()
	duration, _ := time.ParseDuration(server.config.ACCESSTOKENEXPIRESIN)
	expirationTime := now.Add(duration)

	return &pb.AuthResponse{
		AccessToken:        accessToken,
		RefreshToken:       session.Token,
		ExpireAccessToken:  expirationTime.Format(time.RFC3339),
		ExpireRefreshToken: session.ExpiresAt.Format(time.RFC3339),
		User: &pb.User{
			Id:               user.ID.String(),
			Name:             user.Name,
			Email:            user.Email,
			UserImage:        user.UserImage,
			Role:             user.Role,
			OrganizationName: user.OrganizationName,
			CreatedAt:        user.CreatedAt.Time.Format("2006-01-02 15:04:05"),
		},
	}, nil
}

func (server *Server) GetUserByID(ctx context.Context, req *pb.GetUserRequest) (*pb.UserResponse, error) {
	id, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user ID: %v", err)
	}
	user, err := server.store.GetUserByID(ctx, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to retrieve user: %v", err)
	}
	return &pb.UserResponse{
		User: &pb.User{
			Id:               user.ID.String(),
			Name:             user.Name,
			Email:            user.Email,
			UserImage:        user.UserImage,
			Role:             user.Role,
			OrganizationName: user.OrganizationName,
			CreatedAt:        user.CreatedAt.Time.Format("2006-01-02 15:04:05"),
		},
	}, nil
}

func (server *Server) UpdateUser(ctx context.Context, req *pb.UpdateUserRequest) (*pb.UserResponse, error) {

	if err := util.ValidateUpdateInput(req); err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid input: %v", err)
	}

	id, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user ID: %v", err)
	}

	arg := db.UpdateUserParams{
		ID:               id,
		Name:             req.GetName(),
		Email:            req.GetEmail(),
		UserImage:        req.GetUserImage(),
		Role:             req.GetRole(),
		OrganizationName: req.GetOrganizationName(),
	}

	updatedUser, err := server.store.UpdateUser(ctx, arg)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update user: %v", err)
	}

	return &pb.UserResponse{
		User: &pb.User{
			Id:               updatedUser.ID.String(),
			Name:             updatedUser.Name,
			Email:            updatedUser.Email,
			UserImage:        updatedUser.UserImage,
			Role:             updatedUser.Role,
			OrganizationName: updatedUser.OrganizationName,
			CreatedAt:        updatedUser.CreatedAt.Time.Format("2006-01-02 15:04:05"),
		},
	}, nil
}

func (server *Server) GetUserByEmail(ctx context.Context, req *pb.GetUserByEmailRequest) (*pb.UserResponse, error) {

	user, err := server.store.GetUserByEmail(ctx, req.GetEmail())
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to retrieve user: %v", err)
	}

	return &pb.UserResponse{
		User: &pb.User{
			Id:               user.ID.String(),
			Name:             user.Name,
			Email:            user.Email,
			Role:             user.Role,
			UserImage:        user.UserImage,
			OrganizationName: user.OrganizationName,
			CreatedAt:        user.CreatedAt.Time.Format("2006-01-02 15:04:05"),
		},
	}, nil
}

func (server *Server) DeleteUser(ctx context.Context, req *pb.DeleteUserRequest) (*pb.DeleteUserResponse, error) {

	id, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user ID: %v", err)
	}
	err = server.store.DeleteUser(ctx, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to delete user: %v", err)
	}

	return &pb.DeleteUserResponse{
		Message: "User deleted successfully",
	}, nil
}

func (s *Server) RefreshToken(ctx context.Context, req *pb.RefreshTokenRequest) (*pb.AuthResponse, error) {

	if req.RefreshToken == "" {
		return nil, status.Errorf(codes.InvalidArgument, "refresh token is required")
	}

	userID, err := s.tokenMaker.VerifyToken(req.RefreshToken)
	if err != nil {
		return nil, status.Errorf(codes.Unauthenticated, "invalid or expired refresh token")
	}

	newAccessToken, err := s.tokenMaker.GenerateToken(userID.ID, userID.Email, s.config.ACCESSTOKENEXPIRESIN)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to generate new access token")
	}

	return &pb.AuthResponse{
		AccessToken:  newAccessToken,
		RefreshToken: req.RefreshToken,
	}, nil
}

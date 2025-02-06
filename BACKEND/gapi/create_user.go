package gapi

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
	db "github.com/siddheshRajendraNimbalkar/collage-prject-backend/db/sqlc"
	"github.com/siddheshRajendraNimbalkar/collage-prject-backend/pb"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// Retrieve the expiration time constants from environment variables
type Config struct {
	AccessTokenExpiresIn  time.Duration
	RefreshTokenExpiresIn time.Duration
}

func (server *Server) SignUpUser(ctx context.Context, req *pb.SignUpRequest) (*pb.AuthResponse, error) {
	// Check if the user exists

	_, err := server.store.GetUserByEmail(ctx, req.Email)
	if err == nil {
		return nil, status.Errorf(codes.AlreadyExists, "email already in use")
	}
	if err != sql.ErrNoRows {
		return nil, status.Errorf(codes.Internal, "failed to check if email exists: %v", err)
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.GetPassword()), bcrypt.DefaultCost)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to hash password: %v", err)
	}

	// Insert the user into the database
	arg := db.CreateUserParams{
		Name:             req.GetName(),
		Email:            req.GetEmail(),
		PasswordHash:     string(hashedPassword),
		Role:             req.GetRole(),
		OrganizationName: req.GetOrganizationName(),
	}

	user, err := server.store.CreateUser(ctx, arg)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create user: %v", err)
	}

	// Generate access and refresh tokens
	accessToken, err := server.tokenMaker.GenerateToken(user.ID, user.Email, server.config.ACCESSTOKENEXPIRESIN)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to generate access token: %v", err)
	}

	refreshToken, err := server.tokenMaker.GenerateToken(user.ID, user.Email, server.config.DBSource)
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

	// Return the response with session info
	return &pb.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: session.Token,
		User: &pb.User{
			Id:               user.ID.String(),
			Name:             user.Name,
			Email:            user.Email,
			Role:             user.Role,
			OrganizationName: user.OrganizationName,
			CreatedAt:        user.CreatedAt.Time.Format("2006-01-02 15:04:05"),
		},
	}, nil
}

func (server *Server) LoginUser(ctx context.Context, req *pb.LoginRequest) (*pb.AuthResponse, error) {
	// Retrieve the user from the database by email
	user, err := server.store.GetUserByEmail(ctx, req.GetEmail())
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to retrieve user: %v", err)
	}

	// Compare the provided password with the hashed password stored in the database
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.GetPassword()))
	if err != nil {
		return nil, status.Errorf(codes.Unauthenticated, "invalid credentials")
	}

	// Generate access token with a short expiration (15 minutes)
	accessToken, err := server.tokenMaker.GenerateToken(user.ID, user.Email, server.config.ACCESSTOKENEXPIRESIN)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to generate access token: %v", err)
	}

	// Generate refresh token with a longer expiration (7 days)
	refreshToken, err := server.tokenMaker.GenerateToken(user.ID, user.Email, server.config.REFRESHTOKENEXPIRESIN)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to generate refresh token: %v", err)
	}

	// Parse the refresh token expiration time
	refreshTokenDuration, err := time.ParseDuration(server.config.REFRESHTOKENEXPIRESIN)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "invalid refresh token expiration: %v", err)
	}

	// Create the session in the database with the refresh token
	session, err := server.store.CreateSession(ctx, db.CreateSessionParams{
		UserID:    uuid.NullUUID{UUID: user.ID, Valid: true},
		Token:     refreshToken,                         // Store the refresh token as the session token
		ExpiresAt: time.Now().Add(refreshTokenDuration), // session expires in 7 days
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create session: %v", err)
	}

	// Return response with the access and refresh tokens
	return &pb.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: session.Token,
		User: &pb.User{
			Id:               user.ID.String(),
			Name:             user.Name,
			Email:            user.Email,
			Role:             user.Role,
			OrganizationName: user.OrganizationName,
			CreatedAt:        user.CreatedAt.Time.Format("2006-01-02 15:04:05"),
		},
	}, nil
}

func (server *Server) GetUserByID(ctx context.Context, req *pb.GetUserRequest) (*pb.UserResponse, error) {
	// Retrieve the user from the database by ID
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

	// Return the user details in the response
	return &pb.UserResponse{
		User: &pb.User{
			Id:               user.Name,
			Name:             user.Name,
			Email:            user.Email,
			Role:             user.Role,
			OrganizationName: user.OrganizationName,
			CreatedAt:        user.CreatedAt.Time.Format("2006-01-02 15:04:05"),
		},
	}, nil
}

func (server *Server) GetUserByEmail(ctx context.Context, req *pb.GetUserByEmailRequest) (*pb.UserResponse, error) {
	email, err := uuid.Parse(req.GetEmail())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user ID: %v", err)
	}
	user, err := server.store.GetUserByID(ctx, email)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to retrieve user: %v", err)
	}

	// Return the user details in the response
	return &pb.UserResponse{
		User: &pb.User{
			Id:               user.Name,
			Name:             user.Name,
			Email:            user.Email,
			Role:             user.Role,
			OrganizationName: user.OrganizationName,
			CreatedAt:        user.CreatedAt.Time.Format("2006-01-02 15:04:05"),
		},
	}, nil
}

func (server *Server) UpdateUser(ctx context.Context, req *pb.UpdateUserRequest) (*pb.UserResponse, error) {
	// Retrieve the user from the database by ID
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

	// Prepare the updated user parameters
	arg := db.UpdateUserParams{
		ID:               user.ID,
		Name:             req.GetName(),
		Email:            req.GetEmail(),
		Role:             req.GetRole(),
		OrganizationName: req.GetOrganizationName(),
	}

	// Update the user in the database
	updatedUser, err := server.store.UpdateUser(ctx, arg)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update user: %v", err)
	}

	// Return the updated user details in the response
	return &pb.UserResponse{
		User: &pb.User{
			Id:               updatedUser.Name,
			Name:             updatedUser.Name,
			Email:            updatedUser.Email,
			Role:             updatedUser.Role,
			OrganizationName: updatedUser.OrganizationName,
			CreatedAt:        updatedUser.CreatedAt.Time.Format("2006-01-02 15:04:05"),
		},
	}, nil
}

func (server *Server) DeleteUser(ctx context.Context, req *pb.DeleteUserRequest) (*pb.DeleteUserResponse, error) {
	// Attempt to delete the user by ID
	id, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user ID: %v", err)
	}
	err = server.store.DeleteUser(ctx, id)
	if err != nil {
		// Handle the case where the user was not found or there's a database error
		if err == sql.ErrNoRows {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to delete user: %v", err)
	}

	// Return a successful response
	return &pb.DeleteUserResponse{
		Message: "User deleted successfully",
	}, nil
}

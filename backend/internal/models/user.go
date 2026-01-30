package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Username      string             `bson:"username" json:"username"`
	PasswordHash  string             `bson:"password_hash" json:"-"`
	ApiKey        string             `bson:"api_key,omitempty" json:"apiKey,omitempty"`
	TrialUsage    int                `bson:"trial_usage" json:"trialUsage"` // Count of system-key usages
	SolvedCount   int                `bson:"solved_count" json:"solvedCount"`
	LastSolveDate *time.Time         `bson:"last_solve_date,omitempty" json:"lastSolveDate,omitempty"`
	CreatedAt     time.Time          `bson:"created_at" json:"createdAt"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=30"`
	Password string `json:"password" binding:"required,min=6"`
	ApiKey   string `json:"apiKey"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

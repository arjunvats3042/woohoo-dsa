package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Submission struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    primitive.ObjectID `bson:"user_id" json:"userId"`
	ProblemID primitive.ObjectID `bson:"problem_id" json:"problemId"`
	Code      string             `bson:"code" json:"code"`
	Language  string             `bson:"language" json:"language"`
	Verdict   string             `bson:"verdict" json:"verdict"` // Accepted, Wrong Answer, Runtime Error, Compilation Error
	Feedback  string             `bson:"feedback" json:"feedback"`
	CreatedAt time.Time          `bson:"created_at" json:"createdAt"`
}

type SubmitRequest struct {
	ProblemID string `json:"problemId" binding:"required"`
	Code      string `json:"code" binding:"required"`
	Language  string `json:"language"`
	ApiKey    string `json:"apiKey"`
}

type SubmitResponse struct {
	Verdict  string `json:"verdict"`
	Feedback string `json:"feedback"`
	Passed   bool   `json:"passed"`
}

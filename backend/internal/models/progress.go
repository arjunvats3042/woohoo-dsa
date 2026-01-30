package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Progress struct {
	ID                    primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID                primitive.ObjectID `bson:"user_id" json:"userId"`
	ProblemID             primitive.ObjectID `bson:"problem_id" json:"problemId"`
	Status                string             `bson:"status" json:"status"`     // "attempted", "solved"
	Code                  string             `bson:"code" json:"code"`         // Last submitted code
	Language              string             `bson:"language" json:"language"` // "cpp", "python", etc.
	Attempts              int                `bson:"attempts" json:"attempts"`
	SuccessfulSubmissions int                `bson:"successful_submissions" json:"successfulSubmissions"`
	Notes                 string             `bson:"notes" json:"notes"`
	UpdatedAt             time.Time          `bson:"updated_at" json:"updatedAt"`
	LastAttemptedAt       time.Time          `bson:"last_attempted_at" json:"lastAttemptedAt"`
}

type UpdateNotesRequest struct {
	Notes string `json:"notes"`
}

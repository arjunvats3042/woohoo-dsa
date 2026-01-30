package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Comment struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ProblemID primitive.ObjectID `bson:"problem_id" json:"problemId"`
	UserID    primitive.ObjectID `bson:"user_id" json:"userId"`
	Username  string             `bson:"username" json:"username"`
	Content   string             `bson:"content" json:"content"`
	Likes     int                `bson:"likes" json:"likes"`
	CreatedAt time.Time          `bson:"created_at" json:"createdAt"`
}

type CreateCommentRequest struct {
	ProblemID string `json:"problemId" binding:"required"`
	Content   string `json:"content" binding:"required"`
}

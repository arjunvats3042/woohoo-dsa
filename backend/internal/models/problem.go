package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TestCase struct {
	Input    string `bson:"input" json:"input"`
	Expected string `bson:"expected" json:"expected"`
}

type Problem struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title         string             `bson:"title" json:"title"`
	Slug          string             `bson:"slug" json:"slug"`
	Difficulty    string             `bson:"difficulty" json:"difficulty"` // Easy, Medium, Hard
	Topic         string             `bson:"topic" json:"topic"`
	Description   string             `bson:"description" json:"description"`
	StarterCode   string             `bson:"starter_code" json:"starterCode"`
	TestCases     []TestCase         `bson:"test_cases" json:"testCases"`
	HintBrute     string             `bson:"hint_brute" json:"hintBrute"`
	HintOptimized string             `bson:"hint_optimized" json:"hintOptimized"`
	BestSolution  string             `bson:"best_solution" json:"bestSolution"`
	CreatedAt     time.Time          `bson:"created_at" json:"createdAt"`
}

type ProblemListItem struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title         string             `bson:"title" json:"title"`
	Slug          string             `bson:"slug" json:"slug"`
	Difficulty    string             `bson:"difficulty" json:"difficulty"`
	Topic         string             `bson:"topic" json:"topic"`
	TopicSequence int                `bson:"topic_sequence" json:"topicSequence"`
}

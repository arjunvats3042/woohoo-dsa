package handlers

import (
	"context"
	"net/http"
	"time"

	"woohoodsa/internal/database"
	"woohoodsa/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func GetProblems(c *gin.Context) {
	collection := database.GetCollection("problems")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	topic := c.Query("topic")
	difficulty := c.Query("difficulty")

	filter := bson.M{}
	if topic != "" {
		filter["topic"] = topic
	}
	if difficulty != "" {
		filter["difficulty"] = difficulty
	}

	// Include topic_sequence and sort by it for proper ordering
	opts := options.Find().
		SetProjection(bson.M{
			"_id":            1,
			"title":          1,
			"slug":           1,
			"difficulty":     1,
			"topic":          1,
			"topic_sequence": 1,
		}).
		SetSort(bson.D{
			{Key: "topic_sequence", Value: 1},
			{Key: "title", Value: 1},
		})

	cursor, err := collection.Find(ctx, filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch problems"})
		return
	}
	defer cursor.Close(ctx)

	var problems []models.ProblemListItem
	if err := cursor.All(ctx, &problems); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse problems"})
		return
	}

	c.JSON(http.StatusOK, problems)
}

func GetProblem(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid problem ID"})
		return
	}

	collection := database.GetCollection("problems")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var problem models.Problem
	err = collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&problem)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Problem not found"})
		return
	}

	c.JSON(http.StatusOK, problem)
}

func GetTopics(c *gin.Context) {
	collection := database.GetCollection("problems")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	topics, err := collection.Distinct(ctx, "topic", bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch topics"})
		return
	}

	c.JSON(http.StatusOK, topics)
}

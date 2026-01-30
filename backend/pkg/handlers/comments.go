package handlers

import (
	"context"
	"net/http"
	"time"

	"woohoodsa/pkg/database"
	"woohoodsa/pkg/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func GetComments(c *gin.Context) {
	problemID := c.Param("problemId")
	problemObjID, err := primitive.ObjectIDFromHex(problemID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid problem ID"})
		return
	}

	collection := database.GetCollection("comments")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	opts := options.Find().SetSort(bson.M{"created_at": -1})
	cursor, err := collection.Find(ctx, bson.M{"problem_id": problemObjID}, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comments"})
		return
	}
	defer cursor.Close(ctx)

	var comments []models.Comment
	if err := cursor.All(ctx, &comments); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse comments"})
		return
	}

	// Initialize empty slice if nil to return [] instead of null
	if comments == nil {
		comments = []models.Comment{}
	}

	c.JSON(http.StatusOK, comments)
}

func CreateComment(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	username := c.GetString("username")

	var req models.CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	problemObjID, err := primitive.ObjectIDFromHex(req.ProblemID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid problem ID"})
		return
	}

	comment := models.Comment{
		ID:        primitive.NewObjectID(),
		ProblemID: problemObjID,
		UserID:    userObjID,
		Username:  username,
		Content:   req.Content,
		Likes:     0,
		CreatedAt: time.Now(),
	}

	collection := database.GetCollection("comments")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err = collection.InsertOne(ctx, comment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create comment"})
		return
	}

	c.JSON(http.StatusCreated, comment)
}

func DeleteComment(c *gin.Context) {
	commentID := c.Param("id")
	commentObjID, err := primitive.ObjectIDFromHex(commentID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	userID := c.GetString("userID")
	userObjID, _ := primitive.ObjectIDFromHex(userID)

	collection := database.GetCollection("comments")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Only allow user to delete their own comment
	result, err := collection.DeleteOne(ctx, bson.M{
		"_id":     commentObjID,
		"user_id": userObjID,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete comment"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Comment not found or unauthorized"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted"})
}

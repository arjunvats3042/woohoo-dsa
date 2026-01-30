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

func GetProgress(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, _ := primitive.ObjectIDFromHex(userID)

	collection := database.GetCollection("progress")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{"user_id": userObjID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch progress"})
		return
	}
	defer cursor.Close(ctx)

	var progressList []models.Progress
	if err := cursor.All(ctx, &progressList); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse progress"})
		return
	}

	c.JSON(http.StatusOK, progressList)
}

func GetProblemProgress(c *gin.Context) {
	userID := c.GetString("userID")
	problemID := c.Param("problemId")

	userObjID, _ := primitive.ObjectIDFromHex(userID)
	problemObjID, err := primitive.ObjectIDFromHex(problemID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid problem ID"})
		return
	}

	collection := database.GetCollection("progress")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var progress models.Progress
	err = collection.FindOne(ctx, bson.M{
		"user_id":    userObjID,
		"problem_id": problemObjID,
	}).Decode(&progress)

	if err != nil {
		// Return default progress
		c.JSON(http.StatusOK, models.Progress{
			UserID:    userObjID,
			ProblemID: problemObjID,
			Status:    "unsolved",
			Attempts:  0,
			Notes:     "",
		})
		return
	}

	c.JSON(http.StatusOK, progress)
}

func UpdateNotes(c *gin.Context) {
	userID := c.GetString("userID")
	problemID := c.Param("problemId")

	var req models.UpdateNotesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userObjID, _ := primitive.ObjectIDFromHex(userID)
	problemObjID, err := primitive.ObjectIDFromHex(problemID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid problem ID"})
		return
	}

	collection := database.GetCollection("progress")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{
		"user_id":    userObjID,
		"problem_id": problemObjID,
	}

	update := bson.M{
		"$set": bson.M{
			"notes":      req.Notes,
			"updated_at": time.Now(),
		},
		"$setOnInsert": bson.M{
			"status":   "unsolved",
			"attempts": 0,
		},
	}

	opts := options.Update().SetUpsert(true)
	_, err = collection.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notes"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notes updated"})
}

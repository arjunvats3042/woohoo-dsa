package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"woohoodsa/pkg/database"
	"woohoodsa/pkg/models"
	"woohoodsa/pkg/services"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func SubmitCode(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, _ := primitive.ObjectIDFromHex(userID)

	var req models.SubmitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	problemObjID, err := primitive.ObjectIDFromHex(req.ProblemID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid problem ID"})
		return
	}

	// Fetch problem
	problemCollection := database.GetCollection("problems")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	var problem models.Problem
	err = problemCollection.FindOne(ctx, bson.M{"_id": problemObjID}).Decode(&problem)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Problem not found"})
		return
	}

	// Fetch user to get API key
	userCollection := database.GetCollection("users")
	var user models.User
	err = userCollection.FindOne(ctx, bson.M{"_id": userObjID}).Decode(&user)
	// Logic:
	// 1. If user has ApiKey -> Use it (Unlimited)
	// 2. If no ApiKey -> Check TrialUsage
	//    a. If < 3 -> Increment TrialUsage, Use System Key
	//    b. If >= 3 -> Error "Limit reached"

	apiKeyToUse := user.ApiKey

	if apiKeyToUse == "" {
		if user.TrialUsage >= 3 {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Trial limit reached (3/3). Please add your OpenRouter API Key in settings to continue.",
				"code":  "TRIAL_LIMIT_REACHED",
			})
			return
		}

		// Increment trial usage
		_, err := userCollection.UpdateOne(ctx, bson.M{"_id": userObjID}, bson.M{
			"$inc": bson.M{"trial_usage": 1},
		})
		if err != nil {
			// Log error but proceed? Or fail?
			// Proceed for user experience, worst case they get freebies
			fmt.Printf("Failed to increment trial usage: %v\n", err)
		}
	}

	// Evaluate with Gemini AI
	result, err := services.EvaluateCode(problem, req.Code, apiKeyToUse)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to evaluate code: " + err.Error()})
		return
	}

	// Save submission
	submission := models.Submission{
		ID:        primitive.NewObjectID(),
		UserID:    userObjID,
		ProblemID: problemObjID,
		Code:      req.Code,
		Language:  "cpp",
		Verdict:   result.Verdict,
		Feedback:  result.Feedback,
		CreatedAt: time.Now(),
	}

	submissionCollection := database.GetCollection("submissions")
	_, err = submissionCollection.InsertOne(ctx, submission)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save submission"})
		return
	}

	// Update progress
	updateProgress(ctx, userObjID, problemObjID, result.Passed)

	// Update user stats if accepted
	if result.Passed {
		updateUserStats(ctx, userObjID)
	}

	c.JSON(http.StatusOK, models.SubmitResponse{
		Verdict:  result.Verdict,
		Feedback: result.Feedback,
		Passed:   result.Passed,
	})
}

func updateProgress(ctx context.Context, userID, problemID primitive.ObjectID, passed bool) {
	collection := database.GetCollection("progress")

	filter := bson.M{
		"user_id":    userID,
		"problem_id": problemID,
	}

	update := bson.M{
		"$setOnInsert": bson.M{
			"status": "attempted",
		},
		"$set": bson.M{
			"last_attempted_at": time.Now(),
			"updated_at":        time.Now(),
		},
		"$inc": bson.M{
			"attempts": 1,
		},
	}

	if passed {
		update["$set"].(bson.M)["status"] = "solved"
		update["$inc"].(bson.M)["successful_submissions"] = 1
	}

	opts := options.Update().SetUpsert(true)
	collection.UpdateOne(ctx, filter, update, opts)
}

func updateUserStats(ctx context.Context, userID primitive.ObjectID) {
	collection := database.GetCollection("users")

	// Get count of solved problems
	progressCollection := database.GetCollection("progress")
	solvedCount, _ := progressCollection.CountDocuments(ctx, bson.M{
		"user_id": userID,
		"status":  "solved",
	})

	now := time.Now()
	collection.UpdateOne(ctx, bson.M{"_id": userID}, bson.M{
		"$set": bson.M{
			"solved_count":    solvedCount,
			"last_solve_date": now,
		},
	})
}

func GetSubmissions(c *gin.Context) {
	userID := c.GetString("userID")
	problemID := c.Param("problemId")

	userObjID, _ := primitive.ObjectIDFromHex(userID)
	problemObjID, err := primitive.ObjectIDFromHex(problemID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid problem ID"})
		return
	}

	collection := database.GetCollection("submissions")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	opts := options.Find().SetSort(bson.M{"created_at": -1}).SetLimit(10)
	cursor, err := collection.Find(ctx, bson.M{
		"user_id":    userObjID,
		"problem_id": problemObjID,
	}, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch submissions"})
		return
	}
	defer cursor.Close(ctx)

	var submissions []models.Submission
	if err := cursor.All(ctx, &submissions); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse submissions"})
		return
	}

	c.JSON(http.StatusOK, submissions)
}

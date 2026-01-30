package app

import (
	"log"

	"woohoodsa/pkg/config"
	"woohoodsa/pkg/database"
	"woohoodsa/pkg/handlers"
	"woohoodsa/pkg/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupServer() *gin.Engine {
	// Load configuration
	config.LoadConfig()

	// Connect to MongoDB
	// Note: In serverless, we might need to handle connection pooling carefully
	// But for now, standard connect is okay.
	if err := database.Connect(); err != nil {
		log.Printf("Failed to connect to MongoDB: %v", err)
	}

	// Setup Gin router
	r := gin.Default()

	// CORS configuration
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // Allow all for now, or restrict to Vercel URL later
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Public routes
	r.POST("/api/auth/register", handlers.Register)
	r.POST("/api/auth/login", handlers.Login)
	r.GET("/api/problems", handlers.GetProblems)
	r.GET("/api/problems/:id", handlers.GetProblem)
	r.GET("/api/topics", handlers.GetTopics)

	// Comment routes
	r.GET("/api/comments/:problemId", handlers.GetComments)

	// Protected routes
	protected := r.Group("/api")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.GET("/profile", handlers.GetProfile)
		protected.PUT("/apikey", handlers.UpdateApiKey)
		protected.GET("/progress", handlers.GetProgress)
		protected.GET("/progress/:problemId", handlers.GetProblemProgress)
		protected.PUT("/progress/:problemId/notes", handlers.UpdateNotes)
		protected.POST("/submit", handlers.SubmitCode)
		protected.GET("/submissions/:problemId", handlers.GetSubmissions)

		// Protected Comment routes
		protected.POST("/comments", handlers.CreateComment)
		protected.DELETE("/comments/:id", handlers.DeleteComment)
	}

	return r
}

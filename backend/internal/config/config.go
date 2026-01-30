package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	MongoDBURI       string
	DatabaseName     string
	JWTSecret        string
	OpenRouterAPIKey string
	Port             string
}

var AppConfig *Config

func LoadConfig() {
	// Try loading from current directory
	if err := godotenv.Load(); err != nil {
		// If running from cmd/server, .env might be two levels up
		if err := godotenv.Load("../../.env"); err != nil {
			log.Println("Warning: .env file not found, using environment variables")
		} else {
			log.Println("Loaded .env from project root")
		}
	}

	AppConfig = &Config{
		MongoDBURI:       getEnv("MONGODB_URI", "mongodb://localhost:27017"),
		DatabaseName:     getEnv("MONGODB_DATABASE", "woohoodsa"),
		JWTSecret:        getEnv("JWT_SECRET", "default-secret-key"),
		OpenRouterAPIKey: getEnv("OPENROUTER_API_KEY", ""),
		Port:             getEnv("PORT", "8080"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

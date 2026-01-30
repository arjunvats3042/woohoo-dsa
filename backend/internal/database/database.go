package database

import (
	"context"
	"crypto/tls"
	"log"
	"time"

	"woohoodsa/internal/config"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var DB *mongo.Database
var Client *mongo.Client

func Connect() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	serverAPI := options.ServerAPI(options.ServerAPIVersion1)

	// Create custom TLS config to skip verification
	tlsConfig := &tls.Config{InsecureSkipVerify: true}

	clientOptions := options.Client().
		ApplyURI(config.AppConfig.MongoDBURI).
		SetServerAPIOptions(serverAPI).
		SetTLSConfig(tlsConfig)

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return err
	}

	// Ping the database
	err = client.Ping(ctx, nil)
	if err != nil {
		return err
	}

	Client = client
	DB = client.Database(config.AppConfig.DatabaseName)
	log.Println("✓ Connected to MongoDB Atlas!")
	return nil
}

func Disconnect() {
	if Client != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		Client.Disconnect(ctx)
	}
}

func GetCollection(name string) *mongo.Collection {
	return DB.Collection(name)
}

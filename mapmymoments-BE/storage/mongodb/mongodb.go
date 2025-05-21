package mongodb

import (
	context "context"
	"fmt"
	"time"

	"github.com/atindraraut/crudgo/internal/config"
	"github.com/atindraraut/crudgo/internal/types"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoDB struct {
	client     *mongo.Client
	database   *mongo.Database
	collection *mongo.Collection
}

func New(cfg *config.Config) (*MongoDB, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(cfg.MongoURI))
	if err != nil {
		return nil, err
	}
	db := client.Database(cfg.MongoDatabase)
	coll := db.Collection("students")
	mdb := &MongoDB{client: client, database: db, collection: coll}

	// Ensure OTP TTL index exists
	if err := mdb.ensureOTPTTLIndex(); err != nil {
		return nil, fmt.Errorf("failed to ensure OTP TTL index: %w", err)
	}

	return mdb, nil
}

func (m *MongoDB) CreateStudent(name string, age int, email string) (int64, error) {
	doc := bson.M{"name": name, "age": age, "email": email}
	res, err := m.collection.InsertOne(context.Background(), doc)
	if err != nil {
		return 0, err
	}
	id, ok := res.InsertedID.(primitive.ObjectID)
	if !ok {
		return 0, fmt.Errorf("failed to get inserted ID")
	}
	return int64(id.Timestamp().Unix()), nil // Not a real int64 ID, but for interface compatibility
}

func (m *MongoDB) GetStudentById(id int64) (types.Student, error) {
	var student types.Student
	// This is a placeholder: you should use a string or ObjectID for MongoDB IDs
	return student, fmt.Errorf("GetStudentById not implemented for MongoDB with int64 IDs")
}

func (m *MongoDB) GetAllStudents() ([]types.Student, error) {
	ctx := context.Background()
	cur, err := m.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	var students []types.Student
	for cur.Next(ctx) {
		var s types.Student
		if err := cur.Decode(&s); err != nil {
			return nil, err
		}
		students = append(students, s)
	}
	return students, nil
}

func (m *MongoDB) UpdateStudent(id int64, name string, age int, email string) (int64, error) {
	// Placeholder: implement using MongoDB's update logic
	return 0, fmt.Errorf("UpdateStudent not implemented for MongoDB with int64 IDs")
}

func (m *MongoDB) DeleteStudent(id int64) (int64, error) {
	// Placeholder: implement using MongoDB's delete logic
	return 0, fmt.Errorf("DeleteStudent not implemented for MongoDB with int64 IDs")
}

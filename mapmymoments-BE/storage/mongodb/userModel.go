package mongodb

import (
	context "context"
	"errors"

	"github.com/atindraraut/crudgo/internal/types"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func (m *MongoDB) GetUserByEmail(email string) (types.UserData, error) {
	//write the implementation to get user by email
	var user types.UserData
	ctx := context.Background()
	coll := m.database.Collection("users")
	err := coll.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return types.UserData{}, nil // User not found
		}
		return types.UserData{}, err // Other error
	}
	return user, nil
}

func (m *MongoDB) CreateUser(user types.UserData) (int64, error) {
	ctx := context.Background()
	coll := m.database.Collection("users")

	// Check if user already exists by email
	var existing types.UserData
	err := coll.FindOne(ctx, bson.M{"email": user.Email}).Decode(&existing)
	if err == nil {
		return 0, errors.New("user with this email already exists")
	}
	if err != mongo.ErrNoDocuments {
		return 0, err
	}

	res, err := coll.InsertOne(ctx, user)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return 0, errors.New("email already exists")
		}
		return 0, err
	}
	id, ok := res.InsertedID.(primitive.ObjectID)
	if !ok {
		return 0, errors.New("failed to get inserted ID")
	}
	return int64(id.Timestamp().Unix()), nil // Not a real int64 ID, but for interface compatibility
}
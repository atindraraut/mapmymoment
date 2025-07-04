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

func (m *MongoDB) UpdateUserPassword(email, hashedPassword string) error {
	ctx := context.Background()
	coll := m.database.Collection("users")
	update := bson.M{"$set": bson.M{"password": hashedPassword}}
	_, err := coll.UpdateOne(ctx, bson.M{"email": email}, update)
	return err
}

func (m *MongoDB) GetUserByGoogleID(googleID string) (types.UserData, error) {
	var user types.UserData
	ctx := context.Background()
	coll := m.database.Collection("users")
	err := coll.FindOne(ctx, bson.M{"googleid": googleID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return types.UserData{}, nil // User not found
		}
		return types.UserData{}, err // Other error
	}
	return user, nil
}

func (m *MongoDB) CreateOrUpdateGoogleUser(user types.UserData) (int64, error) {
	ctx := context.Background()
	coll := m.database.Collection("users")

	// Check if user exists by email
	var existing types.UserData
	err := coll.FindOne(ctx, bson.M{"email": user.Email}).Decode(&existing)
	
	if err == nil {
		// User exists, update with Google ID and auth type
		update := bson.M{
			"$set": bson.M{
				"googleid": user.GoogleID,
				"authtype": "both",
				"firstname": user.FirstName,
				"lastname": user.LastName,
			},
		}
		_, err := coll.UpdateOne(ctx, bson.M{"email": user.Email}, update)
		if err != nil {
			return 0, err
		}
		return int64(primitive.NewObjectID().Timestamp().Unix()), nil
	} else if err != mongo.ErrNoDocuments {
		return 0, err
	}

	// User doesn't exist, create new OAuth user
	res, err := coll.InsertOne(ctx, user)
	if err != nil {
		return 0, err
	}
	id, ok := res.InsertedID.(primitive.ObjectID)
	if !ok {
		return 0, errors.New("failed to get inserted ID")
	}
	return int64(id.Timestamp().Unix()), nil
}

func (m *MongoDB) UnlinkGoogleAccount(email string) error {
	ctx := context.Background()
	coll := m.database.Collection("users")
	
	update := bson.M{
		"$unset": bson.M{"googleid": ""},
		"$set":   bson.M{"authtype": "email"},
	}
	
	_, err := coll.UpdateOne(ctx, bson.M{"email": email}, update)
	return err
}
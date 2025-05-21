package mongodb

import (
	"context"

	"github.com/atindraraut/crudgo/internal/types"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func (m *MongoDB) SaveOTPRecord(record types.OTPRecord) error {
	ctx := context.Background()
	coll := m.database.Collection("otp_records")
	_, err := coll.InsertOne(ctx, record)
	return err
}

func (m *MongoDB) GetOTPRecordByEmail(email string) (types.OTPRecord, error) {
	ctx := context.Background()
	coll := m.database.Collection("otp_records")
	var record types.OTPRecord
	err := coll.FindOne(ctx, bson.M{"email": email}).Decode(&record)
	if err == mongo.ErrNoDocuments {
		return types.OTPRecord{}, nil
	}
	return record, err
}

func (m *MongoDB) DeleteOTPRecordByEmail(email string) error {
	ctx := context.Background()
	coll := m.database.Collection("otp_records")
	_, err := coll.DeleteOne(ctx, bson.M{"email": email})
	return err
}

func (m *MongoDB) ensureOTPTTLIndex() error {
	ctx := context.Background()
	coll := m.database.Collection("otp_records")
	indexModel := mongo.IndexModel{
		Keys:    bson.M{"expires_at": 1},
		Options: options.Index().SetExpireAfterSeconds(0),
	}
	_, err := coll.Indexes().CreateOne(ctx, indexModel)
	return err
}

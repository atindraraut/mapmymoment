package mongodb

import (
	context "context"
	"errors"
	"time"
	"github.com/atindraraut/crudgo/internal/types"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)


func (m *MongoDB) CreateRoute(route interface{}) (string, error) {
	ctx := context.Background()
	coll := m.database.Collection("routes")
	r, ok := route.(types.Route)
	if !ok {
		return "", errors.New("invalid route type")
	}
	if r.ID == "" {
		r.ID = primitive.NewObjectID().Hex()
	}
	if r.CreatedAt == 0 {
		r.CreatedAt = time.Now().UnixMilli()
	}
	if r.UpdatedAt == 0 {
		r.UpdatedAt = r.CreatedAt
	}
	_, err := coll.InsertOne(ctx, r)
	if err != nil {
		return "", err
	}
	return r.ID, nil
}

func (m *MongoDB) GetRouteById(id string) (interface{}, error) {
	ctx := context.Background()
	coll := m.database.Collection("routes")
	var route types.Route
	err := coll.FindOne(ctx, bson.M{"_id": id}).Decode(&route)
	if err != nil {
		if err.Error() == "mongo: no documents in result" {
			return nil, nil
		}
		return nil, err
	}
	return route, nil
}

func (m *MongoDB) GetAllRoutes() ([]interface{}, error) {
	ctx := context.Background()
	coll := m.database.Collection("routes")
	cur, err := coll.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	var routes []interface{}
	for cur.Next(ctx) {
		var r types.Route
		if err := cur.Decode(&r); err != nil {
			return nil, err
		}
		routes = append(routes, r)
	}
	return routes, nil
}

func (m *MongoDB) UpdateRoute(id string, route interface{}) (string, error) {
    ctx := context.Background()
    coll := m.database.Collection("routes")
    r, ok := route.(types.Route)
    if !ok {
        return "", errors.New("invalid route type")
    }
    r.UpdatedAt = time.Now().UnixMilli()

    // Convert to bson.M and remove _id
    updateDoc, err := bson.Marshal(r)
    if err != nil {
        return "", err
    }
    var updateMap bson.M
    if err := bson.Unmarshal(updateDoc, &updateMap); err != nil {
        return "", err
    }
    delete(updateMap, "_id")

    res, err := coll.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": updateMap})
    if err != nil {
        return "", err
    }
    if res.MatchedCount == 0 {
        return "", errors.New("route not found")
    }
    return id, nil
}

func (m *MongoDB) DeleteRoute(id string) (string, error) {
	ctx := context.Background()
	coll := m.database.Collection("routes")
	res, err := coll.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return "", err
	}
	if res.DeletedCount == 0 {
		return "", errors.New("route not found")
	}
	return id, nil
}

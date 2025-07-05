package mongodb

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/atindraraut/crudgo/internal/types"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const cloudfrontDomain = "https://your-cloudfront-domain.cloudfront.net"

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

	// Initialize sharing fields for new routes
	if r.SharedWith == nil {
		r.SharedWith = []types.SharedUser{}
	}
	r.IsPublic = false // Default to private

	// Ensure `photos` field is included when creating a route
	if len(r.Photos) > 0 {
		for i, photo := range r.Photos {
			if photo.CloudfrontUrl == "" {
				r.Photos[i].CloudfrontUrl = fmt.Sprintf("%s/%s/%s", cloudfrontDomain, r.ID, photo.Filename)
			}
		}
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
	
	// Handle legacy routes that don't have sharing fields
	if route.SharedWith == nil {
		route.SharedWith = []types.SharedUser{}
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
		
		// Handle legacy routes that don't have sharing fields
		if r.SharedWith == nil {
			r.SharedWith = []types.SharedUser{}
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

	// Initialize sharing fields if they don't exist
	if r.SharedWith == nil {
		r.SharedWith = []types.SharedUser{}
	}

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

// Route sharing methods
func (m *MongoDB) GenerateRouteShareToken(routeId string, expiryHours *int) (string, error) {
	ctx := context.Background()
	coll := m.database.Collection("routes")
	
	// Generate a unique token
	token := primitive.NewObjectID().Hex()
	
	// Calculate expiry time if provided
	var expiryTime *time.Time
	if expiryHours != nil {
		expiry := time.Now().Add(time.Duration(*expiryHours) * time.Hour)
		expiryTime = &expiry
	}
	
	// Update the route with share token
	update := bson.M{
		"$set": bson.M{
			"shareToken": token,
			"shareTokenExpiry": expiryTime,
			"updatedAt": time.Now().UnixMilli(),
		},
	}
	
	res, err := coll.UpdateOne(ctx, bson.M{"_id": routeId}, update)
	if err != nil {
		return "", err
	}
	if res.MatchedCount == 0 {
		return "", errors.New("route not found")
	}
	
	return token, nil
}

func (m *MongoDB) GetRouteByShareToken(token string) (interface{}, error) {
	ctx := context.Background()
	coll := m.database.Collection("routes")
	
	var route types.Route
	filter := bson.M{"shareToken": token}
	
	// Check if token is not expired
	filter["$or"] = []bson.M{
		{"shareTokenExpiry": bson.M{"$exists": false}},
		{"shareTokenExpiry": nil},
		{"shareTokenExpiry": bson.M{"$gt": time.Now()}},
	}
	
	err := coll.FindOne(ctx, filter).Decode(&route)
	if err != nil {
		if err.Error() == "mongo: no documents in result" {
			return nil, errors.New("share token not found or expired")
		}
		return nil, err
	}
	
	return route, nil
}

func (m *MongoDB) AddUserToSharedRoute(routeId, userId, email string) error {
	ctx := context.Background()
	coll := m.database.Collection("routes")
	
	// Check if user is already in the shared list
	var route types.Route
	err := coll.FindOne(ctx, bson.M{"_id": routeId}).Decode(&route)
	if err != nil {
		return err
	}
	
	// Initialize sharedWith array if it's null
	if route.SharedWith == nil {
		route.SharedWith = []types.SharedUser{}
	}
	
	// Check if user is already shared with this route
	for _, user := range route.SharedWith {
		if user.UserID == userId {
			return nil // User already has access
		}
	}
	
	// Add user to shared list
	sharedUser := types.SharedUser{
		UserID:     userId,
		Email:      email,
		Permission: "upload",
		SharedAt:   time.Now(),
	}
	
	// First, ensure the sharedWith field exists as an empty array if it's null
	// This handles the case where legacy routes have null sharedWith
	initUpdate := bson.M{
		"$set": bson.M{
			"sharedWith": []types.SharedUser{},
		},
	}
	
	// Only update if sharedWith is null
	_, err = coll.UpdateOne(ctx, bson.M{"_id": routeId, "sharedWith": nil}, initUpdate)
	// Ignore error if no documents match (sharedWith is not null)
	
	// Now safely push the new user to the array
	pushUpdate := bson.M{
		"$addToSet": bson.M{"sharedWith": sharedUser},
		"$set": bson.M{"updatedAt": time.Now().UnixMilli()},
	}
	
	_, err = coll.UpdateOne(ctx, bson.M{"_id": routeId}, pushUpdate)
	if err != nil {
		return err
	}
	
	// Also add to route_shares collection for easier querying
	sharesColl := m.database.Collection("route_shares")
	routeShare := types.RouteShare{
		UserID:     userId,
		RouteID:    routeId,
		Permission: "upload",
		SharedAt:   time.Now(),
	}
	
	_, err = sharesColl.InsertOne(ctx, routeShare)
	if err != nil {
		// Don't fail if this insert fails as the main route update succeeded
		fmt.Printf("Warning: Failed to insert route share record: %v\n", err)
	}
	
	return nil
}

func (m *MongoDB) GetSharedRoutesForUser(userId string) ([]interface{}, error) {
	ctx := context.Background()
	coll := m.database.Collection("routes")
	
	// Find routes where user is in the sharedWith array
	filter := bson.M{"sharedWith.userId": userId}
	
	cur, err := coll.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	
	var routes []interface{}
	for cur.Next(ctx) {
		var route types.Route
		if err := cur.Decode(&route); err != nil {
			return nil, err
		}
		
		// Handle legacy routes that don't have sharing fields
		if route.SharedWith == nil {
			route.SharedWith = []types.SharedUser{}
		}
		
		routes = append(routes, route)
	}
	
	return routes, nil
}

func (m *MongoDB) GetUsersByRouteId(routeId string) ([]types.UserData, error) {
	ctx := context.Background()
	coll := m.database.Collection("routes")
	
	var route types.Route
	err := coll.FindOne(ctx, bson.M{"_id": routeId}).Decode(&route)
	if err != nil {
		return nil, err
	}
	
	var users []types.UserData
	usersColl := m.database.Collection("users")
	
	// Get creator
	var creator types.UserData
	err = usersColl.FindOne(ctx, bson.M{"email": route.CreatorID}).Decode(&creator)
	if err == nil {
		users = append(users, creator)
	}
	
	// Get shared users
	for _, sharedUser := range route.SharedWith {
		var user types.UserData
		err = usersColl.FindOne(ctx, bson.M{"email": sharedUser.Email}).Decode(&user)
		if err == nil {
			users = append(users, user)
		}
	}
	
	return users, nil
}

func (m *MongoDB) CheckUserRoutePermission(userId, routeId string) (string, error) {
	ctx := context.Background()
	coll := m.database.Collection("routes")
	
	var route types.Route
	err := coll.FindOne(ctx, bson.M{"_id": routeId}).Decode(&route)
	if err != nil {
		if err.Error() == "mongo: no documents in result" {
			return "", nil // Route not found
		}
		return "", err
	}
	
	// Check if user is creator
	if route.CreatorID == userId {
		return "owner", nil
	}
	
	// Handle legacy routes that don't have sharing fields
	if route.SharedWith == nil {
		return "", nil // No permission for legacy routes
	}
	
	// Check if user is in shared list
	for _, sharedUser := range route.SharedWith {
		if sharedUser.UserID == userId {
			return sharedUser.Permission, nil
		}
	}
	
	return "", nil // No permission
}

func (m *MongoDB) RevokeRouteShare(routeId string) error {
	ctx := context.Background()
	coll := m.database.Collection("routes")
	
	// Remove share token and clear shared users
	update := bson.M{
		"$unset": bson.M{
			"shareToken": "",
			"shareTokenExpiry": "",
		},
		"$set": bson.M{
			"sharedWith": []types.SharedUser{},
			"updatedAt": time.Now().UnixMilli(),
		},
	}
	
	_, err := coll.UpdateOne(ctx, bson.M{"_id": routeId}, update)
	if err != nil {
		return err
	}
	
	// Clean up route_shares collection
	sharesColl := m.database.Collection("route_shares")
	_, err = sharesColl.DeleteMany(ctx, bson.M{"routeId": routeId})
	if err != nil {
		fmt.Printf("Warning: Failed to clean up route shares: %v\n", err)
	}
	
	return nil
}

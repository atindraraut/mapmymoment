package types

import "time"

type Route struct {
	ID                    string       `json:"_id" bson:"_id"`
	Name                  string       `json:"name" bson:"name"`
	CreatorID             string       `json:"creatorId" bson:"creatorId"`
	Origin                Waypoint     `json:"origin" bson:"origin"`
	Destination           Waypoint     `json:"destination" bson:"destination"`
	IntermediateWaypoints []Waypoint   `json:"intermediateWaypoints" bson:"intermediateWaypoints"`
	Photos                []Photo      `json:"photos" bson:"photos"`
	CreatedAt             int64        `json:"createdAt" bson:"createdAt"`
	UpdatedAt             int64        `json:"updatedAt" bson:"updatedAt"`
	IsPublic              bool         `json:"isPublic" bson:"isPublic"`
	SharedWith            []SharedUser `json:"sharedWith" bson:"sharedWith"`
	ShareToken            string       `json:"shareToken,omitempty" bson:"shareToken,omitempty"`
	ShareTokenExpiry      *time.Time   `json:"shareTokenExpiry,omitempty" bson:"shareTokenExpiry,omitempty"`
}

type Waypoint struct {
	ID      string  `json:"id" bson:"id"`
	Lat     float64 `json:"lat" bson:"lat"`
	Lng     float64 `json:"lng" bson:"lng"`
	Name    string  `json:"name" bson:"name"`
	Address string  `json:"address" bson:"address"`
}

type Photo struct {
	Filename      string `json:"filename" bson:"filename"`
	CloudfrontUrl string `json:"cloudfrontUrl" bson:"cloudfrontUrl"`
}

type SharedUser struct {
	UserID     string    `json:"userId" bson:"userId"`
	Email      string    `json:"email" bson:"email"`
	Permission string    `json:"permission" bson:"permission"` // "upload" for now
	SharedAt   time.Time `json:"sharedAt" bson:"sharedAt"`
}

type RouteShare struct {
	UserID     string    `json:"userId" bson:"userId"`
	RouteID    string    `json:"routeId" bson:"routeId"`
	Permission string    `json:"permission" bson:"permission"`
	SharedAt   time.Time `json:"sharedAt" bson:"sharedAt"`
}

type ShareRouteRequest struct {
	ExpiryHours *int `json:"expiryHours,omitempty"` // Optional expiry in hours
}

type ShareRouteResponse struct {
	ShareToken string     `json:"shareToken"`
	ExpiresAt  *time.Time `json:"expiresAt,omitempty"`
}

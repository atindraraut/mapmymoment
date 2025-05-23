package types

type Route struct {
	ID                    string     `json:"_id" bson:"_id"`
	Name                  string     `json:"name" bson:"name"`
	CreatorID             string     `json:"creatorId" bson:"creatorId"`
	Origin                Waypoint   `json:"origin" bson:"origin"`
	Destination           Waypoint   `json:"destination" bson:"destination"`
	IntermediateWaypoints []Waypoint `json:"intermediateWaypoints" bson:"intermediateWaypoints"`
	Photos                []Photo    `json:"photos" bson:"photos"`
	CreatedAt             int64      `json:"createdAt" bson:"createdAt"`
	UpdatedAt             int64      `json:"updatedAt" bson:"updatedAt"`
}

type Waypoint struct {
	ID      string  `json:"id" bson:"id"`
	Lat     float64 `json:"lat" bson:"lat"`
	Lng     float64 `json:"lng" bson:"lng"`
	Name    string  `json:"name" bson:"name"`
	Address string  `json:"address" bson:"address"`
}

type Photo struct {
	ID             string   `json:"id" bson:"id"`
	URL            string   `json:"url" bson:"url"`
	Location       Location `json:"location" bson:"location"`
	Description    string   `json:"description" bson:"description"`
	LocationSource string   `json:"locationSource" bson:"locationSource"`
}

type Location struct {
	Lat float64 `json:"lat" bson:"lat"`
	Lng float64 `json:"lng" bson:"lng"`
}

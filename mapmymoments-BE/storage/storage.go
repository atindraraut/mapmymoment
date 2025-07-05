package storage

import "github.com/atindraraut/crudgo/internal/types"

type Storage interface {
	GetUserByEmail(email string) (types.UserData, error)
	CreateUser(user types.UserData) (int64, error)
	GetOTPRecordByEmail(email string) (types.OTPRecord, error)
	SaveOTPRecord(record types.OTPRecord) error
	DeleteOTPRecordByEmail(email string) error
	// Route CRUD
	CreateRoute(route interface{}) (string, error)
	GetRouteById(id string) (interface{}, error)
	GetAllRoutes() ([]interface{}, error)
	UpdateRoute(id string, route interface{}) (string, error)
	DeleteRoute(id string) (string, error)
	UpdateUserPassword(email, hashedPassword string) error
	// OAuth methods
	GetUserByGoogleID(googleID string) (types.UserData, error)
	CreateOrUpdateGoogleUser(user types.UserData) (int64, error)
	UnlinkGoogleAccount(email string) error
	// Route sharing methods
	GenerateRouteShareToken(routeId string, expiryHours *int) (string, error)
	GetRouteByShareToken(token string) (interface{}, error)
	AddUserToSharedRoute(routeId, userId, email string) error
	GetSharedRoutesForUser(userId string) ([]interface{}, error)
	GetUsersByRouteId(routeId string) ([]types.UserData, error)
	CheckUserRoutePermission(userId, routeId string) (string, error) // returns permission level or empty string
	RevokeRouteShare(routeId string) error
}

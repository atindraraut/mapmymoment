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
}

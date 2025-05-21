package storage

import "github.com/atindraraut/crudgo/internal/types"
type Storage interface {
	CreateStudent(name string, age int,email string) (int64 , error)
	GetStudentById(id int64) (types.Student, error)
	GetAllStudents() ([]types.Student, error)
	UpdateStudent(id int64, name string, age int, email string) (int64, error)
	DeleteStudent(id int64) (int64, error)
	GetUserByEmail(email string) (types.UserData, error)
	CreateUser(user types.UserData) (int64, error)
	GetOTPRecordByEmail(email string) (types.OTPRecord, error)
	SaveOTPRecord(record types.OTPRecord) (error)
	DeleteOTPRecordByEmail(email string) ( error)
}


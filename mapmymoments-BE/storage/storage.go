package storage

import "github.com/atindraraut/crudgo/internal/types"
type Storage interface {
	CreateStudent(name string, age int,email string) (int64 , error)
	GetStudentById(id int64) (types.Student, error)
	GetAllStudents() ([]types.Student, error)
	UpdateStudent(id int64, name string, age int, email string) (int64, error)
	DeleteStudent(id int64) (int64, error)
}


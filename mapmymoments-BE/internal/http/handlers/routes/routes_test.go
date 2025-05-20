package routes

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/atindraraut/crudgo/internal/types"
	"github.com/atindraraut/crudgo/storage"
	"github.com/stretchr/testify/assert"
)

type mockStorage struct{}

func (m *mockStorage) CreateStudent(name string, age int, email string) (int64, error) {
	return 1, nil
}
func (m *mockStorage) GetStudentById(id int64) (types.Student, error) {
	return types.Student{Id: id, Name: "Test", Age: 20, Email: "test@example.com"}, nil
}
func (m *mockStorage) GetAllStudents() ([]types.Student, error) {
	return []types.Student{{Id: 1, Name: "Test", Age: 20, Email: "test@example.com"}}, nil
}
func (m *mockStorage) UpdateStudent(id int64, name string, age int, email string) (int64, error) {
	return id, nil
}
func (m *mockStorage) DeleteStudent(id int64) (int64, error) {
	return id, nil
}

var _ storage.Storage = (*mockStorage)(nil) // Ensure mockStorage implements storage.Storage

func TestRegisterRoutes(t *testing.T) {
	router := http.NewServeMux()
	mock := &mockStorage{}
	RegisterRoutes(router, mock)

	t.Run("GET /api/students", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/students", nil)
		rw := httptest.NewRecorder()
		router.ServeHTTP(rw, req)
		assert.Equal(t, http.StatusOK, rw.Code)
	})

	t.Run("POST /api/students", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/api/students", nil)
		rw := httptest.NewRecorder()
		router.ServeHTTP(rw, req)
		assert.Equal(t, http.StatusBadRequest, rw.Code)
	})

	t.Run("GET /api/students/{id}", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/students/1", nil)
		rw := httptest.NewRecorder()
		router.ServeHTTP(rw, req)
		assert.Equal(t, http.StatusOK, rw.Code)
	})

	t.Run("PUT /api/students/{id}", func(t *testing.T) {
		req := httptest.NewRequest("PUT", "/api/students/1", nil)
		rw := httptest.NewRecorder()
		router.ServeHTTP(rw, req)
		assert.Equal(t, http.StatusBadRequest, rw.Code)
	})

	t.Run("DELETE /api/students/{id}", func(t *testing.T) {
		req := httptest.NewRequest("DELETE", "/api/students/1", nil)
		rw := httptest.NewRecorder()
		router.ServeHTTP(rw, req)
		assert.Equal(t, http.StatusOK, rw.Code)
	})
}

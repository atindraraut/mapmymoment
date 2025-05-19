package routes

import (
	"net/http"

	"github.com/atindraraut/crudgo/storage"
)

func RegisterRoutes(router *http.ServeMux, storage storage.Storage) {
	// Registering routes for student handlers
	router.Handle("POST /api/students", http.HandlerFunc(New(storage)))
	router.Handle("GET /api/students/{id}", http.HandlerFunc(GetById(storage)))
	router.Handle("GET /api/students", http.HandlerFunc(Getlist(storage)))
	router.Handle("PUT /api/students/{id}", http.HandlerFunc(Update(storage)))
	router.Handle("DELETE /api/students/{id}", http.HandlerFunc(Delete(storage)))
}

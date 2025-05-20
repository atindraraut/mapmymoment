package auth

import (
	"net/http"

	"github.com/atindraraut/crudgo/storage"
)

func RegisterRoutes(router *http.ServeMux, storage storage.Storage) {
	// Registering routes for student handlers
	router.Handle("POST /auth/signup", http.HandlerFunc(signup(storage)) )
	router.Handle("POST /auth/login", http.HandlerFunc(login(storage)) )
	router.Handle("POST /auth/refresh", http.HandlerFunc(refresh(storage)) )
}

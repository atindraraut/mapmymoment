package auth

import (
	"net/http"
	"github.com/atindraraut/crudgo/storage"
)

func signup(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Handle signup logic here
	}
}
func login(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Handle login logic here
	}
}
func refresh(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Handle refresh logic here
	}
}
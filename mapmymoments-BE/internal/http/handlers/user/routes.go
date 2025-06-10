package user

import (
	"net/http"

	"github.com/atindraraut/crudgo/storage"
)

func RegisterRoutes(router *http.ServeMux, storage storage.Storage) {
	// Registering routes for auth handlers
	router.Handle("POST /user/signup", http.HandlerFunc(signup(storage)))
	router.Handle("POST /user/login", http.HandlerFunc(login(storage)))
	router.Handle("POST /user/verify-otp", http.HandlerFunc(verifyOTP(storage)))
	router.Handle("POST /user/refresh", http.HandlerFunc(refresh(storage)))
	router.Handle("POST /user/request-reset", http.HandlerFunc(requestPasswordReset(storage)))
	router.Handle("POST /user/reset-password", http.HandlerFunc(resetPassword(storage)))
}

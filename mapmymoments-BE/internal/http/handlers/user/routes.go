package user

import (
	"net/http"

	"github.com/atindraraut/crudgo/internal/utils/middleware"
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
	// OAuth routes
	router.Handle("GET /user/oauth/google/url", http.HandlerFunc(googleOAuthURL(storage)))
	router.Handle("POST /user/oauth/google/callback", http.HandlerFunc(googleOAuthCallback(storage)))
	// Protected OAuth routes (require authentication)
	router.Handle("GET /user/auth-info", middleware.AuthMiddleware(storage)(http.HandlerFunc(getUserAuthInfo(storage))))
	router.Handle("POST /user/unlink-google", middleware.AuthMiddleware(storage)(http.HandlerFunc(unlinkGoogleAccount(storage))))
}

package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"strings"
	"time"

	auth "github.com/atindraraut/crudgo/internal/utils/helpers"
	"github.com/atindraraut/crudgo/storage"
)

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(code int) {
	r.status = code
	r.ResponseWriter.WriteHeader(code)
}

// TimeTracker logs the duration and status code of each request
func TimeTracker(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rec := &statusRecorder{ResponseWriter: w, status: 200} // default to 200
		start := time.Now()
		next.ServeHTTP(rec, r)
		duration := time.Since(start)
		slog.Info("Request duration", slog.String("method", r.Method), slog.String("path", r.URL.Path), slog.Int("status", rec.status), slog.Duration("duration", duration))
	})
}

// UserContextKey is the key for user data in request context
var UserContextKey = &struct{}{}

type AuthUser struct {
	Email     string
	FirstName string
	LastName  string
	Uid       string
}

// AuthMiddleware validates JWT, fetches user from DB, and populates user data in request context
func AuthMiddleware(storage storage.Storage) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if header == "" || !strings.HasPrefix(header, "Bearer ") {
				http.Error(w, "Missing or invalid Authorization header", http.StatusUnauthorized)
				return
			}
			tokenStr := strings.TrimPrefix(header, "Bearer ")
			details, msg := auth.VerifyToken(tokenStr)
			if msg != "nil" {
				http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
				return
			}
			// Fetch user from DB using storage interface
			userData, err := storage.GetUserByEmail(details.Email)
			if err != nil {
				http.Error(w, "User not found", http.StatusUnauthorized)
				return
			}
			user := &AuthUser{
				Email:     userData.Email,
				FirstName: userData.FirstName,
				LastName:  userData.LastName,
				Uid:       userData.Email, // Use Email as UID since UserData has no Uid field
			}
			ctx := context.WithValue(r.Context(), UserContextKey, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetAuthUser extracts user data from request context
func GetAuthUser(r *http.Request) *AuthUser {
	user, _ := r.Context().Value(UserContextKey).(*AuthUser)
	return user
}

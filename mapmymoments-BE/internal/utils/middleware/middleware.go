package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"strings"
	"sync"
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

// CORS middleware
func CorsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// RateLimiter middleware to limit requests per IP
func RateLimiter(next http.Handler) http.Handler {
	// Set rate limit: 100 requests per minute per IP
	const maxRequests = 100
	const windowSeconds = 60

	// Store for tracking request counts per IP
	type client struct {
		count    int
		lastSeen time.Time
	}

	// Thread-safe map to track clients
	var (
		clients = make(map[string]*client)
		mu      sync.Mutex
	)

	// Cleanup goroutine to prevent memory leaks
	go func() {
		for {
			time.Sleep(time.Minute)
			mu.Lock()
			for ip, client := range clients {
				if time.Since(client.lastSeen) > time.Minute*5 {
					delete(clients, ip)
				}
			}
			mu.Unlock()
		}
	}()

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get client IP
		ip := r.RemoteAddr
		if fwdIP := r.Header.Get("X-Forwarded-For"); fwdIP != "" {
			// Use the first IP in X-Forwarded-For if available
			ip = strings.Split(fwdIP, ",")[0]
		} else {
			// Remove port from IP if present
			ip = strings.Split(ip, ":")[0]
		}

		mu.Lock()
		if clients[ip] == nil {
			clients[ip] = &client{count: 0, lastSeen: time.Now()}
		}

		// Reset counter if window has passed
		if time.Since(clients[ip].lastSeen).Seconds() > windowSeconds {
			clients[ip].count = 0
			clients[ip].lastSeen = time.Now()
		}

		// Increment counter
		clients[ip].count++
		count := clients[ip].count       // Store count for logging
		lastSeen := clients[ip].lastSeen // Store lastSeen for logging
		exceeded := count > maxRequests
		mu.Unlock()

		// Log after incrementing
		slog.Warn("RateLimiter: Client IP", slog.String("ip", ip), slog.Int("count", count), slog.Time("lastSeen", lastSeen))

		if exceeded {
			w.WriteHeader(http.StatusTooManyRequests)
			w.Write([]byte("Rate limit exceeded. Try again later."))
			return
		}

		next.ServeHTTP(w, r)
	})
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
			// Check if the token is a JWT
			details, msg := auth.VerifyToken(tokenStr)
			if msg == "nil" {
				// JWT token is valid, fetch user from DB
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
				return
			}

			// Check if the token is an OAuth token
			if auth.VerifyOAuthToken(tokenStr) {
				// OAuth token is valid, proceed without fetching user from DB
				next.ServeHTTP(w, r)
				return
			}

			// If neither is valid, return unauthorized
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
		})
	}
}

// GetAuthUser extracts user data from request context
func GetAuthUser(r *http.Request) *AuthUser {
	user, _ := r.Context().Value(UserContextKey).(*AuthUser)
	return user
}

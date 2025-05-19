package middleware

import "net/http"

// Middleware type for chaining
// Usage: WithMiddleware(handler, mw1, mw2, ...)
type Middleware func(http.Handler) http.Handler

func WithMiddleware(h http.Handler, mws ...Middleware) http.Handler {
	for i := len(mws) - 1; i >= 0; i-- {
		h = mws[i](h)
	}
	return h
}

// Example: add middleware as needed per route
// router.Handle("POST /api/students", helpers.WithMiddleware(http.HandlerFunc(New(storage)), mw1, mw2))

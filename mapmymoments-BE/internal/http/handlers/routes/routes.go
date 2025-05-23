package routes

import (
	"net/http"

	"github.com/atindraraut/crudgo/internal/utils/middleware"
	"github.com/atindraraut/crudgo/storage"
)

func RegisterRoutes(router *http.ServeMux, storage storage.Storage) {
	// Public routes
	router.Handle("GET /api/routes", GetAllRoutes(storage))
	router.Handle("GET /api/routes/{id}", GetRouteById(storage))

	// Authenticated user routes (require AuthMiddleware)
	router.Handle("POST /api/routes", middleware.WithMiddleware(NewRoute(storage), middleware.AuthMiddleware(storage)))
	router.Handle("PUT /api/routes/{id}", middleware.WithMiddleware(UpdateRoute(storage), middleware.AuthMiddleware(storage)))
	router.Handle("DELETE /api/routes/{id}", middleware.WithMiddleware(DeleteRoute(storage), middleware.AuthMiddleware(storage)))

	// User's own routes (private)
	router.Handle("GET /api/my-routes", middleware.WithMiddleware(GetUserRoutes(storage), middleware.AuthMiddleware(storage)))
}

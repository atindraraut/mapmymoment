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

	// S3 signed URL endpoint for image upload
	router.Handle("POST /api/routes/{id}/generate-upload-urls", middleware.WithMiddleware(GenerateS3UploadUrlsHandler(storage), middleware.AuthMiddleware(storage)))

	// Route sharing endpoints
	router.Handle("POST /api/routes/{id}/share", middleware.WithMiddleware(ShareRoute(storage), middleware.AuthMiddleware(storage)))
	router.Handle("GET /api/routes/{id}/share-info", middleware.WithMiddleware(GetRouteShareInfo(storage), middleware.AuthMiddleware(storage)))
	router.Handle("DELETE /api/routes/{id}/share", middleware.WithMiddleware(RevokeRouteShare(storage), middleware.AuthMiddleware(storage)))
	
	// Shared routes endpoints
	router.Handle("GET /api/shared-routes/{token}", GetSharedRouteByToken(storage)) // Public - no auth required
	router.Handle("POST /api/shared-routes/{token}/join", middleware.WithMiddleware(JoinSharedRoute(storage), middleware.AuthMiddleware(storage)))
	router.Handle("GET /api/my-shared-routes", middleware.WithMiddleware(GetSharedRoutesForUser(storage), middleware.AuthMiddleware(storage)))
}

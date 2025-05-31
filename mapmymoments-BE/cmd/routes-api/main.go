package main

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/atindraraut/crudgo/internal/config"
	"github.com/atindraraut/crudgo/internal/http/handlers/public"
	"github.com/atindraraut/crudgo/internal/http/handlers/routes"
	"github.com/atindraraut/crudgo/internal/http/handlers/user"
	"github.com/atindraraut/crudgo/internal/utils/middleware"
	"github.com/atindraraut/crudgo/storage/mongodb"
)

func main() {
	//load config
	cfg := config.MustLoadConfig()
	//database setup
	storage, err := mongodb.New(cfg)
	if err != nil {
		log.Fatalf("failed to connect to database: %s", err.Error())
	}
	//setup routes
	router := http.NewServeMux()
	//setup middleware
	handleCORS := middleware.CorsMiddleware(router)
	handleRateLimiter := middleware.RateLimiter(handleCORS)
	handleTimeTracker := middleware.TimeTracker(handleRateLimiter)
	// Register grouped routes

	public.RegisterRoutes(router, storage)
	routes.RegisterRoutes(router, storage)
	user.RegisterRoutes(router, storage)
	// Register OAuth routes
	router.HandleFunc("/oauth/google/login", user.GoogleLoginHandler)
	router.HandleFunc("/oauth/google/callback", user.GoogleCallbackHandler(storage))
	//setup server
	server := &http.Server{
		Addr:    cfg.HTTPServer.ADDR,
		Handler: handleTimeTracker,
	}
	slog.Info("Starting server...", slog.String("address", cfg.HTTPServer.ADDR))
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)
	go func() {
		err := server.ListenAndServe()
		if err != nil {
			log.Fatalf("failed to start server: %s", err.Error())
		}
	}()
	<-done

	slog.Info("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	err = server.Shutdown(ctx)
	if err != nil {
		slog.Error("failed to shutdown server", slog.String("error", err.Error()))
	} else {
		slog.Info("Server stopped gracefully")
	}
}

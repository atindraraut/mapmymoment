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
	"github.com/atindraraut/crudgo/internal/http/handlers/auth"
	"github.com/atindraraut/crudgo/internal/utils/middleware"
	"github.com/atindraraut/crudgo/storage/sqlite"
)

func main() {
	//load config
	cfg := config.MustLoadConfig()
	//database setup
	storage, err := sqlite.New(cfg)
	if err != nil {
		log.Fatalf("failed to connect to database: %s", err.Error())
	}
	//setup routes
	router := http.NewServeMux()
	//setup middleware
	handleTimeTracker := middleware.TimeTracker(router)
	// Register grouped routes

	public.RegisterRoutes(router, storage)
	routes.RegisterRoutes(router, storage)
	auth.RegisterRoutes(router, storage)
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

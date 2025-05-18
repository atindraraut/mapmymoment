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
	"github.com/atindraraut/crudgo/internal/http/handlers/student"
	"github.com/atindraraut/crudgo/internal/http/handlers/public"
	"github.com/atindraraut/crudgo/storage/sqlite"
)

func timeTracker(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		duration := time.Since(start)
		slog.Info("Request duration", slog.String("method", r.Method), slog.String("path", r.URL.Path), slog.Duration("duration", duration))
	})
}

func main() {
	//load config
	cfg := config.MustLoadConfig()
	//database setup
	storage , err := sqlite.New(cfg)
	if err != nil {
		log.Fatalf("failed to connect to database: %s", err.Error())
	}
	slog.Info("Connected to database", slog.String("path", cfg.Storagepath))
	//setup routes
	router := http.NewServeMux()
	handleTimeTracker := timeTracker(router)
	router.HandleFunc("GET /health", public.New(storage))
	router.HandleFunc("POST /api/students", student.New(storage))
	router.HandleFunc("GET /api/students/{id}", student.GetById(storage))
	router.HandleFunc("GET /api/students", student.Getlist(storage))
	router.HandleFunc("PUT /api/students/{id}", student.Update(storage))
	router.HandleFunc("DELETE /api/students/{id}", student.Delete(storage))
	//setup server
	server := &http.Server{
		Addr:    cfg.HTTPServer.ADDR,
		Handler: handleTimeTracker,
	}
	slog.Info("Starting server...", slog.String("address", cfg.HTTPServer.ADDR))
	done:= make(chan os.Signal, 1)
	signal.Notify(done,os.Interrupt,syscall.SIGTERM, syscall.SIGINT)
	go func(){
		err := server.ListenAndServe()
		if err != nil {
			log.Fatalf("failed to start server: %s", err.Error())
		}
	}()
	<-done

	slog.Info("Shutting down server...")
	ctx,cancel :=context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	err = server.Shutdown(ctx)
	if err != nil {
		slog.Error("failed to shutdown server",slog.String("error", err.Error()))
	} else {
		slog.Info("Server stopped gracefully")
	}
}

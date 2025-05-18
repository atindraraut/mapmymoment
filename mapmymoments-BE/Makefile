# Makefile for Students API

# Variables
APP_NAME := students-api
CONFIG_FILE := config/local.yaml

# Default target
.PHONY: run
run:
	@echo "Running the application with configuration file $(CONFIG_FILE)"
	go run cmd/$(APP_NAME)/main.go -config $(CONFIG_FILE)

.PHONY: build
build:
	@echo "Building the application..."
	go build -o bin/$(APP_NAME) cmd/$(APP_NAME)/main.go

.PHONY: clean
clean:
	@echo "Cleaning up..."
	rm -rf bin

.PHONY: test
test:
	@echo "Running tests..."
	go test ./...

.PHONY: help
help:
	@echo "Available targets:"
	@echo "  run   - Run the application"
	@echo "  build - Build the application binary"
	@echo "  clean - Clean up build artifacts"
	@echo "  test  - Run tests"
	@echo "  help  - Show this help message"
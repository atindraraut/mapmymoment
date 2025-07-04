# Makefile for Students API

# Variables
APP_NAME := routes-api
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

.PHONY: build-sam
build-sam:
	@echo "Building all lambda functions for AWS SAM..."
	GOOS=linux GOARCH=amd64 go build -o bin/hello cmd/lambda-api/hello/main.go
	GOOS=linux GOARCH=amd64 go build -o bin/s3_hello cmd/lambda-api/s3_hello/main.go

.PHONY: sam-local
sam-local: build-sam
	@echo "Running AWS SAM local API on port 4000..."
	sam local start-api -t template.yaml --port 4000
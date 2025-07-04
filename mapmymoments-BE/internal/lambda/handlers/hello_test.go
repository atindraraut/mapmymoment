package handlers

import (
	"context"
	"testing"
	"github.com/aws/aws-lambda-go/events"
)

func TestHelloHandler(t *testing.T) {
	event := events.APIGatewayProxyRequest{}
	ctx := context.Background()
	resp, err := HelloHandler(ctx, event)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if resp.StatusCode != 200 {
		t.Errorf("expected status 200, got %d", resp.StatusCode)
	}
	if resp.Body != "Hello, World!" {
		t.Errorf("expected body 'Hello, World!', got '%s'", resp.Body)
	}
}

package handlers

import (
	"context"
	"fmt"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

// S3HelloHandler responds to S3 PutObject events and says hello.
func S3HelloHandler(ctx context.Context, event events.S3Event) error {
	for _, record := range event.Records {
		bucket := record.S3.Bucket.Name
		key := record.S3.Object.Key
		fmt.Printf("Hello! New object uploaded: %s/%s\n", bucket, key)
	}
	return nil
}

// Entrypoint for AWS Lambda
func S3HelloMain() {
	lambda.Start(S3HelloHandler)
}

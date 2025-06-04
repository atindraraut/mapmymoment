package utils

import (
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
)

// GeneratePresignedS3URL generates a presigned S3 PUT URL for uploading an object
func GeneratePresignedS3URL(bucket, key, region, contentType string, expires time.Duration) (string, error) {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(region),
	})
	if err != nil {
		return "", err
	}

	svc := s3.New(sess)
	req, _ := svc.PutObjectRequest(&s3.PutObjectInput{
		Bucket:      aws.String(bucket),
		Key:         aws.String(key),
		ContentType: aws.String(contentType),
	})
	urlStr, err := req.Presign(expires)
	if err != nil {
		return "", err
	}
	return urlStr, nil
}

package auth

import (
	"fmt"
	"log/slog"
	"math/rand"
	"net/smtp"
	"os"
	"time"

	"github.com/atindraraut/crudgo/internal/types"
	"github.com/dgrijalva/jwt-go"
)

var SECRET_KEY string = os.Getenv("SECRET_KEY")

func GenerateAllTokens(email, first_name, last_name, uid string) (string, string, error) {
	claims := &types.SignedDetails{
		Email:      email,
		First_name: first_name,
		Last_name:  last_name,
		Uid:        uid,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(time.Minute * 15).Unix(),
		},
	}
	refreshClaims := &types.SignedDetails{
		Email:      email,
		First_name: first_name,
		Last_name:  last_name,
		Uid:        uid,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(time.Hour * 24 * 7).Unix(),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	signedToken, err := token.SignedString([]byte(SECRET_KEY))
	if err != nil {
		return "", "", err
	}
	signedRefreshToken, err := refreshToken.SignedString([]byte(SECRET_KEY))
	if err != nil {
		return "", "", err
	}
	return signedToken, signedRefreshToken, nil
}

func VerifyToken(tokenStr string) (details *types.SignedDetails, msg string) {
	token, err := jwt.ParseWithClaims(tokenStr, &types.SignedDetails{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(SECRET_KEY), nil
	})
	if err != nil {
		return nil, err.Error()
	}
	claims, ok := token.Claims.(*types.SignedDetails)
	if !ok || !token.Valid {
		return nil, "invalid token"
	}
	return claims, "nil"
}

// Mock email sender (replace with real email service in production)
func SendEmailOTP(email, otp string) error {
	// Mailtrap credentials
	auth := smtp.PlainAuth("", "api", "3df85c226c7a33228c1528f16dc257fd", "live.smtp.mailtrap.io")

	// Use the recipient's email
	to := []string{"atindraraut80@gmail.com"}

	// Use a sender address that matches the Mailtrap domain (as required by Mailtrap)
	from := "hello@demomailtrap.co"

	// Email message with correct From header
	msg := []byte("From: " + from + "\r\n" +
		"To: " + email + "\r\n" +
		"Subject: Your OTP Code\r\n" +
		"MIME-version: 1.0;\r\nContent-Type: text/plain; charset=\"UTF-8\";\r\n\r\n" +
		"Your OTP code is: " + otp)

	// Send the email
	err := smtp.SendMail("live.smtp.mailtrap.io:587", auth, from, to, msg)
	if err != nil {
		slog.Error("Failed to send email", err)
		return err
	}

	slog.Info("Email sent successfully")
	return nil
}

func GenerateOTP() string {
	return fmt.Sprintf("%06d", rand.Intn(1000000))
}

package auth

import (
	"os"
	"github.com/atindraraut/crudgo/internal/types"
)

var SECRET_KEY string = os.Getenv("SECRET_KEY")

func GenerateAllTokens(email, first_name, last_name, uid string) (string, string, error) {
	// Generate access and refresh tokens
	return "", "", nil
}

func VerifyToken(token string) (details *types.SignedDetails, msg string) {
	// Verify the token
	// Return SignedDetails and message
	details = &types.SignedDetails{}

	return details, "nil"
}

func UpdateAllTokens(signedToken string, signedRefreshToken string, userId string) (string, string, error) {
	// Update access and refresh tokens
	return "", "", nil
}
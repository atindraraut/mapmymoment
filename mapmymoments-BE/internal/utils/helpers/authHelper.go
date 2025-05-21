package auth

import (
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


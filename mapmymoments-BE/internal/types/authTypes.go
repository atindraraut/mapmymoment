package types

import (
	"time"
	jwt "github.com/dgrijalva/jwt-go"
)
type Student struct {
	Id int64
	Name string `validate:"required"`
	Age int `validate:"required"`
	Email string `validate:"required"`
}

type SignedDetails struct {
	Email      string
	First_name string
	Last_name  string
	Uid        string
	jwt.StandardClaims
}
type OTPRecord struct {
	Email     string         `bson:"email" json:"email"`
	OTP       string         `bson:"otp" json:"otp"`
	ExpiresAt time.Time      `bson:"expires_at" json:"expires_at"`
	Type      string         `bson:"type" json:"type"` // "signup" or "reset"
	SignupReq *SignupRequest `bson:"signup_req,omitempty" json:"signup_req,omitempty"` // Only for signup
	Password  string         `bson:"password,omitempty" json:"password,omitempty"` // Only for signup
}

type UserData struct {
	Email     string
	Password  *string // Optional - nil for OAuth-only users
	FirstName string
	LastName  string
	GoogleID  *string // Optional - for Google OAuth users
	AuthType  string  // "email", "google", or "both"
}

type SignupRequest struct {
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,min=6"`
	FirstName string `json:"first_name" validate:"required"`
	LastName  string `json:"last_name" validate:"required"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type GoogleOAuthRequest struct {
	Code  string `json:"code" validate:"required"`
	State string `json:"state" validate:"required"`
}

type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Picture       string `json:"picture"`
}
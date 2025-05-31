package user

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/atindraraut/crudgo/internal/types"
	auth "github.com/atindraraut/crudgo/internal/utils/helpers"
	"github.com/atindraraut/crudgo/internal/utils/response"
	"github.com/atindraraut/crudgo/storage"
	"github.com/go-playground/validator/v10"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var googleOAuthConfig = &oauth2.Config{
	ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),                 // Use environment variable for Google Client ID
	ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),             // Use environment variable for Google Client Secret
	RedirectURL:  "http://localhost:8080/oauth/google/callback", // Replace with your callback URL
	Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
	Endpoint:     google.Endpoint,
}

func signup(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.SignupRequest
		if err := decodeAndValidate(r, &req); err != nil {
			writeValidationError(w, err)
			return
		}
		hashedPassword, err := hashPassword(req.Password)
		if err != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(errors.New("failed to hash password")))
			return
		}
		otp := auth.GenerateOTP()
		err = auth.SendEmailOTP(req.Email, otp)
		if err != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(errors.New("failed to send OTP")))
			return
		}
		otpRecord := types.OTPRecord{
			Email:     req.Email,
			OTP:       otp,
			ExpiresAt: time.Now().Add(10 * time.Minute),
			SignupReq: req,
			Password:  hashedPassword,
		}
		err = storage.SaveOTPRecord(otpRecord)
		if err != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(errors.New("failed to save OTP record")))
			return
		}
		response.WriteJSON(w, http.StatusOK, map[string]interface{}{
			"message": "OTP sent to your email. Please verify to complete signup.",
		})
	}
}

// Helper: decode and validate request
func decodeAndValidate(r *http.Request, v interface{}) error {
	err := json.NewDecoder(r.Body).Decode(v)
	if errors.Is(err, io.EOF) {
		return errors.New("request body is empty")
	}
	if err != nil {
		return err
	}
	if err := validator.New().Struct(v); err != nil {
		return err
	}
	return nil
}

// Helper: write validation error
func writeValidationError(w http.ResponseWriter, err error) {
	if validatorErrors, ok := err.(validator.ValidationErrors); ok {
		response.WriteJSON(w, http.StatusBadRequest, response.ValidationError(validatorErrors))
	} else {
		response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(err))
	}
}

// Handler to verify OTP and complete registration
func verifyOTP(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		type otpVerifyRequest struct {
			Email string `json:"email" validate:"required,email"`
			OTP   string `json:"otp" validate:"required"`
		}
		var req otpVerifyRequest
		if err := decodeAndValidate(r, &req); err != nil {
			writeValidationError(w, err)
			return
		}
		record, err := storage.GetOTPRecordByEmail(req.Email)
		if err != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(errors.New("failed to get OTP record")))
			return
		}
		if record.Email == "" || record.ExpiresAt.Before(time.Now()) {
			response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(errors.New("OTP expired or not found")))
			return
		}
		if record.OTP != req.OTP {
			response.WriteJSON(w, http.StatusUnauthorized, response.GeneralError(errors.New("invalid OTP")))
			return
		}
		user := types.UserData{
			Email:     record.SignupReq.Email,
			Password:  record.Password,
			FirstName: record.SignupReq.FirstName,
			LastName:  record.SignupReq.LastName,
		}
		if _, err := storage.CreateUser(user); err != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(err))
			return
		}
		token, refreshToken, _ := auth.GenerateAllTokens(user.Email, user.FirstName, user.LastName, user.Email, false)
		_ = storage.DeleteOTPRecordByEmail(req.Email)
		response.WriteJSON(w, http.StatusCreated, map[string]interface{}{
			"access_token":  token,
			"refresh_token": refreshToken,
			"email":         user.Email,
			"first_name":    user.FirstName,
			"last_name":     user.LastName,
		})
	}
}

func login(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.LoginRequest
		if err := decodeAndValidate(r, &req); err != nil {
			writeValidationError(w, err)
			return
		}
		user, err := storage.GetUserByEmail(req.Email)
		if err != nil || !checkPasswordHash(req.Password, user.Password) {
			response.WriteJSON(w, http.StatusUnauthorized, response.GeneralError(errors.New("invalid credentials")))
			return
		}
		token, refreshToken, _ := auth.GenerateAllTokens(user.Email, user.FirstName, user.LastName, user.Email, false)
		response.WriteJSON(w, http.StatusOK, map[string]interface{}{
			"access_token":  token,
			"refresh_token": refreshToken,
			"email":         user.Email,
			"first_name":    user.FirstName,
			"last_name":     user.LastName,
		})
	}
}

func refresh(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.RefreshRequest
		if err := decodeAndValidate(r, &req); err != nil {
			writeValidationError(w, err)
			return
		}

		// Check if it's a JWT refresh token
		details, msg := auth.VerifyToken(req.RefreshToken)
		if msg == "nil" {
			// Generate new JWT tokens
			token, refreshToken, _ := auth.GenerateAllTokens(details.Email, details.First_name, details.Last_name, details.Uid, false)
			response.WriteJSON(w, http.StatusOK, map[string]interface{}{
				"access_token":  token,
				"refresh_token": refreshToken,
			})
			return
		}

		// Handle OAuth refresh token
		if auth.VerifyOAuthToken(req.RefreshToken) {
			// Use the actual Google OAuth token refresh logic
			resp, err := http.PostForm("https://oauth2.googleapis.com/token", url.Values{
				"client_id":     {os.Getenv("GOOGLE_CLIENT_ID")},
				"client_secret": {os.Getenv("GOOGLE_CLIENT_SECRET")},
				"refresh_token": {req.RefreshToken},
				"grant_type":    {"refresh_token"},
			})
			if err != nil {
				response.WriteJSON(w, http.StatusUnauthorized, response.GeneralError(errors.New("failed to refresh OAuth token")))
				return
			}
			defer resp.Body.Close()

			if resp.StatusCode != http.StatusOK {
				response.WriteJSON(w, http.StatusUnauthorized, response.GeneralError(errors.New("failed to refresh OAuth token")))
				return
			}

			var token oauth2.Token
			if err := json.NewDecoder(resp.Body).Decode(&token); err != nil {
				response.WriteJSON(w, http.StatusUnauthorized, response.GeneralError(errors.New("failed to decode OAuth token response")))
				return
			}

			response.WriteJSON(w, http.StatusOK, map[string]interface{}{
				"access_token":  token.AccessToken,
				"refresh_token": token.RefreshToken,
			})
			return
		}

		// If neither is valid, return unauthorized
		response.WriteJSON(w, http.StatusUnauthorized, response.GeneralError(errors.New("invalid or expired refresh token")))
	}
}

// Helper: hash password
func hashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hash), err
}

// Helper: compare password
func checkPasswordHash(password, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

func GoogleLoginHandler(w http.ResponseWriter, r *http.Request) {
	url := googleOAuthConfig.AuthCodeURL("state-token", oauth2.AccessTypeOffline)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func GoogleCallbackHandler(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		code := r.URL.Query().Get("code")
		token, err := googleOAuthConfig.Exchange(r.Context(), code)
		if err != nil {
			http.Error(w, "Failed to exchange token", http.StatusInternalServerError)
			return
		}

		client := googleOAuthConfig.Client(r.Context(), token)
		resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
		if err != nil {
			http.Error(w, "Failed to get user info", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		var userInfo struct {
			Email string `json:"email"`
			Name  string `json:"name"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
			http.Error(w, "Failed to decode user info", http.StatusInternalServerError)
			return
		}

		// Check if user exists in the database
		user, err := storage.GetUserByEmail(userInfo.Email)
		if err != nil {
			// If user doesn't exist, create a new user
			user = types.UserData{
				Email:     userInfo.Email,
				FirstName: userInfo.Name,
			}
			if _, err := storage.CreateUser(user); err != nil {
				http.Error(w, "Failed to create user", http.StatusInternalServerError)
				return
			}
		}

		// Generate tokens for OAuth flow
		oauthToken, _, _ := auth.GenerateAllTokens(user.Email, user.FirstName, user.LastName, user.Email, true)
		if token, ok := oauthToken.(*oauth2.Token); ok {
			response.WriteJSON(w, http.StatusOK, map[string]interface{}{
				"access_token":  token.AccessToken,
				"refresh_token": token.RefreshToken,
				"email":         user.Email,
				"first_name":    user.FirstName,
				"last_name":     user.LastName,
			})
			return
		}
	}
}

package user

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	auth "github.com/atindraraut/crudgo/internal/utils/helpers"
	"github.com/atindraraut/crudgo/internal/utils/response"
	"github.com/atindraraut/crudgo/internal/types"
	"github.com/atindraraut/crudgo/storage"
	"github.com/go-playground/validator/v10"
	"golang.org/x/crypto/bcrypt"
)

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
		user := types.UserData{
			Email:     req.Email,
			Password:  hashedPassword,
			FirstName: req.FirstName,
			LastName:  req.LastName,
		}
		if _, err := storage.CreateUser(user); err != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(err))
			return
		}
		token, refreshToken, _ := auth.GenerateAllTokens(req.Email, req.FirstName, req.LastName, req.Email)
		response.WriteJSON(w, http.StatusCreated, map[string]interface{}{
			"access_token":  token,
			"refresh_token": refreshToken,
			"email":         req.Email,
			"first_name":    req.FirstName,
			"last_name":     req.LastName,
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
		token, refreshToken, _ := auth.GenerateAllTokens(user.Email, user.FirstName, user.LastName, user.Email)
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
		details, msg := auth.VerifyToken(req.RefreshToken)
		if msg != "nil" {
			response.WriteJSON(w, http.StatusUnauthorized, response.GeneralError(errors.New("invalid refresh token")))
			return
		}
		token, refreshToken, _ := auth.GenerateAllTokens(details.Email, details.First_name, details.Last_name, details.Uid)
		response.WriteJSON(w, http.StatusOK, map[string]interface{}{
			"access_token":  token,
			"refresh_token": refreshToken,
		})
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

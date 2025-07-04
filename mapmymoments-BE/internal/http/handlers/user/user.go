package user

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"time"

	"github.com/atindraraut/crudgo/internal/types"
	auth "github.com/atindraraut/crudgo/internal/utils/helpers"
	"github.com/atindraraut/crudgo/internal/utils/response"
	"github.com/atindraraut/crudgo/storage"
	"github.com/go-playground/validator/v10"
	"golang.org/x/crypto/bcrypt"
)

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
			Type:      "signup",
			SignupReq: &req,
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
		if record.Type != "signup" {
			response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(errors.New("invalid OTP type for signup verification")))
			return
		}
		if record.OTP != req.OTP {
			response.WriteJSON(w, http.StatusUnauthorized, response.GeneralError(errors.New("invalid OTP")))
			return
		}
		if record.SignupReq == nil {
			response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(errors.New("invalid signup data in OTP record")))
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
		token, refreshToken, _ := auth.GenerateAllTokens(user.Email, user.FirstName, user.LastName, user.Email)
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

// Handler: Request password reset (send OTP)
func requestPasswordReset(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		type reqBody struct {
			Email string `json:"email" validate:"required,email"`
		}
		var req reqBody
		if err := decodeAndValidate(r, &req); err != nil {
			writeValidationError(w, err)
			return
		}
		user, err := storage.GetUserByEmail(req.Email)
		if err != nil || user.Email == "" {
			// Don't reveal if user exists
			response.WriteJSON(w, http.StatusOK, map[string]string{"message": "If your email exists, a reset code has been sent."})
			return
		}
		otp := auth.GenerateOTP()
		err = auth.SendResetPasswordEmail(req.Email, otp)
		if err != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(errors.New("failed to send reset code email")))
			return
		}
		otpRecord := types.OTPRecord{
			Email:     req.Email,
			OTP:       otp,
			ExpiresAt: time.Now().Add(10 * time.Minute),
			Type:      "reset",
		}
		err = storage.SaveOTPRecord(otpRecord)
		if err != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(errors.New("failed to save OTP record")))
			return
		}
		response.WriteJSON(w, http.StatusOK, map[string]string{"message": "If your email exists, a reset code has been sent."})
	}
}

// Handler: Reset password using OTP
func resetPassword(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		type reqBody struct {
			Email    string `json:"email" validate:"required,email"`
			OTP      string `json:"token" validate:"required"`
			Password string `json:"password" validate:"required,min=6"`
		}
		var req reqBody
		if err := decodeAndValidate(r, &req); err != nil {
			writeValidationError(w, err)
			return
		}
		record, err := storage.GetOTPRecordByEmail(req.Email)
		if err != nil || record.Email == "" || record.ExpiresAt.Before(time.Now()) {
			response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(errors.New("OTP expired or not found")))
			return
		}
		if record.Type != "reset" {
			response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(errors.New("invalid OTP type for password reset")))
			return
		}
		if record.OTP != req.OTP {
			response.WriteJSON(w, http.StatusUnauthorized, response.GeneralError(errors.New("invalid OTP")))
			return
		}
		hashedPassword, err := hashPassword(req.Password)
		if err != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(errors.New("failed to hash password")))
			return
		}
		user, err := storage.GetUserByEmail(req.Email)
		if err != nil || user.Email == "" {
			response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(errors.New("user not found")))
			return
		}
		user.Password = hashedPassword
		if err := storage.UpdateUserPassword(user.Email, hashedPassword); err != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(errors.New("failed to update password")))
			return
		}
		_ = storage.DeleteOTPRecordByEmail(req.Email)
		response.WriteJSON(w, http.StatusOK, map[string]string{"message": "Password reset successful"})
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

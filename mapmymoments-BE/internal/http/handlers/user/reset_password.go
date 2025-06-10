package user

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"mapmymoments-BE/internal/types"
	"mapmymoments-BE/internal/utils/response"
)

type ResetRequest struct {
	Email string `json:"email"`
}

type ResetVerify struct {
	Email    string `json:"email"`
	Token    string `json:"token"`
	Password string `json:"password"`
}

// In-memory store for demo (replace with DB in production)
var resetTokens = make(map[string]string)
var resetExpiry = make(map[string]time.Time)

func RequestPasswordReset(w http.ResponseWriter, r *http.Request) {
	var req ResetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.JSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request"})
		return
	}
	if !strings.Contains(req.Email, "@") {
		response.JSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid email"})
		return
	}
	// Generate token
	token := uuid.New().String()
	resetTokens[req.Email] = token
	resetExpiry[req.Email] = time.Now().Add(15 * time.Minute)
	// TODO: Send email with token (simulate for now)
	// In production, send token to req.Email
	response.JSON(w, 200, map[string]string{"message": "Reset email sent", "token": token})
}

func ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req ResetVerify
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.JSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request"})
		return
	}
	token, ok := resetTokens[req.Email]
	expiry, expOk := resetExpiry[req.Email]
	if !ok || !expOk || token != req.Token || time.Now().After(expiry) {
		response.JSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid or expired token"})
		return
	}
	if len(req.Password) < 6 {
		response.JSON(w, http.StatusBadRequest, map[string]string{"error": "Password too short"})
		return
	}
	// TODO: Update password in DB (simulate for now)
	// Remove token
	delete(resetTokens, req.Email)
	delete(resetExpiry, req.Email)
	response.JSON(w, 200, map[string]string{"message": "Password reset successful"})
}

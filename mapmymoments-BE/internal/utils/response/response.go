package response

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-playground/validator/v10"
)

type Response struct{
	Status  string     `json:"status"`
	Error   string     `json:"error"`
}

const (
	StatusOK	 = "OK"
	StatusError	 = "ERROR"
	StatusCreated = "CREATED"
	StatusNotFound = "NOT_FOUND"
	StatusBadRequest = "BAD_REQUEST"
)

func WriteJSON(w http.ResponseWriter, status int, data interface{}) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	return json.NewEncoder(w).Encode(data)
}

func GeneralError(err error) Response{
	return Response{
		Status: StatusError,
		Error:  err.Error(),
	}
}
func ValidationError(errs validator.ValidationErrors) Response{
	var errMsg []string

	for _,err := range errs {
		switch err.ActualTag() {
		case "required":
			errMsg = append(errMsg, "Field "+err.Field() + " is required")
		default:
			errMsg = append(errMsg, "Field "+err.Field() + " is invalid")
		}
	}
	return Response{
		Status: StatusBadRequest,
		Error:  strings.Join(errMsg, ", "),
	}
} 
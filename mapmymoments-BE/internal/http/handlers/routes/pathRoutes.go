package routes

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/atindraraut/crudgo/internal/types"
	"github.com/atindraraut/crudgo/internal/utils/middleware"
	"github.com/atindraraut/crudgo/internal/utils/response"
	"github.com/atindraraut/crudgo/storage"
	"github.com/go-playground/validator/v10"
)

func NewRoute(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var route types.Route
		fmt.Println("Request Body: ", r.Body)
		err := json.NewDecoder(r.Body).Decode(&route)
		if errors.Is(err, io.EOF) {
			response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(errors.New("request body is empty")))
			return
		}
		if err != nil {
			response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(err))
			return
		}
		fmt.Println("Decoded Route: ", route)
		if err := validator.New().Struct(&route); err != nil {
			validatorErrors := err.(validator.ValidationErrors)
			response.WriteJSON(w, http.StatusBadRequest, response.ValidationError(validatorErrors))
			return
		}
		fmt.Println("Validated Route: ", route)
		// Populate creatorId and timestamps in backend
		user := middleware.GetAuthUser(r)
		if user == nil {
			response.WriteJSON(w, http.StatusUnauthorized, response.GeneralError(errors.New("unauthorized")))
			return
		}
		fmt.Println("User: ", user)
		route.CreatorID = user.Email
		now := time.Now().UnixMilli()
		route.CreatedAt = now
		route.UpdatedAt = now
		id, err := storage.CreateRoute(route)
		if err != nil {
			fmt.Println("Error creating route: ", err)
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(err))
			return
		}
		responseData := map[string]interface{}{
			"Message": "Route created successfully",
			"id":      id,
		}
		response.WriteJSON(w, http.StatusCreated, responseData)
	}
}

func GetRouteById(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		if id == "" {
			response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(errors.New("id is required")))
			return
		}
		route, err := storage.GetRouteById(id)
		if err != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(err))
			return
		}
		response.WriteJSON(w, http.StatusOK, route)
	}
}

func GetAllRoutes(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		routes, err := storage.GetAllRoutes()
		fmt.Println("Routes: ", routes)
		if err != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(err))
			return
		}
		response.WriteJSON(w, http.StatusOK, routes)
	}
}

func UpdateRoute(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		if id == "" {
			response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(errors.New("id is required")))
			return
		}
		user := middleware.GetAuthUser(r)
		if user == nil {
			response.WriteJSON(w, http.StatusUnauthorized, response.GeneralError(errors.New("unauthorized")))
			return
		}
		// Check user permission instead of just checking if they're the creator
		permission, permErr := storage.CheckUserRoutePermission(user.Email, id)
		if permErr != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(permErr))
			return
		}
		
		if permission != "owner" {
			response.WriteJSON(w, http.StatusForbidden, response.GeneralError(errors.New("only the creator can edit this route")))
			return
		}
		var route types.Route
		err := json.NewDecoder(r.Body).Decode(&route)
		if errors.Is(err, io.EOF) {
			response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(errors.New("request body is empty")))
			return
		}
		if err != nil {
			response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(err))
			return
		}
		if err := validator.New().Struct(&route); err != nil {
			validatorErrors := err.(validator.ValidationErrors)
			response.WriteJSON(w, http.StatusBadRequest, response.ValidationError(validatorErrors))
			return
		}
		// Always set creatorId and update updatedAt in backend
		route.CreatorID = user.Email
		route.UpdatedAt = time.Now().UnixMilli()
		updatedId, err := storage.UpdateRoute(id, route)
		if err != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(err))
			return
		}
		responseData := map[string]interface{}{
			"Message": "Route updated successfully",
			"id":      updatedId,
		}
		response.WriteJSON(w, http.StatusOK, responseData)
	}
}

func DeleteRoute(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		if id == "" {
			response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(errors.New("id is required")))
			return
		}
		user := middleware.GetAuthUser(r)
		if user == nil {
			response.WriteJSON(w, http.StatusUnauthorized, response.GeneralError(errors.New("unauthorized")))
			return
		}
		// Check user permission instead of just checking if they're the creator
		permission, permErr := storage.CheckUserRoutePermission(user.Email, id)
		if permErr != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(permErr))
			return
		}
		
		if permission != "owner" {
			response.WriteJSON(w, http.StatusForbidden, response.GeneralError(errors.New("only the creator can delete this route")))
			return
		}
		deletedId, err := storage.DeleteRoute(id)
		if err != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(err))
			return
		}
		responseData := map[string]interface{}{
			"Message": "Route deleted successfully",
			"id":      deletedId,
		}
		response.WriteJSON(w, http.StatusOK, responseData)
	}
}

func GetUserRoutes(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := middleware.GetAuthUser(r)
		if user == nil {
			response.WriteJSON(w, http.StatusUnauthorized, response.GeneralError(errors.New("unauthorized")))
			return
		}
		routes, err := storage.GetAllRoutes()
		if err != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(err))
			return
		}
		var userRoutes []types.Route
		for _, route := range routes {
			r, ok := route.(types.Route)
			if ok && r.CreatorID == user.Email {
				userRoutes = append(userRoutes, r)
			}
		}
		response.WriteJSON(w, http.StatusOK, userRoutes)
	}
}

// Route sharing handlers
func ShareRoute(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		if id == "" {
			response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(errors.New("route id is required")))
			return
		}
		
		// Check if user is the creator
		user := middleware.GetAuthUser(r)
		if user == nil {
			response.WriteJSON(w, http.StatusUnauthorized, response.GeneralError(errors.New("unauthorized")))
			return
		}
		
		existing, err := storage.GetRouteById(id)
		if err != nil {
			response.WriteJSON(w, http.StatusNotFound, response.GeneralError(errors.New("route not found")))
			return
		}
		
		route := existing.(types.Route)
		if route.CreatorID != user.Email {
			response.WriteJSON(w, http.StatusForbidden, response.GeneralError(errors.New("only the creator can share this route")))
			return
		}
		
		// Parse request body for optional expiry
		var req types.ShareRouteRequest
		if r.Body != nil {
			json.NewDecoder(r.Body).Decode(&req)
		}
		
		// Generate share token
		token, err := storage.GenerateRouteShareToken(id, req.ExpiryHours)
		if err != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(err))
			return
		}
		
		// Calculate expiry time for response
		var expiryTime *time.Time
		if req.ExpiryHours != nil {
			expiry := time.Now().Add(time.Duration(*req.ExpiryHours) * time.Hour)
			expiryTime = &expiry
		}
		
		resp := types.ShareRouteResponse{
			ShareToken: token,
			ExpiresAt:  expiryTime,
		}
		
		response.WriteJSON(w, http.StatusOK, resp)
	}
}

func GetRouteShareInfo(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		if id == "" {
			response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(errors.New("route id is required")))
			return
		}
		
		// Check if user has permission to view share info
		user := middleware.GetAuthUser(r)
		if user == nil {
			response.WriteJSON(w, http.StatusUnauthorized, response.GeneralError(errors.New("unauthorized")))
			return
		}
		
		permission, err := storage.CheckUserRoutePermission(user.Email, id)
		if err != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(err))
			return
		}
		
		if permission != "owner" {
			response.WriteJSON(w, http.StatusForbidden, response.GeneralError(errors.New("only the creator can view share info")))
			return
		}
		
		route, err := storage.GetRouteById(id)
		if err != nil {
			response.WriteJSON(w, http.StatusNotFound, response.GeneralError(errors.New("route not found")))
			return
		}
		
		routeObj := route.(types.Route)
		
		// Get users who have access to this route
		users, err := storage.GetUsersByRouteId(id)
		if err != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(err))
			return
		}
		
		shareInfo := map[string]interface{}{
			"shareToken":   routeObj.ShareToken,
			"expiresAt":    routeObj.ShareTokenExpiry,
			"sharedWith":   routeObj.SharedWith,
			"sharedUsers":  users,
		}
		
		response.WriteJSON(w, http.StatusOK, shareInfo)
	}
}

func RevokeRouteShare(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		if id == "" {
			response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(errors.New("route id is required")))
			return
		}
		
		// Check if user is the creator
		user := middleware.GetAuthUser(r)
		if user == nil {
			response.WriteJSON(w, http.StatusUnauthorized, response.GeneralError(errors.New("unauthorized")))
			return
		}
		
		existing, err := storage.GetRouteById(id)
		if err != nil {
			response.WriteJSON(w, http.StatusNotFound, response.GeneralError(errors.New("route not found")))
			return
		}
		
		route := existing.(types.Route)
		if route.CreatorID != user.Email {
			response.WriteJSON(w, http.StatusForbidden, response.GeneralError(errors.New("only the creator can revoke sharing")))
			return
		}
		
		err = storage.RevokeRouteShare(id)
		if err != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(err))
			return
		}
		
		response.WriteJSON(w, http.StatusOK, map[string]string{
			"message": "Route sharing revoked successfully",
		})
	}
}

func GetSharedRouteByToken(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := r.PathValue("token")
		if token == "" {
			response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(errors.New("share token is required")))
			return
		}
		
		route, err := storage.GetRouteByShareToken(token)
		if err != nil {
			response.WriteJSON(w, http.StatusNotFound, response.GeneralError(err))
			return
		}
		
		response.WriteJSON(w, http.StatusOK, route)
	}
}

func JoinSharedRoute(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := r.PathValue("token")
		if token == "" {
			response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(errors.New("share token is required")))
			return
		}
		
		// Check if user is authenticated
		user := middleware.GetAuthUser(r)
		if user == nil {
			response.WriteJSON(w, http.StatusUnauthorized, response.GeneralError(errors.New("please log in to join this route")))
			return
		}
		
		// Get route by token (this validates the token)
		route, err := storage.GetRouteByShareToken(token)
		if err != nil {
			response.WriteJSON(w, http.StatusNotFound, response.GeneralError(err))
			return
		}
		
		routeObj := route.(types.Route)
		
		// Check if user is already the creator
		if routeObj.CreatorID == user.Email {
			response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(errors.New("you are already the creator of this route")))
			return
		}
		
		// Add user to shared route
		err = storage.AddUserToSharedRoute(routeObj.ID, user.Email, user.Email)
		if err != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(err))
			return
		}
		
		response.WriteJSON(w, http.StatusOK, map[string]interface{}{
			"message": "Successfully joined the shared route",
			"route":   route,
		})
	}
}

func GetSharedRoutesForUser(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := middleware.GetAuthUser(r)
		if user == nil {
			response.WriteJSON(w, http.StatusUnauthorized, response.GeneralError(errors.New("unauthorized")))
			return
		}
		
		routes, err := storage.GetSharedRoutesForUser(user.Email)
		if err != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(err))
			return
		}
		
		response.WriteJSON(w, http.StatusOK, routes)
	}
}

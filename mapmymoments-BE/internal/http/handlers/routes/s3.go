package routes

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/atindraraut/crudgo/internal/types"
	"github.com/atindraraut/crudgo/internal/utils"
	"github.com/atindraraut/crudgo/internal/utils/middleware"
	"github.com/atindraraut/crudgo/internal/utils/response"
	"github.com/atindraraut/crudgo/storage"
)

type GenerateS3UrlsRequest struct {
	Filenames    []string `json:"filenames"`
	ContentTypes []string `json:"contentTypes"`
}

type S3Url struct {
	Filename      string `json:"filename"`
	Url           string `json:"url"`
	CloudfrontUrl string `json:"cloudfrontUrl"`
}

type GenerateS3UrlsResponse struct {
	Urls []S3Url `json:"urls"`
}

const cloudfrontDomain = "https://d20v9h61x1jwiy.cloudfront.net"

func GenerateS3UploadUrlsHandler(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := middleware.GetAuthUser(r)
		if user == nil {
			response.WriteJSON(w, http.StatusUnauthorized, response.GeneralError(errors.New("unauthorized")))
			return
		}
		routeId := r.PathValue("id")
		if routeId == "" {
			response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(errors.New("route id required")))
			return
		}
		
		// Check if user has permission to upload photos to this route
		permission, err := storage.CheckUserRoutePermission(user.Email, routeId)
		if err != nil {
			response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(err))
			return
		}
		
		if permission != "owner" && permission != "upload" {
			response.WriteJSON(w, http.StatusForbidden, response.GeneralError(errors.New("you don't have permission to upload photos to this route")))
			return
		}
		var req GenerateS3UrlsRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(err))
			return
		}
		if len(req.Filenames) == 0 || len(req.Filenames) > 30 {
			response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(errors.New("must provide 1-30 filenames")))
			return
		}
		if len(req.ContentTypes) != len(req.Filenames) {
			response.WriteJSON(w, http.StatusBadRequest, response.GeneralError(errors.New("contentTypes length must match filenames length")))
			return
		}
		bucket := os.Getenv("S3_BUCKET")
		if bucket == "" {
			bucket = "mapmymoment-image"
		}
		region := os.Getenv("AWS_REGION")
		if region == "" {
			region = "ap-south-1"
		}
		var urls []S3Url
		for i, fname := range req.Filenames {
			fname = strings.ReplaceAll(fname, "..", "") // basic security
			key := routeId + "/" + fname
			contentType := req.ContentTypes[i]
			signedUrl, err := utils.GeneratePresignedS3URL(bucket, key, region, contentType, 10*time.Minute)
			if err != nil {
				response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(err))
				return
			}
			urls = append(urls, S3Url{
				Filename:      fname,
				Url:           signedUrl,
				CloudfrontUrl: fmt.Sprintf("%s/%s", cloudfrontDomain, key),
			})
		}
		// Update the route in the database with CloudFront URLs
		if len(urls) > 0 {
			photos := make([]types.Photo, len(urls))
			for i, url := range urls {
				photos[i] = types.Photo{
					Filename:      url.Filename,
					CloudfrontUrl: url.CloudfrontUrl,
				}
			}
			// Fetch the existing route to ensure the update is applied correctly
			existingRoute, err := storage.GetRouteById(routeId)
			if err != nil {
				response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(err))
				return
			}

			// Cast the existing route to types.Route
			route, ok := existingRoute.(types.Route)
			if !ok {
				response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(errors.New("invalid route type")))
				return
			}

			// Append the new photos to the existing ones instead of replacing them
			if route.Photos == nil {
				route.Photos = photos
			} else {
				route.Photos = append(route.Photos, photos...)
			}

			// Save the updated route
			_, updateErr := storage.UpdateRoute(routeId, route)
			if updateErr != nil {
				response.WriteJSON(w, http.StatusInternalServerError, response.GeneralError(updateErr))
				return
			}
		}
		response.WriteJSON(w, http.StatusOK, GenerateS3UrlsResponse{Urls: urls})
	}
}

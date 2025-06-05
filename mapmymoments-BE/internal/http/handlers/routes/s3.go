package routes

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/atindraraut/crudgo/internal/utils"
	"github.com/atindraraut/crudgo/internal/utils/middleware"
	"github.com/atindraraut/crudgo/internal/utils/response"
)

type GenerateS3UrlsRequest struct {
	Filenames    []string `json:"filenames"`
	ContentTypes []string `json:"contentTypes"`
}

type S3Url struct {
	Filename string `json:"filename"`
	Url      string `json:"url"`
}

type GenerateS3UrlsResponse struct {
	Urls []S3Url `json:"urls"`
}

func GenerateS3UploadUrlsHandler() http.HandlerFunc {
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
			urls = append(urls, S3Url{Filename: fname, Url: signedUrl})
		}
		response.WriteJSON(w, http.StatusOK, GenerateS3UrlsResponse{Urls: urls})
	}
}

package public

import (
	"net/http"

	"github.com/atindraraut/crudgo/storage"
)

func RegisterRoutes(router *http.ServeMux, storage storage.Storage) {
	router.HandleFunc("GET /health", Health(storage))
}

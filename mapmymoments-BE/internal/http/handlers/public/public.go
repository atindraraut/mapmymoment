package public

import (
	"net/http"
	"github.com/atindraraut/crudgo/internal/utils/response"
	"github.com/atindraraut/crudgo/storage"
)

func Health(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		responseData := map[string]interface{}{
			"Message": "healthy hun bhai bmi dedu ab???",
		}
		response.WriteJSON(w, http.StatusOK, responseData)
	}
}

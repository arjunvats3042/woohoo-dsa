package handler

import (
	"net/http"
	"woohoodsa/pkg/app"
)

var server http.Handler

func init() {
	server = app.SetupServer()
}

func Handler(w http.ResponseWriter, r *http.Request) {
	server.ServeHTTP(w, r)
}

package types

import (
	jwt "github.com/dgrijalva/jwt-go"
)

type Student struct {
	Id int64
	Name string `validate:"required"`
	Age int `validate:"required"`
	Email string `validate:"required"`
}

type SignedDetails struct {
	Email      string
	First_name string
	Last_name  string
	Uid        string
	jwt.StandardClaims
}
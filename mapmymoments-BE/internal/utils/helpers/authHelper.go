package auth

import (
	"fmt"
	"log/slog"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/atindraraut/crudgo/internal/types"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/ses"
	"github.com/dgrijalva/jwt-go"
	"golang.org/x/oauth2"
	"encoding/json"
)

var SECRET_KEY string = os.Getenv("SECRET_KEY")

func GenerateAllTokens(email, first_name, last_name, uid string, forOAuth bool) (interface{}, string, error) {
	claims := &types.SignedDetails{
		Email:      email,
		First_name: first_name,
		Last_name:  last_name,
		Uid:        uid,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(time.Minute * 15).Unix(),
		},
	}
	refreshClaims := &types.SignedDetails{
		Email:      email,
		First_name: first_name,
		Last_name:  last_name,
		Uid:        uid,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(time.Hour * 24 * 7).Unix(),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	signedToken, err := token.SignedString([]byte(SECRET_KEY))
	if err != nil {
		return nil, "", err
	}
	signedRefreshToken, err := refreshToken.SignedString([]byte(SECRET_KEY))
	if err != nil {
		return nil, "", err
	}

	if forOAuth {
		// Return an *oauth2.Token object for OAuth flows
		return &oauth2.Token{
			AccessToken:  signedToken,
			RefreshToken: signedRefreshToken,
			Expiry:       time.Now().Add(time.Minute * 15),
		}, signedRefreshToken, nil
	}

	// Return JWT tokens for non-OAuth flows
	return signedToken, signedRefreshToken, nil
}

func VerifyToken(tokenStr string) (details *types.SignedDetails, msg string) {
	token, err := jwt.ParseWithClaims(tokenStr, &types.SignedDetails{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(SECRET_KEY), nil
	})
	if err != nil {
		return nil, err.Error()
	}
	claims, ok := token.Claims.(*types.SignedDetails)
	if !ok || !token.Valid {
		return nil, "invalid token"
	}
	return claims, "nil"
}

// VerifyOAuthToken validates an OAuth token
func VerifyOAuthToken(tokenStr string) bool {
	// Define the Google OAuth userinfo endpoint
	userinfoEndpoint := "https://www.googleapis.com/oauth2/v3/tokeninfo"

	// Make a GET request to validate the token
	resp, err := http.Get(userinfoEndpoint + "?access_token=" + tokenStr)
	if err != nil {
		return false
	}
	defer resp.Body.Close()

	// Check if the response status is OK
	if resp.StatusCode != http.StatusOK {
		return false
	}

	// Optionally, parse the response to extract and validate claims
	var userInfo map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return false
	}

	// Ensure the token contains required claims (e.g., email, expiry)
	if _, ok := userInfo["email"]; !ok {
		return false
	}

	return true
}

// SendEmailOTP sends a beautiful HTML email with a copyable OTP for your travel app
func SendEmailOTP(email, otp string) error {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-east-1"), // Replace with your AWS region
	})
	if err != nil {
		slog.Error("Failed to create AWS session", slog.String("error", err.Error()))
		return err
	}

	svc := ses.New(sess)

	subject := "Your MapMyMoments OTP Code"
	htmlBody := `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Your MapMyMoments OTP</title>
  <style>
    body { background: #f8fafc; font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; }
    .container { max-width: 420px; margin: 48px auto; background: #fff; border-radius: 10px; box-shadow: 0 2px 12px #0001; padding: 32px 28px; border: 1px solid #e5e7eb; }
    .logo { text-align: center; margin-bottom: 18px; }
    .logo img { width: 40px; }
    .title { color: #1e293b; font-size: 1.35rem; font-weight: 600; text-align: center; margin-bottom: 6px; letter-spacing: 0.01em; }
    .subtitle { color: #475569; text-align: center; margin-bottom: 22px; font-size: 1rem; font-weight: 400; }
    .otp-box { background: #f1f5f9; border-radius: 6px; padding: 14px 0; text-align: center; font-size: 1.7rem; font-weight: 600; letter-spacing: 0.28em; color: #0f172a; margin-bottom: 12px; font-family: 'Fira Mono', 'Consolas', monospace; user-select: all; border: 1px solid #e2e8f0; }
    .footer { color: #64748b; font-size: 0.95rem; text-align: center; margin-top: 28px; border-top: 1px solid #e5e7eb; padding-top: 18px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <img src="https://i.imgur.com/2yaf2wb.png" alt="MapMyMoments Logo" />
    </div>
    <div class="title">Your OTP for MapMyMoments</div>
    <div class="subtitle">Enter this code to verify your email and continue your journey.</div>
    <div class="otp-box" id="otp">` + otp + `</div>
    <div class="footer">
      This OTP is valid for 10 minutes.<br>
      If you did not request this, you can safely ignore this email.<br><br>
      &copy; ` + fmt.Sprint(time.Now().Year()) + ` MapMyMoments
    </div>
  </div>
</body>
</html>
`

	input := &ses.SendEmailInput{
		Destination: &ses.Destination{
			ToAddresses: []*string{
				aws.String(email),
			},
		},
		Message: &ses.Message{
			Body: &ses.Body{
				Html: &ses.Content{
					Charset: aws.String("UTF-8"),
					Data:    aws.String(htmlBody),
				},
			},
			Subject: &ses.Content{
				Charset: aws.String("UTF-8"),
				Data:    aws.String(subject),
			},
		},
		Source: aws.String("hello@mapmymoments.in"), // Replace with your verified SES email
	}

	_, err = svc.SendEmail(input)
	if err != nil {
		slog.Error("Failed to send email", slog.String("error", err.Error()))
		return err
	}

	slog.Info("Email sent successfully")
	return nil
}

func GenerateOTP() string {
	return fmt.Sprintf("%06d", rand.Intn(1000000))
}

func HandleOAuthTokenErrors(err error) string {
	if err != nil {
		switch {
		case strings.Contains(err.Error(), "invalid_token"):
			return "Invalid token. Please log in again."
		case strings.Contains(err.Error(), "token_expired"):
			return "Token expired. Please refresh your token."
		default:
			return "An unknown error occurred. Please try again."
		}
	}
	return ""
}

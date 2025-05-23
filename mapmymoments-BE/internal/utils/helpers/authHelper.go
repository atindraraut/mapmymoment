package auth

import (
	"fmt"
	"log/slog"
	"math/rand"
	"net/smtp"
	"os"
	"time"

	"github.com/atindraraut/crudgo/internal/types"
	"github.com/dgrijalva/jwt-go"
)

var SECRET_KEY string = os.Getenv("SECRET_KEY")

func GenerateAllTokens(email, first_name, last_name, uid string) (string, string, error) {
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
		return "", "", err
	}
	signedRefreshToken, err := refreshToken.SignedString([]byte(SECRET_KEY))
	if err != nil {
		return "", "", err
	}
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

// SendEmailOTP sends a beautiful HTML email with a copyable OTP for your travel app
func SendEmailOTP(email, otp string) error {
	// Mailtrap credentials
	auth := smtp.PlainAuth("", "api", "3df85c226c7a33228c1528f16dc257fd", "live.smtp.mailtrap.io")

	to := []string{email}
	from := "hello@demomailtrap.co"

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
    .copy-btn { display: inline-block; background: #2563eb; color: #fff; border: none; border-radius: 5px; padding: 7px 20px; font-size: 1rem; font-weight: 500; cursor: pointer; margin: 0 auto; transition: background 0.2s; }
    .copy-btn:hover { background: #1d4ed8; }
    .copy-note { color: #64748b; font-size: 0.95rem; text-align: center; margin-top: 7px; }
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
    <div style="text-align:center;">
      <button class="copy-btn" onclick="navigator.clipboard && navigator.clipboard.writeText && navigator.clipboard.writeText('` + otp + `')">Copy OTP</button>
      <div class="copy-note">If the button doesn't work, please select and copy the code above.</div>
    </div>
    <div class="footer">
      This OTP is valid for 10 minutes.<br>
      If you did not request this, you can safely ignore this email.<br><br>
      &copy; ` + fmt.Sprint(time.Now().Year()) + ` MapMyMoments
    </div>
  </div>
</body>
</html>
`

	msg := []byte("From: " + from + "\r\n" +
		"To: " + email + "\r\n" +
		"Subject: Your MapMyMoments OTP Code\r\n" +
		"MIME-version: 1.0;\r\nContent-Type: text/html; charset=\"UTF-8\";\r\n\r\n" +
		htmlBody)

	err := smtp.SendMail("live.smtp.mailtrap.io:587", auth, from, to, msg)
	if err != nil {
		slog.Error("Failed to send email", err)
		return err
	}

	slog.Info("Email sent successfully")
	return nil
}

func GenerateOTP() string {
	return fmt.Sprintf("%06d", rand.Intn(1000000))
}

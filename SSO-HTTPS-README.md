# Hướng dẫn cấu hình SSO với HTTPS cho JobPortal

## Tổng quan

JobPortal sử dụng Google OAuth để xác thực người dùng thông qua HTTPS. Tài liệu này hướng dẫn các bước cấu hình và kiểm tra SSO hoạt động với HTTPS.

## Yêu cầu cơ bản

1. Chứng chỉ SSL hợp lệ được cấu hình trong Ingress (đã hoàn thành)
2. Google OAuth Client ID và Client Secret
3. Domain đã được cấu hình trong Google Cloud Console
4. Biến môi trường đúng trong Kubernetes secrets

## Cấu hình Google Cloud Console

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Vào "APIs & Services" > "Credentials"
3. Chỉnh sửa OAuth Client ID hiện có hoặc tạo mới
4. Thêm Authorized redirect URIs:
   - `https://jobmarket.fun/api/v1/user/auth/google/callback`
5. Lưu lại thay đổi

## Cấu hình Kubernetes Secrets

```bash
# Tạo secret mới hoặc cập nhật secret hiện có
kubectl create secret generic app-secrets \
  --from-literal=GOOGLE_CLIENT_ID="your-client-id" \
  --from-literal=GOOGLE_CLIENT_SECRET="your-client-secret" \
  --from-literal=OAUTH_CALLBACK_URL="https://jobmarket.fun/api/v1/user/auth/google/callback" \
  --from-literal=FRONTEND_URL="https://jobmarket.fun" \
  --from-literal=SECRET_KEY="your-jwt-secret" \
  --from-literal=REFRESH_TOKEN_SECRET="your-refresh-token-secret" \
  --dry-run=client -o yaml | kubectl apply -f -

# HOẶC sửa secret hiện tại
kubectl edit secret app-secrets
```

**Lưu ý**: Giá trị trong secret phải được mã hóa base64.

## Kiểm tra cấu hình

```bash
# Kiểm tra endpoint auth/test
curl -s "https://jobmarket.fun/api/v1/user/auth/test" | jq .

# Kiểm tra endpoint auth/status
curl -s "https://jobmarket.fun/api/v1/user/auth/status" | jq .
```

## Xử lý sự cố

### 1. Vấn đề về cookie

Nếu cookie không được thiết lập đúng:

```bash
# Kiểm tra các headers trong response từ backend
curl -v "https://jobmarket.fun/api/v1/user/auth/google/callback?code=test&state=test"
```

Cookie phải có các thuộc tính sau:
- `HttpOnly`
- `Secure`
- `SameSite=Lax`
- `Domain` đúng với domain của ứng dụng

### 2. Vấn đề về CORS

```bash
# Kiểm tra CORS headers
curl -X OPTIONS -v -H "Origin: https://jobmarket.fun" \
  "https://jobmarket.fun/api/v1/user/auth/status"
```

### 3. Kiểm tra logs

```bash
# Kiểm tra logs từ pods
kubectl logs -f deployment/backend | grep -i "auth\|sso\|google\|cookie"
kubectl logs -f deployment/frontend | grep -i "auth\|sso\|google\|cookie"
```

### 4. Restart pods sau khi thay đổi

```bash
kubectl rollout restart deployment backend
kubectl rollout restart deployment frontend
```

## Flow hoạt động của SSO

1. Người dùng nhấp vào "Đăng nhập với Google" trên trang login
2. Chuyển hướng đến `https://jobmarket.fun/api/v1/user/auth/google`
3. Backend chuyển tiếp đến Google OAuth
4. Sau khi xác thực, Google chuyển hướng về `https://jobmarket.fun/api/v1/user/auth/google/callback`
5. Backend xử lý callback, tạo JWT token và thiết lập HttpOnly cookies
6. Backend chuyển hướng người dùng về `https://jobmarket.fun/sso-callback?success=true`
7. Frontend lấy thông tin người dùng từ `/sso/profile` dựa trên cookies
8. Người dùng được xác thực và chuyển về trang chính

## Các file đã được cập nhật

1. `backend/utils/passport.js` - Cấu hình passport Google Strategy
2. `backend/controllers/user.controller.js` - Xử lý cookie trong ssoAuthSuccess
3. `backend/routes/user.route.js` - Các route liên quan đến SSO
4. `frontend/src/components/auth/SSOCallback.jsx` - Component xử lý callback từ SSO
5. `frontend/src/utils/api.js` - Headers cho HTTPS
6. `frontend/src/hooks/useAuthCheck.jsx` - Logic xác thực người dùng

## Kiểm tra trên giao diện

1. Truy cập `https://jobmarket.fun/login`
2. Nhấn nút "Đăng nhập với Google"
3. Hoàn thành quy trình đăng nhập
4. Kiểm tra Cookie đã được thiết lập (F12 > Application > Storage > Cookies)
5. Kiểm tra người dùng đã được xác thực thành công

## Tài liệu tham khảo

- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Google OAuth](http://www.passportjs.org/packages/passport-google-oauth20/)
- [HTTP Cookie Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#security)

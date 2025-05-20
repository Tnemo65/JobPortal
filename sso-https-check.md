# Hướng dẫn kiểm tra SSO với HTTPS

Sau khi đã thực hiện các thay đổi để hỗ trợ SSO với HTTPS, vui lòng thực hiện các bước kiểm tra sau:

## 1. Kiểm tra cấu hình OAuth

```bash
kubectl get secret app-secrets -o jsonpath="{.data.OAUTH_CALLBACK_URL}" | base64 --decode
kubectl get secret app-secrets -o jsonpath="{.data.GOOGLE_CLIENT_ID}" | base64 --decode
kubectl get secret app-secrets -o jsonpath="{.data.GOOGLE_CLIENT_SECRET}" | base64 --decode
```

Xác nhận các giá trị trên là chính xác:
- `OAUTH_CALLBACK_URL` phải là: `https://jobmarket.fun/api/v1/user/auth/google/callback`
- `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` phải không trống

## 2. Kiểm tra các dịch vụ

```bash
kubectl get pods
kubectl describe ingress jobportal-ingress
```

## 3. Truy cập Google Cloud Console

1. Đi đến [Google Cloud Console](https://console.cloud.google.com)
2. Chọn dự án của bạn
3. Đi đến "APIs & Services" > "Credentials"
4. Chỉnh sửa OAuth Client ID
5. Xác nhận "Authorized redirect URIs" có bao gồm:
   - `https://jobmarket.fun/api/v1/user/auth/google/callback`

## 4. Kiểm tra trên trình duyệt

1. Truy cập `https://jobmarket.fun/login`
2. Nhấn vào nút "Đăng nhập với Google"
3. Hoàn thành quá trình đăng nhập
4. Theo dõi URL khi chuyển hướng về lại ứng dụng
   - Nên là: `https://jobmarket.fun/sso-callback?success=true`

## 5. Kiểm tra cookies

1. Mở Developer Tools (F12)
2. Chọn tab "Application"
3. Trong phần "Storage" > "Cookies"
4. Xác nhận cookie `access_token` và `refresh_token`:
   - Có thuộc tính `HttpOnly`
   - Có thuộc tính `Secure`
   - Có giá trị Domain là `.jobmarket.fun` hoặc `jobmarket.fun`

## 6. Kiểm tra logs từ backend

```bash
kubectl logs -f deployment/backend | grep "auth\|sso\|oauth\|cookie"
```

## 7. Khắc phục sự cố

Nếu SSO không hoạt động, hãy kiểm tra:

- Lỗi trên trình duyệt (F12 > Console)
- Lỗi trên backend logs
- Cấu hình Google OAuth
- Proxy settings trong NGINX
- DNS và certificates

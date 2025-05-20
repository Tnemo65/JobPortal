@echo off
echo ===== Kiểm tra cấu hình HTTPS và SSO JobPortal =====
echo.

echo Kiểm tra trạng thái pods:
kubectl get pods
echo.

echo Kiểm tra cấu hình ingress:
kubectl describe ingress jobportal-ingress | findstr "TLS\|Host\|backend\|Path"
echo.

echo Kiểm tra secret TLS:
kubectl get secret jobmarket-tls
echo.

echo Kiểm tra biến môi trường OAuth:
kubectl get secret app-secrets -o jsonpath="{.data.OAUTH_CALLBACK_URL}" | echo.
kubectl get secret app-secrets -o jsonpath="{.data.GOOGLE_CLIENT_ID}" | echo.
echo.

echo Kiểm tra logs backend có lỗi OAuth không:
kubectl logs -n default deployment/backend --tail=50 | findstr /i "oauth\|sso\|google\|auth"
echo.

echo ===== Để khởi động lại các pods sau khi cấu hình, chạy lệnh: =====
echo kubectl rollout restart deployment backend
echo kubectl rollout restart deployment frontend
echo.

echo ===== Kiểm tra hoàn tất ===== 

@echo off
echo ===== Triển khai cập nhật SSO HTTPS cho JobPortal =====
echo.

echo Áp dụng thay đổi cho backend...
kubectl rollout restart deployment backend
echo.

echo Áp dụng thay đổi cho frontend...
kubectl rollout restart deployment frontend
echo.

echo Kiểm tra trạng thái pods...
kubectl get pods
echo.

echo Đợi 30 giây để pods khởi động...
timeout /t 30 /nobreak
echo.

echo Kiểm tra logs của backend...
kubectl logs -n default deployment/backend --tail=20
echo.

echo ===== Triển khai hoàn tất =====
echo Bạn có thể truy cập https://jobmarket.fun/login để kiểm tra SSO

pause

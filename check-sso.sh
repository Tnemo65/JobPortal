#!/bin/bash
# Script kiểm tra tình trạng của SSO sau khi áp dụng thay đổi HTTPS

# Set domain
DOMAIN="jobmarket.fun"

echo "===== Kiểm tra trạng thái SSO cho $DOMAIN ====="
echo ""

# Kiểm tra endpoint auth/test
echo "1. Kiểm tra cấu hình OAuth:"
curl -s "https://$DOMAIN/api/v1/user/auth/test" | jq .
echo ""

# Kiểm tra endpoint auth/status
echo "2. Kiểm tra trạng thái SSO:"
curl -s "https://$DOMAIN/api/v1/user/auth/status" | jq .
echo ""

# Kiểm tra TLS
echo "3. Kiểm tra cấu hình HTTPS/TLS:"
curl -s -v "https://$DOMAIN" > /dev/null 2>&1
echo ""

# Kiểm tra redirect
echo "4. Kiểm tra redirect từ HTTP sang HTTPS:"
curl -s -I "http://$DOMAIN" | grep -i location
echo ""

echo "===== Kiểm tra hoàn tất ====="

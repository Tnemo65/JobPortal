@echo off
echo Starting JobPortal development environment...

cd backend
start cmd /k "echo Starting backend server... && npm run dev"

cd ../frontend
start cmd /k "echo Starting frontend server... && npm run dev"

echo Both servers are starting up. Please wait...
echo Backend will be available at http://localhost:8080
echo Frontend will be available at http://localhost:5173

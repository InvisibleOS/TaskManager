@echo off
cd /d "%~dp0"
start http://localhost:3000
echo.
echo ========================================================
echo   ToDo App Server is Running
echo.
echo   DO NOT CLOSE THIS WINDOW while using the app.
echo   Close this window to STOP the server.
echo ========================================================
echo.
node server.js

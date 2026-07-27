@echo off
cd /d "%~dp0"
echo Starting Monster Throne v0.6...
start "" http://localhost:8080/hero06/
py -m http.server 8080
if errorlevel 1 python -m http.server 8080
pause

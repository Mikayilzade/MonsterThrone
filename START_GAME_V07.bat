@echo off
setlocal
cd /d "%~dp0"
echo.
echo Monster Throne v0.7 - Hero Progression
echo Open: http://localhost:8080/hero07/
echo Keep this window open while playing.
echo.
start "" http://localhost:8080/hero07/
py -m http.server 8080
if errorlevel 1 python -m http.server 8080
pause

@echo off
setlocal
cd /d "%~dp0"
echo.
echo Monster Throne v0.7.2 - Honest Combat and Crafting
echo PC: http://localhost:8080/hero072/
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
  for /f "tokens=*" %%B in ("%%A") do echo PHONE: http://%%B:8080/hero072/
)
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /c:"IPv4-"') do (
  for /f "tokens=*" %%B in ("%%A") do echo PHONE: http://%%B:8080/hero072/
)
echo Keep this window open while playing.
start "" http://localhost:8080/hero072/
py -m http.server 8080
if errorlevel 1 python -m http.server 8080
pause

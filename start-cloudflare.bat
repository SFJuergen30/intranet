@echo off
echo Starting Cloudflare Tunnel...
echo.
echo Your URL will appear below (look for .trycloudflare.com)
echo.
.\cloudflared.exe tunnel --url http://localhost:3000
pause

@echo off
echo Starting LocalTunnel on port 3000...
echo.
echo NOTE: You will need the Tunnel Password.
echo Your IP is roughly your public IP. Check it at: https://loca.lt/mytunnelpassword
echo.
call npx localtunnel --port 3000
pause

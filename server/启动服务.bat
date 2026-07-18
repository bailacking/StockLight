@echo off
cd /d "%~dp0.."
echo ========================================
echo     StockLight - Start Server
echo ========================================
echo.
echo  Starting HTTP server at 0.0.0.0:8000
echo  Browser will open automatically
echo.
set /p confirm="Press Y to start (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Cancelled.
    pause
    exit /b
)
echo.
start http://127.0.0.1:8000/
python server/start_server.py
pause

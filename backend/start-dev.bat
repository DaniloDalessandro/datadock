@echo off
echo ========================================
echo  DataDock - Development Startup Script
echo ========================================
echo.

echo [1/4] Checking Redis...
redis-cli ping >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Redis is not running!
    echo Please start Redis first:
    echo   docker run -d -p 6379:6379 --name redis redis:latest
    pause
    exit /b 1
)
echo [OK] Redis is running

echo.
echo [2/4] Installing dependencies...
call venv\Scripts\activate
pip install -r requirements.txt >nul 2>&1
echo [OK] Dependencies installed

echo.
echo [3/4] Running migrations...
python manage.py migrate
echo [OK] Migrations completed

echo.
echo [4/4] Starting services...
echo.
echo Starting Celery worker in background...
start /B celery -A core worker --loglevel=info --pool=solo

echo.
echo Starting Django development server...
echo.
echo ========================================
echo   All services are running!
echo   - Django: http://localhost:8000
echo   - Redis: localhost:6379
echo   - Celery: Running in background
echo ========================================
echo.

python manage.py runserver

#!/bin/bash

echo "========================================"
echo " DataDock - Development Startup Script"
echo "========================================"
echo ""

echo "[1/4] Checking Redis..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "[ERROR] Redis is not running!"
    echo "Please start Redis first:"
    echo "  docker run -d -p 6379:6379 --name redis redis:latest"
    exit 1
fi
echo "[OK] Redis is running"

echo ""
echo "[2/4] Installing dependencies..."
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1
echo "[OK] Dependencies installed"

echo ""
echo "[3/4] Running migrations..."
python manage.py migrate
echo "[OK] Migrations completed"

echo ""
echo "[4/4] Starting services..."
echo ""
echo "Starting Celery worker in background..."
celery -A core worker --loglevel=info &
CELERY_PID=$!

echo ""
echo "Starting Django development server..."
echo ""
echo "========================================"
echo "   All services are running!"
echo "   - Django: http://localhost:8000"
echo "   - Redis: localhost:6379"
echo "   - Celery PID: $CELERY_PID"
echo "========================================"
echo ""

# Trap to kill celery on exit
trap "kill $CELERY_PID" EXIT

python manage.py runserver

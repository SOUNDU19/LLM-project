@echo off
title AegisDesk - AI Helpdesk Setup & Launcher
echo =======================================================================
echo              AegisDesk AI Helpdesk Automation Launcher
echo =======================================================================
echo.
echo This script will set up environments, install dependencies, and run
echo both the FastAPI Backend and the React Frontend in separate windows.
echo.
echo Please keep this window open while the services load.
echo.
echo =======================================================================
echo.

:: 1. Backend Launch
echo [Backend] Booting FastAPI Server (Port 8000)...
start "AegisDesk Backend API" cmd /k "cd backend && if not exist venv (echo [Backend] Creating virtual environment... && python -m venv venv) && call venv\Scripts\activate && echo [Backend] Installing Python requirements... && pip install -r requirements.txt && echo [Backend] Starting Uvicorn... && uvicorn app.main:app --reload --port 8000"

:: Wait a brief moment
timeout /t 3 /nobreak >nul

:: 2. Frontend Launch
echo [Frontend] Booting React Vite App (Port 5173)...
start "AegisDesk Frontend Client" cmd /k "cd frontend && echo [Frontend] Installing Node dependencies... && npm install && echo [Frontend] Starting Vite development server... && npm run dev"

echo.
echo =======================================================================
echo.
echo [System] Boot processes triggered!
echo.
echo - Backend API:  http://localhost:8000
echo - Swagger Docs: http://localhost:8000/docs
echo - Frontend:     http://localhost:5173
echo.
echo Press any key to close this launcher menu.
echo =======================================================================
pause >nul

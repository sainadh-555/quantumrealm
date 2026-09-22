@echo off
cd /d "%~dp0backend"

if not exist venv (
    echo [Quantum Backend] Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [Quantum Backend] Failed to create venv with 'python'. Trying 'py'...
        py -m venv venv
    )
)

echo [Quantum Backend] Activating virtual environment...
call venv\Scripts\activate.bat

echo [Quantum Backend] Installing/Updating dependencies...
pip install -r requirements.txt

echo [Quantum Backend] Starting FastAPI server on port 8000...
python -m uvicorn main:app --reload --port 8000

pause

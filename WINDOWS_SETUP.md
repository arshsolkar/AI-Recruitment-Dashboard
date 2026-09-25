# Windows Setup Guide

### Prerequisites
Before starting, ensure you have the following installed on your Windows PC:

1. **Node.js** (v18 or higher)
2. **Python** (v3.9 or higher)
3. **Tesseract OCR** *(Crucial for the AI scanning to work on Windows)*:
   - Download the Windows installer from [UB-Mannheim Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki).
   - During installation, note the install path (usually `C:\Program Files\Tesseract-OCR`).
   - You must add this folder to your Windows `PATH` environment variable so `pytesseract` can find it.

---

### Terminal 1: Setup and Run the Frontend (React / Vite)
Open a terminal in the root folder of the extracted project and run:

```powershell
# 1. Install all Node dependencies
npm install

# 2. Start the frontend development server
npm run dev
```

*The frontend will now be accessible at [http://localhost:5173](http://localhost:5173).*

---

### Terminal 2: Setup and Run the Backend (FastAPI)
Open a **new** terminal in the root folder of the extracted project and run:

```powershell
# 1. Navigate into the backend directory
cd backend

# 2. Create a Python virtual environment named "venv"
python -m venv venv

# 3. Activate the virtual environment
# If using Command Prompt:
venv\Scripts\activate.bat

# If using PowerShell:
venv\Scripts\Activate.ps1

# 4. Install the required Python packages
pip install -r requirements.txt

# 5. Create the environment configuration file
copy .env.example .env

# 6. Start the FastAPI backend server
uvicorn app.main:app --reload --port 8000
```

*The backend API will now be accessible at [http://127.0.0.1:8000](http://127.0.0.1:8000).*

---

### Troubleshooting Tips for Windows:
* **"Execution of scripts is disabled on this system"**: If you get this error in PowerShell when trying to activate the virtual environment (`Activate.ps1`), you need to run PowerShell as Administrator and run: `Set-ExecutionPolicy Unrestricted -Scope CurrentUser`, then try activating again.
* **"tesseract is not installed or it's not in your PATH"**: This means the Python backend can't find Tesseract OCR. You need to either add it to your system PATH and restart your terminal, or manually point to it in the code (`pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'`).

# 🚀 How to Run the Application with Ollama Integration

## ✅ Integration Status
- **Ollama Integration**: Successfully implemented and tested (100% test pass rate)
- **Ollama Status**: Currently running (port 11434)
- **Dependencies**: Installed in virtual environment

## 📋 Prerequisites Check

### 1. Verify Ollama is Running
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it:
ollama serve
```

### 2. Verify Model is Available
```bash
# Check available models
ollama list

# If llama3.2:3b is not available, pull it:
ollama pull llama3.2:3b
```

## 🎯 Running the Application

### Option 1: Using Virtual Environment (Recommended)
```bash
# Navigate to backend directory
cd "/Users/arsh/Work/Development/recruitment dashboard/backend"

# Activate virtual environment
source venv/bin/activate

# Start the FastAPI backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Option 2: Direct Python (If Using System Python)
```bash
# Navigate to backend directory  
cd "/Users/arsh/Work/Development/recruitment dashboard/backend"

# Start the FastAPI backend
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 🌐 Frontend Setup

### Terminal 1: Backend
```bash
cd "/Users/arsh/Work/Development/recruitment dashboard/backend"
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2: Frontend
```bash
cd "/Users/arsh/Work/Development/recruitment dashboard"
npm run dev
```

## 🔍 Verify Integration

Once the backend is running, you can test the Ollama integration:

```bash
# Test the integration endpoint
curl http://localhost:8000/api/v1/health

# Or run the test suite
cd "/Users/arsh/Work/Development/recruitment dashboard/backend"
source venv/bin/activate
python test_ollama_integration.py
```

## 🎨 Access the Application

- **Frontend**: http://localhost:8443 (or your configured frontend port)
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🔧 Configuration

The Ollama settings are configured in `backend/app/config.py`:
- `OLLAMA_BASE_URL`: http://localhost:11434
- `OLLAMA_MODEL`: llama3.2:3b  
- `OLLAMA_TIMEOUT`: 15.0 seconds

You can override these in a `.env` file if needed:
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_TIMEOUT=15.0
```

## 🐛 Troubleshooting

### Ollama Connection Issues
```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Restart Ollama if needed
# Kill existing process and restart:
pkill -f ollama
ollama serve
```

### Backend Import Errors
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies if needed
pip install -r requirements.txt
```

### Port Conflicts
```bash
# Check if port 8000 is in use
lsof -i :8000

# Kill process if needed
kill -9 <PID>
```

## 📊 Integration Features

The new Ollama integration provides:
- ✅ **Structured Resume Parsing**: Extracts name, experience, education, skills in one pass
- ✅ **Placeholder Detection**: Identifies template resumes automatically  
- ✅ **Graceful Fallback**: Falls back to rule-based extraction if Ollama fails
- ✅ **Skill Normalization**: Maintains existing 280+ canonical skill mappings
- ✅ **Hash-based Naming**: Uses SHA256 hashes for unnamed candidates
- ✅ **100% Local Processing**: No cloud API dependencies

## 🎉 Success Indicators

When the integration is working correctly:
- Resume uploads will use Ollama for extraction
- Console logs will show "Ollama-based extraction" messages
- Extracted data will include normalized skills and accurate experience calculations
- Template resumes will be flagged with `requires_manual_entry = True`

---

**Ready to run! Start with Option 1 above.**
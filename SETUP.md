# RecruitAI - Setup Instructions

## Environment Configuration

Create a `.env` file in the project root with the following content:

```
VITE_API_URL=http://localhost:8000
```

Note: The frontend runs on port 8443 by default, and the backend runs on port 8000.

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Download spaCy model (optional but recommended):
```bash
python -m spacy download en_core_web_sm
```

5. Start the backend server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

## Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Running the Application

1. Start the backend server (in one terminal)
2. Start the frontend server (in another terminal)
3. Open `http://localhost:5173` in your browser

## Testing the Integration

1. Open the application in your browser
2. Paste a job description in the text area
3. Upload PDF resume files
4. Click "Analyze Candidates"
5. Watch the AI scanning animation
6. View the results in the Overview dashboard
7. Click on candidates to see detailed analysis
8. Export results using the Export button in the top bar

## Project Structure

- `src/` - React frontend application
- `backend/` - Python FastAPI backend
- `src/utils/api.ts` - API service layer for frontend-backend communication
- `src/data/candidates.ts` - Data models and conversion utilities
- `src/screens/` - Main application screens
- `src/components/` - Reusable UI components

## Key Features Implemented

- ✅ Real file upload to backend API
- ✅ Real-time analysis status polling
- ✅ Dynamic candidate data from backend
- ✅ Excel export from backend
- ✅ Candidate ranking and analysis
- ✅ Skill coverage analysis
- ✅ Match distribution visualization

# Production-Grade Name Extraction Engine - Implementation Guide

## Overview
This implementation upgrades the resume name extraction system to handle edge cases like multi-column layouts, hash filenames, and corrupted PDF metadata using a combination of LLM Structured Output and Layout-Aware Bounding Box Heuristics.

## What Was Implemented

### 1. **LLM Structured Output Name Extraction** (`extract_name_using_llm`)
- Uses OpenAI GPT-4o-mini (configurable) with JSON mode for structured output
- Analyzes first 1,000 characters of resume text
- Returns candidate name with confidence score and placeholder detection
- Rejects template names, dummy text, and section headers
- Gracefully falls back if LLM is unavailable or fails

### 2. **Font-Size Bounding Box Extraction** (`extract_name_using_font_size`)
- Uses `pdfplumber` to analyze PDF layout
- Extracts text from largest font size in top 25% of page 1
- Groups characters by font size and reconstructs text lines
- Cross-validates extracted text against name patterns
- Handles multi-column layouts by focusing on top region

### 3. **Combined Production Engine** (`extract_candidate_name_production`)
- **Primary Method**: LLM Structured Output
- **Secondary Method**: Font-Size Bounding Box (cross-verification)
- **Fallback**: Clean hash-based labels (`Unnamed Candidate (<hash>)`)
- **NEVER** uses PDF Author metadata or URL string noise
- Sets `requires_manual_name_entry` flag for UI correction

### 4. **File Hash Generation** (`generate_file_hash`)
- Generates SHA256 hash of PDF file content
- Returns first 8 characters for clean identifiers
- Used for fallback labels when name extraction fails

## Files Modified

### 1. `backend/requirements.txt`
Added new dependencies:
- `openai>=1.0,<2.0` - For LLM integration
- `pdfplumber>=0.10,<0.12` - For PDF layout analysis

### 2. `backend/app/config.py`
Added LLM configuration settings:
- `openai_api_key` - OpenAI API key (set via environment variable)
- `llm_model` - Model to use (default: "gpt-4o-mini")
- `llm_timeout` - Request timeout in seconds (default: 30)
- `enable_llm_name_extraction` - Enable/disable LLM extraction (default: True)

### 3. `backend/app/models.py`
Added to Candidate model:
- `requires_manual_name_entry` - Boolean field for UI flag
- Added Boolean import to SQLAlchemy imports

### 4. `backend/app/schemas.py`
Added to CandidateOut schema:
- `requires_manual_name_entry` - Exposed in API responses

### 5. `backend/app/nlp.py`
Added new functions:
- `extract_name_using_llm()` - LLM-based name extraction
- `extract_name_using_font_size()` - PDF layout-based extraction
- `generate_file_hash()` - File hash generation
- `extract_candidate_name_production()` - Combined production engine
- Added `hashlib` import for file hashing

### 6. `backend/app/services.py`
Updated to use new extraction engine:
- Imported `extract_candidate_name_production`
- Modified candidate creation to use new engine
- Sets `requires_manual_name_entry` flag based on extraction success

## Installation Requirements

### Environment Setup
The system requires Python dependencies to be installed. Since this is an externally-managed environment, you need to:

1. **Create a virtual environment** (recommended):
```bash
cd /Users/arsh/Work/Development/recruitment\ dashboard/backend
python3 -m venv venv
source venv/bin/activate
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

### Configuration
Set the following environment variables in a `.env` file in the backend directory:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Override default settings
LLM_MODEL=gpt-4o-mini
LLM_TIMEOUT=30
ENABLE_LLM_NAME_EXTRACTION=true
```

## Usage

### Basic Usage
The new name extraction engine is automatically used when processing resumes:

```python
from app.nlp import extract_candidate_name_production
from app.services import analyse_job

# The engine is automatically called in analyse_job()
# No code changes needed in existing workflows
```

### Manual Testing
```python
from app.nlp import extract_candidate_name_production, extract_pdf_text

# Extract text from PDF
text = extract_pdf_text("path/to/resume.pdf")

# Extract name using production engine
name, requires_manual = extract_candidate_name_production(
    text=text,
    filename="resume.pdf", 
    pdf_path="path/to/resume.pdf"
)

print(f"Name: {name}")
print(f"Requires manual entry: {requires_manual}")
```

## Fallback Behavior

When name extraction fails, the system:

1. **Sets `requires_manual_name_entry = True`** in the database
2. **Assigns clean fallback label**: `Unnamed Candidate (<file_hash>)`
3. **NEVER displays**:
   - PDF Author metadata (often corrupted)
   - Raw URL strings
   - UUID filenames
   - Template placeholder text

## Frontend Integration

The frontend can check the `requires_manual_name_entry` flag to:

1. **Show an indicator** next to candidates needing name correction
2. **Enable inline editing** for candidate names
3. **Highlight candidates** with placeholder names in the dashboard

Example API response:
```json
{
  "id": "candidate-123",
  "name": "Unnamed Candidate (a1b2c3d4)",
  "requires_manual_name_entry": true,
  "filename": "10d343d910cb636b.pdf",
  ...
}
```

## Testing

### Run Simple Tests
```bash
cd backend
python3 test_name_extraction_simple.py
```

### Run Full Tests (requires dependencies)
```bash
cd backend
python3 test_name_extraction.py
```

## Performance Considerations

- **LLM Latency**: GPT-4o-mini typically responds in 1-3 seconds
- **PDF Analysis**: pdfplumber adds ~0.5-1 second per resume
- **Fallback**: Hash generation is instantaneous
- **Graceful Degradation**: System works even if LLM is unavailable

## Error Handling

The system includes comprehensive error handling:

1. **LLM failures**: Falls back to font-size extraction
2. **PDF parsing errors**: Falls back to hash-based labels
3. **Missing dependencies**: Logs errors but continues processing
4. **Invalid names**: Validates and rejects low-confidence results

## Security Notes

- **API Keys**: Store OpenAI API key in environment variables, never in code
- **File Access**: Hash generation reads file content but doesn't store it
- **PII Protection**: System doesn't store full file content, only hash
- **Rate Limiting**: Consider implementing rate limiting for LLM API calls

## Future Enhancements

Potential improvements for the name extraction engine:

1. **Cache LLM results** for similar resume patterns
2. **Batch processing** for multiple resumes to reduce API calls
3. **Alternative LLM providers** (Anthropic, local models)
4. **Manual correction feedback loop** to improve extraction
5. **Confidence score thresholds** configurable per use case
6. **Multi-language support** for international resumes

## Troubleshooting

### LLM API Errors
- Check `OPENAI_API_KEY` is set correctly
- Verify API key has sufficient credits
- Check network connectivity to OpenAI

### PDF Parsing Errors
- Ensure PDF files are not corrupted
- Check pdfplumber installation: `pip show pdfplumber`
- Verify PDF has text layer (not image-only)

### Import Errors
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt`
- Check Python version compatibility (3.8+)

## Migration Notes

- **Existing data**: Old candidates will have `requires_manual_name_entry = False`
- **Database migration**: Need to add the new column to existing databases
- **Backward compatibility**: Old `extract_candidate_name_tiered` function still exists as fallback
- **API changes**: New field added to response, but existing fields unchanged
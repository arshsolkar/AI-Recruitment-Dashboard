# ROSP Project Scope: AI Powered Recruiter Dashboard

## Project Overview

**Project Name:** AI Powered Recruiter Dashboard  

### What is this project?

A complete AI-powered recruitment intelligence system that combines semantic matching with skill-based analysis to help recruiters analyze, compare, and rank candidates. The system integrates a modern React dashboard with Python-based AI/NLP processing to provide intelligent resume-to-job matching.

### Project Architecture

**Frontend:**
- React 19 with TypeScript
- Vite build system
- Tailwind CSS for styling
- XLSX library for Excel export

**Backend:**
- Python FastAPI for REST API
- PyMuPDF for PDF text extraction
- spaCy for NLP preprocessing
- Sentence Transformers (all-MiniLM-L6-v2) for semantic embeddings
- Scikit-learn for similarity calculations

**Project Scope:** Focused on AI/NLP research and implementation - semantic embeddings, similarity matching, skill analysis, and intelligent dashboard visualization for prototype/research purposes.

---

## System Architecture

```
                    USER INTERACTION
                           │
                    REACT FRONTEND
                           │
                    HTTP/REST API
                           │
                   FASTAPI BACKEND
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   PDF PROCESSING     NLP PROCESSING      AI MATCHING
   (PyMuPDF)         (spaCy)           (Sentence Transformers)
        │                  │                  │
        └──────────────────┴──────────────────┘
                           │
                    EMBEDDINGS + SCORING
                           │
                    CANDIDATE RANKING
                           │
                    MATCH EXPLANATION
                           │
                    API RESPONSE
                           │
                    FRONTEND DISPLAY
```

---

## Core Modules

### Module 1: Resume Upload & Processing
**Purpose:** Handle resume file uploads and extract text content

**Features:**
- Upload multiple PDF resumes via drag & drop or file browser
- Extract text from PDFs using PyMuPDF
- File validation and error handling
- Upload progress tracking
- File management (add/remove files)

**Technologies:**
- Frontend: React file upload components
- Backend: PyMuPDF (fitz) for PDF text extraction
- API: FastAPI file upload endpoints

**Data Flow:**
1. User selects PDF files via frontend interface
2. Files uploaded to FastAPI backend
3. PyMuPDF extracts text content from each PDF
4. Extracted text stored for NLP processing
5. Processing status updated in real-time

---

### Module 2: NLP Processing & Information Extraction
**Purpose:** Extract structured information from resumes and job descriptions

**Features:**
- Text preprocessing and cleaning
- Named Entity Recognition (NER)
- Skills extraction (technical and soft skills)
- Education extraction (degrees, institutions, years)
- Experience extraction (companies, roles, durations)
- Projects extraction (technologies, impact)

**Technologies:**
- spaCy for NLP processing
- Custom regex patterns for specific entities
- Text normalization and cleaning

**Extraction Categories:**
- **Skills:** Python, Machine Learning, TensorFlow, SQL, Docker, etc.
- **Education:** M.Tech Computer Science, IIT Delhi, etc.
- **Experience:** 5 years, Senior ML Engineer, etc.
- **Projects:** Recommendation engine, NLP pipeline, etc.

---

### Module 3: AI-Based Semantic Matching
**Purpose:** Calculate semantic similarity between job descriptions and resumes

**Features:**
- Generate text embeddings using all-MiniLM-L6-v2
- Calculate cosine similarity between JD and resumes
- Skill overlap analysis (Jaccard similarity)
- Experience relevance scoring
- Composite score calculation (semantic + skill + experience)

**Technologies:**
- Sentence Transformers (all-MiniLM-L6-v2) for embeddings
- Scikit-learn for cosine similarity
- NumPy for vector operations
- Custom scoring algorithms

**Scoring Components:**
- **Semantic Match:** Embedding-based similarity (0-100%)
- **Skill Match:** Overlap between required and candidate skills (0-100%)
- **Experience Match:** Relevance and duration of experience (0-100%)
- **Overall Match:** Weighted composite score (0-100%)

---

### Module 4: Candidate Ranking & Explanation
**Purpose:** Rank candidates and provide match explanations

**Features:**
- Candidate ranking by overall match score
- Match explanation generation with detailed breakdowns
- Recommendation categorization (Strong/Good/Moderate/Weak Match)
- AI-generated insights for each candidate
- Missing skills identification
- Skill coverage analysis across all candidates
- Requirement coverage analysis with status indicators
- Detailed candidate profiles with comprehensive information

**Output Format:**

**Excel Report - Candidate Ranking Sheet:**

| Candidate | Overall Match | Semantic Match | Skill Match | Experience Match | Recommendation |
|-----------|---------------|----------------|-------------|------------------|----------------|
| Rahul Sharma | 94% | 94% | 90% | 86% | Strong Match |
| Priya Patel | 91% | 91% | 87% | 88% | Strong Match |
| Aman Kumar | 88% | 88% | 84% | 92% | Good Match |

*Note: This comprehensive table format is generated in the Excel export report. The UI displays this data in different visual formats (gauges, progress bars, badges) across multiple screens.*

**Detailed Match Explanation Components:**

**Score Breakdown:**
- Visual gauge for overall match score
- Individual progress bars for Semantic Fit, Technical Skills, and Experience
- Color-coded scoring based on match quality

**Requirement Coverage:**
- Job requirements mapped to candidate capability status
- Status indicators: Strong, Good, Limited, Missing
- Visual icons and color coding for each requirement

**Skills Analysis:**
- Matching skills highlighted and listed
- Missing skills identified with visual indicators
- Skills count and gap analysis

**AI Insight:**
- Detailed AI-generated recommendation text
- Comprehensive explanation of match quality
- Strengths and areas for improvement

**Quick Stats Panel:**
- Skills matched count
- Gaps found count
- Experience duration
- Education level

**Detailed Profile Sections:**
- Education history with institutions and dates
- Work experience with companies and durations
- Notable projects with descriptions and impact

---

## Frontend Screens

### Screen 1: New Analysis
**Purpose:** Initial screen for job description input and resume upload

**Components:**
- Job Description Input
  - Text paste mode (default)
  - PDF upload mode
  - Character count display
  - Clear/reset functionality

- Resume Upload
  - Drag & drop interface
  - File browser upload
  - Multiple file support
  - File list with size display
  - Remove individual files
  - Upload status indicators

- Actions
  - "Analyze Candidates" button (enabled when JD + resumes provided)
  - Feature indicators (Semantic matching, Skill analysis, Candidate ranking)

**User Flow:**
1. User enters JD text or uploads JD PDF
2. User uploads resume PDFs
3. System validates inputs
4. User clicks "Analyze Candidates"
5. System transitions to AI Scanning screen

---

### Screen 2: AI Scanning
**Purpose:** Display AI processing progress and animation

**Components:**
- Animated processing visualization
- Progress indication
- Real-time status updates
- Automatic transition to results upon completion

**Processing Steps Displayed:**
- PDF text extraction
- NLP preprocessing
- Information extraction
- Semantic embedding generation
- Similarity calculation
- Candidate ranking

**User Flow:**
1. User sees processing animation
2. System displays current processing step
3. Upon completion, automatic transition to Overview screen

---

### Screen 3: Overview Dashboard
**Purpose:** Main dashboard displaying analysis results and candidate rankings

**Components:**

**KPI Cards (Top Row)**
- Total Candidates analyzed
- Strong Matches count
- Average Match Score
- Critical Skill Gaps count

**Candidate Fit Matrix (Middle Left)**
- Table showing top 5 candidates
- Columns: Candidate, Semantic Fit, Skill Match, Experience, Overall
- Color-coded scores
- Clickable rows for detailed view

**Match Distribution (Middle Right)**
- Bar chart showing distribution of match scores
- Ranges: 90-100%, 80-89%, 70-79%, 60-69%, Below 60%
- Color-coded by match quality
- Candidate count per range

**Candidate Ranking Table (Bottom Left)**
- Full candidate list with ranking
- Columns: Rank, Candidate, Overall Score, Top Skills, Experience, Status
- Search functionality
- Filter options
- Sortable by score
- Clickable rows for detailed view

**Skill Coverage Analysis (Bottom Right)**
- Required skills coverage percentage
- Visual progress bars
- Missing candidate count per skill
- Required vs preferred skill indicators

**Tabs (Sidebar Navigation)**
- Overview (default)
- Candidates (full candidate list)
- Skills (detailed skill analysis)
- Analytics (advanced visualizations)
- Job Analysis (JD breakdown)

---

### Screen 4: Candidate Analysis
**Purpose:** Detailed view of individual candidate profile

**Components:**

**Candidate Header**
- Candidate name and initials
- Current title/role
- Overall match score (large display)
- Recommendation badge (Strong/Good/Moderate/Weak Match)
- Experience duration
- Location

**Score Breakdown**
- Semantic Match score with progress bar
- Skill Match score with progress bar
- Experience Match score with progress bar
- Color-coded based on score quality

**Skills Section**
- Matching skills (highlighted in purple)
- Missing skills (strikethrough, gray)
- Skill count indicators

**Experience & Education**
- Work experience details
- Educational background
- Institutions and degrees

**Projects Section**
- Project highlights
- Technologies used
- Impact/description

**AI Insight**
- AI-generated recommendation text
- Detailed explanation of match quality
- Strengths and areas for improvement

**Actions**
- Back to overview button
- Export individual candidate report

**User Flow:**
1. User clicks on candidate from ranking table
2. System displays detailed candidate analysis
3. User reviews comprehensive candidate profile
4. User can return to overview or export report

---

## Data Models

### Candidate Model
```typescript
interface Candidate {
  id: number
  name: string
  initials: string
  title: string
  match: number                    // Overall match score (0-100)
  recommendation: 'Strong Match' | 'Good Match' | 'Moderate Match' | 'Weak Match'
  experience: string               // e.g., "5 years"
  skills: string[]                 // Matching skills
  missingSkills: string[]         // Missing skills
  education: string               // Educational background
  location: string                // Geographic location
  projects: string[]              // Project highlights
  semanticMatch: number           // AI semantic similarity (0-100)
  skillMatch: number              // Skill overlap score (0-100)
  experienceMatch: number         // Experience relevance (0-100)
  aiInsight: string               // AI-generated recommendation
}
```

### Skill Coverage Model
```typescript
interface SkillCoverage {
  skill: string
  required: boolean               // Whether skill is required or preferred
  coverage: number                // Percentage of candidates with this skill
  missing: number                 // Number of candidates missing this skill
}
```

### Match Distribution Model
```typescript
interface MatchDistribution {
  range: string                   // e.g., "90-100%"
  count: number                   // Number of candidates in this range
  color: string                   // Display color for visualization
}
```

---

## Export Functionality

### Excel Report Generation
**Purpose:** Generate comprehensive Excel reports for offline analysis

**Report Sheets:**

1. **Summary**
   - Job title
   - Candidates analyzed count
   - Strong matches count
   - Average match score
   - Skills identified count
   - Generated date

2. **Candidate Ranking**
   - Rank, Candidate name
   - Match Score, Semantic Score, Skill Score, Experience Score
   - Recommendation category

3. **Skill Analysis**
   - Required skills list
   - Candidate coverage percentage
   - Missing candidate count

4. **Candidate Details**
   - Full candidate profiles
   - Education, Experience
   - Matching skills, Missing skills
   - Match score, AI recommendation

5. **Job Analysis**
   - Extracted requirements
   - Required skills vs preferred skills
   - JD breakdown

**Technology:** XLSX library for Excel file generation

---

## Technology Stack

### Frontend Technologies
- **React 19:** UI framework with hooks and components
- **TypeScript:** Type-safe JavaScript development
- **Vite:** Fast build tool and development server
- **Tailwind CSS:** Utility-first CSS framework
- **XLSX:** Excel file generation and export

### Backend Technologies
- **Python 3.8+:** Core programming language
- **FastAPI:** Modern, fast web framework for building APIs
- **PyMuPDF (fitz):** PDF text extraction and processing
- **spaCy:** Industrial-strength NLP library
- **Sentence Transformers:** State-of-the-art semantic embeddings
- **Scikit-learn:** Machine learning library for similarity calculations
- **NumPy:** Numerical computing and vector operations
- **Pydantic:** Data validation using Python type annotations

### Development Tools
- **Git:** Version control
- **Node.js + npm:** Frontend package management
- **Python pip:** Backend package management
- **ESLint + Prettier:** Code linting and formatting

---

## Project Structure

```
recruitment-dashboard/
├── frontend/                    # React Frontend Application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Sidebar.tsx    # Navigation sidebar
│   │   │   └── TopBar.tsx     # Top navigation bar
│   │   ├── screens/            # Main application screens
│   │   │   ├── NewAnalysis.tsx         # JD input + resume upload
│   │   │   ├── AiScanning.tsx          # Processing animation
│   │   │   ├── Overview.tsx             # Main dashboard
│   │   │   └── CandidateAnalysis.tsx    # Detailed candidate view
│   │   ├── data/              # Data interfaces and types
│   │   │   └── candidates.ts  # Candidate data models
│   │   ├── utils/             # Utility functions
│   │   │   └── exportReport.ts # Excel export functionality
│   │   ├── App.tsx            # Main application component
│   │   └── main.tsx           # Application entry point
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.ts         # Vite configuration
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   └── tsconfig.json          # TypeScript configuration
│
├── backend/                    # Python FastAPI Backend
│   ├── main.py                # FastAPI application entry point
│   ├── modules/               # Core processing modules
│   │   ├── __init__.py
│   │   ├── pdf_processor.py      # PDF text extraction
│   │   ├── nlp_processor.py      # NLP preprocessing
│   │   ├── embedding_matcher.py # Semantic similarity
│   │   └── skill_analyzer.py     # Skill extraction/matching
│   ├── models/                # Pydantic data models
│   │   ├── candidate.py
│   │   └── job_description.py
│   ├── utils/                 # Utility functions
│   │   ├── text_utils.py
│   │   └── scoring.py
│   ├── data/                  # Data directories
│   │   ├── uploads/           # Temporary upload directory
│   │   └── models/            # Downloaded embedding models
│   └── requirements.txt       # Python dependencies
│
└── README.md                  # Project documentation
```

---

## ROSP vs Major Project Scope Differentiation

### Project Comparison Table

| Aspect | ROSP (This Project) | Major Project (HireSense AI) |
|--------|---------------------|------------------------------|
| **Primary Focus** | AI-powered dashboard with semantic matching | Complete recruitment automation platform |
| **Processing Scale** | Small to medium batches (10-50 resumes) | Enterprise-scale (1000+ resumes) |
| **Architecture** | React + FastAPI + AI Services | Complex three-tier with background workers |
| **Database** | Simple file-based storage | PostgreSQL with pgvector for vectors |
| **Authentication** | None | Recruiter/TPO verification with email approval |
| **Resume Parsing** | Basic skills, education, experience, projects | Enhanced: internships, certifications, achievements, languages, publications |
| **ATS Scoring** | Fixed-weight algorithm | Configurable recruiter-defined weights |
| **Vector Storage** | Serialized TEXT embeddings | PostgreSQL pgvector (VECTOR(384)) |
| **Processing Pipeline** | Sequential/basic processing | Asynchronous, parallel execution, batch processing, caching |
| **Candidate Communication** | Manual | Automated workflow: Shortlist Email → Confirmation → Final List |
| **Knowledge Graph** | None | Links candidates, skills, technologies, projects, certifications |
| **AI Assistant** | Basic insights | AI Recruiter Assistant for candidate recommendations |
| **Duplicate Detection** | None | Embedding similarity-based duplicate detection |
| **Resume Quality** | Not available | Resume Quality Analyzer with feedback |
| **Analytics** | Basic dashboard | Advanced: ATS distribution, skill trends, missing skills analysis |
| **Additional Features** | Excel export, semantic matching | GitHub analysis, KNN/K-Means, NL-to-SQL, PaddleOCR |

---

### ROSP Features (Included in This Project)

#### 1. Core AI/NLP Processing
- ✅ PDF text extraction using PyMuPDF
- ✅ NLP preprocessing with spaCy
- ✅ Basic Named Entity Recognition for information extraction
- ✅ Skills extraction (technical and soft skills)
- ✅ Education extraction (degrees, institutions, years)
- ✅ Experience extraction (companies, roles, durations)
- ✅ Projects extraction (technologies, impact)
- ✅ Semantic embeddings using all-MiniLM-L6-v2
- ✅ Cosine similarity calculation
- ✅ Skill overlap analysis (Jaccard similarity)
- ✅ Experience relevance scoring
- ✅ Fixed-weight composite match scoring algorithm

#### 2. Frontend Dashboard
- ✅ Professional React dashboard with multiple screens
- ✅ Job description input (paste text or upload PDF)
- ✅ Resume upload with drag & drop interface
- ✅ Real-time processing status and animations
- ✅ KPI cards with key metrics
- ✅ Candidate ranking table with search and filter
- ✅ Match distribution visualization
- ✅ Skill coverage analysis
- ✅ Detailed candidate analysis view
- ✅ AI-generated insights and recommendations
- ✅ Responsive design with Tailwind CSS
- ✅ Excel export functionality

#### 3. API & Integration
- ✅ FastAPI REST endpoints
- ✅ File upload handling
- ✅ Real-time processing status updates
- ✅ Error handling and validation
- ✅ CORS configuration for React integration

#### 4. Basic Explainable ATS
- ✅ Display matched skills and missing skills
- ✅ Experience and education alignment
- ✅ Project alignment display
- ✅ AI-generated candidate insights

---

### Major Project Features (HireSense AI - Excluded from ROSP)

#### 1. Enterprise Architecture & Infrastructure
- ❌ Recruiter/TPO verification through organization email approval
- ❌ PostgreSQL database with pgvector for vector storage
- ❌ High-performance asynchronous processing pipeline
- ❌ Background workers and caching (Redis)
- ❌ Concurrent batch processing for 1000+ resumes
- ❌ Queue-based execution architecture
- ❌ Docker containerization
- ❌ Cloud deployment infrastructure

#### 2. Advanced AI/NLP Features
- ❌ Enhanced resume parsing with spaCy + PhraseMatcher + custom taxonomy
- ❌ Extraction of internships, certifications, achievements, languages, publications
- ❌ Resume knowledge graph linking candidates, skills, technologies, projects
- ❌ Duplicate resume detection using embedding similarity
- ❌ AI Recruiter Assistant for candidate recommendations
- ❌ Configurable recruiter-defined ATS scoring weights
- ❌ Resume Quality Analyzer with feedback module
- ❌ Recruiter AI Summaries with hiring insights and skill distribution

#### 3. Enterprise Workflow Automation
- ❌ Automated candidate communication workflow
- ❌ Shortlist email automation
- ❌ Candidate confirmation tracking
- ❌ Final confirmed candidate list management
- ❌ Organization-level recruitment workflow

#### 4. Advanced Analytics
- ❌ ATS distribution analytics
- ❌ Skill trend analysis
- ❌ Missing skills analytics
- ❌ Experience analytics
- ❌ Advanced recruiter insights dashboard

#### 5. Additional Enterprise Features
- ❌ GitHub profile analysis
- ❌ KNN recommendation system
- ❌ K-Means clustering for candidate grouping
- ❌ NL-to-SQL natural language queries
- ❌ PaddleOCR for image-based PDF processing

---

## Key Success Criteria

### ROSP Technical Implementation
- ✅ **PDF Processing:** Successfully extract text from uploaded PDF resumes using PyMuPDF
- ✅ **NLP Extraction:** Accurately extract skills, education, experience, and projects using spaCy
- ✅ **Semantic Embeddings:** Generate meaningful text embeddings using Sentence Transformers (all-MiniLM-L6-v2)
- ✅ **Similarity Calculation:** Calculate accurate cosine similarity between JD and resumes
- ✅ **Skill Analysis:** Perform skill overlap analysis using Jaccard similarity
- ✅ **Composite Scoring:** Implement fixed-weight scoring algorithm combining semantic, skill, and experience factors
- ✅ **API Integration:** Seamless integration between React frontend and Python FastAPI backend
- ✅ **Real-time Processing:** Provide live status updates during processing
- ✅ **Candidate Ranking:** Produce accurate ranked candidate list with explanations
- ✅ **Dashboard UI:** Professional, responsive dashboard with all required screens
- ✅ **Excel Export:** Generate comprehensive Excel reports with multiple sheets

### ROSP User Experience
- ✅ **Intuitive Interface:** Easy-to-use interface for recruiters with drag-and-drop functionality
- ✅ **Fast Processing:** Efficient processing of resumes and JD (suitable for small to medium batches)
- ✅ **Clear Results:** Well-presented match scores with visual gauges and progress bars
- ✅ **Actionable Insights:** AI insights that help recruitment decisions
- ✅ **Export Capability:** Excel reports for offline analysis and sharing
- ✅ **Explainable ATS:** Clear display of matched skills, missing skills, and alignment explanations

### ROSP AI/NLP Quality
- ✅ **Meaningful Embeddings:** Semantic embeddings that capture text meaning for accurate matching
- ✅ **Accurate Extraction:** High-quality information extraction from resumes using NLP techniques
- ✅ **Relevant Scoring:** Match scores that reflect true candidate suitability with fixed weights
- ✅ **Explainable Results:** Clear explanations for match recommendations with skill breakdowns

---

### Major Project Additional Success Criteria (Not Part of ROSP)

#### Enterprise Architecture
- 🎯 Handle 1000+ resume processing with concurrent execution
- 🎯 Implement recruiter/TPO verification workflow
- 🎯 Build knowledge graph for relationship-based candidate search
- 🎯 Achieve high-performance processing with background workers

#### Advanced AI Features
- 🎯 Implement configurable ATS scoring based on recruiter preferences
- 🎯 Add resume quality analyzer with improvement suggestions
- 🎯 Build AI Recruiter Assistant for intelligent recommendations
- 🎯 Implement duplicate resume detection using embedding similarity

#### Enterprise Workflow
- 🎯 Automate end-to-end candidate communication workflow
- 🎯 Provide advanced analytics for skill trends and recruitment insights
- 🎯 Support organization-level recruitment automation

---

## Development Notes

### Technical Approach
- **PDF Processing:** Start with text-based PDFs using PyMuPDF (no OCR initially)
- **NLP Pipeline:** Use spaCy for preprocessing and custom regex for specific entities
- **Embeddings:** Download and cache all-MiniLM-L6-v2 model for faster processing
- **API Design:** RESTful endpoints with clear request/response structures
- **Error Handling:** Comprehensive error handling at each processing stage
- **Performance:** Optimize for processing 10-50 resumes in reasonable time

### Data Handling
- **File Storage:** Temporary storage for uploaded PDFs (clean up after processing)
- **Text Storage:** Store extracted text in memory during processing
- **Model Storage:** Cache embedding models to avoid repeated downloads
- **Result Storage:** Return results via API, no persistent database required

### Testing Strategy
- **Unit Testing:** Test individual modules (PDF extraction, NLP processing, etc.)
- **Integration Testing:** Test end-to-end workflow from upload to results
- **Validation Testing:** Verify scoring accuracy with known test cases
- **UI Testing:** Ensure frontend correctly displays backend results

### Best Practices
- **Type Safety:** Use TypeScript in frontend, Pydantic in backend
- **Code Organization:** Modular structure with clear separation of concerns
- **Documentation:** Comment complex algorithms and API endpoints
- **Error Messages:** Provide clear, actionable error messages to users
- **Performance:** Monitor and optimize processing time

---



## Development Workflow

1. **Environment Setup**
   - Install frontend dependencies (React, Vite, Tailwind)
   - Install backend dependencies (Python, FastAPI, spaCy, etc.)
   - Download embedding models
   - Configure development environment

2. **Frontend Development**
   - Implement New Analysis screen
   - Build AI Scanning animation
   - Create Overview dashboard
   - Develop Candidate Analysis view
   - Add Excel export functionality
   - Implement responsive design

3. **Backend Development**
   - Setup FastAPI application structure
   - Implement PDF processing module
   - Build NLP processing pipeline
   - Create embedding generation module
   - Develop similarity calculation
   - Implement scoring algorithms
   - Build API endpoints

4. **Integration**
   - Connect frontend to backend APIs
   - Implement real-time status updates
   - Add error handling throughout
   - Test end-to-end workflow

5. **Testing & Optimization**
   - Test with various PDF formats
   - Validate NLP extraction accuracy
   - Verify scoring algorithm quality
   - Optimize processing performance
   - User acceptance testing

6. **Documentation**
   - API documentation
   - User guide for recruiters
   - Technical documentation
   - Deployment instructions

---




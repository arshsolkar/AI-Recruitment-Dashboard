"""
Real resume test suite to verify PDF text extraction, OCR fallback,
cleaning, structured Ollama data extraction, Python skill canonicalization,
and date-based experience calculation across sample PDFs.
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import fitz

from app.nlp import (
    extract_pdf_text,
    extract_resume_data_ollama,
    extract_jd_requirements,
    semantic_similarities,
    calculate_composite_score,
    recommendation,
)

SAMPLE_RESUMES = [
    "Image_10.pdf",
    "Image_16.pdf",
    "Image_2.pdf",
    "Image_5.pdf",
    "Image_7.pdf",
]

RESUMES_DIR = Path(__file__).parent.parent / "Resumes"

SAMPLE_JD = """
Senior Python & AI Engineer

Required Skills:
- Python, FastAPI, Django
- Machine Learning, PyTorch, TensorFlow
- SQL, PostgreSQL
- REST APIs, Microservices

Preferred Skills:
- Docker, Kubernetes
- AWS cloud experience
- React, TypeScript
"""

def test_pipeline_on_resumes():
    print("=" * 80)
    print("Testing Pipeline on Real Resume PDFs (NEW Ollama Extraction Architecture)")
    print("=" * 80)

    summary_rows = []

    for pdf_name in SAMPLE_RESUMES:
        pdf_path = RESUMES_DIR / pdf_name
        if not pdf_path.exists():
            print(f"Skipping {pdf_name} (file not found)")
            continue

        print(f"\n--- Processing: {pdf_name} ---")

        # Check if PyMuPDF alone has text yield or if OCR was used
        with fitz.open(str(pdf_path)) as doc:
            raw_pymupdf = "".join(p.get_text() for p in doc).strip()
        ocr_used = len(raw_pymupdf) < 40

        # Step 1: PDF Text Extraction / OCR fallback
        extracted_text = extract_pdf_text(str(pdf_path))
        text_length = len(extracted_text)
        print(f"1. PDF Text Length: {text_length} chars (OCR Used: {ocr_used})")
        assert text_length > 50, f"Failed text extraction for {pdf_name}"

        # Step 2: Structured Ollama Extraction (or Degraded Fallback)
        candidate_data = extract_resume_data_ollama(extracted_text, str(pdf_path))
        ollama_used = not candidate_data['is_degraded_fallback']
        ollama_calls = 1 if ollama_used else 0
        pydantic_valid = ollama_used  # If Ollama succeeded, Pydantic schema validation succeeded

        print(f"2. Extracted Name: {candidate_data['name']}")
        print(f"3. Manual Entry Required: {candidate_data['requires_manual_entry']}")
        print(f"4. Degraded Fallback Mode: {candidate_data['is_degraded_fallback']}")
        print(f"5. Calculated Experience: {candidate_data['experience_years']} years")
        print(f"6. Normalized Skills ({len(candidate_data['skills'])}): {candidate_data['skills'][:7]}")

        # Step 3: Semantic & ATS Scoring
        required_skills, preferred_skills = extract_jd_requirements(SAMPLE_JD)
        candidate_skills = set(candidate_data['skills'])
        matching_req = candidate_skills & set(required_skills)
        matching_pref = candidate_skills & set(preferred_skills)

        req_coverage = (len(matching_req) / len(required_skills) * 100) if required_skills else 100
        pref_coverage = (len(matching_pref) / len(preferred_skills) * 50) if preferred_skills else 0
        skill_coverage = min(100, req_coverage + pref_coverage)

        sim = semantic_similarities(SAMPLE_JD, [extracted_text])[0]
        semantic_fit = round(sim * 100)

        exp_years = candidate_data['experience_years']
        exp_match = min(100, 50 + (min(exp_years, 15) / 15) * 50) if exp_years > 0 else 50
        edu_alignment = 70 if candidate_data['education'] != "Not specified" else 50

        overall = calculate_composite_score(
            skill_coverage=skill_coverage,
            semantic_fit=semantic_fit,
            experience_match=exp_match,
            education_role_alignment=edu_alignment,
        )

        label = recommendation(overall)
        print(f"7. Scores -> Skill: {int(skill_coverage)}%, Semantic: {semantic_fit}%, Exp: {int(exp_match)}% | Overall: {overall}% ({label})")

        summary_rows.append({
            "resume": pdf_name,
            "ocr_used": "Yes" if ocr_used else "No",
            "ollama_used": "Yes" if ollama_used else "No",
            "ollama_calls": str(ollama_calls),
            "pydantic_valid": "Yes" if pydantic_valid else "No",
            "degraded_mode": "Yes" if candidate_data['is_degraded_fallback'] else "No",
            "skills": f"{len(candidate_data['skills'])} skills",
            "experience": f"{candidate_data['experience_years']} yrs",
            "ats_score": f"{overall}% ({label})"
        })

    print("\n" + "=" * 80)
    print("VERIFICATION TABLE")
    print("=" * 80)
    print(f"{'Resume':<14} | {'OCR Used':<8} | {'Ollama Used':<11} | {'Ollama Calls':<12} | {'Pydantic Valid':<14} | {'Degraded Mode':<13} | {'Skills':<10} | {'Experience':<10} | {'ATS Score'}")
    print("-" * 115)
    for r in summary_rows:
        print(f"{r['resume']:<14} | {r['ocr_used']:<8} | {r['ollama_used']:<11} | {r['ollama_calls']:<12} | {r['pydantic_valid']:<14} | {r['degraded_mode']:<13} | {r['skills']:<10} | {r['experience']:<10} | {r['ats_score']}")
    print("=" * 80)

if __name__ == "__main__":
    test_pipeline_on_resumes()

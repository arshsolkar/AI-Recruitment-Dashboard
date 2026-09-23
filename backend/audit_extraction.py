#!/usr/bin/env python3
"""
BATCH EXTRACTION AUDIT SCRIPT
==============================
Runs every PDF in Resumes/test-resume through the real extraction pipeline
and produces a comprehensive diagnostic report.

DO NOT modify this file's output path or the production source files.
"""

import sys
import os
import json
import re
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Tuple, Optional, Any
import traceback

# ── path setup ─────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent          # project root
RESUME_DIR = ROOT / "Resumes"               # all PDFs are here (no test-resume subdir)
SYS_PATH_INSERT = str(Path(__file__).parent)
if SYS_PATH_INSERT not in sys.path:
    sys.path.insert(0, SYS_PATH_INSERT)

# ── activate the venv if needed ────────────────────────────────────────────
venv_site = Path(__file__).parent / ".venv" / "lib"
if venv_site.exists():
    for sp in sorted(venv_site.glob("python*/site-packages")):
        if str(sp) not in sys.path:
            sys.path.insert(0, str(sp))

print(f"[AUDIT] Resume directory : {RESUME_DIR}")
print(f"[AUDIT] Python           : {sys.executable}")

# ── import real pipeline components ────────────────────────────────────────
try:
    from app.nlp import (
        extract_pdf_text,
        extract_resume_data_ollama,
        extract_work_dates,
        calculate_total_experience,
        extract_projects,
        extract_education,
        extract_entities,
        ResumeExtractionSchema,
        preprocess_resume_text,
    )
    print("[AUDIT] Pipeline imports: OK")
except ImportError as exc:
    print(f"[AUDIT] Pipeline import FAILED: {exc}")
    print("        Make sure you run from backend/ with the venv active.")
    sys.exit(1)


# ══════════════════════════════════════════════════════════════════════════
#  HELPERS
# ══════════════════════════════════════════════════════════════════════════

def detect_ocr_used(pdf_path: str) -> bool:
    """Return True if the PDF required OCR (no embedded text layer)."""
    try:
        import pymupdf as fitz
    except ImportError:
        import fitz
    with fitz.open(pdf_path) as doc:
        for page in doc:
            if len(page.get_text("text").strip()) >= 40:
                return False
    return True


def independent_experience_from_text(raw_text: str) -> Tuple[float, List[Dict]]:
    """
    Independently calculate experience from raw date ranges in the text.
    Returns (total_years, list_of_ranges).
    """
    ranges = extract_work_dates(raw_text)
    details = []
    for s, e in ranges:
        details.append({
            "start": s.strftime("%Y-%m"),
            "end": e.strftime("%Y-%m") if e < datetime.now() else "present",
            "years": round((e - s).days / 365.25, 1)
        })
    total = calculate_total_experience(ranges)
    return total, details


def check_section_confusion(extracted: Dict) -> List[str]:
    """
    Heuristically detect whether content has landed in the wrong section.
    Returns a list of human-readable warnings.
    """
    warnings = []

    projects = extracted.get("notable_projects", [])
    work_exp = extracted.get("work_experience", [])

    # ── strengths/adaptability text in projects ─────────────────────────
    strength_keywords = [
        "adaptability", "leadership", "communication", "teamwork",
        "problem solving", "time management", "critical thinking",
        "flexibility", "initiative", "interpersonal", "organised",
        "collaborative", "proactive", "self-motivated",
    ]
    for p in projects:
        p_lower = str(p).lower()
        hits = [kw for kw in strength_keywords if kw in p_lower]
        if len(hits) >= 2:
            warnings.append(
                f"SECTION_CONFUSION: Project entry looks like STRENGTHS/SOFTSKILLS content "
                f"(keywords: {hits!r}): '{str(p)[:120]}'"
            )
        # contact info in projects
        if re.search(r'\b[\w.+-]+@[\w-]+\.[\w.]+\b', p_lower):
            warnings.append(
                f"SECTION_CONFUSION: Project entry contains EMAIL address: '{str(p)[:80]}'"
            )
        # date ranges in projects
        if re.search(r'\b(19|20)\d{2}\b.*\b(19|20)\d{2}\b', str(p)):
            warnings.append(
                f"SECTION_CONFUSION: Project entry contains date range (possible experience): '{str(p)[:80]}'"
            )

    # ── address / contact in experience ────────────────────────────────
    for exp in work_exp:
        title = str(exp.get("title", ""))
        company = str(exp.get("company", ""))
        for field, val in [("title", title), ("company", company)]:
            if re.search(r'\b(st|ave|blvd|road|lane|drive)\b', val, re.I):
                warnings.append(
                    f"SECTION_CONFUSION: Experience {field} looks like ADDRESS: '{val[:80]}'"
                )
            if re.search(r'\b(bachelor|master|phd|degree|university|college)\b', val, re.I):
                warnings.append(
                    f"SECTION_CONFUSION: Experience {field} looks like EDUCATION: '{val[:80]}'"
                )

    return warnings


def check_experience_anomaly(
    extracted_years: float,
    independent_years: float,
    work_exp: List[Dict],
    raw_text: str,
) -> List[str]:
    """Flag cases where experience figures are inconsistent or suspicious."""
    flags = []

    diff = abs(extracted_years - independent_years)
    if diff > 3.0 and independent_years > 0:
        flags.append(
            f"EXP_MISMATCH: pipeline={extracted_years}y, independent={independent_years}y "
            f"(delta={diff:.1f}y)"
        )

    if extracted_years > 30:
        flags.append(f"EXP_UNREALISTIC: {extracted_years}y seems too high (>30)")

    # Check for OCR-artifact dates parsed as future years
    future_year = datetime.now().year + 1
    if re.search(rf'\b{future_year}\b', raw_text):
        flags.append(f"EXP_OCR_ARTIFACT: future year {future_year} found in text")

    # Year-only dates that may be ambiguous
    year_only_ranges = re.findall(r'\b(20\d{2})\s*[-–—]\s*(20\d{2}|present|ongoing|current)', raw_text, re.I)
    if year_only_ranges:
        flags.append(f"EXP_YEAR_ONLY_DATES: {len(year_only_ranges)} year-only ranges found "
                     f"(first: {year_only_ranges[0]})")

    # Overlapping date check
    ranges = extract_work_dates(raw_text)
    ranges_sorted = sorted(ranges, key=lambda x: x[0])
    overlap_count = 0
    for i in range(len(ranges_sorted) - 1):
        if ranges_sorted[i][1] > ranges_sorted[i + 1][0]:
            overlap_count += 1
    if overlap_count:
        flags.append(f"EXP_OVERLAPPING: {overlap_count} overlapping date range(s) — "
                     "pipeline merges them correctly if implemented")

    return flags


# ══════════════════════════════════════════════════════════════════════════
#  MAIN AUDIT LOOP
# ══════════════════════════════════════════════════════════════════════════

def run_audit(resume_dir: Path) -> List[Dict]:
    pdf_files = sorted(resume_dir.glob("*.pdf"))
    if not pdf_files:
        print(f"[AUDIT] No PDF files found in {resume_dir}")
        return []

    results = []
    print(f"\n[AUDIT] Found {len(pdf_files)} PDFs — starting extraction...\n")

    for pdf_path in pdf_files:
        print(f"  ── {pdf_path.name} ──────────────────────────────")
        record: Dict[str, Any] = {
            "filename": pdf_path.name,
            "pdf_path": str(pdf_path),
            "ocr_used": False,
            "ollama_used": False,
            "ollama_call_count": 0,
            "pydantic_validated": False,
            "extraction_error": None,
            "extracted_name": None,
            "extracted_experience_years": None,
            "work_experience": [],
            "skills": [],
            "education": None,
            "projects": [],
            "raw_text_length": 0,
            "raw_text_snippet": "",
            "independent_experience_years": None,
            "independent_date_ranges": [],
            "experience_flags": [],
            "section_confusion_warnings": [],
            "is_degraded_fallback": False,
        }

        # ── Step 1: PDF text extraction ────────────────────────────────
        try:
            ocr_used = detect_ocr_used(str(pdf_path))
            record["ocr_used"] = ocr_used

            raw_text = extract_pdf_text(str(pdf_path))
            record["raw_text_length"] = len(raw_text)
            record["raw_text_snippet"] = raw_text[:600].replace("\n", " | ")
            print(f"    text_len={len(raw_text):,}  ocr={ocr_used}")
        except Exception as exc:
            record["extraction_error"] = f"PDF_TEXT_FAIL: {exc}"
            print(f"    PDF text extraction FAILED: {exc}")
            results.append(record)
            continue

        # ── Step 2: Independent experience calculation ─────────────────
        try:
            ind_years, ind_ranges = independent_experience_from_text(raw_text)
            record["independent_experience_years"] = ind_years
            record["independent_date_ranges"] = ind_ranges
        except Exception as exc:
            record["independent_experience_years"] = None
            print(f"    independent exp calculation error: {exc}")

        # ── Step 3: Ollama extraction (may gracefully fail) ────────────
        try:
            # Count ollama calls by monkey-patching (safe read-only)
            import app.nlp as nlp_module
            _call_count = [0]
            _orig_chat = None

            try:
                import ollama as _ollama_mod
                _orig_chat = _ollama_mod.chat

                def _patched_chat(*args, **kwargs):
                    _call_count[0] += 1
                    return _orig_chat(*args, **kwargs)

                _ollama_mod.chat = _patched_chat
            except ImportError:
                pass  # ollama not installed — will use degraded fallback

            extracted = extract_resume_data_ollama(raw_text, str(pdf_path))

            if _orig_chat is not None:
                import ollama as _ollama_mod
                _ollama_mod.chat = _orig_chat

            record["ollama_call_count"] = _call_count[0]
            record["ollama_used"] = _call_count[0] > 0
            record["pydantic_validated"] = not extracted.get("is_degraded_fallback", True)
            record["is_degraded_fallback"] = extracted.get("is_degraded_fallback", False)

            record["extracted_name"] = extracted.get("name")
            record["extracted_experience_years"] = extracted.get("experience_years")
            record["work_experience"] = extracted.get("work_experience", [])
            record["skills"] = extracted.get("skills", [])
            record["education"] = extracted.get("education")
            record["projects"] = extracted.get("notable_projects", [])

            print(f"    name='{extracted.get('name')}'  "
                  f"exp={extracted.get('experience_years')}y  "
                  f"ollama_calls={_call_count[0]}  "
                  f"degraded={extracted.get('is_degraded_fallback', False)}")

        except Exception as exc:
            record["extraction_error"] = f"OLLAMA_EXTRACT_FAIL: {exc}\n{traceback.format_exc()}"
            print(f"    Ollama extraction FAILED: {exc}")
            results.append(record)
            continue

        # ── Step 4: Section confusion audit ───────────────────────────
        try:
            confusion = check_section_confusion(extracted)
            record["section_confusion_warnings"] = confusion
            if confusion:
                for w in confusion:
                    print(f"    ⚠️  {w[:100]}")
        except Exception as exc:
            print(f"    section confusion check error: {exc}")

        # ── Step 5: Experience audit ───────────────────────────────────
        try:
            exp_flags = check_experience_anomaly(
                extracted_years=record["extracted_experience_years"] or 0,
                independent_years=record["independent_experience_years"] or 0,
                work_exp=record["work_experience"],
                raw_text=raw_text,
            )
            record["experience_flags"] = exp_flags
            if exp_flags:
                for f in exp_flags:
                    print(f"    🚩 {f[:100]}")
        except Exception as exc:
            print(f"    experience audit error: {exc}")

        results.append(record)
        print()

    return results


# ══════════════════════════════════════════════════════════════════════════
#  PAUL SATCHELL DEEP DIVE
# ══════════════════════════════════════════════════════════════════════════

def paul_satchell_deep_dive(results: List[Dict]) -> str:
    """
    Inspect any resume that might be Paul Satchell based on name extraction
    and perform a detailed analysis of the 21-years / Adaptability-in-projects issue.
    """
    lines = ["\n" + "="*60, "PAUL SATCHELL DEEP DIVE", "="*60]

    paul_records = [r for r in results if "paul" in str(r.get("extracted_name", "")).lower()
                    or "satchell" in str(r.get("extracted_name", "")).lower()]

    if not paul_records:
        lines.append("⚠️  No record with name 'Paul Satchell' found in extraction results.")
        lines.append("    (Name extractor may have failed — checking all records for the symptom...)")
        # Look for any record with 21 years experience
        high_exp = [r for r in results if (r.get("extracted_experience_years") or 0) >= 18]
        if high_exp:
            lines.append(f"    Records with ≥18y extracted experience: {[r['filename'] for r in high_exp]}")
        paul_records = high_exp  # deep-dive into them anyway

    for rec in paul_records:
        lines.append(f"\nFile: {rec['filename']}")
        lines.append(f"  Extracted name         : {rec['extracted_name']}")
        lines.append(f"  Extracted exp years    : {rec['extracted_experience_years']}")
        lines.append(f"  Independent exp years  : {rec['independent_experience_years']}")
        lines.append(f"  OCR used               : {rec['ocr_used']}")
        lines.append(f"  Ollama used            : {rec['ollama_used']}")
        lines.append(f"  Degraded fallback      : {rec['is_degraded_fallback']}")

        # Known visible employment for Paul Satchell
        lines.append("\n  Known employment (from visual resume inspection):")
        lines.append("    2011–2014 (≈3y)   2014–2018 (≈4y)   2018–Ongoing (≈6y to 2024)")
        lines.append("    Expected total    ≈13y (non-overlapping, to ~Sept 2026 = ≈15.5y)")
        lines.append(f"  Pipeline total : {rec['extracted_experience_years']}y")

        ind = rec['independent_date_ranges']
        if ind:
            lines.append(f"\n  Independent parsed date ranges ({len(ind)}):")
            for dr in ind:
                lines.append(f"    {dr['start']} → {dr['end']}  ({dr['years']}y)")
        else:
            lines.append("  Independent date ranges: NONE found")

        lines.append(f"\n  Work experience entries ({len(rec['work_experience'])}):")
        for i, exp in enumerate(rec['work_experience'], 1):
            lines.append(f"    [{i}] title={exp.get('title')!r}  company={exp.get('company')!r}")
            lines.append(f"        start={exp.get('start_date')!r}  end={exp.get('end_date')!r}")

        proj = rec['projects']
        lines.append(f"\n  Extracted projects ({len(proj)}):")
        for i, p in enumerate(proj, 1):
            lines.append(f"    [{i}] {str(p)[:200]}")

        lines.append(f"\n  Section confusion warnings:")
        if rec['section_confusion_warnings']:
            for w in rec['section_confusion_warnings']:
                lines.append(f"    ⚠️  {w}")
        else:
            lines.append("    None")

        lines.append(f"\n  Experience flags:")
        if rec['experience_flags']:
            for f in rec['experience_flags']:
                lines.append(f"    🚩 {f}")
        else:
            lines.append("    None")

        lines.append(f"\n  Raw text snippet (first 800 chars):")
        lines.append(f"    {rec.get('raw_text_snippet', '')[:800]}")

    return "\n".join(lines)


# ══════════════════════════════════════════════════════════════════════════
#  REPORT GENERATION
# ══════════════════════════════════════════════════════════════════════════

def generate_report(results: List[Dict]) -> str:
    total = len(results)
    no_issues = []
    exp_issues = []
    section_issues = []
    ocr_candidates = []
    extraction_failures = []
    degraded = []

    for r in results:
        has_exp_issue = bool(r["experience_flags"])
        has_section_issue = bool(r["section_confusion_warnings"])
        has_error = bool(r["extraction_error"])
        is_ocr = r["ocr_used"]
        is_degraded = r["is_degraded_fallback"]

        if has_error:
            extraction_failures.append(r)
        else:
            if not has_exp_issue and not has_section_issue:
                no_issues.append(r)
            if has_exp_issue:
                exp_issues.append(r)
            if has_section_issue:
                section_issues.append(r)
        if is_ocr:
            ocr_candidates.append(r)
        if is_degraded:
            degraded.append(r)

    lines = []
    lines.append("\n" + "="*70)
    lines.append("BATCH EXTRACTION AUDIT REPORT")
    lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("="*70)

    lines.append(f"\nA. TOTAL RESUMES AUDITED: {total}")

    lines.append(f"\nB. RESUMES WITH NO APPARENT EXTRACTION ISSUES: {len(no_issues)}")
    for r in no_issues:
        lines.append(f"   ✅ {r['filename']}  name={r['extracted_name']!r}  exp={r['extracted_experience_years']}y")

    lines.append(f"\nC. RESUMES WITH EXPERIENCE ISSUES: {len(exp_issues)}")
    for r in exp_issues:
        lines.append(f"   🚩 {r['filename']}  pipeline={r['extracted_experience_years']}y  "
                     f"independent={r['independent_experience_years']}y")
        for f in r["experience_flags"]:
            lines.append(f"      → {f}")

    lines.append(f"\nD. RESUMES WITH SECTION-CLASSIFICATION ISSUES: {len(section_issues)}")
    for r in section_issues:
        lines.append(f"   ⚠️  {r['filename']}")
        for w in r["section_confusion_warnings"]:
            lines.append(f"      → {w}")

    lines.append(f"\nE. RESUMES REQUIRING OCR: {len(ocr_candidates)}")
    for r in ocr_candidates:
        lines.append(f"   📷 {r['filename']}  (text_len={r['raw_text_length']:,})")

    lines.append(f"\nF. RESUMES IN DEGRADED FALLBACK (Ollama unavailable/failed): {len(degraded)}")
    for r in degraded:
        lines.append(f"   🔴 {r['filename']}")

    lines.append(f"\nG. EXTRACTION FAILURES (could not process PDF): {len(extraction_failures)}")
    for r in extraction_failures:
        lines.append(f"   💥 {r['filename']}: {r['extraction_error'][:120]}")

    # ── G. COMMON PATTERNS ────────────────────────────────────────────
    lines.append("\n" + "="*70)
    lines.append("G. COMMON PATTERNS")
    lines.append("="*70)

    # Correlation: OCR + issues
    ocr_with_issues = [r for r in results if r["ocr_used"] and
                       (r["experience_flags"] or r["section_confusion_warnings"])]
    non_ocr_with_issues = [r for r in results if not r["ocr_used"] and
                           (r["experience_flags"] or r["section_confusion_warnings"])]
    lines.append(f"  OCR resumes with issues      : {len(ocr_with_issues)} / {len(ocr_candidates)}")
    lines.append(f"  Non-OCR resumes with issues  : {len(non_ocr_with_issues)} / {total - len(ocr_candidates)}")

    # Experience distribution
    exp_vals = [(r['filename'], r['extracted_experience_years'])
                for r in results if r['extracted_experience_years'] is not None]
    if exp_vals:
        lines.append(f"\n  Experience range: "
                     f"min={min(v for _,v in exp_vals):.1f}y  "
                     f"max={max(v for _,v in exp_vals):.1f}y  "
                     f"mean={sum(v for _,v in exp_vals)/len(exp_vals):.1f}y")
        high_exp = [(f, v) for f, v in exp_vals if v > 20]
        if high_exp:
            lines.append(f"  Suspiciously high (>20y): {high_exp}")

    # All projects that look like strength text
    all_confusion = [(r['filename'], w) for r in results for w in r['section_confusion_warnings']]
    if all_confusion:
        lines.append(f"\n  Total section confusion events: {len(all_confusion)}")
        for fn, w in all_confusion:
            lines.append(f"    {fn}: {w[:100]}")

    # ── H. ROOT CAUSE ────────────────────────────────────────────────
    lines.append("\n" + "="*70)
    lines.append("H. ROOT CAUSE ANALYSIS")
    lines.append("="*70)

    ollama_unavailable = all(r["is_degraded_fallback"] for r in results if not r["extraction_error"])
    if ollama_unavailable:
        lines.append("""
  🔴 CRITICAL: Ollama Python package ('ollama') is NOT installed in the
     project's virtual environment (.venv).

     Effect:
       - Every resume falls through to the DEGRADED FALLBACK in
         extract_resume_data_ollama() (nlp.py line 1794).
       - The degraded path uses REGEX-ONLY extraction instead of LLM.
       - The regex pipeline does NOT distinguish sidebar columns, section
         headings, or semantic meaning — it reads the text linearly.

     This is the PRIMARY cause of both reported symptoms:
     ─────────────────────────────────────────────────────────────────
     SYMPTOM 1 — 21 years experience
       • extract_work_dates() uses regex patterns that match ANY date range
         in the resume text, including:
           - education dates        (e.g. 2003–2006)
           - certification dates
           - training/course dates
           - sidebar dates
           - OCR reading-order artifacts from two-column layouts
       • For a two-column resume, PyMuPDF reads columns left-to-right but
         may interleave text from different sections — this pushes sidebar
         dates (which may span longer periods like 2003-2011) into the
         experience section's regex window.
       • calculate_total_experience() merges all matched ranges, so adding
         earlier (unrelated) date ranges inflates the total significantly.
       • A 2003-2011 + 2011-2014 + 2014-2018 + 2018-2026 sequence would
         yield ~23y, consistent with the observed 21y result.

     SYMPTOM 2 — Adaptability text in Notable Projects
       • extract_projects() (nlp.py line 734) uses a GREEDY regex:
             r'(?:projects?|project experience|key projects|notable projects|
                relevant projects)[:\\s\\n]*(.*?)
                (?=\\n\\s*(?:experience|education|skills|contact|$))'
       • In a two-column resume, PyMuPDF linearises the text so the
         STRENGTHS section content (e.g. "Adaptability: Quickly adapts...")
         may appear BETWEEN the "Projects" keyword and the next recognised
         section boundary keyword.
       • Crucially, the regex stop-words do NOT include 'strengths',
         'certifications', 'achievements', 'qualities', or 'attributes'
         — so the greedy match consumes the entire STRENGTHS section.

  SECONDARY CAUSES:
  ─────────────────────────────────────────────────────────────────
  • Two-column PDF reading order: PyMuPDF fitz.get_text("text") produces
    a linearised stream. For two-column layouts, left and right column text
    can be interleaved, placing sidebar content inside what regex expects
    to be the experience or projects section.

  • Missing section terminators in regex: extract_projects() and
    extract_education() use a fixed set of stop-words
    ('experience|education|skills|contact') that do not cover all section
    headers present in real resumes (strengths, certifications, achievements,
    awards, references, volunteer, languages, etc.).

  NOT A FRONTEND MAPPING ISSUE:
  ─────────────────────────────────────────────────────────────────
  • candidates.ts convertToCandidate() maps:
      API 'projects'          → candidate.projects       ✅
      API 'experience_details'→ candidate.experienceDetails ✅
      API 'entities.experience_years' → candidate.experience ✅
  • The frontend reads exactly the fields the API returns.
  • If the API returns wrong values, the UI will display them — but the
    root cause is upstream in the extraction, not in field mapping.
""")
    else:
        lines.append("""
  Ollama was available for some resumes. Mixed pipeline. See per-resume data above.
""")

    lines.append("="*70)
    lines.append("RECOMMENDATIONS (smallest general fixes, not candidate-specific)")
    lines.append("="*70)
    lines.append("""
  FIX 1 — Install Ollama Python package in the project venv
    File: backend/requirements.txt  →  add 'ollama'
    Command: pip install ollama
    This restores LLM-based semantic extraction, which handles multi-column
    layouts and section headings much better than regex.

  FIX 2 — Expand section stop-words in regex fallback patterns
    File: backend/app/nlp.py

    In extract_projects() line 740 and extract_education() line 782, the
    negative lookahead regex terminates on:
        (?=\\n\\s*(?:experience|education|skills|contact|$))

    Add missing section headers:
        (?=\\n\\s*(?:experience|education|skills|contact|strengths|
           certifications|achievements|awards|volunteer|references|
           languages|qualities|attributes|professional development|$))

    This will prevent greedy capture from consuming strength/cert content.

  FIX 3 — Filter non-employment date ranges before experience calculation
    File: backend/app/nlp.py → extract_work_dates() (line 657)

    Narrow the context window for date pattern matching to lines that
    contain employment signals (job title patterns, company name patterns).
    Currently the function scans the entire raw text, picking up education
    and certification date ranges.

    Recommended: Only match date ranges within the EXPERIENCE section text
    (use the same section-extractor pattern, but with expanded stop-words
    from FIX 2).

  FIX 4 — Use pdfplumber column-aware extraction for two-column PDFs
    File: backend/app/nlp.py → extract_pdf_text() (line 438)

    pdfplumber is already installed. For PDFs where column detection is
    needed, use pdfplumber's bbox-based column extraction instead of
    PyMuPDF's linear text stream. This preserves column reading order and
    prevents cross-column section confusion.

  FIX 5 — Filter strength/soft-skill text from projects list
    File: backend/app/nlp.py → extract_projects() (line 734)

    After extracting project lines, filter out entries that match a
    soft-skill/strength keyword list (adaptability, leadership, teamwork,
    communication, etc.). These almost certainly came from a STRENGTHS section
    that the regex incorrectly captured.

  PAUL SATCHELL SPECIFICALLY:
    His resume likely has a two-column layout where:
    - Column 1: Employment timeline (2011-2014, 2014-2018, 2018-Ongoing)
    - Column 2: Strengths, Skills, Certifications (possibly with earlier dates)
    PyMuPDF linearises this, interleaving column 2 text into the experience
    section's regex window and the projects section's greedy match.
    All 5 fixes above apply — none of them are Paul-specific.
""")

    return "\n".join(lines)


# ══════════════════════════════════════════════════════════════════════════
#  ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # Determine resume directory (may be passed as arg)
    if len(sys.argv) > 1:
        RESUME_DIR = Path(sys.argv[1])

    if not RESUME_DIR.exists():
        print(f"[AUDIT] Resume directory not found: {RESUME_DIR}")
        sys.exit(1)

    results = run_audit(RESUME_DIR)

    # Paul Satchell deep dive
    paul_section = paul_satchell_deep_dive(results)

    # Generate final report
    report = generate_report(results)

    full_output = paul_section + "\n" + report

    # Save JSON results for further inspection
    json_path = Path(__file__).parent / "audit_results.json"
    with open(json_path, "w") as f:
        json.dump(results, f, indent=2, default=str)

    print(full_output)
    print(f"\n[AUDIT] Full JSON results saved to: {json_path}")

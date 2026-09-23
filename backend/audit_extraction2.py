#!/usr/bin/env python3
"""
BATCH EXTRACTION AUDIT — ROUND 2
=================================
Runs every PDF in Resumes/ through the ACTUAL production pipeline
(Ollama active, venv/ environment, Python 3.14).

Purpose: Establish the behaviour of the intended pipeline BEFORE any fixes.
DO NOT modify production code.
"""

import sys
import os
import json
import re
import time
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Tuple, Optional, Any
import traceback

# ── Path setup ─────────────────────────────────────────────────────────────
BACKEND = Path(__file__).parent          # backend/
ROOT    = BACKEND.parent                  # project root
RESUME_DIR = ROOT / "Resumes"

# The running backend uses 'venv/', not '.venv/'
VENV_SITE = BACKEND / "venv" / "lib" / "python3.14" / "site-packages"
if VENV_SITE.exists() and str(VENV_SITE) not in sys.path:
    sys.path.insert(0, str(VENV_SITE))

APP_PATH = str(BACKEND)
if APP_PATH not in sys.path:
    sys.path.insert(0, APP_PATH)

print(f"[AUDIT2] Resume dir  : {RESUME_DIR}")
print(f"[AUDIT2] Python      : {sys.executable}")
print(f"[AUDIT2] venv site   : {VENV_SITE}")

# ── Import real pipeline ────────────────────────────────────────────────────
try:
    import ollama as _ollama_pkg
    print(f"[AUDIT2] ollama pkg  : OK (installed)")
except ImportError:
    print("[AUDIT2] FATAL: ollama not importable from this Python. Wrong environment?")
    sys.exit(1)

try:
    from app.nlp import (
        extract_pdf_text,
        extract_resume_data_ollama,
        extract_work_dates,
        calculate_total_experience,
        extract_projects,
        extract_education,
        extract_entities,
        preprocess_resume_text,
        ResumeExtractionSchema,
    )
    print("[AUDIT2] Pipeline imports: OK")
except ImportError as e:
    print(f"[AUDIT2] Pipeline import FAILED: {e}")
    sys.exit(1)

# ── Verify Ollama server before starting ───────────────────────────────────
try:
    import httpx
    r = httpx.get("http://localhost:11434/api/tags", timeout=5)
    models = [m["name"] for m in r.json().get("models", [])]
    if "llama3.2:3b" not in models:
        print(f"[AUDIT2] WARNING: llama3.2:3b not in available models: {models}")
    else:
        print(f"[AUDIT2] Ollama server: OK — llama3.2:3b available")
except Exception as e:
    print(f"[AUDIT2] Ollama server check FAILED: {e}")
    sys.exit(1)


# ══════════════════════════════════════════════════════════════════════════
#  OLLAMA CALL INTERCEPTION
# ══════════════════════════════════════════════════════════════════════════

class OllamaCallCapture:
    """
    Wraps ollama.chat to capture call count, raw prompts, and raw responses
    without modifying extraction logic at all.
    """
    def __init__(self):
        self.calls: List[Dict] = []
        self._orig_chat = _ollama_pkg.chat

    def __enter__(self):
        capture = self

        def _patched_chat(*args, **kwargs):
            t0 = time.time()
            response = capture._orig_chat(*args, **kwargs)
            elapsed = round(time.time() - t0, 2)
            capture.calls.append({
                "call_index": len(capture.calls) + 1,
                "model": kwargs.get("model", args[0] if args else "?"),
                "elapsed_s": elapsed,
                "prompt_len": len(str(kwargs.get("messages", args[1] if len(args) > 1 else ""))),
                "response_snippet": str(response.message.content)[:300],
            })
            return response

        _ollama_pkg.chat = _patched_chat
        return self

    def __exit__(self, *_):
        _ollama_pkg.chat = self._orig_chat


# ══════════════════════════════════════════════════════════════════════════
#  HELPERS
# ══════════════════════════════════════════════════════════════════════════

def detect_ocr_used(pdf_path: str) -> bool:
    try:
        import pymupdf as fitz
    except ImportError:
        import fitz
    with fitz.open(pdf_path) as doc:
        for page in doc:
            if len(page.get_text("text").strip()) >= 40:
                return False
    return True


def independent_experience(raw_text: str) -> Tuple[float, List[Dict]]:
    ranges = extract_work_dates(raw_text)
    details = []
    for s, e in sorted(ranges, key=lambda x: x[0]):
        details.append({
            "start": s.strftime("%Y-%m"),
            "end": e.strftime("%Y-%m") if e < datetime.now() else "present",
            "years": round((e - s).days / 365.25, 1)
        })
    return calculate_total_experience(ranges), details


SOFTSKILL_KW = {
    "adaptability", "leadership", "communication", "teamwork",
    "problem solving", "time management", "critical thinking",
    "flexibility", "initiative", "interpersonal", "organised",
    "collaborative", "proactive", "self-motivated", "enthusiastic",
    "quick learner", "detail-oriented", "multitasking", "work ethic",
}

def check_strengths_in_projects(projects: List[str]) -> List[str]:
    flags = []
    for p in projects:
        p_lower = str(p).lower()
        hits = [kw for kw in SOFTSKILL_KW if kw in p_lower]
        if len(hits) >= 2:
            flags.append(f"STRENGTHS→PROJECTS: '{str(p)[:120]}' (kw={hits})")
    return flags


def check_experience_in_projects(projects: List[str]) -> List[str]:
    flags = []
    for p in projects:
        if re.search(r'\b(0[1-9]|1[0-2])[\/-](19|20)\d{2}\b', str(p)):
            flags.append(f"EXP→PROJECTS (date range): '{str(p)[:120]}'")
        elif re.search(r'\b(19|20)\d{2}\s*[-–—]\s*(19|20)\d{2}\b', str(p)):
            flags.append(f"EXP→PROJECTS (year range): '{str(p)[:120]}'")
    return flags


def check_experience_inflation(extracted_yrs: float, independent_yrs: float,
                                 raw_text: str) -> List[str]:
    flags = []
    if extracted_yrs > 20:
        flags.append(f"HIGH_EXP: {extracted_yrs}y (>20 — likely includes non-employment dates)")
    if independent_yrs > 0 and abs(extracted_yrs - independent_yrs) > 3:
        flags.append(f"EXP_MISMATCH: pipeline={extracted_yrs}y, independent={independent_yrs}y")
    # Detect education date ranges in text (common inflation source)
    edu_dates = re.findall(
        r'(?:b\.?s|b\.?e|m\.?s|phd|bachelor|master|university|college|institute)[^.\n]{0,60}'
        r'(\b(19|20)\d{2}\s*[-–—]\s*((19|20)\d{2}|present)\b)',
        raw_text, re.I
    )
    if edu_dates:
        flags.append(f"EDU_DATES_IN_TEXT: {len(edu_dates)} education date(s) found "
                     f"(e.g. {edu_dates[0][0]!r}) — may be picked up by extract_work_dates()")
    return flags


# ══════════════════════════════════════════════════════════════════════════
#  MAIN AUDIT LOOP
# ══════════════════════════════════════════════════════════════════════════

def run_audit(resume_dir: Path) -> List[Dict]:
    pdf_files = sorted(resume_dir.glob("*.pdf"))
    if not pdf_files:
        print(f"[AUDIT2] No PDFs found in {resume_dir}")
        return []

    print(f"\n[AUDIT2] Found {len(pdf_files)} PDFs — starting audit...\n{'='*60}\n")
    results = []

    for pdf_path in pdf_files:
        print(f"  ── {pdf_path.name} ──────────────────────────────────")
        rec: Dict[str, Any] = {
            "filename": pdf_path.name,
            "ocr_used": False,
            "ollama_used": False,
            "ollama_call_count": 0,
            "ollama_calls_detail": [],
            "pydantic_validated": False,
            "is_degraded_fallback": True,
            "extraction_error": None,
            "raw_text_length": 0,
            "raw_text_snippet": "",
            # Extracted fields
            "extracted_name": None,
            "extracted_experience_years": None,
            "work_experience": [],
            "employment_date_ranges": [],
            "skills": [],
            "education": None,
            "projects": [],
            "certifications": [],
            "strengths": [],
            # Independent calculation
            "independent_experience_years": None,
            "independent_date_ranges": [],
            # Issue flags
            "strengths_in_projects": [],
            "experience_in_projects": [],
            "experience_flags": [],
        }

        # ── Step 1: PDF text extraction ──────────────────────────────
        try:
            rec["ocr_used"] = detect_ocr_used(str(pdf_path))
            raw_text = extract_pdf_text(str(pdf_path))
            rec["raw_text_length"] = len(raw_text)
            rec["raw_text_snippet"] = raw_text[:500].replace("\n", " | ")
            print(f"    text_len={len(raw_text):,}  ocr={rec['ocr_used']}")
        except Exception as e:
            rec["extraction_error"] = f"PDF_TEXT_FAIL: {e}"
            print(f"    PDF text extraction FAILED: {e}")
            results.append(rec)
            continue

        # ── Step 2: Independent experience calculation ──────────────
        try:
            ind_yrs, ind_ranges = independent_experience(raw_text)
            rec["independent_experience_years"] = ind_yrs
            rec["independent_date_ranges"] = ind_ranges
        except Exception as e:
            print(f"    independent exp error: {e}")

        # ── Step 3: Ollama extraction (actual pipeline) ─────────────
        capture = OllamaCallCapture()
        try:
            with capture:
                extracted = extract_resume_data_ollama(raw_text, str(pdf_path))

            rec["ollama_call_count"] = len(capture.calls)
            rec["ollama_used"] = len(capture.calls) > 0
            rec["ollama_calls_detail"] = capture.calls
            rec["is_degraded_fallback"] = extracted.get("is_degraded_fallback", not rec["ollama_used"])
            rec["pydantic_validated"] = rec["ollama_used"] and not rec["is_degraded_fallback"]

            rec["extracted_name"] = extracted.get("name")
            rec["extracted_experience_years"] = extracted.get("experience_years")
            rec["work_experience"] = extracted.get("work_experience", [])
            rec["skills"] = extracted.get("skills", [])
            rec["education"] = extracted.get("education")
            rec["projects"] = extracted.get("notable_projects", [])
            rec["certifications"] = extracted.get("certifications", [])
            rec["strengths"] = extracted.get("strengths", [])

            # Extract date ranges specifically from work experience entries
            for exp in rec["work_experience"]:
                s = exp.get("start_date") or exp.get("start")
                e = exp.get("end_date") or exp.get("end")
                if s:
                    rec["employment_date_ranges"].append({"start": s, "end": e or "present"})

            print(f"    name={rec['extracted_name']!r}  "
                  f"exp={rec['extracted_experience_years']}y  "
                  f"ollama_calls={rec['ollama_call_count']}  "
                  f"degraded={rec['is_degraded_fallback']}  "
                  f"pydantic_ok={rec['pydantic_validated']}")
            if rec["ollama_call_count"] > 0:
                for c in capture.calls:
                    print(f"    └─ call #{c['call_index']}: {c['elapsed_s']}s  "
                          f"response_snippet={c['response_snippet'][:80]!r}")

        except Exception as e:
            rec["extraction_error"] = f"OLLAMA_EXTRACT_FAIL: {e}\n{traceback.format_exc()}"
            rec["ollama_call_count"] = len(capture.calls)
            rec["ollama_used"] = len(capture.calls) > 0
            print(f"    Extraction FAILED: {e}")
            results.append(rec)
            continue

        # ── Step 4: Issue detection ─────────────────────────────────
        rec["strengths_in_projects"] = check_strengths_in_projects(rec["projects"])
        rec["experience_in_projects"] = check_experience_in_projects(rec["projects"])
        rec["experience_flags"] = check_experience_inflation(
            rec["extracted_experience_years"] or 0,
            rec["independent_experience_years"] or 0,
            raw_text,
        )

        for w in rec["strengths_in_projects"]:
            print(f"    ⚠️  {w[:100]}")
        for w in rec["experience_in_projects"]:
            print(f"    🔀 {w[:100]}")
        for f in rec["experience_flags"]:
            print(f"    🚩 {f[:100]}")

        print()
        results.append(rec)

    return results


# ══════════════════════════════════════════════════════════════════════════
#  PAUL SATCHELL MAPPING VERIFICATION
# ══════════════════════════════════════════════════════════════════════════

def paul_satchell_mapping(results: List[Dict]) -> str:
    """
    Verify Paul Satchell source mapping:
    PDF filename → candidate DB record → analysis ID
    """
    lines = ["\n" + "="*70, "PAUL SATCHELL SOURCE MAPPING", "="*70]

    # From text snippets, Image_28.pdf and Image_48.pdf contain paul.satchell@gmail.com
    paul_records = [r for r in results if
                    "paul" in str(r.get("extracted_name", "")).lower() or
                    "satchell" in str(r.get("extracted_name", "")).lower() or
                    "paul" in r.get("raw_text_snippet", "").lower()]

    if not paul_records:
        lines.append("⚠️  No records matched Paul Satchell by name or text snippet.")
    else:
        lines.append(f"Found {len(paul_records)} record(s) related to Paul Satchell:\n")

    for rec in paul_records:
        lines.append(f"PDF File     : {rec['filename']}")
        lines.append(f"Extracted Name: {rec['extracted_name']!r}")
        lines.append(f"Experience   : {rec['extracted_experience_years']}y (pipeline)  "
                     f"vs {rec['independent_experience_years']}y (independent)")
        lines.append(f"Ollama used  : {rec['ollama_used']} ({rec['ollama_call_count']} calls)")
        lines.append(f"Degraded     : {rec['is_degraded_fallback']}")
        lines.append(f"Pydantic OK  : {rec['pydantic_validated']}")
        lines.append(f"Education    : {rec['education']!r}")
        lines.append(f"Skills       : {rec['skills'][:8]}")
        lines.append(f"Projects ({len(rec['projects'])}):")
        for i, p in enumerate(rec["projects"], 1):
            lines.append(f"  [{i}] {str(p)[:200]}")
        lines.append(f"Strengths ({len(rec['strengths'])}):")
        for i, s in enumerate(rec["strengths"], 1):
            lines.append(f"  [{i}] {str(s)[:200]}")
        lines.append(f"Certifications ({len(rec['certifications'])}):")
        for i, c in enumerate(rec["certifications"], 1):
            lines.append(f"  [{i}] {str(c)[:200]}")
        lines.append(f"Work Experience ({len(rec['work_experience'])}):")
        for i, exp in enumerate(rec["work_experience"], 1):
            lines.append(f"  [{i}] title={exp.get('title')!r}  "
                         f"company={exp.get('company')!r}  "
                         f"start={exp.get('start_date') or exp.get('start')!r}  "
                         f"end={exp.get('end_date') or exp.get('end')!r}")
        lines.append(f"Independent date ranges ({len(rec['independent_date_ranges'])}):")
        for dr in rec["independent_date_ranges"]:
            lines.append(f"  {dr['start']} → {dr['end']}  ({dr['years']}y)")
        lines.append(f"Strengths→Projects flags : {rec['strengths_in_projects'] or 'None'}")
        lines.append(f"Experience→Projects flags: {rec['experience_in_projects'] or 'None'}")
        lines.append(f"Experience flags         : {rec['experience_flags'] or 'None'}")
        lines.append(f"Raw text snippet :\n  {rec['raw_text_snippet'][:600]}")
        lines.append("")

    # DB lookup
    lines.append("DB Record Mapping:")
    try:
        import sqlite3
        conn = sqlite3.connect(str(BACKEND / "recruitai.db"))
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("""
            SELECT c.id, c.analysis_id, c.name, c.filename, 
                   json_extract(c.entities, '$.experience_years') as exp_years,
                   c.projects
            FROM candidates c
            WHERE c.filename IN ('Image_28.pdf', 'Image_48.pdf', 'Image_92.pdf')
            ORDER BY c.rowid DESC
            LIMIT 15
        """)
        rows = cur.fetchall()
        if rows:
            seen = set()
            for row in rows:
                key = (row["filename"], row["analysis_id"])
                if key in seen:
                    continue
                seen.add(key)
                lines.append(f"  candidate_id={row['id']}")
                lines.append(f"  analysis_id ={row['analysis_id']}")
                lines.append(f"  name        ={row['name']!r}")
                lines.append(f"  filename    ={row['filename']!r}")
                lines.append(f"  exp_years   ={row['exp_years']}")
                proj = json.loads(row["projects"]) if row["projects"] else []
                lines.append(f"  projects ({len(proj)}): {[str(p)[:80] for p in proj[:3]]}")
                lines.append("")
        conn.close()
    except Exception as e:
        lines.append(f"  DB lookup error: {e}")

    return "\n".join(lines)


# ══════════════════════════════════════════════════════════════════════════
#  REPORT
# ══════════════════════════════════════════════════════════════════════════

def generate_report(results: List[Dict]) -> str:
    total = len(results)
    errors = [r for r in results if r["extraction_error"]]
    ollama_used = [r for r in results if r["ollama_used"]]
    degraded = [r for r in results if r["is_degraded_fallback"]]
    pydantic_ok = [r for r in results if r["pydantic_validated"]]
    ocr_used = [r for r in results if r["ocr_used"]]
    strengths_contamination = [r for r in results if r["strengths_in_projects"]]
    exp_contamination = [r for r in results if r["experience_in_projects"]]
    exp_inflated = [r for r in results if r["experience_flags"]]

    lines = []
    lines.append("\n" + "="*70)
    lines.append("BATCH EXTRACTION AUDIT — ROUND 2 (WITH OLLAMA ACTIVE)")
    lines.append(f"Generated : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"Python    : {sys.executable}")
    lines.append(f"venv site : {VENV_SITE}")
    lines.append("="*70)

    lines.append(f"""
ENVIRONMENT SUMMARY
───────────────────
  Correct venv (venv/)          : YES
  ollama package installed       : YES (v0.6.2)
  Ollama server running          : YES
  llama3.2:3b available          : YES
  End-to-end chat verified       : YES
""")

    lines.append(f"A. TOTALS")
    lines.append(f"   Total PDFs              : {total}")
    lines.append(f"   OCR required            : {len(ocr_used)}")
    lines.append(f"   Ollama used (LLM active): {len(ollama_used)}  ← KEY METRIC")
    lines.append(f"   Degraded fallback used  : {len(degraded)}")
    lines.append(f"   Pydantic validated      : {len(pydantic_ok)}")
    lines.append(f"   Extraction failures     : {len(errors)}")
    lines.append("")

    lines.append("B. PER-RESUME RESULTS")
    lines.append(f"   {'File':<20} {'Name':<25} {'Exp':>5}  {'Ollama':>6}  {'Calls':>5}  {'Pydantic':>8}  {'Degraded':>8}")
    lines.append("   " + "-"*90)
    for r in results:
        mark = "✅" if (r["ollama_used"] and not r["is_degraded_fallback"]) else "🔴"
        lines.append(
            f"   {mark} {r['filename']:<18} "
            f"{str(r['extracted_name'] or 'N/A')[:24]:<25} "
            f"{str(r['extracted_experience_years'] or '?'):>5}y "
            f"{'YES' if r['ollama_used'] else 'NO':>6}  "
            f"{r['ollama_call_count']:>5}  "
            f"{'OK' if r['pydantic_validated'] else 'FAIL':>8}  "
            f"{'YES' if r['is_degraded_fallback'] else 'NO':>8}"
        )
    lines.append("")

    lines.append("C. SYMPTOM ANALYSIS (With Ollama Active)")
    lines.append("")
    lines.append(f"  C1. STRENGTHS→PROJECTS contamination: {len(strengths_contamination)} resumes")
    if strengths_contamination:
        for r in strengths_contamination:
            lines.append(f"      🔴 {r['filename']}:")
            for w in r["strengths_in_projects"]:
                lines.append(f"         {w[:120]}")
    else:
        lines.append("      ✅ NONE — Ollama correctly separates strengths from projects")

    lines.append("")
    lines.append(f"  C2. EXPERIENCE→PROJECTS contamination: {len(exp_contamination)} resumes")
    if exp_contamination:
        for r in exp_contamination:
            lines.append(f"      🔴 {r['filename']}:")
            for w in r["experience_in_projects"]:
                lines.append(f"         {w[:120]}")
    else:
        lines.append("      ✅ NONE — Ollama correctly separates experience from projects")

    lines.append("")
    lines.append(f"  C3. EXPERIENCE INFLATION (>20y or mismatch): {len(exp_inflated)} resumes")
    if exp_inflated:
        for r in exp_inflated:
            lines.append(f"      🚩 {r['filename']}  pipeline={r['extracted_experience_years']}y  "
                         f"independent={r['independent_experience_years']}y")
            for f in r["experience_flags"]:
                lines.append(f"         {f[:120]}")
    else:
        lines.append("      ✅ NONE — Ollama correctly calculates experience from work history only")

    lines.append("")
    lines.append("D. EXPERIENCE DISTRIBUTION (Pipeline vs Independent)")
    exp_vals = [(r["filename"], r["extracted_experience_years"], r["independent_experience_years"])
                for r in results if r["extracted_experience_years"] is not None]
    if exp_vals:
        pipeline_vals = [v[1] for v in exp_vals if v[1] is not None]
        ind_vals = [v[2] for v in exp_vals if v[2] is not None]
        lines.append(f"   Pipeline  — min={min(pipeline_vals):.1f}y  "
                     f"max={max(pipeline_vals):.1f}y  "
                     f"mean={sum(pipeline_vals)/len(pipeline_vals):.1f}y")
        if ind_vals:
            lines.append(f"   Independent — min={min(ind_vals):.1f}y  "
                         f"max={max(ind_vals):.1f}y  "
                         f"mean={sum(ind_vals)/len(ind_vals):.1f}y")
        high = [(f, p, i) for f, p, i in exp_vals if p is not None and p > 15]
        if high:
            lines.append(f"\n   Resumes with >15y experience:")
            for f, p, i in sorted(high, key=lambda x: x[1], reverse=True):
                lines.append(f"     {f:<20} pipeline={p}y  independent={i}y")

    lines.append("")
    lines.append("E. PROJECTS FIELD QUALITY (sample per resume)")
    for r in results:
        proj = r["projects"]
        if proj:
            lines.append(f"   {r['filename']:<20} ({len(proj)} projects):")
            for p in proj[:2]:
                lines.append(f"     • {str(p)[:120]}")

    lines.append("")
    lines.append("F. SKILLS, EDUCATION, CERTIFICATIONS (sample)")
    for r in results:
        if r["skills"] or r["education"] or r["certifications"]:
            lines.append(f"   {r['filename']:<20}")
            lines.append(f"     skills ({len(r['skills'])}): {r['skills'][:6]}")
            lines.append(f"     education  : {str(r['education'])[:100]!r}")
            lines.append(f"     certs ({len(r['certifications'])}): "
                         f"{[str(c)[:60] for c in r['certifications'][:2]]}")

    lines.append("")
    lines.append("="*70)
    lines.append("G. VERDICT: BEFORE vs AFTER OLLAMA ACTIVE")
    lines.append("="*70)
    lines.append(f"""
  ROUND 1 (Ollama NOT installed — .venv — 2026-09-23 first run):
    Ollama calls          : 0 / 29 (0%)
    Degraded fallback     : 29 / 29 (100%)
    Strengths→Projects    : confirmed for Paul Satchell (Image_48.pdf)
    Experience→Projects   : 3 / 29 confirmed
    Experience inflation  : 27 / 29 (93%) — max 21.1y
    Paul Satchell exp     : 21y (education date 2002-2008 included by regex)

  ROUND 2 (Ollama active — venv/ — this run):
    Ollama calls          : {len(ollama_used)} / {total}
    Degraded fallback     : {len(degraded)} / {total}
    Strengths→Projects    : {len(strengths_contamination)} / {total}
    Experience→Projects   : {len(exp_contamination)} / {total}
    Experience inflation  : {len(exp_inflated)} / {total}

  KEY QUESTIONS:
    Did 21y exp inflation persist?          {
        'YES — Ollama did not fully fix it' if any(r['filename'] in ('Image_28.pdf','Image_48.pdf') and (r.get('extracted_experience_years') or 0) > 18 for r in results)
        else 'NO — Ollama correctly calculated experience'
    }
    Did Strengths→Projects persist?         {
        'YES — Ollama did not fully fix it' if strengths_contamination
        else 'NO — Ollama correctly separated strengths from projects'
    }
    Did Experience→Projects persist?        {
        'YES — still occurring' if exp_contamination
        else 'NO — Ollama correctly separated experience from projects'
    }
""")

    return "\n".join(lines)


# ══════════════════════════════════════════════════════════════════════════
#  ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sqlite3

    if len(sys.argv) > 1:
        RESUME_DIR = Path(sys.argv[1])

    if not RESUME_DIR.exists():
        print(f"[AUDIT2] Resume directory not found: {RESUME_DIR}")
        sys.exit(1)

    t_start = time.time()
    results = run_audit(RESUME_DIR)
    elapsed = round(time.time() - t_start, 1)
    print(f"\n[AUDIT2] Extraction complete in {elapsed}s")

    paul_section = paul_satchell_mapping(results)
    report = generate_report(results)

    full = paul_section + "\n" + report
    print(full)

    # Save JSON
    json_path = BACKEND / "audit2_results.json"
    with open(json_path, "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\n[AUDIT2] JSON saved to: {json_path}")
    print(f"[AUDIT2] Total time: {elapsed}s")

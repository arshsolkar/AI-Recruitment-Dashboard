from datetime import datetime
from pydantic import BaseModel, Field


class CandidateOut(BaseModel):
    id: str
    analysis_id: str
    filename: str
    name: str
    email: str | None
    skills: list[str]
    missing_skills: list[str]
    entities: dict
    projects: list[str]
    education: str | None
    experience_details: list[dict]
    semantic_score: int
    keyword_score: int
    experience_score: int
    overall_score: int
    recommendation: str
    insight: str
    requires_manual_name_entry: bool = False

    model_config = {"from_attributes": True}


class AnalysisOut(BaseModel):
    id: str
    job_title: str | None
    requirements: dict
    status: str
    error: str | None
    created_at: datetime
    completed_at: datetime | None
    candidate_count: int = 0
    candidates: list[CandidateOut] = Field(default_factory=list)


class CompletedResumeOut(BaseModel):
    id: str
    filename: str
    candidate_name: str
    ats_score: int


class CurrentResumeState(BaseModel):
    filename: str | None
    candidate_name: str | None


class AnalysisStatusOut(BaseModel):
    analysis_id: str
    status: str
    phase: str | None
    current_stage: str
    total: int
    completed: int
    phase_completed: int
    phase_total: int
    current_resume: CurrentResumeState | None
    completed_resumes: list[CompletedResumeOut] = Field(default_factory=list)
    started_at: datetime
    current_resume_started_at: datetime | None
    completed_at: datetime | None

class JobDescriptionExtractOut(BaseModel):
    text: str
    filename: str
    pages: int

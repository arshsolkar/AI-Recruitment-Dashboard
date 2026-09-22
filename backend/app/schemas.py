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

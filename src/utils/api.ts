const API_BASE_URL = 'http://localhost:8000'

export interface AnalysisResponse {
  id: string
  job_title: string | null
  requirements: { required: string[]; preferred: string[]; all?: string[] } | string[]
  status: 'queued' | 'processing' | 'completed' | 'failed'
  error: string | null
  created_at: string
  completed_at: string | null
  candidate_count: number
  candidates: CandidateResponse[]
}

export interface CurrentResumeState {
  filename: string
  candidate_name: string | null
}

export interface CompletedResumeOut {
  id: string
  filename: string
  candidate_name: string
  ats_score: number
}

export interface AnalysisStatusResponse {
  analysis_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  phase: 'text_extraction' | 'calculating_similarities' | 'ai_analysis' | 'completed' | 'failed' | null
  current_stage: string | null
  total: number
  completed: number
  phase_completed: number
  phase_total: number
  current_resume: CurrentResumeState | null
  completed_resumes: CompletedResumeOut[]
  started_at: string | null
  current_resume_started_at: string | null
  completed_at: string | null
  error?: string | null
}

export interface CandidateResponse {
  id: string
  name: string
  email: string | null
  filename: string
  skills: string[]
  missing_skills: string[]
  semantic_score: number
  keyword_score: number
  experience_score: number
  overall_score: number
  recommendation: string
  insight: string
  entities: {
    emails: string[]
    phones: string[]
    experience_years: number
    organizations: string[]
    locations: string[]
  }
  projects: string[]
  education: string | null
  experience_details: any[]
}

export interface CreateAnalysisParams {
  job_description: string
  job_title?: string
  resumes: File[]
}

export async function createAnalysis(params: CreateAnalysisParams): Promise<AnalysisResponse> {
  const formData = new FormData()
  formData.append('job_description', params.job_description)
  if (params.job_title) {
    formData.append('job_title', params.job_title)
  }
  params.resumes.forEach((file) => {
    formData.append('resumes', file)
  })

  const response = await fetch(`${API_BASE_URL}/api/v1/analyses`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to create analysis')
  }

  return response.json()
}

export async function getAnalysis(analysisId: string): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/analyses/${analysisId}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch analysis')
  }

  return response.json()
}

export async function getAnalysisStatus(analysisId: string): Promise<AnalysisStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/analyses/${analysisId}/status`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch analysis status')
  }

  return response.json()
}

export async function downloadReport(analysisId: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/v1/analyses/${analysisId}/report.xlsx`)
  
  if (!response.ok) {
    throw new Error('Failed to download report')
  }

  return response.blob()
}

export async function getCandidateResume(candidateId: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/v1/candidates/${candidateId}/resume`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch resume')
  }

  return response.blob()
}

export async function pollAnalysis(
  analysisId: string,
  onUpdate: (analysis: AnalysisResponse) => void,
  interval = 2000
): Promise<AnalysisResponse> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const analysis = await getAnalysis(analysisId)
        onUpdate(analysis)
        
        if (analysis.status === 'completed') {
          resolve(analysis)
        } else if (analysis.status === 'failed') {
          reject(new Error(analysis.error || 'Analysis failed'))
        } else {
          setTimeout(poll, interval)
        }
      } catch (error) {
        reject(error)
      }
    }
    
    poll()
  })
}

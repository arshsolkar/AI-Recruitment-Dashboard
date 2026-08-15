import { useState, useRef, useCallback } from 'react'

interface UploadedFile {
  name: string
  size: number
  id: string
}

interface NewAnalysisProps {
  onAnalyze: () => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function NewAnalysis({ onAnalyze }: NewAnalysisProps) {
  const [jdMode, setJdMode] = useState<'paste' | 'upload'>('paste')
  const [jdText, setJdText] = useState(
    `Senior Machine Learning Engineer

We are looking for an experienced Machine Learning Engineer to join our AI Platform team. In this role, you will design, build, and deploy production ML systems at scale.

Key Responsibilities:
• Develop and deploy machine learning models for production use cases
• Build scalable ML pipelines using Python, TensorFlow, and Spark
• Collaborate with data scientists and engineers on model deployment
• Optimize model performance and infrastructure efficiency

Requirements:
• 4+ years of experience in ML engineering
• Proficiency in Python, TensorFlow/PyTorch, and SQL
• Experience with Docker, Kubernetes, and cloud platforms (AWS/GCP)
• Strong understanding of ML algorithms and statistical methods`
  )
  const [files, setFiles] = useState<UploadedFile[]>([
    { name: 'rahul_sharma_resume.pdf', size: 284710, id: '1' },
    { name: 'priya_patel_cv.pdf', size: 312440, id: '2' },
    { name: 'aman_kumar_resume.pdf', size: 198320, id: '3' },
  ])
  const [isDragging, setIsDragging] = useState(false)
  const [jdUploaded, setJdUploaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const jdFileInputRef = useRef<HTMLInputElement>(null)

  const addFakeFiles = useCallback(() => {
    const names = [
      'sneha_joshi_resume.pdf',
      'rohan_mehta_cv.pdf',
      'ananya_singh_resume.pdf',
      'vikram_nair_resume.pdf',
      'divya_reddy_cv.pdf',
    ]
    const newFiles = names
      .filter((n) => !files.some((f) => f.name === n))
      .slice(0, 2)
      .map((name) => ({
        name,
        size: Math.floor(Math.random() * 300000) + 150000,
        id: Math.random().toString(36).slice(2),
      }))
    if (newFiles.length) setFiles((prev) => [...prev, ...newFiles])
  }, [files])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    addFakeFiles()
  }, [addFakeFiles])

  const handleFileInput = useCallback(() => {
    addFakeFiles()
  }, [addFakeFiles])

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const canAnalyze = (jdText.trim().length > 20 || jdUploaded) && files.length > 0

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      {/* Header bar */}
      <header className="h-14 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-8 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #635BFF 0%, #8B84FF 100%)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="3" fill="white" opacity="0.9" />
              <path d="M7 1v2M7 11v2M1 7h2M11 7h2M3.22 3.22l1.41 1.41M9.37 9.37l1.41 1.41M10.78 3.22l-1.41 1.41M4.63 9.37l-1.41 1.41" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
            </svg>
          </div>
          <span className="text-[13px] font-700 text-[#111827]">RecruitAI</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F7F8FA] transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6v2.5L2 10.5v.5h12v-.5L12.5 8.5V6C12.5 3.515 10.485 1.5 8 1.5Z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
              <path d="M6.5 11.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
            </svg>
          </button>
          <div className="w-7 h-7 rounded-full bg-[#EEF0FF] flex items-center justify-center text-[11px] font-700 text-[#635BFF]">
            JS
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-start px-6 py-10 max-w-6xl mx-auto w-full">
        {/* Hero text */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-[#EEF0FF] text-[#635BFF] text-[12px] font-600 px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#635BFF] animate-blink" />
            AI-Powered Analysis
          </div>
          <h1 className="text-[30px] font-800 text-[#111827] tracking-tight leading-tight mb-2">
            AI Powered Recruiter Dashboard
          </h1>
          <p className="text-[15px] text-[#6B7280] font-400">
            Analyze and rank candidates using AI-powered resume matching.
          </p>
        </div>

        {/* Two column cards */}
        <div className="w-full grid grid-cols-2 gap-5 mb-6" style={{ animationDelay: '0.1s' }}>
          {/* Job Description Card */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}>
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#EEF0FF] flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="#635BFF" strokeWidth="1.2" fill="none" />
                    <path d="M3 4h6M3 6h6M3 8h4" stroke="#635BFF" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-[13px] font-700 text-[#111827]">Job Description</span>
              </div>
              {/* Mode toggle */}
              <div className="flex items-center bg-[#F7F8FA] rounded-lg p-0.5 gap-0.5">
                <button
                  onClick={() => setJdMode('paste')}
                  className={`px-3 py-1 rounded-md text-[12px] font-500 transition-all duration-150 ${
                    jdMode === 'paste' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  Paste Text
                </button>
                <button
                  onClick={() => setJdMode('upload')}
                  className={`px-3 py-1 rounded-md text-[12px] font-500 transition-all duration-150 ${
                    jdMode === 'upload' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  Upload PDF
                </button>
              </div>
            </div>

            <div className="p-5">
              {jdMode === 'paste' ? (
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste your job description here..."
                  className="w-full h-64 text-[13px] text-[#111827] placeholder-[#9CA3AF] bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg px-3.5 py-3 resize-none focus:outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#EEF0FF] transition-all duration-150 leading-relaxed font-400"
                />
              ) : (
                <div
                  onClick={() => jdFileInputRef.current?.click()}
                  className={`h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                    jdUploaded
                      ? 'border-[#10B981] bg-[#F0FDF4]'
                      : 'border-[#D1D5DB] hover:border-[#635BFF] hover:bg-[#F7F8FF]'
                  }`}
                >
                  {jdUploaded ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-[#10B981] flex items-center justify-center mb-3">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <path d="M4 9l4 4 6-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="text-[13px] font-600 text-[#10B981]">job_description.pdf uploaded</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setJdUploaded(false) }}
                        className="mt-2 text-[12px] text-[#6B7280] hover:text-[#EF4444] transition-colors"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-3">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <path d="M9 2v10M5 6l4-4 4 4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M3 14h12" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>
                      <span className="text-[13px] font-500 text-[#374151]">Drop PDF here or click to upload</span>
                      <span className="text-[12px] text-[#9CA3AF] mt-1">PDF files only</span>
                    </>
                  )}
                  <input
                    ref={jdFileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={() => setJdUploaded(true)}
                  />
                </div>
              )}

              {jdMode === 'paste' && jdText.length > 0 && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-[#9CA3AF]">{jdText.length} characters</span>
                  <button
                    onClick={() => setJdText('')}
                    className="text-[11px] text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Resume Upload Card */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}>
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#EEF0FF] flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 10V3a1 1 0 011-1h4.586a1 1 0 01.707.293L9.707 3.707A1 1 0 0110 4.414V10a1 1 0 01-1 1H3a1 1 0 01-1-1z" stroke="#635BFF" strokeWidth="1.2" fill="none" />
                    <path d="M7 2v2.5H9.5" stroke="#635BFF" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-[13px] font-700 text-[#111827]">Resume Upload</span>
              </div>
              {files.length > 0 && (
                <span className="text-[11px] font-600 text-[#635BFF] bg-[#EEF0FF] px-2 py-0.5 rounded-full">
                  {files.length} files
                </span>
              )}
            </div>

            <div className="p-5 flex flex-col h-[calc(100%-57px)]">
              {/* Drop zone */}
              <div
                onDragEnter={handleDragEnter}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 py-6 ${
                  isDragging
                    ? 'border-[#635BFF] bg-[#F7F8FF] scale-[1.01]'
                    : 'border-[#D1D5DB] hover:border-[#635BFF] hover:bg-[#F7F8FF]'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${isDragging ? 'bg-[#EEF0FF]' : 'bg-[#F3F4F6]'}`}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 3v10M7 6l3-3 3 3" stroke={isDragging ? '#635BFF' : '#9CA3AF'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 16h12" stroke={isDragging ? '#635BFF' : '#9CA3AF'} strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <span className={`text-[13px] font-600 transition-colors ${isDragging ? 'text-[#635BFF]' : 'text-[#374151]'}`}>
                  {isDragging ? 'Release to upload' : 'Drop resumes here'}
                </span>
                <span className="text-[12px] text-[#9CA3AF] mt-0.5">or click to browse</span>
                <span className="text-[11px] text-[#C4C9D4] mt-1">PDF files · Multiple files supported</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="mt-3 flex-1 overflow-y-auto space-y-1.5 min-h-0">
                  {files.map((file, idx) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#F7F8FA] border border-[#F3F4F6] group hover:border-[#E5E7EB] transition-colors"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="w-7 h-7 rounded-md bg-[#EEF0FF] flex items-center justify-center flex-shrink-0">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M2.5 11.5V2.5a1 1 0 011-1h4.17a1 1 0 01.71.29l1.83 1.83a1 1 0 01.29.71v7.17a1 1 0 01-1 1h-6a1 1 0 01-1-1z" stroke="#635BFF" strokeWidth="1.1" fill="none" />
                          <path d="M7.5 1.5v2.5H10" stroke="#635BFF" strokeWidth="1.1" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-500 text-[#111827] truncate">{file.name}</div>
                        <div className="text-[11px] text-[#9CA3AF]">{formatBytes(file.size)}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                          <span className="text-[11px] text-[#10B981] font-500">Ready</span>
                        </div>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="w-5 h-5 rounded flex items-center justify-center text-[#C4C9D4] hover:text-[#EF4444] hover:bg-[#FEF2F2] opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onAnalyze}
            disabled={!canAnalyze}
            className={`flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-[15px] font-700 text-white transition-all duration-200 ${
              canAnalyze
                ? 'hover:opacity-90 hover:shadow-lg active:scale-[0.98] cursor-pointer'
                : 'opacity-40 cursor-not-allowed'
            }`}
            style={canAnalyze ? { background: 'linear-gradient(135deg, #635BFF 0%, #8B84FF 100%)', boxShadow: '0 4px 14px rgba(99,91,255,0.35)' } : { background: '#9CA3AF' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5L8.5 5.5L12.5 7L8.5 8.5L7 12.5L5.5 8.5L1.5 7L5.5 5.5L7 1.5Z" fill="white" />
            </svg>
            Analyze Candidates
          </button>
          <div className="flex items-center gap-2 text-[12px] text-[#9CA3AF]">
            <span className="flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="4" stroke="#9CA3AF" strokeWidth="1" fill="none" />
                <path d="M5 3v3M5 7.5v.5" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round" />
              </svg>
              Semantic matching
            </span>
            <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
            <span>Skill analysis</span>
            <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
            <span>Candidate ranking</span>
          </div>
        </div>
      </main>
    </div>
  )
}

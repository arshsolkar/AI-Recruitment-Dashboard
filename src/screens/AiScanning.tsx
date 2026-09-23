import { useState, useEffect, useRef } from 'react'
import { pollAnalysis, type AnalysisResponse } from '../utils/api'

interface AiScanningProps {
  analysisId: string
  uploadedFiles: File[]
  onComplete: (analysis: AnalysisResponse) => void
  onError: (error: string) => void
}

const STAGES = [
  { id: 1, label: 'Uploading & Preparing', detail: 'Initializing processing pipeline' },
  { id: 2, label: 'Extracting Resume Data', detail: 'Processing PDF documents' },
  { id: 3, label: 'Analyzing Skills', detail: 'Running NLP skill detection' },
  { id: 4, label: 'Calculating ATS Score', detail: 'Vector embedding comparison' },
  { id: 5, label: 'Generating Insights', detail: 'Building intelligence report' },
]

export default function AiScanning({ analysisId, uploadedFiles, onComplete, onError }: AiScanningProps) {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [currentStage, setCurrentStage] = useState(1)
  
  const startTimeRef = useRef<number>(Date.now())
  
  const status = analysis?.status || 'queued'
  const total = analysis?.candidate_count || uploadedFiles.length || 0

  useEffect(() => {
    if (analysis?.created_at) {
      startTimeRef.current = new Date(analysis.created_at).getTime()
    }
  }, [analysis?.created_at])

  useEffect(() => {
    if (status === 'completed' || status === 'failed') return
    
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    
    return () => clearInterval(interval)
  }, [status])

  useEffect(() => {
    if (!analysisId) return

    pollAnalysis(
      analysisId,
      (updated) => setAnalysis(updated),
      2000
    )
      .then((completedAnalysis) => {
        setAnalysis(completedAnalysis)
        setTimeout(() => onComplete(completedAnalysis), 1500)
      })
      .catch((error) => onError(error.message))
  }, [analysisId, onComplete, onError])

  // Progress logic
  const expectedTotalSeconds = total * 10
  const recentCandidates = analysis?.candidates || []
  const completedCount = status === 'completed' ? total : recentCandidates.length
  const progressPct = total > 0 ? (completedCount / total) * 100 : 0
  
  useEffect(() => {
    if (status === 'completed') {
      setCurrentStage(6)
    } else if (status === 'processing') {
      // Advance stages purely for visual feedback of the batch, NOT resume count
      const progressRatio = Math.min(elapsedSeconds / Math.max(expectedTotalSeconds, 1), 0.95)
      
      if (progressRatio < 0.1) setCurrentStage(2)
      else if (progressRatio < 0.4) setCurrentStage(3)
      else if (progressRatio < 0.7) setCurrentStage(4)
      else setCurrentStage(5)
    }
  }, [elapsedSeconds, expectedTotalSeconds, status])
  
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0 || !isFinite(secs)) return '--:--'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const avgSecsPerResume = completedCount > 0 ? elapsedSeconds / completedCount : 0
  const remainingResumes = total - completedCount
  
  let estimatedRemaining = '--:--'
  if (status === 'completed') {
    estimatedRemaining = '00:00'
  } else if (completedCount >= 1 && avgSecsPerResume > 0) {
    estimatedRemaining = '~' + formatTime(avgSecsPerResume * remainingResumes)
  } else {
    estimatedRemaining = 'Calculating...'
  }
  
  const speed = completedCount > 0 ? ((completedCount / Math.max(elapsedSeconds, 1)) * 60).toFixed(1) : '...'

  const currentResumeIndex = Math.min(completedCount, total - 1)
  const currentResumeFilename = uploadedFiles[currentResumeIndex]?.name || `Resume_${currentResumeIndex + 1}.pdf`

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#E5E7EB] max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#FEE2E2] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Analysis Interrupted</h2>
          <p className="text-gray-600 mb-6">{analysis?.error || 'Unable to complete resume processing.'}</p>
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg mb-6 text-sm">
            <div>
              <div className="text-gray-500">Completed</div>
              <div className="font-semibold">{completedCount} resumes</div>
            </div>
            <div>
              <div className="text-gray-500">Remaining</div>
              <div className="font-semibold">{remainingResumes} resumes</div>
            </div>
          </div>
          <button 
            onClick={() => onError(analysis?.error || 'Failed')}
            className="w-full py-2.5 bg-[#635BFF] text-white rounded-lg font-medium hover:bg-[#524BDE] transition-colors"
          >
            Start New Analysis
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center py-12 px-6 overflow-y-auto">
      <div className="w-full max-w-5xl flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Scanning</h1>
            <p className="text-gray-500 text-sm mt-1">Analyzing resumes against the provided job description</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${
            status === 'completed' ? 'bg-[#ECFDF5] text-[#10B981] border-[#A7F3D0]' : 'bg-white text-[#635BFF] border-[#E0E7FF]'
          }`}>
            {status !== 'completed' && <div className="w-2 h-2 rounded-full bg-[#635BFF] animate-pulse" />}
            {status === 'completed' ? 'Completed' : status === 'queued' ? 'Preparing' : 'Processing'}
          </div>
        </div>

        {/* Main Progress Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#E5E7EB]">
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">AI Analysis Progress</div>
              <div className="text-4xl font-bold text-gray-900">{Math.round(progressPct)}%</div>
            </div>
            <div className="text-gray-600 font-medium">
              {completedCount} of {total} resumes processed
            </div>
          </div>
          
          <div className="w-full bg-[#F3F4F6] rounded-full h-3 mb-8 overflow-hidden relative">
            <div 
              className="h-full bg-gradient-to-r from-[#635BFF] to-[#8B84FF] transition-all duration-500 ease-out relative"
              style={{ width: `${progressPct}%` }}
            >
              <div className="absolute inset-0 bg-white/20" style={{ animation: 'progress-shine 2s infinite linear' }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 divide-x divide-[#E5E7EB]">
            <div className="pl-0">
              <div className="text-sm text-gray-500 mb-1">Elapsed Time</div>
              <div className="text-xl font-semibold text-gray-900">{formatTime(elapsedSeconds)}</div>
            </div>
            <div className="pl-6">
              <div className="text-sm text-gray-500 mb-1">Estimated Remaining</div>
              <div className="text-xl font-semibold text-gray-900">{estimatedRemaining}</div>
            </div>
            <div className="pl-6">
              <div className="text-sm text-gray-500 mb-1">Processing Speed</div>
              <div className="text-xl font-semibold text-gray-900">{speed} <span className="text-sm font-normal text-gray-500">resumes/min</span></div>
            </div>
          </div>
          
          {status === 'completed' && (
            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center animate-fade-in-up">
              <button className="flex items-center gap-2 px-6 py-3 bg-[#635BFF] text-white rounded-xl font-medium hover:bg-[#524BDE] transition-all hover-lift">
                View Results 
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3.33331 8H12.6666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 3.33331L12.6667 7.99998L8 12.6666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Currently Processing */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB] flex flex-col">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Currently Processing</h2>
            
            {status === 'completed' ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="w-16 h-16 bg-[#ECFDF5] rounded-full flex items-center justify-center mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">All resumes processed</h3>
                <p className="text-gray-500 text-sm mt-1">Ready for review</p>
              </div>
            ) : (
              <div className="border border-[#E5E7EB] rounded-xl p-5 flex-1 relative overflow-hidden bg-gray-50/50">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#635BFF]"></div>
                
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xs text-gray-500 font-medium mb-1">FILE</div>
                    <div className="font-mono text-sm font-semibold text-gray-900 bg-white px-2 py-1 border border-gray-200 rounded inline-block">
                      {currentResumeFilename}
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="text-xs text-gray-500 font-medium mb-1">CANDIDATE</div>
                  <div className="text-base font-medium text-gray-900">
                    {completedCount === 0 ? 'Batch processing resumes...' : 'Extracting candidate information...'}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <div className="text-sm font-medium text-[#635BFF]">
                      {STAGES.find(s => s.id === currentStage)?.label || 'Processing'}
                    </div>
                    <div className="text-xs font-medium text-gray-500">
                      Stage {Math.min(currentStage, 5)} of 5
                    </div>
                  </div>
                  <div className="w-full bg-[#E5E7EB] rounded-full h-1.5 mb-1 overflow-hidden">
                    <div 
                      className="h-full bg-[#635BFF] transition-all duration-300"
                      style={{ width: `${(Math.min(currentStage, 5) / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Processing Pipeline */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Processing Pipeline</h2>
            <div className="space-y-6 relative">
              <div className="absolute left-2.5 top-3 bottom-4 w-px bg-[#E5E7EB]"></div>
              
              {STAGES.map((stage) => {
                const isComplete = currentStage > stage.id || status === 'completed'
                const isActive = currentStage === stage.id && status !== 'completed'
                
                return (
                  <div key={stage.id} className="flex items-start gap-4 relative z-10">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isComplete ? 'bg-[#10B981]' : isActive ? 'bg-white border-2 border-[#635BFF]' : 'bg-white border-2 border-[#E5E7EB]'
                    }`}>
                      {isComplete && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                      {isActive && <div className="w-2 h-2 rounded-full bg-[#635BFF] animate-pulse"></div>}
                    </div>
                    
                    <div>
                      <h4 className={`text-sm font-medium ${isComplete || isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                        {stage.label}
                      </h4>
                      <p className={`text-xs mt-0.5 ${isComplete || isActive ? 'text-gray-500' : 'text-gray-400'}`}>
                        {stage.detail}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom row: Queue & Completed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Queue */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB] lg:col-span-1">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex justify-between">
              <span>Processing Queue</span>
              <span className="text-gray-500 font-medium">{uploadedFiles.length} files</span>
            </h2>
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2">
              {uploadedFiles.map((file, idx) => {
                const isProcessed = idx < completedCount
                const isProcessing = idx === currentResumeIndex && status !== 'completed'
                
                return (
                  <div key={idx} className={`flex items-center gap-3 p-2 rounded-lg text-sm ${
                    isProcessing ? 'bg-[#EEF0FF] border border-[#C7D2FE]' : 'border border-transparent'
                  }`}>
                    {isProcessed ? (
                      <div className="text-[#10B981] flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                    ) : isProcessing ? (
                      <div className="text-[#635BFF] flex-shrink-0">
                        <div className="w-4 h-4 border-2 border-[#635BFF] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-[#E5E7EB] flex-shrink-0"></div>
                    )}
                    <span className={`truncate font-mono text-xs ${
                      isProcessing ? 'text-[#635BFF] font-semibold' : 
                      isProcessed ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {file.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recently Completed */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB] lg:col-span-2">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              Recently Completed
            </h2>
            {recentCandidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <p className="text-sm">Candidates will appear here as they complete</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      <th className="pb-3 font-medium">Candidate</th>
                      <th className="pb-3 font-medium">Match Score</th>
                      <th className="pb-3 font-medium">Source File</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentCandidates.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 animate-fade-in-up">
                        <td className="py-3 font-medium text-gray-900 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center flex-shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </div>
                          {c.name}
                        </td>
                        <td className="py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#EEF0FF] text-[#635BFF]">
                            {c.overall_score}% ATS
                          </span>
                        </td>
                        <td className="py-3 font-mono text-xs text-gray-500 truncate max-w-[150px]">
                          {c.filename}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { pollAnalysis, type AnalysisResponse } from '../utils/api'

interface AiScanningProps {
  analysisId: string
  onComplete: (analysis: any) => void
  onError: (error: string) => void
}

const STAGES = [
  { label: 'Job description analyzed', detail: 'Extracting key requirements' },
  { label: 'Resume text extracted', detail: 'Processing PDF documents' },
  { label: 'Identifying candidate skills', detail: 'Running NLP skill detection' },
  { label: 'Calculating semantic similarity', detail: 'Vector embedding comparison' },
  { label: 'Ranking candidates', detail: 'Scoring against criteria' },
  { label: 'Generating recruitment insights', detail: 'Building intelligence report' },
]

export default function AiScanning({ analysisId, onComplete, onError }: AiScanningProps) {
  const [currentStage, setCurrentStage] = useState(1)
  const [processed, setProcessed] = useState(0)
  const [done, setDone] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!analysisId) return

    // Start with simulated progress for visual feedback
    let count = 0
    const interval = setInterval(() => {
      count++
      setProcessed(count)
      if (count >= 95) {
        clearInterval(interval)
      }
    }, 80)

    // Poll for real analysis status
    pollAnalysis(
      analysisId,
      (analysis: AnalysisResponse) => {
        setTotal(analysis.candidate_count)
        
        // Update stage based on status
        if (analysis.status === 'queued') {
          setCurrentStage(1)
        } else if (analysis.status === 'processing') {
          setCurrentStage(2)
        }
      },
      2000
    )
      .then((completedAnalysis) => {
        clearInterval(interval)
        setDone(true)
        setProcessed(100)
        setTimeout(() => onComplete(completedAnalysis), 1500)
      })
      .catch((error) => {
        clearInterval(interval)
        onError(error.message)
      })

    return () => clearInterval(interval)
  }, [analysisId, onComplete, onError])

  const progressPct = total > 0 ? (processed / total) * 100 : 0

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Subtle background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(99,91,255,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, rgba(99,91,255,0.08) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-12 max-w-lg w-full px-6">
        {/* Central animation */}
        <div className="relative w-56 h-56 flex items-center justify-center">
          {/* Outer pulse rings */}
          <div
            className="absolute rounded-full border border-[#635BFF]"
            style={{
              width: 220, height: 220,
              animation: 'pulse-ring 2.8s ease-out infinite',
              opacity: 0.2,
            }}
          />
          <div
            className="absolute rounded-full border border-[#635BFF]"
            style={{
              width: 220, height: 220,
              animation: 'pulse-ring 2.8s ease-out infinite 1.4s',
              opacity: 0.15,
            }}
          />

          {/* Rotating scanner ring */}
          <div
            className="absolute rounded-full"
            style={{
              width: 180, height: 180,
              border: '1.5px solid transparent',
              borderTopColor: 'rgba(99,91,255,0.5)',
              borderRightColor: 'rgba(99,91,255,0.2)',
              animation: 'scan-rotate 3s linear infinite',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 160, height: 160,
              border: '1px solid transparent',
              borderTopColor: 'rgba(99,91,255,0.3)',
              borderLeftColor: 'rgba(99,91,255,0.15)',
              animation: 'scan-rotate-reverse 5s linear infinite',
            }}
          />

          {/* Orbiting nodes */}
          <div className="absolute" style={{ width: '100%', height: '100%' }}>
            <div
              className="absolute w-3 h-3 rounded-full bg-[#635BFF] top-1/2 left-1/2 -mt-1.5 -ml-1.5"
              style={{ animation: 'orbit-a 6s linear infinite', boxShadow: '0 0 8px rgba(99,91,255,0.6)' }}
            />
            <div
              className="absolute w-2 h-2 rounded-full bg-[#8B84FF] top-1/2 left-1/2 -mt-1 -ml-1"
              style={{ animation: 'orbit-b 9s linear infinite', boxShadow: '0 0 6px rgba(99,91,255,0.5)' }}
            />
            <div
              className="absolute w-2.5 h-2.5 rounded-full top-1/2 left-1/2 -mt-[5px] -ml-[5px]"
              style={{
                animation: 'orbit-c 12s linear infinite',
                background: '#10B981',
                boxShadow: '0 0 8px rgba(16,185,129,0.5)',
              }}
            />
            <div
              className="absolute w-1.5 h-1.5 rounded-full bg-[#F59E0B] top-1/2 left-1/2 -mt-[3px] -ml-[3px]"
              style={{ animation: 'orbit-d 7.5s linear infinite', boxShadow: '0 0 5px rgba(245,158,11,0.5)' }}
            />
          </div>

          {/* Central node */}
          <div
            className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #635BFF 0%, #8B84FF 100%)',
              boxShadow: '0 0 0 8px rgba(99,91,255,0.1), 0 8px 32px rgba(99,91,255,0.35)',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="6" fill="white" opacity="0.9" />
              <path d="M16 4v4M16 24v4M4 16h4M24 16h4" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
              <path d="M7.76 7.76l2.83 2.83M21.41 21.41l2.83 2.83M7.76 24.24l2.83-2.83M21.41 10.59l2.83-2.83" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
            </svg>

            {done && (
              <div
                className="absolute inset-0 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)', animation: 'fade-in-scale 0.35s ease both' }}
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M6 14l6 6 10-12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Status area */}
        <div className="w-full text-center">
          {done ? (
            <div style={{ animation: 'fade-in-up 0.4s ease both' }}>
              <div className="text-[22px] font-700 text-[#111827] mb-1">Analysis Complete</div>
              <div className="text-[14px] text-[#6B7280]">Ranked {total} candidates · Loading dashboard…</div>
            </div>
          ) : (
            <>
              <div className="text-[22px] font-700 text-[#111827] mb-1">Processing Resumes</div>
              <div className="text-[14px] text-[#6B7280]">
                {total > 0 ? `Analyzing ${total} candidates` : 'Processing analysis'}
              </div>
            </>
          )}

          {/* Progress bar */}
          <div className="mt-5 w-full bg-[#E5E7EB] rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${progressPct}%`,
                background: done
                  ? 'linear-gradient(90deg, #10B981, #34D399)'
                  : 'linear-gradient(90deg, #635BFF, #8B84FF)',
              }}
            />
          </div>
          <div className="mt-1.5 text-[12px] text-[#9CA3AF] font-500">{Math.round(progressPct)}%</div>
        </div>

        {/* Processing stages */}
        <div className="w-full bg-white rounded-xl border border-[#E5E7EB] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {STAGES.map((stage, idx) => {
            const isComplete = idx < currentStage
            const isActive = idx === currentStage
            const isPending = idx > currentStage

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 px-5 py-3 transition-colors duration-300 ${
                  isActive ? 'bg-[#F7F8FF]' : ''
                } ${idx < STAGES.length - 1 ? 'border-b border-[#F3F4F6]' : ''}`}
              >
                {/* Status icon */}
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                  {isComplete ? (
                    <div
                      className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center"
                      style={{ animation: 'step-check 0.3s ease both' }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  ) : isActive ? (
                    <div className="relative">
                      <div
                        className="w-5 h-5 rounded-full border-2 border-[#635BFF] absolute"
                        style={{ animation: 'pulse-ring 1.5s ease-out infinite', opacity: 0.4 }}
                      />
                      <div className="w-5 h-5 rounded-full border-2 border-[#635BFF] flex items-center justify-center relative">
                        <div className="w-2 h-2 rounded-full bg-[#635BFF] animate-blink" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-[#E5E7EB]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className={`text-[13px] font-500 leading-tight ${
                      isComplete ? 'text-[#111827]' : isActive ? 'text-[#635BFF] font-600' : 'text-[#9CA3AF]'
                    }`}
                  >
                    {stage.label}
                  </div>
                  {(isComplete || isActive) && !isPending && (
                    <div className="text-[11px] text-[#9CA3AF] mt-0.5">{stage.detail}</div>
                  )}
                </div>

                {isActive && (
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-[#635BFF] animate-blink" style={{ animationDelay: '0s' }} />
                    <div className="w-1 h-1 rounded-full bg-[#635BFF] animate-blink" style={{ animationDelay: '0.2s' }} />
                    <div className="w-1 h-1 rounded-full bg-[#635BFF] animate-blink" style={{ animationDelay: '0.4s' }} />
                  </div>
                )}

                {isComplete && (
                  <span className="text-[11px] text-[#10B981] font-600">Done</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

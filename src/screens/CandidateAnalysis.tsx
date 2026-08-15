import { useEffect, useRef, useState } from 'react'
import type { Candidate } from '../data/candidates'
import { getMatchColor, getInitialsColor } from '../data/candidates'

interface CandidateAnalysisProps {
  candidate: Candidate
  onBack: () => void
}

function MatchGauge({ match, label }: { match: number; label: string }) {
  const [displayed, setDisplayed] = useState(0)
  const frame = useRef<number>(0)

  useEffect(() => {
    setDisplayed(0)
    const start = performance.now()
    const duration = 1000
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(eased * match))
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [match])

  const color = getMatchColor(match)
  const circumference = 2 * Math.PI * 52
  const dashOffset = circumference * (1 - displayed / 100)

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#F3F4F6" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.05s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[28px] font-800 tracking-tight leading-none" style={{ color }}>
            {displayed}%
          </span>
          <span className="text-[11px] font-500 text-[#9CA3AF] mt-1">{label}</span>
        </div>
      </div>
    </div>
  )
}

function MatchBar({ label, value, delay = 0 }: { label: string; value: number; delay?: number }) {
  const [mounted, setMounted] = useState(false)
  const color = getMatchColor(value)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300 + delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] font-500 text-[#374151]">{label}</span>
        <span className="text-[13px] font-700" style={{ color }}>{value}%</span>
      </div>
      <div className="w-full bg-[#F3F4F6] rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: mounted ? `${value}%` : '0%', backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default function CandidateAnalysis({ candidate, onBack }: CandidateAnalysisProps) {
  const initColor = getInitialsColor(candidate.initials)

  return (
    <div className="p-6 max-w-none animate-fade-in-up">
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13px] font-500 text-[#6B7280] hover:text-[#111827] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Overview
        </button>
        <span className="text-[#E5E7EB]">/</span>
        <span className="text-[13px] text-[#9CA3AF]">{candidate.name}</span>
      </div>

      {/* Candidate hero */}
      <div
        className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-5 flex items-center gap-6"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      >
        <div
          className="w-16 h-16 rounded-xl text-[20px] font-800 text-white flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: initColor }}
        >
          {candidate.initials}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-800 text-[#111827] tracking-tight">{candidate.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[14px] text-[#6B7280]">{candidate.title}</span>
            <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
            <span className="text-[13px] text-[#9CA3AF]">{candidate.location}</span>
            <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
            <span className="text-[13px] text-[#9CA3AF]">{candidate.experience} experience</span>
          </div>
          <div className="mt-2 text-[13px] text-[#6B7280]">{candidate.education}</div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-[13px] font-500 text-[#9CA3AF] mb-1">Overall Match</div>
          <div className="text-[36px] font-800 leading-none tracking-tight" style={{ color: getMatchColor(candidate.match) }}>
            {candidate.match}%
          </div>
          <div
            className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-600 px-3 py-1 rounded-full"
            style={{
              color: getMatchColor(candidate.match),
              backgroundColor: candidate.match >= 85 ? '#F0FDF4' : candidate.match >= 70 ? '#EEF0FF' : '#FFFBEB',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getMatchColor(candidate.match) }} />
            {candidate.recommendation}
          </div>
        </div>
      </div>

      {/* Main 3-column layout */}
      <div className="grid grid-cols-3 gap-5 mb-5">
        {/* Match gauge + breakdown */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 className="text-[13px] font-700 text-[#111827] mb-1">Match Score</h3>
          <MatchGauge match={candidate.match} label="Overall" />
          <div className="border-t border-[#F3F4F6] pt-4 mt-2 space-y-4">
            <h4 className="text-[12px] font-600 text-[#9CA3AF] uppercase tracking-wider">Match Breakdown</h4>
            <MatchBar label="Semantic Match" value={candidate.semanticMatch} delay={0} />
            <MatchBar label="Skill Match" value={candidate.skillMatch} delay={100} />
            <MatchBar label="Experience Match" value={candidate.experienceMatch} delay={200} />
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded bg-[#F0FDF4] flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="text-[13px] font-700 text-[#111827]">Matching Skills</h3>
                <span className="text-[11px] font-600 text-[#10B981] bg-[#F0FDF4] px-1.5 py-0.5 rounded-full">
                  {candidate.skills.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((s) => (
                  <span
                    key={s}
                    className="text-[12px] font-500 bg-[#F0FDF4] text-[#10B981] border border-[#D1FAE5] px-2.5 py-1 rounded-lg"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {candidate.missingSkills.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded bg-[#FEF2F2] flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 2l6 6M8 2l-6 6" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h3 className="text-[13px] font-700 text-[#111827]">Missing Skills</h3>
                  <span className="text-[11px] font-600 text-[#EF4444] bg-[#FEF2F2] px-1.5 py-0.5 rounded-full">
                    {candidate.missingSkills.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.missingSkills.map((s) => (
                    <span
                      key={s}
                      className="text-[12px] font-500 bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA] px-2.5 py-1 rounded-lg"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Insight */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #635BFF 0%, #8B84FF 100%)' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1.5L7 4.5H10L7.5 6.5L8.5 9.5L6 7.5L3.5 9.5L4.5 6.5L2 4.5H5L6 1.5Z" fill="white" />
              </svg>
            </div>
            <h3 className="text-[13px] font-700 text-[#111827]">AI Insight</h3>
          </div>

          <div
            className="rounded-xl p-4 text-[13px] text-[#374151] leading-relaxed"
            style={{ background: 'linear-gradient(135deg, #F7F8FF 0%, #EEF0FF 100%)', border: '1px solid #E0E2FF' }}
          >
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className="mb-2 opacity-30">
              <path d="M0 14V8.4C0 5.6 0.8 3.4 2.4 1.8 4 0.6 6.4 0 9.6 0v2.4C7.6 2.4 6.2 3 5.4 4.2 4.6 5 4.2 6.4 4.2 8H8V14H0ZM12 14V8.4C12 5.6 12.8 3.4 14.4 1.8 16 0.6 18.4 0 21.6 0v2.4C19.6 2.4 18.2 3 17.4 4.2 16.6 5 16.2 6.4 16.2 8H20V14H12Z" fill="#635BFF" />
            </svg>
            {candidate.aiInsight}
          </div>

          <div className="mt-4 pt-4 border-t border-[#F3F4F6]">
            <div className="text-[11px] font-600 text-[#9CA3AF] uppercase tracking-wider mb-2">Quick Stats</div>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Skills matched</span>
                <span className="font-600 text-[#111827]">{candidate.skills.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Gaps found</span>
                <span className="font-600 text-[#111827]">{candidate.missingSkills.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Experience</span>
                <span className="font-600 text-[#111827]">{candidate.experience}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Education</span>
                <span className="font-600 text-[#111827]">Masters</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Education + Experience + Projects */}
      <div className="grid grid-cols-3 gap-5">
        {/* Education */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded bg-[#EEF0FF] flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M5.5 1L10 3.5L5.5 6L1 3.5L5.5 1Z" stroke="#635BFF" strokeWidth="1" fill="none" strokeLinejoin="round" />
                <path d="M1 3.5v4l4.5 2.5L10 7.5v-4" stroke="#635BFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <h3 className="text-[13px] font-700 text-[#111827]">Education</h3>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-[14px] flex-shrink-0">
              🎓
            </div>
            <div>
              <div className="text-[13px] font-600 text-[#111827] leading-snug">{candidate.education}</div>
              <div className="text-[11px] text-[#9CA3AF] mt-1">2018 – 2020</div>
            </div>
          </div>
        </div>

        {/* Experience */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded bg-[#EEF0FF] flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <rect x="1" y="3" width="9" height="7" rx="1" stroke="#635BFF" strokeWidth="1" fill="none" />
                <path d="M3.5 3V2a2 2 0 014 0v1" stroke="#635BFF" strokeWidth="1" fill="none" />
              </svg>
            </div>
            <h3 className="text-[13px] font-700 text-[#111827]">Experience</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#635BFF] mt-1.5 flex-shrink-0" />
              <div>
                <div className="text-[13px] font-600 text-[#111827]">ML Engineer</div>
                <div className="text-[12px] text-[#9CA3AF]">Current Company · {candidate.experience}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#D1D5DB] mt-1.5 flex-shrink-0" />
              <div>
                <div className="text-[13px] font-600 text-[#374151]">Data Scientist</div>
                <div className="text-[12px] text-[#9CA3AF]">Previous Company · 2 years</div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded bg-[#EEF0FF] flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1 8.5V3.5l4.5-2 4.5 2V8.5l-4.5 2L1 8.5Z" stroke="#635BFF" strokeWidth="1" fill="none" strokeLinejoin="round" />
                <path d="M5.5 1.5v9M1 3.5l4.5 2 4.5-2" stroke="#635BFF" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-[13px] font-700 text-[#111827]">Notable Projects</h3>
          </div>
          <div className="space-y-2.5">
            {candidate.projects.map((p, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-md bg-[#F3F4F6] text-[9px] font-700 text-[#9CA3AF] flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-[12px] text-[#374151] leading-snug">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

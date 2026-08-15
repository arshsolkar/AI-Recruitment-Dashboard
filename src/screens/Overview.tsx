import { useEffect, useState, useRef } from 'react'
import type { SidebarTab } from '../components/Sidebar'
import {
  CANDIDATES,
  SKILLS_ANALYSIS,
  MATCH_DISTRIBUTION,
  getRecommendationColor,
  getMatchColor,
  getInitialsColor,
} from '../data/candidates'

interface OverviewProps {
  activeTab: SidebarTab
  onSelectCandidate: (id: number) => void
}

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0)
  const frame = useRef<number>(0)
  useEffect(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target, duration])
  return value
}

function KpiCard({
  label,
  value,
  suffix = '',
  change,
  icon,
  delay = 0,
}: {
  label: string
  value: number
  suffix?: string
  change?: string
  icon: JSX.Element
  delay?: number
}) {
  const displayed = useCountUp(value, 900)
  return (
    <div
      className="bg-white rounded-xl border border-[#E5E7EB] p-5 animate-fade-in-up"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)', animationDelay: `${delay}s` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-lg bg-[#F7F8FA] flex items-center justify-center">{icon}</div>
        {change && (
          <span className="text-[11px] font-600 text-[#10B981] bg-[#F0FDF4] px-2 py-0.5 rounded-full">
            {change}
          </span>
        )}
      </div>
      <div className="text-[30px] font-800 text-[#111827] leading-none tracking-tight">
        {displayed}
        <span className="text-[20px] font-700">{suffix}</span>
      </div>
      <div className="mt-1 text-[13px] text-[#6B7280] font-400">{label}</div>
    </div>
  )
}

function BarChart() {
  const maxCount = Math.max(...MATCH_DISTRIBUTION.map((d) => d.count))
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="space-y-3">
      {MATCH_DISTRIBUTION.map((item) => {
        const pct = maxCount > 0 ? (item.count / maxCount) * 100 : 0
        return (
          <div key={item.range} className="flex items-center gap-3">
            <div className="text-[12px] text-[#6B7280] font-400 w-20 flex-shrink-0 text-right">
              {item.range}
            </div>
            <div className="flex-1 bg-[#F3F4F6] rounded-full h-6 overflow-hidden relative">
              <div
                className="h-full rounded-full flex items-center pl-3 transition-all duration-700 ease-out"
                style={{
                  width: mounted ? `${Math.max(pct, item.count > 0 ? 8 : 0)}%` : '0%',
                  backgroundColor: item.color,
                  opacity: 0.85,
                }}
              >
                {item.count > 0 && (
                  <span className="text-[11px] font-700 text-white">{item.count}</span>
                )}
              </div>
              {item.count === 0 && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-[#9CA3AF]">0</span>
              )}
            </div>
            <div className="text-[12px] font-600 text-[#374151] w-6 flex-shrink-0">{item.count}</div>
          </div>
        )
      })}
    </div>
  )
}

function RecommendationBadge({ rec }: { rec: string }) {
  const color = getRecommendationColor(rec as any)
  const bg = color === '#10B981' ? '#F0FDF4' : color === '#635BFF' ? '#EEF0FF' : color === '#F59E0B' ? '#FFFBEB' : '#FEF2F2'
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-600 px-2 py-0.5 rounded-full"
      style={{ color, backgroundColor: bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {rec}
    </span>
  )
}

function SkillPill({ skill, present }: { skill: string; present: boolean }) {
  return (
    <span
      className={`inline-flex text-[11px] font-500 px-2 py-0.5 rounded-md ${
        present
          ? 'bg-[#EEF0FF] text-[#635BFF]'
          : 'bg-[#F3F4F6] text-[#9CA3AF] line-through decoration-[#C4C9D4]'
      }`}
    >
      {skill}
    </span>
  )
}

export default function Overview({ activeTab, onSelectCandidate }: OverviewProps) {
  const topCandidates = CANDIDATES.slice(0, 5)

  if (activeTab === 'candidates') {
    return <CandidatesTab onSelectCandidate={onSelectCandidate} />
  }

  if (activeTab === 'skills') {
    return <SkillsTab />
  }

  if (activeTab === 'analytics') {
    return <AnalyticsTab />
  }

  if (activeTab === 'job-analysis') {
    return <JobAnalysisTab />
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in-up">
      {/* Page header */}
      <div className="mb-1">
        <h1 className="text-[22px] font-800 text-[#111827] tracking-tight">Recruitment Overview</h1>
        <p className="text-[13px] text-[#6B7280] mt-0.5">
          AI analysis results for{' '}
          <span className="font-500 text-[#374151]">Senior Machine Learning Engineer</span>
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total Candidates"
          value={42}
          delay={0}
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="7" cy="6" r="3" stroke="#635BFF" strokeWidth="1.4" fill="none" />
              <path d="M2 15c0-3.314 2.239-6 5-6s5 2.686 5 6" stroke="#635BFF" strokeWidth="1.4" strokeLinecap="round" fill="none" />
              <circle cx="13.5" cy="6.5" r="2" stroke="#9CA3AF" strokeWidth="1.2" fill="none" />
              <path d="M12 15c0-2 .9-3.7 2.2-4.6" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            </svg>
          }
        />
        <KpiCard
          label="Shortlisted"
          value={12}
          change="+3 today"
          delay={0.06}
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L10.73 6.6L15.5 7.35L12.25 10.52L13.09 15.27L9 13L4.91 15.27L5.75 10.52L2.5 7.35L7.27 6.6L9 2Z" stroke="#10B981" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
            </svg>
          }
        />
        <KpiCard
          label="Average Match"
          value={84}
          suffix="%"
          change="↑ 6%"
          delay={0.12}
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7" stroke="#F59E0B" strokeWidth="1.4" fill="none" />
              <path d="M9 5v4l2.5 2.5" stroke="#F59E0B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <KpiCard
          label="Skills Identified"
          value={18}
          delay={0.18}
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2.5L10.5 7H15L11.25 9.75L12.75 14.25L9 11.5L5.25 14.25L6.75 9.75L3 7H7.5L9 2.5Z" stroke="#8B84FF" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
            </svg>
          }
        />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-5 gap-4">
        {/* Bar chart */}
        <div
          className="col-span-3 bg-white rounded-xl border border-[#E5E7EB] p-5"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[14px] font-700 text-[#111827]">Match Score Distribution</h3>
              <p className="text-[12px] text-[#9CA3AF] mt-0.5">42 candidates analyzed</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#9CA3AF]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" />
                Strong
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B]" />
                Moderate
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444]" />
                Weak
              </span>
            </div>
          </div>
          <BarChart />
        </div>

        {/* Top candidates */}
        <div
          className="col-span-2 bg-white rounded-xl border border-[#E5E7EB] p-5"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-700 text-[#111827]">Top Candidates</h3>
            <button
              onClick={() => {}}
              className="text-[12px] text-[#635BFF] font-500 hover:underline"
            >
              View all
            </button>
          </div>
          <div className="space-y-3">
            {topCandidates.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => onSelectCandidate(c.id)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#F7F8FA] transition-colors text-left group"
              >
                <div className="w-7 h-7 flex-shrink-0 text-[11px] font-700 text-white rounded-full flex items-center justify-center" style={{ backgroundColor: getInitialsColor(c.initials) }}>
                  {c.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-600 text-[#111827] truncate group-hover:text-[#635BFF] transition-colors">
                    {c.name}
                  </div>
                  <div className="text-[11px] text-[#9CA3AF] truncate">{c.title}</div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-[13px] font-700" style={{ color: getMatchColor(c.match) }}>
                    {c.match}%
                  </div>
                  <div className="text-[10px] text-[#9CA3AF]">#{idx + 1}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Candidate ranking table */}
        <div
          className="col-span-2 bg-white rounded-xl border border-[#E5E7EB] overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          <div className="px-5 py-4 border-b border-[#F3F4F6] flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-700 text-[#111827]">Candidate Ranking</h3>
              <p className="text-[12px] text-[#9CA3AF] mt-0.5">Sorted by match score</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280] bg-[#F7F8FA] px-3 py-1.5 rounded-lg border border-[#E5E7EB]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="5.5" cy="5.5" r="4" stroke="#6B7280" strokeWidth="1.2" fill="none" />
                  <path d="M10 10l-1.5-1.5" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                Search
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280] bg-[#F7F8FA] px-3 py-1.5 rounded-lg border border-[#E5E7EB]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 3h10M3 6h6M5 9h2" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                Filter
              </div>
            </div>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[40px_1fr_100px_1fr_90px_110px] px-5 py-2.5 bg-[#F7F8FA] border-b border-[#F3F4F6] text-[11px] font-600 text-[#9CA3AF] uppercase tracking-wider">
            <span>#</span>
            <span>Candidate</span>
            <span>Match</span>
            <span>Top Skills</span>
            <span>Exp.</span>
            <span>Status</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#F3F4F6]">
            {CANDIDATES.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => onSelectCandidate(c.id)}
                className="w-full grid grid-cols-[40px_1fr_100px_1fr_90px_110px] items-center px-5 py-3 hover:bg-[#F7F8FF] transition-colors text-left group"
              >
                <span className="text-[12px] font-600 text-[#9CA3AF]">{idx + 1}</span>

                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div
                    className="w-7 h-7 flex-shrink-0 text-[11px] font-700 text-white rounded-full flex items-center justify-center"
                    style={{ backgroundColor: getInitialsColor(c.initials) }}
                  >
                    {c.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-600 text-[#111827] truncate group-hover:text-[#635BFF] transition-colors">
                      {c.name}
                    </div>
                    <div className="text-[11px] text-[#9CA3AF] truncate">{c.title}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#F3F4F6] rounded-full h-1.5 max-w-[44px] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${c.match}%`, backgroundColor: getMatchColor(c.match) }}
                    />
                  </div>
                  <span className="text-[12px] font-700" style={{ color: getMatchColor(c.match) }}>
                    {c.match}%
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 pr-2">
                  {c.skills.slice(0, 3).map((s) => (
                    <span key={s} className="text-[10px] font-500 bg-[#F3F4F6] text-[#6B7280] px-1.5 py-0.5 rounded">
                      {s}
                    </span>
                  ))}
                  {c.skills.length > 3 && (
                    <span className="text-[10px] text-[#9CA3AF]">+{c.skills.length - 3}</span>
                  )}
                </div>

                <span className="text-[12px] text-[#6B7280]">{c.experience}</span>

                <RecommendationBadge rec={c.recommendation} />
              </button>
            ))}
          </div>
        </div>

        {/* Skill analysis */}
        <div
          className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          <div className="px-5 py-4 border-b border-[#F3F4F6]">
            <h3 className="text-[14px] font-700 text-[#111827]">Skill Coverage</h3>
            <p className="text-[12px] text-[#9CA3AF] mt-0.5">Required skills across candidates</p>
          </div>
          <div className="px-5 py-4 space-y-4">
            {SKILLS_ANALYSIS.map((item) => (
              <div key={item.skill}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-500 text-[#374151]">{item.skill}</span>
                    {item.required && (
                      <span className="text-[9px] font-600 text-[#635BFF] bg-[#EEF0FF] px-1 py-0.5 rounded">REQ</span>
                    )}
                  </div>
                  <span className="text-[12px] font-600 text-[#374151]">{item.coverage}%</span>
                </div>
                <div className="w-full bg-[#F3F4F6] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bar-grow"
                    style={{
                      '--target-width': `${item.coverage}%`,
                      width: `${item.coverage}%`,
                      backgroundColor: item.required ? '#635BFF' : '#9CA3AF',
                      opacity: item.required ? 1 : 0.6,
                    } as React.CSSProperties}
                  />
                </div>
                <div className="mt-1 text-[10px] text-[#9CA3AF]">
                  {item.missing} candidates missing this skill
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CandidatesTab({ onSelectCandidate }: { onSelectCandidate: (id: number) => void }) {
  return (
    <div className="p-6 animate-fade-in-up">
      <div className="mb-5">
        <h1 className="text-[22px] font-800 text-[#111827] tracking-tight">All Candidates</h1>
        <p className="text-[13px] text-[#6B7280] mt-0.5">8 candidates · Ranked by AI match score</p>
      </div>
      <div
        className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      >
        <div className="grid grid-cols-[48px_1fr_120px_1fr_100px_120px_140px] px-6 py-3 bg-[#F7F8FA] border-b border-[#E5E7EB] text-[11px] font-600 text-[#9CA3AF] uppercase tracking-wider">
          <span>Rank</span>
          <span>Candidate</span>
          <span>Match</span>
          <span>Skills</span>
          <span>Experience</span>
          <span>Location</span>
          <span>Recommendation</span>
        </div>
        <div className="divide-y divide-[#F3F4F6]">
          {CANDIDATES.map((c, idx) => (
            <button
              key={c.id}
              onClick={() => onSelectCandidate(c.id)}
              className="w-full grid grid-cols-[48px_1fr_120px_1fr_100px_120px_140px] items-center px-6 py-4 hover:bg-[#F7F8FF] transition-colors text-left group"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#F7F8FA] text-[12px] font-700 text-[#6B7280]">
                {idx + 1}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full text-[12px] font-700 text-white flex items-center justify-center flex-shrink-0" style={{ backgroundColor: getInitialsColor(c.initials) }}>
                  {c.initials}
                </div>
                <div>
                  <div className="text-[13px] font-600 text-[#111827] group-hover:text-[#635BFF] transition-colors">{c.name}</div>
                  <div className="text-[12px] text-[#9CA3AF]">{c.title}</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 bg-[#F3F4F6] rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${c.match}%`, backgroundColor: getMatchColor(c.match) }} />
                </div>
                <span className="text-[13px] font-700" style={{ color: getMatchColor(c.match) }}>{c.match}%</span>
              </div>
              <div className="flex flex-wrap gap-1 pr-4">
                {c.skills.slice(0, 4).map((s) => (
                  <span key={s} className="text-[11px] bg-[#F3F4F6] text-[#6B7280] px-1.5 py-0.5 rounded font-400">{s}</span>
                ))}
                {c.skills.length > 4 && <span className="text-[11px] text-[#9CA3AF]">+{c.skills.length - 4}</span>}
              </div>
              <span className="text-[13px] text-[#6B7280]">{c.experience}</span>
              <span className="text-[12px] text-[#6B7280]">{c.location}</span>
              <div><RecommendationBadge rec={c.recommendation} /></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function SkillsTab() {
  return (
    <div className="p-6 animate-fade-in-up">
      <div className="mb-5">
        <h1 className="text-[22px] font-800 text-[#111827] tracking-tight">Skills Analysis</h1>
        <p className="text-[13px] text-[#6B7280] mt-0.5">Coverage breakdown across all candidates</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 className="text-[14px] font-700 text-[#111827] mb-4">Required Skills Coverage</h3>
          <div className="space-y-5">
            {SKILLS_ANALYSIS.filter((s) => s.required).map((item) => (
              <div key={item.skill}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-600 text-[#374151]">{item.skill}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-[#9CA3AF]">{item.missing} gaps</span>
                    <span className="text-[13px] font-700 text-[#635BFF]">{item.coverage}%</span>
                  </div>
                </div>
                <div className="w-full bg-[#F3F4F6] rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full bar-grow" style={{ '--target-width': `${item.coverage}%`, width: `${item.coverage}%`, background: 'linear-gradient(90deg, #635BFF, #8B84FF)' } as React.CSSProperties} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 className="text-[14px] font-700 text-[#111827] mb-4">Optional Skills Coverage</h3>
          <div className="space-y-5">
            {SKILLS_ANALYSIS.filter((s) => !s.required).map((item) => (
              <div key={item.skill}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-600 text-[#374151]">{item.skill}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-[#9CA3AF]">{item.missing} gaps</span>
                    <span className="text-[13px] font-700 text-[#9CA3AF]">{item.coverage}%</span>
                  </div>
                </div>
                <div className="w-full bg-[#F3F4F6] rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full bar-grow" style={{ '--target-width': `${item.coverage}%`, width: `${item.coverage}%`, backgroundColor: '#9CA3AF' } as React.CSSProperties} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AnalyticsTab() {
  return (
    <div className="p-6 animate-fade-in-up">
      <div className="mb-5">
        <h1 className="text-[22px] font-800 text-[#111827] tracking-tight">Analytics</h1>
        <p className="text-[13px] text-[#6B7280] mt-0.5">Recruitment funnel and match insights</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Strong Match (85%+)', count: 5, total: 42, color: '#10B981' },
          { label: 'Good Match (70–84%)', count: 15, total: 42, color: '#635BFF' },
          { label: 'Moderate Match (60–69%)', count: 12, total: 42, color: '#F59E0B' },
          { label: 'Weak Match (<60%)', count: 10, total: 42, color: '#EF4444' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-[#E5E7EB] p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="text-[28px] font-800 tracking-tight" style={{ color: item.color }}>{item.count}</div>
            <div className="text-[13px] font-500 text-[#374151] mt-1">{item.label}</div>
            <div className="mt-3 w-full bg-[#F3F4F6] rounded-full h-1.5 overflow-hidden">
              <div className="h-full rounded-full bar-grow" style={{ '--target-width': `${(item.count / item.total) * 100}%`, width: `${(item.count / item.total) * 100}%`, backgroundColor: item.color } as React.CSSProperties} />
            </div>
            <div className="mt-1 text-[12px] text-[#9CA3AF]">{Math.round((item.count / item.total) * 100)}% of total</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function JobAnalysisTab() {
  const requirements = [
    { req: '4+ years of ML engineering experience', weight: 'High', matched: 6 },
    { req: 'Python proficiency', weight: 'High', matched: 8 },
    { req: 'TensorFlow or PyTorch', weight: 'High', matched: 5 },
    { req: 'SQL and data querying', weight: 'Medium', matched: 7 },
    { req: 'Docker containerization', weight: 'Medium', matched: 6 },
    { req: 'Kubernetes orchestration', weight: 'Low', matched: 2 },
    { req: 'AWS or GCP cloud experience', weight: 'Low', matched: 3 },
    { req: 'ML pipeline development', weight: 'High', matched: 5 },
  ]

  return (
    <div className="p-6 animate-fade-in-up">
      <div className="mb-5">
        <h1 className="text-[22px] font-800 text-[#111827] tracking-tight">Job Analysis</h1>
        <p className="text-[13px] text-[#6B7280] mt-0.5">Senior Machine Learning Engineer — Requirements breakdown</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl border border-[#E5E7EB] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="px-5 py-4 border-b border-[#F3F4F6]">
            <h3 className="text-[14px] font-700 text-[#111827]">Extracted Requirements</h3>
          </div>
          <div className="divide-y divide-[#F3F4F6]">
            {requirements.map((r) => (
              <div key={r.req} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 text-[13px] text-[#374151]">{r.req}</div>
                <span className={`text-[11px] font-600 px-2 py-0.5 rounded-full ${r.weight === 'High' ? 'bg-[#FEF2F2] text-[#EF4444]' : r.weight === 'Medium' ? 'bg-[#FFFBEB] text-[#F59E0B]' : 'bg-[#F3F4F6] text-[#9CA3AF]'}`}>
                  {r.weight}
                </span>
                <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
                  <span className="font-600 text-[#10B981]">{r.matched}</span>
                  <span>/ 8 matched</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 className="text-[14px] font-700 text-[#111827] mb-4">Role Summary</h3>
          <div className="space-y-3 text-[13px] text-[#6B7280] leading-relaxed">
            <p>Senior ML Engineering role focused on production-grade ML systems at scale.</p>
            <p>Strong emphasis on Python ecosystem and deep learning frameworks.</p>
            <p>Cloud infrastructure skills are nice-to-have but not blocking.</p>
            <div className="mt-4 pt-4 border-t border-[#F3F4F6] space-y-2">
              <div className="flex justify-between"><span>Requirements extracted</span><span className="font-600 text-[#111827]">8</span></div>
              <div className="flex justify-between"><span>High priority</span><span className="font-600 text-[#EF4444]">4</span></div>
              <div className="flex justify-between"><span>Medium priority</span><span className="font-600 text-[#F59E0B]">2</span></div>
              <div className="flex justify-between"><span>Nice to have</span><span className="font-600 text-[#9CA3AF]">2</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

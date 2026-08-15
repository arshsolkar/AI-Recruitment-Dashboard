import { useState } from 'react'
import Sidebar, { type SidebarTab } from './components/Sidebar'
import TopBar from './components/TopBar'
import NewAnalysis from './screens/NewAnalysis'
import AiScanning from './screens/AiScanning'
import Overview from './screens/Overview'
import CandidateAnalysis from './screens/CandidateAnalysis'
import { CANDIDATES } from './data/candidates'
import { generateExcelReport } from './utils/exportReport'

type Screen = 'analysis' | 'scanning' | 'overview' | 'candidate'

export default function App() {
  const [screen, setScreen] = useState<Screen>('analysis')
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('overview')
  const [selectedCandidateId, setSelectedCandidateId] = useState<number>(1)

  const selectedCandidate = CANDIDATES.find((c) => c.id === selectedCandidateId) ?? CANDIDATES[0]

  const handleAnalyze = () => setScreen('scanning')
  const handleScanComplete = () => setScreen('overview')
  const handleNewAnalysis = () => setScreen('analysis')

  const handleSelectCandidate = (id: number) => {
    setSelectedCandidateId(id)
    setScreen('candidate')
  }

  const handleBack = () => setScreen('overview')

  if (screen === 'analysis') {
    return <NewAnalysis onAnalyze={handleAnalyze} />
  }

  if (screen === 'scanning') {
    return <AiScanning onComplete={handleScanComplete} />
  }

  return (
    <div className="flex h-screen bg-[#F7F8FA] overflow-hidden">
      <Sidebar
        activeTab={sidebarTab}
        onTabChange={(tab) => {
          setSidebarTab(tab)
          if (screen === 'candidate') setScreen('overview')
        }}
        onNewAnalysis={handleNewAnalysis}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onNewAnalysis={handleNewAnalysis} onExportReport={generateExcelReport} />
        <main className="flex-1 overflow-y-auto min-h-0">
          {screen === 'overview' && (
            <Overview
              activeTab={sidebarTab}
              onSelectCandidate={handleSelectCandidate}
            />
          )}
          {screen === 'candidate' && (
            <CandidateAnalysis
              candidate={selectedCandidate}
              onBack={handleBack}
            />
          )}
        </main>
      </div>
    </div>
  )
}

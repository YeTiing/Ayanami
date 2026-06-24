import React, { useState } from 'react'
import Titlebar from './components/Titlebar'
import Sidebar from './components/Sidebar/Sidebar'
import { ThreadView } from './components/ThreadView/ThreadView'
import { Composer } from './components/Composer/Composer'
import RightPanel from './components/RightPanel/RightPanel'
import SettingsModal from './components/Settings/SettingsModal'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="h-full flex flex-col">
      <Titlebar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        rightPanelOpen={rightPanelOpen}
        onToggleRightPanel={() => setRightPanelOpen(!rightPanelOpen)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen && (
          <div className="w-64 flex-shrink-0 border-r border-border">
            <Sidebar />
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <ThreadView />
          <Composer />
        </div>

        {rightPanelOpen && (
          <div className="w-72 flex-shrink-0 border-l border-border">
            <RightPanel />
          </div>
        )}
      </div>

      {settingsOpen && <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
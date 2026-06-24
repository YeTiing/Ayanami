import { useState, useEffect, useCallback } from 'react'

// ---- Icons (inline SVG) ----

function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2.5 4h11M2.5 8h11M2.5 12h11" strokeLinecap="round" />
    </svg>
  )
}

function PanelRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="2" width="14" height="12" rx="1.5" />
      <path d="M10 2v12" strokeLinecap="round" />
    </svg>
  )
}

function MinimizeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 6h8" strokeLinecap="round" />
    </svg>
  )
}

function MaximizeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1.5" y="1.5" width="9" height="9" rx="1" />
    </svg>
  )
}

function RestoreIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3.5" y="0.5" width="8" height="8" rx="1" />
      <path d="M2.5 3.5h-1a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" />
    </svg>
  )
}

// ---- Window API type ----

declare global {
  interface Window {
    ayanami?: {
      window: {
        minimize: () => Promise<void>
        maximize: () => Promise<void>
        close: () => Promise<void>
        isMaximized: () => Promise<boolean>
        onMaximizeChange: (cb: (maximized: boolean) => void) => void
      }
      platform: string
    }
  }
}

// ---- Props ----

interface TitlebarProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
  rightPanelOpen: boolean
  onToggleRightPanel: () => void
}

// ---- Component ----

export default function Titlebar({
  sidebarOpen: _sidebarOpen,
  onToggleSidebar,
  rightPanelOpen,
  onToggleRightPanel,
}: TitlebarProps) {
  const [maximized, setMaximized] = useState(false)
  const api = window.ayanami?.window

  useEffect(() => {
    if (!api) return
    api.isMaximized().then(setMaximized)
    api.onMaximizeChange(setMaximized)
  }, [api])

  const handleMinimize = useCallback(() => api?.minimize(), [api])
  const handleMaximize = useCallback(() => api?.maximize(), [api])
  const handleClose = useCallback(() => api?.close(), [api])

  return (
    <div className="h-[36px] bg-surface-dark border-b border-border flex items-center select-none flex-shrink-0">
      {/* Left */}
      <div className="flex items-center h-full">
        <button
          onClick={onToggleSidebar}
          className="h-full px-3 text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors titlebar-no-drag"
          title="切换侧边栏"
        >
          <MenuIcon />
        </button>
        <span className="text-text-primary text-sm font-medium tracking-wide pl-1 pr-4">
          Ayanami
        </span>
      </div>

      {/* Center: drag region */}
      <div className="flex-1 h-full titlebar-drag" />

      {/* Right */}
      <div className="flex items-center h-full">
        <button
          onClick={onToggleRightPanel}
          className={`h-full px-3 transition-colors titlebar-no-drag ${
            rightPanelOpen
              ? 'text-accent bg-surface-light'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-light'
          }`}
          title="切换右侧面板"
        >
          <PanelRightIcon />
        </button>

        <div className="w-px h-4 bg-border mx-0.5" />

        <button
          onClick={handleMinimize}
          className="h-full px-3 text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors titlebar-no-drag"
          title="最小化"
        >
          <MinimizeIcon />
        </button>
        <button
          onClick={handleMaximize}
          className="h-full px-3 text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors titlebar-no-drag"
          title={maximized ? '还原' : '最大化'}
        >
          {maximized ? <RestoreIcon /> : <MaximizeIcon />}
        </button>
        <button
          onClick={handleClose}
          className="h-full px-3 text-text-secondary hover:text-white hover:bg-red-600 transition-colors titlebar-no-drag"
          title="关闭"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  )
}

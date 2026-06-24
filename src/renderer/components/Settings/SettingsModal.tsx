import { useEffect, useCallback } from 'react'
import Settings from './Settings'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative w-[800px] h-[560px] bg-[#0d0d0d] rounded-xl shadow-2xl border border-[#1f1f1f] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1f1f1f] shrink-0">
          <span className="text-sm font-semibold text-[#e0e0e0]">设置</span>
          <button
            onClick={onClose}
            className="text-[#888] hover:text-[#fff] transition-colors text-lg leading-none p-1"
            aria-label="关闭"
          >
            &#x2715;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0">
          <Settings />
        </div>
      </div>
    </div>
  )
}

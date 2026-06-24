import React from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { MODEL_OPTIONS } from '@/types'

export default function ModelSettings() {
  const { activeModel, activeProvider, setActiveModel, saveConfig, loading } = useSettingsStore()

  const handleSelect = (modelId: string) => {
    setActiveModel(modelId)
    saveConfig().catch(() => {})
  }

  // Combine built-in MODEL_OPTIONS with any models from the active provider
  const modelOptions = [...MODEL_OPTIONS]

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-text-primary text-lg font-semibold mb-6">模型选择</h2>

      {/* Active provider indicator */}
      <div className="mb-4 px-3 py-2 bg-surface-light border border-border rounded-lg">
        <span className="text-text-muted text-xs">当前 Provider: </span>
        <span className="text-accent-light text-sm font-medium">{activeProvider}</span>
      </div>

      <div className="space-y-3 overflow-y-auto">
        {modelOptions.map((opt) => {
          const isActive = opt.id === activeModel
          const isProviderMatch = opt.provider === activeProvider

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                isActive
                  ? 'border-accent bg-accent/10 ring-1 ring-accent/30'
                  : 'border-border bg-surface hover:border-border-light'
              } ${!isProviderMatch ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-primary font-medium text-sm">{opt.label}</span>
                    {!isProviderMatch && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400 uppercase tracking-wide">
                        {opt.provider}
                      </span>
                    )}
                  </div>
                  <div className="text-text-muted text-xs mt-1">{opt.description}</div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isActive
                      ? 'border-accent bg-accent'
                      : 'border-border'
                  }`}
                >
                  {isActive && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {loading && (
        <div className="absolute inset-0 bg-surface/60 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

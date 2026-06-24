import React, { useState, useEffect } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { testConnection } from '@/services/configService'
import type { ModelProvider, ProviderStatus } from '@/types'

// ---- Inline icons (SVG) ----

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

// ---- Add Provider Form ----

interface AddProviderFormProps {
  onClose: () => void
  onSave: (name: string, provider: ModelProvider) => void
  initial?: { name: string; provider: ModelProvider } | null
}

function AddProviderForm({ onClose, onSave, initial }: AddProviderFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [baseUrl, setBaseUrl] = useState(initial?.provider.base_url ?? '')
  const [apiKey, setApiKey] = useState(initial?.provider.api_key ?? '')
  const [wireApi, setWireApi] = useState(initial?.provider.wire_api ?? 'responses')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !baseUrl.trim()) return
    onSave(name.trim(), {
      name: name.trim(),
      base_url: baseUrl.trim(),
      api_key: apiKey.trim() || undefined,
      wire_api: wireApi,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-surface-light border border-border rounded-xl p-6 w-[420px] shadow-2xl"
      >
        <h3 className="text-text-primary text-lg font-semibold mb-4">
          {initial ? '编辑 Provider' : '添加 Provider'}
        </h3>

        <label className="block mb-3">
          <span className="text-text-secondary text-sm">名称</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如: openai, claude"
            className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm
                       focus:outline-none focus:border-accent placeholder:text-muted"
            disabled={!!initial}
            autoFocus={!initial}
          />
        </label>

        <label className="block mb-3">
          <span className="text-text-secondary text-sm">Base URL</span>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.openai.com/v1"
            className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm
                       focus:outline-none focus:border-accent placeholder:text-muted"
          />
        </label>

        <label className="block mb-3">
          <span className="text-text-secondary text-sm">API Key</span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm
                       focus:outline-none focus:border-accent placeholder:text-muted font-mono"
          />
        </label>

        <label className="block mb-5">
          <span className="text-text-secondary text-sm">Wire API</span>
          <select
            value={wireApi}
            onChange={(e) => setWireApi(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm
                       focus:outline-none focus:border-accent"
          >
            <option value="responses">responses</option>
            <option value="chat_completions">chat_completions</option>
            <option value="anthropic">anthropic</option>
          </select>
        </label>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
          >
            {initial ? '保存' : '添加'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ---- Status Indicator ----

function StatusDot({ status }: { status: ProviderStatus | undefined }) {
  if (!status) {
    return <div className="w-2.5 h-2.5 rounded-full bg-text-muted" title="未检测" />
  }
  if (status.reachable) {
    return (
      <div
        className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]"
        title={`延迟 ${status.latency_ms}ms`}
      />
    )
  }
  return (
    <div
      className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]"
      title={status.error ?? '不可达'}
    />
  )
}

// ---- Main Component ----

export default function ProviderSettings() {
  const {
    providers,
    providerStatuses,
    activeProvider,
    loading,
    addProvider,
    updateProvider,
    removeProvider,
    setActiveProvider,
    setProviderStatus,
    saveConfig,
  } = useSettingsStore()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<{ name: string; provider: ModelProvider } | null>(null)

  useEffect(() => {
    // Check status of each provider on mount
    for (const [name, p] of Object.entries(providers)) {
      if (p.base_url) {
        testConnection(p.base_url).then((result) => {
          setProviderStatus(name, {
            name,
            reachable: result.ok,
            latency_ms: result.latency,
            error: result.error,
          })
        })
      }
    }
  }, [providers, setProviderStatus])

  const handleCheckHealth = async (name: string, baseUrl: string) => {
    setProviderStatus(name, { name, reachable: false, latency_ms: null })
    const result = await testConnection(baseUrl)
    setProviderStatus(name, {
      name,
      reachable: result.ok,
      latency_ms: result.latency,
      error: result.error,
    })
  }

  const handleAdd = (name: string, provider: ModelProvider) => {
    addProvider(name, provider)
    saveConfig().catch(() => {})
  }

  const handleUpdate = (name: string, provider: ModelProvider) => {
    updateProvider(name, provider)
    saveConfig().catch(() => {})
  }

  const handleDelete = (name: string) => {
    removeProvider(name)
    saveConfig().catch(() => {})
  }

  const entries = Object.entries(providers)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-text-primary text-lg font-semibold">Provider 管理</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-accent text-white rounded-lg
                     hover:bg-accent-dark transition-colors"
        >
          <PlusIcon />
          添加 Provider
        </button>
      </div>

      {/* Provider list */}
      {entries.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
          暂无 Provider，点击上方按钮添加
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto">
          {entries.map(([name, p]) => {
            const status = providerStatuses[name]
            const isActive = name === activeProvider

            return (
              <div
                key={name}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors ${
                  isActive
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-surface hover:border-border-light'
                }`}
              >
                {/* Status dot */}
                <StatusDot status={status} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-text-primary font-medium text-sm">{name}</span>
                    {isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent-light uppercase tracking-wide">
                        当前
                      </span>
                    )}
                  </div>
                  <div className="text-text-muted text-xs mt-0.5 truncate">{p.base_url}</div>
                  <div className="text-text-muted text-[11px] mt-0.5">
                    Wire API: <span className="text-text-secondary">{p.wire_api}</span>
                    {status?.reachable && (
                      <span className="ml-2 text-green-400">
                        {status.latency_ms}ms
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCheckHealth(name, p.base_url)}
                    className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface transition-colors"
                    title="检测连接"
                  >
                    <RefreshIcon />
                  </button>
                  <button
                    onClick={() => setEditing({ name, provider: p })}
                    className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface transition-colors"
                    title="编辑"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => handleDelete(name)}
                    className="p-1.5 text-text-muted hover:text-red-400 rounded-lg hover:bg-surface transition-colors"
                    title="删除"
                  >
                    <TrashIcon />
                  </button>
                  {!isActive && (
                    <button
                      onClick={() => {
                        setActiveProvider(name)
                        saveConfig().catch(() => {})
                      }}
                      className="ml-1 px-2 py-1 text-[11px] text-accent-light hover:text-white
                                 border border-accent/40 hover:bg-accent rounded transition-colors"
                    >
                      启用
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <AddProviderForm
          onClose={() => setShowForm(false)}
          onSave={handleAdd}
        />
      )}
      {editing && (
        <AddProviderForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={handleUpdate}
        />
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-surface/60 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

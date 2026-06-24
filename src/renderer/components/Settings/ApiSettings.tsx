import React, { useState } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { testConnection, setApiBase, getCurrentApiBase } from '@/services/configService'

export default function ApiSettings() {
  const { apiBaseUrl, setApiBaseUrl } = useSettingsStore()

  const [url, setUrl] = useState(apiBaseUrl)
  const [testing, setTesting] = useState(false)
  const [healthResult, setHealthResult] = useState<{
    ok: boolean
    latency: number
    error?: string
  } | null>(null)

  const handleSave = () => {
    const trimmed = url.trim().replace(/\/+$/, '')
    if (!trimmed) return
    setApiBaseUrl(trimmed)
    setApiBase(trimmed)
  }

  const handleTest = async () => {
    const trimmed = url.trim().replace(/\/+$/, '')
    if (!trimmed) return

    setTesting(true)
    setHealthResult(null)
    const result = await testConnection(trimmed)
    setHealthResult(result)
    setTesting(false)
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-text-primary text-lg font-semibold mb-6">API 设置</h2>

      {/* Backend URL */}
      <div className="space-y-4">
        <div>
          <label className="block text-text-secondary text-sm mb-2">后端 API 地址</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setHealthResult(null)
              }}
              placeholder="http://127.0.0.1:57321"
              className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm
                         focus:outline-none focus:border-accent placeholder:text-muted font-mono"
            />
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
            >
              保存
            </button>
          </div>
        </div>

        {/* Test Connection */}
        <div>
          <button
            onClick={handleTest}
            disabled={testing || !url.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg
                       text-text-secondary hover:text-text-primary hover:border-accent
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {testing ? (
              <>
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                检测中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                测试连接
              </>
            )}
          </button>
        </div>

        {/* Result */}
        {healthResult && (
          <div
            className={`px-4 py-3 rounded-lg border text-sm ${
              healthResult.ok
                ? 'border-green-500/30 bg-green-500/10 text-green-400'
                : 'border-red-500/30 bg-red-500/10 text-red-400'
            }`}
          >
            {healthResult.ok ? (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>连接成功 — 延迟 {healthResult.latency}ms</span>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>连接失败</span>
                </div>
                {healthResult.error && (
                  <div className="mt-1 text-xs opacity-75">{healthResult.error}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="mt-8 p-4 bg-surface-light border border-border rounded-lg">
        <h3 className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">说明</h3>
        <ul className="text-text-muted text-xs space-y-1.5">
          <li>API 地址指向 Ayanami 后端服务 (默认端口 57321)</li>
          <li>更改后立即生效，无需重启</li>
          <li>健康检查端点: <code className="text-text-secondary bg-surface px-1 py-0.5 rounded text-[11px]">/health</code></li>
        </ul>
      </div>
    </div>
  )
}

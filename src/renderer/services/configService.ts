// ============================================================
// Ayanami - Config Service
// ============================================================
// Reads config.toml via Electron IPC (preferred) or REST API fallback.

import type { AppConfig, ModelProvider } from '@/types'

const DEFAULT_API_BASE = 'http://127.0.0.1:57321'

// Type guard: uses shared types from @/types/electron.d.ts

function hasIpc(): boolean {
  return typeof window !== 'undefined' && !!window.ayanami?.config
}

// ---- Public API ----

export async function loadConfig(): Promise<AppConfig> {
  if (hasIpc()) {
    const result = await window.ayanami!.config!.read()
    if ('error' in result && result.error) {
      throw new Error(result.error)
    }
    return result as AppConfig
  }

  // Fallback: fetch from backend REST API
  const apiBase = getApiBase()
  const res = await fetch(`${apiBase}/v1/config`)
  if (!res.ok) {
    throw new Error(`Failed to load config: HTTP ${res.status}`)
  }
  const data = await res.json()

  return {
    model: data.model ?? 'deepseek-v4-pro',
    model_provider: data.model_provider ?? 'custom',
    providers: data.providers ?? data.model_providers ?? {},
    sandbox_mode: data.sandbox_mode ?? 'workspace-only',
    permission_mode: data.permission_mode ?? 'never',
    ...data,
  } as AppConfig
}

export async function saveConfig(updates: {
  model?: string
  model_provider?: string
  providers?: Record<string, ModelProvider>
  sandbox_mode?: string
  permission_mode?: string
}): Promise<void> {
  if (hasIpc()) {
    const result = await window.ayanami!.config!.write(updates as Record<string, unknown>)
    if (result.error) {
      throw new Error(result.error)
    }
    return
  }

  // Fallback: POST to backend REST API
  const apiBase = getApiBase()
  const res = await fetch(`${apiBase}/v1/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) {
    throw new Error(`Failed to save config: HTTP ${res.status}`)
  }
}

export async function testConnection(url: string): Promise<{ ok: boolean; latency: number; error?: string }> {
  if (hasIpc()) {
    const result = await window.ayanami!.config!.healthCheck(url); return { ...result, latency: (result as any).latency ?? 0 }
  }

  // Fallback: direct fetch
  const start = Date.now()
  try {
    const res = await fetch(`${url.replace(/\/+$/, '')}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })
    return { ok: res.ok, latency: Date.now() - start }
  } catch (err) {
    return { ok: false, latency: Date.now() - start, error: (err as Error).message }
  }
}

function getApiBase(): string {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('ayanami_api_base') ?? DEFAULT_API_BASE
  }
  return DEFAULT_API_BASE
}

export function setApiBase(url: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('ayanami_api_base', url)
  }
}

export function getCurrentApiBase(): string {
  return getApiBase()
}

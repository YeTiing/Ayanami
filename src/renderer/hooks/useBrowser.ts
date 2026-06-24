// ============================================================
// Ayanami - useBrowser hook
// Manages browser session via backend API
// API: http://127.0.0.1:57321
// ============================================================

import { useState, useRef, useCallback, useEffect } from 'react'

const BASE = 'http://127.0.0.1:57321'

export interface UseBrowserReturn {
  screenshot: string | null
  url: string
  loading: boolean
  connected: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  navigate: (url: string) => Promise<void>
  refresh: () => Promise<void>
  goBack: () => Promise<void>
  goForward: () => Promise<void>
  click: (selector: string) => Promise<void>
  evaluate: (js: string) => Promise<string | null>
  typeText: (selector: string, text: string) => Promise<void>
}

export function useBrowser(): UseBrowserReturn {
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchScreenshot = useCallback(async () => {
    try {
      const ctrl = new AbortController()
      abortRef.current = ctrl
      const res = await fetch(`${BASE}/browser/screenshot`, { signal: ctrl.signal })
      if (!res.ok) return
      const data = await res.json()
      if (data.image) setScreenshot(data.image)
      if (data.url) setUrl(data.url)
      if (typeof data.loading === 'boolean') setLoading(data.loading)
    } catch {
      // ignore
    }
  }, [])

  const connect = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/browser/connect`, { method: 'POST' })
      if (res.ok) {
        setConnected(true)
        fetchScreenshot()
        intervalRef.current = setInterval(fetchScreenshot, 800)
      }
    } catch {
      // backend unreachable
    }
  }, [fetchScreenshot])

  const disconnect = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    abortRef.current?.abort()
    try {
      await fetch(`${BASE}/browser/disconnect`, { method: 'POST' })
    } catch {
      // ignore
    }
    setConnected(false)
    setScreenshot(null)
    setUrl('')
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      abortRef.current?.abort()
    }
  }, [])

  const post = useCallback(async (path: string, body?: unknown) => {
    if (!connected) return
    setLoading(true)
    try {
      const res = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await res.json().catch(() => null)
      if (data?.url) setUrl(data.url)
      return data
    } catch {
      return null
    } finally {
      setLoading(false)
      fetchScreenshot()
    }
  }, [connected, fetchScreenshot])

  const navigate = useCallback((targetUrl: string) => {
    const full = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`
    setUrl(full)
    return post('/browser/navigate', { url: full })
  }, [post])

  const refresh = useCallback(() => post('/browser/refresh'), [post])
  const goBack = useCallback(() => post('/browser/back'), [post])
  const goForward = useCallback(() => post('/browser/forward'), [post])
  const click = useCallback((selector: string) => post('/browser/click', { selector }), [post])
  const typeText = useCallback((selector: string, text: string) => post('/browser/type', { selector, text }), [post])

  const evaluate = useCallback(async (js: string): Promise<string | null> => {
    if (!connected) return null
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/browser/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ js }),
      })
      const data = await res.json()
      return data?.result ?? null
    } catch {
      return null
    } finally {
      setLoading(false)
    }
  }, [connected])

  return { screenshot, url, loading, connected, connect, disconnect, navigate, refresh, goBack, goForward, click, evaluate, typeText }
}

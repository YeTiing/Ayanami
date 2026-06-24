// ============================================================
// Ayanami - useComputerUse hook
// Manages Computer Use connection + 500ms screenshot polling
// API: http://127.0.0.1:57321
// ============================================================

import { useState, useRef, useCallback, useEffect } from 'react'

const BASE = 'http://127.0.0.1:57321'

export interface UseComputerUseReturn {
  connected: boolean
  screenshot: string | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  move: (x: number, y: number) => Promise<void>
  click: (button?: 'left' | 'right' | 'middle') => Promise<void>
  doubleClick: () => Promise<void>
  type: (text: string) => Promise<void>
  key: (keys: string) => Promise<void>
  scroll: (dx: number, dy: number) => Promise<void>
}

export function useComputerUse(): UseComputerUseReturn {
  const [connected, setConnected] = useState(false)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchScreenshot = useCallback(async () => {
    try {
      const ctrl = new AbortController()
      abortRef.current = ctrl
      const res = await fetch(`${BASE}/cu/screenshot`, {
        signal: ctrl.signal,
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.image) setScreenshot(data.image)
    } catch {
      // ignore aborts / network errors during polling
    }
  }, [])

  const connect = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/cu/connect`, { method: 'POST' })
      if (res.ok) {
        setConnected(true)
        fetchScreenshot()
        intervalRef.current = setInterval(fetchScreenshot, 500)
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
      await fetch(`${BASE}/cu/disconnect`, { method: 'POST' })
    } catch {
      // ignore
    }
    setConnected(false)
    setScreenshot(null)
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      abortRef.current?.abort()
    }
  }, [])

  const post = useCallback(async (path: string, body?: unknown) => {
    if (!connected) return
    try {
      await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })
      fetchScreenshot()
    } catch {
      // ignore
    }
  }, [connected, fetchScreenshot])

  const move = useCallback((x: number, y: number) => post('/cu/move', { x, y }), [post])
  const click = useCallback((button: 'left' | 'right' | 'middle' = 'left') => post('/cu/click', { button }), [post])
  const doubleClick = useCallback(() => post('/cu/doubleclick'), [post])
  const type = useCallback((text: string) => post('/cu/type', { text }), [post])
  const key = useCallback((keys: string) => post('/cu/key', { keys }), [post])
  const scroll = useCallback((dx: number, dy: number) => post('/cu/scroll', { dx, dy }), [post])

  return { connected, screenshot, connect, disconnect, move, click, doubleClick, type, key, scroll }
}

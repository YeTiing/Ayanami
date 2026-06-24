export interface AyanamiAPI {
  window: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
    isMaximized: () => Promise<boolean>
    onMaximizeChange: (cb: (maximized: boolean) => void) => void
  }
  shell: {
    exec: (command: string, cwd?: string) => Promise<{ stdout: string; stderr: string; error: string | null }>
  }
  config?: {
    read: () => Promise<any>
    write: (updates: Record<string, unknown>) => Promise<{ success?: boolean; error?: string }>
    healthCheck: (url: string) => Promise<{ ok: boolean; error?: string }>
  }
  platform?: string
}

declare global {
  interface Window {
    ayanami: AyanamiAPI
  }
}
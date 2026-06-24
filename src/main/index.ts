import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null

// ---- Lightweight TOML parser for simple config ----

interface ParsedToml {
  [key: string]: unknown
}

function parseSimpleToml(toml: string): ParsedToml {
  const result: Record<string, unknown> = {}
  let currentSection: Record<string, unknown> | null = null
  let currentSectionPath: string[] = []

  for (const rawLine of toml.split('\n')) {
    const line = rawLine.trim()
    if (line === '' || line.startsWith('#')) continue

    // Section header: [section] or [section.sub]
    const sectionMatch = line.match(/^\[([^\]]+)\]$/)
    if (sectionMatch) {
      const secName = sectionMatch[1].trim()
      currentSectionPath = secName.split('.')
      currentSection = ensureNested(result, ...currentSectionPath)
      continue
    }

    // Key = value
    const kvMatch = line.match(/^(\S+)\s*=\s*(.+)$/)
    if (kvMatch) {
      const key = kvMatch[1].trim()
      const value = parseTomlValue(kvMatch[2].trim())
      if (currentSection) {
        currentSection[key] = value
      } else {
        result[key] = value
      }
    }
  }

  return result
}

function ensureNested(obj: Record<string, unknown>, ...keys: string[]): Record<string, unknown> {
  for (const key of keys) {
    if (!obj[key] || typeof obj[key] !== 'object') {
      obj[key] = {} as Record<string, unknown>
    }
    obj = obj[key] as Record<string, unknown>
  }
  return obj
}

function parseTomlValue(raw: string): unknown {
  // String
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1)
  }
  // Boolean
  if (raw === 'true') return true
  if (raw === 'false') return false
  // Integer
  if (/^\d+$/.test(raw)) return parseInt(raw, 10)
  // Float
  if (/^\d+\.\d+$/.test(raw)) return parseFloat(raw)
  // Fallback: string
  return raw
}

// Normalize parsed TOML to AppConfig shape
function normalizeConfig(parsed: ParsedToml) {
  const rawProviders = (parsed.model_providers as Record<string, Record<string, unknown>>) ?? {}

  const providers: Record<string, Record<string, unknown>> = {}
  for (const [name, p] of Object.entries(rawProviders)) {
    providers[name] = {
      name: p.name ?? name,
      wire_api: p.wire_api ?? 'responses',
      base_url: p.base_url ?? '',
      api_key: p.api_key ?? '',
    }
  }

  return {
    model: (parsed.model as string) ?? 'deepseek-v4-pro',
    model_provider: (parsed.model_provider as string) ?? 'custom',
    providers,
    sandbox_mode: ((parsed as any).sandbox?.mode as string) ?? ((parsed as any).sandbox_mode as string) ?? 'workspace-only',
    permission_mode: ((parsed as any).permissions?.mode as string) ?? ((parsed as any).permission_mode as string) ?? 'never',
    available_models: (parsed.available_models as string[]) ?? [],
  }
}

function getConfigPath(): string {
  return path.join(app.getAppPath(), 'config.toml')
}

// Serialize config back to TOML
function serializeConfig(config: Record<string, unknown>): string {
  const lines: string[] = []

  // Top-level keys
  const topKeys = ['model', 'model_provider']
  for (const key of topKeys) {
    if (config[key] !== undefined) {
      lines.push(`${key} = "${config[key]}"`)
    }
  }

  // Providers
  const providers = (config.providers as Record<string, Record<string, unknown>>) ?? {}
  lines.push('')
  for (const [name, p] of Object.entries(providers)) {
    lines.push(`[model_providers.${name}]`)
    lines.push(`name = "${p.name ?? name}"`)
    lines.push(`wire_api = "${p.wire_api ?? 'responses'}"`)
    lines.push(`base_url = "${p.base_url ?? ''}"`)
    if (p.api_key) lines.push(`api_key = "${p.api_key}"`)
    lines.push('')
  }

  // Sandbox
  lines.push('[sandbox]')
  lines.push(`mode = "${config.sandbox_mode ?? 'workspace-only'}"`)
  lines.push('')

  // Permissions
  lines.push('[permissions]')
  lines.push(`mode = "${config.permission_mode ?? 'never'}"`)
  lines.push('')

  return lines.join('\n')
}

// ---- Window Creation ----

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Ayanami',
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ---- Window IPC ----

ipcMain.handle('window:minimize', () => mainWindow?.minimize())
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})
ipcMain.handle('window:close', () => mainWindow?.close())
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false)

// ---- Shell IPC ----

ipcMain.handle('shell:exec', async (_event, command: string, cwd?: string) => {
  const { exec } = require('child_process')
  return new Promise((resolve) => {
    exec(command, { cwd: cwd || process.cwd(), maxBuffer: 10 * 1024 * 1024 }, (error: any, stdout: string, stderr: string) => {
      resolve({ stdout, stderr, error: error?.message || null })
    })
  })
})

// ---- Config IPC ----

ipcMain.handle('config:read', async () => {
  try {
    const configPath = getConfigPath()
    if (!fs.existsSync(configPath)) {
      return { error: 'config.toml not found' }
    }
    const raw = fs.readFileSync(configPath, 'utf-8')
    const parsed = parseSimpleToml(raw)
    return normalizeConfig(parsed)
  } catch (err: any) {
    return { error: err.message ?? 'Failed to read config' }
  }
})

ipcMain.handle('config:write', async (_event, updates: Record<string, unknown>) => {
  try {
    const configPath = getConfigPath()

    // Read existing config first, then merge updates
    let existing: ParsedToml = {}
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8')
      existing = parseSimpleToml(raw)
    }

    // Merge
    const merged: Record<string, unknown> = {}
    if (updates.model !== undefined) merged.model = updates.model
    else merged.model = existing.model

    if (updates.model_provider !== undefined) merged.model_provider = updates.model_provider
    else merged.model_provider = existing.model_provider

    merged.providers = updates.providers ?? existing.model_providers ?? {}
    merged.sandbox_mode = updates.sandbox_mode ?? (existing.sandbox as any)?.mode ?? 'workspace-only'
    merged.permission_mode = updates.permission_mode ?? (existing.permissions as any)?.mode ?? 'never'

    const toml = serializeConfig(merged)
    fs.writeFileSync(configPath, toml, 'utf-8')
    return { success: true }
  } catch (err: any) {
    return { error: err.message ?? 'Failed to write config' }
  }
})

ipcMain.handle('config:healthCheck', async (_event, url: string) => {
  const start = Date.now()
  try {
    const http = url.startsWith('https') ? require('https') : require('http')
    const result = await new Promise<{ ok: boolean; latency: number; error?: string }>((resolve) => {
      const req = http.get(`${url.replace(/\/+$/, '')}/health`, { timeout: 5000 }, (res: any) => {
        let data = ''
        res.on('data', (chunk: string) => { data += chunk })
        res.on('end', () => {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, latency: Date.now() - start })
        })
      })
      req.on('error', (err: Error) => {
        resolve({ ok: false, latency: Date.now() - start, error: err.message })
      })
      req.on('timeout', () => {
        req.destroy()
        resolve({ ok: false, latency: Date.now() - start, error: 'Request timed out' })
      })
    })
    return result
  } catch (err: any) {
    return { ok: false, latency: Date.now() - start, error: err.message }
  }
})

// ---- App Lifecycle ----

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

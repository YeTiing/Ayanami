import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ModelId, SandboxMode, PermissionMode, ReasoningEffort, ModelProvider, ProviderStatus } from '@/types'
import { loadConfig as fetchConfig, saveConfig as persistConfig } from '@/services/configService'

export type Locale = 'zh-CN' | 'en-US'

export interface SettingsState {
  configLoaded: boolean
  loading: boolean
  error: string | null
  // Appearance
  theme: 'dark' | 'light' | 'system'
  fontSize: number
  fontFamily: string
  // Model
  activeModel: ModelId
  activeProvider: string
  // Sandbox & Permissions
  sandboxMode: SandboxMode
  permissionMode: PermissionMode
  reasoningEffort: ReasoningEffort
  // Providers
  providers: Record<string, ModelProvider>
  providerStatuses: Record<string, ProviderStatus>
  // API
  apiBaseUrl: string
  availableModels: string[]
  // Locale
  locale: Locale
  // Actions
  loadConfig: () => Promise<void>
  saveConfig: () => Promise<void>
  setTheme: (t: 'dark' | 'light' | 'system') => void
  setFontSize: (s: number) => void
  setFontFamily: (f: string) => void
  setActiveModel: (model: ModelId) => void
  setActiveProvider: (provider: string) => void
  setSandboxMode: (m: SandboxMode) => void
  setPermissionMode: (m: PermissionMode) => void
  setReasoningEffort: (r: ReasoningEffort) => void
  setApiBaseUrl: (url: string) => void
  addProvider: (name: string, provider: ModelProvider) => void
  updateProvider: (name: string, provider: Partial<ModelProvider>) => void
  removeProvider: (name: string) => void
  setProviderStatus: (name: string, status: ProviderStatus) => void
  setAvailableModels: (models: string[]) => void
  setLocale: (locale: Locale) => void
}

const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      configLoaded: false, loading: false, error: null,
      theme: 'dark', fontSize: 14, fontFamily: 'Inter',
      activeModel: 'gpt-5.5' as ModelId, activeProvider: 'custom',
      sandboxMode: 'workspace-only' as SandboxMode,
      permissionMode: 'on-request' as PermissionMode,
      reasoningEffort: 'medium' as ReasoningEffort,
      providers: {}, providerStatuses: {},
      apiBaseUrl: 'http://127.0.0.1:57321/v1',
      availableModels: [], locale: 'zh-CN',

      loadConfig: async () => {
        set({ loading: true, error: null })
        try {
          const config = await fetchConfig()
          set({ configLoaded: true, loading: false,
            activeModel: (config.model as ModelId) ?? 'gpt-5.5',
            activeProvider: config.model_provider ?? 'custom',
            providers: config.providers ?? {},
            availableModels: config.available_models ?? [],
          })
        } catch (err: any) {
          set({ loading: false, error: err?.message ?? 'Failed to load config' })
        }
      },

      saveConfig: async () => {
        const state = get()
        set({ loading: true, error: null })
        try {
          await persistConfig({ model: state.activeModel, model_provider: state.activeProvider, providers: state.providers })
          set({ loading: false })
        } catch (err: any) {
          set({ loading: false, error: err?.message ?? 'Failed to save config' })
        }
      },

      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setActiveModel: (activeModel) => set({ activeModel }),
      setActiveProvider: (activeProvider) => set({ activeProvider }),
      setSandboxMode: (sandboxMode) => set({ sandboxMode }),
      setPermissionMode: (permissionMode) => set({ permissionMode }),
      setReasoningEffort: (reasoningEffort) => set({ reasoningEffort }),
      setApiBaseUrl: (apiBaseUrl) => set({ apiBaseUrl }),

      addProvider: (name, provider) => set((s) => ({ providers: { ...s.providers, [name]: provider } })),
      updateProvider: (name, partial) => set((s) => {
        const existing = s.providers[name]
        if (!existing) return s
        return { providers: { ...s.providers, [name]: { ...existing, ...partial } } }
      }),
      removeProvider: (name) => set((s) => {
        const { [name]: _, ...rest } = s.providers
        return { providers: rest }
      }),
      setProviderStatus: (name, status) => set((s) => ({ providerStatuses: { ...s.providerStatuses, [name]: status } })),
      setAvailableModels: (availableModels) => set({ availableModels }),
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'ayanami-settings' },
  ),
)

export { useSettingsStore }
export default useSettingsStore
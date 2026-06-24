import { useState } from 'react'
import useSettingsStore from '@/stores/settingsStore'
import {
  MODEL_OPTIONS,
  SANDBOX_OPTIONS,
  PERMISSION_OPTIONS,
  REASONING_OPTIONS,
} from '@/types'

// --------------------------------------------------
// Section key type
// --------------------------------------------------
type SectionKey =
  | 'general'
  | 'appearance'
  | 'model'
  | 'agent'
  | 'shortcuts'
  | 'git'
  | 'cloud'
  | 'codeReview'
  | 'personalization'
  | 'api'
  | 'plugins'
  | 'mcp'
  | 'automations'
  | 'about'

interface Section {
  key: SectionKey
  label: string
}

const SECTIONS: Section[] = [
  { key: 'general', label: '通用' },
  { key: 'appearance', label: '外观' },
  { key: 'model', label: '模型' },
  { key: 'agent', label: 'Agent' },
  { key: 'shortcuts', label: '快捷键' },
  { key: 'git', label: 'Git' },
  { key: 'cloud', label: '云环境' },
  { key: 'codeReview', label: '代码审查' },
  { key: 'personalization', label: '个性化' },
  { key: 'api', label: 'API' },
  { key: 'plugins', label: '插件' },
  { key: 'mcp', label: 'MCP 服务器' },
  { key: 'automations', label: '自动化' },
  { key: 'about', label: '关于' },
]

// --------------------------------------------------
// Reusable helpers
// --------------------------------------------------
function SettingRow({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#2a2a2a]">
      <div className="flex-1 mr-4">
        <div className="text-sm font-medium text-[#e0e0e0]">{title}</div>
        {description && (
          <div className="text-xs text-[#888] mt-0.5">{description}</div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function PlaceholderSection({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-40 text-[#666] text-sm">
      {label}设置即将推出
    </div>
  )
}

// --------------------------------------------------
// Section panels
// --------------------------------------------------

function GeneralPanel() {
  const { locale, setLocale, theme, setTheme } = useSettingsStore()
  return (
    <div>
      <SettingRow title="语言" description="界面显示语言">
        <select
          className="bg-[#1a1a1a] border border-[#333] rounded px-3 py-1.5 text-sm text-[#e0e0e0] focus:outline-none focus:border-[#555]"
          value={locale}
          onChange={(e) => setLocale(e.target.value as 'zh-CN' | 'en-US')}
        >
          <option value="zh-CN">简体中文</option>
          <option value="en-US">English</option>
        </select>
      </SettingRow>
      <SettingRow title="主题" description="深色 / 浅色 / 跟随系统">
        <select
          className="bg-[#1a1a1a] border border-[#333] rounded px-3 py-1.5 text-sm text-[#e0e0e0] focus:outline-none focus:border-[#555]"
          value={theme}
          onChange={(e) => setTheme(e.target.value as 'dark' | 'light' | 'system')}
        >
          <option value="dark">深色</option>
          <option value="light">浅色</option>
          <option value="system">跟随系统</option>
        </select>
      </SettingRow>
    </div>
  )
}

function AppearancePanel() {
  const { fontSize, setFontSize, fontFamily, setFontFamily } = useSettingsStore()
  return (
    <div>
      <SettingRow title="字号" description="12-20，默认 14">
        <input
          type="range"
          min={12}
          max={20}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-32 accent-[#6c8cff]"
        />
        <span className="ml-2 text-sm text-[#e0e0e0] w-8 text-right">{fontSize}</span>
      </SettingRow>
      <SettingRow title="字体" description="编辑器与界面字体">
        <select
          className="bg-[#1a1a1a] border border-[#333] rounded px-3 py-1.5 text-sm text-[#e0e0e0] focus:outline-none focus:border-[#555]"
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
        >
          <option value="Inter">Inter</option>
          <option value="JetBrains Mono">JetBrains Mono</option>
          <option value="Fira Code">Fira Code</option>
          <option value="Cascadia Code">Cascadia Code</option>
          <option value="Source Code Pro">Source Code Pro</option>
        </select>
      </SettingRow>
    </div>
  )
}

function ModelPanel() {
  const { activeModel, setActiveModel, activeProvider, setActiveProvider } = useSettingsStore()
  return (
    <div>
      <SettingRow title="默认模型" description="对话使用的默认模型">
        <select
          className="bg-[#1a1a1a] border border-[#333] rounded px-3 py-1.5 text-sm text-[#e0e0e0] focus:outline-none focus:border-[#555]"
          value={activeModel}
          onChange={(e) => setActiveModel(e.target.value as typeof activeModel)}
        >
          {MODEL_OPTIONS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} — {m.description}
            </option>
          ))}
        </select>
      </SettingRow>
      <SettingRow title="Provider" description="模型提供方">
        <input
          type="text"
          className="bg-[#1a1a1a] border border-[#333] rounded px-3 py-1.5 text-sm text-[#e0e0e0] w-40 focus:outline-none focus:border-[#555]"
          value={activeProvider}
          onChange={(e) => setActiveProvider(e.target.value)}
        />
      </SettingRow>
    </div>
  )
}

function AgentPanel() {
  const {
    sandboxMode,
    setSandboxMode,
    permissionMode,
    setPermissionMode,
    reasoningEffort,
    setReasoningEffort,
  } = useSettingsStore()
  return (
    <div>
      <SettingRow title="沙箱模式" description="文件系统访问范围">
        <select
          className="bg-[#1a1a1a] border border-[#333] rounded px-3 py-1.5 text-sm text-[#e0e0e0] focus:outline-none focus:border-[#555]"
          value={sandboxMode}
          onChange={(e) => setSandboxMode(e.target.value as typeof sandboxMode)}
        >
          {SANDBOX_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </SettingRow>
      <SettingRow title="权限模式" description="命令执行前的询问策略">
        <select
          className="bg-[#1a1a1a] border border-[#333] rounded px-3 py-1.5 text-sm text-[#e0e0e0] focus:outline-none focus:border-[#555]"
          value={permissionMode}
          onChange={(e) => setPermissionMode(e.target.value as typeof permissionMode)}
        >
          {PERMISSION_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </SettingRow>
      <SettingRow title="推理深度" description="think 阶段的 token 投入量">
        <select
          className="bg-[#1a1a1a] border border-[#333] rounded px-3 py-1.5 text-sm text-[#e0e0e0] focus:outline-none focus:border-[#555]"
          value={reasoningEffort}
          onChange={(e) => setReasoningEffort(e.target.value as typeof reasoningEffort)}
        >
          {REASONING_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </SettingRow>
    </div>
  )
}

function ApiPanel() {
  const { apiBaseUrl, setApiBaseUrl } = useSettingsStore()
  return (
    <div>
      <SettingRow title="后端地址" description="Ayanami 后端 API 的基础 URL">
        <input
          type="text"
          className="bg-[#1a1a1a] border border-[#333] rounded px-3 py-1.5 text-sm text-[#e0e0e0] w-64 font-mono focus:outline-none focus:border-[#555]"
          value={apiBaseUrl}
          onChange={(e) => setApiBaseUrl(e.target.value)}
        />
      </SettingRow>
    </div>
  )
}

function AboutPanel() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-[#aaa] text-sm space-y-3">
      <div className="text-lg font-semibold text-[#e0e0e0]">Ayanami</div>
      <div className="text-xs text-[#666]">Version 0.1.0</div>
      <div className="text-xs text-[#555]">为 Zenos 打造 ♥</div>
    </div>
  )
}

// --------------------------------------------------
// Section content lookup
// --------------------------------------------------
const PANEL_MAP: Record<SectionKey, () => JSX.Element> = {
  general: GeneralPanel,
  appearance: AppearancePanel,
  model: ModelPanel,
  agent: AgentPanel,
  shortcuts: () => <PlaceholderSection label="快捷键" />,
  git: () => <PlaceholderSection label="Git" />,
  cloud: () => <PlaceholderSection label="云环境" />,
  codeReview: () => <PlaceholderSection label="代码审查" />,
  personalization: () => <PlaceholderSection label="个性化" />,
  api: ApiPanel,
  plugins: () => <PlaceholderSection label="插件" />,
  mcp: () => <PlaceholderSection label="MCP 服务器" />,
  automations: () => <PlaceholderSection label="自动化" />,
  about: AboutPanel,
}

// --------------------------------------------------
// Main Settings component
// --------------------------------------------------
export default function Settings() {
  const [activeSection, setActiveSection] = useState<SectionKey>('general')
  const Panel = PANEL_MAP[activeSection]

  return (
    <div className="flex h-full bg-[#0d0d0d] text-[#e0e0e0] select-none">
      {/* --- Sidebar --- */}
      <nav className="w-[200px] shrink-0 border-r border-[#1f1f1f] flex flex-col py-2">
        {SECTIONS.map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key)}
            className={
              'w-full text-left px-4 py-2 text-sm transition-colors ' +
              (activeSection === section.key
                ? 'bg-[#1a1a1a] text-[#fff] border-l-2 border-[#6c8cff]'
                : 'text-[#888] hover:text-[#ccc] hover:bg-[#111] border-l-2 border-transparent')
            }
          >
            {section.label}
          </button>
        ))}
      </nav>

      {/* --- Main content --- */}
      <main className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-[500px]">
          <h2 className="text-base font-semibold mb-4">
            {SECTIONS.find((s) => s.key === activeSection)?.label}
          </h2>
          <Panel />
        </div>
      </main>
    </div>
  )
}

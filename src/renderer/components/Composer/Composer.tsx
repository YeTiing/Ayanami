// ============================================================
// Ayanami – Composer – 底部输入区
// ============================================================
import { useState, useRef, useEffect, useCallback } from 'react'
import type { ModelId, SandboxMode, PermissionMode, ReasoningEffort } from '@/types'
import { MODEL_OPTIONS } from '@/types'

// ── 下拉选项配置 ────────────────────────────────────────────

const SANDBOX_OPTIONS: { id: SandboxMode; label: string }[] = [
  { id: 'danger-full-access', label: '🔓 完全访问' },
  { id: 'workspace-only',     label: '📁 仅工作区' },
  { id: 'strict',             label: '🔒 严格' },
]

const PERMISSION_OPTIONS: { id: PermissionMode; label: string }[] = [
  { id: 'never',       label: '❌ 从不' },
  { id: 'on-request',  label: '🤔 按需' },
  { id: 'on-failure',  label: '⚠️ 失败时' },
  { id: 'always',      label: '✅ 总是' },
]

const REASONING_OPTIONS: { id: ReasoningEffort; label: string }[] = [
  { id: 'off',     label: '🚫 关闭' },
  { id: 'low',     label: '🔹 低' },
  { id: 'medium',  label: '🔸 中' },
  { id: 'high',    label: '🔺 高' },
]

// ═══════════════════════════════════════════════════════════════
// 下拉组件
// ═══════════════════════════════════════════════════════════════

interface DropdownProps<T extends string> {
  value: T
  options: { id: T; label: string }[]
  onChange: (v: T) => void
  className?: string
}

function Dropdown<T extends string>({ value, options, onChange, className }: DropdownProps<T>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = options.find((o) => o.id === value)

  return (
    <div ref={ref} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        className="flex items-center gap-1 px-2 py-1 text-[11px] text-text-secondary hover:text-text-primary hover:bg-surface-light rounded transition-colors"
        onClick={() => setOpen(!open)}
      >
        {selected?.label ?? value}
        <span className="text-[8px] opacity-50">▼</span>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 bg-surface border border-border rounded-lg shadow-xl py-1 min-w-[140px] z-50">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors ${
                o.id === value
                  ? 'text-accent-light bg-accent/10'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-light'
              }`}
              onClick={() => { onChange(o.id); setOpen(false) }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════

export const Composer: React.FC = () => {
  const [text, setText] = useState('')
  const [model, setModel] = useState<ModelId>('gpt-5.5')
  const [sandbox, setSandbox] = useState<SandboxMode>('danger-full-access')
  const [permission, setPermission] = useState<PermissionMode>('on-request')
  const [reasoning, setReasoning] = useState<ReasoningEffort>('off')
  const [sending, setSending] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // context window 进度（暂时固定值，后续接后端）
  const contextUsed = 12400
  const contextTotal = 128000
  const contextPct = Math.min((contextUsed / contextTotal) * 100, 100)

  // ── 自适应高度 ──────────────────────────────────────────
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 10 * 24)}px`
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [text, adjustHeight])

  // ── 发送 ────────────────────────────────────────────────
  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    setSending(true)

    console.log('[Composer] 发送消息:', {
      content: trimmed,
      model,
      sandbox,
      permission,
      reasoning,
    })

    // 模拟异步发送
    setTimeout(() => {
      setText('')
      setSending(false)
    }, 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter 发送，Shift+Enter 换行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleStop = () => {
    console.log('[Composer] 停止生成')
    setSending(false)
  }

  return (
    <div className="flex-shrink-0 border-t border-border bg-surface-dark">
      {/* ── 工具栏 ────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/50">
        {/* 附件 */}
        <button
          type="button"
          className="px-2 py-1 text-[11px] text-text-muted hover:text-text-secondary hover:bg-surface-light rounded transition-colors"
          onClick={() => console.log('[Composer] 附件')}
        >
          📎 附件
        </button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Model 下拉 */}
        <Dropdown value={model} options={MODEL_OPTIONS} onChange={setModel} />

        <div className="w-px h-4 bg-border mx-1" />

        {/* Sandbox 下拉 */}
        <Dropdown value={sandbox} options={SANDBOX_OPTIONS} onChange={setSandbox} />

        {/* Permission 下拉 */}
        <Dropdown value={permission} options={PERMISSION_OPTIONS} onChange={setPermission} />

        {/* Reasoning 下拉 */}
        <Dropdown value={reasoning} options={REASONING_OPTIONS} onChange={setReasoning} />

        {/* 弹性占位 */}
        <div className="flex-1" />

        {/* 当前选中模型提示 */}
        <span className="text-[10px] text-text-muted">
          🏷 {MODEL_OPTIONS.find((m) => m.id === model)?.label ?? model}
        </span>
      </div>

      {/* ── 输入区 ────────────────────────────────────────── */}
      <div className="px-3 pt-2 pb-1">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
          rows={2}
          className="w-full bg-transparent text-sm text-text-primary placeholder-text-muted
            resize-none outline-none leading-6
            scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
          style={{ minHeight: '3rem', maxHeight: '15rem' }}
        />
      </div>

      {/* ── 底部状态栏 ────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-3 pb-2">
        {/* Context 进度条 */}
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${contextPct}%` }}
            />
          </div>
          <span className="text-[10px] text-text-muted whitespace-nowrap tabular-nums">
            {Math.round(contextUsed / 1000)}k / {Math.round(contextTotal / 1000)}k
          </span>
        </div>

        {/* 按钮 */}
        {sending ? (
          <button
            type="button"
            onClick={handleStop}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg
              bg-red-600/20 text-red-400 border border-red-600/30
              hover:bg-red-600/30 transition-colors"
          >
            ⏹ Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim()}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg
              bg-accent text-white
              hover:bg-accent/90
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors"
          >
            ▶ Send
          </button>
        )}
      </div>
    </div>
  )
}

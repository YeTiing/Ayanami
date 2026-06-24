// ============================================================
// Ayanami – MessageList – 消息列表渲染
// ============================================================
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { Message, DiffHunk, PlanStep } from '@/types'

// ═══════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════

interface Props {
  messages: Message[]
}

// ═══════════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════════

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // 静默失败
  }
}

const fmtTime = (ts: number) => {
  const d = new Date(ts)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// ═══════════════════════════════════════════════════════════════
// 子组件：消息操作栏
// ═══════════════════════════════════════════════════════════════

const MessageActions: React.FC<{ content: string }> = ({ content }) => {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        className="px-1.5 py-0.5 text-[11px] text-text-muted hover:text-text-secondary hover:bg-surface-light rounded transition-colors"
        title="复制"
        onClick={() => {
          copyToClipboard(content)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
      >
        {copied ? '✅' : '📋'}
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 子组件：用户消息气泡
// ═══════════════════════════════════════════════════════════════

const UserBubble: React.FC<{ content: string; timestamp: number }> = ({ content, timestamp }) => (
  <div className="flex justify-end">
    <div className="group max-w-[75%]">
      <div className="rounded-2xl rounded-br-md px-4 py-2.5 bg-accent text-white text-sm leading-relaxed whitespace-pre-wrap break-words">
        {content}
      </div>
      <div className="flex items-center justify-end gap-2 mt-0.5">
        <span className="text-[10px] text-text-muted">{fmtTime(timestamp)}</span>
        <MessageActions content={content} />
      </div>
    </div>
  </div>
)

// ═══════════════════════════════════════════════════════════════
// 子组件：Markdown 文本
// ═══════════════════════════════════════════════════════════════

const MarkdownBlock: React.FC<{ content: string; timestamp: number; partial?: boolean }> = ({
  content,
  timestamp,
  partial,
}) => (
  <div className="group">
    <div
      className="prose prose-invert prose-sm max-w-none text-text-primary leading-relaxed
      prose-pre:bg-surface-dark prose-pre:border prose-pre:border-border
      prose-code:text-accent-light prose-code:bg-surface-light prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.8125rem]
      prose-code:before:content-none prose-code:after:content-none
      prose-a:text-accent-light prose-a:no-underline hover:prose-a:underline
      prose-table:border prose-table:border-border prose-th:border prose-th:border-border prose-td:border prose-td:border-border
      prose-th:bg-surface-dark prose-th:px-3 prose-th:py-1.5 prose-th:text-xs prose-td:px-3 prose-td:py-1.5 prose-td:text-xs
    "
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
      {partial && (
        <span className="inline-block w-1.5 h-4 ml-0.5 bg-gray-500 rounded-sm animate-pulse align-text-bottom" />
      )}
    </div>
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-text-muted">{fmtTime(timestamp)}</span>
      <MessageActions content={content} />
    </div>
  </div>
)

// ═══════════════════════════════════════════════════════════════
// 子组件：代码块
// ═══════════════════════════════════════════════════════════════

const CodeBlock: React.FC<{ content: string; language?: string; fileName?: string; timestamp: number }> = ({
  content, language, fileName, timestamp,
}) => {
  const [copied, setCopied] = useState(false)
  return (
    <div className="group">
      <div className="rounded-lg overflow-hidden border border-border">
        <div className="flex items-center justify-between px-4 py-1.5 bg-surface-dark border-b border-border">
          <div className="flex items-center gap-2">
            {fileName && (
              <span className="text-xs text-text-secondary font-mono">📄 {fileName}</span>
            )}
            {language && (
              <span className="text-[10px] uppercase text-text-muted bg-surface-light px-1.5 py-0.5 rounded">
                {language}
              </span>
            )}
          </div>
          <button
            className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
            onClick={() => { copyToClipboard(content); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
          >
            {copied ? '✅ 已复制' : '📋 复制'}
          </button>
        </div>
        <SyntaxHighlighter
          language={language || 'text'}
          style={oneDark}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            padding: '0.75rem 1rem',
            fontSize: '0.8125rem',
            background: '#12121f',
          }}
          showLineNumbers={content.split('\n').length > 3}
        >
          {content}
        </SyntaxHighlighter>
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[10px] text-text-muted">{fmtTime(timestamp)}</span>
        <MessageActions content={content} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 子组件：Diff 展示
// ═══════════════════════════════════════════════════════════════

const DiffBlock: React.FC<{ hunks: DiffHunk[]; fileName?: string; timestamp: number }> = ({
  hunks, fileName, timestamp,
}) => (
  <div className="group">
    <div className="rounded-lg border border-border overflow-hidden bg-surface-dark">
      {fileName && (
        <div className="px-4 py-1.5 border-b border-border text-xs text-text-secondary font-mono">
          📄 {fileName}
        </div>
      )}
      <div className="overflow-x-auto">
        <pre className="text-[0.8125rem] leading-relaxed font-mono p-0 m-0">
          {hunks.map((hunk, hi) => (
            <div key={hi}>
              <div className="px-4 py-1 text-[10px] text-text-muted bg-surface-dark/50 border-b border-border/50 font-mono">
                @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
              </div>
              {hunk.content.split('\n').map((line, li) => {
                const cls = line.startsWith('+')
                  ? 'bg-green-900/20 text-green-400'
                  : line.startsWith('-')
                    ? 'bg-red-900/20 text-red-400'
                    : 'text-text-secondary'
                return (
                  <div key={li} className={`px-4 py-0.5 font-mono ${cls}`}>
                    {line || ' '}
                  </div>
                )
              })}
            </div>
          ))}
        </pre>
      </div>
    </div>
    <div className="flex items-center gap-2 mt-0.5">
      <span className="text-[10px] text-text-muted">{fmtTime(timestamp)}</span>
      <MessageActions content={hunks.map((h) => h.content).join('\n')} />
    </div>
  </div>
)

// ═══════════════════════════════════════════════════════════════
// 子组件：Thinking 折叠区域
// ═══════════════════════════════════════════════════════════════

const ThinkingBlock: React.FC<{ content: string; timestamp: number }> = ({ content, timestamp }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="group">
      <button
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-light border border-border text-xs text-text-muted hover:text-text-secondary transition-colors w-full text-left"
        onClick={() => setOpen(!open)}
      >
        <span
          className="transform transition-transform text-[10px]"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          ▶
        </span>
        <span>🧠 思考中...</span>
      </button>
      {open && (
        <div className="mt-1 ml-4 pl-3 border-l-2 border-border text-xs text-text-secondary whitespace-pre-wrap leading-relaxed py-1">
          {content}
        </div>
      )}
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[10px] text-text-muted">{fmtTime(timestamp)}</span>
        <MessageActions content={content} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 子组件：Plan 步骤列表
// ═══════════════════════════════════════════════════════════════

const statusIcon: Record<PlanStep['status'], string> = {
  pending: '○',
  in_progress: '◉',
  completed: '✔',
}
const statusColor: Record<PlanStep['status'], string> = {
  pending: 'text-text-muted',
  in_progress: 'text-accent-light',
  completed: 'text-green-400 line-through',
}

const PlanBlock: React.FC<{ steps: PlanStep[]; timestamp: number }> = ({ steps, timestamp }) => {
  const text = steps.map((s) => `${statusIcon[s.status]} ${s.text}`).join('\n')
  return (
    <div className="group">
      <div className="rounded-lg border border-border bg-surface-light px-4 py-3">
        <div className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wide">
          📋 执行计划
        </div>
        <ul className="space-y-1.5">
          {steps.map((step) => (
            <li key={step.id} className="flex items-start gap-2 text-xs">
              <span
                className={`mt-px ${step.status === 'in_progress' ? 'animate-pulse' : ''} ${statusColor[step.status]}`}
              >
                {statusIcon[step.status]}
              </span>
              <span className={statusColor[step.status]}>{step.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[10px] text-text-muted">{fmtTime(timestamp)}</span>
        <MessageActions content={text} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 子组件：Tool Call 终端展示
// ═══════════════════════════════════════════════════════════════

const ToolCallBlock: React.FC<{
  tool: string; args: string; result?: string; status: 'running' | 'done' | 'error'; timestamp: number
}> = ({ tool, args, result, status, timestamp }) => {
  const statusBadge = {
    running: '⏳ 执行中',
    done: '✅ 完成',
    error: '❌ 错误',
  }
  return (
    <div className="group">
      <div className="rounded-lg border border-border bg-surface-dark overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border bg-surface-dark">
          <span className="font-mono text-xs text-accent-light font-semibold">$ {tool}</span>
          <span className="text-[10px] text-text-muted">{statusBadge[status]}</span>
        </div>
        <pre className="px-4 py-2 text-[0.8125rem] font-mono text-text-secondary whitespace-pre-wrap break-all leading-relaxed max-h-48 overflow-y-auto">
          {args}
        </pre>
        {result && (
          <>
            <div className="px-4 py-1 border-y border-border text-[10px] text-text-muted bg-surface-dark">
              输出:
            </div>
            <pre className="px-4 py-2 text-[0.8125rem] font-mono text-text-muted whitespace-pre-wrap break-all leading-relaxed max-h-48 overflow-y-auto">
              {result}
            </pre>
          </>
        )}
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[10px] text-text-muted">{fmtTime(timestamp)}</span>
        <MessageActions content={`${tool}\n${args}`} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 子组件：Artifact 预览卡片
// ═══════════════════════════════════════════════════════════════

const ArtifactBlock: React.FC<{
  title: string; language?: string; preview?: string; content: string; timestamp: number
}> = ({ title, language, preview, content, timestamp }) => {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="group">
      <div className="rounded-lg border border-border bg-surface-light overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">📦 {title}</span>
            {language && (
              <span className="text-[10px] uppercase text-text-muted bg-surface px-1.5 py-0.5 rounded">
                {language}
              </span>
            )}
          </div>
          <button
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '收起' : '展开'}
          </button>
        </div>
        {preview && !expanded && (
          <div className="px-4 py-3 text-xs text-text-secondary font-mono whitespace-pre-wrap break-all line-clamp-3">
            {preview}
          </div>
        )}
        {expanded && (
          <SyntaxHighlighter
            language={language || 'text'}
            style={oneDark}
            customStyle={{
              margin: 0,
              borderRadius: 0,
              padding: '0.75rem 1rem',
              fontSize: '0.8125rem',
              background: '#12121f',
            }}
          >
            {content}
          </SyntaxHighlighter>
        )}
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[10px] text-text-muted">{fmtTime(timestamp)}</span>
        <MessageActions content={content} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 子组件：Error 错误消息
// ═══════════════════════════════════════════════════════════════

const ErrorBlock: React.FC<{ content: string; code?: string; timestamp: number }> = ({
  content,
  code,
  timestamp,
}) => (
  <div className="group">
    <div className="rounded-lg border border-red-900/40 bg-red-900/10 px-4 py-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-sm">⚠️</span>
        <span className="text-xs font-medium text-red-400">
          错误{code ? ` (${code})` : ''}
        </span>
      </div>
      <pre className="text-xs text-red-300/80 whitespace-pre-wrap leading-relaxed font-mono">
        {content}
      </pre>
    </div>
    <div className="flex items-center gap-2 mt-0.5">
      <span className="text-[10px] text-text-muted">{fmtTime(timestamp)}</span>
      <MessageActions content={content} />
    </div>
  </div>
)

// ═══════════════════════════════════════════════════════════════
// 主组件：按 kind 分发
// ═══════════════════════════════════════════════════════════════

export const MessageList: React.FC<Props> = ({ messages }) => (
  <>
    {messages.map((msg) => {
      switch (msg.kind) {
        case 'user':
          return <UserBubble key={msg.id} content={msg.content} timestamp={msg.timestamp} />

        case 'text':
          return (
            <MarkdownBlock
              key={msg.id}
              content={msg.content}
              timestamp={msg.timestamp}
              partial={msg.partial}
            />
          )

        case 'code':
          return (
            <CodeBlock
              key={msg.id}
              content={msg.content}
              language={msg.language}
              fileName={msg.fileName}
              timestamp={msg.timestamp}
            />
          )

        case 'diff':
          return (
            <DiffBlock
              key={msg.id}
              hunks={msg.hunks}
              fileName={msg.fileName}
              timestamp={msg.timestamp}
            />
          )

        case 'thinking':
          return <ThinkingBlock key={msg.id} content={msg.content} timestamp={msg.timestamp} />

        case 'plan':
          return <PlanBlock key={msg.id} steps={msg.steps} timestamp={msg.timestamp} />

        case 'tool_call':
          return (
            <ToolCallBlock
              key={msg.id}
              tool={msg.tool}
              args={msg.args}
              result={msg.result}
              status={msg.status}
              timestamp={msg.timestamp}
            />
          )

        case 'artifact':
          return (
            <ArtifactBlock
              key={msg.id}
              title={msg.title}
              language={msg.language}
              preview={msg.preview}
              content={msg.content}
              timestamp={msg.timestamp}
            />
          )

        case 'error':
          return (
            <ErrorBlock
              key={msg.id}
              content={msg.content}
              code={msg.code}
              timestamp={msg.timestamp}
            />
          )

        default:
          return null
      }
    })}
  </>
)

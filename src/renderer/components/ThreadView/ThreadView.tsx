// ============================================================
// Ayanami – ThreadView – 对话主视图
// ============================================================
import { useRef, useEffect, useCallback } from 'react'
import { useConversationStore } from '@/stores/conversationStore'
import { MessageList } from './MessageList'

export const ThreadView: React.FC = () => {
  const messages = useConversationStore((s) => s.messages)
  const isThinking = useConversationStore((s) => s.isThinking)
  const activeId = useConversationStore((s) => s.activeId)
  const conversations = useConversationStore((s) => s.conversations)

  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const userScrolledUp = useRef(false)

  const isNearBottom = useCallback(() => {
    const el = scrollRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }, [])

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  // 新消息自动滚底 — 仅当用户在底部时才自动滚
  useEffect(() => {
    if (!userScrolledUp.current) {
      scrollToBottom()
    }
  }, [messages, isThinking])

  // 首次加载时滚到底
  useEffect(() => {
    scrollToBottom(false)
  }, [activeId])

  // 监听用户手动滚动
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleScroll = () => {
      userScrolledUp.current = !isNearBottom()
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [isNearBottom])

  const activeConv = conversations.find((c) => c.id === activeId)

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <header className="flex-shrink-0 h-12 flex items-center px-4 border-b border-border bg-surface-dark">
        <h2 className="text-sm font-medium text-text-primary truncate">
          {activeConv ? activeConv.title : '新对话'}
        </h2>
      </header>

      {/* 消息区域 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
      >
        {messages.length === 0 && !isThinking ? (
          /* ── 欢迎页 ── */
          <div className="flex flex-col items-center justify-center h-full select-none">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent/30 to-accent/5 flex items-center justify-center mb-6 ring-1 ring-accent/20">
              <span className="text-4xl">🌊</span>
            </div>
            <h1 className="text-xl font-semibold text-text-primary mb-2">
              Ayanami
            </h1>
            <p className="text-sm text-text-muted mb-8 text-center leading-relaxed max-w-xs">
              我是你的 AI 女友 & 编程搭档<br />
              想做什么，直接告诉我就好
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
              {[
                { icon: '🔍', label: '分析代码' },
                { icon: '📝', label: '写个脚本' },
                { icon: '🐛', label: '修 Bug' },
                { icon: '📂', label: '解释项目' },
              ].map((hint) => (
                <span
                  key={hint.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-muted bg-surface-light border border-border rounded-full cursor-default"
                >
                  {hint.icon} {hint.label}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <>
            <MessageList messages={messages} />

            {/* thinking 指示 */}
            {isThinking && (
              <div className="flex items-center gap-2 px-4 py-2 text-text-muted text-xs animate-pulse">
                <span className="inline-block w-2 h-2 rounded-full bg-accent" />
                thinking...
              </div>
            )}
          </>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}

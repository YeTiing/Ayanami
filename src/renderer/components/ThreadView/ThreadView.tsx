// ============================================================
// Ayanami – ThreadView – 对话主视图
// ============================================================
import { useRef, useEffect } from 'react'
import { useConversationStore } from '@/stores/conversationStore'
import { MessageList } from './MessageList'

export const ThreadView: React.FC = () => {
  const messages = useConversationStore((s) => s.messages)
  const isThinking = useConversationStore((s) => s.isThinking)
  const activeId = useConversationStore((s) => s.activeId)
  const conversations = useConversationStore((s) => s.conversations)

  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // 新消息自动滚到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const activeConv = conversations.find((c) => c.id === activeId)

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* —— Header —— */}
      <header className="flex-shrink-0 h-12 flex items-center px-4 border-b border-border bg-surface-dark">
        <h2 className="text-sm font-medium text-text-primary truncate">
          {activeConv ? activeConv.title : '新对话'}
        </h2>
      </header>

      {/* —— 消息区域 —— */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
      >
        {messages.length === 0 && !isThinking ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-muted text-sm">
              发送消息开始新对话
            </p>
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

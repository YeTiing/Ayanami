import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import useConversationStore from '@/stores/conversationStore'
import type { Conversation } from '@/types'

// ---- Icons ----

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6" cy="6" r="4.5" />
      <path d="M9.5 9.5L13 13" strokeLinecap="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M7.5 1.5L9 0l3 3-1.5 1.5v3l2.5 2.5H5V7.5l-2 2v-2L0 4.5l1.5-1.5h3l1.5-1.5L7.5 0l1.5 1.5L7.5 3v3L9 7.5V4.5L7.5 3V1.5z" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <circle cx="7" cy="2" r="1.5" />
      <circle cx="7" cy="7" r="1.5" />
      <circle cx="7" cy="12" r="1.5" />
    </svg>
  )
}

// ---- Helpers ----

function formatTime(ts: number): string {
  const now = Date.now()
  const diff = now - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// ---- Context Menu ----

interface ContextMenuProps {
  x: number
  y: number
  conversation: Conversation
  onClose: () => void
}

function ContextMenu({ x, y, conversation, onClose }: ContextMenuProps) {
  const { pinConversation, archiveConversation, removeConversation, renameConversation } =
    useConversationStore()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const items = [
    {
      label: '重命名',
      action: () => {
        const title = prompt('新标题', conversation.title)
        if (title?.trim()) {
          renameConversation(conversation.id, title.trim())
        }
        onClose()
      },
    },
    {
      label: conversation.pinned ? '取消置顶' : '置顶',
      action: () => {
        pinConversation(conversation.id)
        onClose()
      },
    },
    {
      label: conversation.archived ? '取消归档' : '归档',
      action: () => {
        archiveConversation(conversation.id)
        onClose()
      },
    },
    {
      label: '删除',
      danger: true,
      action: () => {
        if (confirm(`确定删除「${conversation.title}」？`)) {
          removeConversation(conversation.id)
        }
        onClose()
      },
    },
  ]

  // Clamp position to avoid overflow
  const style: React.CSSProperties = {
    left: Math.min(x, window.innerWidth - 180),
    top: Math.min(y, window.innerHeight - 180),
  }

  return (
    <div
      ref={menuRef}
      style={style}
      className="fixed z-50 w-40 py-1 bg-surface border border-border rounded-lg shadow-2xl"
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={item.action}
          className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
            item.danger
              ? 'text-red-400 hover:bg-red-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-light'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

// ---- Conversation Item ----

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onSelect: () => void
}

function ConversationItem({ conversation, isActive, onSelect }: ConversationItemProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setMenuPos({ x: e.clientX, y: e.clientY })
    setMenuOpen(true)
  }, [])

  return (
    <>
      <div
        onClick={onSelect}
        onContextMenu={handleContextMenu}
        className={`group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors border-l-2 ${
          isActive
            ? 'bg-surface-light border-accent text-text-primary'
            : 'border-transparent text-text-secondary hover:bg-surface-light/50 hover:text-text-primary'
        }`}
      >
        {/* Title area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {conversation.pinned && (
              <span className="text-accent flex-shrink-0">
                <PinIcon />
              </span>
            )}
            <span className="text-sm truncate">{conversation.title}</span>
          </div>
          <div className="text-xs text-text-muted mt-0.5">
            {formatTime(conversation.updatedAt)}
            {conversation.archived && (
              <span className="ml-2 px-1 py-px bg-surface-dark rounded text-[10px]">
                已归档
              </span>
            )}
          </div>
        </div>

        {/* More button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            const rect = (e.target as HTMLElement).getBoundingClientRect()
            setMenuPos({ x: rect.left, y: rect.bottom + 4 })
            setMenuOpen(true)
          }}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-surface-dark text-text-muted hover:text-text-primary transition-all flex-shrink-0"
          title="更多"
        >
          <MoreIcon />
        </button>
      </div>

      {menuOpen && (
        <ContextMenu
          x={menuPos.x}
          y={menuPos.y}
          conversation={conversation}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </>
  )
}

// ---- Sidebar ----

export default function Sidebar() {
  const { conversations, activeConversationId, addConversation, setActive } =
    useConversationStore()
  const [search, setSearch] = useState('')

  // Sort: pinned first, then by updatedAt desc
  const sorted = useMemo(() => {
    const filtered = search.trim()
      ? conversations.filter((c) =>
          c.title.toLowerCase().includes(search.toLowerCase()),
        )
      : conversations

    return [...filtered].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.updatedAt - a.updatedAt
    })
  }, [conversations, search])

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header: search + new */}
      <div className="p-3 space-y-2 border-b border-border">
        {/* New conversation button */}
        <button
          onClick={addConversation}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-accent hover:bg-accent-dark text-white text-sm font-medium transition-colors"
        >
          <PlusIcon />
          新建对话
        </button>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索对话..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface-dark border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-text-muted">
            {search.trim() ? '没有匹配的对话' : '暂无对话'}
          </div>
        ) : (
          sorted.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConversationId}
              onSelect={() => setActive(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

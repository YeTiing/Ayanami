import { create } from 'zustand'
import type { Conversation, Message } from '@/types'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function createDefaultConversation(): Conversation {
  const now = Date.now()
  return {
    id: generateId(),
    title: '新对话',
    messages: [],
    createdAt: now,
    updatedAt: now,
    pinned: false,
    archived: false,
  }
}

interface ConversationState {
  conversations: Conversation[]
  activeConversationId: string | null
  activeId: string | null
  messages: Message[]
  isThinking: boolean

  addConversation: () => string
  removeConversation: (id: string) => void
  setActive: (id: string) => void
  pinConversation: (id: string) => void
  archiveConversation: (id: string) => void
  renameConversation: (id: string, title: string) => void
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  appendToLastMessage: (delta: string) => void
  setThinking: (thinking: boolean) => void
}

const useConversationStore = create<ConversationState>((set, get) => {
  const defaultConv = createDefaultConversation()

  const deriveFromActive = (state: ConversationState) => {
    const active = state.conversations.find((c) => c.id === state.activeConversationId)
    return {
      messages: active?.messages ?? [],
      activeId: state.activeConversationId,
    }
  }

  return {
    conversations: [defaultConv],
    activeConversationId: defaultConv.id,
    activeId: defaultConv.id,
    messages: [],
    isThinking: false,

    addConversation: () => {
      const conv = createDefaultConversation()
      const state = get()
      set({
        conversations: [conv, ...state.conversations],
        activeConversationId: conv.id,
      })
      set((s) => deriveFromActive(s))
      return conv.id
    },

    removeConversation: (id: string) => {
      set((state) => {
        const filtered = state.conversations.filter((c) => c.id !== id)
        const nextActive =
          state.activeConversationId === id
            ? filtered[0]?.id ?? null
            : state.activeConversationId
        return { conversations: filtered, activeConversationId: nextActive }
      })
      set((s) => deriveFromActive(s))
    },

    setActive: (id: string) => {
      set({ activeConversationId: id })
      set((s) => deriveFromActive(s))
    },

    pinConversation: (id: string) => {
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, pinned: !c.pinned } : c,
        ),
      }))
    },

    archiveConversation: (id: string) => {
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, archived: !c.archived } : c,
        ),
      }))
    },

    renameConversation: (id: string, title: string) => {
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, title, updatedAt: Date.now() } : c,
        ),
      }))
    },

    addMessage: (message: Message) => {
      set((state) => {
        const updated = state.conversations.map((c) =>
          c.id === state.activeConversationId
            ? { ...c, messages: [...c.messages, message], updatedAt: Date.now() }
            : c,
        )
        const derived = {
          conversations: updated,
        }
        // also update derived messages/activeId
        const active = updated.find((c) => c.id === state.activeConversationId)
        return {
          ...derived,
          messages: active?.messages ?? [],
          activeId: state.activeConversationId,
        } as Partial<ConversationState>
      })
    },

    updateMessage: (id: string, updates: Partial<Message>) => {
      set((state) => {
        const updated = state.conversations.map((c) => {
          if (c.id !== state.activeConversationId) return c
          return {
            ...c,
            messages: c.messages.map((m) => (m.id === id ? { ...m, ...updates } as Message : m)),
            updatedAt: Date.now(),
          }
        })
        const active = updated.find((c) => c.id === state.activeConversationId)
        return {
          conversations: updated,
          messages: active?.messages ?? [],
          activeId: state.activeConversationId,
        }
      }) as unknown as Partial<ConversationState>
    },

    setThinking: (thinking: boolean) => {
      set({ isThinking: thinking })
    },

    appendToLastMessage: (delta: string) => {
      set((state) => {
        const updated = state.conversations.map((c) => {
          if (c.id !== state.activeConversationId) return c
          const msgs = [...c.messages]
          const last = msgs[msgs.length - 1]
          if (!last) return c
          const appended = { ...last, content: (last as { content: string }).content + delta } as Message
          msgs[msgs.length - 1] = appended
          return { ...c, messages: msgs, updatedAt: Date.now() }
        })
        const active = updated.find((c) => c.id === state.activeConversationId)
        return {
          conversations: updated,
          messages: active?.messages ?? [],
          activeId: state.activeConversationId,
        }
      })
    },
  }
})

export { useConversationStore }
export default useConversationStore
// ============================================================
// Ayanami - useSSEStream hook
// ============================================================

import { useState, useRef, useCallback } from 'react'
import { sendMessage } from '@/services/api'
import { useConversationStore } from '@/stores/conversationStore'
import type { Message, UserMessage, TextMessage, ThinkingMessage, PlanMessage, ToolCallMessage, ModelId, SandboxMode, PermissionMode, ReasoningEffort } from '@/types'

export type StreamState = 'idle' | 'connecting' | 'streaming' | 'done' | 'error'

export interface SSEStreamConfig {
  model: ModelId
  sandbox: SandboxMode
  permission: PermissionMode
  reasoning: ReasoningEffort
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

/** Convert store messages to the shape expected by the API. */
function messagesToApi(
  msgs: Message[],
): { role: string; content: string }[] {
  return msgs
    .filter((m) => m.kind === 'user' || m.kind === 'text')
    .map((m) => ({
      role: m.kind === 'user' ? 'user' : 'assistant',
      content: (m as UserMessage | TextMessage).content,
    }))
}

export interface UseSSEStreamReturn {
  state: StreamState
  /** Send user content and begin streaming. */
  send: (content: string, config: SSEStreamConfig) => void
  /** Abort the current stream. */
  stop: () => void
}

export function useSSEStream(): UseSSEStreamReturn {
  const [state, setState] = useState<StreamState>('idle')
  const controllerRef = useRef<AbortController | null>(null)
  const store = useConversationStore()

  // Accumulation refs — persist a single message per stream phase
  const textMsgIdRef = useRef<string | null>(null)
  const textContentRef = useRef<string>('')
  const thinkingMsgIdRef = useRef<string | null>(null)
  const thinkingContentRef = useRef<string>('')
  const planMsgIdRef = useRef<string | null>(null)
  const planStepsRef = useRef<Map<string, { text: string; status: string }>>(new Map())

  /** Reset all accumulation state for a fresh stream. */
  const resetAccumulation = () => {
    textMsgIdRef.current = null
    textContentRef.current = ''
    thinkingMsgIdRef.current = null
    thinkingContentRef.current = ''
    planMsgIdRef.current = null
    planStepsRef.current = new Map()
  }

  const send = useCallback(
    (content: string, config: SSEStreamConfig) => {
      const userMsg: UserMessage = {
        id: generateId(),
        kind: 'user',
        content,
        timestamp: Date.now(),
      }
      store.addMessage(userMsg)

      resetAccumulation()
      setState('connecting')
      store.setThinking(true)

      // Use getState() for the latest snapshot (after addMessage above)
      const apiMessages = messagesToApi(
        useConversationStore.getState().messages,
      )

      const controller = sendMessage({
        messages: apiMessages,
        model: config.model,
        sandboxMode: config.sandbox,
        permissionMode: config.permission,
        reasoningEffort: config.reasoning,
        callbacks: {
          onTextDelta: (delta: string) => {
            setState('streaming')
            textContentRef.current += delta

            if (textMsgIdRef.current) {
              store.updateMessage(textMsgIdRef.current, {
                content: textContentRef.current,
              } as Partial<TextMessage>)
            } else {
              const msg: TextMessage = {
                id: generateId(),
                kind: 'text',
                content: delta,
                timestamp: Date.now(),
              }
              textMsgIdRef.current = msg.id
              store.addMessage(msg)
            }
          },

          onThinkingDelta: (delta: string) => {
            setState('streaming')
            thinkingContentRef.current += delta

            if (thinkingMsgIdRef.current) {
              store.updateMessage(thinkingMsgIdRef.current, {
                content: thinkingContentRef.current,
              } as Partial<ThinkingMessage>)
            } else {
              const msg: ThinkingMessage = {
                id: generateId(),
                kind: 'thinking',
                content: delta,
                timestamp: Date.now(),
                collapsed: false,
              }
              thinkingMsgIdRef.current = msg.id
              store.addMessage(msg)
            }
          },

          onToolCall: (data) => {
            setState('streaming')
            const msg: ToolCallMessage = {
              id: generateId(),
              kind: 'tool_call',
              content: data.name,
              tool: data.name,
              args: JSON.stringify(data.arguments, null, 2),
              status: 'running',
              timestamp: Date.now(),
            }
            store.addMessage(msg)
          },

          onToolCallResult: (data) => {
            // Find the last running tool_call and mark it done/error
            const msgs = useConversationStore.getState().messages
            for (let i = msgs.length - 1; i >= 0; i--) {
              const m = msgs[i]
              if (m.kind === 'tool_call' && m.status === 'running') {
                store.updateMessage(m.id, {
                  status: data.error ? 'error' : 'done',
                  result: data.error ?? data.output ?? '',
                } as Partial<ToolCallMessage>)
                break
              }
            }
          },

          onPlanStep: (step) => {
            setState('streaming')
            const steps = planStepsRef.current
            steps.set(step.id, { text: step.text, status: step.status })

            const stepList = Array.from(steps.entries()).map(([id, s]) => ({
              id,
              text: s.text,
              description: '',
              status: s.status as 'pending' | 'in_progress' | 'completed',
            }))

            if (planMsgIdRef.current) {
              store.updateMessage(planMsgIdRef.current, {
                content: stepList.map((s) => `[${s.status}] ${s.text}`).join('\n'),
                steps: stepList,
              } as Partial<PlanMessage>)
            } else {
              const msg: PlanMessage = {
                id: generateId(),
                kind: 'plan',
                content: stepList.map((s) => `[${s.status}] ${s.text}`).join('\n'),
                steps: stepList,
                timestamp: Date.now(),
              }
              planMsgIdRef.current = msg.id
              store.addMessage(msg)
            }
          },

          onError: (message: string, _code: string) => {
            setState('error')
            store.setThinking(false)
            store.addMessage({
              id: generateId(),
              kind: 'error',
              content: message,
              timestamp: Date.now(),
            })
          },

          onDone: () => {
            setState('done')
            store.setThinking(false)
            resetAccumulation()
          },
        },
      })

      controllerRef.current = controller
    },
    [store],
  )

  const stop = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    setState('idle')
    store.setThinking(false)
    resetAccumulation()
  }, [store])

  return { state, send, stop }
}
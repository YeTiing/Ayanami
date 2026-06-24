// ============================================================
// Ayanami - API Service (SSE streaming over fetch)
// ============================================================

/** Callbacks fired during SSE stream processing. */
export interface SSECallbacks {
  onTextDelta: (delta: string) => void
  onThinkingDelta: (delta: string) => void
  onToolCall: (data: { name: string; arguments: Record<string, unknown>; call_id?: string }) => void
  onToolCallResult: (data: { call_id: string; output?: string; error?: string }) => void
  onPlanStep: (step: { id: string; text: string; status: string }) => void
  onError: (message: string, code: string) => void
  onDone: () => void
  onResponseCreated?: (model: string) => void
}

export interface SendMessageOptions {
  messages: { role: string; content: string }[]
  model: string
  sandboxMode?: string
  permissionMode?: string
  reasoningEffort?: string
  maxTokens?: number
  callbacks: SSECallbacks
}

const API_BASE = 'http://127.0.0.1:57321'

function processEvent(
  eventType: string,
  data: Record<string, unknown>,
  cbs: SSECallbacks,
): void {
  switch (eventType) {
    case 'response.created':
      cbs.onResponseCreated?.((data.model as string) ?? '')
      break

    case 'response.in_progress':
      break

    case 'output_text.delta':
      cbs.onTextDelta((data.delta as string) ?? '')
      break

    case 'output_text.done':
      break

    case 'thinking.delta':
      cbs.onThinkingDelta((data.delta as string) ?? '')
      break

    case 'thinking.done':
      break

    case 'function_call.delta': {
      try {
        const raw = data.delta
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        cbs.onToolCall({
          name: (parsed.name ?? parsed.function?.name ?? 'unknown') as string,
          arguments: (parsed.arguments ?? parsed.function?.arguments ?? {}) as Record<string, unknown>,
          call_id: (parsed.call_id ?? parsed.id ?? undefined) as string | undefined,
        })
      } catch {
        cbs.onToolCall({ name: 'unknown', arguments: {} })
      }
      break
    }

    case 'function_call.done': {
      try {
        const raw = data.delta ?? data
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        cbs.onToolCallResult({
          call_id: (parsed.call_id ?? parsed.id ?? '') as string,
          output: parsed.output ?? parsed.result ?? undefined,
          error: parsed.error ?? undefined,
        })
      } catch {
        // ignore malformed done event
      }
      break
    }

    case 'plan.created':
      cbs.onPlanStep({
        id: (data.id as string) ?? '',
        text: (data.title as string) ?? '',
        status: 'in_progress',
      })
      break

    case 'plan.step_updated':
      cbs.onPlanStep({
        id: (data.id ?? data.step_id ?? '') as string,
        text: (data.text ?? data.description ?? '') as string,
        status: (data.status as string) ?? 'pending',
      })
      break

    case 'plan.completed':
      break

    case 'error':
      cbs.onError(
        (data.message as string) ?? 'Unknown error',
        (data.code as string) ?? 'unknown',
      )
      break

    case 'response.completed':
      break

    case 'artifact.created':
    case 'artifact.updated':
    case 'message.added':
    case 'message.completed':
      // Forwarded but not handled in callbacks yet — silent ignore
      break

    default:
      // Unknown event type — silently skip
      break
  }
}

/**
 * Send a chat completion request to the Ayanami backend and stream SSE events.
 * Returns an AbortController that can be used to cancel the request.
 */
export function sendMessage(options: SendMessageOptions): AbortController {
  const controller = new AbortController()
  const {
    messages,
    model,
    sandboxMode = 'workspace-only',
    permissionMode = 'never',
    reasoningEffort = 'medium',
    maxTokens = 4096,
    callbacks,
  } = options

  const body = JSON.stringify({
    messages,
    model,
    sandbox_mode: sandboxMode,
    permission_mode: permissionMode,
    reasoning_effort: reasoningEffort,
    max_tokens: maxTokens,
    stream: true,
  })

  fetch(`${API_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const text = await response.text().catch(() => '')
        callbacks.onError(
          `HTTP ${response.status}: ${text.slice(0, 500)}`,
          'http_error',
        )
        callbacks.onDone()
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        callbacks.onError('No response body', 'no_body')
        callbacks.onDone()
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        let currentEvent = ''

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].replace(/\r$/, '')

          if (line === '') {
            currentEvent = ''
            continue
          }

          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7)
            continue
          }

          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6)
            if (dataStr === '[DONE]') {
              callbacks.onDone()
              return
            }
            try {
              const data = JSON.parse(dataStr) as Record<string, unknown>
              processEvent(currentEvent, data, callbacks)
            } catch {
              // skip malformed JSON lines
            }
            currentEvent = ''
          }
        }
      }

      callbacks.onDone()
    })
    .catch((err: Error) => {
      if (err.name === 'AbortError') {
        callbacks.onDone()
        return
      }
      callbacks.onError(err.message || 'Network error', 'network')
      callbacks.onDone()
    })

  return controller
}
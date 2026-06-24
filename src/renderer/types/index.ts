// ============================================================
// Ayanami - Shared Type Definitions
// ============================================================

// ---- Provider / Config Types ----

export interface ModelProvider {
  name: string
  wire_api: string
  base_url: string
  api_key?: string
  models?: string[]
}

export interface AppConfig {
  model: string
  model_provider: string
  providers: Record<string, ModelProvider>
  sandbox_mode: string
  permission_mode: string
  available_models?: string[]
}

export interface ProviderStatus {
  name: string
  reachable: boolean
  latency_ms: number | null
  error?: string
}

// ---- Model Options ----

export type ModelId = 'gpt-5.5' | 'gpt-5.4' | 'gpt-5.4-mini' | 'deepseek-v4-pro' | string

export interface ModelOption {
  id: ModelId
  label: string
  description: string
  provider: string
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'gpt-5.5', label: 'GPT 5.5', description: 'Frontier model', provider: 'openai' },
  { id: 'gpt-5.4', label: 'GPT 5.4', description: 'Strong everyday coding', provider: 'openai' },
  { id: 'gpt-5.4-mini', label: 'GPT 5.4 Mini', description: 'Fast & efficient', provider: 'openai' },
  { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro', description: 'Custom provider', provider: 'custom' },
]

// ---- Sandbox / Permissions ----

export type SandboxMode = 'workspace-only' | 'danger-full-access' | 'strict' | 'moderate' | 'full'

export const SANDBOX_OPTIONS: { value: SandboxMode; label: string }[] = [
  { value: 'workspace-only', label: '仅工作区' },
  { value: 'danger-full-access', label: '完全访问' },
  { value: 'strict', label: '严格' },
  { value: 'moderate', label: '中等' },
]

export type PermissionMode = 'never' | 'on-request' | 'on-failure' | 'always' | 'default' | 'autoReview' | 'fullAccess' | 'guardian'

export const PERMISSION_OPTIONS: { value: PermissionMode; label: string }[] = [
  { value: 'never', label: '从不询问' },
  { value: 'on-request', label: '按需询问' },
  { value: 'on-failure', label: '失败时询问' },
  { value: 'always', label: '总是询问' },
]

// ---- Reasoning Effort ----

export type ReasoningEffort = 'off' | 'low' | 'medium' | 'high' | 'xhigh'

export const REASONING_OPTIONS: { value: ReasoningEffort; label: string }[] = [
  { value: 'off', label: '关闭推理' },
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'xhigh', label: '极高' },
]

// ---- Right Panel Tabs ----

export type RightPanelTab = 'files' | 'context' | 'preview' | 'terminal' | 'output' | 'diff'

// ---- Diff Hunk ----

export interface DiffHunk {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  header: string
  content: string
}

// ---- Plan Step ----

export interface PlanStep {
  id: string
  text: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
}

// ---- Message (flat discriminated union) ----

export type MessageKind = 'user' | 'text' | 'code' | 'diff'
  | 'thinking' | 'plan' | 'tool_call' | 'artifact' | 'error'

export interface BaseMessage {
  id: string
  timestamp: number
}

export interface UserMessage extends BaseMessage {
  kind: 'user'
  content: string
}

export interface TextMessage extends BaseMessage {
  kind: 'text'
  content: string
  partial?: boolean
}

export interface CodeMessage extends BaseMessage {
  kind: 'code'
  content: string
  language: string
  fileName?: string
}

export interface DiffMessage extends BaseMessage {
  kind: 'diff'
  content: string
  hunks: DiffHunk[]
  fileName?: string
}

export interface ThinkingMessage extends BaseMessage {
  kind: 'thinking'
  content: string
  collapsed?: boolean
}

export interface PlanMessage extends BaseMessage {
  kind: 'plan'
  content: string
  steps: PlanStep[]
}

export interface ToolCallMessage extends BaseMessage {
  kind: 'tool_call'
  content: string
  tool: string
  args: string
  result?: string
  status: 'running' | 'done' | 'error'
}

export interface ArtifactMessage extends BaseMessage {
  kind: 'artifact'
  content: string
  title: string
  language: string
  preview?: string
}

export interface ErrorMessage extends BaseMessage {
  kind: 'error'
  content: string
  code?: string
}

export type Message =
  | UserMessage
  | TextMessage
  | CodeMessage
  | DiffMessage
  | ThinkingMessage
  | PlanMessage
  | ToolCallMessage
  | ArtifactMessage
  | ErrorMessage

// ---- Conversation ----

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  pinned: boolean
  archived: boolean
}

// ---- Model Config ----

export interface ModelConfig {
  name: string
  provider: string
  maxTokens: number
}
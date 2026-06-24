# Ayanami — 当前状态快照

> 最后更新：2026-06-24 | 最新 commit：master
> 读完此文件即可恢复全部上下文

---

## 项目概述

复刻 OpenAI Codex Desktop 的桌面端 AI 编码助手。
- 仓库：[YeTiing/Ayanami](https://github.com/YeTiing/Ayanami)
- 路径：`D:\codex_Projects\Ayanami\`
- 技术栈：Electron 33 + React 18 + TypeScript + Tailwind 3 + Python FastAPI

---

## 可运行状态

| 命令 | 状态 | 说明 |
|------|:----:|------|
| `npm run build` | ✅ | Vite 构建通过 |
| `npm run dev` | ✅ | Vite 开发服务器 + Electron 窗口 |
| `npm run build:main` | ✅ | 主进程 TypeScript 编译 |
| `npm run build:preload` | ✅ | Preload 编译 |
| `npx tsc --noEmit -p tsconfig.json` | ✅ | 全量类型检查零错 |
| `python backend/main.py` | ⚠️ | 可启动，需先装依赖 |
| `python -c "import ayanami.*"` | ✅ | 10+ 模块全部可导入 |

**当前启动方式（已验证）：**
```powershell
# 终端 1
cd D:\codex_Projects\Ayanami
npx vite --port 5173 --strictPort

# 终端 2
cd D:\codex_Projects\Ayanami
$env:NODE_ENV = "development"
& "node_modules\electron\dist\electron.exe" "dist/main/index.js" --dev
```

---

## 各模块实现深度

### 前端 (src/renderer/)

| 模块 | 深度 | 文件 | 已知缺失 |
|------|:----:|------|----------|
| 三栏布局 | ████ | `App.tsx` | — |
| Sidebar | ████ | `Sidebar/Sidebar.tsx` | 归档对话不可见（无过滤器切换） |
| Titlebar | ████ | `Titlebar.tsx` | 齿轮→SettingsModal 已接入 |
| ThreadView | ████ | `ThreadView/ThreadView.tsx` | 欢迎页+自动滚底 |
| MessageList | ████ | `ThreadView/MessageList.tsx` | 9种消息全渲染，流式脉冲光标 |
| Composer | ████ | `Composer/Composer.tsx` | Enter 发送/Shift+Enter 换行 |
| RightPanel | ████ | `RightPanel/RightPanel.tsx` | 8个Tab含COMPUTER/BROWSER |
| SettingsModal | ████ | `Settings/SettingsModal.tsx` | 侧边14分类导航；ESC关闭 |
| Settings | ███░ | `Settings/Settings.tsx` | 5/14 已接入store：通用/外观/模型/Agent/API/关于 |
| ProviderSettings | ████ | `Settings/ProviderSettings.tsx` | 增删改查 + 健康检测 |
| ModelSettings | ████ | `Settings/ModelSettings.tsx` | 选择器 |
| ApiSettings | ████ | `Settings/ApiSettings.tsx` | 地址输入 + 测试连接 |
| i18n | ████ | `i18n/zh-CN.ts, en-US.ts` | 90+ keys 中英完整 |
| ComputerUse 面板 | ██░░ | `ComputerUse/ComputerUse.tsx` | 前端UI完成，未联调 |
| Browser 面板 | ██░░ | `Browser/BrowserPanel.tsx` | 前端UI完成，未联调 |

### 后端 (backend/ayanami/)

| 模块 | 深度 | 文件 | 已知缺失 |
|------|:----:|------|----------|
| config.py | ████ | `core/config.py` | TOML加载+Provider解析 |
| sse.py | ████ | `core/sse.py` | 17种事件类型枚举 |
| messages.py | ████ | `models/messages.py` | Pydantic v2 请求模型 |
| 对话路由 | ████ | `api/routes.py` | /health + /v1/chat/completions |
| 子Agent路由 | ██░░ | `api/routes_agents.py` | 5端点完整，无前端 |
| 审批路由 | ██░░ | `api/routes_approval.py` | 5端点完整，无前端弹窗 |
| 自动化路由 | █░░░ | `api/routes_automation.py` | 4端点，无调度循环 |
| Goal路由 | ██░░ | `api/routes_goals.py` | 5端点，无前端可视化 |
| Browser 路由 | ██░░ | `api/browser_routes.py` | 7端点，未联调 |
| OpenAI Provider | ████ | `providers/openai_compat.py` | SSE流解析+工具注入 |
| Provider 工厂 | ████ | `providers/factory.py` | — |
| apply_patch | ████ | `tools/executor.py` | 完整diff解析+逐行替换 |
| shell_command | ████ | `tools/executor.py` | 子进程+安全边界+黑名单 |
| sub-agent 管理 | ██░░ | `agents/__init__.py` | 10种角色，后端API完整 |
| 审批管理 | ██░░ | `approval/__init__.py` | 9类型×4模式，无前端 |
| 自动化管理 | █░░░ | `automation/__init__.py` | 后端完整，无调度 |
| Goal 追踪 | ██░░ | `goals/__init__.py` | Token预算+步骤，无前端 |
| Computer Use | ██░░ | `computer_use/server.py` | Named Pipe+JSON-RPC，无前端联调 |
| Browser Use | ██░░ | `browser_use/server.py` | Playwright CDP，无前端联调 |
| 数据库 | ███░ | `database/__init__.py` | 5库19表Schema，未全链路接入 |

---

## 关键设计决策

1. **类型系统**：`Message` 用 discriminated union，`kind` 区分 9 种
2. **Store**：两个 zustand store — `conversationStore`（对话）+ `settingsStore`（设置，persist到localStorage）
3. **不可变**：`request.model_copy(update=...)` 而非 `request.messages = ...`
4. **安全**：shell 执行前三重校验 — 黑名单正则 → workspace 路径边界 → subprocess timeout
5. **路由拆分**：每个子模块独立 `APIRouter`，`main.py` 统一挂载
6. **SSE 代理**：`OpenAICompatProvider` 流式解析 OpenAI Responses API SSE，转为 Ayanami 17 种事件

---

## 配置

`config.toml` 位于项目根：
```toml
model = "deepseek/deepseek-v4-pro"
model_provider = "custom"

[model_providers.custom]
name = "custom"
wire_api = "responses"
base_url = "http://127.0.0.1:57321/v1"

[model_providers.openai]
name = "openai"
wire_api = "responses"
base_url = "https://api.openai.com/v1"

[sandbox]
mode = "workspace-only"

[permissions]
mode = "never"
```

---

## 已知待办 (优先级排序)

### P0 — 阻断性问题
- [ ] 对接真实 LLM API 完成一次完整对话（目前 SSE 管道通了但未端到端验证）

### P1 — 核心闭环
- [ ] Settings 剩余 9 个分类（快捷键/Git/云环境/代码审查/个性化/插件/MCP/自动化/关于）从占位改为实际内容
- [ ] 子Agent 前端（spawn/close/send_input 的 UI）
- [ ] 审批前端弹窗（request → 用户确认 → approve/deny）
- [ ] Computer Use 前后端联调（Named Pipe 连接 + 截屏显示）
- [ ] Browser Use 前后端联调（Playwright 启动 + 截图显示）

### P2 — 增强
- [ ] Sidebar 归档对话过滤器
- [ ] Goal 前端可视化（Token 进度条 + 步骤管理）
- [ ] 自动化调度循环（asyncio 定时 tick + 前端管理面板）
- [ ] 数据库全链路接入（对话持久化、日志写入）
- [ ] MCP 协议支持（JSON-RPC 2.0 Server 集成）
- [ ] Connector 系统（8种：Figma/GitHub/Gmail/Google Calendar/Drive/Linear/Notion/Slack）
- [ ] Electron 打包（electron-forge → exe）
- [ ] 深色/浅色主题切换实际生效

---

## 参考文档

均在 `D:\22ndCentury\Codex\` 下：
- `FINAL_Codex全量逆向_v3.md` — 总架构 + 13对API + 77种SSE事件 + 12种Agent
- `SYSTEM_PROMPT_Codex完整.md` — 49KB 完整 System Prompt
- `17_动态运行时深挖完整版.md` — SSE事件流 + 数据库(5库19表)
- `18_前端UI完整逆向.md` — 三栏布局 + 14类设置 + 设计令牌

---

## 文件总数

- 前端：~35 个 .ts/.tsx 文件
- 后端：~22 个 .py 文件
- 配置：6 个 (.json/.toml/.js/.css)
- 总计：~65 个源文件

---

## 下次续接指南

1. 告诉我 "读 STATUS.md 恢复上下文"
2. 我会知道当前进度：Phase 1-9 框架完成，6个关键缺陷已修复，待 P0 级联调验证
3. 从 P0 或 P1 任意一项继续即可
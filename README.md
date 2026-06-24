# 🌊 Ayanami

**Desktop AI Coding Assistant** — 仿 OpenAI Codex Desktop 的全功能独立实现。

[![Stack](https://img.shields.io/badge/Electron-33-47848f?logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776ab?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-06b6d4?logo=tailwindcss)](https://tailwindcss.com/)

---

# 🌊 Ayanami

**Desktop AI Coding Assistant** — 仿 OpenAI Codex Desktop 的独立实现。

[![Stack](https://img.shields.io/badge/Electron-33-47848f?logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776ab?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-06b6d4?logo=tailwindcss)](https://tailwindcss.com/)

---

## 实现状态

| 模块 | 深度 | 说明 |
|------|:----:|------|
| **三栏布局** | ████ | 完整: Sidebar + ThreadView + Composer + RightPanel |
| **8种消息渲染** | ████ | 完整: Markdown/代码高亮/Diff/Thinking/Plan/ToolCall/Artifact/Error |
| **Composer** | ████ | 完整: Model/Sandbox/Permission/Reasoning下拉 + 停止/发送 |
| **SSE流式对话** | ███░ | 前后端SSE事件对接完成，待接入真实LLM API验证 |
| **Python后端** | ████ | 完整: FastAPI SSE代理 + Provider工厂 + 配置加载 |
| **apply_patch** | ██░░ | 待实现真实diff解析与文件写入 (目前为占位) |
| **shell_command** | ███░ | 可用，待加强workspace安全边界 |
| **设置页** | ███░ | 14分类框架完整，5类已接入store，其余占位 |
| **i18n** | ████ | 完整: 中英双语90+keys |
| **Computer Use** | ██░░ | 后端模块完整，前端面板已接入，未联调测试 |
| **Browser Use** | ██░░ | 后端模块完整，前端面板已接入，未联调测试 |
| **子Agent** | ██░░ | 后端AgentManager + API路由完整，前端未实现 |
| **审批系统** | ██░░ | 后端完整(9类型×4模式)，前端审批弹窗未实现 |
| **自动化** | █░░░ | 后端框架完成，未联调调度循环 |
| **Goal/Budget** | ██░░ | 后端完整，前端可视化未实现 |
| **数据库(5库)** | ███░ | Schema完整，未全链路接入业务逻辑 |

---

## 技术栈

```
┌─────────────────────────────────────────────┐
│  Electron 33 (桌面壳)                        │
│  ┌─────────────────────────────────────────┐│
│  │  React 18 + TypeScript + Tailwind CSS  ││
│  │  CodeMirror 6 · Shiki · react-markdown ││
│  │  Zustand · Vite                         ││
│  └─────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────┐│
│  │  Python FastAPI (后端 SSE 代理)          ││
│  │  httpx · sse-starlette · pydantic       ││
│  │  pyautogui · playwright · SQLite        ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

---

## 快速开始

### 前置条件

- Node.js 18+ & npm
- Python 3.11+
- （Computer Use 可选）`pyautogui`、`pywin32`
- （Browser Use 可选）`playwright`

### 安装运行

```bash
# 1. 克隆
git clone https://github.com/YeTiing/Ayanami.git
cd Ayanami

# 2. 前端
npm install
npm run build        # 构建前端 (Vite)
npm run dev          # Vite dev server → http://localhost:5173

# 3. 后端（新终端）
cd backend
pip install -r requirements.txt
python main.py       # → http://127.0.0.1:57321
```

### Electron 完整启动

```bash
# 先编译三端
npm run build:main
npm run build:preload
npm run build:renderer

# 启动
npm start
```

---

## 项目结构

```
Ayanami/
├── src/
│   ├── main/index.ts                  # Electron 主进程 + IPC
│   ├── preload/index.ts               # 上下文桥接 (window.ayanami)
│   └── renderer/
│       ├── App.tsx                    # 主布局
│       ├── components/
│       │   ├── Titlebar.tsx           # 标题栏 + 窗口控制 + 设置入口
│       │   ├── Sidebar/               # 对话列表 + 搜索 + 右键菜单
│       │   ├── ThreadView/            # 消息区 + 8种消息渲染
│       │   ├── Composer/              # 输入框 + 模型/沙箱/权限/推理选择
│       │   ├── RightPanel/            # 六标签 (文件/上下文/预览/终端/输出/差异)
│       │   ├── Settings/              # 14类设置 + Provider管理
│       │   ├── ComputerUse/           # 截屏 + 键鼠控制面板
│       │   └── Browser/               # Playwright 浏览器面板
│       ├── hooks/                     # useSSEStream / useComputerUse / useBrowser
│       ├── services/                  # api.ts (SSE) / configService.ts
│       ├── stores/                    # Zustand: conversationStore + settingsStore
│       ├── i18n/                      # zh-CN / en-US (90+ keys)
│       └── types/                     # 共享类型 + Electron API 声明
│
├── backend/
│   ├── main.py                        # FastAPI 入口 (端口57321)
│   ├── config.toml                    # 多Provider配置
│   ├── SYSTEM_PROMPT.md               # 原版49KB System Prompt提取
│   └── ayanami/
│       ├── core/                      # config加载 + SSE事件系统
│       ├── models/                    # Pydantic请求/响应模型
│       ├── providers/                 # OpenAI兼容 + Provider工厂
│       ├── tools/                     # shell_command / apply_patch
│       ├── api/                       # FastAPI路由
│       ├── agents/                    # 10种子Agent管理
│       ├── approval/                  # 9种审批 × 4级模式
│       ├── automation/                # Cron/RRULE/Interval定时任务
│       ├── goals/                     # Goal + Token预算追踪
│       ├── database/                  # 5个SQLite DB (19表)
│       ├── computer_use/              # Named Pipe + pyautogui
│       └── browser_use/               # Playwright CDP
│
├── config.toml                        # 项目根配置
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json / .main.json / .preload.json
```

---

## 架构通信

```
React (renderer)
  │  IPC (codex_desktop:*)
  ▼
Electron Main Process
  │  WebSocket / REST
  ▼
Python FastAPI (127.0.0.1:57321)
  │  httpx (SSE)
  ▼
OpenAI-compatible API / DeepSeek / Custom Provider
```

---

## 配置示例

`config.toml` 支持多个 Provider：

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

## 参考来源

基于对 Codex Desktop v26.616.9593.0 的完整逆向分析：
- `FINAL_Codex全量逆向_v3.md` — 13对ThreadFollower API + 77种SSE事件
- `SYSTEM_PROMPT_Codex完整.md` — 49KB 完整 System Prompt
- `17_动态运行时深挖完整版.md` — SSE事件流 + 数据库(5库19表)
- `18_前端UI完整逆向.md` — 三栏布局 + 14类设置 + 设计令牌

---

## License

MIT
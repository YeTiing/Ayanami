# Ayanami

Desktop AI Coding Assistant — 仿 Codex Desktop 实现

## 技术栈

- Electron 33 + TypeScript
- React 18 + Vite + Tailwind CSS 3
- Python FastAPI (后端 SSE 代理)

## 开发

```bash
npm install
npm run dev
```

## 项目结构

- src/main/ — Electron 主进程
- src/preload/ — 预加载脚本
- src/renderer/ — React 前端
- backend/ — Python FastAPI 后端

// ============================================================
// Ayanami - Browser Panel (Phase 8)
// Address bar + live screenshot + browser action buttons
// ============================================================

import { useState } from 'react'
import { useBrowser } from '@/hooks/useBrowser'

export default function BrowserPanel() {
  const browser = useBrowser()
  const [addressInput, setAddressInput] = useState('')
  const [evalInput, setEvalInput] = useState('')
  const [evalResult, setEvalResult] = useState<string | null>(null)
  const [clickSelector, setClickSelector] = useState('')

  const handleNavigate = () => {
    if (addressInput.trim()) {
      browser.navigate(addressInput.trim())
    }
  }

  const handleEvaluate = async () => {
    if (!evalInput.trim()) return
    const result = await browser.evaluate(evalInput.trim())
    setEvalResult(result)
  }

  const handleClickSelector = () => {
    if (clickSelector.trim()) {
      browser.click(clickSelector.trim())
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e] text-[#e2e8f0]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#3d3d5c] shrink-0">
        {/* Nav buttons */}
        <div className="flex items-center gap-0.5 mr-1">
          <button
            onClick={browser.goBack}
            disabled={!browser.connected || browser.loading}
            className="w-7 h-7 flex items-center justify-center text-sm rounded hover:bg-[#16213e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="后退"
          >
            ←
          </button>
          <button
            onClick={browser.goForward}
            disabled={!browser.connected || browser.loading}
            className="w-7 h-7 flex items-center justify-center text-sm rounded hover:bg-[#16213e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="前进"
          >
            →
          </button>
          <button
            onClick={browser.refresh}
            disabled={!browser.connected || browser.loading}
            className="w-7 h-7 flex items-center justify-center text-sm rounded hover:bg-[#16213e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="刷新"
          >
            ↻
          </button>
        </div>

        {/* Address bar */}
        <div className="flex-1 flex items-center gap-1">
          <input
            value={addressInput}
            onChange={e => setAddressInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleNavigate() }}
            placeholder="输入 URL..."
            className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-[#16213e] border border-[#3d3d5c] focus:border-cyan-500/50 outline-none text-[#e2e8f0] placeholder-gray-500 font-mono"
          />
          <button
            onClick={handleNavigate}
            disabled={!browser.connected || browser.loading || !addressInput.trim()}
            className="px-3 py-1.5 text-xs rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            GO
          </button>
        </div>

        {/* Connect/Disconnect */}
        {browser.connected ? (
          <button
            onClick={browser.disconnect}
            className="ml-2 px-3 py-1.5 text-xs rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors shrink-0"
          >
            断开
          </button>
        ) : (
          <button
            onClick={browser.connect}
            className="ml-2 px-3 py-1.5 text-xs rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors shrink-0"
          >
            连接
          </button>
        )}

        {/* Status indicator */}
        {browser.connected && (
          <div className="flex items-center gap-1.5 ml-1 shrink-0">
            {browser.loading ? (
              <span className="w-3 h-3 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-green-400" />
            )}
          </div>
        )}
      </div>

      {/* Screenshot area */}
      <div className="flex-1 min-h-0 bg-[#0d1117] overflow-auto flex items-center justify-center p-2">
        {browser.screenshot ? (
          <img
            src={browser.screenshot}
            alt="browser screenshot"
            className="max-w-full max-h-full object-contain rounded shadow-lg shadow-black/40"
            draggable={false}
          />
        ) : browser.connected ? (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <div className="w-6 h-6 border-2 border-gray-500 border-t-cyan-400 rounded-full animate-spin" />
            <span className="text-sm">加载中...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <svg className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span className="text-sm">点击「连接」启动浏览器会话</span>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-[#3d3d5c] shrink-0 bg-[#16213e] flex-wrap">
        {/* Click by selector */}
        <input
          value={clickSelector}
          onChange={e => setClickSelector(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleClickSelector() }}
          placeholder="CSS 选择器..."
          className="w-36 px-2 py-1 text-xs rounded bg-[#1a1a2e] border border-[#3d3d5c] focus:border-cyan-500/50 outline-none text-[#e2e8f0] placeholder-gray-500 font-mono"
        />
        <button
          onClick={handleClickSelector}
          disabled={!browser.connected || !clickSelector.trim()}
          className="px-3 py-1 text-xs rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          点击
        </button>

        <span className="text-gray-600 mx-1">|</span>

        {/* Evaluate JS */}
        <input
          value={evalInput}
          onChange={e => setEvalInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleEvaluate() }}
          placeholder="JS 表达式..."
          className="flex-1 min-w-[120px] px-2 py-1 text-xs rounded bg-[#1a1a2e] border border-[#3d3d5c] focus:border-cyan-500/50 outline-none text-[#e2e8f0] placeholder-gray-500 font-mono"
        />
        <button
          onClick={handleEvaluate}
          disabled={!browser.connected || !evalInput.trim()}
          className="px-3 py-1 text-xs rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          执行
        </button>
      </div>

      {/* Eval result */}
      {evalResult !== null && (
        <div className="px-3 py-2 border-t border-[#3d3d5c] shrink-0 bg-[#0d1117]">
          <div className="flex items-start gap-2">
            <span className="text-xs text-purple-400 shrink-0 mt-0.5 font-mono">&gt;</span>
            <pre className="text-xs text-[#e2e8f0] whitespace-pre-wrap break-all font-mono max-h-24 overflow-y-auto">{evalResult}</pre>
            <button
              onClick={() => setEvalResult(null)}
              className="text-xs text-gray-500 hover:text-gray-300 shrink-0 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Current URL bar */}
      {browser.connected && browser.url && (
        <div className="px-3 py-1 border-t border-[#3d3d5c] shrink-0 bg-[#0d1117] flex items-center gap-2 text-xs text-gray-400 font-mono truncate">
          <span className="text-cyan-400 shrink-0">🔗</span>
          <span className="truncate">{browser.url}</span>
        </div>
      )}
    </div>
  )
}

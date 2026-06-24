// ============================================================
// Ayanami - ComputerUse Panel (Phase 8)
// Live screenshot + mouse/keyboard control for remote desktop
// ============================================================

import { useState, useRef, useCallback } from 'react'
import { useComputerUse } from '@/hooks/useComputerUse'

export default function ComputerUse() {
  const cu = useComputerUse()
  const [zoom, setZoom] = useState(1)
  const [coordX, setCoordX] = useState(0)
  const [coordY, setCoordY] = useState(0)
  const [typeText, setTypeText] = useState('')
  const imgRef = useRef<HTMLDivElement>(null)

  const calcCoords = useCallback((clientX: number, clientY: number) => {
    if (!imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const x = Math.round((clientX - rect.left) / zoom)
    const y = Math.round((clientY - rect.top) / zoom)
    setCoordX(x)
    setCoordY(y)
  }, [zoom])

  const handleImgClick = useCallback((e: React.MouseEvent) => {
    calcCoords(e.clientX, e.clientY)
    cu.click('left')
  }, [calcCoords, cu])

  const handleImgMove = useCallback((e: React.MouseEvent) => {
    calcCoords(e.clientX, e.clientY)
  }, [calcCoords])

  const handleImgContext = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    calcCoords(e.clientX, e.clientY)
    cu.click('right')
  }, [calcCoords, cu])

  const sendType = () => {
    if (typeText.trim()) {
      cu.type(typeText)
      setTypeText('')
    }
  }

  const sendKey = (key: string) => cu.key(key)
  const sendMove = (dx: number, dy: number) => {
    const nx = Math.max(0, coordX + dx)
    const ny = Math.max(0, coordY + dy)
    setCoordX(nx)
    setCoordY(ny)
    cu.move(nx, ny)
  }

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e] text-[#e2e8f0] select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#3d3d5c] shrink-0">
        <span className="text-sm font-semibold tracking-wide text-cyan-400">
          💻 Computer Use
        </span>
        <div className="flex items-center gap-2">
          {cu.connected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400">已连接</span>
              <button
                onClick={cu.disconnect}
                className="ml-2 px-3 py-1 text-xs rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
              >
                断开
              </button>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-gray-500" />
              <span className="text-xs text-gray-400">未连接</span>
              <button
                onClick={cu.connect}
                className="ml-2 px-3 py-1 text-xs rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
              >
                连接
              </button>
            </>
          )}
          <div className="flex items-center gap-1 ml-3">
            <button
              onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
              className="w-6 h-6 flex items-center justify-center text-xs rounded bg-[#16213e] hover:bg-[#0f3460] transition-colors"
            >
              −
            </button>
            <span className="text-xs text-gray-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(3, z + 0.25))}
              className="w-6 h-6 flex items-center justify-center text-xs rounded bg-[#16213e] hover:bg-[#0f3460] transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Body: screenshot + controls */}
      <div className="flex flex-1 min-h-0">
        {/* Screenshot area */}
        <div
          ref={imgRef}
          className="flex-1 overflow-auto bg-[#0d1117] flex items-center justify-center cursor-crosshair p-2"
          onClick={handleImgClick}
          onMouseMove={handleImgMove}
          onContextMenu={handleImgContext}
        >
          {cu.screenshot ? (
            <img
              src={cu.screenshot}
              alt="screenshot"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              className="max-w-none pointer-events-none"
              draggable={false}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <svg className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">点击「连接」开始远程桌面</span>
            </div>
          )}
        </div>

        {/* Control panel */}
        <div className="w-56 shrink-0 border-l border-[#3d3d5c] flex flex-col bg-[#16213e]">
          {/* Coordinates */}
          <div className="p-3 border-b border-[#3d3d5c]">
            <div className="text-xs text-gray-400 mb-1">鼠标坐标</div>
            <div className="flex gap-2">
              <div className="flex-1 bg-[#1a1a2e] rounded px-2 py-1 text-xs font-mono">
                <span className="text-cyan-400">X</span> {coordX}
              </div>
              <div className="flex-1 bg-[#1a1a2e] rounded px-2 py-1 text-xs font-mono">
                <span className="text-cyan-400">Y</span> {coordY}
              </div>
            </div>
          </div>

          {/* Click buttons */}
          <div className="p-3 border-b border-[#3d3d5c]">
            <div className="text-xs text-gray-400 mb-2">鼠标操作</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => cu.click('left')} className="px-2 py-1.5 text-xs rounded bg-[#1a1a2e] hover:bg-cyan-500/20 border border-[#3d3d5c] hover:border-cyan-500/40 transition-colors">🖱 左键</button>
              <button onClick={() => cu.click('right')} className="px-2 py-1.5 text-xs rounded bg-[#1a1a2e] hover:bg-cyan-500/20 border border-[#3d3d5c] hover:border-cyan-500/40 transition-colors">🔘 右键</button>
              <button onClick={() => cu.doubleClick()} className="px-2 py-1.5 text-xs rounded bg-[#1a1a2e] hover:bg-cyan-500/20 border border-[#3d3d5c] hover:border-cyan-500/40 transition-colors">⚡ 双击</button>
              <button onClick={() => cu.click('middle')} className="px-2 py-1.5 text-xs rounded bg-[#1a1a2e] hover:bg-cyan-500/20 border border-[#3d3d5c] hover:border-cyan-500/40 transition-colors">🔴 中键</button>
            </div>
          </div>

          {/* Arrow keys */}
          <div className="p-3 border-b border-[#3d3d5c]">
            <div className="text-xs text-gray-400 mb-2">方向 / 移动</div>
            <div className="grid grid-cols-3 gap-1 place-items-center">
              <div />
              <button onMouseDown={() => sendMove(0, -10)} className="w-8 h-8 flex items-center justify-center text-sm rounded bg-[#1a1a2e] hover:bg-cyan-500/20 border border-[#3d3d5c] transition-colors active:bg-cyan-500/40">↑</button>
              <div />
              <button onMouseDown={() => sendMove(-10, 0)} className="w-8 h-8 flex items-center justify-center text-sm rounded bg-[#1a1a2e] hover:bg-cyan-500/20 border border-[#3d3d5c] transition-colors active:bg-cyan-500/40">←</button>
              <div className="w-8 h-8 flex items-center justify-center text-xs text-gray-500">⊕</div>
              <button onMouseDown={() => sendMove(10, 0)} className="w-8 h-8 flex items-center justify-center text-sm rounded bg-[#1a1a2e] hover:bg-cyan-500/20 border border-[#3d3d5c] transition-colors active:bg-cyan-500/40">→</button>
              <div />
              <button onMouseDown={() => sendMove(0, 10)} className="w-8 h-8 flex items-center justify-center text-sm rounded bg-[#1a1a2e] hover:bg-cyan-500/20 border border-[#3d3d5c] transition-colors active:bg-cyan-500/40">↓</button>
              <div />
            </div>
          </div>

          {/* Scroll */}
          <div className="p-3 border-b border-[#3d3d5c]">
            <div className="text-xs text-gray-400 mb-2">滚动</div>
            <div className="flex gap-1.5">
              <button onClick={() => cu.scroll(0, -100)} className="flex-1 px-2 py-1.5 text-xs rounded bg-[#1a1a2e] hover:bg-cyan-500/20 border border-[#3d3d5c] transition-colors">▲ 上</button>
              <button onClick={() => cu.scroll(0, 100)} className="flex-1 px-2 py-1.5 text-xs rounded bg-[#1a1a2e] hover:bg-cyan-500/20 border border-[#3d3d5c] transition-colors">▼ 下</button>
            </div>
          </div>

          {/* Keyboard input */}
          <div className="p-3 border-b border-[#3d3d5c]">
            <div className="text-xs text-gray-400 mb-2">键盘输入</div>
            <div className="flex gap-1.5">
              <input
                value={typeText}
                onChange={e => setTypeText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendType() }}
                placeholder="输入文本..."
                className="flex-1 px-2 py-1.5 text-xs rounded bg-[#1a1a2e] border border-[#3d3d5c] focus:border-cyan-500/50 outline-none text-[#e2e8f0] placeholder-gray-500"
              />
              <button onClick={sendType} className="px-3 py-1.5 text-xs rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors">发送</button>
            </div>
          </div>

          {/* Special keys */}
          <div className="p-3 flex-1">
            <div className="text-xs text-gray-400 mb-2">快捷键</div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                ['Enter', '↵ 回车'],
                ['Escape', 'Esc'],
                ['Tab', '↹ Tab'],
                ['Backspace', '⌫ 退格'],
                ['Control+c', 'Ctrl+C'],
                ['Control+v', 'Ctrl+V'],
                ['Control+z', 'Ctrl+Z'],
                ['Control+a', 'Ctrl+A'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => sendKey(key)}
                  className="px-2 py-1.5 text-xs rounded bg-[#1a1a2e] hover:bg-cyan-500/20 border border-[#3d3d5c] hover:border-cyan-500/40 transition-colors truncate"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

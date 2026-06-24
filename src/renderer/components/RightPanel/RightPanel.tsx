import React, { useState } from 'react';
import type { RightPanelTab } from '@/types';

const TABS: RightPanelTab[] = ['files', 'context', 'preview', 'terminal', 'output', 'diff'];

const tabContent: Record<RightPanelTab, React.ReactNode> = {
  files: (
    <div className="p-3">
      <p className="text-sm text-[#94a3b8] mb-3">工作区文件列表</p>
      <div className="text-xs text-[#94a3b8] space-y-1">
        <div className="flex items-center gap-2 py-0.5 hover:text-[#e2e8f0] cursor-pointer">
          <span>📁</span><span>src/</span>
        </div>
        <div className="flex items-center gap-2 py-0.5 hover:text-[#e2e8f0] cursor-pointer pl-3">
          <span>📁</span><span>renderer/</span>
        </div>
        <div className="flex items-center gap-2 py-0.5 hover:text-[#e2e8f0] cursor-pointer pl-6">
          <span>📄</span><span>App.tsx</span>
        </div>
        <div className="flex items-center gap-2 py-0.5 hover:text-[#e2e8f0] cursor-pointer pl-6">
          <span>📄</span><span>index.tsx</span>
        </div>
        <div className="flex items-center gap-2 py-0.5 hover:text-[#e2e8f0] cursor-pointer pl-3">
          <span>📁</span><span>components/</span>
        </div>
        <div className="flex items-center gap-2 py-0.5 hover:text-[#e2e8f0] cursor-pointer pl-3">
          <span>📁</span><span>types/</span>
        </div>
      </div>
    </div>
  ),
  context: (
    <div className="p-3">
      <p className="text-sm text-[#94a3b8]">上下文信息</p>
      <div className="mt-2 text-xs text-[#64748b] space-y-1">
        <p>当前文件: index.tsx</p>
        <p>光标位置: 12:34</p>
        <p>选中文本: 无</p>
      </div>
    </div>
  ),
  preview: (
    <div className="p-3 flex items-center justify-center h-full">
      <p className="text-sm text-[#94a3b8]">Artifact 预览</p>
    </div>
  ),
  terminal: (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-[#0d1117] m-2 rounded-md p-3 font-mono text-xs overflow-y-auto">
        <div className="text-[#3fb950]">Ayanami@desktop:~$ npm run dev</div>
        <div className="text-[#3fb950]">&gt; ayanami@1.0.0 dev</div>
        <div className="text-[#3fb950]">&gt; vite</div>
        <div className="text-[#58a6ff] mt-1">VITE v5.0.0  ready in 320 ms</div>
        <div className="text-[#58a6ff]">➜  Local:   http://localhost:5173/</div>
        <div className="mt-2 flex items-center gap-1">
          <span className="text-[#3fb950]">Ayanami@desktop:~$</span>
          <span className="w-2 h-4 bg-[#3fb950] animate-pulse inline-block" />
        </div>
      </div>
    </div>
  ),
  output: (
    <div className="p-3">
      <p className="text-sm text-[#94a3b8]">运行输出</p>
      <div className="mt-2 text-xs text-[#64748b] font-mono">
        <p className="text-[#e2e8f0]">Build completed successfully.</p>
        <p className="text-[#3fb950]">✓ 3 modules transformed.</p>
        <p className="text-[#94a3b8]">Done in 1.2s</p>
      </div>
    </div>
  ),
  diff: (
    <div className="p-3">
      <p className="text-sm text-[#94a3b8]">代码差异对比</p>
      <div className="mt-2 text-xs font-mono space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[#64748b] w-8 text-right">12</span>
          <span className="text-[#e2e8f0]">  const name = 'Ayanami';</span>
        </div>
        <div className="flex items-center gap-2 bg-[#1a3a1a]">
          <span className="text-[#64748b] w-8 text-right">13</span>
          <span className="text-[#3fb950]">+ const greeting = `Hello, ${'{name}'}`;</span>
        </div>
        <div className="flex items-center gap-2 bg-[#3a1a1a]">
          <span className="text-[#64748b] w-8 text-right">14</span>
          <span className="text-[#f85149]">- const greeting = 'Hello, ' + name;</span>
        </div>
      </div>
    </div>
  ),
};

const RightPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RightPanelTab>('files');

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e] border-l border-[#2d2d4a]">
      {/* Tab Bar — 36px height */}
      <div
        className="flex items-end h-9 px-1 border-b border-[#2d2d4a] shrink-0"
        role="tablist"
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'relative px-3 h-8 text-xs font-medium transition-colors',
              activeTab === tab
                ? 'text-[#e2e8f0]'
                : 'text-[#94a3b8] hover:text-[#e2e8f0]',
            ].join(' ')}
          >
            {tab.toUpperCase()}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-[#7c3aed] rounded-t-sm" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {tabContent[activeTab]}
      </div>
    </div>
  );
};

export default RightPanel;

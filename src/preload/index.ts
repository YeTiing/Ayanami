import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('ayanami', {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    onMaximizeChange: (callback: (maximized: boolean) => void) => {
      ipcRenderer.on('window:maximizeChange', (_event, maximized) => callback(maximized))
    },
  },
  shell: {
    exec: (command: string, cwd?: string) => ipcRenderer.invoke('shell:exec', command, cwd),
  },
  platform: process.platform,
})
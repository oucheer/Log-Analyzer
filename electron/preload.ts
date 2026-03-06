import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  saveJson: (data: any, defaultName: string) => ipcRenderer.invoke('save-json', data, defaultName),
  loadJson: () => ipcRenderer.invoke('load-json'),
  saveLog: (content: string, defaultName: string) => ipcRenderer.invoke('save-log', content, defaultName)
})

import React, { useState, useEffect, useCallback } from 'react'
import { LogFile, ErrorKeyword, SearchOptions, SearchResult, Theme, FloodFilterConfig, SystemConfig, defaultSystemConfig, FloodStats } from './types'
import { TaskReport, TaskLogEntry } from './types/taskReport'
import Toolbar from './components/Toolbar'
import LogViewer from './components/LogViewer'
import SearchPanel from './components/SearchPanel'
import ErrorAnalysisPane from './components/ErrorAnalysisPane'
import HistoryPanel from './components/HistoryPanel'
import GoToLine from './components/GoToLine'
import SearchDialog from './components/SearchDialog'
import ConfigPanel from './components/ConfigPanel'
import FloodFilterPanel from './components/FloodFilterPanel'
import ChartPanel from './components/ChartPanel'
import SyntaxCheckPanel from './components/SyntaxCheckPanel'
import TaskReportPanel from './components/TaskReportPanel'
import { floodFilter } from './utils/FloodFilter'
import { taskReportLogger } from './utils/TaskReportLogger'
import './App.css'

interface ElectronAPI {
  selectFile: () => Promise<{ filePath: string; content: string; fileName: string } | null>
  selectFolder: () => Promise<{ folderPath: string; files: Array<{ filePath: string; content: string; fileName: string }> } | null>
  readFile: (filePath: string) => Promise<{ filePath: string; content: string; fileName: string } | null>
  saveJson: (data: any, defaultName: string) => Promise<boolean>
  loadJson: () => Promise<{ filePath: string; content: string; success: boolean; error?: string } | null>
  saveLog: (content: string, defaultName: string) => Promise<boolean>
}

declare global {
  interface Window { electronAPI: ElectronAPI }
}

function App() {
  const [logFiles, setLogFiles] = useState<LogFile[]>([])
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [history, setHistory] = useState<string[]>([])
  const [errorKeywords, setErrorKeywords] = useState<ErrorKeyword[]>(defaultSystemConfig.errorKeywords)
  const [systemConfig, setSystemConfig] = useState< SystemConfig>(defaultSystemConfig)
  const [floodFilterConfig, setFloodFilterConfig] = useState<FloodFilterConfig>(defaultSystemConfig.floodFilter)
  const [floodStats, setFloodStats] = useState<FloodStats | null>(null)
  const [filteredContent, setFilteredContent] = useState<string>('')
  const [showHistory, setShowHistory] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOptions] = useState<SearchOptions>({ caseSensitive: false, wholeWord: false, useRegex: false })
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [currentResultIndex, setCurrentResultIndex] = useState(-1)
  const [fontSize, setFontSize] = useState(14)
  const [lineHeight, setLineHeight] = useState(20)
  const [showGoToLine, setShowGoToLine] = useState(false)
  const [showSearchDialog, setShowSearchDialog] = useState(false)
  const [targetLine, setTargetLine] = useState<number | undefined>(undefined)
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark')
  const [showConfigPanel, setShowConfigPanel] = useState(false)
  const [showFloodFilterPanel, setShowFloodFilterPanel] = useState(false)
  const [showChartPanel, setShowChartPanel] = useState(false)
  const [showSyntaxPanel, setShowSyntaxPanel] = useState(false)
  const [showTaskReportPanel, setShowTaskReportPanel] = useState(false)
  const [taskReports, setTaskReports] = useState<TaskReport[]>([])
  const [taskLogEntries, setTaskLogEntries] = useState<TaskLogEntry[]>([])

  useEffect(() => {
    const savedHistory = localStorage.getItem('logHistory')
    const savedKeywords = localStorage.getItem('errorKeywords')
    const savedConfig = localStorage.getItem('systemConfig')
    if (savedHistory) setHistory(JSON.parse(savedHistory))
    if (savedKeywords) setErrorKeywords(JSON.parse(savedKeywords))
    if (savedConfig) { const c = JSON.parse(savedConfig); setSystemConfig(c); setFloodFilterConfig(c.floodFilter) }
  }, [])

  useEffect(() => { localStorage.setItem('logHistory', JSON.stringify(history)) }, [history])
  useEffect(() => { localStorage.setItem('errorKeywords', JSON.stringify(errorKeywords)) }, [errorKeywords])
  useEffect(() => { localStorage.setItem('systemConfig', JSON.stringify(systemConfig)) }, [systemConfig])
  useEffect(() => { localStorage.setItem('theme', theme); document.documentElement.setAttribute('data-theme', theme) }, [theme])

  useEffect(() => {
    floodFilter.setConfig(floodFilterConfig)
    const cf = logFiles[currentFileIndex]
    if (cf && floodFilterConfig.enabled) { const r = floodFilter.filter(cf.content); setFilteredContent(r.filteredLines.join('\n')); setFloodStats(r.floodStats) }
    else if (cf) { setFilteredContent(cf.content); setFloodStats(null) }
  }, [logFiles, currentFileIndex, floodFilterConfig.enabled])

  const addToHistory = (path: string) => { setHistory(prev => [path, ...prev.filter(p => p !== path)].slice(0, 20)) }
  const currentFile = logFiles[currentFileIndex]
  const displayContent = floodFilterConfig.enabled && filteredContent ? filteredContent : (currentFile?.content || '')

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 'g') { e.preventDefault(); if (currentFile) setShowGoToLine(true) } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); if (currentFile) setShowSearchDialog(true) } }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [currentFile])

  const handleOpenFile = async () => {
    const taskId = `open-file-${Date.now()}`; taskReportLogger.createTask(taskId, '打开文件')
    try {
      const result = await window.electronAPI.selectFile()
      if (result) { setLogFiles([result]); setCurrentFileIndex(0); addToHistory(result.filePath); taskReportLogger.logSuccess(taskId, 'FILE_OPERATION', `成功打开文件: ${result.fileName}`); taskReportLogger.completeTask(taskId, 'completed', `文件已加载: ${result.fileName}`) }
      else { taskReportLogger.logWarning(taskId, 'FILE_OPERATION', '用户取消了文件选择'); taskReportLogger.completeTask(taskId, 'failed', '用户取消了操作') }
    } catch (err) { taskReportLogger.logError(taskId, 'FILE_OPERATION', `打开文件失败: ${err}`); taskReportLogger.completeTask(taskId, 'failed', '操作失败') }
    setTaskReports(taskReportLogger.getAllReports()); setTaskLogEntries(taskReportLogger.getLogEntries())
  }

  const handleOpenFolder = async () => {
    const taskId = `open-folder-${Date.now()}`; taskReportLogger.createTask(taskId, '打开文件夹')
    try {
      const result = await window.electronAPI.selectFolder()
      if (result && result.files.length > 0) { setLogFiles(result.files); setCurrentFileIndex(0); result.files.forEach((f: LogFile) => addToHistory(f.filePath)); taskReportLogger.logSuccess(taskId, 'FILE_OPERATION', `成功打开文件夹，加载了 ${result.files.length} 个文件`); taskReportLogger.completeTask(taskId, 'completed', `已加载 ${result.files.length} 个日志文件`) }
      else { taskReportLogger.logWarning(taskId, 'FILE_OPERATION', '用户取消了文件夹选择'); taskReportLogger.completeTask(taskId, 'failed', '用户取消了操作') }
    } catch (err) { taskReportLogger.logError(taskId, 'FILE_OPERATION', `打开文件夹失败: ${err}`); taskReportLogger.completeTask(taskId, 'failed', '操作失败') }
    setTaskReports(taskReportLogger.getAllReports()); setTaskLogEntries(taskReportLogger.getLogEntries())
  }

  const handleOpenFromHistory = async (filePath: string) => {
    const result = await window.electronAPI.readFile(filePath)
    if (result) { const exists = logFiles.some(f => f.filePath === filePath); if (!exists) { setLogFiles(prev => [...prev, result]); setCurrentFileIndex(logFiles.length) } else { setCurrentFileIndex(logFiles.findIndex(f => f.filePath === filePath)) } }
  }

  const handleSearch = useCallback((query: string, options: SearchOptions) => {
    setSearchQuery(query)
    if (!query || logFiles.length === 0) { setSearchResults([]); setCurrentResultIndex(-1); return }
    const lines = displayContent.split('\n'); const results: SearchResult[] = []; let regex: RegExp
    try { regex = options.useRegex ? new RegExp(query, options.caseSensitive ? 'g' : 'gi') : new RegExp(options.wholeWord ? `\\b${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b` : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), options.caseSensitive ? 'g' : 'gi') } catch { return }
    lines.forEach((line, lineIndex) => { let match: RegExpExecArray | null; while ((match = regex.exec(line)) !== null) { results.push({ line: lineIndex, start: match.index, end: match.index + match[0].length, text: line }) } })
    setSearchResults(results); setCurrentResultIndex(results.length > 0 ? 0 : -1)
    if (query) taskReportLogger.logInfo(null, 'SEARCH', `搜索: "${query}", 结果: ${results.length} 条`)
  }, [displayContent])

  const navigateResult = (direction: 'next' | 'prev') => { if (searchResults.length === 0) return; setCurrentResultIndex(prev => direction === 'next' ? (prev + 1) % searchResults.length : (prev - 1 + searchResults.length) % searchResults.length) }
  const handleGoToLine = (lineNumber: number) => { setTargetLine(lineNumber); setTimeout(() => setTargetLine(undefined), 100); taskReportLogger.logInfo(null, 'SYSTEM', `跳转到行: ${lineNumber}`) }
  const handleConfigLoad = (config: SystemConfig) => { setSystemConfig(config); setErrorKeywords(config.errorKeywords); setFloodFilterConfig(config.floodFilter); taskReportLogger.logInfo(null, 'CONFIG', '已从JSON文件加载系统配置') }
  const handleConfigExport = async () => { const success = await window.electronAPI.saveJson(systemConfig, 'system-config.json'); if (success) taskReportLogger.logSuccess(null, 'CONFIG', '配置导出成功') }
  const handleFloodConfigChange = (config: FloodFilterConfig) => { setFloodFilterConfig(config); setSystemConfig({ ...systemConfig, floodFilter: config }); taskReportLogger.logInfo(null, 'CONFIG', `刷屏过滤配置已更新: 启用=${config.enabled}`) }

  const openPanel = (panelType: string) => {
    setShowConfigPanel(false); setShowFloodFilterPanel(false); setShowChartPanel(false); setShowSyntaxPanel(false); setShowTaskReportPanel(false)
    switch (panelType) { case 'config': setShowConfigPanel(true); taskReportLogger.logInfo(null, 'CONFIG', '打开配置面板'); break; case 'flood': setShowFloodFilterPanel(true); taskReportLogger.logInfo(null, 'SYSTEM', '打开刷屏过滤面板'); break; case 'chart': setShowChartPanel(true); taskReportLogger.logInfo(null, 'SYSTEM', '打开可视化图表面板'); break; case 'syntax': setShowSyntaxPanel(true); taskReportLogger.logInfo(null, 'SYNTAX_CHECK', '打开语法检查面板'); break; case 'task': setShowTaskReportPanel(true); taskReportLogger.logInfo(null, 'SYSTEM', '打开任务汇报面板'); break }
    setTaskReports(taskReportLogger.getAllReports()); setTaskLogEntries(taskReportLogger.getLogEntries())
  }

  return (
    <div className="app" data-theme={theme}>
      <Toolbar onOpenFile={handleOpenFile} onOpenFolder={handleOpenFolder} onShowHistory={() => setShowHistory(!showHistory)}
        onIncreaseFont={() => { setFontSize(p => Math.min(p + 2, 32)); setLineHeight(p => Math.min(p + 3, 48)) }}
        onDecreaseFont={() => { setFontSize(p => Math.max(p - 2, 8)); setLineHeight(p => Math.max(p - 3, 12)) }}
        onGoToLine={() => setShowGoToLine(true)} onThemeChange={setTheme} theme={theme} fontSize={fontSize}
        logFiles={logFiles} currentFileIndex={currentFileIndex} onFileChange={setCurrentFileIndex}
        onOpenConfig={() => openPanel('config')} onOpenFloodFilter={() => openPanel('flood')} onOpenChart={() => openPanel('chart')}
        onOpenSyntaxCheck={() => openPanel('syntax')} onOpenTaskReport={() => openPanel('task')} />
      <div className="main-content">
        {showHistory && <HistoryPanel history={history} onOpen={handleOpenFromHistory} onClear={() => setHistory([])} onClose={() => setShowHistory(false)} />}
        <div className="log-area">
          {currentFile && <LogViewer content={displayContent} fontSize={fontSize} lineHeight={lineHeight} searchResults={searchResults} currentResultIndex={currentResultIndex} searchQuery={searchQuery} searchOptions={searchOptions} targetLine={targetLine} />}
          {!currentFile && <div className="welcome-screen"><h1>日志分析工具</h1><p>点击工具栏的"打开文件"或"打开文件夹"开始分析日志</p><div className="feature-hints"><p>新增功能:</p><ul><li>⚙️ 配置管理 - 通过JSON文件导入/导出配置</li><li>🚫 刷屏过滤 - 自动识别并过滤重复刷屏日志</li><li>📊 可视化图表 - 展示任务流程和状态</li><li>🔍 语法检查 - 支持多种编程语言语法检查</li><li>📋 任务汇报 - 规范记录系统操作和任务执行</li></ul></div></div>}
        </div>
        <ErrorAnalysisPane content={displayContent} errorKeywords={errorKeywords} onKeywordsChange={(keywords) => { setErrorKeywords(keywords); setSystemConfig({ ...systemConfig, errorKeywords: keywords }) }} />
      </div>
      {currentFile && <SearchPanel onSearch={handleSearch} searchResults={searchResults} currentResultIndex={currentResultIndex} onNavigate={navigateResult} />}
      {currentFile && <GoToLine onGoToLine={handleGoToLine} totalLines={displayContent.split('\n').length} isVisible={showGoToLine} onClose={() => setShowGoToLine(false)} />}
      {currentFile && <SearchDialog isVisible={showSearchDialog} onClose={() => setShowSearchDialog(false)} onSearch={handleSearch} searchResults={searchResults} currentResultIndex={currentResultIndex} onNavigate={navigateResult} initialQuery={searchQuery} />}
      {showConfigPanel && <ConfigPanel currentConfig={systemConfig} onConfigLoad={handleConfigLoad} onExport={handleConfigExport} onClose={() => setShowConfigPanel(false)} />}
      {showFloodFilterPanel && <FloodFilterPanel config={floodFilterConfig} onConfigChange={handleFloodConfigChange} stats={floodStats} onClose={() => setShowFloodFilterPanel(false)} />}
      {showChartPanel && <ChartPanel taskReports={taskReports} onClose={() => setShowChartPanel(false)} />}
      {showSyntaxPanel && <SyntaxCheckPanel onClose={() => setShowSyntaxPanel(false)} />}
      {showTaskReportPanel && <TaskReportPanel reports={taskReports} entries={taskLogEntries} onSaveLog={() => {}} onClose={() => setShowTaskReportPanel(false)} />}
    </div>
  )
}

export default App

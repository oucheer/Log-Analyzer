import React, { useState } from 'react'
import { LogFile, Theme } from '../types'
import './Toolbar.css'

interface ToolbarProps {
  onOpenFile: () => void
  onOpenFolder: () => void
  onShowHistory: () => void
  onIncreaseFont: () => void
  onDecreaseFont: () => void
  onGoToLine: () => void
  onThemeChange: (theme: Theme) => void
  theme: Theme
  fontSize: number
  logFiles: LogFile[]
  currentFileIndex: number
  onFileChange: (index: number) => void
  onOpenConfig: () => void
  onOpenFloodFilter: () => void
  onOpenChart: () => void
  onOpenSyntaxCheck: () => void
  onOpenTaskReport: () => void
  onOpenKeywordConfig: () => void
  onOpenAbout: () => void
}

const Toolbar: React.FC<ToolbarProps> = ({
  onOpenFile,
  onOpenFolder,
  onShowHistory,
  onIncreaseFont,
  onDecreaseFont,
  onGoToLine,
  onThemeChange,
  theme,
  fontSize,
  logFiles,
  currentFileIndex,
  onFileChange,
  onOpenConfig,
  onOpenFloodFilter,
  onOpenChart,
  onOpenSyntaxCheck,
  onOpenTaskReport,
  onOpenKeywordConfig,
  onOpenAbout
}) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [showToolsMenu, setShowToolsMenu] = useState(false)

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button className="toolbar-btn" onClick={onOpenFile} title="打开日志文件">
          <span className="icon">📄</span>
          打开文件
        </button>
        <button className="toolbar-btn" onClick={onOpenFolder} title="打开文件夹">
          <span className="icon">📁</span>
          打开文件夹
        </button>
        <button className="toolbar-btn" onClick={onShowHistory} title="历史记录">
          <span className="icon">⏱️</span>
          历史记录
        </button>
      </div>
      
      {logFiles.length > 0 && (
        <div className="toolbar-center">
          <select
            className="file-selector"
            value={currentFileIndex}
            onChange={(e) => onFileChange(parseInt(e.target.value))}
          >
            {logFiles.map((file, index) => (
              <option key={index} value={index}>
                {file.fileName}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="toolbar-right">
        <div className="tools-wrapper" style={{ position: 'relative' }}>
          <button
            className="toolbar-btn tools-btn"
            onClick={() => setShowToolsMenu(!showToolsMenu)}
            title="工具"
          >
            <span className="icon">🛠️</span>
            工具
          </button>
          {showToolsMenu && (
            <div className="tools-menu">
              <button
                className="tool-option"
                onClick={() => {
                  onOpenConfig()
                  setShowToolsMenu(false)
                }}
              >
                <span className="option-icon">⚙️</span>
                系统配置
              </button>
              <button
                className="tool-option"
                onClick={() => {
                  onOpenFloodFilter()
                  setShowToolsMenu(false)
                }}
              >
                <span className="option-icon">🚫</span>
                刷屏过滤
              </button>
              <button
                className="tool-option"
                onClick={() => {
                  onOpenChart()
                  setShowToolsMenu(false)
                }}
              >
                <span className="option-icon">📊</span>
                可视化图表
              </button>
              <button
                className="tool-option"
                onClick={() => {
                  onOpenSyntaxCheck()
                  setShowToolsMenu(false)
                }}
              >
                <span className="option-icon">🔍</span>
                语法检查
              </button>
              <button
                className="tool-option"
                onClick={() => {
                  onOpenTaskReport()
                  setShowToolsMenu(false)
                }}
              >
                <span className="option-icon">📋</span>
                任务汇报
              </button>
              <button
                className="tool-option"
                onClick={() => {
                  onOpenKeywordConfig()
                  setShowToolsMenu(false)
                }}
              >
                <span className="option-icon">🔑</span>
                关键字配置
              </button>
              <div className="toolbar-menu-divider"></div>
              <button
                className="tool-option"
                onClick={() => {
                  onOpenAbout()
                  setShowToolsMenu(false)
                }}
              >
                <span className="option-icon">ℹ️</span>
                关于
              </button>
            </div>
          )}
        </div>
        <div className="theme-wrapper" style={{ position: 'relative' }}>
          <button
            className="toolbar-btn theme-btn"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            title="切换主题"
          >
            <span className="theme-icon">🎨</span>
            <span className="theme-label">{theme === 'dark' ? '深色' : theme === 'light' ? '浅色' : theme === 'blue' ? '蓝色' : theme === 'green' ? '绿色' : '紫色'}</span>
          </button>
          {showThemeMenu && (
            <div className="theme-menu">
              <button
                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => {
                  onThemeChange('dark')
                  setShowThemeMenu(false)
                }}
              >
                <span className="theme-color" style={{ backgroundColor: '#1e1e1e' }}></span>
                🌙 深色主题
              </button>
              <button
                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                onClick={() => {
                  onThemeChange('light')
                  setShowThemeMenu(false)
                }}
              >
                <span className="theme-color" style={{ backgroundColor: '#f5f5f5' }}></span>
                ☀️ 浅色主题
              </button>
              <button
                className={`theme-option ${theme === 'blue' ? 'active' : ''}`}
                onClick={() => {
                  onThemeChange('blue')
                  setShowThemeMenu(false)
                }}
              >
                <span className="theme-color" style={{ backgroundColor: '#00a8e8' }}></span>
                🔵 蓝色主题
              </button>
              <button
                className={`theme-option ${theme === 'green' ? 'active' : ''}`}
                onClick={() => {
                  onThemeChange('green')
                  setShowThemeMenu(false)
                }}
              >
                <span className="theme-color" style={{ backgroundColor: '#4caf50' }}></span>
                🟢 绿色主题
              </button>
              <button
                className={`theme-option ${theme === 'purple' ? 'active' : ''}`}
                onClick={() => {
                  onThemeChange('purple')
                  setShowThemeMenu(false)
                }}
              >
                <span className="theme-color" style={{ backgroundColor: '#9c7cff' }}></span>
                🟣 紫色主题
              </button>
            </div>
          )}
        </div>
        <div className="toolbar-divider"></div>
        <button className="toolbar-btn" onClick={onDecreaseFont} title="减小字体 (Ctrl+-)">
          <span className="icon">A-</span>
        </button>
        <span className="font-size">{fontSize}px</span>
        <button className="toolbar-btn" onClick={onIncreaseFont} title="增大字体 (Ctrl++)">
          <span className="icon">A+</span>
        </button>
        <div className="toolbar-divider"></div>
        <button className="toolbar-btn" onClick={onGoToLine} title="跳转至指定行 (Ctrl+G)">
          <span className="icon">📍</span>
          跳转行号
        </button>
      </div>
    </div>
  )
}

export default Toolbar

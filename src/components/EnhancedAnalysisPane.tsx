import React, { useState, useMemo } from 'react'
import { EnhancedMatchResult } from '../types'
import { enhancedConfigManager } from '../utils/EnhancedConfigManager'
import { enhancedMatchEngine } from '../utils/EnhancedMatchEngine'
import './EnhancedAnalysisPane.css'

interface EnhancedAnalysisPaneProps {
  content: string
  onClose?: () => void
}

const EnhancedAnalysisPane: React.FC<EnhancedAnalysisPaneProps> = ({ content, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | 'warning' | ''; message: string }>({ type: '', message: '' })
  const [activeTab, setActiveTab] = useState<'results' | 'configs' | 'guide'>('results')

  const hasConfig = enhancedConfigManager.hasEnabledConfig()
  const configs = enhancedConfigManager.getConfigs()

  const matchResults = useMemo(() => {
    if (!hasConfig || !content) return []
    return enhancedMatchEngine.matchLogContent(content)
  }, [content, hasConfig])

  const statistics = useMemo(() => {
    return enhancedMatchEngine.getStatistics(matchResults)
  }, [matchResults])

  const handleImport = () => {
    if (!importText.trim()) {
      setImportStatus({ type: 'error', message: '请输入JSON配置内容' })
      return
    }

    const result = enhancedConfigManager.addConfig(importText)
    
    if (result.success) {
      setImportStatus({ 
        type: result.conflicts?.length ? 'warning' : 'success', 
        message: result.conflicts?.length 
          ? `${result.message}\n${result.conflicts.join('\n')}`
          : result.message 
      })
      setShowImport(false)
      setImportText('')
    } else {
      setImportStatus({ type: 'error', message: result.message })
    }

    setTimeout(() => setImportStatus({ type: '', message: '' }), 5000)
  }

  const handleLoadSample = () => {
    const sampleConfig = `{
  "version": "1.0",
  "repository": {
    "name": "打印服务项目",
    "files": [
      { "path": "src/print/module.ts", "module": "打印模块" },
      { "path": "src/scan/engine.ts", "module": "扫描模块" },
      { "path": "src/copy/transfer.ts", "module": "复制模块" },
      { "path": "src/network/client.ts", "module": "网络模块" }
    ]
  },
  "apis": [
    { "name": "printDocument", "file": "src/print/module.ts", "description": "打印文档接口" },
    { "name": "scanImage", "file": "src/scan/engine.ts", "description": "扫描图像接口" },
    { "name": "copyFile", "file": "src/copy/transfer.ts", "description": "文件复制接口" }
  ],
  "branches": [
    { "name": "print_error", "description": "打印异常分支", "severity": "error" },
    { "name": "scan_error", "description": "扫描异常分支", "severity": "error" },
    { "name": "network_timeout", "description": "网络超时分支", "severity": "warning" }
  ],
  "exceptionKeywords": [
    { "keyword": "print_err", "branch": "print_error", "suggestion": "请检查打印服务配置是否正确，确认打印机连接状态", "severity": "error" },
    { "keyword": "print_timeout", "branch": "print_error", "suggestion": "打印任务超时，请检查打印机状态和网络", "severity": "warning" },
    { "keyword": "scan_err", "branch": "scan_error", "suggestion": "扫描模块异常，请检查扫描仪驱动和连接", "severity": "error" },
    { "keyword": "scan_fail", "branch": "scan_error", "suggestion": "扫描失败，请检查扫描仪是否就绪", "severity": "error" }
  ],
  "logKeywords": [
    { "keyword": "timeout", "api": "printDocument", "suggestion": "请求超时，请检查网络连接和服务器状态", "severity": "warning" },
    { "keyword": "connection_refused", "api": "printDocument", "suggestion": "连接被拒绝，请确认服务是否启动", "severity": "error" },
    { "keyword": "retry", "api": "copyFile", "suggestion": "操作重试中，请检查网络稳定性", "severity": "info" }
  ]
}`
    setImportText(sampleConfig)
  }

  const handleExport = () => {
    const config = enhancedConfigManager.exportAllConfigs()
    if (config) {
      const blob = new Blob([config], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'all-enhanced-log-configs.json'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleExportSingle = (id: string) => {
    const config = enhancedConfigManager.exportConfig(id)
    if (config) {
      const blob = new Blob([config], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `config-${id}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleRemove = (id: string) => {
    enhancedConfigManager.removeConfig(id)
    setImportStatus({ type: 'success', message: '配置已删除' })
    setTimeout(() => setImportStatus({ type: '', message: '' }), 3000)
  }

  const handleClear = () => {
    enhancedConfigManager.clearAllConfigs()
    setImportStatus({ type: 'success', message: '所有配置已清除' })
    setTimeout(() => setImportStatus({ type: '', message: '' }), 3000)
  }

  const handleToggle = (id: string) => {
    enhancedConfigManager.toggleConfig(id)
  }

  const getSeverityClass = (severity?: string) => {
    switch (severity) {
      case 'error': return 'severity-error'
      case 'warning': return 'severity-warning'
      default: return 'severity-info'
    }
  }

  const getDisplayKeyword = (keyword: string) => {
    return keyword.includes(':') ? keyword.split(':').slice(1).join(':') : keyword
  }

  const getConfigName = (keyword: string) => {
    return keyword.includes(':') ? keyword.split(':')[0] : ''
  }

  return (
    <div className={`enhanced-analysis-pane ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="pane-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="header-left">
          <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
          <h3>🤖 智能分析</h3>
          {hasConfig && matchResults.length > 0 && (
            <span className="result-count">{matchResults.length} 个匹配</span>
          )}
        </div>
        <div className="header-right">
          {configs.length > 0 && (
            <span className="config-status">{configs.length} 个配置</span>
          )}
          {onClose && (
            <button className="close-btn" onClick={(e) => { e.stopPropagation(); onClose(); }} title="关闭">
              ✕
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="pane-body">
          <div className="pane-tabs">
            <button 
              className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
              onClick={() => setActiveTab('results')}
            >
              匹配结果
            </button>
            <button 
              className={`tab-btn ${activeTab === 'configs' ? 'active' : ''}`}
              onClick={() => setActiveTab('configs')}
            >
              配置管理 ({configs.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
              onClick={() => setActiveTab('guide')}
            >
              使用指南
            </button>
          </div>

          {activeTab === 'results' && (
            <div className="results-tab">
              {!hasConfig ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <p>请先导入JSON配置文件</p>
                  <button className="primary-btn" onClick={() => setActiveTab('configs')}>
                    导入配置
                  </button>
                </div>
              ) : matchResults.length === 0 ? (
                <div className="empty-state success">
                  <div className="empty-icon">✅</div>
                  <p>未检测到任何匹配项</p>
                  <p className="hint">日志内容中未找到配置文件中的关键字</p>
                </div>
              ) : (
                <div className="results-content">
                  <div className="statistics">
                    <div className="stat-item">
                      <span className="stat-label">总计</span>
                      <span className="stat-value">{statistics.total}</span>
                    </div>
                    <div className="stat-item error">
                      <span className="stat-label">错误</span>
                      <span className="stat-value">{statistics.bySeverity.errors}</span>
                    </div>
                    <div className="stat-item warning">
                      <span className="stat-label">警告</span>
                      <span className="stat-value">{statistics.bySeverity.warnings}</span>
                    </div>
                    <div className="stat-item info">
                      <span className="stat-label">信息</span>
                      <span className="stat-value">{statistics.bySeverity.infos}</span>
                    </div>
                  </div>

                  <div className="results-list">
                    {matchResults.map((result) => (
                      <div key={result.id} className={`result-item ${getSeverityClass(result.severity)}`}>
                        <div className="result-header">
                          <span className="line-number">行 {result.line}</span>
                          <span className={`severity-badge ${getSeverityClass(result.severity)}`}>
                            {result.severity || 'info'}
                          </span>
                          {getConfigName(result.keyword) && (
                            <span className="config-name">[{getConfigName(result.keyword)}]</span>
                          )}
                          <span className="keyword">{getDisplayKeyword(result.keyword)}</span>
                        </div>
                        <div className="result-context">{result.context}</div>
                        <div className="result-details">
                          {result.filePath && (
                            <div className="detail-item">
                              <span className="detail-label">📁 文件路径:</span>
                              <span className="detail-value">{result.filePath}</span>
                            </div>
                          )}
                          {result.apiName && (
                            <div className="detail-item">
                              <span className="detail-label">🔌 API名称:</span>
                              <span className="detail-value">{result.apiName}</span>
                            </div>
                          )}
                          {result.branch && (
                            <div className="detail-item">
                              <span className="detail-label">🌿 异常分支:</span>
                              <span className="detail-value">{result.branch}</span>
                            </div>
                          )}
                          {result.mode && (
                            <div className="detail-item">
                              <span className="detail-label">📐 所属模式:</span>
                              <span className="detail-value">{result.mode}</span>
                            </div>
                          )}
                          <div className="detail-item suggestion">
                            <span className="detail-label">💡 处理建议:</span>
                            <span className="detail-value">{result.suggestion}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'configs' && (
            <div className="configs-tab">
              <div className="config-actions">
                <button className="action-btn" onClick={() => setShowImport(true)}>
                  📥 导入JSON配置
                </button>
                {configs.length > 0 && (
                  <>
                    <button className="action-btn" onClick={handleExport}>
                      📤 导出所有配置
                    </button>
                    <button className="action-btn danger" onClick={handleClear}>
                      🗑️ 清除全部
                    </button>
                  </>
                )}
              </div>

              {showImport && (
                <div className="import-panel">
                  <div className="import-header">
                    <h4>导入JSON配置文件</h4>
                    <button className="close-btn" onClick={() => setShowImport(false)}>✕</button>
                  </div>
                  <textarea
                    className="import-textarea"
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="请粘贴JSON配置内容..."
                    rows={15}
                  />
                  <div className="import-actions">
                    <button className="secondary-btn" onClick={handleLoadSample}>
                      加载示例配置
                    </button>
                    <button className="primary-btn" onClick={handleImport}>
                      确认导入
                    </button>
                  </div>
                </div>
              )}

              {importStatus.type && (
                <div className={`import-status ${importStatus.type}`}>
                  {importStatus.type === 'success' && '✅ '}
                  {importStatus.type === 'error' && '❌ '}
                  {importStatus.type === 'warning' && '⚠️ '}
                  {importStatus.message}
                </div>
              )}

              {configs.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📁</div>
                  <p>暂无配置文件</p>
                  <p className="hint">点击"导入JSON配置"按钮添加第一个配置</p>
                </div>
              ) : (
                <div className="config-list">
                  <h4>已导入的配置 ({configs.length})</h4>
                  {configs.map((config) => (
                    <div 
                      key={config.id} 
                      className={`config-item ${!config.enabled ? 'disabled' : ''}`}
                    >
                      <div className="config-info">
                        <div className="config-name-row">
                          <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={() => handleToggle(config.id)}
                            title={config.enabled ? '点击禁用' : '点击启用'}
                          />
                          <span className="config-name">{config.name}</span>
                          <span className="config-version">v{config.config.version}</span>
                        </div>
                        <div className="config-stats">
                          <span>📁 {config.config.repository.files.length} 文件</span>
                          <span>🔌 {config.config.apis.length} API</span>
                          <span>🌿 {config.config.branches.length} 分支</span>
                          <span>🔑 {config.config.exceptionKeywords.length + config.config.logKeywords.length} 关键字</span>
                        </div>
                      </div>
                      <div className="config-actions-row">
                        <button 
                          className="small-btn" 
                          onClick={() => handleExportSingle(config.id)}
                          title="导出此配置"
                        >
                          📤
                        </button>
                        <button 
                          className="small-btn danger" 
                          onClick={() => handleRemove(config.id)}
                          title="删除此配置"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="guide-tab">
              <div className="guide-section">
                <h4>📖 功能介绍</h4>
                <p>智能分析功能通过JSON配置文件定义代码仓库结构、API信息、分支信息和关键字映射，实现自动化问题定位和排查。</p>
                <p>支持同时导入多个配置文件，所有启用的配置将同时参与匹配。</p>
              </div>

              <div className="guide-section">
                <h4>📝 配置格式</h4>
                <p>配置文件应包含以下内容：</p>
                <ul>
                  <li><strong>repository</strong>: 代码仓库信息</li>
                  <li><strong>apis</strong>: API接口列表</li>
                  <li><strong>branches</strong>: 异常分支定义</li>
                  <li><strong>exceptionKeywords</strong>: 异常场景关键字</li>
                  <li><strong>logKeywords</strong>: 关键日志关键字</li>
                </ul>
              </div>

              <div className="guide-section">
                <h4>🔧 多配置管理</h4>
                <ul>
                  <li>可以导入多个JSON配置文件</li>
                  <li>通过勾选/取消勾选来启用/禁用单个配置</li>
                  <li>只有启用的配置会参与匹配</li>
                  <li>支持导出单个或所有配置</li>
                  <li>可以删除不需要的配置</li>
                </ul>
              </div>

              <div className="guide-section">
                <h4>⚠️ 注意事项</h4>
                <ul>
                  <li>导入配置后，打开日志文件会自动进行匹配</li>
                  <li>如果存在关键字冲突，系统会给出警告</li>
                  <li>配置会保存在浏览器本地存储中</li>
                  <li>支持导出配置以便分享和复用</li>
                  <li>多个配置中的相同关键字都会被匹配</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EnhancedAnalysisPane

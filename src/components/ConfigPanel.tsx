import React, { useState } from 'react'
import { SystemConfig, defaultSystemConfig } from '../types'
import './ConfigPanel.css'

interface ConfigPanelProps {
  currentConfig: SystemConfig
  onConfigLoad: (config: SystemConfig) => void
  onExport: () => void
  onClose?: () => void
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  currentConfig,
  onConfigLoad,
  onExport,
  onClose
}) => {
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' })
  const [showConfig, setShowConfig] = useState(false)

  const handleImport = async () => {
    try {
      const result = await window.electronAPI.loadJson()
      
      if (result) {
        if (result.success) {
          const parsed = JSON.parse(result.content)

          const newConfig: SystemConfig = {
            errorKeywords: parsed.errorKeywords || defaultSystemConfig.errorKeywords,
            floodFilter: {
              ...defaultSystemConfig.floodFilter,
              ...parsed.floodFilter
            },
            syntaxCheck: {
              ...defaultSystemConfig.syntaxCheck,
              ...parsed.syntaxCheck
            }
          }

          onConfigLoad(newConfig)
          setImportStatus({ type: 'success', message: '配置文件导入成功！' })
          setTimeout(() => setImportStatus({ type: '', message: '' }), 3000)
        } else {
          setImportStatus({ type: 'error', message: result.error || '导入失败' })
        }
      }
    } catch (err) {
      setImportStatus({ type: 'error', message: 'JSON解析错误' })
    }
  }

  return (
    <div className="config-panel">
      <div className="config-header">
        <h3>⚙️ 系统配置</h3>
        <div className="config-controls">
          <button className="import-btn" onClick={handleImport}>
            导入JSON配置
          </button>
          <button className="export-btn" onClick={onExport}>
            导出当前配置
          </button>
          <button 
            className={`toggle-btn ${showConfig ? 'active' : ''}`}
            onClick={() => setShowConfig(!showConfig)}
          >
            {showConfig ? '隐藏配置' : '查看配置'}
          </button>
          {onClose && (
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
      </div>

      {importStatus.type && (
        <div className={`import-status ${importStatus.type}`}>
          {importStatus.type === 'success' ? '✅' : '❌'} {importStatus.message}
        </div>
      )}

      <div className="config-tabs">
        <button 
          className="tab-btn active"
        >
          常规设置
        </button>
      </div>

      <div className="config-body">
        {!showConfig ? (
            <div className="config-intro">
              <h4>JSON配置文件说明</h4>
              <p>通过JSON配置文件可以统一管理系统各项配置，无需修改代码即可调整功能参数。</p>
              
              <div className="config-features">
                <div className="feature-item">
                  <span className="feature-icon">🔑</span>
                  <div className="feature-text">
                    <strong>错误关键字配置</strong>
                    <span>自定义错误关键字和描述信息</span>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🚫</span>
                  <div className="feature-text">
                    <strong>刷屏过滤配置</strong>
                    <span>设置时间窗口和次数阈值</span>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🔍</span>
                  <div className="feature-text">
                    <strong>语法检查配置</strong>
                    <span>配置语法检查的语言和选项</span>
                  </div>
                </div>
              </div>

              <button className="primary-btn" onClick={handleImport}>
                选择JSON文件导入
              </button>
            </div>
          ) : (
            <div className="config-preview">
              <h4>当前配置</h4>
              <pre className="config-json">
                {JSON.stringify(currentConfig, null, 2)}
              </pre>
            </div>
          )}
      </div>
    </div>
  )
}

export default ConfigPanel

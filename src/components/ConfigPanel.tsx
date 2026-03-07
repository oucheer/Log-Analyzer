import React, { useState } from 'react'
import { SystemConfig, defaultSystemConfig } from '../types'
import './ConfigPanel.css'

interface ConfigPanelProps {
  currentConfig: SystemConfig
  onConfigLoad: (config: SystemConfig) => void
  onExport: () => void
  onClose?: () => void
  onScrollSpeedChange?: (speed: number) => void
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  currentConfig,
  onConfigLoad,
  onExport,
  onClose,
  onScrollSpeedChange
}) => {
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' })
  const [showConfig, setShowConfig] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'mouse'>('general')

  const mouseWheelConfig = currentConfig.mouseWheel || defaultSystemConfig.mouseWheel

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
            },
            mouseWheel: {
              ...defaultSystemConfig.mouseWheel,
              ...parsed.mouseWheel
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

  const handleOSSyncToggle = (checked: boolean) => {
    const newConfig = {
      ...currentConfig,
      mouseWheel: {
        ...mouseWheelConfig,
        syncOS: checked,
        speed: checked ? 1 : mouseWheelConfig.speed
      }
    }
    onConfigLoad(newConfig)
    if (onScrollSpeedChange) {
      onScrollSpeedChange(checked ? 1 : mouseWheelConfig.speed)
    }
  }

  const handleSpeedChange = (speed: number) => {
    const newConfig = {
      ...currentConfig,
      mouseWheel: {
        ...mouseWheelConfig,
        speed,
        syncOS: false
      }
    }
    onConfigLoad(newConfig)
    if (onScrollSpeedChange) {
      onScrollSpeedChange(speed)
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
          className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          常规设置
        </button>
        <button 
          className={`tab-btn ${activeTab === 'mouse' ? 'active' : ''}`}
          onClick={() => setActiveTab('mouse')}
        >
          🖱️ 鼠标滚轮
        </button>
      </div>

      <div className="config-body">
        {activeTab === 'general' ? (
          !showConfig ? (
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
          )
        ) : (
          <div className="mouse-wheel-settings">
            <div className="setting-section">
              <h4>🖱️ 鼠标滚轮速度设置</h4>
              <p className="setting-description">
                调整日志查看器的滚动速度，使其与您的使用习惯匹配。
              </p>
              
              <div className="setting-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={mouseWheelConfig.syncOS}
                    onChange={(e) => handleOSSyncToggle(e.target.checked)}
                  />
                  <span className="checkbox-text">
                    <strong>跟随系统设置</strong>
                    <span>与Windows/Mac滚轮速度保持一致</span>
                  </span>
                </label>
              </div>

              <div className={`setting-row ${mouseWheelConfig.syncOS ? 'disabled' : ''}`}>
                <label>
                  <strong>自定义速度</strong>
                  <span>调整滚动速度倍率 (0.1x - 3.0x)</span>
                </label>
                <div className="speed-control">
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={mouseWheelConfig.speed}
                    onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                    disabled={mouseWheelConfig.syncOS}
                  />
                  <span className="speed-value">{mouseWheelConfig.speed.toFixed(1)}x</span>
                </div>
              </div>

              <div className="speed-presets">
                <span className="presets-label">快捷预设:</span>
                <button 
                  className="preset-btn"
                  onClick={() => handleSpeedChange(0.5)}
                  disabled={mouseWheelConfig.syncOS}
                >
                  慢速
                </button>
                <button 
                  className="preset-btn"
                  onClick={() => handleSpeedChange(1)}
                  disabled={mouseWheelConfig.syncOS}
                >
                  正常
                </button>
                <button 
                  className="preset-btn"
                  onClick={() => handleSpeedChange(2)}
                  disabled={mouseWheelConfig.syncOS}
                >
                  快速
                </button>
                <button 
                  className="preset-btn"
                  onClick={() => handleSpeedChange(3)}
                  disabled={mouseWheelConfig.syncOS}
                >
                  极速
                </button>
              </div>
            </div>

            <div className="setting-tips">
              <h5>💡 使用建议</h5>
              <ul>
                <li>跟随系统设置适用于与系统其他应用保持一致的体验</li>
                <li>处理大型日志文件时，建议使用较慢的速度以便精确定位</li>
                <li>快速预览模式可使用较高的速度值提高浏览效率</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ConfigPanel

import React, { useState } from 'react'
import { FloodStats } from '../types'
import './FloodFilterPanel.css'

interface FloodFilterPanelProps {
  config: {
    enabled: boolean
    timeWindowMs: number
    countThreshold: number
    maxConsecutiveFlood: number
  }
  onConfigChange: (config: any) => void
  stats: FloodStats | null
  onClose?: () => void
}

const FloodFilterPanel: React.FC<FloodFilterPanelProps> = ({ config, onConfigChange, stats, onClose }) => {
  const [localConfig, setLocalConfig] = useState(config)

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...localConfig, [key]: value }
    setLocalConfig(newConfig)
    onConfigChange(newConfig)
  }

  const formatNumber = (num: number): string => num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString()

  return (
    <div className="flood-panel">
      <div className="flood-header">
        <h3>🚫 刷屏过滤</h3>
        <div className="flood-controls">
          <label className="toggle-label">
            <input type="checkbox" checked={localConfig.enabled} onChange={(e) => handleConfigChange('enabled', e.target.checked)} />
            <span>启用过滤</span>
          </label>
          {onClose && <button className="close-btn" onClick={onClose}>✕</button>}
        </div>
      </div>

      <div className="flood-body">
        <div className="config-section">
          <h4>过滤规则配置</h4>
          <div className="config-item">
            <label>时间窗口 (ms)</label>
            <input type="number" value={localConfig.timeWindowMs} onChange={(e) => handleConfigChange('timeWindowMs', parseInt(e.target.value) || 1000)} min={100} max={60000} disabled={!localConfig.enabled} />
            <span className="config-hint">在此时间范围内出现相同内容的次数达到阈值则视为刷屏</span>
          </div>
          <div className="config-item">
            <label>次数阈值</label>
            <input type="number" value={localConfig.countThreshold} onChange={(e) => handleConfigChange('countThreshold', parseInt(e.target.value) || 5)} min={2} max={100} disabled={!localConfig.enabled} />
            <span className="config-hint">相同内容在时间窗口内出现此次数则被识别为刷屏</span>
          </div>
        </div>

        {stats && localConfig.enabled && (
          <div className="stats-section">
            <h4>过滤统计</h4>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-value">{formatNumber(stats.totalLines)}</div><div className="stat-label">总行数</div></div>
              <div className="stat-card"><div className="stat-value">{formatNumber(stats.filteredLines)}</div><div className="stat-label">过滤行数</div></div>
              <div className="stat-card"><div className="stat-value">{stats.uniqueFloodPatterns}</div><div className="stat-label">刷屏模式</div></div>
              <div className="stat-card"><div className="stat-value">{stats.totalLines > 0 ? Math.round((stats.filteredLines / stats.totalLines) * 100) : 0}%</div><div className="stat-label">过滤率</div></div>
            </div>
          </div>
        )}

        {!localConfig.enabled && <div className="disabled-notice"><span>🚫 刷屏过滤已禁用</span><p>启用过滤后，系统将自动识别并过滤重复刷屏的日志内容</p></div>}
      </div>
    </div>
  )
}

export default FloodFilterPanel

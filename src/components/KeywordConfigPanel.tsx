import React, { useState, useEffect } from 'react'
import { KeywordConfig, CompareReport, ConfigVersion, AuditLog } from '../types'
import { keywordConfigManager } from '../utils/KeywordConfigManager'
import { compareEngine } from '../utils/CompareEngine'
import './KeywordConfigPanel.css'

interface KeywordConfigPanelProps {
  onClose?: () => void
}

const KeywordConfigPanel: React.FC<KeywordConfigPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'compare' | 'history' | 'audit'>('manage')
  const [configs, setConfigs] = useState<KeywordConfig[]>([])
  const [selectedConfig, setSelectedConfig] = useState<KeywordConfig | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<KeywordConfig>>({})
  const [inputContent, setInputContent] = useState('')
  const [compareReport, setCompareReport] = useState<CompareReport | null>(null)
  const [versions, setVersions] = useState<ConfigVersion[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showHelp, setShowHelp] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    keywordConfigManager.loadFromStorage()
    refreshData()
  }, [])

  const refreshData = () => {
    setConfigs(keywordConfigManager.getAll())
    setVersions(keywordConfigManager.getVersions())
    setAuditLogs(keywordConfigManager.getAuditLogs())
    keywordConfigManager.saveToStorage()
  }

  const toggleHelp = (section: string) => {
    setShowHelp(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleAdd = () => {
    setSelectedConfig(null)
    setEditForm({ keyword: '', expectedResult: '', description: '', category: '默认', enabled: true })
    setIsEditing(true)
  }

  const handleEdit = (config: KeywordConfig) => {
    setSelectedConfig(config)
    setEditForm({ ...config })
    setIsEditing(true)
  }

  const handleSave = () => {
    if (!editForm.keyword || !editForm.expectedResult) {
      setImportStatus({ type: 'error', message: '⚠️ 关键字和预期结果为必填项，请填写完整' })
      setTimeout(() => setImportStatus(null), 3000)
      return
    }

    if (selectedConfig) {
      keywordConfigManager.update(selectedConfig.id, editForm)
    } else {
      keywordConfigManager.add(editForm as Omit<KeywordConfig, 'id' | 'createdAt' | 'updatedAt'>)
    }

    refreshData()
    setIsEditing(false)
    setImportStatus({ type: 'success', message: '✅ 配置已保存' })
    setTimeout(() => setImportStatus(null), 3000)
  }

  const handleDelete = (id: string) => {
    const config = configs.find(c => c.id === id)
    if (confirm(`确定要删除关键字 "${config?.keyword}" 吗？此操作不可撤销。`)) {
      keywordConfigManager.delete(id)
      refreshData()
      setImportStatus({ type: 'success', message: '✅ 配置已删除' })
      setTimeout(() => setImportStatus(null), 3000)
    }
  }

  const handleCompare = () => {
    if (!inputContent.trim()) {
      setImportStatus({ type: 'error', message: '⚠️ 请输入要对比的内容' })
      setTimeout(() => setImportStatus(null), 3000)
      return
    }

    const report = compareEngine.compare(inputContent)
    setCompareReport(report)
    keywordConfigManager.addAuditLog('compare', 'bulk', `执行对比，匹配${report.totalMatches}个关键字`)
    refreshData()
  }

  const handleImportJSON = async () => {
    const result = await window.electronAPI.loadJson()
    if (result && result.success) {
      const importResult = keywordConfigManager.importFromJSON(result.content)
      if (importResult.success) {
        refreshData()
        setImportStatus({ type: 'success', message: `✅ 成功导入 ${importResult.count} 条配置` })
      } else {
        setImportStatus({ type: 'error', message: `❌ ${importResult.error || '导入失败'}` })
      }
    }
    setTimeout(() => setImportStatus(null), 3000)
  }

  const handleExportJSON = async () => {
    const data = keywordConfigManager.exportToJSON()
    await window.electronAPI.saveJson(JSON.parse(data), 'keyword-config.json')
    keywordConfigManager.addAuditLog('export', 'bulk', '导出JSON配置')
    refreshData()
    setImportStatus({ type: 'success', message: '✅ 配置已导出为JSON' })
    setTimeout(() => setImportStatus(null), 3000)
  }

  const handleExportCSV = async () => {
    const data = keywordConfigManager.exportToCSV()
    await window.electronAPI.saveLog(data, 'keyword-config.csv')
    keywordConfigManager.addAuditLog('export', 'bulk', '导出CSV配置')
    refreshData()
    setImportStatus({ type: 'success', message: '✅ 配置已导出为CSV' })
    setTimeout(() => setImportStatus(null), 3000)
  }

  const handleRestore = (version: number) => {
    if (confirm(`确定要恢复到版本 ${version} 吗？当前配置将被覆盖。`)) {
      keywordConfigManager.restoreVersion(version)
      refreshData()
      setImportStatus({ type: 'success', message: `✅ 已恢复到版本 ${version}` })
      setTimeout(() => setImportStatus(null), 3000)
    }
  }

  const filteredConfigs = searchKeyword
    ? configs.filter(c => c.keyword.toLowerCase().includes(searchKeyword.toLowerCase()))
    : configs

  return (
    <div className="keyword-panel">
      <div className="panel-header">
        <h3>🔑 关键字配置管理系统</h3>
        <div className="header-controls">
          <div className="tab-selector">
            <button className={activeTab === 'manage' ? 'active' : ''} onClick={() => setActiveTab('manage')}>配置管理</button>
            <button className={activeTab === 'compare' ? 'active' : ''} onClick={() => setActiveTab('compare')}>对比测试</button>
            <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>版本历史</button>
            <button className={activeTab === 'audit' ? 'active' : ''} onClick={() => setActiveTab('audit')}>审计日志</button>
          </div>
          {onClose && <button className="close-btn" onClick={onClose}>✕</button>}
        </div>
      </div>

      {importStatus && (
        <div className={`status-message ${importStatus.type}`}>
          {importStatus.message}
        </div>
      )}

      <div className="panel-body">
        {activeTab === 'manage' && (
          <div className="manage-section">
            <div className="section-header">
              <div className="section-title">
                <h4>配置列表</h4>
                <button className="help-btn" onClick={() => toggleHelp('manage')}>❓ 帮助</button>
              </div>
              {showHelp.manage && (
                <div className="help-panel">
                  <p><strong>功能说明：</strong></p>
                  <ul>
                    <li><strong>添加配置：</strong>点击"➕ 添加"按钮创建新的关键字匹配规则</li>
                    <li><strong>编辑配置：</strong>点击 ✏️ 图标修改已有配置</li>
                    <li><strong>删除配置：</strong>点击 🗑️ 图标删除配置（不可撤销）</li>
                    <li><strong>搜索：</strong>在搜索框中输入关键字进行快速检索</li>
                    <li><strong>导入/导出：</strong>支持JSON和CSV格式的批量导入导出</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="toolbar-section">
              <input
                type="text"
                placeholder="🔍 搜索关键字..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="search-input"
              />
              <button className="action-btn primary" onClick={handleAdd}>➕ 添加配置</button>
              <button className="action-btn" onClick={handleImportJSON}>📥 导入</button>
              <button className="action-btn" onClick={handleExportJSON}>📤 导出</button>
            </div>

            {isEditing ? (
              <div className="edit-form">
                <div className="form-header">
                  <h4>{selectedConfig ? '✏️ 编辑配置' : '➕ 新增配置'}</h4>
                  <button className="cancel-btn" onClick={() => setIsEditing(false)}>取消</button>
                </div>
                
                <div className="form-section">
                  <div className="form-section-title">基本信息 <span className="required">*必填</span></div>
                  <div className="form-group">
                    <label>关键字 <span className="required">*</span></label>
                    <input 
                      type="text" 
                      value={editForm.keyword || ''} 
                      onChange={(e) => setEditForm({ ...editForm, keyword: e.target.value })} 
                      placeholder="输入要匹配的关键字，支持正则表达式"
                    />
                    <span className="form-hint">在日志内容中查找的关键字</span>
                  </div>
                  <div className="form-group">
                    <label>预期结果 <span className="required">*</span></label>
                    <input 
                      type="text" 
                      value={editForm.expectedResult || ''} 
                      onChange={(e) => setEditForm({ ...editForm, expectedResult: e.target.value })} 
                      placeholder="匹配成功后期望的结果"
                    />
                    <span className="form-hint">用于与实际内容对比的期望值</span>
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section-title">附加信息</div>
                  <div className="form-group">
                    <label>描述说明</label>
                    <textarea 
                      value={editForm.description || ''} 
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} 
                      placeholder="描述此配置的用途和处理建议..."
                      rows={2}
                    />
                  </div>
                  <div className="form-group">
                    <label>分类标签</label>
                    <input 
                      type="text" 
                      value={editForm.category || ''} 
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} 
                      placeholder="如：错误类、警告类、信息类"
                    />
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section-title">控制选项</div>
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={editForm.enabled ?? true} 
                        onChange={(e) => setEditForm({ ...editForm, enabled: e.target.checked })} 
                      />
                      <span className="checkbox-text">
                        <strong>启用此配置</strong>
                        <span className="checkbox-hint">关闭后该规则将不会参与匹配</span>
                      </span>
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="action-btn primary large" onClick={handleSave}>💾 保存配置</button>
                </div>
              </div>
            ) : (
              <div className="config-list">
                <div className="config-stats">
                  <span>共 {filteredConfigs.length} 条配置</span>
                  <span>启用: {filteredConfigs.filter(c => c.enabled).length}</span>
                  <span>禁用: {filteredConfigs.filter(c => !c.enabled).length}</span>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>关键字</th>
                      <th>预期结果</th>
                      <th>分类</th>
                      <th>状态</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredConfigs.map(config => (
                      <tr key={config.id} className={!config.enabled ? 'disabled-row' : ''}>
                        <td className="keyword-cell">{config.keyword}</td>
                        <td className="result-cell">{config.expectedResult}</td>
                        <td><span className="category-badge">{config.category}</span></td>
                        <td>
                          <span className={`status-badge ${config.enabled ? 'enabled' : 'disabled'}`}>
                            {config.enabled ? '✓ 启用' : '✕ 禁用'}
                          </span>
                        </td>
                        <td>
                          <button className="icon-btn" title="编辑" onClick={() => handleEdit(config)}>✏️</button>
                          <button className="icon-btn danger" title="删除" onClick={() => handleDelete(config.id)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredConfigs.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <p>暂无配置</p>
                    <p className="empty-hint">点击"➕ 添加配置"开始创建匹配规则</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'compare' && (
          <div className="compare-section">
            <div className="section-header">
              <div className="section-title">
                <h4>对比测试</h4>
                <button className="help-btn" onClick={() => toggleHelp('compare')}>❓ 帮助</button>
              </div>
              {showHelp.compare && (
                <div className="help-panel">
                  <p><strong>功能说明：</strong></p>
                  <ul>
                    <li><strong>输入内容：</strong>在下方文本框中粘贴或输入要测试的日志内容</li>
                    <li><strong>开始对比：</strong>系统将自动匹配所有已启用的关键字配置</li>
                    <li><strong>查看结果：</strong>匹配结果会显示符合/不符合状态，以及实际值与预期值的差异</li>
                    <li><strong>通过率：</strong>显示匹配成功的百分比</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="input-section">
              <label>📝 输入测试内容</label>
              <textarea 
                value={inputContent} 
                onChange={(e) => setInputContent(e.target.value)} 
                placeholder="在此输入或粘贴要对比的日志内容..."
                className="compare-input"
              />
              <button className="action-btn primary large" onClick={handleCompare}>
                🔍 开始对比分析
              </button>
            </div>

            {compareReport && (
              <div className="report-section">
                <div className="report-header">
                  <h4>📊 对比结果报告</h4>
                  <div className="report-timestamp">生成时间: {new Date(compareReport.generatedAt).toLocaleString()}</div>
                </div>

                <div className="report-summary">
                  <div className="summary-card total">
                    <div className="summary-value">{compareReport.totalMatches}</div>
                    <div className="summary-label">匹配总数</div>
                  </div>
                  <div className="summary-card success">
                    <div className="summary-value">{compareReport.passedMatches}</div>
                    <div className="summary-label">✅ 符合</div>
                  </div>
                  <div className="summary-card error">
                    <div className="summary-value">{compareReport.failedMatches}</div>
                    <div className="summary-label">❌ 不符合</div>
                  </div>
                  <div className="summary-card rate">
                    <div className="summary-value">{compareReport.passRate}%</div>
                    <div className="summary-label">通过率</div>
                  </div>
                </div>

                <div className="match-list">
                  <div className="match-list-title">详细匹配结果 ({compareReport.matches.length})</div>
                  {compareReport.matches.map((match, idx) => (
                    <div key={idx} className={`match-item ${match.isMatch ? 'pass' : 'fail'}`}>
                      <div className="match-header">
                        <span className="match-keyword">
                          <span className="match-icon">{match.isMatch ? '✅' : '❌'}</span>
                          {match.keyword.keyword}
                        </span>
                        <span className={`match-status ${match.isMatch ? 'pass' : 'fail'}`}>
                          {match.isMatch ? '符合预期' : '不符合'}
                        </span>
                      </div>
                      <div className="match-details">
                        <div className="detail-row">
                          <span className="detail-label">预期结果:</span>
                          <span className="detail-value expected">{match.keyword.expectedResult}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">实际结果:</span>
                          <span className="detail-value actual">{match.actualResult}</span>
                        </div>
                        {!match.isMatch && match.difference && (
                          <div className="detail-row difference">
                            <span className="detail-label">差异:</span>
                            <span className="detail-value">{match.difference}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {compareReport.matches.length === 0 && (
                    <div className="empty-state">
                      <div className="empty-icon">🔍</div>
                      <p>未匹配到任何关键字</p>
                      <p className="empty-hint">请检查输入内容或确认配置已启用</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-section">
            <div className="section-header">
              <div className="section-title">
                <h4>版本历史</h4>
                <button className="help-btn" onClick={() => toggleHelp('history')}>❓ 帮助</button>
              </div>
              {showHelp.history && (
                <div className="help-panel">
                  <p><strong>功能说明：</strong></p>
                  <ul>
                    <li><strong>版本列表：</strong>显示所有配置变更的历史记录</li>
                    <li><strong>恢复版本：</strong>点击"恢复"按钮可将配置恢复到指定版本</li>
                    <li><strong>版本信息：</strong>显示版本号、创建时间、操作人和变更描述</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="version-list">
              {[...versions].reverse().map(version => (
                <div key={version.id} className="version-card">
                  <div className="version-header">
                    <span className="version-badge">V{version.version}</span>
                    <span className="version-time">🕐 {new Date(version.createdAt).toLocaleString()}</span>
                    <span className="version-user">👤 {version.createdBy}</span>
                  </div>
                  <div className="version-desc">{version.description}</div>
                  <div className="version-stats">
                    <span>📋 {version.configs.length} 条配置</span>
                    <span>启用: {version.configs.filter(c => c.enabled).length}</span>
                  </div>
                  <button className="action-btn restore-btn" onClick={() => handleRestore(version.version)}>
                    ↩️ 恢复到此版本
                  </button>
                </div>
              ))}
              {versions.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📜</div>
                  <p>暂无版本历史</p>
                  <p className="empty-hint">配置变更后会自动保存版本</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="audit-section">
            <div className="section-header">
              <div className="section-title">
                <h4>审计日志</h4>
                <button className="help-btn" onClick={() => toggleHelp('audit')}>❓ 帮助</button>
              </div>
              {showHelp.audit && (
                <div className="help-panel">
                  <p><strong>功能说明：</strong></p>
                  <ul>
                    <li><strong>操作记录：</strong>记录所有配置管理操作</li>
                    <li><strong>日志类型：</strong>包括创建、更新、删除、导入、导出、对比</li>
                    <li><strong>追溯功能：</strong>可追溯到具体的操作人、时间和变更详情</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="audit-list">
              <div className="audit-header">
                <span className="audit-col-action">操作类型</span>
                <span className="audit-col-target">操作对象</span>
                <span className="audit-col-details">详情</span>
                <span className="audit-col-user">操作人</span>
                <span className="audit-col-time">时间</span>
              </div>
              {[...auditLogs].reverse().map(log => (
                <div key={log.id} className="audit-row">
                  <span className={`audit-action ${log.action}`}>{log.action}</span>
                  <span className="audit-target">{log.target}</span>
                  <span className="audit-details">{log.details}</span>
                  <span className="audit-user">{log.operator}</span>
                  <span className="audit-time">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <p>暂无审计日志</p>
                  <p className="empty-hint">操作记录将显示在这里</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default KeywordConfigPanel

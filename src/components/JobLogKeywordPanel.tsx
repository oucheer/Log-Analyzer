import React, { useState, useEffect, useCallback } from 'react'
import { JobLogKeyword, JobLogExtractResult } from '../types'
import { jobLogManager } from '../utils/JobLogManager'
import './JobLogKeywordPanel.css'

interface JobLogKeywordPanelProps {
  isVisible: boolean
  onClose: () => void
  content?: string
  onExtract?: (result: JobLogExtractResult) => void
}

const JobLogKeywordPanel: React.FC<JobLogKeywordPanelProps> = ({
  isVisible,
  onClose,
  content,
  onExtract
}) => {
  const [keywords, setKeywords] = useState<JobLogKeyword[]>([])
  const [newKeyword, setNewKeyword] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editKeyword, setEditKeyword] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'keywords' | 'extract' | 'test'>('keywords')
  const [testContent, setTestContent] = useState('')
  const [extractResult, setExtractResult] = useState<JobLogExtractResult | null>(null)

  const refreshKeywords = useCallback(() => {
    setKeywords(jobLogManager.getKeywords())
  }, [])

  useEffect(() => {
    if (isVisible) {
      refreshKeywords()
    }
  }, [isVisible, refreshKeywords])

  useEffect(() => {
    if (content) {
      setTestContent(content)
    }
  }, [content])

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) {
      showMessage('error', '请输入关键字')
      return
    }

    const result = jobLogManager.addKeyword(newKeyword, newDescription)
    if (result) {
      showMessage('success', '关键字添加成功')
      setNewKeyword('')
      setNewDescription('')
      refreshKeywords()
    } else {
      showMessage('error', '关键字已存在或添加失败')
    }
  }

  const handleDeleteKeyword = (id: string) => {
    if (jobLogManager.removeKeyword(id)) {
      showMessage('success', '关键字删除成功')
      refreshKeywords()
    } else {
      showMessage('error', '删除失败')
    }
  }

  const handleStartEdit = (keyword: JobLogKeyword) => {
    setEditingId(keyword.id)
    setEditKeyword(keyword.keyword)
    setEditDescription(keyword.description)
  }

  const handleSaveEdit = () => {
    if (!editingId) return

    if (!editKeyword.trim()) {
      showMessage('error', '关键字不能为空')
      return
    }

    if (jobLogManager.updateKeyword(editingId, {
      keyword: editKeyword,
      description: editDescription
    })) {
      showMessage('success', '关键字更新成功')
      setEditingId(null)
      refreshKeywords()
    } else {
      showMessage('error', '更新失败，可能存在重复关键字')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditKeyword('')
    setEditDescription('')
  }

  const handleToggleKeyword = (id: string) => {
    if (jobLogManager.toggleKeyword(id)) {
      refreshKeywords()
    }
  }

  const handleTestExtract = () => {
    if (!testContent.trim()) {
      showMessage('error', '请输入测试内容')
      return
    }

    const result = jobLogManager.extractLastJobLog(testContent)
    setExtractResult(result)
    setActiveTab('extract')
  }

  const handleApplyExtract = () => {
    if (extractResult && onExtract) {
      onExtract(extractResult)
      showMessage('success', '已应用提取结果')
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const result = jobLogManager.importKeywords(event.target?.result as string)
          if (result.success) {
            showMessage('success', result.message)
            refreshKeywords()
          } else {
            showMessage('error', result.message)
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleExport = () => {
    const data = jobLogManager.exportKeywords()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `job-log-keywords-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    showMessage('success', '导出成功')
  }

  if (!isVisible) return null

  return (
    <div className="joblog-panel-overlay" onClick={onClose}>
      <div className="joblog-panel" onClick={(e) => e.stopPropagation()}>
        <div className="joblog-panel-header">
          <h3>📋 作业日志关键字配置</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="joblog-panel-tabs">
          <button
            className={`tab-btn ${activeTab === 'keywords' ? 'active' : ''}`}
            onClick={() => setActiveTab('keywords')}
          >
            关键字管理
          </button>
          <button
            className={`tab-btn ${activeTab === 'test' ? 'active' : ''}`}
            onClick={() => setActiveTab('test')}
          >
            测试提取
          </button>
          <button
            className={`tab-btn ${activeTab === 'extract' ? 'active' : ''}`}
            onClick={() => setActiveTab('extract')}
          >
            提取结果
          </button>
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.type === 'success' && '✅ '}
            {message.type === 'error' && '❌ '}
            {message.type === 'info' && 'ℹ️ '}
            {message.text}
          </div>
        )}

        <div className="joblog-panel-body">
          {activeTab === 'keywords' && (
            <div className="keywords-tab">
              <div className="add-keyword-section">
                <h4>添加新关键字</h4>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="输入关键字（如：Job started, Task begin）"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                  />
                  <input
                    type="text"
                    placeholder="描述（可选）"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                  />
                  <button className="primary-btn" onClick={handleAddKeyword}>
                    添加
                  </button>
                </div>
              </div>

              <div className="keywords-list-section">
                <div className="section-header">
                  <h4>关键字列表 ({keywords.length})</h4>
                  <div className="actions">
                    <button className="secondary-btn" onClick={handleImport}>
                      📥 导入
                    </button>
                    <button className="secondary-btn" onClick={handleExport} disabled={keywords.length === 0}>
                      📤 导出
                    </button>
                  </div>
                </div>

                {keywords.length === 0 ? (
                  <div className="empty-state">
                    <p>暂无关键字配置</p>
                    <p className="hint">添加关键字以启动作业日志提取功能</p>
                  </div>
                ) : (
                  <div className="keywords-list">
                    {keywords.map((keyword) => (
                      <div key={keyword.id} className={`keyword-item ${!keyword.enabled ? 'disabled' : ''}`}>
                        {editingId === keyword.id ? (
                          <div className="edit-form">
                            <input
                              type="text"
                              value={editKeyword}
                              onChange={(e) => setEditKeyword(e.target.value)}
                              autoFocus
                            />
                            <input
                              type="text"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              placeholder="描述"
                            />
                            <button className="save-btn" onClick={handleSaveEdit}>✓</button>
                            <button className="cancel-btn" onClick={handleCancelEdit}>✕</button>
                          </div>
                        ) : (
                          <>
                            <div className="keyword-info">
                              <input
                                type="checkbox"
                                checked={keyword.enabled}
                                onChange={() => handleToggleKeyword(keyword.id)}
                                title={keyword.enabled ? '点击禁用' : '点击启用'}
                              />
                              <span className="keyword-text">{keyword.keyword}</span>
                              {keyword.description && (
                                <span className="keyword-desc">{keyword.description}</span>
                              )}
                            </div>
                            <div className="keyword-actions">
                              <button
                                className="edit-btn"
                                onClick={() => handleStartEdit(keyword)}
                                title="编辑"
                              >
                                ✏️
                              </button>
                              <button
                                className="delete-btn"
                                onClick={() => handleDeleteKeyword(keyword.id)}
                                title="删除"
                              >
                                🗑️
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'test' && (
            <div className="test-tab">
              <div className="test-section">
                <h4>测试日志提取</h4>
                <p className="hint">
                  输入日志内容测试关键字匹配和提取功能。
                  系统将自动识别最后一次作业的起始位置。
                </p>
                <textarea
                  className="test-textarea"
                  value={testContent}
                  onChange={(e) => setTestContent(e.target.value)}
                  placeholder={`示例日志格式：
[2024-01-01 10:00:00] Job started: Task 1
日志内容...
[2024-01-01 10:05:00] Job completed: Task 1

[2024-01-01 10:10:00] Job started: Task 2
日志内容...
[2024-01-01 10:15:00] Job completed: Task 2`}
                  rows={15}
                />
                <div className="test-actions">
                  <button className="primary-btn" onClick={handleTestExtract}>
                    🔍 测试提取
                  </button>
                  {content && (
                    <button className="secondary-btn" onClick={() => setTestContent(content)}>
                      📋 使用当前日志
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'extract' && (
            <div className="extract-tab">
              {extractResult ? (
                <div className="extract-result">
                  <div className="result-stats">
                    <div className="stat-item">
                      <span className="stat-label">作业总数</span>
                      <span className="stat-value">{extractResult.totalJobs}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">起始行</span>
                      <span className="stat-value">{extractResult.startLine + 1}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">匹配关键字</span>
                      <span className="stat-value">{extractResult.matchedKeyword || '无'}</span>
                    </div>
                  </div>

                  <div className="result-content">
                    <h4>提取的日志内容</h4>
                    <pre className="extracted-log">{extractResult.extractedContent}</pre>
                  </div>

                  {onExtract && (
                    <div className="result-actions">
                      <button className="primary-btn" onClick={handleApplyExtract}>
                        ✅ 应用此提取结果
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  <p>暂无提取结果</p>
                  <p className="hint">请先进行测试提取</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JobLogKeywordPanel

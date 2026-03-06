import React, { useState, useMemo } from 'react'
import { TaskLogEntry, TaskReport } from '../types/taskReport'
import './TaskReportPanel.css'

interface TaskReportPanelProps {
  reports: TaskReport[]
  entries: TaskLogEntry[]
  onSaveLog?: (content: string) => void
  onClose?: () => void
}

const TaskReportPanel: React.FC<TaskReportPanelProps> = ({
  reports,
  entries,
  onSaveLog,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'logs'>('reports')
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    reports.length > 0 ? reports[0].taskId : null
  )
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'success' | 'warning' | 'error'>('all')

  const selectedReport = useMemo(() => {
    return reports.find(r => r.taskId === selectedReportId) || null
  }, [reports, selectedReportId])

  const filteredLogs = useMemo(() => {
    if (logFilter === 'all') return entries
    return entries.filter(entry => entry.level === logFilter)
  }, [entries, logFilter])

  const formatTimestamp = (ts: string): string => {
    return ts.substring(11, 19)
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return 'ℹ️'
      case 'success':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'error':
        return '❌'
      case 'debug':
        return '🔍'
      default:
        return '📝'
    }
  }

  const getLevelClass = (level: string) => {
    switch (level) {
      case 'success':
        return 'log-success'
      case 'warning':
        return 'log-warning'
      case 'error':
        return 'log-error'
      case 'debug':
        return 'log-debug'
      default:
        return 'log-info'
    }
  }

  const handleExportLog = () => {
    const lines: string[] = [
      '='.repeat(60),
      `任务汇报日志 - ${new Date().toLocaleString()}`,
      '='.repeat(60),
      ''
    ]

    reports.forEach(report => {
      lines.push(`【任务: ${report.taskName}】`)
      lines.push(`  任务ID: ${report.taskId}`)
      lines.push(`  开始时间: ${report.startTime}`)
      lines.push(`  结束时间: ${report.endTime || '进行中'}`)
      lines.push(`  状态: ${report.status === 'completed' ? '✅ 完成' : report.status === 'failed' ? '❌ 失败' : '🔄 进行中'}`)
      if (report.summary) {
        lines.push(`  摘要: ${report.summary}`)
      }
      lines.push('')
    })

    lines.push('【详细日志】')
    lines.push('-'.repeat(60))

    filteredLogs.forEach(entry => {
      const timestamp = formatTimestamp(entry.timestamp)
      lines.push(`[${timestamp}] ${getLevelIcon(entry.level)} [${entry.category}] ${entry.message}`)
    })

    lines.push('='.repeat(60))

    if (onSaveLog) {
      onSaveLog(lines.join('\n'))
    }
  }

  return (
    <div className="task-report-panel">
      <div className="panel-header">
        <h3>📋 任务汇报</h3>
        <div className="panel-controls">
          <div className="tab-selector">
            <button
              className={activeTab === 'reports' ? 'active' : ''}
              onClick={() => setActiveTab('reports')}
            >
              任务报告
            </button>
            <button
              className={activeTab === 'logs' ? 'active' : ''}
              onClick={() => setActiveTab('logs')}
            >
              运行日志
            </button>
          </div>
          {onSaveLog && activeTab === 'logs' && (
            <button className="export-btn" onClick={handleExportLog}>
              导出日志
            </button>
          )}
          {onClose && (
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="panel-body">
        {activeTab === 'reports' && (
          <div className="reports-section">
            {reports.length === 0 ? (
              <div className="empty-state">
                <span>📝 暂无任务报告</span>
                <p>系统将自动记录任务执行情况</p>
              </div>
            ) : (
              <>
                <div className="report-list">
                  {reports.map(report => (
                    <div
                      key={report.taskId}
                      className={`report-card ${selectedReportId === report.taskId ? 'selected' : ''}`}
                      onClick={() => setSelectedReportId(report.taskId)}
                    >
                      <div className="report-header">
                        <span className="report-name">{report.taskName}</span>
                        <span className={`report-status status-${report.status}`}>
                          {report.status === 'completed' ? '✅' : report.status === 'failed' ? '❌' : '🔄'}
                        </span>
                      </div>
                      <div className="report-meta">
                        <span>开始: {report.startTime.substring(11, 19)}</span>
                        {report.endTime && (
                          <span>结束: {report.endTime.substring(11, 19)}</span>
                        )}
                      </div>
                      {report.summary && (
                        <div className="report-summary">{report.summary}</div>
                      )}
                    </div>
                  ))}
                </div>

                {selectedReport && (
                  <div className="report-detail">
                    <h4>任务详情</h4>
                    <div className="detail-info">
                      <div className="detail-row">
                        <span className="detail-label">任务ID:</span>
                        <span className="detail-value">{selectedReport.taskId}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">任务名称:</span>
                        <span className="detail-value">{selectedReport.taskName}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">开始时间:</span>
                        <span className="detail-value">{selectedReport.startTime}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">结束时间:</span>
                        <span className="detail-value">{selectedReport.endTime || '进行中'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">状态:</span>
                        <span className={`detail-value status-${selectedReport.status}`}>
                          {selectedReport.status === 'completed' ? '✅ 完成' : 
                           selectedReport.status === 'failed' ? '❌ 失败' : '🔄 进行中'}
                        </span>
                      </div>
                      {selectedReport.summary && (
                        <div className="detail-row">
                          <span className="detail-label">摘要:</span>
                          <span className="detail-value">{selectedReport.summary}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="logs-section">
            <div className="log-filters">
              <button
                className={logFilter === 'all' ? 'active' : ''}
                onClick={() => setLogFilter('all')}
              >
                全部
              </button>
              <button
                className={logFilter === 'info' ? 'active' : ''}
                onClick={() => setLogFilter('info')}
              >
                ℹ️ 信息
              </button>
              <button
                className={logFilter === 'success' ? 'active' : ''}
                onClick={() => setLogFilter('success')}
              >
                ✅ 成功
              </button>
              <button
                className={logFilter === 'warning' ? 'active' : ''}
                onClick={() => setLogFilter('warning')}
              >
                ⚠️ 警告
              </button>
              <button
                className={logFilter === 'error' ? 'active' : ''}
                onClick={() => setLogFilter('error')}
              >
                ❌ 错误
              </button>
            </div>

            <div className="log-list">
              {filteredLogs.length === 0 ? (
                <div className="empty-state">
                  <span>📝 暂无日志</span>
                  <p>操作记录将显示在这里</p>
                </div>
              ) : (
                filteredLogs.map((entry, index) => (
                  <div key={index} className={`log-entry ${getLevelClass(entry.level)}`}>
                    <span className="log-time">{formatTimestamp(entry.timestamp)}</span>
                    <span className="log-icon">{getLevelIcon(entry.level)}</span>
                    <span className="log-category">[{entry.category}]</span>
                    <span className="log-message">{entry.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskReportPanel

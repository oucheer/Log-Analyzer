import { TaskLogEntry, LogLevel, TaskReport, LOG_CATEGORIES, LogCategory } from '../types/taskReport'

class TaskReportLogger {
  private reports: Map<string, TaskReport> = new Map()
  private logEntries: TaskLogEntry[] = []

  private formatTimestamp(): string {
    return new Date().toISOString().replace('T', ' ').substring(0, 19)
  }

  createTask(taskId: string, taskName: string): TaskReport {
    const report: TaskReport = {
      taskId,
      taskName,
      startTime: this.formatTimestamp(),
      status: 'running',
      entries: [],
      summary: ''
    }
    this.reports.set(taskId, report)
    this.log(taskId, 'info', 'TASK', `任务 [${taskName}] 开始执行`)
    return report
  }

  log(
    taskId: string | null,
    level: LogLevel,
    category: LogCategory,
    message: string,
    details?: Record<string, any>
  ): void {
    const entry: TaskLogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      category: LOG_CATEGORIES[category],
      message,
      details
    }

    this.logEntries.push(entry)

    if (taskId && this.reports.has(taskId)) {
      const report = this.reports.get(taskId)!
      report.entries.push(entry)
    }
  }

  logInfo(taskId: string | null, category: LogCategory, message: string, details?: Record<string, any>): void {
    this.log(taskId, 'info', category, message, details)
  }

  logSuccess(taskId: string | null, category: LogCategory, message: string, details?: Record<string, any>): void {
    this.log(taskId, 'success', category, message, details)
  }

  logWarning(taskId: string | null, category: LogCategory, message: string, details?: Record<string, any>): void {
    this.log(taskId, 'warning', category, message, details)
  }

  logError(taskId: string | null, category: LogCategory, message: string, details?: Record<string, any>): void {
    this.log(taskId, 'error', category, message, details)
  }

  logDebug(taskId: string | null, category: LogCategory, message: string, details?: Record<string, any>): void {
    this.log(taskId, 'debug', category, message, details)
  }

  completeTask(taskId: string, status: 'completed' | 'failed', summary?: string): void {
    if (this.reports.has(taskId)) {
      const report = this.reports.get(taskId)!
      report.status = status
      report.endTime = this.formatTimestamp()
      report.summary = summary || (status === 'completed' ? '任务执行成功' : '任务执行失败')

      const statusText = status === 'completed' ? '成功' : '失败'
      this.log(taskId, status === 'completed' ? 'success' : 'error', 'TASK', `任务执行${statusText}: ${report.summary}`)
    }
  }

  getTaskReport(taskId: string): TaskReport | undefined {
    return this.reports.get(taskId)
  }

  getAllReports(): TaskReport[] {
    return Array.from(this.reports.values())
  }

  getLogEntries(): TaskLogEntry[] {
    return [...this.logEntries]
  }

  formatReportAsText(taskId: string): string {
    const report = this.reports.get(taskId)
    if (!report) return ''

    const lines: string[] = [
      '='.repeat(60),
      `任务报告: ${report.taskName}`,
      '='.repeat(60),
      `任务ID: ${report.taskId}`,
      `开始时间: ${report.startTime}`,
      `结束时间: ${report.endTime || 'N/A'}`,
      `状态: ${report.status === 'completed' ? '✅ 成功' : report.status === 'failed' ? '❌ 失败' : '🔄 运行中'}`,
      `摘要: ${report.summary || 'N/A'}`,
      '='.repeat(60),
      '执行日志:',
      '-'.repeat(60)
    ]

    report.entries.forEach(entry => {
      const levelIcon = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        debug: '🔍'
      }[entry.level]

      lines.push(`[${entry.timestamp}] ${levelIcon} [${entry.category}] ${entry.message}`)

      if (entry.details) {
        lines.push(`    详情: ${JSON.stringify(entry.details, null, 2)}`)
      }
    })

    lines.push('='.repeat(60))

    return lines.join('\n')
  }

  formatAllReportsAsText(): string {
    return Array.from(this.reports.values())
      .map(report => this.formatReportAsText(report.taskId))
      .join('\n\n')
  }

  clear(): void {
    this.reports.clear()
    this.logEntries = []
  }

  generateSystemLog(): string {
    const lines: string[] = [
      '='.repeat(60),
      `系统运行日志 - ${this.formatTimestamp()}`,
      '='.repeat(60),
      '',
      '【任务执行记录】'
    ]

    this.reports.forEach(report => {
      const statusIcon = report.status === 'completed' ? '✅' : report.status === 'failed' ? '❌' : '🔄'
      lines.push(`  ${statusIcon} ${report.taskName}`)
      lines.push(`      状态: ${report.status}`)
      lines.push(`      开始: ${report.startTime}`)
      if (report.endTime) {
        lines.push(`      结束: ${report.endTime}`)
      }
      if (report.summary) {
        lines.push(`      摘要: ${report.summary}`)
      }
    })

    lines.push('')
    lines.push('【详细日志】')
    lines.push('-'.repeat(60))

    this.logEntries.forEach(entry => {
      const levelIcon = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        debug: '🔍'
      }[entry.level]

      lines.push(`[${entry.timestamp}] ${levelIcon} [${entry.category}] ${entry.message}`)
    })

    lines.push('='.repeat(60))

    return lines.join('\n')
  }
}

export const taskReportLogger = new TaskReportLogger()
export default taskReportLogger

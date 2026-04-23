export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug'

export interface TaskLogEntry {
  timestamp: string
  level: LogLevel
  category: string
  message: string
  details?: Record<string, any>
}

export interface TaskReport {
  taskId: string
  taskName: string
  startTime: string
  endTime?: string
  status: 'running' | 'completed' | 'failed'
  entries: TaskLogEntry[]
  summary?: string
}

export const LOG_CATEGORIES = {
  FILE_OPERATION: '文件操作',
  SEARCH: '搜索功能',
  ERROR_ANALYSIS: '错误分析',
  SYNTAX_CHECK: '语法检查',
  CONFIG: '配置管理',
  SYSTEM: '系统',
  TASK: '任务',
  JOB_LOG: '作业日志'
} as const

export type LogCategory = keyof typeof LOG_CATEGORIES

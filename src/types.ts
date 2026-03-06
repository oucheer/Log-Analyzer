export interface LogFile {
  filePath: string
  content: string
  fileName: string
}

export interface ErrorKeyword {
  keyword: string
  description: string
}

export interface SearchOptions {
  caseSensitive: boolean
  wholeWord: boolean
  useRegex: boolean
}

export interface SearchResult {
  line: number
  start: number
  end: number
  text: string
}

export type Theme = 'dark' | 'light'

export interface FloodFilterConfig {
  enabled: boolean
  timeWindowMs: number
  countThreshold: number
  maxConsecutiveFlood: number
}

export interface FloodStats {
  totalLines: number
  filteredLines: number
  uniqueFloodPatterns: number
  floodGroups: Array<{
    content: string
    count: number
    firstLine: number
    lastLine: number
    timeSpan: number
  }>
}

export interface SystemConfig {
  errorKeywords: ErrorKeyword[]
  floodFilter: FloodFilterConfig
  syntaxCheck: {
    enabled: boolean
    language: string
  }
}

export const defaultSystemConfig: SystemConfig = {
  errorKeywords: [
    { keyword: 'print_err', description: '该错误为打印模块，请找打印团队分析' },
    { keyword: 'copy_err', description: '该错误为复制模块，请找文件传输团队分析' },
    { keyword: 'scan_err', description: '该错误为扫描模块，请找扫描团队分析' },
    { keyword: 'error', description: '通用错误，请检查日志上下文' },
    { keyword: 'exception', description: '异常抛出，请找开发团队分析' },
    { keyword: 'fatal', description: '致命错误，请立即联系运维团队' },
    { keyword: 'fail', description: '操作失败，请检查相关模块' },
    { keyword: 'warning', description: '警告信息，请留意相关日志' }
  ],
  floodFilter: {
    enabled: false,
    timeWindowMs: 1000,
    countThreshold: 5,
    maxConsecutiveFlood: 100
  },
  syntaxCheck: {
    enabled: true,
    language: 'javascript'
  }
}

export interface SyntaxError {
  line: number
  column: number
  message: string
  severity: 'error' | 'warning' | 'info'
  code?: string
}

export interface SyntaxCheckResult {
  isValid: boolean
  errors: SyntaxError[]
  language: string
  timestamp: string
}

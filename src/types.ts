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

export type Theme = 'dark' | 'light' | 'blue' | 'green' | 'purple'

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
  mouseWheel: {
    speed: number
    syncOS: boolean
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
  },
  mouseWheel: {
    speed: 1,
    syncOS: true
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

export interface KeywordConfig {
  id: string
  keyword: string
  expectedResult: string
  description: string
  category: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface KeywordMatchResult {
  keyword: KeywordConfig
  matchPosition: { start: number; end: number }
  actualResult: string
  isMatch: boolean
  difference: string | null
}

export interface CompareReport {
  id: string
  inputContent: string
  matches: KeywordMatchResult[]
  totalMatches: number
  passedMatches: number
  failedMatches: number
  passRate: number
  generatedAt: string
}

export interface ConfigVersion {
  id: string
  version: number
  configs: KeywordConfig[]
  createdAt: string
  createdBy: string
  description: string
}

export interface AuditLog {
  id: string
  action: 'create' | 'update' | 'delete' | 'import' | 'export' | 'compare'
  target: string
  operator: string
  timestamp: string
  details: string
  beforeState?: KeywordConfig
  afterState?: KeywordConfig
}

export interface CompareOptions {
  caseSensitive: boolean
  useRegex: boolean
  matchAll: boolean
}

export interface WorkflowStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  startTime?: string
  endTime?: string
  duration?: number
  dependencies: string[]
  result?: string
  error?: string
}

export interface WorkflowAnalysis {
  id: string
  name: string
  steps: WorkflowStep[]
  totalDuration: number
  completedSteps: number
  failedSteps: number
  bottlenecks: string[]
  anomalies: string[]
  metrics: {
    averageStepDuration: number
    longestStep: string
    mostFrequentError: string
    successRate: number
  }
  generatedAt: string
}

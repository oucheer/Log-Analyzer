import { WorkflowStep, WorkflowAnalysis } from '../types'

interface LogLine {
  lineNumber: number
  content: string
  timestamp?: string
}

export class WorkflowAnalyzer {
  private static readonly STEP_PATTERNS = [
    /^\[?(\d{4}[-/]\d{2}[-/]\d{2}[\sT]\d{2}:\d{2}:\d{2})\]?\s*\[?(start|begin|启动|开始|INIT|init|initialize)\b/i,
    /^\[?(\d{4}[-/]\d{2}[-/]\d{2}[\sT]\d{2}:\d{2}:\d{2})\]?\s*\[?(end|complete|finish|完成|结束|DONE|done|success|成功)\b/i,
    /^\[?(\d{4}[-/]\d{2}[-/]\d{2}[\sT]\d{2}:\d{2}:\d{2})\]?\s*\[?(step|phase|stage|步骤|阶段|phase|PHASE)\s*[:\-]?\s*(\d+|[a-zA-Z]+)\b/i,
    /^\[?(\d{4}[-/]\d{2}[-/]\d{2}[\sT]\d{2}:\d{2}:\d{2})\]?\s*\[?(task|job|作业|任务|TASK|JOB)\s*[:\-]?\s*(\w+)\b/i,
    /^\[?(\d{4}[-/]\d{2}[-/]\d{2}[\sT]\d{2}:\d{2}:\d{2})\]?\s*\[?(processing|处理中|executing|执行中)\b/i,
    /^(\d{2}:\d{2}:\d{2})\s*\[?(start|begin|启动|开始)\b/i,
    /^(\d{2}:\d{2}:\d{2})\s*\[?(end|complete|finish|完成|结束)\b/i,
    /^(\d{2}:\d{2}:\d{2})\s*\[?(step|phase|stage|步骤|阶段)\s*(\d+|[a-zA-Z]+)\b/i,
    /^(\d{2}:\d{2}:\d{2})\s*\[?(processing|处理|executing|执行)\b/i,
    /^\s*\[(\d+)\]\s*\[?(start|begin|启动)\b/i,
    /^\s*\[(\d+)\]\s*\[?(end|complete|finish|完成)\b/i,
  ]

  private static readonly STATUS_PATTERNS = [
    { pattern: /success|成功|completed|完成|passed|✅|OK|ok/i, status: 'completed' as const },
    { pattern: /fail|失败|error|错误|exception|异常|❌|FAILED|fail/i, status: 'failed' as const },
    { pattern: /running|进行中|running|processing|处理中|executing|执行中/i, status: 'running' as const },
    { pattern: /skip|跳过|skipped|pending|等待|延时|delay/i, status: 'skipped' as const },
  ]

  private static readonly ERROR_PATTERNS = [
    { pattern: /timeout|超时|TIMEOUT/i, type: '超时错误', suggestion: '检查网络连接或增加超时时间' },
    { pattern: /connection.*fail|连接.*失败|connection.*error|CONNECT/i, type: '连接错误', suggestion: '检查服务器地址和网络连接' },
    { pattern: /permission.*denied|权限.*拒绝|access.*denied|ACCESS/i, type: '权限错误', suggestion: '检查文件/目录权限设置' },
    { pattern: /not found|未找到|404|NOTFOUND/i, type: '资源未找到', suggestion: '检查资源路径是否正确' },
    { pattern: /invalid|无效|INVALID/i, type: '无效输入', suggestion: '检查输入参数格式是否正确' },
    { pattern: /memory.*out|内存.*不足|OUTOFMEMORY/i, type: '内存溢出', suggestion: '增加系统内存或优化内存使用' },
    { pattern: /disk.*full|磁盘.*满|DISKFULL/i, type: '磁盘空间不足', suggestion: '清理磁盘空间或扩大存储' },
    { pattern: /database.*error|数据库.*错误|DBERROR/i, type: '数据库错误', suggestion: '检查数据库连接和查询语句' },
    { pattern: /null.*pointer|空指针|NULLPTR/i, type: '空指针异常', suggestion: '检查对象是否正确初始化' },
    { pattern: /stack.*overflow|栈溢出|STACKOVERFLOW/i, type: '栈溢出', suggestion: '检查递归调用深度' },
    { pattern: /deadlock|死锁|DEADLOCK/i, type: '死锁', suggestion: '检查锁的获取顺序' },
    { pattern: /circuit.*break|熔断|CIRCUITBREAK/i, type: '服务熔断', suggestion: '检查下游服务是否可用' },
  ]

  private static readonly LOG_LEVELS = [
    { pattern: /^\s*\[?\s*ERROR\b/i, level: 'error', color: '#f44336' },
    { pattern: /^\s*\[?\s*WARN\b/i, level: 'warning', color: '#ff9800' },
    { pattern: /^\s*\[?\s*INFO\b/i, level: 'info', color: '#2196f3' },
    { pattern: /^\s*\[?\s*DEBUG\b/i, level: 'debug', color: '#9e9e9e' },
    { pattern: /^\s*\[?\s*TRACE\b/i, level: 'trace', color: '#607d8b' },
  ]

  static analyzeLog(logContent: string, maxSteps: number = 100): WorkflowAnalysis {
    const lines = logContent.split('\n').map((content, index) => ({
      lineNumber: index + 1,
      content: content.trim()
    })).filter(line => line.content.length > 0)

    const steps = this.extractSteps(lines, maxSteps)
    const analysis = this.analyzeSteps(steps, lines)
    const logStats = this.analyzeLogLevels(lines)
    const suggestions = this.generateSuggestions(lines, steps, analysis)

    return {
      id: `workflow-${Date.now()}`,
      name: this.detectWorkflowName(lines),
      steps,
      totalDuration: analysis.totalDuration,
      completedSteps: analysis.completedSteps,
      failedSteps: analysis.failedSteps,
      bottlenecks: analysis.bottlenecks,
      anomalies: [...analysis.anomalies, ...logStats.anomalies],
      metrics: {
        averageStepDuration: analysis.metrics.averageStepDuration,
        longestStep: analysis.metrics.longestStep,
        mostFrequentError: analysis.metrics.mostFrequentError,
        successRate: analysis.metrics.successRate,
        totalErrors: logStats.errorCount,
        warningCount: logStats.warningCount,
        suggestions: suggestions
      },
      generatedAt: new Date().toISOString()
    }
  }

  private static extractSteps(lines: LogLine[], maxSteps: number): WorkflowStep[] {
    const steps: WorkflowStep[] = []
    const stepMap = new Map<string, WorkflowStep>()
    let currentStep: WorkflowStep | null = null

    for (const line of lines) {
      if (steps.length >= maxSteps) break

      let matched = false
      for (const pattern of this.STEP_PATTERNS) {
        const match = line.content.match(pattern)
        if (match) {
          const stepName = this.extractStepName(line.content, match)
          
          if (!stepMap.has(stepName)) {
            const newStep: WorkflowStep = {
              id: `step-${steps.length + 1}`,
              name: stepName,
              status: 'pending',
              dependencies: currentStep ? [currentStep.id] : [],
              startTime: this.extractTimestamp(match)
            }
            stepMap.set(stepName, newStep)
            steps.push(newStep)
            
            if (currentStep && currentStep.status === 'pending') {
              currentStep.status = 'completed'
              currentStep.endTime = newStep.startTime || new Date().toISOString()
            }
            currentStep = newStep
          } else {
            const existingStep = stepMap.get(stepName)!
            this.updateStepStatus(existingStep, line.content)
          }
          matched = true
          break
        }
      }

      if (!matched && currentStep) {
        this.detectErrorsInLine(currentStep, line.content)
      }
    }

    if (currentStep && currentStep.status === 'pending') {
      currentStep.status = 'running'
    }

    return steps
  }

  private static extractStepName(content: string, match: RegExpMatchArray): string {
    const stepMatch = content.match(/step|phase|stage|步骤|阶段|phase/i)
    if (stepMatch) {
      const numMatch = content.match(/(\d+|[a-zA-Z]+)/)
      if (numMatch) {
        return `步骤 ${numMatch[1]}`
      }
      return '步骤'
    }

    const taskMatch = content.match(/task|job|作业|任务/i)
    if (taskMatch) {
      const nameMatch = content.match(/(task|job|作业|任务)\s*[:\-]?\s*(\w+)/i)
      if (nameMatch && nameMatch[2]) {
        return `任务: ${nameMatch[2]}`
      }
      return '任务执行'
    }

    const startMatch = content.match(/start|begin|启动|开始|INIT/i)
    if (startMatch) {
      return '开始'
    }

    const endMatch = content.match(/end|complete|finish|完成|结束|DONE|SUCCESS/i)
    if (endMatch) {
      return '结束'
    }

    const processMatch = content.match(/processing|处理中|executing|执行中/i)
    if (processMatch) {
      return '处理中'
    }

    return content.substring(0, 30)
  }

  private static extractTimestamp(match: RegExpMatchArray): string | undefined {
    for (let i = 1; i < match.length; i++) {
      if (match[i] && /\d/.test(match[i])) {
        return match[i]
      }
    }
    return undefined
  }

  private static updateStepStatus(step: WorkflowStep, content: string): void {
    for (const statusPattern of this.STATUS_PATTERNS) {
      if (statusPattern.pattern.test(content)) {
        if (step.status === 'pending' || step.status === 'running') {
          step.status = statusPattern.status
          if (statusPattern.status === 'completed' || statusPattern.status === 'failed') {
            step.endTime = new Date().toISOString()
            if (step.startTime && step.endTime) {
              step.duration = new Date(step.endTime).getTime() - new Date(step.startTime).getTime()
            }
          }
        }
        break
      }
    }
  }

  private static detectErrorsInLine(step: WorkflowStep, content: string): void {
    for (const errorPattern of this.ERROR_PATTERNS) {
      if (errorPattern.pattern.test(content)) {
        step.status = 'failed'
        step.error = content.substring(0, 150)
        step.result = errorPattern.suggestion
        step.endTime = new Date().toISOString()
        break
      }
    }
  }

  private static analyzeSteps(steps: WorkflowStep[], lines: LogLine[]) {
    const completedSteps = steps.filter(s => s.status === 'completed').length
    const failedSteps = steps.filter(s => s.status === 'failed').length
    
    let totalDuration = 0
    let durationCount = 0
    let longestDuration = 0
    let longestStepName = ''
    const errorCounts = new Map<string, number>()

    for (const step of steps) {
      if (step.duration) {
        totalDuration += step.duration
        durationCount++
        
        if (step.duration > longestDuration) {
          longestDuration = step.duration
          longestStepName = step.name
        }
      }
      
      if (step.error) {
        const errorType = this.classifyError(step.error)
        errorCounts.set(errorType, (errorCounts.get(errorType) || 0) + 1)
      }
    }

    const bottlenecks: string[] = []
    const anomalies: string[] = []

    if (steps.length > 0) {
      const avgDuration = durationCount > 0 ? totalDuration / durationCount : 0
      
      for (const step of steps) {
        if (step.duration && step.duration > avgDuration * 3 && avgDuration > 0) {
          bottlenecks.push(`${step.name} 耗时过长 (${(step.duration / 1000).toFixed(1)}s)，建议优化`)
        }
      }
    }

    const consecutiveFails = this.detectConsecutiveFailures(steps)
    if (consecutiveFails.length > 2) {
      anomalies.push(`⚠️ 检测到连续失败: ${consecutiveFails.map(s => s.name).join(' → ')}`)
    }

    const longWaits = this.detectLongWaits(steps)
    if (longWaits.length > 0) {
      anomalies.push(`⏳ 检测到长等待: ${longWaits.map(s => s.name).join(', ')}`)
    }

    let mostFrequentError = ''
    let maxErrorCount = 0
    errorCounts.forEach((count, error) => {
      if (count > maxErrorCount) {
        maxErrorCount = count
        mostFrequentError = error
      }
    })

    const totalFinishedSteps = completedSteps + failedSteps
    const successRate = totalFinishedSteps > 0 ? (completedSteps / totalFinishedSteps) * 100 : 0

    return {
      totalDuration,
      completedSteps,
      failedSteps,
      bottlenecks,
      anomalies,
      metrics: {
        averageStepDuration: durationCount > 0 ? totalDuration / durationCount : 0,
        longestStep: longestStepName,
        mostFrequentError,
        successRate
      }
    }
  }

  private static analyzeLogLevels(lines: LogLine[]) {
    let errorCount = 0
    let warningCount = 0
    const anomalies: string[] = []
    const recentErrors: { line: number; content: string }[] = []

    for (const line of lines.slice(0, 500)) {
      for (const level of this.LOG_LEVELS) {
        if (level.pattern.test(line.content)) {
          if (level.level === 'error') {
            errorCount++
            if (recentErrors.length < 5) {
              recentErrors.push({ line: line.lineNumber, content: line.content.substring(0, 80) })
            }
          } else if (level.level === 'warning') {
            warningCount++
          }
          break
        }
      }
    }

    if (errorCount > 10) {
      anomalies.push(`⚠️ 日志中存在大量错误 (${errorCount}个)，建议优先查看错误日志`)
    }

    if (warningCount > 20) {
      anomalies.push(`⚠️ 日志中存在较多警告 (${warningCount}个)，建议关注`)
    }

    return { errorCount, warningCount, anomalies, recentErrors }
  }

  private static generateSuggestions(lines: LogLine[], steps: WorkflowStep[], analysis: any): string[] {
    const suggestions: string[] = []

    if (analysis.failedSteps > 0) {
      suggestions.push(`检测到 ${analysis.failedSteps} 个失败步骤，请检查失败原因`)
    }

    if (analysis.bottlenecks.length > 0) {
      suggestions.push('存在性能瓶颈，建议优化耗时较长的步骤')
    }

    const errorLines = lines.filter(l => /error|错误|exception|异常/i.test(l.content))
    if (errorLines.length > 0) {
      const firstError = errorLines[0]
      suggestions.push(`首次错误出现在第 ${firstError.lineNumber} 行`)
    }

    const retryPattern = /retry|重试|retrying/i
    const retryCount = lines.filter(l => retryPattern.test(l.content)).length
    if (retryCount > 3) {
      suggestions.push(`检测到 ${retryCount} 次重试，可能存在稳定性问题`)
    }

    const slowPattern = /slow|慢|latency|延迟/i
    const slowCount = lines.filter(l => slowPattern.test(l.content)).length
    if (slowCount > 0) {
      suggestions.push(`检测到 ${slowCount} 次性能缓慢记录`)
    }

    if (suggestions.length === 0 && analysis.completedSteps > 0) {
      suggestions.push('日志分析完成，未发现明显异常')
    }

    return suggestions
  }

  private static classifyError(error: string): string {
    for (const ep of this.ERROR_PATTERNS) {
      if (ep.pattern.test(error)) {
        return ep.type
      }
    }
    return '其他错误'
  }

  private static detectConsecutiveFailures(steps: WorkflowStep[]): WorkflowStep[] {
    const consecutive: WorkflowStep[] = []
    for (const step of steps) {
      if (step.status === 'failed') {
        consecutive.push(step)
      } else {
        if (consecutive.length > 0 && step.status === 'completed') {
          break
        }
      }
    }
    return consecutive
  }

  private static detectLongWaits(steps: WorkflowStep[]): WorkflowStep[] {
    const longWaits: WorkflowStep[] = []
    for (let i = 0; i < steps.length - 1; i++) {
      const current = steps[i]
      const next = steps[i + 1]
      
      if (current.endTime && next.startTime) {
        try {
          const waitTime = new Date(next.startTime).getTime() - new Date(current.endTime).getTime()
          if (waitTime > 5000) {
            longWaits.push(current)
          }
        } catch (e) {
          // ignore date parsing errors
        }
      }
    }
    return longWaits
  }

  private static detectWorkflowName(lines: LogLine[]): string {
    for (const line of lines.slice(0, 10)) {
      const nameMatch = line.content.match(/workflow|task|job|作业|流程|任务|service|service/i)
      if (nameMatch) {
        const fullMatch = line.content.match(/(workflow|task|job|作业|流程|任务|service)\s*[:\-]?\s*([^\s,;]+)/i)
        if (fullMatch && fullMatch[2]) {
          return fullMatch[2].substring(0, 30)
        }
        return '工作流'
      }
    }
    return '日志分析'
  }
}

export const workflowAnalyzer = new WorkflowAnalyzer()

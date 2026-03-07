import { WorkflowStep, WorkflowAnalysis } from '../types'

interface LogLine {
  lineNumber: number
  content: string
  timestamp?: string
}

export class WorkflowAnalyzer {
  private static readonly STEP_PATTERNS = [
    /^\[?(\d{4}[-/]\d{2}[-/]\d{2}[\sT]\d{2}:\d{2}:\d{2})\]?\s*\[?(start|begin|启动|开始)\b/i,
    /^\[?(\d{4}[-/]\d{2}[-/]\d{2}[\sT]\d{2}:\d{2}:\d{2})\]?\s*\[?(end|complete|finish|完成|结束)\b/i,
    /^\[?(\d{4}[-/]\d{2}[-/]\d{2}[\sT]\d{2}:\d{2}:\d{2})\]?\s*\[?(step|phase|stage|步骤|阶段)\s*(\d+|[a-zA-Z]+)\b/i,
    /^\[?(\d{4}[-/]\d{2}[-/]\d{2}[\sT]\d{2}:\d{2}:\d{2})\]?\s*\[?(task|job|作业)\s*(\w+)\b/i,
    /^(\d{2}:\d{2}:\d{2})\s*\[?(start|begin|启动|开始)\b/i,
    /^(\d{2}:\d{2}:\d{2})\s*\[?(end|complete|finish|完成|结束)\b/i,
    /^(\d{2}:\d{2}:\d{2})\s*\[?(step|phase|stage|步骤|阶段)\s*(\d+|[a-zA-Z]+)\b/i,
  ]

  private static readonly STATUS_PATTERNS = [
    { pattern: /success|成功|completed|完成|passed/i, status: 'completed' as const },
    { pattern: /fail|失败|error|错误|exception|异常/i, status: 'failed' as const },
    { pattern: /running|进行中|running|processing|处理中/i, status: 'running' as const },
    { pattern: /skip|跳过|skipped|pending|等待/i, status: 'skipped' as const },
  ]

  private static readonly ERROR_PATTERNS = [
    /error|错误|exception|异常|fail|失败/i,
    /timeout|超时/i,
    /connection.*fail|连接.*失败/i,
    /permission.*denied|权限.*拒绝/i,
    /not found|未找到/i,
    /invalid|无效/i,
  ]

  static analyzeLog(logContent: string, maxSteps: number = 50): WorkflowAnalysis {
    const lines = logContent.split('\n').map((content, index) => ({
      lineNumber: index + 1,
      content: content.trim()
    })).filter(line => line.content.length > 0)

    const steps = this.extractSteps(lines, maxSteps)
    const analysis = this.analyzeSteps(steps)

    return {
      id: `workflow-${Date.now()}`,
      name: this.detectWorkflowName(lines),
      steps,
      totalDuration: analysis.totalDuration,
      completedSteps: analysis.completedSteps,
      failedSteps: analysis.failedSteps,
      bottlenecks: analysis.bottlenecks,
      anomalies: analysis.anomalies,
      metrics: analysis.metrics,
      generatedAt: new Date().toISOString()
    }
  }

  private static extractSteps(lines: LogLine[], maxSteps: number): WorkflowStep[] {
    const steps: WorkflowStep[] = []
    const stepMap = new Map<string, WorkflowStep>()
    let currentStep: WorkflowStep | null = null

    for (const line of lines) {
      if (steps.length >= maxSteps) break

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
              currentStep.endTime = new Date().toISOString()
            }
            currentStep = newStep
          } else {
            const existingStep = stepMap.get(stepName)!
            this.updateStepStatus(existingStep, line.content)
          }
          break
        }
      }

      if (currentStep) {
        this.detectErrorsInLine(currentStep, line.content)
      }
    }

    if (currentStep && currentStep.status === 'pending') {
      currentStep.status = 'running'
    }

    return steps
  }

  private static extractStepName(content: string, match: RegExpMatchArray): string {
    const fullMatch = match[0]
    
    const stepMatch = content.match(/step|phase|stage|步骤|阶段/i)
    if (stepMatch) {
      const numMatch = content.match(/(\d+|[a-zA-Z]+)/)
      if (numMatch) {
        return `步骤 ${numMatch[1]}`
      }
    }

    const taskMatch = content.match(/task|job|作业|任务/i)
    if (taskMatch) {
      const nameMatch = content.match(/(task|job|作业|任务)\s*[:\-]?\s*(\w+)/i)
      if (nameMatch && nameMatch[2]) {
        return `任务: ${nameMatch[2]}`
      }
      return '任务执行'
    }

    const startMatch = content.match(/start|begin|启动|开始/i)
    if (startMatch) {
      return '开始'
    }

    const endMatch = content.match(/end|complete|finish|完成|结束/i)
    if (endMatch) {
      return '结束'
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
      if (errorPattern.test(content)) {
        step.status = 'failed'
        step.error = content.substring(0, 100)
        step.endTime = new Date().toISOString()
        break
      }
    }
  }

  private static analyzeSteps(steps: WorkflowStep[]): {
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
  } {
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
        if (step.duration && step.duration > avgDuration * 3) {
          bottlenecks.push(`${step.name} 耗时过长 (${(step.duration / 1000).toFixed(1)}s)`)
        }
      }
    }

    const consecutiveFails = this.detectConsecutiveFailures(steps)
    if (consecutiveFails.length > 2) {
      anomalies.push(`检测到连续失败: ${consecutiveFails.map(s => s.name).join(' → ')}`)
    }

    const longWaits = this.detectLongWaits(steps)
    if (longWaits.length > 0) {
      anomalies.push(`检测到长等待: ${longWaits.map(s => s.name).join(', ')}`)
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

  private static classifyError(error: string): string {
    if (/timeout|超时/i.test(error)) return '超时'
    if (/connection|连接/i.test(error)) return '连接错误'
    if (/permission|权限/i.test(error)) return '权限错误'
    if (/not found|未找到/i.test(error)) return '资源未找到'
    if (/invalid|无效/i.test(error)) return '无效输入'
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
        const waitTime = new Date(next.startTime).getTime() - new Date(current.endTime).getTime()
        if (waitTime > 5000) {
          longWaits.push(current)
        }
      }
    }
    return longWaits
  }

  private static detectWorkflowName(lines: LogLine[]): string {
    for (const line of lines.slice(0, 10)) {
      const nameMatch = line.content.match(/workflow|task|job|作业|流程|任务/i)
      if (nameMatch) {
        const fullMatch = line.content.match(/(workflow|task|job|作业|流程|任务)[:\s]+([^\s]+)/i)
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

import { EnhancedMatchResult, KeywordMapping } from '../types'
import { enhancedConfigManager } from './EnhancedConfigManager'

class EnhancedMatchEngine {
  matchLogContent(content: string): EnhancedMatchResult[] {
    const results: EnhancedMatchResult[] = []
    const allMappings = enhancedConfigManager.getAllMappings()
    const lines = content.split('\n')

    lines.forEach((line, lineIndex) => {
      const lineNumber = lineIndex + 1
      const lineLower = line.toLowerCase()

      allMappings.forEach(mapping => {
        const keyword = mapping.keyword.toLowerCase()
        const originalKeyword = mapping.keyword.includes(':') 
          ? mapping.keyword.split(':').slice(1).join(':')
          : mapping.keyword

        if (lineLower.includes(keyword) || lineLower.includes(originalKeyword.toLowerCase())) {
          const result: EnhancedMatchResult = {
            id: `${lineNumber}-${mapping.keyword}-${Date.now()}-${Math.random()}`,
            keyword: mapping.keyword,
            type: mapping.type,
            line: lineNumber,
            context: line.trim(),
            filePath: mapping.filePath,
            apiName: mapping.apiName,
            branch: mapping.branch,
            mode: mapping.mode,
            suggestion: mapping.suggestion,
            severity: mapping.severity
          }
          results.push(result)
        }
      })
    })

    return this.sortResults(results)
  }

  private sortResults(results: EnhancedMatchResult[]): EnhancedMatchResult[] {
    const severityOrder: Record<string, number> = {
      'error': 0,
      'warning': 1,
      'info': 2
    }

    return results.sort((a, b) => {
      if (a.line !== b.line) {
        return a.line - b.line
      }
      
      const severityA = severityOrder[a.severity || 'info']
      const severityB = severityOrder[b.severity || 'info']
      
      if (severityA !== severityB) {
        return severityA - severityB
      }
      
      if (a.type !== b.type) {
        return a.type === 'exception' ? -1 : 1
      }
      
      return 0
    })
  }

  getResultsByType(results: EnhancedMatchResult[]): {
    exceptions: EnhancedMatchResult[]
    logs: EnhancedMatchResult[]
  } {
    return {
      exceptions: results.filter(r => r.type === 'exception'),
      logs: results.filter(r => r.type === 'log')
    }
  }

  getResultsBySeverity(results: EnhancedMatchResult[]): {
    errors: EnhancedMatchResult[]
    warnings: EnhancedMatchResult[]
    infos: EnhancedMatchResult[]
  } {
    return {
      errors: results.filter(r => r.severity === 'error'),
      warnings: results.filter(r => r.severity === 'warning'),
      infos: results.filter(r => r.severity === 'info' || !r.severity)
    }
  }

  getResultsByFile(results: EnhancedMatchResult[]): Map<string, EnhancedMatchResult[]> {
    const fileMap = new Map<string, EnhancedMatchResult[]>()
    
    results.forEach(result => {
      if (result.filePath) {
        const existing = fileMap.get(result.filePath) || []
        existing.push(result)
        fileMap.set(result.filePath, existing)
      }
    })
    
    return fileMap
  }

  getResultsByApi(results: EnhancedMatchResult[]): Map<string, EnhancedMatchResult[]> {
    const apiMap = new Map<string, EnhancedMatchResult[]>()
    
    results.forEach(result => {
      if (result.apiName) {
        const existing = apiMap.get(result.apiName) || []
        existing.push(result)
        apiMap.set(result.apiName, existing)
      }
    })
    
    return apiMap
  }

  getResultsByBranch(results: EnhancedMatchResult[]): Map<string, EnhancedMatchResult[]> {
    const branchMap = new Map<string, EnhancedMatchResult[]>()
    
    results.forEach(result => {
      if (result.branch) {
        const existing = branchMap.get(result.branch) || []
        existing.push(result)
        branchMap.set(result.branch, existing)
      }
    })
    
    return branchMap
  }

  getResultsByConfig(results: EnhancedMatchResult[]): Map<string, EnhancedMatchResult[]> {
    const configMap = new Map<string, EnhancedMatchResult[]>()
    
    results.forEach(result => {
      const configName = result.keyword.includes(':') 
        ? result.keyword.split(':')[0]
        : '默认'
      
      const existing = configMap.get(configName) || []
      existing.push(result)
      configMap.set(configName, existing)
    })
    
    return configMap
  }

  getStatistics(results: EnhancedMatchResult[]): {
    total: number
    byType: { exceptions: number; logs: number }
    bySeverity: { errors: number; warnings: number; infos: number }
    byFile: number
    byApi: number
    byBranch: number
    byConfig: number
  } {
    const byType = this.getResultsByType(results)
    const bySeverity = this.getResultsBySeverity(results)
    
    return {
      total: results.length,
      byType: {
        exceptions: byType.exceptions.length,
        logs: byType.logs.length
      },
      bySeverity: {
        errors: bySeverity.errors.length,
        warnings: bySeverity.warnings.length,
        infos: bySeverity.infos.length
      },
      byFile: this.getResultsByFile(results).size,
      byApi: this.getResultsByApi(results).size,
      byBranch: this.getResultsByBranch(results).size,
      byConfig: this.getResultsByConfig(results).size
    }
  }
}

export const enhancedMatchEngine = new EnhancedMatchEngine()

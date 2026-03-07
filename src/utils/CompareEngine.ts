import { KeywordConfig, KeywordMatchResult, CompareReport, CompareOptions } from '../types'
import { keywordConfigManager } from './KeywordConfigManager'

class CompareEngine {
  compare(inputContent: string, options?: Partial<CompareOptions>): CompareReport {
    const startTime = performance.now()
    
    const opts: CompareOptions = {
      caseSensitive: false,
      useRegex: false,
      matchAll: true,
      ...options
    }

    const enabledConfigs = keywordConfigManager.getEnabled()
    const matches: KeywordMatchResult[] = []
    
    for (const config of enabledConfigs) {
      const keywordMatches = this.findMatches(inputContent, config.keyword, opts)
      
      for (const match of keywordMatches) {
        const actualResult = this.extractContext(inputContent, match.start, config.expectedResult.length)
        
        const isMatch = this.compareResults(actualResult, config.expectedResult, opts)
        
        const difference = isMatch ? null : this.calculateDifference(actualResult, config.expectedResult)

        matches.push({
          keyword: config,
          matchPosition: { start: match.start, end: match.end },
          actualResult,
          isMatch,
          difference
        })
      }
    }

    const totalMatches = matches.length
    const passedMatches = matches.filter(m => m.isMatch).length
    const failedMatches = totalMatches - passedMatches
    const passRate = totalMatches > 0 ? Math.round((passedMatches / totalMatches) * 100) : 0

    const endTime = performance.now()
    const responseTime = endTime - startTime
    
    if (responseTime > 500) {
      console.warn(`对比引擎警告: 响应时间 ${responseTime.toFixed(2)}ms 超过500ms限制`)
    }

    return {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      inputContent: inputContent.substring(0, 1000),
      matches,
      totalMatches,
      passedMatches,
      failedMatches,
      passRate,
      generatedAt: new Date().toISOString()
    }
  }

  private findMatches(
    content: string, 
    keyword: string, 
    options: CompareOptions
  ): Array<{ start: number; end: number }> {
    const matches: Array<{ start: number; end: number }> = []
    
    try {
      let regex: RegExp
      
      if (options.useRegex) {
        regex = new RegExp(keyword, options.caseSensitive ? 'g' : 'gi')
      } else {
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        regex = new RegExp(escaped, options.caseSensitive ? 'g' : 'gi')
      }

      let match: RegExpExecArray | null
      while ((match = regex.exec(content)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length
        })

        if (!options.matchAll) break
      }
    } catch (err) {
      console.error('正则表达式错误:', err)
    }

    return matches
  }

  private extractContext(content: string, position: number, length: number): string {
    const start = Math.max(0, position - 10)
    const end = Math.min(content.length, position + length + 10)
    return content.substring(start, end).trim()
  }

  private compareResults(actual: string, expected: string, options: CompareOptions): boolean {
    if (options.caseSensitive) {
      return actual === expected
    }
    return actual.toLowerCase() === expected.toLowerCase()
  }

  private calculateDifference(actual: string, expected: string): string {
    const diff: string[] = []
    
    const actualLower = actual.toLowerCase()
    const expectedLower = expected.toLowerCase()
    
    if (actualLower.length !== expectedLower.length) {
      diff.push(`长度不匹配: 实际${actual.length}字符，预期${expected.length}字符`)
    }

    for (let i = 0; i < Math.max(actual.length, expected.length); i++) {
      if (actual[i] !== expected[i]) {
        const actualChar = actual[i] || ''
        const expectedChar = expected[i] || ''
        diff.push(`位置${i}: 实际"${actualChar}"，预期"${expectedChar}"`)
        if (diff.length >= 3) break
      }
    }

    return diff.length > 0 ? diff.join('; ') : '内容不一致'
  }

  quickCheck(content: string, keyword: string): boolean {
    const opts: CompareOptions = {
      caseSensitive: false,
      useRegex: false,
      matchAll: false
    }
    
    const matches = this.findMatches(content, keyword, opts)
    return matches.length > 0
  }

  batchCompare(contents: string[]): CompareReport[] {
    return contents.map(content => this.compare(content))
  }

  getMatchCount(content: string): number {
    const enabledConfigs = keywordConfigManager.getEnabled()
    let count = 0

    for (const config of enabledConfigs) {
      const matches = this.findMatches(content, config.keyword, { caseSensitive: false, useRegex: false, matchAll: true })
      count += matches.length
    }

    return count
  }
}

export const compareEngine = new CompareEngine()
export default compareEngine

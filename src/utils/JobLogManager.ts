import { JobLogKeyword, JobLogExtractResult } from '../types'

class JobLogManager {
  private keywords: JobLogKeyword[] = []
  private readonly STORAGE_KEY = 'jobLogKeywords'

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY)
      if (saved) {
        this.keywords = JSON.parse(saved)
      }
    } catch (error) {
      console.error('加载作业日志关键字失败:', error)
      this.keywords = []
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.keywords))
    } catch (error) {
      console.error('保存作业日志关键字失败:', error)
    }
  }

  generateId(): string {
    return `joblog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  addKeyword(keyword: string, description: string): JobLogKeyword | null {
    if (!keyword.trim()) {
      return null
    }

    const existing = this.keywords.find(
      k => k.keyword.toLowerCase() === keyword.trim().toLowerCase()
    )
    if (existing) {
      return null
    }

    const newKeyword: JobLogKeyword = {
      id: this.generateId(),
      keyword: keyword.trim(),
      description: description.trim(),
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.keywords.push(newKeyword)
    this.saveToStorage()
    return newKeyword
  }

  updateKeyword(id: string, updates: Partial<JobLogKeyword>): boolean {
    const index = this.keywords.findIndex(k => k.id === id)
    if (index === -1) {
      return false
    }

    if (updates.keyword !== undefined) {
      const duplicate = this.keywords.find(
        k => k.id !== id && k.keyword.toLowerCase() === updates.keyword!.trim().toLowerCase()
      )
      if (duplicate) {
        return false
      }
    }

    this.keywords[index] = {
      ...this.keywords[index],
      ...updates,
      updatedAt: Date.now()
    }
    this.saveToStorage()
    return true
  }

  removeKeyword(id: string): boolean {
    const index = this.keywords.findIndex(k => k.id === id)
    if (index === -1) {
      return false
    }

    this.keywords.splice(index, 1)
    this.saveToStorage()
    return true
  }

  getKeywords(): JobLogKeyword[] {
    return [...this.keywords].sort((a, b) => b.createdAt - a.createdAt)
  }

  getEnabledKeywords(): JobLogKeyword[] {
    return this.keywords.filter(k => k.enabled)
  }

  getKeywordById(id: string): JobLogKeyword | undefined {
    return this.keywords.find(k => k.id === id)
  }

  toggleKeyword(id: string): boolean {
    const keyword = this.getKeywordById(id)
    if (!keyword) {
      return false
    }

    return this.updateKeyword(id, { enabled: !keyword.enabled })
  }

  clearAllKeywords(): void {
    this.keywords = []
    this.saveToStorage()
  }

  findAllJobStarts(content: string): Array<{ line: number; keyword: string; content: string }> {
    const lines = content.split('\n')
    const enabledKeywords = this.getEnabledKeywords()
    const results: Array<{ line: number; keyword: string; content: string }> = []

    if (enabledKeywords.length === 0) {
      return results
    }

    lines.forEach((line, index) => {
      for (const kw of enabledKeywords) {
        if (line.includes(kw.keyword)) {
          results.push({
            line: index,
            keyword: kw.keyword,
            content: line.trim()
          })
          break
        }
      }
    })

    return results
  }

  extractLastJobLog(content: string): JobLogExtractResult {
    const jobStarts = this.findAllJobStarts(content)

    if (jobStarts.length === 0) {
      return {
        extractedContent: content,
        startLine: 0,
        matchedKeyword: null,
        totalJobs: 0
      }
    }

    const lastJob = jobStarts[jobStarts.length - 1]
    const lines = content.split('\n')
    const extractedLines = lines.slice(lastJob.line)

    return {
      extractedContent: extractedLines.join('\n'),
      startLine: lastJob.line,
      matchedKeyword: lastJob.keyword,
      totalJobs: jobStarts.length
    }
  }

  hasEnabledKeywords(): boolean {
    return this.keywords.some(k => k.enabled)
  }

  getKeywordCount(): number {
    return this.keywords.length
  }

  getEnabledKeywordCount(): number {
    return this.getEnabledKeywords().length
  }

  exportKeywords(): string {
    return JSON.stringify(this.keywords, null, 2)
  }

  importKeywords(jsonString: string): { success: boolean; message: string; count: number } {
    try {
      const imported = JSON.parse(jsonString)
      if (!Array.isArray(imported)) {
        return { success: false, message: '导入的数据必须是数组格式', count: 0 }
      }

      let addedCount = 0
      for (const item of imported) {
        if (item.keyword && typeof item.keyword === 'string') {
          const result = this.addKeyword(item.keyword, item.description || '')
          if (result) {
            addedCount++
          }
        }
      }

      return {
        success: true,
        message: `成功导入 ${addedCount} 个关键字`,
        count: addedCount
      }
    } catch (error) {
      return {
        success: false,
        message: `导入失败: ${error instanceof Error ? error.message : '未知错误'}`,
        count: 0
      }
    }
  }
}

export const jobLogManager = new JobLogManager()
export default JobLogManager

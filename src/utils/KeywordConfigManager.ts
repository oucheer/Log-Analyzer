import { KeywordConfig, ConfigVersion, AuditLog } from '../types'

class KeywordConfigManager {
  private configs: Map<string, KeywordConfig> = new Map()
  private versions: ConfigVersion[] = []
  private auditLogs: AuditLog[] = []
  private currentUser: string = 'admin'

  private generateId(): string {
    return `kw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getTimestamp(): string {
    return new Date().toISOString()
  }

  setCurrentUser(user: string): void {
    this.currentUser = user
  }

  getCurrentUser(): string {
    return this.currentUser
  }

  add(config: Omit<KeywordConfig, 'id' | 'createdAt' | 'updatedAt'>): KeywordConfig {
    const now = this.getTimestamp()
    const newConfig: KeywordConfig = {
      ...config,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    }

    this.configs.set(newConfig.id, newConfig)
    
    this.addAuditLog('create', newConfig.id, `添加关键字: ${newConfig.keyword}`, undefined, newConfig)
    this.saveVersion('添加新关键字')

    return newConfig
  }

  update(id: string, updates: Partial<KeywordConfig>): KeywordConfig | null {
    const existing = this.configs.get(id)
    if (!existing) return null

    const beforeState = { ...existing }
    const updated: KeywordConfig = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: this.getTimestamp()
    }

    this.configs.set(id, updated)
    
    this.addAuditLog('update', id, `更新关键字: ${updated.keyword}`, beforeState, updated)
    this.saveVersion('更新关键字')

    return updated
  }

  delete(id: string): boolean {
    const existing = this.configs.get(id)
    if (!existing) return false

    this.configs.delete(id)
    
    this.addAuditLog('delete', id, `删除关键字: ${existing.keyword}`, existing, undefined)
    this.saveVersion('删除关键字')

    return true
  }

  get(id: string): KeywordConfig | undefined {
    return this.configs.get(id)
  }

  getAll(): KeywordConfig[] {
    return Array.from(this.configs.values())
  }

  getEnabled(): KeywordConfig[] {
    return this.getAll().filter(c => c.enabled)
  }

  getByCategory(category: string): KeywordConfig[] {
    return this.getAll().filter(c => c.category === category)
  }

  getCategories(): string[] {
    const categories = new Set<string>()
    this.configs.forEach(c => categories.add(c.category))
    return Array.from(categories)
  }

  search(keyword: string): KeywordConfig[] {
    const lower = keyword.toLowerCase()
    return this.getAll().filter(c => 
      c.keyword.toLowerCase().includes(lower) ||
      c.description.toLowerCase().includes(lower)
    )
  }

  importConfigs(newConfigs: KeywordConfig[], mode: 'replace' | 'merge' = 'merge'): number {
    let imported = 0

    if (mode === 'replace') {
      this.configs.clear()
    }

    for (const config of newConfigs) {
      const now = this.getTimestamp()
      const newConfig: KeywordConfig = {
        ...config,
        id: config.id || this.generateId(),
        createdAt: config.createdAt || now,
        updatedAt: now
      }

      const existing = Array.from(this.configs.values()).find(c => c.keyword === newConfig.keyword)
      if (existing) {
        this.configs.set(existing.id, newConfig)
      } else {
        this.configs.set(newConfig.id, newConfig)
      }
      imported++
    }

    this.addAuditLog('import', 'bulk', `批量导入${imported}条配置`, undefined, undefined)
    this.saveVersion('批量导入配置')

    return imported
  }

  exportToJSON(): string {
    return JSON.stringify(this.getAll(), null, 2)
  }

  exportToCSV(): string {
    const configs = this.getAll()
    const headers = ['keyword', 'expectedResult', 'description', 'category', 'enabled']
    const rows = configs.map(c => [
      c.keyword,
      c.expectedResult,
      c.description,
      c.category,
      c.enabled.toString()
    ])

    return [headers.join(','), ...rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(','))].join('\n')
  }

  importFromJSON(content: string): { success: boolean; count: number; error?: string } {
    try {
      const parsed = JSON.parse(content)
      if (!Array.isArray(parsed)) {
        return { success: false, count: 0, error: 'JSON格式错误：期望数组' }
      }

      const valid = parsed.every((item: any) => 
        typeof item.keyword === 'string' && 
        typeof item.expectedResult === 'string'
      )

      if (!valid) {
        return { success: false, count: 0, error: 'JSON格式错误：缺少必要字段' }
      }

      const count = this.importConfigs(parsed)
      return { success: true, count }
    } catch (err) {
      return { success: false, count: 0, error: `解析错误: ${err instanceof Error ? err.message : '未知错误'}` }
    }
  }

  importFromCSV(content: string): { success: boolean; count: number; error?: string } {
    try {
      const lines = content.split('\n').filter(l => l.trim())
      if (lines.length < 2) {
        return { success: false, count: 0, error: 'CSV格式错误：缺少数据' }
      }

      const configs: KeywordConfig[] = []
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i])
        if (values.length >= 2) {
          configs.push({
            id: this.generateId(),
            keyword: values[0],
            expectedResult: values[1],
            description: values[2] || '',
            category: values[3] || '默认',
            enabled: values[4]?.toLowerCase() !== 'false',
            createdAt: this.getTimestamp(),
            updatedAt: this.getTimestamp()
          })
        }
      }

      const count = this.importConfigs(configs)
      return { success: true, count }
    } catch (err) {
      return { success: false, count: 0, error: `解析错误: ${err instanceof Error ? err.message : '未知错误'}` }
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())

    return result
  }

  private saveVersion(description: string): void {
    const latestVersion = this.versions.length > 0 
      ? this.versions[this.versions.length - 1].version 
      : 0

    const version: ConfigVersion = {
      id: this.generateId(),
      version: latestVersion + 1,
      configs: this.getAll(),
      createdAt: this.getTimestamp(),
      createdBy: this.currentUser,
      description
    }

    this.versions.push(version)

    if (this.versions.length > 50) {
      this.versions = this.versions.slice(-50)
    }
  }

  getVersions(): ConfigVersion[] {
    return [...this.versions]
  }

  getVersion(version: number): ConfigVersion | undefined {
    return this.versions.find(v => v.version === version)
  }

  restoreVersion(version: number): boolean {
    const targetVersion = this.getVersion(version)
    if (!targetVersion) return false

    this.configs.clear()
    targetVersion.configs.forEach(c => this.configs.set(c.id, c))
    
    this.addAuditLog('update', 'bulk', `恢复配置到版本${version}`)
    this.saveVersion(`恢复版本${version}`)

    return true
  }

  public addAuditLog(
    action: AuditLog['action'], 
    target: string, 
    details: string,
    beforeState?: KeywordConfig,
    afterState?: KeywordConfig
  ): void {
    const log: AuditLog = {
      id: this.generateId(),
      action,
      target,
      operator: this.currentUser,
      timestamp: this.getTimestamp(),
      details,
      beforeState,
      afterState
    }

    this.auditLogs.push(log)

    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000)
    }
  }

  getAuditLogs(): AuditLog[] {
    return [...this.auditLogs]
  }

  getAuditLogsByAction(action: AuditLog['action']): AuditLog[] {
    return this.auditLogs.filter(l => l.action === action)
  }

  loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('keywordConfigs')
      if (saved) {
        const parsed = JSON.parse(saved)
        this.configs.clear()
        parsed.forEach((c: KeywordConfig) => this.configs.set(c.id, c))
      }

      const savedVersions = localStorage.getItem('keywordConfigVersions')
      if (savedVersions) {
        this.versions = JSON.parse(savedVersions)
      }

      const savedLogs = localStorage.getItem('keywordAuditLogs')
      if (savedLogs) {
        this.auditLogs = JSON.parse(savedLogs)
      }
    } catch (err) {
      console.error('加载配置失败:', err)
    }
  }

  saveToStorage(): void {
    localStorage.setItem('keywordConfigs', JSON.stringify(this.getAll()))
    localStorage.setItem('keywordConfigVersions', JSON.stringify(this.versions))
    localStorage.setItem('keywordAuditLogs', JSON.stringify(this.auditLogs))
  }

  clear(): void {
    this.configs.clear()
    this.versions = []
    this.auditLogs = []
    this.addAuditLog('delete', 'bulk', '清空所有配置')
  }
}

export const keywordConfigManager = new KeywordConfigManager()
export default keywordConfigManager

import { EnhancedConfig, KeywordMapping, RepoFile, ApiInfo, BranchInfo } from '../types'

const STORAGE_KEY = 'enhancedConfigs'

interface ConfigItem {
  id: string
  name: string
  config: EnhancedConfig
  enabled: boolean
}

class EnhancedConfigManager {
  private configs: ConfigItem[] = []
  private activeConfigId: string | null = null

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        this.configs = data.configs || []
        this.activeConfigId = data.activeConfigId || null
      }
    } catch (error) {
      console.error('Failed to load enhanced configs:', error)
      this.configs = []
      this.activeConfigId = null
    }
  }

  private saveToStorage(): void {
    try {
      if (this.configs.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          configs: this.configs,
          activeConfigId: this.activeConfigId
        }))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (error) {
      console.error('Failed to save enhanced configs:', error)
    }
  }

  validateConfig(json: string): { valid: boolean; error?: string; config?: EnhancedConfig } {
    try {
      const parsed = JSON.parse(json)
      
      if (!parsed.version) {
        return { valid: false, error: '配置文件缺少version字段' }
      }

      if (!parsed.repository || !parsed.repository.name) {
        return { valid: false, error: '配置文件缺少repository信息' }
      }

      const config: EnhancedConfig = {
        version: parsed.version,
        repository: {
          name: parsed.repository.name,
          files: parsed.repository.files || []
        },
        apis: parsed.apis || [],
        branches: parsed.branches || [],
        exceptionKeywords: parsed.exceptionKeywords || [],
        logKeywords: parsed.logKeywords || [],
        mappings: [],
        suggestions: parsed.suggestions || []
      }

      config.mappings = this.buildMappings(config)
      
      return { valid: true, config }
    } catch (error) {
      return { valid: false, error: `JSON解析错误: ${error instanceof Error ? error.message : '未知错误'}` }
    }
  }

  private buildMappings(config: EnhancedConfig): KeywordMapping[] {
    const mappings: KeywordMapping[] = []

    config.exceptionKeywords.forEach(ex => {
      const branch = config.branches.find(b => b.name === ex.branch)
      const relatedApi = config.apis.find(a => a.name === ex.branch || a.description.toLowerCase().includes(ex.branch.replace('_error', '')))
      const file = relatedApi ? config.repository.files.find(f => f.path === relatedApi.file) : undefined
      
      mappings.push({
        keyword: ex.keyword,
        type: 'exception',
        filePath: file?.path,
        branch: ex.branch,
        mode: branch?.description,
        suggestion: ex.suggestion,
        severity: ex.severity
      })
    })

    config.logKeywords.forEach(lk => {
      const api = config.apis.find(a => a.name === lk.api)
      const file = api ? config.repository.files.find(f => f.path === api.file) : undefined
      
      mappings.push({
        keyword: lk.keyword,
        type: 'log',
        filePath: file?.path,
        apiName: lk.api,
        suggestion: lk.suggestion,
        severity: lk.severity
      })
    })

    return mappings
  }

  addConfig(json: string): { success: boolean; message: string; conflicts?: string[] } {
    const validation = this.validateConfig(json)
    
    if (!validation.valid || !validation.config) {
      return { success: false, message: validation.error || '配置文件格式无效' }
    }

    const conflicts = this.detectConflicts(validation.config)
    
    const newConfig: ConfigItem = {
      id: `config_${Date.now()}`,
      name: validation.config.repository.name,
      config: validation.config,
      enabled: true
    }

    this.configs.push(newConfig)
    
    if (!this.activeConfigId) {
      this.activeConfigId = newConfig.id
    }
    
    this.saveToStorage()
    
    if (conflicts.length > 0) {
      return { 
        success: true, 
        message: `配置 "${newConfig.name}" 导入成功，但检测到以下关键字冲突：`,
        conflicts
      }
    }
    
    return { success: true, message: `配置 "${newConfig.name}" 导入成功！` }
  }

  private detectConflicts(config: EnhancedConfig): string[] {
    const keywords = new Map<string, number>()
    const conflicts: string[] = []

    config.exceptionKeywords.forEach(ex => {
      const count = keywords.get(ex.keyword) || 0
      keywords.set(ex.keyword, count + 1)
    })

    config.logKeywords.forEach(lk => {
      const count = keywords.get(lk.keyword) || 0
      keywords.set(lk.keyword, count + 1)
    })

    keywords.forEach((count, keyword) => {
      if (count > 1) {
        conflicts.push(`关键字 "${keyword}" 出现${count}次`)
      }
    })

    return conflicts
  }

  removeConfig(id: string): void {
    this.configs = this.configs.filter(c => c.id !== id)
    if (this.activeConfigId === id) {
      this.activeConfigId = this.configs.length > 0 ? this.configs[0].id : null
    }
    this.saveToStorage()
  }

  toggleConfig(id: string): void {
    const config = this.configs.find(c => c.id === id)
    if (config) {
      config.enabled = !config.enabled
      this.saveToStorage()
    }
  }

  setActiveConfig(id: string): void {
    if (this.configs.find(c => c.id === id)) {
      this.activeConfigId = id
      this.saveToStorage()
    }
  }

  getConfigs(): ConfigItem[] {
    return this.configs
  }

  getActiveConfig(): EnhancedConfig | null {
    if (!this.activeConfigId) return null
    const config = this.configs.find(c => c.id === this.activeConfigId)
    return config?.enabled ? config.config : null
  }

  getAllMappings(): KeywordMapping[] {
    const allMappings: KeywordMapping[] = []
    this.configs.forEach(item => {
      if (item.enabled) {
        item.config.mappings.forEach(m => {
          allMappings.push({
            ...m,
            keyword: `${item.name}:${m.keyword}`
          })
        })
      }
    })
    return allMappings
  }

  getMappings(): KeywordMapping[] {
    const activeConfig = this.getActiveConfig()
    return activeConfig?.mappings || []
  }

  getFiles(): RepoFile[] {
    const activeConfig = this.getActiveConfig()
    return activeConfig?.repository.files || []
  }

  getApis(): ApiInfo[] {
    const activeConfig = this.getActiveConfig()
    return activeConfig?.apis || []
  }

  getBranches(): BranchInfo[] {
    const activeConfig = this.getActiveConfig()
    return activeConfig?.branches || []
  }

  getAllEnabledConfigs(): ConfigItem[] {
    return this.configs.filter(c => c.enabled)
  }

  clearAllConfigs(): void {
    this.configs = []
    this.activeConfigId = null
    this.saveToStorage()
  }

  exportConfig(id?: string): string | null {
    if (id) {
      const config = this.configs.find(c => c.id === id)
      return config ? JSON.stringify(config.config, null, 2) : null
    }
    
    const activeConfig = this.getActiveConfig()
    return activeConfig ? JSON.stringify(activeConfig, null, 2) : null
  }

  exportAllConfigs(): string | null {
    if (this.configs.length === 0) return null
    return JSON.stringify(this.configs.map(c => c.config), null, 2)
  }

  hasConfig(): boolean {
    return this.configs.length > 0
  }

  hasEnabledConfig(): boolean {
    return this.configs.some(c => c.enabled)
  }

  getActiveConfigId(): string | null {
    return this.activeConfigId
  }
}

export const enhancedConfigManager = new EnhancedConfigManager()

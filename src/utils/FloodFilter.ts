import { FloodFilterConfig, FloodStats } from '../types'

interface FloodLogEntry {
  content: string
  timestamps: number[]
  lineNumbers: number[]
}

interface FloodGroup {
  content: string
  count: number
  firstLine: number
  lastLine: number
  timeSpan: number
}

interface FilteredLog {
  originalLines: string[]
  filteredLines: string[]
  floodStats: FloodStats
}

class FloodFilter {
  private config: FloodFilterConfig = {
    enabled: false,
    timeWindowMs: 1000,
    countThreshold: 5,
    maxConsecutiveFlood: 100
  }

  setConfig(config: Partial<FloodFilterConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getConfig(): FloodFilterConfig {
    return { ...this.config }
  }

  filter(content: string): FilteredLog {
    if (!this.config.enabled) {
      return {
        originalLines: content.split('\n'),
        filteredLines: content.split('\n'),
        floodStats: {
          totalLines: content.split('\n').length,
          filteredLines: 0,
          uniqueFloodPatterns: 0,
          floodGroups: []
        }
      }
    }

    const lines = content.split('\n')
    const floodMap = new Map<string, FloodLogEntry>()
    const nonFloodLines: string[] = []
    const floodStats: FloodStats = {
      totalLines: lines.length,
      filteredLines: 0,
      uniqueFloodPatterns: 0,
      floodGroups: []
    }

    const normalizedLines = lines.map(line => this.normalizeLine(line))

    normalizedLines.forEach((normalized, index) => {
      if (!normalized || normalized.trim() === '') {
        nonFloodLines.push(lines[index])
        return
      }

      const existing = floodMap.get(normalized)
      const currentTimestamp = Date.now() + index

      if (existing) {
        const timeDiff = currentTimestamp - existing.timestamps[0]
        
        if (timeDiff <= this.config.timeWindowMs) {
          existing.timestamps.push(currentTimestamp)
          existing.lineNumbers.push(index)
          
          if (existing.timestamps.length >= this.config.countThreshold) {
            return
          }
        } else {
          if (existing.timestamps.length >= this.config.countThreshold) {
            floodStats.filteredLines += existing.timestamps.length
            floodStats.uniqueFloodPatterns++
            
            const group: FloodGroup = {
              content: existing.content,
              count: existing.timestamps.length,
              firstLine: existing.lineNumbers[0] + 1,
              lastLine: existing.lineNumbers[existing.lineNumbers.length - 1] + 1,
              timeSpan: existing.timestamps[existing.timestamps.length - 1] - existing.timestamps[0]
            }
            floodStats.floodGroups.push(group)
          }
          
          existing.timestamps = [currentTimestamp]
          existing.lineNumbers = [index]
        }
      } else {
        floodMap.set(normalized, {
          content: normalized,
          timestamps: [currentTimestamp],
          lineNumbers: [index]
        })
        nonFloodLines.push(lines[index])
      }
    })

    floodMap.forEach((entry) => {
      if (entry.timestamps.length >= this.config.countThreshold) {
        floodStats.filteredLines += entry.timestamps.length
        floodStats.uniqueFloodPatterns++
        
        const group: FloodGroup = {
          content: entry.content,
          count: entry.timestamps.length,
          firstLine: entry.lineNumbers[0] + 1,
          lastLine: entry.lineNumbers[entry.lineNumbers.length - 1] + 1,
          timeSpan: entry.timestamps[entry.timestamps.length - 1] - entry.timestamps[0]
        }
        floodStats.floodGroups.push(group)
      }
    })

    return {
      originalLines: lines,
      filteredLines: nonFloodLines,
      floodStats
    }
  }

  private normalizeLine(line: string): string {
    const timestampRegex = /^(\d{4}[-/]\d{2}[-/]\d{2}[T\s]\d{2}:\d{2}:\d{2}[,.]?\d*)?\s*/
    const cleaned = line.replace(timestampRegex, '')
    const numberRegex = /\d+/g
    const withPlaceholders = cleaned.replace(numberRegex, '#')
    return withPlaceholders.trim()
  }

  isEnabled(): boolean {
    return this.config.enabled
  }

  enable(): void {
    this.config.enabled = true
  }

  disable(): void {
    this.config.enabled = false
  }
}

export const floodFilter = new FloodFilter()
export default floodFilter

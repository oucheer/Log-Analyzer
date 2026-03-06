import React, { useState } from 'react'
import { SyntaxCheckResult, SyntaxError } from '../types'
import './SyntaxCheckPanel.css'

interface SyntaxCheckPanelProps {
  onClose?: () => void
}

const SyntaxCheckPanel: React.FC<SyntaxCheckPanelProps> = ({ onClose }) => {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [checkResult, setCheckResult] = useState<SyntaxCheckResult | null>(null)

  const sampleCode: Record<string, string> = {
    javascript: `function calculateSum(a, b) {\n  return a + b\n}\n\nconst result = calculateSum(5, 10)\nconsole.log(result)`,
    json: `{\n  "name": "Log Analyzer",\n  "version": "1.0.0"\n}`,
    python: `def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)`
  }

  const checkSyntax = () => {
    if (!code.trim()) {
      setCheckResult({ isValid: true, errors: [], language, timestamp: new Date().toISOString() })
      return
    }

    const errors: SyntaxError[] = []

    if (language === 'javascript' || language === 'typescript') {
      const lines = code.split('\n')
      lines.forEach((line, index) => {
        const trimmed = line.trim()
        const lineNum = index + 1
        if (/\{\s*$/.test(trimmed)) {
          errors.push({ line: lineNum, column: line.length, message: '不完整的大括号块', severity: 'error' })
        }
      })
      const totalOpenBrace = (code.match(/\{/g) || []).length
      const totalCloseBrace = (code.match(/\}/g) || []).length
      if (totalOpenBrace !== totalCloseBrace) {
        errors.push({ line: lines.length, column: 1, message: `大括号不匹配: 开启 ${totalOpenBrace} 个，关闭 ${totalCloseBrace} 个`, severity: 'error' })
      }
    } else if (language === 'json') {
      try {
        JSON.parse(code)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'JSON解析失败'
        errors.push({ line: 1, column: 1, message, severity: 'error' })
      }
    }

    setCheckResult({ isValid: errors.filter(e => e.severity === 'error').length === 0, errors, language, timestamp: new Date().toISOString() })
  }

  const loadSample = () => setCode(sampleCode[language] || '')

  const getSeverityIcon = (severity: string) => severity === 'error' ? '❌' : severity === 'warning' ? '⚠️' : 'ℹ️'
  const getSeverityClass = (severity: string) => severity === 'error' ? 'error-severity' : severity === 'warning' ? 'warning-severity' : 'info-severity'

  const errorCount = checkResult ? { error: checkResult.errors.filter((e: SyntaxError) => e.severity === 'error').length, warning: checkResult.errors.filter((e: SyntaxError) => e.severity === 'warning').length } : { error: 0, warning: 0 }

  return (
    <div className="syntax-panel">
      <div className="syntax-header">
        <h3>🔍 语法检查</h3>
        <div className="syntax-controls">
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="language-selector">
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="json">JSON</option>
            <option value="python">Python</option>
          </select>
          <button className="sample-btn" onClick={loadSample}>加载示例</button>
          <button className="check-btn" onClick={checkSyntax}>检查语法</button>
          {onClose && <button className="close-btn" onClick={onClose}>✕</button>}
        </div>
      </div>

      <div className="syntax-body">
        <div className="code-input-section">
          <label>代码输入:</label>
          <textarea value={code} onChange={(e) => setCode(e.target.value)} placeholder="在此输入代码..." className="code-input" spellCheck={false} />
        </div>

        {checkResult && (
          <div className="result-section">
            <div className={`result-summary ${checkResult.isValid ? 'valid' : 'invalid'}`}>
              {checkResult.isValid ? <span>✅ 语法检查通过</span> : <span>❌ 发现 {errorCount.error} 个错误</span>}
              {errorCount.warning > 0 && <span className="warning-count">⚠️ {errorCount.warning} 个警告</span>}
            </div>

            {checkResult.errors.length > 0 && (
              <div className="error-list">
                {checkResult.errors.map((err: SyntaxError, index: number) => (
                  <div key={index} className={`error-item ${getSeverityClass(err.severity)}`}>
                    <span className="error-icon">{getSeverityIcon(err.severity)}</span>
                    <span className="error-location">行 {err.line}{err.column ? `, 列 ${err.column}` : ''}</span>
                    <span className="error-message">{err.message}</span>
                    {err.code && <span className="error-code">[{err.code}]</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SyntaxCheckPanel

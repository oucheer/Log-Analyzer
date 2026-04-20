import React from 'react'
import './AboutDialog.css'

interface AboutDialogProps {
  isVisible: boolean
  onClose: () => void
}

const AboutDialog: React.FC<AboutDialogProps> = ({ isVisible, onClose }) => {
  if (!isVisible) return null

  return (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="about-header">
          <div className="about-logo">📋</div>
          <h2>Log Analyzer</h2>
          <span className="about-version">V0.1</span>
        </div>
        
        <div className="about-body">
          <div className="about-section">
            <h3>产品介绍</h3>
            <p>
              Log Analyzer 是一款功能强大的跨平台日志分析桌面应用程序，专为高效查看和分析日志文件而设计。
              该工具能够帮助开发者和运维人员快速定位问题、分析日志模式，提高工作效率。
            </p>
          </div>

          <div className="about-section">
            <h3>功能特点</h3>
            <ul className="about-features">
              <li>📁 <strong>文件操作</strong> - 支持打开单个文件或整个文件夹</li>
              <li>🔍 <strong>实时搜索</strong> - 支持关键字搜索、正则表达式、区分大小写</li>
              <li>📊 <strong>错误分析</strong> - 自动检测日志中的错误关键字</li>
              <li>📍 <strong>行号跳转</strong> - 快速跳转到指定行</li>
              <li>🎨 <strong>主题切换</strong> - 支持深色、浅色等多种主题</li>
              <li>📜 <strong>双向滚动</strong> - 支持垂直和水平滚动</li>
              <li>⚡ <strong>虚拟滚动</strong> - 高效处理大文件（100MB+）</li>
              <li>⌨️ <strong>快捷键</strong> - 支持Ctrl+F搜索、Ctrl+G跳转行号等</li>
            </ul>
          </div>

          <div className="about-section">
            <h3>版本信息</h3>
            <div className="about-info">
              <div className="info-row">
                <span className="info-label">版本号：</span>
                <span className="info-value">V0.1</span>
              </div>
              <div className="info-row">
                <span className="info-label">作者：</span>
                <span className="info-value">jiefeng.ou001</span>
              </div>
              <div className="info-row">
                <span className="info-label">联系方式：</span>
                <span className="info-value">jiefeng.ou001@pantum.local</span>
              </div>
              <div className="info-row">
                <span className="info-label">发布日期：</span>
                <span className="info-value">2026-03-16</span>
              </div>
            </div>
          </div>
        </div>

        <div className="about-footer">
          <button className="about-close-btn" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

export default AboutDialog

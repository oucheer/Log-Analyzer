import React, { useState } from 'react'
import { TaskReport } from '../types/taskReport'
import './ChartPanel.css'

interface ChartPanelProps {
  taskReports: TaskReport[]
  onClose?: () => void
}

const ChartPanel: React.FC<ChartPanelProps> = ({ taskReports, onClose }) => {
  const [chartType, setChartType] = useState<'flowchart' | 'sequence' | 'gantt' | 'status'>('flowchart')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    taskReports.length > 0 ? taskReports[0].taskId : null
  )

  const selectedTask = taskReports.find(t => t.taskId === selectedTaskId) || null

  const stats = {
    total: taskReports.length,
    completed: taskReports.filter(t => t.status === 'completed').length,
    failed: taskReports.filter(t => t.status === 'failed').length,
    running: taskReports.filter(t => t.status === 'running').length,
    successRate: taskReports.length > 0 
      ? Math.round((taskReports.filter(t => t.status === 'completed').length / 
        (taskReports.filter(t => t.status === 'completed').length + taskReports.filter(t => t.status === 'failed').length || 1)) * 100) 
      : 0
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return '#4caf50'
      case 'failed': return '#f44336'
      case 'running': return '#2196f3'
      default: return '#9e9e9e'
    }
  }

  const renderFlowChart = (task: TaskReport | null) => {
    if (!task) {
      return <div className="chart-empty">请选择任务以查看流程图</div>
    }

    const nodeWidth = 180
    const nodeHeight = 50
    const svgWidth = 600
    const svgHeight = 200

    return (
      <svg className="flowchart-svg" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
          </marker>
        </defs>

        <rect x="50" y="75" width={nodeWidth} height={nodeHeight} rx="8" fill={getStatusColor(task.status)} />
        <text x="140" y="105" textAnchor="middle" fill="white" fontWeight="bold" fontSize="14">{task.taskName}</text>

        <line x1="230" y1="100" x2="300" y2="100" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)" />

        <rect x="300" y="75" width={nodeWidth} height={nodeHeight} rx="8" fill={getStatusColor(task.status)} />
        <text x="390" y="105" textAnchor="middle" fill="white" fontWeight="bold" fontSize="14">
          {task.status === 'completed' ? '完成' : task.status === 'failed' ? '失败' : '进行中'}
        </text>
      </svg>
    )
  }

  const renderSequenceDiagram = () => {
    if (taskReports.length === 0) {
      return <div className="chart-empty">暂无任务数据</div>
    }

    const laneWidth = 150
    const headerHeight = 40
    const svgWidth = taskReports.length * laneWidth + 100
    const svgHeight = 150

    return (
      <svg className="flowchart-svg" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        {taskReports.map((task, index) => {
          const x = index * laneWidth + 60
          return (
            <g key={task.taskId}>
              <line x1={x + laneWidth / 2} y1={headerHeight} x2={x + laneWidth / 2} y2={svgHeight - 20} stroke="#666" strokeWidth="2" strokeDasharray="5,5" />
              <rect x={x} y={0} width={laneWidth} height={headerHeight} fill="#2196f3" rx="4" />
              <text x={x + laneWidth / 2} y={headerHeight / 2} textAnchor="middle" fill="white" fontWeight="bold" fontSize="11">
                {task.taskName.length > 12 ? task.taskName.substring(0, 12) + '...' : task.taskName}
              </text>
              <circle cx={x + laneWidth / 2} cy={headerHeight + 20} r="8" fill={getStatusColor(task.status)} />
            </g>
          )
        })}
      </svg>
    )
  }

  const renderGanttChart = () => {
    if (taskReports.length === 0) {
      return <div className="chart-empty">暂无任务数据</div>
    }

    const rowHeight = 40
    const labelWidth = 120
    const svgWidth = 500
    const svgHeight = taskReports.length * rowHeight + 30

    return (
      <svg className="flowchart-svg" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        {taskReports.map((task, index) => {
          const y = index * rowHeight + 20
          const progress = task.status === 'completed' ? 100 : task.status === 'failed' ? 50 : 30
          return (
            <g key={task.taskId}>
              <text x={10} y={y + 20} fill="#333" fontSize="11">{task.taskName.substring(0, 15)}</text>
              <rect x={labelWidth} y={y} width={svgWidth - labelWidth - 20} height={rowHeight - 10} fill="#f0f0f0" rx="4" />
              <rect x={labelWidth + 5} y={y + 5} width={(svgWidth - labelWidth - 40) * progress / 100} height={rowHeight - 20} fill={getStatusColor(task.status)} rx="4" />
            </g>
          )
        })}
      </svg>
    )
  }

  const renderStatusChart = () => {
    const total = stats.total
    const radius = 60
    const centerX = 150
    const centerY = 100

    if (total === 0) {
      return <div className="chart-empty">暂无任务数据</div>
    }

    const segments = [
      { label: '成功', value: stats.completed, color: '#4caf50' },
      { label: '失败', value: stats.failed, color: '#f44336' },
      { label: '进行中', value: stats.running, color: '#2196f3' }
    ]

    let currentAngle = -90

    return (
      <svg className="flowchart-svg" viewBox="0 0 300 220">
        <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="#e0e0e0" strokeWidth="25" />

        {segments.map((segment) => {
          if (segment.value === 0) return null
          const percentage = segment.value / total
          const angle = percentage * 360
          const startAngle = currentAngle
          const endAngle = currentAngle + angle
          currentAngle = endAngle

          const startRad = (startAngle * Math.PI) / 180
          const endRad = (endAngle * Math.PI) / 180
          const x1 = centerX + radius * Math.cos(startRad)
          const y1 = centerY + radius * Math.sin(startRad)
          const x2 = centerX + radius * Math.cos(endRad)
          const y2 = centerY + radius * Math.sin(endRad)
          const largeArcFlag = angle > 180 ? 1 : 0

          return (
            <path key={segment.label} d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`} fill={segment.color} />
          )
        })}

        <text x={centerX} y={centerY - 10} textAnchor="middle" fontSize="24" fontWeight="bold" fill="#333">{stats.successRate}%</text>
        <text x={centerX} y={centerY + 15} textAnchor="middle" fontSize="12" fill="#666">成功率</text>

        <g transform="translate(240, 50)">
          {segments.map((segment, index) => (
            <g key={index} transform={`translate(0, ${index * 25})`}>
              <rect width="14" height="14" fill={segment.color} rx="2" />
              <text x="20" y="11" fill="#333" fontSize="11">{segment.label}: {segment.value}</text>
            </g>
          ))}
        </g>
      </svg>
    )
  }

  return (
    <div className="chart-panel">
      <div className="chart-header">
        <h3>📊 可视化图表</h3>
        <div className="chart-controls">
          <div className="chart-type-selector">
            {(['flowchart', 'sequence', 'gantt', 'status'] as const).map(type => (
              <button key={type} className={chartType === type ? 'active' : ''} onClick={() => setChartType(type)}>
                {type === 'flowchart' ? '流程图' : type === 'sequence' ? '时序图' : type === 'gantt' ? '甘特图' : '状态图'}
              </button>
            ))}
          </div>
          {chartType === 'flowchart' && taskReports.length > 0 && (
            <select value={selectedTaskId || ''} onChange={(e) => setSelectedTaskId(e.target.value)} className="task-selector">
              {taskReports.map(task => (
                <option key={task.taskId} value={task.taskId}>{task.taskName}</option>
              ))}
            </select>
          )}
          {onClose && <button className="close-btn" onClick={onClose}>✕</button>}
        </div>
      </div>

      <div className="chart-content">
        {chartType === 'flowchart' && renderFlowChart(selectedTask)}
        {chartType === 'sequence' && renderSequenceDiagram()}
        {chartType === 'gantt' && renderGanttChart()}
        {chartType === 'status' && renderStatusChart()}
      </div>

      <div className="chart-legend">
        <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#4caf50' }}></span>成功</span>
        <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#f44336' }}></span>失败</span>
        <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#2196f3' }}></span>进行中</span>
      </div>
    </div>
  )
}

export default ChartPanel

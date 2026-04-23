# 日志恢复功能与帮助菜单完善实施计划

## 概述

本计划涵盖以下任务：
1. 实现日志恢复功能 - 添加"恢复原始日志"按钮
2. 完善帮助菜单功能 - 确认"关于"选项存在
3. 功能兼容性验证

---

## 任务1：实现日志恢复功能

### 1.1 需求分析

**目标**：新增一个"恢复原始日志"按钮，满足以下要求：
- 在用户完成日志提取操作后，点击该按钮可将当前显示的日志内容恢复为提取前的原始状态
- 当系统配置了多个关键字用于日志检索时，该按钮应支持在不同关键字检索结果之间进行切换
- 确保用户可以便捷地在各检索结果与原始日志之间切换查看

### 1.2 当前状态分析

**现有实现**：
- `jobLogExtracted` 状态：布尔值，表示是否已提取日志
- `jobLogContent` 状态：保存提取后的日志内容
- `toggleJobLogExtract` 函数：切换提取状态

**存在的问题**：
- 缺少专门的"恢复原始日志"UI按钮
- 没有在不同关键字结果之间切换的功能
- 用户体验不够直观

### 1.3 技术设计

#### 1.3.1 状态管理增强

```typescript
// App.tsx 需要新增的状态

// 当前提取结果的历史记录（用于在不同结果间切换）
const [extractionHistory, setExtractionHistory] = useState<JobLogExtractResult[]>([])

// 当前查看的历史记录索引
const [historyIndex, setHistoryIndex] = useState<number>(-1)

// 是否正在查看历史记录
const isViewingHistory = historyIndex >= 0
```

#### 1.3.2 核心函数

```typescript
// 保存提取结果到历史记录
const saveToHistory = (result: JobLogExtractResult) => {
  // 将新结果添加到历史记录
  // 清除当前结果之后的所有历史（如果在中间查看）
  // 更新historyIndex为最新
}

// 恢复到原始日志
const restoreOriginalLog = () => {
  setJobLogExtracted(false)
  setJobLogContent(null)
  setHistoryIndex(-1)
}

// 查看历史记录中的上一个结果
const viewPreviousResult = () => {
  if (historyIndex > 0) {
    setHistoryIndex(prev => prev - 1)
    setJobLogContent(extractionHistory[historyIndex - 1].extractedContent)
  }
}

// 查看历史记录中的下一个结果
const viewNextResult = () => {
  if (historyIndex < extractionHistory.length - 1) {
    setHistoryIndex(prev => prev + 1)
    setJobLogContent(extractionHistory[historyIndex + 1].extractedContent)
  }
}
```

#### 1.3.3 UI组件设计

**恢复控制栏** - 在日志显示区域顶部添加：

```tsx
// 位置：LogViewer 上方或 EnhancedAnalysisPane 附近
{jobLogExtracted && (
  <div className="joblog-control-bar">
    <span className="current-info">
      当前显示: {historyIndex >= 0 
        ? `第 ${historyIndex + 1} 个结果 (${extractionHistory[historyIndex].matchedKeyword})`
        : '最后一次提取'}
    </span>
    <div className="control-buttons">
      <button 
        onClick={viewPreviousResult}
        disabled={historyIndex <= 0}
        title="查看上一个结果"
      >
        ◀ 上一个
      </button>
      <button 
        onClick={restoreOriginalLog}
        className="restore-btn"
        title="恢复原始日志"
      >
        🔄 恢复原始日志
      </button>
      <button 
        onClick={viewNextResult}
        disabled={historyIndex >= extractionHistory.length - 1}
        title="查看下一个结果"
      >
       下一个 ▶
      </button>
    </div>
    <span className="history-info">
      共 {extractionHistory.length} 个结果
    </span>
  </div>
)}
```

### 1.4 实现步骤

1. **修改 App.tsx 状态管理** (20分钟)
   - 添加 extractionHistory 状态
   - 添加 historyIndex 状态
   - 修改 handleJobLogExtract 保存历史记录
   - 添加导航函数

2. **添加恢复控制栏组件** (30分钟)
   - 创建控制栏UI
   - 添加CSS样式
   - 集成到主界面

3. **测试验证** (20分钟)
   - 测试单次提取
   - 测试多次提取的历史记录
   - 测试导航功能

---

## 任务2：完善帮助菜单功能

### 2.1 当前状态

**已实现**：
- Toolbar 中已添加 `help-wrapper` 组件
- 帮助菜单包含"关于"选项
- 点击可打开 AboutDialog

### 2.2 验证清单

- [x] 帮助按钮存在于工具栏
- [x] 帮助菜单包含"关于"选项
- [x] 关于对话框可正常显示版本信息
- [x] 关于对话框包含开发者信息

**结论**：任务2已完成，无需额外修改。

---

## 任务3：功能兼容性验证

### 3.1 回归测试清单

| 功能模块 | 测试项 | 验证方式 |
|---------|-------|---------|
| 文件操作 | 打开文件/文件夹 | 手动测试 |
| 搜索功能 | 关键字搜索 | 手动测试 |
| 搜索功能 | 正则搜索 | 手动测试 |
| 刷屏过滤 | 启用/禁用 | 手动测试 |
| 智能分析 | JSON配置导入 | 手动测试 |
| 作业日志 | 提取功能 | 手动测试 |
| 主题切换 | 深色/浅色主题 | 手动测试 |
| 字体调整 | 放大/缩小 | 手动测试 |

### 3.2 兼容性保证措施

1. 所有新增状态都有默认值
2. 不修改现有的日志显示逻辑
3. 只在用户主动触发时改变行为

---

## 实施时间表

| 阶段 | 任务 | 预计时间 | 依赖 |
|-----|------|---------|------|
| 1 | 修改App.tsx状态管理 | 20分钟 | 无 |
| 2 | 添加恢复控制栏UI | 30分钟 | 阶段1 |
| 3 | 回归测试 | 20分钟 | 阶段1,2 |
| **总计** | | **~70分钟** | |

---

## 验收标准

1. **日志恢复功能**：
   - [ ] 点击"恢复原始日志"按钮可恢复原始日志显示
   - [ ] 支持查看多个提取结果的历史记录
   - [ ] 可在上一个/下一个结果之间切换
   - [ ] 状态栏显示当前查看的结果信息

2. **帮助菜单**：
   - [ ] 帮助按钮存在于工具栏
   - [ ] 点击显示包含"关于"选项的菜单
   - [ ] 关于对话框正常显示

3. **功能兼容性**：
   - [ ] 所有核心功能正常工作
   - [ ] 无JavaScript错误
   - [ ] 界面布局正常

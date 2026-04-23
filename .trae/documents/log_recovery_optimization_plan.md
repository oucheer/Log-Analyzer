# 日志恢复功能优化实施计划

## 概述

本计划涵盖以下任务：
1. 实现文本原始日志的完整恢复功能
2. 优化恢复的UI界面 - 缩小占据空间，添加可伸缩控制功能
3. 功能兼容性验证

---

## 任务1：实现文本原始日志的完整恢复功能

### 1.1 问题分析

**当前实现**：
- `baseContent` 定义为：`floodFilterConfig.enabled && filteredContent ? filteredContent : (currentFile?.content || '')`
- 恢复时使用 `baseContent`，但这会受到刷屏过滤配置的影响

**潜在问题**：
- 如果用户在启用刷屏过滤后进行日志提取，恢复时可能显示的是过滤后的内容而非原始内容
- 需要确保恢复的是**完全原始**的日志内容（不受刷屏过滤影响）

### 1.2 解决方案

```typescript
// 新增状态保存原始内容
const [originalContent, setOriginalContent] = useState<string | null>(null)

// 修改 handleJobLogExtract - 保存原始内容
const handleJobLogExtract = (result: JobLogExtractResult) => {
  // 保存当前文件的原始内容（不受刷屏过滤影响）
  setOriginalContent(currentFile?.content || null)
  // ... 其他逻辑
}

// 修改 restoreOriginalLog - 恢复到真正的原始内容
const restoreOriginalLog = () => {
  setJobLogExtracted(false)
  setJobLogContent(null)
  setHistoryIndex(-1)
  // 恢复到原始内容，而不是受过滤影响的baseContent
  if (originalContent) {
    setJobLogContent(originalContent)
    // 短暂显示原始内容后清除
    setTimeout(() => setJobLogContent(null), 0)
  }
}
```

### 1.3 实现步骤

1. 添加 `originalContent` 状态保存原始日志内容
2. 在日志提取时保存原始内容
3. 修复恢复逻辑，确保恢复的是完全原始的内容

---

## 任务2：优化恢复UI界面

### 2.1 当前状态

- 控制栏固定占据一行（padding: 10px 20px）
- 按钮文本较长（"恢复原始日志"）
- 无折叠功能

### 2.2 优化方案

**设计目标**：
- 缩小占据空间（更紧凑的布局）
- 添加可伸缩/折叠控制功能
- 更好的用户体验

**UI设计**：
```
[▼] [上一个] [恢复] [下一个] [共X个]    <- 折叠状态（收缩时）
[◀] [上一个] [🔄 恢复原始日志] [下一个 ▶] [共 X 个结果]    <- 展开状态
```

**实现**：
1. 添加折叠状态控制（`isControlBarCollapsed`）
2. 缩小padding和间距
3. 折叠/展开按钮
4. 悬停展开功能（可选）

### 2.3 CSS样式优化

```css
.joblog-control-bar {
  /* 缩小padding */
  padding: 6px 12px;
  /* 添加过渡动画 */
  transition: all 0.3s ease;
}

.joblog-control-bar.collapsed {
  /* 折叠状态只显示图标按钮 */
  padding: 4px 8px;
}

.joblog-control-bar .control-buttons button {
  /* 缩小按钮 */
  padding: 4px 8px;
  font-size: 12px;
}
```

---

## 任务3：功能兼容性验证

### 3.1 回归测试清单

| 功能模块 | 测试项 |
|---------|-------|
| 文件操作 | 打开文件/文件夹 |
| 日志显示 | 原始日志显示 |
| 日志提取 | 提取功能 |
| 日志恢复 | 恢复功能 |
| 刷屏过滤 | 启用/禁用 |
| 主题切换 | 深色/浅色 |

### 3.2 兼容性保证

- 不修改现有的日志显示逻辑
- 新增状态有默认值
- 只在用户主动触发时改变行为

---

## 实施时间表

| 阶段 | 任务 | 预计时间 |
|-----|------|---------|
| 1 | 添加originalContent状态 | 10分钟 |
| 2 | 修复恢复逻辑 | 10分钟 |
| 3 | 优化UI - 添加折叠功能 | 20分钟 |
| 4 | 优化CSS样式 | 15分钟 |
| 5 | 测试验证 | 15分钟 |
| **总计** | | **~70分钟** |

---

## 验收标准

1. **日志恢复功能**：
   - [ ] 点击恢复按钮后显示的是完全原始的日志内容
   - [ ] 不受刷屏过滤配置影响
   - [ ] 信息无丢失，格式完全一致

2. **UI优化**：
   - [ ] 控制栏占据空间更小
   - [ ] 可以折叠/展开
   - [ ] 折叠状态可点击展开

3. **功能兼容性**：
   - [ ] 所有核心功能正常工作
   - [ ] 无JavaScript错误

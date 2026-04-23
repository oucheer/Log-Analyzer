# 日志分析增强功能实施计划

## 任务概述

开发一个智能日志分析增强功能，支持通过JSON配置文件定义代码仓库结构、API信息、分支信息和关键字映射，实现自动化问题定位。

## 实施步骤

### 1. 创建数据类型定义

* 文件：`src/types.ts`

* 添加以下类型：

  * `RepoFile`: 代码仓库文件结构

  * `ApiInfo`: API信息

  * `BranchInfo`: 分支信息

  * `ExceptionKeyword`: 异常场景关键字

  * `LogKeyword`: 关键日志关键字

  * `KeywordMapping`: 关键字映射关系

  * `ProcessingSuggestion`: 处理建议

  * `EnhancedConfig`: 增强配置文件结构

### 2. 创建配置管理工具类

* 文件：`src/utils/EnhancedConfigManager.ts`

* 功能：

  * JSON配置文件解析和验证

  * 映射关系存储（localStorage）

  * 配置导入/导出

  * 关键字冲突检测

### 3. 创建智能匹配引擎

* 文件：`src/utils/EnhancedMatchEngine.ts`

* 功能：

  * 多关键字并行匹配

  * 上下文提取

  * 映射关系查询

  * 匹配结果排序

### 4. 创建增强分析面板组件

* 文件：`src/components/EnhancedAnalysisPane.tsx`

* 文件：`src/components/EnhancedAnalysisPane.css`

* 功能：

  * JSON配置导入入口

  * 匹配结果展示

  * 处理建议显示

  * 文件路径和API信息展示

### 5. 修改Toolbar添加工具入口

* 文件：`src/components/Toolbar.tsx`

* 在工具菜单中添加"智能分析"选项

### 6. 修改App.tsx集成功能

* 文件：`src/App.tsx`

* 添加EnhancedAnalysisPane组件

* 添加相关状态管理

* 集成到现有界面

### 7. 错误处理机制

* JSON格式验证

* 关键字冲突警告

* 解析异常处理

* 空配置处理

## JSON配置文件格式示例

```json
{
  "version": "1.0",
  "repository": {
    "name": "项目名称",
    "files": [
      { "path": "src/print/module.ts", "module": "打印模块" },
      { "path": "src/scan/engine.ts", "module": "扫描模块" }
    ]
  },
  "apis": [
    { "name": "printDocument", "file": "src/print/module.ts", "description": "打印文档" }
  ],
  "branches": [
    { "name": "print_error", "description": "打印异常分支" },
    { "name": "scan_error", "description": "扫描异常分支" }
  ],
  "exceptionKeywords": [
    { "keyword": "print_err", "branch": "print_error", "suggestion": "请检查打印服务配置" }
  ],
  "logKeywords": [
    { "keyword": "timeout", "api": "printDocument", "suggestion": "检查网络连接" }
  ]
}
```

## 匹配结果显示格式

* 文件路径

* API名称

* 所属模式

* 异常分支

* 推荐处理方式

## 注意事项

* 不修改现有功能

* 保持UI一致性

* 支持可扩展性

* 添加适当的错误提示


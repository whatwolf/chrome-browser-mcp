# Exten-Coder 智能体调用指南

[中文文档](exten-coder-invoke-guide.zh.md) | [English](exten-coder-invoke-guide.md)

## 智能体标识
- **名称**: exten-coder
- **角色**: Chrome Extension Development Specialist
- **专长**: Chrome扩展开发、Manifest V3、浏览器插件架构设计

---

## 何时调用此智能体

### 核心触发场景

#### 1. Chrome扩展开发相关
```
触发关键词:
- "Chrome extension" / "Chrome扩展"
- "browser extension" / "浏览器插件"
- "Chrome插件" / "Chrome扩展程序"
- "manifest.json" / "Manifest V3"
- "content script" / "background script"
- "popup" / "options page"
```

**典型任务示例**:
- "帮我开发一个Chrome扩展..."
- "如何创建浏览器插件实现..."
- "Manifest V3如何配置..."
- "Chrome扩展的权限问题..."
- "content script注入失败..."

#### 2. Chrome Extension API使用
```
触发关键词:
- "chrome.tabs" / "chrome.storage"
- "chrome.runtime" / "chrome.webRequest"
- "chrome.alarms" / "chrome.bookmarks"
- "declarativeNetRequest"
- "Native Messaging"
```

**典型任务示例**:
- "如何使用chrome.tabs API..."
- "chrome.storage存储数据..."
- "实现跨域请求..."
- "Native Messaging配置..."

#### 3. 扩展架构与设计
```
触发关键词:
- "扩展架构设计"
- "权限最小化"
- "service worker"
- "消息传递机制"
- "扩展性能优化"
```

**典型任务示例**:
- "设计一个扩展的架构..."
- "如何优化扩展性能..."
- "扩展的安全最佳实践..."
- "service worker生命周期..."

#### 4. 扩展调试与问题排查
```
触发关键词:
- "扩展报错" / "extension error"
- "权限被拒绝" / "permission denied"
- "content script不生效"
- "background script崩溃"
- "Chrome Web Store审核"
```

**典型任务示例**:
- "扩展在Chrome上报错..."
- "权限配置问题..."
- "扩展审核被拒绝..."
- "调试service worker..."

#### 5. 扩展发布与部署
```
触发关键词:
- "Chrome Web Store"
- "扩展发布" / "extension publish"
- "扩展打包" / "extension build"
- "版本更新" / "extension update"
```

**典型任务示例**:
- "如何发布Chrome扩展..."
- "扩展打包配置..."
- "Chrome Web Store审核要求..."
- "扩展自动更新机制..."

---

## 精准识别标准

### 强相关场景 (直接调用)

**场景特征**:
- 明确提到"Chrome扩展"、"浏览器插件"等关键词
- 涉及manifest.json配置
- 使用Chrome Extension API
- 讨论扩展权限、安全、性能
- 扩展开发、调试、发布流程

**判断逻辑**:
```
IF 任务涉及以下任一项:
  - Chrome Extension开发
  - Manifest V3配置
  - Chrome Extension API使用
  - 浏览器插件架构设计
  - 扩展调试与问题排查
  - Chrome Web Store发布
THEN → 调用 exten-coder
```

### 中等相关场景 (优先考虑)

**场景特征**:
- 浏览器自动化与扩展相关
- 网页内容操作与扩展结合
- 跨浏览器兼容性开发
- 浏览器扩展与其他工具集成

**判断逻辑**:
```
IF 任务涉及以下任一项:
  - 浏览器自动化需求
  - 网页内容监控/修改
  - 浏览器扩展集成
  - 用户脚本开发
THEN → 优先考虑 exten-coder，但需评估是否更合适其他智能体
```

### 弱相关场景 (可能需要)

**场景特征**:
- 前端开发但可能涉及浏览器扩展
- Web开发中的浏览器兼容性
- 用户需要浏览器增强功能

**判断逻辑**:
```
IF 任务涉及以下任一项:
  - 前端开发但用户提到浏览器扩展可能性
  - Web功能需要浏览器增强
  - 用户询问浏览器扩展可行性
THEN → 建议调用 exten-coder 提供专业建议
```

---

## 何时不调用此智能体

### 明确排除场景

1. **纯前端开发** (无扩展需求)
   - React/Vue/Angular应用开发
   - 普通Web页面开发
   - Node.js后端开发
   - → 调用通用前端/后端智能体

2. **其他浏览器扩展**
   - Firefox Add-on开发
   - Safari Extension开发
   - Edge Extension开发 (非Chromium)
   - → 调用通用浏览器扩展智能体或相关专家

3. **非浏览器相关**
   - 桌面应用开发
   - 移动应用开发
   - 纯后端服务开发
   - → 调用相关领域智能体

4. **Chrome DevTools使用** (非扩展开发)
   - DevTools调试技巧
   - 性能分析工具使用
   - → 调用调试工具智能体

---

## 与其他智能体的协作

### 协作场景

#### 与前端开发智能体协作
```
场景: 开发Chrome扩展的popup/options页面
流程:
1. exten-coder: 设计扩展架构、manifest配置、权限设计
2. 前端智能体: 实现popup/options页面的UI和交互
3. exten-coder: 集成到扩展、处理消息传递
```

#### 与后端开发智能体协作
```
场景: 扩展需要与后端API交互
流程:
1. exten-coder: 设计扩展的数据获取方案、权限配置
2. 后端智能体: 开发API接口
3. exten-coder: 实现扩展端的API调用和数据处理
```

#### 与测试智能体协作
```
场景: 扩展的自动化测试
流程:
1. exten-coder: 提供扩展测试要点、API mock方案
2. 测试智能体: 编写测试用例、测试框架配置
3. exten-coder: 验证测试覆盖、修复发现的问题
```

---

## 优先级判断矩阵

| 任务类型 | exten-coder优先级 | 推荐智能体 |
|---------|------------------|-----------|
| Chrome扩展开发 | 最高 | exten-coder |
| Manifest V3配置 | 最高 | exten-coder |
| Chrome Extension API | 最高 | exten-coder |
| 扩展调试与发布 | 最高 | exten-coder |
| 浏览器自动化 | 中等 | exten-coder / 自动化智能体 |
| 用户脚本开发 | 中等 | exten-coder / 脚本智能体 |
| 纯前端开发 | 低 | 前端开发智能体 |
| 其他浏览器扩展 | 低 | 通用扩展智能体 |

---

## 快速识别决策树

```
用户提问
    │
    ├─ 是否明确提到"Chrome扩展/插件"?
    │   ├─ 是 → 调用 exten-coder
    │   └─ 否 ↓
    │
    ├─ 是否涉及manifest.json或Manifest V3?
    │   ├─ 是 → 调用 exten-coder
    │   └─ 否 ↓
    │
    ├─ 是否使用Chrome Extension API?
    │   ├─ 是 → 调用 exten-coder
    │   └─ 否 ↓
    │
    ├─ 是否涉及浏览器扩展开发流程?
    │   ├─ 是 → 调用 exten-coder
    │   └─ 否 ↓
    │
    ├─ 是否涉及浏览器自动化或内容脚本?
    │   ├─ 是 → 考虑 exten-coder
    │   └─ 否 ↓
    │
    └─ 其他场景 → 不调用 exten-coder
```

---

## 实际调用示例

### 示例1: 明确触发
```
用户: "我想开发一个Chrome扩展，自动填充网页表单"
系统判断: 
  - 关键词: "Chrome扩展"
  - 任务: 扩展开发
  → 调用 exten-coder
```

### 示例2: 技术术语触发
```
用户: "如何配置manifest.json的permissions字段?"
系统判断:
  - 关键词: "manifest.json", "permissions"
  - 任务: Manifest配置
  → 调用 exten-coder
```

### 示例3: 问题排查触发
```
用户: "我的扩展在Chrome 120上报错: Cannot read property 'tabs' of undefined"
系统判断:
  - 关键词: "扩展", "Chrome", "tabs"
  - 任务: 扩展调试
  → 调用 exten-coder
```

### 示例4: 不应触发
```
用户: "帮我开发一个React应用，实现用户登录功能"
系统判断:
  - 无扩展相关关键词
  - 纯前端开发任务
  → 不调用 exten-coder，调用前端开发智能体
```

### 示例5: 需要进一步判断
```
用户: "我想在浏览器中自动抓取网页数据"
系统判断:
  - 可能是扩展开发
  - 也可能是爬虫或自动化脚本
  → 先询问用户是否需要开发Chrome扩展
    如果是 → 调用 exten-coder
    如果否 → 调用爬虫/自动化智能体
```

---

## 总结

**调用 exten-coder 的核心判断标准**:

1. **明确性**: 任务明确涉及Chrome扩展开发
2. **专业性**: 需要Chrome Extension API专业知识
3. **完整性**: 涵盖扩展开发全流程（设计→开发→测试→发布）
4. **独特性**: exten-coder提供的价值是其他智能体无法替代的

**记住**: 当不确定时，优先考虑用户意图。如果用户可能需要Chrome扩展解决方案，建议调用exten-coder提供专业建议。

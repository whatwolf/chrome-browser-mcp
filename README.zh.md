# Chrome Browser MCP

通过 MCP (Model Context Protocol) 协议控制 Chrome 浏览器，实现网页理解、JavaScript 执行、页面监控和 Chrome 扩展管理。

[English](README.md) | [中文文档](README.zh.md)

## 🎯 核心价值

- **网页理解**: AI 可以完整理解目标网页的 DOM 结构、JS 逻辑、网络请求
- **实时调试**: 在 IDE 中直接执行代码并观察浏览器变化
- **自动化测试**: 自动运行测试用例，验证插件功能
- **智能开发**: 配合 exten-coder 智能体，实现"理解网页 → 生成代码 → 自动测试 → 验证效果"的闭环

## 📁 项目结构

```
extenDevTools/
├── README.md                             # 英文文档
├── README.zh.md                          # 本文件（中文）
├── skill.md                              # Skill 使用文档
├── skill.zh.md                           # Skill 使用文档（中文）
├── exten-coder-agent-prompt.md           # exten-coder 智能体提示词
├── exten-coder-invoke-guide.md           # 智能体调用指南
└── chrome-browser-mcp/                   # MCP Server 实现
    ├── README.md                         # MCP Server 文档
    ├── package.json                      # 项目配置
    ├── tsconfig.json                     # TypeScript 配置
    └── src/                              # 源代码
        ├── index.ts                      # MCP Server 入口
        ├── cdp-manager.ts                # CDP 连接管理
        ├── browser-controller.ts         # 浏览器控制
        └── js-tester.ts                  # JS 测试和扩展管理
```

## 🚀 快速开始

### 前置要求

- Node.js 18+
- Chrome 浏览器（需支持远程调试）
- Trae IDE（或其他支持 MCP 的 IDE）

### 1. 启动 Chrome 浏览器（远程调试模式）

#### 方式一：Chrome 146+ 官方开关（推荐）

从 **Chrome 146+** 开始，可以通过内置开关启用远程调试，无需命令行：

1. 在 Chrome 地址栏输入：`chrome://inspect/#remote-debugging`
2. 打开 **Remote debugging** 开关
3. Chrome 将自动监听 `localhost:9222` 调试端口

这种方式与命令行启动效果完全相同，AI Agent 可以直接连接。

#### 方式二：命令行启动

**macOS:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="/Users/$(whoami)/ChromeDev"
```

**Windows:**
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --remote-debugging-port=9222 ^
  --user-data-dir="%USERPROFILE%\ChromeDev"
```

**Linux:**
```bash
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/ChromeDev"
```

### 2. 安装 MCP Server

```bash
cd chrome-browser-mcp
npm install
npm run build
```

### 3. 配置 MCP 客户端

在 MCP 客户端配置中添加：

```json
{
  "mcpServers": {
    "chrome-browser": {
      "command": "node",
      "args": ["/path/to/extenDevTools/chrome-browser-mcp/dist/index.js"],
      "env": {
        "CHROME_HOST": "localhost",
        "CHROME_PORT": "9222"
      }
    }
  }
}
```

或使用 npx（发布到 npm 后）：

```json
{
  "mcpServers": {
    "chrome-browser": {
      "command": "npx",
      "args": ["-y", "chrome-browser-mcp"],
      "env": {
        "CHROME_HOST": "localhost",
        "CHROME_PORT": "9222"
      }
    }
  }
}
```

## 🔧 可用工具

### 连接管理

| 工具 | 描述 |
|------|------|
| `browser_connect` | 连接到已运行的 Chrome 浏览器 |
| `browser_disconnect` | 断开与浏览器的连接 |
| `browser_status` | 获取浏览器连接状态 |

### 页面管理

| 工具 | 描述 |
|------|------|
| `page_list` | 列出所有打开的页面 |
| `page_open` | 打开新页面 |
| `page_attach` | 附加到指定页面 |
| `page_close` | 关闭当前页面 |
| `page_navigate` | 导航到指定 URL |
| `page_back` | 后退到上一页 |
| `page_forward` | 前进到下一页 |
| `page_reload` | 刷新页面 |

### 页面内容获取

| 工具 | 描述 |
|------|------|
| `page_get_html` | 获取页面 HTML |
| `page_get_text` | 获取页面文本内容 |
| `page_get_snapshot` | 获取页面完整快照（HTML、文本、DOM 结构） |
| `page_query_selector` | 查询单个元素 |
| `page_query_selector_all` | 查询所有匹配元素 |

### 截图和视口

| 工具 | 描述 |
|------|------|
| `page_screenshot` | 截取页面截图 |
| `page_set_viewport` | 设置视口大小 |

### JavaScript 执行

| 工具 | 描述 |
|------|------|
| `js_execute` | 在页面中执行 JavaScript 代码 |
| `js_run_tests` | 运行测试代码（支持 describe/it/expect 语法） |
| `js_inject_script` | 注入外部脚本 |
| `js_inject_styles` | 注入 CSS 样式 |
| `js_get_globals` | 获取页面全局变量列表 |

### 监控

| 工具 | 描述 |
|------|------|
| `monitor_console` | 获取控制台消息 |
| `monitor_network` | 获取网络请求记录 |

### 扩展程序管理

| 工具 | 描述 |
|------|------|
| `extension_list` | 列出已安装的扩展程序 |
| `extension_get_info` | 获取扩展程序详细信息 |
| `extension_enable` | 启用扩展程序 |
| `extension_disable` | 禁用扩展程序 |
| `extension_reload` | 重新加载扩展程序 |
| `extension_execute` | 在扩展程序上下文中执行代码 |
| `extension_get_storage` | 获取扩展程序存储数据 |
| `extension_set_storage` | 设置扩展程序存储数据 |

### 会话管理

| 工具 | 描述 |
|------|------|
| `session_set` | 设置当前活动会话 |
| `session_list` | 列出所有活动会话 |

## 💡 使用示例

### 示例 1：打开页面并获取内容

```
1. browser_connect
2. page_open {"url": "https://example.com"}
3. page_get_snapshot {"includeScreenshot": false}
4. page_close
5. browser_disconnect
```

### 示例 2：执行 JavaScript 测试

```
1. browser_connect
2. page_open {"url": "https://example.com"}
3. js_run_tests {"testCode": "describe('Page', () => {\n  it('should have title', () => {\n    expect(document.title).toBeTruthy();\n  });\n});"}
4. page_close
5. browser_disconnect
```

### 示例 3：测试 Chrome 扩展程序

```
1. browser_connect
2. page_open {"url": "chrome://extensions"}
3. extension_list {}
4. extension_get_storage {"extensionId": "xxx"}
5. extension_reload {"extensionId": "xxx"}
6. page_close
7. browser_disconnect
```

## 🎓 典型工作流程

### 网页测试流程

```
browser_connect
    ↓
page_open (目标页面)
    ↓
js_execute (注入测试代码)
    ↓
js_run_tests (运行测试)
    ↓
monitor_console (检查控制台)
    ↓
page_close
    ↓
browser_disconnect
```

### 扩展程序调试流程

```
browser_connect
    ↓
page_open (测试页面)
    ↓
extension_list (获取扩展列表)
    ↓
extension_execute (执行扩展代码)
    ↓
extension_get_storage (检查存储)
    ↓
page_close
    ↓
browser_disconnect
```

## 🛠️ 技术栈

- **Chrome DevTools Protocol**: 通过 CDP 协议控制浏览器
- **MCP Protocol**: Model Context Protocol 实现
- **TypeScript**: 类型安全的开发语言
- **Node.js 18+**: 运行时环境

## 🔄 与官方 Chrome DevTools MCP 的对比

### 官方 chrome-devtools-mcp

Google 官方推出的 MCP 服务器，支持 `--autoConnect` 自动连接功能：

| 特性 | 说明 |
|------|------|
| `--autoConnect` | 自动连接已开启远程调试的 Chrome |
| 性能分析 | 支持 performance 追踪、Lighthouse 审计 |
| 输入自动化 | 点击、拖拽、填表、按键等 |
| 官方维护 | Google 团队持续更新 |

**配置示例：**
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest", "--autoConnect"]
    }
  }
}
```

### chrome-browser-mcp（本项目）

你的 MCP 服务在以下场景有独特优势：

| 特性 | 说明 |
|------|------|
| **扩展管理** | ✅ 支持启用/禁用/重载扩展、操作存储 |
| **JS 测试框架** | ✅ 支持 describe/it/expect 语法 |
| **会话管理** | ✅ 支持多会话切换 |
| **轻量级** | 依赖少，安装简单 |

### 如何选择

| 使用场景 | 推荐方案 |
|---------|---------|
| 日常浏览器控制 | 官方 `chrome-devtools-mcp` |
| Chrome 扩展开发 | `chrome-browser-mcp`（本项目） |
| 需要 JS 测试能力 | `chrome-browser-mcp`（本项目） |
| 需要性能分析 | 官方 `chrome-devtools-mcp` |

### 连接方式对比

两种方案都需要先开启 Chrome 远程调试：

| Chrome 版本 | 开启方式 |
|------------|---------|
| Chrome 146+ | `chrome://inspect/#remote-debugging` 开关 |
| 旧版本 | 命令行 `--remote-debugging-port=9222` |

开启后，两个 MCP 服务都能连接到 `localhost:9222`。

## 📝 相关文档

- [skill.md](skill.md) - Skill 详细使用文档
- [exten-coder-agent-prompt.md](exten-coder-agent-prompt.md) - exten-coder 智能体提示词
- [exten-coder-invoke-guide.md](exten-coder-invoke-guide.md) - 智能体调用指南
- [chrome-browser-mcp/README.md](chrome-browser-mcp/README.md) - MCP Server 详细文档
- [README.md](README.md) - English Documentation

## 📄 许可证

MIT

---

**开始你的智能插件开发之旅吧！** 🚀

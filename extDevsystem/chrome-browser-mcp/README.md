# Chrome Browser Control Skill

## 概述

Chrome Browser Control Skill 允许 IDE AI 通过 MCP (Model Context Protocol) 完全控制 Chrome 浏览器，实现页面代码获取、监控页面变化、测试 JS 代码等功能。

## 前置要求

### 1. 启动 Chrome 浏览器

在使用此 Skill 之前，必须以远程调试模式启动 Chrome：

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

### 2. 安装 MCP 服务器

```bash
cd /Volumes/workspace/codespace/extenDevTools/extDevsystem/chrome-browser-mcp
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
      "args": ["/Volumes/workspace/codespace/extenDevTools/extDevsystem/chrome-browser-mcp/dist/index.js"],
      "env": {
        "CHROME_HOST": "localhost",
        "CHROME_PORT": "9222"
      }
    }
  }
}
```

## 可用工具

### 连接管理

#### browser_connect
连接到已运行的 Chrome 浏览器。

```json
{}
```

#### browser_disconnect
断开与浏览器的连接。

```json
{}
```

#### browser_status
获取浏览器连接状态。

```json
{}
```

### 页面管理

#### page_list
列出所有打开的页面。

```json
{}
```

#### page_open
打开新页面。

```json
{
  "url": "https://example.com"
}
```

#### page_attach
附加到指定页面。

```json
{
  "targetId": "page-target-id"
}
```

#### page_close
关闭当前页面。

```json
{}
```

#### page_navigate
导航到指定 URL。

```json
{
  "url": "https://example.com"
}
```

#### page_back
后退到上一页。

```json
{}
```

#### page_forward
前进到下一页。

```json
{}
```

#### page_reload
刷新页面。

```json
{
  "ignoreCache": true
}
```

### 页面内容获取

#### page_get_html
获取页面 HTML。

```json
{
  "selector": "#main-content"
}
```

不指定 selector 则获取整个页面 HTML。

#### page_get_text
获取页面文本内容。

```json
{}
```

#### page_get_snapshot
获取页面完整快照。

```json
{
  "includeScreenshot": true
}
```

返回内容：
- `url`: 页面 URL
- `title`: 页面标题
- `html`: 完整 HTML
- `text`: 文本内容
- `structure`: DOM 结构树
- `screenshot`: Base64 编码截图（可选）

#### page_query_selector
查询单个元素。

```json
{
  "selector": "h1.title"
}
```

#### page_query_selector_all
查询所有匹配元素。

```json
{
  "selector": "a[href]"
}
```

### 截图和视口

#### page_screenshot
截取页面截图。

```json
{
  "format": "png",
  "quality": 80
}
```

#### page_set_viewport
设置视口大小。

```json
{
  "width": 1920,
  "height": 1080,
  "deviceScaleFactor": 2
}
```

### JavaScript 执行

#### js_execute
在页面中执行 JavaScript 代码。

```json
{
  "code": "document.querySelector('h1').textContent",
  "timeout": 5000
}
```

返回：
```json
{
  "success": true,
  "value": "Hello World",
  "console": [],
  "duration": 12
}
```

#### js_run_tests
运行测试代码（支持 describe/it/expect 语法）。

```json
{
  "testCode": "describe('Math', () => {\n  it('should add numbers', () => {\n    expect(1 + 1).toBe(2);\n  });\n});"
}
```

支持的断言方法：
- `toBe(expected)` - 严格相等
- `toEqual(expected)` - 深度相等
- `toBeTruthy()` - 为真
- `toBeFalsy()` - 为假
- `toContain(expected)` - 包含
- `toBeGreaterThan(expected)` - 大于
- `toBeLessThan(expected)` - 小于
- `toThrow()` - 抛出异常

#### js_inject_script
注入外部脚本。

```json
{
  "url": "https://cdn.example.com/library.js"
}
```

#### js_inject_styles
注入 CSS 样式。

```json
{
  "css": ".highlight { background: yellow; }"
}
```

#### js_get_globals
获取页面全局变量列表。

```json
{}
```

### 监控

#### monitor_console
获取控制台消息。

```json
{}
```

返回：
```json
[
  {
    "type": "log",
    "message": "Hello from console",
    "timestamp": 1234567890123
  }
]
```

#### monitor_network
获取网络请求记录。

```json
{}
```

返回：
```json
[
  {
    "requestId": "xxx",
    "url": "https://api.example.com/data",
    "method": "GET",
    "status": 200,
    "type": "xhr",
    "timestamp": 1234567890123,
    "requestHeaders": {},
    "responseHeaders": {},
    "responseBody": "{\"data\":...}"
  }
]
```

### 扩展程序管理

#### extension_list
列出已安装的扩展程序。

```json
{}
```

#### extension_get_info
获取扩展程序详细信息。

```json
{
  "extensionId": "abcdefghijklmnopqrstuvwxyz"
}
```

#### extension_enable
启用扩展程序。

```json
{
  "extensionId": "abcdefghijklmnopqrstuvwxyz"
}
```

#### extension_disable
禁用扩展程序。

```json
{
  "extensionId": "abcdefghijklmnopqrstuvwxyz"
}
```

#### extension_reload
重新加载扩展程序。

```json
{
  "extensionId": "abcdefghijklmnopqrstuvwxyz"
}
```

#### extension_execute
在扩展程序上下文中执行代码。

```json
{
  "extensionId": "abcdefghijklmnopqrstuvwxyz",
  "code": "chrome.storage.local.get(null, (data) => console.log(data));"
}
```

#### extension_get_storage
获取扩展程序存储数据。

```json
{
  "extensionId": "abcdefghijklmnopqrstuvwxyz",
  "keys": ["settings", "preferences"]
}
```

#### extension_set_storage
设置扩展程序存储数据。

```json
{
  "extensionId": "abcdefghijklmnopqrstuvwxyz",
  "data": {
    "settings": {
      "enabled": true
    }
  }
}
```

### 会话管理

#### session_set
设置当前活动会话。

```json
{
  "sessionId": "session-id"
}
```

#### session_list
列出所有活动会话。

```json
{}
```

## 使用示例

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

### 示例 3：监控网络请求

```
1. browser_connect
2. page_open {"url": "https://api.example.com"}
3. js_execute {"code": "fetch('/api/data')"}
4. monitor_network {}
5. page_close
6. browser_disconnect
```

### 示例 4：测试扩展程序

```
1. browser_connect
2. page_open {"url": "chrome://extensions"}
3. extension_list {}
4. extension_get_storage {"extensionId": "xxx"}
5. extension_set_storage {"extensionId": "xxx", "data": {"test": true}}
6. extension_reload {"extensionId": "xxx"}
7. page_close
8. browser_disconnect
```

## 典型工作流程

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

### 页面监控流程

```
browser_connect
    ↓
page_attach (附加到目标页面)
    ↓
page_get_snapshot (获取页面状态)
    ↓
monitor_network (监控网络)
    ↓
monitor_console (监控控制台)
    ↓
page_detach
    ↓
browser_disconnect
```

## 错误处理

所有工具调用返回统一格式：

**成功：**
```json
{
  "success": true,
  "data": ...
}
```

**失败：**
```json
{
  "success": false,
  "error": "Error message"
}
```

## 注意事项

1. **Chrome 必须以调试模式启动**：确保使用 `--remote-debugging-port=9222` 参数
2. **单实例限制**：同一时间只能有一个 Chrome 实例使用相同的用户数据目录
3. **会话管理**：同时操作多个页面时，使用 `session_set` 切换活动会话
4. **超时处理**：长时间运行的脚本应设置合理的 timeout 值
5. **资源清理**：使用完毕后调用 `browser_disconnect` 释放资源

## 架构说明

```
┌─────────────────┐
│   IDE AI Agent  │
└────────┬────────┘
         │ MCP Protocol
         ▼
┌─────────────────┐
│  MCP Server     │
│  (this skill)   │
└────────┬────────┘
         │ WebSocket (CDP)
         ▼
┌─────────────────┐
│  Chrome Browser │
│  (--remote-     │
│   debugging)    │
└─────────────────┘
```

## 文件结构

```
chrome-browser-mcp/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts              # MCP 服务器入口
    ├── cdp-manager.ts        # CDP 连接管理
    ├── browser-controller.ts # 浏览器控制
    └── js-tester.ts          # JS 测试和扩展管理
```

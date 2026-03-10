# Chrome Browser Control Skill

## 描述

Chrome Browser Control Skill 允许 IDE AI 通过 MCP (Model Context Protocol) 完全控制 Chrome 浏览器，实现页面代码获取、监控页面变化、测试 JS 代码等功能。基于 Chrome DevTools Protocol (CDP) 构建，提供完整的浏览器自动化能力。

## 前置要求

### 1. 启动 Chrome 浏览器（远程调试模式）

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

### 2. MCP 服务器配置

在 MCP 客户端配置中添加：

```json
{
  "mcpServers": {
    "chrome-browser": {
      "command": "node",
      "args": ["/path/to/chrome-browser-mcp/dist/index.js"],
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

| 工具 | 描述 | 参数 |
|------|------|------|
| `browser_connect` | 连接到已运行的 Chrome 浏览器 | 无 |
| `browser_disconnect` | 断开与浏览器的连接 | 无 |
| `browser_status` | 获取浏览器连接状态 | 无 |

### 页面管理

| 工具 | 描述 | 参数 |
|------|------|------|
| `page_list` | 列出所有打开的页面 | 无 |
| `page_open` | 打开新页面 | `url`: 要打开的 URL |
| `page_attach` | 附加到指定页面 | `targetId`: 页面 target ID |
| `page_close` | 关闭当前页面 | 无 |
| `page_navigate` | 导航到指定 URL | `url`: 目标 URL |
| `page_back` | 后退到上一页 | 无 |
| `page_forward` | 前进到下一页 | 无 |
| `page_reload` | 刷新页面 | `ignoreCache`: 是否忽略缓存 |

### 页面内容获取

| 工具 | 描述 | 参数 |
|------|------|------|
| `page_get_html` | 获取页面 HTML | `selector`: CSS 选择器（可选） |
| `page_get_text` | 获取页面文本内容 | 无 |
| `page_get_snapshot` | 获取页面完整快照 | `includeScreenshot`: 是否包含截图 |
| `page_query_selector` | 查询单个元素 | `selector`: CSS 选择器 |
| `page_query_selector_all` | 查询所有匹配元素 | `selector`: CSS 选择器 |

### 截图和视口

| 工具 | 描述 | 参数 |
|------|------|------|
| `page_screenshot` | 截取页面截图 | `format`: png/jpeg, `quality`: JPEG 质量 |
| `page_set_viewport` | 设置视口大小 | `width`, `height`, `deviceScaleFactor` |

### JavaScript 执行

| 工具 | 描述 | 参数 |
|------|------|------|
| `js_execute` | 执行 JavaScript 代码 | `code`: JS 代码, `timeout`: 超时时间 |
| `js_run_tests` | 运行测试代码 | `testCode`: 测试代码 |
| `js_inject_script` | 注入外部脚本 | `url`: 脚本 URL |
| `js_inject_styles` | 注入 CSS 样式 | `css`: CSS 代码 |
| `js_get_globals` | 获取页面全局变量 | 无 |

### 监控

| 工具 | 描述 | 参数 |
|------|------|------|
| `monitor_console` | 获取控制台消息 | 无 |
| `monitor_network` | 获取网络请求记录 | 无 |

### 扩展程序管理

| 工具 | 描述 | 参数 |
|------|------|------|
| `extension_list` | 列出已安装的扩展程序 | 无 |
| `extension_get_info` | 获取扩展程序详细信息 | `extensionId` |
| `extension_enable` | 启用扩展程序 | `extensionId` |
| `extension_disable` | 禁用扩展程序 | `extensionId` |
| `extension_reload` | 重新加载扩展程序 | `extensionId` |
| `extension_execute` | 在扩展上下文执行代码 | `extensionId`, `code` |
| `extension_get_storage` | 获取扩展存储数据 | `extensionId`, `keys` |
| `extension_set_storage` | 设置扩展存储数据 | `extensionId`, `data` |

### 会话管理

| 工具 | 描述 | 参数 |
|------|------|------|
| `session_set` | 设置当前活动会话 | `sessionId` |
| `session_list` | 列出所有活动会话 | 无 |

## 使用示例

### 示例 1：打开页面并获取内容

```
1. browser_connect
   → 连接到浏览器

2. page_open {"url": "https://example.com"}
   → 打开页面，返回 sessionId

3. page_get_html {}
   → 获取页面完整 HTML

4. page_get_text {}
   → 获取页面文本内容

5. page_close
   → 关闭页面

6. browser_disconnect
   → 断开连接
```

### 示例 2：执行 JavaScript 并获取结果

```
1. browser_connect
2. page_open {"url": "https://example.com"}

3. js_execute {
     "code": "document.querySelector('h1').textContent"
   }
   → 返回: {"success": true, "value": "Hello World"}

4. js_execute {
     "code": "window.location.href"
   }
   → 返回: {"success": true, "value": "https://example.com"}
```

### 示例 3：运行测试代码

```
1. browser_connect
2. page_open {"url": "https://example.com"}

3. js_run_tests {
     "testCode": "
       describe('Page Tests', () => {
         it('should have a title', () => {
           expect(document.title).toBeTruthy();
         });
         it('should have body', () => {
           expect(document.body).toBeTruthy();
         });
       });
     "
   }
   → 返回测试结果
```

### 示例 4：监控网络请求

```
1. browser_connect
2. page_open {"url": "https://api.example.com"}

3. js_execute {
     "code": "fetch('/api/data').then(r => r.json())"
   }

4. monitor_network {}
   → 返回网络请求列表
```

### 示例 5：测试 Chrome 扩展程序

```
1. browser_connect
2. page_open {"url": "chrome://extensions"}

3. extension_list {}
   → 列出所有扩展

4. extension_get_storage {
     "extensionId": "xxx",
     "keys": ["settings"]
   }
   → 获取扩展存储

5. extension_set_storage {
     "extensionId": "xxx",
     "data": {"settings": {"enabled": true}}
   }
   → 设置扩展存储

6. extension_reload {"extensionId": "xxx"}
   → 重新加载扩展
```

### 示例 6：截图和视口控制

```
1. browser_connect
2. page_open {"url": "https://example.com"}

3. page_set_viewport {
     "width": 1920,
     "height": 1080,
     "deviceScaleFactor": 2
   }

4. page_screenshot {
     "format": "png"
   }
   → 返回 Base64 编码的截图
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

## 返回格式

### 成功响应

```json
{
  "success": true,
  "data": { ... }
}
```

### 错误响应

```json
{
  "success": false,
  "error": "Error message"
}
```

### JavaScript 执行结果

```json
{
  "success": true,
  "value": "返回值",
  "console": [
    {"type": "log", "message": "控制台消息"}
  ],
  "duration": 12
}
```

### 测试结果

```json
{
  "passed": 5,
  "failed": 1,
  "tests": [
    {
      "name": "should have title",
      "passed": true,
      "duration": 5
    },
    {
      "name": "should work",
      "passed": false,
      "error": "Expected true to be false",
      "duration": 3
    }
  ],
  "totalDuration": 45
}
```

## 支持的测试断言

`js_run_tests` 支持以下断言方法：

| 方法 | 描述 |
|------|------|
| `toBe(expected)` | 严格相等 (===) |
| `toEqual(expected)` | 深度相等 |
| `toBeTruthy()` | 为真 |
| `toBeFalsy()` | 为假 |
| `toContain(expected)` | 包含 |
| `toBeGreaterThan(expected)` | 大于 |
| `toBeLessThan(expected)` | 小于 |
| `toThrow()` | 抛出异常 |

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

## 项目文件结构

```
chrome-browser-mcp/
├── package.json           # 项目配置
├── tsconfig.json          # TypeScript 配置
├── README.md              # 使用文档
├── dist/                  # 编译输出
│   └── index.js           # MCP 服务器入口
└── src/
    ├── index.ts           # MCP 服务器入口
    ├── cdp-manager.ts     # CDP 连接管理
    ├── browser-controller.ts  # 浏览器控制
    └── js-tester.ts       # JS 测试和扩展管理
```

## 相关资源

- [Chrome DevTools Protocol 文档](https://chromedevtools.github.io/devtools-protocol/)
- [CDP 协议查看器](https://vanilla.aslushnikov.com/)
- [MCP 协议规范](https://modelcontextprotocol.io/)

# Chrome Browser MCP

通过 CDP (Chrome DevTools Protocol) 协议控制 Chrome 浏览器的 MCP 服务器。让 IDE AI 能够完全控制 Chrome 浏览器、获取页面内容、执行 JavaScript、监控页面变化和管理 Chrome 扩展。

[English](README.md) | [中文](README.zh.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Português](README.pt.md)

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

### 2. 安装 MCP Server

```bash
npm install -g chrome-browser-mcp
```

或使用 npx：
```bash
npx chrome-browser-mcp
```

### 3. 配置 MCP 客户端

在 MCP 客户端配置中添加：

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

## 可用工具

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

### 页面内容

| 工具 | 描述 |
|------|------|
| `page_get_html` | 获取页面 HTML |
| `page_get_text` | 获取页面文本内容 |
| `page_get_snapshot` | 获取页面完整快照 |
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
| `js_execute` | 执行 JavaScript 代码 |
| `js_run_tests` | 运行测试代码（支持 describe/it/expect） |
| `js_inject_script` | 注入外部脚本 |
| `js_inject_styles` | 注入 CSS 样式 |
| `js_get_globals` | 获取页面全局变量 |

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

## 注意事项

1. **Chrome 必须以调试模式启动**：使用 `--remote-debugging-port=9222`
2. **单实例限制**：同一时间只能有一个 Chrome 实例使用相同的用户数据目录
3. **会话管理**：同时操作多个页面时，使用 `session_set` 切换活动会话
4. **超时处理**：长时间运行的脚本应设置合理的 timeout 值
5. **资源清理**：使用完毕后调用 `browser_disconnect` 释放资源

## 相关文档

- [项目总览](../README.zh.md)
- [Skill 文档](../skill.md)
- [智能体提示词](../exten-coder-agent-prompt.md)
- [调用指南](../exten-coder-invoke-guide.md)
- [English](README.md)

## 许可证

MIT

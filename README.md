# Chrome Browser MCP

A Model Context Protocol (MCP) server for controlling Chrome browser via Chrome DevTools Protocol (CDP). Enables IDE AI to fully understand web pages, execute JavaScript, monitor page changes, and manage Chrome extensions.

[English](README.md) | [中文](README.zh.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Português](README.pt.md)

## 🎯 Core Features

- **Web Page Understanding**: AI can fully comprehend DOM structure, JavaScript logic, and network requests
- **Real-time Debugging**: Execute code directly in IDE and observe browser changes
- **Automated Testing**: Run test cases automatically to verify extension functionality
- **Smart Development**: Work with exten-coder agent to achieve "Understand → Develop → Test → Verify" workflow

## 📁 Project Structure

```
extenDevTools/
├── README.md                             # This file (English)
├── README.zh.md                          # Chinese documentation
├── skill.md                              # Skill usage documentation
├── skill.zh.md                           # Skill usage (Chinese)
├── exten-coder-agent-prompt.md           # exten-coder agent prompt
├── exten-coder-invoke-guide.md           # exten-coder invocation guide
└── chrome-browser-mcp/                   # MCP Server implementation
    ├── README.md                         # MCP Server documentation
    ├── package.json                      # Project configuration
    ├── tsconfig.json                     # TypeScript configuration
    └── src/                              # Source code
        ├── index.ts                      # MCP Server entry
        ├── cdp-manager.ts                # CDP connection management
        ├── browser-controller.ts         # Browser control
        └── js-tester.ts                  # JS testing & extension management
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Chrome browser (with remote debugging support)
- Trae IDE (or other MCP-compatible IDE)

### 1. Start Chrome Browser (Remote Debugging Mode)

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

### 2. Install MCP Server

```bash
cd chrome-browser-mcp
npm install
npm run build
```

### 3. Configure MCP Client

Add to your MCP client configuration:

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

Or use npx (after publishing to npm):

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

## 🔧 Available Tools

### Connection Management

| Tool | Description |
|------|-------------|
| `browser_connect` | Connect to running Chrome browser |
| `browser_disconnect` | Disconnect from browser |
| `browser_status` | Get browser connection status |

### Page Management

| Tool | Description |
|------|-------------|
| `page_list` | List all open pages |
| `page_open` | Open new page |
| `page_attach` | Attach to specific page |
| `page_close` | Close current page |
| `page_navigate` | Navigate to URL |
| `page_back` | Go back |
| `page_forward` | Go forward |
| `page_reload` | Reload page |

### Page Content

| Tool | Description |
|------|-------------|
| `page_get_html` | Get page HTML |
| `page_get_text` | Get page text content |
| `page_get_snapshot` | Get full page snapshot (HTML, text, DOM structure) |
| `page_query_selector` | Query single element |
| `page_query_selector_all` | Query all matching elements |

### Screenshot & Viewport

| Tool | Description |
|------|-------------|
| `page_screenshot` | Capture page screenshot |
| `page_set_viewport` | Set viewport size |

### JavaScript Execution

| Tool | Description |
|------|-------------|
| `js_execute` | Execute JavaScript code in page |
| `js_run_tests` | Run test code (supports describe/it/expect syntax) |
| `js_inject_script` | Inject external script |
| `js_inject_styles` | Inject CSS styles |
| `js_get_globals` | Get page global variables |

### Monitoring

| Tool | Description |
|------|-------------|
| `monitor_console` | Get console messages |
| `monitor_network` | Get network request logs |

### Extension Management

| Tool | Description |
|------|-------------|
| `extension_list` | List installed extensions |
| `extension_get_info` | Get extension details |
| `extension_enable` | Enable extension |
| `extension_disable` | Disable extension |
| `extension_reload` | Reload extension |
| `extension_execute` | Execute code in extension context |
| `extension_get_storage` | Get extension storage data |
| `extension_set_storage` | Set extension storage data |

### Session Management

| Tool | Description |
|------|-------------|
| `session_set` | Set current active session |
| `session_list` | List all active sessions |

## 💡 Usage Examples

### Example 1: Open Page and Get Content

```
1. browser_connect
2. page_open {"url": "https://example.com"}
3. page_get_snapshot {"includeScreenshot": false}
4. page_close
5. browser_disconnect
```

### Example 2: Execute JavaScript Test

```
1. browser_connect
2. page_open {"url": "https://example.com"}
3. js_run_tests {"testCode": "describe('Page', () => {\n  it('should have title', () => {\n    expect(document.title).toBeTruthy();\n  });\n});"}
4. page_close
5. browser_disconnect
```

### Example 3: Test Chrome Extension

```
1. browser_connect
2. page_open {"url": "chrome://extensions"}
3. extension_list {}
4. extension_get_storage {"extensionId": "xxx"}
5. extension_reload {"extensionId": "xxx"}
6. page_close
7. browser_disconnect
```

## 🎓 Typical Workflows

### Web Page Testing Workflow

```
browser_connect
    ↓
page_open (target page)
    ↓
js_execute (inject test code)
    ↓
js_run_tests (run tests)
    ↓
monitor_console (check console)
    ↓
page_close
    ↓
browser_disconnect
```

### Extension Debugging Workflow

```
browser_connect
    ↓
page_open (test page)
    ↓
extension_list (get extension list)
    ↓
extension_execute (execute extension code)
    ↓
extension_get_storage (check storage)
    ↓
page_close
    ↓
browser_disconnect
```

## 🛠️ Tech Stack

- **Chrome DevTools Protocol**: Control browser via CDP
- **MCP Protocol**: Model Context Protocol implementation
- **TypeScript**: Type-safe development
- **Node.js 18+**: Runtime environment

## 📚 Documentation

- [skill.md](skill.md) - Skill usage documentation
- [exten-coder-agent-prompt.md](exten-coder-agent-prompt.md) - exten-coder agent prompt
- [exten-coder-invoke-guide.md](exten-coder-invoke-guide.md) - exten-coder invocation guide
- [chrome-browser-mcp/README.md](chrome-browser-mcp/README.md) - MCP Server documentation
- [README.zh.md](README.zh.md) - 中文文档

## 📄 License

MIT

---

**Start your smart extension development journey!** 🚀

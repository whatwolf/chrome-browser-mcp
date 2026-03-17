# Chrome Browser MCP

MCP server for Chrome browser control via CDP. Enables IDE AI to fully control Chrome browser, get page content, execute JavaScript, monitor page changes, and manage Chrome extensions.

[English](README.md) | [中文](README.zh.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Português](README.pt.md)

## Prerequisites

### 1. Start Chrome Browser (Remote Debugging Mode)

#### Method 1: Chrome 146+ Official Switch (Recommended)

Starting from **Chrome 146+**, you can enable remote debugging via built-in switch without command line:

1. Open in Chrome address bar: `chrome://inspect/#remote-debugging`
2. Turn on **Remote debugging** switch
3. Chrome will automatically listen on `localhost:9222` debugging port

#### Method 2: Command Line

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
npm install -g chrome-browser-mcp
```

Or use npx:
```bash
npx chrome-browser-mcp
```

### 3. Configure MCP Client

Add to your MCP client configuration:

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

## Available Tools

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
| `page_get_snapshot` | Get full page snapshot |
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
| `js_execute` | Execute JavaScript code |
| `js_run_tests` | Run test code (supports describe/it/expect) |
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

## Usage Examples

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

## Notes

1. **Chrome must be started in debug mode**: Use `--remote-debugging-port=9222` or Chrome 146+ official switch
2. **Single instance limit**: Only one Chrome instance can use the same user data directory
3. **Session management**: Use `session_set` to switch active sessions when operating multiple pages
4. **Timeout handling**: Set reasonable timeout values for long-running scripts
5. **Resource cleanup**: Call `browser_disconnect` to release resources when done

## Comparison with Official Chrome DevTools MCP

### Official chrome-devtools-mcp

Google's official MCP server with `--autoConnect` auto-connection feature:

| Feature | Description |
|---------|-------------|
| `--autoConnect` | Auto-connect to Chrome with remote debugging enabled |
| Performance Analysis | Supports performance tracing, Lighthouse auditing |
| Input Automation | Click, drag, fill forms, keyboard input, etc. |
| Official Support | Maintained by Google team |

**Config Example:**
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

### chrome-browser-mcp (This Project)

This project has unique advantages in the following scenarios:

| Feature | Description |
|---------|-------------|
| **Extension Management** | ✅ Enable/disable/reload extensions, manage storage |
| **JS Testing Framework** | ✅ Supports describe/it/expect syntax |
| **Session Management** | ✅ Supports multi-session switching |
| **Lightweight** | Fewer dependencies, easy installation |

### How to Choose

| Use Case | Recommended |
|----------|-------------|
| Daily browser control | Official `chrome-devtools-mcp` |
| Chrome extension development | `chrome-browser-mcp` (this project) |
| Need JS testing capability | `chrome-browser-mcp` (this project) |
| Need performance analysis | Official `chrome-devtools-mcp` |

## Related Documentation

- [Project Overview](../README.md)
- [Skill Documentation](../skill.md)
- [Agent Prompt](../exten-coder-agent-prompt.md)
- [Invocation Guide](../exten-coder-invoke-guide.md)
- [中文文档](README.zh.md)

## License

MIT

# Chrome Browser Control Skill

[中文文档](skill.zh.md) | [English](skill.md)

## Description

Chrome Browser Control Skill allows IDE AI to fully control Chrome browser through MCP (Model Context Protocol), enabling page code acquisition, page change monitoring, JS code testing, and more. Built on Chrome DevTools Protocol (CDP), it provides complete browser automation capabilities.

## Prerequisites

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

### 2. MCP Server Configuration

Add to your MCP client configuration:

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

## Available Tools

### Connection Management

| Tool | Description | Parameters |
|------|-------------|------------|
| `browser_connect` | Connect to running Chrome browser | None |
| `browser_disconnect` | Disconnect from browser | None |
| `browser_status` | Get browser connection status | None |

### Page Management

| Tool | Description | Parameters |
|------|-------------|------------|
| `page_list` | List all open pages | None |
| `page_open` | Open new page | `url`: URL to open |
| `page_attach` | Attach to specific page | `targetId`: Page target ID |
| `page_close` | Close current page | None |
| `page_navigate` | Navigate to URL | `url`: Target URL |
| `page_back` | Go back | None |
| `page_forward` | Go forward | None |
| `page_reload` | Reload page | `ignoreCache`: Whether to ignore cache |

### Page Content

| Tool | Description | Parameters |
|------|-------------|------------|
| `page_get_html` | Get page HTML | `selector`: CSS selector (optional) |
| `page_get_text` | Get page text content | None |
| `page_get_snapshot` | Get full page snapshot | `includeScreenshot`: Include screenshot |
| `page_query_selector` | Query single element | `selector`: CSS selector |
| `page_query_selector_all` | Query all matching elements | `selector`: CSS selector |

### Screenshot & Viewport

| Tool | Description | Parameters |
|------|-------------|------------|
| `page_screenshot` | Capture page screenshot | `format`: png/jpeg, `quality`: JPEG quality |
| `page_set_viewport` | Set viewport size | `width`, `height`, `deviceScaleFactor` |

### JavaScript Execution

| Tool | Description | Parameters |
|------|-------------|------------|
| `js_execute` | Execute JavaScript code | `code`: JS code, `timeout`: Timeout |
| `js_run_tests` | Run test code | `testCode`: Test code |
| `js_inject_script` | Inject external script | `url`: Script URL |
| `js_inject_styles` | Inject CSS styles | `css`: CSS code |
| `js_get_globals` | Get page global variables | None |

### Monitoring

| Tool | Description | Parameters |
|------|-------------|------------|
| `monitor_console` | Get console messages | None |
| `monitor_network` | Get network request logs | None |

### Extension Management

| Tool | Description | Parameters |
|------|-------------|------------|
| `extension_list` | List installed extensions | None |
| `extension_get_info` | Get extension details | `extensionId` |
| `extension_enable` | Enable extension | `extensionId` |
| `extension_disable` | Disable extension | `extensionId` |
| `extension_reload` | Reload extension | `extensionId` |
| `extension_execute` | Execute code in extension context | `extensionId`, `code` |
| `extension_get_storage` | Get extension storage data | `extensionId`, `keys` |
| `extension_set_storage` | Set extension storage data | `extensionId`, `data` |

### Session Management

| Tool | Description | Parameters |
|------|-------------|------------|
| `session_set` | Set current active session | `sessionId` |
| `session_list` | List all active sessions | None |

## Usage Examples

### Example 1: Open Page and Get Content

```
1. browser_connect
   → Connect to browser

2. page_open {"url": "https://example.com"}
   → Open page, returns sessionId

3. page_get_html {}
   → Get full page HTML

4. page_get_text {}
   → Get page text content

5. page_close
   → Close page

6. browser_disconnect
   → Disconnect
```

### Example 2: Execute JavaScript and Get Results

```
1. browser_connect
2. page_open {"url": "https://example.com"}

3. js_execute {
     "code": "document.querySelector('h1').textContent"
   }
   → Returns: {"success": true, "value": "Hello World"}

4. js_execute {
     "code": "window.location.href"
   }
   → Returns: {"success": true, "value": "https://example.com"}
```

### Example 3: Run Test Code

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
   → Returns test results
```

### Example 4: Monitor Network Requests

```
1. browser_connect
2. page_open {"url": "https://api.example.com"}

3. js_execute {
     "code": "fetch('/api/data').then(r => r.json())"
   }

4. monitor_network {}
   → Returns network request list
```

### Example 5: Test Chrome Extension

```
1. browser_connect
2. page_open {"url": "chrome://extensions"}

3. extension_list {}
   → List all extensions

4. extension_get_storage {
     "extensionId": "xxx",
     "keys": ["settings"]
   }
   → Get extension storage

5. extension_set_storage {
     "extensionId": "xxx",
     "data": {"settings": {"enabled": true}}
   }
   → Set extension storage

6. extension_reload {"extensionId": "xxx"}
   → Reload extension
```

### Example 6: Screenshot and Viewport Control

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
   → Returns Base64 encoded screenshot
```

## Typical Workflows

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

### Page Monitoring Workflow

```
browser_connect
    ↓
page_attach (attach to target page)
    ↓
page_get_snapshot (get page state)
    ↓
monitor_network (monitor network)
    ↓
monitor_console (monitor console)
    ↓
page_detach
    ↓
browser_disconnect
```

## Response Formats

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message"
}
```

### JavaScript Execution Result

```json
{
  "success": true,
  "value": "Return value",
  "console": [
    {"type": "log", "message": "Console message"}
  ],
  "duration": 12
}
```

### Test Results

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

## Supported Test Assertions

`js_run_tests` supports the following assertion methods:

| Method | Description |
|--------|-------------|
| `toBe(expected)` | Strict equality (===) |
| `toEqual(expected)` | Deep equality |
| `toBeTruthy()` | Truthy |
| `toBeFalsy()` | Falsy |
| `toContain(expected)` | Contains |
| `toBeGreaterThan(expected)` | Greater than |
| `toBeLessThan(expected)` | Less than |
| `toThrow()` | Throws exception |

## Notes

1. **Chrome must be started in debug mode**: Ensure using `--remote-debugging-port=9222`
2. **Single instance limit**: Only one Chrome instance can use the same user data directory at a time
3. **Session management**: Use `session_set` to switch active sessions when operating multiple pages
4. **Timeout handling**: Set reasonable timeout values for long-running scripts
5. **Resource cleanup**: Call `browser_disconnect` to release resources when done

## Architecture

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

## Project File Structure

```
chrome-browser-mcp/
├── package.json           # Project configuration
├── tsconfig.json          # TypeScript configuration
├── README.md              # Usage documentation
├── dist/                  # Compiled output
│   └── index.js           # MCP server entry
└── src/
    ├── index.ts           # MCP server entry
    ├── cdp-manager.ts     # CDP connection management
    ├── browser-controller.ts  # Browser control
    └── js-tester.ts       # JS testing and extension management
```

## Related Resources

- [Chrome DevTools Protocol Documentation](https://chromedevtools.github.io/devtools-protocol/)
- [CDP Protocol Viewer](https://vanilla.aslushnikov.com/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)

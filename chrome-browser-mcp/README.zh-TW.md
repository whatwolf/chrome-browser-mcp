# Chrome Browser MCP

透過 CDP（Chrome DevTools Protocol）協定控制 Chrome 瀏覽器的 MCP 伺服器。讓 IDE AI 能夠完全控制 Chrome 瀏覽器、取得網頁內容、執行 JavaScript、監控網頁變更和管理 Chrome 擴充功能。

[English](README.md) | [中文](README.zh.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Português](README.pt.md)

## 前置需求

### 1. 啟動 Chrome 瀏覽器（遠端除錯模式）

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

### 2. 安裝 MCP Server

```bash
npm install -g chrome-browser-mcp
```

或使用 npx：
```bash
npx chrome-browser-mcp
```

### 3. 設定 MCP 用戶端

在 MCP 用戶端設定中加入：

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

### 連線管理

| 工具 | 說明 |
|------|------|
| `browser_connect` | 連線到已執行的 Chrome 瀏覽器 |
| `browser_disconnect` | 中斷與瀏覽器的連線 |
| `browser_status` | 取得瀏覽器連線狀態 |

### 網頁管理

| 工具 | 說明 |
|------|------|
| `page_list` | 列出所有開啟的網頁 |
| `page_open` | 開啟新網頁 |
| `page_attach` | 附加到指定網頁 |
| `page_close` | 關閉目前網頁 |
| `page_navigate` | 導覽到指定 URL |
| `page_back` | 回到上一頁 |
| `page_forward` | 前進到下一頁 |
| `page_reload` | 重新整理網頁 |

### 網頁內容

| 工具 | 說明 |
|------|------|
| `page_get_html` | 取得網頁 HTML |
| `page_get_text` | 取得網頁文字內容 |
| `page_get_snapshot` | 取得網頁完整快照 |
| `page_query_selector` | 查詢單個元素 |
| `page_query_selector_all` | 查詢所有符合的元素 |

### 截圖和檢視區

| 工具 | 說明 |
|------|------|
| `page_screenshot` | 截取網頁畫面 |
| `page_set_viewport` | 設定檢視區大小 |

### JavaScript 執行

| 工具 | 說明 |
|------|------|
| `js_execute` | 執行 JavaScript 程式碼 |
| `js_run_tests` | 執行測試程式碼（支援 describe/it/expect 語法） |
| `js_inject_script` | 注入外部指令碼 |
| `js_inject_styles` | 注入 CSS 樣式 |
| `js_get_globals` | 取得網頁全域變數 |

### 監控

| 工具 | 說明 |
|------|------|
| `monitor_console` | 取得主控台訊息 |
| `monitor_network` | 取得網路請求記錄 |

### 擴充功能管理

| 工具 | 說明 |
|------|------|
| `extension_list` | 列出已安裝的擴充功能 |
| `extension_get_info` | 取得擴充功能詳細資訊 |
| `extension_enable` | 啟用擴充功能 |
| `extension_disable` | 停用擴充功能 |
| `extension_reload` | 重新載入擴充功能 |
| `extension_execute` | 在擴充功能環境中執行程式碼 |
| `extension_get_storage` | 取得擴充功能儲存資料 |
| `extension_set_storage` | 設定擴充功能儲存資料 |

### 工作階段管理

| 工具 | 說明 |
|------|------|
| `session_set` | 設定目前作用中工作階段 |
| `session_list` | 列出所有作用中工作階段 |

## 使用範例

### 範例 1：開啟網頁並取得內容

```
1. browser_connect
2. page_open {"url": "https://example.com"}
3. page_get_snapshot {"includeScreenshot": false}
4. page_close
5. browser_disconnect
```

### 範例 2：執行 JavaScript 測試

```
1. browser_connect
2. page_open {"url": "https://example.com"}
3. js_run_tests {"testCode": "describe('Page', () => {\n  it('should have title', () => {\n    expect(document.title).toBeTruthy();\n  });\n});"}
4. page_close
5. browser_disconnect
```

### 範例 3：測試 Chrome 擴充功能

```
1. browser_connect
2. page_open {"url": "chrome://extensions"}
3. extension_list {}
4. extension_get_storage {"extensionId": "xxx"}
5. extension_reload {"extensionId": "xxx"}
6. page_close
7. browser_disconnect
```

## 注意事項

1. **Chrome 必須以除錯模式啟動**：使用 `--remote-debugging-port=9222`
2. **單一執行個體限制**：同一時間只能有一個 Chrome 執行個體使用相同的使用者資料目錄
3. **工作階段管理**：同時操作多個網頁時，使用 `session_set` 切換作用中工作階段
4. **逾時處理**：長時間執行的指令碼應設定合理的逾時值
5. **資源清理**：使用完畢後呼叫 `browser_disconnect` 釋放資源

## 相關文件

- [專案概覽](../README.zh-TW.md)
- [Skill 文件](../skill.md)
- [智慧型代理人提示詞](../exten-coder-agent-prompt.md)
- [呼叫指南](../exten-coder-invoke-guide.md)
- [English](README.md)

## 授權條款

MIT

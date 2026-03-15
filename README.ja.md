# Chrome Browser MCP

MCP (Model Context Protocol) を介して Chrome ブラウザを制御し、ウェブページの理解、JavaScript の実行、ページ変更の監視、Chrome 拡張機能の管理を実現します。

[English](README.md) | [中文](README.zh.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Português](README.pt.md)

## 🎯 主な機能

- **ウェブページの理解**: AI が DOM 構造、JS ロジック、ネットワークリクエストを完全に理解
- **リアルタイムデバッグ**: IDE でコードを直接実行し、ブラウザの変更を観察
- **自動化テスト**: テストケースを自動実行し、プラグイン機能を検証
- **スマート開発**: exten-coder エージェントと連携し、「理解 → 開発 → テスト → 検証」のワークフローを実現

## 🚀 クイックスタート

### 前提条件

- Node.js 18+
- Chrome ブラウザ（リモートデバッグ対応）
- Trae IDE（または他の MCP 対応 IDE）

### 1. Chrome ブラウザの起動（リモートデバッグモード）

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

### 2. MCP Server のインストール

```bash
cd chrome-browser-mcp
npm install
npm run build
```

### 3. MCP クライアントの設定

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

## 🔧 利用可能なツール

### 接続管理

| ツール | 説明 |
|--------|------|
| `browser_connect` | 実行中の Chrome ブラウザに接続 |
| `browser_disconnect` | ブラウザから切断 |
| `browser_status` | ブラウザ接続状態を取得 |

### ページ管理

| ツール | 説明 |
|--------|------|
| `page_list` | 開いているすべてのページを一覧表示 |
| `page_open` | 新しいページを開く |
| `page_navigate` | 指定された URL に移動 |
| `page_back` | 前のページに戻る |
| `page_forward` | 次のページに進む |
| `page_reload` | ページを更新 |

### ページコンテンツ

| ツール | 説明 |
|--------|------|
| `page_get_html` | ページの HTML を取得 |
| `page_get_text` | ページのテキストコンテンツを取得 |
| `page_get_snapshot` | ページの完全なスナップショットを取得 |
| `page_query_selector` | 単一の要素を検索 |
| `page_query_selector_all` | 一致するすべての要素を検索 |

### スクリーンショットとビューポート

| ツール | 説明 |
|--------|------|
| `page_screenshot` | ページのスクリーンショットを撮影 |
| `page_set_viewport` | ビューポートサイズを設定 |

### JavaScript 実行

| ツール | 説明 |
|--------|------|
| `js_execute` | JavaScript コードを実行 |
| `js_run_tests` | テストコードを実行（describe/it/expect 構文をサポート） |
| `js_inject_script` | 外部スクリプトを注入 |
| `js_inject_styles` | CSS スタイルを注入 |

### 監視

| ツール | 説明 |
|--------|------|
| `monitor_console` | コンソールメッセージを取得 |
| `monitor_network` | ネットワークリクエストログを取得 |

### 拡張機能管理

| ツール | 説明 |
|--------|------|
| `extension_list` | インストールされている拡張機能を一覧表示 |
| `extension_enable` | 拡張機能を有効化 |
| `extension_disable` | 拡張機能を無効化 |
| `extension_reload` | 拡張機能を再読み込み |
| `extension_get_storage` | 拡張機能のストレージデータを取得 |
| `extension_set_storage` | 拡張機能のストレージデータを設定 |

## 💡 使用例

### 例 1: ページを開いてコンテンツを取得

```
1. browser_connect
2. page_open {"url": "https://example.com"}
3. page_get_snapshot {"includeScreenshot": false}
4. page_close
5. browser_disconnect
```

### 例 2: JavaScript テストを実行

```
1. browser_connect
2. page_open {"url": "https://example.com"}
3. js_run_tests {"testCode": "describe('Page', () => {\n  it('should have title', () => {\n    expect(document.title).toBeTruthy();\n  });\n});"}
4. page_close
5. browser_disconnect
```

### 例 3: Chrome 拡張機能をテスト

```
1. browser_connect
2. page_open {"url": "chrome://extensions"}
3. extension_list {}
4. extension_get_storage {"extensionId": "xxx"}
5. extension_reload {"extensionId": "xxx"}
6. page_close
7. browser_disconnect
```

## 🛠️ 技術スタック

- **Chrome DevTools Protocol**: CDP プロトコルでブラウザを制御
- **MCP Protocol**: Model Context Protocol の実装
- **TypeScript**: 型安全な開発言語
- **Node.js 18+**: ランタイム環境

## 📄 ライセンス

MIT

---

**スマートな拡張機能開発の旅を始めましょう！** 🚀

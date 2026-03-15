# Chrome Browser MCP

CDP（Chrome DevTools Protocol）を介して Chrome ブラウザを制御する MCP サーバー。IDE AI が Chrome ブラウザを完全に制御し、ページコンテンツの取得、JavaScript の実行、ページ変更の監視、Chrome 拡張機能の管理を可能にします。

[English](README.md) | [中文](README.zh.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Português](README.pt.md)

## 前提条件

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
npm install -g chrome-browser-mcp
```

または npx を使用：
```bash
npx chrome-browser-mcp
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

## 利用可能なツール

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
| `page_attach` | 指定されたページにアタッチ |
| `page_close` | 現在のページを閉じる |
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
| `js_get_globals` | ページのグローバル変数を取得 |

### 監視

| ツール | 説明 |
|--------|------|
| `monitor_console` | コンソールメッセージを取得 |
| `monitor_network` | ネットワークリクエストログを取得 |

### 拡張機能管理

| ツール | 説明 |
|--------|------|
| `extension_list` | インストールされている拡張機能を一覧表示 |
| `extension_get_info` | 拡張機能の詳細情報を取得 |
| `extension_enable` | 拡張機能を有効化 |
| `extension_disable` | 拡張機能を無効化 |
| `extension_reload` | 拡張機能を再読み込み |
| `extension_execute` | 拡張機能のコンテキストでコードを実行 |
| `extension_get_storage` | 拡張機能のストレージデータを取得 |
| `extension_set_storage` | 拡張機能のストレージデータを設定 |

### セッション管理

| ツール | 説明 |
|--------|------|
| `session_set` | 現在のアクティブセッションを設定 |
| `session_list` | すべてのアクティブセッションを一覧表示 |

## 使用例

### 例 1：ページを開いてコンテンツを取得

```
1. browser_connect
2. page_open {"url": "https://example.com"}
3. page_get_snapshot {"includeScreenshot": false}
4. page_close
5. browser_disconnect
```

### 例 2：JavaScript テストを実行

```
1. browser_connect
2. page_open {"url": "https://example.com"}
3. js_run_tests {"testCode": "describe('Page', () => {\n  it('should have title', () => {\n    expect(document.title).toBeTruthy();\n  });\n});"}
4. page_close
5. browser_disconnect
```

### 例 3：Chrome 拡張機能をテスト

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

1. **Chrome はデバッグモードで起動する必要があります**：`--remote-debugging-port=9222` を使用
2. **単一インスタンス制限**：同じユーザーデータディレクトリを使用できる Chrome インスタンスは一度に 1 つだけ
3. **セッション管理**：複数のページを操作する場合は、`session_set` を使用してアクティブセッションを切り替え
4. **タイムアウト処理**：長時間実行されるスクリプトには適切なタイムアウト値を設定
5. **リソースクリーンアップ**：使用後は `browser_disconnect` を呼び出してリソースを解放

## 関連ドキュメント

- [プロジェクト概要](../README.md)
- [スキルドキュメント](../skill.md)
- [エージェントプロンプト](../exten-coder-agent-prompt.md)
- [呼び出しガイド](../exten-coder-invoke-guide.md)
- [中文文档](README.zh.md)

## ライセンス

MIT

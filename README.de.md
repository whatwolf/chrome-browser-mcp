# Chrome Browser MCP

Steuern Sie den Chrome-Browser über MCP (Model Context Protocol), um das Verstehen von Webseiten, die Ausführung von JavaScript, die Überwachung von Seitenänderungen und die Verwaltung von Chrome-Erweiterungen zu ermöglichen.

[English](README.md) | [中文](README.zh.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Português](README.pt.md)

## 🎯 Hauptmerkmale

- **Webseiten-Verständnis**: Die KI kann DOM-Struktur, JS-Logik und Netzwerkanfragen vollständig verstehen
- **Echtzeit-Debugging**: Führen Sie Code direkt in der IDE aus und beobachten Sie Browser-Änderungen
- **Automatisierte Tests**: Führen Sie Testfälle automatisch aus, um die Plugin-Funktionalität zu überprüfen
- **Intelligente Entwicklung**: Arbeiten Sie mit dem exten-coder-Agenten zusammen, um den Workflow "Verstehen → Entwickeln → Testen → Überprüfen" zu realisieren

## 🚀 Schnellstart

### Voraussetzungen

- Node.js 18+
- Chrome-Browser (mit Remote-Debugging-Unterstützung)
- Trae IDE (oder andere MCP-kompatible IDE)

### 1. Chrome starten (Remote-Debugging-Modus)

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

### 2. MCP Server installieren

```bash
cd chrome-browser-mcp
npm install
npm run build
```

### 3. MCP-Client konfigurieren

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

## 🔧 Verfügbare Tools

### Verbindungsverwaltung

| Tool | Beschreibung |
|------|--------------|
| `browser_connect` | Mit laufendem Chrome-Browser verbinden |
| `browser_disconnect` | Vom Browser trennen |
| `browser_status` | Browser-Verbindungsstatus abrufen |

### Seitenverwaltung

| Tool | Beschreibung |
|------|--------------|
| `page_list` | Alle geöffneten Seiten auflisten |
| `page_open` | Neue Seite öffnen |
| `page_navigate` | Zu URL navigieren |
| `page_back` | Seite zurück |
| `page_forward` | Seite vorwärts |
| `page_reload` | Seite neu laden |

### Seiteninhalt

| Tool | Beschreibung |
|------|--------------|
| `page_get_html` | HTML der Seite abrufen |
| `page_get_text` | Textinhalt der Seite abrufen |
| `page_get_snapshot` | Vollständigen Seiten-Snapshot abrufen |
| `page_query_selector` | Einzelnes Element abfragen |
| `page_query_selector_all` | Alle übereinstimmenden Elemente abfragen |

### Screenshot und Viewport

| Tool | Beschreibung |
|------|--------------|
| `page_screenshot` | Seiten-Screenshot aufnehmen |
| `page_set_viewport` | Viewport-Größe festlegen |

### JavaScript-Ausführung

| Tool | Beschreibung |
|------|--------------|
| `js_execute` | JavaScript-Code ausführen |
| `js_run_tests` | Testcode ausführen (unterstützt describe/it/expect-Syntax) |
| `js_inject_script` | Externes Skript injizieren |
| `js_inject_styles` | CSS-Stile injizieren |

### Überwachung

| Tool | Beschreibung |
|------|--------------|
| `monitor_console` | Konsolennachrichten abrufen |
| `monitor_network` | Netzwerkanfrage-Protokolle abrufen |

### Erweiterungsverwaltung

| Tool | Beschreibung |
|------|--------------|
| `extension_list` | Installierte Erweiterungen auflisten |
| `extension_enable` | Erweiterung aktivieren |
| `extension_disable` | Erweiterung deaktivieren |
| `extension_reload` | Erweiterung neu laden |
| `extension_get_storage` | Speicherdaten der Erweiterung abrufen |
| `extension_set_storage` | Speicherdaten der Erweiterung festlegen |

## 💡 Nutzungsbeispiele

### Beispiel 1: Seite öffnen und Inhalt abrufen

```
1. browser_connect
2. page_open {"url": "https://example.com"}
3. page_get_snapshot {"includeScreenshot": false}
4. page_close
5. browser_disconnect
```

### Beispiel 2: JavaScript-Test ausführen

```
1. browser_connect
2. page_open {"url": "https://example.com"}
3. js_run_tests {"testCode": "describe('Page', () => {\n  it('should have title', () => {\n    expect(document.title).toBeTruthy();\n  });\n});"}
4. page_close
5. browser_disconnect
```

### Beispiel 3: Chrome-Erweiterung testen

```
1. browser_connect
2. page_open {"url": "chrome://extensions"}
3. extension_list {}
4. extension_get_storage {"extensionId": "xxx"}
5. extension_reload {"extensionId": "xxx"}
6. page_close
7. browser_disconnect
```

## 🛠️ Technologie-Stack

- **Chrome DevTools Protocol**: Browser über CDP-Protokoll steuern
- **MCP Protocol**: Implementierung des Model Context Protocol
- **TypeScript**: Typsichere Entwicklungssprache
- **Node.js 18+**: Laufzeitumgebung

## 📄 Lizenz

MIT

---

**Beginnen Sie Ihre Reise der intelligenten Erweiterungsentwicklung!** 🚀

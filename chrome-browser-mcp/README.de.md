# Chrome Browser MCP

MCP-Server zur Steuerung des Chrome-Browsers über CDP (Chrome DevTools Protocol). Ermöglicht der IDE AI die vollständige Steuerung des Chrome-Browsers, das Abrufen von Seiteninhalten, die Ausführung von JavaScript, die Überwachung von Seitenänderungen und die Verwaltung von Chrome-Erweiterungen.

[English](README.md) | [中文](README.zh.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Português](README.pt.md)

## Voraussetzungen

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
npm install -g chrome-browser-mcp
```

Oder npx verwenden:
```bash
npx chrome-browser-mcp
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

## Verfügbare Tools

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
| `js_get_globals` | Globale Variablen der Seite abrufen |

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

### Sitzungsverwaltung

| Tool | Beschreibung |
|------|--------------|
| `session_set` | Aktuelle aktive Sitzung festlegen |
| `session_list` | Alle aktiven Sitzungen auflisten |

## Nutzungsbeispiele

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

## Hinweise

1. **Chrome muss im Debug-Modus gestartet werden**: Verwenden Sie `--remote-debugging-port=9222`
2. **Einzelinstanz-Beschränkung**: Nur eine Chrome-Instanz kann das gleiche Benutzerdatenverzeichnis verwenden
3. **Sitzungsverwaltung**: Verwenden Sie `session_set`, um aktive Sitzungen bei der Bedienung mehrerer Seiten zu wechseln
4. **Timeout-Behandlung**: Setzen Sie angemessene Timeout-Werte für lang laufende Skripte
5. **Ressourcenbereinigung**: Rufen Sie `browser_disconnect` auf, um Ressourcen freizugeben

## Verwandte Dokumentation

- [Projektübersicht](../README.md)
- [Skill-Dokumentation](../skill.md)
- [Agent-Prompt](../exten-coder-agent-prompt.md)
- [Aufrufanleitung](../exten-coder-invoke-guide.md)
- [中文文档](README.zh.md)

## Lizenz

MIT

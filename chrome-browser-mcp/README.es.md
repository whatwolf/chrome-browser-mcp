# Chrome Browser MCP

Servidor MCP para controlar el navegador Chrome a través de CDP (Chrome DevTools Protocol). Permite que el IDE AI controle completamente el navegador Chrome, obtenga contenido de páginas, ejecute JavaScript, monitoree cambios en páginas y gestione extensiones de Chrome.

[English](README.md) | [中文](README.zh.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Português](README.pt.md)

## Requisitos Previos

### 1. Iniciar Chrome (Modo de Depuración Remota)

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

### 2. Instalar MCP Server

```bash
npm install -g chrome-browser-mcp
```

O usar npx:
```bash
npx chrome-browser-mcp
```

### 3. Configurar Cliente MCP

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

## Herramientas Disponibles

### Gestión de Conexión

| Herramienta | Descripción |
|-------------|-------------|
| `browser_connect` | Conectar al navegador Chrome en ejecución |
| `browser_disconnect` | Desconectar del navegador |
| `browser_status` | Obtener estado de conexión del navegador |

### Gestión de Páginas

| Herramienta | Descripción |
|-------------|-------------|
| `page_list` | Listar todas las páginas abiertas |
| `page_open` | Abrir nueva página |
| `page_navigate` | Navegar a URL |
| `page_back` | Página anterior |
| `page_forward` | Página siguiente |
| `page_reload` | Recargar página |

### Contenido de Página

| Herramienta | Descripción |
|-------------|-------------|
| `page_get_html` | Obtener HTML de la página |
| `page_get_text` | Obtener contenido de texto de la página |
| `page_get_snapshot` | Obtener instantánea completa de la página |
| `page_query_selector` | Consultar elemento único |
| `page_query_selector_all` | Consultar todos los elementos coincidentes |

### Captura de Pantalla y Viewport

| Herramienta | Descripción |
|-------------|-------------|
| `page_screenshot` | Capturar pantalla de la página |
| `page_set_viewport` | Establecer tamaño del viewport |

### Ejecución de JavaScript

| Herramienta | Descripción |
|-------------|-------------|
| `js_execute` | Ejecutar código JavaScript |
| `js_run_tests` | Ejecutar código de prueba (soporta sintaxis describe/it/expect) |
| `js_inject_script` | Inyectar script externo |
| `js_inject_styles` | Inyectar estilos CSS |
| `js_get_globals` | Obtener variables globales de la página |

### Monitoreo

| Herramienta | Descripción |
|-------------|-------------|
| `monitor_console` | Obtener mensajes de consola |
| `monitor_network` | Obtener registros de solicitudes de red |

### Gestión de Extensiones

| Herramienta | Descripción |
|-------------|-------------|
| `extension_list` | Listar extensiones instaladas |
| `extension_enable` | Habilitar extensión |
| `extension_disable` | Deshabilitar extensión |
| `extension_reload` | Recargar extensión |
| `extension_get_storage` | Obtener datos de almacenamiento de extensión |
| `extension_set_storage` | Establecer datos de almacenamiento de extensión |

### Gestión de Sesiones

| Herramienta | Descripción |
|-------------|-------------|
| `session_set` | Establecer sesión activa actual |
| `session_list` | Listar todas las sesiones activas |

## Ejemplos de Uso

### Ejemplo 1: Abrir Página y Obtener Contenido

```
1. browser_connect
2. page_open {"url": "https://example.com"}
3. page_get_snapshot {"includeScreenshot": false}
4. page_close
5. browser_disconnect
```

### Ejemplo 2: Ejecutar Prueba JavaScript

```
1. browser_connect
2. page_open {"url": "https://example.com"}
3. js_run_tests {"testCode": "describe('Page', () => {\n  it('should have title', () => {\n    expect(document.title).toBeTruthy();\n  });\n});"}
4. page_close
5. browser_disconnect
```

### Ejemplo 3: Probar Extensión Chrome

```
1. browser_connect
2. page_open {"url": "chrome://extensions"}
3. extension_list {}
4. extension_get_storage {"extensionId": "xxx"}
5. extension_reload {"extensionId": "xxx"}
6. page_close
7. browser_disconnect
```

## Notas

1. **Chrome debe iniciarse en modo de depuración**: Use `--remote-debugging-port=9222`
2. **Límite de instancia única**: Solo una instancia de Chrome puede usar el mismo directorio de datos de usuario
3. **Gestión de sesiones**: Use `session_set` para cambiar sesiones activas al operar múltiples páginas
4. **Manejo de timeout**: Establezca valores de timeout razonables para scripts de ejecución prolongada
5. **Limpieza de recursos**: Llame a `browser_disconnect` para liberar recursos al terminar

## Documentación Relacionada

- [Descripción General del Proyecto](../README.md)
- [Documentación de Skill](../skill.md)
- [Prompt del Agente](../exten-coder-agent-prompt.md)
- [Guía de Invocación](../exten-coder-invoke-guide.md)
- [中文文档](README.zh.md)

## Licencia

MIT

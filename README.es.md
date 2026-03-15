# Chrome Browser MCP

Controla el navegador Chrome a través de MCP (Model Context Protocol) para lograr la comprensión de páginas web, ejecución de JavaScript, monitoreo de cambios de página y gestión de extensiones de Chrome.

[English](README.md) | [中文](README.zh.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Português](README.pt.md)

## 🎯 Valor Principal

- **Comprensión de Páginas Web**: La IA puede comprender completamente la estructura DOM, la lógica JS y las solicitudes de red
- **Depuración en Tiempo Real**: Ejecuta código directamente en el IDE y observa los cambios del navegador
- **Pruebas Automatizadas**: Ejecuta casos de prueba automáticamente para verificar la funcionalidad del plugin
- **Desarrollo Inteligente**: Colabora con el agente exten-coder para lograr el flujo de trabajo "Comprender → Desarrollar → Probar → Verificar"

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 18+
- Navegador Chrome (con soporte de depuración remota)
- Trae IDE (u otro IDE compatible con MCP)

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
cd chrome-browser-mcp
npm install
npm run build
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

## 🔧 Herramientas Disponibles

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
| `page_back` | Retroceder página |
| `page_forward` | Avanzar página |
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

## 💡 Ejemplos de Uso

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

## 🛠️ Stack Tecnológico

- **Chrome DevTools Protocol**: Controlar navegador mediante protocolo CDP
- **MCP Protocol**: Implementación de Model Context Protocol
- **TypeScript**: Lenguaje de desarrollo con tipos seguros
- **Node.js 18+**: Entorno de ejecución

## 📄 Licencia

MIT

---

**¡Comienza tu viaje de desarrollo de extensiones inteligentes!** 🚀

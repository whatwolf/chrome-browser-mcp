# Chrome Browser MCP

Controle o navegador Chrome através do MCP (Model Context Protocol) para realizar a compreensão de páginas web, execução de JavaScript, monitoramento de alterações de página e gerenciamento de extensões Chrome.

[English](README.md) | [中文](README.zh.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Português](README.pt.md)

## 🎯 Valor Principal

- **Compreensão de Páginas Web**: A IA pode compreender completamente a estrutura DOM, a lógica JS e as solicitações de rede
- **Depuração em Tempo Real**: Execute código diretamente no IDE e observe as alterações do navegador
- **Testes Automatizados**: Execute casos de teste automaticamente para verificar a funcionalidade do plugin
- **Desenvolvimento Inteligente**: Colabore com o agente exten-coder para realizar o fluxo de trabalho "Compreender → Desenvolver → Testar → Verificar"

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- Navegador Chrome (com suporte a depuração remota)
- Trae IDE (ou outro IDE compatível com MCP)

### 1. Iniciar Chrome (Modo de Depuração Remota)

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

## 🔧 Ferramentas Disponíveis

### Gerenciamento de Conexão

| Ferramenta | Descrição |
|------------|-----------|
| `browser_connect` | Conectar ao navegador Chrome em execução |
| `browser_disconnect` | Desconectar do navegador |
| `browser_status` | Obter status de conexão do navegador |

### Gerenciamento de Páginas

| Ferramenta | Descrição |
|------------|-----------|
| `page_list` | Listar todas as páginas abertas |
| `page_open` | Abrir nova página |
| `page_navigate` | Navegar para URL |
| `page_back` | Voltar página |
| `page_forward` | Avançar página |
| `page_reload` | Recarregar página |

### Conteúdo da Página

| Ferramenta | Descrição |
|------------|-----------|
| `page_get_html` | Obter HTML da página |
| `page_get_text` | Obter conteúdo de texto da página |
| `page_get_snapshot` | Obter snapshot completo da página |
| `page_query_selector` | Consultar elemento único |
| `page_query_selector_all` | Consultar todos os elementos correspondentes |

### Screenshot e Viewport

| Ferramenta | Descrição |
|------------|-----------|
| `page_screenshot` | Capturar screenshot da página |
| `page_set_viewport` | Definir tamanho do viewport |

### Execução de JavaScript

| Ferramenta | Descrição |
|------------|-----------|
| `js_execute` | Executar código JavaScript |
| `js_run_tests` | Executar código de teste (suporta sintaxe describe/it/expect) |
| `js_inject_script` | Injetar script externo |
| `js_inject_styles` | Injetar estilos CSS |

### Monitoramento

| Ferramenta | Descrição |
|------------|-----------|
| `monitor_console` | Obter mensagens do console |
| `monitor_network` | Obter logs de solicitações de rede |

### Gerenciamento de Extensões

| Ferramenta | Descrição |
|------------|-----------|
| `extension_list` | Listar extensões instaladas |
| `extension_enable` | Habilitar extensão |
| `extension_disable` | Desabilitar extensão |
| `extension_reload` | Recarregar extensão |
| `extension_get_storage` | Obter dados de armazenamento da extensão |
| `extension_set_storage` | Definir dados de armazenamento da extensão |

## 💡 Exemplos de Uso

### Exemplo 1: Abrir Página e Obter Conteúdo

```
1. browser_connect
2. page_open {"url": "https://example.com"}
3. page_get_snapshot {"includeScreenshot": false}
4. page_close
5. browser_disconnect
```

### Exemplo 2: Executar Teste JavaScript

```
1. browser_connect
2. page_open {"url": "https://example.com"}
3. js_run_tests {"testCode": "describe('Page', () => {\n  it('should have title', () => {\n    expect(document.title).toBeTruthy();\n  });\n});"}
4. page_close
5. browser_disconnect
```

### Exemplo 3: Testar Extensão Chrome

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

- **Chrome DevTools Protocol**: Controlar navegador via protocolo CDP
- **MCP Protocol**: Implementação do Model Context Protocol
- **TypeScript**: Linguagem de desenvolvimento com tipagem segura
- **Node.js 18+**: Ambiente de execução

## 📄 Licença

MIT

---

**Comece sua jornada de desenvolvimento de extensões inteligentes!** 🚀

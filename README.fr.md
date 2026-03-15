# Chrome Browser MCP

Contrôlez le navigateur Chrome via MCP (Model Context Protocol) pour réaliser la compréhension des pages web, l'exécution JavaScript, la surveillance des changements de page et la gestion des extensions Chrome.

[English](README.md) | [中文](README.zh.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Português](README.pt.md)

## 🎯 Valeur Principale

- **Compréhension des Pages Web**: L'IA peut comprendre complètement la structure DOM, la logique JS et les requêtes réseau
- **Débogage en Temps Réel**: Exécutez du code directement dans l'IDE et observez les changements du navigateur
- **Tests Automatisés**: Exécutez des cas de test automatiquement pour vérifier la fonctionnalité du plugin
- **Développement Intelligent**: Collaborez avec l'agent exten-coder pour réaliser le flux de travail "Comprendre → Développer → Tester → Vérifier"

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+
- Navigateur Chrome (avec support de débogage à distance)
- Trae IDE (ou autre IDE compatible MCP)

### 1. Démarrer Chrome (Mode de Débogage à Distance)

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

### 2. Installer MCP Server

```bash
cd chrome-browser-mcp
npm install
npm run build
```

### 3. Configurer le Client MCP

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

## 🔧 Outils Disponibles

### Gestion de Connexion

| Outil | Description |
|-------|-------------|
| `browser_connect` | Connecter au navigateur Chrome en cours d'exécution |
| `browser_disconnect` | Déconnecter du navigateur |
| `browser_status` | Obtenir l'état de connexion du navigateur |

### Gestion de Pages

| Outil | Description |
|-------|-------------|
| `page_list` | Lister toutes les pages ouvertes |
| `page_open` | Ouvrir une nouvelle page |
| `page_navigate` | Naviguer vers l'URL |
| `page_back` | Page précédente |
| `page_forward` | Page suivante |
| `page_reload` | Recharger la page |

### Contenu de Page

| Outil | Description |
|-------|-------------|
| `page_get_html` | Obtenir le HTML de la page |
| `page_get_text` | Obtenir le contenu texte de la page |
| `page_get_snapshot` | Obtenir l'instantané complet de la page |
| `page_query_selector` | Requête élément unique |
| `page_query_selector_all` | Requête tous les éléments correspondants |

### Capture d'Écran et Viewport

| Outil | Description |
|-------|-------------|
| `page_screenshot` | Capturer l'écran de la page |
| `page_set_viewport` | Définir la taille du viewport |

### Exécution JavaScript

| Outil | Description |
|-------|-------------|
| `js_execute` | Exécuter du code JavaScript |
| `js_run_tests` | Exécuter du code de test (supporte la syntaxe describe/it/expect) |
| `js_inject_script` | Injecter un script externe |
| `js_inject_styles` | Injecter des styles CSS |

### Surveillance

| Outil | Description |
|-------|-------------|
| `monitor_console` | Obtenir les messages de console |
| `monitor_network` | Obtenir les journaux de requêtes réseau |

### Gestion des Extensions

| Outil | Description |
|-------|-------------|
| `extension_list` | Lister les extensions installées |
| `extension_enable` | Activer l'extension |
| `extension_disable` | Désactiver l'extension |
| `extension_reload` | Recharger l'extension |
| `extension_get_storage` | Obtenir les données de stockage de l'extension |
| `extension_set_storage` | Définir les données de stockage de l'extension |

## 💡 Exemples d'Utilisation

### Exemple 1: Ouvrir une Page et Obtenir le Contenu

```
1. browser_connect
2. page_open {"url": "https://example.com"}
3. page_get_snapshot {"includeScreenshot": false}
4. page_close
5. browser_disconnect
```

### Exemple 2: Exécuter un Test JavaScript

```
1. browser_connect
2. page_open {"url": "https://example.com"}
3. js_run_tests {"testCode": "describe('Page', () => {\n  it('should have title', () => {\n    expect(document.title).toBeTruthy();\n  });\n});"}
4. page_close
5. browser_disconnect
```

### Exemple 3: Tester une Extension Chrome

```
1. browser_connect
2. page_open {"url": "chrome://extensions"}
3. extension_list {}
4. extension_get_storage {"extensionId": "xxx"}
5. extension_reload {"extensionId": "xxx"}
6. page_close
7. browser_disconnect
```

## 🛠️ Stack Technique

- **Chrome DevTools Protocol**: Contrôler le navigateur via le protocole CDP
- **MCP Protocol**: Implémentation du Model Context Protocol
- **TypeScript**: Langage de développement à typage sécurisé
- **Node.js 18+**: Environnement d'exécution

## 📄 Licence

MIT

---

**Commencez votre voyage de développement d'extensions intelligentes !** 🚀

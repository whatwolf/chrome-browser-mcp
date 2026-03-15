# Chrome Browser MCP

Serveur MCP pour contrôler le navigateur Chrome via CDP (Chrome DevTools Protocol). Permet à l'IDE AI de contrôler complètement le navigateur Chrome, d'obtenir le contenu des pages, d'exécuter JavaScript, de surveiller les changements de pages et de gérer les extensions Chrome.

[English](README.md) | [中文](README.zh.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Português](README.pt.md)

## Prérequis

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
npm install -g chrome-browser-mcp
```

Ou utiliser npx:
```bash
npx chrome-browser-mcp
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

## Outils Disponibles

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
| `js_get_globals` | Obtenir les variables globales de la page |

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

### Gestion des Sessions

| Outil | Description |
|-------|-------------|
| `session_set` | Définir la session active actuelle |
| `session_list` | Lister toutes les sessions actives |

## Exemples d'Utilisation

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

## Notes

1. **Chrome doit être démarré en mode débogage**: Utilisez `--remote-debugging-port=9222`
2. **Limite d'instance unique**: Une seule instance de Chrome peut utiliser le même répertoire de données utilisateur
3. **Gestion des sessions**: Utilisez `session_set` pour changer de session active lors de l'opération de plusieurs pages
4. **Gestion du timeout**: Définissez des valeurs de timeout raisonnables pour les scripts longs
5. **Nettoyage des ressources**: Appelez `browser_disconnect` pour libérer les ressources à la fin

## Documentation Liée

- [Vue d'Ensemble du Projet](../README.md)
- [Documentation Skill](../skill.md)
- [Prompt de l'Agent](../exten-coder-agent-prompt.md)
- [Guide d'Invocation](../exten-coder-invoke-guide.md)
- [中文文档](README.zh.md)

## Licence

MIT

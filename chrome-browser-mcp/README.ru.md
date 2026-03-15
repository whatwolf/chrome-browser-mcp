# Chrome Browser MCP

MCP-сервер для управления браузером Chrome через CDP (Chrome DevTools Protocol). Позволяет IDE AI полностью контролировать браузер Chrome, получать содержимое страниц, выполнять JavaScript, отслеживать изменения страниц и управлять расширениями Chrome.

[English](README.md) | [中文](README.zh.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Português](README.pt.md)

## Предварительные Требования

### 1. Запуск Chrome (Режим Удаленной Отладки)

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

### 2. Установка MCP Server

```bash
npm install -g chrome-browser-mcp
```

Или используйте npx:
```bash
npx chrome-browser-mcp
```

### 3. Настройка MCP Клиента

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

## Доступные Инструменты

### Управление Подключением

| Инструмент | Описание |
|------------|----------|
| `browser_connect` | Подключиться к запущенному браузеру Chrome |
| `browser_disconnect` | Отключиться от браузера |
| `browser_status` | Получить статус подключения браузера |

### Управление Страницами

| Инструмент | Описание |
|------------|----------|
| `page_list` | Список всех открытых страниц |
| `page_open` | Открыть новую страницу |
| `page_navigate` | Перейти по URL |
| `page_back` | Назад |
| `page_forward` | Вперед |
| `page_reload` | Перезагрузить страницу |

### Содержимое Страницы

| Инструмент | Описание |
|------------|----------|
| `page_get_html` | Получить HTML страницы |
| `page_get_text` | Получить текстовое содержимое страницы |
| `page_get_snapshot` | Получить полный снимок страницы |
| `page_query_selector` | Запросить один элемент |
| `page_query_selector_all` | Запросить все соответствующие элементы |

### Скриншот и Viewport

| Инструмент | Описание |
|------------|----------|
| `page_screenshot` | Сделать скриншот страницы |
| `page_set_viewport` | Установить размер viewport |

### Выполнение JavaScript

| Инструмент | Описание |
|------------|----------|
| `js_execute` | Выполнить код JavaScript |
| `js_run_tests` | Выполнить тестовый код (поддерживает синтаксис describe/it/expect) |
| `js_inject_script` | Внедрить внешний скрипт |
| `js_inject_styles` | Внедрить CSS стили |
| `js_get_globals` | Получить глобальные переменные страницы |

### Мониторинг

| Инструмент | Описание |
|------------|----------|
| `monitor_console` | Получить сообщения консоли |
| `monitor_network` | Получить журналы сетевых запросов |

### Управление Расширениями

| Инструмент | Описание |
|------------|----------|
| `extension_list` | Список установленных расширений |
| `extension_enable` | Включить расширение |
| `extension_disable` | Отключить расширение |
| `extension_reload` | Перезагрузить расширение |
| `extension_get_storage` | Получить данные хранилища расширения |
| `extension_set_storage` | Установить данные хранилища расширения |

### Управление Сеансами

| Инструмент | Описание |
|------------|----------|
| `session_set` | Установить текущий активный сеанс |
| `session_list` | Список всех активных сеансов |

## Примеры Использования

### Пример 1: Открыть Страницу и Получить Содержимое

```
1. browser_connect
2. page_open {"url": "https://example.com"}
3. page_get_snapshot {"includeScreenshot": false}
4. page_close
5. browser_disconnect
```

### Пример 2: Выполнить JavaScript Тест

```
1. browser_connect
2. page_open {"url": "https://example.com"}
3. js_run_tests {"testCode": "describe('Page', () => {\n  it('should have title', () => {\n    expect(document.title).toBeTruthy();\n  });\n});"}
4. page_close
5. browser_disconnect
```

### Пример 3: Тестирование Расширения Chrome

```
1. browser_connect
2. page_open {"url": "chrome://extensions"}
3. extension_list {}
4. extension_get_storage {"extensionId": "xxx"}
5. extension_reload {"extensionId": "xxx"}
6. page_close
7. browser_disconnect
```

## Примечания

1. **Chrome должен быть запущен в режиме отладки**: Используйте `--remote-debugging-port=9222`
2. **Ограничение одного экземпляра**: Только один экземпляр Chrome может использовать один и тот же каталог данных пользователя
3. **Управление сеансами**: Используйте `session_set` для переключения активных сеансов при работе с несколькими страницами
4. **Обработка таймаута**: Установите разумные значения таймаута для долго выполняющихся скриптов
5. **Очистка ресурсов**: Вызовите `browser_disconnect` для освобождения ресурсов по завершении

## Связанная Документация

- [Обзор Проекта](../README.md)
- [Документация Skill](../skill.md)
- [Prompt Агента](../exten-coder-agent-prompt.md)
- [Руководство по Вызову](../exten-coder-invoke-guide.md)
- [中文文档](README.zh.md)

## Лицензия

MIT

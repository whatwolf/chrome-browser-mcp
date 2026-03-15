# Chrome Browser MCP

MCP (Model Context Protocol)를 통해 Chrome 브라우저를 제어하여 웹 페이지 이해, JavaScript 실행, 페이지 변경 모니터링 및 Chrome 확장 프로그램 관리를 구현합니다.

[English](README.md) | [中文](README.zh.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Português](README.pt.md)

## 🎯 핵심 가치

- **웹 페이지 이해**: AI가 DOM 구조, JS 로직, 네트워크 요청을 완전히 이해
- **실시간 디버깅**: IDE에서 코드를 직접 실행하고 브라우저 변경 사항 관찰
- **자동화 테스트**: 테스트 케이스를 자동 실행하여 플러그인 기능 검증
- **스마트 개발**: exten-coder 에이전트와 협력하여 "이해 → 개발 → 테스트 → 검증" 워크플로우 구현

## 🚀 빠른 시작

### 전제 조건

- Node.js 18+
- Chrome 브라우저(원격 디버깅 지원)
- Trae IDE(또는 다른 MCP 호환 IDE)

### 1. Chrome 브라우저 시작(원격 디버깅 모드)

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

### 2. MCP Server 설치

```bash
cd chrome-browser-mcp
npm install
npm run build
```

### 3. MCP 클라이언트 구성

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

## 🔧 사용 가능한 도구

### 연결 관리

| 도구 | 설명 |
|------|------|
| `browser_connect` | 실행 중인 Chrome 브라우저에 연결 |
| `browser_disconnect` | 브라우저에서 연결 해제 |
| `browser_status` | 브라우저 연결 상태 가져오기 |

### 페이지 관리

| 도구 | 설명 |
|------|------|
| `page_list` | 열려 있는 모든 페이지 나열 |
| `page_open` | 새 페이지 열기 |
| `page_navigate` | 지정된 URL로 이동 |
| `page_back` | 이전 페이지로 돌아가기 |
| `page_forward` | 다음 페이지로 이동 |
| `page_reload` | 페이지 새로고침 |

### 페이지 콘텐츠

| 도구 | 설명 |
|------|------|
| `page_get_html` | 페이지 HTML 가져오기 |
| `page_get_text` | 페이지 텍스트 콘텐츠 가져오기 |
| `page_get_snapshot` | 페이지의 전체 스냅샷 가져오기 |
| `page_query_selector` | 단일 요소 쿼리 |
| `page_query_selector_all` | 일치하는 모든 요소 쿼리 |

### 스크린샷 및 뷰포트

| 도구 | 설명 |
|------|------|
| `page_screenshot` | 페이지 스크린샷 캡처 |
| `page_set_viewport` | 뷰포트 크기 설정 |

### JavaScript 실행

| 도구 | 설명 |
|------|------|
| `js_execute` | JavaScript 코드 실행 |
| `js_run_tests` | 테스트 코드 실행(describe/it/expect 구문 지원) |
| `js_inject_script` | 외부 스크립트 주입 |
| `js_inject_styles` | CSS 스타일 주입 |

### 모니터링

| 도구 | 설명 |
|------|------|
| `monitor_console` | 콘솔 메시지 가져오기 |
| `monitor_network` | 네트워크 요청 로그 가져오기 |

### 확장 프로그램 관리

| 도구 | 설명 |
|------|------|
| `extension_list` | 설치된 확장 프로그램 나열 |
| `extension_enable` | 확장 프로그램 활성화 |
| `extension_disable` | 확장 프로그램 비활성화 |
| `extension_reload` | 확장 프로그램 다시 로드 |
| `extension_get_storage` | 확장 프로그램 스토리지 데이터 가져오기 |
| `extension_set_storage` | 확장 프로그램 스토리지 데이터 설정 |

## 💡 사용 예시

### 예시 1: 페이지 열기 및 콘텐츠 가져오기

```
1. browser_connect
2. page_open {"url": "https://example.com"}
3. page_get_snapshot {"includeScreenshot": false}
4. page_close
5. browser_disconnect
```

### 예시 2: JavaScript 테스트 실행

```
1. browser_connect
2. page_open {"url": "https://example.com"}
3. js_run_tests {"testCode": "describe('Page', () => {\n  it('should have title', () => {\n    expect(document.title).toBeTruthy();\n  });\n});"}
4. page_close
5. browser_disconnect
```

### 예시 3: Chrome 확장 프로그램 테스트

```
1. browser_connect
2. page_open {"url": "chrome://extensions"}
3. extension_list {}
4. extension_get_storage {"extensionId": "xxx"}
5. extension_reload {"extensionId": "xxx"}
6. page_close
7. browser_disconnect
```

## 🛠️ 기술 스택

- **Chrome DevTools Protocol**: CDP 프로토콜로 브라우저 제어
- **MCP Protocol**: Model Context Protocol 구현
- **TypeScript**: 타입 안전한 개발 언어
- **Node.js 18+**: 런타임 환경

## 📄 라이선스

MIT

---

**스마트한 확장 프로그램 개발 여정을 시작하세요!** 🚀

# Chrome Browser MCP

CDP(Chrome DevTools Protocol)를 통해 Chrome 브라우저를 제어하는 MCP 서버입니다. IDE AI가 Chrome 브라우저를 완전히 제어하고, 페이지 콘텐츠를 가져오고, JavaScript를 실행하며, 페이지 변경을 모니터링하고, Chrome 확장 프로그램을 관리할 수 있습니다.

[English](README.md) | [中文](README.zh.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Português](README.pt.md)

## 전제 조건

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
npm install -g chrome-browser-mcp
```

또는 npx 사용:
```bash
npx chrome-browser-mcp
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

## 사용 가능한 도구

### 연결 관리

| 도구 | 설명 |
|------|------|
| `browser_connect` | 실행 중인 Chrome 브라우저에 연결 |
| `browser_disconnect` | 브라우저에서 연결 해제 |
| `browser_status` | 브라우저 연결 상태 가져오기 |

### 페이지 관리

| 도구 | 설명 |
|------|------|
| `page_list` | 열린 모든 페이지 나열 |
| `page_open` | 새 페이지 열기 |
| `page_attach` | 특정 페이지에 연결 |
| `page_close` | 현재 페이지 닫기 |
| `page_navigate` | URL로 이동 |
| `page_back` | 뒤로 가기 |
| `page_forward` | 앞으로 가기 |
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
| `js_get_globals` | 페이지 전역 변수 가져오기 |

### 모니터링

| 도구 | 설명 |
|------|------|
| `monitor_console` | 콘솔 메시지 가져오기 |
| `monitor_network` | 네트워크 요청 로그 가져오기 |

### 확장 프로그램 관리

| 도구 | 설명 |
|------|------|
| `extension_list` | 설치된 확장 프로그램 나열 |
| `extension_get_info` | 확장 프로그램 세부 정보 가져오기 |
| `extension_enable` | 확장 프로그램 활성화 |
| `extension_disable` | 확장 프로그램 비활성화 |
| `extension_reload` | 확장 프로그램 다시 로드 |
| `extension_execute` | 확장 프로그램 컨텍스트에서 코드 실행 |
| `extension_get_storage` | 확장 프로그램 저장소 데이터 가져오기 |
| `extension_set_storage` | 확장 프로그램 저장소 데이터 설정 |

### 세션 관리

| 도구 | 설명 |
|------|------|
| `session_set` | 현재 활성 세션 설정 |
| `session_list` | 모든 활성 세션 나열 |

## 사용 예시

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

## 참고 사항

1. **Chrome은 디버그 모드로 시작해야 합니다**: `--remote-debugging-port=9222` 사용
2. **단일 인스턴스 제한**: 동일한 사용자 데이터 디렉토리를 사용할 수 있는 Chrome 인스턴스는 한 번에 하나만 가능
3. **세션 관리**: 여러 페이지를 작업할 때는 `session_set`을 사용하여 활성 세션 전환
4. **타임아웃 처리**: 오래 실행되는 스크립트에는 적절한 타임아웃 값 설정
5. **리소스 정리**: 사용 후 `browser_disconnect`를 호출하여 리소스 해제

## 관련 문서

- [프로젝트 개요](../README.md)
- [Skill 문서](../skill.md)
- [에이전트 프롬프트](../exten-coder-agent-prompt.md)
- [호출 가이드](../exten-coder-invoke-guide.md)
- [中文文档](README.zh.md)

## 라이선스

MIT

# Chrome DevTools Protocol (CDP) 完整指南

## 概述

Chrome DevTools Protocol (CDP) 是一个强大的调试协议，允许工具对 Chromium、Chrome 和其他基于 Blink 的浏览器进行检测、调试和性能分析。

> **重要提示**: 在直接使用 CDP 进行浏览器自动化之前，请考虑使用更高级的工具如 [Playwright](https://github.com/microsoft/playwright) 或 [Puppeteer](https://github.com/puppeteer/puppeteer)。

## 协议基础

### 启动 Chrome 并启用调试

当 Chromium 以 `--remote-debugging-port` 参数启动时，它会启动一个 CDP 服务器并输出 WebSocket URL：

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="/Users/liwentao/ChromeDev"
```

输出示例：
```
DevTools listening on ws://127.0.0.1:9222/devtools/browser/a292f96c-7332-4ce8-82a9-7411f3bd280a
```

### JSON-RPC 基础

CDP 基于 JSON-RPC 规范，每个命令包含：
- `id`: 唯一标识符
- `method`: 方法名称
- `params`: 可选参数

### WebSocket 连接示例

```javascript
const WebSocket = require('ws');

(async () => {
  const ws = new WebSocket('ws://127.0.0.1:9222/devtools/browser/xxx', {
    perMessageDeflate: false
  });
  
  await new Promise(resolve => ws.once('open', resolve));
  console.log('已连接!');
  
  ws.on('message', msg => console.log(msg.toString()));
  
  ws.send(JSON.stringify({
    id: 1,
    method: 'Target.setDiscoverTargets',
    params: { discover: true },
  }));
})();
```

## Targets 和 Sessions

### Target 概念

Chrome DevTools 协议可以与浏览器的多个部分交互：
- **页面 (pages)**
- **Service Workers**
- **扩展程序 (extensions)**
- **浏览器 (browser)**

这些部分称为 **Targets**，可以通过 [Target domain](https://vanilla.aslushnikov.com/#Target) 获取和跟踪。

### Session 概念

当客户端想要使用 CDP 与 target 交互时，必须先使用 `Target.attachToTarget` 命令附加到 target。该命令会建立一个 **protocol session** 并返回一个 **sessionId**。

### Session 层级

```
WebSocket 连接 (root browser session)
├── Browser Target (browser session)
└── Page Target (page session)
    └── iframe Target (child session)
```

### 完整示例：附加到页面并导航

```javascript
const WebSocket = require('ws');

(async () => {
  const ws = new WebSocket('ws://127.0.0.1:9222/devtools/browser/xxx');
  await new Promise(resolve => ws.once('open', resolve));
  
  // 获取所有 targets
  const targetsResponse = await sendCommand(ws, {
    id: 1,
    method: 'Target.getTargets',
  });
  
  // 找到页面 target
  const pageTarget = targetsResponse.result.targetInfos.find(
    info => info.type === 'page'
  );
  
  // 附加到页面 target
  const attachResponse = await sendCommand(ws, {
    id: 2,
    method: 'Target.attachToTarget',
    params: {
      targetId: pageTarget.targetId,
      flatten: true,
    },
  });
  
  const sessionId = attachResponse.result.sessionId;
  
  // 使用 session 导航页面
  await sendCommand(ws, {
    sessionId,
    id: 1,
    method: 'Page.navigate',
    params: { url: 'https://example.com' },
  });
})();

function sendCommand(ws, command) {
  return new Promise(resolve => {
    ws.send(JSON.stringify(command));
    ws.on('message', function handler(text) {
      const response = JSON.parse(text);
      if (response.id === command.id) {
        ws.off('message', handler);
        resolve(response);
      }
    });
  });
}
```

## 使用 chrome-remote-interface

`chrome-remote-interface` 是一个更高级的 Node.js 客户端库：

```javascript
const CDP = require('chrome-remote-interface');

async function example() {
  const client = await CDP({
    host: 'localhost',
    port: 9222
  });
  
  const { Page, Runtime, DOM } = client;
  
  await Page.enable();
  await Runtime.enable();
  
  await Page.navigate({ url: 'https://example.com' });
  await Page.loadEventFired();
  
  const result = await Runtime.evaluate({
    expression: 'document.title'
  });
  
  console.log('页面标题:', result.result.value);
  
  await client.close();
}

example();
```

## 使用 Puppeteer 的 CDPSession

Puppeteer 提供了更便捷的 CDP 访问方式：

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // 创建 CDP session
  const session = await page.target().createCDPSession();
  
  // 使用 CDP 设置动画播放速率
  await session.send('Animation.enable');
  session.on('Animation.animationCreated', () => {
    console.log('动画已创建!');
  });
  await session.send('Animation.setPlaybackRate', { playbackRate: 2 });
  
  await page.goto('https://example.com');
})();
```

## 协议域名分类

### 核心域名

| 域名 | 描述 |
|------|------|
| **Target** | 管理浏览器 targets |
| **Page** | 页面操作和导航 |
| **Runtime** | JavaScript 运行时 |
| **DOM** | DOM 文档操作 |
| **Network** | 网络请求监控 |
| **Emulation** | 设备模拟 |

### 调试域名

| 域名 | 描述 |
|------|------|
| **Debugger** | JavaScript 调试器 |
| **Console** | 控制台 API |
| **Profiler** | 性能分析 |
| **HeapProfiler** | 堆内存分析 |

### 安全域名

| 域名 | 描述 |
|------|------|
| **Security** | 安全状态处理 |
| **Audits** | 审计功能 |

## 协议版本信息

当前协议版本：`1.3`

### 主要域名列表

从 `http://localhost:9222/json/protocol` 获取的域名包括：

1. **Accessibility** - 无障碍功能
2. **Animation** - 动画控制
3. **Audits** - 审计
4. **Autofill** - 自动填充
5. **BackgroundService** - 后台服务
6. **Browser** - 浏览器控制
7. **CacheStorage** - 缓存存储
8. **Cast** - 投屏
9. **Console** - 控制台
10. **CSS** - CSS 样式
11. **Database** - 数据库
12. **Debugger** - 调试器
13. **DeviceAccess** - 设备访问
14. **DOM** - DOM 操作
15. **DOMDebugger** - DOM 调试
16. **DOMSnapshot** - DOM 快照
17. **DOMStorage** - DOM 存储
18. **Emulation** - 设备模拟
19. **EventBreakpoints** - 事件断点
20. **Extensions** - 扩展程序
21. **FedCm** - 联邦凭证管理
22. **Fetch** - 网络请求拦截
23. **HeadlessExperimental** - 无头模式实验性功能
24. **HeapProfiler** - 堆分析器
25. **IndexedDB** - IndexedDB
26. **Input** - 输入事件
27. **Inspector** - 检查器
28. **IO** - 输入输出
29. **LayerTree** - 图层树
30. **Log** - 日志
31. **Media** - 媒体
32. **Memory** - 内存
33. **Network** - 网络
34. **Overlay** - 覆盖层
35. **Page** - 页面
36. **Performance** - 性能
37. **PerformanceTimeline** - 性能时间线
38. **Preload** - 预加载
39. **Profiler** - 分析器
40. **PWA** - 渐进式 Web 应用
41. **Runtime** - 运行时
42. **Schema** - 协议模式
43. **Security** - 安全
44. **ServiceWorker** - Service Worker
45. **Storage** - 存储
46. **SystemInfo** - 系统信息
47. **Target** - Target 管理
48. **Tethering** - 网络绑定
49. **Tracing** - 追踪
50. **WebAudio** - Web Audio
51. **WebAuthn** - Web 认证

## 常用命令示例

### 1. 获取所有 Targets

```javascript
{
  "id": 1,
  "method": "Target.getTargets"
}
```

响应：
```json
{
  "id": 1,
  "result": {
    "targetInfos": [
      {
        "targetId": "xxx",
        "type": "page",
        "url": "about:blank",
        "attached": false
      }
    ]
  }
}
```

### 2. 创建新 Target

```javascript
{
  "id": 2,
  "method": "Target.createTarget",
  "params": {
    "url": "https://example.com"
  }
}
```

### 3. 附加到 Target

```javascript
{
  "id": 3,
  "method": "Target.attachToTarget",
  "params": {
    "targetId": "xxx",
    "flatten": true
  }
}
```

### 4. 页面导航

```javascript
{
  "sessionId": "yyy",
  "id": 1,
  "method": "Page.navigate",
  "params": {
    "url": "https://example.com"
  }
}
```

### 5. 执行 JavaScript

```javascript
{
  "sessionId": "yyy",
  "id": 2,
  "method": "Runtime.evaluate",
  "params": {
    "expression": "document.title"
  }
}
```

### 6. 截图

```javascript
{
  "sessionId": "yyy",
  "id": 3,
  "method": "Page.captureScreenshot",
  "params": {
    "format": "png"
  }
}
```

### 7. 网络请求监控

```javascript
// 启用网络监控
{
  "sessionId": "yyy",
  "id": 4,
  "method": "Network.enable"
}

// 监听请求事件
// 事件: Network.requestWillBeSent, Network.responseReceived, Network.loadingFinished
```

### 8. DOM 操作

```javascript
// 获取文档根节点
{
  "sessionId": "yyy",
  "id": 5,
  "method": "DOM.getDocument"
}

// 查询元素
{
  "sessionId": "yyy",
  "id": 6,
  "method": "DOM.querySelector",
  "params": {
    "nodeId": 1,
    "selector": "h1"
  }
}
```

## Stable vs Experimental 方法

CDP 有稳定和实验性两部分：

- **Stable**: 稳定 API，保证向后兼容
- **Experimental**: 实验性 API，可能会更改或移除

> **警告**: 实验性 API 经常变化，使用时需谨慎！

## 调试技巧

### 监控 CDP 消息

使用 Puppeteer 时：
```bash
DEBUG=*protocol node your-script.js
```

### Chrome DevTools Protocol Monitor

在 Chrome DevTools 中可以使用 Protocol Monitor 查看所有 CDP 消息。

### 协议查看器

交互式协议查看器：https://vanilla.aslushnikov.com/

## 最佳实践

1. **使用 flatten 模式**: 在 `Target.attachToTarget` 中设置 `flatten: true`
2. **管理 Session ID**: 每个 session 内的命令 ID 独立
3. **处理事件**: 无 `id` 的消息是协议事件
4. **错误处理**: 检查响应中的 `error` 字段
5. **资源清理**: 使用完毕后关闭 session 和连接

## TypeScript 类型定义

```typescript
interface CDPCommand {
  id: number;
  method: string;
  params?: Record<string, any>;
  sessionId?: string;
}

interface CDPResponse {
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

interface CDPEvent {
  method: string;
  params: any;
  sessionId?: string;
}

interface TargetInfo {
  targetId: string;
  type: 'page' | 'background_page' | 'service_worker' | 'browser' | 'other';
  title: string;
  url: string;
  attached: boolean;
  openerId?: string;
  browserContextId?: string;
}
```

## 参考资源

- [官方协议文档](https://chromedevtools.github.io/devtools-protocol/)
- [交互式协议查看器](https://vanilla.aslushnikov.com/)
- [Puppeteer 文档](https://pptr.dev/)
- [Playwright 文档](https://playwright.dev/)
- [chrome-remote-interface](https://github.com/cyrus-and/chrome-remote-interface)
- [Getting Started with CDP](https://github.com/aslushnikov/getting-started-with-cdp)

# ChromeDev Controller - 产品策划文档

**版本**: v3.2  
**创建日期**: 2026-03-07  
**更新日期**: 2026-03-08  
**状态**: 重新设计

---

## 1. 产品概述

### 1.1 产品名称

**ChromeDev Controller**

### 1.2 产品定位

一款基于 Chrome DevTools Protocol 的 MCP 浏览器控制工具，通过启动 Chrome 的 remote-debugging-port 并连接独立的 MCP Server，提供完整的网页监控、代码注入和自动化控制能力。支持 Chrome 插件辅助开发和测试，用户使用原生 Chrome 浏览器打开网页、登录，MCP Server 作为独立进程运行，IDE 中的 AI Agent 通过 MCP 协议控制 Chrome、监控插件运行、自动测试和热重载。

### 1.3 目标用户

- AI 辅助编程使用者
- Chrome 插件开发者
- 需要自动化操作浏览器的开发者
- 需要监控网页内容变化的用户

### 1.4 核心价值

| 价值点 | 描述 |
|--------|------|
| **原生 Chrome** | 使用用户已安装的 Chrome 浏览器，无需额外安装 |
| **完全控制** | 通过 CDP 协议，拥有完整权限监控和操作浏览器 |
| **真实环境** | 使用原生 Chrome，完美兼容所有网站，可正常登录 |
| **实时监控** | 通过 DevTools Protocol，监控 DOM、网络、Console |
| **插件开发支持** | 加载开发中插件，自动测试和热重载 |
| **灵活的安全策略** | 可选择性移除 CORS/CSP，保留原网页安全属性 |
| **简单部署** | 用户只需启动 Chrome 和 MCP Server |

---

## 2. 功能需求

### 2.1 核心功能模块

#### 模块一：Chrome 浏览器启动与管理 (Chrome Launcher)

**功能描述**: 启动带有远程调试端口的 Chrome 浏览器，作为用户的主浏览器

**核心能力**:
- ✅ 启动 Chrome 并开启 remote-debugging-port
- ✅ 用户正常交互（点击、输入、滚动）
- ✅ **Chrome 内置密码管理器集成**
- ✅ **持久化登录状态（Cookie、LocalStorage、Session）**
- ✅ 多标签页支持
- ✅ 书签、历史记录
- ✅ 下载管理
- ✅ **加载开发中 Chrome 插件**
- ✅ **自动截图（可视区域/完整页面）**

**安全设计原则**:
- 🔒 **密码管理功能由 Chrome 内置管理，MCP 无法访问**
- 🔒 **AI Agent 无法读取或操作用户密码**
- 🔒 **密码存储使用 Chrome 安全存储机制**
- 🔒 **仅用于方便用户登录，提升用户体验**

**技术实现**:
```typescript
import { spawn } from 'child_process';
import { CDPClient } from 'chrome-remote-interface';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEBUG_PORT = 9222;
const USER_DATA_DIR = '/Users/liwentao/ChromeDev';

class ChromeLauncher {
  private chromeProcess: ChildProcess | null = null;
  private cdpClient: CDPClient | null = null;

  async launch(options: {
    headless?: boolean;
    extensions?: string[];
  } = {}): Promise<void> {
    const args = [
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${USER_DATA_DIR}`,
      '--no-first-run',
      '--no-default-browser-check',
    ];

    if (options.extensions && options.extensions.length > 0) {
      args.push(`--load-extension=${options.extensions.join(',')}`);
    }

    if (options.headless) {
      args.push('--headless=new');
    }

    this.chromeProcess = spawn(CHROME_PATH, args, {
      detached: true,
      stdio: 'ignore',
    });

    this.chromeProcess.unref();

    await this.waitForChromeReady();
    await this.connectCDP();
  }

  private async waitForChromeReady(): Promise<void> {
    const maxRetries = 30;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(`http://localhost:${DEBUG_PORT}/json/version`);
        if (response.ok) {
          return;
        }
      } catch (e) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    throw new Error('Chrome failed to start within timeout');
  }

  private async connectCDP(): Promise<void> {
    this.cdpClient = await CDPClient({ port: DEBUG_PORT });
    await this.cdpClient.Network.enable();
    await this.cdpClient.Page.enable();
    await this.cdpClient.DOM.enable();
    await this.cdpClient.Console.enable();
  }

  async getTargets(): Promise<ChromeTarget[]> {
    const response = await fetch(`http://localhost:${DEBUG_PORT}/json/list`);
    return response.json();
  }

  async close(): Promise<void> {
    if (this.cdpClient) {
      await this.cdpClient.close();
    }
    if (this.chromeProcess) {
      this.chromeProcess.kill();
    }
  }
}

// 启动 Chrome
const launcher = new ChromeLauncher();
await launcher.launch({
  extensions: ['/path/to/extension1', '/path/to/extension2'],
});
```

---

#### 模块二：独立 MCP Server (Standalone MCP Server)

**功能描述**: MCP Server 作为独立进程运行，通过 CDP 协议连接到 Chrome 的 remote-debugging-port

**核心职责**:
- ✅ 实现 MCP Protocol Server
- ✅ 接收 IDE 的请求（采集、执行、调试）
- ✅ 通过 DevTools Protocol 监控 Chrome
- ✅ 通过 CDP Runtime 执行 JavaScript
- ✅ **管理 Chrome 插件（加载、卸载、热重载）**
- ✅ **自动测试和验证**
- ✅ 返回执行结果给 IDE

**MCP Tools 设计**:

> ⚠️ **安全提示**: 密码管理功能由 Chrome 内置管理，**不会**暴露给 MCP，AI Agent 无法访问用户密码。

```typescript
// Tool 1: 采集页面信息
collectPageData: {
  url?: string;
  options: {
    includeDOM: boolean;
    includeConsole: boolean;
    includeNetwork: boolean;
    screenshot: boolean;
  }
}

// Tool 2: 执行代码
executeScript: {
  code: string;
  options: {
    waitForResult: boolean;
    captureConsole: boolean;
    timeout: number;
  }
}

// Tool 3: 监控页面变化
watchPageChanges: {
  selectors: string[];
  interval: number;
}

// Tool 4: 导航和操作
navigate: {
  url: string;
};

click: {
  selector: string;
};

type: {
  selector: string;
  text: string;
};

// Tool 5: 截图
captureScreenshot: {
  fullPage?: boolean;
  format?: 'png' | 'jpeg';
  quality?: number;
}

// Tool 6: 插件管理
loadExtension: {
  path: string;
};

reloadExtension: {
  extensionId: string;
};

getExtensionStatus: {
  extensionId: string;
};

// Tool 7: 安全策略
setSecurityPolicy: {
  disableCORS?: boolean;
  disableCSP?: boolean;
  preserveOriginal?: boolean;
};

// Tool 8: 自动测试
runAutoTest: {
  testScript: string;
  timeout?: number;
  retryCount?: number;
};
```

**技术实现**:
```typescript
import { McpServer } from '@modelcontextprotocol/server';
import CDP from 'chrome-remote-interface';

class ChromeMCPController {
  private mcpServer: McpServer;
  private cdpClient: CDP.Client;
  private loadedExtensions: Map<string, ExtensionInfo>;
  private debugPort: number = 9222;
  
  constructor() {
    this.setupMCPServer();
    this.loadedExtensions = new Map();
  }

  async connectToChrome(): Promise<void> {
    this.cdpClient = await CDP({ port: this.debugPort });
    
    await this.cdpClient.Network.enable();
    await this.cdpClient.Page.enable();
    await this.cdpClient.DOM.enable();
    await this.cdpClient.Console.enable();
    await this.cdpClient.Runtime.enable();
  }
  
  private setupMCPServer() {
    this.mcpServer = new McpServer({
      name: 'ChromeDev Controller',
      version: '1.0.0'
    });
    
    this.mcpServer.tool('collectPageData', this.collectPageData.bind(this));
    this.mcpServer.tool('executeScript', this.executeScript.bind(this));
    this.mcpServer.tool('captureScreenshot', this.captureScreenshot.bind(this));
    this.mcpServer.tool('loadExtension', this.loadExtension.bind(this));
    this.mcpServer.tool('reloadExtension', this.reloadExtension.bind(this));
    this.mcpServer.tool('setSecurityPolicy', this.setSecurityPolicy.bind(this));
    this.mcpServer.tool('runAutoTest', this.runAutoTest.bind(this));
  }
  
  private async executeScript(code: string) {
    const { result } = await this.cdpClient.Runtime.evaluate({
      expression: code,
      returnByValue: true,
      awaitPromise: true,
    });
    return result.value;
  }
  
  private async captureScreenshot(fullPage = false) {
    if (fullPage) {
      const { contentSize } = await this.cdpClient.Page.getLayoutMetrics();
      await this.cdpClient.Emulation.setDeviceMetricsOverride({
        width: contentSize.width,
        height: contentSize.height,
        deviceScaleFactor: 1,
        mobile: false,
      });
    }
    
    const { data } = await this.cdpClient.Page.captureScreenshot({
      format: 'png',
    });
    
    return `data:image/png;base64,${data}`;
  }
  
  private async loadExtension(extensionPath: string) {
    const targets = await CDP.List({ port: this.debugPort });
    const browserTarget = targets.find(t => t.type === 'browser');
    
    if (!browserTarget) {
      throw new Error('Browser target not found');
    }
    
    const browserClient = await CDP({ target: browserTarget });
    
    const result = await browserClient.send('Browser.loadExtension', {
      path: extensionPath,
    });
    
    this.loadedExtensions.set(result.id, {
      id: result.id,
      name: result.name,
      path: extensionPath,
      loadedAt: new Date()
    });
    
    return result;
  }
  
  private async reloadExtension(extensionId: string) {
    const extInfo = this.loadedExtensions.get(extensionId);
    if (!extInfo) {
      throw new Error(`Extension ${extensionId} not found`);
    }
    
    await this.loadExtension(extInfo.path);
  }
  
  private async setSecurityPolicy(options: {
    disableCORS?: boolean;
    disableCSP?: boolean;
    preserveOriginal?: boolean;
  }) {
    const { disableCORS, disableCSP, preserveOriginal } = options;
    
    if (disableCORS) {
      await this.cdpClient.Fetch.enable({
        patterns: [{ urlPattern: '*' }]
      });
      
      this.cdpClient.Fetch.requestPaused(async ({ requestId, request }) => {
        const headers = { ...request.headers };
        delete headers['Origin'];
        
        await this.cdpClient.Fetch.continueRequest({
          requestId,
          headers: Object.entries(headers).map(([name, value]) => ({ name, value })),
        });
      });
    }
    
    if (disableCSP) {
      await this.cdpClient.Page.setBypassCSP({ enabled: true });
    }
  }
}
```

---

#### 模块三：DevTools Protocol 集成 (CDP Integration)

**功能描述**: 通过 Chrome DevTools Protocol 深度监控浏览器

**监控能力**:
- ✅ DOM 树变化监听
- ✅ 网络请求监控（XHR/Fetch）
- ✅ Console 日志捕获
- ✅ JavaScript 执行上下文
- ✅ 性能指标采集
- ✅ 截图和录制
- ✅ **插件运行状态监控**

**技术实现**:
```typescript
import CDP from 'chrome-remote-interface';

async function connectCDP(port: number = 9222) {
  const client = await CDP({ port });
  
  await client.DOM.enable();
  await client.Network.enable();
  await client.Console.enable();
  await client.Runtime.enable();
  await client.Page.enable();

  client.DOM.documentUpdated(() => {
    console.log('DOM updated');
  });

  client.Network.responseReceived((params) => {
    console.log('Network response:', params);
  });

  client.Console.messageAdded((params) => {
    console.log('Console:', params.message);
  });

  return client;
}

async function monitorExtension(client: CDP.Client, extensionId: string) {
  const { result } = await client.Runtime.evaluate({
    expression: `
      chrome.management.get('${extensionId}', (info) => {
        return {
          enabled: info.enabled,
          version: info.version,
          permissions: info.permissions
        };
      });
    `,
    returnByValue: true,
  });
  return result.value;
}
```

---

#### 模块四：内容脚本注入 (Content Script Injection)

**功能描述**: 通过 CDP Runtime 在页面中注入监控和控制代码

**注入内容**:
- ✅ 全局调试对象（`window.__ChromeDev__`）
- ✅ DOM 变化监听器
- ✅ 事件拦截器（点击、输入等）
- ✅ 性能监控
- ✅ 错误捕获
- ✅ **插件通信桥接**

**技术实现**:
```typescript
import CDP from 'chrome-remote-interface';

async function injectMonitorScript(client: CDP.Client) {
  const script = `
    (function() {
      if (window.__ChromeDev__) return;
      
      window.__ChromeDev__ = {
        events: [],
        
        sendEvent: function(type, data) {
          this.events.push({ type, data, timestamp: Date.now() });
        },
        
        getPageInfo: function() {
          return {
            url: window.location.href,
            title: document.title,
            readyState: document.readyState
          };
        }
      };
      
      const observer = new MutationObserver((mutations) => {
        window.__ChromeDev__.sendEvent('dom-changed', {
          mutations: mutations.map(m => ({
            type: m.type,
            target: m.target.outerHTML,
            addedNodes: Array.from(m.addedNodes).map(n => n.outerHTML)
          }))
        });
      });
      
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true
      });
      
      console.log('ChromeDev monitor injected');
    })();
  `;
  
  await client.Runtime.evaluate({
    expression: script,
  });
}

async function getEvents(client: CDP.Client) {
  const { result } = await client.Runtime.evaluate({
    expression: 'window.__ChromeDev__.events',
    returnByValue: true,
  });
  return result.value;
}
```

---

#### 模块五：自动化控制 (Automation Control)

**功能描述**: 通过 MCP 接收指令，自动控制 Chrome 浏览器操作

**控制能力**:
- ✅ 导航到指定 URL
- ✅ 点击元素
- ✅ 输入文本
- ✅ 滚动页面
- ✅ 执行表单提交
- ✅ 文件上传/下载
- ✅ 键盘事件
- ✅ **自动测试流程**
- ✅ **插件热重载**

**技术实现**:
```typescript
import CDP from 'chrome-remote-interface';

class ChromeAutomation {
  constructor(private client: CDP.Client) {}

  async navigate(url: string) {
    await this.client.Page.navigate({ url });
  }

  async click(selector: string) {
    const script = `
      document.querySelector('${selector}')?.click();
      return true;
    `;
    await this.client.Runtime.evaluate({ expression: script });
  }

  async type(selector: string, text: string) {
    const script = `
      const el = document.querySelector('${selector}');
      el.value = '${text}';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    `;
    await this.client.Runtime.evaluate({ expression: script });
  }

  async runAutoTest(testScript: string, options = {}) {
    const { timeout = 30000, retryCount = 3 } = options;
    
    let lastError = null;
    
    for (let i = 0; i < retryCount; i++) {
      try {
        const startTime = Date.now();
        
        const { result } = await this.client.Runtime.evaluate({
          expression: `
            (async () => {
              try {
                ${testScript}
                return { success: true, time: Date.now() - ${startTime} };
              } catch (error) {
                return { 
                  success: false, 
                  error: error.message,
                  time: Date.now() - ${startTime}
                };
              }
            })();
          `,
          returnByValue: true,
          awaitPromise: true,
        });
        
        if (result.value.success) {
          return result.value;
        }
        
        lastError = result.value.error;
      } catch (error) {
        lastError = error.message;
      }
      
      if (i < retryCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return { success: false, error: lastError };
  }
}
```

---

### 2.2 监控和注入能力

| 功能 | 描述 | 实现方式 |
|------|------|----------|
| **DOM 监控** | 监听 DOM 树变化 | MutationObserver + CDP |
| **网络监控** | 捕获所有网络请求 | CDP Network API |
| **Console 捕获** | 收集 Console 输出 | CDP Console API |
| **性能监控** | 采集性能指标 | CDP Performance API |
| **截图录制** | 页面截图和屏幕录制 | CDP Page API |
| **代码注入** | 注入任意 JavaScript | CDP Runtime.evaluate |
| **事件拦截** | 拦截用户操作事件 | 内容脚本注入 |
| **状态持久化** | 保存 Cookie 和 Storage | Chrome 用户数据目录 |
| **插件监控** | 监控插件运行状态 | chrome.management API |
| **安全策略** | 可选移除 CORS/CSP | CDP Fetch + Page API |

---

## 3. 技术架构

### 3.1 整体架构图

```
┌─────────────────┐         MCP Protocol         ┌──────────────────────────────┐
│                 │ ◄──────────────────────────► │                              │
│   Trae IDE      │                              │   MCP Server (独立进程)       │
│   (AI Agent)    │                              │   - MCP Protocol Server      │
│                 │                              │   - CDP Client               │
└─────────────────┘                              │   - Extension Manager        │
                                                 │   - Security Controller      │
                                                 └──────────────┬───────────────┘
                                                                │
                                              CDP (remote-debugging-port:9222)
                                                                │
                                                 ┌──────────────┴───────────────┐
                                                 │                              │
                                                 ▼                              ▼
                                         ┌──────────────────────────────────────────┐
                                         │      Google Chrome 浏览器                 │
                                         │      (--remote-debugging-port=9222)      │
                                         │                                          │
                                         │  ┌─────────────┐ ┌─────────────┐        │
                                         │  │ 标签页 1     │ │ 标签页 2     │        │
                                         │  │ (网页 A)     │ │ (网页 B)     │        │
                                         │  │             │ │             │        │
                                         │  │ - DOM       │ │ - DOM       │        │
                                         │  │ - JS        │ │ - JS        │        │
                                         │  │ - 网络      │ │ - 网络      │        │
                                         │  │ - 插件      │ │ - 插件      │        │
                                         │  └─────────────┘ └─────────────┘        │
                                         │                                          │
                                         │  ┌────────────────────────────────────┐ │
                                         │  │ 内容脚本 (注入监控)                  │ │
                                         │  │ - window.__ChromeDev__             │ │
                                         │  │ - DOM 观察者                        │ │
                                         │  │ - 事件拦截器                        │ │
                                         │  └────────────────────────────────────┘ │
                                         └──────────────────────────────────────────┘
```

### 3.2 项目结构

```
chrome-dev-controller/
├── src/
│   ├── launcher/              # Chrome 启动器
│   │   ├── index.ts           # 主入口
│   │   ├── chrome-launcher.ts # Chrome 启动管理
│   │   └── process-manager.ts # 进程管理
│   │
│   ├── mcp-server/            # MCP Server
│   │   ├── index.ts           # MCP Server 入口
│   │   ├── tools/             # MCP Tools
│   │   │   ├── collect-data.ts
│   │   │   ├── execute-script.ts
│   │   │   ├── screenshot.ts
│   │   │   ├── extension.ts
│   │   │   └── automation.ts
│   │   └── resources/         # MCP Resources
│   │
│   ├── cdp/                   # CDP 客户端
│   │   ├── client.ts          # CDP 连接管理
│   │   ├── dom.ts             # DOM 操作
│   │   ├── network.ts         # 网络监控
│   │   ├── runtime.ts         # JS 执行
│   │   └── page.ts            # 页面操作
│   │
│   ├── extension/             # 插件管理
│   │   ├── loader.ts          # 插件加载器
│   │   ├── reloader.ts        # 热重载
│   │   └── monitor.ts         # 状态监控
│   │
│   ├── scripts/               # 注入脚本
│   │   ├── monitor.ts         # 监控脚本
│   │   └── bridge.ts          # 通信桥接
│   │
│   └── utils/                 # 工具函数
│       ├── logger.ts
│       └── config.ts
│
├── test-extensions/           # 测试插件目录
│   └── sample-extension/
│       ├── manifest.json
│       ├── background.js
│       └── content.js
│
├── package.json
├── tsconfig.json
└── README.md
```

### 3.3 技术栈选型

| 组件 | 技术选型 | 理由 |
|------|----------|------|
| **浏览器** | Google Chrome (native) | 用户已安装，完整 CDP 支持 |
| **语言** | TypeScript | 类型安全，易于维护 |
| **MCP** | @modelcontextprotocol/server | 官方 MCP SDK |
| **CDP** | chrome-remote-interface | 成熟的 CDP 客户端库 |
| **构建** | esbuild / tsup | 快速构建 |
| **运行时** | Node.js 18+ | 原生支持 fetch、async/await |
| **测试** | Jest + Vitest | 单元测试和集成测试 |

### 3.4 Chrome 启动配置

```bash
# macOS 启动 Chrome 并开启远程调试
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="/Users/liwentao/ChromeDev"

# 可选参数
--load-extension=/path/to/ext1,/path/to/ext2  # 加载插件
--disable-web-security               # 禁用同源策略（开发调试用）
--disable-features=IsolateOrigins,site-per-process  # 禁用站点隔离
--headless=new                       # 无头模式
```

**配置说明**:
- `--remote-debugging-port=9222`: 开启远程调试端口，MCP Server 通过此端口连接
- `--user-data-dir`: 指定用户数据目录，实现登录状态持久化，与默认 Chrome 数据隔离

---

## 4. 开发计划

### Phase 1: MVP (最小可行产品) - 1 周

**目标**: 实现基础 Chrome 连接和 MCP 集成

**交付物**:
- [ ] Chrome 启动器
- [ ] 独立 MCP Server
- [ ] CDP 客户端连接
- [ ] 基础代码执行功能
- [ ] 页面数据采集

**功能清单**:
1. 启动 Chrome 并连接 CDP
2. 导航到指定 URL
3. 执行 JavaScript 代码
4. 返回页面 HTML
5. 截取当前页面

---

### Phase 2: 监控能力 - 1 周

**目标**: 实现完整的网页监控能力

**交付物**:
- [ ] DevTools Protocol 完整集成
- [ ] DOM 变化监听
- [ ] 网络请求监控
- [ ] Console 日志捕获
- [ ] 完整页面截图

**功能清单**:
1. 监听 DOM 树变化
2. 捕获网络请求
3. 收集 Console 输出
4. 页面截图（可视区域/完整页面）

---

### Phase 3: 自动化控制 - 1 周

**目标**: 实现浏览器自动化控制

**交付物**:
- [ ] 点击、输入等操作
- [ ] 表单处理
- [ ] 文件上传/下载
- [ ] 键盘/鼠标事件
- [ ] 自动测试框架

**功能清单**:
1. 点击指定元素
2. 输入文本到表单
3. 提交表单
4. 文件操作
5. 运行自动测试

---

### Phase 4: 插件开发支持 - 1 周

**目标**: 实现 Chrome 插件辅助开发功能

**交付物**:
- [ ] 加载开发中插件
- [ ] 插件热重载
- [ ] 插件运行状态监控
- [ ] 插件通信桥接

**功能清单**:
1. 从本地路径加载插件
2. 自动检测插件代码变化并重载
3. 监控插件运行状态
4. 与插件进行消息通信

---

### Phase 5: 安全策略控制 - 3 天

**目标**: 实现灵活的安全策略配置

**交付物**:
- [ ] 可选移除 CORS
- [ ] 可选移除 CSP
- [ ] 保留原网页安全属性
- [ ] 开发和生产环境对比测试

**功能清单**:
1. 配置是否启用 CORS 限制
2. 配置是否启用 CSP 限制
3. 保留原始 CSP 用于测试对比
4. 一键切换开发/生产环境

---

### Phase 6: 高级功能 - 持续迭代

**目标**: 提升产品竞争力

**功能清单**:
- [ ] 多标签页管理
- [ ] Cookie 和 Storage 管理
- [ ] 性能分析
- [ ] 屏幕录制
- [ ] 自动登录脚本
- [ ] 数据导出
- [ ] 测试报告生成

---

## 5. 用户体验设计

### 5.1 典型使用流程

```
1. 用户启动 Chrome（带 remote-debugging-port）
2. MCP Server 自动连接到 Chrome
3. 用户正常使用 Chrome 浏览网页、登录
4. AI Agent 通过 MCP 调用浏览器功能：
   - "读取当前页面内容"
   - "执行这段 JavaScript"
   - "监控这个元素的变化"
   - "点击这个按钮"
   - "加载开发中的插件"
   - "运行自动测试"
   - "截图当前页面"
5. MCP Server 通过 CDP 执行并返回结果
6. AI 分析结果并给出反馈
7. 检测到插件代码变化，自动重载并重新测试
```

### 5.2 IDE 集成体验

**在 Trae IDE 中的交互示例**:

```
用户：打开浏览器，访问 Google

AI: 正在连接 Chrome...
[调用 navigate: { url: 'https://google.com' }]
✅ Chrome 已连接，页面已加载

用户：加载我的插件进行测试

AI: [调用 loadExtension: { path: '/path/to/extension' }]
✅ 插件已加载：ChromeDev Assistant (ID: abc123)

用户：运行自动测试

AI: [调用 runAutoTest: { testScript: '...' }]
✅ 测试通过！耗时 1.2s

用户：截图当前页面

AI: [调用 captureScreenshot: { fullPage: false }]
📸 截图完成！[查看图片]

用户：监控插件运行状态

AI: [调用 getExtensionStatus: { extensionId: 'abc123' }]
📊 插件状态：
- 已启用：✅
- 版本：1.0.0
- 权限：activeTab, scripting

用户：修改了插件代码

AI: 🔍 检测到插件代码变化，正在重载...
[调用 reloadExtension: { extensionId: 'abc123' }]
✅ 插件已重载，正在重新测试...
✅ 测试通过！

用户：关闭 CORS 限制进行测试

AI: [调用 setSecurityPolicy: { disableCORS: true, preserveOriginal: true }]
🔓 CORS 已禁用（保留原始配置用于对比）
💡 提示：生产环境仍会有 CORS 限制
```

### 5.3 监控示例

**实时监控页面变化**:

```typescript
// AI Agent 订阅 DOM 变化
AI: 监控这个价格元素的变化
[调用 watchPageChanges: { selectors: ['.price'], interval: 1000 }]

// 当价格变化时，MCP Server 主动推送
MCP Server → AI: {
  type: 'dom-changed',
  data: {
    selector: '.price',
    oldValue: '¥999',
    newValue: '¥799'
  }
}

AI: 检测到价格变化！原价 ¥999，现价 ¥799（降价 20%）
```

**插件热重载流程**:

```
1. 用户修改插件代码
2. MCP Server 检测到文件变化（chokidar）
3. 自动调用 reloadExtension
4. 刷新页面让插件生效
5. 运行自动测试验证功能
6. AI 汇报测试结果
```

---

## 6. 优势对比

### vs Chrome 扩展方案

| 维度 | Chrome 扩展 | Chrome + MCP 方案 |
|------|------------|------------------|
| **部署复杂度** | 高（需加载扩展、配置权限） | 低（启动 Chrome + MCP Server） |
| **连接稳定性** | 中（Service Worker 会休眠） | 高（常驻进程） |
| **权限范围** | 受限（Chrome API 限制） | 完整（CDP 协议） |
| **监控能力** | 部分（依赖 Content Script） | 完整（CDP 直连） |
| **用户体验** | 需操作扩展 | 和正常 Chrome 一样 |
| **开发难度** | 中 | 低 |
| **插件开发支持** | 手动重载 | 自动热重载 |
| **安全策略** | 固定 | 灵活配置 |

### vs Puppeteer/Playwright

| 维度 | Puppeteer | Chrome + MCP 方案 |
|------|-----------|------------------|
| **使用场景** | 自动化测试 | 日常使用 + 自动化 |
| **用户交互** | 无（纯后台） | 有（图形界面） |
| **登录状态** | 每次重新登录 | 持久化保存 |
| **伪装能力** | 可检测（自动化特征） | 完全正常（原生 Chrome） |
| **学习成本** | 需编写代码 | 自然语言控制 |
| **插件支持** | 复杂 | 原生支持 |

---

## 7. 风险评估与应对

### 7.1 技术风险

| 风险 | 可能性 | 影响 | 应对措施 |
|------|--------|------|----------|
| CDP 协议变化 | 低 | 中 | 跟进 Chrome 版本，使用稳定 API |
| 性能开销 | 中 | 中 | 优化监控频率，按需开启 |
| 安全性 | 高 | 高 | 严格验证 MCP 请求，限制敏感操作 |
| Chrome 版本兼容 | 低 | 中 | 测试主流 Chrome 版本 |
| 插件兼容性 | 中 | 中 | 测试主流插件，提供兼容列表 |

### 7.2 产品风险

| 风险 | 可能性 | 影响 | 应对措施 |
|------|--------|------|----------|
| 用户不熟悉命令行启动 | 中 | 高 | 提供启动脚本或 GUI 启动器 |
| 功能过于强大被滥用 | 中 | 高 | 添加使用审计日志，限制敏感操作 |
| 安全策略误用 | 中 | 高 | 明确提示开发/生产环境差异 |

---

## 8. 成功指标

### 8.1 技术指标

- ✅ MCP Server 启动时间 < 1 秒
- ✅ CDP 连接延迟 < 100ms
- ✅ 代码执行延迟 < 100ms
- ✅ 内存占用 < 100MB
- ✅ 支持并发标签页 ≥ 20
- ✅ 截图延迟 < 500ms
- ✅ 插件热重载 < 2 秒

### 8.2 用户体验指标

- ✅ 日常使用无感知（和 Chrome 一样）
- ✅ AI 控制响应时间 < 500ms
- ✅ 插件开发效率提升 50%
- ✅ 用户满意度 ≥ 4.5/5

---

## 9. 下一步行动

1. **创建 Node.js 项目**：初始化项目结构
2. **实现 Chrome 启动器**：启动并连接 Chrome
3. **集成 MCP Server**：注册基础工具
4. **实现 CDP 连接**：chrome-remote-interface
5. **实现代码执行**：Runtime.evaluate
6. **集成 DevTools Protocol**：监控能力
7. **实现截图功能**：Page.captureScreenshot
8. **实现插件管理**：loadExtension、reloadExtension
9. **实现安全控制**：setSecurityPolicy
10. **实现自动测试**：runAutoTest

---

## 10. 附录：快速开始

### 10.1 开发环境

```bash
# 创建项目
mkdir chrome-dev-controller && cd chrome-dev-controller
npm init -y

# 安装依赖
npm install @modelcontextprotocol/server chrome-remote-interface chokidar typescript

# 启动开发
npm run dev
```

### 10.2 最小示例

```typescript
// src/index.ts
import { spawn } from 'child_process';
import CDP from 'chrome-remote-interface';
import { McpServer } from '@modelcontextprotocol/server';
import chokidar from 'chokidar';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEBUG_PORT = 9222;
const USER_DATA_DIR = '/Users/liwentao/ChromeDev';

class ChromeDevController {
  private mcpServer: McpServer;
  private cdpClient: CDP.Client | null = null;

  constructor() {
    this.setupMCP();
  }

  async launchChrome() {
    spawn(CHROME_PATH, [
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${USER_DATA_DIR}`,
      '--no-first-run',
    ], { detached: true, stdio: 'ignore' });

    await this.waitForChrome();
    await this.connectCDP();
  }

  private async waitForChrome() {
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://localhost:${DEBUG_PORT}/json/version`);
        if (res.ok) return;
      } catch (e) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
    throw new Error('Chrome failed to start');
  }

  private async connectCDP() {
    this.cdpClient = await CDP({ port: DEBUG_PORT });
    await this.cdpClient.Network.enable();
    await this.cdpClient.Page.enable();
    await this.cdpClient.Runtime.enable();
  }

  private setupMCP() {
    this.mcpServer = new McpServer({
      name: 'ChromeDev Controller',
      version: '1.0.0'
    });

    this.mcpServer.tool('navigate', { url: z.string() }, async ({ url }) => {
      await this.cdpClient?.Page.navigate({ url });
      return { success: true };
    });

    this.mcpServer.tool('executeScript', { code: z.string() }, async ({ code }) => {
      const { result } = await this.cdpClient!.Runtime.evaluate({
        expression: code,
        returnByValue: true,
      });
      return { success: true, data: result.value };
    });

    this.mcpServer.tool('captureScreenshot', {}, async () => {
      const { data } = await this.cdpClient!.Page.captureScreenshot({ format: 'png' });
      return { success: true, data: `data:image/png;base64,${data}` };
    });
  }

  watchExtension(extensionPath: string) {
    chokidar.watch(extensionPath, { ignored: /node_modules/ })
      .on('change', async (filePath) => {
        console.log('检测到插件代码变化:', filePath);
        // 自动重载插件
      });
  }
}

const controller = new ChromeDevController();
controller.launchChrome();
```

### 10.3 自动测试示例

```typescript
// 测试脚本示例
const testScript = `
  // 1. 检查页面标题
  const title = document.title;
  if (!title.includes('Google')) {
    throw new Error('页面标题错误');
  }
  
  // 2. 检查搜索框是否存在
  const searchBox = document.querySelector('textarea[name="q"]');
  if (!searchBox) {
    throw new Error('搜索框不存在');
  }
  
  // 3. 检查插件是否正常工作
  const extensionResult = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'ping' }, resolve);
  });
  
  if (!extensionResult || !extensionResult.success) {
    throw new Error('插件未响应');
  }
  
  return { 
    success: true, 
    message: '所有测试通过' 
  };
`;

// 调用 MCP
await callMCP('runAutoTest', {
  testScript,
  timeout: 30000,
  retryCount: 3
});
```

---

**文档维护**: 本策划文档将随项目进展持续更新  
**最后更新**: 2026-03-08

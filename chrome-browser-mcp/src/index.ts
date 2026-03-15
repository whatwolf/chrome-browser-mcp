#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { CDPManager } from './cdp-manager.js';
import { BrowserController } from './browser-controller.js';
import { JSTester, ExtensionManager } from './js-tester.js';

const CHROME_HOST = process.env.CHROME_HOST || 'localhost';
const CHROME_PORT = parseInt(process.env.CHROME_PORT || '9222', 10);

interface SessionInfo {
  sessionId: string;
  targetId: string;
  url: string;
  createdAt: number;
}

class ChromeBrowserMCPServer {
  private server: Server;
  private cdp: CDPManager;
  private browser: BrowserController;
  private jsTester: JSTester;
  private extensionManager: ExtensionManager;
  private sessions = new Map<string, SessionInfo>();
  private currentSession: string | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'chrome-browser-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.cdp = new CDPManager({ host: CHROME_HOST, port: CHROME_PORT });
    this.browser = new BrowserController(this.cdp);
    this.jsTester = new JSTester(this.cdp);
    this.extensionManager = new ExtensionManager(this.cdp);

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // 连接管理
        {
          name: 'browser_connect',
          description: '连接到已运行的 Chrome 浏览器（需要以 --remote-debugging-port=9222 启动）',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'browser_disconnect',
          description: '断开与浏览器的连接',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'browser_status',
          description: '获取浏览器连接状态',
          inputSchema: { type: 'object', properties: {} },
        },

        // 页面管理
        {
          name: 'page_list',
          description: '列出所有打开的页面',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'page_open',
          description: '打开新页面',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: '要打开的 URL' },
            },
            required: ['url'],
          },
        },
        {
          name: 'page_attach',
          description: '附加到指定页面',
          inputSchema: {
            type: 'object',
            properties: {
              targetId: { type: 'string', description: '页面 target ID' },
            },
            required: ['targetId'],
          },
        },
        {
          name: 'page_close',
          description: '关闭当前页面',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'page_navigate',
          description: '导航到指定 URL',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: '目标 URL' },
            },
            required: ['url'],
          },
        },
        {
          name: 'page_back',
          description: '后退',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'page_forward',
          description: '前进',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'page_reload',
          description: '刷新页面',
          inputSchema: {
            type: 'object',
            properties: {
              ignoreCache: { type: 'boolean', description: '是否忽略缓存' },
            },
          },
        },

        // 页面内容获取
        {
          name: 'page_get_html',
          description: '获取页面 HTML',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS 选择器（可选）' },
            },
          },
        },
        {
          name: 'page_get_text',
          description: '获取页面文本内容',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'page_get_snapshot',
          description: '获取页面完整快照（HTML、文本、DOM 结构）',
          inputSchema: {
            type: 'object',
            properties: {
              includeScreenshot: { type: 'boolean', description: '是否包含截图' },
            },
          },
        },
        {
          name: 'page_query_selector',
          description: '查询页面元素',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS 选择器' },
            },
            required: ['selector'],
          },
        },
        {
          name: 'page_query_selector_all',
          description: '查询所有匹配的页面元素',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS 选择器' },
            },
            required: ['selector'],
          },
        },

        // 截图和视口
        {
          name: 'page_screenshot',
          description: '截取页面截图',
          inputSchema: {
            type: 'object',
            properties: {
              format: { type: 'string', enum: ['png', 'jpeg'], description: '图片格式' },
              quality: { type: 'number', description: 'JPEG 质量 (0-100)' },
            },
          },
        },
        {
          name: 'page_set_viewport',
          description: '设置视口大小',
          inputSchema: {
            type: 'object',
            properties: {
              width: { type: 'number', description: '宽度' },
              height: { type: 'number', description: '高度' },
              deviceScaleFactor: { type: 'number', description: '设备像素比' },
            },
            required: ['width', 'height'],
          },
        },

        // JavaScript 执行
        {
          name: 'js_execute',
          description: '在页面中执行 JavaScript 代码',
          inputSchema: {
            type: 'object',
            properties: {
              code: { type: 'string', description: 'JavaScript 代码' },
              timeout: { type: 'number', description: '超时时间（毫秒）' },
            },
            required: ['code'],
          },
        },
        {
          name: 'js_run_tests',
          description: '运行测试代码（支持 describe/it/expect 语法）',
          inputSchema: {
            type: 'object',
            properties: {
              testCode: { type: 'string', description: '测试代码' },
            },
            required: ['testCode'],
          },
        },
        {
          name: 'js_inject_script',
          description: '注入外部脚本',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: '脚本 URL' },
            },
            required: ['url'],
          },
        },
        {
          name: 'js_inject_styles',
          description: '注入 CSS 样式',
          inputSchema: {
            type: 'object',
            properties: {
              css: { type: 'string', description: 'CSS 代码' },
            },
            required: ['css'],
          },
        },
        {
          name: 'js_get_globals',
          description: '获取页面全局变量列表',
          inputSchema: { type: 'object', properties: {} },
        },

        // 监控
        {
          name: 'monitor_console',
          description: '获取控制台消息',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'monitor_network',
          description: '获取网络请求记录',
          inputSchema: { type: 'object', properties: {} },
        },

        // 扩展程序管理
        {
          name: 'extension_list',
          description: '列出已安装的扩展程序',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'extension_get_info',
          description: '获取扩展程序详细信息',
          inputSchema: {
            type: 'object',
            properties: {
              extensionId: { type: 'string', description: '扩展程序 ID' },
            },
            required: ['extensionId'],
          },
        },
        {
          name: 'extension_enable',
          description: '启用扩展程序',
          inputSchema: {
            type: 'object',
            properties: {
              extensionId: { type: 'string', description: '扩展程序 ID' },
            },
            required: ['extensionId'],
          },
        },
        {
          name: 'extension_disable',
          description: '禁用扩展程序',
          inputSchema: {
            type: 'object',
            properties: {
              extensionId: { type: 'string', description: '扩展程序 ID' },
            },
            required: ['extensionId'],
          },
        },
        {
          name: 'extension_reload',
          description: '重新加载扩展程序',
          inputSchema: {
            type: 'object',
            properties: {
              extensionId: { type: 'string', description: '扩展程序 ID' },
            },
            required: ['extensionId'],
          },
        },
        {
          name: 'extension_execute',
          description: '在扩展程序上下文中执行代码',
          inputSchema: {
            type: 'object',
            properties: {
              extensionId: { type: 'string', description: '扩展程序 ID' },
              code: { type: 'string', description: 'JavaScript 代码' },
            },
            required: ['extensionId', 'code'],
          },
        },
        {
          name: 'extension_get_storage',
          description: '获取扩展程序存储数据',
          inputSchema: {
            type: 'object',
            properties: {
              extensionId: { type: 'string', description: '扩展程序 ID' },
              keys: { type: 'array', items: { type: 'string' }, description: '要获取的键' },
            },
            required: ['extensionId'],
          },
        },
        {
          name: 'extension_set_storage',
          description: '设置扩展程序存储数据',
          inputSchema: {
            type: 'object',
            properties: {
              extensionId: { type: 'string', description: '扩展程序 ID' },
              data: { type: 'object', description: '要存储的数据' },
            },
            required: ['extensionId', 'data'],
          },
        },

        // 会话管理
        {
          name: 'session_set',
          description: '设置当前活动会话',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: { type: 'string', description: '会话 ID' },
            },
            required: ['sessionId'],
          },
        },
        {
          name: 'session_list',
          description: '列出所有活动会话',
          inputSchema: { type: 'object', properties: {} },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        const result = await this.handleToolCall(name, args || {});
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error),
            }),
          }],
        };
      }
    });

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: Array.from(this.sessions.entries()).map(([id, info]) => ({
        uri: `browser://session/${id}`,
        name: `Session: ${info.url}`,
        mimeType: 'application/json',
      })),
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      const match = uri.match(/^browser:\/\/session\/(.+)$/);
      
      if (!match) {
        throw new Error(`Unknown resource: ${uri}`);
      }
      
      const sessionId = match[1];
      const info = this.sessions.get(sessionId);
      
      if (!info) {
        throw new Error(`Session not found: ${sessionId}`);
      }
      
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(info, null, 2),
        }],
      };
    });
  }

  private requireSession(): string {
    if (!this.currentSession) {
      throw new Error('No active session. Use page_open or page_attach first.');
    }
    return this.currentSession;
  }

  private async handleToolCall(name: string, args: Record<string, unknown>): Promise<unknown> {
    switch (name) {
      // 连接管理
      case 'browser_connect':
        await this.cdp.connectToExistingBrowser();
        await this.browser.initialize();
        return { success: true, message: 'Connected to browser' };

      case 'browser_disconnect':
        await this.cdp.disconnect();
        this.sessions.clear();
        this.currentSession = null;
        return { success: true, message: 'Disconnected from browser' };

      case 'browser_status':
        return {
          connected: this.cdp.isConnected(),
          sessions: this.sessions.size,
          currentSession: this.currentSession,
        };

      // 页面管理
      case 'page_list':
        return this.browser.listPages();

      case 'page_open': {
        const { targetId, sessionId } = await this.browser.openPage(args.url as string);
        this.sessions.set(sessionId, {
          sessionId,
          targetId,
          url: args.url as string,
          createdAt: Date.now(),
        });
        this.currentSession = sessionId;
        return { targetId, sessionId };
      }

      case 'page_attach': {
        const sessionId = await this.browser.attachToPage(args.targetId as string);
        const targets = await this.cdp.getTargets();
        const target = targets.find(t => t.targetId === args.targetId);
        this.sessions.set(sessionId, {
          sessionId,
          targetId: args.targetId as string,
          url: target?.url || '',
          createdAt: Date.now(),
        });
        this.currentSession = sessionId;
        return { sessionId };
      }

      case 'page_close': {
        const sessionId = this.requireSession();
        await this.browser.closePage(sessionId);
        this.sessions.delete(sessionId);
        if (this.currentSession === sessionId) {
          this.currentSession = null;
        }
        return { success: true };
      }

      case 'page_navigate': {
        const sessionId = this.requireSession();
        await this.browser.navigate(sessionId, args.url as string);
        const info = this.sessions.get(sessionId);
        if (info) {
          info.url = args.url as string;
        }
        return { success: true, url: args.url };
      }

      case 'page_back': {
        const sessionId = this.requireSession();
        await this.browser.goBack(sessionId);
        return { success: true };
      }

      case 'page_forward': {
        const sessionId = this.requireSession();
        await this.browser.goForward(sessionId);
        return { success: true };
      }

      case 'page_reload': {
        const sessionId = this.requireSession();
        await this.browser.reload(sessionId, args.ignoreCache as boolean);
        return { success: true };
      }

      // 页面内容获取
      case 'page_get_html': {
        const sessionId = this.requireSession();
        const html = await this.browser.getHTML(sessionId, args.selector as string | undefined);
        return { html };
      }

      case 'page_get_text': {
        const sessionId = this.requireSession();
        const text = await this.browser.getText(sessionId);
        return { text };
      }

      case 'page_get_snapshot': {
        const sessionId = this.requireSession();
        return this.browser.getPageSnapshot(sessionId, args.includeScreenshot as boolean);
      }

      case 'page_query_selector': {
        const sessionId = this.requireSession();
        return this.browser.querySelector(sessionId, args.selector as string);
      }

      case 'page_query_selector_all': {
        const sessionId = this.requireSession();
        return this.browser.querySelectorAll(sessionId, args.selector as string);
      }

      // 截图和视口
      case 'page_screenshot': {
        const sessionId = this.requireSession();
        const data = await this.browser.takeScreenshot(
          sessionId,
          (args.format as 'png' | 'jpeg') || 'png',
          args.quality as number | undefined
        );
        return { screenshot: data, format: args.format || 'png' };
      }

      case 'page_set_viewport': {
        const sessionId = this.requireSession();
        await this.browser.setViewport(
          sessionId,
          args.width as number,
          args.height as number,
          args.deviceScaleFactor as number | undefined
        );
        return { success: true };
      }

      // JavaScript 执行
      case 'js_execute': {
        const sessionId = this.requireSession();
        return this.jsTester.executeScript(sessionId, args.code as string, {
          timeout: args.timeout as number | undefined,
        });
      }

      case 'js_run_tests': {
        const sessionId = this.requireSession();
        return this.jsTester.runTestSuite(sessionId, args.testCode as string);
      }

      case 'js_inject_script': {
        const sessionId = this.requireSession();
        const success = await this.jsTester.injectScript(sessionId, args.url as string);
        return { success };
      }

      case 'js_inject_styles': {
        const sessionId = this.requireSession();
        const success = await this.jsTester.injectStyles(sessionId, args.css as string);
        return { success };
      }

      case 'js_get_globals': {
        const sessionId = this.requireSession();
        return this.jsTester.getGlobalVariables(sessionId);
      }

      // 监控
      case 'monitor_console': {
        const sessionId = this.requireSession();
        return this.browser.getConsoleMessages(sessionId);
      }

      case 'monitor_network': {
        const sessionId = this.requireSession();
        return this.browser.getNetworkRequests(sessionId);
      }

      // 扩展程序管理
      case 'extension_list': {
        const sessionId = this.requireSession();
        return this.extensionManager.listExtensions(sessionId);
      }

      case 'extension_get_info': {
        const sessionId = this.requireSession();
        return this.extensionManager.getExtensionInfo(sessionId, args.extensionId as string);
      }

      case 'extension_enable': {
        const sessionId = this.requireSession();
        const success = await this.extensionManager.enableExtension(sessionId, args.extensionId as string);
        return { success };
      }

      case 'extension_disable': {
        const sessionId = this.requireSession();
        const success = await this.extensionManager.disableExtension(sessionId, args.extensionId as string);
        return { success };
      }

      case 'extension_reload': {
        const sessionId = this.requireSession();
        const success = await this.extensionManager.reloadExtension(sessionId, args.extensionId as string);
        return { success };
      }

      case 'extension_execute': {
        const sessionId = this.requireSession();
        const result = await this.extensionManager.executeInExtensionContext(
          sessionId,
          args.extensionId as string,
          args.code as string
        );
        return { result };
      }

      case 'extension_get_storage': {
        const sessionId = this.requireSession();
        return this.extensionManager.getExtensionStorage(
          sessionId,
          args.extensionId as string,
          args.keys as string[] | undefined
        );
      }

      case 'extension_set_storage': {
        const sessionId = this.requireSession();
        const success = await this.extensionManager.setExtensionStorage(
          sessionId,
          args.extensionId as string,
          args.data as Record<string, unknown>
        );
        return { success };
      }

      // 会话管理
      case 'session_set': {
        const sessionId = args.sessionId as string;
        if (!this.sessions.has(sessionId)) {
          throw new Error(`Session not found: ${sessionId}`);
        }
        this.currentSession = sessionId;
        return { success: true, currentSession: sessionId };
      }

      case 'session_list':
        return Array.from(this.sessions.entries()).map(([id, info]) => ({
          ...info,
          sessionId: id,
          active: id === this.currentSession,
        }));

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Chrome Browser MCP server running on stdio');
  }
}

async function main(): Promise<void> {
  const server = new ChromeBrowserMCPServer();
  await server.run();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

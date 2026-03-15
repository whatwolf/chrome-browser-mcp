import { CDPManager, TargetInfo } from './cdp-manager.js';

export interface PageSnapshot {
  url: string;
  title: string;
  html: string;
  text: string;
  structure: DOMNode;
  screenshot?: string;
}

export interface DOMNode {
  tagName: string;
  id?: string;
  className?: string;
  attributes: Record<string, string>;
  children: DOMNode[];
  text?: string;
  xpath: string;
}

export interface ConsoleMessage {
  type: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  timestamp: number;
  url?: string;
  line?: number;
  column?: number;
  stackTrace?: string;
}

export interface NetworkRequest {
  requestId: string;
  url: string;
  method: string;
  status: number;
  type: string;
  timestamp: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  timing?: {
    dns: number;
    connect: number;
    ssl: number;
    send: number;
    wait: number;
    receive: number;
  };
}

export interface PageChange {
  type: 'dom' | 'console' | 'network' | 'error';
  timestamp: number;
  data: unknown;
}

export class BrowserController {
  private cdp: CDPManager;
  private activeSessions = new Map<string, {
    targetId: string;
    url: string;
    consoleMessages: ConsoleMessage[];
    networkRequests: NetworkRequest[];
    changeListeners: ((change: PageChange) => void)[];
  }>();
  private changeCallbacks = new Map<string, (change: PageChange) => void>();

  constructor(cdp: CDPManager) {
    this.cdp = cdp;
  }

  async initialize(): Promise<void> {
    await this.cdp.sendCommand('Target.setDiscoverTargets', { discover: true });

    this.cdp.on('Target.targetCreated', async (params) => {
      const p = params as { targetInfo: TargetInfo };
      console.error('Target created:', p.targetInfo.type, p.targetInfo.url);
    });

    this.cdp.on('Target.targetDestroyed', (params) => {
      const p = params as { targetId: string };
      console.error('Target destroyed:', p.targetId);
    });
  }

  async listPages(): Promise<TargetInfo[]> {
    const targets = await this.cdp.getTargets();
    return targets.filter(t => t.type === 'page');
  }

  async openPage(url: string): Promise<{ targetId: string; sessionId: string }> {
    const target = await this.cdp.createTarget(url);
    const sessionId = await this.cdp.attachToTarget(target.targetId);

    await this.setupPageSession(sessionId, target.targetId, url);

    return { targetId: target.targetId, sessionId };
  }

  async attachToPage(targetId: string): Promise<string> {
    const sessionId = await this.cdp.attachToTarget(targetId);
    const targets = await this.cdp.getTargets();
    const target = targets.find(t => t.targetId === targetId);

    if (target) {
      await this.setupPageSession(sessionId, targetId, target.url);
    }

    return sessionId;
  }

  private async setupPageSession(sessionId: string, targetId: string, url: string): Promise<void> {
    this.activeSessions.set(sessionId, {
      targetId,
      url,
      consoleMessages: [],
      networkRequests: [],
      changeListeners: []
    });

    await this.cdp.sendCommand('Page.enable', {}, sessionId);
    await this.cdp.sendCommand('Runtime.enable', {}, sessionId);
    await this.cdp.sendCommand('Network.enable', {}, sessionId);
    await this.cdp.sendCommand('DOM.enable', {}, sessionId);

    this.setupConsoleHandler(sessionId);
    this.setupNetworkHandler(sessionId);
    this.setupDOMHandler(sessionId);
  }

  private setupConsoleHandler(sessionId: string): void {
    this.cdp.on('Runtime.consoleAPICalled', (params) => {
      const p = params as {
        type: string;
        args: Array<{ value?: string; description?: string }>;
        timestamp: number;
        executionContextId: number;
      };

      const session = this.activeSessions.get(sessionId);
      if (!session) return;

      const message: ConsoleMessage = {
        type: p.type as ConsoleMessage['type'],
        message: p.args.map(a => a.value ?? a.description ?? '').join(' '),
        timestamp: p.timestamp
      };

      session.consoleMessages.push(message);
      this.notifyChange(sessionId, { type: 'console', timestamp: Date.now(), data: message });
    });
  }

  private setupNetworkHandler(sessionId: string): void {
    const requestMap = new Map<string, Partial<NetworkRequest>>();

    this.cdp.on('Network.requestWillBeSent', (params) => {
      const p = params as {
        requestId: string;
        request: { url: string; method: string; headers: Record<string, string> };
        timestamp: number;
        type: string;
      };

      requestMap.set(p.requestId, {
        requestId: p.requestId,
        url: p.request.url,
        method: p.request.method,
        requestHeaders: p.request.headers,
        type: p.type,
        timestamp: p.timestamp * 1000
      });
    });

    this.cdp.on('Network.responseReceived', async (params) => {
      const p = params as {
        requestId: string;
        response: {
          status: number;
          headers: Record<string, string>;
          timing?: NetworkRequest['timing'];
        };
      };

      const request = requestMap.get(p.requestId);
      if (request) {
        request.status = p.response.status;
        request.responseHeaders = p.response.headers;
        request.timing = p.response.timing;
      }
    });

    this.cdp.on('Network.loadingFinished', async (params) => {
      const p = params as { requestId: string };
      const request = requestMap.get(p.requestId);

      if (request && request.status !== 204) {
        try {
          const body = await this.cdp.sendCommand<{ body: string; base64Encoded: boolean }>(
            'Network.getResponseBody',
            { requestId: p.requestId },
            sessionId
          );
          request.responseBody = body.body;
        } catch {
          // Some requests don't have response body
        }

        const session = this.activeSessions.get(sessionId);
        if (session && request.url) {
          session.networkRequests.push(request as NetworkRequest);
          this.notifyChange(sessionId, { type: 'network', timestamp: Date.now(), data: request });
        }

        requestMap.delete(p.requestId);
      }
    });
  }

  private setupDOMHandler(sessionId: string): void {
    this.cdp.on('DOM.documentUpdated', async () => {
      this.notifyChange(sessionId, { type: 'dom', timestamp: Date.now(), data: { event: 'documentUpdated' } });
    });
  }

  private notifyChange(sessionId: string, change: PageChange): void {
    const callback = this.changeCallbacks.get(sessionId);
    if (callback) {
      callback(change);
    }
  }

  onChange(sessionId: string, callback: (change: PageChange) => void): void {
    this.changeCallbacks.set(sessionId, callback);
  }

  removeChangeListener(sessionId: string): void {
    this.changeCallbacks.delete(sessionId);
  }

  async navigate(sessionId: string, url: string): Promise<void> {
    await this.cdp.sendCommand('Page.navigate', { url }, sessionId);
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.url = url;
    }
  }

  async goBack(sessionId: string): Promise<void> {
    await this.cdp.sendCommand('Page.goBack', {}, sessionId);
  }

  async goForward(sessionId: string): Promise<void> {
    await this.cdp.sendCommand('Page.goForward', {}, sessionId);
  }

  async reload(sessionId: string, ignoreCache = false): Promise<void> {
    await this.cdp.sendCommand('Page.reload', { ignoreCache }, sessionId);
  }

  async stopLoading(sessionId: string): Promise<void> {
    await this.cdp.sendCommand('Page.stopLoading', {}, sessionId);
  }

  async getPageSnapshot(sessionId: string, includeScreenshot = false): Promise<PageSnapshot> {
    const [urlResult, titleResult, htmlResult] = await Promise.all([
      this.cdp.sendCommand<{ result: { value: string } }>(
        'Runtime.evaluate',
        { expression: 'window.location.href', returnByValue: true },
        sessionId
      ),
      this.cdp.sendCommand<{ result: { value: string } }>(
        'Runtime.evaluate',
        { expression: 'document.title', returnByValue: true },
        sessionId
      ),
      this.cdp.sendCommand<{ outerHTML: string }>(
        'DOM.getDocument',
        { depth: -1 },
        sessionId
      ).then(async (doc) => {
        const docResult = doc as unknown as { root: { nodeId: number } };
        const nodeId = docResult.root.nodeId;
        return this.cdp.sendCommand<{ outerHTML: string }>(
          'DOM.getOuterHTML',
          { nodeId },
          sessionId
        );
      })
    ]);

    const textResult = await this.cdp.sendCommand<{ result: { value: string } }>(
      'Runtime.evaluate',
      { expression: 'document.body?.innerText || ""', returnByValue: true },
      sessionId
    );

    let screenshot: string | undefined;
    if (includeScreenshot) {
      const screenshotResult = await this.cdp.sendCommand<{ data: string }>(
        'Page.captureScreenshot',
        { format: 'png' },
        sessionId
      );
      screenshot = screenshotResult.data;
    }

    const structure = await this.getPageStructure(sessionId);

    return {
      url: urlResult.result.value,
      title: titleResult.result.value,
      html: htmlResult.outerHTML,
      text: textResult.result.value,
      structure,
      screenshot
    };
  }

  async getPageStructure(sessionId: string): Promise<DOMNode> {
    const doc = await this.cdp.sendCommand<{ root: { nodeId: number } }>(
      'DOM.getDocument',
      { depth: 10 },
      sessionId
    );

    return this.buildDOMNode(doc.root.nodeId, sessionId, '/html');
  }

  private async buildDOMNode(nodeId: number, sessionId: string, xpath: string): Promise<DOMNode> {
    const node = await this.cdp.sendCommand<{
      nodeName: string;
      nodeId: number;
      attributes?: string[];
      children?: Array<{ nodeId: number; nodeName: string }>;
      nodeValue?: string;
    }>('DOM.describeNode', { nodeId }, sessionId);

    const attributes: Record<string, string> = {};
    if (node.attributes) {
      for (let i = 0; i < node.attributes.length; i += 2) {
        attributes[node.attributes[i]] = node.attributes[i + 1];
      }
    }

    const children: DOMNode[] = [];
    if (node.children && node.children.length > 0) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const childXPath = `${xpath}/${child.nodeName.toLowerCase()}[${i + 1}]`;
        children.push(await this.buildDOMNode(child.nodeId, sessionId, childXPath));
      }
    }

    return {
      tagName: node.nodeName.toLowerCase(),
      id: attributes.id,
      className: attributes.class,
      attributes,
      children,
      text: node.nodeValue || undefined,
      xpath
    };
  }

  async getHTML(sessionId: string, selector?: string): Promise<string> {
    if (selector) {
      const doc = await this.cdp.sendCommand<{ root: { nodeId: number } }>(
        'DOM.getDocument',
        {},
        sessionId
      );
      const result = await this.cdp.sendCommand<{ nodeId: number }>(
        'DOM.querySelector',
        { nodeId: doc.root.nodeId, selector },
        sessionId
      );

      if (result.nodeId) {
        const html = await this.cdp.sendCommand<{ outerHTML: string }>(
          'DOM.getOuterHTML',
          { nodeId: result.nodeId },
          sessionId
        );
        return html.outerHTML;
      }
      return '';
    }

    const doc = await this.cdp.sendCommand<{ root: { nodeId: number } }>(
      'DOM.getDocument',
      {},
      sessionId
    );
    const html = await this.cdp.sendCommand<{ outerHTML: string }>(
      'DOM.getOuterHTML',
      { nodeId: doc.root.nodeId },
      sessionId
    );
    return html.outerHTML;
  }

  async getText(sessionId: string): Promise<string> {
    const result = await this.cdp.sendCommand<{ result: { value: string } }>(
      'Runtime.evaluate',
      { expression: 'document.body?.innerText || ""', returnByValue: true },
      sessionId
    );
    return result.result.value;
  }

  async querySelector(sessionId: string, selector: string): Promise<{ nodeId: number; html: string } | null> {
    const doc = await this.cdp.sendCommand<{ root: { nodeId: number } }>(
      'DOM.getDocument',
      {},
      sessionId
    );

    const result = await this.cdp.sendCommand<{ nodeId: number }>(
      'DOM.querySelector',
      { nodeId: doc.root.nodeId, selector },
      sessionId
    );

    if (result.nodeId) {
      const html = await this.cdp.sendCommand<{ outerHTML: string }>(
        'DOM.getOuterHTML',
        { nodeId: result.nodeId },
        sessionId
      );
      return { nodeId: result.nodeId, html: html.outerHTML };
    }

    return null;
  }

  async querySelectorAll(sessionId: string, selector: string): Promise<Array<{ nodeId: number; html: string }>> {
    const doc = await this.cdp.sendCommand<{ root: { nodeId: number } }>(
      'DOM.getDocument',
      {},
      sessionId
    );

    const result = await this.cdp.sendCommand<{ nodeIds: number[] }>(
      'DOM.querySelectorAll',
      { nodeId: doc.root.nodeId, selector },
      sessionId
    );

    const elements: Array<{ nodeId: number; html: string }> = [];
    for (const nodeId of result.nodeIds) {
      const html = await this.cdp.sendCommand<{ outerHTML: string }>(
        'DOM.getOuterHTML',
        { nodeId },
        sessionId
      );
      elements.push({ nodeId, html: html.outerHTML });
    }

    return elements;
  }

  async getConsoleMessages(sessionId: string): Promise<ConsoleMessage[]> {
    const session = this.activeSessions.get(sessionId);
    return session?.consoleMessages || [];
  }

  async getNetworkRequests(sessionId: string): Promise<NetworkRequest[]> {
    const session = this.activeSessions.get(sessionId);
    return session?.networkRequests || [];
  }

  async takeScreenshot(sessionId: string, format: 'png' | 'jpeg' = 'png', quality?: number): Promise<string> {
    const result = await this.cdp.sendCommand<{ data: string }>(
      'Page.captureScreenshot',
      { format, quality },
      sessionId
    );
    return result.data;
  }

  async setViewport(sessionId: string, width: number, height: number, deviceScaleFactor = 1): Promise<void> {
    await this.cdp.sendCommand(
      'Emulation.setDeviceMetricsOverride',
      { width, height, deviceScaleFactor, mobile: false },
      sessionId
    );
  }

  async setUserAgent(sessionId: string, userAgent: string): Promise<void> {
    await this.cdp.sendCommand('Network.setUserAgentOverride', { userAgent }, sessionId);
  }

  async closePage(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      await this.cdp.closeTarget(session.targetId);
      this.activeSessions.delete(sessionId);
      this.changeCallbacks.delete(sessionId);
    }
  }

  async detachFromPage(sessionId: string): Promise<void> {
    await this.cdp.detachFromTarget(sessionId);
    this.activeSessions.delete(sessionId);
    this.changeCallbacks.delete(sessionId);
  }
}

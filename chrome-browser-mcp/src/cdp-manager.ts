import WebSocket from 'ws';

export interface CDPConfig {
  host: string;
  port: number;
  secure?: boolean;
}

export interface TargetInfo {
  targetId: string;
  type: string;
  title: string;
  url: string;
  attached: boolean;
  browserContextId?: string;
}

export interface CDPSession {
  sessionId: string;
  targetId: string;
  targetType: string;
}

interface CDPMessage {
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  sessionId?: string;
  result?: unknown;
  error?: { code: number; message: string };
}

type EventHandler = (params: unknown) => void;

export class CDPManager {
  private ws: WebSocket | null = null;
  private config: CDPConfig;
  private commandId = 0;
  private pendingCommands = new Map<number, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }>();
  private sessions = new Map<string, CDPSession>();
  private eventHandlers = new Map<string, Set<EventHandler>>();
  private connected = false;

  constructor(config: CDPConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    const protocol = this.config.secure ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${this.config.host}:${this.config.port}/devtools/browser`;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl, { perMessageDeflate: false });

      this.ws.on('open', () => {
        this.connected = true;
        console.error('CDP WebSocket connected');
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(data.toString());
      });

      this.ws.on('error', (error: Error) => {
        console.error('CDP WebSocket error:', error);
        if (!this.connected) {
          reject(error);
        }
      });

      this.ws.on('close', () => {
        this.connected = false;
        console.error('CDP WebSocket closed');
      });
    });
  }

  async connectToExistingBrowser(): Promise<void> {
    try {
      const response = await fetch(`http://${this.config.host}:${this.config.port}/json/version`);
      const data = await response.json() as { webSocketDebuggerUrl?: string };

      if (!data.webSocketDebuggerUrl) {
        throw new Error('No WebSocket debugger URL found');
      }

      return new Promise((resolve, reject) => {
        this.ws = new WebSocket(data.webSocketDebuggerUrl!, { perMessageDeflate: false });

        this.ws.on('open', () => {
          this.connected = true;
          console.error('Connected to existing browser');
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          this.handleMessage(data.toString());
        });

        this.ws.on('error', (error: Error) => {
          console.error('CDP WebSocket error:', error);
          if (!this.connected) {
            reject(error);
          }
        });

        this.ws.on('close', () => {
          this.connected = false;
        });
      });
    } catch (error) {
      throw new Error(`Failed to connect to browser: ${error}`);
    }
  }

  private handleMessage(data: string): void {
    try {
      const message: CDPMessage = JSON.parse(data);

      if (message.id !== undefined) {
        const pending = this.pendingCommands.get(message.id);
        if (pending) {
          this.pendingCommands.delete(message.id);
          if (message.error) {
            pending.reject(new Error(message.error.message));
          } else {
            pending.resolve(message.result);
          }
        }
      } else if (message.method) {
        const handlers = this.eventHandlers.get(message.method);
        if (handlers) {
          handlers.forEach(handler => handler(message.params));
        }

        if (message.method === 'Target.detachedFromTarget' && message.params) {
          const params = message.params as { sessionId?: string };
          if (params.sessionId) {
            this.sessions.delete(params.sessionId);
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse CDP message:', error);
    }
  }

  async sendCommand<T = unknown>(
    method: string,
    params?: Record<string, unknown>,
    sessionId?: string
  ): Promise<T> {
    if (!this.ws || !this.connected) {
      throw new Error('Not connected to browser');
    }

    const id = ++this.commandId;
    const message: CDPMessage = { id, method, params };
    if (sessionId) {
      message.sessionId = sessionId;
    }

    return new Promise((resolve, reject) => {
      this.pendingCommands.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject
      });

      this.ws!.send(JSON.stringify(message));

      setTimeout(() => {
        if (this.pendingCommands.has(id)) {
          this.pendingCommands.delete(id);
          reject(new Error(`Command ${method} timed out`));
        }
      }, 30000);
    });
  }

  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  async getTargets(): Promise<TargetInfo[]> {
    const result = await this.sendCommand<{ targetInfos: TargetInfo[] }>('Target.getTargets');
    return result.targetInfos;
  }

  async attachToTarget(targetId: string): Promise<string> {
    const result = await this.sendCommand<{ sessionId: string }>(
      'Target.attachToTarget',
      { targetId, flatten: true }
    );

    this.sessions.set(result.sessionId, {
      sessionId: result.sessionId,
      targetId,
      targetType: 'page'
    });

    return result.sessionId;
  }

  async detachFromTarget(sessionId: string): Promise<void> {
    await this.sendCommand('Target.detachFromTarget', { sessionId });
    this.sessions.delete(sessionId);
  }

  getSession(sessionId: string): CDPSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): CDPSession[] {
    return Array.from(this.sessions.values());
  }

  async createTarget(url: string): Promise<TargetInfo> {
    const result = await this.sendCommand<{ targetId: string }>('Target.createTarget', { url });
    const targets = await this.getTargets();
    return targets.find(t => t.targetId === result.targetId)!;
  }

  async closeTarget(targetId: string): Promise<void> {
    await this.sendCommand('Target.closeTarget', { targetId });
  }

  isConnected(): boolean {
    return this.connected;
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      for (const sessionId of this.sessions.keys()) {
        try {
          await this.detachFromTarget(sessionId);
        } catch (error) {
          console.error('Error detaching session:', error);
        }
      }

      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }
}

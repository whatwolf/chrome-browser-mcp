import { CDPManager } from './cdp-manager.js';

export interface TestResult {
  success: boolean;
  value?: unknown;
  error?: {
    message: string;
    stack?: string;
    line?: number;
    column?: number;
  };
  console: Array<{
    type: string;
    message: string;
  }>;
  duration: number;
}

export interface ScriptExecutionOptions {
  timeout?: number;
  returnByValue?: boolean;
  awaitPromise?: boolean;
  contextId?: number;
}

export interface ExtensionInfo {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  type: 'extension' | 'theme' | 'app';
  installTime: string;
  description?: string;
  permissions?: string[];
}

export class JSTester {
  private cdp: CDPManager;
  private consoleMessages: Array<{ type: string; message: string }> = [];
  private currentSessionId: string | null = null;

  constructor(cdp: CDPManager) {
    this.cdp = cdp;
    
    this.cdp.on('Runtime.consoleAPICalled', (params) => {
      if (!this.currentSessionId) return;
      
      const p = params as {
        type: string;
        args: Array<{ value?: string; description?: string }>;
      };
      
      this.consoleMessages.push({
        type: p.type,
        message: p.args.map(a => a.value ?? a.description ?? '').join(' ')
      });
    });
  }

  private setSession(sessionId: string): void {
    this.currentSessionId = sessionId;
    this.consoleMessages = [];
  }

  async executeScript(
    sessionId: string,
    code: string,
    options: ScriptExecutionOptions = {}
  ): Promise<TestResult> {
    this.setSession(sessionId);
    const startTime = Date.now();
    
    const timeout = options.timeout || 30000;
    const returnByValue = options.returnByValue !== false;
    const awaitPromise = options.awaitPromise !== false;
    
    try {
      const result = await Promise.race([
        this.cdp.sendCommand<{
          result: { type: string; value?: unknown; description?: string; objectId?: string };
          exceptionDetails?: {
            text: string;
            stackTrace?: { callFrames: Array<{ functionName: string; lineNumber: number; columnNumber: number }> };
            lineNumber?: number;
            columnNumber?: number;
          };
        }>(
          'Runtime.evaluate',
          {
            expression: code,
            returnByValue,
            awaitPromise,
            contextId: options.contextId,
            timeout
          },
          sessionId
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Script execution timed out')), timeout)
        )
      ]);
      
      const duration = Date.now() - startTime;
      
      if (result.exceptionDetails) {
        return {
          success: false,
          error: {
            message: result.exceptionDetails.text,
            stack: result.exceptionDetails.stackTrace?.callFrames
              .map(f => `    at ${f.functionName || '<anonymous>'}:${f.lineNumber}:${f.columnNumber}`)
              .join('\n'),
            line: result.exceptionDetails.lineNumber,
            column: result.exceptionDetails.columnNumber
          },
          console: [...this.consoleMessages],
          duration
        };
      }
      
      return {
        success: true,
        value: result.result.value ?? result.result.description,
        console: [...this.consoleMessages],
        duration
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error)
        },
        console: [...this.consoleMessages],
        duration: Date.now() - startTime
      };
    }
  }

  async executeAsyncScript(
    sessionId: string,
    code: string,
    options: ScriptExecutionOptions = {}
  ): Promise<TestResult> {
    const wrappedCode = `
      (function() {
        return new Promise((resolve, reject) => {
          const callback = (result) => resolve(result);
          const errorCallback = (error) => reject(error);
          try {
            ${code}
          } catch (e) {
            errorCallback(e);
          }
        });
      })()
    `;
    
    return this.executeScript(sessionId, wrappedCode, { ...options, awaitPromise: true });
  }

  async evaluateInContext(
    sessionId: string,
    code: string,
    contextName: string,
    options: ScriptExecutionOptions = {}
  ): Promise<TestResult> {
    const contexts = await this.cdp.sendCommand<{ contexts: Array<{ id: number; name: string }> }>(
      'Runtime.getAllExecutionContexts',
      {},
      sessionId
    );
    
    const context = contexts.contexts.find(c => c.name.includes(contextName));
    if (!context) {
      return {
        success: false,
        error: { message: `Context "${contextName}" not found` },
        console: [],
        duration: 0
      };
    }
    
    return this.executeScript(sessionId, code, { ...options, contextId: context.id });
  }

  async runTestSuite(
    sessionId: string,
    testCode: string
  ): Promise<{
    passed: number;
    failed: number;
    tests: Array<{ name: string; passed: boolean; error?: string; duration: number }>;
    totalDuration: number;
  }> {
    const testFramework = `
      const __tests__ = [];
      const __results__ = [];
      
      function describe(name, fn) {
        __tests__.push({ name, fn });
      }
      
      function it(name, fn) {
        __tests__.push({ name, fn });
      }
      
      function expect(actual) {
        return {
          toBe(expected) {
            if (actual !== expected) {
              throw new Error('Expected ' + JSON.stringify(actual) + ' to be ' + JSON.stringify(expected));
            }
          },
          toEqual(expected) {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
              throw new Error('Expected ' + JSON.stringify(actual) + ' to equal ' + JSON.stringify(expected));
            }
          },
          toBeTruthy() {
            if (!actual) {
              throw new Error('Expected ' + JSON.stringify(actual) + ' to be truthy');
            }
          },
          toBeFalsy() {
            if (actual) {
              throw new Error('Expected ' + JSON.stringify(actual) + ' to be falsy');
            }
          },
          toContain(expected) {
            if (!actual.includes(expected)) {
              throw new Error('Expected ' + JSON.stringify(actual) + ' to contain ' + JSON.stringify(expected));
            }
          },
          toBeGreaterThan(expected) {
            if (actual <= expected) {
              throw new Error('Expected ' + actual + ' to be greater than ' + expected);
            }
          },
          toBeLessThan(expected) {
            if (actual >= expected) {
              throw new Error('Expected ' + actual + ' to be less than ' + expected);
            }
          },
          toThrow() {
            let threw = false;
            try {
              actual();
            } catch (e) {
              threw = true;
            }
            if (!threw) {
              throw new Error('Expected function to throw');
            }
          }
        };
      }
      
      async function __runTests__() {
        const results = [];
        for (const test of __tests__) {
          const startTime = Date.now();
          try {
            await test.fn();
            results.push({
              name: test.name,
              passed: true,
              duration: Date.now() - startTime
            });
          } catch (e) {
            results.push({
              name: test.name,
              passed: false,
              error: e.message,
              duration: Date.now() - startTime
            });
          }
        }
        return results;
      }
      
      ${testCode}
      
      __runTests__();
    `;
    
    const result = await this.executeScript(sessionId, testFramework, { timeout: 60000 });
    
    if (!result.success) {
      return {
        passed: 0,
        failed: 1,
        tests: [{ name: 'Test Suite', passed: false, error: result.error?.message, duration: result.duration }],
        totalDuration: result.duration
      };
    }
    
    const tests = result.value as Array<{ name: string; passed: boolean; error?: string; duration: number }>;
    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;
    
    return {
      passed,
      failed,
      tests,
      totalDuration: result.duration
    };
  }

  async injectScript(sessionId: string, scriptUrl: string): Promise<boolean> {
    const code = `
      new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '${scriptUrl}';
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error('Failed to load script: ${scriptUrl}'));
        document.head.appendChild(script);
      })
    `;
    
    const result = await this.executeScript(sessionId, code);
    return result.success;
  }

  async injectStyles(sessionId: string, css: string): Promise<boolean> {
    const code = `
      (() => {
        const style = document.createElement('style');
        style.textContent = ${JSON.stringify(css)};
        document.head.appendChild(style);
        return true;
      })()
    `;
    
    const result = await this.executeScript(sessionId, code);
    return result.success;
  }

  async getGlobalVariables(sessionId: string): Promise<Record<string, string>> {
    const code = `
      (() => {
        const globals = {};
        for (const key of Object.keys(window)) {
          const value = window[key];
          if (typeof value !== 'function') {
            globals[key] = typeof value;
          }
        }
        return globals;
      })()
    `;
    
    const result = await this.executeScript(sessionId, code);
    return result.success ? (result.value as Record<string, string>) : {};
  }

  async callFunction(
    sessionId: string,
    functionName: string,
    args: unknown[] = []
  ): Promise<TestResult> {
    const code = `
      (function() {
        const fn = ${functionName};
        if (typeof fn !== 'function') {
          throw new Error('${functionName} is not a function');
        }
        return fn(${args.map(a => JSON.stringify(a)).join(', ')});
      })()
    `;
    
    return this.executeScript(sessionId, code);
  }
}

export class ExtensionManager {
  private cdp: CDPManager;

  constructor(cdp: CDPManager) {
    this.cdp = cdp;
  }

  async listExtensions(sessionId: string): Promise<ExtensionInfo[]> {
    const code = `
      (async () => {
        if (typeof chrome === 'undefined' || !chrome.management) {
          return { error: 'Extension API not available' };
        }
        
        return new Promise((resolve) => {
          chrome.management.getAll((extensions) => {
            resolve(extensions.map(ext => ({
              id: ext.id,
              name: ext.name,
              version: ext.version,
              enabled: ext.enabled,
              type: ext.type,
              installTime: ext.installTime,
              description: ext.description,
              permissions: ext.permissions
            })));
          });
        });
      })()
    `;
    
    const result = await this.cdp.sendCommand<{
      result: { value: { error?: string } | ExtensionInfo[] }
    }>(
      'Runtime.evaluate',
      { expression: code, returnByValue: true },
      sessionId
    );
    
    if (result.result.value && 'error' in result.result.value) {
      return [];
    }
    
    return result.result.value as ExtensionInfo[];
  }

  async getExtensionInfo(sessionId: string, extensionId: string): Promise<ExtensionInfo | null> {
    const code = `
      (async () => {
        if (typeof chrome === 'undefined' || !chrome.management) {
          return null;
        }
        
        return new Promise((resolve) => {
          chrome.management.get('${extensionId}', (ext) => {
            if (chrome.runtime.lastError) {
              resolve(null);
            } else {
              resolve({
                id: ext.id,
                name: ext.name,
                version: ext.version,
                enabled: ext.enabled,
                type: ext.type,
                installTime: ext.installTime,
                description: ext.description,
                permissions: ext.permissions
              });
            }
          });
        });
      })()
    `;
    
    const result = await this.cdp.sendCommand<{
      result: { value: ExtensionInfo | null }
    }>(
      'Runtime.evaluate',
      { expression: code, returnByValue: true },
      sessionId
    );
    
    return result.result.value;
  }

  async enableExtension(sessionId: string, extensionId: string): Promise<boolean> {
    const code = `
      (async () => {
        if (typeof chrome === 'undefined' || !chrome.management) {
          return false;
        }
        
        return new Promise((resolve) => {
          chrome.management.setEnabled('${extensionId}', true, () => {
            resolve(!chrome.runtime.lastError);
          });
        });
      })()
    `;
    
    const result = await this.cdp.sendCommand<{
      result: { value: boolean }
    }>(
      'Runtime.evaluate',
      { expression: code, returnByValue: true },
      sessionId
    );
    
    return result.result.value;
  }

  async disableExtension(sessionId: string, extensionId: string): Promise<boolean> {
    const code = `
      (async () => {
        if (typeof chrome === 'undefined' || !chrome.management) {
          return false;
        }
        
        return new Promise((resolve) => {
          chrome.management.setEnabled('${extensionId}', false, () => {
            resolve(!chrome.runtime.lastError);
          });
        });
      })()
    `;
    
    const result = await this.cdp.sendCommand<{
      result: { value: boolean }
    }>(
      'Runtime.evaluate',
      { expression: code, returnByValue: true },
      sessionId
    );
    
    return result.result.value;
  }

  async executeInExtensionContext(
    sessionId: string,
    extensionId: string,
    code: string
  ): Promise<unknown> {
    const targets = await this.cdp.getTargets();
    const extensionTarget = targets.find(
      t => t.type === 'background_page' && t.url.includes(extensionId)
    );
    
    if (!extensionTarget) {
      throw new Error(`Extension ${extensionId} background page not found`);
    }
    
    let extSessionId = this.cdp.getSession(
      Array.from(this.cdp.getAllSessions()).find(
        s => s.targetId === extensionTarget.targetId
      )?.sessionId || ''
    )?.sessionId;
    
    if (!extSessionId) {
      extSessionId = await this.cdp.attachToTarget(extensionTarget.targetId);
    }
    
    const result = await this.cdp.sendCommand<{
      result: { value?: unknown; description?: string };
      exceptionDetails?: { text: string };
    }>(
      'Runtime.evaluate',
      { expression: code, returnByValue: true },
      extSessionId
    );
    
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text);
    }
    
    return result.result.value ?? result.result.description;
  }

  async getExtensionStorage(
    sessionId: string,
    extensionId: string,
    keys?: string[]
  ): Promise<Record<string, unknown>> {
    const code = `
      (async () => {
        if (typeof chrome === 'undefined' || !chrome.storage) {
          return {};
        }
        
        return new Promise((resolve) => {
          chrome.storage.local.get(${keys ? JSON.stringify(keys) : 'null'}, (data) => {
            resolve(data || {});
          });
        });
      })()
    `;
    
    return this.executeInExtensionContext(sessionId, extensionId, code) as Promise<Record<string, unknown>>;
  }

  async setExtensionStorage(
    sessionId: string,
    extensionId: string,
    data: Record<string, unknown>
  ): Promise<boolean> {
    const code = `
      (async () => {
        if (typeof chrome === 'undefined' || !chrome.storage) {
          return false;
        }
        
        return new Promise((resolve) => {
          chrome.storage.local.set(${JSON.stringify(data)}, () => {
            resolve(!chrome.runtime.lastError);
          });
        });
      })()
    `;
    
    return this.executeInExtensionContext(sessionId, extensionId, code) as Promise<boolean>;
  }

  async reloadExtension(sessionId: string, extensionId: string): Promise<boolean> {
    const code = `
      (async () => {
        if (typeof chrome === 'undefined' || !chrome.management) {
          return false;
        }
        
        return new Promise((resolve) => {
          chrome.management.setEnabled('${extensionId}', false, () => {
            chrome.management.setEnabled('${extensionId}', true, () => {
              resolve(!chrome.runtime.lastError);
            });
          });
        });
      })()
    `;
    
    const result = await this.cdp.sendCommand<{
      result: { value: boolean }
    }>(
      'Runtime.evaluate',
      { expression: code, returnByValue: true },
      sessionId
    );
    
    return result.result.value;
  }
}

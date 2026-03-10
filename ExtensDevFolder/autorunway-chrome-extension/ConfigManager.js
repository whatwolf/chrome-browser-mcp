class ConfigManager {
  constructor() {
    this.storageKey = 'autorunway_config';
    this.config = null;
    this.defaultConfig = {
      prompt: {
        text: 'dramatic and cinematic motion',
        templates: [
          { name: '默认', text: 'dramatic and cinematic motion' },
          { name: '电影感', text: 'cinematic, dramatic lighting, film grain' },
          { name: '动态', text: 'dynamic motion, smooth camera movement' },
          { name: '艺术', text: 'artistic, creative, abstract motion' },
          { name: '自然', text: 'natural movement, organic flow' }
        ]
      },
      retry: {
        maxRetries: 3,
        retryDelay: 5000,
        exponentialBackoff: true
      },
      timing: {
        waitAfterUpload: 3,
        waitAfterGenerate: 3,
        waitAfterRemove: 3,
        waitAfter4K: 3,
        generateTimeout: 300,
        downloadTimeout: 60
      },
      download: {
        savePath: '',
        filenamePrefix: 'runway_',
        includeTimestamp: true,
        includeRandom: true
      },
      automation: {
        autoStart: false,
        stopOnError: true,
        maxConsecutiveErrors: 5,
        pauseBetweenTasks: 2
      },
      ui: {
        showNotifications: true,
        logLevel: 'info',
        compactMode: false
      }
    };
  }

  async init() {
    await this.load();
    return this.config;
  }

  async load() {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      
      if (result[this.storageKey]) {
        this.config = this.mergeWithDefaults(result[this.storageKey]);
        console.log('[ConfigManager] 配置已加载');
      } else {
        this.config = { ...this.defaultConfig };
        await this.save();
        console.log('[ConfigManager] 使用默认配置');
      }
      
      return this.config;
    } catch (error) {
      console.error('[ConfigManager] 加载配置失败:', error);
      this.config = { ...this.defaultConfig };
      return this.config;
    }
  }

  mergeWithDefaults(savedConfig) {
    const merged = { ...this.defaultConfig };
    
    for (const key of Object.keys(savedConfig)) {
      if (typeof savedConfig[key] === 'object' && !Array.isArray(savedConfig[key])) {
        merged[key] = { ...this.defaultConfig[key], ...savedConfig[key] };
      } else {
        merged[key] = savedConfig[key];
      }
    }
    
    return merged;
  }

  async save() {
    try {
      await chrome.storage.local.set({ [this.storageKey]: this.config });
      console.log('[ConfigManager] 配置已保存');
      return true;
    } catch (error) {
      console.error('[ConfigManager] 保存配置失败:', error);
      return false;
    }
  }

  async reset() {
    this.config = { ...this.defaultConfig };
    await this.save();
    console.log('[ConfigManager] 配置已重置为默认值');
    return this.config;
  }

  get(key) {
    if (!this.config) {
      console.warn('[ConfigManager] 配置未初始化');
      return this.defaultConfig[key];
    }
    
    return this.config[key];
  }

  async set(key, value) {
    if (!this.config) {
      await this.init();
    }
    
    if (key.includes('.')) {
      const keys = key.split('.');
      let obj = this.config;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) {
          obj[keys[i]] = {};
        }
        obj = obj[keys[i]];
      }
      
      obj[keys[keys.length - 1]] = value;
    } else {
      this.config[key] = value;
    }
    
    await this.save();
    return true;
  }

  getPrompt() {
    return this.get('prompt')?.text || this.defaultConfig.prompt.text;
  }

  async setPrompt(text) {
    return await this.set('prompt.text', text);
  }

  getPromptTemplates() {
    return this.get('prompt')?.templates || this.defaultConfig.prompt.templates;
  }

  async addPromptTemplate(name, text) {
    const templates = this.getPromptTemplates();
    templates.push({ name, text });
    return await this.set('prompt.templates', templates);
  }

  async removePromptTemplate(index) {
    const templates = this.getPromptTemplates();
    if (index >= 0 && index < templates.length) {
      templates.splice(index, 1);
      return await this.set('prompt.templates', templates);
    }
    return false;
  }

  getRetryConfig() {
    return this.get('retry') || this.defaultConfig.retry;
  }

  getTimingConfig() {
    return this.get('timing') || this.defaultConfig.timing;
  }

  getDownloadConfig() {
    return this.get('download') || this.defaultConfig.download;
  }

  getAutomationConfig() {
    return this.get('automation') || this.defaultConfig.automation;
  }

  getUIConfig() {
    return this.get('ui') || this.defaultConfig.ui;
  }

  async exportConfig() {
    return JSON.stringify(this.config, null, 2);
  }

  async importConfig(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      this.config = this.mergeWithDefaults(imported);
      await this.save();
      return true;
    } catch (error) {
      console.error('[ConfigManager] 导入配置失败:', error);
      return false;
    }
  }

  validate() {
    const errors = [];
    
    if (this.config.timing.waitAfterUpload < 0) {
      errors.push('上传后等待时间不能为负数');
    }
    
    if (this.config.timing.generateTimeout < 10) {
      errors.push('生成超时时间不能小于 10 秒');
    }
    
    if (this.config.retry.maxRetries < 0 || this.config.retry.maxRetries > 10) {
      errors.push('重试次数应在 0-10 之间');
    }
    
    if (this.config.automation.maxConsecutiveErrors < 1) {
      errors.push('最大连续错误数至少为 1');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

window.configManager = new ConfigManager();

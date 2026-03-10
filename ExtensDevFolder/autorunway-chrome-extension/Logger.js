class Logger {
  constructor(maxLogs = 1000) {
    this.maxLogs = maxLogs;
    this.logs = [];
    this.dbName = 'AutorunwayLogsDB';
    this.dbVersion = 1;
    this.storeName = 'logs';
    this.db = null;
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('[Logger] 打开数据库失败:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[Logger] 日志数据库初始化成功');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('level', 'level', { unique: false });
          store.createIndex('category', 'category', { unique: false });
        }
      };
    });
  }

  async loadLogs() {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        this.logs = request.result || [];
        resolve(this.logs);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async log(level, category, message, data = null) {
    const logEntry = {
      timestamp: Date.now(),
      datetime: new Date().toISOString(),
      level,
      category,
      message,
      data
    };

    this.logs.push(logEntry);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    await this.saveLog(logEntry);

    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    const prefix = `[${logEntry.datetime}] [${level.toUpperCase()}] [${category}]`;
    
    if (data) {
      console[consoleMethod](prefix, message, data);
    } else {
      console[consoleMethod](prefix, message);
    }

    return logEntry;
  }

  async saveLog(logEntry) {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(logEntry);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async info(category, message, data = null) {
    return await this.log('info', category, message, data);
  }

  async warn(category, message, data = null) {
    return await this.log('warn', category, message, data);
  }

  async error(category, message, data = null) {
    return await this.log('error', category, message, data);
  }

  async debug(category, message, data = null) {
    return await this.log('debug', category, message, data);
  }

  async getLogs(options = {}) {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      let request;
      if (options.level) {
        const index = store.index('level');
        request = index.getAll(options.level);
      } else if (options.category) {
        const index = store.index('category');
        request = index.getAll(options.category);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        let logs = request.result || [];
        
        if (options.startTime) {
          logs = logs.filter(log => log.timestamp >= options.startTime);
        }
        
        if (options.endTime) {
          logs = logs.filter(log => log.timestamp <= options.endTime);
        }
        
        if (options.limit) {
          logs = logs.slice(-options.limit);
        }
        
        resolve(logs);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getLogsByDate(date) {
    const startTime = new Date(date).setHours(0, 0, 0, 0);
    const endTime = new Date(date).setHours(23, 59, 59, 999);
    
    return await this.getLogs({ startTime, endTime });
  }

  async getRecentLogs(count = 50) {
    return await this.getLogs({ limit: count });
  }

  async clearLogs() {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        this.logs = [];
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async exportLogs(format = 'json') {
    const logs = await this.getLogs();
    
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else if (format === 'csv') {
      const headers = ['timestamp', 'datetime', 'level', 'category', 'message'];
      const rows = logs.map(log => [
        log.timestamp,
        log.datetime,
        log.level,
        log.category,
        `"${log.message.replace(/"/g, '""')}"`
      ]);
      
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
    
    return logs;
  }

  async getStats() {
    const logs = await this.getLogs();
    
    return {
      total: logs.length,
      byLevel: {
        info: logs.filter(l => l.level === 'info').length,
        warn: logs.filter(l => l.level === 'warn').length,
        error: logs.filter(l => l.level === 'error').length,
        debug: logs.filter(l => l.level === 'debug').length
      },
      byCategory: logs.reduce((acc, log) => {
        acc[log.category] = (acc[log.category] || 0) + 1;
        return acc;
      }, {}),
      firstLog: logs[0]?.datetime || null,
      lastLog: logs[logs.length - 1]?.datetime || null
    };
  }
}

window.logger = new Logger();

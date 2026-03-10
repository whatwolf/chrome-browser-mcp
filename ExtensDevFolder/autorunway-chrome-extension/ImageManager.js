class ImageManager {
  constructor() {
    this.dbName = 'AutorunwayDB';
    this.dbVersion = 3;
    this.storeName = 'images';
    this.db = null;
    this.folderHandle = null;
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 5000,
      exponentialBackoff: true
    };
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('[ImageManager] 打开数据库失败:', request.error);
        if (request.error.name === 'VersionError') {
          this.handleVersionError();
        }
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[ImageManager] 数据库初始化成功');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'name' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('retryCount', 'retryCount', { unique: false });
        } else {
          const transaction = event.target.transaction;
          const store = transaction.objectStore(this.storeName);

          if (!store.indexNames.contains('retryCount')) {
            store.createIndex('retryCount', 'retryCount', { unique: false });
          }
        }
      };
    });
  }

  async handleVersionError() {
    console.log('[ImageManager] 尝试清除旧数据库并重建...');
    await this.deleteDatabase();
    return this.initDB();
  }

  async deleteDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);
      request.onsuccess = () => {
        console.log('[ImageManager] 旧数据库已删除');
        resolve();
      };
      request.onerror = () => {
        console.error('[ImageManager] 删除数据库失败:', request.error);
        reject(request.error);
      };
    });
  }

  setRetryConfig(config) {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  async loadFolderHandle() {
    try {
      const result = await chrome.storage.local.get(['folderHandle']);
      if (result.folderHandle) {
        this.folderHandle = result.folderHandle;

        if (typeof this.folderHandle.queryPermission === 'function') {
          try {
            const permission = await this.folderHandle.queryPermission({ mode: 'read' });
            if (permission === 'granted') {
              console.log('[ImageManager] 文件夹句柄已加载，权限有效');
              return true;
            }
          } catch (permError) {
            console.warn('[ImageManager] 权限检查失败:', permError);
          }
        }

        if (typeof this.folderHandle.requestPermission === 'function') {
          try {
            const permission = await this.folderHandle.requestPermission({ mode: 'read' });
            if (permission === 'granted') {
              console.log('[ImageManager] 文件夹句柄已加载，权限已重新获取');
              return true;
            }
          } catch (reqError) {
            console.warn('[ImageManager] 请求权限失败:', reqError);
          }
        }

        console.warn('[ImageManager] 文件夹句柄方法不可用，需要重新选择文件夹');
        this.folderHandle = null;
        await chrome.storage.local.remove(['folderHandle']);
        return false;
      }
      return false;
    } catch (error) {
      console.error('[ImageManager] 加载文件夹句柄失败:', error);
      return false;
    }
  }

  async saveFolderHandle(handle) {
    try {
      this.folderHandle = handle;
      await chrome.storage.local.set({ folderHandle: handle });
      console.log('[ImageManager] 文件夹句柄已保存');
      return true;
    } catch (error) {
      console.error('[ImageManager] 保存文件夹句柄失败:', error);
      return false;
    }
  }

  async checkPermission() {
    if (!this.folderHandle) {
      return false;
    }

    try {
      if (typeof this.folderHandle.queryPermission === 'function') {
        try {
          const permission = await this.folderHandle.queryPermission({ mode: 'read' });
          if (permission === 'granted') {
            return true;
          }
        } catch (e) {
          console.warn('[ImageManager] queryPermission 失败:', e);
        }
      }

      if (typeof this.folderHandle.requestPermission === 'function') {
        try {
          const permission = await this.folderHandle.requestPermission({ mode: 'read' });
          return permission === 'granted';
        } catch (e) {
          console.warn('[ImageManager] requestPermission 失败:', e);
        }
      }

      console.warn('[ImageManager] 文件夹句柄没有权限方法');
      return false;
    } catch (error) {
      console.error('[ImageManager] 检查权限失败:', error);
      return false;
    }
  }

  async selectFolder() {
    try {
      const dirHandle = await window.showDirectoryPicker();

      try {
        if (typeof dirHandle.queryPermission === 'function') {
          const permission = await dirHandle.queryPermission({ mode: 'read' });
          if (permission !== 'granted') {
            const requestPermission = await dirHandle.requestPermission({ mode: 'read' });
            if (requestPermission !== 'granted') {
              throw new Error('未获得文件夹读取权限');
            }
          }
        } else {
          const permission = await dirHandle.requestPermission({ mode: 'read' });
          if (permission !== 'granted') {
            throw new Error('未获得文件夹读取权限');
          }
        }
      } catch (permError) {
        console.warn('[ImageManager] 权限检查失败，尝试请求:', permError);
        const permission = await dirHandle.requestPermission({ mode: 'read' });
        if (permission !== 'granted') {
          throw new Error('未获得文件夹读取权限');
        }
      }

      await this.saveFolderHandle(dirHandle);

      const stats = await this.getStats();

      if (stats.total > 0) {
        console.log('[ImageManager] 数据库已有数据，询问是否清空...');
        const shouldClear = confirm('数据库已有数据，是否清空并重新扫描？\n点击"确定"清空，点击"取消"保留现有进度。');
        
        if (shouldClear) {
          console.log('[ImageManager] 用户选择清空数据');
          await this.clearAll();
          await this.scanFolder(dirHandle);
        } else {
          console.log('[ImageManager] 用户选择保留进度');
          await updateImageStats();
        }
      } else {
        console.log('[ImageManager] 数据库为空，扫描文件夹...');
        await this.scanFolder(dirHandle);
      }

      return true;
    } catch (error) {
      console.error('[ImageManager] 选择文件夹失败:', error);
      return false;
    }
  }

  async scanFolder(dirHandle = this.folderHandle) {
    if (!dirHandle) {
      throw new Error('未选择文件夹');
    }

    try {
      await this.initDB();

      await this.clearAll();

      const images = [];
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          const ext = entry.name.toLowerCase().slice(-4);
          const ext3 = entry.name.toLowerCase().slice(-3);

          if (imageExtensions.includes(ext) || imageExtensions.includes(ext3)) {
            const file = await entry.getFile();
            images.push({
              name: entry.name,
              fileHandle: entry,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
              status: 'pending',
              retryCount: 0,
              lastError: null,
              lastAttempt: null,
              completedAt: null,
              timestamp: Date.now()
            });
          }
        }
      }

      images.sort((a, b) => a.name.localeCompare(b.name));

      await this.saveImages(images);

      console.log(`[ImageManager] 扫描到 ${images.length} 张图片`);
      return images;
    } catch (error) {
      console.error('[ImageManager] 扫描文件夹失败:', error);
      throw error;
    }
  }

  async saveImages(images) {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      images.forEach(image => {
        store.put(image);
      });

      transaction.oncomplete = () => {
        resolve(images.length);
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }

  async getNextPendingImage() {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('status');

      const request = index.get('pending');

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getNextRetryableImage() {
    if (!this.db) {
      await this.initDB();
    }

    const failedImages = await this.getImagesByStatus('failed');

    for (const image of failedImages) {
      if (image.retryCount < this.retryConfig.maxRetries) {
        return image;
      }
    }

    return null;
  }

  async getImagesByStatus(status) {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('status');

      const request = index.getAll(status);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getAllImages() {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async updateImageStatus(name, status, error = null) {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise(async (resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const getRequest = store.get(name);

      getRequest.onsuccess = async () => {
        const image = getRequest.result;
        if (image) {
          image.status = status;
          image.timestamp = Date.now();
          image.lastAttempt = Date.now();

          if (status === 'failed' && error) {
            image.lastError = error;
            image.retryCount = (image.retryCount || 0) + 1;
          }

          if (status === 'completed') {
            image.completedAt = Date.now();
          }

          if (status === 'pending' && image.retryCount > 0) {
            image.retryCount = 0;
            image.lastError = null;
          }

          const putRequest = store.put(image);
          putRequest.onsuccess = () => {
            resolve(image);
          };
          putRequest.onerror = () => {
            reject(putRequest.error);
          };
        } else {
          reject(new Error(`图片 ${name} 不存在`));
        }
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }

  async markAsCompleted(name) {
    return await this.updateImageStatus(name, 'completed');
  }

  async markAsProcessing(name) {
    return await this.updateImageStatus(name, 'processing');
  }

  async markAsFailed(name, error) {
    return await this.updateImageStatus(name, 'failed', error);
  }

  async markForRetry(name) {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise(async (resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const getRequest = store.get(name);

      getRequest.onsuccess = async () => {
        const image = getRequest.result;
        if (image) {
          if (image.retryCount < this.retryConfig.maxRetries) {
            image.status = 'pending';
            image.timestamp = Date.now();

            const putRequest = store.put(image);
            putRequest.onsuccess = () => {
              resolve({ canRetry: true, image });
            };
            putRequest.onerror = () => {
              reject(putRequest.error);
            };
          } else {
            resolve({ canRetry: false, image });
          }
        } else {
          reject(new Error(`图片 ${name} 不存在`));
        }
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }

  async retryFailedImages() {
    const failedImages = await this.getImagesByStatus('failed');
    const results = {
      retried: 0,
      maxRetriesReached: 0,
      images: []
    };

    for (const image of failedImages) {
      const result = await this.markForRetry(image.name);
      if (result.canRetry) {
        results.retried++;
        results.images.push(image.name);
      } else {
        results.maxRetriesReached++;
      }
    }

    return results;
  }

  getRetryDelay(retryCount) {
    if (this.retryConfig.exponentialBackoff) {
      return this.retryConfig.retryDelay * Math.pow(2, retryCount);
    }
    return this.retryConfig.retryDelay;
  }

  async clearAll() {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getStats() {
    const images = await this.getAllImages();

    return {
      total: images.length,
      pending: images.filter(img => img.status === 'pending').length,
      processing: images.filter(img => img.status === 'processing').length,
      completed: images.filter(img => img.status === 'completed').length,
      failed: images.filter(img => img.status === 'failed').length,
      retryable: images.filter(img => img.status === 'failed' && (img.retryCount || 0) < this.retryConfig.maxRetries).length
    };
  }

  async getDetailedStats() {
    const images = await this.getAllImages();

    const stats = {
      total: images.length,
      pending: images.filter(img => img.status === 'pending').length,
      processing: images.filter(img => img.status === 'processing').length,
      completed: images.filter(img => img.status === 'completed').length,
      failed: images.filter(img => img.status === 'failed').length,
      retryable: 0,
      maxRetriesReached: 0,
      averageRetryCount: 0,
      failedImages: []
    };

    const failedImages = images.filter(img => img.status === 'failed');

    for (const img of failedImages) {
      if ((img.retryCount || 0) < this.retryConfig.maxRetries) {
        stats.retryable++;
      } else {
        stats.maxRetriesReached++;
        stats.failedImages.push({
          name: img.name,
          retryCount: img.retryCount,
          lastError: img.lastError,
          lastAttempt: img.lastAttempt
        });
      }
    }

    const totalRetries = images.reduce((sum, img) => sum + (img.retryCount || 0), 0);
    stats.averageRetryCount = images.length > 0 ? (totalRetries / images.length).toFixed(2) : 0;

    return stats;
  }

  async resetAll() {
    const images = await this.getAllImages();

    const updated = images.map(img => ({
      ...img,
      status: 'pending',
      retryCount: 0,
      lastError: null,
      lastAttempt: null,
      completedAt: null,
      timestamp: Date.now()
    }));

    await this.saveImages(updated);
    return updated.length;
  }

  async exportProgress() {
    const images = await this.getAllImages();
    const stats = await this.getStats();

    return {
      exportTime: new Date().toISOString(),
      stats,
      images: images.map(img => ({
        name: img.name,
        status: img.status,
        retryCount: img.retryCount || 0,
        lastError: img.lastError,
        lastAttempt: img.lastAttempt,
        completedAt: img.completedAt
      }))
    };
  }

  async importProgress(progressData) {
    if (!progressData.images || !Array.isArray(progressData.images)) {
      throw new Error('无效的进度数据格式');
    }

    const existingImages = await this.getAllImages();
    const existingMap = new Map(existingImages.map(img => [img.name, img]));

    const updated = progressData.images.map(importedImg => {
      const existing = existingMap.get(importedImg.name);
      if (existing) {
        return {
          ...existing,
          status: importedImg.status,
          retryCount: importedImg.retryCount || 0,
          lastError: importedImg.lastError,
          lastAttempt: importedImg.lastAttempt,
          completedAt: importedImg.completedAt
        };
      }
      return null;
    }).filter(img => img !== null);

    await this.saveImages(updated);
    return updated.length;
  }
}

window.imageManager = new ImageManager();

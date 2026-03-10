class ConcurrencyManager {
  constructor(maxConcurrent = 2) {
    this.maxConcurrent = maxConcurrent;
    this.activeCount = 0;
    this.waitQueue = [];
    this.operationId = 0;
    this.listeners = [];
  }

  async init() {
    await this.updateButtonStates();
    this.startMonitoring();
    console.log('[ConcurrencyManager] 并发控制器已初始化，最大并发数:', this.maxConcurrent);
    return this;
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('[ConcurrencyManager] 通知失败:', error);
      }
    });
  }

  async acquire(operationType = 'general') {
    const id = ++this.operationId;
    
    if (this.activeCount < this.maxConcurrent) {
      this.activeCount++;
      this.notify('acquired', { id, type: operationType, count: this.activeCount });
      await this.updateButtonStates();
      console.log(`[ConcurrencyManager] 操作 ${id} (${operationType}) 获取名额，当前并发: ${this.activeCount}/${this.maxConcurrent}`);
      return { id, release: () => this.release(id, operationType) };
    }

    console.log(`[ConcurrencyManager] 操作 ${id} (${operationType}) 加入等待队列，当前并发: ${this.activeCount}/${this.maxConcurrent}`);

    return new Promise((resolve) => {
      this.waitQueue.push({
        id,
        type: operationType,
        resolve: (result) => {
          this.activeCount++;
          this.notify('acquired', { id, type: operationType, count: this.activeCount });
          this.updateButtonStates();
          console.log(`[ConcurrencyManager] 操作 ${id} (${operationType}) 获取名额，当前并发: ${this.activeCount}/${this.maxConcurrent}`);
          resolve({ id, release: () => this.release(id, operationType) });
        }
      });
    });
  }

  async release(id, operationType) {
    this.activeCount = Math.max(0, this.activeCount - 1);
    this.notify('released', { id, type: operationType, count: this.activeCount });
    await this.updateButtonStates();
    console.log(`[ConcurrencyManager] 操作 ${id} (${operationType}) 释放名额，当前并发: ${this.activeCount}/${this.maxConcurrent}`);

    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift();
      next.resolve({ id: next.id });
    }
  }

  getStatus() {
    return {
      active: this.activeCount,
      max: this.maxConcurrent,
      available: this.maxConcurrent - this.activeCount,
      waiting: this.waitQueue.length
    };
  }

  isAvailable() {
    return this.activeCount < this.maxConcurrent;
  }

  async updateButtonStates() {
    const isFull = !this.isAvailable();

    try {
      const generateButton = $('button:has(svg.lucide-video):contains("Generate")');
      if (generateButton.length > 0) {
        if (isFull) {
          generateButton.attr('data-concurrency-blocked', 'true');
          generateButton.css('opacity', '0.5');
          generateButton.css('pointer-events', 'none');
        } else {
          generateButton.removeAttr('data-concurrency-blocked');
          generateButton.css('opacity', '');
          generateButton.css('pointer-events', '');
        }
      }

      const button4K = $('button:has(svg.lucide-image-upscale):contains("4K")');
      if (button4K.length > 0) {
        if (isFull) {
          button4K.attr('data-concurrency-blocked', 'true');
          button4K.css('opacity', '0.5');
          button4K.css('pointer-events', 'none');
        } else {
          button4K.removeAttr('data-concurrency-blocked');
          button4K.css('opacity', '');
          button4K.css('pointer-events', '');
        }
      }

      const generateItBtn = $('#generateItBtn');
      if (generateItBtn.length > 0) {
        if (isFull) {
          generateItBtn.prop('disabled', true);
          generateItBtn.attr('title', '等待运算资源...');
        } else {
          generateItBtn.prop('disabled', false);
          generateItBtn.attr('title', '');
        }
      }

      this.notify('buttonStateUpdated', { isFull, status: this.getStatus() });
    } catch (error) {
      console.error('[ConcurrencyManager] 更新按钮状态失败:', error);
    }
  }

  startMonitoring() {
    setInterval(() => {
      this.updateButtonStates();
    }, 1000);
  }

  async waitForAvailable(timeout = 300000) {
    if (this.isAvailable()) {
      return true;
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const unsubscribe = this.listeners.find(l => l.toString().includes('waitForAvailable'));
        if (unsubscribe) {
          unsubscribe();
        }
        reject(new Error('等待并发资源超时'));
      }, timeout);

      const unsubscribe = this.subscribe((event, data) => {
        if (event === 'released' && this.isAvailable()) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }

  reset() {
    this.activeCount = 0;
    this.waitQueue = [];
    this.updateButtonStates();
    console.log('[ConcurrencyManager] 并发控制器已重置');
  }
}

window.concurrencyManager = new ConcurrencyManager(2);

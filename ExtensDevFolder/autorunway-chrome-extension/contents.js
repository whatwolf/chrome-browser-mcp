class DOMObserver {
  constructor() {
    this.observers = new Map();
    this.pendingCallbacks = new Map();
  }

  waitForElement(selector, options = {}) {
    const timeout = options.timeout || 60000;
    const existingElement = $(selector);

    if (existingElement.length > 0) {
      return Promise.resolve(existingElement);
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.stopWatching(selector);
        reject(new Error(`等待元素超时: ${selector}`));
      }, timeout);

      this.pendingCallbacks.set(selector, { resolve, reject, timeoutId });

      if (!this.observers.has(selector)) {
        const observer = new MutationObserver((mutations) => {
          const element = $(selector);
          if (element.length > 0) {
            const callback = this.pendingCallbacks.get(selector);
            if (callback) {
              clearTimeout(callback.timeoutId);
              this.pendingCallbacks.delete(selector);
              callback.resolve(element);
              this.stopWatching(selector);
            }
          }
        });

        observer.observe($('body')[0], {
          childList: true,
          subtree: true
        });

        this.observers.set(selector, observer);
      }
    });
  }

  waitForElementWithCondition(selector, conditionFn, options = {}) {
    const timeout = options.timeout || 60000;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.stopWatching(selector);
        reject(new Error(`等待条件超时: ${selector}`));
      }, timeout);

      const checkCondition = () => {
        const element = $(selector);
        if (element.length > 0 && conditionFn(element)) {
          clearTimeout(timeoutId);
          this.stopWatching(selector);
          resolve(element);
          return true;
        }
        return false;
      };

      if (checkCondition()) {
        return;
      }

      const observer = new MutationObserver(() => {
        checkCondition();
      });

      observer.observe($('body')[0], {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['disabled', 'data-soft-disabled', 'class']
      });

      this.observers.set(selector, observer);
    });
  }

  waitForMultipleElements(selectors, options = {}) {
    const timeout = options.timeout || 60000;
    const results = {};
    let resolved = 0;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.stopWatchingAll();
        reject(new Error('等待多个元素超时'));
      }, timeout);

      selectors.forEach(selector => {
        this.waitForElement(selector, { timeout })
          .then(element => {
            results[selector] = element;
            resolved++;
            if (resolved === selectors.length) {
              clearTimeout(timeoutId);
              resolve(results);
            }
          })
          .catch(reject);
      });
    });
  }

  watchForChanges(selector, callback, options = {}) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        callback(mutation);
      });
    });

    const element = $(selector)[0];
    if (element) {
      observer.observe(element, {
        childList: true,
        subtree: true,
        attributes: options.attributes || false,
        attributeFilter: options.attributeFilter
      });
      this.observers.set(`watch_${selector}`, observer);
    }

    return observer;
  }

  stopWatching(key) {
    const observer = this.observers.get(key);
    if (observer) {
      observer.disconnect();
      this.observers.delete(key);
    }
    this.pendingCallbacks.delete(key);
  }

  stopWatchingAll() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.pendingCallbacks.clear();
  }
}

window.domObserver = new DOMObserver();

window.updateImageStats = async function () {
  const statusDivImages = $('#statusDivImages');
  if (statusDivImages.length === 0) {
    return { total: 0, completed: 0 };
  }

  statusDivImages.css('cursor', 'pointer');
  statusDivImages.attr('title', '点击清空数据库');
  statusDivImages.off('click').on('click', async () => {
    const stats = await window.imageManager.getStats();
    if (stats.total === 0) {
      return;
    }

    const confirmed = confirm(`确定要清空数据库吗？\n当前进度：${stats.completed}/${stats.total}`);
    if (confirmed) {
      await window.imageManager.clearAll();
      await updateImageStats();
      await window.logger.info('System', '数据库已清空');
    }
  });

  try {
    const stats = await window.imageManager.getStats();
    statusDivImages.text(`图片：${stats.completed}/${stats.total}`);

    await chrome.storage.local.set({ imageStats: stats });

    return stats;
  } catch (error) {
    await window.logger.error('UI', '更新图片统计失败', error);
    statusDivImages.text('图片：0/0');
    return { total: 0, completed: 0 };
  }
};

$(document).ready(async () => {
  await window.logger.initDB();
  await window.logger.info('System', '内容脚本已加载');

  await window.configManager.init();
  await window.logger.info('System', '配置已加载');

  await window.concurrencyManager.init();
  await window.logger.info('System', '并发控制器已初始化');

  const delFirstHeader = $('div[class^="unifiedHeader-"]');
  delFirstHeader.remove();

  const container = $('<div class="autorunway-container"></div>');

  const selectFolderBtn = $('<button class="autorunway-btn autorunway-btn-info">选择图片文件夹</button>');
  const getImageBtn = $('<button class="autorunway-btn autorunway-btn-secondary">贴入图片</button>');
  const statusDivConnect = $('<div id="statusDivConnect" class="autorunway-status">状态：就绪</div>');
  const statusDivAutoRun = $('<div id="statusDivAutoRun" class="autorunway-status">全自动：关闭</div>');
  const statusDivImages = $('<div id="statusDivImages" class="autorunway-status">图片：0/0</div>');
  const statusDivConcurrency = $('<div id="statusDivConcurrency" class="autorunway-status">并发：0/2</div>');
  const generateItBtn = $('<button id="generateItBtn" class="autorunway-btn">Generate It</button>');
  const autoRunBtn = $('<button class="autorunway-btn autorunway-btn-secondary">自动运行</button>');
  const retryFailedBtn = $('<button class="autorunway-btn autorunway-btn-warning">重试失败</button>');

  window.concurrencyManager.subscribe((event, data) => {
    if (event === 'acquired' || event === 'released' || event === 'buttonStateUpdated') {
      const status = window.concurrencyManager.getStatus();
      statusDivConcurrency.text(`并发：${status.active}/${status.max}`);

      if (status.active >= status.max) {
        statusDivConcurrency.css('color', '#dc3545');
      } else if (status.active > 0) {
        statusDivConcurrency.css('color', '#ffc107');
      } else {
        statusDivConcurrency.css('color', '');
      }
    }
  });

  selectFolderBtn.click(async () => {
    try {
      statusDivConnect.text('状态：选择中...');
      await window.logger.info('User', '用户点击选择文件夹');
      const success = await window.imageManager.selectFolder();
      if (success) {
        statusDivConnect.text('状态：文件夹已加载');
        await updateImageStats();
        await window.logger.info('Folder', '文件夹选择成功');
      } else {
        statusDivConnect.text('状态：选择失败');
        await window.logger.error('Folder', '文件夹选择失败');
      }
    } catch (error) {
      await window.logger.error('Folder', '选择文件夹异常', error);
      statusDivConnect.text('状态：选择失败');
    }
  });

  getImageBtn.click(async () => {
    await window.logger.info('User', '用户点击贴入图片');
    const success = await getImage();
    if (success) {
      await window.logger.info('Image', '图片上传成功');
    } else {
      await window.logger.warn('Image', '图片上传失败');
    }
  });

  generateItBtn.click(async () => {
    await window.logger.info('User', '用户点击 Generate It');
    const success = await runSingleTask();
    if (success) {
      await window.logger.info('Task', '单次任务完成');
    } else {
      await window.logger.warn('Task', '单次任务失败');
    }
  });

  autoRunBtn.click(async () => {
    const isAutoRunning = autoRunBtn.data('running') || false;

    if (isAutoRunning) {
      autoRunBtn.data('running', false);
      autoRunBtn.text('自动运行');
      statusDivAutoRun.text('全自动：关闭');
      await window.logger.info('Automation', '自动运行已停止');
    } else {
      autoRunBtn.data('running', true);
      autoRunBtn.text('停止运行');
      statusDivAutoRun.text('全自动：运行中');
      await window.logger.info('Automation', '自动运行已启动');
      await autoRunway(autoRunBtn, statusDivAutoRun);
    }
  });

  retryFailedBtn.click(async () => {
    await window.logger.info('User', '用户点击重试失败');
    const result = await window.imageManager.retryFailedImages();
    await window.logger.info('Retry', `重试结果: ${result.retried} 个可重试, ${result.maxRetriesReached} 个已达最大重试次数`);
    await updateImageStats();
    alert(`已重置 ${result.retried} 个失败任务\n${result.maxRetriesReached} 个任务已达最大重试次数`);
  });

  container.append(selectFolderBtn);
  container.append(getImageBtn);
  container.append(generateItBtn);
  container.append(autoRunBtn);
  container.append(retryFailedBtn);
  container.append(statusDivConnect);
  container.append(statusDivAutoRun);
  container.append(statusDivImages);
  container.append(statusDivConcurrency);

  await window.logger.info('System', '尝试清理之前的视频');
  hidevideo();

  $('body').append(container);

  await initAutorunway();
});

async function initAutorunway() {
  await window.logger.info('System', '初始化...');

  await window.imageManager.initDB();

  const retryConfig = window.configManager.getRetryConfig();
  window.imageManager.setRetryConfig(retryConfig);

  const hasFolder = await window.imageManager.loadFolderHandle();

  const stats = await window.imageManager.getStats();

  if (stats.total > 0) {
    await window.logger.info('System', `已有数据：${stats.completed}/${stats.total}`);
    await updateImageStats();
  }

  if (hasFolder) {
    $('#statusDivConnect').text('状态：文件夹已加载');

    if (stats.total === 0) {
      await window.logger.info('System', '数据库为空，开始扫描文件夹...');
      try {
        await window.imageManager.scanFolder();
        await updateImageStats();
        $('#statusDivConnect').text('状态：文件夹已扫描');
      } catch (error) {
        await window.logger.error('System', '扫描文件夹失败', error);
        $('#statusDivConnect').text('状态：扫描失败，请重新选择');
      }
    } else {
      await window.logger.info('System', `恢复进度：${stats.completed}/${stats.total}`);
      await updateImageStats();
      $('#statusDivConnect').text('状态：进度已恢复');
    }
  } else {
    $('#statusDivConnect').text('状态：请选择文件夹');
  }
}

async function awaitSeconds(seconds) {
  await window.logger.debug('Timing', `等待 ${seconds} 秒`);
  await new Promise(resolve => setTimeout(resolve, seconds * 1000));
  return true;
}

async function waitForElementWithMutationObserver(selector, timeout = 60000) {
  try {
    const element = await window.domObserver.waitForElement(selector, { timeout });
    return element;
  } catch (error) {
    await window.logger.error('DOM', `等待元素失败: ${selector}`, error);
    return null;
  }
}

async function waitForButtonEnabled(selector, timeout = 300000) {
  try {
    const element = await window.domObserver.waitForElementWithCondition(
      selector,
      ($el) => {
        const el = $el[0];
        return el && !el.disabled && el.getAttribute('data-soft-disabled') !== 'true';
      },
      { timeout }
    );
    return element;
  } catch (error) {
    await window.logger.error('DOM', `等待按钮启用失败: ${selector}`, error);
    return null;
  }
}

async function modelchange() {
  try {
    await window.logger.info('Model', '开始切换模型');

    const modelSelect = document.querySelector("select option[value='gen-4-turbo']")?.parentElement;

    if (!modelSelect) {
      await window.logger.warn('Model', '未找到模型选择器，跳过模型切换');
      return true;
    }

    const currentValue = modelSelect.value;
    if (currentValue === 'gen-4-turbo') {
      await window.logger.info('Model', '已经是 Gen-4 Turbo，无需切换');
      return true;
    }

    modelSelect.value = 'gen-4-turbo';
    modelSelect.dispatchEvent(new Event('change', { bubbles: true }));

    await window.logger.info('Model', '已切换到 Gen-4 Turbo');
    return true;
  } catch (error) {
    await window.logger.error('Model', '切换模型失败', error);
    return false;
  }
}

async function getImage() {
  try {
    await modelchange();

    const hasPermission = await window.imageManager.checkPermission();
    if (!hasPermission) {
      await window.logger.error('Permission', '文件夹权限已失效');
      alert('文件夹权限已失效，请点击"选择图片文件夹"重新选择。');
      return false;
    }

    const image = await window.imageManager.getNextPendingImage();

    if (!image) {
      await window.logger.warn('Image', '没有待处理的图片');
      alert('所有图片已处理完成！');
      return false;
    }

    await window.imageManager.markAsProcessing(image.name);
    await updateImageStats();

    await window.logger.info('Image', `正在处理图片：${image.name}`);

    const file = await image.fileHandle.getFile();

    const filePicker = $('div[aria-label="Open file picker"]');
    if (filePicker.length === 0) {
      await window.logger.error('DOM', '未找到文件选择器区域');
      await window.imageManager.markAsFailed(image.name, '未找到文件选择器');
      return false;
    }

    const dropTarget = filePicker[0];
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    const dragEnterEvent = new DragEvent('dragenter', {
      bubbles: true,
      cancelable: true,
      dataTransfer: dataTransfer
    });

    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      dataTransfer: dataTransfer
    });

    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer: dataTransfer
    });

    dropTarget.dispatchEvent(dragEnterEvent);
    dropTarget.dispatchEvent(dragOverEvent);
    dropTarget.dispatchEvent(dropEvent);

    await window.logger.info('Image', '拖放事件已触发');
    await awaitSeconds(1);

    const timingConfig = window.configManager.getTimingConfig();

    try {
      await waitForButtonEnabled('button:has(svg.lucide-video):contains("Generate")', timingConfig.generateTimeout * 1000);
      await window.imageManager.markAsCompleted(image.name);
      await updateImageStats();
      await window.logger.info('Image', `图片上传成功：${image.name}`);
      return true;
    } catch (error) {
      await window.logger.error('Image', '等待 Generate 按钮超时', error);
      await window.imageManager.markAsFailed(image.name, '等待按钮超时');
      await updateImageStats();
      return false;
    }

  } catch (error) {
    await window.logger.error('Image', '获取图片失败', error);
    return false;
  }
}

async function inputText() {
  try {
    const textInput = await waitForElementWithMutationObserver('textarea[aria-label="Prompt"]', 10000);

    if (!textInput || textInput.length === 0) {
      await window.logger.error('DOM', '未找到文本输入框');
      return false;
    }

    textInput.focus().click();

    const promptText = window.configManager.getPrompt();
    await window.logger.info('Prompt', `使用提示词：${promptText}`);

    const textareaElement = textInput[0];
    textareaElement.focus();
    textareaElement.value = promptText;

    const inputEvent = new Event('input', { bubbles: true });
    textareaElement.dispatchEvent(inputEvent);

    const changeEvent = new Event('change', { bubbles: true });
    textareaElement.dispatchEvent(changeEvent);

    await window.logger.info('Prompt', '提示词已输入');
    return true;
  } catch (error) {
    await window.logger.error('Prompt', '输入提示词失败', error);
    return false;
  }
}

async function generatebuttonclick() {
  let release = null;

  try {
    const status = window.concurrencyManager.getStatus();
    if (!window.concurrencyManager.isAvailable()) {
      await window.logger.warn('Concurrency', `运算并发已满 (${status.active}/${status.max})，等待中...`);
    }

    const result = await window.concurrencyManager.acquire('generate');
    release = result.release;

    const timingConfig = window.configManager.getTimingConfig();
    await awaitSeconds(timingConfig.waitAfterUpload);

    const generateButton = $('button:has(svg.lucide-video):contains("Generate")');
    if (generateButton.length > 0 && !generateButton.attr('disabled')) {
      generateButton[0].click();
      await window.logger.info('Generate', 'Generate 按钮已点击');
      return true;
    }

    await window.logger.error('DOM', '未找到 Generate 按钮或按钮不可用');
    return false;
  } catch (error) {
    await window.logger.error('Generate', '点击 Generate 按钮失败', error);
    return false;
  } finally {
    if (release) {
      release();
    }
  }
}

async function removeimage() {
  try {
    const removeButton = $('button[aria-label="Remove image"]');
    if (removeButton.length > 0) {
      removeButton[0].click();
      await window.logger.info('Image', '图片已移除');
      return true;
    }

    await window.logger.warn('DOM', '未找到 Remove image 按钮');
    return false;
  } catch (error) {
    await window.logger.error('Image', '移除图片失败', error);
    return false;
  }
}

async function await4kbuttonandclick() {
  let release = null;

  try {
    const status = window.concurrencyManager.getStatus();
    if (!window.concurrencyManager.isAvailable()) {
      await window.logger.warn('Concurrency', `运算并发已满 (${status.active}/${status.max})，等待中...`);
    }

    const result = await window.concurrencyManager.acquire('4k');
    release = result.release;

    await window.logger.info('4K', '等待 4K 按钮出现...');

    const timingConfig = window.configManager.getTimingConfig();
    const button4K = await waitForElementWithMutationObserver(
      'button:has(svg.lucide-image-upscale):contains("4K")',
      timingConfig.generateTimeout * 1000
    );

    if (button4K && button4K.length > 0 && !button4K.attr('disabled')) {
      button4K[0].click();
      await window.logger.info('4K', '4K 按钮已点击');
      return true;
    }

    await window.logger.error('DOM', '未找到 4K 按钮或按钮不可用');
    return false;
  } catch (error) {
    await window.logger.error('4K', '等待 4K 按钮失败', error);
    return false;
  } finally {
    if (release) {
      release();
    }
  }
}

async function isthere2download() {
  try {
    await window.logger.info('Download', '检查下载按钮...');

    const downloadButton = $('button:has(svg.lucide.lucide-download)');
    if (downloadButton.length >= 2) {
      await window.logger.info('Download', `找到 ${downloadButton.length} 个下载按钮`);
      return true;
    }

    const timingConfig = window.configManager.getTimingConfig();

    try {
      await window.domObserver.waitForElementWithCondition(
        'button:has(svg.lucide.lucide-download)',
        ($el) => $el.length >= 2,
        { timeout: timingConfig.generateTimeout * 1000 }
      );
      await window.logger.info('Download', '下载按钮已就绪');
      return true;
    } catch (error) {
      await window.logger.error('Download', '等待下载按钮超时');
      return false;
    }
  } catch (error) {
    await window.logger.error('Download', '检查下载按钮失败', error);
    return false;
  }
}

async function download4K() {
  try {
    const timingConfig = window.configManager.getTimingConfig();
    await awaitSeconds(timingConfig.waitAfter4K);

    await window.logger.info('Download', '开始下载 4K 视频');

    const $dataitems = $('div[data-item-index]');
    await window.logger.debug('Download', `找到 ${$dataitems.length} 个视频项`);

    for (let i = 0; i < $dataitems.length; i++) {
      const $item = $($dataitems[i]);
      const $span4k = $item.find('span[class^="modelLabel-"]:contains("4K")');

      if ($span4k.length > 0) {
        await window.logger.info('Download', '找到 4K 视频');

        const $video = $item.find('video');
        if ($video.length > 0) {
          const videoUrl = $video[0].src;
          await window.logger.info('Download', `视频 URL: ${videoUrl}`);
          await downloadVideo(videoUrl);
          return true;
        }
      }
    }

    await window.logger.error('Download', '未找到 4K 视频');
    return false;
  } catch (error) {
    await window.logger.error('Download', '下载 4K 视频失败', error);
    return false;
  }
}

async function downloadVideo(url, maxRetries = 3) {
  let lastError = null;
  const retryConfig = window.configManager.getRetryConfig();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await window.logger.info('Download', `开始下载 (尝试 ${attempt}/${maxRetries})`);

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error('下载的文件大小为 0');
      }

      const downloadConfig = window.configManager.getDownloadConfig();
      const timestamp = downloadConfig.includeTimestamp ? `_${Date.now()}` : '';
      const random = downloadConfig.includeRandom ? `_${Math.random().toString(36).substring(2, 8)}` : '';
      const filename = `${downloadConfig.filenamePrefix}${timestamp}${random}.mp4`;

      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

      await window.logger.info('Download', `下载成功: ${filename} (${(blob.size / 1024 / 1024).toFixed(2)}MB)`);
      await new Promise(resolve => setTimeout(resolve, 2000));

      return true;

    } catch (error) {
      lastError = error;
      await window.logger.error('Download', `下载失败 (尝试 ${attempt}/${maxRetries})`, error);

      if (attempt < maxRetries) {
        const waitTime = window.imageManager.getRetryDelay(attempt - 1);
        await window.logger.info('Download', `等待 ${waitTime / 1000} 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  await window.logger.error('Download', `下载失败，已重试 ${maxRetries} 次`, lastError);
  return false;
}

async function hidevideo() {
  try {
    const timingConfig = window.configManager.getTimingConfig();
    await awaitSeconds(timingConfig.waitAfterRemove);

    const hideButtons = $('button[aria-label="Hide output"]');
    hideButtons.each(function () {
      $(this).click();
    });

    await window.logger.info('Video', `已隐藏 ${hideButtons.length} 个视频`);
    return true;
  } catch (error) {
    await window.logger.error('Video', '隐藏视频失败', error);
    return false;
  }
}

async function runSingleTask() {
  const timingConfig = window.configManager.getTimingConfig();

  try {
    if (!await getImage()) {
      await window.logger.error('Task', '获取图片失败');
      return false;
    }

    await awaitSeconds(timingConfig.waitAfterUpload);

    if (!await inputText()) {
      await window.logger.error('Task', '输入提示词失败');
      return false;
    }

    await awaitSeconds(timingConfig.waitAfterUpload);

    if (!await generatebuttonclick()) {
      await window.logger.error('Task', '点击 Generate 按钮失败');
      return false;
    }

    await awaitSeconds(timingConfig.waitAfterGenerate);

    if (!await removeimage()) {
      await window.logger.warn('Task', '移除图片失败');
    }

    await awaitSeconds(timingConfig.waitAfterRemove);

    if (!await await4kbuttonandclick()) {
      await window.logger.error('Task', '点击 4K 按钮失败');
      return false;
    }

    if (!await isthere2download()) {
      await window.logger.error('Task', '下载按钮未就绪');
      return false;
    }

    if (!await download4K()) {
      await window.logger.error('Task', '下载 4K 视频失败');
      return false;
    }

    if (!await hidevideo()) {
      await window.logger.warn('Task', '隐藏视频失败');
    }

    await window.logger.info('Task', '单次任务完成');
    return true;

  } catch (error) {
    await window.logger.error('Task', '单次任务异常', error);
    return false;
  }
}

async function autoRunway(autoRunBtn, statusDivAutoRun) {
  const automationConfig = window.configManager.getAutomationConfig();
  let consecutiveErrors = 0;

  await window.logger.info('Automation', '开始自动运行', automationConfig);

  while (autoRunBtn.data('running')) {
    const stats = await window.imageManager.getStats();

    if (stats.pending === 0) {
      await window.logger.info('Automation', '所有任务已完成');
      autoRunBtn.data('running', false);
      autoRunBtn.text('自动运行');
      statusDivAutoRun.text('全自动：已完成');
      break;
    }

    const success = await runSingleTask();

    if (success) {
      consecutiveErrors = 0;
      await window.logger.info('Automation', `任务成功，剩余 ${stats.pending - 1} 个任务`);
    } else {
      consecutiveErrors++;
      await window.logger.error('Automation', `任务失败，连续错误数: ${consecutiveErrors}`);

      if (automationConfig.stopOnError && consecutiveErrors >= automationConfig.maxConsecutiveErrors) {
        await window.logger.error('Automation', `连续错误达到 ${automationConfig.maxConsecutiveErrors} 次，停止自动运行`);
        autoRunBtn.data('running', false);
        autoRunBtn.text('自动运行');
        statusDivAutoRun.text('全自动：错误停止');
        break;
      }
    }

    if (automationConfig.pauseBetweenTasks > 0) {
      await awaitSeconds(automationConfig.pauseBetweenTasks);
    }
  }

  await window.logger.info('Automation', '自动运行结束');
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      await window.logger.info('Message', `收到消息: ${request.action}`);

      switch (request.action) {
        case 'selectNewFolder':
          const success = await window.imageManager.selectFolder();
          if (success) {
            await window.imageManager.scanFolder();
            await updateImageStats();
          }
          sendResponse({ success });
          break;

        case 'resetAll':
          const count = await window.imageManager.resetAll();
          await updateImageStats();
          sendResponse({ success: true, count });
          break;

        case 'clearAll':
          await window.imageManager.clearAll();
          await updateImageStats();
          sendResponse({ success: true });
          break;

        case 'retryFailed':
          const result = await window.imageManager.retryFailedImages();
          await updateImageStats();
          sendResponse({ success: true, ...result });
          break;

        case 'getStats':
          const stats = await window.imageManager.getStats();
          sendResponse({ success: true, stats });
          break;

        case 'getDetailedStats':
          const detailedStats = await window.imageManager.getDetailedStats();
          sendResponse({ success: true, stats: detailedStats });
          break;

        case 'getLogs':
          const logs = await window.logger.getLogs(request.options || {});
          sendResponse({ success: true, logs });
          break;

        case 'clearLogs':
          await window.logger.clear();
          sendResponse({ success: true });
          break;

        case 'getConfig':
          const config = window.configManager.config;
          sendResponse({ success: true, config });
          break;

        case 'setConfig':
          if (request.key && request.value !== undefined) {
            await window.configManager.set(request.key, request.value);
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: '缺少参数' });
          }
          break;

        case 'resetConfig':
          await window.configManager.reset();
          sendResponse({ success: true });
          break;

        case 'getConcurrencyStatus':
          const concurrencyStatus = window.concurrencyManager.getStatus();
          sendResponse({ success: true, status: concurrencyStatus });
          break;

        case 'resetConcurrency':
          window.concurrencyManager.reset();
          await window.logger.info('Concurrency', '并发控制器已重置');
          sendResponse({ success: true });
          break;

        case 'exportProgress':
          const progress = await window.imageManager.exportProgress();
          sendResponse({ success: true, progress });
          break;

        case 'importProgress':
          if (request.progressData) {
            const imported = await window.imageManager.importProgress(request.progressData);
            await updateImageStats();
            sendResponse({ success: true, imported });
          } else {
            sendResponse({ success: false, error: '缺少进度数据' });
          }
          break;

        default:
          sendResponse({ success: false, error: '未知操作' });
      }
    } catch (error) {
      await window.logger.error('Message', '处理消息失败', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true;
});

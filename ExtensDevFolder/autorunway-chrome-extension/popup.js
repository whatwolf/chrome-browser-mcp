document.addEventListener('DOMContentLoaded', async () => {
  const loadingEl = document.getElementById('loading');
  const contentEl = document.getElementById('content');
  const statusMessageEl = document.getElementById('statusMessage');
  const folderInfoEl = document.getElementById('folderInfo');
  const folderNameEl = document.getElementById('folderName');
  const progressFill = document.getElementById('progressFill');

  const totalStatEl = document.getElementById('totalStat');
  const pendingStatEl = document.getElementById('pendingStat');
  const completedStatEl = document.getElementById('completedStat');
  const failedStatEl = document.getElementById('failedStat');
  const retryableStatEl = document.getElementById('retryableStat');
  const avgRetryStatEl = document.getElementById('avgRetryStat');

  const selectFolderBtn = document.getElementById('selectFolderBtn');
  const retryFailedBtn = document.getElementById('retryFailedBtn');
  const resetBtn = document.getElementById('resetBtn');
  const clearBtn = document.getElementById('clearBtn');

  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));

      tab.classList.add('active');
      const tabId = tab.getAttribute('data-tab');
      document.getElementById(`tab-${tabId}`).classList.add('active');

      if (tabId === 'logs') {
        loadLogs();
      } else if (tabId === 'config') {
        loadConfig();
      }
    });
  });

  function updateStatus(message, type = 'info') {
    statusMessageEl.textContent = message;
    statusMessageEl.className = `status status-${type}`;
  }

  function updateProgress(completed, total) {
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    progressFill.style.width = `${percentage}%`;
  }

  async function loadStats() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab) {
        updateStatus('请先打开 Runway 页面', 'warning');
        return;
      }

      const result = await chrome.storage.local.get(['imageStats', 'folderHandle']);

      if (result.imageStats) {
        updateStatsDisplay(result.imageStats);
        updateProgress(result.imageStats.completed, result.imageStats.total);
        updateStatus('已加载统计数据', 'success');
      } else {
        updateStatsDisplay({ total: 0, pending: 0, completed: 0, failed: 0, retryable: 0 });
        updateStatus('暂无统计数据', 'info');
      }

      if (result.folderHandle) {
        folderInfoEl.style.display = 'block';
        folderNameEl.textContent = result.folderHandle.name || '已选择文件夹';
        updateStatus('文件夹已加载', 'success');
      } else {
        folderInfoEl.style.display = 'none';
        updateStatus('请选择图片文件夹', 'warning');
      }
    } catch (error) {
      console.error('[Popup] 加载统计失败:', error);
      updateStatsDisplay({ total: 0, pending: 0, completed: 0, failed: 0, retryable: 0 });
      updateStatus('加载失败，请刷新页面', 'error');
    } finally {
      loadingEl.style.display = 'none';
      contentEl.style.display = 'block';
    }
  }

  function updateStatsDisplay(stats) {
    totalStatEl.textContent = stats.total || 0;
    pendingStatEl.textContent = stats.pending || 0;
    completedStatEl.textContent = stats.completed || 0;
    failedStatEl.textContent = stats.failed || 0;
    retryableStatEl.textContent = stats.retryable || 0;
    avgRetryStatEl.textContent = stats.averageRetryCount || '0';
  }

  async function sendMessageToContent(action, data = {}) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url || !tab.url.includes('app.runwayml.com')) {
      updateStatus('请先打开 Runway 页面', 'warning');
      return null;
    }

    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action, ...data });
      return response;
    } catch (error) {
      console.error('[Popup] 发送消息失败:', error);
      return null;
    }
  }

  selectFolderBtn.addEventListener('click', async () => {
    if (!confirm('确定要重新选择文件夹吗？这将清除当前的所有图片数据！')) {
      return;
    }

    try {
      updateStatus('正在打开文件选择器...', 'info');

      const response = await sendMessageToContent('selectNewFolder');

      if (response && response.success) {
        updateStatus('文件夹选择成功！', 'success');
        setTimeout(() => loadStats(), 1000);
      } else {
        updateStatus(response?.error || '选择失败', 'error');
      }
    } catch (error) {
      console.error('[Popup] 选择文件夹失败:', error);
      updateStatus('选择失败，请重试', 'error');
    }
  });

  retryFailedBtn.addEventListener('click', async () => {
    try {
      updateStatus('正在重试失败任务...', 'info');

      const response = await sendMessageToContent('retryFailed');

      if (response && response.success) {
        updateStatus(`已重置 ${response.retried} 个失败任务`, 'success');
        setTimeout(() => loadStats(), 500);
      } else {
        updateStatus(response?.error || '重试失败', 'error');
      }
    } catch (error) {
      console.error('[Popup] 重试失败:', error);
      updateStatus('重试失败，请重试', 'error');
    }
  });

  resetBtn.addEventListener('click', async () => {
    if (!confirm('确定要重置所有图片状态吗？这将使所有图片重新变为待处理状态。')) {
      return;
    }

    try {
      updateStatus('正在重置...', 'info');

      const response = await sendMessageToContent('resetAll');

      if (response && response.success) {
        updateStatus(`已重置 ${response.count} 张图片`, 'success');
        setTimeout(() => loadStats(), 500);
      } else {
        updateStatus(response?.error || '重置失败', 'error');
      }
    } catch (error) {
      console.error('[Popup] 重置失败:', error);
      updateStatus('重置失败，请重试', 'error');
    }
  });

  clearBtn.addEventListener('click', async () => {
    if (!confirm('确定要清除所有数据吗？此操作不可恢复！')) {
      return;
    }

    try {
      updateStatus('正在清除...', 'info');

      const response = await sendMessageToContent('clearAll');

      if (response && response.success) {
        updateStatus('数据已清除', 'success');
        setTimeout(() => loadStats(), 500);
      } else {
        updateStatus(response?.error || '清除失败', 'error');
      }
    } catch (error) {
      console.error('[Popup] 清除失败:', error);
      updateStatus('清除失败，请重试', 'error');
    }
  });

  async function loadConfig() {
    try {
      const response = await sendMessageToContent('getConfig');

      if (response && response.success && response.config) {
        const config = response.config;

        document.getElementById('promptText').value = config.prompt?.text || '';
        document.getElementById('maxRetries').value = config.retry?.maxRetries || 3;
        document.getElementById('retryDelay').value = config.retry?.retryDelay || 5000;
        document.getElementById('exponentialBackoff').checked = config.retry?.exponentialBackoff !== false;
        document.getElementById('waitAfterUpload').value = config.timing?.waitAfterUpload || 3;
        document.getElementById('waitAfterGenerate').value = config.timing?.waitAfterGenerate || 3;
        document.getElementById('waitAfterRemove').value = config.timing?.waitAfterRemove || 3;
        document.getElementById('waitAfter4K').value = config.timing?.waitAfter4K || 3;
        document.getElementById('generateTimeout').value = config.timing?.generateTimeout || 300;
        document.getElementById('downloadTimeout').value = config.timing?.downloadTimeout || 60;
        document.getElementById('stopOnError').checked = config.automation?.stopOnError !== false;
        document.getElementById('maxConsecutiveErrors').value = config.automation?.maxConsecutiveErrors || 5;
        document.getElementById('pauseBetweenTasks').value = config.automation?.pauseBetweenTasks || 2;
        document.getElementById('filenamePrefix').value = config.download?.filenamePrefix || 'runway_';
        document.getElementById('includeTimestamp').checked = config.download?.includeTimestamp !== false;
        document.getElementById('includeRandom').checked = config.download?.includeRandom !== false;

        renderTemplates(config.prompt?.templates || []);
      }
    } catch (error) {
      console.error('[Popup] 加载配置失败:', error);
    }
  }

  function renderTemplates(templates) {
    const templateList = document.getElementById('templateList');
    templateList.innerHTML = '';

    templates.forEach((template, index) => {
      const item = document.createElement('div');
      item.className = 'template-item';
      item.innerHTML = `
        <span class="template-name">${template.name}</span>
        <span class="template-text">${template.text}</span>
        <button class="btn-remove" data-index="${index}">×</button>
      `;
      templateList.appendChild(item);
    });

    templateList.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        await removeTemplate(index);
      });
    });
  }

  async function removeTemplate(index) {
    const response = await sendMessageToContent('getConfig');
    if (response && response.success && response.config) {
      const templates = response.config.prompt?.templates || [];
      if (index >= 0 && index < templates.length) {
        templates.splice(index, 1);
        await sendMessageToContent('setConfig', { key: 'prompt.templates', value: templates });
        renderTemplates(templates);
      }
    }
  }

  document.getElementById('savePromptBtn').addEventListener('click', async () => {
    const promptText = document.getElementById('promptText').value;
    const response = await sendMessageToContent('setConfig', { key: 'prompt.text', value: promptText });

    if (response && response.success) {
      alert('提示词已保存！');
    } else {
      alert('保存失败，请重试');
    }
  });

  document.getElementById('addTemplateBtn').addEventListener('click', async () => {
    const name = document.getElementById('templateName').value.trim();
    const text = document.getElementById('templateText').value.trim();

    if (!name || !text) {
      alert('请填写模板名称和内容');
      return;
    }

    const response = await sendMessageToContent('getConfig');
    if (response && response.success && response.config) {
      const templates = response.config.prompt?.templates || [];
      templates.push({ name, text });

      const saveResponse = await sendMessageToContent('setConfig', { key: 'prompt.templates', value: templates });

      if (saveResponse && saveResponse.success) {
        renderTemplates(templates);
        document.getElementById('templateName').value = '';
        document.getElementById('templateText').value = '';
        alert('模板已添加！');
      }
    }
  });

  document.getElementById('saveConfigBtn').addEventListener('click', async () => {
    const config = {
      retry: {
        maxRetries: parseInt(document.getElementById('maxRetries').value),
        retryDelay: parseInt(document.getElementById('retryDelay').value),
        exponentialBackoff: document.getElementById('exponentialBackoff').checked
      },
      timing: {
        waitAfterUpload: parseInt(document.getElementById('waitAfterUpload').value),
        waitAfterGenerate: parseInt(document.getElementById('waitAfterGenerate').value),
        waitAfterRemove: parseInt(document.getElementById('waitAfterRemove').value),
        waitAfter4K: parseInt(document.getElementById('waitAfter4K').value),
        generateTimeout: parseInt(document.getElementById('generateTimeout').value),
        downloadTimeout: parseInt(document.getElementById('downloadTimeout').value)
      },
      automation: {
        stopOnError: document.getElementById('stopOnError').checked,
        maxConsecutiveErrors: parseInt(document.getElementById('maxConsecutiveErrors').value),
        pauseBetweenTasks: parseInt(document.getElementById('pauseBetweenTasks').value)
      },
      download: {
        filenamePrefix: document.getElementById('filenamePrefix').value,
        includeTimestamp: document.getElementById('includeTimestamp').checked,
        includeRandom: document.getElementById('includeRandom').checked
      }
    };

    let success = true;
    for (const [key, value] of Object.entries(config)) {
      const response = await sendMessageToContent('setConfig', { key, value });
      if (!response || !response.success) {
        success = false;
      }
    }

    if (success) {
      alert('配置已保存！');
    } else {
      alert('部分配置保存失败，请重试');
    }
  });

  document.getElementById('resetConfigBtn').addEventListener('click', async () => {
    if (!confirm('确定要重置所有配置为默认值吗？')) {
      return;
    }

    const response = await sendMessageToContent('resetConfig');

    if (response && response.success) {
      alert('配置已重置！');
      loadConfig();
    } else {
      alert('重置失败，请重试');
    }
  });

  async function loadLogs() {
    try {
      const level = document.getElementById('logLevel').value;
      const limit = parseInt(document.getElementById('logLimit').value);

      const response = await sendMessageToContent('getLogs', { options: { level, limit } });

      if (response && response.success && response.logs) {
        renderLogs(response.logs);
      } else {
        document.getElementById('logContainer').innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">暂无日志</div>';
      }
    } catch (error) {
      console.error('[Popup] 加载日志失败:', error);
    }
  }

  function renderLogs(logs) {
    const container = document.getElementById('logContainer');

    if (logs.length === 0) {
      container.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">暂无日志</div>';
      return;
    }

    container.innerHTML = logs.map(log => `
      <div class="log-entry">
        <span class="log-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
        <span class="log-level-${log.level}">[${log.level.toUpperCase()}]</span>
        <span class="log-category">[${log.category}]</span>
        <span class="log-message">${log.message}</span>
      </div>
    `).join('');
  }

  document.getElementById('refreshLogsBtn').addEventListener('click', loadLogs);

  document.getElementById('clearLogsBtn').addEventListener('click', async () => {
    if (!confirm('确定要清除所有日志吗？')) {
      return;
    }

    const response = await sendMessageToContent('clearLogs');

    if (response && response.success) {
      alert('日志已清除！');
      loadLogs();
    }
  });

  document.getElementById('exportLogsBtn').addEventListener('click', async () => {
    try {
      const response = await sendMessageToContent('getLogs', { options: {} });

      if (response && response.success && response.logs) {
        const json = JSON.stringify(response.logs, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `autorunway_logs_${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('[Popup] 导出日志失败:', error);
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'IMAGE_STATS_UPDATED') {
      updateStatsDisplay(message.stats);
      updateProgress(message.stats.completed, message.stats.total);
      updateStatus('统计已更新', 'success');
    }
  });

  loadStats();
});

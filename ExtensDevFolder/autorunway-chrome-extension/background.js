// background.js
// 处理后台任务和API调用

let pendingDownloads = {};

chrome.downloads.onChanged.addListener((downloadDelta) => {
  const id = downloadDelta.id;
  const download = pendingDownloads[id];

  if (!download) return;

  console.log('[Downloads] 下载状态变化:', downloadDelta.state?.current, downloadDelta.filename);

  if (downloadDelta.state?.current === 'complete') {
    console.log('[Downloads] ✅ 下载完成:', download.filename);
    chrome.tabs.sendMessage(download.tabId, {
      action: 'downloadComplete',
      downloadId: id,
      filename: downloadDelta.filename?.current || download.filename,
      path: download.path
    });
    delete pendingDownloads[id];
  } else if (downloadDelta.error) {
    console.log('[Downloads] ❌ 下载失败:', downloadDelta.error.current);
    chrome.tabs.sendMessage(download.tabId, {
      action: 'downloadError',
      downloadId: id,
      error: downloadDelta.error.current
    });
    delete pendingDownloads[id];
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'connect') {
    console.log('[Background] 尝试连接到 Tauri 应用');
    fetch('http://localhost:30008/api/connect')
      .then(response => {
        console.log('[Background] 收到响应，状态码:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('[Background] 解析响应数据:', data);
        if (data.success) {
          sendResponse({ success: true, message: data.message });
        } else {
          sendResponse({ success: false, error: data.message || '连接失败' });
        }
      })
      .catch(error => {
        console.error('[Background] 连接错误:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  } else if (request.action === 'auto-run') {
    console.log('[Background] 查询自动运行状态');
    fetch('http://localhost:30008/api/auto-run')
      .then(response => {
        console.log('[Background] 收到自动运行状态响应，状态码:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('[Background] 解析自动运行状态数据:', data);
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        console.error('[Background] 自动运行状态查询错误:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  } else if (request.action === 'checkAutoRun') {
    fetch('http://localhost:30008/api/auto-run')
      .then(response => response.json())
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  } else if (request.action === 'getImage') {
    console.log('[Background] 收到getImage请求', new Date().toISOString());
    fetch('http://localhost:30008/api/get-image')
      .then(response => {
        console.log('[Background] 收到API响应', new Date().toISOString(), response.status);
        return response.json();
      })
      .then(data => {
        console.log('[Background] 解析数据完成', new Date().toISOString(), data.success);
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        console.error('[Background] getImage错误', new Date().toISOString(), error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  } else if (request.action === 'markDownloaded') {
    fetch('http://localhost:30008/api/mark-downloaded', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: request.path })
    })
      .then(response => response.json())
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  } else if (request.action === 'downloadVideo') {
    const url = request.url;
    const imagePath = request.filename || `video_${Date.now()}.mp4`;
    const filename = imagePath.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    
    console.log('[Background] 开始下载视频:', url);
    console.log('[Background] 请求的文件名:', filename);

    async function doDownload(folderPath) {
      let fullFilename = filename;
      if (folderPath) {
        const cleanFolder = folderPath.replace(/[^a-zA-Z0-9_/\\-]/g, '_').replace(/\\+$/, '');
        fullFilename = cleanFolder + '/' + filename;
      }
      
      console.log('[Background] folderPath:', folderPath);
      console.log('[Background] fullFilename:', fullFilename);

      const downloadOptions = {
        url: url,
        saveAs: false,
        headers: [
          { name: 'Referer', value: 'https://app.runwayml.com/' }
        ]
      };
      
      if (fullFilename) {
        downloadOptions.filename = fullFilename;
      }

      console.log('[Background] downloadOptions:', JSON.stringify(downloadOptions, (key, value) => value === undefined ? 'undefined' : value, 2));

      chrome.downloads.download(downloadOptions, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('[Background] 下载错误:', chrome.runtime.lastError.message);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('[Background] 下载已创建, ID:', downloadId);

          pendingDownloads[downloadId] = {
            url: url,
            filename: filename,
            tabId: sender.tab?.id,
            path: null
          };

          sendResponse({ success: true, downloadId: downloadId });
        }
      });
    }

    fetch('http://localhost:30008/api/folder-path')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.path) {
          doDownload(data.path);
        } else {
          doDownload(null);
        }
      })
      .catch(() => doDownload(null));

    return true;
  }
});

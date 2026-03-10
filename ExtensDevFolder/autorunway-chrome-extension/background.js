// background.js - 后台服务（简化版）
// 处理扩展的后台任务和生命周期管理

console.log('[Autorunway] Background service worker started');

// 监听扩展安装/更新事件
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Autorunway] 扩展已安装/更新:', details.reason);
  
  if (details.reason === 'install') {
    // 首次安装，初始化存储
    chrome.storage.local.set({
      version: '2.0.0',
      installedAt: new Date().toISOString()
    });
  } else if (details.reason === 'update') {
    // 版本更新
    console.log('[Autorunway] 从版本', details.previousVersion, '更新到新版本');
  }
});

// 监听消息（预留扩展功能）
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Autorunway] Background 收到消息:', request);
  
  // 目前所有逻辑都在 content script 中处理
  // 这里预留未来可能需要的 background 功能
  
  sendResponse({ success: false, error: '未实现的操作' });
  return true;
});

// Service Worker 激活事件
self.addEventListener('activate', () => {
  console.log('[Autorunway] Service Worker 已激活');
});

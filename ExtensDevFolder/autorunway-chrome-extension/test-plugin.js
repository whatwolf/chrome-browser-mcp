// 测试脚本 - 验证插件基本功能

console.log('=== Autorunway 插件测试 ===\n');

// 1. 检查 ImageManager 是否可用
console.log('1. 检查 ImageManager...');
if (typeof window.imageManager !== 'undefined') {
  console.log('✅ ImageManager 已加载');
} else {
  console.log('❌ ImageManager 未加载');
}

// 2. 检查 IndexedDB 支持
console.log('\n2. 检查 IndexedDB 支持...');
if (typeof indexedDB !== 'undefined') {
  console.log('✅ IndexedDB 可用');
} else {
  console.log('❌ IndexedDB 不可用');
}

// 3. 检查 File System Access API
console.log('\n3. 检查 File System Access API...');
if (typeof window.showDirectoryPicker !== 'undefined') {
  console.log('✅ File System Access API 可用');
} else {
  console.log('❌ File System Access API 不可用');
}

// 4. 检查 chrome.storage
console.log('\n4. 检查 chrome.storage...');
if (typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined') {
  console.log('✅ chrome.storage 可用');
} else {
  console.log('❌ chrome.storage 不可用');
}

// 5. 检查 DataTransfer API
console.log('\n5. 检查 DataTransfer API...');
if (typeof DataTransfer !== 'undefined') {
  console.log('✅ DataTransfer API 可用');
} else {
  console.log('❌ DataTransfer API 不可用');
}

console.log('\n=== 测试完成 ===');

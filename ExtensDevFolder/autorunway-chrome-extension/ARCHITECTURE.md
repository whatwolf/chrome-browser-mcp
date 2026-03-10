# Autorunway 架构设计说明

## 📋 设计问题解答

### 1. 下载方案：插件 vs 独立下载器

**✅ 选择：使用插件下载**

#### 为什么选择插件？

| 考虑因素 | 插件方案 | 独立下载器 |
|---------|---------|-----------|
| **认证处理** | ✅ 自动继承页面认证<br>（浏览器自动添加 cookies 和请求头） | ❌ 需要从插件提取请求头<br>需要额外的进程间通信 |
| **错误重试** | ✅ 内置重试逻辑（已实现） | ⚠️ 需要独立实现 |
| **集成度** | ✅ 与生成流程无缝衔接 | ❌ 需要协调两个进程 |
| **复杂度** | ✅ 低（单一代码库） | ❌ 高（需要 IPC 通信） |
| **性能** | ✅ 串行下载（足够用） | ✅ 并行下载（但不是必须） |

#### 下载重试机制（已实现）

```javascript
async function downloadVideo(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 使用 fetch 下载（自动带认证信息）
      const response = await fetch(url, {
        credentials: 'include' // 包含 cookies
      });
      
      // 验证下载内容
      if (blob.size === 0) throw new Error('文件为空');
      
      return true; // 成功
      
    } catch (error) {
      // 指数退避重试：2s, 4s, 8s
      const waitTime = Math.pow(2, attempt) * 1000;
      await new Promise(r => setTimeout(r, waitTime));
    }
  }
  return false; // 失败
}
```

**重试策略：**
- ✅ 最多重试 3 次
- ✅ 指数退避（避免快速连续失败）
- ✅ 验证文件大小（避免下载空文件）
- ✅ 详细的错误日志

---

### 2. File System Access API 权限

**✅ 只在首次选择文件夹时需要手动点击**

#### 权限生命周期

```
用户操作流程：
1. 点击"选择图片文件夹"按钮 ← 需要用户交互
2. 选择文件夹 ← 用户手动选择
3. 浏览器弹出权限请求 ← 需要用户点击"允许"
4. 权限已授予 ✅

后续使用：
✅ 自动读取文件夹（无需再次授权）
✅ 权限持久化（保存在浏览器中）
✅ 每次页面加载自动验证权限

权限过期：
⚠️ 几周后可能需要重新授权（浏览器安全策略）
⚠️ 权限失效时会自动提示用户重新选择
```

#### 权限验证代码

```javascript
// 加载时自动检查权限
async loadFolderHandle() {
  const result = await chrome.storage.local.get(['folderHandle']);
  if (result.folderHandle) {
    const permission = await folderHandle.queryPermission({ mode: 'read' });
    
    if (permission === 'granted') {
      console.log('✅ 权限有效，可以直接使用');
      return true;
    } else {
      console.warn('⚠️ 权限已失效，需要重新授权');
      return false;
    }
  }
}

// 使用时再次验证
async function getImage() {
  const hasPermission = await imageManager.checkPermission();
  if (!hasPermission) {
    alert('文件夹权限已失效，请重新选择');
    return false;
  }
  // 继续处理...
}
```

---

### 3. 图片 Base64 内存使用

**✅ 按需加载，不使用 Base64**

#### 内存优化策略

```javascript
// ❌ 错误做法（预先加载所有图片到内存）
const allImages = [];
for (const entry of folder) {
  const file = await entry.getFile();
  const base64 = await fileToBase64(file); // 占用大量内存
  allImages.push(base64);
}

// ✅ 正确做法（按需读取，直接使用 File 对象）
const image = await getNextPendingImage(); // 只获取下一张
const file = await image.fileHandle.getFile(); // 只在需要时读取
dataTransfer.items.add(file); // 直接使用 File 对象
```

#### 内存使用对比

| 方案 | 100 张图片（每张 5MB） | 实际占用 |
|------|---------------------|---------|
| 预先加载 Base64 | 500MB | ❌ 全部占用 |
| 按需读取 File | 5MB | ✅ 只占用当前处理的 1 张 |

#### 实现细节

```javascript
// ImageManager 只存储文件句柄（不占用内存）
{
  name: "image1.jpg",
  fileHandle: FileSystemFileHandle, // 只是引用，不是文件内容
  status: "pending",
  timestamp: 1234567890
}

// 只在点击"贴入图片"时才读取文件内容
async function getImage() {
  const image = await getNextPendingImage(); // 获取句柄
  const file = await image.fileHandle.getFile(); // 此时才读取到内存
  dataTransfer.items.add(file); // 立即使用
  // 函数结束后 file 对象会被 GC 回收
}
```

---

## 🏗️ 整体架构

### 数据流

```
用户选择文件夹
    ↓
File System Access API 授权
    ↓
存储文件夹句柄 (chrome.storage)
    ↓
扫描文件夹 → 保存文件句柄列表 (IndexedDB)
    ↓
[等待用户操作]
    ↓
点击"贴入图片"
    ↓
检查权限是否有效
    ↓
读取下一张图片的文件句柄 (IndexedDB)
    ↓
将文件加载到内存 (File 对象)
    ↓
使用 DataTransfer 模拟拖放
    ↓
Runway 检测到文件 → 启用 Generate 按钮
    ↓
自动点击 Generate → 开始生成
    ↓
监控生成进度 → 等待完成
    ↓
点击 4K 升级
    ↓
等待 4K 完成
    ↓
下载视频（带重试机制）
    ↓
标记图片为已完成 (IndexedDB)
    ↓
[循环处理下一张]
```

### 存储结构

```javascript
// chrome.storage.local（持久化配置）
{
  folderHandle: FileSystemDirectoryHandle, // 文件夹句柄
  version: "2.0.0",
  installedAt: "2024-01-01T00:00:00.000Z"
}

// IndexedDB（图片列表和状态）
Database: AutorunwayDB
└── Store: images
    ├── key: "image1.jpg"
    │   ├── name: "image1.jpg"
    │   ├── fileHandle: FileSystemFileHandle
    │   ├── size: 5242880
    │   ├── status: "completed" // pending/processing/completed/failed
    │   └── timestamp: 1234567890
    └── ...
```

---

## 🔒 安全性

### 权限最小化

```json
{
  "permissions": [
    "activeTab",      // 只在活动标签页运行
    "storage",        // 保存配置和句柄
    "downloads"       // 下载视频
  ],
  "host_permissions": [
    "https://app.runwayml.com/*"  // 只在 Runway 域名运行
  ]
}
```

### 数据安全

- ✅ 所有数据存储在本地（IndexedDB + chrome.storage）
- ✅ 不上传任何数据到外部服务器
- ✅ 文件夹权限受浏览器保护
- ✅ 用户可随时撤销权限

---

## 📊 性能优化

### 1. 内存管理

```javascript
// ✅ 只加载当前处理的图片
const file = await image.fileHandle.getFile(); // 读取到内存
dataTransfer.items.add(file);                  // 立即使用
// 函数结束后自动被 GC 回收

// ❌ 避免预先加载
const allFiles = await Promise.all(
  images.map(img => img.fileHandle.getFile()) // 一次性加载所有文件
);
```

### 2. 存储优化

```javascript
// ✅ 只存储文件句柄（几十字节）
{
  name: "image.jpg",
  fileHandle: FileSystemFileHandle, // 引用，不是内容
  status: "pending"
}

// ❌ 不存储文件内容
{
  name: "image.jpg",
  content: "base64...", // 几 MB
  status: "pending"
}
```

### 3. 批量操作

```javascript
// ✅ 使用事务批量写入 IndexedDB
const transaction = db.transaction(['images'], 'readwrite');
const store = transaction.objectStore('images');
images.forEach(image => store.put(image));
transaction.oncomplete = () => console.log('批量写入完成');
```

---

## 🎯 最佳实践

### 1. 错误处理

```javascript
try {
  const file = await image.fileHandle.getFile();
} catch (error) {
  if (error.name === 'NotFoundError') {
    // 文件已被删除
    await updateImageStatus(image.name, 'failed');
  } else if (error.name === 'NotAllowedError') {
    // 权限已失效
    alert('请重新选择文件夹');
  }
}
```

### 2. 用户体验

```javascript
// ✅ 显示详细的状态
statusDiv.text(`图片：${completed}/${total}`);

// ✅ 提供清晰的错误提示
if (!hasPermission) {
  alert('文件夹权限已失效，请点击"选择图片文件夹"重新选择');
}

// ✅ 显示处理进度
console.log(`正在处理：${image.name} (${current}/${total})`);
```

### 3. 重试策略

```javascript
// ✅ 指数退避（避免快速连续失败）
const delays = [2000, 4000, 8000]; // 2s, 4s, 8s
for (let i = 0; i < delays.length; i++) {
  try {
    await download();
    break;
  } catch (error) {
    await sleep(delays[i]);
  }
}
```

---

## 📈 扩展性

### 未来可能的优化

1. **并行下载**：同时下载多个视频（需要控制并发数）
2. **断点续传**：使用 Downloads API 支持暂停/恢复
3. **批量操作**：支持选择多个文件夹
4. **进度追踪**：显示下载进度条
5. **自动分类**：根据图片文件夹自动命名视频

---

## 📝 总结

### 设计决策

| 问题 | 选择 | 理由 |
|------|------|------|
| 下载方案 | 插件下载 | 自动认证、集成度高、简单可靠 |
| 重试机制 | 插件内实现 | 无需额外通信、易于调试 |
| 文件夹权限 | 首次授权 | 符合安全要求、用户体验好 |
| 图片加载 | 按需读取 | 节省内存、使用 File 对象 |
| 存储方式 | IndexedDB | 大容量、支持索引、事务安全 |

### 核心优势

✅ **零后端依赖** - 完全在浏览器中运行  
✅ **自动认证** - 继承页面 cookies 和请求头  
✅ **内存优化** - 按需加载、即时释放  
✅ **错误重试** - 指数退避、详细日志  
✅ **权限安全** - 最小权限、用户可控  

这个设计在**简单性**、**可靠性**和**性能**之间取得了良好平衡！

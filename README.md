# ChromeDev Assistant - Chrome插件开发辅助工具

通过 MCP 协议让 IDE AI 充分理解网页，实现智能化的 Chrome 插件开发体验。

## 🎯 核心价值

- **网页理解**: AI 可以完整理解目标网页的 DOM 结构、JS 逻辑、网络请求
- **实时调试**: 在 IDE 中直接执行代码并观察浏览器变化
- **自动化测试**: 自动运行测试用例，验证插件功能
- **智能开发**: 配合 exten-coder 智能体，实现"理解网页 → 生成代码 → 自动测试 → 验证效果"的闭环

## 🚀 快速开始

### 前置要求

- Node.js 18+
- Chrome 浏览器
- Trae IDE（或其他支持 MCP 的 IDE）

### 一键启动

```bash
./start.sh
```

启动脚本会自动：
1. ✅ 安装依赖（首次运行）
2. ✅ 启动 Native Bridge 服务
3. ✅ 检查服务健康状态
4. ✅ 显示配置说明

### 手动启动步骤

#### 1. 安装依赖

```bash
cd extDevToolServer/native-bridge
npm install

cd ../mcp-server
npm install
```

#### 2. 启动 Native Bridge

```bash
cd extDevToolServer/native-bridge
npm start
```

服务运行在 `http://localhost:8080`

#### 3. 加载 Chrome 扩展

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `extDevToolServer/extension` 目录
6. 复制扩展 ID（后续配置需要）

#### 4. 配置 Native Messaging

编辑配置文件：
```bash
vim ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.chromedev.assistant.json
```

将 `YOUR_EXTENSION_ID_HERE` 替换为实际的扩展 ID。

#### 5. 配置 IDE MCP

在 Trae IDE 中添加 MCP Server 配置：

```json
{
  "mcpServers": {
    "ChromeDev Assistant": {
      "command": "node",
      "args": ["/Volumes/workspace/codespace/extenDevTools/extDevToolServer/mcp-server/dist/index.js"]
    }
  }
}
```

## 💡 使用方式

### 方式一：配合 exten-coder 智能体（推荐）

#### 1. 配置智能体

在 Trae IDE 中创建 exten-coder 智能体：
- 系统提示词：使用 [extDevToolServer/exten-coder-agent-prompt.md](extDevToolServer/exten-coder-agent-prompt.md)
- MCP 工具：ChromeDev Assistant + Chrome DevTools MCP

#### 2. 开发插件

**创建新插件**：
```
用户：帮我开发一个自动填充表单的Chrome扩展

智能体会：
1. 使用 ChromeDev Assistant 采集目标页面数据
2. 分析表单结构和字段
3. 在 ExtensDevFolder 下创建新项目
4. 生成完整的插件代码
5. 使用 MCP 工具自动测试功能
```

**调试问题**：
```
用户：我的插件注入失败，帮我排查

智能体会：
1. 使用 Chrome DevTools MCP 查看 Console 日志
2. 使用 ChromeDev Assistant 执行调试脚本
3. 定位问题原因
4. 提供修复方案
5. 验证修复效果
```

**性能优化**：
```
用户：优化我的插件性能

智能体会：
1. 使用 Chrome DevTools MCP 进行 Lighthouse 审计
2. 分析网络请求和 DOM 操作
3. 提供优化建议
4. 实施优化方案
5. 验证优化效果
```

### 方式二：直接使用 MCP 工具

在 IDE 中直接调用 MCP 工具：

#### collectPageData - 采集页面数据

```json
{
  "tabId": 0,
  "includeDOM": true,
  "includeConsole": true,
  "includeStorage": true,
  "screenshot": false
}
```

**用途**：
- 分析目标网页的 DOM 结构
- 查看页面存储的数据
- 获取 Console 日志
- 了解页面的网络请求

#### executeScript - 执行 JavaScript

```json
{
  "tabId": 0,
  "code": "document.querySelectorAll('form').length",
  "captureConsole": true,
  "timeout": 30000
}
```

**用途**：
- 测试插件功能
- 调试页面交互
- 验证 DOM 操作
- 收集页面数据

#### getConsoleLogs - 获取 Console 日志

```json
{
  "tabId": 0
}
```

**用途**：
- 查看页面错误信息
- 监控插件输出
- 调试问题

#### captureScreenshot - 页面截图

```json
{
  "tabId": 0
}
```

**用途**：
- 记录页面状态
- 验证 UI 效果
- 生成文档素材

#### navigate - 页面导航

```json
{
  "tabId": 0,
  "url": "https://example.com"
}
```

**用途**：
- 测试多页面场景
- 自动化测试流程

#### reload - 重新加载页面

```json
{
  "tabId": 0,
  "bypassCache": false
}
```

**用途**：
- 刷新页面状态
- 测试插件重新加载

#### ping - 测试连接

```json
{}
```

**用途**：
- 验证 MCP 服务是否正常
- 检查扩展是否加载

## 📁 项目结构

```
extenDevTools/
├── start.sh                              # 一键启动脚本
├── README.md                             # 本文件
├── ExtensDevFolder/                      # 插件开发工作区
│   └── your-plugin-project/              # 你的插件项目
└── extDevToolServer/                     # 服务器代码
    ├── extension/                        # Chrome 扩展
    │   ├── manifest.json                # 扩展清单
    │   ├── background.js                # Service Worker
    │   ├── content.js                   # 内容脚本
    │   ├── native-messaging.js          # Native Messaging
    │   ├── page-inspector.js            # 页面采集器
    │   └── script-executor.js           # 脚本执行器
    ├── mcp-server/                       # MCP Server
    │   ├── src/index.ts                 # 主程序
    │   └── dist/                        # 编译输出
    ├── native-bridge/                    # Native Messaging 桥接
    │   ├── src/index.ts                 # HTTP Server
    │   └── dist/                        # 编译输出
    ├── scripts/                          # 工具脚本
    │   └── install.sh                   # 安装脚本
    ├── README.md                        # 服务器文档
    ├── DOCUMENTATION.md                 # 文档结构说明
    ├── product-spec.md                  # 产品规格
    ├── exten-coder-agent-prompt.md      # 智能体提示词
    └── exten-coder-invoke-guide.md      # 智能体调用指南
```

## 🎓 使用场景

### 场景1：开发新插件

```
1. 用户：我想开发一个自动填充登录表单的插件
2. 智能体：使用 ChromeDev Assistant 采集目标登录页面
3. 智能体：分析表单字段和验证逻辑
4. 智能体：在 ExtensDevFolder 创建新项目
5. 智能体：生成 manifest.json、content script、popup 等文件
6. 智能体：使用 Chrome DevTools MCP 测试填充功能
7. 智能体：验证功能是否正常
```

### 场景2：调试现有插件

```
1. 用户：我的插件在某些页面不工作
2. 智能体：使用 Chrome DevTools MCP 查看 Console 错误
3. 智能体：使用 ChromeDev Assistant 采集问题页面数据
4. 智能体：分析 DOM 结构差异
5. 智能体：定位问题并提供修复方案
6. 智能体：使用 MCP 工具验证修复效果
```

### 场景3：优化插件性能

```
1. 用户：优化我的插件性能
2. 智能体：使用 Chrome DevTools MCP 进行 Lighthouse 审计
3. 智能体：分析网络请求和资源加载
4. 智能体：检查 DOM 操作频率
5. 智能体：提供优化建议（懒加载、事件委托等）
6. 智能体：实施优化方案
7. 智能体：验证性能提升效果
```

### 场景4：自动化测试

```
1. 用户：帮我测试插件的表单提交功能
2. 智能体：使用 Chrome DevTools MCP 导航到目标页面
3. 智能体：使用 executeScript 填充表单
4. 智能体：模拟点击提交按钮
5. 智能体：使用 ChromeDev Assistant 验证提交结果
6. 智能体：生成测试报告
```

## 🔧 故障排查

### 服务启动失败

**症状**：`./start.sh` 执行失败

**排查步骤**：
1. 检查 Node.js 版本：`node --version`（需要 18+）
2. 检查端口占用：`lsof -i :8080`
3. 查看详细错误：`cd extDevToolServer/native-bridge && npm start`
4. 重新安装依赖：`rm -rf node_modules && npm install`

### Chrome 扩展无法连接

**症状**：MCP 工具调用失败

**排查步骤**：
1. 确认扩展已加载：访问 `chrome://extensions/`
2. 检查扩展 ID 是否正确
3. 验证 Native Messaging 配置：
   ```bash
   cat ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.chromedev.assistant.json
   ```
4. 查看 Chrome 控制台日志：扩展详情 → 查看 Service Worker

### MCP Server 无响应

**症状**：IDE 中调用工具超时

**排查步骤**：
1. 检查 Native Bridge 是否运行：
   ```bash
   curl http://localhost:8080/health
   ```
2. 验证 MCP Server 路径是否正确
3. 查看 MCP Server 日志输出
4. 重启服务：`./start.sh`

### 页面数据采集失败

**症状**：collectPageData 返回空数据

**排查步骤**：
1. 确认当前标签页已加载完成
2. 检查扩展权限设置
3. 查看 Chrome DevTools Console 是否有错误
4. 尝试刷新页面后重新采集

## 📚 更多文档

### 核心文档
- [服务器 README](extDevToolServer/README.md) - 服务器详细文档
- [产品规格](extDevToolServer/product-spec.md) - 功能设计和架构
- [文档结构](extDevToolServer/DOCUMENTATION.md) - 文档导航

### 智能体文档
- [exten-coder 提示词](extDevToolServer/exten-coder-agent-prompt.md) - 智能体系统提示词
- [智能体调用指南](extDevToolServer/exten-coder-invoke-guide.md) - 何时调用智能体

## 🛠️ 技术栈

- **Chrome Extension**: Manifest V3
- **MCP Server**: TypeScript + @modelcontextprotocol/sdk
- **通信协议**: Native Messaging / HTTP Bridge
- **运行环境**: Node.js 18+

## 🤝 配合 exten-coder 智能体

本工具设计为与 exten-coder 智能体配合使用，实现智能化的插件开发流程：

1. **智能体配置**：使用提供的提示词创建智能体
2. **MCP 工具**：智能体自动调用 ChromeDev Assistant 和 Chrome DevTools MCP
3. **自动化流程**：智能体实现"理解→开发→测试→验证"的闭环
4. **项目规范**：智能体遵循 ExtensDevFolder 目录结构规范

## 📝 许可证

MIT

## 🙋 常见问题

**Q: 这个工具适合谁使用？**
A: 适合需要开发 Chrome 插件的开发者，特别是希望借助 AI 提升开发效率的用户。

**Q: 必须使用 exten-coder 智能体吗？**
A: 不是必须的。你可以直接在 IDE 中调用 MCP 工具，但配合智能体会获得更好的体验。

**Q: 支持哪些浏览器？**
A: 目前仅支持 Chrome 浏览器（Chromium 内核）。

**Q: 插件开发项目放在哪里？**
A: 所有插件项目都应该放在 `ExtensDevFolder` 目录下，每个子目录是一个独立的插件项目。

**Q: 如何更新工具？**
A: 拉取最新代码后，重新运行 `./start.sh` 即可。

---

**开始你的智能插件开发之旅吧！** 🚀
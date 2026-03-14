// build/afterSign.js
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 加载环境变量
if (process.env.CI !== 'true') {
  require('dotenv').config();
}

exports.default = async function (context) {
  const { appOutDir, packager } = context;
  const appName = packager.appInfo.productFilename + ".app";
  const appPath = path.join(appOutDir, appName);
  const identity = packager.platformSpecificBuildOptions.identity;

  if (!identity) {
    console.log('[afterSign] 签名身份未配置，跳过。');
    return;
  }

  const parentEntitlements = 'build/entitlements.mac.plist';
  const childEntitlements = 'build/entitlements.mac.inherit.plist';

  if (!fs.existsSync(parentEntitlements) || !fs.existsSync(childEntitlements)) {
    console.error('[afterSign] Entitlements 文件不存在！');
    process.exit(1);
  }

  console.log(`[afterSign] 开始对 ${appPath} 进行分层强制重新签名...`);

  // --- 步骤 1: 签名所有非 Framework 内部的文件 ---
  const findFilesCmd = `find "${appPath}" -type f \\( -name "*.node" -o -perm +111 \\)`;
  const allFiles = execSync(findFilesCmd).toString().trim().split('\n');

  const filesToSign = allFiles.filter(file => !file.includes('.framework/'));

  for (const filePath of filesToSign) {
    const entitlements = filePath.endsWith(appName + '/Contents/MacOS/' + packager.appInfo.productFilename)
      ? parentEntitlements
      : childEntitlements;

    console.log(`[afterSign] 签名文件: ${path.basename(filePath)}`);
    try {
      execSync(`codesign --sign "${identity}" --force --options runtime --entitlements "${entitlements}" "${filePath}"`);
    } catch (error) {
      console.error(`[afterSign] 签名失败: ${filePath}`, error);
      process.exit(1);
    }
  }

  // --- 步骤 2: 签名所有的 Frameworks ---
  // Frameworks 必须作为一个整体来签名
  const findFrameworksCmd = `find "${appPath}" -depth -name "*.framework"`;
  const frameworksToSign = execSync(findFrameworksCmd).toString().trim().split('\n').filter(Boolean);

  for (const frameworkPath of frameworksToSign) {
    console.log(`[afterSign] 签名 Framework: ${path.basename(frameworkPath)}`);
    try {
      execSync(`codesign --sign "${identity}" --force --options runtime --entitlements "${childEntitlements}" "${frameworkPath}"`);
    } catch (error) {
      console.error(`[afterSign] 签名失败: ${frameworkPath}`, error);
      process.exit(1);
    }
  }
  
  // --- 步骤 3: 签名整个 App ---
  // 最后对整个 App 包进行签名，确保顶层签名正确
  console.log(`[afterSign] 签名顶层 App: ${appName}`);
  try {
    execSync(`codesign --sign "${identity}" --force --options runtime --entitlements "${parentEntitlements}" "${appPath}"`);
  } catch(error) {
    console.error(`[afterSign] 签名顶层 App 失败: ${appPath}`, error);
    process.exit(1);
  }


  // --- 步骤 4: 最终验证 ---
  console.log('\n[afterSign] 开始最终签名验证...');
  try {
    execSync(`codesign --verify --deep --strict --verbose=4 "${appPath}"`);
    console.log('[afterSign] 最终签名验证成功！');
  } catch (error) {
    console.error('[afterSign] 最终签名验证失败！', error);
    process.exit(1);
  }
};
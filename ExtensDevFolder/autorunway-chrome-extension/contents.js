// contents.js
// 页面内容脚本

$(document).ready(() => {

  const delFirstHeader = $('div[class^="unifiedHeader-"]');
  delFirstHeader.remove();

  // 创建容器
  const container = $('<div class="autorunway-container"></div>');


  // 创建请求图片按钮
  const getImageBtn = $('<button class="autorunway-btn autorunway-btn-secondary">贴入图片</button>');



  // 创建状态显示
  const statusDivConnect = $('<div id="statusDivConnect" class="autorunway-status">状态: 未连接</div>');
  const statusDivAutoRun = $('<div id="statusDivAutoRun" class="autorunway-status">状态: 未连接</div>');

  // 创建generateIt按钮
  const generateItBtn = $('<button id="generateItBtn" class="autorunway-btn">Generate It</button>');
  const autoRunBtn = $('<button class="autorunway-btn autorunway-btn-secondary">自动运行</button>');

  const $filename = $('<input type=hidden id="filename_for_tauri" value="">');


  // 为generateIt按钮添加点击事件
  generateItBtn.click(async () => {
    console.log('✅ Generate It按钮点击成功');

    // 查找并点击文本输入框
    if (await inputText()) {
      console.log('✅ 文本输入框已输入');
    } else {
      console.log('⚠️ 文本输入框未输入');
      return false;
    }
    await awaitseconds(3);
    if (await generatebuttonclick()) {
      console.log('✅ Generate按钮点击成功');
    } else {
      console.log('⚠️ Generate按钮点击失败');
      return false;
    }
    await awaitseconds(3);
    if (await removeimage()) { //移除上传的图片
      console.log('✅ 移除图片成功');
    } else {
      console.log('⚠️ 移除图片失败');
      return false;
    }
    await awaitseconds(3);

    if (await await4kbuttonandclick()) {
      console.log('✅ 4K按钮点击成功');
    } else {
      console.log('⚠️ 4K按钮点击失败');
      return false;
    }

    if (await download4K()) {
      console.log('✅ 点击4K下载成功');
    } else {
      console.log('⚠️ 点击4K下载失败');
      return false;
    }

    if (await hidevideo()) { //删除4k视频
      console.log('✅ 删除4k视频成功');
    } else {
      console.log('⚠️ 删除4k视频失败');
      return false;
    }

    return true;
  })

  getImageBtn.click(() => { getImage() });
  autoRunBtn.click(() => { autoRunway() });

  // 添加元素到容器
  container.append(getImageBtn);
  container.append(generateItBtn);
  container.append(autoRunBtn);
  container.append($filename);



  container.append(statusDivConnect);
  container.append(statusDivAutoRun);
  console.log('尝试清理之前的视频');
  hidevideo();
  // 添加到页面
  $('body').append(container);

  // 尝试连接到tauri-app
  console.log('[Content] 尝试连接到 Tauri 应用');
  chrome.runtime.sendMessage({ action: 'connect' }, async (response) => {
    console.log('[Content] 收到连接响应:', response);
    if (response && response.success) {
      statusDivConnect.text('状态: 已连接');
    } else {
      statusDivConnect.text('状态: 连接失败');
      if (response && response.error) {
        console.error('[Content] 连接错误详情:', response.error);
      }
    }
  });
  chrome.runtime.sendMessage({ action: 'auto-run' }, async (response) => {
    console.log('[Content] 收到自动运行状态响应:', response);
    if (response && response.success) {
      console.log('[Content] 自动运行状态数据:', response.data);
      const enabled = response.data.enabled;
      if (enabled) {
        statusDivAutoRun.text('全自动状态: 开启');
        console.log('自动运行已开启');
        console.log('等待界面加载');
        await waitForElement('button:contains("Generate")', async () => {
          console.log('界面加载完毕，准备开始....');
          await awaitseconds(3);
          await autoRunway();

        });


      } else {
        statusDivAutoRun.text('全自动状态: 关闭');
      }
    } else {
      statusDivAutoRun.text('全自动状态: 未知');
      if (response && response.error) {
        console.error('[Content] 自动运行状态查询错误详情:', response.error);
      }
    }
  });


});


// 延时
async function awaitseconds(seconds) {
  for (let i = seconds; i > 0; i--) {
    console.log(i);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return true;
}

// 等待元素出现后执行函数
async function waitForElement(elementSelector, callback, timeout = 60000) {
  // 检查元素是否已经存在
  const existingElement = $(elementSelector);
  if (existingElement.length > 0) {
    await callback();
    return true;
  }

  // 创建MutationObserver监听DOM变化
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      observer.disconnect();
      resolve(false);
    }, timeout);

    const observer = new MutationObserver(async (mutations) => {
      mutations.forEach(async (mutation) => {
        if (mutation.addedNodes) {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (node.nodeType === 1) { // 元素节点
              if ($(node).is(elementSelector)) {
                clearTimeout(timer);
                await callback();
                observer.disconnect(); // 找到元素后停止监听
                resolve(true);
                return;
              }
              // 检查子节点
              const child = $(node).find(elementSelector);
              if (child.length > 0) {
                clearTimeout(timer);
                await callback();
                observer.disconnect(); // 找到元素后停止监听
                resolve(true);
                return;
              }
            }
          }
        }
      });
    });

    // 开始监听DOM变化
    observer.observe($('body')[0], {
      childList: true,
      subtree: true
    });
  });
}



async function modelchange() {
  console.log('[modelchange] 开始选择模型', new Date().toISOString());
  const selector = $('[data-testid="select-base-model"]');
  if (selector.length > 0) {
    selector[0].click();
    console.log('[modelchange] 点击模型选择', new Date().toISOString());
  }
  await awaitseconds(1);
  const gen4Option = Array.from(document.querySelectorAll('*')).find(el =>
    el.textContent === 'Gen-4 Turbo' && el.getAttribute('role') === 'option'
  );
  if (gen4Option) {
    gen4Option.click();
    console.log('[modelchange] 点击Gen-4 Turbo', new Date().toISOString());
  }
  await awaitseconds(0.5);
  $('div[class^="centerContainer"]').click();
  await awaitseconds(0.5);
  selector[0].click();
}

async function getImage() {  //点击获取图片，检测是否成功，是否有crop，检测到Generate按钮，图片处理流程完成
  console.log('[getImage] 开始执行', new Date().toISOString());
  // 等待模型选择按钮出现后执行modelchange
  await waitForElement('[data-testid="select-base-model"]', modelchange);
  console.log('✅ 模型选择完成', new Date().toISOString());
  console.log('✅ 获取图片按钮点击成功', new Date().toISOString());

  return new Promise((resolve) => {
    console.log('[getImage] 发送getImage请求到background', new Date().toISOString());
    chrome.runtime.sendMessage({ action: 'getImage' }, async (response) => {
      console.log('[getImage] 收到响应', new Date().toISOString(), response);
      if (response.success) {
        const data = response.data;
        if (data.success) {
          console.log('[getImage] 获取图片成功:', data.path, new Date().toISOString());
          console.log('[getImage] base64长度:', data.base64?.length, new Date().toISOString());

          $('#filename_for_tauri').val(data.path);

          // 将base64数据转换为File对象
          const base64Data = data.base64;
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/png' });
          const file = new File([blob], data.path.split('\\').pop(), { type: 'image/png' });

          // 尝试模拟拖入Open file picker区域
          const filePicker = $('div[aria-label="Open file picker"]');
          if (filePicker.length > 0) {
            console.log('找到文件选择器区域，尝试模拟拖放');

            // 使用第一个成功的拖放目标
            const dropTarget = filePicker[0];
            console.log('使用拖放目标:', dropTarget.className || dropTarget.tagName);

            // 创建DataTransfer对象
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);

            // 创建拖放事件
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

            try {
              // 触发拖放事件序列
              dropTarget.dispatchEvent(dragEnterEvent);
              dropTarget.dispatchEvent(dragOverEvent);
              dropTarget.dispatchEvent(dropEvent);

              console.log('拖放事件已触发');
              await awaitseconds(1);
              // 等待1秒后检测上传状态

              // 轮询检查Generate按钮的disabled状态变化 开始
              let pollInterval;
              let timeoutId;

              pollInterval = setInterval(() => {
                const currentButton = $('button:has(svg.lucide-video):contains("Generate")');
                if (currentButton.length > 0) {
                  const isDisabled = currentButton[0].disabled || currentButton[0].getAttribute('data-soft-disabled') === 'true';
                  if (!isDisabled) {
                    console.log('✅ Generate按钮已启用，返回true');
                    clearInterval(pollInterval);
                    clearTimeout(timeoutId);
                    resolve(true);
                  }
                }
              }, 500); // 每500ms检查一次

              // 设置超时，300秒后停止轮询
              timeoutId = setTimeout(() => {
                clearInterval(pollInterval);
                console.log('⚠️ 轮询超时，返回false');
                resolve(false);
              }, 300000);
              // 轮询检查Generate按钮的disabled状态变化 结束

            } catch (error) {
              console.error('拖放失败:', error);
              resolve(false);
            }
          } else {
            console.error('未找到文件选择器区域');
            resolve(false);
          }
        } else {
          console.log('没有可用图片');
          resolve(false);
        }
      } else {
        console.error('获取图片失败:', response.error);
        resolve(false);
      }
    });
  });
};

// 查找并点击文本输入框
async function inputText() {
  const textInput = $('textarea[aria-label="Prompt"]');
  if (textInput.length > 0) {
    console.log('找到文本输入框，点击并输入内容');
    textInput.focus().click();

    // 模拟用户输入
    const textToInput = 'dramatic and cinematic motion';

    // 使用原生DOM方法设置值，并触发事件
    const textareaElement = textInput[0];

    // 使用focus事件确保元素获得焦点
    textareaElement.focus();

    // 设置值
    textareaElement.value = textToInput;

    // 触发input事件，让React等框架识别变化
    const inputEvent = new Event('input', { bubbles: true });
    textareaElement.dispatchEvent(inputEvent);

    // 触发change事件
    const changeEvent = new Event('change', { bubbles: true });
    textareaElement.dispatchEvent(changeEvent);

    console.log(`已输入文本: "${textToInput}"`);
    return true
  } else {
    console.log('⚠️ 未找到文本输入框');
    return false
  }
}


async function generatebuttonclick() {
  awaitseconds(1);
  // 等待一小段时间后点击Generate按钮
  const generateButton = $('button:has(svg.lucide-video):contains("Generate")');
  if (generateButton.length > 0) {
    console.log('找到Generate按钮，点击执行生成');
    generateButton[0].click();
    return true;
  }
  console.log('找到Generate按钮，点击执行生成');
  return false;
}
async function removeimage() {
  // 点击Remove image按钮移除图片
  const removeButton = $('button[aria-label="Remove image"]');
  if (removeButton.length > 0) {
    console.log('✅ 找到Remove image按钮，点击移除图片');
    removeButton[0].click();
    return true;
  } else {
    console.log('⚠️ 未找到Remove image按钮');
    return false;
  }
}



async function await4kbuttonandclick() {
  console.log('开始等待4K按钮出现...');

  const buttonClicked = await new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const button4K = Array.from(document.querySelectorAll('button')).find(btn =>
        btn.querySelector('svg.lucide-image-upscale') && btn.textContent.includes('4K')
      );
      if (button4K) {
        clearInterval(checkInterval);
        button4K.click();
        console.log('✅ 找到4K按钮，点击');
        resolve(true);
      }
    }, 500);

    setTimeout(() => {
      clearInterval(checkInterval);
      console.log('⚠️ 4K按钮等待超时');
      resolve(false);
    }, 180000);
  });

  return buttonClicked;
}



async function download4K() {      //点击4K下载
  console.log('开始等待4K视频card出现...');

  const cardFound = await new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const span4k = Array.from(document.querySelectorAll('span[data-show="true"]')).find(el =>
        el.textContent.includes('4K')
      );
      if (span4k) {
        clearInterval(checkInterval);
        console.log('4K视频card出现,等待4K生成完成...');
        resolve(true);
      }
    }, 500);

    setTimeout(() => {
      clearInterval(checkInterval);
      console.log('⚠️ 未找到4K视频card');
      resolve(false);
    }, 180000);
  });

  if (!cardFound) {
    console.log('⚠️ 未找到4K视频card');
    return false;
  }

  const toolbarFound = await new Promise((resolve) => {
    const checkToolbar = setInterval(() => {
      const span4k = Array.from(document.querySelectorAll('span[data-show="true"]')).find(el =>
        el.textContent.includes('4K')
      );
      if (!span4k) return;

      const card = span4k.closest('div[data-output-mode="video"]');
      if (!card) return;

      const toolbar = card.querySelector('div[role="toolbar"]');
      const downloadBtn = card.querySelector('button.mainButton-_m_ZJD svg.lucide-download')?.closest('button.mainButton-_m_ZJD');

      if (toolbar && downloadBtn) {
        clearInterval(checkToolbar);
        console.log('4K视频card生成完成,点击下载按钮...');
        downloadBtn.click();
        console.log('✅ 已点击4K下载按钮');
        resolve(true);
      }
    }, 500);

    setTimeout(() => {
      clearInterval(checkToolbar);
      console.log('⚠️ 4K视频生成等待超时');
      resolve(false);
    }, 180000);
  });

  return toolbarFound || false;
}





async function hidevideo() { //删除4k视频
  //删除4k视频
  await awaitseconds(3);
  console.log('删除视频');
  console.log('开始查找关闭按钮元素...');
  $('button[aria-label="Hide output"]').each(async function () {
    $(this).click()
  });
  return true
}



// 直接下载视频
async function downloadVideo(url) {
  return new Promise((resolve, reject) => {
    console.log('开始下载视频:', url);

    const imagePath = $('#filename_for_tauri').val();
    let basename = imagePath ? imagePath.split(/[/\\]/).pop() : `video_${Date.now()}`;
    basename = basename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const filename = `${basename}.mp4`;

    chrome.runtime.sendMessage({
      action: 'downloadVideo',
      url: url,
      filename: filename
    }, (response) => {
      if (response && response.success) {
        console.log('✅ 下载已创建, ID:', response.downloadId);

        window._downloadResolve = resolve;
        window._downloadReject = reject;
        window._downloadId = response.downloadId;
      } else {
        console.error('❌ 下载创建失败:', response?.error);
        reject(new Error(response?.error || '下载创建失败'));
      }

    });
  });
}

// 监听下载完成消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'downloadComplete') {
    console.log('📥 下载完成通知:', message.filename);
    if (window._downloadResolve) {
      window._downloadResolve(true);
      window._downloadResolve = null;
      window._downloadReject = null;

      const filename = $('#filename_for_tauri').val();
      if (filename) {
        console.log('📝 通知Tauri标记已下载:', filename);
        chrome.runtime.sendMessage({
          action: 'markDownloaded',
          path: filename
        });
      }
      $('#filename_for_tauri').val('');
    }
  } else if (message.action === 'downloadError') {
    console.error('📥 下载失败通知:', message.error);
    if (window._downloadReject) {
      window._downloadReject(new Error(message.error));
      window._downloadResolve = null;
      window._downloadReject = null;
    }
    $('#filename_for_tauri').val('');
  }
});
//$('button[data-saved="false"]').click() //点击下载
//$('span:contains("4K")').parent().click() //点击4K
async function runOnce() {
  if (await getImage()) {
    console.log('✅ 获取图片成功');
  } else {
    console.log('⚠️ 获取图片失败');
    return false;
  }
  await awaitseconds(3);

  console.log('✅ Generate It按钮点击成功');

  // 查找并点击文本输入框
  if (await inputText()) {
    console.log('✅ 文本输入框已输入');
  } else {
    console.log('⚠️ 文本输入框未输入');
    return false;
  }
  await awaitseconds(3);
  if (await generatebuttonclick()) {
    console.log('✅ Generate按钮点击成功');
  } else {
    console.log('⚠️ Generate按钮点击失败');
    return false;
  }
  await awaitseconds(3);
  if (await removeimage()) { //移除上传的图片
    console.log('✅ 移除图片成功');
  } else {
    console.log('⚠️ 移除图片失败');
    return false;
  }
  await awaitseconds(3);

  if (await await4kbuttonandclick()) {
    console.log('✅ 4K按钮点击成功');
  } else {
    console.log('⚠️ 4K按钮点击失败');
    return false;
  }

  if (await download4K()) {
    console.log('✅ 点击4K下载成功');
  } else {
    console.log('⚠️ 点击4K下载失败');
    return false;
  }

  if (await hidevideo()) { //删除4k视频
    console.log('✅ 删除4k视频成功');
  } else {
    console.log('⚠️ 删除4k视频失败');
    return false;
  }

  return true;

}

async function autoRunway() {
  while (true) {

    const isok = await runOnce();
    if (isok) {
      console.log('✅ 一次运行成功');
    } else {
      console.log('⚠️ 一次运行失败,刷新页面');
      await awaitseconds(3);
      //location.reload();
    }
    await awaitseconds(3);
  }
}
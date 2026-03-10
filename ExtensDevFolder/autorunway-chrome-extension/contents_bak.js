// contents.js
// 页面内容脚本

$(document).ready(() => {
  // 创建容器
  const container = $('<div class="autorunway-container"></div>');
  
 
  // 创建请求图片按钮
  const getImageBtn = $('<button class="autorunway-btn autorunway-btn-secondary">贴入图片</button>');
  

  
  // 创建状态显示
  const statusDiv = $('<div class="autorunway-status">状态: 未连接</div>');
  
  // 创建generateIt按钮
  const generateItBtn = $('<button id="generateItBtn" class="autorunway-btn">Generate It</button>');
  
   // 为generateIt按钮添加点击事件
  generateItBtn.click(async() => {
    console.log('✅ Generate It按钮点击成功');
    
    // 查找并点击文本输入框
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
      
      
      // 等待一小段时间后点击Generate按钮
      setTimeout(async() => {
        const generateButton = $('button:has(svg.lucide-video):contains("Generate")');
        if (generateButton.length > 0) {
          console.log('找到Generate按钮，点击执行生成');
          generateButton[0].click();
          
          // 点击Remove image按钮移除图片
          setTimeout(() => {
            const removeButton = $('button[aria-label="Remove image"]');
            if (removeButton.length > 0) {
              console.log('✅ 找到Remove image按钮，点击移除图片');
              removeButton[0].click();
            } else {
              console.log('⚠️ 未找到Remove image按钮');
            }
          }, 500);          

        } else {
          console.log('⚠️ 未找到Generate按钮，尝试其他选择器');
          
          // 尝试其他选择器
          const generateButtonAlt = $('button[type="submit"]:contains("Generate")');
          if (generateButtonAlt.length > 0) {
            console.log('找到Generate按钮（备用选择器），点击执行生成');
            generateButtonAlt[0].click();
            



          } else {
            console.log('⚠️ 未找到Generate按钮');
          }
        }
      }, 500);


      // 点击Remove image按钮移除图片
      setTimeout(async() => {
        const removeButton = $('button[aria-label="Remove image"]');
        if (removeButton.length > 0) {
          console.log('✅ 找到Remove image按钮，点击移除图片');
          removeButton[0].click();
        } else {
          console.log('⚠️ 未找到Remove image按钮');
        }
      }, 500);
      
      // 等待4K按钮出现并点击
      console.log('开始等待4K按钮出现...');
      waitForElement('button:has(svg.lucide-image-upscale):contains("4K")', () => {
        console.log('✅ 找到4K按钮，点击');
        const button4K = $('button:has(svg.lucide-image-upscale):contains("4K")');
        if (button4K.length > 0) {
          button4K[0].click();
        }
      });

      //删除原视频
      await awaitseconds(3);
      console.log('删除原视频');
      // 遍历div找到class以titleContainer-开头的元素
      console.log('开始查找titleContainer元素...');
      $('div[class^="titleContainer-"]').each(function() {
        const $div = $(this);
        const divText = $div.text();
        
        // 检查文本是否不含4K
        if (!divText.includes('4K')) {
          console.log('找到不含4K的titleContainer，文本:', divText);
          
          // 找到同级别的兄弟元素中的button aria-label="Hide output"
          const hideButton = $div.siblings('button[aria-label="Hide output"]');
          if (hideButton.length > 0) {
            console.log('✅ 找到Hide output按钮，点击');
            hideButton[0].click();
          } else {
            console.log('⚠️ 未找到Hide output按钮');
          }
        }
      });

      
      //点击4K下载
      await awaitseconds(3);
      console.log('点击4K下载');
      
      // 使用waitForElement等待下载图标出现
      console.log('开始等待下载图标出现...');
      waitForElement('div[class^="titleContainer-"]:has(svg.lucide.lucide-download)', () => {
        console.log('✅ 找到下载图标，准备下载');
        
        // 找到包含下载图标的div
        const downloadContainer = $('div[class^="titleContainer-"]:has(svg.lucide.lucide-download)');
        if (downloadContainer.length > 0) {
          // 在这个div内部，找到class="lucide lucide-download"的svg的父级button
          const downloadSvg = downloadContainer.find('svg.lucide.lucide-download');
          if (downloadSvg.length > 0) {
            const downloadButton = downloadSvg.closest('button');
            if (downloadButton.length > 0) {
              console.log('✅ 找到下载按钮，准备直接下载');
              
              // 查找视频URL
              const videoElement = downloadContainer.find('video');
              if (videoElement.length > 0) {
                const videoUrl = videoElement[0].src;
                console.log('找到视频URL:', videoUrl);
                
                // 直接下载视频
                downloadVideo(videoUrl);
              } else {
                console.log('⚠️ 未找到视频元素');
              }
            } else {
              console.log('⚠️ 未找到下载按钮');
            }
          } else {
            console.log('⚠️ 未找到下载图标');
          }
        } else {
          console.log('⚠️ 未找到下载容器');
        }
      });
      
      //删除4k视频
      await awaitseconds(3);
      console.log('删除4k视频');
      // 遍历div找到class以titleContainer-开头的元素
      console.log('开始查找titleContainer元素...');
      $('div[class^="titleContainer-"]').each(function() {
        const $div = $(this);
        const divText = $div.text();
        
        // 检查文本是否不含4K
        if (divText.includes('4K')) {
          console.log('找到含4K的titleContainer，文本:', divText);
          
          // 找到同级别的兄弟元素中的button aria-label="Hide output"
          const hideButton = $div.siblings('button[aria-label="Hide output"]');
          if (hideButton.length > 0) {
            console.log('✅ 找到Hide output按钮，点击');
            hideButton[0].click();
          } else {
            console.log('⚠️ 未找到Hide output按钮');
          }
        }
      });




    } else {
      console.log('⚠️ 未找到文本输入框');
    }
  });

  getImageBtn.click(() => {
    console.log('✅ 获取图片按钮点击成功');
    chrome.runtime.sendMessage({ action: 'getImage' }, (response) => {
      if (response.success) {
        const data = response.data;
        if (data.success) {
          console.log('获取图片成功:', data.path);
          
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
              
              // 等待1秒后检测上传状态
              setTimeout(() => {
                const uploadingSpan = $('span:contains("Uploading...")');
                if (uploadingSpan.length > 0) {
                  console.log('✅ 检测到上传开始: 找到"Uploading..."标签');
                  
                  // 监听上传标签消失
                  const observer = new MutationObserver((mutations) => {
                    const isStillUploading = $('span:contains("Uploading...")').length > 0;
                    if (!isStillUploading) {
                      console.log('✅ 上传完成: "Uploading..."标签已消失');
                      
                      // 检测是否有Crop按钮并重复点击直到消失
                      setTimeout(() => {
                        const cropButton = $('button:contains("Crop")');
                        if (cropButton.length > 0) {
                          console.log('✅ 找到Crop按钮，开始重复点击');
                          
                          // 立即点击第一次Crop按钮
                          try {
                            cropButton[0].click();
                            console.log('✅ 第一次点击Crop按钮成功');
                          } catch (error) {
                            console.error('点击Crop按钮失败:', error);
                          }
                          
                          // 设置重复点击的定时器
                          const cropInterval = setInterval(() => {
                            const currentCropButton = $('button:contains("Crop")');
                            if (currentCropButton.length > 0) {
                              // 检查按钮是否可点击
                              const isDisabled = currentCropButton[0].disabled || currentCropButton[0].getAttribute('data-soft-disabled') === 'true';
                              if (!isDisabled) {
                                console.log('点击Crop按钮');
                                try {
                                  currentCropButton[1].click();
                                  console.log('✅ 点击Crop按钮成功');
                                } catch (error) {
                                  console.error('点击Crop按钮失败:', error);
                                }
                              } else {
                                console.log('⚠️ Crop按钮被禁用');
                              }
                            } else {
                              console.log('✅ Crop按钮已消失，停止点击');
                              clearInterval(cropInterval);
                            }
                          }, 1000); // 每隔1秒点击一次
                          
                          // 同时监听Generate按钮的出现
                          const generateObserver = new MutationObserver(() => {
                            const generateButton = $('button:has(svg.lucide-video):has(span:contains("Generate"))');
                            if (generateButton.length > 0) {
                              console.log('✅ 检测到Generate按钮，图片处理流程完成');
                              generateObserver.disconnect();
                              // 如果Crop定时器还在运行，也停止它
                              if (cropInterval) {
                                clearInterval(cropInterval);
                              }
                            }
                          });
                          
                          // 开始监听DOM变化
                          generateObserver.observe(document.body, {
                            childList: true,
                            subtree: true
                          });
                          
                          // 立即点击第一次
                          cropButton[0].click();
                        } else {
                          console.log('⚠️ 未找到Crop按钮，直接检测Generate按钮');
                          
                          // 直接检测Generate按钮
                          const generateButton = $('button:has(svg.lucide-video):has(span:contains("Generate"))');
                          if (generateButton.length > 0) {
                            console.log('✅ 检测到Generate按钮，图片处理流程完成');
                          } else {
                            // 如果没有找到Generate按钮，设置监听器等待其出现
                            const generateObserver = new MutationObserver(() => {
                              const generateButton = $('button:has(svg.lucide-video)');
                              if (generateButton.length > 0) {
                                console.log('✅ 检测到Generate按钮，图片处理流程完成');
                                generateObserver.disconnect();
                              }
                            });
                            
                            // 开始监听DOM变化
                            generateObserver.observe(document.body, {
                              childList: true,
                              subtree: true
                            });
                          }
                        }
                      }, 500); // 等待500毫秒后检测Crop按钮
                      
                      observer.disconnect();
                    }
                  });
                  
                  // 开始监听DOM变化
                  observer.observe(document.body, {
                    childList: true,
                    subtree: true
                  });
                } else {
                  console.log('⚠️ 未检测到上传状态，可能上传已完成或失败');
                }
              }, 1000); // 等待1秒后检测
              
            } catch (error) {
              console.error('拖放失败:', error);
            }
          } else {
            console.error('未找到文件选择器区域');
          }
        } else {
          console.log('没有可用图片');
        }
      } else {
        console.error('获取图片失败:', response.error);
      }
    });
  });
  
  // 添加元素到容器
  container.append(getImageBtn);
  container.append(generateItBtn);

  container.append(statusDiv);

  
  // 添加到页面
  $('body').append(container);
  
  // 尝试连接到tauri-app
  console.log('[Content] 尝试连接到 Tauri 应用');
  chrome.runtime.sendMessage({ action: 'connect' }, (response) => {
    console.log('[Content] 收到连接响应:', response);
    if (response && response.success) {
      statusDiv.text('状态: 已连接');
    } else {
      statusDiv.text('状态: 连接失败');
      if (response && response.error) {
        console.error('[Content] 连接错误详情:', response.error);
      }
    }
  });

  // 等待base-model-selector元素出现后执行modelchange
  waitForElement('#base-model-selector', modelchange);
});

async function awaitseconds(seconds){
  for (let i = seconds; i > 0; i--) {
    console.log(i);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return true;
}

// 等待元素出现后执行函数
function waitForElement(elementSelector, callback) {
  // 检查元素是否已经存在
  const existingElement = $(elementSelector);
  if (existingElement.length > 0) {
    callback();
    return;
  }

  // 创建MutationObserver监听DOM变化
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes) {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          if (node.nodeType === 1) { // 元素节点
            if ($(node).is(elementSelector)) {
              callback();
              observer.disconnect(); // 找到元素后停止监听
              return;
            }
            // 检查子节点
            const child = $(node).find(elementSelector);
            if (child.length > 0) {
              callback();
              observer.disconnect(); // 找到元素后停止监听
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
}

// 直接下载视频
async function downloadVideo(url) {
  try {
    console.log('开始下载视频:', url);
    
    // 使用fetch下载文件
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`);
    }
    
    const blob = await response.blob();
    const filename = `video_${Date.now()}.mp4`;
    
    // 创建下载链接
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
    
    console.log('✅ 视频下载完成:', filename);
    
  } catch (error) {
    console.error('下载视频失败:', error);
  }
}

async function modelchange() {
  $('#base-model-selector').click();
  console.log('点击模型选择');
  await awaitseconds(1);
  $('div:contains("Gen-4 Turbo")').closest('div[role="menuitem"]').click();
  console.log('点击Gen-4 Turbo');
  $('div[class^="centerContainer"]').click();
}



//$('button[data-saved="false"]').click() //点击下载
//$('span:contains("4K")').parent().click() //点击4K

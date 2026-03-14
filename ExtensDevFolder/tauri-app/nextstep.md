这个tauri增加一个功能，
当index.html上的允许自动运行开启时，并且数据库有未发送的图片时候：

检测 /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="/Users/liwentao/ChromeDev" 这个浏览器的页面，是否开启https://app.runwayml.com/video-tools/teams/*，

如果没有开启则开启。

注意浏览器有可能会开启2个实例，需要检测是否有2个实例（2个独立窗口），
如果有2个实例，需要在2个实例里面都检查是否开启了runway页面，如果没有则打开页面（2个都要，但是每个实例只能1个页面）。
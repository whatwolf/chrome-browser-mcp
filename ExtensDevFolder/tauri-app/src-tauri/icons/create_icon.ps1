# 创建一个简单的ICO文件
Add-Type -AssemblyName System.Drawing

# 创建32x32位图
$bitmap = New-Object System.Drawing.Bitmap(32, 32)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

# 填充蓝色背景
$graphics.Clear([System.Drawing.Color]::Blue)

# 绘制白色"T"
$font = New-Object System.Drawing.Font("Arial", 16, [System.Drawing.FontStyle]::Bold)
$brush = [System.Drawing.Brushes]::White
$graphics.DrawString("T", $font, $brush, 5, 5)

# 保存为ICO文件
$bitmap.Save("icon.ico", [System.Drawing.Imaging.ImageFormat]::Icon)

# 清理资源
$graphics.Dispose()
$bitmap.Dispose()
$font.Dispose()
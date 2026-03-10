# 创建一个真正的ICO文件
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

# 先保存为PNG
$bitmap.Save("temp.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 清理资源
$graphics.Dispose()
$bitmap.Dispose()
$font.Dispose()

# 使用.NET的Icon类从PNG创建ICO
$icon = [System.Drawing.Icon]::ExtractAssociatedIcon("$(Resolve-Path temp.png)")
$icon.Save("icon.ico")

# 删除临时文件
Remove-Item "temp.png"
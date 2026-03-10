using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;

class Program
{
    static void Main()
    {
        // 创建一个32x32的位图
        using (Bitmap bitmap = new Bitmap(32, 32))
        {
            // 使用Graphics对象绘制一个简单的图标
            using (Graphics g = Graphics.FromImage(bitmap))
            {
                // 填充背景为蓝色
                g.Clear(Color.Blue);
                
                // 绘制一个白色的"T"字母
                using (Font font = new Font("Arial", 16, FontStyle.Bold))
                {
                    g.DrawString("T", font, Brushes.White, 5, 5);
                }
            }
            
            // 保存为ICO文件
            bitmap.Save("icon.ico", ImageFormat.Icon);
        }
    }
}
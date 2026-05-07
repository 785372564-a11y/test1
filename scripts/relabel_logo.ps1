Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Administrator\Desktop\长旅log.jpg"
$dst = "C:\Users\Administrator\Desktop\新旅建设集团有限公司_logo.png"

$cnText = "新旅建设集团有限公司"
$enText = "XINLV CONSTRUCTION GROUP CO., LTD."

$img = [System.Drawing.Image]::FromFile($src)
$bmp = New-Object System.Drawing.Bitmap $img
$img.Dispose()

$W = $bmp.Width
$H = $bmp.Height
Write-Host "原图尺寸: ${W}x${H}"

$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# 白色覆盖底部文字区（保留 C 形 logo）
$textTop = [int]($H * 0.62)
$whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$g.FillRectangle($whiteBrush, 0, $textTop, $W, $H - $textTop)

# 文字颜色
$textColor = [System.Drawing.Color]::FromArgb(255, 60, 70, 80)
$brush = New-Object System.Drawing.SolidBrush $textColor

# 中文字体：自动调整到目标宽度（图宽 60%）
$cnFamily = "Microsoft YaHei"
$cnStyle = [System.Drawing.FontStyle]::Bold
$targetW = $W * 0.60
$cnSize = [int]($H * 0.085)
$cnFont = New-Object System.Drawing.Font $cnFamily, $cnSize, $cnStyle
$measured = $g.MeasureString($cnText, $cnFont)
while ($measured.Width -gt $targetW -and $cnSize -gt 16) {
    $cnFont.Dispose(); $cnSize -= 2
    $cnFont = New-Object System.Drawing.Font $cnFamily, $cnSize, $cnStyle
    $measured = $g.MeasureString($cnText, $cnFont)
}
while ($measured.Width -lt ($targetW * 0.95) -and $cnSize -lt 200) {
    $cnFont.Dispose(); $cnSize += 2
    $cnFont = New-Object System.Drawing.Font $cnFamily, $cnSize, $cnStyle
    $measured = $g.MeasureString($cnText, $cnFont)
}

# 英文字体
$enFamily = "Arial"
$enSize = [single][Math]::Max(14, [int]($cnSize * 0.42))
$enFont = [System.Drawing.Font]::new($enFamily, $enSize, [System.Drawing.FontStyle]::Bold)

$cnSize2 = $g.MeasureString($cnText, $cnFont)
$enSize2 = $g.MeasureString($enText, $enFont)
$gap = [int]($cnSize * 0.25)
$totalH = $cnSize2.Height + $gap + $enSize2.Height
$availH = $H - $textTop
$blockTop = $textTop + ($availH - $totalH) / 2

$cnX = ($W - $cnSize2.Width) / 2
$enX = ($W - $enSize2.Width) / 2
$enY = $blockTop + $cnSize2.Height + $gap

$g.DrawString($cnText, $cnFont, $brush, $cnX, $blockTop)
$g.DrawString($enText, $enFont, $brush, $enX, $enY)

$g.Dispose()
$cnFont.Dispose()
$enFont.Dispose()
$whiteBrush.Dispose()
$brush.Dispose()

$bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Host "已保存: $dst"

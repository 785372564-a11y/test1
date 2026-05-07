Add-Type -AssemblyName System.Drawing

$src = "public\logo.png"
$dst = "public\logo-mark.png"

$img = [System.Drawing.Image]::FromFile((Resolve-Path $src))
$W = $img.Width; $H = $img.Height
# 仅裁剪 C 形 logo 区域（上 60% 内居中正方形）
$markH = [int]($H * 0.62)
$markW = $markH  # 正方形
$x = [int](($W - $markW) / 2)
$y = 0
$crop = New-Object System.Drawing.Rectangle $x, $y, $markW, $markH

$bmp = New-Object System.Drawing.Bitmap $markW, $markH
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$dstRect = New-Object System.Drawing.Rectangle 0, 0, $markW, $markH
$g.DrawImage($img, $dstRect, $crop, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$img.Dispose()
$bmp.Save((Join-Path (Get-Location) $dst), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Saved: $dst (${markW}x${markH})"

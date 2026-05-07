Add-Type -AssemblyName System.Drawing

$src = (Resolve-Path "public\logo-mark.png").Path
$dst = (Join-Path (Get-Location) "public\logo-mark-alpha.png")

$img = [System.Drawing.Image]::FromFile($src)
$W = $img.Width; $H = $img.Height
$bmp = New-Object System.Drawing.Bitmap $W, $H, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($img, 0, 0, $W, $H)
$g.Dispose()
$img.Dispose()

# 把接近白色的像素转为透明（threshold 235）
$threshold = 235
$rect = New-Object System.Drawing.Rectangle 0, 0, $W, $H
$data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$bytes = New-Object byte[] ($data.Stride * $H)
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)

for ($i = 0; $i -lt $bytes.Length; $i += 4) {
    $b = $bytes[$i]; $g2 = $bytes[$i+1]; $r = $bytes[$i+2]
    if ($r -ge $threshold -and $g2 -ge $threshold -and $b -ge $threshold) {
        $bytes[$i+3] = 0  # alpha=0
    } else {
        # 边缘渐隐：越接近白色越透明
        $minc = [Math]::Min([Math]::Min($r, $g2), $b)
        if ($minc -gt 200) {
            $alpha = [int](255 * (($threshold - $minc) / ($threshold - 200)))
            if ($alpha -lt 0) { $alpha = 0 }
            if ($alpha -gt 255) { $alpha = 255 }
            $bytes[$i+3] = $alpha
        }
    }
}

[System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
$bmp.UnlockBits($data)
$bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Saved: $dst"

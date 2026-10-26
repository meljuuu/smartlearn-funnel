# Optional regeneration on Windows. Build/deploy use the committed icon files.
# Reuse the supplied artwork; remove only some of its empty outer margin.
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
$logo = [System.Drawing.Image]::FromFile((Join-Path $projectRoot 'assets/logo.png'))
$margin = [int][math]::Round($logo.Width * 0.08)
$crop = New-Object System.Drawing.Rectangle($margin,$margin,($logo.Width-2*$margin),($logo.Height-2*$margin))
$pngs = @{}
foreach ($size in @(16,32,48,180)) {
 $bitmap = New-Object System.Drawing.Bitmap($size,$size)
 $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
 $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
 $graphics.DrawImage($logo,(New-Object System.Drawing.Rectangle(0,0,$size,$size)),$crop,[System.Drawing.GraphicsUnit]::Pixel)
 $stream = New-Object System.IO.MemoryStream
 $bitmap.Save($stream,[System.Drawing.Imaging.ImageFormat]::Png)
 $pngs[$size] = $stream.ToArray()
 if($size -eq 32){[System.IO.File]::WriteAllBytes((Join-Path $projectRoot 'assets/favicon-32.png'),$pngs[$size])}
 if($size -eq 180){[System.IO.File]::WriteAllBytes((Join-Path $projectRoot 'assets/apple-touch-icon.png'),$pngs[$size])}
 $stream.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}
$logo.Dispose()
$file = [System.IO.File]::Create((Join-Path $projectRoot 'favicon.ico'))
$writer = New-Object System.IO.BinaryWriter($file)
$writer.Write([uint16]0); $writer.Write([uint16]1); $writer.Write([uint16]3)
$offset = 6 + 16 * 3
foreach ($size in @(16,32,48)) {
 $writer.Write([byte]$size); $writer.Write([byte]$size)
 $writer.Write([byte]0); $writer.Write([byte]0)
 $writer.Write([uint16]1); $writer.Write([uint16]32)
 $writer.Write([uint32]$pngs[$size].Length); $writer.Write([uint32]$offset)
 $offset += $pngs[$size].Length
}
foreach ($size in @(16,32,48)){$writer.Write([byte[]]$pngs[$size])}
$writer.Dispose()
Write-Output 'Created 16/32/48px favicon.ico, 32px PNG and 180px Apple touch icon from the original logo.'

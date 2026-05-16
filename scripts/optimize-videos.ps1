$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$outputDir = Join-Path $root "public/assets/video/optimized"
$ffmpeg = $env:FFMPEG_BIN
$ffprobe = $env:FFPROBE_BIN

if (-not $ffmpeg) {
  $candidates = @(
    "C:\Program Files\Shutter Encoder\Library\ffmpeg.exe",
    "C:\Program Files\Derivative\TouchDesigner\bin\ffmpeg.exe",
    "ffmpeg"
  )
  $ffmpeg = $candidates | Where-Object { (Get-Command $_ -ErrorAction SilentlyContinue) -or (Test-Path $_) } | Select-Object -First 1
}

if (-not $ffprobe) {
  $candidates = @(
    "C:\Program Files\Shutter Encoder\Library\ffprobe.exe",
    "C:\Program Files\Derivative\TouchDesigner\bin\ffprobe.exe",
    "ffprobe"
  )
  $ffprobe = $candidates | Where-Object { (Get-Command $_ -ErrorAction SilentlyContinue) -or (Test-Path $_) } | Select-Object -First 1
}

if (-not $ffmpeg -or -not $ffprobe) {
  throw "ffmpeg and ffprobe are required. Set FFMPEG_BIN and FFPROBE_BIN if they are not in PATH."
}

$fps = if ($env:FPS) { $env:FPS } else { "24" }
$webmCrf = if ($env:WEBM_CRF) { $env:WEBM_CRF } else { "32" }
$mp4Crf = if ($env:MP4_CRF) { $env:MP4_CRF } else { "24" }
$posterQuality = if ($env:POSTER_QUALITY) { $env:POSTER_QUALITY } else { "3" }

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$inputs = @("loop1.MP4", "loop2.MP4", "loop3.MP4")
$variants = @(
  @{ Name = "mobile"; Width = 960 },
  @{ Name = "tablet"; Width = 1440 },
  @{ Name = "desktop"; Width = 1920 }
)

foreach ($inputName in $inputs) {
  $inputPath = Join-Path $root $inputName
  if (-not (Test-Path $inputPath)) {
    throw "Missing input: $inputPath"
  }

  $base = [System.IO.Path]::GetFileNameWithoutExtension($inputName)
  $sourceWidth = [int](& $ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 $inputPath)
  $posterPath = Join-Path $outputDir "$base-poster.jpg"

  & $ffmpeg -y -i $inputPath -frames:v 1 -vf "scale=$($sourceWidth):-2:flags=lanczos" -q:v $posterQuality -update 1 $posterPath
  if ($LASTEXITCODE -ne 0) { throw "Poster generation failed for $inputName" }

  foreach ($variant in $variants) {
    $width = [Math]::Min($variant.Width, $sourceWidth)
    $webmPath = Join-Path $outputDir "$base-$($variant.Name).webm"
    $mp4Path = Join-Path $outputDir "$base-$($variant.Name).mp4"

    & $ffmpeg -y -i $inputPath -an -vf "fps=$fps,scale=$($width):-2:flags=lanczos" -c:v libvpx-vp9 -b:v 0 -crf $webmCrf -row-mt 1 -tile-columns 2 -deadline good -cpu-used 3 $webmPath
    if ($LASTEXITCODE -ne 0) { throw "WebM encoding failed for $inputName $($variant.Name)" }

    & $ffmpeg -y -i $inputPath -an -vf "fps=$fps,scale=$($width):-2:flags=lanczos" -c:v libx264 -preset slow -crf $mp4Crf -pix_fmt yuv420p -movflags +faststart $mp4Path
    if ($LASTEXITCODE -ne 0) { throw "MP4 encoding failed for $inputName $($variant.Name)" }
  }
}

Write-Host "Optimized videos written to $outputDir"

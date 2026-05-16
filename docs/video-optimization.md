# Video optimization

Source files are kept in the project root:

- `loop1.MP4`
- `loop2.MP4`
- `loop3.MP4`

Optimized files are generated into:

- `public/assets/video/optimized`

Run on macOS/Linux/Git Bash:

```bash
FFMPEG_BIN=ffmpeg FFPROBE_BIN=ffprobe bash scripts/optimize-videos.sh
```

Run on Windows PowerShell:

```powershell
.\scripts\optimize-videos.ps1
```

The script creates, for every loop source:

- `*-mobile.webm` and `*-mobile.mp4` at up to 960px wide
- `*-tablet.webm` and `*-tablet.mp4` at up to 1440px wide
- `*-desktop.webm` and `*-desktop.mp4` capped to the source width
- `*-poster.jpg` from the first frame

Defaults:

- 24 fps
- VP9 WebM, CRF 32
- H.264 MP4 fallback, CRF 24
- no audio streams
- `+faststart` for MP4

To reduce file size further, rerun with higher CRF values:

```powershell
$env:WEBM_CRF="34"
$env:MP4_CRF="26"
.\scripts\optimize-videos.ps1
```

Higher CRF values reduce weight and quality. For bright gradients and thin light trails, increase CRF gradually and inspect the desktop files before shipping.

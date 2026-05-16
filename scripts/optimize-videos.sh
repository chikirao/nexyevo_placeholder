#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="${ROOT_DIR}/public/assets/video/optimized"
FFMPEG_BIN="${FFMPEG_BIN:-ffmpeg}"
FFPROBE_BIN="${FFPROBE_BIN:-ffprobe}"
FPS="${FPS:-24}"
WEBM_CRF="${WEBM_CRF:-32}"
MP4_CRF="${MP4_CRF:-24}"
POSTER_QUALITY="${POSTER_QUALITY:-3}"

mkdir -p "${OUTPUT_DIR}"

inputs=("loop1.MP4" "loop2.MP4" "loop3.MP4")
variants=("mobile:960" "tablet:1440" "desktop:1920")

for input_name in "${inputs[@]}"; do
  input="${ROOT_DIR}/${input_name}"
  if [[ ! -f "${input}" ]]; then
    echo "Missing input: ${input}" >&2
    exit 1
  fi

  base="$(basename "${input_name}")"
  base="${base%.*}"
  source_width="$("${FFPROBE_BIN}" -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "${input}")"
  poster_width="${source_width}"

  "${FFMPEG_BIN}" -y -i "${input}" \
    -frames:v 1 \
    -vf "scale=${poster_width}:-2:flags=lanczos" \
    -q:v "${POSTER_QUALITY}" \
    -update 1 \
    "${OUTPUT_DIR}/${base}-poster.jpg"

  for variant in "${variants[@]}"; do
    name="${variant%%:*}"
    requested_width="${variant##*:}"
    width="${requested_width}"
    if (( requested_width > source_width )); then
      width="${source_width}"
    fi

    "${FFMPEG_BIN}" -y -i "${input}" \
      -an \
      -vf "fps=${FPS},scale=${width}:-2:flags=lanczos" \
      -c:v libvpx-vp9 \
      -b:v 0 \
      -crf "${WEBM_CRF}" \
      -row-mt 1 \
      -tile-columns 2 \
      -deadline good \
      -cpu-used 3 \
      "${OUTPUT_DIR}/${base}-${name}.webm"

    "${FFMPEG_BIN}" -y -i "${input}" \
      -an \
      -vf "fps=${FPS},scale=${width}:-2:flags=lanczos" \
      -c:v libx264 \
      -preset slow \
      -crf "${MP4_CRF}" \
      -pix_fmt yuv420p \
      -movflags +faststart \
      "${OUTPUT_DIR}/${base}-${name}.mp4"
  done
done

for output in "${OUTPUT_DIR}"/*.{webm,mp4}; do
  "${FFPROBE_BIN}" -v error \
    -show_entries stream=index,codec_type,codec_name,width,height,avg_frame_rate,duration:format=duration,size,bit_rate \
    -of json "${output}" >/dev/null
done

echo "Optimized videos written to ${OUTPUT_DIR}"

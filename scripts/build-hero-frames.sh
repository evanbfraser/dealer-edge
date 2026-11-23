#!/bin/zsh
# Build the homepage hero frame sequence (assets/frames/frame_0001..0192.webp)
# from a raw Higgsfield/Kling take.
#
#   scripts/build-hero-frames.sh <raw-take.mp4> [pivot-frame=96]
#
# What it does (2026-11-19, boat + RV hero):
#   1. Keeps source frames 0..PIVOT (the stretch where the cards stay legible)
#      and plays them forward then back (0..PIVOT, PIVOT-1..1) so the scrub goes
#      flat -> 3D orbit -> flat, like the original hero. PIVOT=96 gives 192 frames.
#   2. Crushes the generator's near-black haze (values 1-12) to pure #000 so the
#      video sits seamlessly on the .hero background (#000), and feathers the
#      outer edge to black.
#   3. Writes 1920x1080 WebP frames (native res, q85, light unsharp; the canvas
#      draws them at devicePixelRatio, so 1280 frames looked pixelated) plus a 1920x1080 H.264 master
#      (assets/hero-video-boat-rv.mp4) for reference / re-cuts.
# After running: bump HERO_FRAMES_V in js/app.js, then `npm run minify`.
set -euo pipefail
SRC=${1:?raw take mp4}
PIVOT=${2:-96}
ROOT=${0:A:h:h}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# Edge feather mask: white with a soft 80px falloff to black at the borders.
ffmpeg -loglevel error -y -f lavfi -i "color=black:s=1920x1080:d=1" \
  -vf "drawbox=x=90:y=70:w=1740:h=940:color=white:t=fill,boxblur=60:3" -frames:v 1 "$TMP/mask.png"

# Black crush (per channel: v<=12 -> 0, then stretch back to 255) + feather.
CRUSH="lutrgb=r='clip((val-12)*255/243,0,255)':g='clip((val-12)*255/243,0,255)':b='clip((val-12)*255/243,0,255)'"
ffmpeg -loglevel error -y -i "$SRC" -i "$TMP/mask.png" -filter_complex \
  "[0:v]trim=start_frame=0:end_frame=$((PIVOT+1)),setpts=PTS-STARTPTS,format=rgb24,${CRUSH}[v];[1:v]format=rgb24[m];[v][m]blend=all_mode=multiply,format=rgb24" \
  -vsync 0 "$TMP/f_%04d.png"

# Forward 1..PIVOT+1, then back PIVOT..2  (files are 1-based)
mkdir -p "$TMP/seq"
n=0
for i in $(seq 1 $((PIVOT+1))) $(seq $PIVOT -1 2); do
  n=$((n+1)); ln -s "$TMP/f_$(printf %04d $i).png" "$TMP/seq/s_$(printf %04d $n).png"
done
echo "frames: $n"

OUT="$ROOT/assets/frames"
mkdir -p "$OUT"
rm -f "$OUT"/frame_*.webp
# (this ffmpeg build has no libwebp: sharpen with ffmpeg, encode with cwebp)
mkdir -p "$TMP/web"
ffmpeg -loglevel error -y -framerate 24 -i "$TMP/seq/s_%04d.png" -vf "unsharp=5:5:0.5:5:5:0" "$TMP/web/s_%04d.png"
for f in "$TMP"/web/s_*.png; do
  i=${${f:t:r}#s_}
  cwebp -quiet -q 85 -m 6 -sharp_yuv "$f" -o "$OUT/frame_$i.webp"
done

ffmpeg -loglevel error -y -framerate 24 -i "$TMP/seq/s_%04d.png" -c:v libx264 -crf 20 -preset slow \
  -pix_fmt yuv420p -g 12 -movflags +faststart "$ROOT/assets/hero-video-boat-rv.mp4"

ls "$OUT" | wc -l | xargs echo "webp files:"
du -sh "$OUT"

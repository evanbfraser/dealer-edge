# Imports the rendered explainer series into the site (2026-11-17).
#
#   python3 scripts/import-series.py            # every episode
#   python3 scripts/import-series.py 01,07      # chosen episodes
#
# Source: the Remotion project's out/series/paper/ (written by
# `node scripts/render-series.mjs` and `--thumbs` there). For each episode:
#   eNN.mp4            → web encode (x264 CRF 25, AAC 128k, faststart)
#   eNN-poster.jpg     → eNN-poster.webp, 1280×720
#   eNN-thumb-full.png → eNN-thumb.webp, the graphic column cropped to 4:3, 800×600
#   eNN.vtt            → copied as-is
# Then bump V in build-how-it-works.py and rebuild the page so every URL
# carries the new cache token.
import os, shutil, subprocess, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DST = os.path.join(ROOT, 'assets/video/series')
SRC = os.path.expanduser('~/Desktop/Dealer Edge explainer video/dealer-edge-explainer/out/series/paper')
# the graphic column of the 1920×1080 frame (the right six columns), 4:3
THUMB_BOX = (848, 148, 848 + 1044, 148 + 783)

ALL = [f'{i:02d}' for i in range(13)]
eps = sys.argv[1].split(',') if len(sys.argv) > 1 else ALL

for n in eps:
    e = f'e{n}'
    src = os.path.join(SRC, f'{e}.mp4')
    if not os.path.exists(src):
        sys.exit(f'missing {src}')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src,
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
                    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart',
                    os.path.join(DST, f'{e}.mp4')], check=True)
    Image.open(os.path.join(SRC, f'{e}-poster.jpg')).convert('RGB').resize((1280, 720), Image.LANCZOS) \
        .save(os.path.join(DST, f'{e}-poster.webp'), 'WEBP', quality=80, method=6)
    thumb = os.path.join(SRC, f'{e}-thumb-full.png')
    if os.path.exists(thumb):
        Image.open(thumb).convert('RGB').crop(THUMB_BOX).resize((800, 600), Image.LANCZOS) \
            .save(os.path.join(DST, f'{e}-thumb.webp'), 'WEBP', quality=80, method=6)
    vtt = os.path.join(SRC, f'{e}.vtt')
    if os.path.exists(vtt):
        shutil.copyfile(vtt, os.path.join(DST, f'{e}.vtt'))
    kb = os.path.getsize(os.path.join(DST, f'{e}.mp4')) // 1024
    print(f'  ✓ {e}  {kb} KB')
print('done — now bump V in scripts/build-how-it-works.py and run it')

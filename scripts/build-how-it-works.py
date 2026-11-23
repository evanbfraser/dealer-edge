# Builds how-it-works.html and assets/video/series/series.json from ONE episode
# list (EPS below), so the page and the series player never disagree.
#
#   python3 scripts/build-how-it-works.py
#
# Needs the encoded videos in assets/video/series/eNN.mp4 (durations are read
# with ffprobe) and the posters eNN-poster.webp. The page borrows its nav and
# footer from roi.html, so nav changes there flow through on the next build.
# Bump V when the videos or posters change. Source films: the Remotion project
# ~/Desktop/Dealer Edge explainer video/dealer-edge-explainer (src/series/paper,
# `node scripts/render-series.mjs`). (2026-11-17)
import utils.session
import json, re, subprocess, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VID = os.path.join(ROOT, 'assets/video/series')
V = '20261117g'

EPS = [
  ('e00','00','The AI Growth Platform','Overview','One AI platform for marketing, sales and operations. Inventory, marketing, sales and analytics, connected, so every listing, lead and campaign improves the next one.'),
  ('e01','01','Intelligent Listing Management','Inventory','Every unit pulled from your DMS, written up, photographed and synced to your website, Google and the marketplaces. Update it once; it changes everywhere.'),
  ('e02','02','Websites','Marketing','Live in under a week, fast on mobile, and built to turn visitors into leads. Premier went from 16 to 636 form submissions a month on the same traffic.'),
  ('e03','03','SEO & AIO Content','Marketing','Content that ranks on Google and gets your inventory named when buyers ask AI where to shop.'),
  ('e04','04','AI Ad Creative','Marketing','One brief fans out to every channel, and your live inventory becomes the ads on Google and Meta.'),
  ('e05','05','Social Media Management','Marketing','On-brand posts across Facebook, Instagram and TikTok, planned, written and scheduled by AI. Reviews requested and answered every day.'),
  ('e06','06','Email & SMS Campaigns','Marketing','Personalized nurture, inventory alerts and service reminders, sent at the right moment, so cold leads come back.'),
  ('e07','07','AI Lead Response','Sales','Every lead answered in under 90 seconds, 24/7. Qualified, booked and routed to the right rep while the buyer is still on the couch.'),
  ('e08','08','AI Sales Captain','Sales','Your branded AI assistant on your website: it texts back in 47 seconds, asks the questions your best rep would ask, and books the showing.'),
  ('e09','09','Appointment Scheduling','Sales','Showings booked straight onto the right rep’s calendar, nights and weekends too. 60 bookings instead of 19, from the same 1,000 buyers.'),
  ('e10','10','Customer Journey Automation','Sales','Automated touchpoints from the first search to a customer for life: awareness, consideration, purchase, after the sale, and loyalty.'),
  ('e11','11','CRM Integration','Sales','Two-way sync with your existing CRM. Leads, notes and activity flow automatically, with no double entry, ever.'),
  ('e12','12','Performance Analytics','Analytics','Every source wired in, every answer live, and every sold unit traced to the campaign that produced it.'),
]

def dur(id):
    f = os.path.join(VID, f'{id}.mp4')
    if not os.path.exists(f): return None
    out = subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f],capture_output=True,text=True).stdout.strip()
    return float(out)

def mmss(s): s=round(s); return f'{s//60}:{s%60:02d}'

items=[]
for id,n,title,pillar,desc in EPS:
    d = dur(id)
    if d is None: sys.exit(f'missing video {id}')
    it = dict(id=id,n=n,title=title,pillar=pillar,desc=desc,src=f'assets/video/series/{id}.mp4?v={V}',poster=f'assets/video/series/{id}-poster.webp?v={V}',duration=round(d,1))
    # voiced episodes ship a caption track (made by build-series-vo.mjs in the
    # Remotion project, copied here as eNN.vtt); the player turns it on
    if os.path.exists(os.path.join(VID, f'{id}.vtt')): it['captions'] = f'assets/video/series/{id}.vtt?v={V}'
    items.append(it)
series = [{k:i[k] for k in ('id','n','title','pillar','src','poster','duration','captions') if k in i} for i in items]
json.dump(series, open(os.path.join(VID,'series.json'),'w'), indent=1)
# the same list inline in the page, so the player needs no fetch (works from
# file:// too, and saves a request); de-core reads #de-series before fetching
series_inline = json.dumps(series, separators=(',',':')).replace('</','<\\/')

roi = open(os.path.join(ROOT,'roi.html')).read()
nav = roi[roi.index('  <!-- Navigation -->'):roi.index('  <main>')]
nav = nav.replace(' class="nav-link--active"','').replace('<a href="roi.html">ROI Calculator</a>','<a href="roi.html">ROI</a>')
nav = nav.replace('<a href="how-it-works.html">How It Works</a>','<a href="how-it-works.html" class="nav-link--active" aria-current="page">How It Works</a>')
footer = roi[roi.index('  <!-- Footer -->'):roi.index('  <script src="js/mobile-nav')].replace('utm_content=roi-footer','utm_content=how-it-works-footer').replace('data-cta="roi-footer','data-cta="how-it-works-footer')

play = '<span class="hiw-play" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.2v13.6L19.5 12z"/></svg></span>'
def tile(i, big=False):
    return (f'<button type="button" class="hiw-tile{" hiw-tile--big" if big else ""}" data-series="{i["id"]}" aria-label="Play: {i["title"]} ({mmss(i["duration"])})">'
            f'<img src="{i["poster"]}" alt="" width="1920" height="1080" loading="{"eager" if big else "lazy"}" decoding="async">{play}'
            f'<span class="hiw-dur">{mmss(i["duration"])}</span></button>')

ov = items[0]
eps = items[1:]
groups = []
for i in eps:
    if not groups or groups[-1][0] != i['pillar']: groups.append((i['pillar'], []))
    groups[-1][1].append(i)

# the episode cards: one per episode. The thumbnail is the
# episode's main graphic (rendered words-off by render-series.mjs --thumbs),
# so the grid reads as pictures, not a list of titles. Each card plays its video.
def card(i):
    return (f'<button type="button" class="hiw-card" data-series="{i["id"]}" aria-label="Play episode {i["n"]}: {i["title"]} ({mmss(i["duration"])})">'
            f'<span class="hiw-card-thumb"><img src="assets/video/series/{i["id"]}-thumb.webp?v={V}" alt="" width="800" height="600" loading="lazy" decoding="async">'
            f'<span class="hiw-card-play" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.2v13.6L19.5 12z"/></svg></span></span>'
            f'<span class="hiw-card-meta">{i["n"]} · {i["pillar"]} · {mmss(i["duration"])}</span>'
            f'<span class="hiw-card-title">{i["title"]}</span></button>')
# the "skip to a section" menu: each pillar (its headline below) and its episodes
skip_html = '\n'.join(
  f'              <div class="hiw-skip-group"><a class="hiw-skip-pillar" href="#{p.lower()}">{p}</a>' + ''.join(f'<a href="#{i["id"]}"><b>{i["n"]}</b> {i["title"]}</a>' for i in g) + '</div>'
  for p,g in groups)

# one even grid (4 x 3): grouping by pillar left single cards stranded on
# their own rows, so the pillar rides on each card instead
index_html = '        <div class="hiw-cards" data-fade>' + ''.join(card(i) for i in eps) + '</div>'

sections=[]
k=0
for p,g in groups:
    sections.append(f'    <h2 class="hiw-pillar" id="{p.lower()}">{p}</h2>')
    for i in g:
        flip = ' hiw-ep--flip' if k%2 else ''
        k+=1
        sections.append(f'''    <article class="hiw-ep{flip}" id="{i["id"]}" data-fade>
      <div class="hiw-ep-copy">
        <span class="hiw-ep-n">Episode {i["n"]} · {mmss(i["duration"])}</span>
        <h3>{i["title"]}</h3>
        <p>{i["desc"]}</p>
        <button type="button" class="hiw-watch" data-series="{i["id"]}">Watch episode {i["n"]}<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.2v13.6L19.5 12z"/></svg></button>
      </div>
      {tile(i)}
    </article>''')

html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>How It Works | DealerEdge — Every tool, explained in a short video.</title>
  <meta name="description" content="See how DealerEdge works: a short overview of the AI platform for boat and RV dealers, then a short video for every tool, from listings and ads to lead response and analytics.">
  <link rel="stylesheet" href="css/deep-core.min.css?v=20261118d">
  <link rel="stylesheet" href="css/how-it-works.min.css?v=20261118c">
  <link rel="preload" href="assets/fonts/inter-var-latin.woff2" as="font" type="font/woff2" crossorigin>
</head>
<body class="hiw-page">

  <!-- Cursor -->
  <div class="cursor-glow" id="cursor-glow"></div>
  <div class="custom-cursor" id="custom-cursor">
    <div class="custom-cursor-inner"></div>
  </div>

{nav}  <main>

  <!-- ──────────────────────────────────────────────────────────────
       HOW IT WORKS (2026-11-17). The explainer series: the overview,
       then one section per tool. Every tile and "Watch" button opens
       the shared series player (DE.openSeries, js/de-core.js), which
       offers the next episode. Generated from one episode list together
       with assets/video/series/series.json, so the two never disagree.
       ────────────────────────────────────────────────────────────── -->
  <header class="hiw-hero" data-scroll-entry>
    <div class="hiw-wrap">
      <span class="de-section-label">How It Works</span>
      <h1>See the whole platform, one tool at a time.</h1>
      <p class="hiw-lede">Start with the overview, then watch a short video for every tool. Each one picks up where the last left off.</p>
      <div class="cta-pair">
        <button type="button" class="btn-primary js-modal" data-cta="how-it-works-hero-demo">Book a Demo</button>
        <a href="https://dealeredge.ai/edge-score?utm_source=dealeredge-site&utm_medium=cta&utm_content=how-it-works-hero" class="btn-score" data-cta="how-it-works-hero-score">Get Free Website Score</a>
      </div>
    </div>
  </header>

  <section class="hiw-series theme-light" aria-label="The explainer series">
    <div class="hiw-wrap">
      <div class="hiw-overview" id="e00" data-fade>
        <div class="hiw-ep-copy">
          <span class="hiw-ep-n">Start here · Overview · {mmss(ov["duration"])}</span>
          <h2>{ov["title"]}</h2>
          <p>{ov["desc"]}</p>
          <button type="button" class="hiw-watch" data-series="e00">Watch the overview<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.2v13.6L19.5 12z"/></svg></button>
        </div>
        {tile(ov, True)}
      </div>

      <section class="hiw-cards-wrap" aria-labelledby="hiw-cards-h">
        <div class="hiw-cards-head">
          <div>
            <span class="hiw-ep-n">Every episode</span>
            <h2 id="hiw-cards-h" class="hiw-cards-h">Pick a tool.</h2>
          </div>
          <div class="hiw-skip" data-skip>
            <button type="button" class="hiw-skip-btn" aria-expanded="false" aria-controls="hiw-skip-menu">Or skip to a section<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg></button>
            <div class="hiw-skip-menu" id="hiw-skip-menu" hidden>
{skip_html}
            </div>
          </div>
        </div>
{index_html}
      </section>

{chr(10).join(sections)}
    </div>
  </section>

  </main>

{footer}  <script type="application/json" id="de-series">{series_inline}</script>
  <script src="js/mobile-nav.min.js?v=20260630a" defer></script>
  <script src="js/de-core.min.js?v=20261118f" defer></script>
  <script src="js/how-it-works.min.js?v=20261118c" defer></script>
</body>
</html>
'''
open(os.path.join(ROOT,'how-it-works.html'),'w').write(html)
# other pages that open the series player carry the same inline list
# (homepage video tile, platform overview + pillar-page cards), refreshed on every build
for page in ('index.html','features.html','inventory.html','marketing.html','sales.html','analytics.html'):
    fp=os.path.join(ROOT,page); src=open(fp).read()
    tag=f'<script type="application/json" id="de-series">{series_inline}</script>'
    if 'id="de-series"' in src:
        src=re.sub(r'<script type="application/json" id="de-series">.*?</script>', lambda m: tag, src, flags=re.S)
    else:
        src=src.replace('</body>', f'  {tag}\n</body>', 1)
    open(fp,'w').write(src)
print('ok', len(items), [mmss(i['duration']) for i in items])

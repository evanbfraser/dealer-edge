#!/usr/bin/env python3
"""Crawl a running local site into a static folder for Netlify.

usage: snapshot.py BASE_URL OUT_DIR
"""
import os, re, sys, hashlib, urllib.request, urllib.parse, collections

BASE = sys.argv[1].rstrip('/')
OUT = sys.argv[2]
STORAGE = 'http://127.0.0.1:54321/storage/v1/object/public/'
SKIP_PREFIXES = ('/api', '/dashboard', '/login', '/signup', '/auth', '/admin', '/_next', '/de-site',
                 '/scripts', '/onboarding', '/settings', '/demo', '/preview')
PAGE_EXT = re.compile(r'\.(png|jpe?g|webp|gif|svg|ico|css|js|mjs|json|xml|txt|woff2?|ttf|mp4|mov|webmanifest|pdf|map)$', re.I)
MAX_PAGES = 400

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'snapshot'})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return r.status, r.headers.get('Content-Type', ''), r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get('Content-Type', ''), e.read()
    except Exception as e:
        print('  ! fetch failed', url, e)
        return 0, '', b''

def write(path, data):
    full = os.path.join(OUT, path.lstrip('/'))
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'wb') as f:
        f.write(data)

IMG_RE = re.compile(r'/_next/image\?url=([^&"\\\s]+)(?:(?:&amp;|\\u0026|&)[wq]=\d+)*')
TOKEN_RE = re.compile(r'/_next/image\?url=[^&"\\\s]+(?:(?:&amp;|\\u0026|&)[wq]=\d+)*'
                      r'|' + re.escape(STORAGE) + r'[^"\'\s\\)<>,&]+'
                      r'|http://localhost:300[01](?:/[^"\'\s\\)<>,&]*)?')
def _map(u):
    if u.startswith('/_next/image'):
        u = urllib.parse.unquote(IMG_RE.match(u).group(1))
    if u.startswith(STORAGE):
        return '/media/' + u[len(STORAGE):]
    return re.sub(r'^http://localhost:300[01]', '', u) or '/'
def _sub(m):
    raw = m.group(0)
    canon = raw.replace('&amp;', '&').replace('\\u0026', '&')
    new = _map(canon)
    pad = len(canon) - len(new) - 1   # keep the decoded length identical (RSC rows are length-prefixed)
    assert pad >= 0, raw
    return new + ('&' if '?' in new else '?') + '_' * pad
def rewrite(text):
    return TOKEN_RE.sub(_sub, text)

assets = set()
ASSET_RE = re.compile(r'(?:' + re.escape(STORAGE) + r'[^"\'\s\\)<>,&]+|(?<![\w.:/])/(?:_next/static|de-site|scripts|media-local|images|fonts|icons|favicon|apple-touch|manifest|brand)[^"\'\s\\)<>,]*)')
def collect_assets(text):
    for m in IMG_RE.findall(text):
        assets.add(urllib.parse.unquote(m))
    for m in ASSET_RE.findall(text):
        m = m.rstrip('.;')
        if m.startswith('/_next/static') or m.startswith(STORAGE) or PAGE_EXT.search(m.split('?')[0]):
            assets.add(m)

# ---- pages
seen, queue = set(), collections.deque(['/'])
status_ok = 0
while queue and len(seen) < MAX_PAGES:
    path = queue.popleft()
    if path in seen:
        continue
    seen.add(path)
    code, ctype, body = fetch(BASE + path)
    if code != 200 or 'text/html' not in ctype:
        print(f'  skip {code} {path}')
        continue
    status_ok += 1
    html = body.decode('utf-8', 'replace')
    collect_assets(html)
    for href in re.findall(r'href="(/[^"#]*)"', html):
        p = urllib.parse.urlsplit(href.replace('&amp;', '&')).path.rstrip('/') or '/'
        if p.startswith(SKIP_PREFIXES) or PAGE_EXT.search(p) or p in seen:
            continue
        queue.append(p)
    out = rewrite(html)
    write((path.rstrip('/') + '/index.html') if path != '/' else '/index.html', out.encode())
    print(f'page {len(seen):3d} {path}')

# 404 page
code, ctype, body = fetch(BASE + '/this-page-does-not-exist-404')
if body:
    t = body.decode('utf-8', 'replace'); collect_assets(t); write('/404.html', rewrite(t).encode())

# ---- assets (recursive through css/js)
done = set()
while assets - done:
    for a in sorted(assets - done):
        done.add(a)
        url = a if a.startswith('http') else BASE + a
        local = a.replace(STORAGE, '/media/') if a.startswith(STORAGE) else a
        local = urllib.parse.unquote(urllib.parse.urlsplit(local).path)
        code, ctype, body = fetch(url)
        if code != 200:
            print(f'  asset {code} {a}')
            continue
        if local.endswith(('.css', '.js', '.webmanifest', '.json')):
            t = body.decode('utf-8', 'replace')
            collect_assets(t)
            if local.endswith('.css'):
                d = os.path.dirname(urllib.parse.urlsplit(a).path)
                for u in re.findall(r'url\(\s*["\']?([^"\')]+)', t):
                    if u.startswith('data:') or u.startswith('http'):
                        continue
                    assets.add(urllib.parse.urljoin(d + '/', u) if not u.startswith('/') else u)
            body = rewrite(t).encode()
        write(local, body)

print(f'\npages: {status_ok}  assets: {len(done)}')

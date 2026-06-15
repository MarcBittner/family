#!/usr/bin/env python3
"""Re-pull the Google Photos picks at full resolution into montage/full/ (clean,
non-destructive), then repoint data.js + montage.js. Parallel. Token from /tmp/gp_token."""
import os, re, json, subprocess, urllib.request
from concurrent.futures import ThreadPoolExecutor

TOKEN = open("/tmp/gp_token").read().strip()
SID = "505f45e1-0cf0-48e5-ba1d-f474d80aa84a"
SIZE = "w1600"
os.makedirs("montage/full", exist_ok=True)

def api(url):
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + TOKEN})
    return json.load(urllib.request.urlopen(req, timeout=60))

# 1) re-list every picked item -> fresh baseUrls
items, page = [], None
while True:
    u = f"https://photospicker.googleapis.com/v1/mediaItems?sessionId={SID}&pageSize=100"
    if page: u += "&pageToken=" + page
    d = api(u)
    items += d.get("mediaItems", [])
    page = d.get("nextPageToken")
    if not page: break
print("relisted", len(items), "items", flush=True)

# 2) filename -> chronological index (from manifest captured at pick time)
fn2idx = {}
for line in open("montage/manifest.tsv"):
    p = line.rstrip("\n").split("\t")
    if len(p) >= 5:
        fn2idx.setdefault(p[3], p[0].strip())

# 3) only photos (skip the 37 videos)
jobs = []
for it in items:
    mf = it.get("mediaFile", {})
    fn, burl = mf.get("filename"), mf.get("baseUrl")
    mt = mf.get("mimeType", "")
    if fn in fn2idx and burl and not mt.startswith("video"):
        jobs.append((fn2idx[fn], burl))

def dl(job):
    idx, burl = job
    out = f"montage/full/{idx}.jpg"
    subprocess.run(["curl", "-s", "-m", "60", "-o", out, "-H", f"Authorization: Bearer {TOKEN}", burl + "=" + SIZE])
    if os.path.exists(out) and os.path.getsize(out) > 2000: return idx
    if os.path.exists(out): os.remove(out)
    return None

done = []
with ThreadPoolExecutor(max_workers=16) as ex:
    for r in ex.map(dl, jobs):
        if r: done.append(r)
print("downloaded full-res:", len(done), "/", len(jobs), flush=True)

# 4) repoint data.js
s = open("data.js").read(); head = s[:s.index("[")]
arr = json.loads(s[s.index("["):s.rindex("]")+1])
for p in arr:
    m = re.match(r"^p(\d{4})$", p["id"])
    if m and os.path.exists(f"montage/full/{m.group(1)}.jpg"):
        p["src"] = f"montage/full/{m.group(1)}.jpg"
open("data.js", "w").write(head + json.dumps(arr, separators=(",", ":")) + ";\n")

# 5) repoint hardcoded love-story slides
mj = open("js/montage.js").read()
mj = re.sub(r"montage/thumbs/(\d{4})\.jpg",
            lambda m: f"montage/full/{m.group(1)}.jpg" if os.path.exists(f"montage/full/{m.group(1)}.jpg") else m.group(0),
            mj)
open("js/montage.js", "w").write(mj)
print("repointed data.js + montage.js", flush=True)

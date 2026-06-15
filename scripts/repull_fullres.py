#!/usr/bin/env python3
"""Re-pull the Google Photos picks at full resolution into montage/full/ (clean,
non-destructive), then repoint data.js + montage.js to the full-res copies.
Reads a fresh picker token from /tmp/gp_token. Original thumbs are left untouched."""
import os, re, json, subprocess, urllib.request

TOKEN = open("/tmp/gp_token").read().strip()
SID = "505f45e1-0cf0-48e5-ba1d-f474d80aa84a"
os.makedirs("montage/full", exist_ok=True)

def api(url):
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + TOKEN})
    return json.load(urllib.request.urlopen(req))

# 1) re-list the session's picked items -> fresh baseUrls
items, page = [], None
while True:
    u = f"https://photospicker.googleapis.com/v1/mediaItems?sessionId={SID}&pageSize=100"
    if page: u += "&pageToken=" + page
    d = api(u)
    items += d.get("mediaItems", [])
    page = d.get("nextPageToken")
    if not page: break
print("relisted", len(items), "items")

# 2) filename -> chronological index (from the manifest we saved at pick time)
fn2idx = {}
for line in open("montage/manifest.tsv"):
    p = line.rstrip("\n").split("\t")
    if len(p) >= 5:
        fn2idx.setdefault(p[3], p[0].strip())

# 3) download each at full resolution (=w2048 transcodes HEIC->JPEG)
ok = 0
for it in items:
    mf = it.get("mediaFile", {})
    fn, burl = mf.get("filename"), mf.get("baseUrl")
    if fn in fn2idx and burl:
        idx = fn2idx[fn]
        out = f"montage/full/{idx}.jpg"
        subprocess.run(["curl", "-s", "-o", out, "-H", f"Authorization: Bearer {TOKEN}", burl + "=w2048"])
        if os.path.exists(out) and os.path.getsize(out) > 2000: ok += 1
        elif os.path.exists(out): os.remove(out)
print("downloaded full-res:", ok)

# 4) repoint data.js p-ids that now have a full-res copy
s = open("data.js").read(); head = s[:s.index("[")]
arr = json.loads(s[s.index("["):s.rindex("]")+1])
for p in arr:
    m = re.match(r"^p(\d{4})$", p["id"])
    if m and os.path.exists(f"montage/full/{m.group(1)}.jpg"):
        p["src"] = f"montage/full/{m.group(1)}.jpg"
open("data.js", "w").write(head + json.dumps(arr, separators=(",", ":")) + ";\n")

# 5) repoint the hardcoded love-story slides in montage.js
mj = open("js/montage.js").read()
def swap(match):
    n = match.group(1)
    return f'montage/full/{n}.jpg' if os.path.exists(f"montage/full/{n}.jpg") else match.group(0)
mj = re.sub(r"montage/thumbs/(\d{4})\.jpg", swap, mj)
open("js/montage.js", "w").write(mj)
print("repointed data.js + montage.js to full-res where available")

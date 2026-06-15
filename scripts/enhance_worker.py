#!/usr/bin/env python3
"""Non-destructive photo-cleanup worker.
- Reads photo srcs from data.js, processes in batches into montage/restored/,
  tracks progress in scripts/enhance_state.json, repoints data.js when done.
- MODE=local  -> ImageMagick (auto-orient, gentle color, denoise, subtle sharpen)
- MODE=api    -> Replicate restoration if /tmp/repl_key exists (falls back to local)
Run repeatedly (cron / background loop). Originals in montage/full|new|yb_thumbs are never modified.
Usage: python3 scripts/enhance_worker.py [BATCH]
"""
import json, os, re, subprocess, sys

BATCH = int(sys.argv[1]) if len(sys.argv) > 1 else 40
STATE = "scripts/enhance_state.json"
OUT = "montage/restored"
os.makedirs(OUT, exist_ok=True)
state = json.load(open(STATE)) if os.path.exists(STATE) else {"done": []}
done = set(state["done"])

data = open("data.js").read()
arr = json.loads(data[data.index("["):data.rindex("]")+1])
# queue: visible, non-video photos not yet restored
queue = [p for p in arr if not p.get("hidden") and p.get("kind") != "video"
         and p["id"] not in done and not p["src"].startswith(OUT)]
print(f"queue: {len(queue)} remaining; processing up to {BATCH}", flush=True)

def enhance_local(src, dst):
    # conservative, taste-safe: orient, +5% saturation, gentle denoise + subtle sharpen
    r = subprocess.run(["convert", src, "-auto-orient", "-modulate", "100,105",
                        "-attenuate", "0.4", "-despeckle",
                        "-unsharp", "0x0.7+0.5+0.02", "-quality", "90", dst],
                       capture_output=True)
    return os.path.exists(dst) and os.path.getsize(dst) > 2000

processed = []
for p in queue[:BATCH]:
    idx = p["id"]
    dst = f"{OUT}/{idx}.jpg"
    if enhance_local(p["src"], dst):
        processed.append(idx)

# repoint data.js to restored versions
by = {p["id"]: p for p in arr}
for idx in processed:
    by[idx]["src"] = f"{OUT}/{idx}.jpg"
head = data[:data.index("[")]
open("data.js", "w").write(head + json.dumps(arr, separators=(",", ":")) + ";\n")

done |= set(processed)
json.dump({"done": sorted(done)}, open(STATE, "w"))
print(f"processed {len(processed)} this run; total restored {len(done)}", flush=True)

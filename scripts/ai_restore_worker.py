#!/usr/bin/env python3
"""Free AI restoration via the public CodeFormer HF Space (gradio_client).
Processes a batch of photos, downsizes output for web, overwrites montage/restored/<id>.jpg
(data.js already points there), records progress, commits+pushes. Non-destructive: montage/full/ untouched.
Usage: python3 scripts/ai_restore_worker.py [BATCH]
"""
import json, os, re, subprocess, sys, time, shutil
from gradio_client import Client, handle_file

BATCH = int(sys.argv[1]) if len(sys.argv) > 1 else 25
STATE = "scripts/ai_state.json"
OUT = "montage/restored"
state = json.load(open(STATE)) if os.path.exists(STATE) else {"done": [], "failed": []}
done = set(state["done"])

data = open("data.js").read()
arr = json.loads(data[data.index("["):data.rindex("]")+1])
# queue: visible, non-video, not yet AI-restored; people/older first isn't trivial, so chronological
queue = [p for p in arr if not p.get("hidden") and p.get("kind") != "video" and p["id"] not in done]
# prioritize: starred favorites, then photos used in the montages, then the rest
mtxt = open("js/montage.js").read()
montage_ids = set(re.findall(r"montage/(?:full|restored)/(\d{4})\.jpg", mtxt))
def prio(p):
    if p.get("fav"): return 0
    if p["id"].startswith("p") and p["id"][1:] in montage_ids: return 1
    return 2
queue.sort(key=prio)
print(f"AI queue: {len(queue)} remaining; this run up to {BATCH} (favorites + montage first)", flush=True)
if not queue:
    print("nothing to do"); sys.exit(0)

tok = open("/tmp/hf_key").read().strip() if os.path.exists("/tmp/hf_key") else None
client = Client("sczhou/CodeFormer", token=tok, verbose=False)
processed = []
for p in queue[:BATCH]:
    idx = p["id"]
    # source: prefer the full-res original if present, else current src
    src = f"montage/full/{idx[1:]}.jpg" if idx.startswith("p") and os.path.exists(f"montage/full/{idx[1:]}.jpg") else p["src"]
    if not os.path.exists(src):
        continue
    try:
        small = f"/tmp/in_{idx}.jpg"   # CodeFormer rejects >4MP inputs; cap longest side
        subprocess.run(["convert", src, "-resize", "1800x1800>", "-quality", "92", small], stderr=subprocess.DEVNULL)
        out = client.predict(handle_file(small), True, True, True, 2, 0.7, api_name="/inference")
        ai = out[0]["path"] if isinstance(out[0], dict) else out[0]
        tmp = f"/tmp/ai_{idx}.jpg"
        shutil.copy(ai, tmp)
        # downsize for web (keep it crisp but reasonable)
        subprocess.run(["convert", tmp, "-resize", "1400x1400>", "-quality", "88", f"{OUT}/{idx}.jpg"],
                       stderr=subprocess.DEVNULL)
        os.remove(tmp)
        processed.append(idx)
        print(f"  {idx} ok", flush=True)
    except Exception as e:
        print(f"  {idx} FAIL {type(e).__name__}: {str(e)[:120]}", flush=True)
        state.setdefault("failed", []);
        if idx not in state["failed"]: state["failed"].append(idx)

done |= set(processed)
json.dump({"done": sorted(done), "failed": state.get("failed", [])}, open(STATE, "w"))
print(f"AI-restored {len(processed)} this run; total {len(done)}", flush=True)

# commit + push this batch
if processed:
    env = dict(os.environ, GIT_SSH_COMMAND="ssh -i /tmp/gh_key -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o BatchMode=yes")
    subprocess.run(["git", "add", OUT, STATE], cwd="/workspace")
    subprocess.run(["git", "commit", "-q", "-m", f"AI restore batch: +{len(processed)} (total {len(done)})"], cwd="/workspace", env=env)
    subprocess.run(["git", "push", "origin", "main"], cwd="/workspace", env=env)
    print("pushed batch", flush=True)

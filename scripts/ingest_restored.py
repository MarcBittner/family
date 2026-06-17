#!/usr/bin/env python3
"""Ingest a Colab restored.zip into the site.
The notebook already named files pNNNN.jpg and sized them ~1400px, so this just:
  - unzips, copies into montage/restored/ (non-destructive: montage/full/ untouched)
  - records every id into ai_state.json 'done'
  - reports counts
Usage: python3 scripts/ingest_restored.py /path/to/restored.zip
"""
import json, os, sys, zipfile, shutil, tempfile

if len(sys.argv) < 2:
    print("usage: ingest_restored.py <restored.zip>"); sys.exit(1)
zp = sys.argv[1]
if not os.path.exists(zp):
    print("no such file:", zp); sys.exit(1)

OUT = "montage/restored"
STATE = "scripts/ai_state.json"
os.makedirs(OUT, exist_ok=True)
state = json.load(open(STATE)) if os.path.exists(STATE) else {"done": [], "failed": []}
done = set(state["done"])

tmp = tempfile.mkdtemp()
with zipfile.ZipFile(zp) as z:
    z.extractall(tmp)

added = []
for root, _, files in os.walk(tmp):
    for f in files:
        if not f.lower().endswith((".jpg", ".jpeg", ".png")):
            continue
        idx = os.path.splitext(f)[0]          # pNNNN
        shutil.copy(os.path.join(root, f), os.path.join(OUT, f"{idx}.jpg"))
        added.append(idx)

done |= set(added)
# drop any newly-restored ids out of the failed list
failed = [i for i in state.get("failed", []) if i not in done]
json.dump({"done": sorted(done), "failed": failed}, open(STATE, "w"))
shutil.rmtree(tmp, ignore_errors=True)
print(f"ingested {len(added)} restored photos; total done {len(done)}")

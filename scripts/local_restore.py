#!/usr/bin/env python3
"""Local CPU face-restoration with CodeFormer — no GPU, no quota, no external service.
Loads the model ONCE and streams photos through it one at a time (memory-frugal),
writing montage/restored/<id>.jpg. Non-destructive: montage/full/ is never modified.
Prioritizes favorites + montage photos so the important ones finish first.
Commits + pushes every few photos so progress is durable.

Run with the venv python:  /workspace/.aienv/bin/python scripts/local_restore.py [LIMIT]
"""
import json, os, re, sys, subprocess, time, gc

ROOT = "/workspace"
CF = os.path.join(ROOT, ".codeformer")
OUT = os.path.join(ROOT, "montage", "restored")
STATE = os.path.join(ROOT, "scripts", "ai_state.json")
LIMIT = int(sys.argv[1]) if len(sys.argv) > 1 else 10_000

sys.path.insert(0, CF)
os.chdir(CF)

import torch
torch.set_num_threads(max(1, (os.cpu_count() or 4) - 2))
import cv2, numpy as np
from torchvision.transforms.functional import normalize
from basicsr.utils import img2tensor, tensor2img
from basicsr.utils.registry import ARCH_REGISTRY
from facelib.utils.face_restoration_helper import FaceRestoreHelper

device = "cpu"

# ---- load model once ----
net = ARCH_REGISTRY.get("CodeFormer")(dim_embd=512, codebook_size=1024, n_head=8,
        n_layers=9, connect_list=["32", "64", "128", "256"]).to(device)
ckpt = torch.load(os.path.join(CF, "weights/CodeFormer/codeformer.pth"), map_location="cpu")["params_ema"]
net.load_state_dict(ckpt)
net.eval()

def restore_one(src_path, dst_path, w=0.7):
    helper = FaceRestoreHelper(1, face_size=512, crop_ratio=(1, 1), det_model="retinaface_resnet50",
                               save_ext="png", use_parse=True, device=device)
    helper.clean_all()
    img = cv2.imread(src_path, cv2.IMREAD_COLOR)
    if img is None:
        return False
    # cap size to keep CPU/RAM in check
    h, wd = img.shape[:2]
    m = max(h, wd)
    if m > 1500:
        s = 1500 / m
        img = cv2.resize(img, (int(wd * s), int(h * s)), interpolation=cv2.INTER_AREA)
    helper.read_image(img)
    n = helper.get_face_landmarks_5(only_center_face=False, resize=640, eye_dist_threshold=5)
    helper.align_warp_face()
    for cropped in helper.cropped_faces:
        t = img2tensor(cropped / 255., bgr2rgb=True, float32=True)
        normalize(t, (0.5,) * 3, (0.5,) * 3, inplace=True)
        t = t.unsqueeze(0).to(device)
        with torch.no_grad():
            out = net(t, w=w, adain=True)[0]
            restored = tensor2img(out, rgb2bgr=True, min_max=(-1, 1))
        del t, out
        helper.add_restored_face(restored.astype("uint8"))
    helper.get_inverse_affine(None)
    result = helper.paste_faces_to_input_image(upsample_img=None)
    cv2.imwrite(dst_path, result, [cv2.IMWRITE_JPEG_QUALITY, 90])
    del helper, img, result
    gc.collect()
    return True

# ---- build queue (favorites + montage first), skip already-AI-done ----
data = open(os.path.join(ROOT, "data.js")).read()
arr = json.loads(data[data.index("["):data.rindex("]") + 1])
state = json.load(open(STATE)) if os.path.exists(STATE) else {"done": [], "failed": []}
done = set(state["done"])
mtxt = open(os.path.join(ROOT, "js", "montage.js")).read()
montage_ids = set(re.findall(r"montage/(?:full|restored)/(\d{4})\.jpg", mtxt))

def full_path(p):
    idx = p["id"]
    if idx.startswith("p") and os.path.exists(os.path.join(ROOT, f"montage/full/{idx[1:]}.jpg")):
        return os.path.join(ROOT, f"montage/full/{idx[1:]}.jpg")
    return os.path.join(ROOT, p["src"]) if not p["src"].startswith("/") else p["src"]

queue = [p for p in arr if not p.get("hidden") and p.get("kind") != "video" and p["id"] not in done]
def prio(p):
    if p.get("fav"): return 0
    if p["id"].startswith("p") and p["id"][1:] in montage_ids: return 1
    return 2
queue.sort(key=prio)
print(f"queue: {len(queue)} to restore (favorites + montage first)", flush=True)

GIT_SSH = "ssh -i /tmp/gh_key -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o BatchMode=yes"
def push(done):
    env = dict(os.environ, GIT_SSH_COMMAND=GIT_SSH)
    json.dump({"done": sorted(done), "failed": state.get("failed", [])}, open(STATE, "w"))
    subprocess.run(["git", "add", OUT, STATE], cwd=ROOT)
    subprocess.run(["git", "commit", "-q", "-m", f"local AI restore: total {len(done)}"], cwd=ROOT, env=env)
    subprocess.run(["git", "push", "-q", "origin", "main"], cwd=ROOT, env=env)

n = 0
t0 = time.time()
for p in queue[:LIMIT]:
    idx = p["id"]
    src = full_path(p)
    if not os.path.exists(src):
        continue
    dst = os.path.join(OUT, f"{idx}.jpg")
    try:
        t = time.time()
        ok = restore_one(src, dst)
        if ok:
            done.add(idx); n += 1
            print(f"  {idx} ok  ({time.time()-t:.0f}s)  [{n}]", flush=True)
        else:
            print(f"  {idx} skip (unreadable)", flush=True)
    except Exception as e:
        print(f"  {idx} FAIL {type(e).__name__}: {str(e)[:100]}", flush=True)
        state.setdefault("failed", [])
        if idx not in state["failed"]:
            state["failed"].append(idx)
    if n and n % 5 == 0:
        push(done)
        print(f"  --- pushed; {n} done, avg {(time.time()-t0)/n:.0f}s/photo ---", flush=True)

if n:
    push(done)
print(f"FINISHED this run: +{n}; total {len(done)}", flush=True)

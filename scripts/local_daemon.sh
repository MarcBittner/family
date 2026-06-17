#!/bin/bash
# Self-restarting local CPU restoration. Resumes from ai_state.json on any crash.
cd /workspace || exit 1
log(){ echo "$(date '+%m-%d %H:%M') $*"; }
cp /gits/*/docs/spec/untracked/ghostlocalhost.pem /tmp/gh_key 2>/dev/null && chmod 600 /tmp/gh_key
for i in $(seq 1 200); do
  log "=== pass $i ==="
  out=$(.aienv/bin/python scripts/local_restore.py 2>&1)
  echo "$out" | tail -40
  if echo "$out" | grep -q 'queue: 0 '; then log "ALL DONE"; break; fi
  if echo "$out" | grep -q 'FINISHED'; then
    # finished a run; check if queue now empty next pass
    sleep 5
  else
    log "crash/exit — restarting in 20s"; sleep 20
  fi
done
log "daemon exiting"

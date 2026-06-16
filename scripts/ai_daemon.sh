#!/bin/bash
# Self-sustaining AI-restoration daemon: processes a batch, commits+pushes (the worker does),
# sleeps short between batches and long when the free GPU quota is exhausted, until all done.
cd /workspace || exit 1
log(){ echo "$(date '+%m-%d %H:%M') $*"; }

# re-derive keys (in case /tmp was cleared) from the gitignored untracked creds
rederive(){
  grep -rhoE 'hf_[A-Za-z0-9]{34}' docs/spec/untracked/credentials.md 2>/dev/null | head -1 > /tmp/hf_key
  for k in /gits/*/docs/spec/untracked/ghostlocalhost.pem; do
    [ -s "$k" ] && cp "$k" /tmp/gh_key && chmod 600 /tmp/gh_key && break
  done
}
rederive

while true; do
  out=$(python3 scripts/ai_restore_worker.py 8 2>&1)
  got=$(echo "$out" | grep -c ' ok$')
  log "batch: +$got  ($(echo "$out" | grep -oE 'total [0-9]+' | tail -1))"
  if echo "$out" | grep -q 'nothing to do'; then log "ALL DONE — exiting"; break; fi
  if [ "$got" -eq 0 ]; then
    log "quota/space wall — sleeping 2h"; rederive; sleep 7200
  else
    sleep 150
  fi
done

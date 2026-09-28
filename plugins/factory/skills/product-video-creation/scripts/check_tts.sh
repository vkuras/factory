#!/bin/sh
# Checks the render tools and the local Kokoro voice setup.
# Exit 0: ready. Exit 1: Kokoro is not set up yet (setup_kokoro.sh installs it,
# after the user agreed to the download). Exit 2: a tool is missing.
HOME_DIR="${PVC_HOME:-$HOME/.cache/product-video}"
PY="$HOME_DIR/kokoro/bin/python"
MODEL="${HF_HOME:-$HOME/.cache/huggingface}/hub/models--hexgrad--Kokoro-82M"
missing=""
command -v node >/dev/null 2>&1 || missing="$missing node"
command -v ffmpeg >/dev/null 2>&1 || missing="$missing ffmpeg"
ready=1
if [ -x "$PY" ] && "$PY" -c "import kokoro, soundfile" >/dev/null 2>&1 && ls "$MODEL"/snapshots/*/kokoro-v1_0.pth >/dev/null 2>&1; then
  echo "Kokoro: ready ($HOME_DIR/kokoro)"
  ready=0
else
  echo "Kokoro: not set up (expected in $HOME_DIR/kokoro)"
  base=""
  for p in python3.12 python3.11 python3.10 /opt/homebrew/bin/python3.12 /opt/homebrew/bin/python3.11 /usr/local/bin/python3.12; do
    command -v "$p" >/dev/null 2>&1 && { base="$p"; break; }
  done
  if [ -n "$base" ]; then echo "Python for the setup: $base"; else missing="$missing python3.10-3.12"; fi
fi
[ -n "$missing" ] && { echo "missing tools:$missing"; exit 2; }
exit $ready

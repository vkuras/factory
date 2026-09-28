#!/bin/sh
# Installs Kokoro, the local neural voice model (Apache-2.0), into
# $PVC_HOME/kokoro (default ~/.cache/product-video/kokoro). Downloads, about 1.3 GB:
#   PyPI         kokoro, soundfile and their dependencies (torch, spaCy, misaki)
#   GitHub       spaCy's English model en_core_web_sm (~13 MB)
#   Hugging Face hexgrad/Kokoro-82M: the model (~330 MB) and the cast voices (~0.5 MB each)
# Run it only after the user agreed to the download.
set -e
HOME_DIR="${PVC_HOME:-$HOME/.cache/product-video}"
ENGINE="$(cd "$(dirname "$0")/../engine" && pwd)"
base=""
for p in python3.12 python3.11 python3.10 /opt/homebrew/bin/python3.12 /opt/homebrew/bin/python3.11 /usr/local/bin/python3.12; do
  command -v "$p" >/dev/null 2>&1 && { base="$p"; break; }
done
[ -n "$base" ] || { echo "Kokoro needs Python 3.10–3.12: brew install python@3.12" >&2; exit 2; }
mkdir -p "$HOME_DIR"
echo "creating $HOME_DIR/kokoro with $base"
"$base" -m venv "$HOME_DIR/kokoro"
PY="$HOME_DIR/kokoro/bin/python"
"$PY" -m pip install -q --upgrade pip
"$PY" -m pip install -q "kokoro>=0.9.4,<1" soundfile
"$PY" -m spacy download en_core_web_sm >/dev/null
# Download the model and every voice in the cast list by rendering one word each.
TMP="$(mktemp -d)"
VOICES="$(node -e "import('$ENGINE/voices.mjs').then((m) => console.log(Object.keys(m.VOICES).join(' ')))")"
node -e "
const v = process.argv[1].split(' ');
console.log(JSON.stringify(v.map((id) => ({ id, voice: id, text: 'Ready.', out: process.argv[2] + '/' + id + '.wav' }))));
" "$VOICES" "$TMP" > "$TMP/jobs.json"
(cd "$ENGINE" && "$PY" kokoro_tts.py "$TMP/jobs.json" >/dev/null)
rm -rf "$TMP"
echo "Kokoro is ready: $HOME_DIR/kokoro ($(du -sh "$HOME_DIR/kokoro" | cut -f1)), voices: $VOICES"

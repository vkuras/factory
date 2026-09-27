#!/bin/sh
# Lists the installed English premium voices and checks the render tools.
# Exit 1: no English premium voice installed (the video must not be made with
# standard or enhanced voices). Exit 2: a tool is missing.
voices=$(say -v '?' 2>/dev/null | grep '(Premium)' | grep -E '\ben_[A-Z]{2}\b')
count=$(printf '%s' "$voices" | grep -c 'Premium')
missing=""
command -v node >/dev/null 2>&1 || missing="$missing node"
command -v ffmpeg >/dev/null 2>&1 || missing="$missing ffmpeg"
echo "English premium voices installed: $count"
[ "$count" -gt 0 ] && printf '%s\n' "$voices" | sed -E 's/^([A-Za-z ]+) \(Premium\) +(en_[A-Z]+).*/  \1  \2/'
[ -n "$missing" ] && echo "missing tools:$missing"
[ "$count" -eq 0 ] && exit 1
[ -n "$missing" ] && exit 2
exit 0

#!/bin/sh
# sheet.sh t1 t2 ... → out/sheet.png (2 columns, half size) from out/still-<t>.png
set -e
n=$#; [ "$n" -eq 1 ] && { ffmpeg -v error -y -i "out/still-$1.png" -vf scale=960:540 out/sheet.png; exit; }
inputs=""; for t in "$@"; do inputs="$inputs -i out/still-$t.png"; done
f=""; i=0; for t in "$@"; do f="$f[$i:v]scale=960:540[v$i];"; i=$((i+1)); done
i=0; for t in "$@"; do f="$f[v$i]"; i=$((i+1)); done
layout=""; i=0; for t in "$@"; do [ $i -gt 0 ] && layout="$layout|"; layout="$layout$(( (i % 2) * 960 ))_$(( (i / 2) * 540 ))"; i=$((i+1)); done
ffmpeg -v error -y $inputs -filter_complex "${f}xstack=inputs=$n:layout=$layout:fill=black" out/sheet.png

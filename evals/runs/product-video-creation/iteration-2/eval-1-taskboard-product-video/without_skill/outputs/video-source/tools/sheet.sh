#!/bin/bash
# sheet.sh <dir> <out.png> [cols] : tiles all PNGs in dir (sorted) into a labelled contact sheet
dir=$1; out=$2; cols=${3:-3}
files=($(ls "$dir"/t*.png | sort))
n=${#files[@]}
args=(); filt=""
for i in "${!files[@]}"; do
  args+=(-i "${files[$i]}")
  lbl=$(basename "${files[$i]}" .png)
  filt+="[$i:v]scale=640:360[v$i];"
done
rows=$(( (n + cols - 1) / cols ))
layout=""
for i in $(seq 0 $((n-1))); do c=$((i % cols)); r=$((i / cols)); layout+="$((c*640))_$((r*360))|"; done
inputs=""; for i in $(seq 0 $((n-1))); do inputs+="[v$i]"; done
ffmpeg -y -v error "${args[@]}" -filter_complex "${filt}${inputs}xstack=inputs=$n:layout=${layout%|}:fill=black" -frames:v 1 "$out"

#!/bin/bash
# mux.sh <silent.mp4> <audio.wav> <captions.srt> <out.mp4>
# Adds the soundtrack (AAC) and the narration captions as a soft, switchable English subtitle track.
set -euo pipefail
ffmpeg -y -v error -i "$1" -i "$2" -i "$3" \
  -map 0:v -map 1:a -map 2:s \
  -c:v copy -c:a aac -b:a 192k -c:s mov_text \
  -metadata title="Taskboard: the team's shared to-do list" \
  -metadata:s:a:0 language=eng -metadata:s:s:0 language=eng -metadata:s:s:0 title="English" \
  -movflags +faststart "$4"
ffprobe -v error -show_entries format=duration,size,bit_rate:stream=index,codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels -of compact "$4"

set -e
cd "$(dirname "$0")"
rm -f seg_*.mp4 list.txt
for n in 1-title 2-terminal 3-app 4-phone 5-end; do
  ss=$(node -e "console.log(require('./rec/offsets.json')['$n'])")
  len=$(node -e "console.log(require('./rec/offsets.json')['${n}_len'].toFixed(2))")
  fo=$(node -e "console.log(($len-0.3).toFixed(2))")
  ffmpeg -loglevel error -y -ss $ss -i rec/$n.webm -t $len -vf "fps=30,scale=1280:720,format=yuv420p,fade=t=in:st=0:d=0.3,fade=t=out:st=$fo:d=0.3" -c:v libx264 -crf 20 -preset medium -an seg_$n.mp4
  echo "file 'seg_$n.mp4'" >> list.txt
done
ffmpeg -loglevel error -y -f concat -safe 0 -i list.txt -c copy -movflags +faststart video.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 video.mp4

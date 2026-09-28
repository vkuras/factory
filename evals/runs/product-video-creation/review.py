#!/usr/bin/env python3
"""Builds the static eval viewer for one iteration, with the videos playable in the page.

    SKILL_CREATOR=<skill-creator dir> python3 review.py iteration-2 --previous iteration-1

Runs skill-creator's eval-viewer/generate_review.py --static <iteration>/review.html, then
patches the page so that video outputs render as <video controls> instead of a download
link, in both the current and the previous outputs.
"""
import argparse, os, re, subprocess, sys

ap = argparse.ArgumentParser()
ap.add_argument('iteration')
ap.add_argument('--previous')
args = ap.parse_args()

sc = os.environ.get('SKILL_CREATOR')
if not sc:
    sys.exit('Set SKILL_CREATOR to the skill-creator skill directory')
out = os.path.join(args.iteration, 'review.html')
cmd = [sys.executable, os.path.join(sc, 'eval-viewer', 'generate_review.py'), args.iteration,
       '--skill-name', 'product-video-creation', '--benchmark', os.path.join(args.iteration, 'benchmark.json'), '--static', out]
if args.previous:
    cmd += ['--previous-workspace', args.previous]
subprocess.run(cmd, check=True)

# Each renderer ends its binary branch with <container>.appendChild(a): put a video
# branch in front of it that appends to the same container.
html = open(out).read()
branch = re.compile(r'\} else if \(file\.type === "binary"\) \{(?=(?:(?!\} else if).)*?(\w+)\.appendChild\(a\);)', re.S)


def video(m):
    return ('} else if (file.type === "binary" && /^video\\//.test(file.mime || "")) {\n'
            '          const v = document.createElement("video");\n'
            '          v.controls = true; v.preload = "metadata"; v.src = file.data_uri;\n'
            '          v.style.cssText = "width:100%;max-width:960px;display:block;border-radius:6px;background:#000";\n'
            f'          {m.group(1)}.appendChild(v);\n'
            '        ' + m.group(0))


html, n = branch.subn(video, html)
open(out, 'w').write(html)
print(f'{out}: {os.path.getsize(out) / 1e6:.1f} MB, video player added to {n} renderers')

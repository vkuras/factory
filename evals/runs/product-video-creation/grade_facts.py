#!/usr/bin/env python3
"""Collects the checkable facts of every run in an iteration, for grading.

    python3 grade_facts.py iteration-2 > iteration-2/facts.json

Per run: the videos (resolution, audio, length), the voices and [[slnc]] marks in
lines.mjs, speaker pairs that share gender and locale, whether scene 3 was
recorded live (flows/ + recordings/), the README head, the target length in
package.json, and how many questions were asked.
"""
import glob, json, os, re, subprocess, sys

CAST = {  # engine/voices.mjs
    'af_heart': 'US f', 'af_bella': 'US f', 'af_nicole': 'US f', 'af_aoede': 'US f', 'af_kore': 'US f',
    'af_sarah': 'US f', 'af_alloy': 'US f', 'af_nova': 'US f', 'am_fenrir': 'US m', 'am_michael': 'US m',
    'am_puck': 'US m', 'bf_emma': 'UK f', 'bf_isabella': 'UK f', 'bm_george': 'UK m', 'bm_fable': 'UK m',
}


def probe(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,width,height:format=duration',
                          '-of', 'json', path], capture_output=True, text=True).stdout
    d = json.loads(out or '{}')
    v = next((s for s in d.get('streams', []) if s.get('codec_type') == 'video'), {})
    return {'file': os.path.relpath(path), 'size': f"{v.get('width')}x{v.get('height')}",
            'audio': any(s.get('codec_type') == 'audio' for s in d.get('streams', [])),
            'seconds': round(float(d.get('format', {}).get('duration', 0)), 1)}


def lines_facts(path):
    src = open(path).read()
    lines = re.findall(r"\{\s*id:\s*'([^']+)'\s*,\s*voice:\s*'([^']+)'(.*?)\}\s*,?\s*\n", src, re.S)
    voices = [(i, v) for i, v, _ in lines]
    slnc = sum(len(re.findall(r'\[\[slnc \d+\]\]', rest)) for _, _, rest in lines)
    alike = [f'{a[0]}({a[1]})→{b[0]}({b[1]})' for a, b in zip(voices, voices[1:])
             if a[1] != b[1] and CAST.get(a[1]) and CAST.get(a[1]) == CAST.get(b[1])]
    return {'lines': len(voices), 'voices': sorted({v for _, v in voices}),
            'not_in_cast': sorted({v for _, v in voices if v not in CAST}), 'slnc_marks': slnc, 'alike_neighbours': alike}


def run_facts(run):
    repo, out = os.path.join(run, 'repo'), os.path.join(run, 'outputs')
    f = {'run': run, 'videos': [probe(p) for p in sorted(glob.glob(f'{out}/video*.mp4'))],
         'repo_videos': [os.path.relpath(p, repo) for p in sorted(glob.glob(f'{repo}/videos/*.mp4'))]}
    projects = [p for p in glob.glob(f'{repo}/videos/*/') if os.path.exists(p + 'package.json')]
    f['projects'] = []
    for p in projects:
        pf = {'dir': os.path.relpath(p, repo), 'flows': sorted(os.path.basename(x) for x in glob.glob(p + 'flows/*.mjs')),
              'recordings': sorted(os.path.basename(x) for x in glob.glob(p + 'recordings/*.json'))}
        try:
            pf['target'] = json.load(open(p + 'package.json')).get('video', {}).get('target')
        except Exception:
            pf['target'] = None
        if os.path.exists(p + 'lines.mjs'):
            pf.update(lines_facts(p + 'lines.mjs'))
        code = ''.join(open(x).read() for x in glob.glob(p + 'scenes/*.js') + glob.glob(p + 'flows/*.mjs'))
        pf['speed_over_1'] = re.findall(r'speed:\s*(1\.[0-9]*[1-9]|[2-9](?:\.\d+)?)', code)
        pf['page_fill'] = '.fill(' in code
        f['projects'].append(pf)
    readme = os.path.join(repo, 'README.md')
    if os.path.exists(readme):
        body = [l for l in open(readme).read().splitlines()]
        h = next((i for i, l in enumerate(body) if l.startswith('# ')), None)
        nxt = next((l for l in body[h + 1:] if l.strip()), '') if h is not None else ''
        f['readme_after_headline'] = nxt[:160]
    q = os.path.join(out, 'questions.md')
    f['questions_md'] = os.path.exists(q)
    return f


it = sys.argv[1]
runs = sorted(glob.glob(f'{it}/eval-*/*_skill'))
print(json.dumps([run_facts(r) for r in runs], indent=1))

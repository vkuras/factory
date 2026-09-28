#!/usr/bin/env python3
"""Builds benchmark.json (in the eval viewer's schema) and benchmark.md for one iteration.

    python3 benchmark.py iteration-2 --previous iteration-1 --note "..." --note "..."

Per run it reads grading.json (pass rate) and timing.json (tokens, time), and the
eval's eval_metadata.json. benchmark.md compares pass rate, tokens and time with and
without the skill, and per eval with the previous iteration (matched by eval id).
"""
import argparse, glob, json, os, statistics as st
from datetime import datetime, timezone

KEYS = ('pass_rate', 'time_seconds', 'tokens')


def load(it):
    runs = []
    for g in sorted(glob.glob(f'{it}/eval-*/*_skill/grading.json')):
        run = os.path.dirname(g)
        meta = json.load(open(os.path.join(os.path.dirname(run), 'eval_metadata.json')))
        grading, timing = json.load(open(g)), json.load(open(os.path.join(run, 'timing.json')))
        s = grading['summary']
        runs.append({'eval_id': meta['eval_id'], 'eval_name': meta['eval_name'], 'configuration': os.path.basename(run),
                     'run_number': 1,
                     'result': {'pass_rate': s['pass_rate'], 'passed': s['passed'], 'failed': s['failed'], 'total': s['total'],
                                'time_seconds': timing['total_duration_seconds'], 'tokens': timing['total_tokens'],
                                'tool_calls': 0, 'errors': 0},
                     'expectations': grading['expectations'], 'notes': []})
    runs.sort(key=lambda r: (r['eval_id'], r['configuration'] != 'with_skill'))
    return runs


def summarise(runs):
    by = {}
    for r in runs:
        d = by.setdefault(r['configuration'], {k: [] for k in KEYS})
        for k in KEYS:
            d[k].append(r['result'][k])
    out = {c: {k: {'mean': round(st.mean(v), 3), 'stddev': round(st.pstdev(v), 3), 'min': min(v), 'max': max(v)}
               for k, v in d.items()} for c, d in by.items()}
    if 'with_skill' in out and 'without_skill' in out:
        w, b = out['with_skill'], out['without_skill']
        out['delta'] = {k: f"{w[k]['mean'] - b[k]['mean']:+.2f}" for k in KEYS}
    return out


def pct(new, old):
    return f'{(new - old) / old:+.0%}' if old else 'n/a'


def markdown(it, runs, summary, prev_it, prev_runs, notes):
    md = [f'# Benchmark · product-video-creation · {it}', '',
          '| Eval | Config | Passed | Pass rate | Tokens | Time |', '|---|---|---|---|---|---|']
    for r in runs:
        x = r['result']
        md.append(f"| eval-{r['eval_id']}-{r['eval_name']} | {r['configuration']} | {x['passed']}/{x['total']} | "
                  f"{x['pass_rate']:.0%} | {x['tokens']:,} | {x['time_seconds']:.0f} s |")
    md += ['', '| Config | Mean pass rate | Mean tokens | Mean time |', '|---|---|---|---|']
    for c in ('with_skill', 'without_skill'):
        if c in summary:
            s = summary[c]
            md.append(f"| {c} | {s['pass_rate']['mean']:.0%} | {s['tokens']['mean']:,.0f} | {s['time_seconds']['mean']:.0f} s |")
    # Compare with and without the skill only on evals that ran both ways.
    both = {r['eval_id'] for r in runs if r['configuration'] == 'with_skill'} & {r['eval_id'] for r in runs if r['configuration'] == 'without_skill'}
    if both:
        w, b = (summarise([r for r in runs if r['eval_id'] in both])[c] for c in ('with_skill', 'without_skill'))
        md.append(f"\nWith the skill, on the {len(both)} eval(s) run both ways: {w['pass_rate']['mean'] - b['pass_rate']['mean']:+.0%} pass rate, "
                  f"{pct(w['tokens']['mean'], b['tokens']['mean'])} tokens, {pct(w['time_seconds']['mean'], b['time_seconds']['mean'])} time.")
    if prev_runs:
        old = {(r['eval_id'], r['configuration']): r for r in prev_runs}
        md += ['', f'## Compared with {prev_it}', '',
               f'| Eval | Config | Pass rate | Tokens | Time |', '|---|---|---|---|---|']
        for r in runs:
            o = old.get((r['eval_id'], r['configuration']))
            if not o:
                md.append(f"| eval-{r['eval_id']}-{r['eval_name']} | {r['configuration']} | new eval | | |")
                continue
            a, x = o['result'], r['result']
            name = r['eval_name'] if o['eval_name'] == r['eval_name'] else f"{r['eval_name']} (was {o['eval_name']})"
            md.append(f"| eval-{r['eval_id']}-{name} | {r['configuration']} | {a['pass_rate']:.0%} → {x['pass_rate']:.0%} | "
                      f"{a['tokens']:,} → {x['tokens']:,} ({pct(x['tokens'], a['tokens'])}) | "
                      f"{a['time_seconds']:.0f} → {x['time_seconds']:.0f} s |")
    if notes:
        md += ['', '## Notes', ''] + [f'- {n}' for n in notes]
    return '\n'.join(md) + '\n'


ap = argparse.ArgumentParser()
ap.add_argument('iteration')
ap.add_argument('--previous')
ap.add_argument('--note', action='append', default=[])
args = ap.parse_args()

runs = load(args.iteration)
summary = summarise(runs)
prev_runs = load(args.previous) if args.previous else []
json.dump({'metadata': {'skill_name': 'product-video-creation', 'skill_path': 'plugins/factory/skills/product-video-creation',
                        'executor_model': 'claude-opus-5-5', 'analyzer_model': 'claude-opus-5-5',
                        'timestamp': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
                        'evals_run': sorted({r['eval_id'] for r in runs}), 'runs_per_configuration': 1},
           'runs': runs, 'run_summary': summary, 'notes': args.note},
          open(f'{args.iteration}/benchmark.json', 'w'), indent=2, ensure_ascii=False)
open(f'{args.iteration}/benchmark.md', 'w').write(markdown(args.iteration, runs, summary, args.previous, prev_runs, args.note))
print(open(f'{args.iteration}/benchmark.md').read())

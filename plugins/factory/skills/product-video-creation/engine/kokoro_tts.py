# Renders TTS jobs with Kokoro, the local neural voice model (Apache-2.0).
#   python kokoro_tts.py jobs.json
# jobs.json: [{"id": "p1", "voice": "af_heart", "text": "...", "speed": 1.0, "out": "audio/p1.24k.wav"}]
# Kokoro phrases a whole line at once, with its own pauses at sentence and list
# breaks. [[slnc N]] in the text adds a deliberate beat of N ms at that point.
import json, os, re, shutil, sys, warnings

warnings.filterwarnings('ignore')
import numpy as np
import soundfile as sf


def short_espeak_data():
    # espeak-ng (misaki's fallback for words it doesn't know) truncates data paths
    # longer than ~160 characters and then fails; misaki reads the path on import.
    import espeakng_loader
    path = espeakng_loader.get_data_path()
    if len(path) > 150:
        short = os.path.join(os.path.expanduser('~'), '.cache', 'product-video', 'espeak-ng-data')
        if not os.path.isdir(short):
            shutil.copytree(path, short)
        espeakng_loader.get_data_path = lambda: short


short_espeak_data()
from kokoro import KPipeline  # noqa: E402

SR = 24000
jobs = json.load(open(sys.argv[1]))
pipes = {}
for job in jobs:
    lang = job['voice'][0]  # 'a' American English, 'b' British English
    if lang not in pipes:
        pipes[lang] = KPipeline(lang_code=lang, repo_id='hexgrad/Kokoro-82M')
    parts = re.split(r'\[\[slnc (\d+)\]\]', job['text'])
    audio = []
    for i, part in enumerate(parts):
        if i % 2:
            audio.append(np.zeros(int(SR * int(part) / 1000), dtype=np.float32))
        elif part.strip():
            for _, _, a in pipes[lang](part.strip(), voice=job['voice'], speed=job.get('speed', 1.0)):
                audio.append(a.numpy() if hasattr(a, 'numpy') else np.asarray(a, dtype=np.float32))
    sf.write(job['out'], np.concatenate(audio), SR)
    print(f"  rendered {job['id']}", flush=True)

// The Kokoro English voices worth casting, with the grade Kokoro's authors give
// them (VOICES.md in hexgrad/Kokoro-82M). Voices graded below C are left out:
// they sound noticeably synthetic. Kokoro speaks two English locales: US and UK.
export const VOICES = {
  af_heart: { gender: 'female', locale: 'US', grade: 'A' },
  af_bella: { gender: 'female', locale: 'US', grade: 'A-' },
  af_nicole: { gender: 'female', locale: 'US', grade: 'B-', note: 'soft, close to the microphone' },
  af_aoede: { gender: 'female', locale: 'US', grade: 'C+' },
  af_kore: { gender: 'female', locale: 'US', grade: 'C+' },
  af_sarah: { gender: 'female', locale: 'US', grade: 'C+' },
  af_alloy: { gender: 'female', locale: 'US', grade: 'C' },
  af_nova: { gender: 'female', locale: 'US', grade: 'C' },
  am_fenrir: { gender: 'male', locale: 'US', grade: 'C+' },
  am_michael: { gender: 'male', locale: 'US', grade: 'C+' },
  am_puck: { gender: 'male', locale: 'US', grade: 'C+' },
  bf_emma: { gender: 'female', locale: 'UK', grade: 'B-' },
  bf_isabella: { gender: 'female', locale: 'UK', grade: 'C' },
  bm_george: { gender: 'male', locale: 'UK', grade: 'C' },
  bm_fable: { gender: 'male', locale: 'UK', grade: 'C' },
};

// Default narrator, and the order to cast everyone else in: each next voice
// differs from the previous one in gender or locale, so people who speak one
// after another never sound alike. Skip the narrator's voice for characters.
export const NARRATOR = 'af_heart';
export const CAST = ['am_michael', 'bf_emma', 'bm_george', 'af_bella', 'am_fenrir', 'bf_isabella', 'bm_fable', 'am_puck', 'af_sarah'];

export const label = (id) => (VOICES[id] ? `${VOICES[id].locale} ${VOICES[id].gender}` : 'not in the cast list');

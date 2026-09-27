// Builds the whole film on one timeline, then exposes seek(t) for the renderer.
// Drop scene 2 from the chain (and index.html) when the product needs no setup.
(async () => {
  await document.fonts.ready;
  const stage = document.getElementById('stage');
  const XF = 0.5; // crossfade between scenes
  let t = sceneProblem(stage, 0.3);
  t = sceneAccess(stage, t - XF);
  t = sceneProduct(stage, t - XF);
  t = sceneSummary(stage, t - XF);
  mountPointer(stage);
  await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
  window.TOTAL = +t.toFixed(3);
  window.CUES = { audio: V.audio, sfx: V.sfx };
  window.seek(+(new URLSearchParams(location.search).get('t') || 0));
  window.READY = true;
})();

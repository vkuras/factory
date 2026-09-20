// The only client code: switch between the three tab panels. It stores nothing, fetches nothing
// and sets no timer (R12); without it all three panels are visible one below the other.
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-tab]'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('[data-panel]'));
  if (tabs.length === 0) return;
  var KEYS = ['attention', 'pipeline', 'analytics'];

  function show(key) {
    panels.forEach(function (p) {
      p.hidden = p.getAttribute('data-panel') !== key;
    });
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-tab') === key;
      var badge = t.querySelector('.af-badge');
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.style.color = on ? '#E6E9EE' : '#6E7887';
      t.style.borderBottom = '2px solid ' + (on ? '#9EE84B' : 'transparent');
      if (badge) {
        badge.style.background = on ? '#9EE84B22' : '#191E25';
        badge.style.color = on ? '#9EE84B' : '#6E7887';
      }
    });
  }

  var requested = new URLSearchParams(window.location.search).get('tab');
  show(KEYS.indexOf(requested) >= 0 ? requested : 'attention');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      show(t.getAttribute('data-tab'));
    });
  });
})();

/* Start page: hardware project search and the chip marking in the hero. */
(function () {
  'use strict';

  // ---------- hardware project search ----------
  var q = document.getElementById('q');
  var fam = document.getElementById('fam');
  var status = document.getElementById('status');
  var empty = document.getElementById('empty');
  var reset = document.getElementById('reset');
  if (!q || !fam) return;

  var cards = Array.prototype.slice.call(document.querySelectorAll('.proj'));
  var groups = Array.prototype.slice.call(document.querySelectorAll('.pcat'));
  var chips = Array.prototype.slice.call(document.querySelectorAll('.cats a'));
  var total = cards.length;
  var data = cards.map(function (li) {
    return { el: li, s: li.getAttribute('data-s'), fam: li.getAttribute('data-fam') };
  });

  function norm(t) {
    return t.toLowerCase().replace(/[^a-z0-9+./ -]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function apply() {
    var terms = norm(q.value).split(' ').filter(Boolean);
    var f = fam.value;
    var shown = 0;
    data.forEach(function (d) {
      var ok = (!f || d.fam === f) && terms.every(function (t) { return d.s.indexOf(t) !== -1; });
      d.el.hidden = !ok;
      if (ok) shown++;
    });
    groups.forEach(function (g, i) {
      var n = g.querySelectorAll('.proj:not([hidden])').length;
      g.hidden = n === 0;
      g.querySelector('.n').textContent = n;
      var chip = chips[i];
      if (chip) {
        chip.querySelector('span').textContent = n;
        chip.classList.toggle('off', n === 0);
        if (n === 0) chip.setAttribute('aria-disabled', 'true'); else chip.removeAttribute('aria-disabled');
      }
    });
    var filtered = terms.length || f;
    status.textContent = filtered ? shown + ' of ' + total + ' projects' : total + ' projects';
    empty.hidden = shown !== 0;
    syncUrl();
  }

  // Keep the search in the address (?q=…&mcu=…) so a filtered list can be shared.
  function syncUrl() {
    if (!window.history || !history.replaceState) return;
    var p = new URLSearchParams(location.search);
    if (q.value.trim()) p.set('q', q.value.trim()); else p.delete('q');
    if (fam.value) p.set('mcu', fam.value); else p.delete('mcu');
    var s = p.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash);
  }

  var timer = 0;
  q.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(apply, 80); });
  fam.addEventListener('change', apply);
  q.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && q.value) { q.value = ''; apply(); }
  });
  reset.addEventListener('click', function () { q.value = ''; fam.value = ''; apply(); q.focus(); });
  chips.forEach(function (c) {
    c.addEventListener('click', function (e) { if (c.classList.contains('off')) e.preventDefault(); });
  });

  // "/" focuses the search, like on GitHub
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== q && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) {
      e.preventDefault();
      q.focus();
      q.scrollIntoView({ block: 'center' });
    }
  });

  var params = new URLSearchParams(location.search);
  if (params.get('q')) q.value = params.get('q');
  if (params.get('mcu')) fam.value = params.get('mcu');
  if (params.get('q') || params.get('mcu')) apply();

  // ---------- hero: cycle the marking on the chip ----------
  var mark = document.getElementById('chipname');
  var sub = mark && mark.nextElementSibling;
  if (!mark || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var parts = [['CH32V003', 'F4P6'], ['CH552E', 'WCH'], ['ATtiny13A', 'SSU'], ['CH32X035', 'F7P6'], ['ATtiny412', 'SSN'], ['PY32F002A', 'F15P'], ['STM32G030', 'F6P6']];
  var k = 0;
  setInterval(function () {
    if (document.hidden) return;
    k = (k + 1) % parts.length;
    mark.style.opacity = 0;
    setTimeout(function () {
      mark.textContent = parts[k][0];
      sub.textContent = parts[k][1];
      mark.style.opacity = 1;
    }, 350);
  }, 3200);
})();

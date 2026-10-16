(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement, hero = document.querySelector('.hero');
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function rnd(a, b) { return Math.round(a + Math.random() * (b - a)); }

  // 1. Títulos que se arman letra por letra
  document.querySelectorAll('.split').forEach(function (el) {
    var label = el.textContent.trim(), total = label.replace(/\s/g, '').length, k = 0;
    el.setAttribute('aria-label', label); el.textContent = '';
    label.split(/(\s+)/).forEach(function (w) {
      if (!w) return;
      if (/^\s+$/.test(w)) { el.appendChild(document.createTextNode(' ')); return; }
      var word = document.createElement('span'); word.className = 'w'; word.setAttribute('aria-hidden', 'true');
      Array.from(w).forEach(function (c) {
        var s = document.createElement('span'); s.className = 'ch'; s.textContent = c;
        s.style.cssText = '--k:' + (k++ / total).toFixed(3) + ';--dx:' + rnd(-90, 90) + 'px;--dy:' + rnd(-110, 110) + 'px;--dr:' + rnd(-120, 120) + 'deg';
        word.appendChild(s);
      });
      el.appendChild(word);
    });
  });

  // 2. Elementos ligados al scroll
  var items = [].map.call(document.querySelectorAll('[data-fx],.split'), function (el) {
    return { el: el, d: parseFloat(el.dataset.d) || 0, cur: 0, y: 0, v: '' };
  });
  function pageTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
  function measure() { items.forEach(function (it) { it.y = pageTop(it.el); }); }

  // 3. Logo del inicio: se arma por tiras y se desarma al bajar
  var box = document.getElementById('slices'), img = box && box.querySelector('img');
  var slices = [], t0 = performance.now(), N = 9;
  function build() {
    if (!img.naturalWidth || slices.length) return;
    for (var i = 0; i < N; i++) {
      var s = document.createElement('div'); s.className = 'sl';
      s.style.backgroundImage = 'url("' + img.src + '")';
      s.style.clipPath = 'inset(' + Math.max(0, i * 100 / N - 0.3) + '% 0 ' + Math.max(0, (N - 1 - i) * 100 / N - 0.3) + '% 0)';
      box.appendChild(s); slices.push(s);
    }
    box.classList.add('on'); t0 = performance.now(); kick();
  }
  if (box) { if (img.complete) build(); else img.addEventListener('load', build); }

  // 4. Bucle de animación (solo corre mientras algo se mueve)
  var running = false;
  function kick() { if (!running) { running = true; requestAnimationFrame(tick); } }
  function tick(now) {
    var h = window.innerHeight, w = window.innerWidth, sy = window.scrollY;
    var atEnd = sy + h >= root.scrollHeight - 2, moving = false, intro = false;
    items.forEach(function (it) {
      var p = clamp((h * 0.95 - (it.y - sy)) / (h * 0.42));
      p = clamp((p - it.d) / (1 - it.d)); p = 1 - Math.pow(1 - p, 3);
      if (atEnd && it.y - sy < h) p = 1;
      if (reduce) p = 1;
      var diff = p - it.cur;
      if (Math.abs(diff) < 0.001) it.cur = p; else { it.cur += reduce ? diff : diff * 0.14; moving = true; }
      var v = it.cur.toFixed(3);
      if (v !== it.v) { it.v = v; it.el.style.setProperty('--p', v); }
    });
    var hp = clamp(sy / (h * 0.9));
    if (hero) hero.style.setProperty('--hp', hp.toFixed(3));
    slices.forEach(function (s, i) {
      var ip = reduce ? 1 : clamp((now - t0 - i * 80) / 900); if (ip < 1) intro = true;
      var ep = 1 - Math.pow(1 - ip, 4), dir = i % 2 ? 1 : -1;
      s.style.transform = 'translate(' + (dir * ((1 - ep) * w * 0.8 + hp * (140 + i * 22))).toFixed(1) + 'px,' + (hp * (i - 4) * 16).toFixed(1) + 'px) rotate(' + (dir * hp * 4).toFixed(2) + 'deg)';
      s.style.opacity = clamp(ep * (1 - hp * 1.15)).toFixed(3);
    });
    if (moving || intro) requestAnimationFrame(tick); else running = false;
  }

  // 5. Barra de progreso y menú activo
  var bar = document.getElementById('progress'), links = document.querySelectorAll('nav a');
  var secs = Array.prototype.map.call(links, function (a) { return document.querySelector(a.getAttribute('href')); });
  function nav() {
    var y = window.scrollY, h = root.scrollHeight - window.innerHeight, cur = 0;
    bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < window.innerHeight * 0.4) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle('on', i === cur && y > 80); });
  }
  window.addEventListener('scroll', function () { nav(); kick(); }, { passive: true });
  window.addEventListener('resize', function () { measure(); kick(); });
  window.addEventListener('load', function () { measure(); kick(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); kick(); });
  measure(); nav(); kick();
})();

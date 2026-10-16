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

// 6. Grunge / nu-metal: glitch por velocidad de scroll, vibración, letras que reaccionan y amplificador
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var shake = [document.querySelector('header'), document.querySelector('main'), document.querySelector('footer')];
  var slider = document.getElementById('vol'), out = document.getElementById('volout'), mute = document.getElementById('mute');
  var secs = [].slice.call(document.querySelectorAll('header,section,footer'));
  var vol = 0, g = 0, imp = 0, lastY = window.scrollY, px = 0.5, py = 0.5, sx = 0.5, sy = 0.5, running = false, lastSec = -1;
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function kick() { if (!running) { running = true; requestAnimationFrame(loop); } }

  // Audio: acorde de poder distorsionado, solo suena cuando subes el volumen
  var ac = null, nodes = null, muted = false;
  function audioStart() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC || muted) return;
    ac = new AC();
    var master = ac.createGain(); master.gain.value = 0;
    var shaper = ac.createWaveShaper(), curve = new Float32Array(1024), k = 80, i;
    for (i = 0; i < 1024; i++) { var x = i / 512 - 1; curve[i] = (3 + k) * x * 20 * (Math.PI / 180) / (Math.PI + k * Math.abs(x)); }
    shaper.curve = curve; shaper.oversample = '4x';
    var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 4;
    var mix = ac.createGain(); mix.gain.value = 0.5;
    [[55, 'sawtooth', 0.4], [82.4, 'sawtooth', 0.4], [110.5, 'square', 0.3], [27.5, 'sine', 0.9]].forEach(function (f) {
      var o = ac.createOscillator(), gg = ac.createGain(); o.type = f[1]; o.frequency.value = f[0]; gg.gain.value = f[2];
      o.connect(gg); gg.connect(mix); o.start();
    });
    mix.connect(shaper); shaper.connect(lp); lp.connect(master); master.connect(ac.destination);
    nodes = { master: master, lp: lp };
  }
  function audioUpdate() {
    if (!ac || !nodes) return; var t = ac.currentTime;
    nodes.master.gain.setTargetAtTime(muted ? 0 : vol * vol * 0.14, t, 0.08);
    nodes.lp.frequency.setTargetAtTime(500 + g * 2600, t, 0.06);
  }
  document.addEventListener('visibilitychange', function () {
    if (!ac) return; if (document.hidden) ac.suspend(); else if (vol > 0) ac.resume();
  });

  if (slider) {
    slider.addEventListener('input', function () {
      vol = slider.value / 100; out.textContent = slider.value;
      slider.style.setProperty('--v', slider.value + '%'); root.style.setProperty('--vol', vol.toFixed(2));
      if (vol > 0) audioStart(); kick();
    });
    slider.addEventListener('change', function () { if (vol > 0) audioStart(); });
    mute.addEventListener('click', function () {
      muted = !muted; mute.setAttribute('aria-pressed', muted);
      if (!muted && vol > 0) audioStart(); kick();
    });
  }

  // Interacción: puntero, scroll, toques y clics
  window.addEventListener('pointermove', function (e) { px = e.clientX / window.innerWidth; py = e.clientY / window.innerHeight; kick(); }, { passive: true });
  window.addEventListener('scroll', kick, { passive: true });
  document.addEventListener('pointerover', function (e) {
    var t = e.target;
    if (t.classList && t.classList.contains('ch') && !t.classList.contains('hit')) {
      t.classList.add('hit'); setTimeout(function () { t.classList.remove('hit'); }, 460);
    }
  }, { passive: true });
  document.addEventListener('pointerdown', function (e) {
    imp = Math.max(imp, 0.5);
    var s = e.target.closest && e.target.closest('.split');
    if (s && !s.classList.contains('blast')) { s.classList.add('blast'); imp = 0.9; setTimeout(function () { s.classList.remove('blast'); }, 1100); }
    kick();
  }, { passive: true });

  function loop() {
    var y = window.scrollY, v = reduce ? 0 : Math.abs(y - lastY); lastY = y;
    var c = 0, h = window.innerHeight;
    secs.forEach(function (s, i) { if (s.getBoundingClientRect().top < h * 0.4) c = i; });
    if (lastSec > -1 && c !== lastSec && !reduce) imp = 1; lastSec = c;
    imp *= 0.9; if (reduce) imp = 0;
    var target = clamp(Math.max(v / 45, vol, imp * 0.8));
    g += (target - g) * (target > g ? 0.5 : 0.08);
    sx += (px - sx) * 0.12; sy += (py - sy) * 0.12;
    var jx = g > 0.04 && !reduce ? (Math.random() - 0.5) * g * 12 : 0;
    root.style.setProperty('--g', g.toFixed(3));
    root.style.setProperty('--gx', ((sx - 0.5) * 14 + jx).toFixed(1) + 'px');
    root.style.setProperty('--gy', ((sy - 0.5) * 8).toFixed(1) + 'px');
    root.classList.toggle('glitching', g > 0.03);
    var on = !reduce && vol > 0.02;
    shake.forEach(function (el) { if (el) el.style.translate = on ? ((Math.random() - 0.5) * vol * 6).toFixed(1) + 'px ' + ((Math.random() - 0.5) * vol * 4).toFixed(1) + 'px' : ''; });
    audioUpdate();
    if (g < 0.01 && Math.abs(px - sx) < 0.002 && Math.abs(py - sy) < 0.002 && vol <= 0.02) running = false;
    else requestAnimationFrame(loop);
  }
  kick();
})();

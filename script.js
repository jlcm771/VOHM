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
        var s = document.createElement('span'), ha = document.createElement('i'), hb = document.createElement('i'); s.className = 'ch'; ha.className = 'a'; hb.className = 'b'; ha.textContent = hb.textContent = c; s.appendChild(ha); s.appendChild(hb);
        s.style.cssText = '--k:' + (k++ / total).toFixed(3) + ';--dx:' + rnd(-90, 90) + 'px;--dy:' + rnd(-110, 110) + 'px;--dr:' + rnd(-120, 120) + 'deg;--cs:' + (rnd(0, 1) ? 1 : -1) * rnd(7, 17) + ';--cp:' + rnd(34, 64);
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
  var vol = 0, cut = 0, cdir = 1, g = 0, imp = 0, lastY = window.scrollY, px = 0.5, py = 0.5, sx = 0.5, sy = 0.5, running = false, lastSec = -1;
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function kick() { if (!running) { running = true; requestAnimationFrame(loop); } }

  // Audio: riff original de guitarra saturada y sucia (afinación grave, estilo alt-metal) sintetizado en el navegador
  var ac = null, nodes = null, muted = false, timer = null, nextT = 0, stepN = 0, cache = {}, noiseBuf = null;
  var STEP = 60 / 88 / 4;
  var CM9 = [36, 48, 55, 62, 63], ABM7 = [44, 51, 55, 60, 70], FM7 = [41, 48, 51, 56, 60], DBM7 = [37, 44, 48, 55, 60];
  var PAT = [
    [[0, 'p', [36, 43, 48]], [3, 'm', [36]], [4, 'm', [36]], [6, 'm', [36]], [8, 'p', [37, 44, 49]], [11, 'm', [37]], [12, 'm', [36]], [14, 'm', [36]]],
    [[0, 'p', [36, 43, 48]], [3, 'm', [36]], [4, 'm', [36]], [6, 'm', [36]], [8, 'p', [39, 46, 51]], [10, 'p', [37, 44, 49]], [12, 'm', [36]], [13, 'm', [36]], [14, 'm', [36]], [15, 'm', [36]]],
    [[0, 'o', CM9], [8, 'o', ABM7]],
    [[0, 'o', FM7], [8, 'o', DBM7], [14, 'm', [36]]]
  ];
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function curve(k, bias) {
    var c = new Float32Array(2048), i;
    for (i = 0; i < 2048; i++) { var x = i / 1024 - 1; c[i] = Math.tanh(x * k + bias) - Math.tanh(bias); }
    return c;
  }
  // Cuerda pulsada (Karplus-Strong): 'm' = palm mute corto, 'p' = acorde de poder, 'o' = acorde abierto que resuena
  function pluckBuf(m, type) {
    var key = m + type; if (cache[key]) return cache[key];
    var sr = ac.sampleRate, P = Math.max(2, Math.round(sr / hz(m)));
    var dur = type === 'm' ? 0.28 : type === 'p' ? 1.3 : 3.4, dec = type === 'm' ? 0.93 : type === 'p' ? 0.9965 : 0.9992;
    var n = Math.floor(sr * dur), buf = ac.createBuffer(1, n, sr), d = buf.getChannelData(0), ring = new Float32Array(P), i, j, mx = 0, idx = 0;
    for (i = 0; i < P; i++) ring[i] = Math.random() * 2 - 1;
    for (j = 0; j < 2; j++) for (i = 1; i < P; i++) ring[i] = (ring[i] + ring[i - 1]) * 0.5;
    for (i = 0; i < P; i++) mx = Math.max(mx, Math.abs(ring[i]));
    for (i = 0; i < P; i++) ring[i] /= mx || 1;
    for (i = 0; i < n; i++) { var nx = (idx + 1) % P; d[i] = ring[idx]; ring[idx] = (ring[idx] + ring[nx]) * 0.5 * dec; idx = nx; }
    var fade = Math.floor(sr * 0.05); for (i = 0; i < fade; i++) d[n - 1 - i] *= i / fade;
    return (cache[key] = { buf: buf, f0: sr / P });
  }
  function audioStart() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC || muted) return;
    ac = new AC();
    var i, bus = ac.createGain(), hp0 = ac.createBiquadFilter(), drive = ac.createGain(), s1 = ac.createWaveShaper(), mid = ac.createBiquadFilter();
    var s2 = ac.createWaveShaper(), g2 = ac.createGain(), hp = ac.createBiquadFilter(), pk = ac.createBiquadFilter(), cab = ac.createBiquadFilter();
    hp0.type = 'highpass'; hp0.frequency.value = 55; drive.gain.value = 2.5;
    s1.curve = curve(4, 0.25); s1.oversample = '4x';
    mid.type = 'peaking'; mid.frequency.value = 1100; mid.gain.value = 6; mid.Q.value = 0.8;
    s2.curve = curve(3, 0.1); s2.oversample = '4x'; g2.gain.value = 0.6;
    hp.type = 'highpass'; hp.frequency.value = 85;
    pk.type = 'peaking'; pk.frequency.value = 2200; pk.gain.value = -3; pk.Q.value = 1.2;
    cab.type = 'lowpass'; cab.frequency.value = 3200; cab.Q.value = 0.9;
    bus.connect(hp0); hp0.connect(drive); drive.connect(s1); s1.connect(mid); mid.connect(s2); s2.connect(g2); g2.connect(hp); hp.connect(pk); pk.connect(cab);
    var master = ac.createGain(), comp = ac.createDynamicsCompressor(), dry = ac.createGain(), drum = ac.createGain();
    master.gain.value = 0; comp.threshold.value = -20; comp.ratio.value = 6; comp.attack.value = 0.005; comp.release.value = 0.2;
    dry.gain.value = 0.85; drum.gain.value = 0.7;
    var rv = ac.createConvolver(), rg = ac.createGain(), len = Math.floor(ac.sampleRate * 2.6), ir = ac.createBuffer(2, len, ac.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var dd = ir.getChannelData(ch); for (i = 0; i < len; i++) dd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8); }
    rv.buffer = ir; rg.gain.value = 0.35;
    var dl = ac.createDelay(1.5), fb = ac.createGain(), dlp = ac.createBiquadFilter(), dg = ac.createGain();
    dl.delayTime.value = STEP * 3; fb.gain.value = 0.38; dlp.type = 'lowpass'; dlp.frequency.value = 2200; dg.gain.value = 0.3;
    cab.connect(dry); dry.connect(master); cab.connect(rv); rv.connect(rg); rg.connect(master);
    cab.connect(dl); dl.connect(dlp); dlp.connect(fb); fb.connect(dl); dlp.connect(dg); dg.connect(master);
    drum.connect(master); drum.connect(rv);
    master.connect(comp); comp.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.4), ac.sampleRate);
    var nd = noiseBuf.getChannelData(0); for (i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    nodes = { bus: bus, master: master, drive: drive, cab: cab, drum: drum };
    audioUpdate();
  }
  function strum(midis, type, t, vel) {
    midis.forEach(function (m, i) {
      var b = pluckBuf(m, type), reps = type === 'm' ? [0] : [-6, 6];
      reps.forEach(function (c) {
        var s = ac.createBufferSource(), g = ac.createGain();
        s.buffer = b.buf; s.playbackRate.value = hz(m) / b.f0; s.detune.value = c;
        g.gain.value = vel * (type === 'o' ? 0.55 : 0.8) * 1.4 / reps.length;
        s.connect(g); g.connect(nodes.bus); s.start(t + i * 0.011);
      });
    });
  }
  function kick(t, v) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.13);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    o.connect(g); g.connect(nodes.drum); o.start(t); o.stop(t + 0.4);
  }
  function snare(t, v) {
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), o = ac.createOscillator(), og = ac.createGain();
    s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.7;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    s.connect(f); f.connect(g); g.connect(nodes.drum); s.start(t); s.stop(t + 0.25);
    o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(130, t + 0.08);
    og.gain.setValueAtTime(v * 0.5, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(og); og.connect(nodes.drum); o.start(t); o.stop(t + 0.15);
  }
  function playStep(n, t) {
    var bar = Math.floor(n / 16) % 4, s = n % 16, heavy = bar < 2;
    t += Math.random() * 0.008;
    PAT[bar].forEach(function (e) {
      if (e[0] !== s) return;
      strum(e[2], e[1], t, e[1] === 'm' ? 0.65 + Math.random() * 0.2 : 0.9);
      if (heavy) kick(t, e[1] === 'm' ? 0.6 : 0.95);
    });
    if (heavy && (s === 4 || s === 12)) snare(t, 0.55);
    if (!heavy) { if (s === 0 || s === 8) kick(t, 0.55); if (s === 12) snare(t, 0.25); }
  }
  function sched() { while (nextT < ac.currentTime + 0.3) { playStep(stepN, nextT); nextT += STEP; stepN = (stepN + 1) % 64; } }
  function seq(on) {
    if (!ac || !nodes) return;
    if (on && !timer) { nextT = ac.currentTime + 0.1; stepN = 0; timer = setInterval(sched, 50); }
    else if (!on && timer) { clearInterval(timer); timer = null; }
  }
  function audioUpdate() {
    if (!ac || !nodes) return;
    var t = ac.currentTime, on = vol > 0 && !muted;
    seq(on);
    nodes.master.gain.setTargetAtTime(on ? Math.min(0.4, Math.pow(vol, 1.5) * 0.42) : 0, t, 0.08);
    nodes.drive.gain.setTargetAtTime(2.5 + vol * 6, t, 0.1);
    nodes.cab.frequency.setTargetAtTime(2600 + g * 2400, t, 0.06);
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
  document.addEventListener('pointerdown', function (e) {
    imp = Math.max(imp, 0.5);
    kick();
  }, { passive: true });

  function loop() {
    var y = window.scrollY, dy = y - lastY, v = reduce ? 0 : Math.abs(dy); lastY = y; if (dy) cdir = dy > 0 ? 1 : -1;
    var c = 0, h = window.innerHeight;
    secs.forEach(function (s, i) { if (s.getBoundingClientRect().top < h * 0.4) c = i; });
    if (lastSec > -1 && c !== lastSec && !reduce) imp = 1; lastSec = c;
    imp *= 0.9; if (reduce) imp = 0;
    var target = clamp(Math.max(v / 45, vol, imp * 0.8));
    g += (target - g) * (target > g ? 0.5 : 0.08);
    cut += (clamp(v / 30) - cut) * (v / 30 > cut ? 0.6 : 0.12); if (cut < 0.01) cut = 0;
    root.style.setProperty('--cut', cut.toFixed(3)); root.style.setProperty('--cd', cdir);
    sx += (px - sx) * 0.12; sy += (py - sy) * 0.12;
    var jx = g > 0.04 && !reduce ? (Math.random() - 0.5) * g * 12 : 0;
    root.style.setProperty('--g', g.toFixed(3));
    root.style.setProperty('--gx', ((sx - 0.5) * 14 + jx).toFixed(1) + 'px');
    root.style.setProperty('--gy', ((sy - 0.5) * 8).toFixed(1) + 'px');
    root.classList.toggle('glitching', g > 0.03);
    var on = !reduce && vol > 0.02;
    shake.forEach(function (el) { if (el) el.style.translate = on ? ((Math.random() - 0.5) * vol * 6).toFixed(1) + 'px ' + ((Math.random() - 0.5) * vol * 4).toFixed(1) + 'px' : ''; });
    audioUpdate();
    if (g < 0.01 && cut === 0 && Math.abs(px - sx) < 0.002 && Math.abs(py - sy) < 0.002 && vol <= 0.02) running = false;
    else requestAnimationFrame(loop);
  }
  kick();
})();

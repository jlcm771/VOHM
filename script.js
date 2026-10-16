(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  // 1. Aparición de elementos al hacer scroll
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.rv').forEach(function (el, i) {
    el.style.transitionDelay = (i % 3) * 90 + 'ms';
    io.observe(el);
  });

  // 2. Barra de progreso, parallax y menú activo
  var bar = document.getElementById('progress');
  var floats = document.querySelectorAll('.fl');
  floats.forEach(function (f) { f.style.setProperty('--k', f.dataset.speed || 0); });
  var links = document.querySelectorAll('nav a');
  var secs = Array.prototype.map.call(links, function (a) {
    return document.querySelector(a.getAttribute('href'));
  });
  var ticking = false;
  function onScroll() {
    var y = window.scrollY, h = root.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    if (!reduce) root.style.setProperty('--sy', -y + 'px');
    var cur = 0;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < window.innerHeight * 0.4) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle('on', i === cur && y > 80); });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  // 3. Foco de luz que sigue al cursor y tilt en tarjetas
  var spot = document.getElementById('spot');
  window.addEventListener('pointermove', function (e) {
    root.style.setProperty('--mx', e.clientX + 'px');
    root.style.setProperty('--my', e.clientY + 'px');
  }, { passive: true });
  if (!reduce) {
    document.querySelectorAll('.card').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        c.style.transform = 'perspective(700px) rotateY(' + x * 10 + 'deg) rotateX(' + -y * 10 + 'deg) translateZ(6px)';
      });
      c.addEventListener('pointerleave', function () { c.style.transform = ''; });
    });
  }

  // 4. Mundo interactivo: cadenas, cruces góticas y púas (canvas)
  var cv = document.getElementById('dust'), ctx = cv.getContext('2d');
  var TAU = Math.PI * 2, W = 0, H = 0, lw = 0, lh = 0, T = 0, lastY = window.scrollY, scrollV = 0;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var ptr = { x: -999, y: -999, vx: 0, vy: 0 };
  var chains = [], crosses = [], thorns = [], shocks = [];
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function wrap(a) { return ((a + Math.PI) % TAU + TAU) % TAU - Math.PI; }

  var crossPath = (function () {
    var p = new Path2D();
    [70, 52, 100, 52].forEach(function (L, k) {
      var a = k * Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
      [[-5, -5], [-5, -(L - 20)], [-14, -(L - 9)], [0, -L], [14, -(L - 9)], [5, -(L - 20)], [5, -5]].forEach(function (q, i) {
        var x = q[0] * c - q[1] * s, y = q[0] * s + q[1] * c;
        if (i) p.lineTo(x, y); else p.moveTo(x, y);
      });
      p.closePath();
    });
    p.moveTo(0, -11); p.lineTo(11, 0); p.lineTo(0, 11); p.lineTo(-11, 0); p.closePath();
    return p;
  })();
  var gradCross = ctx.createLinearGradient(-60, -100, 60, 100);
  gradCross.addColorStop(0, '#e6e8eb'); gradCross.addColorStop(0.35, '#80848a');
  gradCross.addColorStop(0.7, '#26282b'); gradCross.addColorStop(1, '#a4a8ae');
  var gradThorn = ctx.createLinearGradient(0, 0, 100, 0);
  gradThorn.addColorStop(0, '#161718'); gradThorn.addColorStop(0.6, '#74787e'); gradThorn.addColorStop(1, '#eceef0');

  function init() {
    var small = W < 820, i, j;
    chains = []; crosses = []; thorns = [];
    var nc = small ? 4 : 7;
    for (i = 0; i < nc; i++) {
      var L = rnd(15, 22), n = Math.max(8, Math.min(40, Math.floor(rnd(0.3, 0.85) * H / L)));
      var ax = (i + 0.5 + rnd(-0.25, 0.25)) * W / nc, nodes = [];
      for (j = 0; j < n; j++) nodes.push({ x: ax, y: -10 + j * L, px: ax - rnd(-2, 2), py: -10 + j * L });
      chains.push({ nodes: nodes, L: L, ax: ax, a: rnd(0.4, 0.85), cross: Math.random() < 0.6, spiky: Math.random() < 0.6, s: rnd(0.28, 0.4), ph: rnd(0, 6) });
    }
    for (i = 0; i < (small ? 7 : 12); i++) {
      var z = rnd(0.25, 1), r0 = rnd(-0.5, 0.5);
      crosses.push({ x: rnd(0, W), y: rnd(0, H), z: z, s: (0.2 + z * 0.5) * (small ? 0.8 : 1), rot0: r0, rot: r0, vr: 0, vx: 0, vy: 0, ph: rnd(0, 6) });
    }
    crosses.sort(function (a, b) { return a.z - b.z; });
    for (i = 0; i < (small ? 18 : 34); i++) {
      var side = i % 3, x, y, ang;
      if (side === 0) { x = rnd(-10, 20); y = rnd(0, H); ang = rnd(-0.9, 0.9); }
      else if (side === 1) { x = W + rnd(-20, 10); y = rnd(0, H); ang = Math.PI + rnd(-0.9, 0.9); }
      else { x = rnd(0, W); y = H + rnd(-10, 14); ang = -Math.PI / 2 + rnd(-0.9, 0.9); }
      thorns.push({ x: x, y: y, ang0: ang, ang: ang, av: 0, len: rnd(40, 95) * (small ? 0.8 : 1), ext: 1, ev: 0, w: rnd(0.7, 1.3), ph: rnd(0, 6) });
    }
  }

  // Puntero (mouse o dedo) y toque
  function setPtr(x, y) {
    var had = ptr.x > -900;
    ptr.vx = had ? x - ptr.x : 0; ptr.vy = had ? y - ptr.y : 0; ptr.x = x; ptr.y = y;
  }
  function leave() { ptr.x = ptr.y = -999; ptr.vx = ptr.vy = 0; }
  window.addEventListener('pointermove', function (e) { setPtr(e.clientX, e.clientY); }, { passive: true });
  ['touchstart', 'touchmove'].forEach(function (n) {
    window.addEventListener(n, function (e) { var t = e.touches[0]; if (t) setPtr(t.clientX, t.clientY); }, { passive: true });
  });
  window.addEventListener('touchend', leave, { passive: true });
  document.addEventListener('mouseleave', leave);
  window.addEventListener('pointerdown', function (e) { shocks.push({ x: e.clientX, y: e.clientY }); }, { passive: true });

  // Física
  function stepChain(c) {
    var n = c.nodes, i, k, p, a, b, dx, dy, d, f, diff;
    for (i = 1; i < n.length; i++) {
      p = n[i];
      var vx = (p.x - p.px) * 0.985, vy = (p.y - p.py) * 0.985;
      p.px = p.x; p.py = p.y;
      p.x += vx + Math.sin(T * 0.8 + c.ph + i * 0.3) * 0.05;
      p.y += vy + 0.55;
      dx = p.x - ptr.x; dy = p.y - ptr.y; d = Math.sqrt(dx * dx + dy * dy);
      if (d < 130 && d > 0.1) { f = 1 - d / 130; p.x += dx / d * f * 7 + ptr.vx * f * 0.25; p.y += dy / d * f * 3; }
      shocks.forEach(function (s) {
        var sx = p.x - s.x, sy = p.y - s.y, sd = Math.sqrt(sx * sx + sy * sy) || 1;
        if (sd < 380) { var g = 1 - sd / 380; p.x += sx / sd * g * 22; p.y += sy / sd * g * 10; }
      });
      p.x += (Math.random() - 0.5) * Math.abs(scrollV) * 0.08 * (i / n.length);
    }
    for (k = 0; k < 10; k++) {
      n[0].x = c.ax; n[0].y = -10;
      for (i = 0; i < n.length - 1; i++) {
        a = n[i]; b = n[i + 1]; dx = b.x - a.x; dy = b.y - a.y; d = Math.sqrt(dx * dx + dy * dy) || 1; diff = (d - c.L) / d;
        if (i === 0) { b.x -= dx * diff; b.y -= dy * diff; }
        else { a.x += dx * diff * 0.5; a.y += dy * diff * 0.5; b.x -= dx * diff * 0.5; b.y -= dy * diff * 0.5; }
      }
    }
  }
  function stepCross(c) {
    var dx = c.x - ptr.x, dy = c.y - ptr.y, d = Math.sqrt(dx * dx + dy * dy) || 1, R = 120 + 160 * c.z, f;
    if (d < R) {
      f = 1 - d / R;
      c.vx += dx / d * f * 0.6; c.vy += dy / d * f * 0.6;
      c.vr += (dx * ptr.vy - dy * ptr.vx) / d * 0.004 * f + dx / d * f * 0.01;
    }
    shocks.forEach(function (s) {
      var sx = c.x - s.x, sy = c.y - s.y, sd = Math.sqrt(sx * sx + sy * sy) || 1;
      if (sd < 420) { var g = 1 - sd / 420; c.vx += sx / sd * g * 14; c.vy += sy / sd * g * 14; c.vr += g * (Math.random() - 0.5) * 0.5; }
    });
    c.vr += wrap(c.rot0 - c.rot) * 0.004; c.vr *= 0.95; c.vx *= 0.94; c.vy *= 0.94;
    c.rot = (c.rot + c.vr) % TAU;
    c.x += c.vx + Math.sin(T * 0.3 + c.ph) * 0.25 * c.z;
    c.y += c.vy - 0.12 * c.z - scrollV * c.z * 0.5;
    var m = 170 * c.s + 20;
    if (c.y < -m) { c.y = H + m; c.x = rnd(0, W); } else if (c.y > H + m) { c.y = -m; c.x = rnd(0, W); }
    if (c.x < -m) c.x = W + m; else if (c.x > W + m) c.x = -m;
  }
  function stepThorn(t) {
    var dx = ptr.x - t.x, dy = ptr.y - t.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
    var target = t.ang0 + Math.sin(T * 0.7 + t.ph) * 0.06, ext = 1, k = 0.035;
    if (d < 300) { var f = 1 - d / 300; target = Math.atan2(dy, dx); ext = 1 + f * 0.55; k = 0.09; }
    shocks.forEach(function (s) {
      var sx = t.x - s.x, sy = t.y - s.y, sd = Math.sqrt(sx * sx + sy * sy);
      if (sd < 400) { t.ev += (1 - sd / 400) * 0.22; t.av += (Math.random() - 0.5) * 0.4; }
    });
    t.av += wrap(target - t.ang) * k; t.av *= 0.82; t.ang += t.av;
    t.ev += (ext - t.ext) * 0.12; t.ev *= 0.8; t.ext += t.ev;
  }

  // Dibujo
  function drawCross(x, y, r, s, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.scale(s, s); ctx.globalAlpha = a;
    ctx.fillStyle = gradCross; ctx.fill(crossPath);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3 / s; ctx.stroke(crossPath);
    ctx.strokeStyle = 'rgba(235,238,242,.55)'; ctx.lineWidth = 1 / s; ctx.stroke(crossPath);
    ctx.fillStyle = '#050505'; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(5, 0); ctx.lineTo(0, 5); ctx.lineTo(-5, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function drawThorn(t) {
    var L = t.len * t.ext; if (L < 4) return;
    ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.ang); ctx.scale(L / 100, t.w); ctx.globalAlpha = 0.75;
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.quadraticCurveTo(55, -5, 100, 3); ctx.quadraticCurveTo(55, 4, 0, 7); ctx.closePath();
    ctx.fillStyle = gradThorn; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.stroke();
    ctx.restore();
  }
  function drawChain(c) {
    var n = c.nodes, i, a, b, mx, my, ang, rx = c.L * 0.66;
    ctx.save(); ctx.globalAlpha = c.a;
    for (i = 0; i < n.length - 1; i++) {
      a = n[i]; b = n[i + 1]; mx = (a.x + b.x) / 2; my = (a.y + b.y) / 2; ang = Math.atan2(b.y - a.y, b.x - a.x);
      var flat = i % 2 === 0, ry = c.L * (flat ? 0.32 : 0.12);
      ctx.beginPath(); ctx.ellipse(mx, my, rx, ry, ang, 0, TAU);
      ctx.lineWidth = flat ? 5.5 : 4.5; ctx.strokeStyle = '#000'; ctx.stroke();
      ctx.lineWidth = flat ? 2.6 : 2.2; ctx.strokeStyle = i % 3 === 0 ? '#e1e3e6' : '#9da1a7'; ctx.stroke();
      if (c.spiky && i % 3 === 1) {
        var nx = Math.cos(ang + 1.5708), ny = Math.sin(ang + 1.5708), tx = Math.cos(ang) * 3, ty = Math.sin(ang) * 3;
        ctx.fillStyle = '#c9ccd0';
        for (var sg = -1; sg <= 1; sg += 2) {
          ctx.beginPath(); ctx.moveTo(mx + nx * sg * ry - tx, my + ny * sg * ry - ty);
          ctx.lineTo(mx + nx * sg * (ry + 14), my + ny * sg * (ry + 14));
          ctx.lineTo(mx + nx * sg * ry + tx, my + ny * sg * ry + ty); ctx.closePath(); ctx.fill();
        }
      }
    }
    ctx.restore();
    if (c.cross) {
      var l = n[n.length - 1], p = n[n.length - 2], dx = p.x - l.x, dy = p.y - l.y, dl = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= dl; dy /= dl;
      drawCross(l.x - dx * 70 * c.s, l.y - dy * 70 * c.s, Math.atan2(dx, -dy), c.s, Math.min(1, c.a + 0.15));
    }
  }
  function draw() {
    ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
    crosses.forEach(function (c) { if (c.z < 0.6) drawCross(c.x, c.y, c.rot, c.s, 0.12 + c.z * 0.45); });
    thorns.forEach(drawThorn);
    chains.forEach(drawChain);
    crosses.forEach(function (c) { if (c.z >= 0.6) drawCross(c.x, c.y, c.rot, c.s, 0.12 + c.z * 0.45); });
  }
  function frame() {
    T += 0.016;
    var y = window.scrollY; scrollV = Math.max(-60, Math.min(60, y - lastY)); lastY = y;
    chains.forEach(stepChain); crosses.forEach(stepCross); thorns.forEach(stepThorn);
    shocks.length = 0; ptr.vx *= 0.7; ptr.vy *= 0.7;
    draw();
    if (!reduce) requestAnimationFrame(frame);
  }
  function size() {
    W = lw = window.innerWidth; H = lh = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); init();
  }
  window.addEventListener('resize', function () {
    if (window.innerWidth !== lw || Math.abs(window.innerHeight - lh) > 140) size();
  });
  size(); frame();
})();

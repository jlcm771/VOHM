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

  // 4. Polvo plateado y destellos en canvas
  var cv = document.getElementById('dust'), ctx = cv.getContext('2d');
  var W, H, parts = [], dpr = Math.min(window.devicePixelRatio || 1, 2);
  function size() {
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(120, W * H / 14000));
    parts = [];
    for (var i = 0; i < n; i++) parts.push(make(true));
  }
  function make(rand) {
    var star = Math.random() < 0.12;
    return {
      x: Math.random() * W, y: rand ? Math.random() * H : H + 20,
      r: star ? 3 + Math.random() * 5 : 0.6 + Math.random() * 1.6,
      vy: 0.15 + Math.random() * 0.5, vx: (Math.random() - 0.5) * 0.3,
      a: 0.2 + Math.random() * 0.6, t: Math.random() * 6, star: star
    };
  }
  function drawStar(p, a) {
    var r = p.r;
    ctx.fillStyle = 'rgba(235,238,245,' + a + ')';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - r * 3); ctx.lineTo(p.x + r * 0.35, p.y - r * 0.35);
    ctx.lineTo(p.x + r * 3, p.y); ctx.lineTo(p.x + r * 0.35, p.y + r * 0.35);
    ctx.lineTo(p.x, p.y + r * 3); ctx.lineTo(p.x - r * 0.35, p.y + r * 0.35);
    ctx.lineTo(p.x - r * 3, p.y); ctx.lineTo(p.x - r * 0.35, p.y - r * 0.35);
    ctx.closePath(); ctx.fill();
  }
  function frame() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      p.t += 0.03; p.y -= p.vy; p.x += p.vx + Math.sin(p.t) * 0.2;
      var a = p.a * (0.5 + 0.5 * Math.sin(p.t * 2));
      if (p.star) drawStar(p, a);
      else { ctx.fillStyle = 'rgba(200,204,210,' + a + ')'; ctx.fillRect(p.x, p.y, p.r, p.r); }
      if (p.y < -20) parts[i] = make(false);
    }
    requestAnimationFrame(frame);
  }
  size();
  window.addEventListener('resize', size);
  if (!reduce) frame();
})();

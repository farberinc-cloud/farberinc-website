/* ============================================================
   FARBER.INC — LOGO CONFETTI BURST
   Fires a burst of small gold particles when the user hovers or
   focuses the .logo (header) or .footer-logo (footer).

   Features:
   - Spawns 18 particles per burst, random angle, distance, rotation
   - Three shapes: circle (rounded), square (sharp), strip (long)
   - Gold-tone palette
   - Throttled: max one burst per 400ms per element
   - Honors prefers-reduced-motion
   - Cleans up DOM nodes after animation
   ============================================================ */
(function () {
  'use strict';

  // Bail if reduced motion is preferred
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  var COLORS = ['#B8860B', '#DAA520', '#FFD700', '#F0E68C', '#C9A227', '#E5B845'];
  var SHAPES = ['circle', 'square', 'strip'];
  var PARTICLE_COUNT = 18;
  var COOLDOWN_MS = 400;

  // Lazy-create a single shared host element appended to body
  var host = null;
  function getHost() {
    if (!host) {
      host = document.createElement('div');
      host.className = 'logo-confetti-host';
      host.setAttribute('aria-hidden', 'true');
      document.body.appendChild(host);
    }
    return host;
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function spawnParticle(centerX, centerY) {
    var p = document.createElement('span');
    p.className = 'logo-confetti';

    // Random angle (full 360°) and distance (60–130 px from center)
    var angle = rand(0, Math.PI * 2);
    var distance = rand(60, 130);
    var dx = Math.cos(angle) * distance;
    var dy = Math.sin(angle) * distance;

    // Slight upward bias so the burst feels celebratory
    dy -= rand(10, 35);

    var rotation = rand(-540, 540) + 'deg';
    var color = pick(COLORS);
    var shape = pick(SHAPES);
    var size = rand(6, 12);
    var delay = rand(0, 60);

    var radius = shape === 'circle' ? '50%' : (shape === 'strip' ? '1px' : '2px');
    var dims = shape === 'strip' ? (size * 0.4) + 'px ' + (size * 2.2) + 'px' : size + 'px';

    p.style.setProperty('--dx', dx + 'px');
    p.style.setProperty('--dy', dy + 'px');
    p.style.setProperty('--rot', rotation);
    p.style.setProperty('--color', color);
    p.style.setProperty('--size', shape === 'strip' ? dims.split(' ')[0] : size + 'px');
    p.style.setProperty('--delay', delay + 'ms');
    p.style.setProperty('--radius', radius);

    // Position the particle at the logo center
    p.style.left = centerX + 'px';
    p.style.top = centerY + 'px';

    if (shape === 'strip') {
      // Use width/height for strip (overrides --size)
      var parts = dims.split(' ');
      p.style.width = parts[0];
      p.style.height = parts[1];
    }

    return p;
  }

  function burst(el) {
    // Cooldown check
    var last = parseInt(el.getAttribute('data-confetti-ts') || '0', 10);
    var now = Date.now();
    if (now - last < COOLDOWN_MS) return;
    el.setAttribute('data-confetti-ts', String(now));

    // Get logo center on viewport
    var rect = el.getBoundingClientRect();
    var centerX = rect.left + rect.width / 2;
    var centerY = rect.top + rect.height / 2;

    var h = getHost();
    var nodes = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var node = spawnParticle(centerX, centerY);
      h.appendChild(node);
      nodes.push(node);
    }

    // Cleanup after animation completes
    setTimeout(function () {
      nodes.forEach(function (n) {
        if (n.parentNode) n.parentNode.removeChild(n);
      });
    }, 1800);
  }

  function attach(el) {
    if (!el || el.getAttribute('data-confetti')) return;
    el.setAttribute('data-confetti', '1');
    // Fire on mouse enter AND keyboard focus
    el.addEventListener('mouseenter', function () { burst(el); });
    el.addEventListener('focus', function () { burst(el); });
    // Touch support — fire on tap for mobile
    el.addEventListener('touchstart', function () { burst(el); }, { passive: true });
  }

  function init() {
    var logos = document.querySelectorAll('.logo, .footer-logo');
    logos.forEach(attach);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
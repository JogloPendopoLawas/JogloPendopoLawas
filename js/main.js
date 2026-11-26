/* =========================================================
   Pendopo Joglo Lawasan — interaction layer
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ---------- Header state ---------- */
  var header = document.getElementById('site-header');
  var hero = document.querySelector('.hero');

  function updateHeader() {
    if (!header || !hero) return;
    var threshold = Math.max(120, hero.offsetHeight * 0.62);
    header.classList.toggle('is-solid', window.scrollY > threshold);
  }

  /* ---------- Scroll rails + weight ---------- */
  var root = document.documentElement;
  var koleksi = document.querySelector('.section--koleksi');
  var parchment = [249, 247, 242];
  var stone = [230, 226, 216];

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function updateScrollState() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var progress = max > 0 ? (window.scrollY / max) * 100 : 0;
    doc.style.setProperty('--scroll', progress.toFixed(2) + '%');

    if (koleksi) {
      var rect = koleksi.getBoundingClientRect();
      var span = rect.height + window.innerHeight * 0.55;
      var p = clamp((window.innerHeight * 0.92 - rect.top) / span, 0, 1);
      var rgb = parchment.map(function (value, i) {
        return Math.round(value + (stone[i] - value) * p);
      });
      doc.style.setProperty('--base', 'rgb(' + rgb.join(', ') + ')');
    }
  }

  /* ---------- Hero pointer parallax ---------- */
  var heroLines = Array.prototype.slice.call(document.querySelectorAll('[data-depth]'));
  var heroArt = document.querySelector('.hero__art');
  var heroRect = null;
  var ticking = false;
  var pointer = { x: 0, y: 0 };

  function applyParallax() {
    ticking = false;
    heroLines.forEach(function (line) {
      var depth = parseFloat(line.getAttribute('data-depth')) || 0;
      line.style.transform =
        'translate3d(' + (-pointer.x * depth).toFixed(2) + 'px,' +
        (-pointer.y * depth * 0.6).toFixed(2) + 'px,0)';
    });
    if (heroArt) {
      heroArt.style.transform =
        'scale(1.08) translate3d(' + (pointer.x * 14).toFixed(2) + 'px,' +
        (pointer.y * 10).toFixed(2) + 'px,0)';
    }
  }

  function onHeroMove(event) {
    if (!heroRect) return;
    pointer.x = (event.clientX - heroRect.left) / heroRect.width - 0.5;
    pointer.y = (event.clientY - heroRect.top) / heroRect.height - 0.5;
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(applyParallax);
    }
  }

  function resetParallax() {
    pointer.x = 0;
    pointer.y = 0;
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(applyParallax);
    }
  }

  if (hero && finePointer.matches && !reduceMotion.matches) {
    hero.addEventListener('pointermove', onHeroMove);
    hero.addEventListener('pointerleave', resetParallax);
    window.addEventListener('resize', function () {
      heroRect = hero.getBoundingClientRect();
    });
    heroRect = hero.getBoundingClientRect();
  }

  /* ---------- Magnetic navigation ---------- */
  if (finePointer.matches && !reduceMotion.matches) {
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (event) {
        var rect = el.getBoundingClientRect();
        var dx = clamp((event.clientX - (rect.left + rect.width / 2)) * 0.18, -6, 6);
        var dy = clamp((event.clientY - (rect.top + rect.height / 2)) * 0.3, -5, 5);
        el.style.transform = 'translate(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealItems = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    revealItems.forEach(function (item) { revealObserver.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add('is-visible'); });
  }

  /* ---------- Gallery ---------- */
  var gallery = document.getElementById('soko-gallery');
  var track = document.getElementById('soko-track');
  var prev = document.getElementById('gallery-prev');
  var next = document.getElementById('gallery-next');
  var scaleToggle = document.getElementById('scale-toggle');

  function cardStep() {
    var card = track && track.querySelector('.soko-card');
    if (!card) return 320;
    var gap = parseFloat(window.getComputedStyle(track).columnGap || '16') || 16;
    return card.getBoundingClientRect().width + gap;
  }

  function updateGalleryButtons() {
    if (!track || !prev || !next) return;
    var maxScroll = track.scrollWidth - track.clientWidth - 2;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= maxScroll;
  }

  function scrollGallery(direction) {
    if (!track) return;
    track.scrollBy({ left: direction * cardStep(), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  }

  if (prev) prev.addEventListener('click', function () { scrollGallery(-1); });
  if (next) next.addEventListener('click', function () { scrollGallery(1); });
  if (track) {
    track.addEventListener('scroll', updateGalleryButtons, { passive: true });
    window.addEventListener('resize', updateGalleryButtons);
    track.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight') { event.preventDefault(); scrollGallery(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); scrollGallery(-1); }
    });
    updateGalleryButtons();
  }

  if (scaleToggle && gallery) {
    scaleToggle.addEventListener('click', function () {
      var active = scaleToggle.getAttribute('aria-pressed') === 'true';
      scaleToggle.setAttribute('aria-pressed', String(!active));
      gallery.classList.toggle('is-scale', !active);
    });
  }

  /* ---------- Scroll listeners ---------- */
  var scheduled = false;
  function onScroll() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(function () {
      scheduled = false;
      updateHeader();
      updateScrollState();
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateHeader();
  updateScrollState();
})();

/* ============================================================
   STACKLY — section-wise scroll reveal
   ------------------------------------------------------------
   1. collect the animatable blocks (sections, or the section's
      children when the section itself is `display: contents`),
   2. anything already inside the first screen is revealed in
      the same tick `anim-ready` is added, so above-the-fold
      content never flashes and full-page screenshots render
      identical to the static layout,
   3. everything else fades/slides in through IntersectionObserver
      as the visitor scrolls,
   4. safety re-checks (load, fonts ready, a few delayed ticks)
      catch late layout shifts — web fonts / lazy images moving
      a block into the first screen after step 2 ran — which is
      what full-page captures rely on.
   ============================================================ */
(function () {
  'use strict';

  function init() {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var targets = [];
    var seen = [];
    var io = null;

    function collect(el) {
      if (!el || seen.indexOf(el) !== -1) return;
      var cs = window.getComputedStyle(el);
      if (cs.display === 'none' || cs.display === 'contents') return;
      if (cs.position === 'fixed') return;
      if (el.hasAttribute('hidden')) return;
      if (cs.transform !== 'none') return;              /* never touch pre-transformed blocks */
      if (parseFloat(cs.opacity) < .999) return;        /* never touch pre-faded blocks (overlays …) */
      seen.push(el);
      targets.push(el);
    }

    Array.prototype.forEach.call(document.querySelectorAll('main'), function (main) {
      Array.prototype.forEach.call(main.children, function (kid) {
        if (kid.tagName === 'SECTION') {
          if (window.getComputedStyle(kid).display === 'contents') {
            Array.prototype.forEach.call(kid.children, collect);
          } else {
            collect(kid);
          }
        } else {
          collect(kid);
        }
      });
    });

    var footer = document.querySelector('.site-footer');
    if (footer) Array.prototype.forEach.call(footer.children, collect);

    if (!targets.length) return;

    /* stagger: order inside the parent drives the delay (max 450ms) */
    var parents = [];
    var counts = [];
    targets.forEach(function (el) {
      var p = el.parentNode;
      var i = parents.indexOf(p);
      if (i === -1) { i = parents.length; parents.push(p); counts.push(0); }
      var n = counts[i]++;
      el.setAttribute('data-anim', '');
      el.style.setProperty('--anim-delay', Math.min(n, 5) * 90 + 'ms');
    });

    var pending = targets.slice();

    /* reveal every pending block that currently sits inside the first screen */
    function revealInView() {
      if (!pending.length) return;
      var vh = window.innerHeight || 800;
      var rest = [];
      for (var i = 0; i < pending.length; i++) {
        var el = pending[i];
        if (el.classList.contains('is-in')) continue;
        if (el.getBoundingClientRect().top < vh) {
          el.classList.add('is-in');
          if (io) io.unobserve(el);
        } else {
          rest.push(el);
        }
      }
      pending = rest;
    }

    /* step 1: everything on the first screen is shown immediately,
       in the same task that switches anim-ready on → no flash. */
    revealInView();
    document.documentElement.classList.add('anim-ready');

    /* step 2: the rest reveals on scroll. */
    if (pending.length) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
          var k = pending.indexOf(entry.target);
          if (k !== -1) pending.splice(k, 1);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

      pending.forEach(function (el) { io.observe(el); });
    }

    /* step 3: safety nets for late layout shifts (fonts, images,
       resize) — anything that ended up on the first screen gets
       revealed even if the observer hasn't fired yet. */
    function recheck() { revealInView(); }

    window.addEventListener('load', recheck);
    window.addEventListener('resize', recheck);
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(recheck).catch(function () {});
    }
    [300, 1000, 2500, 5000].forEach(function (ms) { setTimeout(recheck, ms); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* ============================================================
   STACKLY — shared UI (mobile navigation)
   ============================================================ */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('mainNav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    }

    toggle.addEventListener('click', function () {
      setOpen(!nav.classList.contains('is-open'));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  });
})();

/* ============================================================
   STACKLY — sticky header state
   The header stays pinned to the top; once the visitor scrolls
   it turns solid (white + subtle shadow) so links stay legible
   over any section, light or dark.
   ============================================================ */
(function () {
  'use strict';
  var header = document.querySelector('.site-header');
  if (!header) return;
  function upd() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    header.classList.toggle('is-stuck', y > 60);
  }
  window.addEventListener('scroll', upd, { passive: true });
  upd();
})();

/* ============================================================
   STACKLY — header account state
   When a session exists the "Login" link is replaced by the
   signed-in user's name; clicking it opens dashboard.html.
   ============================================================ */
(function () {
  'use strict';

  function readSession() {
    try {
      var raw = window.localStorage.getItem('stackly_session');
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || !s.name || (s.exp && Date.now() > s.exp)) return null;
      return s;
    } catch (e) { return null; }
  }

  function apply() {
    var link = document.querySelector('.nav-login');
    if (!link) return;
    var s = readSession();
    if (!s) return;

    var name = String(s.name).trim() || 'Account';
    link.textContent = '';
    link.classList.add('nav-user');
    link.setAttribute('href', 'dashboard.html');
    link.setAttribute('title', 'Open dashboard');

    var dot = document.createElement('span');
    dot.className = 'nu-dot';
    dot.textContent = name.charAt(0).toUpperCase();

    var label = document.createElement('span');
    label.className = 'nu-name';
    label.textContent = name;

    link.appendChild(dot);
    link.appendChild(label);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
})();


/* ============================================================
   STACKLY — services page project filters
   ============================================================ */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var filters = document.querySelectorAll('.svc-filter');
    var items = document.querySelectorAll('.svc-gitem');
    if (!filters.length || !items.length) return;

    var slots = [
      { x: 105, y: 5319 }, { x: 553, y: 5319 }, { x: 1001, y: 5319 },
      { x: 105, y: 5658 }, { x: 553, y: 5658 }, { x: 1002, y: 5658 }
    ];
    // remember the exact Figma coordinates for restoring "All"
    items.forEach(function (el) {
      el.dataset.ox = parseInt(el.style.left, 10);
      el.dataset.oy = parseInt(el.style.top, 10);
    });

    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.dataset.filter;
        filters.forEach(function (b) { b.classList.toggle('is-active', b === btn); });

        var visible = 0;
        items.forEach(function (el) {
          var show = cat === 'all' || el.dataset.cat === cat;
          el.classList.toggle('is-hidden', !show);
          if (!show) return;
          if (cat === 'all') {
            el.style.left = el.dataset.ox + 'px';
            el.style.top = el.dataset.oy + 'px';
          } else {
            el.style.left = slots[visible].x + 'px';
            el.style.top = slots[visible].y + 'px';
          }
          visible++;
        });
      });
    });
  });
})();

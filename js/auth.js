/* ============================================================
   STACKLY — role based authentication (demo, localStorage)
   Roles: user | admin
   ============================================================ */
(function () {
  'use strict';

  var USERS_KEY = 'stackly_users';
  var SESSION_KEY = 'stackly_session';

  var DEMO_USERS = [
    { name: 'Demo User',  email: 'user@stackly.com',  password: 'User@1234',  role: 'user'  },
    { name: 'Demo Admin', email: 'admin@stackly.com', password: 'Admin@1234', role: 'admin' }
  ];

  /* ---------------- storage helpers ---------------- */
  function readUsers() {
    try {
      var raw = JSON.parse(localStorage.getItem(USERS_KEY));
      if (Array.isArray(raw) && raw.length) return raw;
    } catch (e) { /* corrupted → reseed */ }
    localStorage.setItem(USERS_KEY, JSON.stringify(DEMO_USERS.slice()));
    return DEMO_USERS.slice();
  }
  function writeUsers(list) { localStorage.setItem(USERS_KEY, JSON.stringify(list)); }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
  }
  function setSession(s) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
  function clearSession() { localStorage.removeItem(SESSION_KEY); }

  /* ---------------- password rules ---------------- */
  var RULES = {
    len:  function (v) { return v.length >= 8; },
    num:  function (v) { return /\d/.test(v); },
    case: function (v) { return /[a-z]/.test(v) && /[A-Z]/.test(v); },
    sym:  function (v) { return /[^A-Za-z0-9]/.test(v); }
  };
  function allRulesPass(v) {
    for (var k in RULES) { if (!RULES[k](v)) return false; }
    return true;
  }

  var ICON_OK  = 'assets/icons/hero-heroicons-solid-check-circle.svg';
  var ICON_BAD = 'assets/icons/hero-heroicons-solid-x-circle.svg';

  /* ---------------- ui helpers ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function banner(type, msg) {
    var el = $('#authBanner');
    if (!el) return;
    el.hidden = false;
    el.className = 'auth-banner is-' + type;
    el.textContent = msg;
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function hideBanner() {
    var el = $('#authBanner');
    if (el) { el.hidden = true; el.textContent = ''; }
  }

  /* ---------------- shared page wiring ---------------- */
  function initCommon() {
    // password / text visibility toggles
    $$('.eye-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = document.getElementById(btn.getAttribute('data-eye'));
        if (!input) return;
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.classList.toggle('is-visible', show);
        btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
        input.focus();
      });
    });

    // role selector
    var selectedRole = null;
    $$('.role-box').forEach(function (box) {
      box.addEventListener('click', function () {
        $$('.role-box').forEach(function (b) {
          b.classList.remove('is-selected');
          b.setAttribute('aria-pressed', 'false');
        });
        box.classList.add('is-selected');
        box.setAttribute('aria-pressed', 'true');
        selectedRole = box.getAttribute('data-role');
      });
    });

    // "Forget Password ?" demo behaviour
    var forget = $('#forgetLink');
    if (forget) {
      forget.addEventListener('click', function (e) {
        e.preventDefault();
        var email = ($('#loginEmail') || $('#suEmail') || {}).value || '';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          banner('error', 'Enter your email address first, then click “Forget Password ?”.');
          return;
        }
        banner('success', 'Password reset link sent to ' + email.trim() + ' (demo — no mail is actually sent).');
      });
    }

    // clear error state while typing
    $$('.field, .field-password input').forEach(function (el) {
      el.addEventListener('input', function () {
        el.classList.remove('is-invalid');
        if (el.parentElement && el.parentElement.classList) el.parentElement.classList.remove('is-invalid');
        hideBanner();
      });
    });

    return {
      getRole: function () { return selectedRole; },
      selectRole: function (role) {
        $$('.role-box').forEach(function (b) {
          var on = b.getAttribute('data-role') === role;
          b.classList.toggle('is-selected', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        selectedRole = role;
      }
    };
  }

  function markInvalid(input, bad) {
    if (!input) return;
    input.classList.toggle('is-invalid', bad);
    var wrap = input.closest ? input.closest('.field-password') : null;
    if (wrap) wrap.classList.toggle('is-invalid', bad);
  }

  /* ---------------- LOGIN ---------------- */
  function initLogin(ui) {
    var form = $('#loginForm');
    if (!form) return;
    var emailEl = $('#loginEmail');
    var passEl = $('#loginPassword');

    // live password rule indicators (login design has the rule list)
    var rulesList = $('#pwRules');
    if (rulesList) {
      passEl.addEventListener('input', function () {
        var v = passEl.value;
        $$('li', rulesList).forEach(function (li) {
          var key = li.getAttribute('data-rule');
          var ok = RULES[key](v);
          var icon = $('.rule-icon', li);
          if (icon) icon.src = ok ? ICON_OK : ICON_BAD;
          li.classList.toggle('is-passed', ok);
        });
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideBanner();

      var email = emailEl.value.trim().toLowerCase();
      var pass = passEl.value;
      var role = ui.getRole();
      var bad = false;

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { markInvalid(emailEl, true); bad = true; }
      if (!pass) { markInvalid(passEl, true); bad = true; }
      if (!role) { bad = true; }
      if (bad) {
        banner('error', !role
          ? 'Please fill in your credentials and select a role (user / Admin).'
          : 'Please enter a valid email and password.');
        return;
      }

      var users = readUsers();
      var user = null;
      for (var i = 0; i < users.length; i++) {
        if (String(users[i].email).toLowerCase() === email) { user = users[i]; break; }
      }

      if (!user || user.password !== pass) {
        markInvalid(passEl, true);
        banner('error', 'Incorrect email or password. (Demo: user@stackly.com / User@1234 · admin@stackly.com / Admin@1234)');
        return;
      }
      if (user.role !== role) {
        banner('error', 'This account is registered as "' + user.role + '". Please select the matching role.');
        return;
      }

      setSession({ name: user.name, email: user.email, role: user.role, at: Date.now() });
      banner('success', 'Login successful — redirecting to your dashboard…');
      setTimeout(function () { window.location.href = 'dashboard.html'; }, 450);
    });

    // convenience: prefill demo credentials via ?demo=user / ?demo=admin
    var params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'user')  { emailEl.value = 'user@stackly.com';  passEl.value = 'User@1234';  ui.selectRole('user'); }
    if (params.get('demo') === 'admin') { emailEl.value = 'admin@stackly.com'; passEl.value = 'Admin@1234'; ui.selectRole('admin'); }
  }

  /* ---------------- SIGN UP ---------------- */
  function initSignup(ui) {
    var form = $('#signupForm');
    if (!form) return;
    var emailEl = $('#suEmail');
    var nameEl = $('#suName');
    var passEl = $('#suPassword');
    var pass2El = $('#suPassword2');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideBanner();

      var email = emailEl.value.trim().toLowerCase();
      var name = nameEl.value.trim();
      var pass = passEl.value;
      var pass2 = pass2El.value;
      var role = ui.getRole();
      var bad = false;

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { markInvalid(emailEl, true); bad = true; }
      if (name.length < 2) { markInvalid(nameEl, true); bad = true; }
      if (!allRulesPass(pass)) { markInvalid(passEl, true); bad = true; }
      if (pass !== pass2 || !pass2) { markInvalid(pass2El, true); bad = true; }
      if (!role) bad = true;

      if (bad) {
        var msg = 'Please fix the highlighted fields';
        if (!allRulesPass(pass)) msg += ' — password needs 8+ characters, a number, upper & lower case and a symbol';
        if (!role) msg += ' — and select a role (User / Admin)';
        banner('error', msg + '.');
        return;
      }

      var users = readUsers();
      for (var i = 0; i < users.length; i++) {
        if (String(users[i].email).toLowerCase() === email) {
          markInvalid(emailEl, true);
          banner('error', 'An account with this email already exists — please log in instead.');
          return;
        }
      }

      users.push({ name: name, email: email, password: pass, role: role, created: Date.now() });
      writeUsers(users);

      banner('success', 'Account created for ' + name + ' (' + role + ') — redirecting to login…');
      setTimeout(function () { window.location.href = 'login.html?created=1'; }, 600);
    });
  }

  /* ---------------- boot ---------------- */
  document.addEventListener('DOMContentLoaded', function () {
    var ui = initCommon();
    initLogin(ui);
    initSignup(ui);

    // arriving from a successful sign-up
    var params = new URLSearchParams(window.location.search);
    if (params.get('created') === '1') {
      banner('success', 'Your account was created successfully. Sign in with your new credentials.');
    }
  });
})();

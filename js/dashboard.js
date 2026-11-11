/* ============================================================
   STACKLY — role based dashboard renderer
   ============================================================ */
(function () {
  'use strict';

  var SESSION_KEY = 'stackly_session';
  var USERS_KEY = 'stackly_users';

  function $(id) { return document.getElementById(id); }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
  }
  function getUsers() {
    try {
      var u = JSON.parse(localStorage.getItem(USERS_KEY));
      return Array.isArray(u) ? u : [];
    } catch (e) { return []; }
  }

  var PROJECTS = [
    { tag: 'Private Residence',   name: 'The Morrison Estate',  loc: 'Beverly Hills, CA',  img: 'assets/img/image-96519518.webp',          status: 'done'   },
    { tag: 'Pool & Hardscape',    name: 'Infinity Edge Retreat', loc: 'Malibu, CA',         img: 'assets/img/infinity-edge-retreat-1f6730c9.webp', status: 'review' },
    { tag: 'Architectural',       name: 'Grand Fireplace Suite', loc: 'Aspen, CO',          img: 'assets/img/grand-fireplace-suite-24c23981.webp', status: 'done'   },
    { tag: 'Landscape Design',    name: 'Botanical Pathways',    loc: 'Santa Barbara, CA',  img: 'assets/img/botanical-pathways-4470a4c4.webp', status: 'active' },
    { tag: 'Outdoor Living',      name: 'Mediterranean Terrace', loc: 'Newport Beach, CA',  img: 'assets/img/mediterranean-terrace-b71ef768.webp', status: 'active' },
    { tag: 'Custom Stonework',    name: 'Vineyard Estate',       loc: 'Napa Valley, CA',    img: 'assets/img/vineyard-estate-1ac54fca.webp',  status: 'done'   }
  ];

  var STATUS_LABEL = { active: 'In progress', review: 'In review', done: 'Completed' };
  var STATUS_CLASS = { active: '', review: 'is-review', done: 'is-done' };

  /* ---------------- data driven by role ---------------- */
  function statsFor(role, users) {
    if (role === 'admin') {
      return [
        { num: String(users.length), label: 'Registered users', note: 'live from local storage', cls: 'is-up' },
        { num: '128', label: 'Total projects',  note: '+12 this quarter', cls: 'is-up' },
        { num: '7',   label: 'Pending reviews', note: 'needs your action', cls: 'is-warn' },
        { num: '24.5<span>k</span>', label: 'Site visits', note: '+8.4% vs last week', cls: 'is-up' }
      ];
    }
    return [
      { num: '12', label: 'My projects',    note: '+2 this month', cls: 'is-up' },
      { num: '3',  label: 'In review',      note: 'awaiting feedback', cls: 'is-warn' },
      { num: '8',  label: 'Completed',      note: 'delivered on time', cls: 'is-up' },
      { num: '5',  label: 'New messages',   note: '2 unread', cls: 'is-warn' }
    ];
  }

  function activityFor(role, name) {
    if (role === 'admin') {
      return [
        { t: '<b>' + name + '</b> approved “The Morrison Estate”',                 time: '12 minutes ago', neu: true },
        { t: 'New signup request from <b>olivia@studio.co</b>',                     time: '1 hour ago',     neu: true },
        { t: 'Project “Infinity Edge Retreat” moved to <b>In review</b>',           time: '3 hours ago' },
        { t: 'Weekly report generated — <b>24.5k visits</b>',                       time: 'Yesterday, 9:12 AM' },
        { t: 'Invoice #2043 marked as <b>paid</b>',                                 time: '2 days ago' }
      ];
    }
    return [
      { t: 'Feedback added on <b>The Morrison Estate</b>',              time: '18 minutes ago', neu: true },
      { t: 'Your project <b>Botanical Pathways</b> was approved',       time: '2 hours ago',    neu: true },
      { t: 'Design files uploaded to <b>Vineyard Estate</b>',           time: 'Yesterday, 4:40 PM' },
      { t: 'Consultation scheduled with <b>Mansory team</b>',           time: 'Yesterday, 11:05 AM' },
      { t: 'Message sent to <b>support@stackly.com</b>',                time: '3 days ago' }
    ];
  }

  /* ---------------- renderers ---------------- */
  function renderStats(list) {
    $('statGrid').innerHTML = list.map(function (s) {
      return '<div class="stat-card">' +
               '<div class="stat-num">' + s.num + '</div>' +
               '<div class="stat-label">' + s.label + '</div>' +
               '<div class="stat-note ' + s.cls + '">' + s.note + '</div>' +
             '</div>';
    }).join('');
  }

  function renderActivity(list) {
    $('activityList').innerHTML = list.map(function (a) {
      return '<li class="' + (a.neu ? 'is-new' : '') + '">' +
               '<span class="dot"></span>' +
               '<div class="act-body"><p>' + a.t + '</p><time>' + a.time + '</time></div>' +
             '</li>';
    }).join('');
  }

  function renderProjects(title, eyebrow) {
    $('projTitle').textContent = title;
    $('projEyebrow').textContent = eyebrow;
    $('projGrid').innerHTML = PROJECTS.map(function (p) {
      return '<article class="proj-card">' +
               '<img src="' + p.img + '" alt="' + p.name + '" loading="lazy">' +
               '<span class="pc-veil"></span>' +
               '<span class="pc-status ' + STATUS_CLASS[p.status] + '">' + STATUS_LABEL[p.status] + '</span>' +
               '<div class="pc-body">' +
                 '<div class="pc-tag">' + p.tag + '</div>' +
                 '<h4>' + p.name + '</h4>' +
                 '<div class="pc-loc">' + p.loc + '</div>' +
               '</div>' +
             '</article>';
    }).join('');
  }

  function renderUsers(users) {
    var body = $('usersBody');
    if (!users.length) {
      body.innerHTML = '<tr><td colspan="4"><div class="empty-note">No users registered yet — create an account on the sign up page.</div></td></tr>';
    } else {
      body.innerHTML = users.map(function (u) {
        var joined = u.created ? new Date(u.created).toLocaleDateString() : 'demo';
        return '<tr>' +
                 '<td class="t-name">' + escapeHtml(u.name || '—') + '</td>' +
                 '<td>' + escapeHtml(u.email || '—') + '</td>' +
                 '<td><span class="tag ' + (u.role === 'admin' ? 'is-admin' : '') + '">' + (u.role || 'user') + '</span></td>' +
                 '<td>' + joined + '</td>' +
               '</tr>';
      }).join('');
    }
    $('usersCount').textContent = users.length + ' account' + (users.length === 1 ? '' : 's');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------------- boot ---------------- */
  document.addEventListener('DOMContentLoaded', function () {
    var session = getSession();
    var guard = $('dashGuard');
    var main = $('dashMain');

    if (!session || !session.role) {
      guard.hidden = false;
      document.title = 'Sign in required — STACKLY';
      return;
    }

    guard.hidden = true;
    main.hidden = false;

    var role = session.role === 'admin' ? 'admin' : 'user';
    var name = session.name || 'there';
    var users = getUsers();
    var initial = (name.trim()[0] || '?').toUpperCase();

    // header chip
    $('chipAvatar').textContent = initial;
    $('chipName').textContent = name;
    $('chipRole').textContent = role;
    $('chipRole').classList.toggle('is-admin', role === 'admin');

    // hero
    $('heroEyebrow').textContent = role === 'admin' ? 'Admin control panel' : 'Welcome back';
    $('heroTitle').innerHTML = 'Hello, <b>' + escapeHtml(name) + '</b>';
    $('heroText').textContent = role === 'admin'
      ? 'You are signed in with administrator rights — manage projects, review accounts and keep the studio running.'
      : 'Great to see you again. Here is what is happening with your projects and messages today.';
    $('heroActions').innerHTML = role === 'admin'
      ? '<a class="btn-solid" href="#usersSection">Manage users</a><a class="btn-ghost" href="portfolio.html">View portfolio</a>'
      : '<a class="btn-solid" href="contact.html">New request</a><a class="btn-ghost" href="portfolio.html">View portfolio</a>';

    // stats + activity
    $('statsTitle').textContent = role === 'admin' ? 'Studio overview' : 'Your numbers';
    $('activityTitle').textContent = role === 'admin' ? 'Latest admin activity' : 'Recent activity';
    renderStats(statsFor(role, users));
    renderActivity(activityFor(role, name));

    // profile
    $('profAvatar').textContent = initial;
    $('profName').textContent = name;
    $('profMail').textContent = session.email || '';
    $('profRows').innerHTML =
      '<div><span>Role</span><b>' + role + '</b></div>' +
      '<div><span>Plan</span><b>' + (role === 'admin' ? 'studio' : 'premium') + '</b></div>' +
      '<div><span>Status</span><b>active</b></div>' +
      '<div><span>Member since</span><b>' + new Date(session.at || Date.now()).toLocaleDateString() + '</b></div>';

    // projects
    renderProjects(
      role === 'admin' ? 'All projects' : 'My projects',
      role === 'admin' ? 'Studio portfolio' : 'Assigned to you'
    );

    // admin only — registered users table
    if (role === 'admin') {
      $('usersSection').hidden = false;
      renderUsers(users);
    }

    // logout
    $('logoutBtn').addEventListener('click', function () {
      localStorage.removeItem(SESSION_KEY);
      window.location.href = 'login.html';
    });
  });
})();

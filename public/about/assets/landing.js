/* Recipely landing — interactions
   theme (light/dark) · language (EN/TR) · cuisine filter · live timers ·
   AI typing demo · live accent themes · scroll reveal */
(function () {
  'use strict';
  var root = document.documentElement;

  /* ───── Dark / light ───── */
  var TKEY = 'recipely-landing-theme';
  try {
    var saved = localStorage.getItem(TKEY);
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
    else if (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) root.setAttribute('data-theme', 'dark');
  } catch (e) {}
  var tt = document.getElementById('themeToggle');
  if (tt) tt.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem(TKEY, next); } catch (e) {}
  });

  /* ───── Language (EN / TR) — auto-localization demo ───── */
  var LKEY = 'recipely-landing-lang';
  function applyLang(lang) {
    document.querySelectorAll('[data-en]').forEach(function (el) {
      var v = el.getAttribute('data-' + lang);
      if (v != null) el.textContent = v;
    });
    root.setAttribute('lang', lang);
    document.querySelectorAll('[data-lang-seg] button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-lang') === lang);
    });
    try { localStorage.setItem(LKEY, lang); } catch (e) {}
  }
  var startLang = 'en';
  try { var sl = localStorage.getItem(LKEY); if (sl === 'tr' || sl === 'en') startLang = sl; } catch (e) {}
  document.querySelectorAll('[data-lang-seg] button').forEach(function (b) {
    b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang')); });
  });
  applyLang(startLang);

  /* ───── Live accent themes (mirrors the app's 20 themes) ───── */
  var ACCENTS = {
    tangerine: ['#EC7B41', '#F9B050', '#D5611C'],
    crimson:   ['#DC2626', '#F87171', '#B91C1C'],
    golden:    ['#CA8A04', '#FDE047', '#92700A'],
    emerald:   ['#059669', '#34D399', '#047857'],
    teal:      ['#0D9488', '#5EEAD4', '#0F766E'],
    ocean:     ['#0284C7', '#7DD3FC', '#0369A1'],
    indigo:    ['#4F46E5', '#818CF8', '#4338CA'],
    violet:    ['#7C3AED', '#A78BFA', '#6D28D9'],
    rose:      ['#E11D48', '#FB7185', '#BE123C'],
    coral:     ['#FB7185', '#FDA4AF', '#E11D48']
  };
  var AKEY = 'recipely-landing-accent';
  function applyAccent(key) {
    var a = ACCENTS[key]; if (!a) return;
    root.style.setProperty('--grad-start', a[0]);
    root.style.setProperty('--grad-end', a[1]);
    root.style.setProperty('--brand', a[0]);
    root.style.setProperty('--brand-strong', a[2]);
    document.querySelectorAll('[data-accent]').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-accent') === key);
    });
    try { localStorage.setItem(AKEY, key); } catch (e) {}
  }
  document.querySelectorAll('[data-accent]').forEach(function (b) {
    var k = b.getAttribute('data-accent');
    var c = b.querySelector('.chip');
    if (c && ACCENTS[k]) c.style.background = 'linear-gradient(135deg,' + ACCENTS[k][0] + ',' + ACCENTS[k][1] + ')';
    b.addEventListener('click', function () { applyAccent(k); });
  });
  try { var sa = localStorage.getItem(AKEY); if (sa && ACCENTS[sa]) applyAccent(sa); else applyAccent('tangerine'); } catch (e) { applyAccent('tangerine'); }

  /* ───── Cuisine filter (Discover) ───── */
  document.querySelectorAll('[data-filter]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-filter');
      document.querySelectorAll('[data-filter]').forEach(function (c) { c.classList.toggle('on', c === chip); });
      document.querySelectorAll('[data-cuisine]').forEach(function (card) {
        var match = f === 'all' || card.getAttribute('data-cuisine') === f;
        card.classList.toggle('hide', !match);
      });
    });
  });

  /* ───── Countdown timers (cook mode chips + hero card) ───── */
  function fmt(s) { var m = Math.floor(s / 60), x = s % 60; return m + ':' + String(x).padStart(2, '0'); }
  document.querySelectorAll('[data-timer]').forEach(function (el) {
    var total = parseInt(el.getAttribute('data-timer'), 10) * 60;
    var rem = total, iv = null;
    var face = el.querySelector('[data-face]') || el;
    var base = face.textContent;
    function tick() {
      rem--;
      if (rem <= 0) { rem = 0; clearInterval(iv); iv = null; el.classList.remove('run'); face.textContent = '✓'; setTimeout(function () { face.textContent = base; }, 1400); return; }
      face.textContent = fmt(rem);
    }
    el.addEventListener('click', function (e) {
      e.preventDefault();
      if (iv) { clearInterval(iv); iv = null; el.classList.remove('run'); return; }
      if (rem === total || rem === 0) rem = total;
      el.classList.add('run'); face.textContent = fmt(rem); iv = setInterval(tick, 1000);
    });
  });

  /* ───── Cook step toggle + progress ───── */
  var steps = [].slice.call(document.querySelectorAll('[data-step]'));
  var pfill = document.getElementById('cookFill');
  var pcount = document.getElementById('cookCount');
  function updateProgress() {
    if (!steps.length) return;
    var done = steps.filter(function (s) { return s.classList.contains('done'); }).length;
    if (pfill) pfill.style.width = (done / steps.length * 100) + '%';
    if (pcount) pcount.textContent = done + '/' + steps.length;
  }
  steps.forEach(function (s) {
    s.addEventListener('click', function (e) {
      if (e.target.closest('[data-timer]')) return; // don't toggle when starting a timer
      s.classList.toggle('done');
      updateProgress();
    });
  });
  updateProgress();

  /* ───── AI typing demo (reveals result when in view) ───── */
  var aiTyped = document.getElementById('aiTyped');
  var aiResult = document.getElementById('aiResult');
  if (aiTyped) {
    var phrase = aiTyped.getAttribute('data-text') || aiTyped.textContent;
    var played = false;
    function playType() {
      if (played) return; played = true;
      aiTyped.textContent = '';
      var i = 0;
      (function step() {
        if (i <= phrase.length) { aiTyped.textContent = phrase.slice(0, i); i++; setTimeout(step, 34); }
        else if (aiResult) setTimeout(function () { aiResult.classList.add('show'); }, 380);
      })();
    }
    if ('IntersectionObserver' in window) {
      var aio = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { playType(); aio.disconnect(); } }); }, { threshold: 0.5 });
      aio.observe(aiTyped);
    } else { playType(); }
  }


  /* ───── Open in app (mobile) ─────
     "Get started" points at /register, a web route. On a phone the app is the
     better destination — but a plain link cannot get there. iOS deliberately
     ignores universal links for SAME-DOMAIN navigation, so tapping a
     recipely.net link while already on recipely.net stays in Safari no matter
     what the AASA file says. The custom scheme is the only in-page route into
     the app, with the store as the fallback for a visitor who does not have it.

     The timer is the "is it installed?" test: opening the scheme backgrounds
     the page, so if we are still visible ~1.2s later nothing handled it and the
     store is the right answer. Cancelled on pagehide/visibilitychange, or the
     store would also open behind the app that just launched. */
  var APP_SCHEME = 'recipely://';
  var STORE = {
    ios: 'https://apps.apple.com/app/recipely/id6787391255',
    android: 'https://play.google.com/store/apps/details?id=com.recipely.app'
  };
  function mobilePlatform() {
    var ua = navigator.userAgent || '';
    if (/android/i.test(ua)) return 'android';
    // iPadOS 13+ reports as Macintosh; the touch check separates it from a Mac.
    if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
    return null;
  }
  var platform = mobilePlatform();
  if (platform) {
    document.querySelectorAll('[data-open-app]').forEach(function (el) {
      el.addEventListener('click', function (ev) {
        ev.preventDefault();
        var settled = false;
        function cancel() { settled = true; }
        document.addEventListener('visibilitychange', cancel, { once: true });
        window.addEventListener('pagehide', cancel, { once: true });
        setTimeout(function () {
          if (!settled && !document.hidden) window.location.href = STORE[platform];
        }, 1200);
        window.location.href = APP_SCHEME;
      });
    });
  }

  /* ───── Scroll reveal ───── */
  var rev = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
    rev.forEach(function (e) { io.observe(e); });
  } else { rev.forEach(function (e) { e.classList.add('in'); }); }
})();

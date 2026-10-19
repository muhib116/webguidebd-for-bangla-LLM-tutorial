(function () {
  'use strict';

  var themeKey = 'wgba-theme';
  function applyTheme(mode) {
    document.documentElement.setAttribute('data-wgba-theme', mode);
    try { localStorage.setItem(themeKey, mode); } catch (e) {}
  }
  try {
    var saved = localStorage.getItem(themeKey);
    if (saved === 'dark' || saved === 'light') applyTheme(saved);
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) applyTheme('dark');
    else applyTheme('light');
  } catch (e) {
    applyTheme('light');
  }
  document.querySelectorAll('[data-wgba-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-wgba-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(cur);
    });
  });

  document.querySelectorAll('[data-wgba-sidebar-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var side = btn.closest('.wgba-sidebar');
      if (side) side.classList.toggle('is-open');
    });
  });

  var filter = document.querySelector('[data-wgba-glossary-filter]');
  if (filter) {
    filter.addEventListener('input', function () {
      var q = (filter.value || '').toLowerCase();
      document.querySelectorAll('[data-wgba-glossary] li').forEach(function (li) {
        var t = li.getAttribute('data-text') || '';
        li.hidden = q && t.indexOf(q) === -1;
      });
    });
  }

  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({
      'Content-Type': 'application/json',
      'X-WP-Nonce': (window.wgbaData && wgbaData.nonce) || ''
    }, opts.headers || {});
    opts.credentials = 'same-origin';
    return fetch((window.wgbaData && wgbaData.restUrl ? wgbaData.restUrl : '/wp-json/wgba/v1/') + path.replace(/^\//, ''), opts)
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, body: j }; }); });
  }

  document.querySelectorAll('[data-wgba-mark-read]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!window.wgbaData || !wgbaData.loggedIn) {
        alert((wgbaData && wgbaData.messages && wgbaData.messages.progress) || 'লগইন প্রয়োজন');
        return;
      }
      api('progress/reading', { method: 'POST', body: JSON.stringify({ lesson_stable_id: btn.getAttribute('data-lesson'), complete: true }) })
        .then(function () { btn.textContent = 'পড়া হয়েছে ✓'; });
    });
  });
  document.querySelectorAll('[data-wgba-unmark-read]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      api('progress/reading', { method: 'POST', body: JSON.stringify({ lesson_stable_id: btn.getAttribute('data-lesson'), complete: false }) });
    });
  });
  document.querySelectorAll('[data-wgba-bookmark]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      api('bookmarks', { method: 'POST', body: JSON.stringify({ target_type: 'lesson', target_stable_id: btn.getAttribute('data-id') }) });
    });
  });

  document.querySelectorAll('[data-wgba-quiz-submit]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var section = btn.closest('.wgba-quiz');
      if (!section) return;
      var answers = {};
      section.querySelectorAll('.wgba-q').forEach(function (fs) {
        var id = fs.getAttribute('data-qid');
        var checked = fs.querySelector('input:checked');
        if (checked) answers[id] = [checked.value];
      });
      api('quiz/submit', {
        method: 'POST',
        body: JSON.stringify({ quiz_stable_id: section.getAttribute('data-quiz-id'), answers: answers })
      }).then(function (res) {
        var box = section.querySelector('.wgba-quiz-result');
        if (!box) return;
        if (!res.ok) { box.textContent = 'জমা ব্যর্থ'; return; }
        box.textContent = 'স্কোর: ' + res.body.earned + '/' + res.body.possible + (res.body.passed ? ' — উত্তীর্ণ' : ' — আবার চেষ্টা') +
          (res.body.saved === false ? ' · ' + (res.body.note || '') : '');
        (res.body.feedback || []).forEach(function (f) {
          var p = document.createElement('p');
          var fs = section.querySelector('.wgba-q[data-qid="' + f.id + '"] legend');
          var qText = fs ? fs.textContent + ' — ' : '';
          p.textContent = (f.correct ? '✓ ' : '✗ ') + qText +
            (f.correct ? (f.explanation || '') : ((f.wrong_hint ? f.wrong_hint + ' ' : '') + (f.explanation || '')));
          box.appendChild(p);
        });
      });
    });
  });

  document.querySelectorAll('[data-wgba-question-form]').forEach(function (form) {
    form.querySelectorAll('[data-quick]').forEach(function (b) {
      b.addEventListener('click', function () {
        var ta = form.querySelector('[name="question_body"]');
        if (ta) ta.value = (ta.value ? ta.value + '\n' : '') + b.getAttribute('data-quick');
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var payload = {
        lesson_stable_id: fd.get('lesson_stable_id'),
        selected_text: fd.get('selected_text') || '',
        code_snippet: fd.get('code_snippet') || '',
        error_text: fd.get('error_text') || '',
        question_body: fd.get('question_body') || ''
      };
      var status = form.querySelector('.wgba-ask-status');
      api('questions', { method: 'POST', body: JSON.stringify(payload) }).then(function (res) {
        if (status) status.textContent = res.ok ? (res.body.message || 'সংরক্ষিত') : 'ব্যর্থ';
      });
    });
  });

  // Mount playground roots that only have data-exercise id in content HTML.
  var bootEl = document.getElementById('wgba-lesson-bootstrap');
  var bootExercises = [];
  var bootLesson = '';
  try {
    var bootData = JSON.parse(bootEl ? bootEl.textContent : '{}');
    bootExercises = bootData.exercises || [];
    bootLesson = bootData.stableId || '';
  } catch (e) {}
  document.querySelectorAll('.wgba-playground-slot[data-exercise], #wgba-playground-root[data-exercise]').forEach(function (el) {
    var id = el.getAttribute('data-exercise');
    var ex = bootExercises.find(function (x) { return x.stable_id === id; });
    if (!ex) return;
    var mount = document.createElement('div');
    mount.className = 'wgba-playground';
    mount.setAttribute('data-lesson-id', bootLesson);
    mount.setAttribute('data-exercise-id', ex.stable_id || '');
    mount.setAttribute('data-exercise-version', ex.version || '1');
    mount.setAttribute('data-starter', ex.starter || '');
    mount.setAttribute('data-expected', JSON.stringify(ex.expected_console_includes || []));
    mount.setAttribute('data-expected-output', ex.expected_output || '');
    mount.setAttribute('data-hints', JSON.stringify(ex.hints || []));
    mount.setAttribute('data-solution', ex.solution || '');
    mount.setAttribute('data-label', ex.label || 'ফরমেটিভ অনুশীলন');
    if (ex.timeout_ms) mount.setAttribute('data-timeout-ms', String(ex.timeout_ms));
    el.replaceWith(mount);
  });

  document.dispatchEvent(new CustomEvent('wgba:ready'));
})();

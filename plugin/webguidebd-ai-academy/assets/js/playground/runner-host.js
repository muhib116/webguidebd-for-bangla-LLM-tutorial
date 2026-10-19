/**
 * Playground host: code-editor UI + QuickJS worker + schema checks.
 */
(function () {
  'use strict';

  var cfg = window.wgbaPlayground || {};

  var JS_KW = (
    'break case catch class const continue debugger default delete do else export extends ' +
    'false finally for function if import in instanceof let new null return static super ' +
    'switch this throw true try typeof undefined var void while with yield async await of'
  ).split(/\s+/);

  function explainError(err) {
    var msg = String(err || '');
    var tip = '';
    if (/SyntaxError/i.test(msg)) tip = 'সিনট্যাক্স ভুল — বন্ধনী, কোটেশন, কমা বা কীওয়ার্ড পরীক্ষা করুন।';
    else if (/ReferenceError/i.test(msg)) tip = 'এমন একটি নাম ব্যবহার হয়েছে যা আগে ঘোষণা করা হয়নি (বানান বা স্কোপ দেখুন)।';
    else if (/TypeError/i.test(msg)) tip = 'ভুল ধরনের মানের ওপর কাজ চালানো হয়েছে (যেমন undefined-এর property পড়া)।';
    else if (/RangeError|stack overflow/i.test(msg)) tip = 'সীমার বাইরে মান বা অতিরিক্ত গভীর রিকার্শন — থামার শর্ত (base case) আছে কি?';
    else if (/out of memory/i.test(msg)) tip = 'মেমরি সীমা পেরিয়েছে — খুব বড় অ্যারে/লুপ তৈরি হচ্ছে কি না দেখুন।';
    else if (/timeout/i.test(msg)) tip = 'সময়সীমা শেষ — সম্ভবত অসীম লুপ। লুপের শর্ত কখন false হবে দেখুন।';
    else if (/Module not found/i.test(msg)) tip = 'এই রানারে শুধু defineModule দিয়ে তৈরি ভার্চুয়াল মডিউল পাওয়া যায়।';
    else if (/flood/i.test(msg)) tip = 'অনেক বেশি আউটপুট — লুপের ভেতরের console.log কমান।';
    return tip ? tip + '\n[মূল এরর] ' + msg : msg;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function highlightJs(src) {
    var out = '';
    var i = 0;
    var n = src.length;
    while (i < n) {
      if (src[i] === '/' && src[i + 1] === '/') {
        var eol = src.indexOf('\n', i);
        if (eol < 0) eol = n;
        out += '<span class="tok-com">' + escHtml(src.slice(i, eol)) + '</span>';
        i = eol;
        continue;
      }
      if (src[i] === '/' && src[i + 1] === '*') {
        var endc = src.indexOf('*/', i + 2);
        if (endc < 0) endc = n - 2;
        out += '<span class="tok-com">' + escHtml(src.slice(i, endc + 2)) + '</span>';
        i = endc + 2;
        continue;
      }
      if (src[i] === '"' || src[i] === "'" || src[i] === '`') {
        var q = src[i];
        var j = i + 1;
        while (j < n) {
          if (src[j] === '\\') { j += 2; continue; }
          if (src[j] === q) { j += 1; break; }
          if (q === '`' && src[j] === '$' && src[j + 1] === '{') break;
          j += 1;
        }
        out += '<span class="tok-str">' + escHtml(src.slice(i, j)) + '</span>';
        i = j;
        continue;
      }
      if (/[0-9]/.test(src[i]) && (i === 0 || /[^\w$]/.test(src[i - 1]))) {
        var k = i + 1;
        while (k < n && /[0-9.xXa-fA-Fn_]/.test(src[k])) k += 1;
        out += '<span class="tok-num">' + escHtml(src.slice(i, k)) + '</span>';
        i = k;
        continue;
      }
      if (/[A-Za-z_$\u0980-\u09FF]/.test(src[i])) {
        var m = i + 1;
        while (m < n && /[\w$\u0980-\u09FF]/.test(src[m])) m += 1;
        var word = src.slice(i, m);
        var cls = JS_KW.indexOf(word) !== -1 ? 'tok-kw' : 'tok-id';
        out += '<span class="' + cls + '">' + escHtml(word) + '</span>';
        i = m;
        continue;
      }
      out += escHtml(src[i]);
      i += 1;
    }
    return out || ' ';
  }

  function collectCompletions(src) {
    var set = {};
    JS_KW.forEach(function (w) { set[w] = 1; });
    var builtins = [
      'console', 'log', 'error', 'warn', 'Array', 'Object', 'String', 'Number', 'Math',
      'JSON', 'parse', 'stringify', 'map', 'filter', 'reduce', 'forEach', 'push', 'pop',
      'length', 'slice', 'split', 'join', 'includes', 'indexOf', 'keys', 'values',
      'Promise', 'then', 'catch', 'setTimeout', 'clearTimeout', 'isNaN', 'parseInt',
      'parseFloat', 'Boolean', 'RegExp', 'Date', 'Error', 'Map', 'Set', 'Symbol'
    ];
    builtins.forEach(function (w) { set[w] = 1; });
    var re = /[A-Za-z_$\u0980-\u09FF][\w$\u0980-\u09FF]*/g;
    var match;
    while ((match = re.exec(src))) {
      if (match[0].length > 1) set[match[0]] = 1;
    }
    return Object.keys(set).sort();
  }

  function currentPrefix(ta) {
    var pos = ta.selectionStart || 0;
    var before = (ta.value || '').slice(0, pos);
    var m = before.match(/[A-Za-z_$\u0980-\u09FF][\w$\u0980-\u09FF]*$/);
    return m ? m[0] : '';
  }

  function pickSuggestion(ta) {
    var prefix = currentPrefix(ta);
    if (!prefix || prefix.length < 2) return '';
    var list = collectCompletions(ta.value || '');
    var hit = '';
    for (var i = 0; i < list.length; i += 1) {
      if (list[i] === prefix) continue;
      if (list[i].indexOf(prefix) === 0) {
        if (!hit || list[i].length < hit.length) hit = list[i];
      }
    }
    return hit ? hit.slice(prefix.length) : '';
  }

  /**
   * Wrap textarea in gutter + highlight + autocomplete chrome.
   * Returns { refresh: fn }.
   */
  function attachCodeEditor(ta) {
    var wrap = el('div', 'wgba-code-editor');
    var gutter = el('div', 'wgba-code-gutter');
    gutter.setAttribute('aria-hidden', 'true');
    var surface = el('div', 'wgba-code-surface');
    var hl = el('pre', 'wgba-code-hl');
    hl.setAttribute('aria-hidden', 'true');
    var ghostBar = el('div', 'wgba-code-ac');
    ghostBar.setAttribute('aria-hidden', 'true');
    ghostBar.hidden = true;

    var parent = ta.parentNode;
    parent.insertBefore(wrap, ta);
    surface.appendChild(hl);
    surface.appendChild(ta);
    wrap.appendChild(gutter);
    wrap.appendChild(surface);
    wrap.appendChild(ghostBar);

    ta.classList.add('wgba-editor');
    ta.spellcheck = false;
    ta.setAttribute('autocapitalize', 'off');
    ta.setAttribute('autocomplete', 'off');
    ta.setAttribute('autocorrect', 'off');
    ta.setAttribute('data-gramm', 'false');

    var pending = '';

    function lineCount(src) {
      return Math.max(1, String(src || '').split('\n').length);
    }

    function refresh() {
      var src = ta.value || '';
      var lines = lineCount(src);
      var html = '';
      for (var i = 1; i <= lines; i += 1) {
        html += '<span>' + i + '</span>';
      }
      gutter.innerHTML = html;
      hl.innerHTML = highlightJs(src) + (src.slice(-1) === '\n' ? '\n' : '');
      syncScroll();
      updateSuggest();
    }

    function syncScroll() {
      hl.scrollTop = ta.scrollTop;
      hl.scrollLeft = ta.scrollLeft;
      gutter.scrollTop = ta.scrollTop;
    }

    function updateSuggest() {
      pending = pickSuggestion(ta);
      if (pending) {
        ghostBar.hidden = false;
        ghostBar.innerHTML = '<kbd>Tab</kbd> <span class="wgba-code-ac-ghost">' +
          escHtml(currentPrefix(ta)) + '<em>' + escHtml(pending) + '</em></span>' +
          ' <span class="wgba-code-ac-hint">next word</span>';
      } else {
        ghostBar.hidden = true;
        ghostBar.textContent = '';
      }
    }

    function acceptSuggest() {
      if (!pending) return false;
      var pos = ta.selectionStart || 0;
      var v = ta.value || '';
      ta.value = v.slice(0, pos) + pending + v.slice(ta.selectionEnd || pos);
      var next = pos + pending.length;
      ta.setSelectionRange(next, next);
      pending = '';
      refresh();
      return true;
    }

    ta.addEventListener('input', refresh);
    ta.addEventListener('scroll', syncScroll);
    ta.addEventListener('click', updateSuggest);
    ta.addEventListener('keyup', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
        updateSuggest();
      }
    });
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        if (acceptSuggest()) return;
        var start = ta.selectionStart || 0;
        var end = ta.selectionEnd || 0;
        var v = ta.value || '';
        ta.value = v.slice(0, start) + '  ' + v.slice(end);
        ta.setSelectionRange(start + 2, start + 2);
        refresh();
        return;
      }
      if (e.key === 'Escape' && pending) {
        pending = '';
        ghostBar.hidden = true;
        e.preventDefault();
      }
      if (e.key === 'ArrowRight' && pending && (ta.selectionStart || 0) === (ta.selectionEnd || 0)) {
        var before = (ta.value || '').slice(0, ta.selectionStart || 0);
        if (/[A-Za-z_$\u0980-\u09FF][\w$\u0980-\u09FF]*$/.test(before)) {
          // only accept if caret is at end of the current word
          var after = (ta.value || '').slice(ta.selectionStart || 0);
          if (!/^[\w$\u0980-\u09FF]/.test(after)) {
            e.preventDefault();
            acceptSuggest();
          }
        }
      }
    });

    refresh();
    return { refresh: refresh, textarea: ta };
  }

  function mount(root) {
    if (root.getAttribute('data-mounted')) return;
    root.setAttribute('data-mounted', '1');
    var starter = root.getAttribute('data-starter') || '';
    var label = root.getAttribute('data-label') || 'ফরমেটিভ অনুশীলন';
    var expectedOutput = root.getAttribute('data-expected-output') || '';
    var hints = [];
    var expected = [];
    try { hints = JSON.parse(root.getAttribute('data-hints') || '[]'); } catch (e) {}
    try { expected = JSON.parse(root.getAttribute('data-expected') || '[]'); } catch (e) {}

    root.textContent = '';
    root.appendChild(el('p', 'wgba-playground-label', label));
    var lab = el('label', 'wgba-editor-label');
    lab.appendChild(el('span', 'wgba-sr-only', 'কোড এডিটর'));
    var ta = el('textarea', 'wgba-editor');
    ta.rows = Math.min(Math.max(starter.split('\n').length + 1, 8), 28);
    lab.appendChild(ta);
    root.appendChild(lab);

    var editor = attachCodeEditor(ta);

    var bar = el('div', 'wgba-playground-toolbar');
    function btn(act, text, ghost) {
      var b = el('button', 'wgba-btn' + (ghost ? ' wgba-btn-ghost' : ''), text);
      b.type = 'button';
      b.setAttribute('data-act', act);
      bar.appendChild(b);
      return b;
    }
    var runBtn = btn('run', 'Run »');
    var stopBtn = btn('stop', 'Stop', true);
    btn('reset', 'Reset', true);
    if (hints.length) btn('hint', 'ইঙ্গিত', true);
    if (root.getAttribute('data-solution')) btn('solution', 'সমাধান', true);
    var saveBtn = null;
    if (window.wgbaData && window.wgbaData.loggedIn) saveBtn = btn('save', 'ড্রাফট সেভ', true);
    else bar.appendChild(el('span', 'wgba-muted', 'ড্রাফট সেভ করতে লগইন করুন (এই পেজে সম্পাদনা অস্থায়ী)'));
    root.appendChild(bar);
    root.appendChild(el('p', 'wgba-muted wgba-kbd-tip', 'Tab = indent / autocomplete · Ctrl/⌘ + Enter = Run'));

    var status = el('p', 'wgba-run-status');
    status.setAttribute('aria-live', 'polite');
    root.appendChild(status);
    var cons = el('pre', 'wgba-console');
    cons.setAttribute('aria-label', 'আউটপুট');
    root.appendChild(cons);
    if (expectedOutput) {
      var det = el('details', 'wgba-expected');
      det.appendChild(el('summary', null, 'প্রত্যাশিত আউটপুট দেখুন'));
      det.appendChild(el('pre', 'wgba-console wgba-console-expected', expectedOutput));
      root.appendChild(det);
    }
    var hintEl = el('p', 'wgba-hint');
    hintEl.setAttribute('aria-live', 'polite');
    root.appendChild(hintEl);

    ta.value = starter;
    editor.refresh();
    var hintIdx = 0;
    var worker = null;
    var runId = 0;
    var watchdog = null;
    var recordVersion = 0;

    function killWorker() {
      if (watchdog) { clearTimeout(watchdog); watchdog = null; }
      if (worker) { worker.terminate(); worker = null; }
      runBtn.disabled = false;
    }

    function finish(text) {
      killWorker();
      if (text) status.textContent = text;
    }

    function run() {
      var src = ta.value || '';
      if (src.length > (cfg.maxSourceChars || 50000)) {
        cons.textContent = 'সোর্স খুব বড়।';
        return;
      }
      cons.textContent = '';
      runId += 1;
      var myRun = runId;
      killWorker();
      runBtn.disabled = true;
      status.textContent = 'চলছে…';
      worker = new Worker(cfg.workerUrl);
      var timeoutMs = Number(root.getAttribute('data-timeout-ms')) || cfg.defaultTimeoutMs || 3000;
      watchdog = setTimeout(function () {
        if (myRun !== runId) return;
        cons.appendChild(document.createTextNode(explainError('timeout: execution exceeded ' + timeoutMs + 'ms') + '\n'));
        finish('থামানো হয়েছে (সময়সীমা)।');
      }, timeoutMs + 4000);
      worker.onmessage = function (ev) {
        var data = ev.data || {};
        if (typeof data !== 'object' || data.runId !== myRun || myRun !== runId) return;
        if (data.type === 'out') {
          cons.appendChild(document.createTextNode(String(data.line == null ? '' : data.line).slice(0, 4000) + '\n'));
        } else if (data.type === 'err') {
          cons.appendChild(document.createTextNode(explainError(String(data.message || '').slice(0, 2000)) + '\n'));
        } else if (data.type === 'done') {
          var text = cons.textContent || '';
          var ok = expected.length > 0 && expected.every(function (frag) { return text.indexOf(frag) !== -1; });
          if (expected.length) {
            cons.appendChild(document.createTextNode(ok
              ? '\n✓ প্রত্যাশিত অংশের সাথে মিল আছে (ফরমেটিভ চেক — ব্রাউজারে বদলানো সম্ভব, তাই এটি যাচাইকৃত মূল্যায়ন নয়)।\n'
              : '\nপ্রত্যাশিত অংশ এখনও মেলেনি।\n'));
          }
          finish('শেষ।');
          if (ok && window.wgbaData && window.wgbaData.loggedIn) {
            var lesson = root.getAttribute('data-lesson-id');
            if (lesson) {
              fetch(window.wgbaData.restUrl + 'progress/practice', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.wgbaData.nonce },
                body: JSON.stringify({ lesson_stable_id: lesson })
              }).catch(function () {});
            }
          }
        }
      };
      worker.onerror = function () {
        if (myRun !== runId) return;
        cons.appendChild(document.createTextNode('রানার চালু করা যায়নি।\n'));
        finish('ব্যর্থ।');
      };
      worker.postMessage({
        type: 'run',
        runId: myRun,
        source: src,
        timeoutMs: timeoutMs,
        maxOutputLines: cfg.maxOutputLines || 200,
        quickjsUrl: cfg.quickjsUrl
      });
    }

    runBtn.addEventListener('click', run);
    ta.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
    });
    stopBtn.addEventListener('click', function () {
      runId += 1;
      killWorker();
      cons.appendChild(document.createTextNode('\n[stopped]\n'));
      status.textContent = 'থামানো হয়েছে।';
    });
    bar.querySelector('[data-act="reset"]').addEventListener('click', function () {
      runId += 1;
      killWorker();
      ta.value = starter;
      editor.refresh();
      cons.textContent = '';
      hintEl.textContent = '';
      status.textContent = '';
      hintIdx = 0;
    });
    var hintBtn = bar.querySelector('[data-act="hint"]');
    if (hintBtn) hintBtn.addEventListener('click', function () {
      hintEl.textContent = 'ইঙ্গিত ' + (Math.min(hintIdx, hints.length - 1) + 1) + '/' + hints.length + ': ' + hints[Math.min(hintIdx, hints.length - 1)];
      hintIdx += 1;
    });
    var solBtn = bar.querySelector('[data-act="solution"]');
    if (solBtn) solBtn.addEventListener('click', function () {
      if (!window.confirm('সমাধান দেখালে আপনার বর্তমান কোড বদলে যাবে। দেখাবেন?')) return;
      ta.value = root.getAttribute('data-solution') || starter;
      editor.refresh();
      hintEl.textContent = 'সমাধান দেখানো হয়েছে — Run করে প্রতিটি লাইন মিলিয়ে নিন।';
    });
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        hintEl.textContent = 'সংরক্ষণ হচ্ছে…';
        fetch(window.wgbaData.restUrl + 'code-draft', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.wgbaData.nonce },
          body: JSON.stringify({
            exercise_stable_id: root.getAttribute('data-exercise-id'),
            exercise_version: root.getAttribute('data-exercise-version') || '1',
            source_code: ta.value,
            record_version: recordVersion
          })
        }).then(function (r) { return r.json().then(function (j) { return { status: r.status, j: j }; }); })
          .then(function (res) {
            if (res.status === 409) {
              hintEl.textContent = 'দ্বন্দ্ব: অন্য ট্যাবে নতুন সংস্করণ সেভ হয়েছে। আপনার কোড এডিটরে আছে—কপি করে রিলোড করুন।';
              return;
            }
            if (res.status >= 400) {
              hintEl.textContent = 'সেভ ব্যর্থ — আপনার কোড এডিটরে আছে, আবার চেষ্টা করুন।';
              return;
            }
            recordVersion = res.j.record_version || recordVersion;
            hintEl.textContent = 'ড্রাফট সংরক্ষিত।';
          })
          .catch(function () { hintEl.textContent = 'নেটওয়ার্ক ত্রুটি — কোড এডিটরে আছে, আবার চেষ্টা করুন।'; });
      });
    }

    window.addEventListener('pagehide', killWorker);
  }

  function enhanceAskCodeFields() {
    document.querySelectorAll('[data-wgba-question-form] textarea[name="code_snippet"]').forEach(function (ta) {
      if (ta.classList.contains('wgba-editor') || ta.closest('.wgba-code-editor')) return;
      attachCodeEditor(ta);
    });
  }

  function mountAll() {
    document.querySelectorAll('.wgba-playground').forEach(mount);
    enhanceAskCodeFields();
  }

  document.addEventListener('wgba:ready', mountAll);
  if (document.readyState !== 'loading') mountAll();
  else document.addEventListener('DOMContentLoaded', mountAll);

  window.wgbaAttachCodeEditor = attachCodeEditor;
})();

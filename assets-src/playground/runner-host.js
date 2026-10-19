/**
 * Playground host: mounts editors, talks to QuickJS worker with schema checks.
 */
(function () {
  'use strict';

  var cfg = window.wgbaPlayground || {};

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
    ta.spellcheck = false;
    ta.setAttribute('autocapitalize', 'off');
    ta.setAttribute('autocomplete', 'off');
    ta.rows = Math.min(Math.max(starter.split('\n').length + 1, 6), 28);
    lab.appendChild(ta);
    root.appendChild(lab);

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
    root.appendChild(el('p', 'wgba-muted wgba-kbd-tip', 'Ctrl/⌘ + Enter = Run'));

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

  function mountAll() {
    document.querySelectorAll('.wgba-playground').forEach(mount);
  }

  document.addEventListener('wgba:ready', mountAll);
  if (document.readyState !== 'loading') mountAll();
  else document.addEventListener('DOMContentLoaded', mountAll);
})();

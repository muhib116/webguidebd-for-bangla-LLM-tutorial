/**
 * QuickJS WASM worker — no DOM, no network bridge, bounded console.
 *
 * Learner code runs inside a fresh QuickJS runtime per run. The only things
 * the guest sees are the prelude below (console capture + a tiny virtual
 * module registry). No host functions are bridged into the guest.
 */
/* eslint-disable no-restricted-globals */
var runtimeReady = null;
var currentRun = 0;

var PRELUDE =
  'var __wgba_out=[];\n' +
  'function __wgba_fmt(){var p=[];for(var i=0;i<arguments.length;i++){var v=arguments[i];' +
  'if(typeof v==="string")p.push(v);else if(v===undefined)p.push("undefined");' +
  'else if(typeof v==="number"||typeof v==="boolean"||typeof v==="bigint")p.push(String(v));' +
  'else if(typeof v==="function")p.push("[Function]");' +
  'else if(v instanceof Error)p.push(v.name+": "+v.message);' +
  'else{try{var s=JSON.stringify(v);p.push(s===undefined?String(v):s);}catch(e){p.push(String(v));}}}' +
  'return p.join(" ");}\n' +
  'var console={log:function(){if(__wgba_out.length<2000)__wgba_out.push(__wgba_fmt.apply(null,arguments));}};\n' +
  'console.info=console.log;console.warn=console.log;console.error=console.log;\n' +
  'var __wgba_modules={};\n' +
  'function defineModule(name,factory){var exports={};factory(exports);__wgba_modules[name]=exports;}\n' +
  'function requireModule(name){if(!(name in __wgba_modules))throw new Error("Module not found: "+name);return __wgba_modules[name];}\n';

function loadQuickJS(url) {
  if (runtimeReady) return runtimeReady;
  runtimeReady = new Promise(function (resolve, reject) {
    try {
      importScripts(url);
      if (typeof self.WGBAQuickJS === 'undefined') {
        reject(new Error('QuickJS bundle missing WGBAQuickJS global'));
        return;
      }
      self.WGBAQuickJS().then(resolve).catch(reject);
    } catch (e) {
      reject(e);
    }
  });
  return runtimeReady;
}

function formatError(err) {
  if (err && typeof err === 'object') {
    var name = err.name || 'Error';
    return name + ': ' + (err.message || JSON.stringify(err));
  }
  return String(err);
}

self.onmessage = function (ev) {
  var msg = ev.data || {};
  if (msg.type !== 'run' || typeof msg.runId !== 'number') return;
  var runId = msg.runId;
  currentRun = runId;
  var timeoutMs = Math.min(Math.max(Number(msg.timeoutMs) || 3000, 100), 10000);
  var maxLines = Math.min(Number(msg.maxOutputLines) || 200, 500);
  var source = String(msg.source || '').slice(0, 50000);

  function emit(type, payload) {
    if (runId !== currentRun) return;
    payload = payload || {};
    payload.type = type;
    payload.runId = runId;
    self.postMessage(payload);
  }

  loadQuickJS(msg.quickjsUrl).then(function (QuickJS) {
    if (runId !== currentRun) return;
    var rt = QuickJS.newRuntime();
    var deadline = Date.now() + timeoutMs;
    var timedOut = false;
    try {
      rt.setMemoryLimit(16 * 1024 * 1024);
      rt.setMaxStackSize(512 * 1024);
    } catch (e) {}
    rt.setInterruptHandler(function () {
      if (Date.now() > deadline) {
        timedOut = true;
        return true;
      }
      return false;
    });
    var ctx = rt.newContext();
    var runError = null;

    var pre = ctx.evalCode(PRELUDE, 'prelude.js');
    if (pre.error) pre.error.dispose(); else pre.value.dispose();

    var result = ctx.evalCode(source, 'exercise.js');
    if (result.error) {
      runError = formatError(ctx.dump(result.error));
      result.error.dispose();
    } else {
      result.value.dispose();
    }

    // Drain promise jobs so async/await examples finish (bounded by deadline).
    var jobs = 0;
    while (!timedOut && rt.hasPendingJob() && jobs < 100000) {
      var jr = rt.executePendingJobs(1000);
      if (jr.error) {
        if (!runError) runError = formatError(ctx.dump(jr.error));
        jr.error.dispose();
        break;
      }
      jobs += jr.value || 0;
      if (!jr.value) break;
    }

    var lines = 0;
    var outRes = ctx.evalCode('__wgba_out', 'collect.js');
    if (!outRes.error) {
      var outArr = ctx.dump(outRes.value);
      outRes.value.dispose();
      if (Array.isArray(outArr)) {
        for (var i = 0; i < outArr.length; i++) {
          if (lines >= maxLines) {
            emit('err', { message: 'output flood capped at ' + maxLines + ' lines' });
            break;
          }
          lines += 1;
          var text = String(outArr[i] == null ? '' : outArr[i]);
          if (text.length > 4000) text = text.slice(0, 4000) + '…';
          emit('out', { line: text });
        }
      }
    } else {
      outRes.error.dispose();
    }

    if (timedOut) {
      emit('err', { message: 'timeout: execution exceeded ' + timeoutMs + 'ms' });
    } else if (runError) {
      if (/InternalError: interrupted/.test(runError)) runError = 'timeout: execution exceeded ' + timeoutMs + 'ms';
      emit('err', { message: runError });
    }
    try { ctx.dispose(); rt.dispose(); } catch (e) {}
    emit('done', {});
  }).catch(function (err) {
    emit('err', { message: 'Runner init failed: ' + (err && err.message ? err.message : String(err)) });
    emit('done', {});
  });
};

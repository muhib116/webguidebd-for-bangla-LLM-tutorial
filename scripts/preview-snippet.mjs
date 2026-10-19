// Prints the runner output of one lesson exercise, using the same QuickJS
// engine and prelude as the browser worker and build-content.mjs.
//
// Usage: node scripts/preview-snippet.mjs ch05 les-05-07 [exerciseIndex] [--solution]

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getQuickJS } from 'quickjs-emscripten';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [ch, lessonPart, idx = '0'] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const useSolution = process.argv.includes('--solution');
if (!ch || !lessonPart) {
  console.error('Usage: node scripts/preview-snippet.mjs ch05 les-05-07 [exerciseIndex] [--solution]');
  process.exit(2);
}

const workerSrc = readFileSync(join(root, 'assets-src/playground/runner-worker.js'), 'utf8');
const PRELUDE = new Function('return (' + workerSrc.match(/var PRELUDE =([\s\S]*?);\n\nfunction loadQuickJS/)[1] + ');')();

const mod = (await import(pathToFileURL(join(root, 'content-src', ch + '.mjs')).href)).default;
const lesson = mod.lessons.find((l) => l.id.includes(lessonPart));
if (!lesson) { console.error('lesson not found: ' + lessonPart); process.exit(2); }
const ex = lesson.code[Number(idx)];
const source = useSolution && ex.solution ? ex.solution : ex.starter;

const QuickJS = await getQuickJS();
const rt = QuickJS.newRuntime();
rt.setMemoryLimit(16 * 1024 * 1024);
rt.setMaxStackSize(512 * 1024);
const deadline = Date.now() + 3000;
rt.setInterruptHandler(() => Date.now() > deadline);
const ctx = rt.newContext();
const t0 = Date.now();
ctx.evalCode(PRELUDE, 'prelude.js').value?.dispose();
const r = ctx.evalCode(source, 'exercise.js');
let error = null;
if (r.error) { const e = ctx.dump(r.error); error = e && e.name ? e.name + ': ' + e.message : JSON.stringify(e); r.error.dispose(); } else r.value.dispose();
while (rt.hasPendingJob()) { const j = rt.executePendingJobs(1000); if (j.error) { j.error.dispose(); break; } if (!j.value) break; }
const o = ctx.evalCode('__wgba_out', 'collect.js');
const lines = o.error ? [] : ctx.dump(o.value);
o.value?.dispose();
ctx.dispose();
rt.dispose();
for (const l of lines) console.log(typeof l === 'string' ? l : (l.text ?? JSON.stringify(l)));
if (error) console.log('[error] ' + error);
console.log('[' + (Date.now() - t0) + ' ms]');

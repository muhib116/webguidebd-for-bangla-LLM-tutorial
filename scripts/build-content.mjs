// Validates authored lesson sources, executes every JavaScript example in
// QuickJS (same engine + prelude as the browser runner), and emits PHP seed
// files. Chapters with public === true go to content/public/, all others to
// content/restricted/ (HTTP-denied; imported into the DB by the seeder).
//
// Usage: node scripts/build-content.mjs [--check-links]

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { fileURLToPath, pathToFileURL } from 'url';
import { getQuickJS } from 'quickjs-emscripten';
import { esc } from '../content-src/lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pluginDir = join(root, 'plugin/webguidebd-ai-academy');
const CHECK_DATE = new Date().toISOString().slice(0, 10);
const TIMEOUT_MS = 3000;
const checkLinks = process.argv.includes('--check-links');

// Same prelude as the browser worker.
const workerSrc = readFileSync(join(root, 'assets-src/playground/runner-worker.js'), 'utf8');
const preludeExpr = workerSrc.match(/var PRELUDE =([\s\S]*?);\n\nfunction loadQuickJS/)[1];
const PRELUDE = new Function('return (' + preludeExpr + ');')();
// Failures are also recorded globally so assertions inside promise callbacks
// (which would otherwise become silent rejections) still fail the build.
const TEST_PRELUDE =
  'var __wgba_fail=[];\n' +
  'function __assert(c,m){if(!c){__wgba_fail.push(m);throw new Error("ASSERT failed: "+m);}}\n' +
  'function __close(a,b,tol,m){tol=tol||1e-9;if(!(Math.abs(a-b)<=tol)){var s=m+" got "+a+" expected "+b;__wgba_fail.push(s);throw new Error("ASSERT close failed: "+s);}}\n';

const QuickJS = await getQuickJS();

function runQuick(source, extra = '') {
  const rt = QuickJS.newRuntime();
  rt.setMemoryLimit(16 * 1024 * 1024);
  rt.setMaxStackSize(512 * 1024);
  const deadline = Date.now() + TIMEOUT_MS;
  let timedOut = false;
  rt.setInterruptHandler(() => {
    if (Date.now() > deadline) { timedOut = true; return true; }
    return false;
  });
  const ctx = rt.newContext();
  const t0 = Date.now();
  let error = null;
  const pre = ctx.evalCode(PRELUDE + TEST_PRELUDE, 'prelude.js');
  if (pre.error) { error = 'prelude: ' + JSON.stringify(ctx.dump(pre.error)); pre.error.dispose(); } else pre.value.dispose();
  const r = ctx.evalCode(source + '\n' + extra, 'exercise.js');
  if (r.error) { const e = ctx.dump(r.error); error = (e && e.name ? e.name + ': ' + e.message : JSON.stringify(e)); r.error.dispose(); } else r.value.dispose();
  let guard = 0;
  while (!timedOut && rt.hasPendingJob() && guard < 100000) {
    const jr = rt.executePendingJobs(1000);
    if (jr.error) { const e = ctx.dump(jr.error); if (!error) error = (e && e.name ? e.name + ': ' + e.message : JSON.stringify(e)); jr.error.dispose(); break; }
    if (!jr.value) break;
    guard += jr.value;
  }
  const f = ctx.evalCode('__wgba_fail', 'fail.js');
  if (!f.error) { const fails = ctx.dump(f.value); f.value.dispose(); if (fails.length && !error) error = 'ASSERT failed: ' + fails.join('; '); } else f.error.dispose();
  const o = ctx.evalCode('__wgba_out', 'collect.js');
  let lines = [];
  if (!o.error) { lines = ctx.dump(o.value); o.value.dispose(); } else o.error.dispose();
  ctx.dispose();
  rt.dispose();
  if (timedOut) error = 'timeout';
  return { lines, error, ms: Date.now() - t0 };
}

// ---------- PHP emitter ----------
function phpStr(s) {
  return "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}
function php(v, ind = '') {
  const n = ind + '  ';
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return phpStr(v);
  if (Array.isArray(v)) {
    if (!v.length) return 'array()';
    return 'array(\n' + v.map((x) => n + php(x, n) + ',\n').join('') + ind + ')';
  }
  const keys = Object.keys(v);
  if (!keys.length) return 'array()';
  return 'array(\n' + keys.map((k) => n + phpStr(k) + ' => ' + php(v[k], n) + ',\n').join('') + ind + ')';
}

// ---------- load sources ----------
const srcDir = join(root, 'content-src');
const files = readdirSync(srcDir).filter((f) => /^ch\d\d\.mjs$/.test(f)).sort();
const chapters = [];
for (const f of files) {
  const mod = await import(pathToFileURL(join(srcDir, f)).href);
  chapters.push(mod.default);
}
chapters.sort((a, b) => a.chapter.order - b.chapter.order);

const errors = [];
const warnings = [];
const fail = (id, msg) => errors.push(`${id}: ${msg}`);

// Flatten + index
const flat = [];
const byId = new Map();
const slugs = new Set();
for (const ch of chapters) {
  ch.lessons.forEach((l, i) => {
    l.order = i + 1;
    if (!l.version) l.version = ch.chapter.lessonVersion || 1;
    l.chapter = ch.chapter;
    if (byId.has(l.id)) fail(l.id, 'duplicate stable id');
    if (slugs.has(l.slug)) fail(l.id, 'duplicate slug ' + l.slug);
    if (!/^les-\d\d-\d\d-[a-z0-9-]+$/.test(l.id)) fail(l.id, 'bad stable id format');
    if (!/^[a-z0-9-]+$/.test(l.slug)) fail(l.id, 'bad slug');
    byId.set(l.id, l);
    slugs.add(l.slug);
    flat.push(l);
  });
}

// Prerequisites: must exist and appear earlier in course order (prevents cycles).
const pos = new Map(flat.map((l, i) => [l.id, i]));
for (const l of flat) {
  for (const pr of l.prereqs || []) {
    if (!byId.has(pr)) fail(l.id, 'unknown prerequisite ' + pr);
    else if (pos.get(pr) >= pos.get(l.id)) fail(l.id, 'prerequisite not earlier in course: ' + pr);
  }
}

// Lesson contract checks.
const need = ['title', 'slug', 'minutes', 'summary', 'overview', 'problem', 'explain', 'analogy', 'worked', 'experiment', 'line', 'why'];
for (const l of flat) {
  for (const k of need) if (!l[k] || (typeof l[k] === 'string' && !l[k].trim())) fail(l.id, 'missing ' + k);
  if (!Array.isArray(l.objectives) || l.objectives.length < 2) fail(l.id, 'objectives < 2');
  if (!Array.isArray(l.mistakes) || l.mistakes.length < 2) fail(l.id, 'mistakes < 2');
  if (!Array.isArray(l.recap) || l.recap.length < 2) fail(l.id, 'recap < 2');
  if (!Array.isArray(l.remember) || !l.remember.length) fail(l.id, 'remember missing');
  if (!Array.isArray(l.skip) || !l.skip.length) fail(l.id, 'skip missing');
  if (!Array.isArray(l.sources) || !l.sources.length) fail(l.id, 'sources missing');
  if (!Array.isArray(l.quiz) || l.quiz.length < 2) fail(l.id, 'quiz < 2 questions');
  if (!l.code?.length && !l.activity) fail(l.id, 'needs runnable code or an activity');
  if (!l.analogy.breaks) fail(l.id, 'analogy must say where it breaks');
  if (!l.chapter.public && l.overview.replace(/<[^>]+>/g, '').length < 160) warnings.push(`${l.id}: public overview is short`);
  (l.quiz || []).forEach((q, i) => {
    if (!q.a || !q.a[q.ok]) fail(l.id, `quiz q${i + 1} correct key missing`);
    if (!q.why) fail(l.id, `quiz q${i + 1} missing explanation`);
    if (Object.keys(q.a || {}).length < 3) fail(l.id, `quiz q${i + 1} needs ≥3 choices`);
  });
}

// ---------- execute examples ----------
let execCount = 0;
let assertCount = 0;
for (const l of flat) {
  (l.code || []).forEach((c, i) => {
    c.stable_id = c.id || `ex-${l.id}-${i + 1}`;
    if (c.lang && c.lang !== 'javascript') return;
    const sol = c.solution || c.starter;
    const res = runQuick(sol, c.test || '');
    execCount += 1;
    if (c.test) assertCount += (c.test.match(/__assert|__close/g) || []).length;
    if (res.error && !c.solutionThrows) fail(c.stable_id, 'solution error: ' + res.error);
    if (c.solutionThrows && !res.error) fail(c.stable_id, 'expected an error but none happened');
    const text = res.lines.join('\n');
    for (const frag of c.expect || []) if (!text.includes(frag)) fail(c.stable_id, `expected fragment missing: ${frag}\n--- got ---\n${text}`);
    c.actual_output = text + (res.error && c.solutionThrows ? '\n' + res.error : '');
    c.ms = res.ms;
    if (c.solution && c.starter !== c.solution) {
      const sr = runQuick(c.starter);
      execCount += 1;
      c.starter_output = sr.lines.join('\n');
      c.starter_error = sr.error;
      if (c.starterFails === 'error' && !sr.error) fail(c.stable_id, 'starter was meant to throw');
      if (!c.starterFails && sr.error) fail(c.stable_id, 'starter errors unexpectedly: ' + sr.error);
    }
  });
}

// ---------- HTML ----------
const lessonUrl = (l) => `/ai-academy/lesson/${l.slug}/`;
function renderLesson(l, next) {
  const s = [];
  s.push(`<section class="wgba-section" id="problem"><h2>সমস্যাটা কী?</h2>${l.problem}</section>`);
  s.push(`<section class="wgba-section" id="objectives"><h2>শেখার লক্ষ্য</h2><ul>${l.objectives.map((o) => `<li>${o}</li>`).join('')}</ul><p class="wgba-meta">আনুমানিক সময়: ${l.minutes} মিনিট${l.required === false ? ' · ঐচ্ছিক' : ''}</p></section>`);
  const pre = (l.prereqs || []).map((id) => byId.get(id)).filter(Boolean);
  s.push(`<section class="wgba-section" id="prereq"><h2>পূর্বশর্ত</h2>${pre.length
    ? `<ul>${pre.map((x) => `<li><a href="${lessonUrl(x)}">${esc(x.title)}</a></li>`).join('')}</ul>${l.prereqNote || ''}`
    : '<p>কোনো পূর্বশর্ত নেই—এখান থেকেই শুরু করা যায়।</p>'}</section>`);
  s.push(`<section class="wgba-section" id="explain"><h2>ব্যাখ্যা</h2>${l.explain}</section>`);
  s.push(`<section class="wgba-section" id="analogy"><h2>উপমা — এবং কোথায় ভাঙে</h2><p><strong>উপমা:</strong> ${l.analogy.text}</p><p><strong>কোথায় ভাঙে:</strong> ${l.analogy.breaks}</p></section>`);
  s.push(`<section class="wgba-section" id="worked"><h2>ধাপে ধাপে উদাহরণ</h2>${l.worked}</section>`);
  const slots = (l.code || []).map((c) => {
    const isJs = !c.lang || c.lang === 'javascript';
    const intro = c.intro ? `<div class="wgba-ex-intro">${c.intro}</div>` : '';
    if (!isJs) {
      return `${intro}<h3>${esc(c.label || 'কোড')}</h3><pre class="wgba-code" data-lang="${c.lang}"><code>${esc(c.starter.trim())}</code></pre>` +
        (c.sample_output ? `<p class="wgba-meta">${c.sample_label || 'নমুনা আউটপুট — আপনার কম্পিউটারে চালালে সংখ্যা সামান্য ভিন্ন হতে পারে:'}</p><pre class="wgba-console wgba-console-static">${esc(c.sample_output.trim())}</pre>` : '');
    }
    return `${intro}<h3>${esc(c.label || 'অনুশীলন')}</h3><div class="wgba-playground-slot" data-exercise="${c.stable_id}"><pre class="wgba-code"><code>${esc(c.starter.trim())}</code></pre><p class="wgba-meta">JavaScript চালু থাকলে এখানে Run বাটনসহ এডিটর আসবে।</p></div>`;
  }).join('');
  s.push(`<section class="wgba-section" id="activity"><h2>অনুশীলন / অ্যাক্টিভিটি</h2>${l.activity || ''}${slots}</section>`);
  s.push(`<details class="wgba-disclose"><summary>লাইন ধরে বুঝি</summary><div>${l.line}</div></details>`);
  s.push(`<details class="wgba-disclose"><summary>এখানে এটা কেন ব্যবহার করেছি?</summary><div>${l.why}</div></details>`);
  s.push(`<details class="wgba-disclose"><summary>কোন বিষয়গুলো মনে রাখব?</summary><div><ul>${l.remember.map((x) => `<li>${x}</li>`).join('')}</ul></div></details>`);
  s.push(`<details class="wgba-disclose"><summary>এখনই কোনগুলো মুখস্থ করতে হবে না?</summary><div><ul>${l.skip.map((x) => `<li>${x}</li>`).join('')}</ul></div></details>`);
  s.push(`<details class="wgba-disclose" open><summary>নিজে পরিবর্তন করে দেখুন</summary><div>${l.experiment}</div></details>`);
  s.push(`<section class="wgba-section" id="mistakes"><h2>সাধারণ ভুল</h2><ul>${l.mistakes.map((x) => `<li>${x}</li>`).join('')}</ul></section>`);
  if (l.solutionNote) s.push(`<details class="wgba-disclose"><summary>সমাধান ও ব্যাখ্যা</summary><div>${l.solutionNote}</div></details>`);
  s.push(`<section class="wgba-section" id="check"><h2>জ্ঞান যাচাই</h2><p>নিচের ${l.quiz.length}টি প্রশ্নের উত্তর দিয়ে “জমা দিন” চাপুন। স্কোর সার্ভারে যাচাই হয়; প্রতিটি উত্তরের পর কেন সঠিক বা ভুল তা দেখাবে। লগইন থাকলে ফল আপনার অগ্রগতিতে সংরক্ষিত হয়।</p></section>`);
  s.push(`<section class="wgba-section" id="recap"><h2>সংক্ষেপে মনে রাখুন</h2><ul>${l.recap.map((x) => `<li>${x}</li>`).join('')}</ul></section>`);
  s.push(`<section class="wgba-section" id="next"><h2>পরবর্তী পাঠ</h2>${next
    ? `<p>${l.nextNote || 'পরের ধাপ:'} <a href="${lessonUrl(next)}">${esc(next.title)}</a></p>`
    : '<p>এটিই কোর্সের শেষ পাঠ। ড্যাশবোর্ডে গিয়ে বাকি থাকা পাঠ ও প্রজেক্টগুলো দেখে নিন।</p>'}</section>`);
  const js = (l.code || []).filter((c) => !c.lang || c.lang === 'javascript');
  const verif = [
    `যাচাইয়ের তারিখ: ${CHECK_DATE}; লেখক: Muhibbullah Ansary।`,
    js.length ? `এই পাঠের ${js.length}টি JavaScript উদাহরণ বিল্ডের সময় সাইটের একই QuickJS রানারে চালানো হয়েছে এবং প্রত্যাশিত আউটপুট মিলেছে${js.some((c) => c.test) ? '; সংখ্যাগত ফলাফল আলাদা assertion দিয়ে (floating-point tolerance সহ) পরীক্ষিত' : ''}।` : 'এই পাঠে চালানোর মতো JavaScript নেই; ধারণাগত দাবিগুলো নিচের সূত্রের সাথে মিলিয়ে লেখা।',
    (l.code || []).some((c) => c.lang === 'python')
      ? ((l.code || []).every((c) => c.lang !== 'python' || c.executed)
        ? 'Python কোড এই সাইটে চালানো হয় না। এই পাঠের প্রতিটি Python উদাহরণ লেখকের কম্পিউটারে চালানো হয়েছে, আর দেখানো আউটপুট সেই রানের হুবহু ফল (পরিবেশ ও ভার্সন আউটপুটের উপরে লেখা); আপনার কম্পিউটারে দশমিকের শেষ অঙ্ক ভিন্ন হতে পারে।'
        : 'Python কোড এই সাইটে চালানো হয় না; প্রদর্শিত আউটপুট “নমুনা” হিসেবে চিহ্নিত।')
      : '',
    l.synthetic ? 'এই পাঠের ডেটা/উদাহরণ শেখানোর জন্য তৈরি সিন্থেটিক ডেটা—বাস্তব কোনো দোকান বা গ্রাহকের নয়।' : '',
    'স্বাধীন বিশেষজ্ঞ রিভিউ এখনও হয়নি; ভুল পেলে যোগাযোগ পাতায় জানান।',
  ].filter(Boolean);
  s.push(`<section class="wgba-section" id="sources"><h2>সূত্র ও যাচাই</h2><ul>${l.sources.map(([t, u]) => `<li><a href="${u}" rel="noopener">${esc(t)}</a></li>`).join('')}</ul><p class="wgba-meta">${verif.join(' ')}</p></section>`);
  return s.join('\n');
}

const outChapters = [];
const perChapter = new Map();
flat.forEach((l, i) => {
  const next = flat[i + 1] || null;
  const exercises = (l.code || []).filter((c) => !c.lang || c.lang === 'javascript').map((c) => ({
    stable_id: c.stable_id,
    version: String(c.version || 1),
    language: 'javascript',
    label: c.label || 'ফরমেটিভ অনুশীলন',
    starter: c.starter.replace(/^\n/, ''),
    solution: (c.solution || c.starter).replace(/^\n/, ''),
    expected_console_includes: c.expect || [],
    expected_output: c.actual_output,
    hints: c.hints || [],
    formative: true,
    ...(c.timeoutMs ? { timeout_ms: c.timeoutMs } : {}),
  }));
  const quiz = {
    stable_id: l.quizId || 'quiz-' + l.id,
    version: String(l.version || 1),
    pass_ratio: String(l.passRatio || '0.7'),
    questions: l.quiz.map((q, qi) => ({
      id: 'q' + (qi + 1),
      prompt: q.q,
      choices: q.a,
      correct: [q.ok],
      explanation: q.why,
      wrong_hint: q.hint || 'আবার ভাবুন—নিচের ব্যাখ্যা দেখুন।',
    })),
  };
  const row = {
    stable_id: l.id,
    slug: l.slug,
    title: l.title,
    chapter_stable_id: l.chapter.id,
    order: l.order,
    summary: l.summary,
    public_overview: l.overview,
    estimated_minutes: l.minutes,
    required: l.required !== false,
    prerequisites: l.prereqs || [],
    objectives: l.objectives.map((o) => o.replace(/<[^>]+>/g, '')),
    body_html: renderLesson(l, next),
    content_version: String(l.version || 1),
    status: 'publish',
    payload: { exercises, quiz },
    verification: {
      editor: 'Muhibbullah Ansary',
      checked: CHECK_DATE,
      js_examples_executed: exercises.length,
      runtime: 'QuickJS (quickjs-emscripten) at build time',
      synthetic_data: !!l.synthetic,
      independent_review: false,
    },
  };
  const { verification: _v, ...hashed } = row;
  row.content_hash = createHash('sha256').update(JSON.stringify(hashed)).digest('hex').slice(0, 16);
  if (!perChapter.has(l.chapter.id)) perChapter.set(l.chapter.id, []);
  perChapter.get(l.chapter.id).push(row);
});

for (const ch of chapters) {
  const c = ch.chapter;
  outChapters.push({
    stable_id: c.id,
    slug: c.slug,
    title: c.title,
    summary: c.summary,
    order: c.order,
    status: 'publish',
    content_version: String(c.version || 1),
    body: c.overview,
  });
}

// ---------- glossary ----------
const glossary = (await import(pathToFileURL(join(root, 'content-src/glossary.mjs')).href)).default;
const lessonById = new Map(flat.map((l) => [l.id, l]));
const seenGloss = new Set();
const outGlossary = glossary.map((g) => {
  for (const k of ['id', 'slug', 'title', 'body', 'lesson']) if (!g[k]) errors.push(`glossary ${g.id || '?'}: missing ${k}`);
  if (seenGloss.has(g.id) || seenGloss.has(g.slug)) errors.push(`glossary ${g.id}: duplicate id/slug`);
  seenGloss.add(g.id); seenGloss.add(g.slug);
  const l = lessonById.get(g.lesson);
  if (!l) errors.push(`glossary ${g.id}: unknown lesson ${g.lesson}`);
  return {
    stable_id: g.id, slug: g.slug, title: g.title, synonyms: g.synonyms || [], body: `<p>${g.body}</p>`,
    lesson_stable_id: g.lesson, lesson_slug: l ? l.slug : '', lesson_title: l ? l.title : '', lesson_public: l ? !!l.chapter.public : false,
  };
});

if (errors.length) {
  console.error('BUILD FAILED:\n' + errors.join('\n'));
  process.exit(1);
}

// ---------- write PHP ----------
const header = (desc) => `<?php
/**
 * ${desc}
 * GENERATED by scripts/build-content.mjs from content-src/ — edit the source, not this file.
 *
 * @package WebGuideBD\\AIAcademy
 */

declare(strict_types=1);

defined( 'ABSPATH' ) || exit;

`;

writeFileSync(join(pluginDir, 'content/public/chapters.php'),
  header('Chapter seed data (all 14 chapters).') + `function wgba_seed_chapters(): array {\nreturn ${php(outChapters)};\n}\n`);

writeFileSync(join(pluginDir, 'content/public/glossary-seed.php'),
  header(`Glossary seed (${outGlossary.length} terms).`) + `function wgba_seed_glossary(): array {\nreturn ${php(outGlossary)};\n}\n`);

const manifest = [];
for (const ch of chapters) {
  const c = ch.chapter;
  const nn = String(c.order).padStart(2, '0');
  const dir = c.public ? 'public' : 'restricted';
  mkdirSync(join(pluginDir, 'content', dir), { recursive: true });
  const rows = perChapter.get(c.id) || [];
  writeFileSync(join(pluginDir, `content/${dir}/lessons-ch${nn}.php`),
    header(`Lesson seed — ${c.title} (${dir}).`) + `function wgba_seed_lessons_ch${nn}(): array {\nreturn ${php(rows)};\n}\n`);
  manifest.push({ chapter: c.id, dir, lessons: rows.length });
}

// ---------- optional link check ----------
if (checkLinks) {
  const urls = [...new Set(flat.flatMap((l) => l.sources.map((s) => s[1])))];
  const bad = [];
  const probe = async (u) => {
    let r = await fetch(u, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15000) });
    if (r.status >= 400) r = await fetch(u, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(15000) });
    return r.status;
  };
  await Promise.all(urls.map(async (u) => {
    let last = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const s = await probe(u);
        if (s < 400) return;
        last = String(s);
        if (s === 403 || s === 404 || s === 410) break;
      } catch (e) { last = `ERR ${e.message}`; }
      await new Promise((res) => setTimeout(res, 2000 * (attempt + 1)));
    }
    bad.push(`${last} ${u}`);
  }));
  console.log(`Link check: ${urls.length - bad.length}/${urls.length} reachable on ${CHECK_DATE}`);
  if (bad.length) console.log(bad.join('\n'));
}

// ---------- curriculum schema + map (generated; do not edit by hand) ----------
const curriculumPath = join(pluginDir, 'content/schema/curriculum.json');
const prevCurriculum = JSON.parse(readFileSync(curriculumPath, 'utf8'));
const pyCount = (l) => (l.code || []).filter((c) => c.lang === 'python').length;
const jsCount = (l) => (l.code || []).filter((c) => !c.lang || c.lang === 'javascript').length;
writeFileSync(curriculumPath, JSON.stringify({
  schema_version: prevCurriculum.schema_version,
  generated: CHECK_DATE,
  course: prevCurriculum.course,
  public_preview_chapter_ids: chapters.filter((ch) => ch.chapter.public).map((ch) => ch.chapter.id),
  chapters: chapters.map((ch) => ({
    stable_id: ch.chapter.id,
    slug: ch.chapter.slug,
    title_bn: ch.chapter.title,
    order: ch.chapter.order,
    access: ch.chapter.public ? 'public' : 'login_required',
    summary_bn: ch.chapter.summary,
    lessons: ch.lessons.map((l) => ({
      stable_id: l.id, slug: l.slug, title_bn: l.title, order: l.order, prerequisites: l.prereqs || [],
      estimated_minutes: l.minutes, required: l.required !== false, js_examples: jsCount(l), python_examples: pyCount(l),
      quiz_questions: l.quiz.length, synthetic_data: !!l.synthetic, publication_state: 'published',
    })),
  })),
}, null, 2) + '\n');

const mapRows = chapters.map((ch) => {
  const c = ch.chapter;
  const head = `## Chapter ${c.order} — ${c.title} (\`${c.id}\`) — ${c.public ? 'PUBLIC' : 'LOGIN REQUIRED'}\n\n${c.summary}\n\n| Stable ID | Title | Prerequisites | Est. | JS / Python / Quiz |\n|-----------|-------|---------------|------|--------------------|\n`;
  return head + ch.lessons.map((l) => `| ${l.id} | ${l.title.replace(/\|/g, '\\|')} | ${(l.prereqs || []).join(', ') || '—'} | ${l.minutes}m | ${jsCount(l)} / ${pyCount(l)} / ${l.quiz.length} |`).join('\n');
}).join('\n\n');
writeFileSync(join(root, 'docs/CURRICULUM_MAP.md'),
  `# Lesson-level curriculum map\n\nGenerated by \`node scripts/build-content.mjs\` on ${CHECK_DATE} from \`content-src/\`. Do not edit by hand.\n\nStable IDs are canonical. Display order may change without changing access rules.\n\n**Course ID:** \`${prevCurriculum.course.stable_id}\`  \n**Author:** ${prevCurriculum.course.author}  \n**Language:** Bengali (technical terms English on first use)  \n**Totals:** ${chapters.length} chapters, ${flat.length} lessons, ${execCount} JavaScript runs and ${assertCount} assertions checked at build time; ${flat.reduce((s, l) => s + pyCount(l), 0)} Python examples executed by \`scripts/run-python.mjs\`.\n\n` + mapRows + '\n');

console.log(`Chapters: ${chapters.length}, lessons: ${flat.length}, JS runs: ${execCount}, assertions: ${assertCount}`);
manifest.forEach((m) => console.log(`  ${m.chapter.padEnd(30)} ${m.dir.padEnd(10)} ${m.lessons} lessons`));
if (warnings.length) console.log('Warnings:\n' + warnings.join('\n'));
writeFileSync(join(root, 'content-src/build-report.json'), JSON.stringify({
  date: CHECK_DATE, chapters: chapters.length, lessons: flat.length, jsRuns: execCount, assertions: assertCount, manifest,
  lessonsDetail: flat.map((l) => ({ id: l.id, chapter: l.chapter.id, title: l.title, prereqs: l.prereqs || [], minutes: l.minutes, required: l.required !== false, js: (l.code || []).filter((c) => !c.lang || c.lang === 'javascript').length, python: (l.code || []).filter((c) => c.lang === 'python').length, quiz: l.quiz.length, synthetic: !!l.synthetic })),
}, null, 2));

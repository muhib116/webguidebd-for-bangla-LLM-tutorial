import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { p, ul, ol, code, out, note, warn, table, term, SRC } from './lib.mjs';

const chapter = {
  id: 'ch-14-capstones',
  slug: 'capstone-projects',
  title: 'ক্যাপস্টোন: Engineering ও Research ট্র্যাক',
  order: 14,
  public: false,
  summary: 'দুটি ট্র্যাক: engineering (মেপে মডেল বাছাই, caching, batching, observability, privacy, reliability, ব্যর্থতা সামলানো, multi-tenant স্থাপত্য, evaluation-চালিত উন্নতি) ও research (পেপার পড়া, প্রশ্ন, baseline, hypothesis, নিয়ন্ত্রিত পরীক্ষা, ablation, seed ও variance, reproducibility, benchmark-এর সীমা, নেতিবাচক ফল)। ক্যাপস্টোন A: বাংলা knowledge assistant; ক্যাপস্টোন B: পুনরুৎপাদনযোগ্য ছোট-মডেল পরীক্ষা।',
  overview: p(
    'কোর্সের শেষ অধ্যায়ে নতুন ধারণা কম, প্রয়োগ বেশি। দুটি ট্র্যাক আছে: যাঁরা পণ্য বানাতে চান তাঁদের জন্য engineering, আর যাঁরা প্রশ্ন করে পরীক্ষা চালিয়ে উত্তর খুঁজতে চান তাঁদের জন্য research। প্রতিটি ট্র্যাকের শেষে একটি ক্যাপস্টোন, যার সাথে আছে মানদণ্ড, শুরুর কোড, ধাপে ধাপে checkpoint ও রিপোর্টের টেমপ্লেট।',
    'একটি স্পষ্ট কথা আগেই: এই কোর্স শেষ করলে কেউ বিজ্ঞানী বা বিশেষজ্ঞ হয়ে যান না, এবং এটি কোনো চাকরির নিশ্চয়তা দেয় না। এটি একটি ভিত্তি দেয়—মাপতে, যাচাই করতে আর নিজের দাবির সীমা সৎভাবে বলতে শেখা। ক্যাপস্টোন সেই অভ্যাসের প্রমাণ, যোগ্যতার সনদ নয়।'
  ),
};

const RUN = JSON.parse(readFileSync(new URL('./python/outputs.json', import.meta.url), 'utf8'));
const ENV = RUN.env;
const MAC = ENV.system.replace(/^Darwin\s*/, '');
const RAN_LABEL = `চালানো আউটপুট, নমুনা নয়—${RUN.ranAt}, macOS ${MAC} (${ENV.machine}), Python ${ENV.python}, PyTorch ${ENV.torch} (হিসাব CPU-তে), NumPy ${ENV.numpy}। অন্য কম্পিউটার বা ভার্সনে দশমিকের শেষ অঙ্ক ভিন্ন হতে পারে:`;
function py(file, label) {
  const key = 'ch14/' + file;
  const src = readFileSync(new URL('./python/ch14/' + file, import.meta.url));
  const r = RUN.files[key];
  if (!r || !r.ok) throw new Error(`python output missing or failed: ${key} — run scripts/run-python.mjs`);
  if (createHash('sha256').update(src).digest('hex') !== r.sha256) throw new Error(`stale python output: ${key} — run scripts/run-python.mjs`);
  return { label, lang: 'python', starter: src.toString('utf8'), sample_output: r.stdout, sample_label: RAN_LABEL, executed: true };
}

const RNG = String.raw`function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
`;

const PRACTICE = 'স্থানীয় অনুশীলন মোড: এই অধ্যায়ের কোনো কোড কোনো আসল মডেল API ডাকে না। “মডেল” প্রার্থীরা সিমুলেটেড, দোকান ও গ্রাহক কাল্পনিক, দাম ও চার্জ নমুনা।';

const lessons = [
  {
    id: 'les-14-01-tracks-scope-planning',
    slug: 'capstone-tracks-scope-planning',
    title: 'দুই ট্র্যাক, সৎ পরিধি ও পরিকল্পনা',
    minutes: 35,
    prereqs: ['les-13-07-project-char-lm', 'les-12-06-project-ecommerce-assistant'],
    summary: 'engineering ও research ট্র্যাকের পার্থক্য; ক্যাপস্টোন A ও B-এর সারাংশ; মাপযোগ্য প্রশ্ন ও লক্ষ্য; project charter; checkpoint-ভিত্তিক সময়সূচি; কোর্স সমাপ্তি কী প্রমাণ করে আর কী করে না।',
    overview: p('বড় প্রজেক্ট সাধারণত শেষ হয় না কারণ শুরুতে “শেষ” কাকে বলে তা লেখা থাকে না। এই পাঠে দুই ট্র্যাকের যেকোনো একটি বেছে নিয়ে এক পাতার একটি charter লিখবেন: কী প্রশ্ন, কোন সংখ্যা দিয়ে সাফল্য মাপা হবে, কিসের সাথে তুলনা, কত সময় ও খরচ, আর কী এই প্রজেক্টের বাইরে। একটি ছোট JavaScript পরীক্ষক charter-এর সাধারণ ফাঁকগুলো ধরে।'),
    objectives: ['নিজের লক্ষ্য অনুযায়ী ট্র্যাক বেছে নিতে পারবেন', 'মাপযোগ্য প্রশ্ন, লক্ষ্য ও baseline-সহ একটি project charter লিখতে পারবেন', 'কোর্স সমাপ্তির অর্থ ও সীমা সৎভাবে বলতে পারবেন'],
    problem: p('“একটা ভালো বাংলা চ্যাটবট বানাব”—এটি লক্ষ্য নয়, ইচ্ছা। “ভালো” মানে কী? কার জন্য? কিসের তুলনায়? কতদিনে? প্রশ্নগুলোর উত্তর না থাকলে প্রজেক্ট হয় অনন্তকাল চলে, নয়তো যা বানানো হলো তাকেই “সফল” বলা হয়।'),
    explain:
      table(['', 'Engineering ট্র্যাক', 'Research ট্র্যাক'], [
        ['মূল প্রশ্ন', 'এটি কি নির্ভরযোগ্যভাবে, নির্দিষ্ট খরচে ব্যবহারকারীর কাজ করে?', 'X বদলালে Y কি বদলায়, এবং কতটা নিশ্চিতভাবে?'],
        ['সাফল্যের মাপ', 'evaluation suite-এ মান, p95 latency, খরচ, ব্যর্থতার হার', 'baseline-এর তুলনায় পার্থক্য, seed-জুড়ে variance-সহ'],
        ['বিপদ', 'demo-তে চলে, বাস্তবে ভাঙে', 'একটি seed-এর কাকতালীয় ফলকে আবিষ্কার ভাবা'],
        ['ক্যাপস্টোন', 'A: বাংলা knowledge assistant (retrieval, citation, structured tool, eval suite)', 'B: ছোট মডেলে baseline বনাম একটি নিয়ন্ত্রিত পরিবর্তন'],
        ['পূর্বের অধ্যায়', '১০, ১১, ১২', '৪, ৫, ৯, ১৩'],
      ], 'দুই ট্র্যাক এক নজরে') +
      p('<strong>charter-এর ক্ষেত্রগুলো:</strong> প্রশ্ন (একটি বাক্য), ব্যবহারকারী বা পাঠক, মাপ ও লক্ষ্য-সংখ্যা, baseline, evaluation বা পরীক্ষার ডেটা, বাজেট (সময় ও টাকা), ঝুঁকি, এবং কী <em>করা হবে না</em>। research-এ সাথে hypothesis, একটিই পরিবর্তন, কী স্থির থাকবে, কয়টি seed, আর ফল নেতিবাচক হলে কী লিখবেন।') +
      p('<strong>checkpoint:</strong> দুই ট্র্যাকেই চারটি—(১) charter ও baseline, (২) প্রথম সম্পূর্ণ চালানো (খারাপ হলেও), (৩) evaluation বা পরীক্ষা পূর্ণ মাপে, (৪) রিপোর্ট। প্রতিটি checkpoint-এ যা আছে তা চালিয়ে দেখানো যায় এমন অবস্থায় থাকবে; “প্রায় শেষ” কোনো checkpoint নয়।') +
      warn('কোর্স সমাপ্তি মানে আপনি এই কোর্সের বিষয়গুলো অনুশীলন করেছেন। এটি বৈজ্ঞানিক দক্ষতা, পেশাদার সনদ বা চাকরির নিশ্চয়তা নয়। এই কোর্সের কনটেন্ট এখনও কোনো স্বাধীন বিশেষজ্ঞ রিভিউ করেননি। ক্যাপস্টোন রিপোর্টে নিজের কাজের সীমাও লিখুন—সেটিই সবচেয়ে বিশ্বাসযোগ্য অংশ।'),
    analogy: {
      text: 'charter হলো বাড়ি বানানোর আগে নকশা ও বাজেট: কয় ঘর, কত টাকা, কবে শেষ, কোনটি এবার নয় (ছাদবাগান পরে)।',
      breaks: 'বাড়ির নকশা সাধারণত বদলায় না; সফটওয়্যার ও গবেষণায় মাঝপথে শেখা জিনিস দেখে charter বদলানো স্বাভাবিক—শর্ত হলো বদলটি লিখে রাখা ও কারণ বলা, চুপচাপ লক্ষ্য সরানো নয়।',
    },
    worked:
      p('একটি অস্পষ্ট লক্ষ্যকে charter-এ রূপান্তর:') +
      ol([
        '“ভালো বাংলা চ্যাটবট” → প্রশ্ন: “একটি কাল্পনিক অনলাইন পোশাকের দোকানের নীতি ও অর্ডার-প্রশ্নে সহকারী কি উৎসসহ সঠিক উত্তর দেয় এবং না জানলে থামে?”',
        'মাপ: ২০টি প্রশ্নের evaluation suite-এ সঠিক তথ্য ≥ ১৮, ভুয়া উদ্ধৃতি ০, বানানো টাকার অঙ্ক ০, অজানা প্রশ্নে বিরত থাকা ≥ ৪/৫।',
        'baseline: retrieval ছাড়া, শুধু নিয়ম-ভিত্তিক উত্তর (অধ্যায় ১০-এর practice model)।',
        'বাইরে: আসল পেমেন্ট, আসল গ্রাহকের ডেটা, ভয়েস।',
      ]),
    activity: p('JavaScript পরীক্ষকে চারটি charter দেওয়া আছে—দুটি ভালো, দুটিতে সাধারণ ফাঁক। চালিয়ে প্রতিটি সমস্যা পড়ুন। তারপর নিজের ট্র্যাকের charter একই বস্তু-আকারে লিখে <code>checkCharter</code>-এ দিন, যতক্ষণ না “সমস্যা নেই” আসে। এটি শুধু কাঠামো যাচাই করে—প্রশ্নটি ভালো কিনা, তা আপনাকে ও আপনার পর্যালোচককে ভাবতে হবে।'),
    code: [
      {
        label: 'Project charter পরীক্ষক',
        starter: String.raw`const REQUIRED = {
  engineering: ["question", "users", "metric", "target", "baseline", "evalSet", "budget", "risks", "outOfScope"],
  research: ["question", "hypothesis", "baseline", "change", "controlled", "metric", "seeds", "budget", "negativePlan"],
};
const empty = (v) => v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
function checkCharter(c) {
  const problems = [];
  if (!REQUIRED[c.track]) return ["track হবে engineering বা research"];
  for (const k of REQUIRED[c.track]) if (empty(c[k])) problems.push("অনুপস্থিত: " + k);
  if (/সেরা|সবচেয়ে ভালো|ভালো একটা|SOTA/i.test(c.question || "")) problems.push("প্রশ্ন মাপযোগ্য নয় (“সেরা/ভালো” কিসের তুলনায়?)");
  if (c.track === "engineering" && !empty(c.target) && typeof c.target !== "number") problems.push("target একটি সংখ্যা হবে");
  if (c.track === "research") {
    if (Array.isArray(c.change) && c.change.length !== 1) problems.push("নিয়ন্ত্রিত পরীক্ষায় একটিই পরিবর্তন; দেওয়া হয়েছে " + c.change.length + "টি");
    if (Array.isArray(c.seeds) && c.seeds.length < 3) problems.push("seed কমপক্ষে ৩টি; দেওয়া হয়েছে " + c.seeds.length + "টি");
  }
  return problems;
}
const charters = [
  { name: "A-ভালো", track: "engineering", question: "নীতি ও অর্ডার-প্রশ্নে সহকারী কি উৎসসহ সঠিক উত্তর দেয় ও না জানলে থামে?", users: "কাল্পনিক দোকানের গ্রাহক", metric: "eval suite-এ সঠিক তথ্য", target: 18, baseline: "retrieval ছাড়া নিয়ম-ভিত্তিক", evalSet: "২০টি প্রশ্ন", budget: "৩ সপ্তাহ, API খরচ ০ (local)", risks: ["ভুয়া উদ্ধৃতি", "tenant ফাঁস"], outOfScope: ["আসল পেমেন্ট"] },
  { name: "A-অস্পষ্ট", track: "engineering", question: "সবচেয়ে ভালো বাংলা চ্যাটবট বানাব", users: "সবাই", metric: "ভালো লাগা", target: "অনেক ভালো", budget: "যতদিন লাগে" },
  { name: "B-ভালো", track: "research", question: "context ৩ থেকে ৫ অক্ষর করলে val loss কমে কি?", hypothesis: "কমবে, কারণ টেমপ্লেটের শব্দ ৩ অক্ষরের চেয়ে লম্বা", baseline: "CTX=3 MLP", change: ["CTX=5"], controlled: ["ডেটা", "ভাগ", "step", "lr", "hidden"], metric: "val cross-entropy", seeds: [0, 1, 2], budget: "CPU-তে ১ ঘণ্টা", negativePlan: "পার্থক্য seed-variance-এর মধ্যে হলে “প্রমাণ নেই” লিখব" },
  { name: "B-গোলমেলে", track: "research", question: "নতুন মডেল কি ভালো?", hypothesis: "হ্যাঁ", baseline: "CTX=3 MLP", change: ["CTX=5", "Adam→SGD", "hidden 256"], controlled: [], metric: "val loss", seeds: [0], budget: "১ দিন" },
];
const report = charters.map((c) => ({ name: c.name, problems: checkCharter(c) }));
for (const r of report) {
  console.log(r.name + ": " + (r.problems.length ? r.problems.length + "টি সমস্যা" : "সমস্যা নেই"));
  r.problems.forEach((x) => console.log("  - " + x));
}
`,
        expect: ['A-ভালো: সমস্যা নেই', 'B-ভালো: সমস্যা নেই', 'অনুপস্থিত: baseline', 'target একটি সংখ্যা হবে', 'নিয়ন্ত্রিত পরীক্ষায় একটিই পরিবর্তন; দেওয়া হয়েছে 3টি', 'seed কমপক্ষে ৩টি; দেওয়া হয়েছে 1টি'],
        hints: ['B-গোলমেলে-তে controlled ফাঁকা array—এটিও “অনুপস্থিত”। কোন পরীক্ষাটি তা ধরছে?', 'A-অস্পষ্ট ঠিক করুন: প্রশ্নে “সবচেয়ে ভালো”-র বদলে মাপযোগ্য কাজ লিখুন, target-এ একটি সংখ্যা দিন।', 'পরীক্ষকে একটি নিয়ম যোগ করুন: engineering charter-এ risks-এ অন্তত একটি privacy-ঝুঁকি থাকা উচিত।'],
        test: '__assert(report[0].problems.length===0&&report[2].problems.length===0,"good charters pass"); __assert(report[1].problems.length>=5,"vague engineering caught"); __assert(report[3].problems.some(function(x){return x.indexOf("একটিই পরিবর্তন")>=0;}),"one change"); __assert(report[3].problems.some(function(x){return x.indexOf("controlled")>=0;}),"controlled empty");',
      },
    ],
    line: ul([
      '<code>REQUIRED</code> — ট্র্যাক অনুযায়ী আবশ্যিক ক্ষেত্র।',
      '<code>empty(v)</code> — ফাঁকা string ও ফাঁকা array-ও অনুপস্থিত।',
      'regex <code>/সেরা|সবচেয়ে ভালো|.../</code> — মাপযোগ্য নয় এমন শব্দ ধরার মোটা দাগের নিয়ম।',
      '<code>c.change.length !== 1</code> — একাধিক পরিবর্তন হলে কোনটির প্রভাব, বলা যায় না।',
    ]),
    why: p('charter-কে একটি বস্তু হিসেবে লেখানো হয়েছে যাতে ফাঁকগুলো যন্ত্রে ধরা পড়ে—প্রজেক্টের শুরুতেই অধ্যায় ১২-এর “evaluation আগে” নীতি। পরীক্ষকটি ইচ্ছা করে সরল; এটি পাস করলেই charter ভালো নয়, কিন্তু ফেল করলে প্রায় নিশ্চিতভাবে কিছু অনুপস্থিত।'),
    remember: ['ট্র্যাক বাছুন লক্ষ্য দেখে', 'charter: প্রশ্ন, মাপ, লক্ষ্য-সংখ্যা, baseline, বাজেট, ঝুঁকি, বাইরে কী', 'research-এ একটিই পরিবর্তন, ≥৩ seed, নেতিবাচক ফলের পরিকল্পনা', 'চারটি চালানো যায় এমন checkpoint', 'সমাপ্তি ≠ বিশেষজ্ঞতা বা চাকরির নিশ্চয়তা'],
    skip: ['আনুষ্ঠানিক project-management পদ্ধতি', 'grant বা পেপার-প্রস্তাবের পূর্ণ কাঠামো'],
    experiment: p('নিজের charter লিখে পরীক্ষকে দিন। তারপর একজন সহপাঠী বা বন্ধুকে শুধু “question” ও “metric” পড়তে দিন এবং জিজ্ঞেস করুন: “শেষে কোন সংখ্যা দেখলে বুঝবেন প্রজেক্ট সফল?” তাঁর উত্তর আপনার target-এর সাথে না মিললে charter আরও স্পষ্ট করুন।'),
    mistakes: ['লক্ষ্য-সংখ্যা ছাড়া charter', 'baseline না রাখা', 'research-এ একসাথে কয়েকটি জিনিস বদলানো', '“বাইরে কী” না লেখা—পরিধি বাড়তেই থাকে', 'checkpoint-এ চালানো যায় না এমন অর্ধেক কাজ'],
    solutionNote: p('পরীক্ষকের ফল (QuickJS-এ চালানো): A-ভালো ও B-ভালো—সমস্যা নেই। A-অস্পষ্ট: baseline, evalSet, risks, outOfScope অনুপস্থিত, প্রশ্ন মাপযোগ্য নয়, target সংখ্যা নয়। B-গোলমেলে: controlled ও negativePlan অনুপস্থিত, ৩টি পরিবর্তন, ১টি seed। লক্ষ্য করুন “নতুন মডেল কি ভালো?” প্রশ্নটি regex-এ ধরা পড়েনি (“ভালো একটা” বা “সবচেয়ে ভালো” নেই)—সরল নিয়মের সীমা; মানুষের পর্যালোচনা লাগবেই।'),
    quiz: [
      { q: 'নিচের কোনটি মাপযোগ্য লক্ষ্য?', a: { a: 'গ্রাহকরা সহকারী পছন্দ করবে', b: '২০টি প্রশ্নের suite-এ ≥ ১৮টি সঠিক, ভুয়া উদ্ধৃতি ০', c: 'সবচেয়ে আধুনিক মডেল ব্যবহার' }, ok: 'b', why: 'সংখ্যা, ডেটাসেট ও শর্ত আছে; শেষে হ্যাঁ/না বলা যায়।' },
      { q: 'research charter-এ “negativePlan” কেন?', a: { a: 'আনুষ্ঠানিকতা', b: 'ফল প্রত্যাশামতো না হলেও তা সৎভাবে রিপোর্ট করার প্রতিশ্রুতি আগে থেকে রাখা', c: 'বাজেট কমাতে' }, ok: 'b', why: 'আগে না লিখলে খারাপ ফল দেখে লক্ষ্য বা মাপ বদলে ফেলার প্রলোভন থাকে।' },
      { q: 'কোর্স সমাপ্তির সবচেয়ে সৎ বর্ণনা:', a: { a: 'AI বিশেষজ্ঞের সনদ', b: 'বিষয়গুলো অনুশীলন করা এবং মাপা-যাচাইয়ের অভ্যাসের একটি ভিত্তি', c: 'চাকরির নিশ্চয়তা' }, ok: 'b', why: 'কোর্স একটি ভিত্তি দেয়; দক্ষতা আসে দীর্ঘ চর্চা, পর্যালোচনা ও বাস্তব কাজ থেকে।' },
    ],
    recap: ['দুই ট্র্যাক, দুই ক্যাপস্টোন', 'মাপযোগ্য charter ও চারটি checkpoint', 'সমাপ্তির সীমা সৎভাবে বলা'],
    nextNote: 'Engineering ট্র্যাক শুরু: মেপে মডেল বাছাই, caching ও batching:',
    synthetic: true,
    sources: [SRC.heilmeier, SRC.sre, ['Google: Rules of Machine Learning', 'https://developers.google.com/machine-learning/guides/rules-of-ml']],
  },
  {
    id: 'les-14-02-eng-selection-caching-batching',
    slug: 'engineering-model-selection-caching-batching',
    title: 'Engineering ১: মেপে মডেল বাছাই, caching ও batching',
    minutes: 55,
    prereqs: ['les-14-01-tracks-scope-planning', 'les-10-05-tokens-cost-latency-secrets'],
    summary: 'evaluation suite-এ মান, p95 latency ও মাসিক খরচ মেপে প্রার্থী বাছাই; ছোট suite-এর অনিশ্চয়তা; normalized cache key, TTL, tenant ও knowledge-base ভার্সন; virtual clock-এ batching-এর throughput বনাম latency।',
    overview: p('“সবচেয়ে বড় মডেল নাও” বা “সবচেয়ে সস্তাটা নাও”—দুটিই অনুমান। মেপে বাছাই মানে একই evaluation suite-এ প্রতিটি প্রার্থীর মান, latency ও খরচ মাপা, তারপর লিখিত শর্তে সিদ্ধান্ত। তারপর দুটি কৌশল যা খরচ ও latency কমায়, কিন্তু ভুলভাবে করলে ভুল উত্তর দেয়: caching (একই প্রশ্নের উত্তর মনে রাখা) ও batching (কয়েকটি অনুরোধ একসাথে চালানো)।') + note(PRACTICE),
    objectives: ['লিখিত শর্ত (মান, p95, খরচ) দিয়ে মডেল-প্রার্থী বাছাই করতে ও ছোট suite-এর অনিশ্চয়তা বলতে পারবেন', 'নিরাপদ cache key (normalization, tenant, ভার্সন) ও TTL নকশা করতে পারবেন', 'batching-এ throughput ও latency-র লেনদেন মেপে দেখাতে পারবেন'],
    problem: p('model-L সবচেয়ে নির্ভুল, কিন্তু খরচ দশ গুণ। model-S ৪০টি প্রশ্নে ২টি কম ঠিক করে। পার্থক্যটা কি আসল, নাকি ৪০টি প্রশ্নের দৈবতা? আবার, cache যোগ করে খরচ অর্ধেক হলো—কিন্তু একদিন দোকান B-এর গ্রাহক দোকান A-এর ডেলিভারি চার্জ পেলেন।'),
    explain:
      p('<strong>মেপে বাছাই:</strong> (১) charter-এর শর্ত লিখুন—যেমন মান ≥ ০.৮৫, p95 ≤ ৩,০০০ ms; (২) প্রতিটি প্রার্থী একই suite-এ চালান; (৩) শর্ত পূরণকারীদের মধ্যে সবচেয়ে সস্তা। মানের পাশে অনিশ্চয়তা লিখুন: n টি প্রশ্নে accuracy p হলে মোটামুটি ±১.৯৬√(p(১−p)/n)। n = ৪০, p = ০.৯ হলে ±০.০৯—অর্থাৎ ০.৮৫ ও ০.৯০ এই suite-এ আলাদা করা যায় না।') +
      p('<strong>caching:</strong> key বানানোর আগে প্রশ্ন normalize করুন (Unicode NFC, ফাঁকা জায়গা, বাংলা অঙ্ক → ASCII, শেষের ? ও ।)। key-তে অবশ্যই রাখুন <em>tenant</em> (কোন দোকান) ও <em>knowledge-base ভার্সন</em>; নইলে এক দোকানের উত্তর অন্য দোকানে যায়, বা পুরনো চার্জ দেখায়। TTL দিন, এবং ব্যক্তিগত উত্তর (অর্ডারের অবস্থা) cache করবেন না।') +
      p('<strong>batching:</strong> GPU বা model server প্রতি ডাকে একটি স্থির খরচ (overhead) নেয়, আর প্রতিটি অনুরোধে সামান্য বাড়তি। কয়েকটি অনুরোধ একসাথে চালালে overhead ভাগ হয়, throughput বাড়ে। কিন্তু batch ভরার জন্য অপেক্ষা latency বাড়ায়—কম চাপে batching ক্ষতিও করতে পারে। নিচের simulation-এ batch খরচ = ১২০ ms + ১৫ ms × আকার, যা একটি অনুমান-মডেল, কোনো আসল server-এর মাপ নয়।'),
    analogy: {
      text: 'batching হলো রিকশার বদলে বাস: একসাথে অনেক যাত্রী গেলে প্রতিজনের খরচ কমে। caching হলো প্রায়ই জিজ্ঞেস করা প্রশ্নের উত্তর দোকানের দেয়ালে টাঙিয়ে রাখা।',
      breaks: 'বাস ভরার জন্য দাঁড়িয়ে থাকলে প্রথম যাত্রীর দেরি হয়, ফাঁকা রাস্তায় রিকশাই দ্রুত। আর দেয়ালের নোটিশ পুরনো হলে (চার্জ বদলেছে) বা ভুল দোকানের দেয়ালে টাঙালে ক্ষতিই বেশি।',
    },
    worked:
      p('প্রথম অনুশীলনের চালানো ফল (QuickJS):') +
      table(['প্রার্থী', 'accuracy (৪০টি)', 'p95', 'মাসিক (নমুনা দাম)', 'শর্ত'], [
        ['local-rules', '0.68 ± 0.15', '6 ms', '0', 'মানে ব্যর্থ'],
        ['model-S', '0.83 ± 0.12', '1,445 ms', '630', 'মানে ব্যর্থ (০.৮৫-এর নিচে)'],
        ['model-L', '0.93 ± 0.08', '5,213 ms', '3,150', 'p95-এ ব্যর্থ'],
      ], 'শর্ত: accuracy ≥ ০.৮৫ ও p95 ≤ ৩,০০০ ms') +
      p('<strong>কেউ শর্ত পূরণ করেনি।</strong> এটিও একটি বৈধ ও দরকারি ফল। তিনটি সৎ পথ: (ক) charter-এ ফিরে গিয়ে শর্ত নিয়ে আলোচনা (p95 ৬,০০০ ms কি গ্রহণযোগ্য?), (খ) routing—সহজ প্রশ্ন local-rules-এ, কঠিনগুলো model-L-এ, (গ) suite বড় করা। আরও লক্ষ্য করুন: অন্য seed-এ model-S-এর accuracy ০.৮৩ থেকে ০.৭০ হয়েছে। ৪০টি প্রশ্নের একবারের মাপ দিয়ে ০.৮৩ বনাম ০.৮৫-এর সিদ্ধান্ত নেওয়া যায় না।') +
      p('দ্বিতীয় অনুশীলন—cache (২০০টি সিন্থেটিক অনুরোধ, TTL ৬০, ধাপ ১২০-এ knowledge base ভার্সন ১ → ২):') +
      table(['key', 'hit', 'ভুল দোকানের উত্তর', 'পুরনো ভার্সন'], [
        ['কাঁচা টেক্সট', '156', '80', '3'],
        ['normalized', '184', '67', '1'],
        ['normalized + tenant + ভার্সন', '171', '0', '0'],
      ]) +
      p('সবচেয়ে বেশি hit যে key-তে (normalized), সেটিই ৬৭ বার এক দোকানের উত্তর অন্য দোকানকে দিয়েছে। নিরাপদ key ১৩টি hit কম পায়, কিন্তু একটিও ভুল দেয় না।') +
      p('batching (২০০টি অনুরোধ, p50/p95 ms):') +
      table(['চাপ', 'batch ছাড়া', 'batch ≤ ৮, অপেক্ষা ≤ ৩০ ms'], [
        ['উচ্চ (গড় ব্যবধান ৪০ ms)', '10,378 / 18,896', '328 / 472'],
        ['মাঝারি (১৫০ ms)', '780 / 1,639', '195 / 283'],
        ['কম (৬০০ ms)', '135 / 277', '165 / 253'],
      ]) +
      p('উচ্চ চাপে batch ছাড়া প্রতিটি অনুরোধে ১৩৫ ms লাগে, কিন্তু অনুরোধ আসে গড়ে ৪০ ms পরপর—সারি অসীমভাবে বাড়ে। কম চাপে batching p50-এ ৩০ ms যোগ করে (অপেক্ষা), যদিও মাঝে মাঝে কাছাকাছি আসা অনুরোধে p95 সামান্য কমায়। এগুলো একটি অনুমান-মডেলের সংখ্যা; আসল server-এ নিজে মাপতে হবে।'),
    activity: p('দুটি অনুশীলন: প্রথমটিতে তিনটি সিমুলেটেড প্রার্থী মেপে শর্ত অনুযায়ী বাছাই, দ্বিতীয়টিতে একটি সিন্থেটিক অনুরোধ-লগে তিন ধরনের cache key ও তিন চাপে batching। প্রতিটি সংখ্যা পড়ে নিজের ভাষায় সিদ্ধান্ত লিখুন: কোন প্রার্থী, কোন key, কোন batch নীতি—এবং কেন।'),
    code: [
      {
        label: 'মেপে মডেল বাছাই (সিমুলেটেড প্রার্থী)',
        starter: RNG + String.raw`const gauss = (r) => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
const CASES = Array.from({ length: 40 }, (_, i) => ({ id: i, hard: i % 10 >= 7 }));
// সিমুলেটেড প্রার্থী—আসল কোনো মডেলের নাম, মান বা দাম নয়। দাম: টাকা প্রতি ১০০০ token (নমুনা)
const CANDIDATES = [
  { name: "local-rules", easy: 0.9, hard: 0.3, medianMs: 5, spread: 1.1, priceIn: 0, priceOut: 0 },
  { name: "model-S", easy: 0.95, hard: 0.7, medianMs: 600, spread: 1.6, priceIn: 0.02, priceOut: 0.06 },
  { name: "model-L", easy: 0.98, hard: 0.85, medianMs: 1500, spread: 1.8, priceIn: 0.1, priceOut: 0.3 },
];
const RULE = { minAcc: 0.85, maxP95: 3000 };
const MONTH = { requests: 30000, inTok: 600, outTok: 150 };
function evaluate(c, seed) {
  const r = makeRng(seed), lat = [];
  let ok = 0;
  for (const k of CASES) {
    if (r() < (k.hard ? c.hard : c.easy)) ok++;
    lat.push(c.medianMs * Math.exp(Math.log(c.spread) * gauss(r)));
  }
  lat.sort((a, b) => a - b);
  const acc = ok / CASES.length;
  return { name: c.name, acc, margin: 1.96 * Math.sqrt(acc * (1 - acc) / CASES.length), p95: Math.round(lat[Math.ceil(0.95 * lat.length) - 1]),
    monthly: Math.round(MONTH.requests * (MONTH.inTok * c.priceIn + MONTH.outTok * c.priceOut) / 1000) };
}
const rows = CANDIDATES.map((c, i) => evaluate(c, 11 + i));
const r2 = (v) => Math.round(v * 100) / 100;
for (const x of rows) console.log(x.name + ": accuracy " + r2(x.acc) + " ± " + r2(x.margin) + " | p95 " + x.p95 + " ms | মাসিক " + x.monthly + " টাকা");
const ok = rows.filter((x) => x.acc >= RULE.minAcc && x.p95 <= RULE.maxP95).sort((a, b) => a.monthly - b.monthly);
console.log("শর্ত পূরণ:", ok.map((x) => x.name), "→ বাছাই:", ok.length ? ok[0].name : "কেউ নয়");
const again = CANDIDATES.map((c, i) => evaluate(c, 101 + i));
console.log("অন্য seed-এ আবার মাপলে accuracy:", again.map((x) => x.name + " " + r2(x.acc)).join(", "));
`,
        expect: ['model-S: accuracy 0.83 ± 0.12 | p95 1445 ms | মাসিক 630 টাকা', 'model-L: accuracy 0.93 ± 0.08 | p95 5213 ms | মাসিক 3150 টাকা', 'শর্ত পূরণ: [] → বাছাই: কেউ নয়', 'model-S 0.7'],
        hints: ['RULE.maxP95 ১৫০০ করুন—কে বাদ পড়ে?', 'CASES-এর সংখ্যা ৪০ থেকে ৪০০ করুন: margin কত ছোট হয়? দুই seed-এর accuracy কাছাকাছি আসে কি?', 'routing চেষ্টা করুন: hard প্রশ্ন model-L-এ, বাকি local-rules-এ।'],
        test: '__assert(ok.length===0,"nobody passes (quoted)"); __close(rows[1].acc,0.825,1e-9,"model-S acc"); __assert(rows[2].p95>RULE.maxP95,"model-L fails p95"); __close(again[1].acc,0.7,1e-9,"re-measure differs");',
      },
      {
        label: 'cache key ও batching (সিন্থেটিক লগ, virtual clock)',
        starter: RNG + String.raw`const BN = "০১২৩৪৫৬৭৮৯";
const norm = (q) => q.normalize("NFC").trim().replace(/[০-৯]/g, (d) => String(BN.indexOf(d))).replace(/[?？।!]+$/u, "").replace(/\s+/g, " ").toLowerCase();
const BASE = ["ঢাকায় ডেলিভারি চার্জ কত", "ফেরতের নিয়ম কী", "বিকাশে পেমেন্ট করা যায়", "নীল শাড়ির দাম কত", "৭ দিনে ফেরত দেওয়া যাবে"];
const rand = makeRng(3);
const variant = (q) => { const k = Math.floor(rand() * 4); return k === 0 ? q : k === 1 ? q + "?" : k === 2 ? "  " + q.replace(" ", "  ") : q.replace(/[0-9]/g, (d) => BN[d]).replace("৭", "7") + "।"; };
const LOG = Array.from({ length: 200 }, (_, t) => ({ t, tenant: rand() < 0.7 ? "shopA" : "shopB", q: variant(BASE[Math.min(4, Math.floor(-Math.log(rand() || 1e-9) * 1.2))]) }));
const answer = (tenant, q, version) => tenant + "/v" + version + ":" + norm(q);
function replay(keyFn) {
  const cache = new Map(); let hits = 0, wrong = 0, stale = 0;
  for (const r of LOG) {
    const version = r.t < 120 ? 1 : 2;
    const key = keyFn(r, version), truth = answer(r.tenant, r.q, version);
    const c = cache.get(key);
    if (c && r.t - c.at < 60) { hits++; if (c.val !== truth) { if (c.val.split("/")[0] !== r.tenant) wrong++; else stale++; } }
    else cache.set(key, { val: truth, at: r.t });
  }
  return { hits, wrong, stale };
}
const KEYS = { "কাঁচা টেক্সট": (r) => r.q, "normalized": (r) => norm(r.q), "normalized + tenant + ভার্সন": (r, v) => r.tenant + "|v" + v + "|" + norm(r.q) };
const cacheRes = {};
for (const [name, fn] of Object.entries(KEYS)) { cacheRes[name] = replay(fn); const x = cacheRes[name]; console.log("cache " + name + ": hit " + x.hits + "/200, ভুল দোকানের উত্তর " + x.wrong + ", পুরনো ভার্সন " + x.stale); }

function arrivals(n, meanGap, seed) { const r = makeRng(seed); let t = 0; return Array.from({ length: n }, () => (t += -Math.log(r() || 1e-9) * meanGap)); }
function simulate(arr, maxBatch, waitMs) {
  let t = 0, i = 0; const lat = [];
  while (i < arr.length) {
    const kth = arr[Math.min(i + maxBatch - 1, arr.length - 1)];
    const start = Math.max(t, arr[i], Math.min(arr[i] + waitMs, kth));
    let n = 0; while (n < maxBatch && i + n < arr.length && arr[i + n] <= start) n++;
    const done = start + 120 + 15 * n;
    for (let k = 0; k < n; k++) lat.push(done - arr[i + k]);
    t = done; i += n;
  }
  lat.sort((a, b) => a - b);
  return { p50: Math.round(lat[Math.floor(lat.length / 2)]), p95: Math.round(lat[Math.ceil(0.95 * lat.length) - 1]), total: Math.round(t) };
}
const batchRes = {};
for (const [label, gap] of [["উচ্চ চাপ (গড় ব্যবধান 40 ms)", 40], ["মাঝারি (150 ms)", 150], ["কম চাপ (600 ms)", 600]]) {
  const arr = arrivals(200, gap, 9);
  const a = simulate(arr, 1, 0), b = simulate(arr, 8, 30);
  batchRes[gap] = { a, b };
  console.log(label + " → batch ছাড়া p50/p95 " + a.p50 + "/" + a.p95 + " ms | batch≤8, অপেক্ষা≤30 ms: " + b.p50 + "/" + b.p95 + " ms");
}
`,
        expect: ['cache কাঁচা টেক্সট: hit 156/200, ভুল দোকানের উত্তর 80, পুরনো ভার্সন 3', 'cache normalized: hit 184/200, ভুল দোকানের উত্তর 67, পুরনো ভার্সন 1', 'cache normalized + tenant + ভার্সন: hit 171/200, ভুল দোকানের উত্তর 0, পুরনো ভার্সন 0', 'batch ছাড়া p50/p95 10378/18896 ms | batch≤8, অপেক্ষা≤30 ms: 328/472 ms', 'batch ছাড়া p50/p95 135/277 ms | batch≤8, অপেক্ষা≤30 ms: 165/253 ms'],
        hints: ['“কাঁচা টেক্সট” key-তে hit কম কেন? একই প্রশ্নের ? বা বাড়তি space-যুক্ত রূপগুলো আলাদা key হয়ে যায়।', 'normalized key-তে hit বেশি, কিন্তু “ভুল দোকানের উত্তর” কয়টি? এই সংখ্যাটি শূন্য না হলে key ব্যবহারযোগ্য নয়।', 'কম চাপে batching-এর p50 কেন বাড়ে? প্রতিটি অনুরোধ একা আসে, তবু ৩০ ms অপেক্ষা করে।'],
        test: 'var safe=cacheRes["normalized + tenant + ভার্সন"], loose=cacheRes["normalized"]; __assert(safe.wrong===0&&safe.stale===0,"safe key correct"); __assert(loose.hits>safe.hits&&loose.wrong>0,"highest hit rate is unsafe"); __assert(batchRes[40].b.p95<batchRes[40].a.p95/10,"batching wins under load"); __assert(batchRes[600].b.p50>batchRes[600].a.p50,"batching adds wait at low load");',
      },
    ],
    line: ul([
      '<code>margin = 1.96 √(p(1−p)/n)</code> — accuracy-র মোটামুটি ৯৫% অনিশ্চয়তা (normal approximation; p খুব কাছে ০ বা ১ হলে দুর্বল)।',
      '<code>ok.sort(... monthly)</code> — শর্ত পূরণকারীদের মধ্যে সবচেয়ে সস্তা।',
      '<code>norm(q)</code> — NFC, বাংলা অঙ্ক → ASCII, শেষের যতিচিহ্ন ও বাড়তি space বাদ।',
      '<code>r.tenant + "|v" + v + "|" + norm(r.q)</code> — নিরাপদ cache key।',
      '<code>r.t - c.at &lt; 60</code> — TTL ৬০ “সেকেন্ড” (লগের প্রতিটি ধাপ এক সেকেন্ড ধরা)।',
      '<code>Math.min(arr[i] + waitMs, kth)</code> — batch ভরে গেলে বা অপেক্ষার সময় শেষ হলে চালাও।',
    ]),
    why: p('প্রার্থীগুলো সিমুলেটেড, কারণ এখানে শেখার বিষয় পদ্ধতি—একই suite, লিখিত শর্ত, অনিশ্চয়তা—কোনো নির্দিষ্ট মডেলের নাম বা দাম নয়, যা দ্রুত বদলায়। cache-এর ভুলগুলো গোনা হয়েছে hit-এর পাশে, কারণ hit-rate একা দেখলে সবচেয়ে বিপজ্জনক key-টিকেই সবচেয়ে ভালো মনে হয়।'),
    remember: ['লিখিত শর্ত → একই suite → শর্ত পূরণকারীদের মধ্যে সস্তাটি', 'ছোট suite-এ ±margin বড়', 'cache key-তে normalization + tenant + ভার্সন; ব্যক্তিগত উত্তর cache নয়', 'batching: উচ্চ চাপে লাভ, কম চাপে অপেক্ষার খরচ'],
    skip: ['semantic cache (embedding-ভিত্তিক মিল)', 'continuous batching ও KV-cache-এর বিস্তারিত', 'বাস্তব server-এর benchmark'],
    experiment: p('cache key থেকে শুধু ভার্সন বাদ দিন (tenant রাখুন)। “পুরনো ভার্সন” সংখ্যা কত হয়? TTL ৬০ থেকে ১০ করুন—পুরনো উত্তর কমে, hit-ও কমে। আপনার দোকানে ডেলিভারি চার্জ মাসে একবার বদলালে কোন TTL ও কোন invalidation নীতি বেছে নেবেন, লিখুন।'),
    mistakes: ['একটি suite-এর ছোট পার্থক্যকে আসল ভাবা', 'p95-এর বদলে শুধু গড় latency দেখা', 'cache key-তে tenant না রাখা', 'knowledge-base বদলালে cache না মোছা', 'কম চাপেও বড় batch-অপেক্ষা', 'ব্যক্তিগত তথ্যসহ উত্তর cache করা'],
    solutionNote: p('সব সংখ্যা QuickJS-এ চালানো ফল (উপরের টেবিল)। hint-এর উত্তর: RULE.maxP95 = ১৫০০ হলে model-L আরও দূরে যায়, model-S p95-এ পাস করে (১,৪৪৫) কিন্তু মানে ব্যর্থ—ফল একই, কেউ নয়। CASES ৪০০ করলে margin প্রায় তিন ভাগের এক ভাগ হয় (√১০ গুণ ছোট), এবং দুই seed-এর accuracy একে অপরের কাছে আসে। routing-এর একটি সহজ পরীক্ষা: CASES-এর hard ঘরগুলো model-L-এ, বাকি local-rules-এ পাঠিয়ে মিলিত accuracy, p95 ও খরচ হিসাব করুন। p95 তখনো model-L-এর tail-এর কারণে শর্ত ছাড়াতে পারে—হিসাব করে দেখুন, অনুমান নয়।'),
    quiz: [
      { q: '৪০টি প্রশ্নে model-S ০.৮৮, model-L ০.৯২। সবচেয়ে সৎ মন্তব্য?', a: { a: 'model-L স্পষ্টভাবে ভালো', b: 'এই suite-এর অনিশ্চয়তা (±~০.১) পার্থক্যের চেয়ে বড়; আরও প্রশ্ন বা অন্য প্রমাণ দরকার', c: 'দুটি সমান' }, ok: 'b', why: 'n = ৪০-এ margin প্রায় ±০.০৮–০.১০; ০.০৪ পার্থক্য দৈবতার মধ্যে।' },
      { q: 'multi-tenant সহকারীর cache key-তে অবশ্যই কী থাকবে?', a: { a: 'শুধু প্রশ্নের টেক্সট', b: 'tenant ও knowledge-base ভার্সন, normalized প্রশ্নের সাথে', c: 'ব্যবহারকারীর ফোন নম্বর' }, ok: 'b', why: 'tenant না থাকলে এক দোকানের উত্তর অন্য দোকানে; ভার্সন না থাকলে পুরনো তথ্য।' },
      { q: 'কম চাপে batching-এর অপেক্ষা কী করে?', a: { a: 'latency বাড়ায়, throughput-এ লাভ সামান্য', b: 'সবসময় latency কমায়', c: 'কিছুই বদলায় না' }, ok: 'a', why: 'অনুরোধ একা আসে; batch ভরে না, শুধু অপেক্ষার সময় যোগ হয়।' },
    ],
    recap: ['মেপে বাছাই, অনিশ্চয়তাসহ', 'নিরাপদ cache key ও TTL', 'batching-এর লেনদেন চাপের উপর নির্ভর করে'],
    nextNote: 'পরের পাঠ: observability, privacy, reliability ও multi-tenant স্থাপত্য:',
    synthetic: true,
    sources: [SRC.sre, SRC.awsBackoff, ['Google SRE Book: Handling Overload', 'https://sre.google/sre-book/handling-overload/'], SRC.sklearnEval],
  },
  {
    id: 'les-14-03-eng-observability-privacy-reliability',
    slug: 'engineering-observability-privacy-reliability',
    title: 'Engineering ২: observability, privacy, reliability ও multi-tenant',
    minutes: 55,
    prereqs: ['les-14-02-eng-selection-caching-batching', 'les-12-05-regression-monitoring'],
    summary: 'trace id-সহ structured log, allowlist ও redaction; circuit breaker ও fallback; SLO ও error budget; প্রতিটি query-তে বাধ্যতামূলক tenant scope, tenant-ভিত্তিক rate limit ও ব্যবহার-হিসাব; গ্রাহকের ডেটা মুছে ফেলার অনুরোধ যাচাই।',
    overview: p('demo আর production-এর পার্থক্য হলো খারাপ দিনে কী হয়। upstream সার্ভিস বন্ধ থাকলে প্রতিটি অনুরোধ কি ৩০ সেকেন্ড অপেক্ষা করে ব্যর্থ হয়? log-এ কি গ্রাহকের ফোন নম্বর জমছে? এক দোকানের অতিরিক্ত চাপে কি অন্য দোকানের সহকারীও বসে যায়? এই পাঠে প্রতিটি প্রশ্নের জন্য একটি ছোট, পরীক্ষাযোগ্য কৌশল।') + note(PRACTICE),
    objectives: ['allowlist ও redaction-সহ structured log লিখতে পারবেন', 'circuit breaker ও fallback দিয়ে upstream ব্যর্থতা সামলাতে এবং error budget হিসাব করতে পারবেন', 'tenant scope বাধ্যতামূলক এমন data access ও tenant-ভিত্তিক সীমা নকশা করতে পারবেন'],
    problem: p('রাত ২টায় সহকারী ভুল উত্তর দিচ্ছে। log-এ শুধু “error” লেখা—কোন অনুরোধ, কোন মডেল, কত সময়, কোন দোকান, কিছুই নেই। আর যে log আছে, তাতে গ্রাহকের পুরো বার্তা, ফোন নম্বরসহ। দুটিই ব্যর্থতা: প্রথমটি observability-র, দ্বিতীয়টি privacy-র।'),
    explain:
      p('<strong>structured log:</strong> প্রতিটি অনুরোধের জন্য একটি JSON ঘটনা: সময়, trace id (একটি অনুরোধের সব ধাপ জোড়া লাগাতে), tenant, route, মডেল/ভার্সন, ms, status, token, cache hit, ত্রুটির ধরন। <em>allowlist</em>: শুধু নির্দিষ্ট ক্ষেত্র log হবে; বাকিগুলো (গ্রাহকের বার্তা, ঠিকানা) বাদ, এবং কোনগুলো বাদ গেল তা গুনে রাখা। string ক্ষেত্রে redaction (অধ্যায় ১০)। ফলে debug করা যায়, অথচ ব্যক্তিগত তথ্য জমে না।') +
      p('<strong>circuit breaker:</strong> upstream পরপর কয়েকবার ব্যর্থ হলে “খোলা” অবস্থায় যান—কিছুক্ষণ সরাসরি fallback দিন (যেমন “এখন উত্তর দিতে পারছি না, একটু পরে চেষ্টা করুন” বা নিয়ম-ভিত্তিক উত্তর), upstream-কে না ডেকে। অপেক্ষার পরে একটি পরীক্ষামূলক ডাক (half-open); সফল হলে আবার “বন্ধ”। এতে upstream-এর উপর চাপ কমে, ব্যবহারকারী দ্রুত উত্তর পান।') +
      p('<strong>SLO ও error budget:</strong> SLO হলো লক্ষ্য, যেমন “মাসে ৯৯% অনুরোধ সফল”। ১,০০,০০০ অনুরোধে বাজেট ১,০০০টি ব্যর্থতা। বাজেট দ্রুত ফুরালে নতুন feature-এর বদলে নির্ভরযোগ্যতায় মন দিন—Google SRE-এর এই ধারণা।') +
      p('<strong>multi-tenant:</strong> প্রতিটি data access ফাংশন tenant ছাড়া চলবেই না (ত্রুটি), আর ফল সবসময় সেই tenant-এ সীমিত (অধ্যায় ১১-এর pre-filter)। tenant-ভিত্তিক rate limit (token bucket, অধ্যায় ১০) একজনের চাপ থেকে অন্যদের রক্ষা করে; tenant-ভিত্তিক token হিসাব খরচ ভাগ করতে দেয়। গ্রাহক নিজের ডেটা মুছতে চাইলে মুছে <em>যাচাই</em> করুন যে কিছু রয়ে যায়নি।') +
      warn('এই পাঠের redaction নিয়মগুলো উদাহরণ, সম্পূর্ণ নয়—বাংলা অঙ্কে লেখা ফোন নম্বর, ছবি বা ঠিকানা এগুলো ধরে না। বাস্তবে প্রথম প্রতিরক্ষা হলো allowlist: যা দরকার নেই তা log-ই করবেন না।'),
    analogy: {
      text: 'circuit breaker হলো বাড়ির বিদ্যুতের ফিউজ: কোথাও সমস্যা হলে লাইন কেটে দেয় যাতে পুরো বাড়ি না পোড়ে; কিছুক্ষণ পরে আবার চালু করে দেখা হয়।',
      breaks: 'ফিউজ শুধু কাটে; সফটওয়্যারের breaker কাটার সময় বিকল্প উত্তর (fallback) দেয়, আর নিজে নিজে আবার পরীক্ষা করে। ভুল threshold দিলে ছোট সমস্যাতেও বারবার “ফিউজ” কাটতে পারে।',
    },
    worked:
      p('প্রথম অনুশীলনের চালানো ফল (QuickJS)। log লাইনে <code>message</code> ও <code>address</code> নেই (allowlist), আর <code>error</code> string-এ ফোন, ইমেইল ও key মুছে গেছে।') +
      p('upstream ২,০০০–৬,০০০ ms বন্ধ; প্রতি ২৫০ ms-এ একটি অনুরোধ (মোট ৩৭টি)। “.” সফল, “x” upstream-এ গিয়ে ব্যর্থ, “f” upstream না ডেকে fallback:') +
      out('breaker ছাড়া: ........xxxxxxxxxxxxxxxx.............\nbreaker-সহ:   ........xxxfffffxfffffxfffff.........') +
      ul([
        'breaker ছাড়া ১৬টি ব্যর্থ upstream ডাক; breaker-সহ ৫টি (৩টি খোলার আগে, ২টি half-open পরীক্ষা), আর ১৫টি দ্রুত fallback।',
        'মোট upstream ডাক ৩৭ → ২২: বিভ্রাটের সময় ব্যর্থ সার্ভিসের উপর চাপ কম।',
        '<strong>খরচও আছে:</strong> upstream ৬,০০০ ms-এ সেরে উঠলেও breaker ৭,০০০ পর্যন্ত খোলা ছিল—৪টি অনুরোধ অকারণে fallback পেয়েছে। coolMs যত বড়, এই দেরি তত বেশি।',
        'error budget: ১,০০০-এর ৬৪০ খরচ (৬৪%) মাত্র ১২ দিনে → burn rate ১.৬০; এই গতিতে মাসের ১৯তম দিনের কাছাকাছি বাজেট শেষ।',
      ]) +
      p('দ্বিতীয় অনুশীলন: shopA-র খোঁজে শুধু shopA-র নথি; tenant ছাড়া query ত্রুটি দেয়। shopA সেকেন্ডে ২০টি অনুরোধ পাঠিয়ে ৬০-এর মধ্যে ১০টি পায়, কিন্তু shopB-র ৩টির সবগুলোই পরিবেশিত—একজনের চাপ অন্যকে বসিয়ে দেয়নি। c-11-এর মোছার অনুরোধ shopA-তে ২টি সারি মোছে; shopB-র সারি থাকে, কারণ সেটি অন্য দোকানের সাথে আলাদা সম্পর্ক।'),
    activity: p('দুটি অনুশীলন: প্রথমটিতে log, circuit breaker ও error budget; দ্বিতীয়টিতে tenant-scope-যুক্ত store, tenant-ভিত্তিক rate limit এবং ডেটা মোছার যাচাই। প্রতিটি assertion একটি নিরাপত্তা বা নির্ভরযোগ্যতার দাবি—কোনটি ভাঙলে কী ক্ষতি, লিখুন।'),
    code: [
      {
        label: 'structured log, circuit breaker ও error budget',
        starter: String.raw`const REDACT = [[/(?:\+?88)?01[3-9]\d{8}/g, "[ফোন]"], [/[\w.+-]+@[\w-]+\.[\w.]+/g, "[ইমেইল]"], [/sk-[A-Za-z0-9]{8,}/g, "[key]"]];
const ALLOWED = ["ts", "trace", "tenant", "route", "model", "ms", "status", "tokens_in", "tokens_out", "cache", "error"];
function logEvent(e) {
  const out = {}, dropped = [];
  for (const [k, v] of Object.entries(e)) {
    if (!ALLOWED.includes(k)) { dropped.push(k); continue; }
    out[k] = typeof v === "string" ? REDACT.reduce((s, [re, rep]) => s.replace(re, rep), v) : v;
  }
  return { line: JSON.stringify(out), dropped };
}
const ev = logEvent({ ts: 1000, trace: "t-7f3a", tenant: "shopA", route: "rag", model: "sim-S@2", ms: 842, status: "error",
  error: "upstream 503 for user 01712345678 (a@b.com) key sk-ABCDEF123456", message: "আমার নম্বর 01712345678, ঠিকানা মিরপুর ১০", address: "মিরপুর ১০" });
console.log(ev.line);
console.log("বাদ পড়া ক্ষেত্র:", ev.dropped);

class Breaker {
  constructor(threshold, coolMs) { this.threshold = threshold; this.coolMs = coolMs; this.state = "closed"; this.fails = 0; this.openedAt = 0; }
  call(now, upstream) {
    if (this.state === "open") {
      if (now - this.openedAt < this.coolMs) return { ok: false, via: "fallback" };
      this.state = "half-open";
    }
    const r = upstream(now);
    if (r.ok) { this.state = "closed"; this.fails = 0; return { ok: true, via: "upstream" }; }
    this.fails++;
    if (this.state === "half-open" || this.fails >= this.threshold) { this.state = "open"; this.openedAt = now; }
    return { ok: false, via: "upstream-error" };
  }
}
const upstream = (now) => ({ ok: !(now >= 2000 && now < 6000) });
function runTimeline(useBreaker) {
  const b = new Breaker(3, 1500); let calls = 0, fallback = 0, errors = 0, ok = 0; const marks = [];
  for (let t = 0; t <= 9000; t += 250) {
    const r = useBreaker ? b.call(t, (n) => { calls++; return upstream(n); }) : (calls++, upstream(t).ok ? { ok: true, via: "upstream" } : { ok: false, via: "upstream-error" });
    if (r.ok) ok++; else if (r.via === "fallback") fallback++; else errors++;
    marks.push(r.ok ? "." : r.via === "fallback" ? "f" : "x");
  }
  return { calls, ok, fallback, errors, marks: marks.join("") };
}
const noB = runTimeline(false), withB = runTimeline(true);
console.log("breaker ছাড়া: upstream ডাক " + noB.calls + ", ব্যর্থ ডাক " + noB.errors + " | " + noB.marks);
console.log("breaker-সহ:   upstream ডাক " + withB.calls + ", ব্যর্থ ডাক " + withB.errors + ", fallback " + withB.fallback + " | " + withB.marks);

const SLO = 0.99, monthRequests = 100000, failedSoFar = 640, dayOfMonth = 12;
const budget = Math.round(monthRequests * (1 - SLO));
const burn = (failedSoFar / budget) / (dayOfMonth / 30);
console.log("error budget " + budget + ", খরচ " + failedSoFar + " (" + Math.round(100 * failedSoFar / budget) + "%), burn rate " + burn.toFixed(2) + " (১-এর বেশি মানে মাস শেষের আগেই ফুরাবে)");
`,
        expect: ['"error":"upstream 503 for user [ফোন] ([ইমেইল]) key [key]"', 'বাদ পড়া ক্ষেত্র: ["message","address"]', 'breaker ছাড়া: upstream ডাক 37, ব্যর্থ ডাক 16', 'breaker-সহ:   upstream ডাক 22, ব্যর্থ ডাক 5, fallback 15 | ........xxxfffffxfffffxfffff.........', 'burn rate 1.60'],
        hints: ['message ও address log-এ কেন নেই? ALLOWED-এ নেই—redaction-এর উপর নির্ভর না করে আগেই বাদ।', 'timeline-এ x মানে upstream-এ গিয়ে ব্যর্থ, f মানে upstream না ডেকেই দ্রুত fallback।', 'threshold ৩ থেকে ১ করুন: breaker কতবার খোলে? সুস্থ সময়ে একটি ব্যর্থতাতেই খুললে কী সমস্যা?'],
        test: '__assert(ev.line.indexOf("01712345678")<0&&ev.line.indexOf("sk-")<0&&ev.line.indexOf("মিরপুর")<0,"no PII or secret in log"); __assert(withB.errors<noB.errors&&withB.calls<noB.calls,"breaker reduces upstream load"); __assert(withB.marks.slice(24,28)==="ffff","fallback continues after recovery (quoted cost)"); __close(burn,1.6,1e-9,"burn rate");',
      },
      {
        label: 'tenant scope, tenant-ভিত্তিক সীমা ও ডেটা মোছা',
        starter: String.raw`function makeStore() {
  const rows = [], usage = {};
  return {
    insert(tenant, row) { if (!tenant) throw new Error("tenant ছাড়া লেখা নিষেধ"); rows.push({ ...row, tenant }); },
    scoped(tenant) {
      if (!tenant) throw new Error("tenant ছাড়া কোনো query নয়");
      return {
        search: (word) => rows.filter((r) => r.tenant === tenant && r.text.includes(word)).map((r) => r.id),
        meter: (tokens) => { usage[tenant] = (usage[tenant] || 0) + tokens; },
        deleteCustomer: (cust) => { let n = 0; for (let i = rows.length - 1; i >= 0; i--) if (rows[i].tenant === tenant && rows[i].customer === cust) { rows.splice(i, 1); n++; } return n; },
        countCustomer: (cust) => rows.filter((r) => r.tenant === tenant && r.customer === cust).length,
      };
    },
    usage: () => ({ ...usage }),
    total: () => rows.length,
  };
}
const store = makeStore();
store.insert("shopA", { id: "A-doc-1", text: "ঢাকায় ডেলিভারি চার্জ ৭০ টাকা" });
store.insert("shopB", { id: "B-doc-1", text: "ঢাকায় ডেলিভারি চার্জ ৬০ টাকা" });
store.insert("shopA", { id: "A-chat-1", text: "ডেলিভারি কবে আসবে", customer: "c-11" });
store.insert("shopA", { id: "A-chat-2", text: "ফেরত দিতে চাই", customer: "c-11" });
store.insert("shopB", { id: "B-chat-1", text: "ডেলিভারি চার্জ কত", customer: "c-11" });

const A = store.scoped("shopA"), B = store.scoped("shopB");
console.log("shopA 'ডেলিভারি':", A.search("ডেলিভারি"), "| shopB 'ডেলিভারি':", B.search("ডেলিভারি"));
let blocked = "";
try { store.scoped("").search("ডেলিভারি"); } catch (e) { blocked = e.message; }
console.log("tenant ছাড়া:", blocked);

function makeLimiter(capacity, perSec) { const b = {}; return (tenant, now) => { const s = b[tenant] || (b[tenant] = { tokens: capacity, at: now }); s.tokens = Math.min(capacity, s.tokens + (now - s.at) * perSec / 1000); s.at = now; if (s.tokens >= 1) { s.tokens -= 1; return true; } return false; }; }
const allow = makeLimiter(5, 2);
const served = { shopA: 0, shopB: 0 }, refused = { shopA: 0, shopB: 0 };
for (let t = 0; t < 3000; t += 50) { if (allow("shopA", t)) served.shopA++; else refused.shopA++; }
for (let t = 0; t < 3000; t += 1000) { if (allow("shopB", t)) served.shopB++; else refused.shopB++; }
console.log("rate limit (৫ ধারণক্ষমতা, ২/সেকেন্ড) → shopA পরিবেশিত " + served.shopA + ", ফেরানো " + refused.shopA + " | shopB পরিবেশিত " + served.shopB + ", ফেরানো " + refused.shopB);
A.meter(1200); A.meter(800); B.meter(300);
console.log("tenant-ভিত্তিক token:", store.usage());

const removed = A.deleteCustomer("c-11");
console.log("shopA থেকে c-11-এর " + removed + "টি সারি মোছা; shopA-তে বাকি " + A.countCustomer("c-11") + ", shopB-তে (অন্য দোকানের সম্পর্ক) " + B.countCustomer("c-11") + ", মোট সারি " + store.total());
`,
        expect: ['shopA \'ডেলিভারি\': ["A-doc-1","A-chat-1"] | shopB \'ডেলিভারি\': ["B-doc-1","B-chat-1"]', 'tenant ছাড়া: tenant ছাড়া কোনো query নয়', 'shopA পরিবেশিত 10, ফেরানো 50 | shopB পরিবেশিত 3, ফেরানো 0', 'tenant-ভিত্তিক token: {"shopA":2000,"shopB":300}', 'shopA থেকে c-11-এর 2টি সারি মোছা; shopA-তে বাকি 0'],
        hints: ['shopB-তে c-11-এর সারি কেন মোছা হলো না? অনুরোধটি shopA-র কাছে এসেছিল; shopB-র সাথে গ্রাহকের সম্পর্ক আলাদা—তাকে আলাদা অনুরোধ করতে হবে।', 'limiter-এ tenant-এর আলাদা bucket না থাকলে shopA-র চাপে shopB-ও ফেরত পেত। একটি shared bucket দিয়ে চেষ্টা করুন।'],
        test: '__assert(A.search("ডেলিভারি").every(function(id){return id.indexOf("A-")===0;}),"no cross-tenant read"); __assert(blocked.length>0,"tenant required"); __assert(refused.shopB===0,"noisy neighbour isolated"); __assert(A.countCustomer("c-11")===0,"deletion verified"); __assert(B.countCustomer("c-11")===1,"other tenant untouched");',
      },
    ],
    line: ul([
      '<code>ALLOWED.includes(k)</code> — allowlist; অজানা ক্ষেত্র বাদ এবং গুনে রাখা।',
      '<code>REDACT.reduce(...)</code> — allowlist-এ থাকা string-এও ফোন, ইমেইল, key মুছে দেওয়া।',
      '<code>this.state === "half-open"</code> — অপেক্ষার পরে একটি পরীক্ষামূলক ডাক; ব্যর্থ হলে আবার খোলা।',
      '<code>burn = (খরচ ÷ বাজেট) ÷ (দিন ÷ ৩০)</code> — ১ মানে ঠিক মাস শেষে বাজেট ফুরাবে।',
      '<code>scoped(tenant)</code> — tenant ছাড়া query-র কোনো পথই নেই।',
      '<code>makeLimiter</code> — প্রতি tenant-এর আলাদা token bucket।',
    ]),
    why: p('প্রতিটি কৌশল এমনভাবে লেখা যাতে assertion দিয়ে যাচাই করা যায়: log-এ ফোন নম্বর নেই, tenant ছাড়া query ত্রুটি দেয়, মোছার পরে কিছু থাকে না। “আমরা privacy নিয়ে সচেতন” কোনো দাবি নয়; “এই test পাস করে” একটি দাবি। breaker-এর timeline অক্ষরে দেখানো হয়েছে যাতে কোন মুহূর্তে কী হলো এক নজরে বোঝা যায়।'),
    remember: ['structured log: trace, tenant, route, model, ms, status', 'allowlist আগে, redaction পরে', 'circuit breaker: closed → open → half-open', 'SLO, error budget ও burn rate', 'tenant scope বাধ্যতামূলক; tenant-ভিত্তিক limit ও হিসাব', 'মোছার পরে যাচাই'],
    skip: ['OpenTelemetry-র পূর্ণ মান', 'distributed tracing-এর span-গঠন', 'আইনি privacy কাঠামোর বিস্তারিত'],
    experiment: p('Breaker-এর <code>coolMs</code> ১৫০০ থেকে ৫০০ ও ৪০০০ করুন। কোনটিতে upstream সেরে ওঠার পরেও বেশিক্ষণ fallback চলে? কোনটিতে বিভ্রাটের সময় বেশি upstream ডাক যায়? দুটির মাঝামাঝি একটি মান বেছে নিন এবং কারণ লিখুন।'),
    mistakes: ['পুরো গ্রাহক-বার্তা log করা', 'শুধু redaction-এর উপর ভরসা, allowlist নেই', 'timeout ও breaker ছাড়া upstream ডাকা', 'সব tenant-এর একটি shared rate limit', 'tenant ঐচ্ছিক রাখা (“পরে ফিল্টার করব”)', 'মোছার অনুরোধের পরে যাচাই না করা'],
    solutionNote: p('সব সংখ্যা QuickJS-এ চালানো ফল। threshold ১ করলে বিভ্রাটের প্রথম ব্যর্থতাতেই breaker খোলে; এই timeline-এ তা ভালো দেখায়, কিন্তু সুস্থ সময়ে একটি দৈব ব্যর্থতাতেও ১.৫ সেকেন্ড সবাই fallback পাবে—তাই threshold বাস্তব ব্যর্থতার হার দেখে ঠিক করুন। Experiment-এর প্রত্যাশা: coolMs ছোট হলে half-open পরীক্ষা বেশি হয় (বিভ্রাটে বেশি upstream ডাক), কিন্তু সেরে ওঠার পরে দেরি কম; বড় হলে উল্টো। shared rate-limit bucket-এ shopA-র ধারাবাহিক চাপ টোকেন ফুরিয়ে রাখে, ফলে shopB-র অনুরোধও ফেরত যায়—চালিয়ে নিশ্চিত করুন।'),
    quiz: [
      { q: 'log-এ ব্যক্তিগত তথ্য ঠেকানোর প্রথম প্রতিরক্ষা:', a: { a: 'regex redaction', b: 'allowlist—দরকারি ক্ষেত্র ছাড়া কিছুই log না করা', c: 'log এনক্রিপ্ট করা' }, ok: 'b', why: 'redaction সব ধরন ধরতে পারে না; যা log হয় না তা ফাঁসও হয় না।' },
      { q: 'circuit breaker “খোলা” অবস্থায় কী করে?', a: { a: 'upstream বারবার ডাকে', b: 'upstream না ডেকে দ্রুত fallback দেয়, কিছুক্ষণ পরে পরীক্ষামূলক ডাক', c: 'সার্ভার বন্ধ করে' }, ok: 'b', why: 'এতে ব্যর্থ upstream-এর উপর চাপ কমে এবং ব্যবহারকারী দ্রুত উত্তর পান।' },
      { q: 'SLO ৯৯%, ১,০০,০০০ অনুরোধ, মাসের ১২ দিনে ৬৪০ ব্যর্থতা। burn rate ১-এর বেশি মানে:', a: { a: 'বাজেট মাস শেষের আগেই ফুরাবে', b: 'সব ঠিক আছে', c: 'SLO বাড়ানো উচিত' }, ok: 'a', why: 'এই গতিতে খরচ চললে মাসের বাজেট আগেই শেষ; নির্ভরযোগ্যতায় মন দিন।' },
    ],
    recap: ['structured log + allowlist + redaction', 'circuit breaker, fallback, error budget', 'tenant scope, tenant-ভিত্তিক limit ও হিসাব, যাচাইকৃত মোছা'],
    nextNote: 'Engineering ট্র্যাকের ক্যাপস্টোন A:',
    synthetic: true,
    sources: [SRC.sre, ['Google SRE Workbook: Implementing SLOs', 'https://sre.google/workbook/implementing-slos/'], ['Martin Fowler: CircuitBreaker', 'https://martinfowler.com/bliki/CircuitBreaker.html'], SRC.owaspLLM],
  },
  {
    id: 'les-14-04-capstone-a-knowledge-assistant',
    slug: 'capstone-a-bengali-knowledge-assistant',
    title: 'ক্যাপস্টোন A: বাংলা knowledge assistant',
    minutes: 120,
    prereqs: ['les-14-03-eng-observability-privacy-reliability', 'les-11-07-project-product-assistant'],
    summary: 'শুরুর কোড: tenant pre-filter-সহ retrieval, উৎস-উদ্ধৃতি, schema-যাচাইকৃত structured tool, বিরত থাকার threshold, এবং baseline-সহ evaluation suite—টিউন করা ও held-out দুই ভাগে। মানদণ্ড, চারটি checkpoint ও রিপোর্টের টেমপ্লেট।',
    overview: p('এই ক্যাপস্টোনে অধ্যায় ১০–১২ ও এই অধ্যায়ের engineering অংশ এক জায়গায়: একটি কাল্পনিক দোকানের বাংলা সহকারী, যে নীতি-নথি থেকে উৎসসহ উত্তর দেয়, ডেলিভারি চার্জ ও অর্ডারের অবস্থা structured tool দিয়ে আনে, না জানলে থামে, আর অন্য দোকানের তথ্য কখনো দেখায় না। শুরুর কোডটি সম্পূর্ণ চলে এবং নিজের evaluation suite-এ নিজেকে মাপে। আপনার কাজ এটিকে বাড়ানো, ভাঙা, মাপা এবং সৎ রিপোর্ট লেখা।') + note(PRACTICE + ' শুরুর কোডের উত্তর extractive—নথির বাক্যই উত্তর। LLM যোগ করলে প্রতিটি মাপ আবার চালাতে হবে।'),
    objectives: ['retrieval, citation, structured tool ও বিরত থাকা একসাথে একটি সহকারীতে যুক্ত করতে পারবেন', 'baseline ও held-out ভাগসহ evaluation suite দিয়ে সহকারী মাপতে পারবেন', 'মানদণ্ড ও টেমপ্লেট অনুযায়ী একটি সৎ engineering রিপোর্ট লিখতে পারবেন'],
    problem: p('নিজের লেখা ১৩টি প্রশ্নে সহকারী ১৩/১৩ পেল। খুশি হওয়ার আগে প্রশ্ন: প্রশ্নগুলো কি সহকারী বানানোর সময় দেখে দেখে লেখা? তাহলে এটি পরীক্ষা নয়, অনুশীলনের উত্তরপত্র। সত্যিকারের মাপ হলো এমন প্রশ্নে, যা বানানোর সময় দেখা হয়নি।'),
    explain:
      p('<strong>শুরুর কোডের অংশ:</strong>') +
      ol([
        '<strong>ডেটা:</strong> ৫টি সিন্থেটিক নথি (shopA-র ৪টি, shopB-র ১টি), tenant-ভিত্তিক config (ডেলিভারি চার্জ), একটি অর্ডার।',
        '<strong>retrieval:</strong> বাক্য-স্তরের chunk; শব্দের শুরুর মিল দিয়ে বাংলা বিভক্তি সামলানো (“ফেরতের” ↔ “ফেরত”); idf-ভারযুক্ত স্কোর ০–১; <em>pre-filter</em>: শুধু নিজের tenant-এর বাক্য।',
        '<strong>structured tool:</strong> <code>delivery_charge</code> ও <code>order_status</code>; প্রতিটি আর্গুমেন্ট schema দিয়ে যাচাই; অর্ডার অন্য গ্রাহকের হলে “পাওয়া যায়নি” (অস্তিত্বও ফাঁস হয় না)।',
        '<strong>routing:</strong> অর্ডার নম্বর থাকলে order_status; “ডেলিভারি” + “চার্জ/খরচ” থাকলে delivery_charge (এলাকা না বললে প্রশ্ন ফেরত); না হলে retrieval; স্কোর &lt; ০.৪৫ হলে বিরত।',
        '<strong>evaluation:</strong> প্রতিটি কেসে route, তথ্য, উদ্ধৃতি (উদ্ধৃত নথিতে উত্তরটি আছে কিনা), বানানো সংখ্যা (উত্তরের সংখ্যা উৎসে বা প্রশ্নে আছে কিনা), tenant ফাঁস। baseline: একই সহকারী retrieval ছাড়া।',
      ]) +
      p('<strong>মানদণ্ড (পাস করতে সবগুলো):</strong>') +
      table(['মাপ', 'লক্ষ্য'], [
        ['held-out ভাগসহ মোট suite', 'কমপক্ষে ৩০টি কেস, এর ১০টি held-out (বানানোর পরে লেখা, অন্য কারো লেখা হলে ভালো)'],
        ['held-out-এ সঠিক', 'charter-এ আগে লেখা লক্ষ্য; রিপোর্টে টিউন করা ও held-out আলাদা'],
        ['বানানো সংখ্যা', '০'],
        ['tenant ফাঁস', '০ (shopB-র তথ্য shopA-র উত্তরে কখনো নয়)'],
        ['ভুয়া উদ্ধৃতি', '০ (উদ্ধৃত নথিতে উত্তরটি থাকতে হবে)'],
        ['অজানা প্রশ্ন', 'বিরত থাকা বা প্রশ্ন ফেরত—বানানো উত্তর নয়'],
        ['log', 'অধ্যায় ১৪.৩-এর allowlist; গ্রাহকের বার্তা বা ফোন নয়'],
      ], 'ক্যাপস্টোন A-এর মানদণ্ড') +
      p('<strong>checkpoint:</strong> (১) charter + শুরুর কোড চালিয়ে baseline সংখ্যা; (২) নিজের ১০টি নতুন নথি ও ২০টি টিউন-কেস, সব মাপ চলছে; (৩) অন্য কাউকে দিয়ে ১০টি held-out প্রশ্ন লিখিয়ে একবার মাপা—<em>এরপর</em> উন্নতি, এবং উন্নতির পরে নতুন held-out; (৪) রিপোর্ট।') +
      p('<strong>রিপোর্টের টেমপ্লেট:</strong>') +
      ol([
        'সারাংশ (৩ বাক্য): কী বানালেন, মূল সংখ্যা, প্রধান সীমা।',
        'ব্যবহারকারী ও পরিধি: কে, কী প্রশ্ন, কী বাইরে।',
        'স্থাপত্য: একটি চিত্র বা তালিকা—retrieval, tool, routing, বিরত থাকা, log।',
        'evaluation: suite কীভাবে বানানো, টিউন ও held-out ভাগ, baseline; ফলের টেবিল।',
        'ব্যর্থতা-বিশ্লেষণ: প্রতিটি ভুলের ধরন (routing, retrieval, threshold, ডেটা নেই) ও উদাহরণ।',
        'নির্ভরযোগ্যতা ও privacy: কী পরীক্ষা পাস করে (tenant, log, মোছা)।',
        'খরচ ও latency (যদি আসল মডেল যোগ করেন—মাপা সংখ্যা, অনুমান নয়)।',
        'সীমা ও পরবর্তী কাজ।',
      ]),
    analogy: {
      text: 'টিউন করা suite হলো বাড়িতে বানানো মডেল টেস্ট; held-out হলো বোর্ড পরীক্ষা—প্রশ্ন আপনি আগে দেখেননি।',
      breaks: 'বোর্ড পরীক্ষা একবারই হয়; এখানে held-out একবার ব্যবহার করে উন্নতি করলে সেটিও “দেখা” হয়ে যায়। তাই প্রতিবার বড় উন্নতির পরে নতুন held-out প্রশ্ন লাগে।',
    },
    worked:
      p('শুরুর কোডের চালানো ফল (QuickJS):') +
      table(['', 'টিউন করা (১৩)', 'held-out (৫)', 'বানানো সংখ্যা', 'tenant ফাঁস', 'ভুলভাবে বিরত'], [
        ['baseline (retrieval ছাড়া)', '7', '1', '0', '0', '10'],
        ['সহকারী (retrieval-সহ)', '13', '3', '0', '0', '2'],
      ], 'টিউন করা suite ও held-out আলাদা') +
      ul([
        'retrieval-এর মূল্য: টিউন করা ৭ → ১৩, held-out ১ → ৩। baseline কিছু বানায় না, কিন্তু ১০টি প্রশ্নে অকারণে থামে।',
        'টিউন করা ১৩/১৩ প্রত্যাশিত—প্রশ্নগুলো দেখে কোড লেখা। আসল খবর held-out-এ: <strong>৩/৫</strong>।',
        'ব্যর্থতা ১ (routing): “ঢাকার বাইরে পাঠাতে কত খরচ?”—“ডেলিভারি” শব্দ নেই, তাই tool-এ যায়নি; retrieval-এও যথেষ্ট মিল নেই → বিরত।',
        'ব্যর্থতা ২ (threshold): “ধোয়ার পর ফেরত দেওয়া যাবে?”—সঠিক বাক্যটি খুঁজে পায়, কিন্তু “পর”, “যাবে”-র মতো মেলেনি এমন শব্দের ভারে স্কোর ০.৪৫-এর নিচে।',
        'দুটি ব্যর্থতাই বিরত থাকা, ভুল তথ্য নয়; বানানো সংখ্যা ও ফাঁস শূন্য। ৫টি held-out কেস দিয়ে “৬০%” বলা যায় না—সংখ্যা খুবই কম; মানদণ্ডে তাই কমপক্ষে ১০টি।',
      ]),
    activity: p('শুরুর কোড চালান এবং ✗ চিহ্নিত দুটি held-out কেস দেখুন। তারপর checkpoint ১ থেকে শুরু করুন। প্রথম উন্নতি হিসেবে routing-এর ফাঁকটি ঠিক করুন—কিন্তু তার আগে নিজের আরও ৫টি এমন প্রশ্ন লিখুন যেখানে মানুষ “ডেলিভারি” শব্দ ব্যবহার না করে খরচ জিজ্ঞেস করে। শুধু একটি কেস পাস করানোর জন্য একটি শব্দ যোগ করা উন্নতি নয়।'),
    code: [
      {
        label: 'ক্যাপস্টোন A: শুরুর কোড ও evaluation suite',
        starter: String.raw`const DOCS = [
  { id: "policy-delivery", tenant: "shopA", text: "ঢাকার ভেতরে ডেলিভারি সাধারণত ২ থেকে ৩ দিনে পৌঁছায়। ঢাকার বাইরে ৩ থেকে ৫ দিন লাগে।" },
  { id: "policy-return", tenant: "shopA", text: "পণ্য হাতে পাওয়ার ৭ দিনের মধ্যে ফেরত দেওয়া যায়। ব্যবহৃত বা ধোয়া পণ্য ফেরত নেওয়া হয় না। ফেরতের টাকা ৩ কর্মদিবসে বিকাশে পাঠানো হয়।" },
  { id: "faq-payment", tenant: "shopA", text: "ক্যাশ অন ডেলিভারি ও বিকাশে পেমেন্ট করা যায়। কার্ডে পেমেন্ট এখন চালু নেই।" },
  { id: "faq-size", tenant: "shopA", text: "কুর্তি তিন সাইজে পাওয়া যায়: S, M, L। মাপের চার্ট পণ্যের পাতায় আছে।" },
  { id: "shopB-delivery", tenant: "shopB", text: "ঢাকার ভেতরে ডেলিভারি চার্জ ৬০ টাকা। কার্ডে পেমেন্ট করা যায়।" },
];
const CONFIG = { shopA: { delivery: { inside: 70, outside: 130 } }, shopB: { delivery: { inside: 60, outside: 120 } } }; // নমুনা চার্জ
const ORDERS = { "WG-10234": { tenant: "shopA", customer: "c-1", status: "পাঠানো হয়েছে" } };

const STOP = new Set(["কি", "কী", "কত", "আছে", "করা", "যায়", "জানতে", "চাই", "আমি", "আমার", "এর", "কোন", "কবে", "কয়", "নেবেন", "কোথায়", "হয়", "ও", "বা"]);
const words = (t) => (t.normalize("NFC").toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) || []).filter((w) => !STOP.has(w));
function similar(a, b) { const x = [...a], y = [...b]; let k = 0; while (k < x.length && k < y.length && x[k] === y[k]) k++; return k >= 2 && k >= Math.min(x.length, y.length) - 1; }
const SENTS = DOCS.flatMap((d) => d.text.split(/(?<=[।?!])\s*/u).filter(Boolean).map((s) => ({ doc: d.id, tenant: d.tenant, text: s, w: words(s) })));
function retrieve(tenant, q) {
  const pool = SENTS.filter((s) => s.tenant === tenant);
  const qw = [...new Set(words(q))];
  const idf = (w) => Math.log((pool.length + 1) / (pool.filter((s) => s.w.some((x) => similar(w, x))).length + 0.5));
  const weights = qw.map((w) => ({ w, idf: idf(w) }));
  const total = weights.reduce((s, x) => s + x.idf, 0) || 1;
  return pool.map((s) => ({ ...s, score: weights.filter((x) => s.w.some((y) => similar(x.w, y))).reduce((a, x) => a + x.idf, 0) / total })).sort((a, b) => b.score - a.score);
}

const TOOL_SCHEMAS = {
  delivery_charge: { zone: (v) => v === "inside" || v === "outside" },
  order_status: { id: (v) => /^WG-\d{5}$/.test(v), customer: (v) => typeof v === "string" && v.length > 0 },
};
function callTool(tenant, name, args) {
  const schema = TOOL_SCHEMAS[name];
  const bad = Object.keys(schema).filter((k) => !schema[k](args[k]));
  if (bad.length) return { error: "অবৈধ আর্গুমেন্ট: " + bad.join(", ") };
  if (name === "delivery_charge") return { value: CONFIG[tenant].delivery[args.zone], source: "config:" + tenant + ":delivery." + args.zone };
  const o = ORDERS[args.id];
  return o && o.tenant === tenant && o.customer === args.customer ? { value: o.status, source: "orders:" + args.id } : { value: null, source: "orders" };
}
const BN = "০১২৩৪৫৬৭৮৯";
const bn = (n) => String(n).replace(/[0-9]/g, (d) => BN[d]);
const THRESH = 0.45;

function assistant(tenant, customer, q, useRetrieval = true) {
  const id = (q.match(/WG-\d+/) || [])[0];
  if (id) {
    const r = callTool(tenant, "order_status", { id, customer });
    if (r.error) return { type: "error", reply: r.error, cites: [] };
    return r.value ? { type: "tool", reply: "অর্ডার " + id + ": " + r.value, cites: [r.source] } : { type: "tool", reply: "এই নম্বরে আপনার কোনো অর্ডার পাওয়া যায়নি।", cites: [] };
  }
  if (/ডেলিভারি/.test(q) && /চার্জ|খরচ/.test(q)) {
    const zone = /বাইরে/.test(q) ? "outside" : /ঢাকা/.test(q) ? "inside" : null;
    if (!zone) return { type: "ask", reply: "ঢাকার ভেতরে না বাইরে? জানালে চার্জ বলতে পারব।", cites: [] };
    const r = callTool(tenant, "delivery_charge", { zone });
    return { type: "tool", reply: (zone === "inside" ? "ঢাকার ভেতরে" : "ঢাকার বাইরে") + " ডেলিভারি চার্জ " + bn(r.value) + " টাকা।", cites: [r.source] };
  }
  if (useRetrieval) {
    const top = retrieve(tenant, q)[0];
    if (top && top.score >= THRESH) return { type: "answer", reply: top.text, cites: [top.doc], score: top.score };
  }
  return { type: "abstain", reply: "এ বিষয়ে আমার কাছে নিশ্চিত তথ্য নেই; দোকানে সরাসরি জিজ্ঞেস করুন।", cites: [] };
}

const SUITE = [
  { q: "ঢাকার বাইরে ডেলিভারি চার্জ কত?", type: "tool", fact: "১৩০" },
  { q: "ঢাকায় ডেলিভারি চার্জ কত টাকা?", type: "tool", fact: "৭০" },
  { q: "ডেলিভারি চার্জ কত?", type: "ask" },
  { q: "কয় দিনের মধ্যে ফেরত দেওয়া যায়?", type: "answer", fact: "৭ দিনের মধ্যে", cite: "policy-return" },
  { q: "ধোয়া জামা ফেরত নেবেন?", type: "answer", fact: "ধোয়া পণ্য ফেরত নেওয়া হয় না", cite: "policy-return" },
  { q: "কার্ডে পেমেন্ট করা যায়?", type: "answer", fact: "চালু নেই", cite: "faq-payment" },
  { q: "কুর্তির সাইজ কী কী?", type: "answer", fact: "S, M, L", cite: "faq-size" },
  { q: "ফেরতের টাকা কবে পাব?", type: "answer", fact: "৩ কর্মদিবসে", cite: "policy-return" },
  { q: "ঢাকার বাইরে পৌঁছাতে কয় দিন লাগে?", type: "answer", fact: "৩ থেকে ৫ দিন", cite: "policy-delivery" },
  { q: "অর্ডার WG-10234 কোথায়?", customer: "c-1", type: "tool", fact: "পাঠানো হয়েছে" },
  { q: "অর্ডার WG-10234 কোথায়?", customer: "c-9", type: "tool", fact: "পাওয়া যায়নি" },
  { q: "গিফট র‍্যাপ করা যায়?", type: "abstain" },
  { q: "দোকান কি শুক্রবার খোলা?", type: "abstain" },
];
// সহকারী লেখার পরে লেখা প্রশ্ন—এগুলো দেখে কোড বদলানো হয়নি
const HELDOUT = [
  { q: "ক্যাশ অন ডেলিভারি আছে?", type: "answer", fact: "ক্যাশ অন ডেলিভারি", cite: "faq-payment" },
  { q: "বিকাশে টাকা ফেরত দেন?", type: "answer", fact: "বিকাশে পাঠানো হয়", cite: "policy-return" },
  { q: "ঢাকার বাইরে পাঠাতে কত খরচ?", type: "tool", fact: "১৩০" },
  { q: "ধোয়ার পর ফেরত দেওয়া যাবে?", type: "answer", fact: "ফেরত নেওয়া হয় না", cite: "policy-return" },
  { q: "কাল কি আমার অর্ডার পৌঁছাবে?", type: "abstain" },
];
const ALL = SUITE.map((c) => ({ ...c, held: false })).concat(HELDOUT.map((c) => ({ ...c, held: true })));
const nums = (s) => (s.match(/[0-9০-৯]+/g) || []).map((x) => x.replace(/[০-৯]/g, (d) => String(BN.indexOf(d))));
function sourceNumbers(cite) {
  const d = DOCS.find((x) => x.id === cite);
  if (d) return nums(d.text);
  const m = cite.match(/^config:(\w+):delivery\.(\w+)$/);
  return m ? [String(CONFIG[m[1]].delivery[m[2]])] : [];
}
function grade(useRetrieval) {
  const rows = ALL.map((c) => {
    const r = assistant("shopA", c.customer || "c-1", c.q, useRetrieval);
    const typeOk = r.type === c.type;
    const factOk = typeOk && (c.fact ? r.reply.includes(c.fact) : true);
    const citeOk = c.cite ? r.cites.includes(c.cite) && DOCS.find((d) => d.id === c.cite).text.includes(r.reply) : true;
    const allowed = new Set(nums(c.q).concat(r.cites.flatMap(sourceNumbers)));
    const invented = nums(r.reply).filter((n) => !allowed.has(n)).length;
    const leak = DOCS.filter((d) => d.tenant !== "shopA").some((d) => d.text.includes(r.reply)) || /৬০ টাকা|১২০ টাকা/.test(r.reply);
    return { ...c, got: r.type, ok: factOk && citeOk, invented, leak, reply: r.reply, score: r.score };
  });
  const count = (f) => rows.filter(f).length;
  return { rows, tuned: count((x) => !x.held && x.ok), held: count((x) => x.held && x.ok), invented: rows.reduce((s, x) => s + x.invented, 0), leaks: count((x) => x.leak), abstainWrong: count((x) => x.got === "abstain" && x.type !== "abstain") };
}
const base = grade(false), full = grade(true);
for (const x of full.rows) console.log((x.ok ? "✓" : "✗") + (x.held ? " [held-out] " : " ") + x.q + " → [" + x.got + (x.score !== undefined ? " " + x.score.toFixed(2) : "") + "] " + x.reply);
const line = (name, g) => name + ": টিউন করা " + g.tuned + "/" + SUITE.length + " | held-out " + g.held + "/" + HELDOUT.length + " | বানানো সংখ্যা " + g.invented + " | tenant ফাঁস " + g.leaks + " | ভুলভাবে বিরত " + g.abstainWrong;
console.log(line("baseline (retrieval ছাড়া)", base));
console.log(line("সহকারী (retrieval-সহ)", full));
`,
        expect: ['✗ [held-out] ঢাকার বাইরে পাঠাতে কত খরচ? → [abstain]', '✗ [held-out] ধোয়ার পর ফেরত দেওয়া যাবে? → [abstain]', 'baseline (retrieval ছাড়া): টিউন করা 7/13 | held-out 1/5 | বানানো সংখ্যা 0 | tenant ফাঁস 0 | ভুলভাবে বিরত 10', 'সহকারী (retrieval-সহ): টিউন করা 13/13 | held-out 3/5 | বানানো সংখ্যা 0 | tenant ফাঁস 0 | ভুলভাবে বিরত 2'],
        hints: ['✗ কেস দুটির প্রথমটি routing-এর ফাঁক (“ডেলিভারি” শব্দ নেই), দ্বিতীয়টি threshold-এর—retrieve("shopA", "ধোয়ার পর ফেরত দেওয়া যাবে?").slice(0, 2) ছাপিয়ে স্কোর দেখুন।', 'THRESH ০.৩ করুন: held-out কি বাড়ে? “গিফট র‍্যাপ” কি এখনো বিরত থাকে? দুটিই মাপুন।', 'assistant("shopB", "c-1", "কার্ডে পেমেন্ট করা যায়?") চালান—উত্তর shopB-র নথি থেকে আসছে কিনা দেখুন।'],
        test: '__assert(full.invented===0&&full.leaks===0,"no invented numbers, no leaks"); __assert(full.held===3&&base.held===1,"held-out quoted"); __assert(full.rows.filter(function(x){return !x.ok;}).every(function(x){return x.got==="abstain";}),"failures are abstentions"); __assert(assistant("shopA","c-9","অর্ডার WG-10234 কোথায়?").reply.indexOf("পাঠানো")<0,"no other customer order"); var b=assistant("shopB","c-1","কার্ডে পেমেন্ট করা যায়?"); __assert(b.cites[0]==="shopB-delivery","shopB answers from its own doc"); __assert(callTool("shopA","order_status",{id:"WG-1",customer:"c-1"}).error,"schema rejects bad id");',
      },
    ],
    line: ul([
      '<code>similar(a, b)</code> — শব্দের শুরুর মিল: “কুর্তির” ↔ “কুর্তি”, “ঢাকায়” ↔ “ঢাকার”।',
      '<code>SENTS.filter((s) =&gt; s.tenant === tenant)</code> — pre-filter: খোঁজার আগেই অন্য দোকান বাদ।',
      '<code>TOOL_SCHEMAS</code> — tool আর্গুমেন্টের যাচাই; অবৈধ হলে tool চলে না।',
      '<code>o.customer === args.customer</code> — অন্যের অর্ডারের অস্তিত্বও জানানো হয় না।',
      '<code>citeOk</code> — উদ্ধৃত নথিতে উত্তরের বাক্যটি আছে কিনা।',
      '<code>invented</code> — উত্তরের প্রতিটি সংখ্যা প্রশ্নে বা উৎসে থাকতে হবে।',
      '<code>HELDOUT</code> — বানানোর পরে লেখা; আলাদা গোনা।',
    ]),
    why: p('শুরুর কোড ইচ্ছা করে নিখুঁত নয়: held-out-এর দুটি ব্যর্থতা দেখায় routing-এর নিয়ম আর threshold কোথায় ভঙ্গুর। গুরুত্বপূর্ণ হলো ব্যর্থতার <em>ধরন</em>—দুটিই বিরত থাকা, কোনো বানানো তথ্য নয়। দোকানের সহকারীতে “জানি না” ভুল উত্তরের চেয়ে অনেক কম ক্ষতিকর, তাই মানদণ্ডে বানানো সংখ্যা ও ফাঁস শূন্য রাখা হয়েছে, আর সঠিকতার লক্ষ্য charter-এ আপনি নিজে ঠিক করবেন।'),
    remember: ['টিউন করা ও held-out আলাদা রিপোর্ট', 'baseline দিয়ে প্রতিটি অংশের মূল্য দেখানো', 'বানানো সংখ্যা ও tenant ফাঁস শূন্য', 'ভুল বিরত থাকা ও ভুল উত্তর আলাদা গোনা', 'বড় উন্নতির পরে নতুন held-out'],
    skip: ['vector database ও embedding মডেল (অধ্যায় ১১-এর hybrid পদ্ধতি যোগ করতে পারেন)', 'UI বানানো', 'আসল LLM API (চাইলে, মাপসহ)'],
    experiment: p('নিজের ৫টি নথি যোগ করুন (যেমন “গিফট র‍্যাপ ৫০ টাকায় পাওয়া যায়।”)। আগে বিরত থাকা প্রশ্ন এখন কী উত্তর পায়? বানানো সংখ্যার পরীক্ষা কি “৫০”-কে বৈধ ধরে (উৎসে আছে)? তারপর shopB-তে একই প্রশ্ন করে দেখুন shopA-র নতুন নথি সেখানে আসে না।'),
    mistakes: ['নিজের দেখা প্রশ্নে মাপ নিয়ে সাফল্য দাবি', 'held-out দেখে কোড বদলে আবার সেই held-out-এ রিপোর্ট', 'baseline ছাড়া রিপোর্ট', 'উদ্ধৃতি আছে কিনা দেখা, উদ্ধৃতি সঠিক কিনা না দেখা', 'একটি কেস পাস করাতে একটি শব্দ যোগ (overfitting)', 'ভুল বিরত থাকাকে “নিরাপদ” বলে গোনা থেকে বাদ দেওয়া'],
    solutionNote: p('সব সংখ্যা QuickJS-এ চালানো ফল। hint ১: “ধোয়ার পর ফেরত দেওয়া যাবে?”-র সর্বোচ্চ স্কোরের বাক্যটি আসলেই সঠিক নীতি-বাক্য কিনা ছাপিয়ে দেখুন—ঠিক বাক্য কিন্তু কম স্কোর মানে threshold বা STOP তালিকার সমস্যা, ভুল বাক্য মানে retrieval-এর। hint ২: THRESH কমালে কিছু held-out পাস করতে পারে, কিন্তু “গিফট র‍্যাপ”-এর মতো প্রশ্নও অপ্রাসঙ্গিক বাক্যে উত্তর পেতে পারে; দুটি সংখ্যা (held-out সঠিক, ভুলভাবে উত্তর) একসাথে রিপোর্ট করুন। hint ৩: shopB-তে কার্ডের প্রশ্নের উত্তর আসে shopB-র নিজের নথি থেকে (“কার্ডে পেমেন্ট করা যায়।”), shopA-র “চালু নেই” নয়—assertion দিয়ে যাচাই করা।'),
    quiz: [
      { q: 'টিউন করা suite ১৩/১৩, held-out ৩/৫। রিপোর্টে কী লিখবেন?', a: { a: 'মোট ১৬/১৮ = ৮৯%', b: 'দুটি আলাদা: টিউন করা ১৩/১৩, held-out ৩/৫; held-out-ই বাস্তবের কাছাকাছি অনুমান, আর ৫টি কেস খুবই কম', c: 'শুধু ১৩/১৩' }, ok: 'b', why: 'মেশালে টিউন করা অংশ ফলকে ফুলিয়ে দেয়; আর ছোট held-out-এর অনিশ্চয়তাও বলতে হয়।' },
      { q: 'বানানো সংখ্যার পরীক্ষা কী ধরে?', a: { a: 'উত্তরে এমন সংখ্যা যা প্রশ্নে বা উদ্ধৃত উৎসে নেই', b: 'বানান ভুল', c: 'ধীর উত্তর' }, ok: 'a', why: 'দাম বা চার্জের মতো সংখ্যা বানানো দোকানের সহকারীর সবচেয়ে ক্ষতিকর ভুলগুলোর একটি।' },
      { q: 'অন্য গ্রাহকের অর্ডার নম্বর দিলে সহকারী “পাওয়া যায়নি” বলে, “এটি অন্যের অর্ডার” নয়—কেন?', a: { a: 'ভুল', b: 'অন্যের অর্ডারের অস্তিত্ব জানানোও তথ্য ফাঁস', c: 'কোড ছোট রাখতে' }, ok: 'b', why: 'নম্বর অনুমান করে কেউ জানতে পারত কোন অর্ডার আছে; একই উত্তর দিলে তা জানা যায় না।' },
    ],
    recap: ['একটি সম্পূর্ণ, মাপযোগ্য বাংলা সহকারী', 'টিউন করা বনাম held-out, baseline-সহ', 'মানদণ্ড, checkpoint ও রিপোর্টের টেমপ্লেট'],
    nextNote: 'Research ট্র্যাক: পেপার পড়া, নিয়ন্ত্রিত পরীক্ষা, seed ও variance:',
    synthetic: true,
    sources: [SRC.rag, SRC.bm25, SRC.ragas, SRC.owaspLLM, SRC.jsonSchema],
  },
  {
    id: 'les-14-05-research-methods-seeds-variance',
    slug: 'research-methods-seeds-variance',
    title: 'Research: প্রশ্ন, baseline, ablation, seed ও variance',
    minutes: 55,
    prereqs: ['les-14-01-tracks-scope-planning', 'les-13-06-project-circle-pytorch'],
    summary: 'পেপার পড়ার তিন ধাপ; মাপযোগ্য প্রশ্ন ও hypothesis; baseline ও নিয়ন্ত্রিত পরীক্ষা; ablation; একাধিক seed-এ গড়, sd ও জোড়া-তুলনা; sign test; benchmark-এর সীমা; নেতিবাচক ফল ও reproducibility checklist।',
    overview: p('একটি পরীক্ষায় নতুন পদ্ধতি ২% ভালো করল। আবিষ্কার, নাকি দৈবতা? research ট্র্যাকের কেন্দ্রীয় দক্ষতা হলো এই প্রশ্নের উত্তর দেওয়া। এই পাঠে অধ্যায় ৫-এর ছোট নেটওয়ার্কে একটি নিয়ন্ত্রিত পরীক্ষা ৮টি seed-এ চালাব এবং দেখব শুধু এক seed দেখলে কত সহজে উল্টো সিদ্ধান্তে পৌঁছানো যায়।'),
    objectives: ['একটি পেপার তিন ধাপে পড়ে তার দাবি, প্রমাণ ও সীমা আলাদা করতে পারবেন', 'baseline, একটি পরিবর্তন ও স্থির রাখা বিষয়সহ নিয়ন্ত্রিত পরীক্ষা নকশা করতে পারবেন', 'একাধিক seed-এর ফল গড়, sd, জোড়া-পার্থক্য ও sign test দিয়ে রিপোর্ট করতে পারবেন'],
    problem: p('আপনি learning rate ০.৫ থেকে ১.৫ করলেন; seed ৫-এ test accuracy ০.৯২৫ থেকে ০.৯৩৭৫—প্রায় একই। সিদ্ধান্ত: “learning rate-এ কিছু যায় আসে না”? আরেকজন seed ৭-এর baseline (০.৯৩৭৫) আর seed ৬-এর নতুনটা (০.৯২৫) তুলনা করে বললেন “নতুনটা খারাপ”। দুজনেই ভুল—কেন, তা এই পাঠে মাপব।'),
    explain:
      p('<strong>পেপার পড়া (Keshav-এর তিন ধাপ):</strong> (১) ৫–১০ মিনিট: শিরোনাম, সারাংশ, ভূমিকা, শিরোনামগুলো, উপসংহার—দাবিটা কী? (২) এক ঘণ্টা: চিত্র ও টেবিল খুঁটিয়ে—baseline কী, কয়টি seed, error bar আছে কি, কোন ডেটাসেট; (৩) পুনর্গঠন: নিজে কি একই পরীক্ষা নকশা করতে পারতেন? কোন অনুমান বলা নেই? প্রতিটি পেপারের জন্য এক অনুচ্ছেদ লিখুন: দাবি, প্রমাণ, সীমা।') +
      p('<strong>প্রশ্ন ও hypothesis:</strong> প্রশ্ন একটি পরিবর্তন ও একটি মাপ নিয়ে (“lr ১.৫ করলে ২০০ epoch-এ test accuracy বাড়ে কি?”)। hypothesis-এ দিক ও কারণ (“বাড়বে, কারণ ০.৫-এ ২০০ epoch যথেষ্ট নয়”)। আগে লিখে রাখুন—ফল দেখে hypothesis বানানো নয়।') +
      p('<strong>নিয়ন্ত্রিত পরীক্ষা:</strong> baseline ও পরিবর্তনে <em>একটিই</em> জিনিস আলাদা; ডেটা, ভাগ, epoch, স্থাপত্য, মূল্যায়ন একই। <strong>ablation</strong> উল্টো দিক থেকে একই কাজ: একটি সম্পূর্ণ পদ্ধতি থেকে একটি অংশ সরিয়ে দেখা সেটি কতটা অবদান রাখে। ক্যাপস্টোন B-তে দেখবেন একটি পরিবর্তন (context বড় করা) অজান্তে দ্বিতীয় একটিও আনে (parameter সংখ্যা)—তখন সেটিকে আলাদা করার জন্য একটি নিয়ন্ত্রণ-রান লাগে।') +
      p('<strong>seed ও variance:</strong> weight-এর শুরু, ডেটার ক্রম, dropout—সবই seed-নির্ভর। একই পদ্ধতি বিভিন্ন seed-এ ভিন্ন ফল দেয়; এই ছড়ানো (sd) না জেনে পার্থক্য বিচার করা যায় না। একই seed-এ baseline ও পরিবর্তন চালিয়ে <em>জোড়া-পার্থক্য</em> নিন: seed-জনিত অংশ অনেকটা কেটে যায়। ছোট n-এ সহজ ও সৎ পরীক্ষা হলো <strong>sign test</strong>: কোনো প্রভাব না থাকলে প্রতিটি seed-এ কে জিতবে তা মুদ্রা নিক্ষেপ; ৮টির ৮টিতে একদিক জেতার সম্ভাবনা ২ × (১/২)⁸ ≈ ০.০০৮ (দুই দিক মিলিয়ে)।') +
      p('<strong>benchmark-এর সীমা:</strong> ৮০টি test বিন্দুতে প্রতিটি বিন্দু ০.০১২৫ accuracy; ১% পার্থক্য এক বিন্দুরও কম। benchmark নির্দিষ্ট একটি বণ্টন মাপে—বাস্তব ডেটায় ফল ভিন্ন হতে পারে, এবং বহুল ব্যবহৃত benchmark-এ বারবার টিউন করলে তা নিজেই “দেখা” হয়ে যায়।') +
      p('<strong>নেতিবাচক ফল ও reproducibility:</strong> পার্থক্য variance-এর মধ্যে হলে লিখুন “এই সেটআপে প্রভাবের প্রমাণ পাইনি”—এটি বৈধ ফল। reproducibility checklist (Pineau ও সহকর্মীদের ধাঁচে): কোড, ডেটা বা তার উৎস, ঠিক ভার্সন, seed তালিকা, hyperparameter, হার্ডওয়্যার, রানের সংখ্যা, error bar কীভাবে হিসাব, এবং কোন রান বাদ পড়েছে ও কেন।'),
    analogy: {
      text: 'একটি seed-এ তুলনা হলো একদিনের বিক্রি দেখে বলা নতুন সাইনবোর্ড কাজ করছে। হয়তো সেদিন ছিল ঈদের আগের দিন।',
      breaks: 'দোকানে প্রতিদিন আলাদা, একই দিন দুইবার চালানো যায় না; মডেলে একই seed-এ দুটি সংস্করণ চালানো যায়—তাই জোড়া-তুলনা দোকানের চেয়ে অনেক শক্ত প্রমাণ দেয়।',
    },
    worked:
      table(['seed', 'baseline (lr ০.৫)', 'পরিবর্তন (lr ১.৫)', 'পার্থক্য'], [
        ['1', '0.6875', '0.9375', '+0.2500'], ['2', '0.7250', '0.9500', '+0.2250'], ['3', '0.8125', '0.9500', '+0.1375'], ['4', '0.7500', '0.9500', '+0.2000'],
        ['5', '0.9250', '0.9375', '+0.0125'], ['6', '0.6750', '0.9250', '+0.2500'], ['7', '0.9375', '0.9625', '+0.0250'], ['8', '0.6875', '0.9500', '+0.2625'],
      ], 'test accuracy, ৮০টি বিন্দু; QuickJS-এ চালানো') +
      ul([
        'baseline: ০.৭৭৫০ ± ০.১০৬১ (sd)—seed ভেদে ০.৬৭৫০ থেকে ০.৯৩৭৫! পরিবর্তন: ০.৯৪৫৩ ± ০.০১১৫।',
        'জোড়া-পার্থক্য গড় +০.১৭০৩, ৮/৮ seed-এ জয়, sign test p ≈ ০.০০৭৮। এই সেটআপে lr ১.৫ ভালো—শক্ত প্রমাণ।',
        '<strong>শুধু seed ৫ দেখলে:</strong> +০.০১২৫, অর্থাৎ ৮০টির মধ্যে এক বিন্দু—“কোনো পার্থক্য নেই” মনে হতো।',
        '<strong>ভিন্ন seed মেলালে:</strong> baseline seed ৭ (০.৯৩৭৫) বনাম পরিবর্তন seed ৬ (০.৯২৫০)—“পরিবর্তন খারাপ” মনে হতো।',
        'কেন baseline এত ছড়ানো? ২০০ epoch-এ lr ০.৫ অনেক seed-এ এখনো শেখা শেষ করেনি; কোন শুরু থেকে কত দ্রুত, তা seed-নির্ভর। পরিবর্তন সব seed-এ প্রায় শেষ, তাই ছড়ানো কম। সুতরাং দাবিটি “২০০ epoch-এর বাজেটে”—বেশি epoch দিলে পার্থক্য কমতে পারে।',
      ]),
    activity: p('JavaScript পরীক্ষাটি অধ্যায় ৫-এর বৃত্ত-ডেটায় ২→৪→১ নেটওয়ার্ক, ২০০ epoch, ৮টি seed-এ baseline (lr ০.৫) ও পরিবর্তন (lr ১.৫)। ফল দেখে চারটি প্রশ্নের উত্তর লিখুন: গড় ও sd কত? কয়টি seed-এ পরিবর্তন জিতেছে? শুধু seed ৫ দেখলে কী সিদ্ধান্ত হতো? ভিন্ন seed-এর মধ্যে তুলনা করলে কী ভুল হতে পারত?'),
    code: [
      {
        label: 'নিয়ন্ত্রিত পরীক্ষা: ৮টি seed, জোড়া-তুলনা',
        starter: RNG + String.raw`function makeData(seed, n) { const r = makeRng(seed); return Array.from({ length: n }, () => { const x = [r() * 2 - 1, r() * 2 - 1]; return { x, y: x[0] ** 2 + x[1] ** 2 < 0.5 ? 1 : 0 }; }); }
const train = makeData(77, 120), test = makeData(78, 80);
// অধ্যায় ৫-এর ২→H→১ নেটওয়ার্ক; ব্রাউজারের সময়সীমায় চলার জন্য array আগে থেকে বানানো
function trainNet(H, lr, seed, epochs) {
  const r = makeRng(seed), u = () => r() * 2 - 1;
  const W1 = Array.from({ length: H }, () => [u(), u()]), b1 = new Array(H).fill(0), W2 = Array.from({ length: H }, u); let b2 = 0;
  const h = new Array(H);
  const fwd = (x) => { let z = 0; for (let j = 0; j < H; j++) { h[j] = Math.tanh(W1[j][0] * x[0] + W1[j][1] * x[1] + b1[j]); z += h[j] * W2[j]; } return 1 / (1 + Math.exp(-(z + b2))); };
  const gW1 = W1.map(() => [0, 0]), gb1 = new Array(H), gW2 = new Array(H);
  for (let e = 0; e < epochs; e++) {
    for (let j = 0; j < H; j++) { gW1[j][0] = 0; gW1[j][1] = 0; gb1[j] = 0; gW2[j] = 0; }
    let gb2 = 0;
    for (const d of train) {
      const d2 = (fwd(d.x) - d.y) / train.length; gb2 += d2;
      for (let j = 0; j < H; j++) { gW2[j] += d2 * h[j]; const d1 = d2 * W2[j] * (1 - h[j] * h[j]); gb1[j] += d1; gW1[j][0] += d1 * d.x[0]; gW1[j][1] += d1 * d.x[1]; }
    }
    for (let j = 0; j < H; j++) { W2[j] -= lr * gW2[j]; b1[j] -= lr * gb1[j]; W1[j][0] -= lr * gW1[j][0]; W1[j][1] -= lr * gW1[j][1]; }
    b2 -= lr * gb2;
  }
  return test.filter((d) => (fwd(d.x) >= 0.5 ? 1 : 0) === d.y).length / test.length;
}
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];
const base = SEEDS.map((s) => trainNet(4, 0.5, s, 200));
const mod = SEEDS.map((s) => trainNet(4, 1.5, s, 200));
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
const f = (v) => v.toFixed(4);
SEEDS.forEach((s, i) => console.log("seed " + s + ": baseline " + f(base[i]) + " | lr 1.5 " + f(mod[i]) + " | পার্থক্য " + (mod[i] - base[i] >= 0 ? "+" : "") + f(mod[i] - base[i])));
const diffs = mod.map((m, i) => m - base[i]);
const wins = diffs.filter((d) => d > 0).length, ties = diffs.filter((d) => d === 0).length;
let tail = 0; const n = SEEDS.length - ties, k = Math.max(wins, n - wins);
for (let j = k; j <= n; j++) { let c = 1; for (let t = 0; t < j; t++) c = c * (n - t) / (t + 1); tail += c / 2 ** n; }
console.log("baseline গড় " + f(mean(base)) + " ± " + f(sd(base)) + " (sd) | lr 1.5 গড় " + f(mean(mod)) + " ± " + f(sd(mod)));
console.log("জোড়া-পার্থক্য গড় " + f(mean(diffs)) + " ± " + f(sd(diffs)) + " | জয় " + wins + "/" + SEEDS.length + " | sign test p (দুই দিক) ≈ " + Math.min(1, 2 * tail).toFixed(4));
console.log("baseline-এর পরিসর: " + f(Math.min(...base)) + "–" + f(Math.max(...base)) + " | test-এর এক বিন্দু = " + f(1 / test.length));
`,
        timeoutMs: 8000,
        expect: ['seed 5: baseline 0.9250 | lr 1.5 0.9375 | পার্থক্য +0.0125', 'baseline গড় 0.7750 ± 0.1061 (sd) | lr 1.5 গড় 0.9453 ± 0.0115', 'জোড়া-পার্থক্য গড় 0.1703 ± 0.1015 | জয় 8/8 | sign test p (দুই দিক) ≈ 0.0078'],
        hints: ['মোট পরিসর দেখুন: baseline-এর সবচেয়ে ভালো seed কি পরিবর্তনের সবচেয়ে খারাপ seed-কে হারায়?', 'SEEDS-কে [5] করুন: কী সিদ্ধান্ত হতো?', 'একটি নেতিবাচক-ফলের পরীক্ষা চালান: H = 4 বনাম H = 5, দুটিই lr 1.5। sign test কী বলে?', 'এই পরীক্ষা ভারী (১৬টি training); ধীর ফোনে কয়েক সেকেন্ড লাগতে পারে।'],
        test: '__assert(wins===8,"8/8"); __close(2*tail,0.0078125,1e-12,"sign test"); __close(mod[4]-base[4],0.0125,1e-9,"seed 5 nearly tied"); __assert(base[6]>mod[5],"cross-seed comparison misleads (quoted)"); __assert(sd(base)>5*sd(mod),"baseline more spread");',
      },
    ],
    line: ul([
      '<code>makeData(77, 120)</code>, <code>makeData(78, 80)</code> — ডেটা সব রানে একই; শুধু weight-এর seed বদলায়।',
      '<code>trainNet(4, 0.5, s, 200)</code> বনাম <code>trainNet(4, 1.5, s, 200)</code> — একটিই পার্থক্য: lr।',
      '<code>diffs = mod − base</code> একই seed-এ — জোড়া-তুলনা।',
      'sign test: n টি মুদ্রা-নিক্ষেপে k বা তার বেশি একদিকে পড়ার সম্ভাবনা, দুই দিক মিলিয়ে।',
      '<code>sd</code>-তে n − 1 দিয়ে ভাগ — নমুনার sd।',
    ]),
    why: p('এই পরীক্ষায় প্রভাবটি আসলেই বড়, তাই পদ্ধতি “ঠিক উত্তর” দেয় কিনা দেখা সহজ। তবু এক seed-এ সিদ্ধান্ত নিলে ভুল হতে পারত—সেটিই শেখার বিষয়। sign test বেছে নেওয়া হয়েছে কারণ এর অনুমান কম এবং হাতে হিসাব করা যায়; বড় পরীক্ষায় bootstrap confidence interval বা paired t-test-ও ব্যবহৃত হয়।'),
    remember: ['প্রশ্ন ও hypothesis আগে লিখুন', 'একটিই পরিবর্তন; বাকি সব স্থির', 'অনেক seed, জোড়া-তুলনা, গড় ± sd', 'test সেটের রেজোলিউশন (এক বিন্দু = কত)', 'নেতিবাচক ফলও রিপোর্ট', 'reproducibility checklist'],
    skip: ['multiple-comparison correction-এর বিস্তারিত', 'Bayesian পদ্ধতি', 'বড় মডেলের compute-বাজেট পরিকল্পনা'],
    experiment: p('hint ৩-এর নেতিবাচক-ফল পরীক্ষাটি চালান এবং এক অনুচ্ছেদে রিপোর্ট লিখুন: প্রশ্ন, সেটআপ, ফল (গড় ± sd, জয়, p), সিদ্ধান্ত। ফল যদি “প্রমাণ নেই” হয়, তা কীভাবে লিখবেন যাতে পাঠক না ভাবেন “H-এ কিছু যায় আসে না”? (ইঙ্গিত: এই ডেটা, এই epoch, এই lr-এ।)'),
    mistakes: ['এক seed-এ সিদ্ধান্ত', 'ভিন্ন seed-এর baseline ও পরিবর্তন তুলনা', 'ফল দেখে hypothesis লেখা', 'একসাথে কয়েকটি জিনিস বদলানো', 'error bar ছাড়া টেবিল', 'খারাপ seed বাদ দিয়ে গড়', 'নেতিবাচক ফল লুকানো'],
    solutionNote: p('উপরের সব সংখ্যা QuickJS-এ চালানো ফল। hint ১-এর উত্তর: হ্যাঁ—baseline-এর সেরা seed (০.৯৩৭৫) পরিবর্তনের সবচেয়ে খারাপ seed-কে (০.৯২৫০) হারায়, তাই অজোড়া দুটি একক রান দিয়ে উল্টো সিদ্ধান্ত সম্ভব। H = ৪ বনাম ৫ পরীক্ষার ফল এখানে আগে থেকে লেখা হয়নি—আপনি চালিয়ে যা পান, তা-ই রিপোর্ট করুন। জয় ৫/৮ বা ৬/৮ হলে sign test p যথাক্রমে প্রায় ০.৭৩ ও ০.২৯ (দুই দিক)—“প্রমাণ পাইনি”। reproducibility checklist-এ এই পাঠের জন্য: ডেটা seed ৭৭/৭৮, weight seed ১–৮, H, lr, epoch, full-batch, QuickJS-এর ফল; কোনো রান বাদ দেওয়া হয়নি।'),
    quiz: [
      { q: '৮টি seed-এ ৮টিতেই পরিবর্তন জিতেছে। sign test-এর p ≈ ০.০০৮ মানে:', a: { a: 'পরিবর্তনটি ৯৯.২% ভালো', b: 'কোনো প্রভাব না থাকলে এমন একপেশে ফল দৈবভাবে আসার সম্ভাবনা প্রায় ০.৮%', c: 'পরীক্ষা ভুল' }, ok: 'b', why: 'p-value প্রভাবের আকার নয়; “প্রভাব নেই” ধরে নিলে এমন বা আরও চরম ফলের সম্ভাবনা।' },
      { q: 'ablation কী?', a: { a: 'নতুন অংশ যোগ করা', b: 'একটি পূর্ণ পদ্ধতি থেকে একটি অংশ সরিয়ে তার অবদান মাপা', c: 'ডেটা মুছে ফেলা' }, ok: 'b', why: 'অংশটি সরালে ফল না বদলালে সেটি এই সেটআপে দরকারি নয়।' },
      { q: 'পার্থক্য seed-জনিত ছড়ানোর মধ্যে। সৎ রিপোর্ট:', a: { a: '“পরিবর্তন কাজ করে না”', b: '“এই সেটআপে প্রভাবের প্রমাণ পাইনি”, সাথে সেটআপ ও সংখ্যা', c: 'রিপোর্ট না করা' }, ok: 'b', why: 'প্রমাণের অনুপস্থিতি অনুপস্থিতির প্রমাণ নয়; সেটআপের সীমা বলুন।' },
    ],
    recap: ['পেপার পড়া: দাবি, প্রমাণ, সীমা', 'নিয়ন্ত্রিত পরীক্ষা ও ablation', 'seed, sd, জোড়া-তুলনা, sign test', 'নেতিবাচক ফল ও reproducibility'],
    nextNote: 'Research ট্র্যাকের ক্যাপস্টোন B:',
    synthetic: true,
    sources: [SRC.keshav, SRC.pineau, SRC.heilmeier, ['Henderson et al. (2018) Deep Reinforcement Learning that Matters (seed ও variance)', 'https://arxiv.org/abs/1709.06560'], SRC.sklearnEval],
  },
  {
    id: 'les-14-06-capstone-b-reproducible-experiment',
    slug: 'capstone-b-reproducible-small-model-experiment',
    title: 'ক্যাপস্টোন B: পুনরুৎপাদনযোগ্য ছোট-মডেল পরীক্ষা',
    minutes: 120,
    prereqs: ['les-14-05-research-methods-seeds-variance', 'les-13-07-project-char-lm'],
    summary: 'শুরুর Python স্ক্রিপ্ট: অধ্যায় ১৩-এর character-level মডেলে baseline (context ৩) বনাম একটি নিয়ন্ত্রিত পরিবর্তন (context ৫), ৩টি seed, এবং parameter-সমান একটি নিয়ন্ত্রণ-রান; চালানো ফল; মানদণ্ড, checkpoint, রিপোর্টের টেমপ্লেট; কোর্সের সমাপ্তি।',
    overview: p('এই ক্যাপস্টোনে আপনি একটি ছোট কিন্তু সম্পূর্ণ গবেষণা-চক্র চালাবেন: প্রশ্ন, hypothesis, baseline, একটি পরিবর্তন, একাধিক seed, ফলের অনিশ্চয়তা, একটি গোপন confound খুঁজে বের করা, এবং একটি সৎ রিপোর্ট। শুরুর স্ক্রিপ্টটি একটি উদাহরণ-প্রশ্নে পুরো চক্রটি একবার করে দেখায়—লেখকের কম্পিউটারে চালানো ফলসহ। আপনার ক্যাপস্টোনের প্রশ্ন হবে নিজের।'),
    objectives: ['baseline ও একটি নিয়ন্ত্রিত পরিবর্তন নিয়ে একাধিক seed-এ পরীক্ষা চালাতে পারবেন', 'একটি confound (যেমন parameter সংখ্যা) চিহ্নিত করে নিয়ন্ত্রণ-রান দিয়ে আলাদা করতে পারবেন', 'টেমপ্লেট অনুযায়ী পুনরুৎপাদনযোগ্য, সীমাসহ গবেষণা-রিপোর্ট লিখতে পারবেন'],
    problem: p('context ৩ থেকে ৫ করলে val loss কমল। কিন্তু context বাড়ালে প্রথম layer-এর ইনপুটও বড় হয়, ফলে parameter ১১,৩৪৭ থেকে ১৫,৪৪৩। উন্নতি কি বেশি context দেখার জন্য, নাকি শুধু বড় মডেলের জন্য? এই প্রশ্নের উত্তর না দিলে “context সাহায্য করে” দাবিটি অসম্পূর্ণ।'),
    explain:
      p('<strong>উদাহরণ-প্রশ্ন:</strong> “অধ্যায় ১৩-এর সিন্থেটিক কর্পাসে context ৩ থেকে ৫ অক্ষর করলে val cross-entropy কমে কি, এবং নমুনায় train বাক্যের হুবহু কপি বাড়ে কি?” hypothesis: loss কমবে, কারণ টেমপ্লেটের অনেক শব্দ ৩ অক্ষরের চেয়ে লম্বা; কপিও বাড়তে পারে, কারণ বেশি context পুরো বাক্য মনে রাখা সহজ করে।') +
      p('<strong>স্থির রাখা:</strong> ডেটা, train/val ভাগ (data seed ০), ১৫০০ step, batch ৬৪, Adam lr ০.০০৩, hidden ১২৮, নমুনা ২০টি। <strong>বদলানো:</strong> শুধু CTX। <strong>নিয়ন্ত্রণ-রান:</strong> CTX ৫ কিন্তু embedding ১৬ → ১০, যাতে parameter (১১,৩৯৩) প্রায় baseline-এর (১১,৩৪৭) সমান।') +
      p('<strong>মানদণ্ড (ক্যাপস্টোন B পাস করতে):</strong>') +
      table(['বিষয়', 'প্রত্যাশা'], [
        ['প্রশ্ন ও hypothesis', 'পরীক্ষার আগে লেখা ও তারিখসহ (git commit বা নোট)'],
        ['পরিবর্তন', 'একটিই; বাকি সব স্থির রাখা বিষয়ের তালিকা'],
        ['seed', 'কমপক্ষে ৩টি, প্রতিটির ফল আলাদা টেবিলে; গড় ± sd; জোড়া-পার্থক্য'],
        ['confound', 'অন্তত একটি সম্ভাব্য confound চিহ্নিত ও একটি নিয়ন্ত্রণ-রান বা কারণসহ ব্যাখ্যা'],
        ['পুনরুৎপাদন', 'একটি কমান্ডে সব রান; ভার্সন, হার্ডওয়্যার, সময় লেখা; অন্য কেউ চালিয়ে মেলাতে পারেন'],
        ['নেতিবাচক ফল', 'প্রভাব না পেলে তা-ই রিপোর্ট; লক্ষ্য বা মাপ বদলানো নয়'],
        ['সীমা', 'ডেটা সিন্থেটিক ও ছোট—এটি সাধারণ ভাষার উপর কোনো দাবি নয়'],
      ], 'ক্যাপস্টোন B-এর মানদণ্ড') +
      p('<strong>checkpoint:</strong> (১) প্রশ্ন, hypothesis ও baseline-এর একটি রান; (২) সব রান একটি কমান্ডে, ৩ seed; (৩) confound খোঁজা ও নিয়ন্ত্রণ-রান; (৪) রিপোর্ট ও অন্য কারো দিয়ে পুনরুৎপাদন।') +
      p('<strong>রিপোর্টের টেমপ্লেট:</strong>') +
      ol([
        'শিরোনাম ও এক অনুচ্ছেদের সারাংশ (প্রশ্ন, মূল সংখ্যা ± অনিশ্চয়তা, সিদ্ধান্ত, প্রধান সীমা)।',
        'প্রশ্ন ও hypothesis (কবে লেখা)।',
        'সেটআপ: ডেটা (সিন্থেটিক কিনা), ভাগ, মডেল, স্থির ও বদলানো বিষয়, seed, ভার্সন, হার্ডওয়্যার।',
        'ফল: প্রতি-seed টেবিল, গড় ± sd, জোড়া-পার্থক্য; একটি চিত্র ঐচ্ছিক।',
        'নিয়ন্ত্রণ ও ablation: কোন confound, কোন রান, কী পাওয়া গেল।',
        'আলোচনা: hypothesis সমর্থিত কিনা, বিকল্প ব্যাখ্যা।',
        'সীমা ও নেতিবাচক ফল।',
        'পুনরুৎপাদনের নির্দেশনা: ঠিক কমান্ড ও প্রত্যাশিত আউটপুট।',
      ]),
    analogy: {
      text: 'নিয়ন্ত্রণ-রান হলো রান্নায় “লবণ বেশি দিলে স্বাদ ভালো?” পরীক্ষায় খেয়াল করা যে বেশি লবণের হাঁড়িতে পানিও কম ছিল—তাই আরেকটি হাঁড়ি, একই পানি, বেশি লবণ।',
      breaks: 'রান্নায় পার্থক্যটা প্রায়ই চোখে পড়ে; মডেলে confound লুকিয়ে থাকে (parameter সংখ্যা, training সময়, ডেটার ক্রম), কোড পড়ে খুঁজে বের করতে হয়। আর একটি নিয়ন্ত্রণ সব confound দূর করে না।',
    },
    worked:
      table(['রান', 'parameter', 'val loss (seed ০/১/২)', 'গড় ± sd', 'train-কপি গড়'], [
        ['baseline CTX=3', '11,347', '0.335 / 0.331 / 0.325', '0.330 ± 0.005', '0.07'],
        ['পরিবর্তন CTX=5', '15,443', '0.287 / 0.285 / 0.283', '0.285 ± 0.002', '0.30'],
        ['নিয়ন্ত্রণ CTX=5, emb=10', '11,393', '0.292 / 0.292 / 0.287', '0.291 ± 0.003', '0.32'],
      ], 'শুরুর স্ক্রিপ্টের চালানো ফল (৩ seed)') +
      ul([
        'জোড়া-পার্থক্য (CTX5 − baseline): −০.০৪৮, −০.০৪৬, −০.০৪২—তিনটিই একদিকে, এবং sd-র (~০.০০৫) প্রায় দশ গুণ।',
        'parameter-সমান নিয়ন্ত্রণেও −০.০৪৩, −০.০৩৮, −০.০৩৮: উন্নতির বেশিরভাগ (০.০৪৫-এর মধ্যে ~০.০৪) context থেকে, parameter থেকে নয়। বাকি ~০.০০৬ পার্থক্য এই ৩ seed-এ নিশ্চিতভাবে আলাদা করা যায় না।',
        '<strong>লেনদেন:</strong> train-কপি ০.০৭ থেকে ~০.৩০—বেশি context-এ মডেল নমুনায় train বাক্য বেশি হুবহু ফেরত দেয়। কম loss এখানে আংশিকভাবে বেশি মুখস্থ।',
        '<strong>সীমা:</strong> ৩টি seed কম (sign test-এ ৩/৩ জয়ের p = ০.২৫, যা একা দুর্বল প্রমাণ; এখানে শক্তি আসে পার্থক্যের আকার ও sd-র অনুপাত থেকে)। ডেটা ৭০টি টেমপ্লেট-বাক্য; কপির হার মাত্র ২০টি নমুনায়।',
      ]),
    activity: p('(১) Python স্ক্রিপ্টটি নিজের কম্পিউটারে চালিয়ে টেবিলের সাথে মেলান এবং পার্থক্য থাকলে ভার্সন লিখুন। (২) JavaScript সঙ্গী দিয়ে গড়, sd, জোড়া-পার্থক্য ও parameter সংখ্যা হাতে যাচাই করুন। (৩) নিজের প্রশ্ন বেছে নিন—কয়েকটি ধারণা: dropout যোগ করলে কপির হার কমে কি? embedding ১৬ বনাম ৩২? training step দ্বিগুণ? কর্পাসে টেমপ্লেট ১০টি করলে? (৪) মানদণ্ড ও টেমপ্লেট অনুযায়ী রিপোর্ট।'),
    code: [
      py('01_capstone_b_starter.py', 'ক্যাপস্টোন B: শুরুর Python স্ক্রিপ্ট'),
      {
        label: 'JavaScript সঙ্গী: Python ফলের পরিসংখ্যান যাচাই',
        starter: String.raw`// Python রানের val loss (উপরের আউটপুট থেকে কপি করা)
const RUNS = {
  base: [0.335, 0.331, 0.325],
  ctx5: [0.287, 0.285, 0.283],
  ctx5small: [0.292, 0.292, 0.287],
};
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
const f3 = (v) => v.toFixed(3);
for (const [k, v] of Object.entries(RUNS)) console.log(k + ": গড় " + f3(mean(v)) + " ± " + f3(sd(v)));
const paired = (a, b) => b.map((x, i) => Math.round((x - a[i]) * 1000) / 1000);
console.log("জোড়া-পার্থক্য ctx5 − base:", paired(RUNS.base, RUNS.ctx5), "| ctx5small − base:", paired(RUNS.base, RUNS.ctx5small));
const V = 35, H = 128;
const params = (ctx, emb) => V * emb + (ctx * emb * H + H) + (H * V + V);
console.log("parameter: CTX3/emb16 =", params(3, 16), "| CTX5/emb16 =", params(5, 16), "| CTX5/emb10 =", params(5, 10));
const effect = mean(RUNS.base) - mean(RUNS.ctx5), fromCtx = mean(RUNS.base) - mean(RUNS.ctx5small);
console.log("মোট উন্নতি " + f3(effect) + ", parameter-সমান নিয়ন্ত্রণে " + f3(fromCtx) + " (" + Math.round(100 * fromCtx / effect) + "%)");
console.log("sign test, ৩/৩ জয়: p (দুই দিক) =", 2 * 0.5 ** 3);
`,
        expect: ['base: গড় 0.330 ± 0.005', 'ctx5: গড় 0.285 ± 0.002', 'ctx5small: গড় 0.290 ± 0.003', 'parameter: CTX3/emb16 = 11347 | CTX5/emb16 = 15443 | CTX5/emb10 = 11393', 'sign test, ৩/৩ জয়: p (দুই দিক) = 0.25'],
        hints: ['ctx5small-এর গড় এখানে 0.290, Python-এ 0.291—কেন? Python পূর্ণ দশমিক থেকে গড় করেছে, আমরা তিন ঘরে গোল করা মান থেকে। রিপোর্টে কোনটি লিখবেন?', 'params সূত্রটি Python-এর parameter সংখ্যার সাথে মেলে কিনা দেখুন—না মিললে মডেলের গঠন বোঝায় ভুল আছে।'],
        test: '__assert(params(3,16)===11347&&params(5,16)===15443&&params(5,10)===11393,"param formula matches python"); __assert(paired(RUNS.base,RUNS.ctx5).every(function(d){return d<0;}),"all seeds improve"); __assert(fromCtx/effect>0.8,"most of effect from context");',
      },
    ],
    line: ul([
      '<code>random.Random(0).shuffle(sentences)</code> — train/val ভাগ সব রানে একই।',
      '<code>torch.manual_seed(seed)</code> — শুধু মডেলের শুরু ও batch-ক্রম seed-এ বদলায়।',
      '<code>RUNS</code> — baseline, পরিবর্তন ও নিয়ন্ত্রণ; প্রতিটি একই seed তালিকায়।',
      '<code>copies += "".join(out) in train_s</code> — নমুনা train বাক্যের হুবহু কপি কিনা।',
      'JavaScript <code>params(ctx, emb)</code> — embedding + প্রথম Linear + শেষ Linear।',
    ]),
    why: p('শুরুর স্ক্রিপ্টে নিয়ন্ত্রণ-রানটি আগে থেকেই রাখা হয়েছে, কারণ confound খোঁজা নতুন গবেষকের সবচেয়ে বেশি এড়িয়ে যাওয়া ধাপ। ফলটিও ইচ্ছা করে “পরিষ্কার জয়” হিসেবে দেখানো হয়নি: loss কমেছে, কিন্তু মুখস্থ বেড়েছে—দুটিই রিপোর্টে যাবে। আপনার নিজের প্রশ্নে ফল নেতিবাচক এলে সেটিই সমান মূল্যবান।'),
    remember: ['প্রশ্ন ও hypothesis আগে, তারিখসহ', 'একটি পরিবর্তন; confound-এর জন্য নিয়ন্ত্রণ-রান', '≥৩ seed, প্রতি-seed টেবিল, গড় ± sd, জোড়া-পার্থক্য', 'একটি কমান্ডে পুনরুৎপাদন', 'লেনদেন ও সীমা রিপোর্টে'],
    skip: ['বড় মডেল বা GPU', 'hyperparameter search', 'পেপার আকারে প্রকাশ'],
    experiment: p('seed তালিকা [০, ১, ২] থেকে [০, ১, ২, ৩, ৪] করুন (সময় প্রায় দেড় গুণ)। sd ও জোড়া-পার্থক্য কি একই গল্প বলে? sign test-এর p কত হয় যদি ৫/৫ জেতে? তারপর <code>CONFIG["samples"]</code> ২০ থেকে ১০০ করে কপির হার আবার মাপুন—২০টি নমুনার হার কতটা নির্ভরযোগ্য ছিল?'),
    mistakes: ['ফল দেখে প্রশ্ন বদলানো', 'confound না খোঁজা', 'শুধু গড় দেখানো, প্রতি-seed নয়', 'গোল করা সংখ্যা থেকে আবার পরিসংখ্যান করে দশমিক মেলাতে না পারা', 'সিন্থেটিক কর্পাসের ফলকে সাধারণ বাংলা ভাষায় সাধারণীকরণ', 'পুনরুৎপাদনের কমান্ড নিজে একবারও নতুন environment-এ না চালানো'],
    solutionNote: p(`Python ফল লেখকের কম্পিউটারে চালানো (${ENV.python} / PyTorch ${ENV.torch}, CPU)। JavaScript সঙ্গী (QuickJS-এ চালানো) parameter সূত্রটি তিনটি রানেই Python-এর সংখ্যার সাথে হুবহু মেলায় এবং দেখায় parameter-সমান নিয়ন্ত্রণ মোট উন্নতির প্রায় ৮৮% ধরে রাখে (Python-এর জোড়া-পার্থক্যের গড় থেকে হিসাব করলে ০.০৩৯৭ ÷ ০.০৪৫৩ ≈ ৮৭.৬%; পার্থক্য গোল করার কারণে)। ctx5small-এর গড় এখানে ০.২৯০ আর Python-এ ০.২৯১, কারণ Python পূর্ণ দশমিক থেকে গড় করেছে—রিপোর্টে মূল রানের সংখ্যা লিখুন এবং কোথা থেকে গোল করা হয়েছে তা বলুন। <strong>কোর্সের সমাপ্তি:</strong> আপনি যদি এই ক্যাপস্টোন বা A সম্পন্ন করেন, আপনার কাছে আছে একটি চালানো যায় এমন প্রজেক্ট, একটি সৎ রিপোর্ট এবং মাপা-যাচাইয়ের অভ্যাস। এটি বিশেষজ্ঞতার সনদ বা চাকরির নিশ্চয়তা নয়; পরের ধাপ হলো বড় ও বাস্তব ডেটায় একই অভ্যাস, অন্যের পর্যালোচনা, এবং নিয়মিত পেপার পড়া।`),
    quiz: [
      { q: 'context বাড়াতে parameter-ও বেড়েছে। কোন রান “context-এর প্রভাব” আলাদা করে?', a: { a: 'আরও বড় hidden', b: 'context ৫ কিন্তু embedding ছোট করে parameter baseline-এর সমান', c: 'আরও step' }, ok: 'b', why: 'parameter স্থির রেখে শুধু context বদলালে বাকি পার্থক্য context-এর।' },
      { q: 'val loss কমেছে, train-কপি ০.০৭ থেকে ০.৩০। সঠিক ব্যাখ্যা?', a: { a: 'মডেল সব দিক থেকে ভালো', b: 'মডেল val-এ ভালো পূর্বাভাস দেয়, কিন্তু নমুনায় বেশি মুখস্থ—দুটিই রিপোর্টে', c: 'কপির হার অর্থহীন' }, ok: 'b', why: 'একটি মাপের উন্নতি অন্য মাপের অবনতি আড়াল করতে পারে; লেনদেন বলুন।' },
      { q: '৩টি seed-এ ৩টিতেই জয়, sign test p = ০.২৫। তবু ফলকে শক্ত বলা যায় কেন?', a: { a: 'বলা যায় না', b: 'পার্থক্য (~০.০৪৫) seed-ছড়ানোর (~০.০০৫) প্রায় দশ গুণ; তবু আরও seed দিলে দাবি শক্ত হয়', c: 'p ০.০৫-এর কম' }, ok: 'b', why: 'sign test শুধু দিক দেখে, আকার নয়; আকার ও sd-র অনুপাত বাড়তি প্রমাণ, কিন্তু seed বাড়ানোই সৎ পথ।' },
    ],
    recap: ['একটি সম্পূর্ণ, পুনরুৎপাদনযোগ্য পরীক্ষা-চক্র', 'confound ও নিয়ন্ত্রণ-রান', 'লেনদেন ও সীমাসহ রিপোর্ট', 'কোর্স শেষ: ভিত্তি, সনদ নয়'],
    nextNote: '',
    synthetic: true,
    sources: [SRC.pineau, SRC.keshav, SRC.karpathyMakemore, ['Papers with Code: ML Reproducibility Checklist', 'https://github.com/paperswithcode/releasing-research-code'], SRC.torchData],
  },
];

export default { chapter, lessons };

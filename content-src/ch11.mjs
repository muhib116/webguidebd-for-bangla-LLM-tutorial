import { p, ul, ol, code, out, note, warn, table, term, SRC } from './lib.mjs';

const chapter = {
  id: 'ch-11-rag',
  slug: 'retrieval-augmented-generation',
  title: 'Retrieval-Augmented Generation (RAG)',
  order: 11,
  public: false,
  summary: 'নথি, chunking ও metadata; keyword (BM25), vector ও hybrid search; reranking ও context assembly; উৎস-উল্লেখ (citation); জ্ঞান হালনাগাদ; access control ও tenant isolation; retrieval-মূল্যায়ন বনাম উত্তর-মূল্যায়ন।',
  overview: p(
    'অধ্যায় ১০-এর বট দামের প্রশ্নে বলেছিল “যাচাই করে জানাচ্ছি”। RAG-এ আমরা সত্যিই যাচাই করি: প্রশ্ন এলে প্রথমে দোকানের নিজের নথি থেকে প্রাসঙ্গিক অংশ খুঁজে বের করি, তারপর শুধু সেই অংশের ভিত্তিতে উত্তর দিই এবং কোন নথি থেকে এল তা দেখাই। মডেলের “মনে রাখা” জ্ঞানের ওপর ভরসা না করে আপনার হালনাগাদ, অনুমোদিত তথ্যের ওপর ভরসা।',
    'এই অধ্যায়ের সব নথি ও পণ্য একটি কাল্পনিক “নমুনা দোকান”-এর সিন্থেটিক ডেটা। উত্তর-তৈরির অংশ স্থানীয় ও extractive (নথি থেকে বাক্য বেছে নেয়)—কোনো আসল LLM ডাকা হয় না। প্রজেক্ট: বাংলা পণ্য-জ্ঞান সহকারী, যা দাম ও স্টক শুধু কাঠামোবদ্ধ রেকর্ড থেকে নেয়, অনুমতিপ্রাপ্ত তথ্যই খোঁজে, তথ্য না থাকলে স্পষ্ট বলে, এবং উৎস-উল্লেখের সঠিকতাও মাপে।'
  ),
};

// সিন্থেটিক জ্ঞানভান্ডার—কাল্পনিক "নমুনা দোকান"
const KB = String.raw`const DOCS = [
  { id: "policy-delivery", tenant: "shopA", vis: "public", updated: "2026-09-01", title: "ডেলিভারি নীতি",
    text: "ঢাকা শহরের ভেতরে ডেলিভারি ২ থেকে ৩ কর্মদিবসে হয়। ঢাকার বাইরে ডেলিভারি ৩ থেকে ৫ কর্মদিবস লাগে। ডেলিভারি চার্জ ঢাকার ভেতরে ৭০ টাকা এবং ঢাকার বাইরে ১৩০ টাকা। ক্যাশ অন ডেলিভারি সুবিধা আছে।" },
  { id: "policy-return", tenant: "shopA", vis: "public", updated: "2026-09-01", title: "ফেরত নীতি",
    text: "পণ্য হাতে পাওয়ার ৭ দিনের মধ্যে ফেরত বা বদল করা যায়। পণ্য অব্যবহৃত ও ট্যাগসহ থাকতে হবে। ভাঙা বা ত্রুটিপূর্ণ পণ্যের ফেরত খরচ দোকান বহন করে। টাকা ফেরত ৫ কর্মদিবসের মধ্যে বিকাশ বা ব্যাংকে দেওয়া হয়।" },
  { id: "faq-payment", tenant: "shopA", vis: "public", updated: "2026-08-15", title: "পেমেন্ট",
    text: "বিকাশ, নগদ ও ক্যাশ অন ডেলিভারিতে মূল্য পরিশোধ করা যায়। অগ্রিম পেমেন্টে বাড়তি কোনো ছাড় নেই।" },
  { id: "faq-size", tenant: "shopA", vis: "public", updated: "2026-08-15", title: "সাইজ",
    text: "শাড়ি সাধারণত ৬ হাত লম্বা হয়। থ্রি-পিসের সাইজ চার্ট পণ্যের পাতায় দেওয়া আছে। মাপ না মিললে বদল করা যায়।" },
  { id: "prod-saree-blue", tenant: "shopA", vis: "public", updated: "2026-09-10", title: "সুতি শাড়ি (নীল)",
    text: "আরামদায়ক সুতি কাপড়, হাতে বোনা পাড়। হালকা গরম পানিতে হাতে ধোয়া ভালো। রং পাকা, সহজে ওঠে না।" },
  { id: "prod-threepiece", tenant: "shopA", vis: "public", updated: "2026-09-10", title: "লন থ্রি-পিস",
    text: "নরম লন কাপড়, প্রিন্টেড ওড়না। গরমের জন্য উপযোগী। মেশিনে ধোয়া যায়।" },
  { id: "staff-wholesale", tenant: "shopA", vis: "staff", updated: "2026-09-20", title: "অভ্যন্তরীণ: পাইকারি",
    text: "পাইকারি ক্রেতাদের জন্য ২০% ছাড় দেওয়া যায়। শুধু ম্যানেজার অনুমোদন দেবেন।" },
  { id: "shopB-delivery", tenant: "shopB", vis: "public", updated: "2026-09-05", title: "দোকান খ: ডেলিভারি",
    text: "সারা দেশে ডেলিভারি চার্জ ১০০ টাকা। ডেলিভারি ২ কর্মদিবসে।" },
];
`;

const TOK = String.raw`function tokenize(text) { return (text.normalize("NFC").toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) || []); }
function sentences(text) { return text.split(/(?<=[।?!])\s+/).map((s) => s.trim()).filter(Boolean); }
function chunkDoc(doc, maxChars) {
  const out = []; let cur = [];
  for (const s of sentences(doc.text)) {
    if (cur.length && (cur.join(" ") + " " + s).length > maxChars) { out.push(cur.join(" ")); cur = [cur[cur.length - 1]]; }
    cur.push(s);
  }
  if (cur.length) out.push(cur.join(" "));
  return out.map((text, i) => ({ id: doc.id + "#" + (i + 1), doc: doc.id, tenant: doc.tenant, vis: doc.vis, updated: doc.updated, title: doc.title, text }));
}
`;

const SEARCH = String.raw`function buildBM25(chunks, k1, b) {
  k1 = k1 || 1.2; b = b == null ? 0.75 : b;
  const docs = chunks.map((c) => tokenize(c.title + " " + c.text));
  const N = docs.length, avgdl = docs.reduce((s, d) => s + d.length, 0) / N;
  const df = new Map();
  docs.forEach((d) => new Set(d).forEach((t) => df.set(t, (df.get(t) || 0) + 1)));
  return function (query, k) {
    const q = new Set(tokenize(query));
    return docs.map((d, i) => {
      let s = 0;
      for (const t of q) {
        const n = df.get(t); if (!n) continue;
        const tf = d.filter((x) => x === t).length; if (!tf) continue;
        s += Math.log(1 + (N - n + 0.5) / (n + 0.5)) * (tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * d.length) / avgdl));
      }
      return { id: chunks[i].id, score: s };
    }).filter((x) => x.score > 0).sort((x, y) => y.score - x.score || (x.id < y.id ? -1 : 1)).slice(0, k || 3);
  };
}
function trigrams(text) {
  const m = new Map();
  for (const w of tokenize(text)) { const cps = [..."#" + w + "#"]; for (let i = 0; i + 3 <= cps.length; i++) { const g = cps.slice(i, i + 3).join(""); m.set(g, (m.get(g) || 0) + 1); } }
  return m;
}
function cosMap(a, b) { let dot = 0, na = 0, nb = 0; for (const [k, v] of a) { na += v * v; if (b.has(k)) dot += v * b.get(k); } for (const v of b.values()) nb += v * v; return na && nb ? dot / Math.sqrt(na * nb) : 0; }
function buildVector(chunks) {
  const vecs = chunks.map((c) => trigrams(c.title + " " + c.text));
  return function (query, k) {
    const q = trigrams(query);
    return vecs.map((v, i) => ({ id: chunks[i].id, score: cosMap(q, v) })).filter((x) => x.score > 0).sort((x, y) => y.score - x.score || (x.id < y.id ? -1 : 1)).slice(0, k || 3);
  };
}
function rrf(lists, k, top) {
  const s = new Map();
  for (const list of lists) list.forEach((x, r) => s.set(x.id, (s.get(x.id) || 0) + 1 / (k + r + 1)));
  return [...s.entries()].map(([id, score]) => ({ id, score })).sort((x, y) => y.score - x.score || (x.id < y.id ? -1 : 1)).slice(0, top || 3);
}
`;

const QUERIES = String.raw`const QUERIES = [
  { q: "ঢাকার বাইরে ডেলিভারি কত দিনে?", rel: ["policy-delivery"] },
  { q: "ফেরত দিলে টাকা কবে পাব", rel: ["policy-return"] },
  { q: "বিকাশে পেমেন্ট করা যায়?", rel: ["faq-payment"] },
  { q: "শাড়ির দৈর্ঘ্য কত হাত", rel: ["faq-size"] },
  { q: "থ্রি-পিস মেশিনে ধোয়া যাবে?", rel: ["prod-threepiece"] },
  { q: "মূল্য পরিশোধের উপায়", rel: ["faq-payment"] },
  { q: "ভাঙা পণ্যের ফেরত খরচ কে দেয়", rel: ["policy-return"] },
  { q: "কাপড়ের রঙ কি পাকা", rel: ["prod-saree-blue"] },
  { q: "পেমেন্টের উপায় কী", rel: ["faq-payment"] },
  { q: "ফেরতের নিয়ম জানতে চাই", rel: ["policy-return"] },
];
`;

const PRACTICE = 'এই কোড কোনো LLM বা নেটওয়ার্ক ডাকে না। নথি ও পণ্য একটি কাল্পনিক দোকানের সিন্থেটিক ডেটা; “উত্তর” নথি থেকে বাক্য বেছে নেওয়া (extractive), কোনো মডেলের তৈরি টেক্সট নয়।';

const lessons = [
  {
    id: 'les-11-01-documents-chunking',
    slug: 'documents-chunking-metadata',
    title: 'নথি, Chunking ও Metadata',
    minutes: 40,
    prereqs: ['les-10-07-project-classify-draft', 'les-07-05-project-semantic-search'],
    synthetic: true,
    summary: 'RAG-এর দুই ধাপ (খোঁজা, তারপর উত্তর); নথিকে বাক্য-সীমায় টুকরো (chunk) করা, সর্বোচ্চ দৈর্ঘ্য ও overlap; প্রতিটি chunk-এর metadata—উৎস, tenant, দৃশ্যমানতা, হালনাগাদের তারিখ; বাংলা বাক্য-সীমা “।”।',
    overview: p('RAG-এর মূল ধারণা সহজ: (১) প্রশ্নের সাথে প্রাসঙ্গিক তথ্য আপনার নথি থেকে খুঁজুন, (২) শুধু সেই তথ্য প্রসঙ্গ হিসেবে দিয়ে উত্তর তৈরি করুন। খোঁজার আগে নথিকে ছোট টুকরোয় (chunk) ভাগ করতে হয়—পুরো নথি দিলে অপ্রাসঙ্গিক অংশ প্রসঙ্গ ভরিয়ে ফেলে, খুব ছোট টুকরোয় অর্থ ভেঙে যায়। প্রতিটি chunk-এর সাথে metadata রাখতে হয়: কোন নথি, কোন দোকানের (tenant), কে দেখতে পারবে, কবে হালনাগাদ। এই metadata পরে উৎস-উল্লেখ, অনুমতি ও হালনাগাদের ভিত্তি।'),
    objectives: ['RAG-এর retrieval ও generation ধাপ আলাদা করে বলতে পারবেন', 'বাক্য-সীমা মেনে সর্বোচ্চ দৈর্ঘ্য ও overlap-সহ chunk করতে পারবেন', 'প্রতিটি chunk-এ দরকারি metadata রাখতে পারবেন'],
    problem: p('দোকানের ফেরত নীতি একটি লম্বা অনুচ্ছেদ। গ্রাহক জিজ্ঞেস করলেন “টাকা ফেরত কবে পাব?” পুরো নীতি পাঠালে উত্তর মেলে, কিন্তু ৫০টি নথি একসাথে পাঠানো যায় না। আবার শুধু “টাকা ফেরত ৫ কর্মদিবসের মধ্যে” লাইনটা কেটে নিলে আগের লাইনের শর্ত হারিয়ে যেতে পারে। কীভাবে ভাগ করবেন?'),
    explain:
      p(`<strong>${term('চাঙ্ক', 'chunk')}:</strong> নথির এমন টুকরো যা একা পড়লেও অর্থ বোঝা যায়। সাধারণ নিয়ম: বাক্য বা অনুচ্ছেদের সীমায় কাটুন (বাংলায় “।”), একটি সর্বোচ্চ দৈর্ঘ্য রাখুন, আর পাশাপাশি দুই chunk-এ একটি বাক্য ${term('ওভারল্যাপ', 'overlap')} রাখুন যাতে সীমানার তথ্য হারায় না।`) +
      p('<strong>দৈর্ঘ্যের ভারসাম্য:</strong> বড় chunk = বেশি প্রসঙ্গ কিন্তু খোঁজা কম নির্দিষ্ট ও প্রসঙ্গ-বাজেট দ্রুত শেষ; ছোট chunk = নির্দিষ্ট কিন্তু শর্ত ও উদ্ধৃতি ভাঙে। কোনো একটি “সঠিক” সংখ্যা নেই—আপনার প্রশ্ন-সেটে মেপে ঠিক করুন (পাঠ ১১.৬)।') +
      p(`<strong>${term('মেটাডেটা', 'metadata')}:</strong> <code>doc</code> (উৎস), <code>tenant</code> (কোন দোকান), <code>vis</code> (public/staff), <code>updated</code> (তারিখ), <code>title</code>। চাঙ্কের id-তে নথির id রাখুন (<code>policy-return#2</code>)—উৎস-উল্লেখ ও হালনাগাদ সহজ হয়।`) +
      warn('এখানকার নীতি, চার্জ ও পণ্য সবই কাল্পনিক—কোনো আসল দোকানের নয়। বাস্তবে উৎস-নথি আসবে দোকানের যাচাই-করা নীতি থেকে, এবং প্রতিটি নথির একজন দায়িত্বপ্রাপ্ত মালিক থাকবেন।'),
    analogy: {
      text: 'Chunking হলো একটি বড় বইয়ের জন্য সূচিপত্রের কার্ড বানানো: প্রতিটি কার্ডে একটি বিষয়ের কয়েকটি লাইন, আর কার্ডের কোণে বইয়ের নাম ও পৃষ্ঠা।',
      breaks: 'গ্রন্থাগারিক কার্ড বানানোর সময় বুঝে কাটেন কোথায় একটি ধারণা শেষ; আমাদের কোড শুধু “।” ও দৈর্ঘ্য দেখে—একটি শর্ত দুই বাক্যে ছড়ানো থাকলে ভুল জায়গায় কাটতে পারে।',
    },
    worked:
      p('ফেরত নীতির ৪টি বাক্য, সর্বোচ্চ ১২০ অক্ষর।') +
      ol([
        'বাক্য ১ + ২ একসাথে ১২০-এর নিচে থাকলে এক chunk।',
        'বাক্য ৩ যোগ করলে সীমা পেরোয় → chunk ১ শেষ; chunk ২ শুরু বাক্য ২ দিয়ে (overlap), তারপর বাক্য ৩।',
        'একইভাবে chunk ৩ = বাক্য ৩ + ৪ (সীমার মধ্যে থাকলে)।',
        'প্রতিটি chunk পায় নথির tenant, vis, updated, title।',
      ]),
    activity: note(PRACTICE),
    code: [
      {
        label: 'বাক্য-সীমায় chunk ও metadata',
        starter: KB + TOK + String.raw`
const ret = DOCS.find((d) => d.id === "policy-return");
console.log("বাক্য:", sentences(ret.text).length);
const chunks = chunkDoc(ret, 120);
chunks.forEach((c) => console.log(c.id, "|", c.text.length, "অক্ষর |", c.text));

const all = DOCS.flatMap((d) => chunkDoc(d, 120));
console.log("মোট chunk:", all.length, "| নথি:", DOCS.length);
console.log("metadata উদাহরণ:", JSON.stringify({ id: all[0].id, tenant: all[0].tenant, vis: all[0].vis, updated: all[0].updated }));
console.log("টোকেন:", JSON.stringify(tokenize("থ্রি-পিসের সাইজ চার্ট?")));
`,
        expect: ['বাক্য: 4', 'policy-return#2 | 85 অক্ষর | পণ্য অব্যবহৃত ও ট্যাগসহ থাকতে হবে। ভাঙা বা ত্রুটিপূর্ণ পণ্যের ফেরত খরচ দোকান বহন করে।', 'মোট chunk: 12 | নথি: 8', 'টোকেন: ["থ্রি","পিসের","সাইজ","চার্ট"]'],
        hints: ['maxChars ৬০ করুন—chunk কয়টি হয়? কোন chunk-এ একটি মাত্র বাক্য?', 'overlap বাক্যটি কোনটি—chunk ১-এর শেষ বাক্য কি chunk ২-এর প্রথম?', 'tokenize-এ “থ্রি-পিসের” কীভাবে ভাগ হলো? এটি খোঁজায় কী প্রভাব ফেলবে?'],
        test: '__assert(chunks.length===3,"3 chunks"); __assert(chunks[1].text.indexOf(sentences(ret.text)[1])===0,"overlap"); __assert(all.every(function(c){return c.tenant&&c.vis&&c.updated;}),"metadata");',
      },
    ],
    line: ul([
      '<code>sentences</code>: “।”, “?” বা “!”-এর পরের ফাঁকায় ভাগ (lookbehind <code>(?&lt;=…)</code>—চিহ্নটি বাক্যের সাথেই থাকে)।',
      '<code>chunkDoc</code>: বাক্য যোগ করতে করতে সীমা পেরোলে chunk বন্ধ, শেষ বাক্যটি নতুন chunk-এর শুরুতে (overlap)।',
      'প্রতিটি chunk-এ নথির metadata কপি—পরে ফিল্টার ও উৎস-উল্লেখের জন্য।',
      '<code>tokenize</code>: অধ্যায় ৬-এর মতো <code>\\p{L}\\p{M}\\p{N}</code>—বাংলা কার-চিহ্ন ও সংখ্যা শব্দের অংশ।',
    ]),
    why: p('অক্ষর-সীমা ব্যবহার করা হয়েছে কারণ আসল tokenizer এখানে নেই; বাস্তবে সীমা সাধারণত token-এ মাপা হয়। একটি বাক্যের overlap সহজতম পদ্ধতি; অনুচ্ছেদ-সীমা, শিরোনাম-সচেতন কাটা বা টেবিলকে আলাদা রাখা—এগুলো আসল নথিতে প্রায়ই দরকার।'),
    remember: ['RAG = খোঁজা + উত্তর', 'বাক্য-সীমায় কাটুন, overlap রাখুন', 'chunk id-তে নথির id', 'metadata: tenant, vis, updated, title'],
    skip: ['PDF/HTML পার্সিং', 'টেবিল ও ছবি', 'শিরোনাম-ভিত্তিক hierarchical chunking'],
    experiment: p('সব নথিকে ৪০, ১২০ ও ৪০০ অক্ষরে chunk করুন এবং মোট chunk-সংখ্যা তুলনা করুন। ৪০০-এ প্রতিটি নথি একটি chunk—এতে কোন প্রশ্নের উত্তর খুঁজতে সুবিধা আর কোনটায় অসুবিধা?'),
    mistakes: ['বাক্যের মাঝখানে নির্দিষ্ট অক্ষর-সংখ্যায় কাটা', 'metadata ছাড়া chunk রাখা', 'সব নথির জন্য একই দৈর্ঘ্য মেপে না দেখে ধরে নেওয়া', 'সিন্থেটিক নীতিকে আসল নীতি হিসেবে ব্যবহার'],
    quiz: [
      { q: 'Overlap কেন রাখা হয়?', a: { a: 'chunk-সীমানায় তথ্য বা শর্ত হারানো কমাতে', b: 'chunk-সংখ্যা কমাতে', c: 'খোঁজা দ্রুত করতে' }, ok: 'a', why: 'সীমানার বাক্য দুই দিকেই থাকে।' },
      { q: 'chunk-এর tenant metadata কোন কাজে লাগে?', a: { a: 'বানান ঠিক করতে', b: 'এক দোকানের ব্যবহারকারী যেন অন্য দোকানের নথি না পায়', c: 'chunk ছোট করতে' }, ok: 'b', why: 'অনুমতি-ফিল্টার metadata-র ওপর নির্ভর করে (পাঠ ১১.৫)।' },
      { q: 'সবচেয়ে ভালো chunk-দৈর্ঘ্য কীভাবে ঠিক করবেন?', a: { a: 'সবসময় ৫১২ token', b: 'নিজের প্রশ্ন-সেটে retrieval মেপে', c: 'যত বড় তত ভালো' }, ok: 'b', why: 'নথি ও প্রশ্নের ধরন অনুযায়ী ফল বদলায়।' },
    ],
    recap: ['chunk = একা পড়ে বোঝা যায় এমন টুকরো', 'বাক্য-সীমা + overlap', 'metadata পরের সব ধাপের ভিত্তি'],
    nextNote: 'chunk তৈরি। এবার খোঁজা—প্রথমে শব্দ মিলিয়ে, BM25:',
    sources: [SRC.rag, SRC.unicodeBengali],
  },
  {
    id: 'les-11-02-bm25-keyword',
    slug: 'keyword-search-bm25',
    title: 'Keyword Search: BM25',
    minutes: 45,
    prereqs: ['les-11-01-documents-chunking'],
    synthetic: true,
    summary: 'TF-IDF থেকে BM25: দুর্লভ শব্দের বেশি ওজন (IDF), পুনরাবৃত্তির সম্পৃক্তি (k₁), দৈর্ঘ্য-স্বাভাবিকীকরণ (b); হাতে লেখা BM25; বাংলা বিভক্তি (শাড়ি/শাড়ির) ও প্রতিশব্দে keyword search-এর সীমা।',
    overview: p('শব্দ মিলিয়ে খোঁজা পুরোনো কিন্তু এখনো শক্তিশালী—বিশেষত পণ্যের নাম, কোড, নির্দিষ্ট শব্দের ক্ষেত্রে। BM25 প্রতিটি chunk-কে স্কোর দেয়: প্রশ্নের শব্দ chunk-এ যত বার আছে (কিন্তু একটি সীমা পর্যন্ত), শব্দটি সংগ্রহে যত দুর্লভ, আর chunk যত ছোট—স্কোর তত বেশি। এই পাঠে BM25 নিজে লিখব এবং দেখব বাংলায় এর একটি বড় দুর্বলতা: “শাড়ির” আর “শাড়ি” আলাদা শব্দ হিসেবে গোনা হয়।'),
    objectives: ['BM25 সূত্রের তিনটি অংশ (IDF, tf-সম্পৃক্তি, দৈর্ঘ্য) ব্যাখ্যা করতে পারবেন', 'chunk-সংগ্রহে BM25 দিয়ে ranking করতে পারবেন', 'বিভক্তি ও প্রতিশব্দে keyword search কেন ব্যর্থ হয় দেখাতে পারবেন'],
    problem: p('গ্রাহক লিখলেন “শাড়ির দৈর্ঘ্য কত হাত”। সাইজ নথিতে আছে “শাড়ি সাধারণত ৬ হাত লম্বা হয়”। মানুষের কাছে মিল স্পষ্ট, কিন্তু কম্পিউটারের কাছে “শাড়ির” ≠ “শাড়ি”, “দৈর্ঘ্য” ≠ “লম্বা”। শুধু “কত” ও “হাত” মেলে—আর “কত” প্রায় সব প্রশ্নেই থাকে। BM25 কি তবুও ঠিক নথি খুঁজবে?'),
    explain:
      p(`<strong>${term('আইডিএফ', 'IDF')}:</strong> log(১ + (N − n + ০.৫)/(n + ০.৫)), যেখানে N = মোট chunk, n = যত chunk-এ শব্দটি আছে। দুর্লভ শব্দ (“বিকাশ”) বেশি তথ্য বহন করে, সাধারণ শব্দ (“ডেলিভারি” আমাদের সংগ্রহে) কম।`) +
      p('<strong>tf-সম্পৃক্তি:</strong> tf·(k₁+১)/(tf + k₁·(…))—একটি শব্দ ১০ বার থাকলে ১০ গুণ স্কোর নয়; k₁ ≈ ১.২ হলে কয়েকবারের পর বৃদ্ধি থেমে আসে। <strong>দৈর্ঘ্য:</strong> b ≈ ০.৭৫—লম্বা chunk-এ শব্দ পাওয়া স্বাভাবিক, তাই কিছুটা শাস্তি।') +
      p('<strong>বাংলার সমস্যা:</strong> বিভক্তি (শাড়ি, শাড়ির, শাড়িতে), যুক্ত শব্দ ও বানান-বৈচিত্র্য (রং/রঙ)। সমাধানের পথ: stemming/lemmatization (বাংলায় সীমিত ও ঝুঁকিপূর্ণ), অক্ষর n-gram (পরের পাঠ), বা শেখা embedding। প্রতিশব্দ (দৈর্ঘ্য/লম্বা, দাম/মূল্য) keyword search ধরতে পারে না।') +
      warn('BM25-এর স্কোরের কোনো পরম অর্থ নেই—একই সংগ্রহে তুলনার জন্য। “স্কোর ২-এর বেশি হলে প্রাসঙ্গিক” এমন সীমা অন্য সংগ্রহে বা নথি যোগ করার পর বদলে যায়।'),
    analogy: {
      text: 'BM25 হলো বইয়ের শেষের শব্দ-সূচি (index): “বিকাশ — পৃষ্ঠা ১২” দেখে সরাসরি পৃষ্ঠায় যাওয়া। যে শব্দ সব পৃষ্ঠায় আছে, সূচিতে তার কোনো দাম নেই।',
      breaks: 'পাঠক সূচিতে “শাড়ি” খুঁজে “শাড়ির” প্রশ্নের উত্তর পান, কারণ তিনি ভাষা জানেন; BM25 শুধু হুবহু টোকেন মেলায়।',
    },
    worked:
      p('N = ৮ chunk ধরে, “বিকাশ” আছে ২টিতে, “ডেলিভারি” ৪টিতে।') +
      ol([
        'IDF(বিকাশ) = ln(১ + (৮ − ২ + ০.৫)/(২ + ০.৫)) = ln(১ + ২.৬) ≈ ১.২৮।',
        'IDF(ডেলিভারি) = ln(১ + (৮ − ৪ + ০.৫)/(৪ + ০.৫)) = ln ২ ≈ ০.৬৯।',
        'একটি chunk-এ tf = ১, দৈর্ঘ্য গড়ের সমান: tf-অংশ = ১·২.২/(১ + ১.২) = ১ → স্কোর = IDF।',
        'একই chunk-এ tf = ৩: ৩·২.২/(৩ + ১.২) ≈ ১.৫৭—তিন গুণ নয়।',
      ]),
    activity: note(PRACTICE),
    code: [
      {
        label: 'BM25 হাতে লেখা ও প্রশ্ন-সেটে ranking',
        starter: KB + TOK + SEARCH + QUERIES + String.raw`
const chunks = DOCS.filter((d) => d.tenant === "shopA" && d.vis === "public").flatMap((d) => chunkDoc(d, 120));
const bm25 = buildBM25(chunks);
const r2 = (x) => Math.round(x * 100) / 100;
for (const { q, rel } of QUERIES) {
  const res = bm25(q, 3);
  const hit = res.findIndex((x) => rel.includes(x.id.split("#")[0]));
  console.log((hit === 0 ? "✓" : hit > 0 ? "~" + (hit + 1) : "✗"), q, "→", res.map((x) => x.id + ":" + r2(x.score)).join(", ") || "(কিছু নেই)");
}
const sizeTokens = new Set(tokenize(chunks.find((c) => c.doc === "faq-size").text));
console.log("«শাড়ির দৈর্ঘ্য কত হাত»-এ সাইজ নথির সাথে মেলা টোকেন:", JSON.stringify(tokenize("শাড়ির দৈর্ঘ্য কত হাত").filter((t) => sizeTokens.has(t))));
console.log("«হাত» ছাড়া «শাড়ির দৈর্ঘ্য»:", JSON.stringify(bm25("শাড়ির দৈর্ঘ্য", 3)));
console.log("“শাড়ির” vs “শাড়ি” টোকেন সমান?", tokenize("শাড়ির")[0] === tokenize("শাড়ি")[0]);
console.log("tf-সম্পৃক্তি (k1=1.2):", [1, 2, 3, 5, 10].map((tf) => r2((tf * 2.2) / (tf + 1.2))));
`,
        expect: ['✓ শাড়ির দৈর্ঘ্য কত হাত → faq-size#1:1.9', '✗ পেমেন্টের উপায় কী → (কিছু নেই)', '✗ ফেরতের নিয়ম জানতে চাই → (কিছু নেই)', 'সাইজ নথির সাথে মেলা টোকেন: ["হাত"]', '«হাত» ছাড়া «শাড়ির দৈর্ঘ্য»: []', 'tf-সম্পৃক্তি (k1=1.2): [1,1.38,1.57,1.77,1.96]'],
        hints: ['কোন দুটি প্রশ্নে ✗ এল? নথিতে শব্দগুলো কোন রূপে আছে (পেমেন্টে, ফেরত)?', '“মূল্য পরিশোধের উপায়”-এ কোন টোকেনটি মিলেছে?', 'k1 = 0 দিলে tf-এর কোনো প্রভাব থাকে? (সূত্রে বসিয়ে দেখুন)'],
        test: '__assert(bm25("পেমেন্টের উপায় কী",3).length===0,"inflection miss"); __assert(bm25("বিকাশে পেমেন্ট করা যায়?",1)[0].id==="faq-payment#1","exact hit");',
      },
    ],
    solutionNote: p('QuickJS-এ চালানো ফল: ১০টি প্রশ্নের ৮টিতে প্রথম ফল সঠিক। কিন্তু “শাড়ির দৈর্ঘ্য কত হাত” সঠিক হয়েছে শুধু “হাত” শব্দের কারণে—“শাড়ির” ও “দৈর্ঘ্য” কিছুই মেলেনি, আর “হাত” বাদ দিলে কোনো ফলই আসে না। “পেমেন্টের উপায় কী” ও “ফেরতের নিয়ম জানতে চাই”-তে কোনো ফল নেই, কারণ নথিতে শব্দগুলো “পেমেন্টে” ও “ফেরত” রূপে আছে। অর্থাৎ ৮/১০ সংখ্যাটি প্রশ্নের শব্দচয়নের ওপর অনেকটা নির্ভর করে।'),
    line: ul([
      '<code>df</code>: প্রতিটি টোকেন কত chunk-এ আছে—<code>new Set(d)</code> দিয়ে এক chunk-এ একবারই গোনা।',
      'স্কোর-সূত্রের তিন অংশ এক লাইনে: IDF × tf-সম্পৃক্তি, যার হরে দৈর্ঘ্য-স্বাভাবিকীকরণ।',
      'সমান স্কোরে id দিয়ে সাজানো—ফল নির্ধারিত ও পরীক্ষাযোগ্য।',
      'শিরোনামও (<code>c.title</code>) সূচিতে—ছোট নথিতে শিরোনাম অনেক তথ্য বহন করে।',
    ]),
    why: p('BM25 লাইব্রেরি ছাড়া লেখা হয়েছে যাতে প্রতিটি অংশ দেখা যায়; প্রোডাকশনে একটি পরীক্ষিত search engine (যেমন Elasticsearch/OpenSearch বা ডেটাবেসের full-text index) ব্যবহার করুন। k₁ = ১.২ ও b = ০.৭৫ প্রচলিত শুরুর মান, সর্বজনীন সর্বোত্তম নয়।'),
    remember: ['BM25 = IDF × সম্পৃক্ত tf ÷ দৈর্ঘ্য', 'দুর্লভ শব্দের ওজন বেশি', 'স্কোর শুধু একই সংগ্রহে তুলনীয়', 'বাংলা বিভক্তি ও প্রতিশব্দে দুর্বল'],
    skip: ['inverted index-এর ডেটা-কাঠামো', 'বাংলা stemmer', 'query expansion'],
    experiment: p('tokenize-এ একটি খুব সরল প্রত্যয়-ছাঁটাই যোগ করুন (শব্দের শেষে “ের”, “র”, “তে” থাকলে সরান)। কোন প্রশ্নের ফল ভালো হয়? কোন শব্দ ভুলভাবে কাটা পড়ে (যেমন “বাইরে” → “বাই”)? এই কারণে বাংলায় হাতে লেখা stemming ঝুঁকিপূর্ণ।'),
    mistakes: ['BM25 স্কোরে স্থির সীমা ব্যবহার', 'বিভক্তির কারণে মিস-হওয়া ফলকে “নথিতে নেই” ভাবা', 'IDF-এর জন্য সব tenant-এর নথি মিশিয়ে গোনা (তথ্য-ফাঁসের ঝুঁকি—পাঠ ১১.৫)', 'শিরোনাম সূচি থেকে বাদ রাখা'],
    quiz: [
      { q: 'IDF কোন শব্দকে বেশি ওজন দেয়?', a: { a: 'যে শব্দ প্রায় সব chunk-এ আছে', b: 'যে শব্দ অল্প কয়েকটি chunk-এ আছে', c: 'সবচেয়ে লম্বা শব্দ' }, ok: 'b', why: 'দুর্লভ শব্দ chunk-গুলোকে আলাদা করতে বেশি সাহায্য করে।' },
      { q: 'k₁ = ১.২-এ tf ১ থেকে ১০ হলে tf-অংশ প্রায়?', a: { a: '১০ গুণ', b: '১ থেকে প্রায় ১.৯৬', c: 'অপরিবর্তিত' }, ok: 'b', why: '১০·২.২/(১০ + ১.২) ≈ ১.৯৬—সম্পৃক্তি।' },
      { q: '“শাড়ির” প্রশ্নে “শাড়ি” লেখা নথি BM25-এ মেলে না কেন?', a: { a: 'টোকেন হুবহু আলাদা', b: 'IDF শূন্য', c: 'নথি খুব লম্বা' }, ok: 'a', why: 'বিভক্তি-যুক্ত রূপ আলাদা টোকেন।' },
    ],
    recap: ['BM25: দুর্লভ শব্দ, সম্পৃক্ত tf, দৈর্ঘ্য', 'নির্দিষ্ট শব্দ ও নামে শক্তিশালী', 'বিভক্তি ও প্রতিশব্দে দুর্বল'],
    nextNote: 'বানানের কাছাকাছি রূপ ধরতে ভেক্টর, আর দুটোর সুবিধা একসাথে নিতে hybrid:',
    sources: [SRC.bm25, SRC.jurafsky],
  },
  {
    id: 'les-11-03-vector-hybrid',
    slug: 'vector-hybrid-search',
    title: 'Vector Search ও Hybrid (RRF)',
    minutes: 45,
    prereqs: ['les-11-02-bm25-keyword'],
    synthetic: true,
    summary: 'অক্ষর-trigram ভেক্টর ও cosine (শেখা embedding নয়—বানান-মিল ধরে, প্রতিশব্দ নয়); শেখা embedding কী যোগ করে; Reciprocal Rank Fusion দিয়ে BM25 ও vector-এর ranking মেলানো; একই প্রশ্ন-সেটে তিন পদ্ধতির তুলনা।',
    overview: p('অধ্যায় ৭-এ দেখেছি embedding অর্থের কাছাকাছি শব্দকে কাছাকাছি ভেক্টর দেয়। আসল embedding মডেল এখানে চালানো যায় না, তাই একটি সৎ বিকল্প নেব: অক্ষর-trigram ভেক্টর—প্রতিটি শব্দকে তিন-অক্ষরের টুকরোয় ভেঙে গোনা। এটি “শাড়ি” ও “শাড়ির”-কে কাছাকাছি রাখে (বেশিরভাগ টুকরো এক), কিন্তু “দাম” ও “মূল্য”-কে নয়—এর কোনো অর্থ-জ্ঞান নেই। তারপর BM25 ও এই ভেক্টরের ranking মেলাব Reciprocal Rank Fusion (RRF) দিয়ে, এবং একই ১০টি প্রশ্নে তিনটি পদ্ধতির ফল মাপব।'),
    objectives: ['অক্ষর-trigram ভেক্টর বানিয়ে cosine মাপতে পারবেন এবং এর সীমা বলতে পারবেন', 'RRF দিয়ে দুটি ranking মেলাতে পারবেন', 'একই প্রশ্ন-সেটে তিন পদ্ধতির hit@1 তুলনা করতে পারবেন'],
    problem: p('BM25 “পেমেন্টের উপায়” ও “ফেরতের নিয়ম”-এ কিছুই পায় না (পাঠ ১১.২), কিন্তু “বিকাশ”-এর মতো নির্দিষ্ট শব্দে চমৎকার। ভেক্টর search বানান-বৈচিত্র্যে ভালো, কিন্তু কখনো কখনো শুধু শব্দের চেহারা মিলিয়ে ভুল নথি আনে। দুটোর স্কোরের মাপ সম্পূর্ণ আলাদা (BM25 ০–৫, cosine ০–১)—কীভাবে মেলাবেন?'),
    explain:
      p(`<strong>অক্ষর-trigram:</strong> “#শাড়ি#” → [#শা, শাড়, াড়ি, …] (কোড পয়েন্ট ধরে)। প্রতিটি টুকরোর গণনা একটি sparse ভেক্টর; দুটি ভেক্টরের ${term('কোসাইন', 'cosine')} মিল অধ্যায় ৩-এর মতো। এটি বানান-মিলের মাপ, অর্থের নয়—এমনকি “রং” ও “রঙ”-এর মিলও ০, কারণ ং ও ঙ আলাদা কোড পয়েন্ট এবং শব্দ দুটি এত ছোট যে কোনো trigram মেলে না।`) +
      p('<strong>শেখা embedding:</strong> একটি embedding মডেল (অধ্যায় ৭-এর ধারণা, বিশাল পরিসরে) প্রতিশব্দ ও প্যারাফ্রেজও কাছে রাখতে পারে। কিন্তু বাংলায় এর মান মডেলভেদে অনেক আলাদা—আপনার প্রশ্ন-সেটে মাপুন; আর embedding মডেল বদলালে পুরো সূচি আবার বানাতে হয়।') +
      p(`<strong>${term('আরআরএফ', 'Reciprocal Rank Fusion')}:</strong> স্কোর নয়, অবস্থান মেলানো: প্রতিটি তালিকায় অবস্থান r (১ থেকে) হলে ১/(k + r) যোগ, k = ৬০ প্রচলিত। মাপের পার্থক্য সমস্যা থাকে না, আর দুই তালিকাতেই ওপরে থাকা chunk সবচেয়ে বেশি পায়।`) +
      warn('এই পাঠের “ভেক্টর” শেখা embedding নয়, এবং এর ফল কোনো embedding মডেলের মান নির্দেশ করে না। এটি দেখানোর জন্য যে ভিন্ন ধরনের মিল (হুবহু শব্দ বনাম বানানের কাছাকাছি) একসাথে কাজে লাগে।'),
    analogy: {
      text: 'BM25 হলো নাম ধরে ডাকা, trigram ভেক্টর হলো চেহারার মিল দেখে চেনা, RRF হলো দুই সাক্ষীর তালিকা মিলিয়ে যাকে দুজনেই ওপরের দিকে রেখেছে তাকে বেছে নেওয়া।',
      breaks: 'দুই সাক্ষী একই ভুল করলে (দুটি পদ্ধতিই প্রতিশব্দ বোঝে না) মেলালেও ভুল ঠিক হয় না—fusion নতুন জ্ঞান তৈরি করে না।',
    },
    worked:
      p('একটি chunk BM25-এ ১ম, vector-এ ৩য়; আরেকটি BM25-এ ২য়, vector-এ ১ম।') +
      ol([
        'প্রথম: ১/৬১ + ১/৬৩ ≈ ০.০১৬৪ + ০.০১৫৯ = ০.০৩২৩।',
        'দ্বিতীয়: ১/৬২ + ১/৬১ ≈ ০.০১৬১ + ০.০১৬৪ = ০.০৩২৫ → সামান্য এগিয়ে।',
        'শুধু এক তালিকায় ১ম থাকা chunk: ১/৬১ ≈ ০.০১৬৪—দুই তালিকায় মাঝারি থাকাদের চেয়ে পিছিয়ে।',
      ]),
    activity: note(PRACTICE),
    code: [
      {
        label: 'trigram cosine, RRF, এবং তিন পদ্ধতির তুলনা',
        starter: KB + TOK + SEARCH + QUERIES + String.raw`
const r3 = (x) => Math.round(x * 1000) / 1000;
console.log("cos(শাড়ি, শাড়ির) =", r3(cosMap(trigrams("শাড়ি"), trigrams("শাড়ির"))), "| cos(দাম, মূল্য) =", r3(cosMap(trigrams("দাম"), trigrams("মূল্য"))), "| cos(রং, রঙ) =", r3(cosMap(trigrams("রং"), trigrams("রঙ"))));

const chunks = DOCS.filter((d) => d.tenant === "shopA" && d.vis === "public").flatMap((d) => chunkDoc(d, 120));
const bm25 = buildBM25(chunks), vec = buildVector(chunks);
const methods = {
  "BM25  ": (q) => bm25(q, 5),
  "vector": (q) => vec(q, 5),
  "hybrid": (q) => rrf([bm25(q, 5), vec(q, 5)], 60, 5),
};
const hit1 = {};
for (const [name, f] of Object.entries(methods)) {
  const marks = QUERIES.map(({ q, rel }) => { const top = f(q)[0]; return top && rel.includes(top.id.split("#")[0]) ? "✓" : "✗"; });
  hit1[name.trim()] = marks.filter((m) => m === "✓").length;
  console.log(name, marks.join(" "), "| hit@1 =", hit1[name.trim()] + "/" + QUERIES.length);
}
`,
        expect: ['cos(শাড়ি, শাড়ির) = 0.73 | cos(দাম, মূল্য) = 0 | cos(রং, রঙ) = 0', 'BM25   ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✗ ✗ | hit@1 = 8/10', 'vector ✓ ✓ ✓ ✗ ✓ ✓ ✓ ✓ ✓ ✓ | hit@1 = 9/10', 'hybrid ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ | hit@1 = 10/10'],
        hints: ['কোন প্রশ্নে vector জিতল আর BM25 হারল? কেন (কোন শব্দের বিভক্তি)?', 'vector কোন প্রশ্নে হারল? <code>vec("শাড়ির দৈর্ঘ্য কত হাত", 3)</code> ছাপিয়ে দেখুন প্রথমে কোন নথি।', 'RRF-এর k ৬০ থেকে ১ করুন—ফল বদলায়?'],
        test: '__assert(hit1.hybrid>=hit1.BM25&&hit1.hybrid>=hit1.vector,"hybrid not worse here"); __assert(vec("শাড়ির দৈর্ঘ্য কত হাত",1)[0].id==="prod-saree-blue#1","vector miss explained");',
      },
    ],
    solutionNote: p('QuickJS-এ চালানো ফল (১০টি প্রশ্ন, hit@1): BM25 ৮/১০, vector ৯/১০, hybrid ১০/১০। BM25 হারে বিভক্তি-যুক্ত দুটি প্রশ্নে; vector সেগুলো পায় (“পেমেন্টের” ও “পেমেন্টে”-র বেশিরভাগ trigram এক)। কিন্তু vector হারে “শাড়ির দৈর্ঘ্য কত হাত”-এ: প্রথম ফল সুতি শাড়ির পণ্য-নথি (শিরোনামে “শাড়ি”), সাইজ নথি দ্বিতীয়। hybrid দুটির ভুল পূরণ করেছে কারণ দুই পদ্ধতি <em>ভিন্ন</em> প্রশ্নে ভুল করেছিল। এটি ১০টি সিন্থেটিক প্রশ্নের ফল—hybrid সব সংগ্রহে সবসময় জেতে এমন প্রমাণ নয়।'),
    line: ul([
      '<code>trigrams</code>: প্রতিটি শব্দের দুপাশে <code>#</code>—শব্দের শুরু ও শেষও টুকরো হিসেবে ধরা পড়ে।',
      '<code>cosMap</code>: Map-ভিত্তিক sparse cosine—শুধু অশূন্য ঘর।',
      '<code>rrf</code>: প্রতিটি তালিকার অবস্থান থেকে ১/(k + r) যোগ; স্কোরের মাপ উপেক্ষা।',
      '<code>hit@1</code>: প্রথম ফলটি প্রাসঙ্গিক নথির কি না—সবচেয়ে কঠোর সহজ মাপ।',
    ]),
    why: p('শেখা embedding চালানো এখানে সম্ভব নয়, আর বানানো embedding-সংখ্যা দেখানো অসৎ হতো—তাই এমন একটি ভেক্টর বেছে নেওয়া হয়েছে যার আচরণ সম্পূর্ণ ব্যাখ্যাযোগ্য। hybrid-এর ধারণা (ভিন্ন ধরনের মিলকে rank-স্তরে মেলানো) শেখা embedding-এর সাথেও একইভাবে কাজ করে।'),
    remember: ['trigram = বানান-মিল, অর্থ নয়', 'শেখা embedding প্রতিশব্দ ধরতে পারে—মেপে দেখুন', 'RRF: ১/(k + r), স্কোর নয়', 'একই প্রশ্ন-সেটে তুলনা'],
    skip: ['approximate nearest neighbour (HNSW)', 'vector database', 'embedding fine-tuning'],
    experiment: p('QUERIES-এ “দামের তালিকা কোথায়” যোগ করুন—কোনো নথিতে এর উত্তর নেই। তিন পদ্ধতিই কিছু না কিছু ফেরত দেয় কি? “কোনো ফল নেই” আর “একটি দুর্বল ফল”—এর পার্থক্য কীভাবে ধরবেন (পাঠ ১১.৪-এর সীমা)?'),
    mistakes: ['trigram বা যেকোনো ভেক্টরকে “অর্থ বোঝে” বলা', 'BM25 ও cosine স্কোর সরাসরি যোগ', 'embedding মডেল বদলে পুরোনো সূচি রাখা', 'একটি প্রশ্নে জিতে পদ্ধতি বেছে নেওয়া'],
    quiz: [
      { q: 'cos(দাম, মূল্য) trigram-এ প্রায় ০ কেন?', a: { a: 'দুটির কোনো অক্ষর-টুকরো মেলে না', b: 'IDF শূন্য', c: 'বাংলায় cosine চলে না' }, ok: 'a', why: 'trigram শুধু বানানের মিল দেখে।' },
      { q: 'RRF কেন স্কোরের বদলে অবস্থান ব্যবহার করে?', a: { a: 'অবস্থান হিসাব দ্রুত', b: 'ভিন্ন পদ্ধতির স্কোরের মাপ তুলনীয় নয়', c: 'স্কোর সবসময় ভুল' }, ok: 'b', why: 'BM25 ও cosine-এর মাপ আলাদা; অবস্থান সব পদ্ধতিতে একই অর্থ বহন করে।' },
      { q: 'দুটি পদ্ধতিই একটি প্রশ্নে ভুল করলে hybrid?', a: { a: 'সাধারণত ঠিক করে ফেলে', b: 'সাধারণত ঠিক করতে পারে না', c: 'সবসময় খালি ফেরত দেয়' }, ok: 'b', why: 'fusion বিদ্যমান তালিকা মেলায়; নতুন জ্ঞান আনে না।' },
    ],
    recap: ['trigram ভেক্টর: বিভক্তি ধরে, প্রতিশব্দ নয়', 'RRF দিয়ে hybrid', 'তুলনা একই সেটে, সংখ্যায়'],
    nextNote: 'chunk পাওয়া গেল। এবার সেরাগুলো বাছাই, প্রসঙ্গ সাজানো ও উৎসসহ উত্তর:',
    sources: [SRC.word2vec, SRC.bm25, ['Cormack, Clarke & Büttcher — Reciprocal Rank Fusion (SIGIR 2009)', 'https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf']],
  },
  {
    id: 'les-11-04-rerank-context-citations',
    slug: 'rerank-context-citation',
    title: 'Reranking, Context Assembly ও Citation',
    minutes: 45,
    prereqs: ['les-11-03-vector-hybrid'],
    synthetic: true,
    summary: 'দুই ধাপের খোঁজা: সস্তা retrieval → দামি rerank; প্রসঙ্গ-বাজেটে chunk সাজানো ও পুনরাবৃত্তি বাদ; extractive উত্তর ও [উৎস] উল্লেখ; একটি সীমার নিচে “তথ্য পাওয়া যায়নি”; উদ্ধৃতি সত্যিই উৎসে আছে কি না যাচাই।',
    overview: p('খোঁজা থেকে কয়েকটি প্রার্থী chunk পেলাম। এখন তিনটি কাজ: (১) rerank—অল্প কয়েকটি প্রার্থীর ওপর একটি সূক্ষ্মতর মাপ চালিয়ে আবার সাজানো; (২) context assembly—একটি নির্দিষ্ট বাজেটের মধ্যে সেরা chunk-গুলো, পুনরাবৃত্তি বাদ দিয়ে, উৎস-চিহ্নসহ; (৩) উত্তর ও উৎস-উল্লেখ। এই পাঠে উত্তর extractive: প্রসঙ্গ থেকে প্রশ্নের সবচেয়ে কাছের বাক্যটি বেছে নিয়ে তার উৎস দেখাই। মিল একটি সীমার নিচে হলে উত্তর না দিয়ে “তথ্য পাওয়া যায়নি”। শেষে যাচাই: প্রতিটি উদ্ধৃতি কি সত্যিই উল্লেখিত উৎসে আছে?'),
    objectives: ['retrieval ও reranking-এর ভূমিকা আলাদা করতে পারবেন', 'বাজেট ও পুনরাবৃত্তি মেনে প্রসঙ্গ সাজাতে পারবেন', 'উৎসসহ উত্তর ও উদ্ধৃতি-যাচাই লিখতে পারবেন, দুর্বল মিলে উত্তর থেকে বিরত থাকতে পারবেন'],
    problem: p('গ্রাহক: “ভাঙা পণ্যের ফেরত খরচ কে দেয়?” খোঁজায় এল ফেরত নীতির দুটি chunk (overlap-এর কারণে একই বাক্য দুবার) আর ডেলিভারি নীতি। আর একজন জিজ্ঞেস করলেন “কাল দোকান খোলা?”—যার উত্তর কোনো নথিতে নেই, কিন্তু খোঁজা তবুও কিছু একটা ফেরত দিল। দুটি ক্ষেত্রে কী করবেন?'),
    explain:
      p(`<strong>${term('রির‍্যাঙ্কিং', 'reranking')}:</strong> প্রথম ধাপ দ্রুত কিন্তু মোটা দাগের (হাজার chunk থেকে ২০টি)। দ্বিতীয় ধাপ ধীর কিন্তু সূক্ষ্ম, শুধু ২০টির ওপর। বাস্তবে প্রায়ই একটি cross-encoder মডেল; এখানে সরল বিকল্প—প্রতিটি chunk-এর <em>সেরা বাক্যের</em> trigram-মিল, কারণ উত্তর সাধারণত একটি বাক্যে থাকে।`) +
      p('<strong>Context assembly:</strong> rerank-ক্রমে chunk নিন যতক্ষণ বাজেট (এখানে অক্ষর) থাকে; একই বাক্য দুবার নয়; প্রতিটি অংশের শুরুতে <code>[policy-return#2 | ২০২৬-০৯-০১]</code>-এর মতো চিহ্ন, যাতে উত্তরে উৎস উল্লেখ করা যায়।') +
      p(`<strong>${term('উৎস-উল্লেখ', 'citation')}:</strong> উত্তরের প্রতিটি দাবির পাশে উৎস-চিহ্ন। LLM-এর তৈরি উত্তরে উৎস-চিহ্ন ভুল হতে পারে (চিহ্ন আছে কিন্তু সেই chunk-এ দাবিটি নেই)—তাই স্বয়ংক্রিয় যাচাই: উদ্ধৃত টেক্সট কি সেই chunk-এ আছে? এখানে উত্তর extractive, তাই যাচাই হুবহু substring।`) +
      p('<strong>বিরত থাকা:</strong> সেরা মিল একটি সীমার নিচে হলে “এই বিষয়ে নথিতে তথ্য পাওয়া যায়নি; একজন প্রতিনিধি জানাবেন।” সীমাটি একটি প্রশ্ন-সেটে মেপে ঠিক করা হয় (পাঠ ১১.৬); নতুন নথি যোগ হলে আবার মাপুন।') +
      warn('Extractive উত্তর নথির বাক্য হুবহু দেয়, তাই এটি নিজে তথ্য বানায় না—কিন্তু ভুল বাক্য বেছে নিতে পারে। LLM-ভিত্তিক উত্তর আরও সাবলীল, কিন্তু প্রসঙ্গের বাইরের তথ্য যোগ করতে পারে; তখন উৎস-যাচাই আরও জরুরি (অধ্যায় ৯-এর hallucination)।'),
    analogy: {
      text: 'Retrieval হলো লাইব্রেরি থেকে সম্ভাব্য ২০টি বই টেবিলে আনা; reranking হলো প্রতিটির সূচি খুলে সেরা ৩টি বাছাই; citation হলো উত্তরের পাশে বইয়ের নাম ও পৃষ্ঠা লেখা।',
      breaks: 'গবেষক পৃষ্ঠা খুলে পড়ে নিশ্চিত হন যে উদ্ধৃতি সঠিক; স্বয়ংক্রিয় ব্যবস্থায় এই যাচাই আলাদা করে কোডে লিখতে হয়, নইলে হয় না।',
    },
    worked:
      ol([
        'প্রশ্ন “ভাঙা পণ্যের ফেরত খরচ কে দেয়” → hybrid প্রার্থী: policy-return-এর chunk-গুলো ও আরও কিছু।',
        'rerank: প্রতিটি chunk-এর সেরা বাক্যের trigram-মিল; “ভাঙা বা ত্রুটিপূর্ণ পণ্যের ফেরত খরচ দোকান বহন করে।” সর্বোচ্চ।',
        'প্রসঙ্গ: ওপরের chunk-গুলো, বাজেট ২৫০ অক্ষর, পুনরাবৃত্ত বাক্য বাদ।',
        'উত্তর: সেই বাক্য + [policy-return#…]; যাচাই: বাক্যটি ঐ chunk-এ আছে ✓।',
        '“কাল দোকান খোলা?” → সেরা মিল সীমার নিচে → বিরত।',
      ]),
    activity: note(PRACTICE),
    code: [
      {
        label: 'rerank → প্রসঙ্গ → extractive উত্তর → উদ্ধৃতি-যাচাই',
        starter: KB + TOK + SEARCH + String.raw`
const r3 = (x) => Math.round(x * 1000) / 1000;
const chunks = DOCS.filter((d) => d.tenant === "shopA" && d.vis === "public").flatMap((d) => chunkDoc(d, 120));
const byId = new Map(chunks.map((c) => [c.id, c]));
const bm25 = buildBM25(chunks), vec = buildVector(chunks);
const THRESHOLD = 0.3;

function bestSentence(query, chunk) {
  const q = trigrams(query);
  return sentences(chunk.text).map((s) => ({ s, score: cosMap(q, trigrams(s)) })).sort((a, b) => b.score - a.score)[0];
}
function answer(query, budget) {
  const cand = rrf([bm25(query, 6), vec(query, 6)], 60, 6).map((x) => byId.get(x.id));
  const reranked = cand.map((c) => ({ c, best: bestSentence(query, c) })).sort((a, b) => b.best.score - a.best.score || (a.c.id < b.c.id ? -1 : 1));
  const seen = new Set(); const context = []; let used = 0;
  for (const { c } of reranked) {
    const fresh = sentences(c.text).filter((s) => !seen.has(s));
    const text = fresh.join(" ");
    if (!fresh.length || used + text.length > budget) continue;
    fresh.forEach((s) => seen.add(s)); used += text.length;
    context.push({ id: c.id, updated: c.updated, text });
  }
  const top = reranked[0];
  if (!top || top.best.score < THRESHOLD) return { answer: "এই বিষয়ে নথিতে তথ্য পাওয়া যায়নি; একজন প্রতিনিধি জানাবেন।", citations: [], score: top ? r3(top.best.score) : 0, context };
  return { answer: top.best.s, citations: [top.c.id], score: r3(top.best.score), context };
}
function verify(res) { return res.citations.every((id) => byId.has(id) && byId.get(id).text.includes(res.answer)); }

for (const q of ["ভাঙা পণ্যের ফেরত খরচ কে দেয়", "ঢাকার বাইরে ডেলিভারি চার্জ কত", "কাল দোকান খোলা?"]) {
  const r = answer(q, 250);
  console.log("প্রশ্ন:", q);
  console.log("  উত্তর:", r.answer, r.citations.length ? "[" + r.citations.join(", ") + "]" : "", "| মিল", r.score, "| উদ্ধৃতি সঠিক:", r.citations.length ? verify(r) : "— (উদ্ধৃতি নেই)");
  console.log("  প্রসঙ্গ:", r.context.map((c) => c.id).join(", "), "|", r.context.reduce((s, c) => s + c.text.length, 0), "অক্ষর");
}
const forged = { answer: "ভাঙা পণ্যের ফেরত খরচ গ্রাহক বহন করেন।", citations: ["policy-return#2"] };
console.log("বানানো উদ্ধৃতি যাচাই:", verify(forged));
`,
        expect: ['উত্তর: ভাঙা বা ত্রুটিপূর্ণ পণ্যের ফেরত খরচ দোকান বহন করে। [policy-return#2] | মিল 0.554 | উদ্ধৃতি সঠিক: true', 'উত্তর: ডেলিভারি চার্জ ঢাকার ভেতরে ৭০ টাকা এবং ঢাকার বাইরে ১৩০ টাকা। [policy-delivery#2] | মিল 0.707', 'উত্তর: এই বিষয়ে নথিতে তথ্য পাওয়া যায়নি; একজন প্রতিনিধি জানাবেন।  | মিল 0.225', 'বানানো উদ্ধৃতি যাচাই: false'],
        hints: ['“কাল দোকান খোলা?”-র মিল কত ছিল? THRESHOLD ০.১ করলে কী উত্তর আসে—সেটি কি সঠিক?', 'প্রসঙ্গে কোনো বাক্য দুবার এসেছে কি? seen না থাকলে কী হতো?', 'forged উত্তরটি কেন ধরা পড়ল? LLM-এর paraphrase-করা উত্তরে হুবহু substring যাচাই কেন যথেষ্ট নয়?'],
        test: 'var ctx=answer("ভাঙা পণ্যের ফেরত খরচ কে দেয়",250).context; var alls=ctx.flatMap(function(c){return sentences(c.text);}); __assert(new Set(alls).size===alls.length,"no duplicate sentences"); __assert(ctx.reduce(function(s,c){return s+c.text.length;},0)<=250,"budget"); __assert(answer("কাল দোকান খোলা?",250).citations.length===0,"abstain");',
      },
    ],
    line: ul([
      '<code>bestSentence</code>: chunk-এর প্রতিটি বাক্যের trigram-মিল—এটিই আমাদের সরল reranker।',
      '<code>seen</code>: overlap থেকে আসা পুনরাবৃত্ত বাক্য প্রসঙ্গে একবারই।',
      '<code>THRESHOLD</code>: এর নিচে উত্তর নয়—বিরত থাকা একটি বৈধ ও নিরাপদ ফল।',
      '<code>verify</code>: উদ্ধৃতি উৎসে হুবহু আছে কি না; বানানো দাবি ধরা পড়ে।',
    ]),
    why: p('উত্তর extractive রাখা হয়েছে কারণ এখানে LLM নেই এবং বানানো “সাবলীল” উত্তর দেখানো অসৎ হতো; আর extractive উত্তরে উৎস-যাচাই সহজ ও নিশ্চিত। প্রসঙ্গ-বাজেট অক্ষরে, কারণ tokenizer নেই—বাস্তবে token-এ মাপুন। THRESHOLD ০.৩ এই ছোট সংগ্রহে চালিয়ে বেছে নেওয়া; এটি অন্য সংগ্রহে স্থানান্তরযোগ্য নয়।'),
    remember: ['retrieval মোটা দাগে, rerank সূক্ষ্মভাবে', 'প্রসঙ্গ: বাজেট, পুনরাবৃত্তি বাদ, উৎস-চিহ্ন', 'দুর্বল মিলে বিরত', 'উদ্ধৃতি উৎসে আছে কি না যাচাই'],
    skip: ['cross-encoder reranker', 'LLM দিয়ে abstractive উত্তর', 'বাক্য-স্তরের NLI-ভিত্তিক উদ্ধৃতি যাচাই'],
    experiment: p('budget ৮০ করুন। প্রসঙ্গে কয়টি chunk ঢোকে? উত্তর কি বদলায়? এবার ভাবুন: বাজেট ছোট হলে LLM-ভিত্তিক উত্তরে কোন ঝুঁকি বাড়ে (দরকারি শর্ত প্রসঙ্গের বাইরে পড়ে যাওয়া)?'),
    mistakes: ['খোঁজার প্রথম ফলকেই উত্তর ধরা', 'সবসময় উত্তর দেওয়া, বিরত না থাকা', 'উৎস-চিহ্ন দেখানো কিন্তু যাচাই না করা', 'overlap-এর পুনরাবৃত্তি প্রসঙ্গে রেখে বাজেট নষ্ট'],
    quiz: [
      { q: 'Reranker কেন শুধু অল্প কয়েকটি প্রার্থীর ওপর চলে?', a: { a: 'এটি ধীর/দামি; সব chunk-এ চালানো অবাস্তব', b: 'বেশি chunk-এ এটি ভুল করে', c: 'নিয়ম অনুযায়ী ১০টির বেশি নিষেধ' }, ok: 'a', why: 'দুই ধাপের নকশা: সস্তা ধাপ ছাঁকে, দামি ধাপ সাজায়।' },
      { q: 'সেরা মিল সীমার নিচে হলে সঠিক আচরণ?', a: { a: 'সেরা chunk থেকে যাহোক একটি বাক্য', b: '“তথ্য পাওয়া যায়নি” বলে মানুষের কাছে পাঠানো', c: 'মডেলের নিজের জ্ঞান থেকে উত্তর' }, ok: 'b', why: 'অপ্রাসঙ্গিক উৎস থেকে উত্তর গ্রাহককে ভুল তথ্য দেয়।' },
      { q: 'উত্তরে [policy-return#2] চিহ্ন থাকলেই কি উত্তর ঐ নথি-সমর্থিত?', a: { a: 'হ্যাঁ', b: 'না—চিহ্ন ভুলও হতে পারে; যাচাই দরকার', c: 'শুধু extractive হলে না' }, ok: 'b', why: 'উদ্ধৃতি-যাচাই আলাদা ধাপ।' },
    ],
    recap: ['retrieve → rerank → assemble → answer → verify', 'বিরত থাকা একটি ফল', 'উৎস-চিহ্ন ≠ উৎস-সমর্থন'],
    nextNote: 'উত্তর দেওয়া গেল। কিন্তু নীতি বদলালে, বা ভুল মানুষ ভুল নথি দেখলে?',
    sources: [SRC.rag, SRC.ragas],
  },
  {
    id: 'les-11-05-updates-access-control',
    slug: 'knowledge-updates-access-control',
    title: 'জ্ঞান হালনাগাদ, Access Control ও Tenant Isolation',
    minutes: 45,
    prereqs: ['les-11-04-rerank-context-citations'],
    synthetic: true,
    summary: 'নথি বদলালে সূচির পুরোনো chunk মুছে নতুন যোগ (doc id ধরে); পুরোনো সূচির ভুল উত্তর; খোঁজার আগে অনুমতি-ফিল্টার (pre-filter) বনাম পরে (post-filter) বনাম ফিল্টার নেই; staff ও অন্য tenant-এর নথি ফাঁস।',
    overview: p('RAG-এর দুটি নীরব ব্যর্থতা: (১) নথি বদলেছে কিন্তু সূচি পুরোনো—বট আত্মবিশ্বাসের সাথে পুরোনো চার্জ বলে, আর উৎস-চিহ্নও দেখায়; (২) অনুমতি-ফিল্টার ভুল জায়গায়—গ্রাহক কর্মীদের অভ্যন্তরীণ ছাড়-নীতি দেখে ফেলেন, বা এক দোকানের গ্রাহক অন্য দোকানের নথি। এই পাঠে doc id ধরে সূচি হালনাগাদ করব, এবং তিনভাবে অনুমতি প্রয়োগ করে দেখব কোনটি ফাঁস করে, কোনটি উত্তর হারায়, আর কোনটি সঠিক।'),
    objectives: ['doc id ধরে সূচিতে chunk প্রতিস্থাপন করতে পারবেন', 'pre-filter, post-filter ও ফিল্টারহীন খোঁজার ফল তুলনা করতে পারবেন', 'অনুমতির উৎস (সার্ভার-প্রসঙ্গ) ও উত্তরে তারিখ দেখানোর গুরুত্ব ব্যাখ্যা করতে পারবেন'],
    problem: p('১ অক্টোবর দোকান ঢাকার বাইরের চার্জ ১৩০ থেকে ১৫০ টাকা করল (সিন্থেটিক)। নীতি-নথি হালনাগাদ হলো, কিন্তু সূচি আবার বানানো হয়নি। আবার এক গ্রাহক জিজ্ঞেস করলেন “পাইকারি ছাড় কত?”—আর উত্তরে এল কর্মীদের অভ্যন্তরীণ নথির ২০%। দুটোই কীভাবে আটকাবেন?'),
    explain:
      p('<strong>হালনাগাদ:</strong> সূচি নথির একটি “কপি”। নথি বদলালে: ঐ doc id-এর সব পুরোনো chunk মুছুন, নতুন chunk যোগ করুন, তারপর খোঁজার কাঠামো (BM25-এর df, ভেক্টর) হালনাগাদ। মুছে ফেলা নথির chunk-ও মুছুন। উত্তরে <code>updated</code> তারিখ দেখান, যাতে পাঠক ও কর্মী পুরোনো তথ্য চিনতে পারেন।') +
      p(`<strong>অনুমতি:</strong> ব্যবহারকারীর tenant ও role আসে সার্ভারের সেশন থেকে—কখনো প্রশ্নের টেক্সট থেকে নয়। তিন পদ্ধতি: (ক) ফিল্টার নেই → ফাঁস; (খ) ${term('পোস্ট-ফিল্টার', 'post-filter')}—আগে top-k খুঁজে পরে অননুমোদিত বাদ → অননুমোদিত chunk জায়গা দখল করে, অনুমোদিত উত্তর হারায়; (গ) ${term('প্রি-ফিল্টার', 'pre-filter')}—শুধু অনুমোদিত chunk-এর মধ্যে খোঁজা → সঠিক।`) +
      p('<strong>Tenant isolation:</strong> বহু-দোকানের সিস্টেমে প্রতিটি দোকানের আলাদা সূচি (বা সূচিতে বাধ্যতামূলক tenant ফিল্টার)। BM25-এর IDF-ও tenant অনুযায়ী আলাদা গোনা ভালো—নইলে অন্য দোকানের নথি স্কোরে প্রভাব ফেলে, এবং চতুর প্রশ্নে তাদের অস্তিত্বের আভাস দিতে পারে।') +
      warn('“system prompt-এ বলে দিয়েছি staff নথি দেখাবে না”—এটি access control নয়। যে chunk প্রসঙ্গে পৌঁছেছে, মডেল সেটি উত্তরে ব্যবহার করতে পারে। অননুমোদিত তথ্য প্রসঙ্গেই যেন না পৌঁছায়।'),
    analogy: {
      text: 'Pre-filter হলো গ্রাহককে শুধু দোকানের সামনের তাকে খুঁজতে দেওয়া; post-filter হলো গুদামসহ সব জায়গা থেকে ৫টি জিনিস এনে তারপর গুদামের জিনিস সরিয়ে নেওয়া—হাতে থাকে কম, আর ভুল হলে গুদামের জিনিসও বেরিয়ে যায়।',
      breaks: 'দোকানে তাক ও গুদাম শারীরিকভাবে আলাদা; সফটওয়্যারে একই সূচিতে সব থাকলে আলাদা রাখার দায়িত্ব পুরোটাই কোডের।',
    },
    worked:
      ol([
        'পুরোনো সূচি: “ঢাকার বাইরে চার্জ” → “… ঢাকার বাইরে ১৩০ টাকা” [policy-delivery, ২০২৬-০৯-০১]।',
        'নথি হালনাগাদ (১৫০, ২০২৬-১০-০১), সূচি নয় → এখনো ১৩০—ভুল, কিন্তু উৎস-চিহ্নসহ!',
        'policy-delivery-এর chunk মুছে নতুন যোগ → ১৫০ [২০২৬-১০-০১]।',
        '“পাইকারি ছাড় কত” (গ্রাহক, shopA): ফিল্টার নেই → প্রথম ফলই staff-wholesale (২০% ছাড়)—ফাঁস। pre-filter → staff নথি কখনো প্রার্থী নয়।',
        '“ডেলিভারি চার্জ কত টাকা”: ফিল্টার নেই → প্রথম ফল অন্য দোকানের (shopB, ১০০ টাকা)—ভুল তথ্য ও ফাঁস; post-filter (k = ২) → মাত্র ১টি ফল বাকি; pre-filter → নিজের দোকানের ২টি ফল।',
      ]),
    activity: note(PRACTICE),
    code: [
      {
        label: 'doc id ধরে সূচি হালনাগাদ',
        starter: KB + TOK + SEARCH + String.raw`
function makeIndex(docs) {
  let chunks = docs.flatMap((d) => chunkDoc(d, 120));
  let search = buildBM25(chunks);
  return {
    upsert(doc) { chunks = chunks.filter((c) => c.doc !== doc.id).concat(chunkDoc(doc, 120)); search = buildBM25(chunks); },
    remove(id) { chunks = chunks.filter((c) => c.doc !== id); search = buildBM25(chunks); },
    top(q) { const r = search(q, 1)[0]; const c = r && chunks.find((x) => x.id === r.id); return c ? c.text.split("। ").find((s) => s.includes("বাইরে") && s.includes("টাকা")) + " [" + c.doc + " | " + c.updated + "]" : "—"; },
    size: () => chunks.length,
  };
}
const publicA = DOCS.filter((d) => d.tenant === "shopA" && d.vis === "public");
const idx = makeIndex(publicA);
const Q = "ঢাকার বাইরে ডেলিভারি চার্জ কত টাকা";
console.log("আগে:", idx.top(Q));

const newDoc = { ...publicA[0], updated: "2026-10-01", text: publicA[0].text.replace("ঢাকার বাইরে ১৩০ টাকা", "ঢাকার বাইরে ১৫০ টাকা") };
console.log("নথি বদলেছে, সূচি নয়:", idx.top(Q));
const before = idx.size();
idx.upsert(newDoc);
console.log("upsert-এর পরে:", idx.top(Q), "| chunk", before, "→", idx.size());
`,
        expect: ['আগে: ডেলিভারি চার্জ ঢাকার ভেতরে ৭০ টাকা এবং ঢাকার বাইরে ১৩০ টাকা। [policy-delivery | 2026-09-01]', 'নথি বদলেছে, সূচি নয়: ডেলিভারি চার্জ ঢাকার ভেতরে ৭০ টাকা এবং ঢাকার বাইরে ১৩০ টাকা।', 'upsert-এর পরে: ডেলিভারি চার্জ ঢাকার ভেতরে ৭০ টাকা এবং ঢাকার বাইরে ১৫০ টাকা। [policy-delivery | 2026-10-01] | chunk 10 → 10'],
        hints: ['upsert-এর পরে chunk-সংখ্যা কেন একই থাকল?', 'upsert-এ <code>filter</code> লাইনটি বাদ দিন—এখন কী হয়? কোন উত্তর আসে, আর chunk-সংখ্যা?', 'remove("faq-payment") করে “বিকাশ” খুঁজুন।'],
        test: 'idx.remove("faq-payment"); __assert(idx.size()===9,"removed");',
      },
      {
        label: 'অনুমতি: ফিল্টার নেই / post-filter / pre-filter',
        starter: KB + TOK + SEARCH + String.raw`
const allChunks = DOCS.flatMap((d) => chunkDoc(d, 120));
const allowed = (u) => (c) => c.tenant === u.tenant && (c.vis === "public" || u.role === "staff");
const user = { tenant: "shopA", role: "customer" }; // সার্ভারের সেশন থেকে, প্রশ্ন থেকে নয়

function noFilter(q, k) { return buildBM25(allChunks)(q, k).map((x) => x.id); }
function postFilter(q, k) { const ok = allowed(user); return buildBM25(allChunks)(q, k).map((x) => allChunks.find((c) => c.id === x.id)).filter(ok).map((c) => c.id); }
function preFilter(q, k) { const mine = allChunks.filter(allowed(user)); return buildBM25(mine)(q, k).map((x) => x.id); }

const questions = ["পাইকারি ছাড় কত", "ডেলিভারি চার্জ কত টাকা"];
for (const q of questions) {
  console.log("প্রশ্ন:", q);
  console.log("  ফিল্টার নেই :", JSON.stringify(noFilter(q, 2)));
  console.log("  post-filter :", JSON.stringify(postFilter(q, 2)));
  console.log("  pre-filter  :", JSON.stringify(preFilter(q, 2)));
}
const leak = (ids) => ids.some((id) => { const c = allChunks.find((x) => x.id === id); return !allowed(user)(c); });
console.log("ফাঁস? ফিল্টার নেই:", questions.some((q) => leak(noFilter(q, 2))), "| post:", questions.some((q) => leak(postFilter(q, 2))), "| pre:", questions.some((q) => leak(preFilter(q, 2))));
`,
        expect: ['ফিল্টার নেই : ["staff-wholesale#1","faq-payment#1"]', 'ফিল্টার নেই : ["shopB-delivery#1","policy-delivery#3"]', 'post-filter : ["policy-delivery#3"]', 'pre-filter  : ["policy-delivery#3","policy-delivery#2"]', 'ফাঁস? ফিল্টার নেই: true | post: false | pre: false'],
        hints: ['“ডেলিভারি চার্জ কত টাকা”-তে ফিল্টার ছাড়া কোন দোকানের নথি এল?', 'post-filter-এ ফলের সংখ্যা pre-filter-এর চেয়ে কম কেন?', 'user.role "staff" করুন—“পাইকারি ছাড় কত”-র pre-filter ফল কী?'],
        test: '__assert(postFilter("ডেলিভারি চার্জ কত টাকা",2).length<preFilter("ডেলিভারি চার্জ কত টাকা",2).length,"post-filter loses"); __assert(!leak(preFilter("পাইকারি ছাড় কত",5)),"pre safe at k5");',
      },
    ],
    line: ul([
      '<code>upsert</code>: আগে ঐ doc-এর সব chunk বাদ, তারপর নতুন যোগ, তারপর সূচি আবার বানানো।',
      'উত্তরের শেষে <code>[doc | updated]</code>—পুরোনো তথ্য চোখে পড়ে।',
      '<code>allowed(u)</code>: tenant মেলাতে হবে এবং public, অথবা ব্যবহারকারী staff।',
      '<code>preFilter</code>: অনুমোদিত chunk দিয়েই সূচি—IDF-ও শুধু নিজের নথি থেকে।',
    ]),
    why: p('প্রতিবার পুরো BM25 আবার বানানো হয়েছে কারণ সংগ্রহ ছোট; বড় সংগ্রহে incremental index (search engine-এর update API) ব্যবহার হয়। pre-filter-এর জন্য এখানে আলাদা সূচি বানানো সবচেয়ে সরল ও নিশ্চিত; বড় সিস্টেমে tenant-প্রতি সূচি বা search engine-এর বাধ্যতামূলক filter query ব্যবহার হয়—উভয় ক্ষেত্রেই ফিল্টার খোঁজার <em>ভেতরে</em>, পরে নয়।'),
    remember: ['নথি বদলালে doc id ধরে upsert', 'উত্তরে হালনাগাদের তারিখ', 'অনুমতি সার্ভার-সেশন থেকে', 'pre-filter; post-filter উত্তর হারায়', 'প্রসঙ্গে পৌঁছানো তথ্য ফাঁস হতে পারে'],
    skip: ['change-data-capture দিয়ে স্বয়ংক্রিয় হালনাগাদ', 'ডকুমেন্ট-স্তরের ACL উত্তরাধিকার', 'IDF-এর মাধ্যমে side-channel বিশ্লেষণ'],
    experiment: p('একটি নথি সম্পূর্ণ মুছে ফেলার পরীক্ষা লিখুন: remove-এর পর ঐ doc-এর কোনো chunk কি খোঁজায় আসে? তারপর ভাবুন: সূচির বাইরে আর কোথায় পুরোনো তথ্য থাকতে পারে (cache, লগ, আগের কথোপকথনের ইতিহাস)?'),
    mistakes: ['নথি বদলে সূচি না বদলানো', 'নতুন chunk যোগ কিন্তু পুরোনো না মোছা', 'top-k-এর পরে অনুমতি-ফিল্টার', 'tenant প্রশ্নের টেক্সট বা মডেলের আউটপুট থেকে নেওয়া', 'prompt-এ “দেখাবে না” লিখে access control ভাবা'],
    quiz: [
      { q: 'নথি হালনাগাদের পরও বট পুরোনো চার্জ বলছে, উৎস-চিহ্নসহ। সম্ভাব্য কারণ?', a: { a: 'মডেল hallucinate করছে', b: 'সূচিতে পুরোনো chunk রয়ে গেছে', c: 'BM25-এর k₁ ভুল' }, ok: 'b', why: 'উৎস-চিহ্ন সঠিক, কিন্তু উৎসের কপিটি পুরোনো।' },
      { q: 'Post-filter-এর প্রধান সমস্যা?', a: { a: 'অননুমোদিত chunk top-k-এর জায়গা নেয়, অনুমোদিত উত্তর বাদ পড়তে পারে', b: 'এটি খুব ধীর', c: 'কোনো সমস্যা নেই' }, ok: 'a', why: 'ফাঁস না হলেও উত্তর হারায়; আর ভুল বাস্তবায়নে ফাঁসও হয়।' },
      { q: 'ব্যবহারকারীর tenant কোথা থেকে নেবেন?', a: { a: 'প্রশ্নের টেক্সট', b: 'সার্ভারের লগইন-সেশন', c: 'মডেলের অনুমান' }, ok: 'b', why: 'ব্যবহারকারী বা মডেল যা লেখে তা বিশ্বাসযোগ্য পরিচয় নয়।' },
    ],
    recap: ['upsert by doc id + তারিখ দেখানো', 'pre-filter, সার্ভার-প্রসঙ্গের অনুমতি', 'প্রসঙ্গে যা যায় তা ফাঁস হতে পারে'],
    nextNote: 'সব অংশ তৈরি। কিন্তু সিস্টেম ভালো কি না—খোঁজা আর উত্তর আলাদা করে মাপব:',
    sources: [SRC.owaspLLM, SRC.rag],
  },
  {
    id: 'les-11-06-retrieval-vs-answer-eval',
    slug: 'retrieval-vs-answer-evaluation',
    title: 'Retrieval-মূল্যায়ন বনাম উত্তর-মূল্যায়ন',
    minutes: 45,
    prereqs: ['les-11-05-updates-access-control', 'les-04-06-metrics'],
    synthetic: true,
    summary: 'লেবেলযুক্ত প্রশ্ন-সেট (প্রাসঙ্গিক নথি, প্রত্যাশিত তথ্য, উত্তরযোগ্য কি না); retrieval: recall@k ও MRR; উত্তর: তথ্য-সঠিকতা, উদ্ধৃতি-সঠিকতা, বিরত-থাকার সঠিকতা; কোথায় ভাঙল তা আলাদা করা।',
    overview: p('“বট ভালো উত্তর দিচ্ছে”—এই অনুভূতি মাপ নয়। RAG দুই ধাপের, তাই ভুলও দুই ধরনের: সঠিক নথি খুঁজেই পাওয়া যায়নি (retrieval-ব্যর্থতা), অথবা পাওয়া গেছে কিন্তু উত্তর ভুল বাক্য বা তথ্য দিয়েছে (উত্তর-ব্যর্থতা)। এক মাপে দুটো মিশে গেলে কোথায় ঠিক করতে হবে বোঝা যায় না। এই পাঠে একটি লেবেলযুক্ত সেট বানাব—উত্তরযোগ্য ও অনুত্তরযোগ্য দুই ধরনের প্রশ্নসহ—এবং দুই স্তরে আলাদা মাপ নেব।'),
    objectives: ['recall@k ও MRR হিসাব করতে পারবেন', 'তথ্য-সঠিকতা, উদ্ধৃতি-সঠিকতা ও বিরত-থাকার সঠিকতা আলাদা মাপতে পারবেন', 'প্রতিটি ব্যর্থতাকে retrieval বা উত্তর-ধাপে চিহ্নিত করতে পারবেন'],
    problem: p('১০টি প্রশ্নে বটের উত্তর দেখে মালিক বললেন “৭টা ঠিক”। কিন্তু ৩টি ভুলের মধ্যে কোনটায় নথি খোঁজাই ভুল হয়েছিল, কোনটায় ঠিক নথি পেয়েও ভুল বাক্য বেছেছে, আর কোনটায় উত্তর না দেওয়া উচিত ছিল কিন্তু দিয়েছে? প্রতিটির সমাধান আলাদা।'),
    explain:
      p(`<strong>Retrieval-মাপ:</strong> ${term('রিকল@কে', 'recall@k')} = প্রথম k ফলে অন্তত একটি প্রাসঙ্গিক নথি আছে এমন প্রশ্নের অনুপাত (প্রতি প্রশ্নে একটি প্রাসঙ্গিক নথি হলে)। ${term('এমআরআর', 'MRR')} = প্রথম প্রাসঙ্গিক ফলের অবস্থান r হলে ১/r-এর গড় (না পেলে ০)—ওপরে থাকাকে পুরস্কার দেয়।`) +
      p('<strong>উত্তর-মাপ:</strong> (১) তথ্য-সঠিকতা—উত্তরে প্রত্যাশিত মূল তথ্য (যেমন “৫ কর্মদিবস”) আছে কি; (২) উদ্ধৃতি-সঠিকতা—উল্লেখিত উৎস প্রাসঙ্গিক নথির এবং উদ্ধৃতি উৎসে আছে কি; (৩) বিরত-থাকা—অনুত্তরযোগ্য প্রশ্নে বিরত থাকল কি, আর উত্তরযোগ্য প্রশ্নে অকারণে বিরত থাকল কি।') +
      p('<strong>ব্যর্থতা-বিশ্লেষণ:</strong> প্রতিটি ভুল প্রশ্নের জন্য: retrieval-এ প্রাসঙ্গিক নথি top-k-এ ছিল? না থাকলে retrieval ঠিক করুন (chunking, hybrid, প্রতিশব্দ)। থাকলে উত্তর-ধাপ (rerank, সীমা, prompt)। RAGAS-এর মতো কাঠামো এই বিভাজন আরও সূক্ষ্মভাবে করে, প্রায়ই LLM-বিচারক দিয়ে—যার নিজেরও যাচাই দরকার।') +
      warn('এই সেট ছোট ও সিন্থেটিক—এর সংখ্যা শুধু পদ্ধতি দেখায়, কোনো সিস্টেমের মান নয়। বাস্তবে আসল (গোপনীয়তা রক্ষা করে সংগৃহীত) প্রশ্ন থেকে বড় সেট বানান এবং নথি বদলালে সেটও হালনাগাদ করুন।'),
    analogy: {
      text: 'রান্নার ভুল খোঁজা: বাজার থেকে ভুল উপকরণ এসেছিল (retrieval), নাকি সঠিক উপকরণে ভুল রান্না (উত্তর)? শুধু “খেতে খারাপ” বললে কাকে ঠিক করতে হবে বোঝা যায় না।',
      breaks: 'রান্নায় উপকরণ দেখলেই বোঝা যায়; RAG-এ “সঠিক নথি এসেছিল কি না” জানতে আগে থেকে প্রতিটি প্রশ্নের প্রাসঙ্গিক নথি লেবেল করে রাখতে হয়।',
    },
    worked:
      p('৪টি প্রশ্ন, প্রথম প্রাসঙ্গিক ফলের অবস্থান: ১, ৩, পাওয়া যায়নি, ১।') +
      ol([
        'recall@১ = ২/৪ = ০.৫; recall@৩ = ৩/৪ = ০.৭৫।',
        'MRR = (১ + ১/৩ + ০ + ১)/৪ ≈ ০.৫৮৩।',
        'তৃতীয় প্রশ্নের উত্তর ভুল হলে → retrieval-ব্যর্থতা; দ্বিতীয়টির উত্তর ভুল হলে → সম্ভবত উত্তর-ধাপ (নথি ৩-এ ছিল)।',
      ]),
    activity: note(PRACTICE),
    code: [
      {
        label: 'দুই স্তরের মূল্যায়ন ও ব্যর্থতা-বিশ্লেষণ',
        starter: KB + TOK + SEARCH + String.raw`
const r3 = (x) => Math.round(x * 1000) / 1000;
const chunks = DOCS.filter((d) => d.tenant === "shopA" && d.vis === "public").flatMap((d) => chunkDoc(d, 120));
const byId = new Map(chunks.map((c) => [c.id, c]));
const bm25 = buildBM25(chunks), vec = buildVector(chunks);
const retrieve = (q) => rrf([bm25(q, 6), vec(q, 6)], 60, 6).map((x) => x.id);
function answer(q) {
  const cand = retrieve(q).map((id) => byId.get(id));
  const tq = trigrams(q);
  let best = null;
  for (const c of cand) for (const s of sentences(c.text)) { const sc = cosMap(tq, trigrams(s)); if (!best || sc > best.score) best = { s, id: c.id, score: sc }; }
  return best && best.score >= 0.3 ? { text: best.s, cite: best.id } : { text: null, cite: null };
}
// সিন্থেটিক লেবেলযুক্ত সেট: rel = প্রাসঙ্গিক নথি; fact = উত্তরে থাকা উচিত; rel null = অনুত্তরযোগ্য
const EVAL = [
  { q: "টাকা ফেরত কত দিনে পাব", rel: "policy-return", fact: "৫ কর্মদিবস" },
  { q: "ঢাকার বাইরে ডেলিভারি কত দিনে", rel: "policy-delivery", fact: "৩ থেকে ৫" },
  { q: "নগদে মূল্য পরিশোধ করা যায়?", rel: "faq-payment", fact: "নগদ" },
  { q: "শাড়ি কত হাত লম্বা", rel: "faq-size", fact: "৬ হাত" },
  { q: "লন থ্রি-পিস মেশিনে ধোয়া যায়?", rel: "prod-threepiece", fact: "মেশিনে ধোয়া যায়" },
  { q: "ত্রুটিপূর্ণ পণ্যের ফেরত খরচ কে দেয়", rel: "policy-return", fact: "দোকান বহন করে" },
  { q: "দৈর্ঘ্য কেমন শাড়ির", rel: "faq-size", fact: "৬ হাত" },
  { q: "কাল দোকান খোলা থাকবে?", rel: null },
  { q: "গিফট র‍্যাপিং করা যায়?", rel: null },
];
const K = 3;
let rec = 0, mrr = 0, answerable = 0, factOk = 0, citeOk = 0, abstainOk = 0, unanswerable = 0, falseAbstain = 0;
const failures = [];
for (const e of EVAL) {
  const a = answer(e.q);
  if (e.rel === null) { unanswerable++; if (a.text === null) abstainOk++; else failures.push("«" + e.q + "» বিরত থাকা উচিত ছিল, উত্তর: " + a.text); continue; }
  answerable++;
  const docs = retrieve(e.q).map((id) => id.split("#")[0]);
  const r = docs.indexOf(e.rel);
  if (r >= 0 && r < K) rec++;
  if (r >= 0) mrr += 1 / (r + 1);
  if (a.text === null) { falseAbstain++; failures.push("«" + e.q + "» অকারণে বিরত (retrieval অবস্থান " + (r + 1) + ")"); continue; }
  const fOk = a.text.includes(e.fact), cOk = a.cite.split("#")[0] === e.rel && byId.get(a.cite).text.includes(a.text);
  if (fOk) factOk++; if (cOk) citeOk++;
  if (!fOk || !cOk) failures.push("«" + e.q + "» " + (r >= 0 && r < K ? "উত্তর-ধাপ" : "retrieval") + " ব্যর্থ: " + a.text + " [" + a.cite + "]");
}
console.log("retrieval: recall@" + K, r3(rec / answerable), "| MRR", r3(mrr / answerable));
console.log("উত্তর: তথ্য", factOk + "/" + answerable, "| উদ্ধৃতি", citeOk + "/" + answerable, "| অকারণে বিরত", falseAbstain, "| সঠিক বিরত", abstainOk + "/" + unanswerable);
failures.forEach((f) => console.log("ব্যর্থ:", f));
`,
        expect: ['retrieval: recall@3 1 | MRR 0.929', 'উত্তর: তথ্য 5/7 | উদ্ধৃতি 5/7 | অকারণে বিরত 2 | সঠিক বিরত 1/2', 'ব্যর্থ: «টাকা ফেরত কত দিনে পাব» অকারণে বিরত (retrieval অবস্থান 1)', 'ব্যর্থ: «দৈর্ঘ্য কেমন শাড়ির» অকারণে বিরত (retrieval অবস্থান 2)', 'ব্যর্থ: «গিফট র‍্যাপিং করা যায়?» বিরত থাকা উচিত ছিল, উত্তর: মাপ না মিললে বদল করা যায়।'],
        hints: ['কোন ব্যর্থতা retrieval-এর আর কোনটা উত্তর-ধাপের? দুটোর সমাধান কীভাবে আলাদা?', 'THRESHOLD (০.৩) বাড়ালে-কমালে “সঠিক বিরত” ও “অকারণে বিরত”—কোনটা কোন দিকে যায়?', 'একটি প্রশ্ন যোগ করুন যেখানে উত্তর দুই নথি মিলিয়ে দিতে হয় (“বিকাশে টাকা ফেরত কত দিনে”)—আমাদের extractive উত্তর কি পারবে?'],
        test: '__assert(rec===answerable,"retrieval perfect here"); __assert(falseAbstain===2&&abstainOk===1,"answer-stage failures");',
      },
    ],
    solutionNote: p('QuickJS-এ চালানো ফল: retrieval নিখুঁত—৭টি উত্তরযোগ্য প্রশ্নের সবকটিতে প্রাসঙ্গিক নথি প্রথম ৩-এ (recall@৩ = ১, MRR ≈ ০.৯২৯)। তবুও ৩টি ব্যর্থতা, <em>সবকটি উত্তর-ধাপের</em>: দুটি উত্তরযোগ্য প্রশ্নে অকারণে বিরত (সেরা বাক্যের trigram-মিল ০.৩-এর নিচে, যদিও সঠিক নথি প্রথম বা দ্বিতীয়), আর “গিফট র‍্যাপিং করা যায়?”-তে বিরত না থেকে অপ্রাসঙ্গিক বাক্য “মাপ না মিললে বদল করা যায়।”—শুধু “করা যায়” অংশের বানান-মিলে। শুধু চূড়ান্ত উত্তর দেখলে মনে হতো “খোঁজা খারাপ”; দুই স্তরে মাপায় বোঝা গেল সমস্যা বাক্য-বাছাই ও সীমায়। একটি সীমা বদলে দুটি ভুল একসাথে ঠিক হয় না—সীমা কমালে অকারণে বিরত কমে, কিন্তু ভুল উত্তর বাড়ে।'),
    line: ul([
      '<code>EVAL</code>: প্রতিটি প্রশ্নে প্রাসঙ্গিক নথি ও প্রত্যাশিত তথ্য—মানুষের দেওয়া লেবেল; <code>rel: null</code> = অনুত্তরযোগ্য।',
      'retrieval-মাপ উত্তর থেকে আলাদা: <code>retrieve</code>-এর তালিকায় প্রাসঙ্গিক নথির অবস্থান।',
      '<code>cOk</code>: উদ্ধৃতি প্রাসঙ্গিক নথির <em>এবং</em> উদ্ধৃত বাক্য সেই chunk-এ আছে।',
      '<code>failures</code>: প্রতিটি ভুলের সাথে কোন ধাপে ভাঙল—এটাই সবচেয়ে কাজের আউটপুট।',
    ]),
    why: p('তথ্য-সঠিকতা একটি সরল substring-পরীক্ষা—extractive উত্তরের জন্য যথেষ্ট, কিন্তু paraphrase-করা LLM উত্তরে দুর্বল (“পাঁচ কর্মদিবস” বনাম “৫ কর্মদিবস”)। সেখানে একাধিক গ্রহণযোগ্য রূপ, মানুষের মূল্যায়ন, বা যাচাই-করা LLM-বিচারক লাগে। অনুত্তরযোগ্য প্রশ্ন সেটে ইচ্ছাকৃতভাবে রাখা হয়েছে, কারণ “সবসময় উত্তর দেওয়া” সিস্টেম শুধু উত্তরযোগ্য প্রশ্নে মাপলে ভালো দেখায়।'),
    remember: ['retrieval ও উত্তর আলাদা মাপুন', 'recall@k, MRR', 'তথ্য, উদ্ধৃতি, বিরত-থাকা', 'অনুত্তরযোগ্য প্রশ্ন সেটে রাখুন', 'প্রতিটি ভুলের ধাপ চিহ্নিত করুন'],
    skip: ['nDCG ও graded relevance', 'LLM-as-judge-এর যাচাই', 'পরিসংখ্যানগত তাৎপর্য (অধ্যায় ১৪)'],
    experiment: p('retrieve-এ শুধু BM25 ব্যবহার করুন (hybrid নয়) এবং মূল্যায়ন আবার চালান। কোন মাপ বদলায়—retrieval, উত্তর, নাকি দুটোই? এক পরিবর্তনের প্রভাব দুই স্তরে আলাদা দেখা যায় কি?'),
    mistakes: ['শুধু চূড়ান্ত উত্তর দেখে মূল্যায়ন', 'অনুত্তরযোগ্য প্রশ্ন বাদ রাখা', 'উৎস-চিহ্নের উপস্থিতিকে উদ্ধৃতি-সঠিকতা ভাবা', 'ছোট সিন্থেটিক সেটের সংখ্যা সাধারণীকরণ'],
    quiz: [
      { q: 'প্রথম প্রাসঙ্গিক ফলের অবস্থান ১, ২, পাওয়া যায়নি—MRR?', a: { a: '০.৫', b: '(১ + ০.৫ + ০)/৩ = ০.৫', c: '(১ + ০.৫)/২ = ০.৭৫' }, ok: 'b', why: 'না-পাওয়া প্রশ্নও গড়ে থাকে, মান ০।' },
      { q: 'সঠিক নথি top-৩-এ ছিল কিন্তু উত্তর ভুল—কোন ধাপে মনোযোগ?', a: { a: 'retrieval', b: 'উত্তর-ধাপ (rerank, সীমা, উত্তর-তৈরি)', c: 'chunking' }, ok: 'b', why: 'খোঁজা কাজ করেছে; বাছাই বা উত্তর-তৈরি ভুল।' },
      { q: '“কাল দোকান খোলা?”-র মতো প্রশ্ন সেটে রাখার কারণ?', a: { a: 'বিরত থাকার ক্ষমতা মাপতে', b: 'accuracy বাড়াতে', c: 'retrieval দ্রুত করতে' }, ok: 'a', why: 'নইলে বানিয়ে উত্তর দেওয়ার প্রবণতা ধরা পড়ে না।' },
    ],
    recap: ['দুই স্তর, আলাদা মাপ', 'ব্যর্থতা ধাপ অনুযায়ী ভাগ', 'বিরত থাকাও মাপুন'],
    nextNote: 'প্রজেক্ট: সব একসাথে—পণ্য-জ্ঞান সহকারী, যেখানে দাম ও স্টক কখনো বানানো হয় না।',
    sources: [SRC.ragas, SRC.sklearnEval, SRC.rag],
  },
  {
    id: 'les-11-07-project-product-assistant',
    slug: 'project-bangla-product-knowledge-assistant',
    title: 'প্রজেক্ট: বাংলা পণ্য-জ্ঞান সহকারী',
    minutes: 60,
    prereqs: ['les-11-06-retrieval-vs-answer-eval'],
    synthetic: true,
    summary: 'দাম ও স্টক কাঠামোবদ্ধ রেকর্ড থেকে (টেক্সট থেকে নয়); নীতি ও পণ্য-তথ্য RAG থেকে উৎসসহ; অনুমোদিত tenant-এর তথ্যই; রেকর্ড বা নথি না থাকলে স্পষ্ট “তথ্য নেই”; উত্তরের ধরন, তথ্য ও উদ্ধৃতি—তিন স্তরে মূল্যায়ন।',
    overview: p('এই প্রজেক্টে একটি সহকারী বানাব যা দুই ধরনের প্রশ্ন আলাদাভাবে সামলায়। (১) <strong>দাম ও স্টক</strong>—দ্রুত বদলায় ও ভুল হলে ক্ষতি, তাই এগুলো শুধু দোকানের কাঠামোবদ্ধ পণ্য-রেকর্ড থেকে, নির্দিষ্ট পণ্য চিহ্নিত হলে তবেই। (২) <strong>নীতি ও পণ্যের বর্ণনা</strong>—নথি থেকে RAG, উৎস ও তারিখসহ। পণ্য চেনা না গেলে, রেকর্ড না থাকলে বা নথিতে উত্তর না থাকলে সহকারী বানিয়ে বলে না—স্পষ্টভাবে জানায়। সব ডেটা সিন্থেটিক; উত্তর extractive ও টেমপ্লেট-ভিত্তিক, কোনো LLM নয়।'),
    objectives: ['প্রশ্নকে রেকর্ড-অনুসন্ধান ও নথি-অনুসন্ধানে ভাগ করতে পারবেন', 'দাম/স্টক শুধু অনুমোদিত রেকর্ড থেকে দিতে ও অনুপস্থিতি জানাতে পারবেন', 'উত্তরের ধরন, তথ্য ও উদ্ধৃতি মিলিয়ে একটি মূল্যায়ন-স্যুট চালাতে পারবেন'],
    problem: p('গ্রাহকেরা জিজ্ঞেস করেন: “নীল সুতি শাড়ির দাম কত?”, “লন থ্রি-পিস স্টকে আছে?”, “সিল্ক শাড়ি আছে?” (দোকানে নেই), “ফেরত কত দিনের মধ্যে?”। মডেল-ভিত্তিক সহকারী প্রায়ই সাবলীলভাবে একটি দাম বলে দেয়—যা হয়তো কোনো নথিতেই নেই। কীভাবে নিশ্চিত করবেন যে প্রতিটি সংখ্যা যাচাই-করা উৎস থেকে আসে?'),
    explain:
      p('<strong>নকশা:</strong> <code>route(q)</code> → “দাম/স্টক” শব্দ থাকলে রেকর্ড-পথ, নইলে নথি-পথ। রেকর্ড-পথ: পণ্যের নাম trigram-মিলে খুঁজুন (একটি সীমার ওপরে, এবং শুধু ব্যবহারকারীর tenant-এর রেকর্ডে); না মিললে “এই নামে পণ্য খুঁজে পাইনি”। মিললে টেমপ্লেটে রেকর্ডের মান বসান, উৎস = <code>record:SKU</code> ও রেকর্ডের হালনাগাদ-সময়।') +
      p('<strong>স্টক = ০ ও অনুপস্থিত মান:</strong> স্টক ০ হলে “এখন স্টকে নেই”; রেকর্ডে দাম না থাকলে (null) “দাম এখন নিশ্চিত নয়, যাচাই করে জানাচ্ছি”—কখনো অনুমান নয়।') +
      p('<strong>নথি-পথ:</strong> পাঠ ১১.৪-এর retrieve → rerank → extractive উত্তর → উৎস-যাচাই, pre-filter-সহ (পাঠ ১১.৫)।') +
      p('<strong>মূল্যায়ন-স্যুট:</strong> প্রতিটি কেসে প্রত্যাশিত <code>kind</code> (price, stock, not_found, doc, abstain), থাকলে প্রত্যাশিত তথ্য, এবং প্রত্যাশিত উৎস। সাথে একটি নিরাপত্তা-পরীক্ষা: কোনো উত্তরে এমন টাকার অঙ্ক আছে কি যা রেকর্ড বা উদ্ধৃত নথিতে নেই?') +
      warn('দোকান, পণ্য, দাম, স্টক ও নীতি—সব কাল্পনিক। আসল দোকানে রেকর্ড আসবে WooCommerce-এর মতো সিস্টেম থেকে, সার্ভার-সাইড, লগইন ও অনুমতি যাচাই করে।'),
    analogy: {
      text: 'অভিজ্ঞ বিক্রয়কর্মী নীতির প্রশ্নে নিয়মপুস্তিকার পাতা দেখান, কিন্তু দাম ও স্টকের প্রশ্নে কম্পিউটারে আজকের হিসাব দেখে বলেন—স্মৃতি থেকে নয়।',
      breaks: 'কর্মী জানেন কোন প্রশ্ন কোন ধরনের; আমাদের route একটি সরল শব্দ-নিয়ম, যা “কত টাকা লাগবে ডেলিভারিতে”-কে দামের প্রশ্ন ভাবতে পারে—মূল্যায়ন-সেটে এমন কেস রাখতে হয়।',
    },
    worked:
      ol([
        '“নীল সুতি শাড়ির দাম কত?” → রেকর্ড-পথ → SKU SAREE-BLUE মিলল → “দাম ১,২০০ টাকা [record:SAREE-BLUE]” (সিন্থেটিক)।',
        '“লন থ্রি-পিস স্টকে আছে?” → রেকর্ড-পথ → স্টক ০ → “এখন স্টকে নেই”।',
        '“সিল্ক শাড়ির দাম কত?” → কোনো রেকর্ড সীমার ওপরে মেলে না → “এই নামে পণ্য খুঁজে পাইনি”—দাম বানানো নয়।',
        '“ফেরত কত দিনের মধ্যে করা যায়?” → নথি-পথ → ফেরত নীতির বাক্য + উৎস।',
        '“অন্য দোকানের ডেলিভারি চার্জ” ধরনের তথ্য pre-filter-এর কারণে প্রার্থীই নয়।',
      ]),
    activity: note(PRACTICE + ' টাকার অঙ্ক এখানে ইংরেজি অঙ্কে লেখা, কারণ QuickJS-এ Intl নেই; কমা নিজে বসানো হয়েছে।'),
    code: [
      {
        label: 'সহকারী ও মূল্যায়ন-স্যুট',
        starter: KB + TOK + SEARCH + String.raw`
// সিন্থেটিক কাঠামোবদ্ধ রেকর্ড (সত্যের উৎস দাম ও স্টকের জন্য)
const PRODUCTS = [
  { sku: "SAREE-BLUE", tenant: "shopA", name: "নীল সুতি শাড়ি", price: 1200, stock: 8, updated: "2026-10-15 10:00" },
  { sku: "LAWN-3PC", tenant: "shopA", name: "লন থ্রি-পিস", price: 1850, stock: 0, updated: "2026-10-15 10:00" },
  { sku: "SCARF-RED", tenant: "shopA", name: "লাল সুতি ওড়না", price: null, stock: 5, updated: "2026-10-14 18:30" },
  { sku: "B-SAREE-SILK", tenant: "shopB", name: "সিল্ক শাড়ি", price: 5400, stock: 3, updated: "2026-10-15 09:00" },
];
const user = { tenant: "shopA", role: "customer" };
const money = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " টাকা";
const chunks = DOCS.filter((d) => d.tenant === user.tenant && d.vis === "public").flatMap((d) => chunkDoc(d, 120));
const byId = new Map(chunks.map((c) => [c.id, c]));
const bm25 = buildBM25(chunks), vec = buildVector(chunks);

function findProduct(q) {
  const tq = trigrams(q);
  const mine = PRODUCTS.filter((p) => p.tenant === user.tenant);
  const scored = mine.map((p) => ({ p, s: cosMap(tq, trigrams(p.name)) })).sort((a, b) => b.s - a.s);
  return scored[0] && scored[0].s >= 0.35 ? scored[0].p : null;
}
function assistant(q) {
  const wantsPrice = /দাম|কত টাকা|মূল্য কত/.test(q), wantsStock = /স্টক|আছে কি|পাওয়া যাবে/.test(q) && !wantsPrice;
  if (wantsPrice || wantsStock) {
    const p = findProduct(q);
    if (!p) return { kind: "not_found", text: "এই নামে কোনো পণ্য আমাদের তালিকায় খুঁজে পাইনি। নামটি আবার লিখবেন, বা একজন প্রতিনিধি জানাবেন।", source: null };
    if (wantsStock) return { kind: "stock", text: p.stock > 0 ? p.name + " — স্টকে আছে (" + p.stock + "টি)।" : p.name + " — এখন স্টকে নেই।", source: "record:" + p.sku + " | " + p.updated };
    if (p.price == null) return { kind: "price_unknown", text: p.name + " — দাম এখন নিশ্চিত নয়; যাচাই করে জানাচ্ছি।", source: "record:" + p.sku + " | " + p.updated };
    return { kind: "price", text: p.name + " — দাম " + money(p.price) + "।", source: "record:" + p.sku + " | " + p.updated };
  }
  const cand = rrf([bm25(q, 6), vec(q, 6)], 60, 6).map((x) => byId.get(x.id));
  const tq = trigrams(q);
  let best = null;
  for (const c of cand) for (const s of sentences(c.text)) { const sc = cosMap(tq, trigrams(s)); if (!best || sc > best.score) best = { s, c, score: sc }; }
  if (!best || best.score < 0.3) return { kind: "abstain", text: "এই বিষয়ে আমাদের নথিতে তথ্য পাইনি; একজন প্রতিনিধি জানাবেন।", source: null };
  return { kind: "doc", text: best.s, source: best.c.id + " | " + best.c.updated };
}

const SUITE = [
  { q: "নীল সুতি শাড়ির দাম কত?", kind: "price", fact: "1,200 টাকা", src: "record:SAREE-BLUE" },
  { q: "লন থ্রি-পিস স্টকে আছে?", kind: "stock", fact: "স্টকে নেই", src: "record:LAWN-3PC" },
  { q: "লাল ওড়নার দাম কত?", kind: "price_unknown", fact: "নিশ্চিত নয়", src: "record:SCARF-RED" },
  { q: "সিল্ক শাড়ির দাম কত?", kind: "not_found" },
  { q: "ফেরত কত দিনের মধ্যে করা যায়?", kind: "doc", fact: "৭ দিনের মধ্যে", src: "policy-return" },
  { q: "বিকাশে মূল্য পরিশোধ করা যায়?", kind: "doc", fact: "বিকাশ", src: "faq-payment" },
  { q: "শাড়ির রং কি পাকা?", kind: "doc", fact: "রং পাকা", src: "prod-saree-blue" },
  { q: "দোকান কয়টায় খোলে?", kind: "abstain" },
];
let pass = 0;
for (const t of SUITE) {
  const r = assistant(t.q);
  const okKind = r.kind === t.kind, okFact = !t.fact || r.text.includes(t.fact), okSrc = !t.src || (r.source || "").startsWith(t.src);
  const ok = okKind && okFact && okSrc;
  if (ok) pass++;
  console.log(ok ? "✓" : "✗", t.q, "→", r.kind, "|", r.text, r.source ? "[" + r.source + "]" : "");
}
console.log("স্যুট:", pass + "/" + SUITE.length);
// নিরাপত্তা: উত্তরের প্রতিটি টাকার অঙ্ক কি রেকর্ড বা উদ্ধৃত নথিতে আছে?
const invented = SUITE.map((t) => assistant(t.q)).filter((r) => {
  const amounts = (r.text.match(/[0-9০-৯][0-9০-৯,]*\s*টাকা/g) || []);
  return amounts.some((a) => { const n = a.replace(/[^0-9]/g, ""); const recOk = PRODUCTS.some((p) => p.tenant === user.tenant && String(p.price) === n); const docOk = r.source && byId.has(r.source.split(" | ")[0]) && byId.get(r.source.split(" | ")[0]).text.includes(a); return !recOk && !docOk; });
});
console.log("বানানো টাকার অঙ্ক:", invented.length, "| অন্য দোকানের পণ্য উত্তরে:", SUITE.some((t) => (assistant(t.q).source || "").indexOf("B-") >= 0));
`,
        expect: ['✓ নীল সুতি শাড়ির দাম কত? → price | নীল সুতি শাড়ি — দাম 1,200 টাকা। [record:SAREE-BLUE | 2026-10-15 10:00]', '✓ লন থ্রি-পিস স্টকে আছে? → stock | লন থ্রি-পিস — এখন স্টকে নেই।', '✓ সিল্ক শাড়ির দাম কত? → not_found', '✓ দোকান কয়টায় খোলে? → abstain', 'স্যুট: 8/8', 'বানানো টাকার অঙ্ক: 0 | অন্য দোকানের পণ্য উত্তরে: false'],
        hints: ['“সিল্ক শাড়ির দাম কত?”-তে shopB-র রেকর্ড কেন এল না, যদিও নাম হুবহু মেলে?', 'findProduct-এর সীমা ০.৩৫ থেকে ০.১ করুন—“সিল্ক শাড়ি” কোন পণ্যের সাথে মিলে যায়? সেটি কেন বিপজ্জনক?', '“ঢাকার বাইরে ডেলিভারিতে কত টাকা লাগে?” যোগ করুন। route কোন পথে পাঠায়? ঠিক করতে কী করবেন?'],
        test: '__assert(pass===SUITE.length,"suite"); __assert(invented.length===0,"no invented amounts"); __assert(assistant("ঢাকার বাইরে ডেলিভারিতে কত টাকা লাগে?").kind==="not_found","known routing gap");',
      },
    ],
    solutionNote: p('QuickJS-এ চালানো ফল: স্যুট ৮/৮, কোনো বানানো টাকার অঙ্ক নেই, অন্য দোকানের কোনো রেকর্ড উত্তরে আসেনি। “সিল্ক শাড়ি” shopB-র রেকর্ডের সাথে ০.৭১২ মেলে, কিন্তু tenant-ফিল্টারের কারণে সেটি প্রার্থীই নয়; shopA-র নীল সুতি শাড়ির সাথে মিল ০.২৮৯, সীমা ০.৩৫-এর নিচে, তাই “খুঁজে পাইনি”। সীমা ০.১ করলে এই প্রশ্নে নীল সুতি শাড়ির দাম চলে আসে—একটি ভুল পণ্যের সঠিক দাম, যা বানানো দামের মতোই ক্ষতিকর। পরিচিত দুর্বলতা (পরীক্ষায় পিন করা): “ঢাকার বাইরে ডেলিভারিতে কত টাকা লাগে?” route-এ “কত টাকা” দেখে দামের পথে যায় এবং not_found দেয়—ভুল তথ্য নয়, কিন্তু অসহায় উত্তর। স্যুট ৮/৮ হলেও সহকারী সম্পূর্ণ নয়; স্যুট যত বড় ও বৈচিত্র্যময়, সংখ্যাটি তত অর্থবহ।'),
    line: ul([
      '<code>PRODUCTS</code>: দাম/স্টকের একমাত্র উৎস; <code>price: null</code> = অজানা, ০ নয়।',
      '<code>findProduct</code>: শুধু ব্যবহারকারীর tenant-এর রেকর্ড, এবং মিল সীমার ওপরে হলে।',
      '<code>assistant</code>: রেকর্ড-পথ ও নথি-পথ আলাদা; প্রতিটি উত্তরে <code>kind</code> ও <code>source</code>।',
      '<code>money</code>: regex দিয়ে হাজারের কমা (QuickJS-এ Intl নেই)।',
      '<code>invented</code>: উত্তরের প্রতিটি টাকার অঙ্ক রেকর্ড বা উদ্ধৃত নথিতে আছে কি—নিয়ম কোডে পরীক্ষিত।',
    ]),
    why: p('দাম ও স্টকের জন্য RAG নয়, সরাসরি রেকর্ড—কারণ এগুলো কাঠামোবদ্ধ, ঘন ঘন বদলায়, আর টেক্সট-খোঁজা ভুল পণ্যের দাম আনতে পারে। route-কে শব্দ-নিয়মে রাখা হয়েছে যাতে আচরণ সম্পূর্ণ দেখা যায়; বাস্তবে এটি অধ্যায় ১০-এর মতো একটি schema-যাচাই-করা শ্রেণিবিন্যাস বা tool call হতে পারে—কিন্তু রেকর্ড-অনুসন্ধান ও অনুমতি তখনও কোডেই থাকবে।'),
    remember: ['দাম/স্টক রেকর্ড থেকে, টেক্সট থেকে নয়', 'অজানা = null, ০ নয়', 'না পেলে বলুন, বানাবেন না', 'tenant-ফিল্টার রেকর্ডেও', 'ধরন + তথ্য + উৎস একসাথে মাপুন'],
    skip: ['WooCommerce REST থেকে রেকর্ড আনা', 'বহু-পণ্য প্রশ্ন (“দুটোর দাম”)', 'ছবি দিয়ে পণ্য খোঁজা'],
    experiment: p('SUITE-এ পাঁচটি কঠিন কেস যোগ করুন: বানান-ভুল নাম (“নিল সুতি শারি”), দুই পণ্য একসাথে, ইংরেজি নাম (“blue saree price”), দাম ও ফেরত একসাথে, এবং অন্য দোকানের পণ্যের নাম। কতগুলো পাস করে? প্রতিটি ব্যর্থতা কোন ধাপে?'),
    mistakes: ['দাম/স্টক নথি-খোঁজা থেকে দেওয়া', 'পণ্য চেনা না গেলে কাছাকাছি পণ্যের দাম বলা', 'null দামকে ০ দেখানো', 'রেকর্ড-অনুসন্ধানে tenant-ফিল্টার ভুলে যাওয়া', 'শুধু “উত্তর এসেছে কি না” মাপা'],
    quiz: [
      { q: 'দাম কেন RAG-নথি থেকে নয়, রেকর্ড থেকে?', a: { a: 'রেকর্ড কাঠামোবদ্ধ, হালনাগাদ, নির্দিষ্ট SKU-র', b: 'নথিতে সংখ্যা লেখা যায় না', c: 'RAG দাম পড়তে পারে না' }, ok: 'a', why: 'টেক্সট-খোঁজা ভুল পণ্য বা পুরোনো দাম আনতে পারে।' },
      { q: '“সিল্ক শাড়ি” shopB-তে আছে, ব্যবহারকারী shopA-র। সঠিক উত্তর?', a: { a: 'shopB-র দাম', b: '“এই নামে পণ্য খুঁজে পাইনি”', c: 'কাছাকাছি shopA পণ্যের দাম' }, ok: 'b', why: 'অন্য tenant-এর রেকর্ড অননুমোদিত; কাছাকাছি পণ্যের দাম বলা ভুল তথ্য।' },
      { q: 'রেকর্ডে price null হলে?', a: { a: '০ টাকা বলা', b: '“দাম নিশ্চিত নয়, যাচাই করে জানাচ্ছি”', c: 'গড় দাম বলা' }, ok: 'b', why: 'অজানা মানকে কোনো সংখ্যা দিয়ে ভরানো যায় না।' },
    ],
    recap: ['দুই পথ: রেকর্ড ও নথি', 'অনুপস্থিতি স্পষ্টভাবে জানানো', 'স্যুট: ধরন, তথ্য, উৎস, বানানো অঙ্ক'],
    nextNote: 'সহকারী উত্তর দিতে পারে। পরের অধ্যায়ে সে কাজও করবে—কয়েক ধাপের workflow ও agent, সিমুলেটেড টুল ও মানুষের অনুমোদনসহ।',
    sources: [SRC.rag, SRC.ragas, SRC.owaspLLM],
  },
];

export default { chapter, lessons };

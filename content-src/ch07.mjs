import { p, ul, ol, code, out, note, warn, table, term, SRC } from './lib.mjs';

const chapter = {
  id: 'ch-07-embeddings',
  slug: 'embedding',
  title: 'Embeddings ও Semantic Search',
  order: 7,
  public: false,
  summary: 'One-hot বনাম dense embedding; embedding lookup; co-occurrence ও PPMI; skip-gram দিয়ে embedding শেখা; vector গাণিতিক ও তার সীমা; bias; cosine দিয়ে semantic search ও threshold।',
  overview: p(
    'n-gram মডেলে “দাম” ও “মূল্য” সম্পূর্ণ আলাদা প্রতীক—একটির সম্পর্কে শেখা অন্যটিতে যায় না। Embedding প্রতিটি token-কে একটি ছোট dense vector দেয়, এবং একই প্রসঙ্গে আসা শব্দের vector কাছাকাছি হয়। এই অধ্যায়ে one-hot থেকে embedding lookup, গণনা-ভিত্তিক co-occurrence vector, এবং JavaScript-এ একটি ছোট skip-gram মডেল train করব যা নিজে থেকে “দাম ≈ মূল্য” শেখে। তারপর vector গাণিতিকের আকর্ষণ ও বিপদ (bias), এবং cosine similarity দিয়ে semantic search।',
    'প্রজেক্ট: হাতে-বানানো, স্পষ্টভাবে চিহ্নিত teaching vector দিয়ে বাংলা পণ্য-সার্চ, keyword search-এর সাথে তুলনা ও recall@k মূল্যায়নসহ।'
  ),
};

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
const COS = String.raw`const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const norm = (a) => Math.sqrt(dot(a, a));
const cosine = (a, b) => (norm(a) === 0 || norm(b) === 0 ? null : dot(a, b) / (norm(a) * norm(b)));
const r3 = (x) => (x === null ? "—" : Math.round(x * 1000) / 1000);
`;

const lessons = [
  {
    id: 'les-07-01-onehot-embedding',
    synthetic: true,
    slug: 'one-hot-embedding-lookup',
    title: 'One-hot থেকে Embedding Lookup',
    minutes: 30,
    prereqs: ['les-06-06-project-ngram-predictor', 'les-03-02-dot-product-similarity'],
    summary: 'one-hot vector-এ সব শব্দ সমান দূরে; embedding matrix E (V × d); lookup = E-এর একটি সারি = one-hot × E; parameter সংখ্যা।',
    overview: p('One-hot encoding-এ vocabulary-র প্রতিটি শব্দ V-dimension vector, যেখানে শুধু নিজের অবস্থানে ১। সমস্যা: যেকোনো দুই ভিন্ন শব্দের dot product ০—“দাম” ও “মূল্য” যতটা আলাদা, “দাম” ও “নীল”-ও ততটাই। Embedding হলো একটি V × d matrix E (d অনেক ছোট, যেমন ৫০–৪০৯৬), যেখানে প্রতিটি শব্দের একটি সারি। শব্দের ID দিয়ে সারি তুলে আনাকে lookup বলে, আর এটি গাণিতিকভাবে one-hot × E-এর সমান। এই পাঠে দুটোই কোডে দেখাব।'),
    objectives: ['one-hot vector-এর সীমা (সব জোড়া সমান দূরে) দেখাতে পারবেন', 'embedding lookup ও one-hot × E যে একই তা যাচাই করতে পারবেন', 'embedding matrix-এর parameter সংখ্যা হিসাব করতে পারবেন'],
    problem: p('অধ্যায় ৬-এর মডেল “শাড়ির দাম কত” থেকে শিখল, কিন্তু “শাড়ির মূল্য কত” প্রশ্নে কিছুই কাজে লাগল না—কারণ “মূল্য” একটি সম্পূর্ণ আলাদা প্রতীক। আমাদের এমন একটি উপস্থাপনা দরকার যেখানে সমার্থক শব্দ “কাছাকাছি” থাকে এবং একটির শেখা অন্যটিকে সাহায্য করে।'),
    explain:
      p(`${term('ওয়ান-হট', 'one-hot')}: V = ৫ হলে “দাম” = [০, ১, ০, ০, ০]। যেকোনো দুই ভিন্ন শব্দের cosine = ০, দূরত্ব = √২। কোনো মিলের তথ্য নেই, আর V বড় হলে vector বিশাল ও প্রায় সব ০।`) +
      p(`${term('এমবেডিং', 'embedding')}: E-এর shape V × d। শব্দ i-এর embedding = E[i] (একটি d-dimension সারি)। E-এর সংখ্যাগুলো শেখা parameter—training-এর সময় gradient দিয়ে আপডেট হয়।`) +
      p('<strong>lookup = গুণ:</strong> one-hot xᵢ (১ × V) × E (V × d) = E-এর i-তম সারি। তাই lookup আসলে একটি রৈখিক স্তর, শুধু সস্তায় হিসাব করা।') +
      table(['', 'One-hot', 'Embedding'], [
        ['dimension', 'V (যেমন ৫০,০০০)', 'd (যেমন ৭৬৮)'],
        ['মান', 'একটি ১, বাকি ০', 'সব শেখা দশমিক সংখ্যা'],
        ['মিল', 'সব জোড়া সমান', 'শেখা মিল'],
        ['parameter', 'নেই', 'V × d'],
      ], 'তুলনা') +
      note('embedding-এর আলাদা dimension-গুলোর সাধারণত সরাসরি মানুষ-পাঠযোগ্য অর্থ থাকে না। এই অধ্যায়ের প্রজেক্টে আমরা ইচ্ছাকৃতভাবে অর্থবহ dimension-সহ <em>teaching vector</em> হাতে বানাব—শেখানোর জন্য, বাস্তব মডেলের মতো নয়।'),
    analogy: {
      text: 'One-hot হলো প্রত্যেক ছাত্রকে আলাদা রোল নম্বর দেওয়া—রোল ৫ ও ৬ পাশাপাশি হলেও তাদের মিল সম্পর্কে কিছু বলে না। Embedding হলো প্রত্যেকের একটি প্রোফাইল (আগ্রহ, দক্ষতা), যা তুলনা করা যায়।',
      breaks: 'ছাত্রের প্রোফাইলের প্রতিটি ঘরের নাম আছে (“গণিতে আগ্রহ”); শেখা embedding-এর ঘরের কোনো নাম নেই—শুধু সংখ্যা, যাদের সম্মিলিত প্যাটার্নে মিল ধরা পড়ে।',
    },
    worked:
      p('V = ৩ (দাম, মূল্য, নীল), d = ২; E = [[০.৯, ০.১], [০.৮, ০.২], [−০.১, ০.৯]]।') +
      ol([
        '“মূল্য” (ID ১) one-hot = [০, ১, ০]; × E = [০×০.৯ + ১×০.৮ + ০×(−০.১), …] = [০.৮, ০.২] = E[১]।',
        'cos(দাম, মূল্য) = (০.৭২ + ০.০২)/(√০.৮২ × √০.৬৮) ≈ ০.৭৪/০.৭৪৭ ≈ ০.৯৯১।',
        'cos(দাম, নীল) = (−০.০৯ + ০.০৯)/(…) = ০।',
        'parameter = ৩ × ২ = ৬। V = ৫০,০০০, d = ৭৬৮ হলে ৩.৮৪ কোটি।',
      ]),
    activity: note('কোডে one-hot-এর cosine টেবিল, embedding lookup বনাম one-hot × E, এবং parameter গণনা।'),
    code: [
      {
        label: 'one-hot, lookup ও গুণ',
        starter: COS + String.raw`
const vocab = ["দাম", "মূল্য", "নীল"];
const V = vocab.length;
const oneHot = (i) => Array.from({ length: V }, (_, k) => (k === i ? 1 : 0));
console.log("one-hot cos(দাম, মূল্য) =", cosine(oneHot(0), oneHot(1)), " cos(দাম, নীল) =", cosine(oneHot(0), oneHot(2)));

const E = [[0.9, 0.1], [0.8, 0.2], [-0.1, 0.9]];      // হাতে লেখা উদাহরণ, শেখা নয়
const lookup = (i) => E[i];
const vecTimesMatrix = (x, M) => M[0].map((_, j) => x.reduce((s, xi, k) => s + xi * M[k][j], 0));
console.log("lookup(1) =", lookup(1), " oneHot(1)×E =", vecTimesMatrix(oneHot(1), E));
console.log("embedding cos(দাম, মূল্য) =", r3(cosine(E[0], E[1])), " cos(দাম, নীল) =", r3(cosine(E[0], E[2])));
const params = (V, d) => V * d;
console.log("parameter: ছোট =", params(3, 2), "| V=50000, d=768 →", params(50000, 768).toLocaleString());
`,
        expect: ['one-hot cos(দাম, মূল্য) = 0  cos(দাম, নীল) = 0', 'lookup(1) = [0.8,0.2]  oneHot(1)×E = [0.8,0.2]', 'embedding cos(দাম, মূল্য) = 0.991  cos(দাম, নীল) = 0'],
        hints: ['vecTimesMatrix-এ x-এর শুধু একটি ঘর ১—তাই যোগফলে শুধু ঐ সারি টিকে থাকে।', 'E-তে “নীল”-কে [0.85, 0.15] করুন—cosine কী হয়? E-এর সংখ্যাই মিল ঠিক করে।', 'toLocaleString কাজ না করলে (runner-এ Intl নেই) সংখ্যা কমা ছাড়া দেখাবে—সেটাই প্রত্যাশিত।'],
        test: '__assert(cosine(oneHot(0),oneHot(1))===0,"onehot orth"); __assert(JSON.stringify(lookup(2))===JSON.stringify(vecTimesMatrix(oneHot(2),E)),"lookup=mult"); __close(cosine(E[0],E[1]),0.9906,1e-3,"worked cos");',
      },
    ],
    line: ul([
      '<code>oneHot(i)</code>: i অবস্থানে ১, বাকি ০।',
      '<code>vecTimesMatrix</code>: (১ × V) × (V × d) = (১ × d)।',
      'lookup ও গুণফল হুবহু এক—test-এ যাচাই।',
    ]),
    why: p('E-এর মান হাতে বেছে নেওয়া হয়েছে যাতে cosine হাতে মেলানো যায়। পরের দুই পাঠে এই মানগুলো ডেটা থেকে আসবে—প্রথমে গণনা দিয়ে, তারপর gradient descent দিয়ে।'),
    remember: ['one-hot: সব জোড়া সমান দূরে', 'embedding: V × d শেখা matrix', 'lookup = one-hot × E', 'parameter = V × d'],
    skip: ['positional embedding (অধ্যায় ৮)', 'sentence embedding মডেলের ভেতরের গঠন'],
    experiment: p('E-তে চতুর্থ শব্দ “আকাশি” যোগ করুন এমন vector দিয়ে যাতে এটি “নীল”-এর কাছাকাছি কিন্তু “দাম” থেকে দূরে। cosine দিয়ে যাচাই করুন।'),
    mistakes: ['one-hot-এর dot product থেকে মিল আশা করা', 'embedding dimension-কে সরাসরি অর্থবহ ধরা', 'lookup ও রৈখিক স্তরকে সম্পূর্ণ ভিন্ন জিনিস ভাবা', 'বড় vocabulary-তে embedding-এর parameter খরচ উপেক্ষা'],
    quiz: [
      { q: 'V = ১০০, d = ১৬। embedding matrix-এ কত parameter?', a: { a: '১১৬', b: '১,৬০০', c: '১৬' }, ok: 'b', why: 'V × d = ১০০ × ১৬ = ১,৬০০।' },
      { q: 'দুটি ভিন্ন শব্দের one-hot vector-এর cosine?', a: { a: '১', b: '০', c: 'শব্দের অর্থের ওপর নির্ভর করে' }, ok: 'b', why: 'ভিন্ন অবস্থানে ১, তাই dot product ০।' },
      { q: 'embedding lookup গাণিতিকভাবে কীসের সমান?', a: { a: 'one-hot vector × embedding matrix', b: 'softmax', c: 'cosine' }, ok: 'a', why: 'one-hot গুণ করলে E-এর একটি সারিই থাকে।' },
    ],
    recap: ['one-hot মিল ধরে না', 'embedding = শেখা ঘন vector', 'lookup একটি রৈখিক স্তর'],
    nextNote: 'embedding-এর সংখ্যা কোথা থেকে আসবে? প্রথম উত্তর—প্রসঙ্গ গণনা:',
    sources: [SRC.jurafsky, SRC.word2vec],
  },
  {
    id: 'les-07-02-cooccurrence-ppmi',
    slug: 'cooccurrence-ppmi',
    title: 'প্রসঙ্গ থেকে অর্থ: Co-occurrence ও PPMI',
    minutes: 40,
    prereqs: ['les-07-01-onehot-embedding', 'les-03-05-probability'],
    summary: 'distributional hypothesis; window-ভিত্তিক co-occurrence গণনা; সাধারণ শব্দের প্রভাব; PPMI = max(০, log P(w,c)/(P(w)P(c))); cosine দিয়ে মিল।',
    overview: p('Distributional hypothesis: যে শব্দগুলো একই রকম প্রসঙ্গে আসে, তাদের অর্থও কাছাকাছি। “দাম” ও “মূল্য” দুটোই “শাড়ির … কত” ধরনের বাক্যে আসে। এই পাঠে প্রতিটি শব্দের জন্য “আশেপাশে কোন শব্দ কতবার এসেছে” গুনে vector বানাব, দেখব “কত”-এর মতো সাধারণ শব্দ সব vector-কে একই রকম করে ফেলে, এবং PPMI (positive pointwise mutual information) দিয়ে তা সংশোধন করব—যা মাপে দুটি শব্দ দৈবক্রমের চেয়ে কতটা বেশি একসাথে আসে।'),
    objectives: ['window-ভিত্তিক co-occurrence matrix বানাতে পারবেন', 'PPMI হিসাব করে কেন এটি সাধারণ শব্দের প্রভাব কমায় তা ব্যাখ্যা করতে পারবেন', 'co-occurrence vector-এ cosine দিয়ে শব্দের মিল তুলনা করতে পারবেন'],
    problem: p('কেউ আমাদের বলেনি “দাম” ও “মূল্য” সমার্থক। শুধু কিছু গ্রাহক-বার্তা আছে। গণনা দিয়ে কি এই সম্পর্ক খুঁজে পাওয়া যায়—এবং “কত”, “আছে”-র মতো প্রায় সব বাক্যে থাকা শব্দ কি ফলাফল নষ্ট করবে?'),
    explain:
      p(`${term('কো-অকারেন্স', 'co-occurrence')}: শব্দ w-এর বাম-ডানে ±k শব্দের মধ্যে c কতবার এসেছে = C(w, c)। প্রতিটি w-এর সারি একটি V-dimension vector।`) +
      p('<strong>সমস্যা:</strong> “কত” প্রায় সব শব্দের পাশে আসে, তাই কাঁচা গণনায় সব vector-এ “কত”-এর ঘর বড়—সবাই একে অপরের মতো দেখায়।') +
      p(`${term('PMI', 'pointwise mutual information')}: PMI(w, c) = log [P(w, c) / (P(w) P(c))]। যদি w ও c স্বাধীন হতো, P(w, c) = P(w)P(c), PMI = ০। একসাথে বেশি আসলে ধনাত্মক। PPMI = max(০, PMI)—ঋণাত্মক মান (কম ডেটায় অনির্ভরযোগ্য) ০ করা হয়।`) +
      p('এখানে P(w, c) = C(w, c)/মোট জোড়া, P(w) = সারির যোগফল/মোট, P(c) = কলামের যোগফল/মোট।') +
      warn('ছোট corpus-এ বিরল জোড়ার PMI অতিরঞ্জিত হয় (একবার একসাথে এলেই বড় মান)। বাস্তবে smoothing বা ন্যূনতম গণনার সীমা ব্যবহৃত হয়।'),
    analogy: {
      text: 'কাউকে চেনার জন্য দেখা হয় সে কাদের সাথে মেশে। কিন্তু সবার সাথে মেশা জনপ্রিয় ব্যক্তি (“কত”) কাউকে আলাদা করে চেনায় না—PPMI বলে “শুধু অস্বাভাবিক ঘনিষ্ঠতা গোনো”।',
      breaks: 'মানুষের পরিচয় সম্পর্কের ধরনেও নির্ভর করে; co-occurrence শুধু “পাশে এসেছে কি না” দেখে—“দাম বেশি” ও “দাম কম” একই প্রসঙ্গ-শব্দ দেয়, তাই বিপরীতার্থক শব্দও কাছাকাছি হয়ে যায়।',
    },
    worked:
      p('মোট জোড়া N = ১০০। C(দাম, শাড়ি) = ৪; সারি-যোগ(দাম) = ১০; কলাম-যোগ(শাড়ি) = ২০।') +
      ol([
        'P(দাম, শাড়ি) = ০.০৪; P(দাম) = ০.১; P(শাড়ি) = ০.২।',
        'PMI = log(০.০৪ / ০.০২) = log ২ ≈ ০.৬৯৩ → দৈবের দ্বিগুণ ঘনঘন।',
        'C(দাম, কত) = ৫, কলাম-যোগ(কত) = ৫০ → PMI = log(০.০৫/০.০৫) = ০ → “কত” কোনো তথ্য দেয় না।',
      ]),
    activity: note('কোডে ১৫টি সিন্থেটিক বাক্য, window = ২, কাঁচা গণনা ও PPMI vector; কয়েকটি জোড়ার cosine দুই পদ্ধতিতে।'),
    code: [
      {
        label: 'co-occurrence ও PPMI',
        starter: COS + String.raw`
const S = ["শাড়ি দাম কত", "শাড়ি মূল্য কত", "পাঞ্জাবি দাম কত", "পাঞ্জাবি মূল্য কত", "হার দাম কত", "হার মূল্য কত",
  "শাড়ি রং লাল", "পাঞ্জাবি রং সাদা", "হার রং সোনালি", "শাড়ি ডেলিভারি কবে", "হার ডেলিভারি কবে", "পাঞ্জাবি ডেলিভারি কবে",
  "দাম কম আছে", "মূল্য কম আছে", "ডেলিভারি কবে হবে"];
const toks = S.map((s) => s.split(" "));
const vocab = [...new Set(toks.flat())];
const id = Object.fromEntries(vocab.map((w, i) => [w, i]));
const V = vocab.length, K = 2;

const C = vocab.map(() => new Array(V).fill(0));
for (const t of toks) for (let i = 0; i < t.length; i++)
  for (let j = Math.max(0, i - K); j <= Math.min(t.length - 1, i + K); j++) if (j !== i) C[id[t[i]]][id[t[j]]]++;

const N = C.flat().reduce((a, b) => a + b, 0);
const row = C.map((r) => r.reduce((a, b) => a + b, 0));
const col = vocab.map((_, j) => C.reduce((s, r) => s + r[j], 0));
const PPMI = C.map((r, i) => r.map((c, j) => (c === 0 ? 0 : Math.max(0, Math.log((c / N) / ((row[i] / N) * (col[j] / N)))))));

const pairs = [["দাম", "মূল্য"], ["শাড়ি", "পাঞ্জাবি"], ["দাম", "ডেলিভারি"], ["লাল", "সাদা"], ["দাম", "লাল"]];
console.log("V =", V, "| মোট জোড়া N =", N);
for (const [a, b] of pairs) console.log((a + "–" + b).padEnd(16), "কাঁচা cos", String(r3(cosine(C[id[a]], C[id[b]]))).padStart(6), "| PPMI cos", String(r3(cosine(PPMI[id[a]], PPMI[id[b]]))).padStart(6));
console.log("PMI(দাম, কত) =", r3(Math.log((C[id["দাম"]][id["কত"]] / N) / ((row[id["দাম"]] / N) * (col[id["কত"]] / N)))));
`,
        expect: ['V = 15', 'দাম–মূল্য', 'PPMI cos'],
        hints: ['ফল দেখুন: PPMI দাম–ডেলিভারি ও দাম–লাল-কে কমিয়েছে (ভালো), কিন্তু শাড়ি–পাঞ্জাবি-কেও ০.৯ থেকে ০.৩-এ নামিয়েছে। ১৫টি বাক্যে PPMI সব জোড়ায় উন্নতি করে না—ছোট corpus-এ বিরল জোড়ার log-মান অস্থির।', 'PMI(দাম, কত) এখানে ০ নয়, +১.০৩: এই corpus-এ “কত” প্রায় শুধু দাম/মূল্য প্রশ্নেই আসে, তাই দৈবের চেয়ে বেশি একসাথে। কোনো শব্দ “সাধারণ” কিনা তা corpus-এর ওপর নির্ভর করে।', 'লাল–সাদা: corpus-এ এরা কখনো একসাথে আসেনি, তবু মিল কেন? (দুটোই “রং”-এর পরে)', 'K = 1 করে আবার চালান।'],
        test: 'var cr=function(a,b){return cosine(PPMI[id[a]],PPMI[id[b]]);}; __assert(cr("দাম","মূল্য")>cr("দাম","ডেলিভারি"),"syn closer than unrelated"); __assert(cr("দাম","মূল্য")>cr("দাম","লাল"),"syn vs color"); __assert(N===C.flat().reduce(function(a,b){return a+b;},0),"N");',
      },
    ],
    line: ul([
      'তিন স্তরের loop: প্রতিটি বাক্য, প্রতিটি শব্দ, তার window-এর প্রতিটি প্রতিবেশী।',
      '<code>row</code>, <code>col</code>: প্রান্তিক যোগফল—P(w) ও P(c)-এর জন্য।',
      '<code>c === 0 ? 0 : …</code>: log ০ এড়ানো; PPMI-তে অদেখা জোড়া ০।',
      'কাঁচা ও PPMI দুই cosine পাশাপাশি—পার্থক্য সরাসরি দেখা যায়।',
    ]),
    why: p('corpus ইচ্ছাকৃতভাবে এমন যে “দাম” ও “মূল্য” একই প্রসঙ্গে আসে, কিন্তু কখনো একসাথে নয়—যাতে দেখা যায় মিল “পাশাপাশি আসা” থেকে নয়, “একই প্রতিবেশী থাকা” থেকে আসে (দুই পদ্ধতিতেই cos = ১)। কাঁচা ও PPMI পাশাপাশি রাখা হয়েছে যাতে দেখা যায় কোনো একটি পদ্ধতি সব জোড়ায় জেতে না—এই ছোট ডেটায় PPMI অপ্রাসঙ্গিক জোড়া কমায়, কিন্তু কিছু প্রাসঙ্গিক জোড়াও কমায়।'),
    remember: ['একই প্রসঙ্গ → কাছাকাছি অর্থ', 'কাঁচা গণনায় সাধারণ শব্দ প্রাধান্য পায়', 'PPMI: দৈবের চেয়ে কতটা বেশি একসাথে', 'বিপরীতার্থক শব্দও একই প্রসঙ্গ পায়'],
    skip: ['SVD দিয়ে dimension কমানো (LSA)', 'GloVe'],
    experiment: p('দুটি বাক্য যোগ করুন: “দাম বেশি আছে”, “মূল্য বেশি আছে”। তারপর “কম” ও “বেশি”-র PPMI cosine হিসাব করুন। বিপরীতার্থক শব্দ কাছাকাছি কেন? সার্চে এটি কী সমস্যা করতে পারে?'),
    mistakes: ['কাঁচা গণনাকে সরাসরি অর্থের মাপ ধরা', 'ছোট corpus-এর বিরল জোড়ার বড় PMI বিশ্বাস করা', 'co-occurrence মিলকে সমার্থকতা ভাবা (বিপরীতার্থকও হতে পারে)', 'window আকারের প্রভাব না দেখা'],
    quiz: [
      { q: 'P(w, c) = ০.০১, P(w) = ০.১, P(c) = ০.১। PMI?', a: { a: '০', b: 'log ১০', c: 'log ০.১' }, ok: 'a', why: '০.০১/(০.১ × ০.১) = ১, log ১ = ০—স্বাধীনভাবে যতবার আশা, ততবারই।' },
      { q: 'কাঁচা co-occurrence-এ সব vector কাছাকাছি দেখানোর প্রধান কারণ?', a: { a: 'window বড়', b: 'সাধারণ শব্দ (যেমন “কত”) প্রায় সব শব্দের প্রতিবেশী', c: 'vocabulary ছোট' }, ok: 'b', why: 'বড় সাধারণ কলাম সব সারিতে প্রাধান্য পায়; PPMI সেটিকে ০-এর কাছে আনে।' },
      { q: '“কম” ও “বেশি” co-occurrence vector-এ কাছাকাছি কেন?', a: { a: 'এরা সমার্থক', b: 'এরা একই রকম প্রসঙ্গে আসে (“দাম … আছে”)', c: 'বাগ' }, ok: 'b', why: 'distributional মিল প্রসঙ্গ মাপে, সমার্থকতা নয়।' },
    ],
    recap: ['প্রসঙ্গ-গণনা থেকে vector', 'PPMI সাধারণ শব্দের প্রভাব কমায়', 'distributional মিলের সীমা'],
    nextNote: 'গণনার বদলে gradient descent দিয়ে ছোট ঘন embedding শেখা—skip-gram:',
    synthetic: true,
    sources: [SRC.jurafsky, ['Church & Hanks — Word Association Norms, Mutual Information, and Lexicography (1990)', 'https://aclanthology.org/J90-1003/']],
  },
  {
    id: 'les-07-03-skipgram',
    slug: 'skip-gram-training',
    title: 'Skip-gram: Embedding শেখা',
    minutes: 50,
    prereqs: ['les-07-02-cooccurrence-ppmi', 'les-04-08-project-message-classifier'],
    summary: 'কেন্দ্র শব্দ দিয়ে প্রসঙ্গ শব্দ অনুমান; দুটি matrix (E ও O); softmax ও cross-entropy; gradient descent; training-এর আগে-পরে cosine।',
    overview: p('Skip-gram (word2vec-এর একটি রূপ) একটি সহজ কাজ শিখে embedding পায়: কেন্দ্র শব্দ দেখে তার আশেপাশের শব্দ অনুমান করা। কেন্দ্র শব্দের embedding e = E[w]; প্রতিটি সম্ভাব্য প্রসঙ্গ শব্দ c-এর আউটপুট vector O[c]; স্কোর O[c] · e; softmax দিয়ে সম্ভাব্যতা; cross-entropy loss (অধ্যায় ৪-এর মতোই)। training শেষে অনুমান-কাজটি ফেলে দিয়ে E রেখে দিই। একই প্রসঙ্গের শব্দকে একই প্রতিবেশী অনুমান করতে হয়, তাই তাদের vector কাছাকাছি হয়ে যায়। এই পাঠে ৫-dimension embedding train করে আগে-পরে cosine তুলনা করব।'),
    objectives: ['skip-gram-এর training জোড়া (কেন্দ্র, প্রসঙ্গ) বানাতে পারবেন', 'softmax skip-gram-এর forward ও gradient লিখতে পারবেন', 'training-এর আগে ও পরে embedding-এর মিল তুলনা করে ব্যাখ্যা করতে পারবেন'],
    problem: p('আগের পাঠের PPMI vector-এর dimension V (vocabulary আকার)—বড় vocabulary-তে বিশাল ও প্রায় সব ০। আমরা চাই ছোট (যেমন ৫০–৩০০ dimension) ঘন vector, যা একই রকম মিল ধরে এবং অন্য মডেলের প্রথম স্তর হিসেবে train করা যায়।'),
    explain:
      ol([
        'প্রতিটি বাক্যে প্রতিটি শব্দ কেন্দ্র; window-এর ভেতরের প্রতিটি শব্দের সাথে একটি (কেন্দ্র, প্রসঙ্গ) জোড়া।',
        'e = E[কেন্দ্র]; zₖ = O[k] · e সব k-এর জন্য; p = softmax(z)।',
        'loss = −log p[প্রসঙ্গ]।',
        'gradient: dzₖ = pₖ − [k = প্রসঙ্গ]; ∂O[k] = dzₖ × e; ∂e = Σₖ dzₖ × O[k]।',
        'E ও O দুটোই আপডেট।',
      ]) +
      p('<strong>কেন দুই matrix:</strong> একটি শব্দ কেন্দ্র হিসেবে আর প্রসঙ্গ হিসেবে ভিন্ন ভূমিকায়। training শেষে সাধারণত E রাখা হয়।') +
      p('<strong>বড় vocabulary-তে:</strong> softmax-এ প্রতিটি ধাপে V-টি স্কোর লাগে—V = ১ লাখ হলে খুব ধীর। word2vec তাই negative sampling ব্যবহার করে: সঠিক প্রসঙ্গ ও কয়েকটি দৈব “ভুল” শব্দ নিয়ে binary classification। আমাদের V = ১৫, তাই পূর্ণ softmax চলে।') +
      warn('৫ dimension ও ১৫টি বাক্যে শেখা embedding শুধু এই খেলনা corpus-এর প্যাটার্ন ধরে। বাস্তব embedding কোটি কোটি শব্দে train হয়, এবং তাতে training টেক্সটের সামাজিক পক্ষপাতও থাকে (পরের পাঠ)।'),
    analogy: {
      text: 'Skip-gram হলো “শূন্যস্থান পূরণ”-এর উল্টো খেলা: একটি শব্দ দেখে বলতে হবে আশেপাশে কী থাকতে পারে। যে দুই শব্দের উত্তর-তালিকা একই, তাদের মনে রাখার ধরনও একই হয়ে যায়।',
      breaks: 'মানুষ খেলাটি খেলতে অর্থ ব্যবহার করে; মডেল শুধু গণনার প্যাটার্ন—সে জানে না “দাম” টাকার সাথে সম্পর্কিত।',
    },
    worked:
      p('V = ৩, d = ২, e = [১, ০], O = [[১, ০], [০, ১], [−১, ০]], আসল প্রসঙ্গ = ১।') +
      ol([
        'z = [১, ০, −১]; softmax ≈ [০.৬৬৫, ০.২৪৫, ০.০৯০]।',
        'loss = −log ০.২৪৫ ≈ ১.৪০৭।',
        'dz = [০.৬৬৫, −০.৭৫৫, ০.০৯০]।',
        '∂e = ০.৬৬৫×[১, ০] − ০.৭৫৫×[০, ১] + ০.০৯×[−১, ০] = [০.৫৭৫, −০.৭৫৫]। e ← e − η∂e e-কে O[১]-এর দিকে সরায়।',
      ]),
    activity: note('কোডে training জোড়া, ছোট দৈব E ও O (seed ৩), ১৫০ epoch SGD, এবং আগে-পরে চারটি জোড়ার cosine।'),
    code: [
      {
        label: 'skip-gram training (সিন্থেটিক corpus)',
        starter: RNG + COS + String.raw`
const S = ["শাড়ি দাম কত", "শাড়ি মূল্য কত", "পাঞ্জাবি দাম কত", "পাঞ্জাবি মূল্য কত", "হার দাম কত", "হার মূল্য কত",
  "শাড়ি রং লাল", "পাঞ্জাবি রং সাদা", "হার রং সোনালি", "শাড়ি ডেলিভারি কবে", "হার ডেলিভারি কবে", "পাঞ্জাবি ডেলিভারি কবে",
  "দাম কম আছে", "মূল্য কম আছে", "ডেলিভারি কবে হবে"];
const toks = S.map((s) => s.split(" "));
const vocab = [...new Set(toks.flat())];
const id = Object.fromEntries(vocab.map((w, i) => [w, i]));
const V = vocab.length, D = 5, WINDOW = 2;

const pairs = [];
for (const t of toks) for (let i = 0; i < t.length; i++)
  for (let j = Math.max(0, i - WINDOW); j <= Math.min(t.length - 1, i + WINDOW); j++) if (j !== i) pairs.push([id[t[i]], id[t[j]]]);

const rand = makeRng(3);
const E = vocab.map(() => Array.from({ length: D }, () => (rand() - 0.5) * 0.2));
const O = vocab.map(() => Array.from({ length: D }, () => (rand() - 0.5) * 0.2));
const check = [["দাম", "মূল্য"], ["শাড়ি", "পাঞ্জাবি"], ["দাম", "লাল"], ["শাড়ি", "কত"]];
const before = check.map(([a, b]) => cosine(E[id[a]], E[id[b]]));

function softmax(z) { const m = Math.max(...z); const e = z.map((v) => Math.exp(v - m)); const s = e.reduce((a, b) => a + b, 0); return e.map((v) => v / s); }
const lr = 0.1;
let firstLoss = 0, lastLoss = 0;
for (let epoch = 0; epoch < 150; epoch++) {
  let L = 0;
  for (const [c, o] of pairs) {
    const e = E[c];
    const p = softmax(O.map((w) => dot(w, e)));
    L -= Math.log(p[o]);
    const ge = new Array(D).fill(0);
    for (let k = 0; k < V; k++) {
      const dz = p[k] - (k === o ? 1 : 0);
      for (let i = 0; i < D; i++) { ge[i] += dz * O[k][i]; O[k][i] -= lr * dz * e[i]; }
    }
    for (let i = 0; i < D; i++) e[i] -= lr * ge[i];
  }
  if (epoch === 0) firstLoss = L / pairs.length;
  lastLoss = L / pairs.length;
}
console.log("জোড়া:", pairs.length, "| V:", V, "| D:", D, "| গড় loss:", r3(firstLoss), "→", r3(lastLoss), " (uniform = ln V =", r3(Math.log(V)) + ")");
check.forEach(([a, b], i) => console.log((a + "–" + b).padEnd(16), "আগে", String(r3(before[i])).padStart(6), "→ পরে", String(r3(cosine(E[id[a]], E[id[b]]))).padStart(6)));
const after = check.map(([a, b]) => cosine(E[id[a]], E[id[b]]));
`,
        expect: ['জোড়া: 90 | V: 15 | D: 5', 'দাম–মূল্য', '→ পরে'],
        hints: ['গড় loss ln V-এর চেয়ে কম মানে মডেল দৈবের চেয়ে ভালো অনুমান করছে। কিন্তু ০ হতে পারে না—কেন? (একই কেন্দ্রের একাধিক সঠিক প্রসঙ্গ)', 'makeRng(3)-এর seed বদলান: সংখ্যা বদলায়, কিন্তু কোন জোড়া কাছে আর কোনটি দূরে—তা কি একই থাকে?', 'D = 2 করুন—মিল কি এখনও ধরা পড়ে?'],
        test: '__assert(after[0]>0.9,"দাম-মূল্য learned"); __assert(after[1]>0.9,"শাড়ি-পাঞ্জাবি learned"); __assert(after[0]>after[2],"syn > unrelated"); __assert(lastLoss<firstLoss&&lastLoss<Math.log(V),"loss fell below uniform");',
      },
    ],
    line: ul([
      '<code>pairs</code>: ±২ window-এর সব (কেন্দ্র, প্রসঙ্গ) জোড়া।',
      'শুরুর E ও O ছোট দৈব সংখ্যা—অধ্যায় ৫-এর symmetry-ভাঙার কারণে।',
      '<code>softmax(O.map((w) => dot(w, e)))</code>: সব প্রসঙ্গ-শব্দের সম্ভাব্যতা।',
      '<code>dz = p[k] - (k === o ? 1 : 0)</code>: অধ্যায় ৪-এর softmax gradient।',
      'O আপডেট loop-এর ভেতরে, e আপডেট পরে—ge হিসাব শেষ হওয়ার পর, যাতে পুরনো O-এর gradient মেশে না (ছোট ক্রম-প্রভাব থাকলেও শেখায় সমস্যা নেই)।',
    ]),
    why: p('শুরুর cosine মুদ্রণ করা হয়েছে, যাতে প্রমাণ থাকে মিল training থেকেই এসেছে, দৈব শুরু থেকে নয়। loss-কে ln V (uniform অনুমান)-এর সাথে তুলনা করা হয়েছে—baseline ছাড়া loss সংখ্যা অর্থহীন।'),
    remember: ['skip-gram: কেন্দ্র → প্রসঙ্গ অনুমান', 'E রাখা হয়, অনুমান-কাজ ফেলে দেওয়া হয়', 'একই প্রসঙ্গ → কাছাকাছি vector', 'বড় V-তে negative sampling'],
    skip: ['negative sampling-এর সূত্র', 'subsampling ঘনঘন শব্দ', 'CBOW'],
    experiment: p('corpus-এ “দাম বেশি আছে”, “মূল্য বেশি আছে” যোগ করুন এবং “কম”–“বেশি”-র cosine দেখুন। আগের পাঠের PPMI-এর ফলাফলের সাথে মেলে?'),
    mistakes: ['training-এর আগের cosine না দেখে মিলকে শেখা ধরে নেওয়া', 'loss-এর baseline (ln V) না জানা', 'বড় vocabulary-তে পূর্ণ softmax চালানো', 'ছোট corpus-এর embedding-কে সাধারণ ভাষার প্রতিনিধি ভাবা'],
    quiz: [
      { q: 'skip-gram-এর training কাজ কী?', a: { a: 'বাক্যের বিভাগ অনুমান', b: 'কেন্দ্র শব্দ দিয়ে আশেপাশের শব্দ অনুমান', c: 'শব্দের বানান সংশোধন' }, ok: 'b', why: 'এই সহায়ক কাজ থেকেই embedding শেখা হয়।' },
      { q: 'V = ২০ হলে uniform অনুমানের cross-entropy?', a: { a: 'ln ২০ ≈ ৩.০০', b: '২০', c: '০' }, ok: 'a', why: 'প্রতিটি প্রসঙ্গে ১/২০, তাই −log(১/২০) = ln ২০।' },
      { q: 'training-এর পর “দাম” ও “মূল্য” কাছাকাছি কেন?', a: { a: 'অভিধান থেকে শেখানো হয়েছে', b: 'দুটোকেই একই প্রতিবেশী (শাড়ি, কত…) অনুমান করতে হয়েছে', c: 'দৈবক্রমে' }, ok: 'b', why: 'একই আউটপুট অনুমানের জন্য একই রকম e সবচেয়ে কাজের, তাই gradient তাদের কাছে টানে।' },
    ],
    recap: ['ছোট ঘন embedding gradient দিয়ে শেখা', 'আগে-পরে তুলনায় শেখার প্রমাণ', 'অধ্যায় ৪-৫-এর softmax ও SGD-ই ভিত্তি'],
    nextNote: 'embedding দিয়ে vector গাণিতিক—আকর্ষণীয়, কিন্তু সতর্কতাসহ:',
    synthetic: true,
    sources: [SRC.word2vec, SRC.jurafsky, ['Rong — word2vec Parameter Learning Explained (2014)', 'https://arxiv.org/abs/1411.2738']],
  },
  {
    id: 'les-07-04-vector-arithmetic-bias',
    synthetic: true,
    slug: 'vector-arithmetic-bias',
    title: 'Vector গাণিতিক, সীমা ও Bias',
    minutes: 35,
    prereqs: ['les-07-03-skipgram'],
    summary: 'analogy: b − a + c ≈ d; প্রশ্ন-শব্দ বাদ দেওয়ার কৌশল; analogy কেন ভঙ্গুর; embedding-এ সামাজিক পক্ষপাত; teaching vector দিয়ে দেখানো।',
    overview: p('বড় corpus-এ train করা embedding-এ কিছু সম্পর্ক প্রায় একই দিকের vector হিসেবে দেখা যায়—বিখ্যাত উদাহরণ “king − man + woman ≈ queen”। এই পাঠে অর্থবহ dimension-সহ হাতে-বানানো teaching vector দিয়ে এই গাণিতিক দেখব, তারপর তিনটি সতর্কতা: (১) ফলাফল থেকে প্রশ্নের শব্দগুলো বাদ না দিলে analogy প্রায়ই ব্যর্থ হয়, (২) analogy অনেক সম্পর্কে কাজ করে না, (৩) embedding training টেক্সটের সামাজিক পক্ষপাত শেখে—যেমন পেশাকে লিঙ্গের সাথে যুক্ত করা—যা search ও সুপারিশে ক্ষতিকর হতে পারে।'),
    objectives: ['vector গাণিতিক দিয়ে analogy প্রশ্ন সমাধান করতে পারবেন', 'analogy পদ্ধতির সীমা ও প্রশ্ন-শব্দ বাদ দেওয়ার প্রভাব ব্যাখ্যা করতে পারবেন', 'embedding-এ পক্ষপাত শনাক্তের একটি সরল মাপ হিসাব করতে পারবেন'],
    problem: p('একটি পোশাকের দোকানের সার্চ “ছেলেদের জন্য শাড়ির মতো কিছু” প্রশ্নে embedding গাণিতিক দিয়ে “পাঞ্জাবি” দেখাতে চায়। এটি কতটা নির্ভরযোগ্য? আর embedding যদি “নার্স” শব্দকে নারীর দিকে ও “ইঞ্জিনিয়ার”-কে পুরুষের দিকে ঠেলে রাখে, চাকরির বিজ্ঞাপন-সার্চে কী হবে?'),
    explain:
      p('<strong>Analogy:</strong> “a-এর কাছে b যেমন, c-এর কাছে ?” → q = E[b] − E[a] + E[c]; উত্তর = q-এর সবচেয়ে কাছের শব্দ (cosine), <em>a, b, c বাদ দিয়ে</em>।') +
      p('<strong>কেন বাদ দিতে হয়:</strong> q প্রায়ই E[c]-এর সবচেয়ে কাছে থাকে (কারণ পার্থক্য-vector ছোট)। গবেষণার অনেক বিখ্যাত analogy ফল এই বাদ দেওয়ার নিয়মের ওপর নির্ভর করে—না দিলে উত্তর প্রায়ই c নিজেই।') +
      p(`<strong>পক্ষপাত মাপ:</strong> একটি “লিঙ্গ-দিক” g = E[নারী] − E[পুরুষ]। প্রতিটি পেশা-শব্দের projection cos(E[পেশা], g)। নিরপেক্ষ পেশায় ০-এর কাছে হওয়া উচিত; বড় মান মানে embedding পেশাটিকে একটি লিঙ্গের সাথে যুক্ত করেছে।`) +
      warn('এই পাঠের vector <strong>হাতে বানানো teaching vector</strong>, প্রতিটি dimension-এর নাম আছে—শুধু ধারণা দেখানোর জন্য। “নার্স”-এর পক্ষপাত-মান আমরা ইচ্ছাকৃতভাবে বসিয়েছি যাতে মাপটি দেখা যায়; এটি কোনো বাস্তব মডেলের মাপা ফল নয়। বাস্তব embedding-এ পক্ষপাত গবেষণায় নথিভুক্ত (সূত্র দেখুন), এবং প্রতিটি মডেলে আলাদাভাবে মাপতে হয়।'),
    analogy: {
      text: 'Vector গাণিতিক হলো মানচিত্রে দিক মাপা: “ঢাকা থেকে চট্টগ্রাম যতটা দক্ষিণ-পূর্বে, রাজশাহী থেকে ততটা গেলে কোথায় পৌঁছাব?”',
      breaks: 'মানচিত্রের দিক সর্বত্র একই; embedding-এ একটি সম্পর্কের “দিক” সব শব্দজোড়ায় একই থাকে না—তাই কিছু analogy কাজ করে, অনেকগুলো করে না।',
    },
    worked:
      p('teaching vector-এর dimension: [পোশাক, গয়না, নারী, পুরুষ, উৎসব]। শাড়ি = [১, ০, ১, ০, ০.৫], নারী = [০, ০, ১, ০, ০], পুরুষ = [০, ০, ০, ১, ০], পাঞ্জাবি = [১, ০, ০, ১, ০.৫]।') +
      ol([
        'q = শাড়ি − নারী + পুরুষ = [১, ০, ০, ১, ০.৫]।',
        'এটি হুবহু পাঞ্জাবি → cosine ১।',
        'বাস্তব শেখা embedding-এ এত নিখুঁত কখনো হয় না—এখানে vector-ই সেভাবে বানানো।',
      ]),
    activity: note('কোডে teaching vector টেবিল, analogy (বাদ দিয়ে ও না দিয়ে), একটি ব্যর্থ analogy, এবং পেশা-শব্দের লিঙ্গ-projection।'),
    code: [
      {
        label: 'analogy, বাদ দেওয়ার নিয়ম ও পক্ষপাত মাপ (teaching vector)',
        starter: COS + String.raw`
// dimension: [পোশাক, গয়না, নারী, পুরুষ, উৎসব, রান্না, পেশা]  — হাতে বানানো, শেখা নয়
const E = {
  "শাড়ি":     [1, 0, 1, 0, 0.5, 0, 0],
  "পাঞ্জাবি":  [1, 0, 0, 1, 0.5, 0, 0],
  "লুঙ্গি":     [1, 0, 0, 0.9, 0, 0, 0],
  "চুড়ি":      [0, 1, 0.9, 0, 0.3, 0, 0],
  "আংটি":     [0, 1, 0.2, 0.2, 0.2, 0, 0],
  "হাঁড়ি":     [0, 0, 0, 0, 0, 1, 0],
  "নারী":     [0, 0, 1, 0, 0, 0, 0],
  "পুরুষ":    [0, 0, 0, 1, 0, 0, 0],
  "নার্স":     [0, 0, 0.6, 0.1, 0, 0, 1],   // ইচ্ছাকৃত পক্ষপাতসহ উদাহরণ
  "ইঞ্জিনিয়ার": [0, 0, 0.1, 0.6, 0, 0, 1],  // ইচ্ছাকৃত পক্ষপাতসহ উদাহরণ
  "শিক্ষক":    [0, 0, 0.3, 0.3, 0, 0, 1],
};
const sub = (a, b) => a.map((v, i) => v - b[i]), add = (a, b) => a.map((v, i) => v + b[i]);
function nearest(q, exclude = [], k = 3) {
  return Object.entries(E).filter(([w]) => !exclude.includes(w)).map(([w, v]) => [w, cosine(q, v)]).sort((x, y) => y[1] - x[1]).slice(0, k);
}
const show = (list) => list.map(([w, c]) => w + "(" + r3(c) + ")").join(", ");

const q1 = add(sub(E["শাড়ি"], E["নারী"]), E["পুরুষ"]);
console.log("শাড়ি − নারী + পুরুষ, বাদ দিয়ে :", show(nearest(q1, ["শাড়ি", "নারী", "পুরুষ"])));
const q2 = add(sub(E["চুড়ি"], E["নারী"]), E["পুরুষ"]);
console.log("চুড়ি − নারী + পুরুষ, বাদ দিয়ে  :", show(nearest(q2, ["চুড়ি", "নারী", "পুরুষ"])));
console.log("চুড়ি − নারী + পুরুষ, বাদ ছাড়া  :", show(nearest(q2)));

const g = sub(E["নারী"], E["পুরুষ"]);
for (const w of ["নার্স", "ইঞ্জিনিয়ার", "শিক্ষক"]) console.log("লিঙ্গ-projection", w.padEnd(10), r3(cosine(E[w], g)));
`,
        expect: ['শাড়ি − নারী + পুরুষ, বাদ দিয়ে : পাঞ্জাবি(1)', 'লিঙ্গ-projection শিক্ষক     0'],
        hints: ['চুড়ি − নারী + পুরুষ-এর উত্তর কী এল? vocabulary-তে “পুরুষের চুড়ি” নেই—তবু মডেল একটি উত্তর দেয়। এটি বিপদ কেন?', 'বাদ ছাড়া তালিকায় প্রশ্নের শব্দ “পুরুষ” নিজেই দ্বিতীয় স্থানে ঢুকে পড়েছে। বাস্তব শেখা embedding-এ এটি প্রায়ই প্রথম হয়—এটাই বাদ দেওয়ার নিয়মের কারণ।', 'নার্স ও ইঞ্জিনিয়ারের projection-এর চিহ্ন কী বলে? “শিক্ষক” ০ কেন?'],
        test: '__assert(nearest(q1,["শাড়ি","নারী","পুরুষ"],1)[0][0]==="পাঞ্জাবি","analogy works"); __assert(cosine(E["নার্স"],g)>0.2&&cosine(E["ইঞ্জিনিয়ার"],g)<-0.2,"bias visible"); __close(cosine(E["শিক্ষক"],g),0,1e-12,"neutral");',
      },
    ],
    line: ul([
      '<code>E</code> একটি object—শব্দ → teaching vector। মন্তব্যে dimension-এর নাম।',
      '<code>nearest(q, exclude)</code>: exclude-এর শব্দ বাদ দিয়ে cosine অনুযায়ী সাজানো।',
      '<code>g = নারী − পুরুষ</code>: লিঙ্গ-দিক; projection = cosine(শব্দ, g)।',
    ]),
    why: p('“চুড়ি”-র analogy ইচ্ছাকৃতভাবে এমন একটি প্রশ্ন যার কোনো ভালো উত্তর vocabulary-তে নেই—embedding সার্চ তবুও সবসময় “কাছের” কিছু দেয়। শিক্ষক-এর vector সমান রাখা হয়েছে যাতে নিরপেক্ষ রেফারেন্স (০) দেখা যায়।'),
    remember: ['analogy: b − a + c, প্রশ্ন-শব্দ বাদ', 'nearest neighbor সবসময় কিছু দেয়—ভালো উত্তর না থাকলেও', 'embedding সামাজিক পক্ষপাত শিখতে পারে', 'পক্ষপাত প্রতিটি মডেলে মাপতে হয়'],
    skip: ['debiasing পদ্ধতি ও তাদের সীমা', 'WEAT পরীক্ষা'],
    experiment: p('“আংটি − নারী + পুরুষ” চালান। আংটি প্রায় লিঙ্গ-নিরপেক্ষ (০.২, ০.২)—উত্তর কী এল? একটি নিরপেক্ষ শব্দে লিঙ্গ-analogy প্রয়োগের অর্থ কী?'),
    mistakes: ['analogy-তে প্রশ্ন-শব্দ বাদ না দেওয়া', 'nearest neighbor-এর উত্তরকে সবসময় অর্থবহ ধরা', 'teaching vector-এর ফলকে বাস্তব মডেলের ফল বলা', 'পক্ষপাত না মেপে embedding-কে নিরপেক্ষ ধরে নেওয়া'],
    quiz: [
      { q: 'analogy সমাধানে a, b, c বাদ দেওয়া হয় কেন?', a: { a: 'গতি বাড়াতে', b: 'q প্রায়ই c-এর সবচেয়ে কাছে থাকে, তাই না বাদ দিলে উত্তর প্রায়ই c নিজেই', c: 'নিয়ম নেই' }, ok: 'b', why: 'পার্থক্য-vector ছোট হলে q ≈ E[c]।' },
      { q: 'সার্চে “পুরুষের চুড়ি” জাতীয় প্রশ্নে vocabulary-তে মানানসই কিছু নেই। embedding search কী করবে?', a: { a: 'কিছু দেখাবে না', b: 'তবুও সবচেয়ে কাছের কিছু দেখাবে—তাই similarity threshold দরকার', c: 'এরর দেবে' }, ok: 'b', why: 'nearest neighbor সবসময় একটি ক্রম দেয়; “ভালো মিল নেই” বলার জন্য আলাদা নিয়ম লাগে (পরের পাঠ)।' },
      { q: 'একটি পেশা-শব্দের লিঙ্গ-projection ০.৫। এর অর্থ?', a: { a: 'পেশাটি বাস্তবে শুধু নারীদের', b: 'এই embedding পেশাটিকে নারী-দিকে যুক্ত করেছে, সম্ভবত training টেক্সটের প্যাটার্ন থেকে', c: 'embedding ভুল' }, ok: 'b', why: 'embedding টেক্সটের পরিসংখ্যান প্রতিফলিত করে, সত্য বা ন্যায্যতা নয়।' },
    ],
    recap: ['vector গাণিতিক আকর্ষণীয় কিন্তু ভঙ্গুর', 'nearest neighbor-এর threshold লাগে', 'পক্ষপাত মাপুন, ধরে নেবেন না'],
    nextNote: 'সব একসাথে—বাংলা পণ্য-সার্চ প্রজেক্ট:',
    sources: [SRC.word2vec, ['Bolukbasi et al. — Man is to Computer Programmer as Woman is to Homemaker? (NeurIPS 2016)', 'https://arxiv.org/abs/1607.06520'], ['Nissim et al. — Fair is Better than Sensational (Computational Linguistics 2020)', 'https://aclanthology.org/2020.cl-2.7/']],
  },
  {
    id: 'les-07-05-project-semantic-search',
    slug: 'project-bangla-product-search',
    title: 'প্রজেক্ট: Teaching Vector দিয়ে বাংলা পণ্য-সার্চ',
    minutes: 70,
    prereqs: ['les-07-04-vector-arithmetic-bias', 'les-04-06-metrics'],
    summary: 'সিন্থেটিক পণ্য-তালিকা; শব্দ teaching vector-এর গড় = query/পণ্য vector; cosine top-k; keyword search-এর সাথে recall@3 তুলনা; similarity threshold; ব্যর্থতার বিশ্লেষণ।',
    overview: p('এই প্রজেক্টে ১০টি সিন্থেটিক পণ্যের একটি তালিকায় দুই ধরনের সার্চ বানাব: (১) keyword search—query-র শব্দ পণ্যের শিরোনামে আছে কিনা, (২) embedding search—প্রতিটি শব্দের হাতে-বানানো teaching vector-এর গড় দিয়ে query ও পণ্যের vector, তারপর cosine। লেবেল-করা ৮টি query-তে recall@3 মাপব, সমার্থক শব্দে (“মূল্য”, “গলার হার”) কোনটি কাজ করে দেখব, এবং similarity threshold দিয়ে “কোনো ভালো মিল নেই” উত্তর দেব। শেষে ব্যর্থ query-গুলো বিশ্লেষণ করব।'),
    objectives: ['শব্দ-vector-এর গড় দিয়ে query ও document vector বানাতে পারবেন', 'keyword ও embedding search-কে recall@k দিয়ে তুলনা করতে পারবেন', 'similarity threshold ও ব্যর্থতা-বিশ্লেষণ দিয়ে সার্চের সীমা সৎভাবে দেখাতে পারবেন'],
    problem: p('গ্রাহক সার্চ করলেন “গলার মালা”। পণ্যের শিরোনামে আছে “সোনালি নেকলেস সেট”। keyword search কিছুই পায় না। আবার “ল্যাপটপ” সার্চ করলে—যা দোকানে নেই—embedding search তবুও কিছু একটা দেখায়। দুই সমস্যারই সমাধান চাই, এবং প্রমাণ চাই কোনটি কতটা ভালো।'),
    explain:
      p('<strong>vector বানানো:</strong> টেক্সট → token → যেসব token-এর teaching vector আছে তাদের গড়। কোনো token না চিনলে vector = null (খালি)—শূন্য vector-এ cosine অসংজ্ঞায়িত (অধ্যায় ৩)।') +
      p(`${term('রিকল@k', 'recall@k')}: প্রতিটি query-র জন্য সঠিক পণ্যগুলোর কত ভাগ প্রথম k ফলাফলে আছে, সব query-র গড়। এখানে প্রতিটি query-র ১–২টি সঠিক পণ্য হাতে লেবেল করা।`) +
      p('<strong>Threshold:</strong> সেরা cosine একটি সীমার (যেমন ০.৬) নিচে হলে “ভালো মিল পাওয়া যায়নি” বলি—ভুল পণ্য দেখানোর চেয়ে সৎ। threshold-ও hyperparameter; আদর্শভাবে আলাদা validation query দিয়ে বাছাই।') +
      table(['', 'Keyword', 'Embedding (teaching vector)'], [
        ['সমার্থক শব্দ', 'ব্যর্থ', 'কাজ করে যদি vector-এ ধরা থাকে'],
        ['নির্দিষ্ট মডেল নম্বর/SKU', 'নিখুঁত', 'দুর্বল'],
        ['অজানা শব্দ', 'কিছু পায় না', 'কিছু পায় না (vector নেই)'],
        ['দোকানে নেই এমন জিনিস', 'সাধারণত কিছু পায় না', 'threshold ছাড়া ভুল কিছু দেখায়'],
      ], 'দুই সার্চের শক্তি-দুর্বলতা') +
      warn('teaching vector হাতে বানানো—আমরাই ঠিক করেছি “মালা” ও “নেকলেস” কাছাকাছি। বাস্তব সিস্টেমে embedding মডেল থেকে আসে, এবং তার মান বাংলা ও আপনার পণ্য-শব্দে আলাদাভাবে মাপতে হয়। ৮টি query-র recall কোনো বাস্তব দোকানের কার্যকারিতা প্রমাণ করে না।'),
    analogy: {
      text: 'keyword search হলো লাইব্রেরির ক্যাটালগে হুবহু শিরোনাম খোঁজা; embedding search হলো লাইব্রেরিয়ানকে বিষয় বলা, যিনি কাছাকাছি বই এনে দেন।',
      breaks: 'ভালো লাইব্রেরিয়ান বলবেন “এই বিষয়ে আমাদের বই নেই”; embedding search নিজে থেকে বলে না—threshold না দিলে সে সবসময় কিছু এনে দেয়।',
    },
    worked:
      p('query “গলার মালা”: teaching vector গলা = [০, ১, ০, ০, ০.৮, …], মালা = [০, ১, ০, ০, ০.৯, …]; গড় = [০, ১, ০, ০, ০.৮৫, …]।') +
      ol([
        'পণ্য “সোনালি নেকলেস সেট”: সোনালি, নেকলেস, সেট-এর গড়।',
        'দুই গড়-vector-এর cosine উচ্চ, কারণ “গয়না” ও “গলা” dimension দুটোতেই বড়।',
        'keyword: “গলার”, “মালা” শিরোনামে নেই → ০ ফল।',
      ]),
    activity: p('<strong>প্রজেক্ট মানদণ্ড:</strong> (১) দুই সার্চের recall@3 টেবিল, (২) সমার্থক-query-তে কোনটি জিতল তার একটি উদাহরণ, (৩) keyword জিতল এমন একটি উদাহরণ, (৪) threshold-এর পর “পাওয়া যায়নি” উত্তর, (৫) teaching vector-এর সীমা তিন বাক্যে।'),
    code: [
      {
        label: 'প্রজেক্ট: keyword বনাম embedding search (সিন্থেটিক তালিকা)',
        starter: COS + String.raw`
// dimension: [পোশাক, গয়না, ঘর-সাজ, রান্না, গলা, হাত, সোনালি, দাম]  — হাতে বানানো teaching vector
const W = {
  "শাড়ি": [1, 0, 0, 0, 0, 0, 0, 0], "জামদানি": [1, 0, 0, 0, 0, 0, 0, 0], "পাঞ্জাবি": [1, 0, 0, 0, 0, 0, 0, 0], "কুর্তা": [0.9, 0, 0, 0, 0, 0, 0, 0],
  "নেকলেস": [0, 1, 0, 0, 1, 0, 0, 0], "মালা": [0, 1, 0, 0, 0.9, 0, 0, 0], "হার": [0, 1, 0, 0, 0.9, 0, 0, 0], "গলার": [0, 0.6, 0, 0, 1, 0, 0, 0],
  "চুড়ি": [0, 1, 0, 0, 0, 1, 0, 0], "বালা": [0, 1, 0, 0, 0, 0.9, 0, 0], "হাতের": [0, 0.5, 0, 0, 0, 1, 0, 0],
  "ল্যাম্প": [0, 0, 1, 0, 0, 0, 0, 0], "বাতি": [0, 0, 0.9, 0, 0, 0, 0, 0], "ফুলদানি": [0, 0, 1, 0, 0, 0, 0, 0], "ঘর": [0, 0, 0.8, 0, 0, 0, 0, 0],
  "হাঁড়ি": [0, 0, 0, 1, 0, 0, 0, 0], "কড়াই": [0, 0, 0, 1, 0, 0, 0, 0], "রান্নার": [0, 0, 0, 0.9, 0, 0, 0, 0],
  "সোনালি": [0, 0.3, 0, 0, 0, 0, 1, 0], "গোল্ডেন": [0, 0.3, 0, 0, 0, 0, 1, 0], "সেট": [0, 0.2, 0, 0.2, 0, 0, 0, 0],
  "সস্তা": [0, 0, 0, 0, 0, 0, 0, 1], "কম": [0, 0, 0, 0, 0, 0, 0, 0.6], "দামের": [0, 0, 0, 0, 0, 0, 0, 0.5],
};
const PRODUCTS = [
  { id: "P1", title: "লাল জামদানি শাড়ি" }, { id: "P2", title: "সাদা পাঞ্জাবি" }, { id: "P3", title: "সোনালি নেকলেস সেট" },
  { id: "P4", title: "কাচের চুড়ি" }, { id: "P5", title: "পিতলের বালা" }, { id: "P6", title: "টেবিল ল্যাম্প" },
  { id: "P7", title: "মাটির ফুলদানি" }, { id: "P8", title: "অ্যালুমিনিয়াম হাঁড়ি সেট" }, { id: "P9", title: "নন-স্টিক কড়াই" },
  { id: "P10", title: "সুতির কুর্তা" },
];
// হাতে লেবেল করা query → সঠিক পণ্য
const QUERIES = [
  { q: "গলার মালা", rel: ["P3"] }, { q: "হাতের গয়না", rel: ["P4", "P5"] }, { q: "ঘর সাজানোর বাতি", rel: ["P6"] },
  { q: "রান্নার হাঁড়ি", rel: ["P8"] }, { q: "শাড়ি", rel: ["P1"] }, { q: "গোল্ডেন হার", rel: ["P3"] },
  { q: "চুড়ি", rel: ["P4"] }, { q: "কড়াই", rel: ["P9"] },
];
const tokens = (s) => s.split(/\s+/).filter(Boolean);
function embed(text) {
  const vs = tokens(text).map((t) => W[t]).filter(Boolean);
  if (!vs.length) return null;
  return vs[0].map((_, i) => vs.reduce((s, v) => s + v[i], 0) / vs.length);
}
const PV = PRODUCTS.map((p) => ({ ...p, v: embed(p.title) }));

function keywordSearch(q, k = 3) {
  const qt = tokens(q);
  return PRODUCTS.map((p) => [p.id, qt.filter((t) => tokens(p.title).includes(t)).length]).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).slice(0, k);
}
function embedSearch(q, k = 3, threshold = 0) {
  const qv = embed(q);
  if (!qv) return { results: [], reason: "query-র কোনো শব্দের vector নেই" };
  const ranked = PV.filter((p) => p.v).map((p) => [p.id, cosine(qv, p.v)]).sort((a, b) => b[1] - a[1]);
  if (ranked[0][1] < threshold) return { results: [], reason: "সেরা মিল " + r3(ranked[0][1]) + " < threshold " + threshold };
  return { results: ranked.slice(0, k) };
}
const recallAt = (ids, rel) => rel.filter((r) => ids.includes(r)).length / rel.length;

let rk = 0, re = 0;
for (const { q, rel } of QUERIES) {
  const kw = keywordSearch(q).map(([id]) => id), em = embedSearch(q).results.map(([id]) => id);
  rk += recallAt(kw, rel); re += recallAt(em, rel);
  console.log(q.padEnd(16), "| keyword:", JSON.stringify(kw).padEnd(14), "| embedding:", JSON.stringify(em));
}
const recall = { keyword: rk / QUERIES.length, embedding: re / QUERIES.length };
console.log("recall@3 → keyword:", r3(recall.keyword), "| embedding:", r3(recall.embedding), "(query n=" + QUERIES.length + ")");

// দোকানে নেই / অচেনা
for (const q of ["সস্তা ল্যাপটপ", "ল্যাপটপ", "কম দামের শাড়ি"]) {
  const r = embedSearch(q, 3, 0.6);
  console.log("«" + q + "» →", r.results.length ? r.results.map(([id, c]) => id + "(" + r3(c) + ")").join(", ") : "পাওয়া যায়নি: " + r.reason);
}
`,
        expect: ['গলার মালা', 'recall@3 → keyword:', '«ল্যাপটপ» → পাওয়া যায়নি: query-র কোনো শব্দের vector নেই'],
        hints: ['“গলার মালা”, “গোল্ডেন হার”-এ keyword কী পেল? embedding?', '“সস্তা ল্যাপটপ”-এ শুধু “সস্তা”-র vector আছে—তাই query vector শুধু “দাম” dimension। কোন পণ্যের vector-এ দাম dimension নেই? threshold কী করল?', '“কম দামের শাড়ি”—মডেল “শাড়ি” ধরল, কিন্তু দাম-শর্ত কি যাচাই করা হলো? (পণ্যের আসল দাম ডেটায় নেই—vector দিয়ে দাম ফিল্টার করা যায় না।)', '“শাড়ি” query-তে P1, P2, P10-এর cosine হুবহু সমান। আমাদের vector-এ শাড়ি, পাঞ্জাবি, কুর্তা সবার শুধু “পোশাক” dimension—তাই মডেল এদের আলাদা করতে পারে না; P1 প্রথম শুধু তালিকার ক্রমের কারণে। recall = ১ এখানে ভাগ্যের ফল।'],
        test: '__assert(recall.embedding>recall.keyword,"embedding better on synonyms here"); __assert(keywordSearch("গলার মালা").length===0,"kw misses synonym"); __assert(embedSearch("গলার মালা").results[0][0]==="P3","emb finds P3"); __assert(embedSearch("ল্যাপটপ",3,0.6).results.length===0,"unknown handled"); __assert(embedSearch("সস্তা ল্যাপটপ",3,0.6).results.length===0,"threshold blocks"); var sr=embedSearch("শাড়ি").results; __assert(sr[0][1]===sr[1][1]&&sr[1][1]===sr[2][1],"tie quoted"); __close(recall.keyword,0.5,1e-12,"kw recall quoted"); __close(recall.embedding,1,1e-12,"emb recall quoted");',
      },
    ],
    line: ul([
      '<code>W</code>: শব্দ → teaching vector; dimension-এর নাম মন্তব্যে।',
      '<code>embed</code>: পরিচিত শব্দের গড়; কোনোটি না চিনলে null—শূন্য vector-এ cosine এড়ানো।',
      '<code>keywordSearch</code>: শিরোনামে হুবহু শব্দ-মিল গণনা।',
      '<code>embedSearch(q, k, threshold)</code>: cosine-ক্রম; সেরাটি threshold-এর নিচে হলে কারণসহ খালি ফল।',
      '<code>recallAt</code>: সঠিক পণ্যের কত ভাগ প্রথম k-তে।',
    ]),
    why: p('ব্যর্থতার কারণ (“vector নেই”, “threshold-এর নিচে”) ফলাফলের সাথে ফেরত দেওয়া হয়েছে, যাতে ব্যবহারকারী ও ডেভেলপার বুঝতে পারেন কেন কিছু দেখানো হয়নি। “কম দামের শাড়ি” রাখা হয়েছে একটি গুরুত্বপূর্ণ সীমা দেখাতে: embedding দাম-সংখ্যা যাচাই করে না—এর জন্য structured filter লাগে।'),
    remember: ['গড় শব্দ-vector = সরল document vector', 'recall@k দিয়ে সার্চ তুলনা', 'threshold দিয়ে “পাওয়া যায়নি”', 'সংখ্যাগত শর্তে (দাম) structured filter লাগে'],
    skip: ['BM25 (অধ্যায় ১১-এ hybrid search)', 'approximate nearest neighbor index', 'শেখা sentence embedding মডেল'],
    experiment: p('“সাদা পাঞ্জাবি” query যোগ করুন (rel: P2)। “সাদা”-র vector নেই—embedding কোনটি পায়? keyword? দুই পদ্ধতি মেশানো (hybrid) কেন যুক্তিসঙ্গত তা এক অনুচ্ছেদে লিখুন।'),
    mistakes: ['threshold ছাড়া embedding search চালু করা', 'শূন্য vector-এ cosine হিসাব (NaN)', 'দাম/স্টকের মতো শর্ত embedding দিয়ে মেলানোর চেষ্টা', 'teaching vector-এর ফলকে বাস্তব মডেলের মান বলা'],
    solutionNote: p('QuickJS-এ চালানো ফলে embedding search-এর recall@3 keyword-এর চেয়ে বেশি, মূলত সমার্থক query (“গলার মালা”, “গোল্ডেন হার”, “হাতের গয়না”, “ঘর সাজানোর বাতি”)-র কারণে: keyword ০.৫, embedding ১.০—কারণ আমরা teaching vector-এ সেই মিল নিজেরাই বসিয়েছি। “শাড়ি” query-র সঠিক ফল একটি টাই-এর ভাগ্যে এসেছে (P1, P2, P10 সমান স্কোর)। “ল্যাপটপ” কোনো vector পায় না; “সস্তা ল্যাপটপ” threshold-এ আটকায়। <strong>সীমা:</strong> (১) vector হাতে বানানো—এই recall আমাদের নিজের নকশার প্রতিফলন; (২) “সাদা”, “লাল”-এর মতো রঙের শব্দ vector-এ নেই, তাই রঙ উপেক্ষিত; (৩) দাম ও স্টক যাচাই হয় না; (৪) শাড়ি ও পাঞ্জাবির মতো একই শ্রেণির পণ্য আলাদা করার dimension নেই।'),
    quiz: [
      { q: 'একটি query-র সঠিক পণ্য ২টি, প্রথম ৩ ফলে আছে ১টি। recall@3?', a: { a: '০.৫', b: '০.৩৩', c: '১' }, ok: 'a', why: '১/২ = ০.৫।' },
      { q: 'SKU “AB-1204” খুঁজতে কোনটি ভালো?', a: { a: 'Embedding search', b: 'Keyword search', c: 'দুটোই সমান' }, ok: 'b', why: 'নির্দিষ্ট কোডের কোনো “অর্থ” নেই; হুবহু মিলই দরকার।' },
      { q: 'embedding search-এ similarity threshold-এর উদ্দেশ্য?', a: { a: 'গতি বাড়ানো', b: 'ভালো মিল না থাকলে ভুল পণ্য দেখানোর বদলে “পাওয়া যায়নি” বলা', c: 'recall বাড়ানো' }, ok: 'b', why: 'nearest neighbor সবসময় কিছু দেয়; threshold সেই আচরণ নিয়ন্ত্রণ করে (recall কিছুটা কমতে পারে)।' },
    ],
    recap: ['দুই সার্চ, এক মূল্যায়ন', 'সমার্থকে embedding, হুবহু-কোডে keyword', 'threshold ও structured filter'],
    nextNote: 'শব্দের vector প্রসঙ্গ-নিরপেক্ষ: “হার” (গয়না) ও “হার” (পরাজয়) একই vector। প্রসঙ্গ অনুযায়ী vector বদলানো—attention:',
    synthetic: true,
    sources: [SRC.jurafsky, ['Manning, Raghavan & Schütze — Introduction to Information Retrieval (Evaluation chapter)', 'https://nlp.stanford.edu/IR-book/html/htmledition/evaluation-in-information-retrieval-1.html'], SRC.word2vec],
  },
];

export default { chapter, lessons };

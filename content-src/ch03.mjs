import { p, ul, ol, code, out, note, warn, table, term, SRC } from './lib.mjs';

const chapter = {
  id: 'ch-03-math-foundations',
  slug: 'goniter-vitti',
  title: 'গণিতের ভিত্তি',
  order: 3,
  public: false,
  summary: 'Scalar, vector, matrix ও shape; dot product ও cosine similarity; weighted sum; সম্ভাব্যতা; logarithm; derivative, gradient, chain rule ও gradient descent।',
  overview: p(
    'Machine learning-এর গণিত ভয়ের কিছু নয়—ছোট সংখ্যা দিয়ে ধাপে ধাপে করলে প্রতিটি ধারণা স্কুলের পাটিগণিতের ওপর দাঁড়ায়। এই অধ্যায়ে scalar থেকে শুরু করে vector, matrix ও তাদের shape; dot product দিয়ে মিল মাপা; weighted sum (প্রতিটি neuron-এর মূল গণনা); সম্ভাব্যতা ও শর্তসাপেক্ষ সম্ভাব্যতা; logarithm; এবং derivative, gradient, chain rule থেকে gradient descent পর্যন্ত যাব।',
    'প্রতিটি সূত্র আগে হাতে ছোট সংখ্যায় হিসাব, তারপর JavaScript-এ। দুটি প্রজেক্ট: vector similarity explorer এবং gradient descent visualizer। পূর্ণ পাঠ পড়তে বিনামূল্যে লগইন করুন।'
  ),
};

const lessons = [
  {
    id: 'les-03-01-scalars-vectors',
    slug: 'scalar-vector',
    title: 'Scalar, Vector ও Dimension',
    minutes: 30,
    prereqs: ['les-02-04-loops-modules'],
    summary: 'একটি সংখ্যা = scalar; সংখ্যার ক্রমিক তালিকা = vector; dimension = কয়টি সংখ্যা; vector যোগ ও scalar দিয়ে গুণ।',
    overview: p('Scalar হলো একটি মাত্র সংখ্যা (যেমন দাম ৪৫০), আর vector হলো নির্দিষ্ট ক্রমে সাজানো কয়েকটি সংখ্যা (যেমন একটি পণ্যের [দাম, ওজন, রেটিং])। Vector-এর dimension মানে তাতে কয়টি সংখ্যা আছে। এই পাঠে দেখব কেন ML-এ প্রতিটি ডেটা-উদাহরণ একটি vector, কীভাবে দুই vector যোগ ও scalar দিয়ে গুণ করা হয়, এবং dimension না মিললে কেন হিসাব অর্থহীন। JavaScript-এ vector-কে array হিসেবে লিখে ছোট ফাংশন বানাব।'),
    objectives: ['scalar ও vector আলাদা করতে এবং vector-এর dimension বলতে পারবেন', 'হাতে ও কোডে vector যোগ ও scalar গুণ করতে পারবেন', 'dimension না মিললে হিসাব থামাতে (validate) পারবেন'],
    problem: p('দুটি গ্রাহকের কেনাকাটার অভ্যাস তুলনা করতে চান: মাসে কয়টি অর্ডার, গড় খরচ, কয়টি ফেরত। প্রতিটি গ্রাহকের তিনটি আলাদা সংখ্যা। “এই দুই গ্রাহক কতটা কাছাকাছি?”—এই প্রশ্ন করতে হলে তিনটি সংখ্যাকে একটি একক বস্তু হিসেবে ভাবতে হবে।'),
    explain:
      p(`${term('স্কেলার', 'scalar')}: একটি সংখ্যা—<code>450</code>, <code>0.3</code>।`) +
      p(`${term('ভেক্টর', 'vector')}: নির্দিষ্ট ক্রমে কয়েকটি সংখ্যা। গ্রাহক A = [৪, ১২০০, ১] মানে (অর্ডার=৪, গড় খরচ=১২০০, ফেরত=১)। ক্রম গুরুত্বপূর্ণ: [১, ১২০০, ৪] সম্পূর্ণ ভিন্ন গ্রাহক।`) +
      p(`${term('ডাইমেনশন', 'dimension')}: vector-এ কয়টি সংখ্যা। উপরের vector-এর dimension ৩। একটি LLM-এর একটি token-এর embedding vector-এর dimension কয়েক শত থেকে কয়েক হাজার হতে পারে—ধারণা একই, শুধু সংখ্যা বেশি।`) +
      p('<strong>দুটি মৌলিক কাজ:</strong>') +
      ul([
        '<strong>Vector যোগ:</strong> একই অবস্থানের সংখ্যা যোগ। [১, ২] + [১০, ২০] = [১১, ২২]। শুধু একই dimension-এর vector যোগ করা যায়।',
        '<strong>Scalar দিয়ে গুণ:</strong> প্রতিটি সংখ্যাকে গুণ। ৩ × [১, ২] = [৩, ৬]।',
      ]) +
      p('জ্যামিতিতে ২-dimension vector হলো একটি তীর: [৩, ৪] মানে ডানে ৩, উপরে ৪। কিন্তু ML-এর vector প্রায়ই জ্যামিতিক নয়—“অর্ডার সংখ্যা” আর “খরচ” একই ধরনের দিক নয়। তাই ভিন্ন এককের feature-কে প্রায়ই একই পরিসরে আনা হয় (scaling, অধ্যায় ৪)।'),
    analogy: {
      text: 'Vector হলো একটি রিপোর্ট কার্ড: [বাংলা, গণিত, বিজ্ঞান] = [৮০, ৭০, ৯০]। প্রতিটি অবস্থানের একটি নির্দিষ্ট অর্থ।',
      breaks: 'রিপোর্ট কার্ডের সব বিষয় একই স্কেলে (১০০-এ)। ML-এর vector-এ একটি সংখ্যা ১২০০ (টাকা), আরেকটি ১ (ফেরত)—সরাসরি তুলনা করলে বড় এককের সংখ্যাই সব প্রভাব খাটায়।',
    },
    worked:
      p('গ্রাহক A = [৪, ১২০০, ১], গ্রাহক B = [২, ৮০০, ০]।') +
      ol([
        'A + B = [৪+২, ১২০০+৮০০, ১+০] = [৬, ২০০০, ১] — দুজনের মোট।',
        '০.৫ × (A + B) = [৩, ১০০০, ০.৫] — দুজনের গড় গ্রাহক।',
        'A − B = [২, ৪০০, ১] — পার্থক্য। লক্ষ্য করুন ৪০০ সংখ্যাটি অন্য দুটিকে ছাপিয়ে যায়; এজন্য পরে scaling লাগবে।',
      ]),
    activity: note('এই অধ্যায় থেকে কোডে ছোট গণিত-ফাংশন বানাব এবং প্রতিবার হাতে করা হিসাবের সাথে মিলাব।'),
    code: [
      {
        label: 'vector যোগ, scalar গুণ ও dimension যাচাই',
        starter: String.raw`function add(a, b) {
  if (a.length !== b.length) {
    throw new Error("dimension মেলেনি: " + a.length + " বনাম " + b.length);
  }
  return a.map((x, i) => x + b[i]);
}

function scale(k, v) {
  return v.map((x) => k * x);
}

const A = [4, 1200, 1];
const B = [2, 800, 0];

console.log("A + B =", add(A, B));
console.log("গড় =", scale(0.5, add(A, B)));
console.log("A - B =", add(A, scale(-1, B)));
console.log("dimension:", A.length);

try {
  add(A, [1, 2]);
} catch (err) {
  console.log("ধরা পড়েছে:", err.message);
}
`,
        expect: ['A + B = [6,2000,1]', 'গড় = [3,1000,0.5]', 'A - B = [2,400,1]', 'ধরা পড়েছে: dimension মেলেনি: 3 বনাম 2'],
        hints: ['map-এর দ্বিতীয় parameter i হলো index—b[i] দিয়ে একই অবস্থানের সংখ্যা পাই।', 'বিয়োগ = যোগ + (−১ × B)।', 'dimension যাচাই না থাকলে [4,1200,1] + [1,2] কী দিত? throw লাইন মুছে দেখুন (NaN আসবে)।'],
        test: '__assert(JSON.stringify(add([1,2],[10,20]))==="[11,22]","add"); __assert(JSON.stringify(scale(3,[1,2]))==="[3,6]","scale");',
      },
    ],
    line: ul([
      '<code>a.map((x, i) => x + b[i])</code>: a-এর প্রতিটি সংখ্যা x ও তার index i; b-এর একই index-এর সংখ্যা যোগ।',
      '<code>throw new Error(...)</code>: ভুল dimension-এ নীরবে NaN না দিয়ে স্পষ্ট এরর—অধ্যায় ২-এর debugging শিক্ষা।',
      '<code>scale(-1, B)</code>: B-এর প্রতিটি সংখ্যার চিহ্ন উল্টায়; তারপর যোগ = বিয়োগ।',
    ]),
    why: p('vector-কে array, অপারেশনকে ছোট function হিসেবে লিখলে পরের পাঠের dot product, matrix ও neural network একই ভিত্তিতে দাঁড়ায়। Dimension যাচাই এখনই শিখলে পরে “shape mismatch” বাগ দ্রুত ধরতে পারবেন।'),
    remember: ['scalar = একটি সংখ্যা; vector = ক্রমিক সংখ্যার তালিকা', 'dimension = vector-এর দৈর্ঘ্য', 'যোগ/বিয়োগ শুধু একই dimension-এ', 'feature-এর একক আলাদা হলে scaling লাগতে পারে'],
    skip: ['vector space-এর আনুষ্ঠানিক সংজ্ঞা', 'basis ও linear independence'],
    experiment: p('তৃতীয় গ্রাহক C = [৩, ১০০০, ২] যোগ করে তিনজনের গড় vector হিসাব করুন (যোগ করে ১/৩ দিয়ে গুণ)। আগে হাতে করুন, তারপর কোডে মিলান।'),
    mistakes: ['ভিন্ন dimension-এর vector যোগ করা', 'vector-এর ক্রম গুরুত্বহীন ভাবা', 'scale(k, v)-তে v-কে সরাসরি বদলে ফেলা (map নতুন array দেয়, তাই এখানে নিরাপদ)'],
    quiz: [
      { q: '[২, ৫, ১] vector-এর dimension কত?', a: { a: '১', b: '৩', c: '৮' }, ok: 'b', why: 'dimension মানে সংখ্যার সংখ্যা—তিনটি। ৮ হলো যোগফল, যা dimension নয়।' },
      { q: '২ × [১, −৩] = ?', a: { a: '[২, −৬]', b: '[৩, −১]', c: '−২' }, ok: 'a', why: 'scalar গুণে প্রতিটি সংখ্যা ২ দিয়ে গুণ হয়: [২×১, ২×(−৩)]।' },
      { q: '[১, ২, ৩] + [১, ২] করা যায় কি?', a: { a: 'হ্যাঁ, ফল [২, ৪, ৩]', b: 'না, dimension ভিন্ন—অপারেশনটি সংজ্ঞায়িত নয়', c: 'হ্যাঁ, ফল ৯' }, ok: 'b', why: 'vector যোগ একই অবস্থানের সংখ্যা জোড়ায়; ভিন্ন দৈর্ঘ্যে কিছু অবস্থানের জোড়া নেই।' },
    ],
    recap: ['ডেটার প্রতিটি উদাহরণ একটি vector', 'যোগ ও scalar গুণ অবস্থান-ভিত্তিক', 'dimension যাচাই বাগ আটকায়'],
    nextNote: 'দুই vector কতটা “মিলে” তা মাপার সবচেয়ে গুরুত্বপূর্ণ অপারেশন:',
    synthetic: true,
    sources: [SRC.mml, SRC.khan, SRC.d2l],
  },
  {
    id: 'les-03-02-dot-product-similarity',
    slug: 'dot-product-similarity',
    title: 'Dot Product, দৈর্ঘ্য ও Cosine Similarity (প্রজেক্ট: Similarity Explorer)',
    minutes: 45,
    prereqs: ['les-03-01-scalars-vectors'],
    summary: 'dot product = অবস্থান-ভিত্তিক গুণফলের যোগ; norm = দৈর্ঘ্য; cosine similarity = দিক কতটা মেলে; শূন্য vector-এর edge case।',
    overview: p('Dot product দুই vector-এর একই অবস্থানের সংখ্যা গুণ করে যোগ করে—এটি ML-এর সবচেয়ে বেশি ব্যবহৃত অপারেশন: neuron, attention ও semantic search সবই এর ওপর দাঁড়ানো। এই পাঠে dot product, vector-এর দৈর্ঘ্য (norm) এবং cosine similarity হাতে হিসাব করব, শূন্য vector-এ কেন ভাগ করা যায় না তা দেখব, এবং একটি ছোট “similarity explorer” প্রজেক্টে কয়েকটি পণ্যের feature vector-এর মধ্যে সবচেয়ে কাছেরটি খুঁজব।'),
    objectives: ['হাতে ও কোডে dot product ও norm হিসাব করতে পারবেন', 'cosine similarity হিসাব করে তার পরিসর (−১ থেকে ১) ব্যাখ্যা করতে পারবেন', 'শূন্য vector-এর edge case নিরাপদে সামলাতে পারবেন'],
    problem: p('একজন গ্রাহক একটি “সুতি পাঞ্জাবি” দেখছেন। পাশে “আপনার পছন্দ হতে পারে” তালিকায় কী দেখাবেন? প্রতিটি পণ্যকে [ফর্মাল, গরমে আরাম, দামি] স্কোর দিয়ে vector বানালে প্রশ্ন দাঁড়ায়: কোন vector পাঞ্জাবির vector-এর সবচেয়ে কাছের?'),
    explain:
      p(`${term('ডট প্রোডাক্ট', 'dot product')}: a · b = a₁b₁ + a₂b₂ + … + aₙbₙ। ফল একটি scalar।`) +
      p('[১, ২, ৩] · [৪, ৫, ৬] = ১×৪ + ২×৫ + ৩×৬ = ৪ + ১০ + ১৮ = <strong>৩২</strong>।') +
      p(`${term('নর্ম বা দৈর্ঘ্য', 'norm, ‖a‖')}: ‖a‖ = √(a · a)। [৩, ৪]-এর দৈর্ঘ্য = √(৯ + ১৬) = √২৫ = ৫ (পিথাগোরাসের উপপাদ্য)।`) +
      p(`${term('কোসাইন সিমিলারিটি', 'cosine similarity')}: cos(a, b) = (a · b) / (‖a‖ × ‖b‖)। এটি দেখে দুই vector-এর <em>দিক</em> কতটা মেলে, দৈর্ঘ্য বাদ দিয়ে।`) +
      table(['cos মান', 'অর্থ'], [
        ['১', 'একই দিক (একটি অন্যটির ধনাত্মক গুণিতক)'],
        ['০', 'লম্ব (orthogonal)—কোনো মিল নেই'],
        ['−১', 'সম্পূর্ণ বিপরীত দিক'],
      ]) +
      warn('<strong>Edge case:</strong> কোনো vector সব শূন্য হলে তার দৈর্ঘ্য ০, আর ০ দিয়ে ভাগ অসংজ্ঞায়িত (JavaScript-এ NaN)। শূন্য vector-এর কোনো “দিক” নেই, তাই cosine-ও অর্থহীন। কোডে আগে যাচাই করে স্পষ্ট মান (যেমন null) ফেরত দিতে হবে।'),
    analogy: {
      text: 'cosine similarity হলো দুই জনের রুচির “দিক” তুলনা: একজন সামান্য ঝাল পছন্দ করেন, আরেকজন খুব ঝাল—দুজনের রুচির দিক একই, মাত্রা ভিন্ন।',
      breaks: 'মানুষের রুচির দিক বোঝা যায়, কিন্তু vector-এর সংখ্যাগুলো কে, কীভাবে দিয়েছে তার ওপর সব নির্ভর করে। হাতে বসানো স্কোর ভুল হলে “মিল”-ও ভুল—গণিত শুধু সংখ্যার মিল মাপে।',
    },
    worked:
      p('পাঞ্জাবি P = [০.৮, ০.৯, ০.৩], শার্ট S = [০.৬, ০.৭, ০.২], জ্যাকেট J = [০.৭, ০.১, ০.৯]।') +
      ol([
        'P · S = ০.৪৮ + ০.৬৩ + ০.০৬ = ১.১৭',
        '‖P‖ = √(০.৬৪ + ০.৮১ + ০.০৯) = √১.৫৪ ≈ ১.২৪১০',
        '‖S‖ = √(০.৩৬ + ০.৪৯ + ০.০৪) = √০.৮৯ ≈ ০.৯৪৩৪',
        'cos(P, S) = ১.১৭ / (১.২৪১০ × ০.৯৪৩৪) ≈ <strong>০.৯৯৯৪</strong>',
        'P · J = ০.৫৬ + ০.০৯ + ০.২৭ = ০.৯২; ‖J‖ = √১.৩১ ≈ ১.১৪৪৬ → cos(P, J) ≈ <strong>০.৬৪৮</strong>',
      ]) +
      p('শার্টের দিক পাঞ্জাবির প্রায় হুবহু; জ্যাকেট “গরমে আরাম”-এ খুব ভিন্ন। তাই সুপারিশ: শার্ট।') +
      note('এই স্কোরগুলো শেখানোর জন্য হাতে বসানো। বাস্তব সিস্টেমে vector আসে শেখা embedding থেকে (অধ্যায় ৭)।'),
    activity: p('<strong>প্রজেক্ট মানদণ্ড:</strong> (১) ৫টি পণ্যের vector-এর মধ্যে একটি query-এর সবচেয়ে কাছের ৩টি ক্রমানুসারে দেখান, (২) শূন্য vector-এ প্রোগ্রাম crash না করে স্পষ্ট বার্তা দেয়, (৩) dot product ও cosine-এর ক্রম কোথায় ভিন্ন হয় তার একটি উদাহরণ।'),
    code: [
      {
        label: 'প্রজেক্ট: Vector Similarity Explorer',
        starter: String.raw`function dot(a, b) {
  if (a.length !== b.length) throw new Error("dimension মেলেনি");
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}
const norm = (a) => Math.sqrt(dot(a, a));
function cosine(a, b) {
  const na = norm(a), nb = norm(b);
  if (na === 0 || nb === 0) return null;   // শূন্য vector: দিক নেই
  return dot(a, b) / (na * nb);
}
const r4 = (x) => (x === null ? null : Math.round(x * 10000) / 10000);

// [ফর্মাল, গরমে আরাম, দামি] — হাতে বসানো শিক্ষণ-স্কোর
const items = {
  "শার্ট":   [0.6, 0.7, 0.2],
  "জ্যাকেট": [0.7, 0.1, 0.9],
  "লুঙ্গি":  [0.1, 0.9, 0.1],
  "ব্লেজার": [1.6, 0.4, 1.8],
  "খালি":    [0, 0, 0],
};
const query = [0.8, 0.9, 0.3];   // পাঞ্জাবি

console.log("হাতে-হিসাব যাচাই: [1,2,3]·[4,5,6] =", dot([1, 2, 3], [4, 5, 6]));
const rows = Object.entries(items).map(([name, v]) => ({ name, dot: r4(dot(query, v)), cos: r4(cosine(query, v)) }));
rows.sort((a, b) => (b.cos ?? -2) - (a.cos ?? -2));
for (const r of rows) console.log(r.name.padEnd(8), "dot=", r.dot, "cos=", r.cos === null ? "অসংজ্ঞায়িত (শূন্য vector)" : r.cos);
`,
        expect: ['[1,2,3]·[4,5,6] = 32', 'শার্ট', 'cos= 0.9994', 'অসংজ্ঞায়িত (শূন্য vector)'],
        hints: ['ব্লেজারের dot সবচেয়ে বড় কেন, অথচ cosine-এ সে প্রথম নয়?', 'dot product দৈর্ঘ্যের ওপরও নির্ভর করে; বড় সংখ্যার vector dot-এ এগিয়ে যায়। cosine দৈর্ঘ্য বাদ দেয়।', '"খালি" vector-এ cosine null—r.cos ?? -2 দিয়ে sort-এ শেষে পাঠানো হয়েছে।'],
        test: '__close(cosine([0.8,0.9,0.3],[0.6,0.7,0.2]),0.99938,1e-4,"cos P,S"); __close(cosine([0.8,0.9,0.3],[0.7,0.1,0.9]),0.6478,1e-3,"cos P,J"); __assert(cosine([1,0],[0,0])===null,"zero"); __close(cosine([1,0],[0,1]),0,1e-12,"orthogonal"); __close(cosine([1,2],[-1,-2]),-1,1e-12,"opposite"); __close(norm([3,4]),5,1e-12,"norm");',
      },
    ],
    line: ul([
      '<code>dot</code>: for loop-এ <code>sum += a[i] * b[i]</code>—প্রতিটি অবস্থানের গুণফল যোগ।',
      '<code>norm = Math.sqrt(dot(a, a))</code>: নিজের সাথে dot = বর্গের যোগ; বর্গমূল = দৈর্ঘ্য।',
      '<code>if (na === 0 || nb === 0) return null</code>: শূন্য দিয়ে ভাগের আগেই থামা।',
      '<code>Object.entries(items).map(([name, v]) => …)</code>: প্রতিটি [নাম, vector] জোড়া থেকে ফলের object।',
      '<code>b.cos ?? -2</code>: <code>??</code> (nullish coalescing)—বাম পাশ null/undefined হলে ডান পাশের মান। এখানে null-কে সবচেয়ে ছোট ধরে সাজানো।',
      '<code>padEnd(8)</code>: নামের পরে স্পেস দিয়ে কলাম সোজা রাখা।',
    ]),
    why: p('dot ও cosine দুটোই দেখানো হয়েছে কারণ বাস্তবে দুটোই ব্যবহৃত হয়: attention-এ (অধ্যায় ৮) scaled dot product, semantic search-এ (অধ্যায় ৭) প্রায়ই cosine। “ব্লেজার” vector ইচ্ছাকৃতভাবে বড় সংখ্যার, যাতে দুই মাপের পার্থক্য চোখে পড়ে।'),
    remember: ['a · b = অবস্থান-ভিত্তিক গুণফলের যোগ', '‖a‖ = √(a · a)', 'cosine = দিকের মিল, −১ থেকে ১', 'শূন্য vector-এ cosine অসংজ্ঞায়িত'],
    skip: ['cosine-এর ত্রিকোণমিতিক প্রমাণ', 'Euclidean ছাড়া অন্য দূরত্ব (অধ্যায় ৭-এ সংক্ষেপে)'],
    experiment: p('query-কে ২ দিয়ে গুণ করুন ([১.৬, ১.৮, ০.৬])। dot মানগুলো কী হয়? cosine মানগুলো কী হয়? কেন একটি বদলায় আর অন্যটি বদলায় না—এক লাইনে লিখুন।'),
    mistakes: ['dot product-কে vector ভাবা—এটি একটি সংখ্যা', 'শূন্য vector যাচাই না করে ভাগ করা', 'বড় dot = বেশি মিল ধরে নেওয়া—দৈর্ঘ্যের প্রভাব ভুলে যাওয়া', 'হাতে বসানো স্কোরকে “AI বুঝেছে” বলা'],
    quiz: [
      { q: '[২, ০, ১] · [৩, ৫, ৪] = ?', a: { a: '১০', b: '১৫', c: '[৬, ০, ৪]' }, ok: 'a', why: '২×৩ + ০×৫ + ১×৪ = ৬ + ০ + ৪ = ১০। ফল একটি scalar; [৬, ০, ৪] হলো অবস্থান-ভিত্তিক গুণফল, যোগ করার আগের ধাপ।' },
      { q: '[১, ০] ও [০, ১]-এর cosine similarity কত?', a: { a: '১', b: '০', c: '−১' }, ok: 'b', why: 'dot = ০, তাই cosine = ০। দুটি লম্ব—কোনো দিকগত মিল নেই।' },
      { q: 'একটি vector-কে ১০ দিয়ে গুণ করলে অন্য vector-এর সাথে তার cosine similarity কী হয়?', a: { a: '১০ গুণ বাড়ে', b: 'একই থাকে', c: 'শূন্য হয়' }, ok: 'b', why: 'dot ও norm দুটোই ১০ গুণ হয়, ভাগফল অপরিবর্তিত। cosine শুধু দিক দেখে।' },
      { q: 'cosine([০,০,০], [১,২,৩]) কোডে কী ফেরত দেওয়া উচিত?', a: { a: '০', b: 'একটি স্পষ্ট “অসংজ্ঞায়িত” মান (যেমন null), কারণ শূন্য vector-এর দিক নেই', c: '১' }, ok: 'b', why: '০ ফেরত দিলে মনে হবে “লম্ব”, যা মিথ্যা দাবি। অসংজ্ঞায়িত অবস্থা আলাদাভাবে জানানো সৎ ও নিরাপদ।' },
    ],
    recap: ['dot product: ML-এর মূল অপারেশন', 'cosine: দৈর্ঘ্য-নিরপেক্ষ মিল', 'edge case (শূন্য vector) স্পষ্টভাবে সামলান', 'সংখ্যার মিল ≠ অর্থের বোঝাপড়া'],
    nextNote: 'অনেক vector একসাথে সাজালে পাই matrix:',
    synthetic: true,
    sources: [SRC.mml, SRC.khan, ['Google ML Crash Course — Embeddings: measuring similarity', 'https://developers.google.com/machine-learning/crash-course/embeddings']],
  },
  {
    id: 'les-03-03-matrices-shapes',
    slug: 'matrix-shape',
    title: 'Matrix, Shape ও Matrix Multiplication',
    minutes: 45,
    prereqs: ['les-03-02-dot-product-similarity'],
    summary: 'matrix = সারি × কলাম; shape (m×n); matrix × vector ও matrix × matrix আসলে অনেকগুলো dot product; shape নিয়ম (m×n)(n×p) = (m×p)।',
    overview: p('Matrix হলো সংখ্যার আয়তাকার সারণি; তার shape লেখা হয় সারি × কলাম (যেমন 2×3)। Matrix গুণ আসলে অনেকগুলো dot product একসাথে: ফলের প্রতিটি ঘর = বাম matrix-এর একটি সারি · ডান matrix-এর একটি কলাম। এই পাঠে আগে shape নিয়ম—(m×n)(n×p) = (m×p)—শিখব, তারপর ছোট সংখ্যায় হাতে গুণ করব এবং JavaScript-এ shape যাচাইসহ matmul লিখব। Neural network-এর একটি স্তর ঠিক এই অপারেশন।'),
    objectives: ['matrix-এর shape বলতে এবং গুণের আগে shape সামঞ্জস্য যাচাই করতে পারবেন', 'matrix × vector ও matrix × matrix হাতে হিসাব করতে পারবেন', 'shape-যাচাইসহ matmul ফাংশন লিখতে এবং গুণ যে বিনিময়যোগ্য নয় তা দেখাতে পারবেন'],
    problem: p('তিনটি পণ্যের প্রতিটির দুটি feature: [দাম(হাজারে), রেটিং]। দুটি ভিন্ন “স্কোরিং নিয়ম” আছে—একটি বাজেট-ক্রেতার, একটি মান-সচেতন ক্রেতার। প্রতিটি পণ্যের জন্য দুই নিয়মে স্কোর লাগবে = ৬টি dot product। ১০০০ পণ্য ও ৫০টি নিয়মে ৫০,০০০টি। এগুলো একসাথে প্রকাশ করার ভাষা হলো matrix গুণ।'),
    explain:
      p(`${term('ম্যাট্রিক্স', 'matrix')}: সারি ও কলামে সাজানো সংখ্যা। ${term('শেপ', 'shape')} = (সারি সংখ্যা × কলাম সংখ্যা)।`) +
      code(`X = [[1.2, 4.5],     // পণ্য ১: দাম 1.2 হাজার, রেটিং 4.5
     [0.4, 3.9],     // পণ্য ২
     [2.5, 4.8]]     // পণ্য ৩      → shape 3×2`) +
      p('<strong>Shape নিয়ম:</strong> A (m×n) × B (n×p) = C (m×p)। মাঝের দুই সংখ্যা (n) মিলতেই হবে; বাইরের দুটি ফলের shape দেয়।') +
      p('<strong>প্রতিটি ঘর একটি dot product:</strong> C[i][j] = A-এর সারি i · B-এর কলাম j।') +
      p('<strong>Matrix × vector:</strong> vector-কে n×1 matrix ভাবুন। (m×n)(n×1) = (m×1)—প্রতিটি সারির সাথে vector-এর dot product।') +
      p('<strong>গুণ বিনিময়যোগ্য নয়:</strong> সাধারণত A×B ≠ B×A, আর অনেক সময় B×A-র shape-ই মেলে না।') +
      p(`${term('ট্রান্সপোজ', 'transpose, Aᵀ')}: সারিকে কলাম বানানো। (m×n) → (n×m)। attention-এ (অধ্যায় ৮) QKᵀ-তে এটি লাগবে।`),
    analogy: {
      text: 'Matrix গুণ হলো পরীক্ষার খাতা ও নম্বর-বণ্টন: সারি = ছাত্র (প্রতিটি প্রশ্নে পাওয়া অংশ), কলাম = একটি মূল্যায়ন-পদ্ধতি (প্রশ্নের ওজন)। প্রতিটি ঘর = একজন ছাত্রের একটি পদ্ধতিতে মোট নম্বর।',
      breaks: 'খাতায় সারি/কলাম অদলবদল করলেও অর্থ বোঝা যায়; matrix-এ A×B ও B×A সম্পূর্ণ ভিন্ন (বা অসংজ্ঞায়িত)। আর ML-এর matrix-এর “ওজন” মানুষ দেয় না, training খোঁজে।',
    },
    worked:
      p('X (3×2) ও নিয়ম-matrix W (2×2): কলাম ১ = বাজেট নিয়ম [−১, ১], কলাম ২ = মান নিয়ম [০, ২]।') +
      code(`W = [[-1, 0],
     [ 1, 2]]       → shape 2×2
(3×2)(2×2) = (3×2) ✓`) +
      table(['ঘর', 'হিসাব', 'ফল'], [
        ['C[0][0]', '1.2×(−1) + 4.5×1', '3.3'],
        ['C[0][1]', '1.2×0 + 4.5×2', '9.0'],
        ['C[1][0]', '0.4×(−1) + 3.9×1', '3.5'],
        ['C[1][1]', '0.4×0 + 3.9×2', '7.8'],
        ['C[2][0]', '2.5×(−1) + 4.8×1', '2.3'],
        ['C[2][1]', '2.5×0 + 4.8×2', '9.6'],
      ], 'XW-এর ছয়টি ঘর') +
      p('বাজেট নিয়মে পণ্য ২ সেরা (৩.৫), মান নিয়মে পণ্য ৩ (৯.৬)। একটি matrix গুণে দুই নিয়মের সব স্কোর পেলাম।'),
    activity: note('কোডে প্রথমে shape ফাংশন, তারপর matmul। গুণের আগে shape না মিললে স্পষ্ট এরর।'),
    code: [
      {
        label: 'shape-যাচাইসহ matrix গুণ',
        starter: String.raw`const shape = (M) => [M.length, M[0].length];

function matmul(A, B) {
  const [m, n] = shape(A);
  const [n2, p] = shape(B);
  if (n !== n2) throw new Error("shape মেলেনি: (" + m + "x" + n + ") x (" + n2 + "x" + p + ")");
  const C = [];
  for (let i = 0; i < m; i++) {
    const row = [];
    for (let j = 0; j < p; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += A[i][k] * B[k][j];   // সারি i · কলাম j
      row.push(Math.round(s * 1000) / 1000);
    }
    C.push(row);
  }
  return C;
}

const transpose = (M) => M[0].map((_, j) => M.map((row) => row[j]));

const X = [[1.2, 4.5], [0.4, 3.9], [2.5, 4.8]];
const W = [[-1, 0], [1, 2]];

console.log("shape X:", shape(X), "shape W:", shape(W));
console.log("XW =", matmul(X, W));
console.log("Xᵀ shape:", shape(transpose(X)));

const A = [[1, 2], [3, 4]];
const B = [[0, 1], [1, 0]];
console.log("AB =", matmul(A, B), " BA =", matmul(B, A));

try { matmul(W, X); } catch (e) { console.log("WX:", e.message); }
`,
        expect: ['XW = [[3.3,9],[3.5,7.8],[2.3,9.6]]', 'Xᵀ shape: [2,3]', 'AB = [[2,1],[4,3]]  BA = [[3,4],[1,2]]', 'WX: shape মেলেনি: (2x2) x (3x2)'],
        hints: ['তিনটি nested loop: i (A-র সারি), j (B-র কলাম), k (যোগের সূচক)।', 'A[i][k] * B[k][j]—k হলো সেই “মাঝের” n।', 'AB ও BA আলাদা এল—matrix গুণ বিনিময়যোগ্য নয়।'],
        test: '__assert(JSON.stringify(matmul([[1,2,3]],[[1],[1],[1]]))==="[[6]]","row x col = dot"); __assert(JSON.stringify(shape(matmul(X,W)))==="[3,2]","out shape");',
      },
    ],
    line: ul([
      '<code>shape = (M) => [M.length, M[0].length]</code>: সারি সংখ্যা ও প্রথম সারির দৈর্ঘ্য (সব সারি সমান ধরে)।',
      '<code>const [m, n] = shape(A)</code>: array destructuring দিয়ে দুই সংখ্যা আলাদা নাম পায়।',
      'সবচেয়ে ভেতরের loop হলো আগের পাঠের dot product—শুধু B-এর কলাম পড়তে <code>B[k][j]</code>।',
      '<code>transpose</code>: প্রথম সারির প্রতিটি index j-এর জন্য সব সারির j-তম উপাদান নিয়ে নতুন সারি।',
      '<code>_</code>: যে parameter ব্যবহার হবে না তার প্রচলিত নাম।',
    ]),
    why: p('তিনটি loop স্পষ্টভাবে লেখা হয়েছে যাতে “matrix গুণ = অনেক dot product” চোখে দেখা যায়। বাস্তব লাইব্রেরি (NumPy, PyTorch—অধ্যায় ১৩) এটি অনেক দ্রুত করে, কিন্তু shape নিয়ম একই।'),
    remember: ['shape = সারি × কলাম', '(m×n)(n×p) = (m×p); মাঝের n মিলতে হবে', 'প্রতিটি ঘর = সারি · কলাম', 'AB ≠ BA সাধারণত'],
    skip: ['determinant, inverse', 'eigenvalue', 'দ্রুত গুণের অ্যালগরিদম'],
    experiment: p('W-তে তৃতীয় নিয়ম (কলাম) যোগ করুন: “শুধু দাম কম”—[−২, ০]। নতুন W-এর shape কী? XW-এর shape কী হবে? আগে লিখুন, তারপর চালান।'),
    mistakes: ['গুণের আগে shape না দেখা', 'A×B ও B×A একই ধরে নেওয়া', 'সারি ও কলাম index অদলবদল (A[k][i])', 'অবস্থান-ভিত্তিক গুণ (element-wise) আর matrix গুণ গুলিয়ে ফেলা'],
    quiz: [
      { q: '(4×3) matrix × (3×5) matrix-এর ফলের shape কী?', a: { a: '4×5', b: '3×3', c: 'গুণ করা যায় না' }, ok: 'a', why: 'মাঝের ৩ মেলে, বাইরের ৪ ও ৫ ফলের shape দেয়।' },
      { q: '(2×3) × (2×3) গুণ করা যায় কি?', a: { a: 'হ্যাঁ, ফল 2×3', b: 'না—বামের কলাম (৩) ≠ ডানের সারি (২)', c: 'হ্যাঁ, ফল 3×3' }, ok: 'b', why: 'shape নিয়মে মাঝের সংখ্যা মিলতে হবে। একটি transpose করলে (2×3)(3×2) = 2×2 সম্ভব।' },
      { q: '[[1,2],[3,4]] × [1, 1]ᵀ (কলাম vector) = ?', a: { a: '[3, 7]', b: '[4, 6]', c: '10' }, ok: 'a', why: 'প্রতিটি সারি · [1,1]: 1+2 = 3, 3+4 = 7।' },
    ],
    recap: ['matrix গুণ = সংগঠিত dot product', 'shape নিয়ম সব কিছুর আগে', 'transpose সারি↔কলাম'],
    nextNote: 'এক সারি × ওজন + bias—এটাই একটি neuron-এর গণনা। পরের পাঠ:',
    synthetic: true,
    sources: [SRC.mml, SRC.khan, ['d2l.ai — Linear Algebra', 'https://d2l.ai/chapter_preliminaries/linear-algebra.html']],
  },
  {
    id: 'les-03-04-functions-weighted-sums',
    slug: 'function-weighted-sum',
    title: 'Function, Graph ও Weighted Sum',
    minutes: 35,
    prereqs: ['les-03-03-matrices-shapes'],
    summary: 'গাণিতিক function ও তার graph; সরলরেখা y = wx + b; weighted sum + bias = একটি linear model; টেক্সট-টেবিলে graph পড়া।',
    overview: p('গাণিতিক function একটি ইনপুটকে একটি আউটপুটে নেয়, আর graph সেই সম্পর্কটি দেখায়। সবচেয়ে গুরুত্বপূর্ণ উদাহরণ সরলরেখা y = wx + b, যেখানে w ঢাল (slope) আর b ছেদবিন্দু (intercept)। একাধিক ইনপুট হলে এটি হয় weighted sum + bias: y = w₁x₁ + w₂x₂ + … + b = w · x + b। এই পাঠে w ও b বদলালে রেখা কীভাবে বদলায় তা টেক্সট-টেবিল ও ASCII graph দিয়ে দেখব, এবং বুঝব কেন এটিই linear model ও প্রতিটি neuron-এর মূল গণনা।'),
    objectives: ['y = wx + b-এ w ও b-এর অর্থ ব্যাখ্যা করতে পারবেন', 'weighted sum + bias-কে dot product হিসেবে লিখতে পারবেন', 'টেবিল বা ASCII graph থেকে function-এর আচরণ পড়তে পারবেন'],
    problem: p('ডেলিভারির দাম ঠিক করতে চান: ভিত্তি চার্জ আর প্রতি কেজিতে অতিরিক্ত। ২ কেজিতে কত, ৫ কেজিতে কত? আর যদি দূরত্বও যোগ হয়? প্রতিটি ক্ষেত্রে নতুন সূত্র না লিখে একটি সাধারণ কাঠামো চাই।'),
    explain:
      p(`${term('ফাংশন', 'function')}: প্রতিটি ইনপুট x-এর জন্য একটি আউটপুট f(x)। ${term('গ্রাফ', 'graph')}: (x, f(x)) বিন্দুগুলোর ছবি।`) +
      p('<strong>সরলরেখা:</strong> f(x) = wx + b।') +
      ul([
        '<strong>w (weight/slope):</strong> x এক বাড়লে y কত বাড়ে। w = ২০ মানে প্রতি কেজিতে ২০ টাকা।',
        '<strong>b (bias/intercept):</strong> x = ০ হলে y-এর মান—ভিত্তি চার্জ।',
      ]) +
      p(`<strong>একাধিক ইনপুট—${term('ওয়েটেড সাম', 'weighted sum')}:</strong> y = w₁x₁ + w₂x₂ + b = <strong>w · x + b</strong>। প্রতিটি ইনপুটের নিজস্ব weight, তারপর bias যোগ। এটিই একটি ${term('লিনিয়ার মডেল', 'linear model')} এবং অধ্যায় ৫-এর প্রতিটি neuron-এর প্রথম ধাপ।`) +
      p('অনেক ইনপুট-সারির জন্য একসাথে: y = Xw + b (আগের পাঠের matrix × vector, তারপর প্রতিটিতে b যোগ)।') +
      p('<strong>“Linear” কেন সীমিত:</strong> সরলরেখা বাঁকতে পারে না। “৫ কেজি পর্যন্ত একরকম, তার বেশি হলে দ্বিগুণ হারে”—এমন সম্পর্ক একটি রেখায় ধরা যায় না। অধ্যায় ৫-এ activation function এই বাঁক আনবে।'),
    analogy: {
      text: 'weighted sum হলো রেসিপির খরচ: প্রতিটি উপাদানের পরিমাণ × দাম যোগ করে, তারপর গ্যাস-বিদ্যুতের স্থির খরচ (bias) যোগ।',
      breaks: 'রেসিপিতে দামগুলো দোকান থেকে জানা; মডেলে weight-গুলো অজানা—training ডেটা থেকে খুঁজতে হয় (অধ্যায় ৪)। আর মডেলের weight ঋণাত্মকও হতে পারে, যার কোনো “দাম” অর্থ নেই।',
    },
    worked:
      p('ডেলিভারি মডেল: দাম = ২০ × ওজন + ১৫ × দূরত্ব(১০ কিমি একক) + ৬০।') +
      ol([
        'w = [২০, ১৫], b = ৬০।',
        'পার্সেল x = [২ কেজি, ৩ একক]: w · x = ৪০ + ৪৫ = ৮৫; + ৬০ = <strong>১৪৫ টাকা</strong>।',
        'পার্সেল x = [৫, ০]: ১০০ + ০ + ৬০ = <strong>১৬০ টাকা</strong>।',
        'w₁ ২০ থেকে ৩০ করলে প্রথম পার্সেল: ৬০ + ৪৫ + ৬০ = ১৬৫ টাকা—ওজনের প্রভাব বাড়ল।',
      ]) +
      warn('এই হার শেখানোর জন্য কাল্পনিক; কোনো কুরিয়ারের আসল হার নয়।'),
    activity: note('কোডে একই মডেল, তারপর ASCII graph: প্রতিটি সারিতে x, y এবং y-এর অনুপাতে # চিহ্ন। এটি graph-এর টেক্সট-সমতুল্য—স্ক্রিন রিডারেও পড়া যায়।'),
    code: [
      {
        label: 'weighted sum ও টেক্সট graph',
        starter: String.raw`const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const linear = (w, b) => (x) => dot(w, x) + b;   // function ফেরত দেয় এমন function

const price = linear([20, 15], 60);
console.log("[2,3] →", price([2, 3]));
console.log("[5,0] →", price([5, 0]));

// এক-ইনপুট রেখা: y = w*x + b, বিভিন্ন w ও b
function plot(w, b) {
  console.log("y = " + w + "x + " + b);
  for (let x = 0; x <= 5; x++) {
    const y = w * x + b;
    console.log("  x=" + x + "  y=" + String(y).padStart(4) + "  " + "#".repeat(Math.max(0, Math.round(y / 10))));
  }
}
plot(20, 60);
plot(-10, 60);
`,
        expect: ['[2,3] → 145', '[5,0] → 160', 'y = 20x + 60', 'x=5  y=  10'],
        hints: ['linear(w, b) একটি নতুন function ফেরত দেয়—এটিকে “function factory” বলে।', 'w ঋণাত্মক হলে রেখা নামে—দ্বিতীয় plot দেখুন।', 'plot(0, 60) চালালে কী দেখবেন? w = 0 মানে x-এর কোনো প্রভাব নেই।'],
        test: '__assert(price([2,3])===145,"145"); __assert(linear([1,1,1],0)([1,2,3])===6,"dot");',
      },
    ],
    line: ul([
      '<code>a.reduce((s, x, i) => s + x * b[i], 0)</code>: dot product এক লাইনে—reduce-এর তৃতীয় parameter i হলো index।',
      '<code>linear = (w, b) => (x) => …</code>: দুই স্তরের arrow—প্রথমে w, b নিয়ে একটি function বানায়, যেটি পরে x নেয়। এভাবে “মডেল” একটি function হয়ে যায়।',
      '<code>"#".repeat(n)</code>: n বার # লেখা; <code>Math.max(0, …)</code> ঋণাত্মক দৈর্ঘ্য আটকায়।',
      '<code>String(y).padStart(4)</code>: সংখ্যাকে ডানদিকে সোজা রাখা।',
    ]),
    why: p('মডেলকে “parameter দিয়ে বানানো function” হিসেবে লেখার অভ্যাস ML কোডের কেন্দ্রীয় ধারণা: parameter (w, b) বদলালে একই কাঠামোয় ভিন্ন function। ASCII graph ব্যবহার করেছি কারণ এই রানারে DOM নেই, আর টেক্সট graph-এর সংখ্যাগুলো সবার কাছে পাঠযোগ্য।'),
    remember: ['y = wx + b: w ঢাল, b ভিত্তি', 'weighted sum + bias = w · x + b', 'মডেল = parameter-যুক্ত function', 'linear মডেল বাঁকতে পারে না'],
    skip: ['বহুপদী (polynomial) function', 'graph আঁকার লাইব্রেরি'],
    experiment: p('এমন w, b খুঁজুন যাতে x=০-এ y=১০০ এবং x=৫-এ y=০। আগে হাতে সমাধান করুন (দুটি সমীকরণ), তারপর plot দিয়ে যাচাই করুন।'),
    mistakes: ['bias ভুলে যাওয়া—তখন রেখা সবসময় (০,০) দিয়ে যায়', 'weight-এর একক না ভাবা (টাকা/কেজি)', 'ঋণাত্মক weight-কে ভুল ভাবা—এটি বৈধ ও প্রায়ই অর্থবহ'],
    quiz: [
      { q: 'y = ৩x + ৫ হলে x = ৪-এ y কত?', a: { a: '১৭', b: '৩২', c: '১২' }, ok: 'a', why: '৩ × ৪ + ৫ = ১২ + ৫ = ১৭।' },
      { q: 'w = [২, −১], b = ১, x = [৩, ৪] হলে w · x + b = ?', a: { a: '৩', b: '১১', c: '৬' }, ok: 'a', why: '২×৩ + (−১)×৪ = ৬ − ৪ = ২; + ১ = ৩।' },
      { q: 'y = wx + b-এ b = ০ হলে graph-এর বৈশিষ্ট্য কী?', a: { a: 'রেখা সবসময় মূলবিন্দু (০, ০) দিয়ে যায়', b: 'রেখা অনুভূমিক হয়', c: 'রেখা বাঁকা হয়' }, ok: 'a', why: 'x = ০ হলে y = ০। অনুভূমিক হয় w = ০ হলে।' },
    ],
    recap: ['function = ইনপুট → আউটপুট নিয়ম', 'weighted sum + bias = linear model', 'parameter বদলালে function বদলায়'],
    nextNote: 'মডেলের আউটপুটকে প্রায়ই “সম্ভাবনা” হিসেবে পড়া হয়—তাই এবার সম্ভাব্যতা:',
    synthetic: true,
    sources: [SRC.mml, SRC.googleMLCC, SRC.khanCalc],
  },
  {
    id: 'les-03-05-probability',
    slug: 'probability',
    title: 'সম্ভাব্যতা, শর্তসাপেক্ষ সম্ভাব্যতা ও Distribution',
    minutes: 40,
    prereqs: ['les-03-04-functions-weighted-sums'],
    summary: 'গণনা থেকে সম্ভাব্যতা; P(A|B); distribution-এর যোগফল ১; ছোট ডেটা থেকে অনুমানের সীমা।',
    overview: p('সম্ভাব্যতা (probability) একটি ঘটনার সম্ভাবনাকে ০ থেকে ১-এর মধ্যে প্রকাশ করে। শর্তসাপেক্ষ সম্ভাব্যতা P(A|B) জানায় B জানা থাকলে A-এর সম্ভাবনা কত—যেমন “মেসেজে ‘ভাঙা’ শব্দ থাকলে সেটি অভিযোগ হওয়ার সম্ভাবনা”। Distribution হলো সব সম্ভাব্য ফলের সম্ভাবনার তালিকা, যার যোগফল ১। এই পাঠে ২০টি লেবেল-করা মেসেজ গুনে এগুলো হিসাব করব, এবং দেখব ছোট ডেটা থেকে পাওয়া সংখ্যা কেন সতর্কভাবে পড়তে হয়। Language model-এর আউটপুট (অধ্যায় ৬) ঠিক এমন একটি distribution।'),
    objectives: ['গণনা থেকে সম্ভাব্যতা ও শর্তসাপেক্ষ সম্ভাব্যতা হিসাব করতে পারবেন', 'একটি distribution বৈধ কিনা (সব মান ≥ ০, যোগফল ১) যাচাই করতে পারবেন', 'ছোট নমুনা থেকে পাওয়া সম্ভাব্যতার সীমা ব্যাখ্যা করতে পারবেন'],
    problem: p('গত সপ্তাহে ২০টি মেসেজ এসেছে, প্রতিটি হাতে লেবেল করা: অভিযোগ, প্রশ্ন, বা অর্ডার। নতুন একটি মেসেজে “ভাঙা” শব্দ আছে। এটি অভিযোগ হওয়ার সম্ভাবনা কত বলবেন? আর “সব মেসেজের মধ্যে অভিযোগের হার” থেকে উত্তরটি কেন আলাদা?'),
    explain:
      p(`${term('সম্ভাব্যতা', 'probability')}: P(A) = (A ঘটেছে এমন ক্ষেত্র) / (মোট ক্ষেত্র), যখন ক্ষেত্রগুলো তুলনীয়। মান সবসময় ০ থেকে ১।`) +
      p(`${term('শর্তসাপেক্ষ সম্ভাব্যতা', 'conditional probability')}: P(A|B) = P(A এবং B) / P(B)। পড়ুন: “B জানা থাকলে A-এর সম্ভাবনা”। গণনায়: B আছে এমন ক্ষেত্রগুলোর মধ্যে কতগুলোতে A-ও আছে।`) +
      table(['', '“ভাঙা” আছে', '“ভাঙা” নেই', 'মোট'], [
        ['অভিযোগ', '৪', '২', '৬'],
        ['প্রশ্ন', '০', '৯', '৯'],
        ['অর্ডার', '১', '৪', '৫'],
        ['মোট', '৫', '১৫', '২০'],
      ], '২০টি সিন্থেটিক লেবেল-করা মেসেজের গণনা') +
      ul([
        'P(অভিযোগ) = ৬/২০ = ০.৩০',
        'P(অভিযোগ | ভাঙা) = ৪/৫ = ০.৮০ — শব্দটি জানা থাকায় অনুমান অনেক বদলাল।',
        'P(ভাঙা | অভিযোগ) = ৪/৬ ≈ ০.৬৭ — <strong>উল্টো দিক, ভিন্ন সংখ্যা</strong>। P(A|B) ≠ P(B|A)।',
      ]) +
      p(`${term('ডিস্ট্রিবিউশন', 'probability distribution')}: সব সম্ভাব্য ফলের সম্ভাবনা। “ভাঙা” আছে এমন মেসেজে: অভিযোগ ০.৮, প্রশ্ন ০.০, অর্ডার ০.২ — যোগ = ১.০। বৈধ distribution-এর দুই শর্ত: প্রতিটি মান ≥ ০, এবং যোগফল ১।`) +
      warn('<strong>ছোট নমুনার সীমা:</strong> “ভাঙা” মাত্র ৫টি মেসেজে আছে। আরেকটি মেসেজ যোগ হলেই ০.৮ বদলে ০.৬৭ বা ০.৮৩ হতে পারে। আর P(প্রশ্ন | ভাঙা) = ০ মানে “কখনো হবে না” নয়—শুধু এই ২০টিতে দেখা যায়নি। মডেল এই শূন্যকে বিশ্বাস করলে নতুন ইনপুটে ভুল করে (অধ্যায় ৬-এ smoothing দিয়ে এর সমাধান দেখব)।'),
    analogy: {
      text: 'শর্তসাপেক্ষ সম্ভাব্যতা হলো আবহাওয়ার পূর্বাভাস: “আজ বৃষ্টির সম্ভাবনা ৩০%”, কিন্তু “আকাশে কালো মেঘ থাকলে ৮০%”। নতুন তথ্য অনুমান বদলায়।',
      breaks: 'আবহাওয়া অফিসের হাতে বহু বছরের হাজারো দিনের ডেটা; আমাদের হাতে ২০টি মেসেজ। একই সূত্র, কিন্তু ছোট ডেটায় সংখ্যাগুলো অনেক অস্থির।',
    },
    worked:
      ol([
        '“ভাঙা” আছে এমন মেসেজ খুঁজি: ৫টি।',
        'তার মধ্যে অভিযোগ: ৪টি → P(অভিযোগ|ভাঙা) = ৪/৫ = ০.৮।',
        'বাকি দুই লেবেল: প্রশ্ন ০/৫ = ০, অর্ডার ১/৫ = ০.২।',
        'যাচাই: ০.৮ + ০ + ০.২ = ১.০ ✓ (বৈধ distribution)।',
        'সতর্ক ব্যাখ্যা: “এই ২০টি সিন্থেটিক মেসেজে, ‘ভাঙা’ থাকা ৫টির ৪টি অভিযোগ ছিল।”',
      ]),
    activity: note('কোডে ২০টি মেসেজ object-এর array। গণনা ফাংশন দিয়ে টেবিলের সংখ্যাগুলো আবার বের করব—হাতের হিসাব যাচাই।'),
    code: [
      {
        label: 'গণনা থেকে সম্ভাব্যতা',
        starter: String.raw`// সিন্থেটিক ডেটা: label + "ভাঙা" শব্দ আছে কিনা
const data = [];
const add = (label, broken, n) => { for (let i = 0; i < n; i++) data.push({ label, broken }); };
add("অভিযোগ", true, 4); add("অভিযোগ", false, 2);
add("প্রশ্ন", false, 9);
add("অর্ডার", true, 1); add("অর্ডার", false, 4);

const count = (pred) => data.filter(pred).length;
const r3 = (x) => Math.round(x * 1000) / 1000;

const P = (pred) => count(pred) / data.length;
const Pgiven = (predA, predB) => {
  const nb = count(predB);
  if (nb === 0) return null;                     // শর্তটি কখনো ঘটেনি
  return count((d) => predA(d) && predB(d)) / nb;
};

const isComplaint = (d) => d.label === "অভিযোগ";
const hasBroken = (d) => d.broken;

console.log("মোট:", data.length);
console.log("P(অভিযোগ) =", r3(P(isComplaint)));
console.log("P(অভিযোগ | ভাঙা) =", r3(Pgiven(isComplaint, hasBroken)));
console.log("P(ভাঙা | অভিযোগ) =", r3(Pgiven(hasBroken, isComplaint)));

const labels = ["অভিযোগ", "প্রশ্ন", "অর্ডার"];
const dist = labels.map((l) => [l, Pgiven((d) => d.label === l, hasBroken)]);
console.log("distribution | ভাঙা:", JSON.stringify(dist));
console.log("যোগফল:", r3(dist.reduce((s, [, p]) => s + p, 0)));
`,
        expect: ['মোট: 20', 'P(অভিযোগ) = 0.3', 'P(অভিযোগ | ভাঙা) = 0.8', 'P(ভাঙা | অভিযোগ) = 0.667', 'যোগফল: 1'],
        hints: ['predicate (pred) হলো এমন function যা true/false দেয়—filter-এ ব্যবহার হয়।', 'Pgiven-এ ভাগের হর শুধু শর্ত পূরণ করা মেসেজ।', '“প্রশ্ন”-এর একটি মেসেজে broken: true যোগ করে দেখুন distribution কতটা বদলায়।'],
        test: '__close(P(isComplaint),0.3,1e-12,"P"); __close(Pgiven(isComplaint,hasBroken),0.8,1e-12,"cond"); __close(dist.reduce(function(s,x){return s+x[1];},0),1,1e-12,"sum to 1"); __assert(Pgiven(isComplaint,function(){return false;})===null,"empty condition");',
      },
    ],
    line: ul([
      '<code>add(label, broken, n)</code>: একই রকম n টি সারি যোগ—ডেটা লেখা সংক্ষিপ্ত রাখতে।',
      '<code>count(pred)</code>: predicate সত্য এমন সারির সংখ্যা।',
      '<code>Pgiven</code>: হর = শর্ত B সত্য এমন সারি; লব = A ও B দুটোই সত্য। B কখনো না ঘটলে null—শূন্য দিয়ে ভাগ আটকানো।',
      '<code>([, p]) =></code>: destructuring-এ প্রথম উপাদান বাদ দিয়ে দ্বিতীয়টি নেওয়া।',
    ]),
    why: p('সম্ভাব্যতাকে গণনা হিসেবে কোডে লিখলে সূত্র মুখস্থ না করেও অর্থ বোঝা যায়। Predicate-ভিত্তিক নকশা যেকোনো শর্তে কাজ করে, পরে n-gram language model-এও (অধ্যায় ৬) একই গণনা।'),
    remember: ['P(A) = অনুকূল / মোট', 'P(A|B) = B-এর ভেতরে A-এর অনুপাত', 'P(A|B) ≠ P(B|A)', 'distribution: সব ≥ ০, যোগ = ১', 'ছোট ডেটার সম্ভাব্যতা অস্থির'],
    skip: ['Bayes theorem-এর আনুষ্ঠানিক প্রমাণ', 'continuous distribution ও density', 'confidence interval'],
    experiment: p('প্রতিটি লেবেলের সংখ্যা ১০ গুণ করুন (add-এর n × ১০)। সম্ভাব্যতাগুলো বদলায় কি? বদলায় না—তাহলে বেশি ডেটার সুবিধা কোথায়? (ইঙ্গিত: অনুপাত একই রাখলে মান একই, কিন্তু বাস্তবে নতুন ডেটার অনুপাত ভিন্ন হয়; বড় নমুনায় সেই ওঠানামা কম।)'),
    mistakes: ['P(A|B) ও P(B|A) গুলিয়ে ফেলা', '০ সম্ভাব্যতাকে “অসম্ভব” পড়া', 'যোগফল ১ যাচাই না করা', 'মডেলের স্কোরকে যাচাই ছাড়াই সম্ভাব্যতা ধরা'],
    quiz: [
      { q: '১০০ অর্ডারের ২০টি ফেরত এসেছে। P(ফেরত) কত?', a: { a: '০.২', b: '২০', c: '০.৮' }, ok: 'a', why: '২০/১০০ = ০.২। সম্ভাব্যতা ০ থেকে ১-এর মধ্যে।' },
      { q: 'ঢাকার বাইরের ৪০টি অর্ডারের ১২টি দেরিতে পৌঁছেছে। P(দেরি | ঢাকার বাইরে) কত?', a: { a: '০.৩', b: '০.১২', c: '১২' }, ok: 'a', why: 'শর্ত “ঢাকার বাইরে” পূরণ করা ৪০টির মধ্যে ১২টি: ১২/৪০ = ০.৩।' },
      { q: '[০.৫, ০.৪, ০.২] কি বৈধ probability distribution?', a: { a: 'হ্যাঁ', b: 'না—যোগফল ১.১', c: 'না—একটি মান ০.২-এর কম' }, ok: 'b', why: '০.৫ + ০.৪ + ০.২ = ১.১ ≠ ১। বৈধ হতে সব মান ≥ ০ ও যোগ ঠিক ১ হতে হবে।' },
    ],
    recap: ['সম্ভাব্যতা = গণনার অনুপাত', 'শর্ত অনুমান বদলায়', 'distribution-এর যোগফল ১', 'ছোট ডেটায় সতর্কতা'],
    nextNote: 'ছোট সম্ভাব্যতা গুণ করতে করতে সংখ্যা হারিয়ে যায়—সমাধান logarithm; আর পরিবর্তনের হার মাপে derivative:',
    synthetic: true,
    sources: [SRC.khanProb, SRC.mml, SRC.jurafsky],
  },
  {
    id: 'les-03-06-logs-derivatives',
    slug: 'logarithm-derivative',
    title: 'Logarithm ও Derivative',
    minutes: 40,
    prereqs: ['les-03-05-probability'],
    summary: 'log গুণকে যোগে বদলায়; ছোট সম্ভাব্যতার underflow; −log p দিয়ে “বিস্ময়” মাপা; derivative = ঢাল, সংখ্যাগতভাবে অনুমান।',
    overview: p('Logarithm গুণকে যোগে রূপান্তর করে: log(a × b) = log a + log b। অনেক ছোট সম্ভাব্যতা গুণ করলে কম্পিউটারে সংখ্যা শূন্য হয়ে যায় (underflow), কিন্তু log-এর যোগে সমস্যা থাকে না—তাই language model ও loss-এ log সর্বত্র। Derivative একটি function কোনো বিন্দুতে কত দ্রুত বদলায় তা মাপে—graph-এর ঢাল। এই পাঠে দুটোই ছোট সংখ্যায় হিসাব করব, এবং derivative-কে সূত্র ছাড়াই সংখ্যাগতভাবে (finite difference) অনুমান করে সূত্রের সাথে মিলাব।'),
    objectives: ['log-এর মূল নিয়ম ব্যবহার করে গুণফলকে যোগফলে রূপান্তর করতে পারবেন', 'underflow কী এবং log কীভাবে তা আটকায় দেখাতে পারবেন', 'derivative-কে ঢাল হিসেবে ব্যাখ্যা করে সংখ্যাগতভাবে হিসাব করতে পারবেন'],
    problem: p('একটি language model ৪০০ শব্দের একটি বাক্যের সম্ভাব্যতা হিসাব করছে: প্রতিটি শব্দের সম্ভাব্যতা প্রায় ০.১, আর সবগুলো গুণ। ০.১⁴⁰⁰ = ১০⁻⁴⁰⁰—কম্পিউটারের সবচেয়ে ছোট সংখ্যার চেয়েও ছোট, ফল আসে ঠিক ০। তাহলে দুটি বাক্যের তুলনা করা যাবে কীভাবে?'),
    explain:
      p(`${term('লগারিদম', 'logarithm')}: log_b(x) = y মানে bʸ = x। এই কোর্সে log মানে প্রাকৃতিক log (ভিত্তি e ≈ ২.৭১৮), JavaScript-এ <code>Math.log</code>।`) +
      table(['নিয়ম', 'উদাহরণ'], [
        ['log(a × b) = log a + log b', 'log(০.১ × ০.২) = log ০.১ + log ০.২'],
        ['log(১) = ০', 'নিশ্চিত ঘটনার log শূন্য'],
        ['০ < p < ১ হলে log p < ০', 'log ০.৫ ≈ −০.৬৯৩'],
        ['log একঘেয়ে বর্ধমান', 'a > b হলে log a > log b—তুলনার ক্রম বদলায় না'],
      ], 'log-এর দরকারি নিয়ম') +
      p(`${term('আন্ডারফ্লো', 'underflow')}: খুব ছোট সংখ্যা ০ হয়ে যাওয়া। JavaScript-এর সংখ্যা প্রায় ১০⁻³⁰⁸-এর নিচে (subnormal ধরলে ~৫×১০⁻³²⁴) যেতে পারে না। ৪০০ বার log ০.১ যোগ = ৪০০ × (−২.৩০২৬) ≈ −৯২১—কোনো সমস্যা নেই।`) +
      p('<strong>−log p কে “বিস্ময়” ভাবুন:</strong> p = ১ হলে ০ (কোনো বিস্ময় নেই), p ছোট হলে বড়। অধ্যায় ৪ ও ৯-এর cross-entropy loss ঠিক এটি।') +
      p(`${term('ডেরিভেটিভ', 'derivative')}: f′(x) = x-এর খুব কাছে f কত দ্রুত বদলায়—graph-এর ঐ বিন্দুতে স্পর্শকের ঢাল।`) +
      p('<strong>সংখ্যাগত অনুমান (central difference):</strong> f′(x) ≈ [f(x + h) − f(x − h)] / (২h), যেখানে h ছোট (যেমন ০.০০০১)।') +
      table(['f(x)', 'f′(x)', 'x = ৩-এ'], [
        ['x²', '২x', '৬'],
        ['৫x + ২', '৫', '৫'],
        ['log x', '১/x', '০.৩৩৩'],
      ], 'তিনটি পরিচিত derivative'),
    analogy: {
      text: 'Derivative হলো গাড়ির স্পিডোমিটার: মোট দূরত্ব নয়, এই মুহূর্তে কত দ্রুত দূরত্ব বাড়ছে। log হলো ভূমিকম্পের রিখটার স্কেল—বিশাল পরিসরকে সামলানোর মতো সংখ্যায় আনে।',
      breaks: 'স্পিডোমিটার সরাসরি মাপে; সংখ্যাগত derivative একটি অনুমান, যার ভুল h-এর মানের ওপর নির্ভর করে—h খুব বড় হলে ঢাল ভুল, খুব ছোট হলে কম্পিউটারের দশমিক-ত্রুটি বাড়ে।',
    },
    worked:
      p('<strong>log:</strong> তিনটি শব্দের সম্ভাব্যতা ০.৫, ০.২, ০.১।') +
      ol([
        'গুণফল = ০.০১।',
        'log যোগফল = log ০.৫ + log ০.২ + log ০.১ ≈ −০.৬৯৩১ − ১.৬০৯৪ − ২.৩০২৬ = −৪.৬০৫২।',
        'যাচাই: log ০.০১ ≈ −৪.৬০৫২ ✓।',
      ]) +
      p('<strong>Derivative:</strong> f(x) = x², x = ৩, h = ০.০০০১।') +
      ol([
        'f(৩.০০০১) = ৯.০০০৬০০০১, f(২.৯৯৯৯) = ৮.৯৯৯৪০০০১।',
        'পার্থক্য = ০.০০১২; ÷ (২ × ০.০০০১) = ৬.০০০।',
        'সূত্র ২x = ৬ ✓।',
      ]),
    activity: note('কোডে underflow নিজের চোখে দেখব, তারপর একটি সাধারণ numericDerivative ফাংশন যেকোনো f-এ চালাব।'),
    code: [
      {
        label: 'underflow, log-যোগ ও সংখ্যাগত derivative',
        starter: String.raw`// ১) underflow
let product = 1, logSum = 0;
for (let i = 0; i < 400; i++) { product *= 0.1; logSum += Math.log(0.1); }
console.log("গুণফল:", product, "| log-যোগ:", Math.round(logSum * 100) / 100);

// ২) log গুণকে যোগে বদলায়
const ps = [0.5, 0.2, 0.1];
const r4 = (x) => Math.round(x * 10000) / 10000;
console.log("log(গুণফল) =", r4(Math.log(ps.reduce((a, b) => a * b, 1))), " log-যোগ =", r4(ps.reduce((s, p) => s + Math.log(p), 0)));
console.log("বিস্ময় −log p:", ps.map((p) => r4(-Math.log(p))));

// ৩) সংখ্যাগত derivative
const numericDerivative = (f, x, h = 1e-4) => (f(x + h) - f(x - h)) / (2 * h);
const tests = [
  ["x^2", (x) => x * x, (x) => 2 * x],
  ["5x+2", (x) => 5 * x + 2, () => 5],
  ["log x", (x) => Math.log(x), (x) => 1 / x],
];
for (const [name, f, exact] of tests) {
  console.log(name, "x=3: সংখ্যাগত", r4(numericDerivative(f, 3)), "সূত্র", r4(exact(3)));
}
`,
        expect: ['গুণফল: 0 | log-যোগ: -921.03', 'log(গুণফল) = -4.6052  log-যোগ = -4.6052', 'x^2 x=3: সংখ্যাগত 6 সূত্র 6', 'log x x=3: সংখ্যাগত 0.3333 সূত্র 0.3333'],
        hints: ['গুণফল ঠিক 0 হয়ে গেছে, কিন্তু log-যোগ সুন্দর একটি সংখ্যা।', 'h = 1 দিয়ে numericDerivative(x => x*x*x, 3) চালান—ফল সূত্র 3x² = 27 থেকে কতটা দূরে?', 'h = 1e-12 দিয়েও দেখুন—খুব ছোট h-ও সমস্যা করে (floating-point ত্রুটি)।'],
        test: '__assert(product===0,"underflow"); __close(logSum,-921.034,1e-2,"logsum"); __close(numericDerivative(function(x){return x*x;},3),6,1e-6,"d x^2"); __close(numericDerivative(Math.log,3),1/3,1e-6,"d log");',
      },
    ],
    line: ul([
      '<code>product *= 0.1</code> ৪০০ বার: ~৩২৪ বারের পর ফল ঠিক ০ হয়ে যায়—এরপর আর কোনো তথ্য থাকে না।',
      '<code>logSum += Math.log(0.1)</code>: প্রতিবার −২.৩০২৬ যোগ; শেষে −৯২১.০৩।',
      '<code>(f, x, h = 1e-4) =></code>: h-এর default মান ০.০০০১; চাইলে তৃতীয় argument দিয়ে বদলানো যায়।',
      '<code>for (const [name, f, exact] of tests)</code>: প্রতিটি পরীক্ষা [নাম, function, সূত্র-derivative]।',
    ]),
    why: p('সংখ্যাগত derivative সূত্র না জানলেও কাজ করে—তাই এটি “gradient check” হিসেবে পরে ব্যবহার করব: neural network-এর হাতে-লেখা gradient সঠিক কিনা যাচাই করতে (অধ্যায় ৫)।'),
    remember: ['log(ab) = log a + log b', 'অনেক সম্ভাব্যতা গুণ নয়, log যোগ করুন', '−log p: ছোট p-তে বড় “বিস্ময়”', 'derivative = ঢাল; central difference দিয়ে যাচাই'],
    skip: ['derivative-এর সীমা (limit) সংজ্ঞা', 'সব derivative নিয়ম মুখস্থ', 'ভিন্ন ভিত্তির log রূপান্তর'],
    experiment: p('f(x) = (x − ২)² নিন। x = ০, ১, ২, ৩, ৪-এ সংখ্যাগত derivative হিসাব করুন। কোথায় ০? সেই বিন্দুতে f-এর মান কী? (পরের পাঠের gradient descent এই পর্যবেক্ষণের ওপর দাঁড়িয়ে।)'),
    mistakes: ['log(০) চালানো—ফল −Infinity', 'log(a + b) = log a + log b ভাবা (ভুল)', 'h খুব বড় বা খুব ছোট নেওয়া', 'derivative-কে function-এর মান ভাবা'],
    quiz: [
      { q: 'log(০.২) + log(০.৫) = ?', a: { a: 'log(০.৭)', b: 'log(০.১)', c: 'log(০.৪)' }, ok: 'b', why: 'log a + log b = log(a × b) = log(০.২ × ০.৫) = log(০.১)। log(০.৭) যোগফলের log, যা নিয়ম নয়।' },
      { q: 'f(x) = x²-এর x = −২-এ derivative কত?', a: { a: '−৪', b: '৪', c: '০' }, ok: 'a', why: 'f′(x) = ২x = −৪। ঋণাত্মক ঢাল মানে x বাড়ালে f কমে।' },
      { q: 'অনেক ছোট সম্ভাব্যতা গুণ করার বদলে log যোগ করা হয় কেন?', a: { a: 'log দ্রুত চলে বলে', b: 'গুণফল underflow হয়ে ০ হয়ে যায়; log-যোগ স্থিতিশীল থাকে এবং তুলনার ক্রম একই রাখে', c: 'log সবসময় ধনাত্মক বলে' }, ok: 'b', why: 'log একঘেয়ে বর্ধমান, তাই বেশি সম্ভাব্য বাক্যের log-ও বেশি। আর ০ < p < ১ হলে log ঋণাত্মক, ধনাত্মক নয়।' },
    ],
    recap: ['log: গুণ → যোগ, underflow প্রতিরোধ', '−log p = বিস্ময় (loss-এর ভিত্তি)', 'derivative = ঢাল; সংখ্যাগতভাবে যাচাই সম্ভব'],
    nextNote: 'একাধিক ইনপুটের derivative হলো gradient, আর function-এর ভেতরে function হলে chain rule:',
    sources: [SRC.khanCalc, SRC.mml, SRC.mdnFloat],
  },
  {
    id: 'les-03-07-gradients-chain-rule',
    slug: 'gradient-chain-rule',
    title: 'Gradient ও Chain Rule',
    minutes: 45,
    prereqs: ['les-03-06-logs-derivatives'],
    summary: 'partial derivative; gradient = সব partial-এর vector, সবচেয়ে দ্রুত বৃদ্ধির দিক; chain rule দিয়ে nested function-এর derivative; সংখ্যাগত gradient check।',
    overview: p('একাধিক ইনপুটের function-এ প্রতিটি ইনপুটের জন্য আলাদা derivative থাকে—partial derivative। সবগুলো একসাথে একটি vector: gradient, যা দেখায় কোন দিকে গেলে function সবচেয়ে দ্রুত বাড়ে। Chain rule বলে function-এর ভেতরে function থাকলে derivative হলো ধাপগুলোর derivative-এর গুণফল। এই পাঠে একটি ছোট loss function-এর gradient হাতে বের করব, chain rule-এর প্রতিটি ধাপ সংখ্যায় দেখব, এবং সংখ্যাগত gradient check দিয়ে যাচাই করব। Backpropagation (অধ্যায় ৫) এটাই, শুধু বড় স্কেলে।'),
    objectives: ['partial derivative হিসাব করে gradient vector লিখতে পারবেন', 'chain rule দিয়ে nested function-এর derivative ধাপে ধাপে বের করতে পারবেন', 'সংখ্যাগত gradient check দিয়ে হাতে-বের-করা gradient যাচাই করতে পারবেন'],
    problem: p('ডেলিভারি-দাম মডেল y = w × ওজন + b। একটি উদাহরণে (ওজন = ২, আসল দাম = ১৩০) মডেল ভুল করছে। w একটু বাড়াব না কমাব? b? আর কতটা? দুটো parameter একসাথে, প্রতিটির প্রভাব আলাদা—এর উত্তর gradient।'),
    explain:
      p(`${term('পার্শিয়াল ডেরিভেটিভ', 'partial derivative')} ∂f/∂w: অন্য সব ইনপুট স্থির রেখে শুধু w বদলালে f-এর ঢাল।`) +
      p(`${term('গ্রেডিয়েন্ট', 'gradient')} ∇f = [∂f/∂w, ∂f/∂b, …]: সব partial-এর vector। এটি সেই দিক যেদিকে f সবচেয়ে দ্রুত বাড়ে। উল্টো দিক (−∇f) সবচেয়ে দ্রুত কমার দিক—পরের পাঠের মূল ধারণা।`) +
      p(`${term('চেইন রুল', 'chain rule')}: যদি L = g(u) এবং u = h(w), তবে dL/dw = (dL/du) × (du/dw)। প্রতিটি ধাপের স্থানীয় derivative গুণ করুন।`) +
      p('<strong>আমাদের loss:</strong> একটি উদাহরণে বর্গ-ভুল L = (ŷ − y)², যেখানে ŷ = wx + b (মডেলের অনুমান)।') +
      ol([
        'ধাপ ১: ŷ = wx + b',
        'ধাপ ২: e = ŷ − y (ভুল)',
        'ধাপ ৩: L = e²',
      ]) +
      p('Chain rule: ∂L/∂w = (∂L/∂e)(∂e/∂ŷ)(∂ŷ/∂w) = (২e)(১)(x) = ২ex। একইভাবে ∂L/∂b = (২e)(১)(১) = ২e।'),
    analogy: {
      text: 'Chain rule হলো গিয়ারের শিকল: প্রথম গিয়ার একবার ঘুরলে দ্বিতীয়টি ৩ বার, দ্বিতীয়টি একবার ঘুরলে তৃতীয়টি ২ বার—তাহলে প্রথমটির একবারে তৃতীয়টি ৩ × ২ = ৬ বার।',
      breaks: 'গিয়ারের অনুপাত সব অবস্থানে স্থির; derivative প্রতিটি বিন্দুতে আলাদা (যেমন ২e নির্ভর করে বর্তমান ভুল e-এর ওপর)। তাই chain rule-এর গুণফল প্রতিটি নতুন parameter মানে আবার হিসাব করতে হয়।',
    },
    worked:
      p('x = ২, y = ১৩০, বর্তমান w = ৫০, b = ১০।') +
      table(['ধাপ', 'হিসাব', 'মান'], [
        ['ŷ = wx + b', '৫০×২ + ১০', '১১০'],
        ['e = ŷ − y', '১১০ − ১৩০', '−২০'],
        ['L = e²', '(−২০)²', '৪০০'],
        ['∂L/∂e = ২e', '২×(−২০)', '−৪০'],
        ['∂L/∂w = ২e × x', '−৪০ × ২', '−৮০'],
        ['∂L/∂b = ২e × ১', '−৪০ × ১', '−৪০'],
      ], 'forward (উপরের তিন সারি) ও backward (নিচের তিন সারি)') +
      p('gradient = [−৮০, −৪০]। দুটোই ঋণাত্মক—মানে w বা b <em>বাড়ালে</em> L কমবে। অনুমান (১১০) আসলের (১৩০) চেয়ে কম, তাই বাড়ানোই যুক্তিসঙ্গত ✓। আর w-এর gradient বড় (x = ২ গুণ), তাই w-এর প্রভাব বেশি।'),
    activity: note('কোডে forward ও backward আলাদা ফাংশন। তারপর আগের পাঠের সংখ্যাগত derivative দিয়ে প্রতিটি partial যাচাই—এটিকে <strong>gradient check</strong> বলে।'),
    code: [
      {
        label: 'হাতে-লেখা gradient ও gradient check',
        starter: String.raw`function forward(w, b, x, y) {
  const yhat = w * x + b;
  const e = yhat - y;
  const L = e * e;
  return { yhat, e, L };
}

function backward(w, b, x, y) {
  const { e } = forward(w, b, x, y);
  const dL_de = 2 * e;          // L = e^2
  const de_dyhat = 1;           // e = yhat - y
  const dyhat_dw = x;           // yhat = w*x + b
  const dyhat_db = 1;
  return { dw: dL_de * de_dyhat * dyhat_dw, db: dL_de * de_dyhat * dyhat_db };
}

function numericGrad(w, b, x, y, h = 1e-5) {
  const L = (w2, b2) => forward(w2, b2, x, y).L;
  return {
    dw: (L(w + h, b) - L(w - h, b)) / (2 * h),
    db: (L(w, b + h) - L(w, b - h)) / (2 * h),
  };
}

const x = 2, y = 130, w = 50, b = 10;
console.log("forward:", forward(w, b, x, y));
const g = backward(w, b, x, y);
const n = numericGrad(w, b, x, y);
console.log("chain rule gradient:", g);
console.log("সংখ্যাগত gradient:", { dw: Math.round(n.dw * 1000) / 1000, db: Math.round(n.db * 1000) / 1000 });

// gradient-এর উল্টো দিকে ছোট পদক্ষেপ দিলে L কমে কি?
const step = 0.01;
const after = forward(w - step * g.dw, b - step * g.db, x, y);
console.log("পদক্ষেপের পর: w =", w - step * g.dw, "b =", b - step * g.db, "L =", Math.round(after.L * 100) / 100);
`,
        expect: ['"yhat":110', '"e":-20', '"L":400', 'chain rule gradient: {"dw":-80,"db":-40}', 'সংখ্যাগত gradient: {"dw":-80,"db":-40}', 'পদক্ষেপের পর: w = 50.8 b = 10.4 L = 324'],
        hints: ['backward-এর প্রতিটি লাইন একটি স্থানীয় derivative; শেষে গুণ।', 'numericGrad-এ শুধু একটি parameter নড়ে, অন্যটি স্থির—এটাই “partial”।', 'step বাড়িয়ে 0.2 করুন—L কি এখনও কমে? (পরের পাঠের learning rate।)'],
        test: '__close(g.dw,-80,1e-9,"dw"); __close(g.db,-40,1e-9,"db"); __close(n.dw,g.dw,1e-4,"check dw"); __close(n.db,g.db,1e-4,"check db"); __assert(after.L<400,"descent decreases loss"); var g2=backward(1.3,-0.7,3.1,2.2), n2=numericGrad(1.3,-0.7,3.1,2.2); __close(g2.dw,n2.dw,1e-4,"random point dw"); __close(g2.db,n2.db,1e-4,"random point db");',
      },
    ],
    line: ul([
      '<code>forward</code>: তিন ধাপের মধ্যবর্তী মান সব ফেরত দেয়—backward-এর দরকার হয়।',
      '<code>backward</code>: প্রতিটি স্থানীয় derivative আলাদা নামে (<code>dL_de</code>, <code>de_dyhat</code>…) যাতে chain rule-এর গুণ চোখে পড়ে।',
      '<code>numericGrad</code>: ভেতরে ছোট helper <code>L(w2, b2)</code>; w নড়ালে b স্থির, b নড়ালে w স্থির।',
      'শেষ অংশ: w ← w − ০.০১ × (−৮০) = ৫০.৮; b ← ১০ − ০.০১ × (−৪০) = ১০.৪। নতুন ŷ = ৫০.৮×২ + ১০.৪ = ১১২, তাই L = (১১২ − ১৩০)² = ৩২৪—৪০০ থেকে কমেছে ✓।',
    ]),
    why: p('প্রতিটি স্থানীয় derivative-কে আলাদা variable-এ রাখা backpropagation-এর হুবহু কাঠামো: forward-এ মান সংরক্ষণ, backward-এ শেষ থেকে শুরুতে স্থানীয় derivative গুণ। gradient check ছাড়া হাতে-লেখা gradient-এর ভুল প্রায়ই নীরব থাকে।'),
    remember: ['partial = একটি ইনপুট নড়ে, বাকি স্থির', 'gradient = partial-এর vector, বৃদ্ধির দিক', 'chain rule = স্থানীয় derivative-এর গুণফল', 'gradient check = সংখ্যাগত তুলনা'],
    skip: ['Jacobian ও Hessian matrix', 'multivariable calculus-এর আনুষ্ঠানিক প্রমাণ'],
    experiment: p('loss বদলে L = |e| (absolute error) করুন: <code>Math.abs(e)</code>। backward-এ dL/de কী হবে? (e > ০ হলে ১, e < ০ হলে −১।) কোডে বসিয়ে gradient check চালান। e = ০ হলে কী সমস্যা?'),
    mistakes: ['chain rule-এ একটি ধাপের derivative বাদ দেওয়া', 'gradient-এর চিহ্ন (sign) উল্টো পড়া', 'gradient check না করেই training শুরু', 'sign উল্টে gradient-এর দিকে পদক্ষেপ দেওয়া (তাতে loss বাড়ে)'],
    quiz: [
      { q: 'L = (wx + b − y)²-এ x = ৩, e = wx + b − y = ৫ হলে ∂L/∂w কত?', a: { a: '৩০', b: '১০', c: '১৫' }, ok: 'a', why: '∂L/∂w = ২e × x = ২ × ৫ × ৩ = ৩০। ১০ হলো ∂L/∂b (= ২e)।' },
      { q: 'gradient [−৮০, −৪০] হলে loss কমাতে w ও b কোন দিকে নড়াবেন?', a: { a: 'দুটোই বাড়াবেন', b: 'দুটোই কমাবেন', c: 'w বাড়াবেন, b কমাবেন' }, ok: 'a', why: 'loss কমাতে gradient-এর উল্টো দিকে যেতে হয়: −(−৮০) > ০, −(−৪০) > ০—দুটোই বাড়ানো।' },
      { q: 'u = ৩w এবং L = u² হলে w = ১-এ dL/dw কত?', a: { a: '৬', b: '১৮', c: '৯' }, ok: 'b', why: 'dL/du = ২u = ২ × ৩ = ৬; du/dw = ৩; গুণফল ১৮। যাচাই: L = ৯w², dL/dw = ১৮w = ১৮।' },
    ],
    recap: ['gradient বলে কোন parameter কোন দিকে কতটা প্রভাব ফেলে', 'chain rule-এ forward মান লাগে', 'gradient check বাধ্যতামূলক অভ্যাস'],
    nextNote: 'gradient-এর উল্টো দিকে বারবার পদক্ষেপ—এটাই gradient descent। অধ্যায়ের দ্বিতীয় প্রজেক্ট:',
    synthetic: true,
    sources: [SRC.khanCalc, SRC.mml, ['CS231n — Optimization: gradient check', 'https://cs231n.github.io/optimization-1/']],
  },
  {
    id: 'les-03-08-gradient-descent',
    slug: 'gradient-descent',
    title: 'Gradient Descent ও Learning Rate (প্রজেক্ট: Visualizer)',
    minutes: 50,
    prereqs: ['les-03-07-gradients-chain-rule'],
    summary: 'বারবার w ← w − η∇L; learning rate খুব ছোট/ঠিক/খুব বড় হলে কী হয়; একাধিক উদাহরণের গড় loss; টেক্সট visualizer-এ প্রতিটি আপডেট দেখা।',
    overview: p('Gradient descent একটি সরল পুনরাবৃত্তি: বর্তমান parameter-এ loss-এর gradient হিসাব করো, তারপর learning rate η গুণ করে উল্টো দিকে একটু সরো—w ← w − η × ∂L/∂w। এই পাঠের প্রজেক্টে একটি টেক্সট-ভিত্তিক visualizer বানাব যা প্রতিটি ধাপে w, b, gradient ও loss দেখায়, এবং তিনটি learning rate তুলনা করব: খুব ছোট (ধীর), উপযুক্ত (দ্রুত মিলে), খুব বড় (loss বিস্ফোরিত হয়)। একাধিক উদাহরণে গড় loss ব্যবহার করব, যা অধ্যায় ৪-এর training-এর ভিত্তি।'),
    objectives: ['gradient descent-এর আপডেট নিয়ম লিখে হাতে এক ধাপ হিসাব করতে পারবেন', 'learning rate-এর তিন আচরণ (ধীর, মিলন, বিস্ফোরণ) চিনতে পারবেন', 'একাধিক উদাহরণের গড় loss ও তার gradient দিয়ে একটি linear model fit করতে পারবেন'],
    problem: p('চারটি পুরনো পার্সেলের (ওজন, দাম) ডেটা আছে। এমন w ও b চাই যাতে দাম ≈ w × ওজন + b সবগুলোর জন্য ভালো মেলে। আগের পাঠে এক ধাপ দেখেছি; কিন্তু কতবার, কত বড় পদক্ষেপ, আর কখন থামব?'),
    explain:
      p(`${term('গ্রেডিয়েন্ট ডিসেন্ট', 'gradient descent')}:`) +
      code(`বারবার:
  g = ∇L(θ)          // বর্তমান parameter θ-তে gradient
  θ ← θ − η · g      // উল্টো দিকে η মাপের পদক্ষেপ`) +
      p(`${term('লার্নিং রেট', 'learning rate, η')}: পদক্ষেপের আকার। এটি মডেল নিজে শেখে না—আমরা বাছাই করি (একে <em>hyperparameter</em> বলে)।`) +
      table(['η', 'আচরণ', 'চিহ্ন'], [
        ['খুব ছোট', 'সঠিক দিকে যায় কিন্তু অনেক ধাপ লাগে', 'loss খুব ধীরে কমে'],
        ['উপযুক্ত', 'কয়েক ধাপে সমাধানের কাছে', 'loss দ্রুত কমে থিতু হয়'],
        ['খুব বড়', 'সমাধান পেরিয়ে অন্য দিকে আরও দূরে', 'loss বাড়তে থাকে, শেষে Infinity/NaN'],
      ], 'learning rate-এর প্রভাব') +
      p(`<strong>গড় loss (mean squared error, MSE):</strong> N উদাহরণে L = (১/N) Σ (ŷᵢ − yᵢ)²। gradient: ∂L/∂w = (১/N) Σ ২eᵢxᵢ, ∂L/∂b = (১/N) Σ ২eᵢ। গড় নেওয়ায় উদাহরণ সংখ্যা বাড়লেও gradient-এর মাপ স্থিতিশীল থাকে।`) +
      p('<strong>কখন থামব:</strong> নির্দিষ্ট ধাপ শেষ হলে, বা loss-এর উন্নতি খুব ছোট হলে। gradient ০ হলে আমরা সর্বনিম্ন বিন্দুতে (বা সমতল জায়গায়)। Linear model + MSE-এ একটিই সর্বনিম্ন থাকে; neural network-এ অনেক থাকতে পারে (অধ্যায় ৫)।'),
    analogy: {
      text: 'ঘন কুয়াশায় পাহাড় থেকে নামা: চারপাশ দেখা যায় না, শুধু পায়ের নিচের ঢাল টের পান (gradient)। প্রতিবার ঢালের উল্টো দিকে এক পা ফেলেন। পা খুব ছোট হলে সারাদিন লাগে; খুব বড় হলে উপত্যকা পেরিয়ে উল্টো পাহাড়ে উঠে যান।',
      breaks: 'আসল পাহাড় ৩-dimension; মডেলের “পাহাড়” লক্ষ লক্ষ dimension-এ। আর পাহাড়ে নামা মানুষ জানেন কখন সমতলে পৌঁছেছেন; gradient descent শুধু জানে gradient ছোট হয়েছে—সেটি সেরা সমাধান কিনা নিশ্চিত নয়।',
    },
    worked:
      p('ডেটা (ওজন, দাম): (১, ৯০), (২, ১৩০), (৩, ১৭০), (৪, ২১০)—এগুলো ঠিক দাম = ৪০ × ওজন + ৫০ রেখায় বসানো (সিন্থেটিক)। শুরু: w = ০, b = ০, η = ০.০৫।') +
      ol([
        'অনুমান সব ০; ভুল e = [−৯০, −১৩০, −১৭০, −২১০]।',
        'MSE = (৮১০০ + ১৬৯০০ + ২৮৯০০ + ৪৪১০০) / ৪ = ২৪৫০০।',
        '∂L/∂w = (২/৪)(−৯০×১ − ১৩০×২ − ১৭০×৩ − ২১০×৪) = ০.৫ × (−১৭০০) = −৮৫০।',
        '∂L/∂b = (২/৪)(−৯০ − ১৩০ − ১৭০ − ২১০) = ০.৫ × (−৬০০) = −৩০০।',
        'আপডেট: w = ০ − ০.০৫ × (−৮৫০) = ৪২.৫; b = ০ − ০.০৫ × (−৩০০) = ১৫।',
      ]) +
      p('এক ধাপেই w আসল ৪০-এর কাছাকাছি, b অনেক পিছিয়ে। পরের ধাপগুলো visualizer-এ দেখুন।'),
    activity: p('<strong>প্রজেক্ট মানদণ্ড:</strong> (১) η = ০.০০৫, ০.০৫, ০.১৫ তিনটিতে চালিয়ে প্রতিটির শেষ loss ও আচরণ লিখুন, (২) প্রথম ধাপের w, b হাতের হিসাবের সাথে মিলান, (৩) এমন একটি থামার শর্ত যোগ করুন যা loss-এর উন্নতি ১০⁻⁶-এর কম হলে থামে।'),
    code: [
      {
        label: 'প্রজেক্ট: Gradient Descent Visualizer (টেক্সট)',
        starter: String.raw`// সিন্থেটিক ডেটা: দাম = 40*ওজন + 50 (ঠিক রেখায়)
const X = [1, 2, 3, 4];
const Y = [90, 130, 170, 210];

function lossAndGrad(w, b) {
  let L = 0, dw = 0, db = 0;
  const N = X.length;
  for (let i = 0; i < N; i++) {
    const e = w * X[i] + b - Y[i];
    L += e * e / N;
    dw += 2 * e * X[i] / N;
    db += 2 * e / N;
  }
  return { L, dw, db };
}

const f2 = (x) => (Math.abs(x) >= 1e6 ? x.toExponential(2) : (Math.round(x * 100) / 100).toFixed(2));

function train(lr, steps, every) {
  let w = 0, b = 0;
  console.log("== learning rate " + lr + " ==");
  for (let t = 0; t <= steps; t++) {
    const { L, dw, db } = lossAndGrad(w, b);
    if (t % every === 0 || t === steps) {
      const bar = "█".repeat(Math.min(40, Math.max(0, Math.round(Math.log10(L + 1) * 8))));
      console.log("t=" + String(t).padStart(3) + " w=" + f2(w).padStart(9) + " b=" + f2(b).padStart(9) + " loss=" + f2(L).padStart(10) + " " + bar);
    }
    if (!Number.isFinite(L)) { console.log("   loss বিস্ফোরিত—থামানো হলো"); break; }
    w = w - lr * dw;
    b = b - lr * db;
  }
}

train(0.005, 200, 50);
train(0.05, 200, 50);
train(0.15, 40, 10);
`,
        expect: ['== learning rate 0.05 ==', 't=  0 w=     0.00 b=     0.00 loss=  24500.00', 't=200 w=    40.', '== learning rate 0.15 =='],
        hints: ['০.০৫-এ t=200-এ w ও b কত? আসল উত্তর w=40, b=50।', '০.১৫-এ loss কমার বদলে বাড়ছে কেন? প্রতিটি পদক্ষেপ সমাধান পেরিয়ে যাচ্ছে।', '█ বারের দৈর্ঘ্য log10(loss)-এর অনুপাতে—বিশাল পরিসর দেখাতে log (আগের পাঠ)।', 'থামার শর্ত: আগের loss মনে রেখে if (prevL - L < 1e-6) break;'],
        test: 'var wb=(function(){var w=0,b=0;for(var t=0;t<3000;t++){var g=lossAndGrad(w,b);w-=0.05*g.dw;b-=0.05*g.db;}return [w,b];})(); __close(wb[0],40,1e-3,"w converges"); __close(wb[1],50,1e-3,"b converges"); var g0=lossAndGrad(0,0); __close(g0.L,24500,1e-9,"initial loss"); __close(g0.dw,-850,1e-9,"dw0"); __close(g0.db,-300,1e-9,"db0"); var d=(function(){var w=0,b=0,L0=lossAndGrad(0,0).L;for(var t=0;t<40;t++){var g=lossAndGrad(w,b);w-=0.15*g.dw;b-=0.15*g.db;}return lossAndGrad(w,b).L>L0;})(); __assert(d,"lr 0.15 diverges");',
      },
    ],
    line: ul([
      '<code>lossAndGrad</code>: একই loop-এ loss ও দুই gradient—প্রতিটি উদাহরণের ভুল e থেকে। <code>/ N</code> দিয়ে গড়।',
      '<code>w = w - lr * dw</code>: আপডেট নিয়মের হুবহু কোড।',
      '<code>t % every === 0</code>: প্রতি every ধাপে একবার ছাপা (আউটপুট সীমিত রাখতে)।',
      '<code>Number.isFinite(L)</code>: Infinity বা NaN হলে false—বিস্ফোরণ শনাক্ত করে থামা।',
      '<code>toExponential(2)</code>: খুব বড় সংখ্যাকে ২.৩৪e+৮ রূপে দেখানো।',
    ]),
    why: p('একই ডেটায় তিনটি learning rate পাশাপাশি চালানো হয়েছে যাতে hyperparameter-এর প্রভাব সরাসরি তুলনা করা যায়। ডেটা ইচ্ছাকৃতভাবে ঠিক একটি রেখায় রাখা হয়েছে যাতে “সঠিক উত্তর” (৪০, ৫০) জানা থাকে এবং মিলন যাচাই করা যায়—বাস্তব ডেটায় কোনো রেখা সব বিন্দু ছোঁয় না।'),
    remember: ['θ ← θ − η∇L', 'η বেশি ছোট: ধীর; বেশি বড়: বিস্ফোরণ', 'গড় loss-এর gradient = প্রতিটি উদাহরণের gradient-এর গড়', 'থামার শর্ত রাখুন ও NaN/Infinity পাহারা দিন'],
    skip: ['momentum, Adam (অধ্যায় ৫-এ সংক্ষেপে)', 'convexity-র প্রমাণ', 'learning rate schedule'],
    experiment: p('X-কে ১০০ গুণ করুন ([১০০, ২০০, ৩০০, ৪০০]) এবং Y-কে সেই অনুযায়ী (৪০ × x + ৫০)। η = ০.০৫ এখন কী করে? কেন? (ইঙ্গিত: dw-এর মধ্যে x গুণ হয়, তাই gradient অনেক বড়। এটাই feature scaling-এর কারণ—অধ্যায় ৪।)'),
    mistakes: ['gradient-এর দিকে (উল্টো নয়) পদক্ষেপ দেওয়া', 'loss বাড়ছে দেখেও learning rate না কমানো', 'বড় মানের feature scaling না করা', 'শুধু শেষ loss দেখে পুরো যাত্রা (curve) না দেখা'],
    quiz: [
      { q: 'w = ২, ∂L/∂w = ৫, η = ০.১ হলে এক ধাপ পর w কত?', a: { a: '১.৫', b: '২.৫', c: '১.৯' }, ok: 'a', why: 'w − η × g = ২ − ০.১ × ৫ = ২ − ০.৫ = ১.৫।' },
      { q: 'প্রতি ধাপে loss বাড়ছে এবং শেষে NaN হচ্ছে। সম্ভাব্য প্রথম সমাধান কোনটি?', a: { a: 'learning rate কমানো', b: 'আরও বেশি ধাপ চালানো', c: 'learning rate বাড়ানো' }, ok: 'a', why: 'বিস্ফোরণের সাধারণ কারণ খুব বড় পদক্ষেপ। বেশি ধাপ চালালে শুধু আরও খারাপ হবে।' },
      { q: 'learning rate কে ঠিক করে?', a: { a: 'মডেল নিজে training-এ শেখে', b: 'প্রকৌশলী বাছাই করেন (hyperparameter)', c: 'ডেটাসেটের label' }, ok: 'b', why: 'w, b-এর মতো parameter training শেখে; η-এর মতো hyperparameter আমরা ঠিক করি ও পরীক্ষা করে বাছাই করি।' },
    ],
    recap: ['gradient descent = বারবার ছোট উতরাই পদক্ষেপ', 'learning rate-এর তিন আচরণ নিজের চোখে দেখলেন', 'জানা উত্তর দিয়ে মিলন যাচাই'],
    nextNote: 'গণিত প্রস্তুত! এবার বাস্তব ML-এর নিয়ম: ডেটা ভাগ, loss, মূল্যায়ন। অধ্যায় ৪:',
    synthetic: true,
    sources: [SRC.googleMLCC, SRC.d2l, ['CS231n — Optimization', 'https://cs231n.github.io/optimization-1/']],
  },
];

export default { chapter, lessons };

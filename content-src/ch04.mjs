import { p, ul, ol, code, out, note, warn, table, term, SRC } from './lib.mjs';

const chapter = {
  id: 'ch-04-ml-foundations',
  slug: 'machine-learning-vitti',
  title: 'Machine Learning-এর ভিত্তি',
  order: 4,
  public: false,
  summary: 'ডেটার মান ও feature scaling; train/validation/test ভাগ; regression ও classification; loss ও optimization; overfitting ও regularization; accuracy, precision, recall, F1; data leakage।',
  overview: p(
    'এই অধ্যায়ে অধ্যায় ৩-এর gradient descent দিয়ে আসল ML মডেল বানাব এবং—সমান গুরুত্বপূর্ণ—সৎভাবে মাপব। ডেটার মান যাচাই, train/validation/test ভাগ, regression ও classification, loss function, underfitting/overfitting, regularization, এবং accuracy, precision, recall ও F1-এর মতো metric শিখব। দেখব কেন training-এর ভালো ফল আসল নির্ভরযোগ্যতা প্রমাণ করে না, আর data leakage কীভাবে মূল্যায়নকে মিথ্যা সুন্দর দেখায়।',
    'প্রজেক্ট: একটি স্পষ্টভাবে লেবেল-করা সিন্থেটিক ডেটাসেটে গ্রাহক-মেসেজ classifier, held-out test সেটে মূল্যায়নসহ।'
  ),
};

const RNG = String.raw`// seed-যুক্ত ছদ্ম-দৈব সংখ্যা (mulberry32): একই seed = একই ক্রম
function makeRng(seed) {
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

const lessons = [
  {
    id: 'les-04-01-features-data-quality',
    slug: 'feature-label-data-quality',
    title: 'Feature, Label ও ডেটার মান',
    minutes: 35,
    prereqs: ['les-03-08-gradient-descent', 'les-01-04-models-params-data'],
    summary: 'অনুপস্থিত মান, ডুপ্লিকেট, ভুল লেবেল, অসঙ্গত একক; feature scaling (standardization) কেন gradient descent-কে সাহায্য করে।',
    overview: p('মডেল যত ভালোই হোক, ভুল ডেটা থেকে ভুল আচরণই শিখবে। এই পাঠে একটি ছোট অর্ডার-ডেটাসেটে চার ধরনের সমস্যা খুঁজব—অনুপস্থিত মান, ডুপ্লিকেট সারি, অসম্ভব মান ও ভুল লেবেল—এবং কোড দিয়ে একটি “ডেটা অডিট” রিপোর্ট বানাব। তারপর feature scaling (standardization: গড় বাদ দিয়ে standard deviation দিয়ে ভাগ) শিখব, এবং দেখব কেন এটি অধ্যায় ৩-এর learning-rate সমস্যার সমাধান করে।'),
    objectives: ['একটি ডেটাসেটে অনুপস্থিত, ডুপ্লিকেট ও অসম্ভব মান কোড দিয়ে খুঁজে পেতে পারবেন', 'ভুল লেবেলের ঝুঁকি ও তা কমানোর উপায় ব্যাখ্যা করতে পারবেন', 'standardization হিসাব করে কেন তা training সহজ করে বলতে পারবেন'],
    problem: p('৮টি অর্ডারের ডেটা থেকে “ফেরত আসবে কি না” অনুমান করতে চান। কিন্তু খুলে দেখলেন: একটি সারিতে দাম নেই, দুটি সারি হুবহু একই, একটিতে ওজন −৩ কেজি, আর একটি ফেরত-আসা অর্ডার “ফেরত নয়” লেবেল পেয়েছে। এই অবস্থায় training চালালে কী শিখবে?'),
    explain:
      table(['সমস্যা', 'উদাহরণ', 'ঝুঁকি', 'সাধারণ পদক্ষেপ'], [
        ['অনুপস্থিত মান', 'price = null', 'হিসাবে NaN, নীরবে ভুল', 'বাদ দেওয়া বা যুক্তিসঙ্গতভাবে পূরণ—কোনটি করলেন লিখে রাখুন'],
        ['ডুপ্লিকেট', 'একই অর্ডার দুবার', 'কিছু উদাহরণের অতিরিক্ত প্রভাব; train-test-এ ঢুকলে leakage', 'স্থির key দিয়ে ডুপ্লিকেট সরান'],
        ['অসম্ভব মান', 'weight = −৩', 'মডেল অবাস্তব প্যাটার্ন শেখে', 'সীমা-যাচাই (validation rule)'],
        ['ভুল লেবেল', 'ফেরত এসেছে কিন্তু label = 0', 'মডেল ভুলটাই শেখে', 'নমুনা হাতে পুনঃপরীক্ষা, স্পষ্ট লেবেল-নির্দেশিকা'],
      ], 'চার ধরনের ডেটা সমস্যা') +
      p(`${term('ফিচার স্কেলিং', 'feature scaling')}: ভিন্ন এককের feature-কে তুলনীয় পরিসরে আনা। সবচেয়ে প্রচলিত ${term('স্ট্যান্ডার্ডাইজেশন', 'standardization')}: z = (x − গড়) / σ, যেখানে σ হলো standard deviation = √(গড়((x − গড়)²))।`) +
      p('কেন: অধ্যায় ৩-এর পরীক্ষায় দেখেছেন x ১০০ গুণ হলে gradient ১০০ গুণ বড় হয় এবং একই learning rate বিস্ফোরণ ঘটায়। scaling করলে সব feature-এর gradient কাছাকাছি মাপের হয়, তাই একটি learning rate সবার জন্য কাজ করে।') +
      warn('গড় ও σ <strong>শুধু training সেট থেকে</strong> হিসাব করুন, তারপর একই সংখ্যা দিয়ে validation/test রূপান্তর করুন। পুরো ডেটা থেকে নিলে test-এর তথ্য training-এ ঢোকে (data leakage, এই অধ্যায়ের শেষে)।'),
    analogy: {
      text: 'ডেটা পরিষ্কার করা হলো রান্নার আগে চাল বাছা: পাথর (অসম্ভব মান), খোসা (অনুপস্থিত), দুবার গোনা মুঠো (ডুপ্লিকেট) সরানো।',
      breaks: 'চালের পাথর দেখলেই চেনা যায়; ভুল লেবেল প্রায়ই দেখতে স্বাভাবিক—“ফেরত নয়” লেখা সারি অন্য সারির মতোই। এজন্য শুধু নিয়ম নয়, নমুনা হাতে পরীক্ষাও লাগে।',
    },
    worked:
      p('ওজন কলাম (সমস্যা সরানোর পর): [১, ২, ৩, ৪, ৫]।') +
      ol([
        'গড় = ১৫ / ৫ = ৩।',
        'বিচ্যুতি: [−২, −১, ০, ১, ২]; বর্গ: [৪, ১, ০, ১, ৪]; গড় = ২।',
        'σ = √২ ≈ ১.৪১৪২।',
        'z = [−১.৪১৪, −০.৭০৭, ০, ০.৭০৭, ১.৪১৪]। নতুন গড় ০, σ ১।',
      ]),
    activity: note('কোডে একটি অডিট ফাংশন প্রতিটি সমস্যা গুনে রিপোর্ট দেয়, তারপর পরিষ্কার সারিগুলোর ওজন standardize করে।'),
    code: [
      {
        label: 'ডেটা অডিট ও standardization',
        starter: String.raw`// সিন্থেটিক অর্ডার ডেটা — ইচ্ছাকৃত সমস্যাসহ
const rows = [
  { id: "A1", price: 450, weight: 1, returned: 0 },
  { id: "A2", price: null, weight: 2, returned: 0 },
  { id: "A3", price: 1200, weight: 3, returned: 1 },
  { id: "A3", price: 1200, weight: 3, returned: 1 },
  { id: "A4", price: 300, weight: -3, returned: 0 },
  { id: "A5", price: 800, weight: 2, returned: 1 },
  { id: "A6", price: 950, weight: 4, returned: 0 },
  { id: "A7", price: 600, weight: 5, returned: 1 },
];

function audit(rows) {
  const seen = new Set();
  const issues = { missing: [], duplicate: [], impossible: [] };
  const clean = [];
  for (const r of rows) {
    if (seen.has(r.id)) { issues.duplicate.push(r.id); continue; }
    seen.add(r.id);
    if (r.price === null || r.weight === null) { issues.missing.push(r.id); continue; }
    if (r.weight <= 0 || r.price <= 0) { issues.impossible.push(r.id); continue; }
    clean.push(r);
  }
  return { issues, clean };
}

const { issues, clean } = audit(rows);
console.log("সমস্যা:", JSON.stringify(issues));
console.log("পরিষ্কার সারি:", clean.map((r) => r.id).join(", "));

const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const std = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
const r3 = (x) => Math.round(x * 1000) / 1000;

const w = clean.map((r) => r.weight);
const m = mean(w), s = std(w);
const z = w.map((x) => r3((x - m) / s));
console.log("ওজন:", w, "গড়:", r3(m), "σ:", r3(s));
console.log("z:", z, "নতুন গড়:", r3(mean(z)));
`,
        expect: ['"missing":["A2"]', '"duplicate":["A3"]', '"impossible":["A4"]', 'পরিষ্কার সারি: A1, A3, A5, A6, A7', 'নতুন গড়: 0'],
        hints: ['Set হলো এমন সংগ্রহ যেখানে একই মান দুবার থাকে না—ডুপ্লিকেট ধরতে কাজে লাগে।', 'continue: loop-এর বাকি অংশ বাদ দিয়ে পরের সারিতে যায়।', 'ভুল লেবেল কোড দিয়ে ধরা গেল না—কেন? কোন তথ্য থাকলে ধরা যেত?'],
        test: '__assert(clean.length===5,"clean"); __close(mean(z),0,1e-3,"z mean"); __close(std(clean.map(function(r){return (r.weight-m)/s;})),1,1e-9,"z std");',
      },
    ],
    line: ul([
      '<code>new Set()</code> ও <code>seen.has(r.id)</code>: আগে দেখা id আবার এলে ডুপ্লিকেট।',
      'অডিটের ক্রম: আগে ডুপ্লিকেট, তারপর অনুপস্থিত, তারপর অসম্ভব—প্রতিটি সারি একটি কারণেই বাদ পড়ে এবং রিপোর্টে থাকে।',
      '<code>(x - m) ** 2</code>: <code>**</code> হলো ঘাত (power)।',
      'z-এর গড় ০ ও σ ১—এটাই standardization-এর সংজ্ঞা।',
    ]),
    why: p('অডিট ফাংশন শুধু বাদ দেয় না, কোন সারি কেন বাদ পড়ল তার রিপোর্টও দেয়—কারণ নীরবে ডেটা বাদ দিলে পরে মূল্যায়ন বোঝা যায় না। ভুল লেবেল ইচ্ছাকৃতভাবে কোডে ধরা হয়নি, যাতে দেখা যায় সব সমস্যা নিয়ম দিয়ে ধরা যায় না।'),
    remember: ['চার সমস্যা: অনুপস্থিত, ডুপ্লিকেট, অসম্ভব, ভুল লেবেল', 'কী বাদ দিলেন ও কেন—লিখে রাখুন', 'z = (x − গড়) / σ', 'scaling-এর পরিসংখ্যান শুধু training সেট থেকে'],
    skip: ['imputation-এর উন্নত পদ্ধতি', 'min-max scaling, robust scaling', 'outlier শনাক্তের পরিসংখ্যানিক টেস্ট'],
    experiment: p('A2-এর অনুপস্থিত দাম বাদ না দিয়ে বাকি দামের গড় দিয়ে পূরণ করুন। কোড বদলান এবং ভাবুন: এটি কি ডেটায় নতুন কোনো পক্ষপাত আনল? কোন পরিস্থিতিতে বাদ দেওয়া ভালো?'),
    mistakes: ['সমস্যাযুক্ত সারি নীরবে বাদ দেওয়া, রিপোর্ট না রাখা', 'পুরো ডেটাসেট থেকে scaling পরিসংখ্যান নেওয়া', 'ভাবা যে কোড-যাচাই সব লেবেল ভুল ধরবে', 'σ = ০ হলে (সব মান একই) ভাগ করা'],
    quiz: [
      { q: 'মান [২, ৪, ৬]-এর গড় ৪ ও σ ≈ ১.৬৩। ৬-এর z-score প্রায় কত?', a: { a: '১.২২', b: '২', c: '০' }, ok: 'a', why: '(৬ − ৪) / ১.৬৩ ≈ ১.২২। z মাপে গড় থেকে কত σ দূরে।' },
      { q: 'একই অর্ডার train ও test দুই সেটেই থাকলে কী সমস্যা?', a: { a: 'কোনো সমস্যা নেই', b: 'মডেল test-এ “দেখা” উদাহরণ পায়, তাই মূল্যায়ন বাস্তবের চেয়ে ভালো দেখায়', c: 'training ধীর হয়' }, ok: 'b', why: 'ডুপ্লিকেট দুই সেটে ছড়ালে test আর নতুন ডেটা থাকে না—এটি data leakage।' },
      { q: 'feature scaling gradient descent-এ কেন সাহায্য করে?', a: { a: 'ডেটা ছোট হয় বলে', b: 'সব feature-এর gradient কাছাকাছি মাপের হয়, তাই এক learning rate সবার জন্য কাজ করে', c: 'label বদলে যায় বলে' }, ok: 'b', why: 'বড় এককের feature-এর gradient বিশাল হয়ে বিস্ফোরণ ঘটায়; scaling তা সমান করে।' },
    ],
    recap: ['ডেটা অডিট training-এর আগে', 'বাদ দেওয়ার কারণ লিপিবদ্ধ করুন', 'standardization: গড় ০, σ ১', 'scaling-এর পরিসংখ্যান train থেকে'],
    nextNote: 'এবার ডেটা ভাগ করব যাতে মূল্যায়ন সৎ হয়:',
    synthetic: true,
    sources: [SRC.googleMLCC, ['scikit-learn — Preprocessing data (StandardScaler)', 'https://scikit-learn.org/stable/modules/preprocessing.html']],
  },
  {
    id: 'les-04-02-train-val-test',
    slug: 'train-validation-test',
    title: 'Train, Validation ও Test Split',
    minutes: 30,
    prereqs: ['les-04-01-features-data-quality'],
    summary: 'কেন তিন ভাগ; seed-যুক্ত shuffle; test সেট শেষে একবার; ছোট ডেটায় ভাগের ওঠানামা।',
    overview: p('মডেল যে ডেটায় শিখেছে সেখানে তার ফল দেখে নির্ভরযোগ্যতা বলা যায় না—মুখস্থ করেও ভালো ফল আসে। তাই ডেটা তিন ভাগে ভাগ করা হয়: training (শেখার জন্য), validation (hyperparameter ও মডেল বাছাইয়ের জন্য) এবং test (শেষে একবার, চূড়ান্ত মূল্যায়ন)। এই পাঠে seed-যুক্ত shuffle দিয়ে পুনরুৎপাদনযোগ্য ভাগ বানাব, দেখব seed বদলালে ছোট ডেটায় ফল কতটা ওঠানামা করে, এবং কেন test সেট বারবার দেখা যায় না।'),
    objectives: ['train, validation ও test সেটের ভূমিকা আলাদা করে বলতে পারবেন', 'seed-যুক্ত shuffle দিয়ে পুনরুৎপাদনযোগ্য ভাগ বানাতে পারবেন', 'কেন test সেট বারবার ব্যবহার করলে মূল্যায়ন দূষিত হয় তা ব্যাখ্যা করতে পারবেন'],
    problem: p('আপনি ১০টি ভিন্ন learning rate চেষ্টা করলেন, প্রতিবার test সেটে ফল দেখে সবচেয়ে ভালোটি বাছলেন, আর রিপোর্টে লিখলেন “test accuracy ৯২%”। নতুন মাসের আসল মেসেজে পেলেন ৭৮%। কোথায় ভুল হলো?'),
    explain:
      table(['সেট', 'কাজ', 'কতবার দেখা হয়', 'সাধারণ অংশ'], [
        ['Training', 'parameter (w, b) শেখা', 'বারবার', '৬০–৮০%'],
        ['Validation', 'hyperparameter (learning rate, epoch) ও মডেল বাছাই', 'বাছাইয়ের সময় বারবার', '১০–২০%'],
        ['Test', 'চূড়ান্ত, নিরপেক্ষ মূল্যায়ন', 'একবার, সব সিদ্ধান্তের পরে', '১০–২০%'],
      ], 'তিন ভাগের ভূমিকা') +
      p('সমস্যার উত্তর: test সেট দেখে বাছাই করলে test আসলে validation হয়ে যায়—আপনি test-এর জন্যই মডেলটি “টিউন” করেছেন। ৯২% আশাবাদী অনুমান।') +
      p(`<strong>Shuffle কেন:</strong> ডেটা প্রায়ই সাজানো থাকে (যেমন সময় অনুযায়ী, বা লেবেল অনুযায়ী)। না মিশিয়ে প্রথম ৮০% নিলে training-এ এক ধরনের, test-এ আরেক ধরনের উদাহরণ পড়তে পারে।`) +
      p(`<strong>Seed কেন:</strong> ${term('ছদ্ম-দৈব সংখ্যা', 'pseudo-random number')} জেনারেটর একটি seed থেকে নির্ধারিত ক্রম দেয়। একই seed = একই shuffle = অন্য কেউ একই ফল পুনরুৎপাদন করতে পারেন। <code>Math.random()</code>-এর seed ঠিক করা যায় না, তাই আমরা নিজের ছোট জেনারেটর (mulberry32) ব্যবহার করব।`) +
      note('<strong>সময়-নির্ভর ডেটা ব্যতিক্রম:</strong> ভবিষ্যৎ অনুমানের কাজে (যেমন আগামী মাসের বিক্রি) এলোমেলো না করে পুরনো দিয়ে train, নতুন দিয়ে test করা উচিত—না হলে মডেল “ভবিষ্যৎ দেখে” শেখে।'),
    analogy: {
      text: 'Training হলো অনুশীলনের প্রশ্ন, validation হলো মডেল টেস্ট পরীক্ষা (কোন পড়ার কৌশল কাজ করছে দেখতে), test হলো বোর্ড পরীক্ষা—একবারই।',
      breaks: 'বোর্ড পরীক্ষার প্রশ্ন আগে দেখা যায় না; ML-এ test সেট আপনার হাতেই থাকে, তাই না দেখার শৃঙ্খলা আপনাকেই রাখতে হয়। কেউ পাহারা দেয় না।',
    },
    worked:
      p('১০টি উদাহরণ (id ০–৯), seed = ৪২, ভাগ ৬/২/২।') +
      ol([
        'seed ৪২ দিয়ে Fisher–Yates shuffle: প্রতিটি অবস্থান i (শেষ থেকে) একটি দৈব j ≤ i-এর সাথে অদলবদল।',
        'প্রথম ৬টি → train, পরের ২টি → validation, শেষ ২টি → test।',
        'একই seed আবার চালালে হুবহু একই ভাগ—কোডে যাচাই করব।',
      ]),
    activity: note('কোডে seed-যুক্ত shuffle, ভাগ, এবং “seed বদলালে test-এর লেবেল-অনুপাত কতটা বদলায়” পরীক্ষা।'),
    code: [
      {
        label: 'পুনরুৎপাদনযোগ্য split',
        starter: RNG + String.raw`
function shuffle(arr, seed) {
  const a = arr.slice();               // আসলটি অক্ষত রাখি
  const rand = makeRng(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function split(arr, seed, fracTrain = 0.6, fracVal = 0.2) {
  const s = shuffle(arr, seed);
  const nTr = Math.round(s.length * fracTrain);
  const nVa = Math.round(s.length * fracVal);
  return { train: s.slice(0, nTr), val: s.slice(nTr, nTr + nVa), test: s.slice(nTr + nVa) };
}

// সিন্থেটিক: 10টি মেসেজ, লেবেল 1 = অভিযোগ (4টি), 0 = অন্য (6টি)
const data = Array.from({ length: 10 }, (_, i) => ({ id: i, y: i < 4 ? 1 : 0 }));

const a = split(data, 42), b = split(data, 42);
console.log("seed 42 test ids:", a.test.map((d) => d.id), "আবার:", b.test.map((d) => d.id));
console.log("আকার:", a.train.length, a.val.length, a.test.length);

// seed বদলালে test-এ অভিযোগের অনুপাত
for (const seed of [1, 2, 3, 4, 5]) {
  const t = split(data, seed).test;
  console.log("seed", seed, "test-এ অভিযোগ:", t.filter((d) => d.y === 1).length + "/" + t.length);
}
`,
        expect: ['আকার: 6 2 2', 'seed 1 test-এ অভিযোগ:'],
        hints: ['[a[i], a[j]] = [a[j], a[i]] হলো দুই মান অদলবদলের সংক্ষিপ্ত রূপ (destructuring)।', 'Array.from({ length: 10 }, (_, i) => …) দিয়ে ০–৯ id-এর array।', 'seed ১–৫-এ test-এ অভিযোগ কখনো ১/২, কখনো ০/২—অথচ পুরো ডেটায় অনুপাত ৪/১০। ২টি উদাহরণের test-এ ফল কতটা বিশ্বাসযোগ্য?'],
        test: '__assert(JSON.stringify(split(data,42).test)===JSON.stringify(split(data,42).test),"reproducible"); var s=split(data,7); var ids=s.train.concat(s.val,s.test).map(function(d){return d.id;}).sort(function(x,y){return x-y;}); __assert(JSON.stringify(ids)==="[0,1,2,3,4,5,6,7,8,9]","partition, no overlap");',
      },
    ],
    line: ul([
      '<code>makeRng(seed)</code>: একটি function ফেরত দেয় যেটি প্রতিবার ০ থেকে ১-এর মধ্যে নতুন সংখ্যা দেয়, কিন্তু ক্রমটি seed দিয়ে নির্ধারিত। ভেতরের বিট-অপারেশন মুখস্থ করার দরকার নেই।',
      '<code>arr.slice()</code>: কপি—shuffle আসল ডেটা বদলায় না।',
      'Fisher–Yates: শেষ থেকে প্রতিটি অবস্থানে আগের যেকোনো একটির সাথে অদলবদল; প্রতিটি ক্রম সমান সম্ভাব্য।',
      '<code>slice(0, nTr)</code>, <code>slice(nTr, nTr + nVa)</code>, <code>slice(nTr + nVa)</code>: তিনটি অ-অধিক্রমণ (non-overlapping) অংশ।',
    ]),
    why: p('test ফাংশনে যাচাই করা হয়েছে যে তিন ভাগ মিলে ঠিক মূল ডেটা, কোনো উদাহরণ দুবার নেই—এটাই split-এর সবচেয়ে গুরুত্বপূর্ণ বৈশিষ্ট্য। seed ভিন্ন করে দেখানো হয়েছে ছোট test সেট কত অস্থির।'),
    remember: ['train: শেখা; validation: বাছাই; test: শেষে একবার', 'shuffle + seed = পুনরুৎপাদনযোগ্য ভাগ', 'test দেখে সিদ্ধান্ত নিলে test আর নিরপেক্ষ নয়', 'সময়-নির্ভর কাজে সময় অনুযায়ী ভাগ'],
    skip: ['k-fold cross-validation (ছোট ডেটায় দরকারি, সূত্রে আছে)', 'stratified split'],
    experiment: p('data-কে ১০০০ উদাহরণে বাড়ান (৪০০ অভিযোগ)। এখন seed ১–৫-এ test-এ অভিযোগের অনুপাত কতটা ওঠানামা করে? ১০-উদাহরণের সাথে তুলনা করুন।'),
    mistakes: ['test সেট দেখে hyperparameter বাছাই', 'shuffle না করে সাজানো ডেটা ভাগ', 'seed না রাখা—পরে ফল পুনরুৎপাদন অসম্ভব', 'খুব ছোট test সেটের একটি সংখ্যাকে চূড়ান্ত সত্য ধরা'],
    quiz: [
      { q: 'learning rate বাছাই কোন সেট দেখে করা উচিত?', a: { a: 'Training', b: 'Validation', c: 'Test' }, ok: 'b', why: 'validation বাছাইয়ের জন্য; test শুধু চূড়ান্ত মূল্যায়নে, যাতে নিরপেক্ষ থাকে।' },
      { q: 'একই seed দিয়ে shuffle দুবার চালালে কী হয়?', a: { a: 'দুবার ভিন্ন ক্রম', b: 'হুবহু একই ক্রম', c: 'এরর' }, ok: 'b', why: 'ছদ্ম-দৈব জেনারেটর seed দিয়ে নির্ধারিত—এটাই পুনরুৎপাদনযোগ্যতার ভিত্তি।' },
      { q: 'আগামী মাসের বিক্রি অনুমানের মডেলে ডেটা কীভাবে ভাগ করবেন?', a: { a: 'এলোমেলো shuffle করে', b: 'পুরনো সময় train-এ, নতুন সময় test-এ', c: 'শুধু শেষ সপ্তাহ train-এ' }, ok: 'b', why: 'এলোমেলো ভাগে ভবিষ্যতের তথ্য training-এ ঢুকে যায়; বাস্তব ব্যবহারের মতো অতীত দিয়ে শিখে ভবিষ্যতে পরীক্ষা করতে হয়।' },
    ],
    recap: ['তিন ভাগ, তিন ভূমিকা', 'seed দিয়ে পুনরুৎপাদন', 'test-এর পবিত্রতা আপনার দায়িত্ব'],
    nextNote: 'ভাগ করা ডেটায় প্রথম মডেল—regression ও loss:',
    synthetic: true,
    sources: [SRC.googleMLCC, SRC.sklearnCV, ['Wikipedia — Fisher–Yates shuffle', 'https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle']],
  },
  {
    id: 'les-04-03-regression-loss',
    slug: 'regression-loss',
    title: 'Regression, Loss ও Optimization',
    minutes: 40,
    prereqs: ['les-04-02-train-val-test'],
    summary: 'noisy সিন্থেটিক ডেটায় linear regression; MSE বনাম MAE; outlier-এর প্রভাব; train ও validation loss আলাদা মাপা।',
    overview: p('Regression মানে একটি সংখ্যা অনুমান (যেমন ডেলিভারির দিন বা দাম)। এই পাঠে noise-যুক্ত সিন্থেটিক ডেটায় অধ্যায় ৩-এর gradient descent দিয়ে linear regression train করব, train ও validation loss আলাদা মাপব, এবং দুটি loss তুলনা করব: MSE (বর্গ-ভুলের গড়) বড় ভুলকে বেশি শাস্তি দেয়, MAE (পরম ভুলের গড়) outlier-এ কম বিচলিত হয়। একটি ভুল-লেখা outlier দুই loss-এ কী করে তা সংখ্যায় দেখব।'),
    objectives: ['noisy ডেটায় gradient descent দিয়ে linear regression train করতে পারবেন', 'MSE ও MAE হিসাব করে তাদের পার্থক্য ব্যাখ্যা করতে পারবেন', 'outlier-এর প্রভাব শনাক্ত করে loss বাছাইয়ের যুক্তি দিতে পারবেন'],
    problem: p('কুরিয়ারের ২০টি পার্সেলের দূরত্ব (কিমি) ও আসল সময় (ঘণ্টা) আছে—সময়গুলো পুরোপুরি রেখায় নয়, যানজট ইত্যাদির কারণে ওঠানামা করে। একটি রেকর্ডে কেউ ভুল করে ২০০ ঘণ্টা লিখেছে। মডেল কি ঐ একটি ভুলের জন্য সবার অনুমান নষ্ট করবে?'),
    explain:
      p(`${term('রিগ্রেশন', 'regression')}: আউটপুট একটি অবিচ্ছিন্ন সংখ্যা। Linear regression: ŷ = wx + b।`) +
      p(`${term('লস ফাংশন', 'loss function')}: অনুমান কত খারাপ তার একটি সংখ্যা। ${term('অপটিমাইজেশন', 'optimization')}: loss কমানোর জন্য parameter খোঁজা (এখানে gradient descent)।`) +
      table(['Loss', 'সূত্র', 'বৈশিষ্ট্য'], [
        ['MSE', '(১/N) Σ (ŷ − y)²', 'বড় ভুল বর্গ হয়ে অনেক বড়—outlier প্রভাব বেশি; মসৃণ gradient'],
        ['MAE', '(১/N) Σ |ŷ − y|', 'সব ভুল সমান হারে—outlier-এ কম প্রভাব; ০-তে gradient অসংজ্ঞায়িত'],
      ], 'দুই প্রচলিত regression loss') +
      p('উদাহরণ: ভুল [১, ১, ১০]। MSE = (১ + ১ + ১০০)/৩ = ৩৪; MAE = (১ + ১ + ১০)/৩ = ৪। একটি বড় ভুল MSE-কে প্রায় পুরোটাই নিয়ন্ত্রণ করছে।') +
      p('<strong>train বনাম validation loss:</strong> training loss দেখায় মডেল training ডেটায় কতটা মিলেছে; validation loss দেখায় নতুন ডেটায় কতটা। দুটোই রিপোর্ট করুন।'),
    analogy: {
      text: 'MSE হলো এমন শিক্ষক যিনি বড় ভুলে অনেক বেশি নম্বর কাটেন; MAE হলো যিনি প্রতিটি ভুলে সমান হারে কাটেন।',
      breaks: 'শিক্ষক জানেন কোনটি টাইপো আর কোনটি আসল ভুল; loss function জানে না—ভুল-লেখা ২০০ ঘণ্টাকেও আসল ধরে নেয়। তাই loss বাছাইয়ের আগে ডেটা অডিট লাগে।',
    },
    worked:
      p('তিনটি বিন্দু: (১, ২), (২, ৩), (৩, ১০)—শেষটি outlier। মডেল ŷ = x + ১।') +
      ol([
        'অনুমান [২, ৩, ৪]; ভুল [০, ০, −৬]।',
        'MSE = (০ + ০ + ৩৬)/৩ = ১২।',
        'MAE = (০ + ০ + ৬)/৩ = ২।',
        'MSE কমাতে মডেল রেখাটিকে outlier-এর দিকে টানবে; MAE অনেক কম টানবে।',
      ]),
    activity: note('কোডে seed-যুক্ত noise দিয়ে ডেটা তৈরি, train/val ভাগ, MSE দিয়ে training, তারপর একটি outlier যোগ করে আবার train—w কতটা সরে তা দেখা।'),
    code: [
      {
        label: 'noisy linear regression ও outlier',
        starter: RNG + String.raw`
// সিন্থেটিক: সময় = 0.5 * দূরত্ব/10 + 1 + noise   (দূরত্ব 10-কিমি এককে)
const rand = makeRng(7);
const noise = () => (rand() - 0.5) * 0.8;          // −0.4 থেকে +0.4
const data = Array.from({ length: 20 }, (_, i) => {
  const x = 1 + (i % 10);                            // 1..10
  return { x, y: 0.5 * x + 1 + noise() };
});
const train = data.slice(0, 15), val = data.slice(15);

const mse = (w, b, d) => d.reduce((s, p) => s + (w * p.x + b - p.y) ** 2, 0) / d.length;
const mae = (w, b, d) => d.reduce((s, p) => s + Math.abs(w * p.x + b - p.y), 0) / d.length;

function fit(d, lr = 0.02, steps = 3000) {
  let w = 0, b = 0;
  for (let t = 0; t < steps; t++) {
    let dw = 0, db = 0;
    for (const p of d) { const e = w * p.x + b - p.y; dw += 2 * e * p.x / d.length; db += 2 * e / d.length; }
    w -= lr * dw; b -= lr * db;
  }
  return { w, b };
}
const r3 = (x) => Math.round(x * 1000) / 1000;

const m1 = fit(train);
console.log("পরিষ্কার ডেটা: w =", r3(m1.w), "b =", r3(m1.b));
console.log("  train MSE =", r3(mse(m1.w, m1.b, train)), " val MSE =", r3(mse(m1.w, m1.b, val)), " val MAE =", r3(mae(m1.w, m1.b, val)));

const dirty = train.concat([{ x: 3, y: 20 }]);     // ভুল-লেখা রেকর্ড
const m2 = fit(dirty);
console.log("outlier সহ: w =", r3(m2.w), "b =", r3(m2.b));
console.log("  val MSE =", r3(mse(m2.w, m2.b, val)), " (আগে " + r3(mse(m1.w, m1.b, val)) + ")");
`,
        expect: ['পরিষ্কার ডেটা: w = 0.', 'outlier সহ: w =', 'val MSE ='],
        hints: ['আসল (সিন্থেটিক) সম্পর্ক w = 0.5, b = 1—প্রথম মডেল কতটা কাছে?', 'একটি outlier b-কে কতটা বাড়াল? validation-এ ফল কী হলো?', 'outlier-টি অডিট (আগের পাঠ) ধরতে পারত কি? কোন নিয়মে?'],
        test: '__close(m1.w,0.5,0.1,"w near truth"); __close(m1.b,1,0.4,"b near truth"); __assert(mse(m2.w,m2.b,val)>mse(m1.w,m1.b,val),"outlier hurts val"); __close(mae(1,1,[{x:1,y:2},{x:2,y:3},{x:3,y:10}]),2,1e-12,"mae worked"); __close(mse(1,1,[{x:1,y:2},{x:2,y:3},{x:3,y:10}]),12,1e-12,"mse worked");',
      },
    ],
    line: ul([
      '<code>noise()</code>: seed-যুক্ত জেনারেটর থেকে −০.৪ থেকে +০.৪—বাস্তব ওঠানামার সিমুলেশন। একই seed-এ সবসময় একই ডেটা।',
      '<code>fit</code>: অধ্যায় ৩-এর lossAndGrad-এর মতোই, শুধু object-এর array থেকে পড়ে।',
      '<code>train.concat([...])</code>: নতুন array; আসল train অক্ষত।',
      'দুই মডেলের validation MSE তুলনা করে outlier-এর বাস্তব ক্ষতি মাপা হয়েছে—শুধু training-এ নয়।',
    ]),
    why: p('ডেটা সিন্থেটিক ও জানা সূত্র থেকে তৈরি, তাই শেখা w, b আসলের কতটা কাছে তা যাচাই করা যায়—বাস্তবে “আসল সূত্র” কখনো জানা থাকে না। validation loss আলাদা রাখা হয়েছে যাতে outlier-এর প্রভাব নতুন ডেটায় দেখা যায়।'),
    remember: ['regression = সংখ্যা অনুমান', 'MSE বড় ভুলে কঠোর; MAE সহনশীল', 'train ও validation loss দুটোই রিপোর্ট', 'outlier-এর আগে ডেটা অডিট'],
    skip: ['closed-form (normal equation) সমাধান', 'Huber loss', 'R² স্কোর'],
    experiment: p('fit-কে MAE-র gradient দিয়ে চালান: dw += sign(e) × x / N, db += sign(e) / N (<code>Math.sign</code>)। outlier সহ ডেটায় w, b কতটা সরে? MSE-র সাথে তুলনা করুন।'),
    mistakes: ['শুধু training loss রিপোর্ট করা', 'outlier-এর কারণ না খুঁজে মুছে ফেলা (কখনো এটি আসল ঘটনা)', 'loss-এর একক ভুলে যাওয়া (MSE-র একক বর্গঘণ্টা)', 'synthetic ডেটার ফলকে বাস্তব কুরিয়ারের ফল বলা'],
    quiz: [
      { q: 'ভুল [২, −২, ০]-এর MSE কত?', a: { a: '০', b: '৮/৩ ≈ ২.৬৭', c: '৪/৩' }, ok: 'b', why: '(৪ + ৪ + ০)/৩ = ৮/৩। চিহ্ন বর্গে মুছে যায়, তাই ধনাত্মক-ঋণাত্মক ভুল কাটাকাটি হয় না।' },
      { q: 'ডেটায় কিছু বিশাল ভুল-লেখা মান আছে যা সরানো যাচ্ছে না। কোন loss কম প্রভাবিত হবে?', a: { a: 'MSE', b: 'MAE', c: 'দুটোই সমান' }, ok: 'b', why: 'MAE ভুলকে রৈখিকভাবে গোনে; MSE বর্গ করে, তাই বড় ভুল অনেক বেশি প্রভাব ফেলে।' },
      { q: 'training MSE ০.১০ ও validation MSE ০.১২। এর সবচেয়ে যুক্তিসঙ্গত ব্যাখ্যা?', a: { a: 'মডেল নতুন ডেটায় প্রায় একই রকম ভালো—বড় overfitting-এর চিহ্ন নেই', b: 'মডেল ব্যর্থ', c: 'validation সেট ভুল' }, ok: 'a', why: 'সামান্য বেশি validation loss স্বাভাবিক। বড় ফাঁক হলে overfitting সন্দেহ করতাম (পরের পাঠ)।' },
    ],
    recap: ['loss বাছাই একটি নকশার সিদ্ধান্ত', 'validation দিয়ে নতুন ডেটায় আচরণ মাপা', 'synthetic ডেটায় সত্য জানা থাকে—বাস্তবে নয়'],
    nextNote: 'সংখ্যা নয়, বিভাগ অনুমান—classification:',
    synthetic: true,
    sources: [SRC.googleMLCC, SRC.sklearnEval, SRC.d2l],
  },
  {
    id: 'les-04-04-classification-logistic',
    slug: 'classification-logistic',
    title: 'Classification, Sigmoid ও Cross-Entropy',
    minutes: 45,
    prereqs: ['les-04-03-regression-loss', 'les-03-06-logs-derivatives'],
    summary: 'sigmoid দিয়ে স্কোরকে ০–১ সম্ভাব্যতায়; logistic regression; binary cross-entropy; decision threshold; gradient = (p − y)x।',
    overview: p('Classification মানে বিভাগ অনুমান—যেমন একটি মেসেজ অভিযোগ কি না। Logistic regression প্রথমে weighted sum z = w · x + b হিসাব করে, তারপর sigmoid function σ(z) = ১/(১ + e⁻ᶻ) দিয়ে তাকে ০ থেকে ১-এর মধ্যে আনে। Loss হিসেবে binary cross-entropy ব্যবহার হয়: সঠিক উত্তরে মডেল যত কম সম্ভাব্যতা দেয়, শাস্তি তত বেশি (অধ্যায় ৩-এর −log p)। এই পাঠে দুটি feature-এর একটি ছোট ডেটায় logistic regression train করব, threshold বদলালে সিদ্ধান্ত কীভাবে বদলায় দেখব, এবং gradient-এর সুন্দর রূপ (p − y)x যাচাই করব।'),
    objectives: ['sigmoid হিসাব করে তার পরিসর ও আকৃতি ব্যাখ্যা করতে পারবেন', 'binary cross-entropy হিসাব করে কেন আত্মবিশ্বাসী ভুলে বড় শাস্তি তা বলতে পারবেন', 'logistic regression train করে threshold দিয়ে সিদ্ধান্ত নিতে পারবেন'],
    problem: p('মেসেজের দুটি feature: কতগুলো “নেতিবাচক শব্দ” (ভাঙা, দেরি, খারাপ) আর কতগুলো “!” চিহ্ন। লক্ষ্য: অভিযোগ (১) নাকি অন্য (০)। Linear regression দিলে আউটপুট ২.৭ বা −০.৪ আসতে পারে—এগুলো কী অর্থ? আমাদের চাই ০ থেকে ১-এর একটি সম্ভাব্যতা-সদৃশ স্কোর, আর একটি সিদ্ধান্তের নিয়ম।'),
    explain:
      p(`${term('সিগময়েড', 'sigmoid')}: σ(z) = ১ / (১ + e⁻ᶻ)। যেকোনো সংখ্যাকে (০, ১)-এ আনে। σ(০) = ০.৫; z বড় ধনাত্মক → ১-এর কাছে; বড় ঋণাত্মক → ০-এর কাছে।`) +
      table(['z', '−৪', '−১', '০', '১', '৪'], [['σ(z)', '০.০১৮', '০.২৬৯', '০.৫', '০.৭৩১', '০.৯৮২']], 'sigmoid-এর কয়েকটি মান') +
      p(`${term('লজিস্টিক রিগ্রেশন', 'logistic regression')}: p = σ(w · x + b)। p-কে “অভিযোগ হওয়ার মডেল-স্কোর” পড়ুন।`) +
      p(`${term('বাইনারি ক্রস-এনট্রপি', 'binary cross-entropy')}: L = −[y log p + (১ − y) log(১ − p)]। y = ১ হলে L = −log p; y = ০ হলে L = −log(১ − p)। সঠিক উত্তরে কম সম্ভাব্যতা দিলে L বিশাল।`) +
      table(['y', 'p', 'L'], [
        ['১', '০.৯', '০.১০৫'],
        ['১', '০.৫', '০.৬৯৩'],
        ['১', '০.০১', '৪.৬০৫ (আত্মবিশ্বাসী ভুল)'],
      ]) +
      p('<strong>Gradient:</strong> chain rule দিয়ে হিসাব করলে (sigmoid ও log-এর derivative কাটাকাটি হয়ে) ∂L/∂w = (p − y)x, ∂L/∂b = p − y। খুব সরল—আর কোডে সংখ্যাগতভাবে যাচাই করব।') +
      p(`${term('থ্রেশহোল্ড', 'decision threshold')}: p ≥ t হলে “অভিযোগ”। t = ০.৫ ডিফল্ট, কিন্তু ব্যবসার প্রয়োজনে বদলায়: অভিযোগ মিস করা ব্যয়বহুল হলে t কমান।`) +
      warn('p-কে সত্যিকারের সম্ভাব্যতা বলার আগে calibration যাচাই লাগে (যেমন p ≈ ০.৭ পাওয়া মেসেজের প্রায় ৭০% কি সত্যিই অভিযোগ?)। ছোট সিন্থেটিক ডেটায় তা বলা যায় না।'),
    analogy: {
      text: 'sigmoid হলো ভলিউম নব যা যেকোনো ইনপুটকে ০ থেকে সর্বোচ্চের মধ্যে রাখে; threshold হলো “এতটা জোরে হলে দরজা খুলবে” নিয়ম।',
      breaks: 'নবের অবস্থান সরাসরি শব্দ মাপে; sigmoid-এর আউটপুট শুধু training ডেটা ও loss যা শিখিয়েছে তার প্রতিফলন—“০.৯” মানেই ৯০% নিশ্চিত নয়।',
    },
    worked:
      p('w = [১.৫, ০.৮], b = −৩, মেসেজ x = [২, ১] (২টি নেতিবাচক শব্দ, ১টি “!”), y = ১।') +
      ol([
        'z = ১.৫×২ + ০.৮×১ − ৩ = ৩ + ০.৮ − ৩ = ০.৮।',
        'p = σ(০.৮) = ১ / (১ + e⁻⁰·⁸) ≈ ১ / (১ + ০.৪৪৯৩) ≈ ০.৬৯০।',
        'L = −log(০.৬৯০) ≈ ০.৩৭১।',
        'gradient: p − y = −০.৩১০; ∂L/∂w = [−০.৬২০, −০.৩১০], ∂L/∂b = −০.৩১০।',
        'threshold ০.৫ → অভিযোগ ✓। threshold ০.৭ → “অন্য” (মিস)।',
      ]),
    activity: note('কোডে প্রথমে হাতের হিসাব যাচাই, তারপর ১২টি সিন্থেটিক মেসেজে training, শেষে তিনটি threshold-এ সিদ্ধান্ত।'),
    code: [
      {
        label: 'logistic regression ও threshold',
        starter: String.raw`const sigmoid = (z) => 1 / (1 + Math.exp(-z));
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const bce = (p, y) => { const e = 1e-12; return -(y * Math.log(p + e) + (1 - y) * Math.log(1 - p + e)); };
const r3 = (x) => Math.round(x * 1000) / 1000;

// হাতের হিসাব যাচাই
let w = [1.5, 0.8], b = -3;
const p0 = sigmoid(dot(w, [2, 1]) + b);
console.log("worked: p =", r3(p0), "L =", r3(bce(p0, 1)), "dL/dw =", [2, 1].map((x) => r3((p0 - 1) * x)));

// সিন্থেটিক ডেটা: [নেতিবাচক শব্দ, "!" সংখ্যা] → 1 = অভিযোগ
const data = [
  [[0, 0], 0], [[0, 1], 0], [[1, 0], 0], [[0, 2], 0], [[1, 1], 0], [[2, 0], 1],
  [[1, 2], 1], [[2, 1], 1], [[3, 0], 1], [[2, 2], 1], [[3, 2], 1], [[0, 3], 0],
];

w = [0, 0]; b = 0;
const lr = 0.5;
for (let epoch = 0; epoch < 800; epoch++) {
  let gw = [0, 0], gb = 0;
  for (const [x, y] of data) {
    const p = sigmoid(dot(w, x) + b);
    gw = gw.map((g, i) => g + (p - y) * x[i] / data.length);
    gb += (p - y) / data.length;
  }
  w = w.map((wi, i) => wi - lr * gw[i]);
  b -= lr * gb;
}
const meanLoss = data.reduce((s, [x, y]) => s + bce(sigmoid(dot(w, x) + b), y), 0) / data.length;
console.log("শেখা w =", w.map(r3), "b =", r3(b), "গড় loss =", r3(meanLoss));

for (const t of [0.3, 0.5, 0.8]) {
  const preds = data.map(([x]) => (sigmoid(dot(w, x) + b) >= t ? 1 : 0));
  const correct = preds.filter((pr, i) => pr === data[i][1]).length;
  console.log("threshold", t, "→ সঠিক", correct + "/" + data.length, "অভিযোগ বলা হলো", preds.filter((x) => x === 1).length, "টি");
}
`,
        expect: ['worked: p = 0.69 L = 0.371 dL/dw = [-0.62,-0.31]', 'শেখা w =', 'threshold 0.5 → সঠিক'],
        hints: ['sigmoid(0) কত? চালিয়ে দেখুন।', 'bce-তে 1e-12 যোগ করা হয়েছে যাতে log(0) = −Infinity না হয় (numerical stability)।', 'threshold কমালে বেশি মেসেজকে অভিযোগ বলা হয়—কোনটি বেশি ক্ষতিকর: অভিযোগ মিস করা, নাকি সাধারণ প্রশ্নকে অভিযোগ ভাবা?', 'লক্ষ করুন: এখানে “সঠিক” মাপা হয়েছে training ডেটাতেই। ১২/১২ মানে মডেল নতুন মেসেজে নিখুঁত—এমন নয়; পরের দুই পাঠ এর কারণ দেখাবে।'],
        test: '__close(sigmoid(0),0.5,1e-12,"sig0"); __close(p0,0.68997,1e-4,"p0"); var h=1e-5, f=function(ww){return bce(sigmoid(dot(ww,[2,1])-3),1);}; var num=(f([1.5+h,0.8])-f([1.5-h,0.8]))/(2*h); __close(num,(p0-1)*2,1e-5,"grad check"); __assert(meanLoss<0.5,"trained");',
      },
    ],
    line: ul([
      '<code>Math.exp(-z)</code>: e⁻ᶻ। z খুব বড় ঋণাত্মক হলে e⁻ᶻ বিশাল, কিন্তু ১/(১ + বিশাল) → ০, সমস্যা নেই।',
      '<code>bce</code>: ছোট ε যোগ—p ঠিক ০ বা ১ হলেও log(০) এড়ানো।',
      '<code>for (const [x, y] of data)</code>: প্রতিটি উপাদান [feature-array, label]।',
      '<code>(p - y) * x[i]</code>: logistic regression-এর gradient—test-এ সংখ্যাগতভাবে যাচাই করা হয়েছে।',
      'threshold loop: একই মডেল, ভিন্ন সিদ্ধান্ত-নিয়ম, ভিন্ন ফল।',
    ]),
    why: p('হাতের হিসাব (worked) প্রথমে কোডে মেলানো হয়েছে, তারপর training—যাতে training কোডের ভিত্তি যাচাইকৃত থাকে। threshold আলাদা loop-এ রাখা হয়েছে কারণ মডেল শেখা ও সিদ্ধান্ত নেওয়া দুটি আলাদা ধাপ; ব্যবসার প্রয়োজনে দ্বিতীয়টি বদলায়।'),
    remember: ['p = σ(w · x + b)', 'binary cross-entropy = −log(সঠিক উত্তরের সম্ভাব্যতা)', 'gradient = (p − y)x', 'threshold = আলাদা ব্যবসায়িক সিদ্ধান্ত'],
    skip: ['sigmoid gradient-এর পূর্ণ বীজগাণিতিক উৎপত্তি', 'calibration-এর পদ্ধতি', 'বহু-বিভাগ softmax (প্রজেক্ট পাঠে ও অধ্যায় ৫-এ)'],
    experiment: p('data-তে [[০, ৩], ০] সারিটিকে [[০, ৩], ১] করুন (ভুল লেবেল)। আবার train করুন। w-এর দ্বিতীয় মান (“!”-এর weight) কীভাবে বদলায়? একটি ভুল লেবেল মডেলের “বিশ্বাস” কতটা টানে?'),
    mistakes: ['sigmoid আউটপুটকে যাচাই ছাড়াই আসল সম্ভাব্যতা বলা', 'log(০) এড়াতে ε না রাখা', 'threshold সবসময় ০.৫ ধরে নেওয়া', 'classification-এ MSE loss ব্যবহার (চলে, কিন্তু gradient দুর্বল)'],
    quiz: [
      { q: 'σ(০) কত?', a: { a: '০', b: '০.৫', c: '১' }, ok: 'b', why: '১/(১ + e⁰) = ১/(১ + ১) = ০.৫। z = ০ মানে মডেল কোনো দিকে ঝোঁকেনি।' },
      { q: 'y = ১ এবং মডেল p = ০.০১ দিল। binary cross-entropy প্রায় কত?', a: { a: '০.০১', b: '৪.৬', c: '০.৯৯' }, ok: 'b', why: '−log(০.০১) ≈ ৪.৬। আত্মবিশ্বাসী ভুলে loss বিশাল—এটাই cross-entropy-র উদ্দেশ্য।' },
      { q: 'অভিযোগ মিস করা খুব ব্যয়বহুল। threshold কোন দিকে নেবেন?', a: { a: 'বাড়াবেন (যেমন ০.৮)', b: 'কমাবেন (যেমন ০.৩)', c: 'বদলাবেন না' }, ok: 'b', why: 'threshold কমালে কম স্কোরের মেসেজও অভিযোগ ধরা হয়—মিস কমে, তবে ভুল অ্যালার্ম বাড়ে (পরের পাঠে precision/recall)।' },
    ],
    recap: ['sigmoid + cross-entropy = logistic regression', 'gradient (p − y)x সংখ্যাগতভাবে যাচাই', 'threshold-এ ব্যবসায়িক trade-off'],
    nextNote: 'মডেল যদি training ডেটা মুখস্থ করে ফেলে? overfitting:',
    synthetic: true,
    sources: [SRC.googleMLCC, SRC.jurafsky, SRC.d2l],
  },
  {
    id: 'les-04-05-overfitting-regularization',
    slug: 'overfitting-regularization',
    title: 'Underfitting, Overfitting ও Regularization',
    minutes: 40,
    prereqs: ['les-04-04-classification-logistic'],
    summary: 'খুব সরল মডেল (underfit) ও মুখস্থ মডেল (overfit); train-validation ফাঁক; L2 regularization weight ছোট রাখে।',
    overview: p('Underfitting মানে মডেল এত সরল যে training ডেটাতেও প্যাটার্ন ধরতে পারে না; overfitting মানে মডেল training ডেটার noise পর্যন্ত মুখস্থ করে, ফলে নতুন ডেটায় খারাপ করে। চিহ্ন: training error কম কিন্তু validation error অনেক বেশি। এই পাঠে একই noisy ডেটায় তিনটি মডেল—ধ্রুবক, রৈখিক ও “মুখস্থ টেবিল”—তুলনা করব, তারপর L2 regularization (loss-এ λ‖w‖² যোগ) দিয়ে অতিরিক্ত weight-কে শাস্তি দেওয়ার কৌশল দেখব।'),
    objectives: ['train ও validation error দেখে underfitting ও overfitting শনাক্ত করতে পারবেন', 'মুখস্থ (memorization) কেন training-এ নিখুঁত কিন্তু নতুন ডেটায় ব্যর্থ তা দেখাতে পারবেন', 'L2 regularization-এর প্রভাব gradient-এ ও weight-এ ব্যাখ্যা করতে পারবেন'],
    problem: p('একজন সহকর্মী গর্বের সাথে বললেন: “আমার মডেল training ডেটায় ১০০% সঠিক!” মডেলটি আসলে প্রতিটি training মেসেজ ও তার লেবেল একটি টেবিলে রেখে দিয়েছে। নতুন মেসেজে কী হবে?'),
    explain:
      table(['অবস্থা', 'train error', 'validation error', 'অর্থ', 'সাধারণ প্রতিকার'], [
        ['Underfitting', 'বেশি', 'বেশি', 'মডেল খুব সরল', 'আরও ভালো feature, জটিল মডেল, বেশি training'],
        ['ভালো fit', 'কম', 'কম, কাছাকাছি', 'প্যাটার্ন শিখেছে', '—'],
        ['Overfitting', 'খুব কম', 'অনেক বেশি', 'noise মুখস্থ', 'বেশি ডেটা, সরল মডেল, regularization, আগে থামা'],
      ], 'তিন অবস্থা') +
      p(`${term('রেগুলারাইজেশন', 'regularization')}: মডেলকে অতিরিক্ত জটিল হওয়া থেকে আটকানোর কৌশল। ${term('L2', 'L2 / weight decay')}: loss-এ λ × Σ wᵢ² যোগ। gradient-এ যোগ হয় ২λwᵢ, তাই প্রতিটি আপডেটে weight সামান্য শূন্যের দিকে টানা হয়। λ বড় হলে weight ছোট, মডেল সরল—বেশি বড় হলে underfitting।`) +
      p('সাধারণত bias (b)-কে regularize করা হয় না, কারণ এটি শুধু গড় স্তর সরায়, জটিলতা বাড়ায় না।'),
    analogy: {
      text: 'Overfitting হলো ছাত্র যিনি বিগত ১০ বছরের প্রশ্নের উত্তর মুখস্থ করেছেন কিন্তু অধ্যায় বোঝেননি—নতুন প্রশ্নে ব্যর্থ। Regularization হলো শিক্ষকের নিয়ম: “সংক্ষিপ্ত, সাধারণ নীতিতে উত্তর দাও।”',
      breaks: 'ছাত্রকে জিজ্ঞেস করে বোঝা যায় তিনি মুখস্থ করেছেন কিনা; মডেলের ক্ষেত্রে একমাত্র উপায় নতুন ডেটায় পরীক্ষা—ভেতরে তাকিয়ে সাধারণত বলা যায় না।',
    },
    worked:
      p('L2 সহ এক ধাপ: w = ২, ডেটা-gradient = ০.৫, λ = ০.১, η = ০.১।') +
      ol([
        'মোট gradient = ০.৫ + ২ × ০.১ × ২ = ০.৫ + ০.৪ = ০.৯।',
        'নতুন w = ২ − ০.১ × ০.৯ = ১.৯১।',
        'L2 ছাড়া: ২ − ০.১ × ০.৫ = ১.৯৫। regularization w-কে আরও ০.০৪ শূন্যের দিকে টেনেছে।',
      ]),
    activity: note('কোডে noisy সিন্থেটিক ডেটায় তিন মডেলের train/validation MSE। তারপর অনেক অপ্রাসঙ্গিক feature-সহ মডেলে λ = ০ বনাম λ = ০.১।'),
    code: [
      {
        label: 'underfit, overfit ও L2',
        starter: RNG + String.raw`
const rand = makeRng(11);
const point = (x) => ({ x, y: 2 * x + 1 + (rand() - 0.5) * 6 });   // noise ±3
const train = Array.from({ length: 10 }, (_, i) => point(2 * i));            // x = 0,2,…,18
const val = Array.from({ length: 40 }, () => point(Math.floor(rand() * 20))); // x = 0..19
const mse = (f, d) => d.reduce((s, p) => s + (f(p.x) - p.y) ** 2, 0) / d.length;
const r2 = (x) => Math.round(x * 100) / 100;

// ১) ধ্রুবক মডেল (underfit): সবসময় train-এর গড়
const avg = train.reduce((s, p) => s + p.y, 0) / train.length;
const constant = () => avg;

// ২) রৈখিক মডেল (gradient descent)
let w = 0, b = 0;
for (let t = 0; t < 4000; t++) {
  let dw = 0, db = 0;
  for (const p of train) { const e = w * p.x + b - p.y; dw += 2 * e * p.x / train.length; db += 2 * e / train.length; }
  w -= 0.005 * dw; b -= 0.005 * db;
}
const linear = (x) => w * x + b;

// ৩) মুখস্থ টেবিল (overfit): দেখা x-এর শেষ y; অদেখা x-এ 0
const table = {};
for (const p of train) table[p.x] = p.y;
const memorize = (x) => (x in table ? table[x] : 0);

for (const [name, f] of [["ধ্রুবক", constant], ["রৈখিক", linear], ["মুখস্থ", memorize]]) {
  console.log(name.padEnd(7), "train MSE", String(r2(mse(f, train))).padStart(7), "| val MSE", String(r2(mse(f, val))).padStart(7));
}
`,
        expect: ['ধ্রুবক', 'রৈখিক', 'মুখস্থ'],
        hints: ['মুখস্থ মডেলের train MSE কেন প্রায় 0 (বা খুব কম)? একই x দুবার এলে কী হয়?', 'অদেখা x-এ মুখস্থ মডেল 0 বলে—validation-এ এর ফল দেখুন।', 'রৈখিক মডেলের train ও val MSE-র ফাঁক সবচেয়ে কম কেন?'],
        test: '__assert(mse(memorize,train)<mse(linear,train),"memorize best on train"); __assert(mse(memorize,val)>mse(linear,val),"memorize worse on val"); __assert(mse(constant,val)>mse(linear,val),"constant underfits");',
      },
      {
        label: 'L2 regularization: অপ্রাসঙ্গিক feature-এর weight',
        starter: RNG + String.raw`
// 8টি উদাহরণ, 6টি feature; শুধু প্রথমটি আসলে প্রাসঙ্গিক (সিন্থেটিক)
const rand = makeRng(5);
const make = (n) => Array.from({ length: n }, () => {
  const x = Array.from({ length: 6 }, () => rand() * 2 - 1);
  return { x, y: 3 * x[0] + (rand() - 0.5) * 3 };
});
const train = make(8), val = make(200);
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const mse = (w, d) => d.reduce((s, p) => s + (dot(w, p.x) - p.y) ** 2, 0) / d.length;

function fit(lambda) {
  let w = new Array(6).fill(0);
  for (let t = 0; t < 3000; t++) {
    const g = new Array(6).fill(0);
    for (const p of train) { const e = dot(w, p.x) - p.y; for (let i = 0; i < 6; i++) g[i] += 2 * e * p.x[i] / train.length; }
    w = w.map((wi, i) => wi - 0.05 * (g[i] + 2 * lambda * wi));   // L2 টার্ম
  }
  return w;
}
const r2 = (x) => Math.round(x * 100) / 100;
for (const lambda of [0, 0.1, 5]) {
  const w = fit(lambda);
  const junk = w.slice(1).reduce((s, v) => s + Math.abs(v), 0);
  console.log("λ=" + lambda, "w0=" + r2(w[0]), "অপ্রাসঙ্গিক |w| যোগ=" + r2(junk), "train=" + r2(mse(w, train)), "val=" + r2(mse(w, val)));
}
`,
        expect: ['λ=0 ', 'λ=0.1 ', 'λ=5 '],
        hints: ['λ=0-এ অপ্রাসঙ্গিক weight-গুলো কত বড়? ৮টি উদাহরণে ৬টি feature—মুখস্থের সুযোগ অনেক।', 'λ=5-এ w0-ও ছোট হয়ে গেছে—কী সমস্যা হলো? (underfitting)', 'কোন λ-তে validation MSE সবচেয়ে কম?', 'makeRng(5)-এর বদলে 3 বা 13 দিয়ে চালান: কিছু seed-এ λ=0-ও খারাপ করে না। ৮টি উদাহরণে একটি seed-এর ফল সাধারণ নিয়ম প্রমাণ করে না—তাই λ বাছাইয়ে বড় validation সেট বা cross-validation লাগে।'],
        test: 'var w0=fit(0), w1=fit(0.1), w5=fit(5); __assert(mse(w1,val)<mse(w0,val),"L2 helps val here"); var j=function(w){return w.slice(1).reduce(function(s,v){return s+Math.abs(v);},0);}; __assert(j(w1)<j(w0),"L2 shrinks junk"); __assert(Math.abs(w5[0])<Math.abs(w1[0]),"big lambda shrinks signal too");',
      },
    ],
    line: ul([
      '<code>x in table</code>: object-এ ঐ key আছে কিনা।',
      'মুখস্থ মডেল: একই x দুবার এলে শুধু শেষটি থাকে, তাই train MSE ঠিক ০ না-ও হতে পারে—কিন্তু খুব কম।',
      '<code>g[i] + 2 * lambda * wi</code>: ডেটার gradient + L2-এর gradient। এটুকুই regularization-এর কোড।',
      '<code>w.slice(1)</code>: প্রথম weight বাদে বাকিগুলো—অপ্রাসঙ্গিক feature-এর weight।',
    ]),
    why: p('তিনটি মডেল ইচ্ছাকৃতভাবে চরম: একটি কিছুই শেখে না, একটি শুধু মুখস্থ করে, একটি মাঝামাঝি। দ্বিতীয় অনুশীলনে “অল্প উদাহরণ, অনেক feature” পরিস্থিতি বানানো হয়েছে কারণ overfitting সবচেয়ে বেশি সেখানেই—আর বাস্তব টেক্সট ডেটায় এটি খুব সাধারণ।'),
    remember: ['underfit: দুই error-ই বেশি', 'overfit: train কম, validation বেশি—বড় ফাঁক', 'L2: gradient-এ +২λw', 'λ-ও hyperparameter—validation দিয়ে বাছুন'],
    skip: ['L1 regularization ও sparsity', 'bias-variance-এর গাণিতিক বিশ্লেষণ', 'dropout (অধ্যায় ৫-এর সূত্রে)'],
    experiment: p('দ্বিতীয় অনুশীলনে train-এর আকার ৮ থেকে ৮০ করুন (make(80))। λ = ০-এ অপ্রাসঙ্গিক weight কী হয়? বেশি ডেটা নিজেই কি regularization-এর মতো কাজ করে?'),
    mistakes: ['শুধু training accuracy দেখে মডেল ভালো বলা', 'λ test সেট দেখে বাছাই', 'bias-কেও regularize করা', 'regularization-কে ডেটার মান-সমস্যার বিকল্প ভাবা'],
    quiz: [
      { q: 'train accuracy ৯৯%, validation accuracy ৬০%। কোন অবস্থা?', a: { a: 'Underfitting', b: 'Overfitting', c: 'ভালো fit' }, ok: 'b', why: 'বড় ফাঁক মানে training-এর নির্দিষ্টতা মুখস্থ, সাধারণ প্যাটার্ন নয়।' },
      { q: 'L2-তে w = ১, λ = ০.৫ হলে regularization-এর gradient অংশ কত?', a: { a: '০.৫', b: '১', c: '২' }, ok: 'b', why: 'd(λw²)/dw = ২λw = ২ × ০.৫ × ১ = ১।' },
      { q: 'λ খুব বড় হলে কী ঘটে?', a: { a: 'overfitting বাড়ে', b: 'সব weight শূন্যের কাছে—underfitting', c: 'training দ্রুত হয়, কোনো ক্ষতি নেই' }, ok: 'b', why: 'বড় শাস্তি প্রাসঙ্গিক weight-কেও ছোট করে, তাই মডেল প্যাটার্ন ধরতে পারে না।' },
    ],
    recap: ['train-validation ফাঁক = overfitting সংকেত', 'মুখস্থ ≠ শেখা', 'L2 জটিলতাকে শাস্তি দেয়, λ সাবধানে বাছুন'],
    nextNote: 'accuracy একা কেন বিভ্রান্তিকর—metric-এর পাঠ:',
    synthetic: true,
    sources: [SRC.googleMLCC, SRC.goodfellow, SRC.d2l],
  },
  {
    id: 'les-04-06-metrics',
    slug: 'accuracy-precision-recall-f1',
    title: 'Accuracy, Precision, Recall ও F1',
    minutes: 40,
    prereqs: ['les-04-05-overfitting-regularization'],
    summary: 'confusion matrix (TP, FP, FN, TN); imbalanced ডেটায় accuracy-র ফাঁদ; precision ও recall-এর trade-off; F1; শূন্য-হরের edge case।',
    overview: p('Accuracy (সঠিক অনুমানের অনুপাত) সহজ, কিন্তু বিভ্রান্তিকর হতে পারে: ১০০টি মেসেজের ৫টি অভিযোগ হলে “কখনো অভিযোগ নয়” বলা মডেলও ৯৫% accurate! এই পাঠে confusion matrix (true/false positive/negative) থেকে precision (যাকে অভিযোগ বললাম তার কতগুলো সত্যি), recall (সব অভিযোগের কতগুলো ধরলাম) ও F1 (দুটির harmonic mean) হিসাব করব, threshold বদলালে precision-recall কীভাবে উল্টো দিকে নড়ে দেখব, এবং কোনো positive অনুমান না থাকলে precision-এর শূন্য-হর সমস্যা সামলাব।'),
    objectives: ['confusion matrix থেকে accuracy, precision, recall ও F1 হিসাব করতে পারবেন', 'imbalanced ডেটায় accuracy কেন বিভ্রান্তিকর তা উদাহরণসহ দেখাতে পারবেন', 'কাজের প্রয়োজন অনুযায়ী precision বা recall-কে অগ্রাধিকার দেওয়ার যুক্তি দিতে পারবেন'],
    problem: p('জালিয়াতি-অর্ডার শনাক্তকারী মডেলের রিপোর্ট: “accuracy ৯৮%”। কিন্তু মাস শেষে দেখা গেল ২০টি জালিয়াতির ১৮টিই ধরা পড়েনি। ৯৮% কীভাবে সম্ভব হলো?'),
    explain:
      table(['', 'আসলে positive (অভিযোগ)', 'আসলে negative'], [
        ['মডেল বলল positive', 'TP (সঠিক ধরা)', 'FP (ভুল অ্যালার্ম)'],
        ['মডেল বলল negative', 'FN (মিস)', 'TN (সঠিক ছাড়)'],
      ], 'confusion matrix') +
      table(['Metric', 'সূত্র', 'প্রশ্ন'], [
        ['Accuracy', '(TP + TN) / সব', 'মোট কত শতাংশ ঠিক?'],
        ['Precision', 'TP / (TP + FP)', '“positive” বললে কতবার সত্যি?'],
        ['Recall', 'TP / (TP + FN)', 'আসল positive-এর কতগুলো ধরলাম?'],
        ['F1', '২ × P × R / (P + R)', 'precision ও recall-এর ভারসাম্য'],
      ], 'চার metric') +
      p('<strong>সমস্যার উত্তর:</strong> ১০০০ অর্ডারে ২০টি জালিয়াতি। মডেল ২টি ধরেছে (TP = ২), ১৮টি মিস (FN = ১৮), ভুল অ্যালার্ম ২ (FP = ২), বাকি ৯৭৮ TN। Accuracy = (২ + ৯৭৮)/১০০০ = ৯৮%। কিন্তু recall = ২/২০ = ১০%!') +
      p('<strong>Trade-off:</strong> threshold কমালে বেশি positive বলা হয় → recall বাড়ে, precision সাধারণত কমে। কোনটি গুরুত্বপূর্ণ তা কাজ ঠিক করে: জালিয়াতিতে recall (মিস ব্যয়বহুল), স্প্যাম ফিল্টারে precision (আসল মেইল হারানো ব্যয়বহুল)।') +
      warn('<strong>Edge case:</strong> মডেল কখনো positive না বললে TP + FP = ০, precision-এর হর শূন্য। কিছু লাইব্রেরি ০ ধরে, কিছু সতর্কবার্তা দেয়। রিপোর্টে স্পষ্ট লিখুন “অসংজ্ঞায়িত—কোনো positive অনুমান নেই”।'),
    analogy: {
      text: 'Precision হলো জেলের জালে যা উঠল তার কতটা মাছ (বাকি আবর্জনা); recall হলো পুকুরের সব মাছের কতটা জালে উঠল।',
      breaks: 'জেল পুকুরে কত মাছ আছে আন্দাজ করতে পারেন; বাস্তব সিস্টেমে মিস হওয়া positive (FN) প্রায়ই অজানা থাকে—কেউ সেগুলো লেবেল না করলে recall মাপাই যায় না।',
    },
    worked:
      p('১০টি মেসেজ: আসল [১,১,১,০,০,০,০,০,০,০], অনুমান [১,০,১,১,০,০,০,০,০,০]।') +
      ol([
        'TP = ২ (১ম, ৩য়), FN = ১ (২য়), FP = ১ (৪র্থ), TN = ৬।',
        'Accuracy = ৮/১০ = ০.৮।',
        'Precision = ২/৩ ≈ ০.৬৬৭; Recall = ২/৩ ≈ ০.৬৬৭।',
        'F1 = ২ × ০.৬৬৭ × ০.৬৬৭ / (১.৩৩৩) ≈ ০.৬৬৭।',
        '“সব ০” মডেল: accuracy ০.৭, precision অসংজ্ঞায়িত, recall ০।',
      ]),
    activity: note('কোডে metric ফাংশন, worked উদাহরণ যাচাই, তারপর একটি স্কোর-তালিকায় threshold সরিয়ে precision-recall টেবিল।'),
    code: [
      {
        label: 'confusion matrix, metric ও threshold sweep',
        starter: String.raw`function confusion(actual, pred) {
  const c = { TP: 0, FP: 0, FN: 0, TN: 0 };
  actual.forEach((a, i) => {
    const p = pred[i];
    if (a === 1 && p === 1) c.TP++;
    else if (a === 0 && p === 1) c.FP++;
    else if (a === 1 && p === 0) c.FN++;
    else c.TN++;
  });
  return c;
}
const safeDiv = (a, b) => (b === 0 ? null : a / b);
function metrics(c) {
  const precision = safeDiv(c.TP, c.TP + c.FP);
  const recall = safeDiv(c.TP, c.TP + c.FN);
  const f1 = precision === null || recall === null || precision + recall === 0 ? null : (2 * precision * recall) / (precision + recall);
  return { accuracy: (c.TP + c.TN) / (c.TP + c.FP + c.FN + c.TN), precision, recall, f1 };
}
const r3 = (x) => (x === null ? "অসংজ্ঞায়িত" : Math.round(x * 1000) / 1000);
const show = (m) => "acc=" + r3(m.accuracy) + " P=" + r3(m.precision) + " R=" + r3(m.recall) + " F1=" + r3(m.f1);

const actual = [1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
console.log("worked:", JSON.stringify(confusion(actual, [1, 0, 1, 1, 0, 0, 0, 0, 0, 0])), show(metrics(confusion(actual, [1, 0, 1, 1, 0, 0, 0, 0, 0, 0]))));
console.log("সব 0  :", show(metrics(confusion(actual, actual.map(() => 0)))));

// মডেল-স্কোর (সিন্থেটিক) ও threshold sweep
const scores = [0.95, 0.40, 0.80, 0.70, 0.30, 0.20, 0.55, 0.10, 0.05, 0.15];
for (const t of [0.9, 0.6, 0.5, 0.35]) {
  const pred = scores.map((s) => (s >= t ? 1 : 0));
  console.log("t=" + t, show(metrics(confusion(actual, pred))));
}
`,
        expect: ['worked: {"TP":2,"FP":1,"FN":1,"TN":6} acc=0.8 P=0.667 R=0.667 F1=0.667', 'সব 0  : acc=0.7 P=অসংজ্ঞায়িত R=0 F1=অসংজ্ঞায়িত', 't=0.9 acc=0.8 P=1 R=0.333', 't=0.35 '],
        hints: ['threshold কমার সাথে R কীভাবে বদলায়? P?', 'কোন threshold-এ F1 সবচেয়ে বেশি?', 'safeDiv না থাকলে “সব 0” লাইনে precision কী আসত? (0/0 = NaN)'],
        test: 'var m=metrics(confusion(actual,[1,0,1,1,0,0,0,0,0,0])); __close(m.precision,2/3,1e-12,"P"); __close(m.recall,2/3,1e-12,"R"); __close(m.f1,2/3,1e-12,"F1"); var big=metrics({TP:2,FN:18,FP:2,TN:978}); __close(big.accuracy,0.98,1e-12,"fraud acc"); __close(big.recall,0.1,1e-12,"fraud recall");',
      },
    ],
    line: ul([
      '<code>c.TP++</code>: এক বাড়ানো।',
      '<code>safeDiv</code>: হর ০ হলে null—“অসংজ্ঞায়িত”-কে ০ বা NaN থেকে আলাদা রাখা।',
      'F1-এর শর্তে precision + recall = ০ যাচাইও আছে, যাতে ০/০ না হয়।',
      'threshold sweep: একই স্কোর, ভিন্ন সিদ্ধান্ত—recall বাড়ে, precision বদলায়।',
    ]),
    why: p('test-এ সমস্যার জালিয়াতি উদাহরণের সংখ্যাগুলোও যাচাই করা হয়েছে, যাতে “৯৮% accuracy কিন্তু ১০% recall” দাবিটি কোডে প্রমাণিত থাকে। অসংজ্ঞায়িত মানকে আলাদা রাখা হয়েছে কারণ রিপোর্টে ০ দেখালে মনে হবে মডেল সব ভুল করেছে, যা সত্য নয়—সে কিছুই বলেনি।'),
    remember: ['confusion matrix সব metric-এর উৎস', 'imbalanced ডেটায় accuracy বিভ্রান্তিকর', 'precision: বললে কতটা সত্যি; recall: কতটা ধরলাম', 'অসংজ্ঞায়িত মান স্পষ্টভাবে দেখান'],
    skip: ['ROC ও AUC (সূত্রে আছে)', 'macro/micro averaging (প্রজেক্টে সংক্ষেপে)', 'Fβ score'],
    experiment: p('actual-এ positive-এর সংখ্যা ৩ থেকে ১ করুন (শুধু প্রথমটি ১)। “সব ০” মডেলের accuracy এখন কত? এই সংখ্যা দেখে কেউ মডেলকে কতটা ভালো ভাবতে পারেন?'),
    mistakes: ['imbalanced ডেটায় শুধু accuracy রিপোর্ট', 'precision ও recall-এর সংজ্ঞা উল্টানো', 'অসংজ্ঞায়িত metric-কে ০ লেখা', 'test সেট দেখে threshold বাছাই'],
    quiz: [
      { q: 'TP = ৮, FP = ২, FN = ৮। precision কত?', a: { a: '০.৮', b: '০.৫', c: '০.৬৭' }, ok: 'a', why: 'Precision = TP/(TP + FP) = ৮/১০ = ০.৮। Recall হতো ৮/১৬ = ০.৫।' },
      { q: 'ক্যান্সার স্ক্রিনিং-এর প্রথম ধাপে কোন metric বেশি গুরুত্বপূর্ণ?', a: { a: 'Precision', b: 'Recall', c: 'Accuracy' }, ok: 'b', why: 'রোগ মিস করা (FN) সবচেয়ে ব্যয়বহুল; পরের ধাপে বিস্তারিত পরীক্ষা ভুল অ্যালার্ম ছেঁকে নেয়।' },
      { q: 'মডেল কখনো positive বলে না। precision কী?', a: { a: '০', b: '১', c: 'অসংজ্ঞায়িত (হর ০)' }, ok: 'c', why: 'TP + FP = ০, তাই ভাগ সংজ্ঞায়িত নয়। ০ বা ১ লিখলে বিভ্রান্তি তৈরি হয়।' },
    ],
    recap: ['একটি সংখ্যা দিয়ে মডেল বিচার নয়', 'কাজের ঝুঁকি অনুযায়ী metric বাছাই', 'edge case সৎভাবে রিপোর্ট'],
    nextNote: 'মূল্যায়ন মিথ্যা সুন্দর হওয়ার সবচেয়ে চতুর কারণ—data leakage:',
    synthetic: true,
    sources: [SRC.sklearnEval, SRC.googleMLCC],
  },
  {
    id: 'les-04-07-data-leakage',
    slug: 'data-leakage',
    title: 'Data Leakage ও বিভ্রান্তিকর মূল্যায়ন',
    minutes: 35,
    prereqs: ['les-04-06-metrics'],
    summary: 'label-এর ছদ্মবেশী feature, train-test ডুপ্লিকেট, ভবিষ্যতের তথ্য, পুরো ডেটায় preprocessing; leakage ধরার চেকলিস্ট।',
    overview: p('Data leakage ঘটে যখন training বা মূল্যায়নে এমন তথ্য ঢোকে যা বাস্তব ব্যবহারের সময় পাওয়া যাবে না—ফলে মূল্যায়ন অবাস্তব রকম ভালো দেখায়। এই পাঠে চার ধরনের leakage দেখব: label-এর ছদ্মবেশী feature (যেমন “refund_issued” দিয়ে “ফেরত আসবে কি না” অনুমান), train-test-এ প্রায়-ডুপ্লিকেট মেসেজ, ভবিষ্যতের তথ্য, এবং পুরো ডেটায় preprocessing। একটি কোড-পরীক্ষায় leakage-যুক্ত feature কীভাবে “১০০% accuracy” দেয় তা নিজে দেখব, এবং leakage ধরার একটি চেকলিস্ট বানাব।'),
    objectives: ['চার ধরনের data leakage উদাহরণসহ চিনতে পারবেন', 'normalize করে train-test ডুপ্লিকেট খুঁজে পেতে পারবেন', 'অবাস্তব ভালো ফল দেখলে leakage-এর চেকলিস্ট প্রয়োগ করতে পারবেন'],
    problem: p('“ফেরত আসবে কি না” মডেলের validation accuracy ১০০%! উৎসবের আগে একজন feature তালিকা খুললেন: price, weight, district, … আর <code>refund_issued</code>। এই শেষ কলামটি কখন পূরণ হয়?'),
    explain:
      table(['ধরন', 'উদাহরণ', 'কেন সমস্যা', 'প্রতিরোধ'], [
        ['label-এর ছদ্মবেশী feature', 'refund_issued দিয়ে ফেরত অনুমান', 'ফেরতের পরেই এই মান জানা যায়', 'প্রতিটি feature-এর জন্য প্রশ্ন: “অনুমানের মুহূর্তে কি এটি জানা?”'],
        ['train-test ডুপ্লিকেট', '“ডেলিভারি কবে?” ও “ডেলিভারি কবে??”', 'test-এ “দেখা” উদাহরণ', 'normalize করে ডুপ্লিকেট সরিয়ে তারপর ভাগ'],
        ['ভবিষ্যতের তথ্য', 'এলোমেলো ভাগে আগামী মাসের ডেটা training-এ', 'বাস্তবে ভবিষ্যৎ জানা থাকে না', 'সময়-ভিত্তিক ভাগ'],
        ['পুরো ডেটায় preprocessing', 'সব ডেটার গড় দিয়ে scaling', 'test-এর পরিসংখ্যান training-এ', 'শুধু train থেকে fit, তারপর প্রয়োগ'],
      ], 'চার ধরনের leakage') +
      p('<strong>সতর্কসংকেত:</strong> অবাস্তব ভালো ফল, একটি feature-এর অস্বাভাবিক বড় weight, বাস্তব ব্যবহারে হঠাৎ পতন।') +
      p('<strong>সমস্যার উত্তর:</strong> refund_issued পূরণ হয় ফেরত প্রক্রিয়া শুরু হওয়ার পর—অর্থাৎ label-এর পরে। অর্ডারের সময় এই মান সবসময় ০, তাই বাস্তবে মডেল অকেজো।'),
    analogy: {
      text: 'Leakage হলো পরীক্ষার হলে উত্তরপত্রের এক কোণ দেখে ফেলা—নম্বর দারুণ, কিন্তু কিছু শেখা হয়নি।',
      breaks: 'ছাত্র জানেন তিনি দেখে ফেলেছেন; মডেল ও প্রকৌশলী প্রায়ই জানেন না—leakage সাধারণত দুর্ঘটনা, ইচ্ছাকৃত নয়। এজন্য সক্রিয়ভাবে খুঁজতে হয়।',
    },
    worked:
      p('ডুপ্লিকেট খোঁজা: train-এ “ডেলিভারি কবে?”, test-এ “ডেলিভারি  কবে??”।') +
      ol([
        'normalize: ছোট হাতের, বিরামচিহ্ন সরানো, স্পেস একটিতে → দুটোই “ডেলিভারি কবে”।',
        'train-এর normalized সেট বানাই।',
        'test-এর প্রতিটি normalized মেসেজ সেটে আছে কি না দেখি → আছে → leakage।',
      ]),
    activity: note('কোডে (১) leakage feature দিয়ে বনাম ছাড়া একটি সরল নিয়মের accuracy, (২) normalized ডুপ্লিকেট শনাক্ত।'),
    code: [
      {
        label: 'leakage দেখা ও ধরা',
        starter: String.raw`// সিন্থেটিক অর্ডার: refund_issued লেবেলের পরে পূরণ হয় (leakage)
const orders = [
  { price: 450, late: 1, refund_issued: 1, returned: 1 },
  { price: 900, late: 0, refund_issued: 0, returned: 0 },
  { price: 300, late: 1, refund_issued: 0, returned: 0 },
  { price: 1200, late: 0, refund_issued: 1, returned: 1 },
  { price: 700, late: 1, refund_issued: 1, returned: 1 },
  { price: 500, late: 0, refund_issued: 0, returned: 0 },
  { price: 650, late: 1, refund_issued: 0, returned: 1 },
  { price: 800, late: 0, refund_issued: 0, returned: 0 },
];
const acc = (rule) => orders.filter((o) => rule(o) === o.returned).length / orders.length;

console.log("leakage feature (refund_issued):", acc((o) => o.refund_issued));
console.log("বৈধ feature (late):", acc((o) => o.late));
// বাস্তবে অর্ডারের সময় refund_issued সবসময় 0:
console.log("ডিপ্লয়মেন্টে leakage নিয়ম:", acc(() => 0));

// train-test প্রায়-ডুপ্লিকেট
const normalize = (s) => s.toLowerCase().replace(/[?!,।.]/g, " ").replace(/\s+/g, " ").trim();
const train = ["ডেলিভারি কবে?", "পণ্য ভাঙা এসেছে", "দাম কত"];
const test = ["ডেলিভারি  কবে??", "রং কয়টা আছে", "দাম কত!"];
const seen = new Set(train.map(normalize));
const leaks = test.filter((t) => seen.has(normalize(t)));
console.log("test-এ ডুপ্লিকেট:", leaks.length + "/" + test.length, JSON.stringify(leaks));
`,
        expect: ['leakage feature (refund_issued): 0.875', 'বৈধ feature (late): 0.75', 'ডিপ্লয়মেন্টে leakage নিয়ম: 0.5', 'test-এ ডুপ্লিকেট: 2/3'],
        hints: ['refund_issued প্রায় নিখুঁত, কিন্তু ডিপ্লয়মেন্টে মান সবসময় 0—তখন accuracy কত?', 'normalize ছাড়া seen.has(t) চালিয়ে দেখুন কয়টি ডুপ্লিকেট ধরা পড়ে।', '“দাম কত!” আর “দাম কত” একই প্রশ্ন—test-এ রাখলে মূল্যায়ন কী মাপছে?'],
        test: '__assert(acc(function(o){return o.refund_issued;})>acc(function(o){return o.late;}),"leak looks better"); __assert(leaks.length===2,"dupes");',
      },
    ],
    line: ul([
      '<code>acc(rule)</code>: একটি নিয়ম-ফাংশন নিয়ে accuracy দেয়—feature তুলনা সহজ।',
      '<code>acc(() => 0)</code>: ডিপ্লয়মেন্টের বাস্তবতা—leakage feature-এর মান তখন জানা নেই।',
      '<code>new Set(train.map(normalize))</code>: normalized training মেসেজের সেট; খোঁজা দ্রুত।',
    ]),
    why: p('তিনটি সংখ্যা পাশাপাশি দেখানো হয়েছে—leakage-এর “ভালো” ফল, বৈধ feature-এর সৎ ফল, আর ডিপ্লয়মেন্টে leakage নিয়মের আসল ফল—যাতে leakage-এর ক্ষতি সরাসরি তুলনা করা যায়।'),
    remember: ['প্রতিটি feature: “অনুমানের মুহূর্তে কি জানা?”', 'normalize করে ডুপ্লিকেট সরিয়ে তারপর ভাগ', 'অবাস্তব ভালো ফল = তদন্তের সংকেত', 'preprocessing শুধু train থেকে fit'],
    skip: ['target encoding leakage', 'group-ভিত্তিক split (একই গ্রাহকের মেসেজ এক সেটে)'],
    experiment: p('একজন গ্রাহকের ৫টি মেসেজ train-এ আর ২টি test-এ থাকলে কী ধরনের leakage হতে পারে? (ইঙ্গিত: গ্রাহকের লেখার ধরন মুখস্থ।) কীভাবে ভাগ করবেন—এক অনুচ্ছেদে লিখুন।'),
    mistakes: ['feature কখন তৈরি হয় তা না জেনে ব্যবহার', 'প্রায়-ডুপ্লিকেট উপেক্ষা', 'leakage-যুক্ত ফল রিপোর্টে রেখে দেওয়া', 'ডিপ্লয়মেন্টের ডেটা প্রবাহ না দেখে মূল্যায়ন'],
    quiz: [
      { q: '“ডেলিভারি সম্পন্ন হয়েছে কি না” অনুমানে কোন feature leakage?', a: { a: 'অর্ডারের দূরত্ব', b: 'ডেলিভারি-কর্মীর স্বাক্ষরের সময়', c: 'পণ্যের ওজন' }, ok: 'b', why: 'স্বাক্ষরের সময় শুধু ডেলিভারির পরে জানা যায়—label-এর ছদ্মবেশ।' },
      { q: 'scaling-এর গড় পুরো ডেটাসেট থেকে নিলে কী ধরনের leakage?', a: { a: 'preprocessing leakage—test-এর পরিসংখ্যান training-এ ঢোকে', b: 'কোনো leakage নয়', c: 'label leakage' }, ok: 'a', why: 'test ডেটা preprocessing-কে প্রভাবিত করে; সঠিক নিয়ম শুধু train থেকে fit।' },
      { q: 'নতুন মডেলের validation accuracy আগেরটির ৭০% থেকে হঠাৎ ৯৯%। প্রথম পদক্ষেপ?', a: { a: 'সঙ্গে সঙ্গে ডিপ্লয়', b: 'leakage চেকলিস্ট দিয়ে নতুন feature ও ভাগ পরীক্ষা', c: 'test সেট মুছে ফেলা' }, ok: 'b', why: 'বড় অপ্রত্যাশিত লাফ প্রায়ই leakage বা মূল্যায়নের বাগ। উদযাপনের আগে তদন্ত।' },
    ],
    recap: ['leakage = বাস্তবে অনুপলব্ধ তথ্য', 'চার ধরন: ছদ্ম-label, ডুপ্লিকেট, ভবিষ্যৎ, preprocessing', 'সন্দেহজনক ভালো ফল তদন্ত করুন'],
    nextNote: 'অধ্যায় ৪-এর সব কিছু একসাথে—প্রজেক্ট:',
    synthetic: true,
    sources: [['scikit-learn — Common pitfalls: data leakage', 'https://scikit-learn.org/stable/common_pitfalls.html'], ['Kaufman et al. — Leakage in Data Mining (ACM TKDD 2012)', 'https://dl.acm.org/doi/10.1145/2382577.2382579'], SRC.googleMLCC],
  },
  {
    id: 'les-04-08-project-message-classifier',
    slug: 'project-message-classifier',
    title: 'প্রজেক্ট: গ্রাহক-মেসেজ Classifier',
    minutes: 70,
    prereqs: ['les-04-07-data-leakage', 'les-02-07-project-support-bot'],
    summary: 'সিন্থেটিক লেবেল-করা ডেটা; bag-of-words feature; softmax regression (৩ বিভাগ); train/test; per-class precision/recall; কেন খেলনা ফল বাস্তব নির্ভরযোগ্যতা প্রমাণ করে না।',
    overview: p('অধ্যায় ২-এর নিয়মভিত্তিক অ্যাসিস্ট্যান্টকে এবার শেখা মডেলে বদলাব। ৩৬টি স্পষ্টভাবে সিন্থেটিক-লেবেল-করা বাংলা মেসেজ (shipping, returns, status) থেকে bag-of-words feature বানিয়ে softmax regression train করব—sigmoid-এর বহু-বিভাগ রূপ। ডুপ্লিকেট-মুক্ত train/test ভাগ, প্রতিটি বিভাগের precision ও recall, ভুল-শ্রেণিবিভাগের তালিকা এবং অধ্যায় ২-এর ব্যর্থ মেসেজগুলোতে মডেলের আচরণ দেখব। শেষে সৎভাবে লিখব কেন এই খেলনা ফল বাস্তব দোকানের জন্য নির্ভরযোগ্যতা প্রমাণ করে না।'),
    objectives: ['টেক্সট থেকে bag-of-words feature vector বানাতে পারবেন', 'softmax ও বহু-বিভাগ cross-entropy দিয়ে classifier train করতে পারবেন', 'held-out test-এ per-class metric ও ভুলের বিশ্লেষণ রিপোর্ট করতে এবং ফলের সীমা লিখতে পারবেন'],
    problem: p('অধ্যায় ২-এর অ্যাসিস্ট্যান্ট “পার্সেল কবে আসবে” বুঝতে পারেনি কারণ কেউ “পার্সেল” কীওয়ার্ড লেখেনি। নিয়ম হাতে না লিখে লেবেল-করা উদাহরণ থেকে শব্দের weight শিখলে কি ভালো হবে? আর কীভাবে জানব “ভালো” মানে আসলে কতটা ভালো?'),
    explain:
      p(`${term('ব্যাগ-অফ-ওয়ার্ডস', 'bag-of-words')}: একটি শব্দভাণ্ডার (vocabulary) বানাই; প্রতিটি মেসেজ একটি vector যেখানে i-তম সংখ্যা = শব্দভাণ্ডারের i-তম শব্দ মেসেজে কতবার আছে। শব্দের ক্রম হারিয়ে যায়—“ফেরত চাই না” ও “না, ফেরত চাই” একই vector।`) +
      p(`${term('সফটম্যাক্স', 'softmax')}: K বিভাগের স্কোর zₖ থেকে সম্ভাব্যতা: pₖ = e^(zₖ) / Σⱼ e^(zⱼ)। সব pₖ > ০ এবং যোগ = ১ (অধ্যায় ৩-এর distribution)। <strong>সংখ্যাগত স্থিতিশীলতা:</strong> e^(১০০০) overflow করে, তাই আগে সব z থেকে সর্বোচ্চটি বাদ দিই—ফল গাণিতিকভাবে একই।`) +
      p('<strong>Softmax regression:</strong> প্রতিটি বিভাগের নিজস্ব weight vector; z = Wx + b। Loss = −log(সঠিক বিভাগের p)। Gradient: ∂L/∂zₖ = pₖ − yₖ (y one-hot)—logistic-এর (p − y)-এর সাধারণ রূপ।') +
      warn('<strong>সৎ সীমা:</strong> ৩৬টি মেসেজ আমরা নিজেরা লিখেছি, তাই শব্দচয়ন আমাদের মতো। test-এ যত ভালো ফলই আসুক, তা শুধু “এই সিন্থেটিক বিতরণে” প্রযোজ্য। বাস্তব গ্রাহকের বানান, বাংলিশ, লম্বা বাক্য, নতুন বিষয়—এসবে আলাদাভাবে মূল্যায়ন ছাড়া কোনো দাবি করা যাবে না।'),
    analogy: {
      text: 'bag-of-words হলো মেসেজকে শব্দের ঝুড়িতে ঢেলে গুনে দেখা; softmax regression শেখে কোন শব্দ কোন ঝুড়ি-বিভাগের দিকে কতটা ভোট দেয়।',
      breaks: 'মানুষ বাক্যের ক্রম ও “না”-এর অর্থ বোঝে; ঝুড়িতে ঢাললে ক্রম হারিয়ে যায়। আর মডেল শুধু training-এ দেখা শব্দেরই weight জানে—নতুন শব্দ তার কাছে অদৃশ্য।',
    },
    worked:
      p('শব্দভাণ্ডার: [ডেলিভারি, ফেরত, কোথায়]; মেসেজ “ডেলিভারি কোথায়” → x = [১, ০, ১]।') +
      ol([
        'ধরি z = [shipping ১.২, returns −০.৫, status ১.৮]।',
        'স্থিতিশীলতার জন্য সর্বোচ্চ ১.৮ বাদ: [−০.৬, −২.৩, ০]।',
        'e^: [০.৫৪৯, ০.১০০, ১.০০০]; যোগ = ১.৬৪৯।',
        'p ≈ [০.৩৩৩, ০.০৬১, ০.৬০৬] → অনুমান status।',
        'আসল status হলে loss = −log ০.৬০৬ ≈ ০.৫০১; gradient ∂L/∂z = [০.৩৩৩, ০.০৬১, −০.৩৯৪]।',
      ]),
    activity: p('<strong>প্রজেক্ট মানদণ্ড:</strong> (১) test সেটে per-class precision/recall টেবিল, (২) প্রতিটি ভুল শ্রেণিবিভাগের মেসেজ ও কারণ, (৩) অধ্যায় ২-এর ব্যর্থ মেসেজে মডেলের আচরণ, (৪) “এই ফল কী প্রমাণ করে না” শিরোনামে তিন বাক্য।'),
    code: [
      {
        label: 'প্রজেক্ট: softmax মেসেজ classifier (সিন্থেটিক ডেটা)',
        starter: RNG + String.raw`
// ---- সিন্থেটিক লেবেল-করা ডেটা (আমাদের লেখা—বাস্তব গ্রাহকের নয়) ----
const RAW = {
  shipping: ["ডেলিভারি চার্জ কত", "ঢাকার বাইরে ডেলিভারি কত দিন লাগে", "শিপিং খরচ কত", "চট্টগ্রামে ডেলিভারি দেন", "ডেলিভারি কি ফ্রি", "কত দিনে পৌঁছায় পার্সেল", "শিপিং চার্জ জানতে চাই", "সিলেটে পাঠাতে খরচ কত", "ডেলিভারি সময় কত", "কুরিয়ার চার্জ কত", "বাইরে পাঠাতে কত দিন", "ফ্রি ডেলিভারি আছে"],
  returns: ["পণ্য ফেরত দিতে চাই", "ভাঙা পণ্য এসেছে ফেরত হবে", "রিটার্ন নীতি কী", "সাইজ বদল করা যাবে", "ফেরত দিলে টাকা কবে পাব", "ভুল রং এসেছে বদলাতে চাই", "রিটার্ন কীভাবে করব", "পণ্য পছন্দ হয়নি ফেরত", "ফেরতের সময়সীমা কত দিন", "নষ্ট পণ্য বদল চাই", "টাকা ফেরত চাই", "এক্সচেঞ্জ করা যাবে"],
  status: ["আমার অর্ডার কোথায়", "অর্ডার স্ট্যাটাস জানতে চাই", "পার্সেল কোথায় আছে", "অর্ডার কি পাঠানো হয়েছে", "আমার পণ্য এখনও আসেনি", "ট্র্যাকিং নম্বর দিন", "অর্ডার কনফার্ম হয়েছে কি", "কবে পাঠাবেন আমার অর্ডার", "অর্ডার আপডেট দিন", "পার্সেল ট্র্যাক করতে চাই", "আমার অর্ডার এখন কোন অবস্থায়", "পণ্য পাঠিয়েছেন কি"],
};
const LABELS = Object.keys(RAW);
const tokenize = (s) => s.toLowerCase().replace(/[?!,।.]/g, " ").split(/\s+/).filter(Boolean);

// ডুপ্লিকেট-মুক্ত করে seed-যুক্ত ভাগ (প্রতি বিভাগে 9 train, 3 test)
const rand = makeRng(2024);
const train = [], test = [];
for (const label of LABELS) {
  const uniq = [...new Set(RAW[label].map((s) => tokenize(s).join(" ")))];
  const a = uniq.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  a.forEach((text, i) => (i < 9 ? train : test).push({ text, y: LABELS.indexOf(label) }));
}

// ---- শব্দভাণ্ডার শুধু train থেকে (leakage এড়াতে) ----
const vocab = [...new Set(train.flatMap((d) => tokenize(d.text)))];
const index = Object.fromEntries(vocab.map((w, i) => [w, i]));
const featurize = (text) => { const x = new Array(vocab.length).fill(0); for (const t of tokenize(text)) if (t in index) x[index[t]] += 1; return x; };

// ---- softmax regression ----
const K = LABELS.length, V = vocab.length;
let W = Array.from({ length: K }, () => new Array(V).fill(0));
let B = new Array(K).fill(0);
function softmax(z) { const m = Math.max(...z); const e = z.map((v) => Math.exp(v - m)); const s = e.reduce((a, b) => a + b, 0); return e.map((v) => v / s); }
const scores = (x) => W.map((w, k) => w.reduce((s, wi, i) => s + wi * x[i], 0) + B[k]);
const predict = (text) => softmax(scores(featurize(text)));

const lr = 0.5, lambda = 0.001;
const Xtr = train.map((d) => featurize(d.text));
for (let epoch = 0; epoch < 300; epoch++) {
  const gW = Array.from({ length: K }, () => new Array(V).fill(0)), gB = new Array(K).fill(0);
  train.forEach((d, n) => {
    const p = softmax(scores(Xtr[n]));
    for (let k = 0; k < K; k++) {
      const dz = p[k] - (k === d.y ? 1 : 0);
      gB[k] += dz / train.length;
      for (let i = 0; i < V; i++) if (Xtr[n][i]) gW[k][i] += dz * Xtr[n][i] / train.length;
    }
  });
  W = W.map((w, k) => w.map((wi, i) => wi - lr * (gW[k][i] + 2 * lambda * wi)));
  B = B.map((b, k) => b - lr * gB[k]);
}

// ---- মূল্যায়ন: held-out test ----
const argmax = (a) => a.indexOf(Math.max(...a));
const r2 = (x) => (x === null ? "—" : Math.round(x * 100) / 100);
const preds = test.map((d) => argmax(predict(d.text)));
const accTest = preds.filter((p, i) => p === test[i].y).length / test.length;
const accTrain = train.filter((d) => argmax(predict(d.text)) === d.y).length / train.length;
console.log("শব্দভাণ্ডার:", V, "| train acc:", r2(accTrain), "| test acc:", r2(accTest), "(test n=" + test.length + ")");
LABELS.forEach((lab, k) => {
  const tp = preds.filter((p, i) => p === k && test[i].y === k).length;
  const pp = preds.filter((p) => p === k).length;
  const ap = test.filter((d) => d.y === k).length;
  console.log("  " + lab.padEnd(9), "P=" + r2(pp ? tp / pp : null), "R=" + r2(ap ? tp / ap : null));
});
test.forEach((d, i) => { if (preds[i] !== d.y) console.log("  ভুল: «" + d.text + "» আসল=" + LABELS[d.y] + " অনুমান=" + LABELS[preds[i]]); });

// ---- অধ্যায় ২-এর কঠিন মেসেজ ----
for (const msg of ["আমার পার্সেল কবে আসবে", "ফেরত চাই না শুধু ডেলিভারি কবে বলুন", "delivery charge koto"]) {
  const p = predict(msg);
  const unk = tokenize(msg).filter((t) => !(t in index));
  console.log("«" + msg + "» →", LABELS[argmax(p)], "p=" + p.map(r2).join("/"), unk.length ? "| অচেনা শব্দ: " + unk.join(",") : "");
}
`,
        expect: ['শব্দভাণ্ডার:', 'test acc:', '«delivery charge koto» →', 'অচেনা শব্দ: delivery,charge,koto'],
        hints: ['train acc ও test acc-এর ফাঁক কত? মাত্র 9টি test মেসেজে একটি ভুল = 11%।', '“delivery charge koto”-তে সব শব্দ অচেনা—x সব শূন্য, তাই শুধু bias B দিয়ে সিদ্ধান্ত। p প্রায় সমান কেন?', 'RAW-এ কয়েকটি বাংলিশ উদাহরণ যোগ করে আবার চালান—কিন্তু সেগুলো train নাকি test-এ গেল দেখুন।', 'seed 2024 বদলে 1, 2, 3 দিয়ে চালান—test acc কতটা ওঠানামা করে?'],
        test: '__assert(train.length===27 && test.length===9,"split sizes"); var trainSet=new Set(train.map(function(d){return d.text;})); __assert(test.every(function(d){return !trainSet.has(d.text);}),"no train-test duplicates"); var sp=softmax([1000,1001,999]); __close(sp.reduce(function(a,b){return a+b;},0),1,1e-12,"stable softmax sums 1"); __assert(sp.every(function(v){return isFinite(v);}),"no overflow"); __close(softmax([1.2,-0.5,1.8])[2],0.6063,1e-3,"worked softmax"); __assert(accTrain>=0.9,"fits train"); __assert(V===60,"vocab size quoted in note"); __close(accTest,8/9,1e-9,"test acc quoted in note"); __assert(LABELS[argmax(predict("ফেরত চাই না শুধু ডেলিভারি কবে বলুন"))]==="returns","negation failure quoted");',
      },
    ],
    line: ul([
      '<code>[...new Set(...)]</code>: প্রতিটি বিভাগে normalized ডুপ্লিকেট সরানো—ভাগের <em>আগে</em> (পাঠ ৪.৭)।',
      'শব্দভাণ্ডার শুধু train থেকে: test-এর শব্দ দেখে feature বানানো হলে তা leakage।',
      '<code>Object.fromEntries</code>: [শব্দ, index] জোড়া থেকে দ্রুত খোঁজার object।',
      '<code>softmax</code>-এ <code>Math.max(...z)</code> বাদ দেওয়া: overflow রোধ—test-এ [১০০০, ১০০১, ৯৯৯] দিয়ে যাচাই।',
      '<code>dz = p[k] - (k === d.y ? 1 : 0)</code>: softmax + cross-entropy-র gradient।',
      '<code>if (Xtr[n][i])</code>: শূন্য feature বাদ—গণনা কমায়, ফল একই।',
      'শেষ অংশ অচেনা শব্দ দেখায়—মডেল কেন অনিশ্চিত তার স্বচ্ছ ব্যাখ্যা।',
    ]),
    why: p('মূল্যায়নের প্রতিটি ধাপে আগের পাঠের নিয়ম প্রয়োগ হয়েছে: ডুপ্লিকেট আগে সরানো, vocab শুধু train থেকে, seed-যুক্ত ভাগ, per-class metric, ভুলের তালিকা। অধ্যায় ২-এর ব্যর্থ মেসেজ আবার চালানো হয়েছে যাতে নিয়ম বনাম শেখা মডেলের সৎ তুলনা হয়—শেখা মডেল কিছু ক্ষেত্রে ভালো, কিন্তু অচেনা শব্দে সেও অন্ধ।'),
    remember: ['bag-of-words: শব্দ গণনা, ক্রম হারায়', 'softmax: স্থিতিশীলতার জন্য max বাদ', 'gradient = p − y (one-hot)', 'ছোট সিন্থেটিক test = সীমিত দাবি'],
    skip: ['TF-IDF', 'n-gram feature (অধ্যায় ৬)', 'hyperparameter search'],
    experiment: p('“না” শব্দটি RAW-এর কোনো বাক্যে নেই। returns-এ “ফেরত চাই না সাইজ বদল চাই” যোগ করুন। মডেল কি “না”-এর অর্থ শিখবে, নাকি শুধু আরেকটি returns-শব্দ হিসেবে গুনবে? চালিয়ে কঠিন মেসেজ ২-এর p দেখুন।'),
    mistakes: ['test সেটের শব্দ দিয়ে vocab বানানো', '৯টি test মেসেজের accuracy-কে বাস্তব নির্ভরযোগ্যতা বলা', 'softmax-এ max বাদ না দেওয়া', 'অচেনা শব্দের মেসেজেও আত্মবিশ্বাসী উত্তর দিয়ে দেওয়া (fallback লাগবে)'],
    solutionNote: p('seed 2024-এ QuickJS-এ চালানো ফল: শব্দভাণ্ডার ৬০, train accuracy ১, test accuracy ০.৮৯ (৯টির ৮টি)। একমাত্র ভুল «শিপিং চার্জ জানতে চাই» → status, কারণ “জানতে চাই” training-এ শুধু status-এর «অর্ডার স্ট্যাটাস জানতে চাই»-তে ছিল—মডেল বিষয়ের বদলে বাক্যাংশ শিখেছে। «আমার পার্সেল কবে আসবে» → status (p ≈ ০.৮৮), যা অধ্যায় ২-এর নিয়মভিত্তিক সংস্করণের চেয়ে ভালো। «ফেরত চাই না শুধু ডেলিভারি কবে বলুন» → returns: “না” অচেনা, আর bag-of-words-এ “ফেরত চাই” গোনা হয়েছে—অর্থ উল্টে গেছে। «delivery charge koto» → সব শব্দ অচেনা, x শূন্য, সিদ্ধান্ত শুধু bias থেকে, p ≈ ০.২২/০.৪০/০.৩৮—এখানে fallback দেওয়া উচিত। <strong>এই ফল কী প্রমাণ করে না:</strong> (১) বাস্তব গ্রাহকের মেসেজে কার্যকারিতা, (২) বাংলিশ বা ভিন্ন বানানে আচরণ, (৩) নতুন ধরনের প্রশ্নে নিরাপদ আচরণ।'),
    quiz: [
      { q: 'softmax([২, ২, ২]) = ?', a: { a: '[১/৩, ১/৩, ১/৩]', b: '[২, ২, ২]', c: '[০.২, ০.২, ০.২]' }, ok: 'a', why: 'সব স্কোর সমান হলে সব সম্ভাব্যতা সমান, এবং যোগ ১। এটি অনিশ্চয়তার চিহ্ন।' },
      { q: 'শব্দভাণ্ডার পুরো ডেটা (train + test) থেকে বানালে কী সমস্যা?', a: { a: 'কোনো সমস্যা নেই', b: 'test-এর তথ্য feature নকশায় ঢোকে—leakage', c: 'training ধীর হয়' }, ok: 'b', why: 'বাস্তবে নতুন মেসেজের শব্দ আগে জানা থাকে না। test-এর শব্দ দিয়ে vocab বানালে মূল্যায়ন আশাবাদী হয়।' },
      { q: 'সব শব্দ অচেনা এমন মেসেজে bag-of-words মডেল কী দিয়ে সিদ্ধান্ত নেয়?', a: { a: 'শব্দের অর্থ', b: 'শুধু bias (B), কারণ x সব শূন্য', c: 'এলোমেলো' }, ok: 'b', why: 'x = ০ হলে Wx = ০, স্কোর = B। সিদ্ধান্তের ভিত্তি নেই—এমন ক্ষেত্রে fallback উচিত।' },
      { q: '৯টি test মেসেজে ৮টি সঠিক। সবচেয়ে সৎ রিপোর্ট কোনটি?', a: { a: '“মডেল ৮৯% নির্ভরযোগ্য”', b: '“৯টি সিন্থেটিক test মেসেজে ৮টি সঠিক; বাস্তব মেসেজে মূল্যায়ন হয়নি”', c: '“মডেল প্রস্তুত”' }, ok: 'b', why: 'নমুনার আকার ও উৎস উল্লেখ করলে পাঠক ফলের সীমা বুঝতে পারেন। সাধারণীকৃত দাবি এখানে অসমর্থিত।' },
    ],
    recap: ['উদাহরণ থেকে শব্দ-weight শেখা মডেল বানালেন', 'মূল্যায়নে leakage এড়ালেন', 'ফলের সীমা সৎভাবে লিখলেন'],
    nextNote: 'softmax regression হলো এক স্তরের নেটওয়ার্ক। এবার স্তরের পর স্তর—neural network:',
    synthetic: true,
    sources: [SRC.jurafsky, SRC.sklearnEval, ['CS231n — Softmax classifier', 'https://cs231n.github.io/linear-classify/']],
  },
];

export default { chapter, lessons };

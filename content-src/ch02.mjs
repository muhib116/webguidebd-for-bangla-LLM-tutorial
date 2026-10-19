import { p, ul, ol, code, out, note, warn, table, term, SRC } from './lib.mjs';

const chapter = {
  id: 'ch-02-js-fundamentals',
  slug: 'ai-shekhar-javascript',
  title: 'AI শেখার জন্য প্রয়োজনীয় JavaScript',
  order: 2,
  public: true,
  lessonVersion: 2,
  summary: 'Variables থেকে async/await—AI অনুশীলনের জন্য JavaScript ভিত্তি এবং একটি rule-based সাপোর্ট অ্যাসিস্ট্যান্ট প্রজেক্ট।',
  overview: p(
    'এই অধ্যায়ে JavaScript-এর ঠিক ততটুকু শিখব যতটুকু পরের অধ্যায়ের গণিত ও মডেল কোড বুঝতে লাগে: মান ও টাইপ, array ও object, function ও শর্ত, loop ও module, JSON, async/await ও error handling, এবং ব্যবহারিক debugging।',
    'প্রতিটি পাঠে ব্রাউজারেই কোড চালানো যায় (নিরাপদ QuickJS রানার, নেটওয়ার্ক বন্ধ)। শেষ প্রজেক্টে একটি নিয়মভিত্তিক গ্রাহক-সাপোর্ট অ্যাসিস্ট্যান্ট বানিয়ে দেখব কোথায় সে ভুল করে। কোনো পূর্ব প্রোগ্রামিং অভিজ্ঞতা লাগবে না।'
  ),
};

const runnerNote = note('এই রানারে <code>console.log</code> আউটপুট দেখায়। ব্রাউজারের DOM, নেটওয়ার্ক (<code>fetch</code>), টাইমার বা ফাইল এখানে নেই—ইচ্ছাকৃতভাবে। Ctrl/⌘ + Enter চাপলেও Run হয়।');

const lessons = [
  {
    id: 'les-02-01-values-types',
    slug: 'values-types',
    title: 'Variables, Values ও Types',
    minutes: 30,
    prereqs: ['les-01-07-learning-roadmap'],
    summary: 'const/let দিয়ে মান রাখা; number, string, boolean, undefined, null; typeof; স্ট্রিং যোগের বাগ।',
    overview: p('প্রোগ্রাম মান (value) নিয়ে কাজ করে: সংখ্যা, লেখা, সত্য/মিথ্যা। Variable হলো সেই মানের একটি নাম। এই পাঠে const ও let-এর পার্থক্য, JavaScript-এর মৌলিক টাইপ, typeof দিয়ে টাইপ দেখা এবং ইকমার্সের একটি পরিচিত বাগ—“৮০” + “১৫০” = “৮০১৫০”—কেন ঘটে ও কীভাবে ঠিক করতে হয় তা শিখব।'),
    objectives: ['const ও let দিয়ে variable ঘোষণা করতে পারবেন এবং কখন কোনটি তা বলতে পারবেন', 'number, string, boolean, undefined, null চিনতে ও typeof দিয়ে যাচাই করতে পারবেন', 'string-number মিশ্রণের বাগ খুঁজে Number() দিয়ে ঠিক করতে পারবেন'],
    problem: p('চেকআউট পেজে পণ্যের দাম ৮০০ আর ডেলিভারি ১৫০। কোড লিখল মোট = দাম + ডেলিভারি, আর স্ক্রিনে এলো <strong>৮০০১৫০</strong>! গ্রাহক ভয় পেয়ে চলে গেলেন। কম্পিউটার যোগ না করে পাশাপাশি জুড়ে দিল কেন?'),
    explain:
      p(`${term('মান', 'value')} হলো ডেটার একটি টুকরো: <code>800</code>, <code>"শার্ট"</code>, <code>true</code>। ${term('ভেরিয়েবল', 'variable')} হলো সেই মানের নাম, যাতে পরে ব্যবহার করা যায়।`) +
      code(`const price = 800;      // const: পরে আর বদলানো যাবে না
let quantity = 1;       // let: পরে বদলানো যাবে
quantity = 2;           // ঠিক আছে
// price = 900;         // এটি করলে TypeError হবে`) +
      p('নিয়ম: ডিফল্ট হিসেবে <code>const</code> ব্যবহার করুন; শুধু যখন মান সত্যিই বদলাবে তখন <code>let</code>। (পুরনো কোডে <code>var</code> দেখবেন—এর স্কোপ-নিয়ম বিভ্রান্তিকর, তাই এই কোর্সে ব্যবহার করব না।)') +
      table(['টাইপ', 'উদাহরণ', 'কখন'], [
        ['number', '<code>800</code>, <code>0.5</code>, <code>-3</code>', 'দাম, পরিমাণ, স্কোর—পূর্ণ ও দশমিক দুটোই একই টাইপ'],
        ['string', '<code>"শার্ট"</code>, <code>\'ঢাকা\'</code>', 'লেখা; কোটেশনের ভেতরে'],
        ['boolean', '<code>true</code>, <code>false</code>', 'হ্যাঁ/না সিদ্ধান্ত'],
        ['undefined', '<code>undefined</code>', 'মান এখনও দেওয়া হয়নি'],
        ['null', '<code>null</code>', 'ইচ্ছাকৃতভাবে “কোনো মান নেই”'],
      ], 'মৌলিক টাইপ') +
      p(`<code>typeof</code> অপারেটর কোনো মানের টাইপ বলে দেয়: <code>typeof 800</code> → <code>"number"</code>। (একটি পুরনো অদ্ভুততা: <code>typeof null</code> → <code>"object"</code>—এটি ভাষার ঐতিহাসিক বাগ।)`) +
      p('<strong>বাগের কারণ:</strong> <code>+</code> অপারেটরের দুই কাজ। দুই পাশে number থাকলে যোগ করে; যেকোনো এক পাশে string থাকলে জুড়ে দেয় (concatenation)। ফর্ম বা টেক্সট বক্স থেকে আসা মান সাধারণত string হয়—তাই <code>"800" + "150"</code> = <code>"800150"</code>। সমাধান: হিসাবের আগে <code>Number("800")</code> দিয়ে number বানানো।'),
    analogy: {
      text: 'Variable হলো রান্নাঘরের লেবেল-লাগানো কৌটা; ভেতরের জিনিস হলো value; “চাল/লবণ” লেবেলের মতো type বলে দেয় জিনিসটি কী ধরনের।',
      breaks: 'বাস্তবে লবণের কৌটায় চাল রাখলে চোখে পড়ে। JavaScript-এ একই variable-এ আগে number পরে string রাখা যায় (let দিয়ে), আর ভাষা কোনো সতর্কবার্তা দেয় না—ভুল ধরা পড়ে অনেক পরে, যেমন ৮০০১৫০।',
    },
    worked:
      p('ধাপে ধাপে বাগ ধরা ও ঠিক করা:') +
      code(`const priceText = "800";     // ফর্ম থেকে আসা—string
const delivery = 150;         // number
console.log(priceText + delivery);           // "800150"
console.log(typeof priceText, typeof delivery);
const price = Number(priceText);             // রূপান্তর
console.log(price + delivery);               // 950`) +
      out(`800150
string number
950`) +
      ol([
        'প্রথম লাইনে আউটপুট অদ্ভুত—তাই টাইপ দেখি।',
        '<code>typeof</code> জানায় একটি string, একটি number। string থাকায় + জুড়ে দিয়েছে।',
        '<code>Number()</code> দিয়ে রূপান্তর করে আবার যোগ—এবার সঠিক ৯৫০।',
      ]) +
      p('<code>Number("abc")</code> দিলে ফল <code>NaN</code> (Not a Number)—এটিও number টাইপ, কিন্তু অর্থ “অবৈধ সংখ্যা”। <code>Number.isNaN(x)</code> দিয়ে যাচাই করা যায়।'),
    activity: runnerNote,
    code: [
      {
        label: 'চেকআউট মোট ঠিক করুন',
        starter: String.raw`// সমস্যা: মোট ভুল আসছে। টাইপ দেখে ঠিক করুন।
const priceText = "800";   // ফর্ম থেকে এসেছে
const qtyText = "2";       // ফর্ম থেকে এসেছে
const delivery = 150;

const total = priceText * qtyText + delivery;   // এটা কি ঠিক?
const label = "মোট: " + total + " টাকা";
console.log(label);

// এবার এই লাইনটা দেখুন:
const wrong = priceText + delivery;
console.log("ভুল যোগ:", wrong, typeof wrong);
`,
        solution: String.raw`const priceText = "800";
const qtyText = "2";
const delivery = 150;

const price = Number(priceText);
const qty = Number(qtyText);
const total = price * qty + delivery;
console.log("মোট: " + total + " টাকা");

const fixed = price + delivery;
console.log("সঠিক যোগ:", fixed, typeof fixed);
console.log("অবৈধ ইনপুট:", Number("আটশো"), Number.isNaN(Number("আটশো")));
`,
        expect: ['মোট: 1750 টাকা', 'সঠিক যোগ: 950 number', 'অবৈধ ইনপুট: NaN true'],
        hints: ['প্রথম মোটটা আসলে ঠিক আসে (1750)! কারণ * অপারেটর string-কে number বানিয়ে নেয়। কিন্তু + তা করে না।', 'হিসাবের আগে Number(priceText) দিয়ে রূপান্তর করুন—তাহলে কোন অপারেটর তা নিয়ে ভাবতে হয় না।', 'Number("আটশো") চালিয়ে দেখুন কী আসে।'],
        test: '__assert(total===1750,"total"); __assert(fixed===950,"fixed");',
      },
    ],
    line: ul([
      '<code>priceText * qtyText</code>: <code>*</code> শুধু গুণ করে, তাই JavaScript নিজে string-কে number বানায় (implicit conversion)। ফল ঠিক আসে—কিন্তু এটি ভাগ্যের ওপর নির্ভর।',
      '<code>priceText + delivery</code>: <code>+</code> string দেখে জুড়ে দেয় → <code>"800150"</code>।',
      '<code>Number(...)</code>: স্পষ্ট রূপান্তর (explicit conversion)। কোড পড়েই বোঝা যায় কী হচ্ছে।',
      '<code>"মোট: " + total + " টাকা"</code>: এখানে জুড়ে দেওয়াটাই উদ্দেশ্য—লেখা বানানো।',
    ]),
    why: p('ইনপুট সবসময় স্পষ্টভাবে রূপান্তর করার অভ্যাস পরে মডেলের কোডে কাজে লাগবে: CSV বা JSON থেকে আসা সংখ্যা প্রায়ই string থাকে, আর ভুল টাইপে ভেক্টর হিসাব নীরবে ভুল ফল দেয়।'),
    remember: ['ডিফল্ট const, বদলালে let', '+ এর এক পাশে string থাকলে জুড়ে দেয়', 'বাইরে থেকে আসা মান Number() দিয়ে রূপান্তর করুন', 'NaN = অবৈধ সংখ্যা; Number.isNaN দিয়ে যাচাই'],
    skip: ['BigInt, Symbol টাইপ', 'implicit conversion-এর সব নিয়ম', 'var-এর hoisting নিয়ম'],
    experiment: p('<code>console.log("5" - 2, "5" + 2, "5" * "2", true + 1)</code> চালানোর আগে প্রতিটির ফল অনুমান করে লিখুন। তারপর চালিয়ে মিলিয়ে নিন। কোনটি আপনাকে অবাক করল?'),
    mistakes: ['ফর্মের মান number ধরে নেওয়া', 'const দিয়ে ঘোষণা করে পরে বদলানোর চেষ্টা (TypeError)', 'NaN-কে === দিয়ে যাচাই করা—NaN === NaN সবসময় false'],
    quiz: [
      { q: '<code>"300" + 50</code> এর ফল কী?', a: { a: '350', b: '"30050"', c: 'NaN' }, ok: 'b', why: 'এক পাশে string থাকায় + জুড়ে দেয়, ফলে "30050" (string)। যোগ পেতে আগে Number("300") করতে হতো।' },
      { q: 'একটি দামের মান পরে কখনো বদলাবে না। কী দিয়ে ঘোষণা করবেন?', a: { a: 'const', b: 'let', c: 'যেকোনোটি—পার্থক্য নেই' }, ok: 'a', why: 'const ভুল করে বদলানো আটকায় এবং পাঠককে জানায় মানটি স্থির। let শুধু যখন বদলানো দরকার।' },
      { q: '<code>Number("আটশো")</code> এর ফল কী এবং কেন?', a: { a: '800, কারণ JavaScript বাংলা সংখ্যা-শব্দ বোঝে', b: 'NaN, কারণ লেখাটি বৈধ সংখ্যা নয়', c: 'TypeError' }, ok: 'b', why: 'Number() শুধু সংখ্যার মতো দেখতে লেখা রূপান্তর করে। "আটশো" শব্দ, তাই NaN। এরর হয় না—এ কারণেই NaN নীরবে ছড়িয়ে পড়তে পারে।' },
    ],
    recap: ['মান + টাইপ + নাম = variable', '+ অপারেটরের দ্বৈত আচরণ বাগের উৎস', 'স্পষ্ট রূপান্তর ও typeof দিয়ে ডিবাগ'],
    nextNote: 'একাধিক মান একসাথে রাখতে লাগবে array ও object:',
    sources: [SRC.mdnGuide, ['MDN — JavaScript data types and data structures', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures']],
  },
  {
    id: 'les-02-02-arrays-objects',
    synthetic: true,
    slug: 'arrays-objects',
    title: 'Arrays ও Objects',
    minutes: 30,
    prereqs: ['les-02-01-values-types'],
    summary: 'Array = ক্রমানুসারে তালিকা (index 0 থেকে), Object = নাম-দেওয়া ঘর; পণ্য ক্যাটালগ সাজানো।',
    overview: p('বাস্তব ডেটা একটি মান নয়, অনেক মানের সংগ্রহ। Array একটি ক্রমানুসারী তালিকা যার প্রথম উপাদানের index ০; object হলো key দিয়ে নাম-দেওয়া ঘরের সংগ্রহ। এই পাঠে একটি পণ্য ক্যাটালগকে “object-এর array” হিসেবে সাজাব, index ও key দিয়ে মান পড়ব-লিখব, এবং reference বনাম copy-র একটি সাধারণ ফাঁদ দেখব। পরে ভেক্টর ও ডেটাসেট এই কাঠামোতেই রাখা হবে।'),
    objectives: ['array তৈরি করে index দিয়ে মান পড়তে ও length ব্যবহার করতে পারবেন', 'object-এর key দিয়ে মান পড়তে-লিখতে পারবেন', 'object-এর array দিয়ে ডেটাসেট সাজাতে এবং reference ফাঁদ এড়াতে পারবেন'],
    problem: p('দোকানে ৩টি পণ্য। কোডে লেখা আছে <code>name1, price1, stock1, name2, price2, …</code>—নয়টি আলাদা variable। নতুন পণ্য এলে আরও তিনটি variable, আর “সব পণ্যের দাম ১০% বাড়াও” করতে প্রতিটি আলাদা করে লিখতে হয়। এভাবে ৫০০ পণ্য সামলানো অসম্ভব।'),
    explain:
      p(`${term('অ্যারে', 'array')}: বর্গাকার বন্ধনীতে ক্রমানুসারে মান। প্রথম উপাদানের <em>index</em> ০, দ্বিতীয়টির ১। <code>.length</code> মোট উপাদান সংখ্যা।`) +
      code(`const prices = [450, 1200, 90];
console.log(prices[0]);        // 450  (প্রথম)
console.log(prices.length);    // 3
console.log(prices[prices.length - 1]);  // 90 (শেষ)
prices.push(300);              // শেষে যোগ → [450, 1200, 90, 300]`) +
      p(`${term('অবজেক্ট', 'object')}: কোঁকড়া বন্ধনীতে <code>key: value</code> জোড়া। index-এর বদলে নাম দিয়ে পড়ি।`) +
      code(`const shirt = { name: "সুতি শার্ট", price: 450, inStock: true };
console.log(shirt.name);       // ডট দিয়ে
console.log(shirt["price"]);   // বন্ধনী দিয়ে (key যদি variable-এ থাকে)
shirt.price = 500;             // মান বদল (const হলেও ভেতরের ঘর বদলানো যায়)`) +
      p('<strong>দুটো একসাথে:</strong> ডেটাসেট সাধারণত <em>object-এর array</em>—প্রতিটি সারি একটি object, প্রতিটি কলাম একটি key। অধ্যায় ১-এর feature/label টেবিল ঠিক এভাবেই কোডে আসে।') +
      p('<strong>Reference ফাঁদ:</strong> <code>const b = a;</code> লিখলে b নতুন কপি নয়, একই object-এর আরেকটি নাম। b বদলালে a-ও বদলায়। আলাদা কপি চাইলে <code>const b = { ...a };</code> (spread syntax—a-এর সব key নতুন object-এ ছড়িয়ে দেয়)।'),
    analogy: {
      text: 'Array হলো নম্বর দেওয়া লকারের সারি (০, ১, ২…); object হলো একটি ফর্ম যার প্রতিটি ঘরে নাম লেখা (নাম, দাম, স্টক)।',
      breaks: 'বাস্তব লকারের নম্বর ১ থেকে শুরু হয়; JavaScript-এ ০ থেকে—এটিই সবচেয়ে সাধারণ “off-by-one” ভুলের উৎস। আর ফর্মের ফটোকপি আলাদা কাগজ, কিন্তু object “কপি” (b = a) একই কাগজ।',
    },
    worked:
      p('৩টি পণ্যের ক্যাটালগ বানিয়ে দ্বিতীয় পণ্যের দাম পড়ি এবং স্টক বদলাই:') +
      code(`const products = [
  { id: "p1", name: "সুতি শার্ট", price: 450, stock: 12 },
  { id: "p2", name: "চামড়ার ব্যাগ", price: 1200, stock: 0 },
  { id: "p3", name: "মগ", price: 90, stock: 40 },
];
console.log(products[1].name, products[1].price);  // দ্বিতীয় পণ্য = index 1
products[2].stock = products[2].stock - 1;          // একটি মগ বিক্রি
console.log(products[2].stock);`) +
      out(`চামড়ার ব্যাগ 1200
39`) +
      p('<code>products[1]</code> একটি object দেয়, তারপর <code>.name</code> সেই object-এর ঘর। এভাবে বাম থেকে ডানে পড়ুন: “products-এর ১ নম্বর, তার name”।'),
    activity: runnerNote,
    code: [
      {
        label: 'ক্যাটালগ ও reference ফাঁদ',
        starter: String.raw`const products = [
  { id: "p1", name: "সুতি শার্ট", price: 450, stock: 12 },
  { id: "p2", name: "চামড়ার ব্যাগ", price: 1200, stock: 0 },
  { id: "p3", name: "মগ", price: 90, stock: 40 },
];

// ১) শেষ পণ্যের নাম দেখান (length ব্যবহার করে)
console.log("শেষ পণ্য:", products[products.length - 1].name);

// ২) নতুন পণ্য যোগ করুন
products.push({ id: "p4", name: "ছাতা", price: 350, stock: 7 });
console.log("মোট পণ্য:", products.length);

// ৩) ফাঁদ: অফার কপি বানাতে গিয়ে আসল দাম বদলে গেল?
const original = products[0];
const offer = original;          // এটা কি কপি?
offer.price = 400;
console.log("আসল দাম:", original.price, "অফার দাম:", offer.price);
`,
        solution: String.raw`const products = [
  { id: "p1", name: "সুতি শার্ট", price: 450, stock: 12 },
  { id: "p2", name: "চামড়ার ব্যাগ", price: 1200, stock: 0 },
  { id: "p3", name: "মগ", price: 90, stock: 40 },
];

console.log("শেষ পণ্য:", products[products.length - 1].name);

products.push({ id: "p4", name: "ছাতা", price: 350, stock: 7 });
console.log("মোট পণ্য:", products.length);

const original = products[0];
const offer = { ...original };   // আলাদা কপি
offer.price = 400;
console.log("আসল দাম:", original.price, "অফার দাম:", offer.price);
console.log("key তালিকা:", Object.keys(offer));
`,
        expect: ['শেষ পণ্য: মগ', 'মোট পণ্য: 4', 'আসল দাম: 450 অফার দাম: 400'],
        hints: ['starter চালালে দেখবেন আসল দামও 400 হয়ে গেছে—কেন?', 'offer = original মানে একই object-এর দুই নাম।', '{ ...original } লিখে নতুন object বানান।'],
        test: '__assert(products.length===4,"len"); __assert(original.price===450,"orig unchanged"); __assert(offer!==original,"different objects");',
      },
    ],
    line: ul([
      '<code>products.length - 1</code>: শেষ index। ৩টি উপাদান থাকলে index ০, ১, ২—শেষটি ২ = ৩ − ১।',
      '<code>products.push({...})</code>: array-এর শেষে নতুন object যোগ করে; length এক বাড়ে।',
      '<code>const offer = original</code>: নতুন object তৈরি হয় না, শুধু নতুন নাম।',
      '<code>{ ...original }</code>: original-এর সব key/value নিয়ে নতুন object। (সতর্কতা: এটি “shallow” কপি—ভেতরে আরেকটি object থাকলে সেটি শেয়ার থাকে।)',
      '<code>Object.keys(offer)</code>: object-এর সব key-এর array।',
    ]),
    why: p('object-এর array হলো ডেটাসেটের স্বাভাবিক রূপ। অধ্যায় ৪-এ classifier-এর training ডেটা, অধ্যায় ১১-এ RAG-এর ডকুমেন্ট—সব এই কাঠামোয় থাকবে। reference ফাঁদ বুঝলে “ডেটা কোথায় যেন নিজে থেকে বদলে গেল” বাগ এড়ানো যায়।'),
    remember: ['array index ০ থেকে; শেষ = length − 1', 'object key দিয়ে পড়া: obj.key বা obj["key"]', 'b = a কপি নয়; { ...a } দিয়ে কপি', 'ডেটাসেট = object-এর array'],
    skip: ['deep copy-র কৌশল (structuredClone)', 'Map ও Set', 'array-এর সব method—দরকারি গুলো পরের পাঠে'],
    experiment: p('<code>products[10]</code> চালিয়ে দেখুন কী আসে (এরর নাকি undefined?)। তারপর <code>products[10].name</code> চালান। দুটো ফলের পার্থক্য কী এবং কেন?'),
    mistakes: ['প্রথম উপাদানকে index ১ ভাবা', 'নেই এমন index/key পড়লে undefined আসে—তার ওপর .name চাইলে TypeError', 'const array-এ push করা যায় না ভাবা—const শুধু নাম পুনঃনির্ধারণ আটকায়, ভেতরের পরিবর্তন নয়'],
    quiz: [
      { q: '<code>const a = [10, 20, 30];</code> হলে <code>a[a.length - 1]</code> কত?', a: { a: '20', b: '30', c: 'undefined' }, ok: 'b', why: 'length ৩, তাই a[2] = 30। a[3] হলে undefined আসত—শেষ index সবসময় length − 1।' },
      { q: '<code>const b = a; b.price = 5;</code> এর পর <code>a.price</code> কত (a একটি object)?', a: { a: '5', b: 'আগের মানই', c: 'TypeError' }, ok: 'a', why: 'b ও a একই object-কে নির্দেশ করে, তাই একটির মাধ্যমে বদলালে অন্যটিতেও দেখা যায়।' },
      { q: 'ডেলিভারি ডেটাসেটের (দূরত্ব, ওজন, সময়) স্বাভাবিক JavaScript রূপ কোনটি?', a: { a: 'প্রতিটি কলামের জন্য আলাদা variable', b: 'object-এর array: [{distance, weight, days}, ...]', c: 'একটি লম্বা string' }, ok: 'b', why: 'প্রতিটি সারি একটি object আর key-গুলো কলামের নাম—যোগ, খোঁজা ও লুপ চালানো সহজ।' },
    ],
    recap: ['array = ক্রম, object = নাম-দেওয়া ঘর', 'index ০ থেকে', 'reference বনাম copy আলাদা'],
    nextNote: 'একই কাজ বারবার না লিখতে লাগবে function, আর সিদ্ধান্ত নিতে শর্ত:',
    sources: [['MDN — Indexed collections (Array)', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections'], ['MDN — Working with objects', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects']],
  },
  {
    id: 'les-02-03-functions-conditions',
    slug: 'functions-conditions',
    title: 'Functions ও Conditions',
    minutes: 35,
    prereqs: ['les-02-02-arrays-objects'],
    summary: 'function = ইনপুট নিয়ে আউটপুট ফেরত; if/else ও তুলনা অপারেটর; arrow function; ডেলিভারি চার্জ হিসাব।',
    overview: p('Function হলো নাম-দেওয়া একটি কাজ: ইনপুট (parameter) নেয়, return দিয়ে আউটপুট ফেরত দেয়। Condition (if/else) প্রোগ্রামকে সিদ্ধান্ত নিতে দেয়। এই পাঠে ঢাকার ভেতরে/বাইরে ও অর্ডারের মূল্য অনুযায়ী ডেলিভারি চার্জ হিসাবের একটি function বানাব, === ও && এর মতো অপারেটর শিখব, এবং arrow function সিনট্যাক্স দেখব যা পরের কোডে বারবার আসবে।'),
    objectives: ['parameter ও return সহ function লিখতে ও কল করতে পারবেন', 'if / else if / else এবং ===, >, &&, || দিয়ে সিদ্ধান্ত লিখতে পারবেন', 'arrow function সিনট্যাক্স পড়তে ও লিখতে পারবেন'],
    problem: p('ডেলিভারি নিয়ম: ঢাকার ভেতরে ৮০ টাকা, বাইরে ১৫০ টাকা, আর ২০০০ টাকার বেশি অর্ডারে ঢাকার ভেতরে ফ্রি। এই হিসাব চেকআউট, কার্ট ও অর্ডার-কনফার্মেশন—তিন জায়গায় কপি-পেস্ট করা। নিয়ম বদলালে তিন জায়গায় বদলাতে হয়, আর একটিতে ভুলে গেলে গ্রাহক তিন রকম দাম দেখেন।'),
    explain:
      p(`${term('ফাংশন', 'function')} একটি কাজকে নাম দেয় যাতে একবার লিখে বহুবার ব্যবহার করা যায়।`) +
      code(`function deliveryCharge(insideDhaka, orderTotal) {   // parameter
  if (insideDhaka && orderTotal > 2000) {
    return 0;            // return: আউটপুট ফেরত, ফাংশন এখানেই শেষ
  } else if (insideDhaka) {
    return 80;
  } else {
    return 150;
  }
}
console.log(deliveryCharge(true, 2500));   // কল করা (argument দিয়ে) → 0`) +
      table(['অপারেটর', 'অর্থ', 'উদাহরণ → ফল'], [
        ['<code>===</code>', 'মান ও টাইপ দুটোই সমান', '<code>5 === 5</code> → true, <code>5 === "5"</code> → false'],
        ['<code>!==</code>', 'সমান নয়', '<code>"ঢাকা" !== "খুলনা"</code> → true'],
        ['<code>&gt; &lt; &gt;= &lt;=</code>', 'বড়/ছোট', '<code>2500 > 2000</code> → true'],
        ['<code>&amp;&amp;</code>', 'দুটোই সত্য হলে সত্য (AND)', '<code>true && false</code> → false'],
        ['<code>||</code>', 'যেকোনো একটি সত্য হলে সত্য (OR)', '<code>true || false</code> → true'],
        ['<code>!</code>', 'উল্টো (NOT)', '<code>!true</code> → false'],
      ], 'তুলনা ও যুক্তি অপারেটর') +
      p('<code>==</code> (দুটি সমান চিহ্ন) টাইপ রূপান্তর করে তুলনা করে (<code>5 == "5"</code> → true)—এটি বাগ লুকায়। এই কোর্সে সবসময় <code>===</code>।') +
      p(`<strong>Arrow function:</strong> ছোট function লেখার সংক্ষিপ্ত রূপ। <code>const double = (x) => x * 2;</code> মানে “x নাও, x × 2 ফেরত দাও”। এক লাইনে থাকলে <code>return</code> লিখতে হয় না। একাধিক লাইনে <code>{ }</code> ও <code>return</code> লাগে।`),
    analogy: {
      text: 'Function হলো একটি রেসিপি: উপকরণ (parameter) দিলে খাবার (return) পাবেন। if/else হলো রেসিপির ভেতরের “যদি দুধ না থাকে তবে পানি দিন” নির্দেশ।',
      breaks: 'রেসিপিতে উপকরণ ভুল দিলে রাঁধুনি বুঝতে পারেন। JavaScript function ভুল টাইপের argument পেলেও চুপচাপ চলবে—যেমন orderTotal-এ "2500" (string) দিলে <code>"2500" > 2000</code> রূপান্তর করে true দেয়, কিন্তু সবসময় এমন ভাগ্য হবে না।',
    },
    worked:
      p('তিনটি ইনপুটে ফাংশন ট্রেস করি:') +
      table(['insideDhaka', 'orderTotal', 'প্রথম শর্ত (&&)', 'দ্বিতীয় শর্ত', 'ফল'], [
        ['true', '2500', 'true && true = true', '—', '0'],
        ['true', '1500', 'true && false = false', 'true', '80'],
        ['false', '3000', 'false && … = false', 'false', '150'],
      ]) +
      p('লক্ষ্য করুন: শর্তগুলো উপর থেকে নিচে পরীক্ষা হয়, প্রথম যেটি সত্য সেটির ভেতরের return চলে, বাকিগুলো আর দেখা হয় না। তাই ক্রম গুরুত্বপূর্ণ—“ফ্রি” শর্তটি “৮০” শর্তের আগে না থাকলে ফ্রি কখনো আসত না।'),
    activity: runnerNote,
    code: [
      {
        label: 'ডেলিভারি চার্জ ফাংশন — একটি বাগ আছে',
        starter: String.raw`// নিয়ম: ঢাকায় 80, বাইরে 150, ঢাকায় 2000-এর বেশি হলে ফ্রি
function deliveryCharge(insideDhaka, orderTotal) {
  if (insideDhaka) {
    return 80;
  } else if (insideDhaka && orderTotal > 2000) {
    return 0;
  } else {
    return 150;
  }
}

console.log("ঢাকা 2500:", deliveryCharge(true, 2500));   // 0 হওয়া উচিত
console.log("ঢাকা 1500:", deliveryCharge(true, 1500));   // 80
console.log("বাইরে 3000:", deliveryCharge(false, 3000)); // 150

// arrow function দিয়ে মোট দাম
const grandTotal = (insideDhaka, orderTotal) => orderTotal + deliveryCharge(insideDhaka, orderTotal);
console.log("মোট:", grandTotal(true, 1500));
`,
        solution: String.raw`function deliveryCharge(insideDhaka, orderTotal) {
  if (insideDhaka && orderTotal > 2000) {
    return 0;
  } else if (insideDhaka) {
    return 80;
  } else {
    return 150;
  }
}

console.log("ঢাকা 2500:", deliveryCharge(true, 2500));
console.log("ঢাকা 1500:", deliveryCharge(true, 1500));
console.log("বাইরে 3000:", deliveryCharge(false, 3000));
console.log("ঢাকা ঠিক 2000:", deliveryCharge(true, 2000));

const grandTotal = (insideDhaka, orderTotal) => orderTotal + deliveryCharge(insideDhaka, orderTotal);
console.log("মোট:", grandTotal(true, 1500));
`,
        expect: ['ঢাকা 2500: 0', 'ঢাকা 1500: 80', 'বাইরে 3000: 150', 'ঢাকা ঠিক 2000: 80', 'মোট: 1580'],
        starterFails: 'wrong-output',
        hints: ['starter-এ ঢাকা 2500 কত দেখাচ্ছে? 80! কেন ফ্রি শর্তে পৌঁছায় না?', 'insideDhaka true হলেই প্রথম if ধরে ফেলে। সবচেয়ে নির্দিষ্ট শর্ত সবার আগে রাখুন।', 'ঠিক 2000 টাকায় কী হওয়া উচিত? নিয়মে “বেশি” বলা আছে, তাই > (≥ নয়)।'],
        test: '__assert(deliveryCharge(true,2001)===0,"free"); __assert(deliveryCharge(true,2000)===80,"boundary"); __assert(deliveryCharge(false,5000)===150,"outside");',
      },
    ],
    line: ul([
      '<code>function deliveryCharge(insideDhaka, orderTotal)</code>: দুটি parameter—কল করার সময় যে মান দেওয়া হয় (argument) সেগুলো এখানে বসে।',
      '<code>insideDhaka && orderTotal > 2000</code>: আগে <code>></code> হিসাব হয়, তারপর <code>&&</code>। দুটো সত্য হলেই পুরোটা সত্য।',
      '<code>return 0;</code>: মান ফেরত দিয়ে ফাংশন থেমে যায়—নিচের else if আর চলে না।',
      '<code>const grandTotal = (a, b) => ...</code>: arrow function, যেটি ভেতরে আরেকটি function কল করছে। function দিয়ে function বানানো স্বাভাবিক।',
    ]),
    why: p('হিসাব একটি function-এ থাকলে নিয়ম বদলাতে এক জায়গায় বদলাতে হয়, আর আলাদাভাবে পরীক্ষা করা যায় (সীমানা ২০০০, ২০০১)। পরের অধ্যায়ের সব গণিত—dot product, loss, softmax—ছোট ছোট function হিসেবে লিখব।'),
    remember: ['function: parameter নেয়, return দেয়', 'শর্ত উপর থেকে নিচে; নির্দিষ্টটি আগে', 'সবসময় === ব্যবহার', 'arrow: (x) => x * 2'],
    skip: ['switch statement', 'default parameter ও rest parameter', 'function hoisting-এর নিয়ম'],
    experiment: p('নতুন নিয়ম যোগ করুন: চট্টগ্রামে ১২০ টাকা। প্রথম parameter boolean-এর বদলে শহরের নাম (string) নিন: <code>deliveryCharge("চট্টগ্রাম", 1000)</code>। কোন শর্ত কোন ক্রমে রাখবেন?'),
    mistakes: ['সাধারণ শর্ত নির্দিষ্ট শর্তের আগে রাখা (এই পাঠের বাগ)', 'return না লিখে console.log দেওয়া—তখন ফাংশন undefined ফেরত দেয়', '= (মান দেওয়া) আর === (তুলনা) গুলিয়ে ফেলা', 'সীমানার মান (ঠিক ২০০০) পরীক্ষা না করা'],
    quiz: [
      { q: '<code>5 === "5"</code> এর ফল কী?', a: { a: 'true', b: 'false', c: 'এরর' }, ok: 'b', why: '=== মান ও টাইপ দুটোই মেলায়; number ও string আলাদা টাইপ, তাই false। == হলে true আসত, যা বাগ লুকায়।' },
      { q: 'একটি function-এ return না থাকলে কল করলে কী ফেরত আসে?', a: { a: '0', b: 'undefined', c: 'শেষ লাইনের মান' }, ok: 'b', why: 'JavaScript function স্পষ্ট return ছাড়া undefined ফেরত দেয়। ভেতরের console.log শুধু দেখায়, ফেরত দেয় না।' },
      { q: '<code>const sq = (x) => x * x;</code> হলে <code>sq(4)</code> কত?', a: { a: '8', b: '16', c: 'undefined' }, ok: 'b', why: 'এক লাইনের arrow function নিজেই মান ফেরত দেয়: 4 × 4 = 16।' },
    ],
    recap: ['একবার লিখে বহুবার ব্যবহার = function', 'if/else ক্রম ফলাফল নির্ধারণ করে', 'সীমানার মান দিয়ে পরীক্ষা'],
    nextNote: 'পুরো ক্যাটালগে একই কাজ চালাতে লাগবে loop; কোড ভাগ করতে module:',
    sources: [['MDN — Functions guide', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions'], SRC.mdnErrors, ['MDN — Equality comparisons and sameness', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness']],
  },
  {
    id: 'les-02-04-loops-modules',
    synthetic: true,
    slug: 'loops-modules',
    title: 'Loops, Modules ও Execution Flow',
    minutes: 35,
    prereqs: ['les-02-03-functions-conditions'],
    summary: 'for, for...of, map/filter/reduce; execution flow ট্রেস; module দিয়ে কোড ভাগ (import/export ও এই রানারের ভার্চুয়াল মডিউল)।',
    overview: p('Loop একই কাজ প্রতিটি উপাদানে চালায়; map, filter ও reduce হলো array-এর ওপর সবচেয়ে প্রচলিত loop-প্যাটার্ন। এই পাঠে ক্যাটালগের মোট স্টক-মূল্য হিসাব, স্টকে থাকা পণ্য বাছাই ও দাম বাড়ানো—তিনটিই loop দিয়ে করব, প্রতিটি ধাপে variable কীভাবে বদলায় তা ট্রেস করব, এবং module দিয়ে কোড আলাদা ফাইলে ভাগ করার ধারণা শিখব (বাস্তব import/export সিনট্যাক্স ও এই সাইটের নিরাপদ ভার্চুয়াল মডিউল)।'),
    objectives: ['for ও for...of loop লিখে প্রতিটি ধাপে variable-এর মান ট্রেস করতে পারবেন', 'map, filter, reduce দিয়ে array রূপান্তর করতে পারবেন', 'module কেন দরকার এবং import/export কীভাবে কাজ করে ব্যাখ্যা করতে পারবেন'],
    problem: p('মাস শেষে মালিক জানতে চান: (১) মোট স্টকের মূল্য কত টাকা, (২) কোন পণ্যগুলো স্টকে আছে, (৩) সব দাম ৫% বাড়ালে নতুন তালিকা কী। ৫০০ পণ্যের জন্য প্রতিটি আলাদা লাইনে লেখা অসম্ভব।'),
    explain:
      p(`${term('লুপ', 'loop')}: একই কোড বারবার চালায়।`) +
      code(`const stock = [12, 0, 40];
for (let i = 0; i < stock.length; i++) {   // শুরু; শর্ত; প্রতি ধাপের পর
  console.log("index", i, "স্টক", stock[i]);
}
for (const s of stock) {                    // index না লাগলে সহজ রূপ
  console.log(s);
}`) +
      p('<code>for (let i = 0; i &lt; n; i++)</code>: i = ০ দিয়ে শুরু, প্রতিবার শর্ত দেখে, সত্য হলে ভেতরের কোড চালায়, তারপর i এক বাড়ায় (<code>i++</code>)। শর্ত মিথ্যা হলে থামে। শর্ত কখনো মিথ্যা না হলে <strong>অসীম loop</strong>—এই রানার ৩ সেকেন্ড পর থামিয়ে দেবে।') +
      table(['Method', 'কী করে', 'ফেরত দেয়'], [
        ['<code>arr.map(f)</code>', 'প্রতিটি উপাদানে f চালায়', 'একই দৈর্ঘ্যের নতুন array'],
        ['<code>arr.filter(f)</code>', 'f যেগুলোতে true দেয় সেগুলো রাখে', 'ছোট বা সমান দৈর্ঘ্যের নতুন array'],
        ['<code>arr.reduce(f, শুরু)</code>', 'সব উপাদান মিলিয়ে একটি মান বানায়', 'একটি মান (যেমন যোগফল)'],
      ], 'তিনটি প্রধান array method') +
      p(`${term('মডিউল', 'module')}: কোডকে আলাদা ফাইলে ভাগ করার ব্যবস্থা। একটি ফাইল <code>export</code> করে, অন্যটি <code>import</code> করে।`) +
      code(`// pricing.js
export function withVat(price) { return price * 1.15; }

// main.js
import { withVat } from "./pricing.js";
console.log(withVat(100));`) +
      note('এই সাইটের রানার নিরাপত্তার কারণে বাইরের ফাইল বা নেটওয়ার্ক থেকে import করতে দেয় না। তাই অনুশীলনে একটি ছোট <strong>ভার্চুয়াল মডিউল</strong> ব্যবস্থা আছে: <code>defineModule("নাম", (exports) => { ... })</code> দিয়ে মডিউল বানান, <code>requireModule("নাম")</code> দিয়ে আনুন। ধারণা একই—নিজের কম্পিউটারে Node.js বা ব্রাউজারে আসল import/export ব্যবহার করবেন।'),
    analogy: {
      text: 'Loop হলো ক্যাশিয়ার যিনি লাইনের প্রত্যেক গ্রাহকের কাছে একই প্রশ্ন করেন; module হলো দোকানের আলাদা বিভাগ (হিসাব, স্টক), প্রত্যেকে নিজের কাজ করে আর নির্দিষ্ট জিনিস অন্যদের দেয়।',
      breaks: 'ক্যাশিয়ার লাইন শেষ হলে নিজে থামেন; loop থামে শুধু যদি আপনি সঠিক শর্ত লেখেন। আর বাস্তব বিভাগ নিজে থেকে যোগাযোগ করে; module শুধু export করা জিনিসই দেয়।',
    },
    worked:
      p('মোট স্টক-মূল্য (দাম × স্টক) reduce দিয়ে, প্রতিটি ধাপ ট্রেস:') +
      code(`const products = [
  { name: "শার্ট", price: 450, stock: 12 },
  { name: "ব্যাগ", price: 1200, stock: 0 },
  { name: "মগ", price: 90, stock: 40 },
];
const value = products.reduce((sum, p) => sum + p.price * p.stock, 0);`) +
      table(['ধাপ', 'sum (আগে)', 'p', 'p.price × p.stock', 'sum (পরে)'], [
        ['১', '0', 'শার্ট', '450 × 12 = 5400', '5400'],
        ['২', '5400', 'ব্যাগ', '1200 × 0 = 0', '5400'],
        ['৩', '5400', 'মগ', '90 × 40 = 3600', '9000'],
      ], 'reduce-এর execution flow') +
      p('শেষ ফল ৯০০০। <code>0</code> হলো শুরুর মান—এটি না দিলে খালি array-তে reduce এরর দেয়।'),
    activity: runnerNote,
    code: [
      {
        label: 'map / filter / reduce এবং ভার্চুয়াল মডিউল',
        starter: String.raw`defineModule("pricing", (exports) => {
  exports.increase = (price, percent) => Math.round(price * (1 + percent / 100));
});

const { increase } = requireModule("pricing");

const products = [
  { name: "শার্ট", price: 450, stock: 12 },
  { name: "ব্যাগ", price: 1200, stock: 0 },
  { name: "মগ", price: 90, stock: 40 },
];

// ১) স্টকে আছে এমন পণ্যের নাম
const available = products.filter((p) => p.stock > 0).map((p) => p.name);
console.log("স্টকে:", available);

// ২) মোট স্টক-মূল্য
const value = products.reduce((sum, p) => sum + p.price * p.stock, 0);
console.log("মোট মূল্য:", value);

// ৩) ৫% দাম বাড়ানো তালিকা (আসল array বদলাবে না)
const raised = products.map((p) => ({ name: p.name, price: increase(p.price, 5) }));
console.log("নতুন দাম:", raised);

// ৪) এই loop কি থামবে? (শর্তটা দেখুন, তারপর চালান)
let n = 0;
while (n < 3) {
  console.log("n =", n);
  n = n + 1;
}
`,
        expect: ['স্টকে: ["শার্ট","মগ"]', 'মোট মূল্য: 9000', '{"name":"মগ","price":95}', 'n = 2'],
        hints: ['filter-এর ফাংশন true ফেরত দিলে উপাদানটি থাকে।', 'map-এর ভেতরে ({ ... }) — object ফেরত দিতে বন্ধনী লাগে, না হলে { কে ফাংশনের শরীর ভাবা হয়।', 'n = n + 1 লাইনটি মুছে চালান—রানার কী বলে?'],
        test: '__assert(value===9000,"value"); __assert(raised[0].price===473,"5% of 450 rounded"); __assert(products[0].price===450,"original unchanged");',
      },
    ],
    line: ul([
      '<code>defineModule("pricing", (exports) => {...})</code>: একটি মডিউল নিবন্ধন; ভেতরে <code>exports</code>-এ যা রাখা হয় সেটাই বাইরে পাওয়া যায়।',
      '<code>const { increase } = requireModule("pricing")</code>: destructuring—ফেরত আসা object থেকে increase নামের ঘর বের করে একই নামের variable বানায়।',
      '<code>filter(...).map(...)</code>: chaining—প্রথমে বাছাই, তারপর নাম বের করা। প্রতিটি নতুন array দেয়, আসলটি বদলায় না।',
      '<code>Math.round(450 * 1.05)</code> = Math.round(472.5) = 473।',
      '<code>while (n &lt; 3)</code>: শর্ত সত্য থাকা পর্যন্ত চলে; <code>n = n + 1</code> না থাকলে শর্ত কখনো মিথ্যা হবে না।',
    ]),
    why: p('map/filter/reduce মডেল কোডে সর্বত্র: ভেক্টরের প্রতিটি উপাদান গুণ (map), কম স্কোরের ডকুমেন্ট বাদ (filter), loss যোগ (reduce)। আসল array না বদলে নতুন array বানানো ডেটা নষ্ট হওয়া আটকায়।'),
    remember: ['for: index লাগলে; for...of: শুধু মান লাগলে', 'map = রূপান্তর, filter = বাছাই, reduce = একটি মানে সংকোচন', 'loop-এর থামার শর্ত সবসময় যাচাই করুন', 'module: export করা জিনিসই বাইরে যায়'],
    skip: ['forEach, some, every, find—দরকার হলে পরে', 'CommonJS (require) বনাম ES module-এর পার্থক্য', 'do...while'],
    experiment: p('reduce দিয়ে স্টকে থাকা পণ্যের <em>সংখ্যা</em> গুনুন (মূল্য নয়)। তারপর filter + length দিয়ে একই কাজ করুন। কোনটি পড়তে সহজ লাগল?'),
    mistakes: ['map-এর ভেতরে object ফেরত দিতে বন্ধনী ভুলে যাওয়া: (p) => { name: p.name } কাজ করে না', 'reduce-এ শুরুর মান না দেওয়া', 'loop-এর ভেতরে loop-এর শর্তের variable না বাড়ানো (অসীম loop)', 'i <= arr.length লেখা—শেষ ধাপে undefined'],
    quiz: [
      { q: '<code>[1, 2, 3].map((x) => x * 10)</code> এর ফল কী?', a: { a: '[10, 20, 30]', b: '60', c: '[1, 2, 3]' }, ok: 'a', why: 'map প্রতিটি উপাদানে ফাংশন চালিয়ে একই দৈর্ঘ্যের নতুন array দেয়। একটি মান পেতে reduce লাগত।' },
      { q: '<code>[5, 0, 8].filter((x) => x > 0)</code> এর ফল কী?', a: { a: '[5, 8]', b: '[true, false, true]', c: '2' }, ok: 'a', why: 'filter শর্ত পূরণ করা উপাদানগুলো রাখে; true/false-এর array দেয় না।' },
      { q: '<code>for (let i = 0; i &lt; 3; i--)</code> loop-এর সমস্যা কী?', a: { a: 'কোনো সমস্যা নেই', b: 'i কমতে থাকে, তাই i &lt; 3 সবসময় সত্য—অসীম loop', c: 'loop একবারও চলবে না' }, ok: 'b', why: 'i ০, −১, −২ … সবসময় ৩-এর কম। থামার শর্ত কখনো পূরণ হয় না; রানার সময়সীমা শেষে থামাবে।' },
    ],
    recap: ['loop = বারবার একই কাজ', 'map/filter/reduce = array-এর তিন হাতিয়ার', 'execution flow ট্রেস করে বাগ ধরুন', 'module দিয়ে কোড ভাগ'],
    nextNote: 'ডেটা আদান-প্রদানের ভাষা JSON, আর অপেক্ষা করতে হয় এমন কাজের জন্য async/await:',
    sources: [['MDN — Loops and iteration', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration'], ['MDN — Array.prototype.reduce()', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce'], SRC.mdnModules],
  },
  {
    id: 'les-02-05-json-async',
    synthetic: true,
    slug: 'json-async',
    title: 'JSON, Async/Await ও Errors',
    minutes: 40,
    prereqs: ['les-02-04-loops-modules'],
    summary: 'JSON.stringify/parse; Promise ও async/await লোকাল fixture দিয়ে; try/catch/throw; আসল নেটওয়ার্ক কলের সাথে পার্থক্য।',
    overview: p('JSON হলো ডেটা আদান-প্রদানের টেক্সট ফরম্যাট—API ও LLM-এর structured output দুটোই এতে আসে। Async/await দিয়ে এমন কাজ লেখা যায় যেগুলোর ফল সঙ্গে সঙ্গে আসে না (যেমন সার্ভার থেকে অর্ডার আনা)। এই পাঠে JSON রূপান্তর, ভাঙা JSON-এ try/catch, এবং একটি লোকাল “fake API” (fixture) দিয়ে async/await অনুশীলন করব। সাথে স্পষ্ট করব লোকাল fixture আর আসল নেটওয়ার্ক কলের পার্থক্য—সময়, ব্যর্থতা ও নিরাপত্তায়।'),
    objectives: ['JSON.stringify ও JSON.parse দিয়ে object ↔ টেক্সট রূপান্তর করতে পারবেন', 'try/catch দিয়ে ভাঙা ইনপুট নিরাপদে সামলাতে এবং throw দিয়ে নিজের এরর তৈরি করতে পারবেন', 'async function ও await দিয়ে Promise-ভিত্তিক কোড লিখতে এবং fixture বনাম আসল API-র পার্থক্য বলতে পারবেন'],
    problem: p('অর্ডার সিস্টেম থেকে টেক্সট আসে <code>{"id":"ORD-17","status":"shipped"}</code>। কখনো কখনো ভাঙা টেক্সট আসে (<code>{"id":"ORD-18",</code>), আর পুরো পেজ crash করে। তার ওপর, সার্ভার উত্তর দিতে ২ সেকেন্ড নেয়—কোড কি এই সময় অন্য সব কাজ থামিয়ে বসে থাকবে?'),
    explain:
      p(`${term('JSON', 'JavaScript Object Notation')}: object/array-কে টেক্সটে লেখার নিয়ম। key সবসময় ডাবল কোটেশনে; string, number, boolean, null, array, object চলে; function বা undefined চলে না।`) +
      code(`const order = { id: "ORD-17", items: 2, paid: true };
const text = JSON.stringify(order);   // object → টেক্সট
const back = JSON.parse(text);        // টেক্সট → object`) +
      p(`${term('এরর হ্যান্ডলিং', 'error handling')}: <code>JSON.parse</code> ভাঙা টেক্সট পেলে <em>exception</em> ছোড়ে (throw)। <code>try { … } catch (err) { … }</code> সেটি ধরে, যাতে প্রোগ্রাম থেমে না যায়। নিজেও <code>throw new Error("বার্তা")</code> দিয়ে এরর ছোড়া যায়—যেমন অর্ডার নম্বর খালি হলে।`) +
      p(`${term('প্রমিস', 'Promise')}: এমন একটি মান যা “পরে আসবে”। ${term('async/await', 'async/await')}: <code>async function</code>-এর ভেতরে <code>await</code> লিখলে সেই Promise শেষ না হওয়া পর্যন্ত ওই function অপেক্ষা করে, কিন্তু বাকি প্রোগ্রাম আটকে থাকে না। async function নিজেও একটি Promise ফেরত দেয়।`) +
      table(['', 'লোকাল fixture (এই পাঠ)', 'আসল নেটওয়ার্ক কল'], [
        ['ডেটা কোথা থেকে', 'কোডের ভেতরে লেখা নমুনা', 'অন্য কম্পিউটারের সার্ভার'],
        ['সময়', 'প্রায় তাৎক্ষণিক', 'মিলিসেকেন্ড থেকে সেকেন্ড; অনিশ্চিত'],
        ['ব্যর্থতা', 'শুধু আমরা যা সিমুলেট করি', 'নেটওয়ার্ক বিচ্ছিন্ন, timeout, 500 এরর, rate limit'],
        ['নিরাপত্তা', 'কোনো তথ্য বাইরে যায় না', 'API key, ব্যক্তিগত ডেটা সাবধানে সামলাতে হয়'],
      ], 'fixture বনাম আসল API') +
      p('এই রানারে <code>fetch</code> নেই—ইচ্ছাকৃত। তাই আমরা <code>Promise.resolve(...)</code> দিয়ে fixture বানাব। কোডের কাঠামো (async/await, try/catch) আসল API-তেও একই থাকবে; অধ্যায় ১০-এ timeout ও retry যোগ করব।'),
    analogy: {
      text: 'async/await হলো রেস্তোরাঁয় অর্ডার দিয়ে টোকেন নেওয়া: খাবার তৈরি হওয়া পর্যন্ত আপনি অন্য কাজ করতে পারেন, টোকেন ডাকলে (await শেষ) খাবার নেন। try/catch হলো “খাবার শেষ হয়ে গেলে বিকল্প অর্ডার” পরিকল্পনা।',
      breaks: 'রেস্তোরাঁ সাধারণত খাবার দেয়ই; নেটওয়ার্ক কল কখনো উত্তরই না দিতে পারে (চিরকাল ঝুলে থাকা)—তাই বাস্তবে timeout লাগে, যা এই উপমায় নেই।',
    },
    worked:
      p('ধাপে ধাপে: fixture থেকে অর্ডার আনা, JSON parse করা, ভুল সামলানো।') +
      code(`const fixtures = {
  "ORD-17": '{"id":"ORD-17","status":"shipped"}',
  "ORD-18": '{"id":"ORD-18",',          // ইচ্ছাকৃত ভাঙা
};
function fakeFetchOrder(id) {          // আসল API-র নকল
  return Promise.resolve(fixtures[id]);
}
async function getStatus(id) {
  const text = await fakeFetchOrder(id);
  try {
    return JSON.parse(text).status;
  } catch (err) {
    return "ডেটা ভাঙা: " + err.name;
  }
}`) +
      ol([
        '<code>getStatus("ORD-17")</code> কল → await fixture-এর টেক্সট পায় → parse → "shipped"।',
        '<code>getStatus("ORD-18")</code> → parse ব্যর্থ → SyntaxError ধরা পড়ে → "ডেটা ভাঙা: SyntaxError"।',
        '<code>getStatus("ORD-99")</code> → fixture-এ নেই → text = undefined → <code>JSON.parse(undefined)</code>-ও SyntaxError। ভালো কোডে আগেই “অর্ডার পাওয়া যায়নি” বলা উচিত।',
      ]),
    activity: runnerNote,
    code: [
      {
        label: 'fixture দিয়ে async/await ও এরর',
        starter: String.raw`// লোকাল fixture — আসল নেটওয়ার্ক নয়
const fixtures = {
  "ORD-17": '{"id":"ORD-17","status":"shipped","items":2}',
  "ORD-18": '{"id":"ORD-18",',
};

function fakeFetchOrder(id) {
  if (!id) {
    return Promise.reject(new Error("অর্ডার নম্বর খালি"));
  }
  return Promise.resolve(fixtures[id]);
}

async function getStatus(id) {
  try {
    const text = await fakeFetchOrder(id);
    if (text === undefined) {
      throw new Error("অর্ডার পাওয়া যায়নি: " + id);
    }
    const order = JSON.parse(text);
    return order.id + " → " + order.status;
  } catch (err) {
    return "সমস্যা (" + err.name + "): " + err.message;
  }
}

async function main() {
  console.log("শুরু");
  for (const id of ["ORD-17", "ORD-18", "ORD-99", ""]) {
    console.log(await getStatus(id));
  }
  console.log("JSON আবার:", JSON.stringify({ id: "ORD-17", ok: true }));
}

main();
console.log("main() কল হয়েছে — কিন্তু ফল এখনও আসেনি!");
`,
        expect: ['ORD-17 → shipped', 'সমস্যা (SyntaxError)', 'অর্ডার পাওয়া যায়নি: ORD-99', 'অর্ডার নম্বর খালি', 'JSON আবার: {"id":"ORD-17","ok":true}'],
        hints: ['আউটপুটের ক্রম দেখুন: “main() কল হয়েছে” লাইনটি কোথায় এল এবং কেন?', 'await থাকা মানে main অপেক্ষা করে, কিন্তু main-এর বাইরের কোড এগিয়ে যায়।', 'try-এর ভেতরে throw করলে সরাসরি catch-এ যায়।'],
        test: 'getStatus("ORD-17").then(function(r){ __assert(r==="ORD-17 → shipped","async result"); });',
      },
    ],
    line: ul([
      '<code>Promise.reject(new Error(...))</code>: ব্যর্থ Promise—await করলে এটি exception হিসেবে ছোড়ে, তাই catch ধরে।',
      '<code>const text = await fakeFetchOrder(id)</code>: Promise-এর ভেতরের মান বের করে; ব্যর্থ হলে throw।',
      '<code>throw new Error("অর্ডার পাওয়া যায়নি")</code>: নিজের এরর; বার্তাটি err.message-এ যায়, ধরনটি err.name ("Error")।',
      '<code>err.name</code>: JSON ভাঙলে "SyntaxError", নিজের হলে "Error"—এভাবে ধরন আলাদা করা যায়।',
      'শেষ লাইনটি main-এর ভেতরের await-গুলোর আগে ছাপা হয়—async কাজ “পরে” শেষ হয়, এটাই execution flow।',
    ]),
    why: p('LLM API-র উত্তর (অধ্যায় ১০) JSON-এ আসে এবং কখনো ভাঙা বা স্কিমার বাইরে থাকে; নেটওয়ার্ক কল async এবং ব্যর্থ হতে পারে। এখনই try/catch ও await-এর অভ্যাস হলে পরের অধ্যায়ে শুধু timeout/retry যোগ করতে হবে।'),
    remember: ['JSON = টেক্সট; parse করে object, stringify করে টেক্সট', 'বাইরের ডেটা parse করতে সবসময় try/catch', 'await শুধু async function-এর ভেতরে', 'fixture ≠ আসল API: সময়, ব্যর্থতা, নিরাপত্তা আলাদা'],
    skip: ['Promise.all, Promise.race', 'event loop-এর microtask/macrotask বিস্তারিত', 'fetch API-র সব অপশন'],
    experiment: p('fixtures-এ <code>"ORD-19": \'{"id":"ORD-19"}\'</code> যোগ করুন (status নেই)। আউটপুটে কী আসে? “ORD-19 → undefined” দেখালে সেটি কি ব্যবহারকারীর জন্য ভালো বার্তা? কোড বদলে “স্ট্যাটাস জানা নেই” দেখান।'),
    mistakes: ['JSON-এ সিঙ্গেল কোটেশনে key লেখা—{\'id\': 1} বৈধ JSON নয়', 'await ছাড়া async function কল করে ফল ব্যবহার করা (Promise পাবেন, মান নয়)', 'catch-এ এরর চুপচাপ গিলে ফেলা, কিছু না জানানো', 'fixture-এ কাজ করলেই ধরে নেওয়া আসল API-তেও করবে'],
    quiz: [
      { q: '<code>JSON.parse(\'{"a":1,\')</code> চালালে কী হয়?', a: { a: 'undefined ফেরত', b: 'SyntaxError ছোড়া হয়', c: '{a: 1}' }, ok: 'b', why: 'ভাঙা JSON-এ parse exception ছোড়ে। try/catch না থাকলে প্রোগ্রাম থেমে যায়।' },
      { q: '<code>async function f() { return 5; }</code> হলে <code>f()</code> কী ফেরত দেয়?', a: { a: '5', b: 'একটি Promise যা 5-এ পূর্ণ হয়', c: 'undefined' }, ok: 'b', why: 'async function সবসময় Promise দেয়। মান পেতে await f() বা f().then(...) লাগে।' },
      { q: 'লোকাল fixture দিয়ে পরীক্ষিত কোড আসল API-তে নেওয়ার আগে কোনটি অবশ্যই যোগ করা দরকার?', a: { a: 'timeout ও নেটওয়ার্ক ব্যর্থতা সামলানো', b: 'আরও console.log', c: 'কিছুই না—কাঠামো একই' }, ok: 'a', why: 'কাঠামো একই হলেও আসল নেটওয়ার্ক ধীর হতে পারে, উত্তর না-ও দিতে পারে, বা এরর দিতে পারে। fixture এসব দেখায় না।' },
    ],
    recap: ['JSON: ডেটার সাধারণ ভাষা', 'try/catch/throw: ব্যর্থতা নিয়ন্ত্রিতভাবে সামলানো', 'async/await: অপেক্ষার কাজ, প্রোগ্রাম আটকায় না', 'fixture দিয়ে শিখি, আসলের পার্থক্য মনে রাখি'],
    nextNote: 'কোড ভুল হলে কীভাবে খুঁজবেন—পরের পাঠ ব্যবহারিক debugging:',
    sources: [SRC.mdnJSON, SRC.mdnAsync, SRC.mdnPromise, SRC.mdnErrors],
  },
  {
    id: 'les-02-06-debugging',
    slug: 'debugging',
    title: 'Practical Debugging',
    minutes: 30,
    prereqs: ['les-02-05-json-async'],
    summary: 'এরর বার্তা পড়া, অনুমান → পরীক্ষা চক্র, মধ্যবর্তী মান ছাপা, ছোট ইনপুটে সমস্যা ছোট করা; একটি ডিসকাউন্ট বাগ খোঁজা।',
    overview: p('প্রোগ্রামাররা যতটা সময় কোড লেখেন, প্রায় ততটাই খোঁজেন কেন সেটি কাজ করছে না। এই পাঠে একটি পদ্ধতিগত debugging চক্র শিখব: সমস্যা পুনরুৎপাদন, এরর বার্তা পড়া (ধরন, বার্তা, লাইন), একটি অনুমান করা, মধ্যবর্তী মান ছাপিয়ে যাচাই, এবং ইনপুট ছোট করে সমস্যা আলাদা করা। একটি ডিসকাউন্ট ক্যালকুলেটরের দুটি বাগ—একটি এরর দেয়, একটি চুপচাপ ভুল ফল দেয়—এই পদ্ধতিতে খুঁজে ঠিক করব।'),
    objectives: ['এরর বার্তার ধরন (SyntaxError, ReferenceError, TypeError) থেকে সম্ভাব্য কারণ বলতে পারবেন', 'অনুমান → পরীক্ষা চক্র দিয়ে নীরব (silent) বাগ খুঁজে পেতে পারবেন', 'মধ্যবর্তী মান ছাপিয়ে ও ছোট ইনপুট দিয়ে সমস্যা আলাদা করতে পারবেন'],
    problem: p('কুপন কোড “EID10” দিলে ১০% ছাড় পাওয়ার কথা। একজন গ্রাহক অভিযোগ করলেন ১০০০ টাকার অর্ডারে তিনি ১০০ টাকা ছাড় পেয়েছেন—ঠিক আছে। আরেকজন বললেন তার ক্ষেত্রে পেজই খুলছে না। কোড দেখে কিছুই বোঝা যাচ্ছে না। কোথা থেকে শুরু করবেন?'),
    explain:
      ol([
        '<strong>পুনরুৎপাদন:</strong> ঠিক কোন ইনপুটে সমস্যা হয় তা খুঁজুন। “কখনো কখনো ভুল” থেকে “কুপন ছোট হাতের অক্ষরে দিলে ভুল”—এটাই অর্ধেক সমাধান।',
        '<strong>এরর বার্তা পড়ুন:</strong> ধরন + বার্তা। নিচের টেবিল দেখুন।',
        '<strong>অনুমান করুন:</strong> “আমার ধারণা discount undefined”।',
        '<strong>পরীক্ষা করুন:</strong> সন্দেহের জায়গার ঠিক আগে <code>console.log("discount =", discount)</code>।',
        '<strong>ছোট করুন:</strong> ১০০টি অর্ডারের বদলে একটি অর্ডার, একটি কুপন দিয়ে চালান।',
        '<strong>ঠিক করুন ও আবার পরীক্ষা করুন:</strong> আগের সফল ইনপুটগুলোও যেন ঠিক থাকে।',
      ]) +
      table(['এরর', 'সাধারণ অর্থ', 'প্রথমে কী দেখবেন'], [
        ['SyntaxError', 'কোড ভাষার নিয়ম ভেঙেছে—চালানোর আগেই ধরা পড়ে', 'বন্ধনী/কোটেশন জোড়া, কমা, বানান'],
        ['ReferenceError', 'এমন নাম যা ঘোষণা হয়নি বা স্কোপে নেই', 'বানান, ঘোষণার জায়গা, block-এর বাইরে ব্যবহার'],
        ['TypeError', 'ভুল ধরনের মানে কাজ (undefined.x, নন-ফাংশন কল)', 'কোন মান undefined/null হলো এবং কেন'],
        ['কোনো এরর নেই কিন্তু ভুল ফল', 'যুক্তির বাগ (silent bug)', 'মধ্যবর্তী মান ছাপুন; প্রত্যাশা লিখে মিলান'],
      ], 'এরর ধরন ও প্রথম পদক্ষেপ') +
      p('সবচেয়ে বিপজ্জনক বাগ শেষ সারিটি—কোনো এরর নেই, শুধু ভুল সংখ্যা। ML কোডে এটা খুব সাধারণ: মডেল “চলছে” কিন্তু শিখছে না। এজন্য প্রত্যাশিত মান আগে থেকে হাতে হিসাব করে রাখা জরুরি।'),
    analogy: {
      text: 'Debugging হলো ডাক্তারের রোগ নির্ণয়: উপসর্গ (এরর) শুনে অনুমান, পরীক্ষা (console.log), ফল দেখে অনুমান বাদ বা নিশ্চিত।',
      breaks: 'ডাক্তার রোগীর ওপর ইচ্ছামতো পরীক্ষা চালাতে পারেন না; প্রোগ্রামে আপনি একই ইনপুট হাজারবার চালাতে পারেন, ইনপুট বদলাতে পারেন—এই সুবিধা পুরোপুরি ব্যবহার করুন।',
    },
    worked:
      p('বাগ ১ (নীরব): <code>applyCoupon(1000, "eid10")</code> → ১০০০ (ছাড় নেই)। প্রত্যাশা ৯০০।') +
      ol([
        'অনুমান: কুপন খোঁজা ব্যর্থ। পরীক্ষা: <code>console.log(coupons[code])</code> → undefined।',
        'কারণ: coupons-এ key "EID10" (বড় হাতের), ইনপুট "eid10"। object key case-sensitive।',
        'সমাধান: <code>code.toUpperCase().trim()</code> দিয়ে স্বাভাবিক করা।',
      ]) +
      p('বাগ ২ (এরর): <code>applyCoupon(1000)</code> (কুপন ছাড়া) → <code>TypeError: cannot read property \'toUpperCase\' of undefined</code>।') +
      ol([
        'বার্তা পড়ি: undefined-এর ওপর toUpperCase। কোন মান undefined? code।',
        'কারণ: কুপন ঐচ্ছিক, কিন্তু কোড ধরে নিয়েছে সবসময় আছে।',
        'সমাধান: শুরুতে <code>if (!code) return total;</code>।',
      ]),
    activity: runnerNote,
    code: [
      {
        label: 'ডিসকাউন্ট ক্যালকুলেটর — দুটি বাগ খুঁজুন',
        starter: String.raw`const coupons = { EID10: 10, NEW50: 50 };   // শতাংশ

function applyCoupon(total, code) {
  const key = code.trim();
  const percent = coupons[key];
  const discount = total * percent / 100;
  return total - discount;
}

console.log("EID10:", applyCoupon(1000, "EID10"));   // 900
console.log("eid10:", applyCoupon(1000, "eid10"));   // 900 হওয়া উচিত
console.log("ভুল কোড:", applyCoupon(1000, "XYZ"));   // 1000 হওয়া উচিত
console.log("কুপন নেই:", applyCoupon(1000));         // 1000 হওয়া উচিত
`,
        solution: String.raw`const coupons = { EID10: 10, NEW50: 50 };

function applyCoupon(total, code) {
  if (!code) return total;                       // বাগ ২: কুপন ঐচ্ছিক
  const key = code.trim().toUpperCase();         // বাগ ১: case স্বাভাবিক
  const percent = coupons[key];
  console.log("  [debug] key =", key, "percent =", percent);
  if (percent === undefined) return total;       // অজানা কোড
  const discount = total * percent / 100;
  return total - discount;
}

console.log("EID10:", applyCoupon(1000, "EID10"));
console.log("eid10:", applyCoupon(1000, "eid10"));
console.log("ভুল কোড:", applyCoupon(1000, "XYZ"));
console.log("কুপন নেই:", applyCoupon(1000));
`,
        starterFails: 'error',
        expect: ['EID10: 900', 'eid10: 900', 'ভুল কোড: 1000', 'কুপন নেই: 1000'],
        hints: ['প্রথমে চালান। কোন লাইনে কী আসছে লিখুন: “eid10: NaN” কেন? NaN কোথা থেকে?', 'percent-এর মান ছাপান: console.log("percent =", percent)। undefined × 1000 / 100 = NaN।', 'শেষ লাইনে TypeError—code-এর মান কী? ঐচ্ছিক parameter না দিলে undefined হয়।'],
        test: '__assert(applyCoupon(500,"new50")===250,"new50 lower"); __assert(applyCoupon(500," EID10 ")===450,"trim");',
      },
    ],
    line: ul([
      'starter-এর “eid10” লাইনে এরর নেই কিন্তু ফল <code>NaN</code>—নীরব বাগ। percent = undefined, আর undefined দিয়ে গুণ = NaN।',
      '“ভুল কোড” লাইনেও একই NaN—অজানা কোড সামলানো হয়নি।',
      '“কুপন নেই” লাইনে TypeError, আর এর পরে কিছুই চলে না—একটি অধরা exception পুরো প্রোগ্রাম থামায়।',
      'সমাধানে <code>[debug]</code> লাইনটি মধ্যবর্তী মান দেখায়। কাজ শেষে এমন debug লাইন সরিয়ে ফেলা বা নিয়ন্ত্রিত logging-এ রাখা উচিত।',
    ]),
    why: p('এখানে প্রতিটি বাগ ইচ্ছাকৃতভাবে বাস্তবসম্মত: case-sensitivity, ঐচ্ছিক ইনপুট, অজানা মান। পরের অধ্যায়ে গ্রেডিয়েন্ট বা attention-এর কোডে ঠিক এভাবেই মধ্যবর্তী shape ও মান ছাপিয়ে ভুল খুঁজব।'),
    remember: ['পুনরুৎপাদন → বার্তা পড়া → অনুমান → পরীক্ষা → ছোট করা → ঠিক করা', 'TypeError: কোন মান undefined তা খুঁজুন', 'NaN দেখলে উৎসের দিকে পিছিয়ে যান', 'নীরব বাগের জন্য প্রত্যাশিত মান আগে লিখে রাখুন'],
    skip: ['ব্রাউজার DevTools-এর breakpoint (নিজের কম্পিউটারে শিখবেন)', 'stack trace-এর সব অংশ', 'অটোমেটেড টেস্ট ফ্রেমওয়ার্ক'],
    experiment: p('নিজে একটি বাগ ঢোকান: <code>total * percent / 100</code>-কে <code>total * percent / 10</code> করুন। এরর আসে না—কোন ইনপুটে আপনি সবচেয়ে দ্রুত ধরতে পারবেন যে ফল ভুল? (ইঙ্গিত: হাতে সহজে হিসাব করা যায় এমন সংখ্যা।)'),
    mistakes: ['এরর বার্তা না পড়ে কোড এলোমেলোভাবে বদলানো', 'একসাথে অনেক কিছু বদলানো—কোনটিতে কাজ হলো বোঝা যায় না', 'শুধু “সুখী পথ” (সঠিক ইনপুট) পরীক্ষা করা', 'debug লাইন রেখে দেওয়া যা ব্যক্তিগত তথ্য ছাপে'],
    quiz: [
      { q: '<code>TypeError: cannot read property \'name\' of undefined</code> বার্তার মূল অর্থ কী?', a: { a: 'name নামের variable নেই', b: 'যে মানের .name পড়তে চাওয়া হয়েছে সেটি undefined', c: 'সিনট্যাক্স ভুল' }, ok: 'b', why: 'বাম পাশের মানটি (যেমন products[10]) undefined—সেটি কেন undefined তা খুঁজতে হবে। নাম না থাকলে ReferenceError আসত।' },
      { q: 'কোড এরর ছাড়াই চলে কিন্তু ফল NaN। প্রথম পদক্ষেপ কোনটি?', a: { a: 'পুরো ফাংশন নতুন করে লেখা', b: 'হিসাবে ব্যবহৃত প্রতিটি মান ছাপিয়ে কোনটি অবৈধ তা দেখা', c: 'ব্রাউজার রিফ্রেশ করা' }, ok: 'b', why: 'NaN যেকোনো একটি অবৈধ মান থেকে ছড়ায়। মধ্যবর্তী মান ছাপিয়ে উৎসের দিকে পিছিয়ে গেলে কারণ পাওয়া যায়।' },
      { q: 'debugging-এ “ছোট করা” বলতে কী বোঝায়?', a: { a: 'কোড ছোট ফন্টে লেখা', b: 'সমস্যাটি এখনও ঘটে এমন সবচেয়ে ছোট ইনপুট/কোড খোঁজা', c: 'কম console.log ব্যবহার' }, ok: 'b', why: 'ছোট উদাহরণে অপ্রাসঙ্গিক জিনিস বাদ পড়ে, তাই কারণ দ্রুত দেখা যায়।' },
    ],
    recap: ['debugging একটি পদ্ধতি, অনুমানের খেলা নয়', 'এরর ধরন কারণ খোঁজার দিক দেখায়', 'নীরব বাগ সবচেয়ে বিপজ্জনক—প্রত্যাশিত মান লিখে রাখুন'],
    nextNote: 'অধ্যায় ২-এর সব দক্ষতা একসাথে—প্রজেক্ট:',
    sources: [['MDN — What went wrong? Troubleshooting JavaScript', 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/What_went_wrong'], ['MDN — JavaScript error reference', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors'], SRC.mdnErrors],
  },
  {
    id: 'les-02-07-project-support-bot',
    slug: 'project-support-assistant',
    title: 'প্রজেক্ট: Rule-based Support Assistant',
    minutes: 60,
    prereqs: ['les-02-06-debugging', 'les-01-08-rule-vs-examples'],
    summary: 'নিয়মভিত্তিক গ্রাহক-সাপোর্ট অ্যাসিস্ট্যান্ট: স্বাভাবিকীকরণ, intent শনাক্ত, fixture থেকে অর্ডার, সিদ্ধান্তের ট্রেস এবং ব্যর্থতার বিশ্লেষণ।',
    overview: p('অধ্যায় ২-এর সব কিছু একসাথে: একটি নিয়মভিত্তিক সাপোর্ট অ্যাসিস্ট্যান্ট যা মেসেজ স্বাভাবিক করে, কীওয়ার্ড-স্কোর দিয়ে intent (উদ্দেশ্য) বাছে, অর্ডার নম্বর থাকলে লোকাল fixture থেকে async-ভাবে স্ট্যাটাস আনে, এবং প্রতিটি সিদ্ধান্তের ট্রেস দেখায়। তারপর ইচ্ছাকৃতভাবে অস্পষ্ট, বানান-ভিন্ন ও নেতিবাচক মেসেজ দিয়ে দেখব সে কোথায় ব্যর্থ হয়—যা পরের অধ্যায়গুলোতে শেখা মডেলের প্রয়োজনীয়তা দেখায়। এটি কোনো AI মডেল নয় এবং কোনো নেটওয়ার্ক কল করে না।'),
    objectives: ['টেক্সট স্বাভাবিকীকরণ, intent স্কোরিং ও fallback সহ একটি সম্পূর্ণ পাইপলাইন বানাতে পারবেন', 'প্রতিটি সিদ্ধান্তের মধ্যবর্তী ধাপ (trace) দেখাতে পারবেন', 'অন্তত তিন ধরনের ব্যর্থতা খুঁজে কারণ ব্যাখ্যা করতে পারবেন'],
    problem: p('দোকানে রাত ১২টার পরেও মেসেজ আসে। মালিক চান একটি স্বয়ংক্রিয় প্রথম-সাড়া: সাধারণ প্রশ্নে (ডেলিভারি চার্জ, ফেরত নীতি, অর্ডার স্ট্যাটাস) তাৎক্ষণিক উত্তর, আর অনিশ্চিত হলে “সকালে একজন প্রতিনিধি উত্তর দেবেন”। শর্ত: ভুল তথ্য দেওয়ার চেয়ে “জানি না” বলা ভালো।'),
    explain:
      p('পাইপলাইন (ইনপুট → রূপান্তর → আউটপুট):') +
      ol([
        '<strong>Normalize:</strong> ছোট হাতের অক্ষর, বিরামচিহ্ন সরানো, অতিরিক্ত স্পেস বাদ। “ORD-17?” → “ord-17”।',
        '<strong>Extract:</strong> অর্ডার নম্বর খোঁজা (প্যাটার্ন: ord- তারপর অঙ্ক)।',
        '<strong>Score intents:</strong> প্রতিটি intent-এর কীওয়ার্ড তালিকা; মেসেজে যতগুলো মেলে ততো স্কোর।',
        '<strong>Decide:</strong> সর্বোচ্চ স্কোর নির্দিষ্ট সীমার (threshold) কম হলে বা দুটি intent সমান হলে → fallback (মানুষের কাছে)।',
        '<strong>Act:</strong> status intent ও অর্ডার নম্বর থাকলে fixture থেকে স্ট্যাটাস আনা (async)।',
        '<strong>Trace:</strong> প্রতিটি ধাপের মান ফেরত দেওয়া যাতে কেন এই উত্তর তা দেখা যায়।',
      ]) +
      p('<strong>নতুন সিনট্যাক্স:</strong> <code>/ord-(\\d+)/</code> হলো একটি <em>regular expression</em>—টেক্সটে প্যাটার্ন খোঁজার ছোট ভাষা। <code>\\d+</code> মানে “এক বা একাধিক অঙ্ক”। <code>text.match(regex)</code> মিললে একটি array দেয়, না মিললে null। এখানে শুধু এই একটি প্যাটার্ন ব্যবহার করব।') +
      warn('ডেলিভারি চার্জ ও ফেরত নীতির সংখ্যাগুলো এই প্রজেক্টের জন্য উদাহরণ। আসল দোকানে এগুলো দোকানের নিজস্ব নীতি থেকে আসবে, কোডে হার্ডকোড করা অনুমান থেকে নয়।'),
    analogy: {
      text: 'অ্যাসিস্ট্যান্ট হলো রাতের পাহারাদার যার হাতে একটি নির্দেশিকা-কার্ড: “কেউ ডেলিভারি চার্জ জিজ্ঞেস করলে এটা বলো; বুঝতে না পারলে লিখে রাখো, সকালে ম্যানেজার দেখবেন।”',
      breaks: 'পাহারাদার নতুন ধরনের প্রশ্ন শুনে বুদ্ধি খাটাতে পারেন; আমাদের অ্যাসিস্ট্যান্ট কার্ডের বাইরে এক পা-ও যায় না—“পাঠানোর খরচ” আর “ডেলিভারি চার্জ” একই জিনিস তা সে জানে না যদি না কীওয়ার্ড যোগ করা হয়।',
    },
    worked:
      p('মেসেজ: <q>ORD-17 এর ডেলিভারি স্ট্যাটাস কী?</q>') +
      table(['ধাপ', 'মান'], [
        ['normalize', '"ord-17 এর ডেলিভারি স্ট্যাটাস কী"'],
        ['extract', 'orderId = "ORD-17"'],
        ['score', 'status: ২ (স্ট্যাটাস, ord-), shipping: ১ (ডেলিভারি), returns: ০'],
        ['decide', 'সর্বোচ্চ status = ২ ≥ threshold ১, দ্বিতীয় ১ → টাই নয় → status'],
        ['act', 'fixture → "shipped"'],
        ['reply', '“অর্ডার ORD-17 এর অবস্থা: পাঠানো হয়েছে”'],
      ], 'একটি মেসেজের সম্পূর্ণ ট্রেস') +
      p('লক্ষ্য করুন “ডেলিভারি” শব্দ shipping-এর দিকেও টেনেছিল। ট্রেস না দেখলে আমরা জানতাম না সিদ্ধান্ত কত কাছাকাছি ছিল।'),
    activity: runnerNote + p('<strong>প্রজেক্ট মানদণ্ড:</strong> (১) প্রদত্ত ৮টি পরীক্ষা মেসেজের প্রতিটিতে ট্রেসসহ উত্তর, (২) অন্তত তিনটি ব্যর্থতার কারণ নিজের ভাষায় লেখা, (৩) একটি উন্নতি (নতুন কীওয়ার্ড বা নিয়ম) যোগ করে আগের সঠিক উত্তরগুলো ভাঙেনি তা দেখানো।'),
    code: [
      {
        label: 'প্রজেক্ট: নিয়মভিত্তিক সাপোর্ট অ্যাসিস্ট্যান্ট (AI মডেল নয়)',
        starter: String.raw`// ---- কনফিগারেশন (উদাহরণ নীতি) ----
const INTENTS = {
  shipping: { keywords: ["ডেলিভারি", "চার্জ", "শিপিং", "কত দিন"], reply: "ঢাকায় ডেলিভারি ৮০ টাকা, ঢাকার বাইরে ১৫০ টাকা।" },
  returns:  { keywords: ["ফেরত", "রিটার্ন", "বদল"], reply: "পণ্য হাতে পাওয়ার ৩ দিনের মধ্যে ফেরতের অনুরোধ করা যায়।" },
  status:   { keywords: ["স্ট্যাটাস", "কোথায়", "ord-", "পৌঁছাবে"], reply: null },
};
const THRESHOLD = 1;
const FALLBACK = "দুঃখিত, নিশ্চিত হতে পারছি না। একজন প্রতিনিধি সকালে উত্তর দেবেন।";

// ---- লোকাল fixture (আসল অর্ডার সিস্টেম নয়) ----
const ORDERS = { "ORD-17": "shipped", "ORD-21": "processing" };
const STATUS_BN = { shipped: "পাঠানো হয়েছে", processing: "প্রস্তুত হচ্ছে" };
const fakeOrderApi = (id) => Promise.resolve(ORDERS[id]);

// ---- পাইপলাইন ----
function normalize(text) {
  return text.toLowerCase().replace(/[?!,।]/g, " ").replace(/\s+/g, " ").trim();
}

function extractOrderId(text) {
  const m = text.match(/ord-(\d+)/);
  return m ? "ORD-" + m[1] : null;
}

function scoreIntents(text) {
  const scores = {};
  for (const name of Object.keys(INTENTS)) {
    scores[name] = INTENTS[name].keywords.filter((k) => text.includes(k)).length;
  }
  return scores;
}

function decide(scores) {
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [best, second] = ranked;
  if (best[1] < THRESHOLD) return { intent: null, why: "কোনো কীওয়ার্ড মেলেনি" };
  if (best[1] === second[1]) return { intent: null, why: "টাই: " + best[0] + " = " + second[0] };
  return { intent: best[0], why: best[0] + " স্কোর " + best[1] };
}

async function respond(message) {
  const text = normalize(message);
  const orderId = extractOrderId(text);
  const scores = scoreIntents(text);
  const decision = decide(scores);
  let reply = FALLBACK;
  if (decision.intent === "status") {
    if (!orderId) {
      reply = "অর্ডার নম্বর (যেমন ORD-17) দিলে স্ট্যাটাস দেখাতে পারব।";
    } else {
      const status = await fakeOrderApi(orderId);
      reply = status ? "অর্ডার " + orderId + " এর অবস্থা: " + STATUS_BN[status] : "অর্ডার " + orderId + " খুঁজে পাইনি।";
    }
  } else if (decision.intent) {
    reply = INTENTS[decision.intent].reply;
  }
  return { message, text, orderId, scores, decision: decision.why, reply };
}

// ---- পরীক্ষা ----
const tests = [
  "ORD-17 এর ডেলিভারি স্ট্যাটাস কী?",
  "ঢাকার বাইরে ডেলিভারি চার্জ কত?",
  "পণ্য ফেরত দিতে চাই",
  "ORD-99 কোথায়?",
  "আমার পার্সেল কবে আসবে",
  "ফেরত চাই না, শুধু ডেলিভারি কবে বলুন",
  "delivery charge koto?",
  "ধন্যবাদ!",
];

async function main() {
  for (const t of tests) {
    const r = await respond(t);
    console.log("▶ " + r.message);
    console.log("   scores=" + JSON.stringify(r.scores) + " | " + r.decision + " | order=" + r.orderId);
    console.log("   ↳ " + r.reply);
  }
}
main();
`,
        expect: ['অর্ডার ORD-17 এর অবস্থা: পাঠানো হয়েছে', 'ঢাকায় ডেলিভারি ৮০ টাকা', 'অর্ডার ORD-99 খুঁজে পাইনি', 'টাই: shipping = returns', 'কোনো কীওয়ার্ড মেলেনি'],
        hints: ['“আমার পার্সেল কবে আসবে” কেন fallback পেল? কোন কীওয়ার্ড নেই?', '“ফেরত চাই না…” মেসেজে টাই হলো—নিয়মভিত্তিক সিস্টেম “না” বোঝে না।', '“delivery charge koto?” বাংলিশ—কীওয়ার্ড তালিকায় নেই। distribution shift-এর উদাহরণ (অধ্যায় ১.৫)।', 'status কীওয়ার্ডে "কবে আসবে" যোগ করুন, তারপর সব ৮টি পরীক্ষা আবার দেখুন—কোনো আগের সঠিক উত্তর বদলে গেল কি?'],
        test: 'respond("ORD-21 কোথায়").then(function(r){ __assert(r.reply.indexOf("প্রস্তুত হচ্ছে")>=0,"order 21"); }); __assert(extractOrderId("ord-5 কোথায়")==="ORD-5","extract"); __assert(decide({a:0,b:0}).intent===null,"threshold");',
      },
    ],
    line: ul([
      '<code>normalize</code>: দুটি regex replace—প্রথমটি বিরামচিহ্নকে স্পেস বানায়, দ্বিতীয়টি (<code>/\\s+/g</code>) একাধিক স্পেসকে এক স্পেস। <code>g</code> মানে “সব জায়গায়”।',
      '<code>extractOrderId</code>: <code>m[1]</code> হলো বন্ধনীর ভেতরের অংশ (অঙ্কগুলো)। না মিললে null—পরে if দিয়ে যাচাই।',
      '<code>scoreIntents</code>: প্রতিটি intent-এর জন্য কতটি কীওয়ার্ড টেক্সটে আছে (<code>filter(...).length</code>)।',
      '<code>Object.entries(scores).sort(...)</code>: [নাম, স্কোর] জোড়ার array, বড় থেকে ছোট সাজানো। <code>const [best, second] = ranked</code> প্রথম দুটি বের করে।',
      '<code>decide</code>: threshold ও টাই—দুই অনিশ্চয়তায় fallback। এটি “ভুল তথ্যের চেয়ে জানি না ভালো” নীতির কোড রূপ।',
      '<code>respond</code> একটি পুরো ট্রেস object ফেরত দেয়—শুধু উত্তর নয়। পরে মূল্যায়ন (অধ্যায় ১২) এই ট্রেস দিয়েই হবে।',
    ]),
    why: p('প্রতিটি ধাপ আলাদা function হওয়ায় আলাদাভাবে পরীক্ষা ও বদলানো যায়। Fallback-কে প্রথম শ্রেণির ফল হিসেবে রাখা হয়েছে কারণ সাপোর্ট সিস্টেমে আত্মবিশ্বাসী ভুল উত্তর গ্রাহকের আস্থা নষ্ট করে। ট্রেস দেখানো হয়েছে যাতে কোনো সিদ্ধান্ত “কালো বাক্স” না থাকে।'),
    remember: ['পাইপলাইন: normalize → extract → score → decide → act', 'অনিশ্চিত হলে fallback—threshold ও টাই', 'ট্রেস ছাড়া ব্যর্থতা বোঝা যায় না', 'নিয়মভিত্তিক সিস্টেম অর্থ নয়, শব্দ মেলায়'],
    skip: ['regular expression-এর বাকি সিনট্যাক্স', 'Object.entries/sort-এর সব বিকল্প', 'বাস্তব চ্যাট প্ল্যাটফর্মে সংযোগ'],
    experiment: p('তিনটি পরিবর্তন একটি একটি করে করুন এবং প্রতিবার সব ৮টি পরীক্ষা দেখুন: (১) status-এ "কবে আসবে" যোগ, (২) shipping-এ "delivery", "charge" যোগ, (৩) "না" শব্দ থাকলে returns স্কোর থেকে ১ বাদ। কোন পরিবর্তন অন্য কোনো উত্তর ভেঙে দিল? এটিই regression—অধ্যায় ১২-এ এর পরীক্ষা স্বয়ংক্রিয় করব।'),
    mistakes: ['একটি মেসেজ ঠিক করতে গিয়ে অন্যগুলো পরীক্ষা না করা (regression)', 'fallback না রেখে সবসময় কোনো না কোনো উত্তর দেওয়া', 'fixture-এর অর্ডার ডেটাকে আসল ধরে নেওয়া', 'কীওয়ার্ড তালিকা বাড়াতে বাড়াতে নিয়ম পরস্পরবিরোধী করে ফেলা'],
    solutionNote: p('প্রত্যাশিত ব্যর্থতাগুলো: “আমার পার্সেল কবে আসবে” — কোনো কীওয়ার্ড নেই (শব্দভাণ্ডারের ফাঁক)। “ফেরত চাই না…” — shipping ও returns টাই, কারণ নিয়ম নেতিবাচকতা বোঝে না। “delivery charge koto?” — বাংলিশ ইনপুট, তালিকায় নেই (distribution shift)। “ধন্যবাদ!” — fallback ঠিক আছে, কিন্তু আদর্শভাবে একটি ভদ্র উত্তর দেওয়া যেত। প্রতিটি সমাধানে নতুন নিয়ম লাগে, আর নিয়ম বাড়লে পারস্পরিক সংঘর্ষ বাড়ে—এটিই শেখা মডেলের দিকে যাওয়ার কারণ। কিন্তু মনে রাখুন, শেখা মডেলেরও fallback ও ট্রেস লাগবে।'),
    quiz: [
      { q: '“ফেরত চাই না, শুধু ডেলিভারি কবে বলুন” মেসেজে অ্যাসিস্ট্যান্ট fallback দিল কেন?', a: { a: 'অর্ডার নম্বর নেই', b: 'shipping ও returns স্কোর সমান (টাই)—নিয়ম “না”-এর অর্থ ধরে না', c: 'মেসেজ খুব লম্বা' }, ok: 'b', why: '“ফেরত” returns-এ, “ডেলিভারি” shipping-এ ১ করে যোগ করে। কীওয়ার্ড গোনা নেতিবাচক অর্থ বোঝে না, তাই টাই হয়ে fallback।' },
      { q: 'threshold ও টাই নিয়মের মূল উদ্দেশ্য কী?', a: { a: 'কোড ছোট রাখা', b: 'অনিশ্চিত ক্ষেত্রে ভুল উত্তরের বদলে মানুষের কাছে পাঠানো', c: 'দ্রুত উত্তর দেওয়া' }, ok: 'b', why: 'সাপোর্টে আত্মবিশ্বাসী ভুল উত্তর ক্ষতিকর। অনিশ্চয়তা শনাক্ত হলে fallback নিরাপদ।' },
      { q: 'একটি নতুন কীওয়ার্ড যোগ করার পর সবচেয়ে জরুরি কাজ কোনটি?', a: { a: 'শুধু নতুন মেসেজটি পরীক্ষা করা', b: 'আগের সব পরীক্ষা মেসেজ আবার চালিয়ে দেখা কোনোটি বদলেছে কি না', c: 'কোড কমেন্ট মুছে ফেলা' }, ok: 'b', why: 'একটি কীওয়ার্ড অন্য intent-এর স্কোরও বদলাতে পারে। পুরনো পরীক্ষা আবার চালানোই regression ধরার উপায়।' },
      { q: 'fakeOrderApi-কে আসল অর্ডার API দিয়ে বদলালে কী অতিরিক্ত সামলাতে হবে?', a: { a: 'কিছুই না', b: 'timeout, নেটওয়ার্ক এরর ও অনুমোদিত ব্যবহারকারীর অর্ডারই দেখানো', c: 'শুধু JSON.stringify' }, ok: 'b', why: 'আসল API ধীর বা ব্যর্থ হতে পারে, আর একজন গ্রাহককে অন্যের অর্ডার দেখানো গোপনীয়তা লঙ্ঘন। fixture-এ এগুলো নেই।' },
    ],
    recap: ['সম্পূর্ণ পাইপলাইন ট্রেসসহ বানালেন', 'নিয়মভিত্তিক সিস্টেমের তিন ব্যর্থতা: শব্দভাণ্ডারের ফাঁক, নেতিবাচকতা, ভিন্ন লিপি', 'fallback ও regression পরীক্ষা যেকোনো AI সিস্টেমেও লাগবে'],
    nextNote: 'নিয়মের সীমা দেখলেন। শেখা মডেল বুঝতে প্রথমে লাগবে গণিত—অধ্যায় ৩ (লগইন প্রয়োজন, বিনামূল্যে):',
    synthetic: true,
    sources: [['MDN — Regular expressions guide', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions'], SRC.mdnAsync, SRC.jurafsky],
  },
];

export default { chapter, lessons };

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { p, ul, ol, code, out, note, warn, table, term, SRC } from './lib.mjs';

const chapter = {
  id: 'ch-13-js-to-python-pytorch',
  slug: 'javascript-to-python-pytorch',
  title: 'JavaScript থেকে Python ও PyTorch',
  order: 13,
  public: false,
  summary: 'JavaScript জানা শিক্ষার্থীর জন্য Python: সিনট্যাক্সের মিল-অমিল, list/dict, function, class, module ও virtual environment; NumPy array ও broadcasting; PyTorch tensor, shape, device, autograd, Dataset/DataLoader, training loop ও checkpoint; দুটি প্রজেক্ট—অধ্যায় ৫-এর নেটওয়ার্ক PyTorch-এ এবং একটি ছোট character-level language model।',
  overview: p(
    'এখন পর্যন্ত সব কোড ছিল JavaScript, যাতে ব্রাউজারেই চালানো যায়। বাস্তবের মডেল-প্রশিক্ষণ কিন্তু প্রায় সবই হয় Python-এ, NumPy ও PyTorch-এর মতো লাইব্রেরি দিয়ে। এই অধ্যায় সেই সেতু: প্রতিটি নতুন Python ধারণা আগে JavaScript-এর পরিচিত জিনিসের সাথে মিলিয়ে ব্যাখ্যা করা হবে, তারপর ব্যবহার।',
    'Python কোড এই সাইটে চলে না। তাই প্রতিটি Python উদাহরণ লেখকের কম্পিউটারে সত্যিই চালানো হয়েছে, আর আউটপুটের উপরে লেখা আছে কোন কম্পিউটার ও কোন ভার্সনে। সেটআপ নির্দেশনা একটি নতুন virtual environment-এ পরীক্ষা করা; যেগুলো পরীক্ষা করা হয়নি (Windows, Linux, GPU), সেগুলো স্পষ্টভাবে “পরীক্ষিত নয়” লেখা। প্রতিটি পাঠে একটি JavaScript সঙ্গী-অনুশীলনও আছে, যা এখানেই চালানো যায়।'
  ),
};

const RUN = JSON.parse(readFileSync(new URL('./python/outputs.json', import.meta.url), 'utf8'));
const ENV = RUN.env;
const MAC = ENV.system.replace(/^Darwin\s*/, '');
const RAN_LABEL = `চালানো আউটপুট, নমুনা নয়—${RUN.ranAt}, macOS ${MAC} (${ENV.machine}), Python ${ENV.python}, PyTorch ${ENV.torch} (হিসাব CPU-তে), NumPy ${ENV.numpy}। অন্য কম্পিউটার বা ভার্সনে দশমিকের শেষ অঙ্ক ভিন্ন হতে পারে:`;

function py(file, label) {
  const key = 'ch13/' + file;
  const src = readFileSync(new URL('./python/ch13/' + file, import.meta.url));
  const r = RUN.files[key];
  if (!r || !r.ok) throw new Error(`python output missing or failed: ${key} — run scripts/run-python.mjs`);
  if (createHash('sha256').update(src).digest('hex') !== r.sha256) throw new Error(`stale python output: ${key} — run scripts/run-python.mjs`);
  return { label, lang: 'python', starter: src.toString('utf8'), sample_output: r.stdout, sample_label: RAN_LABEL, executed: true };
}
const outOf = (file) => RUN.files['ch13/' + file].stdout;
const ms = (file) => RUN.files['ch13/' + file].ms;

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

const SETUP = String.raw`# macOS / Linux (টার্মিনালে)
python3 -m venv .venv
source .venv/bin/activate
pip install torch==2.8.0 numpy==2.0.2
python -c "import torch, numpy, sys; print('OK', sys.version.split()[0], torch.__version__, numpy.__version__)"

# Windows (PowerShell) — এই কোর্সে পরীক্ষা করা হয়নি
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install torch==2.8.0 numpy==2.0.2`;

const lessons = [
  {
    id: 'les-13-01-js-to-python-syntax',
    slug: 'javascript-to-python-syntax',
    title: 'JavaScript থেকে Python: সিনট্যাক্স, list ও dict',
    minutes: 45,
    prereqs: ['les-12-06-project-ecommerce-assistant'],
    summary: 'indentation-এ ব্লক, let/const ছাড়া ভেরিয়েবল, list ও dict, tuple unpacking, comprehension, f-string, None/True, // ও %, slicing, KeyError বনাম undefined, এবং reference শেয়ার—JavaScript-এর পাশে পাশে।',
    overview: p('JavaScript জানলে Python-এর বেশিরভাগই চেনা লাগবে; পার্থক্য কয়েকটি জায়গায়, এবং সেগুলোই বাগের উৎস। এই পাঠে একই দোকানের ডেটা দুই ভাষায় লিখে প্রতিটি পার্থক্য আলাদা করে দেখব: ব্লক কীভাবে বোঝানো হয়, list ও dict, ফাংশনের ডিফল্ট আর্গুমেন্ট, comprehension, ঋণাত্মক সংখ্যার ভাগ, আর অনুপস্থিত key-এর আচরণ।'),
    objectives: ['JavaScript-এর একটি ছোট প্রোগ্রাম Python-এ রূপান্তর করতে পারবেন', 'indentation, comprehension, f-string ও tuple unpacking পড়তে ও লিখতে পারবেন', 'দুই ভাষার আচরণ যেখানে আলাদা (// ও %, অনুপস্থিত key, == বনাম is) তা চিহ্নিত করতে পারবেন'],
    problem: p('ধরুন একটি PyTorch উদাহরণ পড়ছেন: <code>[sku for sku, n in stock.items() if n &gt; 0]</code>। বন্ধনী নেই, <code>function</code> নেই, <code>;</code> নেই। আবার <code>-7 // 2</code> লিখে আপনি −৩ আশা করলেন, এল −৪। এগুলো না জানলে Python কোড পড়া ধীর, আর ভুল ধরা কঠিন।'),
    explain:
      p('<strong>ব্লক:</strong> JavaScript-এ <code>{ }</code>; Python-এ লাইনের শেষে <code>:</code> আর পরের লাইনগুলো একই পরিমাণ ডানে সরানো (সাধারণত ৪ space)। indentation এখানে সাজসজ্জা নয়, ব্যাকরণ। tab ও space মেশালে <code>IndentationError</code> বা <code>TabError</code> হয়।') +
      p('<strong>ভেরিয়েবল:</strong> <code>let</code>/<code>const</code> নেই; <code>x = 5</code> লিখলেই তৈরি। <code>const</code>-এর মতো “বদলানো যাবে না” নিয়ম ভাষায় নেই—শুধু নামকরণের রীতি (<code>MAX_CALLS</code>)।') +
      table(['JavaScript', 'Python', 'মন্তব্য'], [
        ['<code>[1, 2]</code> (array)', '<code>[1, 2]</code> (list)', 'একই রকম; <code>push</code> → <code>append</code>, <code>length</code> → <code>len(x)</code>'],
        ['<code>{ a: 1 }</code> (object)', '<code>{"a": 1}</code> (dict)', 'key-তে উদ্ধৃতিচিহ্ন লাগে; <code>d.a</code> চলে না, <code>d["a"]</code>'],
        ['<code>[a, b] = pair</code>', '<code>a, b = pair</code>', 'tuple unpacking; <code>(a, b)</code> হলো tuple—পরিবর্তন করা যায় না এমন list'],
        ['<code>null</code> / <code>undefined</code>', '<code>None</code>', 'একটিই “কিছু নেই” মান; তুলনা <code>x is None</code>'],
        ['<code>true</code>, <code>&amp;&amp;</code>, <code>||</code>, <code>!</code>', '<code>True</code>, <code>and</code>, <code>or</code>, <code>not</code>', 'বড় হাতের T/F'],
        ['<code>`${a} টাকা`</code>', '<code>f"{a} টাকা"</code>', 'f-string; <code>{a:,}</code> হাজারে কমা দেয়'],
        ['<code>arr.filter(...).map(...)</code>', '<code>[f(x) for x in arr if cond]</code>', 'list comprehension'],
        ['<code>arr.forEach((x, i) =&gt; ...)</code>', '<code>for i, x in enumerate(arr):</code>', ''],
        ['<code>Math.floor(7 / 2)</code>', '<code>7 // 2</code>', 'floor division; <code>/</code> সবসময় দশমিক দেয়'],
        ['<code>obj.missing</code> → <code>undefined</code>', '<code>d["missing"]</code> → <code>KeyError</code>', 'নিরাপদে পেতে <code>d.get("missing", ডিফল্ট)</code>'],
        ['<code>try { } catch (e) { }</code>', '<code>try: ... except KeyError as e: ...</code>', 'নির্দিষ্ট ধরনের ত্রুটি ধরা হয়'],
      ], 'JavaScript → Python: সবচেয়ে বেশি দরকারি মিল') +
      p('<strong>ফাংশন:</strong> <code>def total(items, delivery=0):</code>—ডিফল্ট আর্গুমেন্ট আছে, আর ডাকার সময় নাম ধরে দেওয়া যায়: <code>total(items, delivery=130)</code>। ফাংশনের প্রথম লাইনে <code>"""..."""</code> হলো docstring—ফাংশনের বিবরণ।') +
      p('<strong>comprehension:</strong> <code>[sku for sku, n in stock.items() if n &gt; 0]</code> পড়ুন বাঁ থেকে: “প্রতিটি (sku, n) জোড়ার জন্য, যদি n &gt; ০ হয়, sku নাও”। <code>stock.items()</code> JavaScript-এর <code>Object.entries(stock)</code>-এর মতো। বন্ধনী ছাড়া <code>sum(p * q for p, q in items)</code> হলো generator expression—list না বানিয়ে একটি একটি করে মান দেয়।') +
      p('<strong>reference:</strong> দুই ভাষাতেই <code>b = a</code> list কপি করে না, একই list-এর আরেকটি নাম দেয়। কপি চাইলে <code>a.copy()</code> বা <code>list(a)</code>। <code>is</code> দেখে দুটি নাম একই বস্তু কিনা; <code>==</code> দেখে মান সমান কিনা।'),
    analogy: {
      text: 'JavaScript থেকে Python হলো ঢাকার বাংলা থেকে চট্টগ্রামের বাংলা শোনা: বেশিরভাগ শব্দ চেনা, কয়েকটি শব্দ একই রকম শোনালেও মানে আলাদা—আর সেগুলোতেই ভুল বোঝাবুঝি হয়।',
      breaks: 'আঞ্চলিক ভাষায় প্রসঙ্গ দেখে মানে আন্দাজ করা যায়; প্রোগ্রামিং ভাষা আন্দাজ করে না। <code>-7 % 3</code> একটিতে −১, অন্যটিতে ২—দুটিই নিজের নিয়মে সঠিক, এবং কোনো সতর্কবার্তা ছাড়াই।',
    },
    worked:
      p('পাশের Python ফাইলের আউটপুট থেকে কয়েকটি লাইন মিলিয়ে দেখি:') +
      ol([
        '<code>total([(1200, 2), (950, 1)], delivery=130)</code> = ১২০০×২ + ৯৫০×১ + ১৩০ = <strong>৩৪৮০</strong>।',
        '<code>f"{prices[i]:,}"</code> → <code>1,200</code>; JavaScript-এ এই কোর্সে আমরা regex দিয়ে কমা দিই (QuickJS-এ <code>Intl</code> নেই)।',
        '<code>7 / 2</code> = ৩.৫, <code>7 // 2</code> = ৩; কিন্তু <code>-7 // 2</code> = <strong>−৪</strong> (নিচের দিকে floor), আর <code>-7 % 3</code> = <strong>২</strong>। JavaScript-এ <code>-7 % 3</code> = −১।',
        '<code>len(names[0])</code> = ১৪: “নীল সুতি শাড়ি”-তে ১৪টি Unicode কোড পয়েন্ট (স্বরচিহ্ন ও নুক্তা আলাদা গোনা হয়, অধ্যায় ৬-এর মতো)। Python-এর <code>len</code> কোড পয়েন্ট গোনে; JavaScript-এর <code>.length</code> গোনে UTF-16 একক—বাংলায় দুটি এখানে সমান, emoji-তে নয়।',
        '<code>stock["SCARF-RED"]</code> → <code>KeyError</code>; JavaScript হলে চুপচাপ <code>undefined</code> আসত এবং ভুলটা পরে কোথাও ধরা পড়ত।',
      ]),
    activity: p('নিচে প্রথমে JavaScript সংস্করণ (এখানেই চালান), তারপর হুবহু একই কাজের Python সংস্করণ ও তার চালানো আউটপুট। দুটি আউটপুট লাইন ধরে মেলান; যেখানে আলাদা (<code>-7 % 3</code>, অনুপস্থিত key), সেটির কারণ লিখুন।'),
    code: [
      {
        label: 'JavaScript সংস্করণ (এখানে চালানো যায়)',
        starter: String.raw`const prices = [1200, 950, 1850];
const names = ["নীল সুতি শাড়ি", "সবুজ কুর্তি", "লন থ্রি-পিস"];
const stock = { "SAREE-BLUE": 8, "KURTI-GRN": 3, "LAWN-3PC": 0 };

function total(items, delivery = 0) {
  return items.reduce((s, [price, qty]) => s + price * qty, 0) + delivery;
}
console.log("মোট:", total([[1200, 2], [950, 1]], 130));

const inStock = Object.entries(stock).filter(([, n]) => n > 0).map(([sku]) => sku);
console.log("স্টকে আছে:", inStock);

const comma = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
names.forEach((name, i) => console.log(i + ": " + name + " — " + comma(prices[i]) + " টাকা"));

console.log("null ও bool:", null === null, true && !false);
console.log("ভাগ:", 7 / 2, Math.floor(7 / 2), 7 % 2, 2 ** 10);
console.log("ঋণাত্মক:", Math.floor(-7 / 2), -7 % 3);
console.log("স্লাইস:", prices.slice(1), prices[prices.length - 1], [...names[0]].length);
console.log("অনুপস্থিত key:", stock["SCARF-RED"], "| ডিফল্টসহ:", stock["SCARF-RED"] ?? "নেই");

const a = [1, 2];
const b = a;
b.push(3);
console.log("একই array:", a, "| কপি একই বস্তু?", [...a] === a);
`,
        expect: ['মোট: 3480', 'স্টকে আছে: ["SAREE-BLUE","KURTI-GRN"]', '0: নীল সুতি শাড়ি — 1,200 টাকা', 'ঋণাত্মক: -4 -1', 'স্লাইস: [950,1850] 1850 14', 'অনুপস্থিত key: undefined | ডিফল্টসহ: নেই', 'একই array: [1,2,3]'],
        hints: ['Python আউটপুটের “ঋণাত্মক: -4 2” লাইনের সাথে মেলান—কোন সংখ্যাটি আলাদা?', 'JavaScript-এ Python-এর মতো ধনাত্মক ভাগশেষ পেতে: ((x % m) + m) % m।', '[...names[0]].length কোড পয়েন্ট গোনে, names[0].length UTF-16 একক—বাংলায় দুটি সমান কিনা দেখুন।'],
        test: '__assert(total([[1200,2],[950,1]],130)===3480,"total"); __assert(inStock.length===2,"in stock"); __assert(-7 % 3===-1,"js remainder"); __assert(((-7 % 3)+3)%3===2,"python-like remainder"); __assert([...names[0]].length===14 && names[0].length===14,"code points = utf16 units here");',
      },
      py('01_syntax.py', 'Python সংস্করণ (লেখকের কম্পিউটারে চালানো)'),
    ],
    line: ul([
      '<code>def total(items, delivery=0):</code> — <code>:</code>-এর পরের indented লাইনগুলো ফাংশনের শরীর।',
      '<code>sum(price * qty for price, qty in items)</code> — প্রতিটি tuple খুলে <code>price</code>, <code>qty</code>; JavaScript-এর <code>reduce</code>-এর কাজ।',
      '<code>for i, name in enumerate(names):</code> — <code>enumerate</code> (index, মান) জোড়া দেয়।',
      '<code>prices[1:]</code>, <code>prices[-1]</code> — slicing ও ঋণাত্মক index; JavaScript-এ <code>slice(1)</code> ও <code>arr[arr.length - 1]</code>।',
      '<code>except KeyError as e:</code> — শুধু এই ধরনের ত্রুটি ধরা; অন্য ত্রুটি উপরে চলে যায়।',
      '<code>a.copy() is a</code> → <code>False</code>: কপি নতুন বস্তু।',
    ]),
    why: p('দুই ভাষায় একই প্রোগ্রাম পাশাপাশি রাখায় নতুন সিনট্যাক্স মুখস্থ করতে হয় না—পরিচিত জিনিসের নতুন নাম শেখা হয়। পার্থক্যগুলো (<code>%</code>, KeyError) ইচ্ছা করে রাখা হয়েছে, কারণ PyTorch কোডে index ও ভাগশেষের হিসাবে এগুলোই নীরব বাগ তৈরি করে।'),
    remember: ['indentation = ব্লক', 'list/dict ≈ array/object; dict-এ d["key"]', 'comprehension: [প্রকাশ for x in সংগ্রহ if শর্ত]', '// floor করে; ঋণাত্মকে % দুই ভাষায় আলাদা', 'অনুপস্থিত key → KeyError; নিরাপদ পথ d.get()'],
    skip: ['set ও frozenset-এর সব method', 'walrus অপারেটর (:=)', 'decorator লেখা (পরের পাঠে শুধু ব্যবহার দেখব)'],
    experiment: p('Python-এ <code>def add_item(x, bag=[]): bag.append(x); return bag</code> লিখে দুবার <code>add_item(1)</code> ডাকলে কী আসবে, আগে অনুমান করুন। (উত্তর: দ্বিতীয়বার <code>[1, 1]</code>—ডিফল্ট list একবারই তৈরি হয়।) JavaScript-এ <code>function addItem(x, bag = [])</code>-তে প্রতিবার নতুন array—উপরের JS এডিটরে যাচাই করুন।'),
    mistakes: ['tab ও space মেশানো indentation', '<code>d.key</code> লেখা (dict-এ চলে না; <code>d["key"]</code>)', '<code>x == None</code> (রীতি হলো <code>x is None</code>)', 'list-কে ডিফল্ট আর্গুমেন্ট বানানো (<code>bag=[]</code>)—সব ডাকে একই list', '<code>b = a</code>-কে কপি ভাবা', '<code>-7 // 2</code>-কে −৩ ধরা'],
    solutionNote: p('দুটি আউটপুট প্রায় হুবহু মেলে (QuickJS-এ চালানো JavaScript ও লেখকের কম্পিউটারে চালানো Python)। পার্থক্য দুটি জায়গায়: <code>-7 % 3</code> JavaScript-এ −১, Python-এ ২—JavaScript-এর % ভাগশেষের চিহ্ন ভাজ্যের মতো রাখে, Python-এরটা ভাজকের মতো। আর অনুপস্থিত key-তে JavaScript <code>undefined</code> দেয়, Python <code>KeyError</code> তোলে। list-এর প্রিন্ট ফরম্যাটও আলাদা: এই সাইটের কনসোল array-কে JSON হিসেবে (<code>["SAREE-BLUE","KURTI-GRN"]</code>), Python list-কে নিজের রূপে (<code>[\'SAREE-BLUE\', \'KURTI-GRN\']</code>) দেখায়।'),
    quiz: [
      { q: 'Python-এ <code>-7 // 2</code>-এর মান?', a: { a: '−৩', b: '−৪', c: '−৩.৫' }, ok: 'b', why: '<code>//</code> floor division—সংখ্যারেখায় নিচের দিকে, তাই −৩.৫ থেকে −৪।' },
      { q: '<code>stock = {"A": 1}</code>; <code>stock["B"]</code> লিখলে?', a: { a: 'None আসে', b: 'KeyError ত্রুটি', c: '0 আসে' }, ok: 'b', why: 'Python অনুপস্থিত key-তে ত্রুটি তোলে; ডিফল্ট চাইলে <code>stock.get("B", 0)</code>।' },
      { q: '<code>[n * 2 for n in nums if n &gt; 0]</code>-এর JavaScript সমতুল্য?', a: { a: '<code>nums.filter(n =&gt; n &gt; 0).map(n =&gt; n * 2)</code>', b: '<code>nums.map(n =&gt; n * 2).filter(n =&gt; n &gt; 0)</code>', c: '<code>nums.reduce(...)</code> ছাড়া সম্ভব নয়' }, ok: 'a', why: 'comprehension আগে শর্ত দিয়ে বাছাই করে, তারপর প্রকাশটি প্রয়োগ করে। (b)-ও এখানে একই ফল দেয় কারণ ধনাত্মকের দ্বিগুণ ধনাত্মক, কিন্তু সাধারণভাবে ক্রম আলাদা।' },
    ],
    recap: ['Python-এ ব্লক indentation দিয়ে', 'list, dict, tuple, comprehension, f-string', 'নীরব পার্থক্য: ঋণাত্মক %, অনুপস্থিত key, reference শেয়ার'],
    nextNote: 'সিনট্যাক্স হলো। এবার ফাংশন, class, module আর পরীক্ষিত সেটআপ:',
    synthetic: true,
    sources: [SRC.pythonTut, ['Python Tutorial: Data Structures (list, dict, comprehension)', 'https://docs.python.org/3/tutorial/datastructures.html'], SRC.mdnGuide],
  },
  {
    id: 'les-13-02-functions-classes-modules-env',
    slug: 'python-classes-modules-environments',
    title: 'Function, class, module ও virtual environment',
    minutes: 50,
    prereqs: ['les-13-01-js-to-python-syntax'],
    summary: '__init__, self, __call__, __repr__ ও dataclass; import ও if __name__ == "__main__"; venv ও pip দিয়ে পিন করা ভার্সন; পরীক্ষিত সেটআপ, CPU-তে কাজের ধারণা এবং GPU-র জন্য নির্দেশনা—গতির কোনো প্রতিশ্রুতি ছাড়া।',
    overview: p('PyTorch-এর প্রতিটি মডেল একটি Python class, আর প্রতিটি প্রজেক্ট কয়েকটি module ও নির্দিষ্ট ভার্সনের লাইব্রেরির উপর দাঁড়িয়ে। এই পাঠে class-এর Python রূপ (<code>self</code>, <code>__init__</code>, <code>__call__</code>) JavaScript class-এর পাশে দেখব, তারপর virtual environment বানিয়ে পিন করা ভার্সন ইনস্টল করব—ঠিক যে কমান্ডগুলো এই কোর্সের জন্য একটি নতুন environment-এ চালিয়ে পরীক্ষা করা হয়েছে।'),
    objectives: ['Python class-এ __init__, self ও __call__-এর ভূমিকা ব্যাখ্যা করতে পারবেন', 'module import ও if __name__ == "__main__"-এর কাজ বুঝবেন', 'virtual environment বানিয়ে পিন করা ভার্সনে PyTorch ও NumPy ইনস্টল ও যাচাই করতে পারবেন'],
    problem: p('কারো কম্পিউটারে চলা কোড আপনারটায় চলে না—ত্রুটি আসে “module has no attribute” বা ফল আলাদা। প্রায়ই কারণ লাইব্রেরির ভার্সন আলাদা, অথবা সব প্রজেক্ট একই global Python-এ ইনস্টল করা। আরেকটি প্রশ্ন: <code>model(x)</code> লিখলে একটি বস্তুকে ফাংশনের মতো ডাকা যায় কীভাবে?'),
    explain:
      p('<strong>class:</strong> JavaScript-এর <code>constructor</code> = Python-এর <code>__init__</code>। <code>this</code>-এর বদলে <code>self</code>, এবং সেটি প্রতিটি method-এর প্রথম প্যারামিটার হিসেবে স্পষ্টভাবে লিখতে হয়। দুই underscore-যুক্ত নামগুলো (<code>__init__</code>, <code>__repr__</code>, <code>__call__</code>) বিশেষ method: <code>__repr__</code> ঠিক করে print-এ বস্তুটি কেমন দেখাবে, <code>__call__</code> থাকলে বস্তুকে <code>n(x)</code> লিখে ডাকা যায়। PyTorch-এর <code>model(x)</code> ঠিক এভাবেই ভেতরে <code>forward</code> ডাকে।') +
      p('<strong>decorator ও dataclass:</strong> class-এর উপরে <code>@dataclass</code> হলো decorator—একটি ফাংশন যা class-টি নিয়ে তাতে স্বয়ংক্রিয়ভাবে <code>__init__</code> ও <code>__repr__</code> যোগ করে। <code>sku: str</code>-এর মতো type hint শুধু তথ্য; Python চালানোর সময় তা যাচাই করে না। <code>Optional[int]</code> মানে int অথবা None।') +
      p('<strong>module:</strong> প্রতিটি <code>.py</code> ফাইল একটি module। <code>shop.py</code>-তে <code>Product</code> থাকলে অন্য ফাইলে <code>from shop import Product</code>। ফাইলটি সরাসরি চালালে (<code>python shop.py</code>) Python <code>__name__</code>-কে <code>"__main__"</code> রাখে, import করলে <code>"shop"</code>। তাই <code>if __name__ == "__main__": main()</code> মানে “শুধু সরাসরি চালালে এটা করো, import-এর সময় নয়”—JavaScript ES module-এ এর সরাসরি সমতুল্য নেই।') +
      p('<strong>virtual environment:</strong> প্রতিটি প্রজেক্টের জন্য আলাদা একটি ফোল্ডার (<code>.venv</code>), যেখানে সেই প্রজেক্টের লাইব্রেরি থাকে—<code>node_modules</code>-এর মতো। <code>pip install torch==2.8.0</code>-এ <code>==</code> ভার্সন পিন করে। প্রজেক্টে <code>requirements.txt</code> ফাইলে এই লাইনগুলো রাখলে অন্যরা <code>pip install -r requirements.txt</code> দিয়ে একই ভার্সন পায়—<code>package-lock.json</code>-এর কাছাকাছি (যদিও পরোক্ষ dependency পিন হয় না)।') +
      p('<strong>এই কোর্সের পরীক্ষিত সেটআপ:</strong>') +
      code(SETUP, 'bash') +
      table(['কী', 'অবস্থা'], [
        [`macOS ${MAC} (${ENV.machine}), Python ${ENV.python}, নতুন venv-এ উপরের macOS কমান্ড`, `<strong>পরীক্ষিত</strong> (${RUN.ranAt})—শেষ লাইন ছাপে <code>OK ${ENV.python} ${ENV.torch} ${ENV.numpy}</code>`],
        ['Linux, Windows, অন্য Python ভার্সন', '<strong>পরীক্ষিত নয়</strong>। pip উপযুক্ত wheel না পেলে ত্রুটি দেবে; তখন pytorch.org-এর ইনস্টল নির্বাচক দেখুন'],
        ['NVIDIA GPU (CUDA)', '<strong>পরীক্ষিত নয়</strong>। CUDA-যুক্ত PyTorch-এর জন্য pytorch.org নির্বাচক থেকে আপনার CUDA ভার্সনের কমান্ড নিন; সাধারণ <code>pip install torch</code> সব প্ল্যাটফর্মে GPU সমর্থন দেয় না'],
        ['Apple Silicon GPU (MPS)', 'লেখকের কম্পিউটারে <code>torch.backends.mps.is_available()</code> = True পাওয়া গেছে, কিন্তু এই অধ্যায়ের সব হিসাব CPU-তে চালানো'],
      ], 'কোনটি পরীক্ষা করা হয়েছে, কোনটি হয়নি') +
      note(`<strong>হার্ডওয়্যার ও ডেটার অনুমান:</strong> এই অধ্যায়ের সব উদাহরণ ছোট সিন্থেটিক ডেটায় CPU-তে চলে; GPU লাগে না। লেখকের কম্পিউটারে প্রতিটি ফাইল (import-সহ) ${Math.min(...Object.values(RUN.files).map((f) => f.ms))}–${Math.max(...Object.values(RUN.files).map((f) => f.ms)).toLocaleString('en-US')} মিলিসেকেন্ডে শেষ হয়েছে—এটি একটি মাপা ফল, প্রতিশ্রুতি নয়; পুরনো কম্পিউটারে বেশি লাগতে পারে। PyTorch ও NumPy-র ডাউনলোড কয়েকশো মেগাবাইট; জায়গা ও ইন্টারনেট সংযোগ লাগবে।`),
    analogy: {
      text: 'virtual environment হলো প্রতিটি রান্নার জন্য আলাদা মশলার বাক্স: বিরিয়ানির বাক্সে যে মশলা, পায়েসের বাক্সে তা মেশে না; আর বাক্সের গায়ে লেখা থাকে কোন মশলা কতটুকু (requirements.txt)।',
      breaks: 'মশলা নিজে নিজে বদলায় না, কিন্তু পিন না করা লাইব্রেরি পরের ইনস্টলে নতুন ভার্সন হয়ে আসতে পারে। আর বাক্সে লেখা থাকলেও অন্য কম্পিউটারের “চুলা” (অপারেটিং সিস্টেম, CPU/GPU) আলাদা হলে ফল সামান্য আলাদা হতে পারে।',
    },
    worked:
      p('Python আউটপুট মিলিয়ে দেখি:') +
      ol([
        '<code>print(p)</code> → <code>Product(sku=\'KURTI-GRN\', ...)</code>: এই সুন্দর রূপ <code>@dataclass</code>-এর বানানো <code>__repr__</code> থেকে।',
        '<code>n([3.0, 4.0])</code>: z = ২×৩ + (−১)×৪ + ০.৫ = <strong>২.৫</strong>, ReLU-র পরে ২.৫। <code>n([1.0, 4.0])</code>: z = ২ − ৪ + ০.৫ = −১.৫ → ReLU → <strong>০.০</strong>। অধ্যায় ৫-এর neuron, এবার Python class-এ।',
        '<code>random.seed(42)</code> দিয়ে প্রথম তিনটি সংখ্যা <code>[0.639, 0.025, 0.275]</code>—আপনার কম্পিউটারে একই Python ভার্সনে হুবহু একই আসা উচিত। seed পুনরুৎপাদনের প্রথম ধাপ।',
      ]),
    activity: p('(১) উপরের টেবিলের কমান্ড দিয়ে নিজের কম্পিউটারে environment বানান; শেষ লাইনের <code>OK ...</code> লিখে রাখুন। (২) নিচের Python ফাইলটি <code>shop.py</code> নামে সেভ করে চালান। (৩) আরেকটি ফাইল <code>use_shop.py</code>-তে <code>from shop import Neuron</code> লিখে চালান—<code>main()</code> কেন চলল না, ব্যাখ্যা করুন। JavaScript সঙ্গী-অনুশীলনটি এখানেই চলে।'),
    code: [
      {
        label: 'JavaScript সঙ্গী: একই class দুটি',
        starter: String.raw`class Product {
  constructor(sku, name, price, stock) { this.sku = sku; this.name = name; this.price = price; this.stock = stock; }
  available(qty) { return this.stock >= qty; }
}
class Neuron {
  constructor(weights, bias) { this.w = [...weights]; this.b = bias; }
  call(x) { const z = this.w.reduce((s, wi, i) => s + wi * x[i], 0) + this.b; return Math.max(0, z); }
}
const p = new Product("KURTI-GRN", "সবুজ কুর্তি", 950, 3);
console.log(JSON.stringify(p));
console.log("৫টি পাওয়া যাবে?", p.available(5));
const n = new Neuron([2, -1], 0.5);
console.log("Neuron →", n.call([3, 4]), n.call([1, 4]));

function addItem(x, bag = []) { bag.push(x); return bag; }
addItem(1);
console.log("JS ডিফল্ট array প্রতিবার নতুন:", addItem(1));
`,
        expect: ['{"sku":"KURTI-GRN","name":"সবুজ কুর্তি","price":950,"stock":3}', '৫টি পাওয়া যাবে? false', 'Neuron → 2.5 0', 'JS ডিফল্ট array প্রতিবার নতুন: [1]'],
        hints: ['JavaScript-এ বস্তুকে ফাংশনের মতো ডাকার (__call__) সরাসরি উপায় নেই—তাই call() method।', 'Python-এ addItem-এর সমতুল্যটি দ্বিতীয়বার [1, 1] দেয়; experiment অংশ দেখুন।'],
        test: '__close(n.call([3,4]),2.5,1e-12,"relu active"); __assert(n.call([1,4])===0,"relu clipped"); __assert(addItem(5).length===1,"fresh default");',
      },
      py('02_classes_modules.py', 'Python: dataclass, __call__ ও __main__'),
    ],
    line: ul([
      '<code>@dataclass class Product:</code> — ফিল্ডগুলো থেকে <code>__init__</code> ও <code>__repr__</code> তৈরি।',
      '<code>def available(self, qty: int) -&gt; bool:</code> — <code>self</code> প্রথম প্যারামিটার; <code>-&gt; bool</code> ফেরত মানের hint।',
      '<code>zip(self.w, x)</code> — দুই list জোড়ায় জোড়ায় হাঁটে।',
      '<code>def __call__(self, x):</code> — <code>n(x)</code> লেখা সম্ভব করে।',
      '<code>if __name__ == "__main__": main()</code> — import করলে main চলে না।',
    ]),
    why: p('PyTorch-এ মডেল লিখতে হয় <code>nn.Module</code>-এর subclass হিসেবে, যেখানে <code>__init__</code>-এ layer বানানো আর <code>forward</code>-এ হিসাব—তাই class-এর এই অংশগুলো আগে আলাদাভাবে দেখা দরকার। সেটআপ অংশে “পরীক্ষিত” ও “পরীক্ষিত নয়” আলাদা রাখা হয়েছে, কারণ না-চালানো কমান্ডকে কাজ করে বলে দেওয়া শিক্ষার্থীর সময় নষ্ট করে।'),
    remember: ['__init__ = constructor; self স্পষ্ট লিখতে হয়', '__call__ থাকলে বস্তু ফাংশনের মতো ডাকা যায় (model(x))', 'if __name__ == "__main__"', 'প্রতি প্রজেক্টে venv, ভার্সন পিন', 'GPU ঐচ্ছিক; এই অধ্যায় CPU-তে চলে'],
    skip: ['class-এর উত্তরাধিকারের সব নিয়ম (MRO)', 'conda/poetry/uv-এর মতো বিকল্প টুল', 'Python package বানিয়ে প্রকাশ করা'],
    experiment: p('নিজের ফোল্ডারে <code>random.py</code> নামে একটি ফাইল বানিয়ে উপরের Python ফাইলটি পাশে রেখে চালান। ত্রুটিটি পড়ুন: Python আসল <code>random</code> লাইব্রেরির বদলে আপনার ফাইলটি import করছে। ফাইলের নাম বদলে আবার চালান। <code>torch.py</code> নামের ফাইলেও একই সমস্যা হয়।'),
    mistakes: ['method-এ <code>self</code> লিখতে ভুলে যাওয়া', 'নিজের ফাইলের নাম <code>torch.py</code>, <code>numpy.py</code> বা <code>random.py</code> রাখা', 'venv activate না করে <code>pip install</code> (global Python-এ চলে যায়)', 'ভার্সন পিন না করা', 'type hint-কে যাচাই ভাবা—Python চালানোর সময় hint মানে না'],
    solutionNote: p('JavaScript সঙ্গীর ফল (QuickJS-এ চালানো): <code>Neuron → 2.5 0</code>, Python-এ <code>2.5 0.0</code>—Python ReLU-তে <code>max(0.0, z)</code> float দেয়। সক্রিয়-অনুশীলনের (৩) নম্বরের উত্তর: <code>use_shop.py</code> থেকে import করলে <code>shop.py</code>-র <code>__name__</code> হয় <code>"shop"</code>, তাই <code>main()</code> চলে না; শুধু class ও ফাংশনগুলো পাওয়া যায়।'),
    quiz: [
      { q: 'PyTorch-এ <code>model(x)</code> কাজ করে কারণ:', a: { a: 'model একটি সাধারণ ফাংশন', b: 'nn.Module-এ __call__ আছে, যা forward ডাকে', c: 'Python সব বস্তুকে ডাকতে দেয়' }, ok: 'b', why: '__call__ বিশেষ method; nn.Module সেটি সংজ্ঞায়িত করে এবং ভেতরে forward চালায়।' },
      { q: '<code>if __name__ == "__main__":</code>-এর ভেতরের কোড কখন চলে?', a: { a: 'ফাইল import করলে', b: 'ফাইল সরাসরি চালালে', c: 'সবসময়' }, ok: 'b', why: 'সরাসরি চালালে __name__ হয় "__main__"; import-এ module-এর নাম।' },
      { q: 'ভার্সন পিন করার প্রধান কারণ:', a: { a: 'ইনস্টল দ্রুত হয়', b: 'অন্য কম্পিউটারে একই লাইব্রেরি-আচরণ পাওয়া', c: 'GPU চালু হয়' }, ok: 'b', why: 'নতুন ভার্সনে API বা সংখ্যাগত আচরণ বদলাতে পারে; পিন পুনরুৎপাদনযোগ্যতার ভিত্তি।' },
    ],
    recap: ['class: __init__, self, __call__, __repr__, dataclass', 'module ও __main__ পাহারা', 'venv + পিন করা ভার্সন; কী পরীক্ষিত আর কী নয় তা স্পষ্ট'],
    nextNote: 'এবার সংখ্যার array—NumPy ও broadcasting:',
    synthetic: true,
    sources: [SRC.pythonTut, ['Python Tutorial: Classes', 'https://docs.python.org/3/tutorial/classes.html'], ['Python docs: venv', 'https://docs.python.org/3/library/venv.html'], SRC.torchInstall],
  },
  {
    id: 'les-13-03-numpy-arrays-broadcasting',
    slug: 'numpy-arrays-broadcasting',
    title: 'NumPy array, shape ও broadcasting',
    minutes: 45,
    prereqs: ['les-13-02-functions-classes-modules-env'],
    summary: 'ndarray, shape ও dtype; @ দিয়ে matrix গুণ; broadcasting-এর নিয়ম ডান দিক থেকে; keepdims না দিলে কখন ত্রুটি আর কখন নীরব ভুল; vectorized softmax; seed-যুক্ত default_rng।',
    overview: p('অধ্যায় ৩–৫-এ আমরা array-এর উপর <code>map</code> ও লুপ চালিয়ে matrix গুণ করেছি। NumPy সেই কাজ একটি লাইনে করে, আর লুপ C-তে চলে। কিন্তু NumPy-র সবচেয়ে সুবিধাজনক বৈশিষ্ট্য—broadcasting, অর্থাৎ ভিন্ন shape-এর array-এর মধ্যে স্বয়ংক্রিয় হিসাব—সবচেয়ে বিপজ্জনকও: shape একটু ভুল হলে কখনো ত্রুটি আসে, কখনো কোনো ত্রুটি ছাড়াই ভুল সংখ্যা।'),
    objectives: ['array-এর shape পড়ে matrix গুণ বৈধ কিনা বলতে পারবেন', 'broadcasting-এর নিয়ম প্রয়োগ করে ফলের shape নির্ণয় করতে পারবেন', 'keepdims দিয়ে সারি-ভিত্তিক হিসাব (যেমন softmax) নিরাপদে লিখতে পারবেন'],
    problem: p('৬৪টি উদাহরণ × ১০টি শ্রেণির logits থেকে প্রতিটি সারির গড় বিয়োগ করতে চান: <code>X - X.mean(axis=1)</code>। NumPy ত্রুটি দেয়। কিন্তু শ্রেণি যদি ৬৪টি হতো (৬৪ × ৬৪), একই লাইন কোনো ত্রুটি ছাড়াই চলত—এবং প্রতিটি <em>কলাম</em> থেকে ভুল সংখ্যা বিয়োগ করত।'),
    explain:
      p('<strong>ndarray:</strong> একই ধরনের (dtype) সংখ্যার আয়তাকার গ্রিড। <code>X.shape = (2, 3)</code> মানে ২ সারি, ৩ কলাম। <code>X @ W</code> matrix গুণ—(২, ৩) @ (৩, ৪) → (২, ৪); ভেতরের দুটি সংখ্যা মিলতে হয় (অধ্যায় ৩)। <code>X * Y</code> উপাদান-ধরে গুণ, matrix গুণ নয়।') +
      p('<strong>broadcasting-এর নিয়ম:</strong> দুটি shape <em>ডান দিক থেকে</em> মাত্রা ধরে মেলান। প্রতিটি জোড়ায় দুটি সংখ্যা সমান হতে হবে, অথবা একটি ১ হতে হবে (১ হলে সেটি অন্যটির মাপে “প্রসারিত” হয়)। কোনো shape-এ মাত্রা কম থাকলে বাঁ দিকে ১ ধরা হয়।') +
      table(['বাম', 'ডান', 'ফল', 'কেন'], [
        ['(2, 3)', '(3,)', '(2, 3)', '৩ = ৩; ডানের সামনে ১ ধরা হয় → প্রতিটি সারিতে একই b যোগ'],
        ['(2, 3)', '(2, 1)', '(2, 3)', '৩ বনাম ১ → প্রসারণ; ২ = ২ → প্রতিটি সারিতে নিজের সংখ্যা'],
        ['(2, 3)', '(2,)', 'ত্রুটি', 'ডান থেকে প্রথম জোড়া ৩ বনাম ২'],
        ['(64, 64)', '(64,)', '(64, 64)', 'চলে—কিন্তু সারির গড় চাইলে এটি ভুল: প্রতিটি কলাম থেকে বিয়োগ হয়'],
      ], 'broadcasting: ডান থেকে মেলানো') +
      p('<strong>keepdims:</strong> <code>X.mean(axis=1)</code> সারি-মাত্রাটি মুছে (২,) দেয়; <code>keepdims=True</code> দিলে (২, ১) থাকে, যা ডান থেকে মেলালে সঠিকভাবে প্রতিটি সারিতে প্রসারিত হয়। সারি-ধরে কিছু (গড়, সর্বোচ্চ, যোগ) করে আবার মূল array-এর সাথে মেশাতে হলে প্রায় সবসময় keepdims লাগে।') +
      p('<strong>দৈব সংখ্যা:</strong> <code>rng = np.random.default_rng(0)</code> একটি seed-যুক্ত generator দেয়; <code>rng.normal(0, 1, size=(3, 4))</code> একটি (৩, ৪) array। global seed (<code>np.random.seed</code>) এর চেয়ে আলাদা generator রাখা নিরাপদ, কারণ অন্য কোড সেটিকে নষ্ট করে না।'),
    analogy: {
      text: 'broadcasting হলো দোকানের সব পণ্যে একই ছাড় লাগানো: একটি সংখ্যা (১০%) প্রতিটি সারিতে আপনা-আপনি বসে যায়, প্রতিটি পণ্যের জন্য আলাদা করে লিখতে হয় না।',
      breaks: 'দোকানে কেউ ভুল কলামে ছাড় লাগালে চোখে পড়ে; NumPy-তে shape কাকতালীয়ভাবে মিলে গেলে (৬৪ × ৬৪) ভুল দিকে প্রসারণ কোনো সতর্কবার্তা ছাড়াই ঘটে।',
    },
    worked:
      p('Python আউটপুট থেকে:') +
      ol([
        '<code>X @ X.T</code>: (২, ৩) @ (৩, ২) → (২, ২); প্রথম ঘর ১² + ২² + ৩² = <strong>১৪</strong>, কোণাকুণি ১×৪ + ২×৫ + ৩×৬ = <strong>৩২</strong>।',
        '<code>X - X.mean(axis=1)</code> → <code>ValueError: ... shapes (2,3) (2,)</code>। keepdims দিয়ে গড় (২, ১) → প্রতিটি সারি [−১, ০, ১]।',
        'softmax-এর দ্বিতীয় সারি [১০০০, ০, ০]: সর্বোচ্চ বিয়োগ না করলে <code>exp(1000)</code> overflow হয়ে <code>inf</code>; বিয়োগ করায় [১, ০, ০] (অধ্যায় ৮-এর একই কৌশল)।',
        'সারির যোগ <code>0.9999999999999999</code>—১ নয়! floating-point-এ এটি স্বাভাবিক (অধ্যায় ১); তুলনায় সবসময় tolerance লাগে (<code>np.isclose</code>)।',
      ]),
    activity: p('JavaScript সঙ্গী-অনুশীলনে broadcasting-এর নিয়মটি নিজে একটি ফাংশন হিসেবে লেখা আছে। চালিয়ে দেখুন কোন জোড়া চলে, কোনটি ত্রুটি দেয়, আর কোনটি “চলে কিন্তু বিপজ্জনক”। তারপর Python উদাহরণের আউটপুট মিলিয়ে নিন।'),
    code: [
      {
        label: 'JavaScript সঙ্গী: broadcasting-এর shape নিয়ম',
        starter: String.raw`function broadcastShape(a, b) {
  const n = Math.max(a.length, b.length), out = [];
  for (let i = 1; i <= n; i++) {
    const x = a.length - i >= 0 ? a[a.length - i] : 1;
    const y = b.length - i >= 0 ? b[b.length - i] : 1;
    if (x !== y && x !== 1 && y !== 1) throw new Error("broadcast অসম্ভব: (" + a + ") ও (" + b + "), ডান থেকে " + i + " নম্বর মাত্রা " + x + " বনাম " + y);
    out.unshift(Math.max(x, y));
  }
  return out;
}
const cases = [[[2, 3], [3]], [[2, 3], [2, 1]], [[2, 3], [2]], [[4, 1, 3], [5, 1]], [[64, 10], [64]], [[64, 64], [64]]];
const results = cases.map(([a, b]) => {
  try { return { ok: true, text: "(" + a + ") ও (" + b + ") → (" + broadcastShape(a, b) + ")" }; }
  catch (e) { return { ok: false, text: e.message }; }
});
results.forEach((r) => console.log(r.text));
`,
        expect: ['(2,3) ও (3) → (2,3)', '(2,3) ও (2,1) → (2,3)', 'broadcast অসম্ভব: (2,3) ও (2), ডান থেকে 1 নম্বর মাত্রা 3 বনাম 2', '(4,1,3) ও (5,1) → (4,5,3)', 'broadcast অসম্ভব: (64,10) ও (64)', '(64,64) ও (64) → (64,64)'],
        hints: ['(4,1,3) ও (5,1): ডান থেকে ৩ বনাম ১ → ৩; ১ বনাম ৫ → ৫; ৪ বনাম (নেই = ১) → ৪।', 'শেষ ঘটনাটি কেন বিপজ্জনক? ফাংশন shape বলে দেয়, কিন্তু আপনি কোন অক্ষ বরাবর চেয়েছিলেন তা জানে না।'],
        test: '__assert(results.filter(function(r){return r.ok;}).length===4,"4 ok"); __assert(broadcastShape([4,1,3],[5,1]).join()==="4,5,3","3d"); __assert(broadcastShape([64,64],[64]).join()==="64,64","silent case");',
      },
      py('03_numpy.py', 'Python: NumPy array, broadcasting ও keepdims'),
    ],
    line: ul([
      '<code>np.array([[...], [...]])</code> — nested list থেকে (২, ৩) array; dtype float64।',
      '<code>(X @ X.T).tolist()</code> — <code>.T</code> transpose; <code>tolist()</code> শুধু ছাপার সুবিধার জন্য।',
      '<code>X.mean(axis=1, keepdims=True)</code> — <code>axis=1</code> মানে কলাম বরাবর গড় (প্রতি সারিতে একটি)।',
      '<code>Z - Z.max(axis=1, keepdims=True)</code> — সংখ্যাগত স্থিতিশীল softmax।',
      '<code>rng.normal(0, 1, size=(3, 4))</code> — seed-যুক্ত generator থেকে (৩, ৪) array।',
    ]),
    why: p('broadcasting-এর নিয়মটি JavaScript-এ নিজে লেখানো হয়েছে কারণ নিয়মটি ছোট এবং নিজে লিখলে মনে থাকে। (৬৪, ৬৪) উদাহরণটি ইচ্ছা করে রাখা: shape-বাগ সবসময় ত্রুটি দেয় না, তাই গুরুত্বপূর্ণ জায়গায় <code>assert X.shape == (N, C)</code> লিখে রাখা অভ্যাস করুন।'),
    remember: ['shape আগে, হিসাব পরে', '@ = matrix গুণ; * = উপাদান-ধরে', 'broadcasting ডান থেকে; সমান বা ১', 'সারি-ধরে হিসাবে keepdims=True', 'float তুলনায় tolerance'],
    skip: ['fancy indexing-এর সব রূপ', 'strides ও memory layout', 'einsum'],
    experiment: p('Python-এ <code>X = np.ones((64, 64)); X[0] = 5</code> নিন, তারপর <code>X - X.mean(axis=1)</code> ও <code>X - X.mean(axis=1, keepdims=True)</code> দুটি হিসাব করে <code>[0, :3]</code> ও <code>[1, :3]</code> ছাপুন। কোনটি প্রথম সারিকে শূন্য করে? কোনটি ভুল জায়গা থেকে বিয়োগ করে?'),
    mistakes: ['<code>*</code>-কে matrix গুণ ভাবা', 'keepdims ছাড়া সারির গড়/যোগ বিয়োগ বা ভাগ', 'shape কাকতালীয়ভাবে মিলে যাওয়ায় নীরব ভুল', 'float-কে <code>==</code> দিয়ে তুলনা', 'global <code>np.random.seed</code>-এর উপর নির্ভর করা'],
    solutionNote: p('JavaScript সঙ্গীর ফল (QuickJS-এ চালানো): ৬টির মধ্যে ৪টি shape-জোড়া broadcast হয়; (২, ৩) ও (২,) এবং (৬৪, ১০) ও (৬৪,) ত্রুটি দেয়। (৬৪, ৬৪) ও (৬৪,) কোনো ত্রুটি ছাড়াই (৬৪, ৬৪) দেয়—সারি-ধরে হিসাব চাইলে এটিই নীরব বাগ। Experiment-এর উত্তর: keepdims-যুক্তটি প্রথম সারিকে [০, ০, ০] করে; keepdims ছাড়াটি প্রথম <em>কলাম</em> থেকে প্রথম সারির গড় (৫) বিয়োগ করে, ফলে <code>X[1, 0]</code> হয় ১ − ৫ = −৪।'),
    quiz: [
      { q: '(৩২, ১, ৮) ও (৫, ১)-এর broadcast ফল?', a: { a: '(৩২, ৫, ৮)', b: 'ত্রুটি', c: '(৩২, ৫, ১)' }, ok: 'a', why: 'ডান থেকে: ৮ ও ১ → ৮; ১ ও ৫ → ৫; ৩২ ও (নেই) → ৩২।' },
      { q: 'X (N, C); প্রতিটি সারি থেকে তার সর্বোচ্চ বিয়োগের সঠিক লেখা?', a: { a: '<code>X - X.max(axis=1)</code>', b: '<code>X - X.max(axis=1, keepdims=True)</code>', c: '<code>X - X.max()</code>' }, ok: 'b', why: 'keepdims (N, 1) রাখে, যা প্রতিটি সারিতে প্রসারিত হয়। (c) পুরো array-এর একটি সর্বোচ্চ বিয়োগ করে।' },
      { q: '(২, ৩) @ (২, ৩) কেন ত্রুটি?', a: { a: 'ভেতরের মাত্রা ৩ ও ২ মেলে না', b: 'দুটি একই shape', c: 'NumPy matrix গুণ সমর্থন করে না' }, ok: 'a', why: 'matrix গুণে বামের কলাম = ডানের সারি হতে হয়; X @ X.T বৈধ।' },
    ],
    recap: ['ndarray: shape ও dtype', 'broadcasting ডান থেকে, সমান বা ১', 'keepdims দিয়ে সারি-ভিত্তিক হিসাব; নীরব shape-বাগ থেকে সাবধান'],
    nextNote: 'NumPy-র মতোই, তবে gradient নিজে হিসাব করে—PyTorch tensor:',
    synthetic: true,
    sources: [SRC.numpyBasics, SRC.numpyBroadcast, SRC.d2l],
  },
  {
    id: 'les-13-04-tensors-devices-autograd',
    slug: 'pytorch-tensors-devices-autograd',
    title: 'PyTorch tensor, device ও autograd',
    minutes: 50,
    prereqs: ['les-13-03-numpy-arrays-broadcasting', 'les-03-07-gradients-chain-rule'],
    summary: 'tensor-এর shape, dtype ও device; CPU/CUDA/MPS বাছাই; requires_grad ও backward দিয়ে অধ্যায় ৩-এর gradient হুবহু; gradient জমে যাওয়া ও zero_grad; torch.no_grad; একটি ছোট JavaScript autograd নিজে লিখে দেখা।',
    overview: p('অধ্যায় ৩-এ L = (w·x + b − y)²-এর gradient হাতে বের করেছিলাম, অধ্যায় ৫-এ backpropagation-এ প্রতিটি δ নিজে লিখেছিলাম। PyTorch এই হিসাবটি স্বয়ংক্রিয় করে: প্রতিটি অপারেশন একটি গ্রাফে লেখা থাকে, আর <code>backward()</code> শেষ থেকে শুরুতে chain rule চালায়। এই পাঠে আমরা দেখব PyTorch-এর উত্তর হাতের হিসাবের সাথে হুবহু মেলে কিনা, তারপর JavaScript-এ ২০ লাইনের একটি ছোট autograd লিখে দেখব ভেতরে কী হয়।'),
    objectives: ['tensor-এর shape, dtype ও device পড়তে ও বদলাতে পারবেন', 'requires_grad ও backward দিয়ে gradient বের করে হাতের হিসাবের সাথে মেলাতে পারবেন', 'gradient জমে যাওয়ার কারণ ও zero_grad-এর প্রয়োজন ব্যাখ্যা করতে পারবেন'],
    problem: p('training loop-এ প্রতি ধাপে <code>loss.backward()</code> ডাকছেন, কিন্তু loss লাফিয়ে বাড়ছে। কোড দেখতে ঠিক। সমস্যা: PyTorch gradient প্রতিবার <em>যোগ</em> করে, মুছে ফেলে না। এই একটি নিয়ম না জানলে খুব সাধারণ একটি বাগ চোখে পড়ে না।'),
    explain:
      p('<strong>tensor:</strong> NumPy array-এর মতো, সাথে দুটি বাড়তি জিনিস—এটি কোন যন্ত্রে আছে (<code>device</code>: <code>cpu</code>, <code>cuda</code>, <code>mps</code>), এবং gradient রাখতে পারে। ডিফল্ট dtype float32 (NumPy-র float64 নয়); পূর্ণসংখ্যা থেকে বানালে int64। <code>t.to("cuda")</code> tensor-কে GPU-তে কপি করে; একটি হিসাবের সব tensor একই device-এ থাকতে হয়, নইলে ত্রুটি।') +
      p('<strong>device বাছাই:</strong> উদাহরণের <code>pick_device()</code> CUDA, তারপর MPS, শেষে CPU খোঁজে। এই কোর্সের হিসাবগুলো ছোট, তাই CPU-তে রাখা হয়েছে—ছোট হিসাবে GPU-তে ডেটা আনা-নেওয়ার খরচ লাভের চেয়ে বেশি হতে পারে, তবে তা কম্পিউটারভেদে আলাদা এবং এখানে মাপা হয়নি।') +
      p('<strong>autograd:</strong> <code>requires_grad=True</code> দিয়ে বানানো tensor-এর উপর প্রতিটি অপারেশন একটি গ্রাফে লেখা হয়। <code>loss.backward()</code> গ্রাফ উল্টো দিকে হেঁটে প্রতিটি পাতার (<code>w</code>, <code>b</code>) <code>.grad</code>-এ ∂L/∂w <em>যোগ</em> করে। তাই প্রতিটি update-এর আগে gradient শূন্য করতে হয় (<code>opt.zero_grad()</code> বা <code>w.grad.zero_()</code>)।') +
      p('<strong>no_grad:</strong> weight update নিজে গ্রাফে লেখা উচিত নয়; <code>with torch.no_grad():</code> ব্লকের ভেতরে অপারেশন লেখা হয় না। <code>with</code> হলো context manager—ব্লকে ঢোকার সময় একটি অবস্থা চালু ও বের হওয়ার সময় বন্ধ করে। মূল্যায়নের সময়ও no_grad ব্যবহার করুন; মেমরি বাঁচে।') +
      p('<strong>shape ত্রুটি:</strong> <code>(2,3) @ (2,3)</code> → <code>RuntimeError: mat1 and mat2 shapes cannot be multiplied (2x3 and 2x3)</code>। বার্তাটি দুটি shape-ই বলে দেয়—পড়ুন, অনুমান করবেন না।'),
    analogy: {
      text: 'autograd হলো দোকানের হিসাবের খাতা, যেখানে প্রতিটি লেনদেন ক্রম ধরে লেখা থাকে; মাস শেষে উল্টো দিক থেকে মিলিয়ে বের করা যায় কোন খাত থেকে কত টাকার প্রভাব এসেছে।',
      breaks: 'খাতা মাস শেষে বন্ধ করা হয়; PyTorch-এর <code>.grad</code> নিজে নিজে খালি হয় না—নতুন মাসের হিসাব আগের মাসের উপর যোগ হতে থাকে, যদি না আপনি zero_grad দিয়ে মোছেন।',
    },
    worked:
      p('অধ্যায় ৩-এর সূত্র, নতুন মান: x = ৩, y = ১০, w = ২, b = ০.৫।') +
      ol([
        'অনুমান = ২×৩ + ০.৫ = ৬.৫; ত্রুটি e = ৬.৫ − ১০ = −৩.৫; L = e² = <strong>১২.২৫</strong>।',
        '∂L/∂w = ২·e·x = ২ × (−৩.৫) × ৩ = <strong>−২১</strong>; ∂L/∂b = ২·e = <strong>−৭</strong>।',
        'PyTorch আউটপুট: <code>loss: 12.25 | dL/dw: -21.0 | dL/db: -7.0</code>—হুবহু।',
        'আবার backward, শূন্য না করে: <code>-42.0</code> = −২১ + (−২১)। এটিই “gradient জমে যাওয়া”।',
        'η = ০.০১ দিয়ে update: w = ২ − ০.০১ × (−২১) = <strong>২.২১</strong>।',
      ]),
    activity: p('JavaScript সঙ্গী-অনুশীলনে একটি ছোট autograd: প্রতিটি <code>Value</code> নিজের মান, gradient ও কোন দুটি মান থেকে এসেছে তা মনে রাখে; <code>backward()</code> গ্রাফ উল্টো ক্রমে সাজিয়ে প্রতিটি নোডের ছোট chain-rule ফাংশন চালায়। PyTorch-এর সংখ্যা দুটি (−২১, −৭) ও জমে যাওয়া (−৪২) এখানেও আসে কিনা দেখুন।'),
    code: [
      {
        label: 'JavaScript সঙ্গী: ২০ লাইনের autograd',
        starter: String.raw`class Value {
  constructor(data, parents = []) { this.data = data; this.grad = 0; this.parents = parents; this.back = () => {}; }
  add(o) {
    o = o instanceof Value ? o : new Value(o);
    const out = new Value(this.data + o.data, [this, o]);
    out.back = () => { this.grad += out.grad; o.grad += out.grad; };
    return out;
  }
  mul(o) {
    o = o instanceof Value ? o : new Value(o);
    const out = new Value(this.data * o.data, [this, o]);
    out.back = () => { this.grad += o.data * out.grad; o.grad += this.data * out.grad; };
    return out;
  }
  square() {
    const out = new Value(this.data * this.data, [this]);
    out.back = () => { this.grad += 2 * this.data * out.grad; };
    return out;
  }
  backward() {
    const order = [], seen = new Set();
    const visit = (v) => { if (seen.has(v)) return; seen.add(v); v.parents.forEach(visit); order.push(v); };
    visit(this);
    this.grad = 1;
    order.reverse().forEach((v) => v.back());
  }
}
const w = new Value(2), b = new Value(0.5);
const loss = w.mul(3).add(b).add(-10).square();
loss.backward();
console.log("loss:", loss.data, "| dL/dw:", w.grad, "| dL/db:", b.grad);
const grad1 = w.grad;
w.mul(3).add(b).add(-10).square().backward();
console.log("grad শূন্য না করে আবার backward → dL/dw:", w.grad);
`,
        expect: ['loss: 12.25 | dL/dw: -21 | dL/db: -7', 'grad শূন্য না করে আবার backward → dL/dw: -42'],
        hints: ['backward-এ order কেন উল্টো? শেষ নোডের gradient (১) জানা, সেখান থেকে শুরুতে যেতে হয়।', 'back ফাংশনে = না লিখে += কেন? একই মান গ্রাফে দুবার ব্যবহৃত হলে দুই পথের gradient যোগ হয়—জমে যাওয়ার কারণও এটিই।', 'zero_grad বানান: w.grad = 0; b.grad = 0; লিখে আবার চালান।'],
        test: '__close(loss.data,12.25,1e-12,"loss"); __close(grad1,-21,1e-12,"dw"); __close(b.grad,-14,1e-12,"db accumulated"); __close(w.grad,-42,1e-12,"accumulated");',
      },
      py('04_tensors_autograd.py', 'Python: PyTorch tensor, device ও autograd'),
    ],
    line: ul([
      '<code>torch.tensor(2.0, requires_grad=True)</code> — এই tensor-এর gradient রাখা হবে।',
      '<code>loss.backward()</code> — গ্রাফ উল্টো হেঁটে <code>w.grad</code>, <code>b.grad</code> পূরণ।',
      '<code>w.grad.item()</code> — এক উপাদানের tensor থেকে সাধারণ Python সংখ্যা।',
      '<code>w.grad.zero_()</code> — শেষে <code>_</code> মানে জায়গাতেই বদল (in-place)।',
      '<code>with torch.no_grad(): w -= ...</code> — update গ্রাফে লেখা হয় না।',
      '<code>str(e).splitlines()[0]</code> — ত্রুটির প্রথম লাইনটুকু।',
    ]),
    why: p('প্রথমে এমন উদাহরণ নেওয়া হয়েছে যার উত্তর অধ্যায় ৩-এর সূত্রে দুই লাইনে হাতে বের করা যায়, যাতে PyTorch-কে বিশ্বাস না করে যাচাই করা যায়। JavaScript autograd-টি দেখায় “স্বয়ংক্রিয়” মানে জাদু নয়: প্রতিটি অপারেশনের ছোট নিয়ম আর উল্টো ক্রমে চালানো। এর <code>+=</code> থেকেই বোঝা যায় কেন PyTorch gradient জমায়।'),
    remember: ['tensor = shape + dtype + device', 'ডিফল্ট float32', 'backward gradient যোগ করে → প্রতি ধাপে zero_grad', 'update ও মূল্যায়ন torch.no_grad-এ', 'সব tensor একই device-এ'],
    skip: ['autograd-এর ভেতরের C++ বাস্তবায়ন', 'higher-order gradient', 'mixed precision (float16/bfloat16)'],
    experiment: p('JavaScript autograd-এ <code>const z = w.mul(w)</code> (w দুবার ব্যবহার) বানিয়ে <code>z.backward()</code> চালান; w = ২ হলে ∂z/∂w = ২w = ৪ আসা উচিত। তারপর back ফাংশনের <code>+=</code>-কে <code>=</code> করে আবার চালান—কত আসে, এবং কেন ভুল?'),
    mistakes: ['training loop-এ zero_grad ভুলে যাওয়া', 'update <code>no_grad</code>-এর বাইরে করা', 'মডেল GPU-তে, ডেটা CPU-তে', 'float64 NumPy array থেকে বানানো tensor-কে float32 মডেলে দেওয়া (dtype ত্রুটি)', 'ত্রুটির বার্তায় দেওয়া shape না পড়ে অনুমান করা'],
    solutionNote: p('JavaScript সঙ্গীর ফল (QuickJS-এ চালানো): <code>loss: 12.25 | dL/dw: -21 | dL/db: -7</code>, দ্বিতীয়বার backward-এর পরে −৪২—PyTorch-এর সংখ্যার সাথে হুবহু। Experiment-এর উত্তর: <code>w.mul(w)</code>-এ mul-এর back ফাংশন <code>this</code> ও <code>o</code> দুটিতেই ২ যোগ করে, আর দুটিই w, তাই ২ + ২ = ৪। <code>=</code> করলে দ্বিতীয় লেখা প্রথমটিকে মুছে দেয়, ফল ২—অর্ধেক, ভুল।'),
    quiz: [
      { q: 'শূন্য না করে একই loss-এ দুবার backward করলে w.grad:', a: { a: 'একই থাকে', b: 'দ্বিগুণ হয়', c: 'শূন্য হয়' }, ok: 'b', why: 'backward .grad-এ যোগ করে; তাই −২১ + −২১ = −৪২।' },
      { q: 'weight update কেন <code>torch.no_grad()</code>-এর ভেতরে?', a: { a: 'update দ্রুত হয়', b: 'update নিজে গ্রাফে লেখা হলে পরের gradient ভুল হয় ও মেমরি বাড়ে', c: 'GPU-তে চালানোর জন্য' }, ok: 'b', why: 'update মডেলের হিসাবের অংশ নয়; গ্রাফে গেলে autograd সেটিকেও পার্থক্য করতে চাইত।' },
      { q: '<code>torch.tensor([1, 2])</code>-এর dtype?', a: { a: 'float32', b: 'int64', c: 'float64' }, ok: 'b', why: 'পূর্ণসংখ্যা থেকে int64 হয়; float থেকে float32।' },
    ],
    recap: ['tensor-এর shape, dtype, device', 'autograd হাতের gradient-এর সাথে হুবহু মেলে', 'gradient জমে; zero_grad ও no_grad'],
    nextNote: 'gradient পেলাম। এবার ডেটা batch-এ ভাগ করে পুরো training loop ও checkpoint:',
    synthetic: true,
    sources: [SRC.torchTensors, SRC.torchAutograd, SRC.karpathyMakemore, SRC.d2l],
  },
  {
    id: 'les-13-05-data-training-checkpoints',
    slug: 'pytorch-data-training-checkpoints',
    title: 'Dataset, DataLoader, training loop ও checkpoint',
    minutes: 50,
    prereqs: ['les-13-04-tensors-devices-autograd', 'les-04-02-train-val-test'],
    summary: 'TensorDataset ও seed-যুক্ত DataLoader; nn.Module, optimizer ও loss; পাঁচ ধাপের loop (zero_grad, forward, loss, backward, step); train/eval মোড; val loss ও noise-এর নিম্নসীমা; state_dict সংরক্ষণ ও পুনরুদ্ধার, weights_only ও অবিশ্বস্ত ফাইলের ঝুঁকি।',
    overview: p('এখন একটি সম্পূর্ণ training loop: সিন্থেটিক ডেটা (y = ৩x + ২ + noise) mini-batch-এ ভাগ, মডেল, optimizer, প্রতি epoch-এ validation, আর শেষে মডেল ফাইলে সংরক্ষণ করে আবার ফিরিয়ে আনা—এবং প্রমাণ করা যে ফেরানো মডেল হুবহু একই উত্তর দেয়। সাথে একটি সৎ প্রশ্ন: val loss কত নিচে নামতে <em>পারে</em>?'),
    objectives: ['Dataset ও DataLoader দিয়ে seed-যুক্ত mini-batch বানাতে পারবেন', 'পাঁচ ধাপের training loop ও train/eval মোড সঠিকভাবে লিখতে পারবেন', 'checkpoint সংরক্ষণ-পুনরুদ্ধার করে যাচাই করতে এবং অবিশ্বস্ত checkpoint-এর ঝুঁকি বুঝতে পারবেন'],
    problem: p('দুই ঘণ্টা training চলার পরে কম্পিউটার বন্ধ হয়ে গেল—সব হারালেন। আবার, val loss ০.১৫-এ থেমে আছে; আরও epoch দিলে কি নামবে, নাকি এটাই সর্বনিম্ন? দুটি প্রশ্নেরই উত্তর পদ্ধতিগত: checkpoint, আর noise-এর নিম্নসীমা মাপা।'),
    explain:
      p('<strong>Dataset ও DataLoader:</strong> <code>TensorDataset(X, Y)</code> প্রতিটি index-এ (x, y) জোড়া দেয়। <code>DataLoader(ds, batch_size=16, shuffle=True, generator=g)</code> প্রতি epoch-এ index এলোমেলো করে ১৬টি করে batch বানায়; <code>generator</code>-এ seed দিলে এলোমেলো ক্রম পুনরুৎপাদনযোগ্য। ১৬০টি উদাহরণ ÷ ১৬ = ১০টি batch। বড়, ফাইলভিত্তিক ডেটায় নিজের Dataset class লিখতে হয় (<code>__len__</code> ও <code>__getitem__</code>)।') +
      p('<strong>মডেল, loss, optimizer:</strong> <code>nn.Linear(1, 1)</code> = একটি w ও একটি b। <code>nn.MSELoss()</code> গড় বর্গ ত্রুটি। <code>torch.optim.SGD(model.parameters(), lr=0.1)</code> অধ্যায় ৩-এর w ← w − η·g, সব parameter-এ।') +
      p('<strong>পাঁচ ধাপ, প্রতিটি batch-এ:</strong>') +
      ol(['<code>opt.zero_grad()</code> — আগের gradient মোছা', '<code>pred = model(xb)</code> — forward', '<code>loss = loss_fn(pred, yb)</code>', '<code>loss.backward()</code> — gradient', '<code>opt.step()</code> — update']) +
      p('<strong>train ও eval মোড:</strong> <code>model.train()</code> ও <code>model.eval()</code> dropout ও batch-norm-এর আচরণ বদলায় (অধ্যায় ৫)। এই মডেলে ওগুলো নেই, তবু অভ্যাস হিসেবে লেখা হয়েছে। মূল্যায়ন <code>torch.no_grad()</code>-এ।') +
      p('<strong>checkpoint:</strong> <code>model.state_dict()</code> হলো সব parameter-এর নাম → tensor। সাথে optimizer-এর state ও epoch সংরক্ষণ করলে training যেখানে থেমেছিল সেখান থেকে চালানো যায়। <code>torch.load</code> ফাইলটি পড়ে; PyTorch ২.৬ থেকে ডিফল্ট <code>weights_only=True</code>, যা শুধু tensor ও সাধারণ ধরন পড়ে।') +
      warn('অচেনা উৎসের <code>.pt</code> ফাইল <code>weights_only=False</code> দিয়ে খুলবেন না: পুরনো pickle ফরম্যাট ফাইল খোলার সময় যেকোনো কোড চালাতে পারে। প্রকাশ্যে মডেল শেয়ারের জন্য safetensors-এর মতো শুধু-ডেটা ফরম্যাট ব্যবহার হয়।'),
    analogy: {
      text: 'checkpoint হলো ভিডিও গেমের সেভ পয়েন্ট: শুধু চরিত্রের অবস্থান (weight) নয়, কোন লেভেলে ছিলেন (epoch) আর ঝুলিতে কী ছিল (optimizer state)—সব সেভ করলে তবেই ঠিক সেখান থেকে খেলা যায়।',
      breaks: 'গেমের সেভ ফাইল সাধারণত নিরাপদ; PyTorch-এর পুরনো ফরম্যাটে কারো দেওয়া সেভ ফাইল খুললে তা আপনার কম্পিউটারে কোড চালাতে পারে। তাই উৎস যাচাই আর weights_only জরুরি।',
    },
    worked:
      p('Python আউটপুট পড়ি:') +
      ol([
        '১০টি batch প্রতি epoch—১৬০ ÷ ১৬।',
        'শেখা w = ৩.০৪৫, b = ১.৯৫৮; আসল ৩ ও ২। noise থাকায় হুবহু ৩ ও ২ পাওয়া যায় না।',
        'epoch ১০-এ val loss ০.১৪৭৭, epoch ৩০-এ ০.১৫৪৭—সামান্য বেড়েছে। এটি overfitting নয় (মডেলে মাত্র ২টি parameter); mini-batch SGD-র ধাপগুলো w ও b-কে সঠিক মানের চারপাশে সামান্য দোলায়।',
        '<strong>নিম্নসীমা:</strong> আসল সূত্র 3x + 2 দিয়েও এই val সেটে loss <strong>০.১৩৩৯</strong>। noise-এর তাত্ত্বিক মান ০.৩² = ০.০৯, কিন্তু মাত্র ৪০টি val বিন্দুর নমুনায় তা বেশি এসেছে। তাই আমাদের মডেল সর্বনিম্নের চেয়ে মাত্র ~০.০২ উপরে; আরও epoch দিয়ে লাভ সামান্যই।',
        'checkpoint থেকে ফেরানো মডেলের আউটপুট <code>torch.equal</code> দিয়ে হুবহু সমান: <code>True</code>।',
      ]),
    activity: p('JavaScript সঙ্গী-অনুশীলনে DataLoader-এর মূল কাজটি নিজে লেখা: seed-যুক্ত Fisher–Yates দিয়ে এলোমেলো করা, batch-এ কাটা, আর শেষ অপূর্ণ batch রাখা বা ফেলে দেওয়া (<code>drop_last</code>)। যাচাই করুন প্রতি epoch-এ প্রতিটি উদাহরণ ঠিক একবার আসে।'),
    code: [
      {
        label: 'JavaScript সঙ্গী: seed-যুক্ত mini-batch',
        starter: RNG + String.raw`function* batches(n, size, rand, dropLast = false) {
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); const t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
  for (let s = 0; s < n; s += size) {
    const b = idx.slice(s, s + size);
    if (dropLast && b.length < size) return;
    yield b;
  }
}
const rand = makeRng(0);
const report = [];
for (const [n, size, drop] of [[160, 16, false], [150, 16, false], [150, 16, true]]) {
  const bs = [...batches(n, size, rand, drop)];
  const seen = new Set(bs.flat());
  report.push({ n, count: bs.length, last: bs[bs.length - 1].length, unique: seen.size });
  console.log("n=" + n + " batch=" + size + (drop ? " drop_last" : "") + " → " + bs.length + "টি batch, শেষটিতে " + bs[bs.length - 1].length + ", ভিন্ন উদাহরণ " + seen.size);
}
const a = [...batches(10, 4, makeRng(5))].join(" | "), b = [...batches(10, 4, makeRng(5))].join(" | ");
console.log("একই seed → একই ক্রম:", a === b, "→", a);
`,
        expect: ['n=160 batch=16 → 10টি batch, শেষটিতে 16, ভিন্ন উদাহরণ 160', 'n=150 batch=16 → 10টি batch, শেষটিতে 6, ভিন্ন উদাহরণ 150', 'n=150 batch=16 drop_last → 9টি batch, শেষটিতে 16, ভিন্ন উদাহরণ 144', 'একই seed → একই ক্রম: true'],
        hints: ['drop_last=true হলে ৬টি উদাহরণ এই epoch-এ বাদ পড়ে—কোনগুলো, তা seed-এর উপর নির্ভর করে।', 'function* ও yield হলো generator: প্রতি batch চাওয়া মাত্র একটি করে দেয়, পুরো তালিকা আগে বানায় না। Python-এর DataLoader-ও একইভাবে iterate হয়।'],
        test: '__assert(report[0].count===10&&report[0].unique===160,"160/16"); __assert(report[1].count===10&&report[1].last===6,"150 keeps tail"); __assert(report[2].count===9&&report[2].unique===144,"drop_last"); __assert(a===b,"seeded");',
      },
      py('05_data_train_checkpoint.py', 'Python: DataLoader, training loop ও checkpoint'),
    ],
    line: ul([
      '<code>torch.Generator().manual_seed(0)</code> — DataLoader-এর এলোমেলো করার নিজস্ব seed।',
      '<code>for xb, yb in loader:</code> — প্রতিটি batch (১৬, ১) ও (১৬, ১)।',
      '<code>opt.zero_grad(); loss.backward(); opt.step()</code> — পাঁচ ধাপের তিনটি।',
      '<code>loss_fn(3 * val_X + 2, val_Y)</code> — আসল সূত্রের loss: noise-এর নিম্নসীমা।',
      '<code>tempfile.TemporaryDirectory()</code> — অস্থায়ী ফোল্ডার, ব্লক শেষে মুছে যায়।',
      '<code>torch.equal(restored(val_X), model(val_X))</code> — হুবহু সমতা যাচাই।',
    ]),
    why: p('আসল সূত্র জানা সিন্থেটিক ডেটা নেওয়া হয়েছে যাতে “কত ভালো সম্ভব” মাপা যায়—বাস্তব ডেটায় এটি জানা থাকে না, তখন মানুষের নির্ভুলতা বা সরল baseline দিয়ে কাছাকাছি ধারণা নিতে হয়। checkpoint-এর পরে আউটপুট তুলনা করা হয়েছে, কারণ “ফাইল সেভ হয়েছে” আর “মডেল ঠিকমতো ফিরেছে” এক কথা নয়।'),
    remember: ['DataLoader-এ generator seed', 'পাঁচ ধাপ: zero_grad, forward, loss, backward, step', 'train()/eval() ও no_grad', 'noise-এর নিম্নসীমার নিচে loss নামে না', 'state_dict + optimizer + epoch; অবিশ্বস্ত ফাইল weights_only=False দিয়ে নয়'],
    skip: ['num_workers দিয়ে সমান্তরাল লোডিং', 'learning-rate scheduler', 'distributed training'],
    experiment: p('Python ফাইলে <code>lr=0.1</code>-কে <code>0.5</code> ও <code>0.01</code> করে চালান। কোনটিতে ৩০ epoch-এ w ৩-এর কাছে পৌঁছায় না? কোনটিতে val loss বেশি দোলে? তারপর batch_size ১৬০ (full batch) করে দোলা কমে কিনা দেখুন।'),
    mistakes: ['val ডেটা দিয়ে training', 'মূল্যায়নে model.eval() ও no_grad না দেওয়া', 'শুধু weight সেভ করে training আবার শুরু (optimizer state হারায়)', 'noise-এর নিম্নসীমা না জেনে “আরও epoch দিলে নামবে” ভাবা', 'অচেনা checkpoint weights_only=False দিয়ে খোলা'],
    solutionNote: p('JavaScript সঙ্গীর ফল (QuickJS-এ চালানো): ১৬০/১৬ → ১০টি পূর্ণ batch; ১৫০/১৬ → ১০টি, শেষটিতে ৬; drop_last দিলে ৯টি, ১৪৪টি উদাহরণ। Python ফলের ব্যাখ্যা উপরে; সারকথা—val loss ০.১৫৪৭ বনাম আসল সূত্রের ০.১৩৩৯, তাই মডেল প্রায় সীমায় পৌঁছেছে। এই সংখ্যাগুলো একটি seed ও ৪০টি val বিন্দুর; অন্য seed-এ সামান্য আলাদা হবে।'),
    quiz: [
      { q: '১৫০টি উদাহরণ, batch ১৬, drop_last=True—প্রতি epoch-এ কয়টি batch?', a: { a: '১০', b: '৯', c: '৯.৩৭৫' }, ok: 'b', why: '৯টি পূর্ণ batch = ১৪৪; বাকি ৬টি বাদ।' },
      { q: 'আসল সূত্র দিয়েও val loss ০.১৩। আপনার মডেল ০.১৫। সবচেয়ে সৎ সিদ্ধান্ত?', a: { a: 'মডেল খারাপ, বড় মডেল দরকার', b: 'মডেল নিম্নসীমার খুব কাছে; উন্নতির জায়গা সামান্য', c: 'val সেট ভুল' }, ok: 'b', why: 'noise কোনো মডেল সরাতে পারে না; ০.১৩-এর নিচে নামা আশা করা যায় না।' },
      { q: 'training আবার চালু করার জন্য checkpoint-এ ন্যূনতম কী রাখা উচিত?', a: { a: 'শুধু model.state_dict()', b: 'model ও optimizer-এর state_dict এবং epoch', c: 'শুধু শেষ loss' }, ok: 'b', why: 'momentum/Adam-এর মতো optimizer নিজের state রাখে; সেটি হারালে training আচরণ বদলায়।' },
    ],
    recap: ['Dataset/DataLoader দিয়ে seed-যুক্ত batch', 'পাঁচ ধাপের loop, train/eval মোড', 'noise-এর নিম্নসীমা মেপে প্রত্যাশা ঠিক রাখা', 'checkpoint সংরক্ষণ, পুনরুদ্ধার ও যাচাই'],
    nextNote: 'সব টুকরো হাতে। প্রথম প্রজেক্ট: অধ্যায় ৫-এর নেটওয়ার্ক PyTorch-এ:',
    synthetic: true,
    sources: [SRC.torchData, SRC.torchSave, ['PyTorch docs: torch.load ও weights_only', 'https://docs.pytorch.org/docs/stable/generated/torch.load.html'], SRC.d2l],
  },
  {
    id: 'les-13-06-project-circle-pytorch',
    slug: 'project-circle-network-pytorch',
    title: 'প্রজেক্ট: অধ্যায় ৫-এর নেটওয়ার্ক PyTorch-এ',
    minutes: 60,
    prereqs: ['les-13-05-data-training-checkpoints', 'les-05-07-project-tiny-network'],
    summary: 'অধ্যায় ৫-এর seed-যুক্ত RNG Python-এ হুবহু রূপান্তর করে একই ১৬০/৮০ বৃত্ত-ডেটা; nn.Sequential দিয়ে ২→৮→১; একই loss, learning rate ও epoch; JavaScript ও PyTorch ফলের তুলনা এবং পার্থক্যের কারণ।',
    overview: p('অধ্যায় ৫-এ প্রতিটি gradient হাতে লিখে একটি ২→৮→১ নেটওয়ার্ক বানিয়েছিলাম। এখন একই কাজ PyTorch-এ, মাত্র কয়েক লাইনে। সৎ তুলনার জন্য ডেটা হুবহু এক হতে হবে, তাই JavaScript-এর seed-যুক্ত দৈব-সংখ্যা জেনারেটর (mulberry32) Python-এ বিট ধরে রূপান্তর করা হয়েছে, এবং তা প্রমাণ করা হয়েছে প্রথম বিন্দু ও baseline মিলিয়ে।'),
    objectives: ['একটি seed-যুক্ত জেনারেটর দুই ভাষায় হুবহু মিলিয়ে একই ডেটাসেট বানাতে পারবেন', 'হাতে লেখা নেটওয়ার্ক nn.Sequential, BCELoss ও SGD দিয়ে আবার লিখতে পারবেন', 'দুই বাস্তবায়নের ফলের পার্থক্য initialization-এর মতো নির্দিষ্ট কারণে ব্যাখ্যা করতে পারবেন'],
    problem: p('“PyTorch-এ আমার মডেল ভালো করেছে”—কিসের তুলনায়? ডেটা যদি একটু আলাদা হয়, তুলনা অর্থহীন। এই প্রজেক্টের প্রশ্ন: একই ডেটা, একই স্থাপত্য, একই learning rate দিলে দুই বাস্তবায়ন কতটা একই ফল দেয়, আর যেখানে আলাদা, কেন?'),
    explain:
      p('<strong>একই ডেটা:</strong> mulberry32 ৩২-বিট পূর্ণসংখ্যার উপর কাজ করে। JavaScript-এর <code>Math.imul</code> ও <code>&gt;&gt;&gt; 0</code> যা করে, Python-এ তা <code>(a * b) &amp; 0xFFFFFFFF</code> দিয়ে করা হয়েছে—Python-এর পূর্ণসংখ্যার সীমা নেই, তাই প্রতিবার ৩২ বিটে কেটে রাখতে হয়। <code>nonlocal a</code> মানে ভেতরের ফাংশন বাইরের ফাংশনের <code>a</code>-কে বদলাবে—JavaScript closure-এর মতো, কিন্তু Python-এ বদলানোর জন্য স্পষ্ট ঘোষণা লাগে।') +
      p('<strong>যাচাই:</strong> প্রথম বিন্দু দুই ভাষায় <code>[-0.149, -0.916]</code>; test সেটে “সব ০”-এর accuracy দুই জায়গায় ০.৫৮৭৫। শুধু একটি সংখ্যা মিললে কাকতালীয় হতে পারত; ২৪০টি বিন্দুর লেবেল থেকে বানানো baseline মেলা মানে ডেটা একই।') +
      p('<strong>মডেল:</strong> <code>nn.Sequential(nn.Linear(2, 8), nn.Tanh(), nn.Linear(8, 1), nn.Sigmoid())</code>—অধ্যায় ৫-এর W1, b1, tanh, W2, b2, sigmoid। <code>nn.BCELoss</code> = binary cross-entropy। full-batch SGD, η = ০.৫, ৮০০ epoch—সব অধ্যায় ৫-এর মতো।') +
      p('<strong>যা আলাদা:</strong> weight-এর শুরু। অধ্যায় ৫-এ W ∈ [−১, ১] সমভাবে এবং b1 = ০; PyTorch-এর <code>nn.Linear</code> ডিফল্টে [−১/√fan_in, ১/√fan_in] পরিসরে weight ও bias দুটিই দৈব নেয়—প্রথম layer-এ ±০.৭১, দ্বিতীয়তে ±০.৩৫। ছোট শুরু মানে প্রথম দিকে ধীরে শেখা।'),
    analogy: {
      text: 'একই রেসিপি দুই রাঁধুনিকে দিলে স্বাদ প্রায় এক হয়, যদি বাজার একই হয়। তাই প্রথমে নিশ্চিত করা হয়েছে দুজন একই দোকানের একই চাল পেয়েছেন (একই ডেটা)।',
      breaks: 'রাঁধুনির হাতের মাপে পার্থক্য থাকে, এখানে পার্থক্য ঠিক কোথায় তা আমরা জানি—weight-এর শুরু। আর একটি রান্না দেখে কে ভালো রাঁধুনি তা বলা যায় না; একটি seed দেখে কোন বাস্তবায়ন “ভালো” তা-ও না।',
    },
    worked:
      table(['মাপ', 'অধ্যায় ৫ (JavaScript, QuickJS)', 'এই প্রজেক্ট (PyTorch)'], [
        ['প্রথম বিন্দু', '[-0.149, -0.916]', '[-0.149, -0.916]'],
        ['test-এ “সব ০”', '0.588 (0.5875)', '0.5875'],
        ['loss: epoch ০ / ১০০ / ৭৯৯', '0.712 / 0.491 / 0.118', '0.707 / 0.671 / 0.131'],
        ['neural net test accuracy', '1 (৮০/৮০)', '0.9875 (৭৯/৮০)'],
        ['logistic regression test', '0.438', '0.4375'],
      ], 'একই ডেটা, দুই বাস্তবায়ন (দুটিই চালানো ফল)') +
      p('logistic regression-এর test accuracy দুই জায়গায় একই (০.৪৩৭৫), যদিও অধ্যায় ৫-এ সেটি w = ০ থেকে আর PyTorch-এ দৈব weight থেকে শুরু হয়েছে। কারণ logistic regression-এর loss উত্তল (convex): শুরু যাই হোক, একই সর্বনিম্নের দিকে যায়। neural network-এর loss উত্তল নয়; শুরু আলাদা হলে পথ আলাদা: epoch ১০০-এ PyTorch এখনও ০.৬৭১-এ, JavaScript ০.৪৯১-এ। শেষে দুটিই বৃত্ত শেখে; PyTorch একটি test বিন্দু ভুল করে।'),
    activity: p('<strong>প্রজেক্ট মানদণ্ড:</strong> (১) JavaScript সঙ্গী চালিয়ে দেখান প্রথম বিন্দু ও baseline Python-এর সাথে মেলে; (২) Python ফাইলটি নিজের কম্পিউটারে চালিয়ে আউটপুট মেলান (পার্থক্য থাকলে ভার্সন লিখুন); (৩) <code>torch.manual_seed(1)</code> বদলে ৫টি seed-এ neural net-এর test accuracy-র তালিকা বানান; (৪) PyTorch-এ অধ্যায় ৫-এর মতো [−১, ১] initialization দিন (<code>nn.init.uniform_(layer.weight, -1, 1)</code>) এবং epoch ১০০-এর loss তুলনা করুন।'),
    code: [
      {
        label: 'JavaScript সঙ্গী: একই ডেটা কিনা যাচাই',
        starter: RNG + String.raw`const rand = makeRng(77);
const gen = (n) => Array.from({ length: n }, () => { const x = [rand() * 2 - 1, rand() * 2 - 1]; return { x, y: x[0] ** 2 + x[1] ** 2 < 0.5 ? 1 : 0 }; });
const train = gen(160), test = gen(80);
const r3 = (v) => Math.round(v * 1000) / 1000;
const inside = train.filter((d) => d.y === 1).length;
const zero = test.filter((d) => d.y === 0).length / test.length;
console.log("প্রথম বিন্দু:", train[0].x.map(r3), "| train-এ ভেতরের বিন্দু:", inside);
console.log("test-এ “সব 0”:", zero);
console.log("PyTorch parameter সংখ্যা (2→8→1):", 2 * 8 + 8 + 8 * 1 + 1);
`,
        expect: ['প্রথম বিন্দু: [-0.149,-0.916] | train-এ ভেতরের বিন্দু: 76', 'test-এ “সব 0”: 0.5875', 'PyTorch parameter সংখ্যা (2→8→1): 33'],
        hints: ['Python আউটপুটের প্রথম দুই লাইনের সাথে মেলান।', 'makeRng(77)-কে 78 করুন: দুই ভাষাতেই বদলালে আবার মিলবে কি?'],
        test: '__assert(inside===76,"same label count as python run"); __close(zero,0.5875,1e-12,"same baseline"); __close(train[0].x[0],-0.149,0.0005,"first point x");',
      },
      py('06_circle_network.py', 'Python: একই ডেটায় PyTorch নেটওয়ার্ক'),
    ],
    line: ul([
      '<code>imul(a, b)</code> — JavaScript <code>Math.imul</code>-এর ৩২-বিট গুণ।',
      '<code>nonlocal a</code> — closure-এর অবস্থা বদলানো।',
      '<code>torch.tensor(labels).unsqueeze(1)</code> — (১৬০,) থেকে (১৬০, ১), মডেলের আউটপুটের shape-এর সাথে মেলাতে।',
      '<code>nn.Sequential(...)</code> — layer-গুলো ক্রমে; <code>model(X)</code> সবগুলো চালায়।',
      '<code>(model(X) &gt;= 0.5).float() == Y</code> — সম্ভাবনা থেকে লেবেল, তারপর মিল।',
      '<code>sum(p.numel() for p in net.parameters())</code> — ৩৩টি parameter।',
    ]),
    why: p('আগে ডেটার সমতা প্রমাণ, তারপর মডেলের তুলনা—এই ক্রমটাই প্রজেক্টের মূল শিক্ষা। পার্থক্য পেলে “PyTorch ভালো/খারাপ” না বলে নির্দিষ্ট কারণ (initialization) খোঁজা হয়েছে এবং এমন একটি পরীক্ষা (মানদণ্ড ৪) দেওয়া হয়েছে যা কারণটি নিশ্চিত বা বাতিল করতে পারে। অধ্যায় ১৪-এর গবেষণা-ট্র্যাকে এটিই হবে “নিয়ন্ত্রিত পরিবর্তন”।'),
    remember: ['তুলনার আগে ডেটা একই কিনা প্রমাণ', 'seed-যুক্ত জেনারেটর ভাষা বদলেও মেলানো যায়', 'nn.Sequential + BCELoss + SGD = অধ্যায় ৫-এর হাতের কোড', 'initialization ফলের পথ বদলায়', 'একটি seed-এর ফল সাধারণ সত্য নয়'],
    skip: ['Kaiming/Xavier initialization-এর গাণিতিক প্রমাণ', 'Adam দিয়ে একই পরীক্ষা', 'GPU-তে চালানো'],
    experiment: p('মানদণ্ড ৪ করুন: <code>for m in net: if isinstance(m, nn.Linear): nn.init.uniform_(m.weight, -1, 1); nn.init.zeros_(m.bias)</code>। এতে শুরু অধ্যায় ৫-এর <em>বণ্টনের</em> মতো হয়, কিন্তু সংখ্যাগুলো একই হয় না (Python-এর torch জেনারেটর আলাদা)। epoch ১০০-এর loss কি ০.৪৯-এর কাছাকাছি আসে?'),
    mistakes: ['ডেটা একই কিনা যাচাই না করে দুই বাস্তবায়ন তুলনা', 'লেবেলের shape (N,) রেখে আউটপুট (N, 1)-এর সাথে loss (broadcasting নীরবে (N, N) বানাতে পারে)', 'Python-এ ৩২-বিট কাটা ভুলে যাওয়া', '৭৯/৮০ বনাম ৮০/৮০-কে অর্থবহ পার্থক্য বলা'],
    solutionNote: p(`JavaScript সঙ্গী (QuickJS-এ চালানো) ও Python রান (লেখকের কম্পিউটারে, ${ms('06_circle_network.py')} মিলিসেকেন্ড) দুটিতেই প্রথম বিন্দু [−০.১৪৯, −০.৯১৬], train-এ ৭৬টি ভেতরের বিন্দু, baseline ০.৫৮৭৫—ডেটা একই। neural net: JavaScript ৮০/৮০, PyTorch ৭৯/৮০; ৮০টি বিন্দুতে একটির পার্থক্য পরিসংখ্যানগতভাবে অর্থবহ নয়। মানদণ্ড ৩-এর জন্য: এক seed-এর ফল দিয়ে কোনো বাস্তবায়নকে ভালো বলা যাবে না; ৫টি seed-এর গড় ও পরিসর দিন। লেবেলের shape-ভুলটি সত্যিকারের ঝুঁকি: <code>Ytr</code> (১৬০,) রেখে BCELoss দিলে PyTorch shape না মেলার ত্রুটি দেয়, কিন্তু নিজে লেখা <code>((pred - Y) ** 2).mean()</code> (১৬০, ১৬০)-এ broadcast হয়ে নীরবে ভুল সংখ্যা দেয়।`),
    quiz: [
      { q: 'দুই বাস্তবায়নের ডেটা একই—সবচেয়ে শক্ত প্রমাণ কোনটি?', a: { a: 'দুটিতে ১৬০টি বিন্দু', b: 'প্রথম বিন্দু এবং পুরো test সেটের baseline দুটিই মেলে', c: 'দুটিতে একই seed নম্বর লেখা' }, ok: 'b', why: 'seed নম্বর এক হলেও জেনারেটর আলাদা হতে পারে; ২৪০টি লেবেলের ফল মেলা অনেক শক্ত প্রমাণ।' },
      { q: 'logistic regression-এর ফল দুই জায়গায় মিলল, neural net-এর পথ আলাদা—কেন?', a: { a: 'PyTorch-এ বাগ', b: 'logistic loss উত্তল, শুরু যাই হোক একই সমাধান; neural net-এর loss উত্তল নয়', c: 'learning rate আলাদা' }, ok: 'b', why: 'উত্তল সমস্যায় একটিই সর্বনিম্ন; hidden layer যোগ করলে অনেক সর্বনিম্ন ও পথ থাকে।' },
      { q: 'JavaScript ৮০/৮০, PyTorch ৭৯/৮০। সঠিক উপসংহার?', a: { a: 'JavaScript বাস্তবায়ন ভালো', b: 'এক seed-এ এক বিন্দুর পার্থক্য; অনেক seed ছাড়া কিছু বলা যায় না', c: 'PyTorch ভুল' }, ok: 'b', why: 'ছোট test সেট ও এক seed-এ এই পার্থক্য noise-এর মধ্যে।' },
    ],
    recap: ['একই ডেটা প্রমাণ করে তবেই তুলনা', 'কয়েক লাইনের PyTorch = অধ্যায় ৫-এর পুরো হাতের কোড', 'পার্থক্যের নির্দিষ্ট কারণ: initialization'],
    nextNote: 'শেষ প্রজেক্ট: অধ্যায় ৬–৯-এর language model, এবার PyTorch-এ train করা:',
    synthetic: true,
    sources: [SRC.torchTensors, SRC.d2l, SRC.backprop, ['PyTorch docs: torch.nn.init', 'https://docs.pytorch.org/docs/stable/nn.init.html']],
  },
  {
    id: 'les-13-07-project-char-lm',
    slug: 'project-tiny-character-language-model',
    title: 'প্রজেক্ট: ছোট character-level language model',
    minutes: 70,
    prereqs: ['les-13-06-project-circle-pytorch', 'les-09-01-pretraining-loss'],
    summary: 'টেমপ্লেট থেকে বানানো ৭০টি সিন্থেটিক বাংলা বাক্য; কোড পয়েন্ট-ভিত্তিক vocabulary; তিন অক্ষরের context-এ embedding + MLP; uniform ও bigram baseline-এর সাথে val loss ও perplexity; seed-যুক্ত নমুনা এবং কোনগুলো শুধু মুখস্থ, তার সৎ বিশ্লেষণ।',
    overview: p('অধ্যায় ৬–৯-এ language model-এর ধারণা দেখেছি: পরের token-এর সম্ভাবনা, cross-entropy loss, perplexity, sampling। এখন PyTorch-এ সত্যিই একটি train করব—অক্ষর ধরে, খুব ছোট, CPU-তে কয়েক সেকেন্ডে। এর বাক্যগুলো টেমপ্লেট থেকে বানানো, তাই মডেল যা শিখবে তা আসলে টেমপ্লেটের নিয়ম। এই সীমাটিই প্রজেক্টের গুরুত্বপূর্ণ শিক্ষা: কম loss মানে ভাষা বোঝা নয়।'),
    objectives: ['টেক্সট থেকে character vocabulary ও (context, পরের অক্ষর) উদাহরণ বানাতে পারবেন', 'embedding + MLP language model train করে baseline-এর সাথে val loss তুলনা করতে পারবেন', 'নমুনা বাক্যে মুখস্থ, পুনর্মিশ্রণ ও অর্থহীনতা আলাদা করে চিহ্নিত করতে পারবেন'],
    problem: p('val loss ৩.৫ থেকে ০.৩৩-এ নেমেছে, perplexity ১.৪। শুনতে অসাধারণ। কিন্তু মডেলটি কি বাংলা শিখল, নাকি পাঁচটি টেমপ্লেট মুখস্থ করল? আর মুখস্থ ও শেখার পার্থক্য আপনি কোন সংখ্যা বা পরীক্ষা দিয়ে দেখাবেন?'),
    explain:
      p('<strong>ডেটা (সিন্থেটিক):</strong> ৫টি পণ্য × ৪টি রং × ৫টি টেমপ্লেট (“{রং} {পণ্য} কি স্টকে আছে” ইত্যাদি); যে টেমপ্লেটে রং নেই, সেখানে পুনরাবৃত্তি বাদ দিয়ে মোট ৭০টি ভিন্ন বাক্য। seed দিয়ে এলোমেলো করে ৫৬টি train, ১৪টি val—<em>বাক্য ধরে</em> ভাগ, যাতে val-এর বাক্য train-এ না থাকে।') +
      p('<strong>vocabulary:</strong> প্রতিটি Unicode কোড পয়েন্ট একটি token (অধ্যায় ৬-এর মতো, স্বরচিহ্নও আলাদা), সাথে ০ নম্বর একটি বিশেষ চিহ্ন “|”—বাক্যের শুরু ও শেষ। মোট V = ৩৫।') +
      p('<strong>মডেল:</strong> আগের ৩টি token → প্রতিটির ১৬-মাত্রার embedding (অধ্যায় ৭) → জোড়া লাগিয়ে ৪৮ → ১২৮ tanh → ৩৫টি logit। এটি Bengio ও সহকর্মীদের ২০০৩ সালের নিউরাল language model-এর ক্ষুদ্র রূপ, Karpathy-র makemore সিরিজের মতো। transformer নয়—context মাত্র ৩টি অক্ষর।') +
      p('<strong>তুলনার ভিত্তি:</strong> (ক) uniform: প্রতিটি অক্ষর সমান সম্ভাব্য, loss = ln ৩৫ = ৩.৫৫৫; (খ) bigram: শুধু আগের ১টি অক্ষর দেখে গণনা-ভিত্তিক সম্ভাবনা (add-1 smoothing)। MLP-কে দুটিকেই ছাড়াতে হবে।') +
      p('<strong>training:</strong> Adam, lr ০.০০৩, প্রতি ধাপে ৬৪টি দৈব উদাহরণ, ১৫০০ ধাপ। <code>torch.set_num_threads(1)</code> ও seed দিয়ে ফল পুনরুৎপাদনযোগ্য—লেখকের কম্পিউটারে দুবার চালিয়ে হুবহু একই আউটপুট মেলানো হয়েছে।'),
    analogy: {
      text: 'এই মডেল হলো এমন এক শিক্ষার্থী যে দোকানের পাঁচটি ছাপানো প্রশ্নপত্র বারবার পড়েছে: প্রশ্নের ধাঁচ চমৎকার নকল করতে পারে, এমনকি নতুন মিশ্রণও বানায়।',
      breaks: 'মানুষ শিক্ষার্থী প্রশ্নের মানে বোঝে; এই মডেল শুধু অক্ষরের ক্রম। “সবুজ ওড়না কুর্তি এর দাম কত” তার কাছে ঠিক ততটাই স্বাভাবিক যতটা ধাঁচের সাথে মেলে—অর্থ নিয়ে তার কোনো ধারণা নেই।',
    },
    worked:
      table(['মডেল', 'val loss', 'perplexity (e^loss)'], [
        ['uniform (৩৫টি অক্ষর)', '3.555', '35.00'],
        ['bigram (গণনা)', '1.890', '6.62'],
        ['MLP, ধাপ ১৫০০', '0.334', '1.40'],
      ], 'একই val বাক্যে (৩৩৯টি পূর্বাভাস); চালানো ফল') +
      p('perplexity ১.৪০ মানে প্রতি অক্ষরে মডেল গড়ে প্রায় ১.৪টি বিকল্পের মধ্যে দ্বিধায়—টেমপ্লেটের ভেতরে প্রায় সব অক্ষর নির্ধারিত, অনিশ্চয়তা শুধু রং ও পণ্যের নামের শুরুতে। train ০.২৭১ ও val ০.৩৩৪ কাছাকাছি, কারণ val-এর বাক্যও একই টেমপ্লেটের নতুন মিশ্রণ। এটি ভাষায় সাধারণীকরণের প্রমাণ নয়; টেমপ্লেটের বাইরের যেকোনো বাক্যে (“শাড়িটা কি সুতি?”) loss অনেক বেশি হবে।') +
      p('<strong>নমুনা বিশ্লেষণ (৬টি, seed ০–৫):</strong>') +
      ul([
        '২টি train-এ হুবহু আছে (“আমি সবুজ থ্রি-পিস নিতে চাই”, “আমি লাল থ্রি-পিস নিতে চাই”)—মুখস্থ।',
        '“ওড়না এর দাম কত”, “সবুজ থ্রি-পিস নিতে চাই”—নতুন, টেমপ্লেটের অংশ বাদ পড়েছে; পড়তে প্রায় স্বাভাবিক।',
        '“সবুজ ওড়না কুর্তি এর দাম কত”—দুটি পণ্য পাশাপাশি; ধাঁচ ঠিক, অর্থ ভুল।',
        '“সবুজ শাড়ি ঢাকার বাইরে কবে পাঞ্জাবি কি স”—দুই টেমপ্লেট মিশে ৪০ অক্ষরের সীমায় কাটা পড়েছে।',
      ]) +
      p('“নতুন বাক্য” লেবেলটি স্ক্রিপ্ট বসায় শুধু train ও val-এ হুবহু না থাকলে—নতুন মানেই ভালো নয়।'),
    activity: p('<strong>প্রজেক্ট মানদণ্ড:</strong> (১) JavaScript সঙ্গী দিয়ে কর্পাসের মাপ (৭০ বাক্য, V = ৩৫) ও perplexity রূপান্তর যাচাই; (২) Python ফাইল নিজের কম্পিউটারে চালিয়ে টেবিল মেলান; (৩) <code>CTX = 1</code> করে MLP-কে bigram-এর সাথে তুলনা করুন—কাছাকাছি আসে কেন?; (৪) টেমপ্লেটের বাইরের ৩টি বাক্য বানিয়ে তাদের loss মাপুন (নিচের experiment); (৫) এক অনুচ্ছেদে লিখুন এই মডেল কী পারে আর কী পারে না।'),
    code: [
      {
        label: 'JavaScript সঙ্গী: কর্পাস ও perplexity যাচাই',
        starter: String.raw`const items = ["শাড়ি", "কুর্তি", "ওড়না", "থ্রি-পিস", "পাঞ্জাবি"];
const colors = ["নীল", "লাল", "সবুজ", "সাদা"];
const templates = ["{c} {i} কি স্টকে আছে", "{c} {i} এর দাম কত", "{i} ঢাকার বাইরে কবে পাব", "আমি {c} {i} নিতে চাই", "{i} ফেরত দেওয়া যাবে কি"];
const set = new Set();
for (const t of templates) for (const c of colors) for (const i of items) set.add(t.replace("{c}", c).replace("{i}", i));
const chars = new Set([...set].flatMap((s) => [...s]));
const V = chars.size + 1;
console.log("বাক্য:", set.size, "| ভিন্ন অক্ষর:", chars.size, "| V (শেষ-চিহ্নসহ):", V);
const rows = [["uniform", Math.log(V)], ["bigram", 1.890], ["MLP", 0.334]];
for (const [name, L] of rows) console.log(name + ": loss " + L.toFixed(3) + " → perplexity " + Math.exp(L).toFixed(2));
const longest = [...set].reduce((m, s) => Math.max(m, [...s].length), 0);
console.log("দীর্ঘতম বাক্যের কোড পয়েন্ট:", longest, "(নমুনার সীমা 40)");
`,
        expect: ['বাক্য: 70 | ভিন্ন অক্ষর: 34 | V (শেষ-চিহ্নসহ): 35', 'uniform: loss 3.555 → perplexity 35.00', 'bigram: loss 1.890 → perplexity 6.62', 'MLP: loss 0.334 → perplexity 1.40'],
        hints: ['টেমপ্লেটে {c} না থাকলে replace কিছু করে না, তাই একই বাক্য ৪ বার আসে—Set সেগুলো একটি করে।', 'দীর্ঘতম বাক্য ৪০-এর কম হলে, ৪০-এ কাটা পড়া নমুনা নিশ্চিতভাবে কোনো টেমপ্লেটের বাক্য নয়।'],
        test: '__assert(set.size===70,"70 sentences like python"); __assert(V===35,"vocab like python"); __close(Math.log(V),3.555,0.0005,"uniform"); __close(Math.exp(0.334),1.3965,0.0005,"ppl"); __assert(longest<40,"cap only hits run-on samples");',
      },
      py('07_char_lm.py', 'Python: character-level language model'),
    ],
    line: ul([
      '<code>sorted({t.format(...) for ...})</code> — set comprehension, পুনরাবৃত্তি বাদ; sorted করে ক্রম স্থির, তারপর seed-যুক্ত shuffle।',
      '<code>stoi</code> / <code>itos</code> — অক্ষর ↔ সংখ্যা (string-to-index)।',
      '<code>ctx = ctx[1:] + [ix]</code> — context জানালা এক ঘর সরানো।',
      '<code>self.emb(x).view(x.shape[0], -1)</code> — (B, ৩, ১৬) থেকে (B, ৪৮); <code>-1</code> মানে “বাকিটা নিজে হিসাব করো”।',
      '<code>F.cross_entropy(logits, targets)</code> — softmax + negative log-likelihood একসাথে (অধ্যায় ৯)।',
      '<code>torch.multinomial(p, 1, generator=gen)</code> — সম্ভাবনা অনুযায়ী একটি token বাছাই (T = ১)।',
    ]),
    why: p('টেমপ্লেট-কর্পাস বেছে নেওয়া হয়েছে কারণ এর “সত্য” আমরা জানি: কোনটি মুখস্থ, কোনটি নতুন মিশ্রণ, কোনটি অর্থহীন, তা নির্ভুলভাবে চেনা যায়। বাস্তব টেক্সটে এই বিশ্লেষণ অনেক কঠিন, কিন্তু প্রশ্নগুলো একই: baseline-এর তুলনায় কতটা, train-val ব্যবধান কত, আর নমুনার কতটা train ডেটার কপি।'),
    remember: ['baseline: uniform (ln V) ও bigram', 'বাক্য ধরে train/val ভাগ', 'perplexity = e^loss', 'কম loss ≠ ভাষা বোঝা; ডেটার পরিধিই সীমা', 'নমুনার কতটা মুখস্থ, তা মাপুন'],
    skip: ['transformer দিয়ে একই কাজ (D2L-এর অধ্যায় দেখুন)', 'BPE token-এ train', 'temperature ও top-p (অধ্যায় ৯-এ আছে)'],
    experiment: p('training-এর পরে <code>def nll(s): X, Y = make_xy([s]); return F.cross_entropy(model(X), Y).item()</code> লিখে তিনটি বাক্য মাপুন: একটি val বাক্য, “নীল শাড়ি কি স্টকে আছে” (train বা val-এ থাকতে পারে), আর টেমপ্লেটের বাইরের “শাড়িটা কি সুতি”। তৃতীয়টির loss কত গুণ বেশি? যে অক্ষর কর্পাসে নেই (যেমন “ট” যদি না থাকে), <code>stoi.get(ch, 0)</code> তাকে শেষ-চিহ্ন বানিয়ে দেয়—এটি কেন ফলকে বিকৃত করে, লিখুন।'),
    mistakes: ['অক্ষর বা token ধরে train/val ভাগ (একই বাক্যের অংশ দুই দিকে চলে যায়)', 'baseline ছাড়া loss রিপোর্ট', 'নমুনা train-এ আছে কিনা না দেখে “সৃজনশীল” বলা', 'ছোট সিন্থেটিক কর্পাসের ফলকে বাস্তব বাংলায় সাধারণ করা', 'অজানা অক্ষরকে চুপচাপ অন্য token বানিয়ে ফেলা'],
    solutionNote: p(`সব সংখ্যা চালানো ফল: Python লেখকের কম্পিউটারে (${ms('07_char_lm.py')} মিলিসেকেন্ড, import-সহ; অন্য কম্পিউটারে ভিন্ন হবে), JavaScript সঙ্গী QuickJS-এ। মানদণ্ড ৩: লেখকের কম্পিউটারে CTX = ১ দিয়ে চালিয়ে val loss এসেছে ১.৪৭৬ (bigram গণনা ১.৮৯০, CTX = ৩-এ ০.৩৩৪)। দুটি মডেলই শুধু আগের অক্ষর দেখে, তবু MLP ভালো—কারণ add-1 smoothing ৩৫ × ৩৫ = ১,২২৫টি কাল্পনিক গণনা যোগ করে, যা মাত্র ১,৩৬৯টি প্রশিক্ষণ-উদাহরণের পাশে অনেক বেশি। শিক্ষা: baseline-ও ঠিকমতো tune করতে হয় (ছোট smoothing, যেমন 0.01, দিয়ে আবার মাপুন), নইলে নতুন মডেলকে অন্যায্য সুবিধা দেওয়া হয়। আসল বড় উন্নতি আসে তিন অক্ষরের context থেকে (১.৪৭৬ → ০.৩৩৪)। মানদণ্ড ৫-এর একটি সৎ উত্তর: “মডেলটি পাঁচটি টেমপ্লেটের অক্ষর-ধাঁচ শিখেছে এবং তাদের নতুন মিশ্রণ বানাতে পারে; ৬টি নমুনার ২টি হুবহু train বাক্য, ১টি অর্থহীন মিশ্রণ। টেমপ্লেটের বাইরের বাংলা, অর্থ, বা তথ্য সম্পর্কে এটি কিছুই জানে না।”`),
    quiz: [
      { q: 'V = ৩৫ হলে uniform মডেলের loss?', a: { a: 'ln ৩৫ ≈ ৩.৫৫৫', b: '১/৩৫', c: '৩৫' }, ok: 'a', why: 'প্রতিটি অক্ষরের সম্ভাবনা ১/৩৫; −ln(১/৩৫) = ln ৩৫।' },
      { q: 'val loss ০.৩৩ এই কর্পাসে কী প্রমাণ করে?', a: { a: 'মডেল বাংলা বোঝে', b: 'মডেল এই টেমপ্লেটগুলোর অক্ষর-ধাঁচ ভালোভাবে শিখেছে', c: 'মডেল কোনো কিছু মুখস্থ করেনি' }, ok: 'b', why: 'val বাক্যও একই টেমপ্লেটের; টেমপ্লেটের বাইরে কী হয় তা এই সংখ্যা বলে না। নমুনায় মুখস্থও দেখা গেছে।' },
      { q: 'train/val ভাগ বাক্য ধরে কেন, অক্ষর ধরে নয়?', a: { a: 'দ্রুত হয়', b: 'অক্ষর ধরে ভাগ করলে একই বাক্যের অংশ দুই দিকে যায়, val তখন আর অদেখা থাকে না', c: 'PyTorch-এর নিয়ম' }, ok: 'b', why: 'ডেটা ফাঁস (leakage) এড়াতে মূল্যায়নের একক হতে হবে স্বাধীন ইউনিট—এখানে বাক্য।' },
    ],
    recap: ['PyTorch-এ সত্যিকারের language model train', 'uniform ও bigram baseline-এর সাথে তুলনা', 'নমুনায় মুখস্থ ও অর্থহীনতা চিহ্নিত করা', 'কম loss-এর সীমা সৎভাবে বলা'],
    nextNote: 'কোর্সের শেষ অধ্যায়: দুটি ক্যাপস্টোন—একটি engineering, একটি research:',
    synthetic: true,
    sources: [SRC.karpathyMakemore, ['Bengio et al. (2003) A Neural Probabilistic Language Model', 'https://www.jmlr.org/papers/v3/bengio03a.html'], SRC.jurafsky, SRC.torchData],
  },
];

export default { chapter, lessons };

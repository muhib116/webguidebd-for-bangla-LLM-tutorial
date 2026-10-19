import { p, ul, ol, code, out, note, warn, table, term, SRC } from './lib.mjs';

const chapter = {
  id: 'ch-09-llm-training-generation',
  slug: 'llm-training-generation',
  title: 'LLM Training ও Text Generation',
  order: 9,
  public: false,
  summary: 'Pretraining-এর next-token loss ও teacher forcing; temperature, greedy, top-k, top-p sampling; seed ও পুনরুৎপাদন; fine-tuning, instruction tuning, preference optimization (DPO); calibration ও hallucination।',
  overview: p(
    'অধ্যায় ৮-এর Transformer প্রতিটি অবস্থানে পরের token-এর logit (softmax-এর আগের স্কোর) দেয়। এই অধ্যায়ে দুটি প্রশ্ন: কীভাবে train হয় (বিশাল টেক্সটে প্রতিটি অবস্থানের next-token cross-entropy), আর কীভাবে টেক্সট তৈরি হয় (logit থেকে token বাছাইয়ের নিয়ম—greedy, temperature, top-k, top-p)। তারপর pretraining-এর পরের ধাপ—instruction fine-tuning ও preference optimization—এর loss কোডে দেখব, এবং কেন সাবলীল উত্তর মানেই সত্য উত্তর নয় (hallucination, calibration)।',
    'প্রজেক্ট: seed-যুক্ত একটি sampling playground, যেখানে প্রতিটি রূপান্তরের পর বণ্টন, ১০০০ বার sampling-এর গণনা এবং তৈরি বাক্যের পুনরাবৃত্তি মাপা যায়।'
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
const SM = String.raw`const r3 = (x) => Math.round(x * 1000) / 1000;
function softmax(z) { const m = Math.max(...z); const e = z.map((v) => Math.exp(v - m)); const s = e.reduce((a, b) => a + b, 0); return e.map((v) => v / s); }
`;

const lessons = [
  {
    id: 'les-09-01-pretraining-loss',
    synthetic: true,
    slug: 'pretraining-next-token-loss',
    title: 'Pretraining: প্রতিটি অবস্থানে Next-Token Loss',
    minutes: 40,
    prereqs: ['les-08-05-project-attention-calculator', 'les-06-05-smoothing-perplexity'],
    summary: 'একটি ক্রম থেকে n−১টি প্রশিক্ষণ-উদাহরণ; logit → log-softmax → সঠিক token-এর −log p; গড় loss ও perplexity; teacher forcing; ডেটা ও compute-এর মাপ।',
    overview: p('Pretraining-এর লক্ষ্য একটাই: বিশাল টেক্সটে প্রতিটি অবস্থানে পরের token-এর সম্ভাব্যতা বাড়ানো। n token-এর একটি ক্রম causal mask-সহ একবার Transformer-এ দিলে n−১টি অনুমান একসাথে পাওয়া যায়—প্রতিটি অবস্থান তার আগের সব token দেখে পরেরটি অনুমান করে। loss = সঠিক token-গুলোর −log p-এর গড়, অধ্যায় ৬-এর cross-entropy। এই পাঠে একটি ছোট logit টেবিল থেকে loss হাতে ও কোডে হিসাব করব, teacher forcing বুঝব, এবং ডেটা ও মডেল-আকারের সম্পর্ক (Chinchilla) সম্পর্কে সতর্কভাবে জানব।'),
    objectives: ['একটি ক্রমকে (ইনপুট, লক্ষ্য) জোড়ায় ভাগ করতে পারবেন', 'logit থেকে log-softmax ও গড় cross-entropy হিসাব করতে পারবেন', 'teacher forcing ও generation-এর পার্থক্য ব্যাখ্যা করতে পারবেন'],
    problem: p('ধরুন একটি বাক্য “ডেলিভারি চার্জ কত টাকা”। মডেলকে এই একটি বাক্য থেকে কতগুলো জিনিস শেখানো যায়? আর প্রতিটি অনুমান কতটা ভালো হলো তা একটি সংখ্যায় কীভাবে মাপব, যাতে gradient descent সেটি কমাতে পারে?'),
    explain:
      p('<strong>ইনপুট ও লক্ষ্য:</strong> token [t₀, t₁, t₂, t₃]। ইনপুট = [t₀, t₁, t₂], লক্ষ্য = [t₁, t₂, t₃]—এক ঘর সরানো। অবস্থান i-এর আউটপুট logit zᵢ থেকে লক্ষ্য tᵢ₊₁-এর সম্ভাব্যতা।') +
      p(`<strong>Loss:</strong> L = −(১/(n−১)) Σᵢ log softmax(zᵢ)[tᵢ₊₁]। স্থিতিশীলতার জন্য ${term('log-softmax', 'log-softmax')} = z − max(z) − log Σ e^(z − max(z)) সরাসরি হিসাব করা হয়।`) +
      p(`${term('টিচার ফোর্সিং', 'teacher forcing')}: training-এ প্রতিটি অবস্থানের ইনপুট হলো <em>আসল</em> আগের token, মডেলের নিজের অনুমান নয়। তাই এক জায়গার ভুল পরের অবস্থানে ছড়ায় না, এবং সব অবস্থান সমান্তরালে হিসাব হয়। generation-এ কিন্তু মডেল নিজের আগের আউটপুটই পড়ে—এই অমিলকে exposure bias বলা হয়।`) +
      p('<strong>মাপ:</strong> Hoffmann et al. (Chinchilla, ২০২২) একটি নির্দিষ্ট compute বাজেটে মডেল-আকার ও training token-এর ভারসাম্য বিশ্লেষণ করে প্রায় “প্রতি parameter-এ ~২০ token” অনুপাতের কাছাকাছি সর্বোত্তম পেয়েছিলেন। এটি ঐ গবেষণার সেটআপের ফল, সব মডেলের নিয়ম নয়—পরে অনেক মডেল ইচ্ছাকৃতভাবে এর চেয়ে অনেক বেশি token-এ train হয়েছে (inference সস্তা রাখতে)।') +
      warn('কম loss মানে মডেল training বিতরণের টেক্সট ভালো অনুমান করে—এটি সত্যবাদিতা, নিরাপত্তা বা নির্দেশ মানার প্রমাণ নয়। সেগুলো আলাদা ধাপ ও মূল্যায়নের বিষয় (পাঠ ৯.৪–৯.৫)।'),
    analogy: {
      text: 'Teacher forcing হলো গান শেখার সময় শিক্ষক প্রতিটি লাইনের শুরুতে সঠিক সুর ধরিয়ে দেন—আপনি আগের লাইনে ভুল করলেও পরের লাইন সঠিক জায়গা থেকে শুরু হয়।',
      breaks: 'মঞ্চে (generation) শিক্ষক নেই—একটি ভুল সুর পরের সব লাইনকে প্রভাবিত করে। গানের ছাত্র মঞ্চে ভুল সামলাতে শেখে; সাধারণ pretraining এই পরিস্থিতি সরাসরি অনুশীলন করায় না।',
    },
    worked:
      p('vocabulary [ডেলিভারি, চার্জ, কত, টাকা], লক্ষ্য ক্রম: চার্জ → কত।') +
      ol([
        'অবস্থান ০ (“ডেলিভারি” দেখে) logit = [০, ২, ১, ০]; e-ঘাত [১, ৭.৩৮৯, ২.৭১৮, ১], যোগ ১২.১০৭; softmax ≈ [০.০৮৩, ০.৬১০, ০.২২৫, ০.০৮৩]; লক্ষ্য “চার্জ” → −log ০.৬১০ ≈ ০.৪৯৪।',
        'অবস্থান ১ (“চার্জ” দেখে) logit = [০, ০, ২, ১]—একই সংখ্যা, ভিন্ন ক্রম; লক্ষ্য “কত” → ০.৪৯৪।', 'অবস্থান ২ (“কত” দেখে) logit = [০, ০, ০, ৩]; p(টাকা) = ২০.০৯/২৩.০৯ ≈ ০.৮৭০ → ০.১৩৯।',
        'গড় loss ≈ (০.৪৯৪ + ০.৪৯৪ + ০.১৩৯)/৩ ≈ ০.৩৭৬; perplexity ≈ e^০.৩৭৬ ≈ ১.৪৬।',
        'uniform মডেল: loss = ln ৪ ≈ ১.৩৮৬, perplexity ৪।',
      ]),
    activity: note('কোডে ক্রম → (ইনপুট, লক্ষ্য), স্থিতিশীল log-softmax, প্রতি-অবস্থান loss টেবিল, এবং uniform baseline-এর সাথে তুলনা।'),
    code: [
      {
        label: 'প্রতি-অবস্থান cross-entropy',
        starter: String.raw`const r3 = (x) => Math.round(x * 1000) / 1000;
function logSoftmax(z) { const m = Math.max(...z); const lse = m + Math.log(z.reduce((s, v) => s + Math.exp(v - m), 0)); return z.map((v) => v - lse); }

const vocab = ["ডেলিভারি", "চার্জ", "কত", "টাকা"];
const seq = ["ডেলিভারি", "চার্জ", "কত", "টাকা"].map((t) => vocab.indexOf(t));
const inputs = seq.slice(0, -1), targets = seq.slice(1);
console.log("ইনপুট:", inputs.map((i) => vocab[i]).join(" "), "| লক্ষ্য:", targets.map((i) => vocab[i]).join(" "));

// একটি কাল্পনিক মডেলের প্রতি-অবস্থান logit (হাতে লেখা)
const logits = [[0, 2, 1, 0], [0, 0, 2, 1], [0, 0, 0, 3]];
let total = 0;
logits.forEach((z, i) => {
  const lp = logSoftmax(z)[targets[i]];
  total += -lp;
  console.log("অবস্থান", i, "দেখে «" + vocab[inputs[i]] + "» → লক্ষ্য «" + vocab[targets[i]] + "» p =", r3(Math.exp(lp)), "loss =", r3(-lp));
});
const loss = total / logits.length;
console.log("গড় loss =", r3(loss), "| perplexity =", r3(Math.exp(loss)), "| uniform loss =", r3(Math.log(vocab.length)));
console.log("বিশাল logit-এ স্থিতিশীল:", logSoftmax([1000, 0, 0, 0]).map(r3));
`,
        expect: ['ইনপুট: ডেলিভারি চার্জ কত | লক্ষ্য: চার্জ কত টাকা', 'অবস্থান 0 দেখে «ডেলিভারি» → লক্ষ্য «চার্জ» p = 0.61 loss = 0.494', 'গড় loss = 0.376 | perplexity = 1.456', 'uniform loss = 1.386', 'বিশাল logit-এ স্থিতিশীল: [0,-1000,-1000,-1000]'],
        hints: ['চার্টের তৃতীয় অবস্থানে logit [0,0,0,3]—p কত? loss কেন কম?', 'logits[0]-কে [3, 0, 0, 0] করুন (মডেল ভুল token-এ আত্মবিশ্বাসী)। loss কত হয়?', 'ক্রম n token-এর হলে প্রশিক্ষণ-উদাহরণ কয়টি?'],
        test: '__close(Math.exp(logSoftmax([0,2,1,0])[1]),0.6103,1e-3,"worked"); __assert(loss<Math.log(4),"beats uniform"); __assert(logSoftmax([1000,0,0,0]).every(isFinite),"stable");',
      },
    ],
    line: ul([
      '<code>seq.slice(0, -1)</code> ও <code>seq.slice(1)</code>: এক ঘর সরানো ইনপুট ও লক্ষ্য।',
      '<code>logSoftmax</code>: log-sum-exp কৌশল—সরাসরি log(softmax) করলে ছোট সম্ভাব্যতায় log(০) হতে পারে।',
      'প্রতিটি অবস্থান আলাদা লাইনে—কোথায় মডেল দুর্বল তা দেখা যায়।',
    ]),
    why: p('logit হাতে লেখা যাতে worked উদাহরণের সাথে মেলে; বাস্তবে এগুলো Transformer-এর শেষ স্তর থেকে আসে। uniform baseline পাশে রাখা হয়েছে কারণ “loss ০.৪” একা কোনো অর্থ বহন করে না।'),
    remember: ['একটি ক্রম = n−১টি অনুমান', 'loss = গড় −log p(সঠিক)', 'log-softmax স্থিতিশীলভাবে', 'teacher forcing: training-এ আসল আগের token'],
    skip: ['distributed training', 'mixed precision', 'tokenizer-এর প্রভাব loss-তুলনায়'],
    experiment: p('একটি অবস্থানে মডেল লক্ষ্যকে p = ০.০০১ দিলে loss কত (−log ০.০০১)? গড় loss-এ এর প্রভাব কেমন? এই কারণে training ডেটার কিছু অদ্ভুত টেক্সট gradient-এ বড় প্রভাব ফেলতে পারে।'),
    mistakes: ['ইনপুট ও লক্ষ্য এক ঘর না সরানো', 'log(softmax) আলাদা করে হিসাব করে underflow', 'কম loss-কে সত্যবাদিতার প্রমাণ ভাবা', 'Chinchilla অনুপাতকে সর্বজনীন নিয়ম বলা'],
    quiz: [
      { q: '১০ token-এর একটি ক্রম থেকে কতগুলো next-token অনুমান?', a: { a: '১০', b: '৯', c: '১' }, ok: 'b', why: 'শেষ token-এর পরে লক্ষ্য নেই।' },
      { q: 'teacher forcing-এ অবস্থান i-এর ইনপুট কী?', a: { a: 'মডেলের আগের অনুমান', b: 'আসল আগের token-গুলো', c: 'দৈব token' }, ok: 'b', why: 'training-এ আসল ক্রম দেওয়া হয়, তাই সব অবস্থান সমান্তরালে হিসাব হয়।' },
      { q: 'V = ৫০,০০০-এ uniform মডেলের loss প্রায়?', a: { a: '১০.৮', b: '৫০,০০০', c: '১' }, ok: 'a', why: 'ln ৫০,০০০ ≈ ১০.৮২। training শুরুর loss সাধারণত এর কাছে থাকে।' },
    ],
    recap: ['pretraining = বিশাল পরিসরে next-token cross-entropy', 'সমান্তরাল training-এর জন্য teacher forcing', 'loss ≠ সত্যবাদিতা'],
    nextNote: 'train হলো। এবার logit থেকে টেক্সট—greedy ও temperature:',
    sources: [SRC.gpt2, SRC.chinchilla, SRC.d2l],
  },
  {
    id: 'les-09-02-greedy-temperature',
    synthetic: true,
    slug: 'greedy-temperature',
    title: 'Greedy ও Temperature Sampling',
    minutes: 40,
    prereqs: ['les-09-01-pretraining-loss'],
    summary: 'greedy = argmax; temperature T: softmax(z/T); T < ১ তীক্ষ্ণ, T > ১ চ্যাপ্টা; T = ০ গাণিতিকভাবে অসংজ্ঞায়িত, তাই greedy হিসেবে আলাদা সামলানো; seed-যুক্ত sampling ও entropy।',
    overview: p('logit থেকে পরের token বাছাইয়ের সবচেয়ে সহজ নিয়ম greedy: সর্বোচ্চ logit-এর token। এটি নির্ধারিত কিন্তু প্রায়ই একঘেয়ে ও পুনরাবৃত্তিমূলক। Sampling বণ্টন থেকে দৈবভাবে বাছে, আর temperature T সেই বণ্টনের আকার বদলায়: p = softmax(z / T)। T ছোট হলে সর্বোচ্চটি প্রায় নিশ্চিত, বড় হলে সব token প্রায় সমান। T = ০-তে ভাগ শূন্য দিয়ে—তাই বাস্তব কোডে T = ০ মানে “greedy” হিসেবে আলাদা শাখা। এই পাঠে বিভিন্ন T-তে বণ্টন, entropy ও seed-যুক্ত sampling-এর গণনা দেখব।'),
    objectives: ['temperature প্রয়োগ করে বণ্টন হিসাব করতে পারবেন', 'T = ০ কেন আলাদা সামলাতে হয় ব্যাখ্যা ও কোডে করতে পারবেন', 'seed-যুক্ত sampling দিয়ে পুনরুৎপাদনযোগ্য ফল পেতে পারবেন'],
    problem: p('একটি চ্যাটবট সবসময় হুবহু একই উত্তর দেয়—গ্রাহক বিরক্ত। আরেকটি সেটিং-এ উত্তর এত এলোমেলো যে মাঝে মাঝে অর্থহীন শব্দ আসে। দুটোর মাঝে একটি “নব” আছে—temperature। কিন্তু কোন মানে কী ঘটে, আর T = ০ লিখলে কোড কেন ক্র্যাশ করতে পারে?'),
    explain:
      p(`${term('গ্রিডি', 'greedy')}: argmax(z)। সমান সর্বোচ্চ হলে একটি নির্ধারিত নিয়ম লাগে (যেমন ছোট index)।`) +
      p(`${term('টেম্পারেচার', 'temperature')}: pᵢ = e^(zᵢ/T) / Σⱼ e^(zⱼ/T)। T = ১ মূল বণ্টন। T → ০ হলে সর্বোচ্চ logit-এর p → ১ (greedy-র সীমা)। T → ∞ হলে সব p → ১/V।`) +
      p(`${term('এনট্রপি', 'entropy')}: H = −Σ pᵢ log pᵢ—বণ্টন কতটা “ছড়ানো”। one-hot-এ ০, uniform-এ log V। T বাড়লে entropy বাড়ে।`) +
      p('<strong>Sampling-এর কৌশল:</strong> ০–১-এর একটি দৈব সংখ্যা u; cumulative যোগফল প্রথম যেখানে u ছাড়ায় সেই token। seed-যুক্ত জেনারেটর হলে একই seed-এ একই ক্রম।') +
      warn('কিছু API-তে temperature = ০ দিলেও সম্পূর্ণ নির্ধারিত আউটপুটের নিশ্চয়তা থাকে না (সমান্তরাল হার্ডওয়্যারে ক্ষুদ্র সংখ্যাগত পার্থক্য, batch-এর প্রভাব ইত্যাদি)। নির্দিষ্ট প্রদানকারীর ডকুমেন্টেশন দেখুন; এখানে আমাদের নিজের কোডে T = ০ ঠিক greedy।'),
    analogy: {
      text: 'Temperature হলো রান্নায় মশলার সাহস: কম হলে সবসময় চেনা স্বাদ (নিরাপদ, একঘেয়ে), বেশি হলে নতুন স্বাদ—কখনো দারুণ, কখনো খাওয়ার অযোগ্য।',
      breaks: 'রাঁধুনি স্বাদ চেখে মশলা ঠিক করেন; মডেল তার নিজের আউটপুটের মান যাচাই করে না—উচ্চ temperature-এ অর্থহীন token এলেও সে চালিয়ে যায়।',
    },
    worked:
      p('logit z = [২, ১, ০]।') +
      ol([
        'T = ১: softmax ≈ [০.৬৬৫, ০.২৪৫, ০.০৯০]।',
        'T = ০.৫: z/T = [৪, ২, ০] → ≈ [০.৮৬৭, ০.১১৭, ০.০১৬]।',
        'T = ২: z/T = [১, ০.৫, ০] → ≈ [০.৫০৬, ০.৩০৭, ০.১৮৬]।',
        'T = ০: greedy → token ০, সম্ভাব্যতা ১।',
      ]),
    activity: note('কোডে applyTemperature (T = ০ সহ), entropy, এবং seed-যুক্ত ২০০০ নমুনার গণনা প্রত্যাশিত সম্ভাব্যতার সাথে তুলনা।'),
    code: [
      {
        label: 'temperature, entropy ও seed-যুক্ত sampling',
        starter: RNG + SM + String.raw`
function applyTemperature(z, T) {
  if (T < 0) throw new Error("temperature ঋণাত্মক হতে পারে না");
  if (T === 0) { const k = z.indexOf(Math.max(...z)); return z.map((_, i) => (i === k ? 1 : 0)); }
  return softmax(z.map((v) => v / T));
}
const entropy = (p) => -p.reduce((s, v) => s + (v > 0 ? v * Math.log(v) : 0), 0);
function sample(p, rand) { const u = rand(); let c = 0; for (let i = 0; i < p.length; i++) { c += p[i]; if (u < c) return i; } return p.length - 1; }

const z = [2, 1, 0];
for (const T of [0, 0.5, 1, 2, 10]) { const p = applyTemperature(z, T); console.log("T=" + String(T).padEnd(4), "p =", JSON.stringify(p.map(r3)).padEnd(22), "entropy =", r3(entropy(p))); }
console.log("uniform entropy (log 3) =", r3(Math.log(3)));

const p1 = applyTemperature(z, 1), counts = [0, 0, 0], N = 2000, rand = makeRng(42);
for (let i = 0; i < N; i++) counts[sample(p1, rand)]++;
console.log("T=1, 2000 নমুনা:", counts, "| অনুপাত:", counts.map((c) => r3(c / N)), "| প্রত্যাশিত:", p1.map(r3));
const a = makeRng(7), b = makeRng(7);
console.log("একই seed দুবার:", Array.from({ length: 8 }, () => sample(p1, a)).join(""), "=", Array.from({ length: 8 }, () => sample(p1, b)).join(""));
try { applyTemperature(z, -1); } catch (e) { console.log("T = -1 →", e.message); }
`,
        expect: ['T=0    p = [1,0,0]', 'T=0.5  p = [0.867,0.117,0.016]', 'T=1    p = [0.665,0.245,0.09]', 'T = -1 → temperature ঋণাত্মক হতে পারে না'],
        hints: ['T = 0-এর শাখা না থাকলে z / 0 = Infinity, softmax-এ Infinity − Infinity = NaN। চেষ্টা করে দেখুন।', '2000 নমুনার অনুপাত প্রত্যাশিত থেকে কতটা দূরে? N = 200 করলে?', 'T = 10-এ entropy log 3-এর কত কাছে?'],
        test: 'var p=applyTemperature(z,0.5); __close(p[0],0.8668,1e-3,"T0.5"); __assert(JSON.stringify(applyTemperature(z,0))==="[1,0,0]","greedy"); __assert(entropy(applyTemperature(z,2))>entropy(applyTemperature(z,1)),"entropy rises"); counts.forEach(function(c,i){ __close(c/N,p1[i],0.04,"sample freq "+i); });',
      },
    ],
    line: ul([
      '<code>T === 0</code> শাখা: one-hot—ভাগ-শূন্য এড়ানো এবং অর্থ স্পষ্ট।',
      '<code>entropy</code>: p = ০ ঘর বাদ (০ × log ০ = ০ ধরা হয়)।',
      '<code>sample</code>: cumulative যোগ; শেষ লাইন সংখ্যাগত গোলমালে (যোগফল ০.৯৯৯৯৯৯) নিরাপত্তা।',
      'একই seed-এর দুই জেনারেটর হুবহু একই ক্রম দেয়।',
    ]),
    why: p('T = ০ ও ঋণাত্মক T স্পষ্টভাবে সামলানো হয়েছে কারণ ব্যবহারকারী-নিয়ন্ত্রিত সেটিং-এ এগুলো আসবেই। নমুনা-গণনা প্রত্যাশিত মানের সাথে সহনশীলতায় (০.০৪) যাচাই—sampling-এর ফল কখনো হুবহু মেলে না।'),
    remember: ['greedy = argmax', 'p = softmax(z/T)', 'T = ০ → greedy, আলাদা শাখায়', 'seed → পুনরুৎপাদনযোগ্য sampling'],
    skip: ['beam search', 'contrastive/typical decoding'],
    experiment: p('z = [২, ২, ০] দিন (দুটি সমান সর্বোচ্চ)। T = ০-তে কোনটি আসে? এটি কি ন্যায্য? সমান হলে দৈবভাবে বাছার একটি নিয়ম লিখুন।'),
    mistakes: ['T = ০-তে সরাসরি ভাগ', 'উচ্চ T-কে “বেশি সৃজনশীল, তাই ভালো” ভাবা', 'seed ছাড়া sampling-এর বাগ খোঁজা', 'API-র T = ০-কে পূর্ণ নির্ধারিত ধরে নেওয়া'],
    quiz: [
      { q: 'T বাড়ালে বণ্টনের entropy?', a: { a: 'কমে', b: 'বাড়ে', c: 'অপরিবর্তিত' }, ok: 'b', why: 'বণ্টন চ্যাপ্টা হয়, uniform-এর দিকে যায়।' },
      { q: 'T = ০.৫ মানে logit-কে কী করা?', a: { a: '০.৫ দিয়ে গুণ', b: '২ দিয়ে গুণ (০.৫ দিয়ে ভাগ)', c: '০.৫ যোগ' }, ok: 'b', why: 'z/T = z/০.৫ = ২z—পার্থক্য বড় হয়, বণ্টন তীক্ষ্ণ।' },
      { q: 'T = ০ কোডে আলাদা শাখা কেন?', a: { a: 'গতির জন্য', b: 'z/০ অসংজ্ঞায়িত; সীমার আচরণ greedy, তাই সরাসরি argmax', c: 'নিয়ম' }, ok: 'b', why: 'T → ০-এর সীমা greedy; T = ০ ঠিক ঐ অর্থে প্রয়োগ করা হয়।' },
    ],
    recap: ['temperature বণ্টনের আকার বদলায়', 'T = ০ = greedy', 'seed দিয়ে sampling পরীক্ষাযোগ্য'],
    nextNote: 'লেজের অসম্ভাব্য token কেটে বাদ—top-k ও top-p:',
    sources: [SRC.nucleus, SRC.gpt2, ['Hugging Face — How to generate text: decoding methods', 'https://huggingface.co/blog/how-to-generate']],
  },
  {
    id: 'les-09-03-topk-topp',
    synthetic: true,
    slug: 'top-k-top-p-nucleus',
    title: 'Top-k ও Top-p (Nucleus) Sampling',
    minutes: 40,
    prereqs: ['les-09-02-greedy-temperature'],
    summary: 'top-k: সর্বোচ্চ k টি রেখে বাকি বাদ; top-p: সবচেয়ে ছোট সেট যার cumulative সম্ভাব্যতা ≥ p; সীমার token অন্তর্ভুক্ত; renormalize; ক্রম: temperature → filter → sample।',
    overview: p('Temperature লেজের অসম্ভাব্য token-গুলোকেও একটু সম্ভাব্যতা দেয়, এবং দীর্ঘ generation-এ সেগুলো মাঝে মাঝে বাছাই হয়ে অর্থহীন টেক্সট আনে। Top-k শুধু সর্বোচ্চ k টি token রাখে। Top-p (nucleus sampling, Holtzman et al.) সম্ভাব্যতার ক্রমে token যোগ করতে থাকে যতক্ষণ না cumulative যোগফল p ছাড়ায়—তাই আত্মবিশ্বাসী ধাপে সেট ছোট, অনিশ্চিত ধাপে বড়। বাছাই-করা সেটের সম্ভাব্যতা আবার যোগফল ১-এ আনা হয় (renormalize)। এই পাঠে সীমার নিয়ম (যে token cumulative-কে p পার করায় সে অন্তর্ভুক্ত) ও সমান-সম্ভাব্যতার ক্ষেত্রে নির্ধারিত আচরণ কোডে নিশ্চিত করব।'),
    objectives: ['top-k ও top-p filter হাতে প্রয়োগ করতে পারবেন', 'top-p-এর সীমার নিয়ম ও renormalization সঠিকভাবে কোডে লিখতে পারবেন', 'কেন top-p আত্মবিশ্বাস অনুযায়ী মানিয়ে নেয় তা উদাহরণসহ বলতে পারবেন'],
    problem: p('একটি ধাপে মডেল প্রায় নিশ্চিত (“ঢাকার বাইরে ডেলিভারি …” → “চার্জ” ০.৯), আরেক ধাপে অনিশ্চিত (“আমি চাই …” → অনেক সম্ভাব্য শব্দ)। top-k = ৫ দুই ধাপেই ৫টি রাখে—প্রথমটিতে অপ্রয়োজনীয় ঝুঁকি, দ্বিতীয়টিতে হয়তো খুব কম। এমন নিয়ম চাই যা ধাপ অনুযায়ী মানিয়ে নেয়।'),
    explain:
      p(`${term('টপ-কে', 'top-k')}: সম্ভাব্যতা অনুযায়ী সাজিয়ে প্রথম k টি রাখুন, বাকিগুলো ০, তারপর renormalize।`) +
      p(`${term('টপ-পি', 'top-p / nucleus')}: সাজিয়ে cumulative যোগ; সবচেয়ে ছোট উপসর্গ রাখুন যার যোগ ≥ p। যে token যোগ করায় p পার হয়, সে <strong>অন্তর্ভুক্ত</strong>। p = ১ মানে সব; খুব ছোট p মানে প্রায় greedy (অন্তত একটি token সবসময় থাকে)।`) +
      p('<strong>ক্রম:</strong> logit → temperature → softmax → top-k/top-p → renormalize → sample। temperature আগে প্রয়োগ হওয়ায় সে nucleus-এর আকারও বদলায়।') +
      p('<strong>সমান সম্ভাব্যতা:</strong> sort-এ সমান মান হলে কোনটি আগে? নির্ধারিত নিয়ম লাগে (যেমন ছোট index আগে), নইলে একই seed-এও ভিন্ন ফল আসতে পারে।') +
      note('top-k ও top-p একসাথেও ব্যবহার হয় (দুটোর ছেদ)। কোন মান ভালো তা কাজ ও মডেল-নির্ভর; সাধারণ নিয়ম দাবি না করে নিজের কাজে মূল্যায়ন করুন।'),
    analogy: {
      text: 'top-p হলো ভোটের ফল গোনা: সবচেয়ে বেশি ভোট পাওয়া প্রার্থী থেকে শুরু করে যতক্ষণ না মোট ৯০% ভোট কভার হয়, ততজনকে চূড়ান্ত তালিকায় রাখা।',
      breaks: 'নির্বাচনে তালিকা থেকে বিজয়ী নির্ধারিত নিয়মে আসে; এখানে তালিকা থেকে আবার ভোট-অনুপাতে দৈবভাবে একজনকে বাছা হয়।',
    },
    worked:
      p('সাজানো p = [০.৫, ০.২, ০.১৫, ০.১, ০.০৫], top-p = ০.৮।') +
      ol([
        'cumulative: ০.৫, ০.৭, ০.৮৫ … ০.৮৫ ≥ ০.৮ প্রথম তৃতীয় token-এ।',
        'রাখা হলো প্রথম ৩টি (তৃতীয়টি সীমা পার করায়, তাই অন্তর্ভুক্ত)।',
        'renormalize: [০.৫, ০.২, ০.১৫] / ০.৮৫ ≈ [০.৫৮৮, ০.২৩৫, ০.১৭৬]।',
        'top-p = ০.৭ হলে: ০.৭ ≥ ০.৭ দ্বিতীয়তেই → ২টি।',
      ]),
    activity: note('কোডে topK ও topP filter (মূল index ধরে রাখে), worked উদাহরণ, আত্মবিশ্বাসী বনাম অনিশ্চিত বণ্টনে nucleus-এর আকার, সমান-সম্ভাব্যতা ও p-এর প্রান্তিক মান।'),
    code: [
      {
        label: 'top-k ও top-p filter',
        starter: String.raw`const r3 = (x) => Math.round(x * 1000) / 1000;
// stable sort: সমান হলে ছোট index আগে
const order = (p) => p.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
const renorm = (p) => { const s = p.reduce((a, b) => a + b, 0); return p.map((v) => v / s); };

function topK(p, k) {
  if (k < 1) throw new Error("k ≥ 1 হতে হবে");
  const keep = new Set(order(p).slice(0, k).map(([, i]) => i));
  return renorm(p.map((v, i) => (keep.has(i) ? v : 0)));
}
function topP(p, top) {
  if (!(top > 0 && top <= 1)) throw new Error("top-p (0, 1] পরিসরে হতে হবে");
  const keep = new Set(); let c = 0;
  for (const [v, i] of order(p)) { keep.add(i); c += v; if (c >= top - 1e-12) break; }
  return renorm(p.map((v, i) => (keep.has(i) ? v : 0)));
}
const kept = (p) => p.filter((v) => v > 0).length;

const p = [0.5, 0.2, 0.15, 0.1, 0.05];
console.log("top-p 0.8:", topP(p, 0.8).map(r3), "| রাখা:", kept(topP(p, 0.8)));
console.log("top-p 0.7:", topP(p, 0.7).map(r3), "| রাখা:", kept(topP(p, 0.7)));
console.log("top-k 2  :", topK(p, 2).map(r3));

const confident = [0.9, 0.04, 0.03, 0.02, 0.01], unsure = [0.22, 0.2, 0.2, 0.19, 0.19];
console.log("top-p 0.9 রাখে → আত্মবিশ্বাসী:", kept(topP(confident, 0.9)), "টি | অনিশ্চিত:", kept(topP(unsure, 0.9)), "টি");
console.log("top-k 3 রাখে  → আত্মবিশ্বাসী:", kept(topK(confident, 3)), "টি | অনিশ্চিত:", kept(topK(unsure, 3)), "টি");
console.log("সমান মান top-k 1:", topK([0.4, 0.4, 0.2], 1).map(r3), " top-p 0.01:", topP(p, 0.01).map(r3), " top-p 1:", kept(topP(p, 1)));
`,
        expect: ['top-p 0.8: [0.588,0.235,0.176,0,0] | রাখা: 3', 'top-p 0.7: [0.714,0.286,0,0,0] | রাখা: 2', 'top-p 0.9 রাখে → আত্মবিশ্বাসী: 1 টি | অনিশ্চিত: 5 টি', 'সমান মান top-k 1: [1,0,0]'],
        hints: ['top-p 0.7-এ cumulative ঠিক 0.7 হলে থামে—কিন্তু 0.5 + 0.2 ভাসমান-বিন্দুতে 0.7000000000000001 বা 0.6999…? 1e-12 সহনশীলতা কেন রাখা হয়েছে?', 'আত্মবিশ্বাসী বণ্টনে top-p 0.9 মাত্র 1টি রাখে—কার্যত greedy।', 'top-p 0.01-এও অন্তত একটি token থাকে কেন?'],
        test: 'var a=topP(p,0.8); __close(a[0],0.5/0.85,1e-12,"renorm"); __assert(kept(topP(p,0.7))===2,"boundary inclusive"); __assert(kept(topP(confident,0.9))<kept(topP(unsure,0.9)),"adaptive"); __close(topP(unsure,0.9).reduce(function(s,v){return s+v;},0),1,1e-12,"sums1"); var bad=false; try{topP(p,0);}catch(e){bad=true;} __assert(bad,"validate p");',
      },
    ],
    line: ul([
      '<code>order</code>: [মান, index] জোড়া সাজানো; সমান হলে ছোট index আগে—নির্ধারিত।',
      '<code>topP</code>-এর loop: token যোগ করে তারপর যাচাই—তাই সীমা-পার করা token অন্তর্ভুক্ত।',
      '<code>1e-12</code>: ভাসমান-বিন্দুর ক্ষুদ্র ত্রুটিতে ঠিক-সমান ক্ষেত্র ভুল না হয়।',
      '<code>renorm</code>: বাছাই-করা সেটের যোগফল ১।',
      'parameter যাচাই: k ≥ ১, ০ < p ≤ ১।',
    ]),
    why: p('মূল index ধরে রাখা হয়েছে (শুধু সাজানো তালিকা নয়), কারণ sample করার পর কোন token তা জানতে হবে—একটি সাধারণ বাগ হলো সাজানো তালিকার index-কে token ID ধরা।'),
    remember: ['top-k: স্থির সংখ্যা', 'top-p: স্থির cumulative সম্ভাব্যতা, সীমার token অন্তর্ভুক্ত', 'filter-এর পর renormalize', 'temperature আগে, filter পরে'],
    skip: ['min-p sampling', 'repetition penalty-এর বিস্তারিত'],
    experiment: p('confident বণ্টনে temperature ২ প্রয়োগ করে তারপর top-p ০.৯ দিন (softmax(log p / ২) ব্যবহার করুন)। এখন কয়টি token থাকে? temperature কীভাবে nucleus বড় করল?'),
    mistakes: ['সীমা-পার করা token বাদ দেওয়া', 'renormalize ভুলে যাওয়া', 'সাজানো index-কে token ID ধরা', 'সমান মানে অনির্ধারিত sort'],
    quiz: [
      { q: 'p = [০.৪, ০.৩, ০.২, ০.১], top-p = ০.৬। কয়টি token থাকে?', a: { a: '১', b: '২', c: '৩' }, ok: 'b', why: '০.৪ < ০.৬; ০.৪ + ০.৩ = ০.৭ ≥ ০.৬ → ২টি।' },
      { q: 'top-k = ২, p = [০.৫, ০.৩, ০.২]। renormalize-এর পর প্রথম token-এর সম্ভাব্যতা?', a: { a: '০.৫', b: '০.৬২৫', c: '১' }, ok: 'b', why: '০.৫ / (০.৫ + ০.৩) = ০.৬২৫।' },
      { q: 'top-p top-k-এর চেয়ে কোথায় সুবিধা দেয়?', a: { a: 'সবসময় দ্রুত', b: 'আত্মবিশ্বাসী ধাপে ছোট, অনিশ্চিত ধাপে বড় সেট—মানিয়ে নেয়', c: 'নির্ধারিত আউটপুট' }, ok: 'b', why: 'সেটের আকার বণ্টনের আকৃতির ওপর নির্ভর করে।' },
    ],
    recap: ['লেজ কাটা = কম অর্থহীন token', 'top-p মানিয়ে নেয়', 'সীমা, renormalize, index—তিন সতর্কতা'],
    nextNote: 'pretrained মডেলকে সহায়ক বানানো—fine-tuning ও preference:',
    sources: [SRC.nucleus, ['Fan et al. — Hierarchical Neural Story Generation (top-k, ACL 2018)', 'https://aclanthology.org/P18-1082/']],
  },
  {
    id: 'les-09-04-finetune-preference',
    synthetic: true,
    slug: 'instruction-tuning-dpo',
    title: 'Fine-tuning, Instruction Tuning ও Preference (DPO)',
    minutes: 45,
    prereqs: ['les-09-03-topk-topp'],
    summary: 'SFT: (নির্দেশ, উত্তর) জোড়ায় শুধু উত্তর-token-এ loss (prompt mask); RLHF-এর ধাপ সংক্ষেপে; DPO loss = −log σ(β[(log π(y_w) − log π_ref(y_w)) − (log π(y_l) − log π_ref(y_l))]); β-র প্রভাব।',
    overview: p('Pretrained মডেল টেক্সট চালিয়ে যেতে পারে, কিন্তু প্রশ্নের উত্তর দিতে বা নির্দেশ মানতে বিশেষভাবে শেখেনি। Supervised fine-tuning (SFT) (নির্দেশ, ভালো উত্তর) জোড়ায় একই next-token loss চালায়—কিন্তু শুধু উত্তরের token-এ, নির্দেশের token-এ নয়। তারপর preference optimization: একই নির্দেশের দুটি উত্তরের মধ্যে মানুষ কোনটি পছন্দ করলেন সেই তথ্য থেকে মডেলকে পছন্দের উত্তরের দিকে ঠেলা। RLHF এটি একটি reward মডেল ও reinforcement learning দিয়ে করে; DPO (Rafailov et al.) সরাসরি একটি classification-ধরনের loss দিয়ে। এই পাঠে SFT mask ও DPO loss-এর হিসাব কোডে করব।'),
    objectives: ['SFT-তে prompt token mask করে loss হিসাব করতে পারবেন', 'RLHF ও DPO-র ধাপ ও পার্থক্য বলতে পারবেন', 'DPO loss একটি পছন্দ-জোড়ার জন্য হিসাব করে β-র প্রভাব ব্যাখ্যা করতে পারবেন'],
    problem: p('Pretrained মডেলকে “ঢাকার বাইরে ডেলিভারি চার্জ কত?” লিখলে সে হয়তো আরও প্রশ্ন লিখে চালিয়ে যায়—কারণ ইন্টারনেটে প্রশ্নের তালিকা প্রচুর। আমরা চাই সে উত্তর দিক, ভদ্রভাবে, এবং না জানলে বলুক “জানি না”। এই আচরণ কীভাবে শেখানো যায়, আর “ভালো উত্তর” মাপার সংখ্যা কোথা থেকে আসে?'),
    explain:
      p(`${term('SFT', 'supervised fine-tuning')}: ক্রম = [নির্দেশ token…, উত্তর token…]। loss শুধু উত্তর অংশে: L = −(১/|উত্তর|) Σ log p(উত্তরের token | আগের সব)। নির্দেশের token-এ loss দিলে মডেল প্রশ্ন লেখাও শিখত—যা উদ্দেশ্য নয়।`) +
      table(['ধাপ', 'RLHF (InstructGPT ধরন)', 'DPO'], [
        ['১', 'SFT', 'SFT (π_ref হিসেবে রাখা হয়)'],
        ['২', 'পছন্দ-জোড়া থেকে reward মডেল train', '—'],
        ['৩', 'reward বাড়াতে RL (PPO), π_ref থেকে বেশি দূরে না যাওয়ার শাস্তিসহ', 'পছন্দ-জোড়ায় সরাসরি DPO loss'],
      ], 'দুই preference পদ্ধতি') +
      p(`<strong>DPO loss:</strong> পছন্দের উত্তর y_w, অপছন্দের y_l। মার্জিন m = β[(log π(y_w) − log π_ref(y_w)) − (log π(y_l) − log π_ref(y_l))]। L = −log σ(m)। মডেল y_w-এর সম্ভাব্যতা reference-এর তুলনায় যত বাড়ায় এবং y_l-এর যত কমায়, m তত বড়, L তত ছোট। β বড় হলে ছোট পার্থক্যেও loss দ্রুত কমে—কার্যত reference থেকে দূরে যাওয়ার “অনুমতি” কম।`) +
      warn('preference ডেটা মানুষের রায়—লেবেলারদের পক্ষপাত, নির্দেশিকা ও মতবিরোধ মডেলে যায়। “পছন্দের” উত্তর মানেই সত্য উত্তর নয়; লম্বা ও আত্মবিশ্বাসী উত্তর প্রায়ই বেশি পছন্দ পায়, যা ভুল তথ্য আত্মবিশ্বাসে বলার প্রবণতা বাড়াতে পারে।'),
    analogy: {
      text: 'SFT হলো নতুন কর্মীকে আদর্শ উত্তরের নমুনা দেখানো; preference হলো তাঁর দুটি খসড়া উত্তরের মধ্যে কোনটি ভালো তা সুপারভাইজার বলে দেওয়া।',
      breaks: 'সুপারভাইজার কারণ ব্যাখ্যা করতে পারেন; মডেল শুধু “এটি ভালো, ওটি খারাপ”-এর সংকেত পায়—কেন ভালো তা নিজে অনুমান করতে হয়, এবং ভুল কারণ (যেমন দৈর্ঘ্য) শিখতে পারে।',
    },
    worked:
      p('β = ০.১। log π(y_w) = −১০, log π_ref(y_w) = −১২; log π(y_l) = −১১, log π_ref(y_l) = −১০।') +
      ol([
        'পছন্দের উত্তরের উন্নতি: −১০ − (−১২) = +২।',
        'অপছন্দের: −১১ − (−১০) = −১।',
        'm = ০.১ × (২ − (−১)) = ০.৩।',
        'L = −log σ(০.৩) = −log(০.৫৭৪) ≈ ০.৫৫৪। m = ০ হলে L = log ২ ≈ ০.৬৯৩।',
      ]),
    activity: note('কোডে SFT mask সহ ও ছাড়া loss, DPO loss worked উদাহরণ, বিভিন্ন β-তে একই জোড়া, এবং DPO-র মার্জিন-অনুযায়ী gradient-এর মাপ।'),
    code: [
      {
        label: 'SFT prompt mask ও DPO loss',
        starter: String.raw`const r3 = (x) => Math.round(x * 1000) / 1000;
const sigmoid = (z) => 1 / (1 + Math.exp(-z));

// SFT: প্রতিটি token-এর log p (কাল্পনিক মডেল থেকে) ও mask (1 = উত্তর)
const tokens = ["প্রশ্ন:", "ঢাকার", "বাইরে", "চার্জ?", "উত্তর:", "৳১৫০"];
const logp = [-6.0, -4.0, -2.5, -3.0, -0.5, -1.2];
const mask = [0, 0, 0, 0, 0, 1];
const sftAll = -logp.reduce((s, v) => s + v, 0) / logp.length;
const answerTokens = mask.filter(Boolean).length;
const sftMasked = -logp.reduce((s, v, i) => s + v * mask[i], 0) / answerTokens;
console.log("SFT loss · সব token:", r3(sftAll), "| শুধু উত্তর:", r3(sftMasked), "(উত্তর token =", answerTokens + ")");

// DPO
function dpoLoss({ pw, rw, pl, rl }, beta) {
  const m = beta * ((pw - rw) - (pl - rl));
  return { m, loss: -Math.log(sigmoid(m)), gradScale: beta * (1 - sigmoid(m)) };
}
const pair = { pw: -10, rw: -12, pl: -11, rl: -10 };
const w = dpoLoss(pair, 0.1);
console.log("DPO worked: m =", r3(w.m), "loss =", r3(w.loss), "| m=0 হলে loss =", r3(-Math.log(0.5)));
for (const beta of [0.01, 0.1, 0.5, 2]) { const d = dpoLoss(pair, beta); console.log("β=" + String(beta).padEnd(5), "m =", String(r3(d.m)).padEnd(6), "loss =", String(r3(d.loss)).padEnd(6), "gradient গুণক =", r3(d.gradScale)); }
const wrong = dpoLoss({ pw: -12, rw: -10, pl: -9, rl: -11 }, 0.1);
console.log("মডেল ভুল দিকে সরলে: m =", r3(wrong.m), "loss =", r3(wrong.loss), "gradient গুণক =", r3(wrong.gradScale));
`,
        expect: ['SFT loss · সব token: 2.867 | শুধু উত্তর: 1.2 (উত্তর token = 1)', 'DPO worked: m = 0.3 loss = 0.554 | m=0 হলে loss = 0.693', 'মডেল ভুল দিকে সরলে: m = -0.4'],
        hints: ['mask ছাড়া loss বেশি কেন? “প্রশ্ন:” token-এর log p −6—মডেলকে প্রশ্ন লেখা শেখানোর চাপ।', 'β বড় হলে একই জোড়ায় loss কমে, কিন্তু gradient গুণকও কমে—মানে “যথেষ্ট আলাদা, আর ঠেলার দরকার নেই”।', 'ভুল দিকে সরলে gradient গুণক বড়—কেন এটি যুক্তিসঙ্গত?'],
        test: '__close(sftMasked,1.2,1e-12,"masked"); __close(w.loss,-Math.log(sigmoid(0.3)),1e-12,"dpo"); __assert(wrong.loss>w.loss&&wrong.gradScale>w.gradScale,"wrong direction penalized");',
      },
    ],
    line: ul([
      '<code>mask</code>: ১ = উত্তর token; loss-এর যোগ ও ভাগ দুটোই শুধু ঐ token-এ।',
      '<code>(pw - rw) - (pl - rl)</code>: reference-এর তুলনায় পছন্দের উত্তরের আপেক্ষিক উন্নতি বিয়োগ অপছন্দেরটির।',
      '<code>gradScale = β(১ − σ(m))</code>: DPO-র gradient-এর মাপ (m-এর সাপেক্ষে) —মার্জিন বড় হলে ছোট।',
    ]),
    why: p('log-সম্ভাব্যতাগুলো হাতে বসানো (কোনো আসল মডেল নয়), যাতে DPO-র সূত্র আলাদা করে দেখা যায়। বাস্তবে প্রতিটি log π পুরো উত্তরের token log-সম্ভাব্যতার যোগ, এবং π ও π_ref দুটো আলাদা মডেলের forward pass থেকে আসে।'),
    remember: ['SFT: শুধু উত্তর-token-এ loss', 'RLHF: reward মডেল + RL', 'DPO: পছন্দ-জোড়ায় সরাসরি loss', 'পছন্দ ≠ সত্য'],
    skip: ['PPO-র বিস্তারিত', 'LoRA ও parameter-efficient fine-tuning (অধ্যায় ১৩-এ উল্লেখ)', 'Constitutional AI'],
    experiment: p('একটি পছন্দ-জোড়া বানান যেখানে মডেল দুই উত্তরের সম্ভাব্যতাই reference-এর চেয়ে সমান পরিমাণ বাড়িয়েছে (pw − rw = pl − rl = +১)। m কত? DPO কি এতে খুশি? কেন?'),
    mistakes: ['SFT-তে prompt token-এও loss দেওয়া', 'DPO-তে reference মডেল বাদ দেওয়া', 'preference ডেটাকে সত্যের মানদণ্ড ভাবা', 'β-র প্রভাব না বুঝে বাছাই'],
    quiz: [
      { q: 'SFT-তে prompt token mask করা হয় কেন?', a: { a: 'গতির জন্য', b: 'মডেলকে উত্তর দিতে শেখানো, প্রশ্ন লিখতে নয়', c: 'নিয়ম' }, ok: 'b', why: 'loss যে token-এ, মডেল সেটাই অনুমান করতে শেখে।' },
      { q: 'DPO মার্জিন m = ০ হলে loss?', a: { a: '০', b: 'log ২ ≈ ০.৬৯৩', c: '১' }, ok: 'b', why: '−log σ(০) = −log ০.৫।' },
      { q: 'DPO RLHF-এর কোন ধাপ বাদ দেয়?', a: { a: 'SFT', b: 'আলাদা reward মডেল ও RL loop', c: 'preference ডেটা' }, ok: 'b', why: 'DPO preference থেকে সরাসরি policy-র loss বানায়।' },
    ],
    recap: ['pretraining → SFT → preference', 'mask ও reference—দুই মূল খুঁটিনাটি', 'মানুষের রায়ের পক্ষপাত মডেলে যায়'],
    nextNote: 'সাবলীল উত্তর মানেই সঠিক নয়—hallucination ও calibration:',
    sources: [SRC.instructGPT, SRC.dpo, ['Ouyang et al. — InstructGPT (training details)', 'https://arxiv.org/abs/2203.02155']],
  },
  {
    id: 'les-09-05-hallucination-calibration',
    slug: 'hallucination-calibration',
    title: 'Hallucination, Calibration ও মূল্যায়ন',
    minutes: 40,
    prereqs: ['les-09-04-finetune-preference', 'les-04-06-metrics'],
    summary: 'next-token মডেল সত্য যাচাই করে না; hallucination-এর কারণ; calibration: আত্মবিশ্বাস ≈ সঠিকতার হার; reliability টেবিল ও ECE; exact-match মূল্যায়ন; “জানি না”-র মূল্য।',
    overview: p('Language model এমন টেক্সট তৈরি করে যা training বিতরণে সম্ভাব্য—সত্য হওয়া তার loss-এর অংশ নয়। তাই সে আত্মবিশ্বাসের সাথে ভুল তথ্য, অস্তিত্বহীন সূত্র বা বানানো সংখ্যা লিখতে পারে, যাকে hallucination বলা হয়। Calibration প্রশ্ন করে: মডেল যখন ৮০% আত্মবিশ্বাসী, তখন কি সে প্রায় ৮০% ক্ষেত্রে সঠিক? এই পাঠে সিন্থেটিক প্রশ্নোত্তরের আত্মবিশ্বাস ও সঠিকতা থেকে reliability টেবিল ও expected calibration error (ECE) হিসাব করব, এবং দেখব “জানি না” বলার নিয়ম (abstention) কীভাবে ভুল উত্তর কমায় এবং তার মূল্য কী।'),
    objectives: ['hallucination-এর কারণ next-token objective থেকে ব্যাখ্যা করতে পারবেন', 'reliability টেবিল ও ECE হিসাব করতে পারবেন', 'abstention threshold-এর coverage ও সঠিকতার trade-off দেখাতে পারবেন'],
    problem: p('দোকানের চ্যাটবট জিজ্ঞাসায় বলল: “আমাদের রিটার্ন নীতি ৩০ দিন।” আসল নীতি ৭ দিন। মডেলটি মিথ্যা বলেনি—সে “রিটার্ন নীতি” বাক্যাংশের পরে training-এ সবচেয়ে সাধারণ সংখ্যাটি বসিয়েছে। কীভাবে বুঝব মডেল কখন নির্ভরযোগ্য, আর কখন তাকে উত্তর দেওয়া থেকে বিরত রাখা উচিত?'),
    explain:
      p(`${term('হ্যালুসিনেশন', 'hallucination')}: সাবলীল কিন্তু তথ্যগতভাবে ভুল বা অসমর্থিত আউটপুট। কারণ: (১) objective সম্ভাব্য টেক্সট, সত্য নয়; (২) training ডেটায় তথ্য নেই বা পুরনো; (৩) প্রশ্ন বিতরণের বাইরে; (৪) sampling দৈবতা; (৫) preference training আত্মবিশ্বাসী উত্তরকে পুরস্কৃত করতে পারে।`) +
      p(`${term('ক্যালিব্রেশন', 'calibration')}: আত্মবিশ্বাস c-এর উত্তরগুলোর মধ্যে সঠিকের অনুপাত ≈ c। ${term('ECE', 'expected calibration error')}: আত্মবিশ্বাসকে bin-এ ভাগ করে Σ (bin-এর আকার / N) × |bin-এর গড় আত্মবিশ্বাস − bin-এর সঠিকতা|।`) +
      p(`${term('অ্যাবস্টেনশন', 'abstention')}: আত্মবিশ্বাস threshold-এর নিচে হলে “নিশ্চিত নই, মানুষের সাহায্য নিন”। Coverage = উত্তর দেওয়া প্রশ্নের অনুপাত; selective accuracy = উত্তর দেওয়াগুলোর মধ্যে সঠিক।`) +
      p('<strong>প্রতিরোধের প্রকৌশল:</strong> নির্ভরযোগ্য উৎস থেকে তথ্য দেওয়া (অধ্যায় ১১-এর RAG), উত্তরের সাথে সূত্র, structured validation (অধ্যায় ১০), এবং ঝুঁকিপূর্ণ কাজে মানুষের যাচাই।') +
      warn('এই পাঠের আত্মবিশ্বাস-স্কোর সিন্থেটিক। বাস্তব LLM-এর ক্ষেত্রে “আত্মবিশ্বাস” কীভাবে পাওয়া যায় (token সম্ভাব্যতা, মডেলকে জিজ্ঞাসা, একাধিক নমুনার মিল) তা নিজেই গবেষণার বিষয়, এবং মডেল নিজের মুখে বলা আত্মবিশ্বাস প্রায়ই খারাপভাবে calibrated।'),
    analogy: {
      text: 'ভালোভাবে calibrated আবহাওয়া-পূর্বাভাস: যেসব দিনে “৭০% বৃষ্টি” বলা হয়, তার প্রায় ৭০% দিনে সত্যিই বৃষ্টি হয়।',
      breaks: 'আবহাওয়া দপ্তর বছরের পর বছর পূর্বাভাস ও ফল মিলিয়ে নিজেকে সংশোধন করে; LLM-এর আত্মবিশ্বাস কাজ ও প্রশ্নের ধরন বদলালে বদলে যায়, এবং আপনার নির্দিষ্ট কাজে আলাদাভাবে মাপতে হয়।',
    },
    worked:
      p('১০টি উত্তর: ৫টি আত্মবিশ্বাস ০.৯ (৩টি সঠিক), ৫টি আত্মবিশ্বাস ০.৬ (৩টি সঠিক)।') +
      ol([
        'bin ০.৯: সঠিকতা ০.৬, ফাঁক |০.৯ − ০.৬| = ০.৩।',
        'bin ০.৬: সঠিকতা ০.৬, ফাঁক ০।',
        'ECE = (৫/১০) × ০.৩ + (৫/১০) × ০ = ০.১৫—মডেল উচ্চ আত্মবিশ্বাসে অতি-আত্মবিশ্বাসী।',
      ]),
    activity: note('কোডে সিন্থেটিক ৪০টি উত্তর (seed-যুক্ত, ইচ্ছাকৃতভাবে অতি-আত্মবিশ্বাসী), reliability টেবিল, ECE, এবং threshold বদলে coverage ও selective accuracy।'),
    code: [
      {
        label: 'reliability টেবিল, ECE ও abstention',
        starter: RNG + String.raw`const r3 = (x) => Math.round(x * 1000) / 1000;
function ece(items, bins = 5) {
  const rows = []; let total = 0;
  for (let b = 0; b < bins; b++) {
    const lo = b / bins, hi = (b + 1) / bins;
    const inBin = items.filter((x) => x.conf > lo && x.conf <= hi);
    if (!inBin.length) continue;
    const conf = inBin.reduce((s, x) => s + x.conf, 0) / inBin.length;
    const acc = inBin.filter((x) => x.correct).length / inBin.length;
    rows.push({ bin: lo.toFixed(1) + "–" + hi.toFixed(1), n: inBin.length, conf, acc });
    total += (inBin.length / items.length) * Math.abs(conf - acc);
  }
  return { rows, ece: total };
}

// worked
const worked = [...Array(5)].map((_, i) => ({ conf: 0.9, correct: i < 3 })).concat([...Array(5)].map((_, i) => ({ conf: 0.6, correct: i < 3 })));
console.log("worked ECE =", r3(ece(worked).ece));

// সিন্থেটিক: আসল সঠিকতার সম্ভাবনা = আত্মবিশ্বাসের চেয়ে কম (অতি-আত্মবিশ্বাসী মডেল)
const rand = makeRng(21);
const items = Array.from({ length: 40 }, () => { const conf = 0.5 + rand() * 0.5; return { conf, correct: rand() < conf - 0.15 }; });
const res = ece(items);
console.log("bin       n   গড় আত্মবিশ্বাস  সঠিকতা");
res.rows.forEach((r) => console.log(r.bin.padEnd(9), String(r.n).padStart(2), "  ", String(r3(r.conf)).padEnd(14), r3(r.acc)));
console.log("ECE =", r3(res.ece));

for (const t of [0, 0.7, 0.85, 0.95]) {
  const answered = items.filter((x) => x.conf >= t);
  const acc = answered.length ? answered.filter((x) => x.correct).length / answered.length : null;
  console.log("threshold", t, "→ coverage", r3(answered.length / items.length), "| selective accuracy", acc === null ? "—" : r3(acc), "| “জানি না”", items.length - answered.length);
}
`,
        expect: ['worked ECE = 0.15', 'ECE =', 'threshold 0 → coverage 1'],
        hints: ['প্রতিটি bin-এ সঠিকতা আত্মবিশ্বাসের চেয়ে কম কেন? সিন্থেটিক ডেটা কীভাবে বানানো হয়েছে দেখুন (conf − 0.15)।', 'threshold বাড়ালে selective accuracy সাধারণত বাড়ে, coverage কমে। দোকানের সাপোর্টে কোন threshold গ্রহণযোগ্য?', '40টি উদাহরণ ও 5টি bin—কিছু bin-এ কতগুলো উদাহরণ? ECE-কে কতটা বিশ্বাস করবেন?'],
        test: '__close(ece(worked).ece,0.15,1e-12,"worked"); __assert(res.ece>0.05,"overconfident detected"); var perfect=[{conf:1,correct:true},{conf:1,correct:true}]; __close(ece(perfect).ece,0,1e-12,"perfect");',
      },
    ],
    line: ul([
      '<code>ece</code>: প্রতিটি bin-এর গড় আত্মবিশ্বাস ও সঠিকতা, আকার অনুযায়ী weight-যুক্ত পরম ফাঁক।',
      'খালি bin বাদ (<code>continue</code>)।',
      'সিন্থেটিক ডেটায় সঠিক হওয়ার সম্ভাবনা = conf − ০.১৫—ইচ্ছাকৃত অতি-আত্মবিশ্বাস, যাতে ECE তা ধরে কিনা দেখা যায়।',
      'threshold loop: coverage ও selective accuracy-র trade-off।',
    ]),
    why: p('ডেটা জেনেশুনে অতি-আত্মবিশ্বাসী করে বানানো, যাতে মাপটি একটি জানা সমস্যা ধরতে পারে কিনা যাচাই হয়—“perfect” উদাহরণে ECE ০ হওয়াও test-এ যাচাই করা হয়েছে।'),
    remember: ['next-token objective সত্য যাচাই করে না', 'calibration: আত্মবিশ্বাস ≈ সঠিকতা', 'ECE ছোট নমুনায় অনিশ্চিত', 'abstention: coverage বনাম সঠিকতা'],
    skip: ['temperature scaling দিয়ে calibration ঠিক করা', 'self-consistency'],
    experiment: p('সিন্থেটিক ডেটায় “conf − 0.15”-কে “conf” করুন (calibrated মডেল)। ECE কত হয়? ঠিক ০ নয় কেন? (৪০টি নমুনার দৈবতা)'),
    mistakes: ['সাবলীলতাকে সঠিকতার চিহ্ন ভাবা', 'মডেলের মুখে বলা আত্মবিশ্বাস বিশ্বাস করা', 'ছোট নমুনার ECE-কে নির্ভুল মাপ ধরা', 'abstention-এর coverage-মূল্য উপেক্ষা'],
    quiz: [
      { q: 'যে উত্তরগুলোতে মডেল ০.৯ আত্মবিশ্বাসী, তার ৬০% সঠিক। মডেল?', a: { a: 'Calibrated', b: 'অতি-আত্মবিশ্বাসী', c: 'অবমূল্যায়নকারী' }, ok: 'b', why: 'আত্মবিশ্বাস সঠিকতার চেয়ে বেশি।' },
      { q: 'language model hallucinate করে কেন?', a: { a: 'ইচ্ছাকৃত মিথ্যা', b: 'objective সম্ভাব্য টেক্সট তৈরি, সত্য যাচাই নয়', c: 'বাগ' }, ok: 'b', why: 'loss শুধু training বিতরণের সাথে মিল মাপে।' },
      { q: 'threshold বাড়ালে সাধারণত কী হয়?', a: { a: 'coverage বাড়ে', b: 'coverage কমে, selective accuracy বাড়ে', c: 'কিছুই না' }, ok: 'b', why: 'কম আত্মবিশ্বাসী উত্তর বাদ পড়ে—বেশি “জানি না”, কিন্তু দেওয়া উত্তরে ভুল কম।' },
    ],
    recap: ['hallucination objective-এর স্বাভাবিক ফল', 'calibration মাপা যায়', '“জানি না” একটি নকশার সিদ্ধান্ত'],
    nextNote: 'সব একসাথে—sampling playground প্রজেক্ট:',
    synthetic: true,
    sources: [['Guo et al. — On Calibration of Modern Neural Networks (ICML 2017)', 'https://arxiv.org/abs/1706.04599'], ['Ji et al. — Survey of Hallucination in Natural Language Generation (ACM CSUR 2023)', 'https://arxiv.org/abs/2202.03629'], ['Kadavath et al. — Language Models (Mostly) Know What They Know (2022)', 'https://arxiv.org/abs/2207.05221']],
  },
  {
    id: 'les-09-06-project-sampling-playground',
    synthetic: true,
    slug: 'project-sampling-playground',
    title: 'প্রজেক্ট: Sampling Playground',
    minutes: 60,
    prereqs: ['les-09-05-hallucination-calibration'],
    summary: 'খেলনা next-token টেবিল (logit); decode(settings, seed): temperature → top-k → top-p → sample; প্রতিটি রূপান্তরের বণ্টন; ১০০০ নমুনার গণনা; তৈরি বাক্যে পুনরাবৃত্তি ও অনন্যতা; reference ক্রমের cross-entropy।',
    overview: p('এই প্রজেক্টে একটি খেলনা “language model”—প্রতিটি প্রসঙ্গ-শব্দের পরের token-এর logit টেবিল—দিয়ে একটি sampling playground বানাব। একটি decode ফাংশন settings (temperature, top-k, top-p, seed) নিয়ে প্রতিটি ধাপে বণ্টন রূপান্তর করে token বাছবে। Playground দেখাবে: একটি প্রসঙ্গে প্রতিটি রূপান্তরের পর বণ্টন, ১০০০ নমুনায় token-গণনা, চারটি সেটিং-এ ২০টি করে তৈরি বাক্যের অনন্যতা ও গড় দৈর্ঘ্য, এবং একটি reference বাক্যের cross-entropy। লক্ষ্য: প্রতিটি নবের প্রভাব সংখ্যায় দেখা।'),
    objectives: ['temperature, top-k, top-p ও seed একত্রে একটি decode pipeline-এ প্রয়োগ করতে পারবেন', 'sampling সেটিং-এর প্রভাব বণ্টন, গণনা ও বৈচিত্র্যে মাপতে পারবেন', 'reference ক্রমের cross-entropy হিসাব করে মডেলের “বিস্ময়” ব্যাখ্যা করতে পারবেন'],
    problem: p('প্রোডাক্ট টিম জিজ্ঞাসা করছে: “চ্যাটবটের উত্তর কম পুনরাবৃত্তিমূলক কিন্তু নিরাপদ রাখতে কোন সেটিং দেব?” মতামত নয়, সংখ্যা চাই—প্রতিটি সেটিং-এ আউটপুট কতটা বৈচিত্র্যময়, কতবার অদ্ভুত token আসে, এবং একই seed-এ ফল পুনরুৎপাদন হয় কিনা।'),
    explain:
      p('<strong>খেলনা মডেল:</strong> LOGITS[প্রসঙ্গ][token] = স্কোর। প্রসঙ্গ শুধু আগের একটি শব্দ (bigram-এর মতো), যাতে টেবিল পড়া যায়। “&lt;eos&gt;” পেলে বা ৮ token পরে থামে।') +
      p('<strong>Pipeline:</strong> logit → temperature (T = ০ হলে greedy) → softmax → top-k → top-p → renormalize → seed-যুক্ত sample। প্রতিটি ধাপ পাঠ ৯.২–৯.৩-এর ফাংশন।') +
      table(['মাপ', 'অর্থ'], [
        ['অনন্য বাক্য', '২০টি নমুনায় কতগুলো আলাদা—বৈচিত্র্য'],
        ['বিরল token-এর হার', 'মূল বণ্টনে p < ০.০৫ এমন token কতবার এল—“অদ্ভুত” আউটপুটের প্রক্সি'],
        ['reference cross-entropy', 'একটি প্রত্যাশিত বাক্যের প্রতি-token গড় −log p—মডেলের “বিস্ময়”'],
      ], 'playground-এর মাপ') +
      note('logit টেবিল হাতে লেখা খেলনা মডেল; সংখ্যাগুলো কোনো আসল LLM-এর আচরণ বোঝায় না। পদ্ধতিটি (একই seed-সেটে সেটিং তুলনা, বৈচিত্র্য ও বিরল-token মাপ) বাস্তব মূল্যায়নেও ব্যবহারযোগ্য।'),
    analogy: {
      text: 'Playground হলো সাউন্ড মিক্সারের সামনে বসে প্রতিটি নব আলাদাভাবে ঘুরিয়ে মিটারে দেখা—শুধু কানে নয়, সংখ্যায়।',
      breaks: 'মিক্সারের নব স্বাধীন; এখানে temperature top-p-এর সেট-আকারও বদলায়—নবগুলো পরস্পরের ওপর প্রভাব ফেলে।',
    },
    worked:
      p('প্রসঙ্গ “চার্জ”-এর logit: কত = ৩, ফ্রি = ১.৫, আছে = ১, ভাই = −১।') +
      ol([
        'T = ১: e-ঘাত [২০.০৯, ৪.৪৮, ২.৭২, ০.৩৭], যোগ ২৭.৬৬; softmax ≈ [০.৭২৬, ০.১৬২, ০.০৯৮, ০.০১৩]। “ভাই” বিরল (< ০.০৫)।',
        'top-p ০.৯: ০.৭২৬ + ০.১৬২ = ০.৮৮৮ < ০.৯; + ০.০৯৮ = ০.৯৮৭ → ৩টি রাখা, “ভাই” বাদ।',
        'renormalize: ÷ ০.৯৮৭ ≈ [০.৭৩৬, ০.১৬৪, ০.১০০, ০]।',
      ]),
    activity: p('<strong>প্রজেক্ট মানদণ্ড:</strong> (১) “চার্জ” প্রসঙ্গে চারটি রূপান্তরের বণ্টন টেবিল, (২) ১০০০ নমুনার গণনা প্রত্যাশার সাথে, (৩) পাঁচটি সেটিং-এর অনন্য বাক্য ও বিরল-token সংখ্যা (২০০টি seed), (৪) একই seed-এ পুনরুৎপাদন প্রমাণ, (৫) আপনার সুপারিশকৃত সেটিং ও তার যুক্তি—সীমাসহ।'),
    code: [
      {
        label: 'প্রজেক্ট: sampling playground (খেলনা মডেল)',
        starter: RNG + SM + String.raw`
// খেলনা মডেল: আগের শব্দ → পরের token-এর logit (হাতে লেখা)
const LOGITS = {
  "<bos>":    { "ঢাকার": 2, "ডেলিভারি": 1.5, "আমার": 1.2, "দাম": 0.5 },
  "ঢাকার":    { "বাইরে": 2.5, "ভেতরে": 1, "ডেলিভারি": 0.8 },
  "বাইরে":    { "ডেলিভারি": 2.5, "চার্জ": 1 },
  "ভেতরে":    { "ডেলিভারি": 2.5, "চার্জ": 1 },
  "ডেলিভারি": { "চার্জ": 2.5, "কবে": 1.5, "হবে": 0.5 },
  "চার্জ":    { "কত": 3, "ফ্রি": 1.5, "আছে": 1, "ভাই": -1 },
  "আমার":     { "অর্ডার": 2.5, "পার্সেল": 1.5 },
  "অর্ডার":   { "কোথায়": 2, "কবে": 1.5 },
  "পার্সেল":  { "কোথায়": 2, "কবে": 1.5 },
  "দাম":      { "কত": 3, "কম": 1 },
  "কত":       { "<eos>": 2, "টাকা": 1.5, "দিন": 0.5 },
  "কবে":      { "আসবে": 2, "<eos>": 1, "হবে": 0.5 },
  "টাকা": { "<eos>": 3 }, "দিন": { "<eos>": 3 }, "আসবে": { "<eos>": 3 }, "হবে": { "<eos>": 3 }, "ফ্রি": { "<eos>": 2, "কি": 1 }, "কি": { "<eos>": 3 },
  "আছে": { "<eos>": 2, "কি": 1.5 }, "কোথায়": { "<eos>": 2, "আছে": 1 }, "কম": { "<eos>": 2 }, "ভাই": { "<eos>": 2 },
};
const order = (p) => p.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
const renorm = (p) => { const s = p.reduce((a, b) => a + b, 0); return p.map((v) => v / s); };
function transform(z, { T = 1, k = Infinity, top = 1 }) {
  let p = T === 0 ? z.map((_, i) => (i === z.indexOf(Math.max(...z)) ? 1 : 0)) : softmax(z.map((v) => v / T));
  const steps = { temp: p };
  if (k < p.length) { const keep = new Set(order(p).slice(0, k).map(([, i]) => i)); p = renorm(p.map((v, i) => (keep.has(i) ? v : 0))); }
  steps.topk = p;
  if (top < 1) { const keep = new Set(); let c = 0; for (const [v, i] of order(p)) { keep.add(i); c += v; if (c >= top - 1e-12) break; } p = renorm(p.map((v, i) => (keep.has(i) ? v : 0))); }
  steps.topp = p;
  return { p, steps };
}
function sampleIdx(p, rand) { const u = rand(); let c = 0; for (let i = 0; i < p.length; i++) { c += p[i]; if (u < c) return i; } return p.length - 1; }
function decode(settings, seed, maxLen = 8) {
  const rand = makeRng(seed), out = []; let prev = "<bos>", rare = 0;
  for (let t = 0; t < maxLen; t++) {
    const toks = Object.keys(LOGITS[prev]), z = toks.map((w) => LOGITS[prev][w]);
    const base = softmax(z), { p } = transform(z, settings);
    const i = sampleIdx(p, rand);
    if (base[i] < 0.05) rare++;
    if (toks[i] === "<eos>") break;
    out.push(toks[i]); prev = toks[i];
  }
  return { text: out.join(" "), rare, len: out.length };
}

// ১) একটি প্রসঙ্গে রূপান্তর
const toks = Object.keys(LOGITS["চার্জ"]), z = toks.map((w) => LOGITS["চার্জ"][w]);
const tr = transform(z, { T: 1, top: 0.9 });
console.log("প্রসঙ্গ «চার্জ» token:", toks.join(", "));
console.log("  T=1        :", JSON.stringify(tr.steps.temp.map(r3)));
console.log("  + top-p 0.9:", JSON.stringify(tr.steps.topp.map(r3)));
console.log("  T=0        :", JSON.stringify(transform(z, { T: 0 }).p));

// ২) 1000 নমুনা
const rand = makeRng(1), cnt = toks.map(() => 0);
for (let n = 0; n < 1000; n++) cnt[sampleIdx(tr.p, rand)]++;
console.log("1000 নমুনা (T=1, top-p 0.9):", toks.map((w, i) => w + "=" + cnt[i]).join(" "));

// ৩) সেটিং তুলনা: একই 200টি seed
const SETTINGS = { "greedy (T=0)": { T: 0 }, "T=0.7, top-p 0.9": { T: 0.7, top: 0.9 }, "T=1": { T: 1 }, "T=1.5": { T: 1.5 }, "T=2.5": { T: 2.5 } };
const RUNS = 200;
const summary = {};
for (const [name, s] of Object.entries(SETTINGS)) {
  const runs = Array.from({ length: RUNS }, (_, i) => decode(s, 100 + i));
  const uniq = new Set(runs.map((r) => r.text)).size, rare = runs.reduce((a, r) => a + r.rare, 0);
  summary[name] = { uniq, rare };
  console.log(name.padEnd(18), "| অনন্য বাক্য", String(uniq).padStart(3) + "/" + RUNS + " | বিরল token", String(rare).padStart(3), "| উদাহরণ: «" + runs[0].text + "»");
}

// ৪) পুনরুৎপাদন ও reference cross-entropy
console.log("একই seed দুবার:", decode({ T: 1 }, 7).text === decode({ T: 1 }, 7).text);
const ref = ["ঢাকার", "বাইরে", "ডেলিভারি", "চার্জ", "কত", "<eos>"];
let nll = 0, prev = "<bos>";
for (const w of ref) { const ks = Object.keys(LOGITS[prev]); nll -= Math.log(softmax(ks.map((x) => LOGITS[prev][x]))[ks.indexOf(w)]); prev = w; }
console.log("reference «" + ref.slice(0, -1).join(" ") + "» cross-entropy:", r3(nll / ref.length), "| perplexity:", r3(Math.exp(nll / ref.length)));
`,
        expect: ['  T=1        : [0.726,0.162,0.098,0.013]', '  + top-p 0.9: [0.736,0.164,0.1,0]', '  T=0        : [1,0,0,0]', 'greedy (T=0)       | অনন্য বাক্য   1/200 | বিরল token   0', 'একই seed দুবার: true'],
        hints: ['greedy-তে 200টি seed-এ একই বাক্য কেন? seed কোথায় ব্যবহৃত হয়?', 'T বাড়ার সাথে বিরল token কীভাবে বাড়ে? top-p 0.9 সেটিং-এ কেন ঠিক 0?', 'reference বাক্যের কোন token-এ মডেল সবচেয়ে বেশি “বিস্মিত”? প্রতিটি −log p আলাদা মুদ্রণ করুন।', 'আপনার সুপারিশের সীমা লিখুন: খেলনা মডেলের ফল আসল মডেলে কেন প্রযোজ্য না-ও হতে পারে?'],
        test: '__assert(summary["greedy (T=0)"].uniq===1,"greedy deterministic"); __assert(summary["T=1.5"].uniq>=summary["T=0.7, top-p 0.9"].uniq,"higher T more diverse"); __assert(summary["T=0.7, top-p 0.9"].rare===0,"top-p cuts rare"); __assert(summary["T=2.5"].rare>summary["T=1"].rare,"rare grows with T"); __assert(summary["T=0.7, top-p 0.9"].uniq===27&&summary["T=2.5"].uniq===69,"counts quoted"); __assert(cnt[3]===0,"cut token never sampled"); __close(cnt[0]/1000,tr.p[0],0.05,"freq");',
      },
    ],
    line: ul([
      '<code>LOGITS</code>: প্রসঙ্গ → token → স্কোর; পড়া ও বদলানো সহজ।',
      '<code>transform</code>: প্রতিটি ধাপের বণ্টন ফেরত দেয় (steps)—প্রদর্শনের জন্য।',
      '<code>decode</code>: প্রতিটি ধাপে মূল বণ্টন (base) দিয়ে বিরল-token গণনা, রূপান্তরিত বণ্টন থেকে sample।',
      'সেটিং তুলনায় একই ২০০টি seed (১০০–২৯৯)—ন্যায্য তুলনা। ২০টিতে বিরল token প্রায় কখনো দেখা যেত না; বিরল ঘটনা মাপতে বড় নমুনা লাগে।',
      'reference cross-entropy: T = ১ মূল বণ্টনে, প্রতিটি সঠিক token-এর −log p-এর গড়।',
    ]),
    why: p('সব সেটিং একই seed-সেটে চালানো হয়েছে যাতে পার্থক্য শুধু সেটিং থেকে আসে। “বিরল token”-কে মূল বণ্টন (T = ১) দিয়ে সংজ্ঞায়িত করা হয়েছে, রূপান্তরিত বণ্টন দিয়ে নয়—নইলে প্রতিটি সেটিং নিজের মাপকাঠিতে নিজেকে বিচার করত।'),
    remember: ['pipeline: T → top-k → top-p → sample', 'একই seed-সেটে সেটিং তুলনা', 'বৈচিত্র্য বনাম বিরল-token trade-off', 'reference cross-entropy = মডেলের বিস্ময়'],
    skip: ['repetition penalty', 'beam search তুলনা'],
    experiment: p('LOGITS["চার্জ"]["ভাই"] = ১ করুন। T = ১-এ বিরল-token হার কী হয়? top-p ০.৯ কি এখনও এটি কেটে দেয়? দেখান সংখ্যা দিয়ে।'),
    mistakes: ['ভিন্ন seed-সেটে সেটিং তুলনা', 'রূপান্তরিত বণ্টন দিয়ে বিরলতা মাপা', 'একটি নমুনা দেখে সেটিং বাছাই', 'খেলনা মডেলের সুপারিশ আসল মডেলে সরাসরি প্রয়োগ'],
    solutionNote: p('QuickJS-এ চালানো ফল (একই ২০০টি seed): greedy ১টি অনন্য বাক্য, বিরল token ০; T ০.৭ + top-p ০.৯: ২৭টি অনন্য, বিরল ০; T ১: ৫৩টি, বিরল ০; T ১.৫: ৬৩টি, বিরল ১; T ২.৫: ৬৯টি, বিরল ৫। অর্থাৎ বৈচিত্র্য বাড়ার সাথে বিরল token আসতে শুরু করে, আর top-p সেগুলো ঠিক ০-তে রাখে। এই খেলনা মডেলে একটি যুক্তিসঙ্গত সুপারিশ: “T ০.৭, top-p ০.৯”—বৈচিত্র্য আছে, অদ্ভুত token নেই। <strong>সীমা:</strong> “বিরল token” মান-মাপের একটি দুর্বল প্রক্সি, এবং আসল মডেলের বণ্টন অনেক বড় ও ভিন্ন আকারের, তাই সেখানে একই পদ্ধতিতে (একই seed-সেট, বৈচিত্র্য ও বিরলতা মাপ, সাথে মানুষের মান-মূল্যায়ন) আবার পরীক্ষা করতে হবে।'),
    quiz: [
      { q: 'greedy decoding-এ seed বদলালে আউটপুট?', a: { a: 'বদলায়', b: 'একই থাকে—কোনো দৈবতা নেই', c: 'এরর' }, ok: 'b', why: 'argmax-এ দৈব সংখ্যা ব্যবহৃত হয় না।' },
      { q: 'দুই সেটিং তুলনায় একই seed-সেট কেন?', a: { a: 'দ্রুততার জন্য', b: 'পার্থক্য যেন শুধু সেটিং থেকে আসে, দৈব ভাগ্য থেকে নয়', c: 'নিয়ম' }, ok: 'b', why: 'নিয়ন্ত্রিত পরীক্ষা: একটি জিনিস বদলান, বাকি স্থির রাখুন।' },
      { q: 'top-p ০.৯ “ভাই” (p = ০.০১৩) কেটে দিয়েছে। ১০০০ নমুনায় “ভাই” কতবার আসবে?', a: { a: '~১৩', b: '০', c: '~১০০' }, ok: 'b', why: 'বাদ-পড়া token-এর সম্ভাব্যতা ঠিক ০।' },
    ],
    recap: ['একটি পূর্ণ, পরিমাপযোগ্য decode pipeline', 'সেটিং-এর প্রভাব সংখ্যায়', 'সুপারিশ সীমাসহ'],
    nextNote: 'মডেল বোঝা হলো। এবার আসল অ্যাপ বানানো—structured output, retry, খরচ:',
    sources: [SRC.nucleus, ['Hugging Face — Generation strategies', 'https://huggingface.co/docs/transformers/generation_strategies']],
  },
];

export default { chapter, lessons };

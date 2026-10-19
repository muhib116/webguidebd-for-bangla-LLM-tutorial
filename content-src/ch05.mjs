import { p, ul, ol, code, out, note, warn, table, term, SRC } from './lib.mjs';

const chapter = {
  id: 'ch-05-neural-networks',
  slug: 'neural-network',
  title: 'Neural Network ও Deep Learning',
  order: 5,
  public: false,
  summary: 'Neuron ও activation; layer ও forward pass; backpropagation; training loop; initialization ও optimizer (SGD, momentum, Adam); normalization, residual connection, dropout।',
  overview: p(
    'অধ্যায় ৪-এর softmax regression ছিল এক স্তরের মডেল—সে শুধু রৈখিক সীমানা টানতে পারে। এই অধ্যায়ে স্তরের মাঝে non-linear activation বসিয়ে neural network বানাব, chain rule দিয়ে প্রতিটি weight-এর gradient হাতে হিসাব করব (backpropagation), এবং JavaScript-এ একটি ছোট নেটওয়ার্ককে XOR ও বৃত্তাকার সীমানা শেখাব। দেখব কেন weight শূন্য দিয়ে শুরু করলে নেটওয়ার্ক শেখে না, কেন ছোট নেটওয়ার্ক কখনো আটকে যায়, এবং Adam-এর মতো optimizer কী সমাধান করে।',
    'প্রজেক্ট: JavaScript-এ একটি ছোট neural network, প্রথম training ধাপের সম্পূর্ণ forward–gradient–update ট্রেস সহ।'
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

const lessons = [
  {
    id: 'les-05-01-neuron-activation',
    slug: 'neuron-activation',
    title: 'Neuron ও Activation Function',
    minutes: 35,
    prereqs: ['les-04-08-project-message-classifier', 'les-03-04-functions-weighted-sums'],
    summary: 'neuron = weighted sum + activation; ReLU, sigmoid, tanh; কেন non-linearity ছাড়া স্তর যোগ করে লাভ নেই।',
    overview: p('একটি কৃত্রিম neuron দুই ধাপে কাজ করে: weighted sum z = w · x + b (অধ্যায় ৩), তারপর একটি activation function a = f(z)। Activation না থাকলে দুই স্তর রৈখিক রূপান্তর মিলে আবার একটি রৈখিক রূপান্তরই হয়—গভীরতা অর্থহীন। এই পাঠে তিনটি প্রচলিত activation (ReLU, sigmoid, tanh) হিসাব ও তুলনা করব, এবং কোডে প্রমাণ করব দুটি রৈখিক স্তর একটির সমান।'),
    objectives: ['একটি neuron-এর আউটপুট হাতে হিসাব করতে পারবেন', 'ReLU, sigmoid ও tanh-এর পরিসর ও derivative তুলনা করতে পারবেন', 'কেন non-linear activation ছাড়া স্তর বাড়ানো অর্থহীন তা কোডে দেখাতে পারবেন'],
    problem: p('অধ্যায় ৪-এর মডেল একটি সরলরেখা (বা সমতল) দিয়ে বিভাগ আলাদা করে। কিন্তু কিছু সমস্যায় সীমানা বাঁকা—যেমন “দাম খুব কম বা খুব বেশি হলে সন্দেহজনক, মাঝে স্বাভাবিক”। একটি সরলরেখা এই দুই প্রান্তকে একসাথে আলাদা করতে পারে না। কী যোগ করলে মডেল বাঁকা সীমানা শিখবে?'),
    explain:
      p(`${term('নিউরন', 'neuron')}: a = f(w · x + b)। w ও b শেখা হয়; f নির্দিষ্ট।`) +
      table(['Activation', 'সূত্র', 'পরিসর', 'derivative', 'কোথায়'], [
        ['ReLU', 'max(০, z)', '[০, ∞)', 'z > ০ হলে ১, না হলে ০', 'আধুনিক নেটওয়ার্কের hidden layer'],
        ['Sigmoid', '১/(১ + e⁻ᶻ)', '(০, ১)', 'σ(z)(১ − σ(z))', 'binary আউটপুট'],
        ['Tanh', '(eᶻ − e⁻ᶻ)/(eᶻ + e⁻ᶻ)', '(−১, ১)', '১ − tanh²(z)', 'ছোট নেটওয়ার্ক, RNN'],
      ], 'তিনটি activation') +
      p('<strong>কেন non-linear:</strong> স্তর ১: h = W₁x, স্তর ২: y = W₂h = W₂(W₁x) = (W₂W₁)x। W₂W₁ নিজেই একটি matrix—তাই দুই স্তর = এক স্তর। activation মাঝে বসালে y = W₂ f(W₁x), যা আর কোনো একক matrix দিয়ে লেখা যায় না।') +
      p('<strong>Saturation:</strong> sigmoid-এর derivative সর্বোচ্চ ০.২৫ (z = ০-তে) এবং |z| বড় হলে প্রায় ০। অনেক স্তরে এই ছোট সংখ্যাগুলো গুণ হলে gradient প্রায় শূন্য—একে vanishing gradient বলে। ReLU-র derivative ধনাত্মক অংশে ১, তাই সমস্যা কম; কিন্তু z সবসময় ঋণাত্মক হলে neuron “মরে” যায় (gradient ০)।'),
    analogy: {
      text: 'neuron হলো একজন বিচারক যিনি প্রমাণগুলোকে ওজন দিয়ে যোগ করেন (weighted sum), তারপর একটি নিয়মে সিদ্ধান্ত নেন—“যথেষ্ট প্রমাণ না হলে কিছু বলব না” (ReLU)।',
      breaks: 'জৈবিক neuron বা মানুষ বিচারকের সাথে মিল খুবই সীমিত। কৃত্রিম neuron শুধু একটি গাণিতিক ফাংশন; “বিচার” বা “বোঝা” এর মধ্যে নেই।',
    },
    worked:
      p('x = [২, −১], w = [০.৫, ১], b = −০.২।') +
      ol([
        'z = ০.৫×২ + ১×(−১) − ০.২ = ১ − ১ − ০.২ = −০.২।',
        'ReLU(−০.২) = ০; derivative ০।',
        'sigmoid(−০.২) ≈ ০.৪৫০; derivative ≈ ০.৪৫০ × ০.৫৫০ ≈ ০.২৪৮।',
        'tanh(−০.২) ≈ −০.১৯৭; derivative ≈ ১ − ০.০৩৯ ≈ ০.৯৬১।',
      ]),
    activity: note('কোডে তিনটি activation ও derivative, তারপর দুটি রৈখিক স্তর বনাম তাদের গুণফল-matrix একই আউটপুট দেয় কিনা যাচাই।'),
    code: [
      {
        label: 'activation ও “দুই রৈখিক স্তর = এক”',
        starter: String.raw`const act = {
  relu: { f: (z) => Math.max(0, z), d: (z) => (z > 0 ? 1 : 0) },
  sigmoid: { f: (z) => 1 / (1 + Math.exp(-z)), d: (z) => { const s = 1 / (1 + Math.exp(-z)); return s * (1 - s); } },
  tanh: { f: (z) => Math.tanh(z), d: (z) => 1 - Math.tanh(z) ** 2 },
};
const r3 = (x) => Math.round(x * 1000) / 1000;
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);

const z = dot([0.5, 1], [2, -1]) - 0.2;
console.log("z =", r3(z));
for (const [name, a] of Object.entries(act)) console.log(name.padEnd(8), "f =", r3(a.f(z)), " f' =", r3(a.d(z)));
console.log("sigmoid'(5) =", r3(act.sigmoid.d(5)), " ← saturation");

// দুই রৈখিক স্তর বনাম এক স্তর
const matvec = (M, v) => M.map((row) => dot(row, v));
const matmul = (A, B) => A.map((row) => B[0].map((_, j) => row.reduce((s, v, k) => s + v * B[k][j], 0)));
const W1 = [[1, 2], [0, -1], [3, 1]];   // 3×2
const W2 = [[2, -1, 0.5]];              // 1×3
const x = [1, 4];
const twoLayers = matvec(W2, matvec(W1, x));
const oneLayer = matvec(matmul(W2, W1), x);
console.log("দুই স্তর:", twoLayers, " এক স্তর (W2·W1):", oneLayer, " W2·W1 =", JSON.stringify(matmul(W2, W1)));
const withRelu = matvec(W2, matvec(W1, x).map(act.relu.f));
console.log("মাঝে ReLU:", withRelu, "← ভিন্ন, কারণ h-এর ঋণাত্মক মান কেটে গেছে");
`,
        expect: ['z = -0.2', 'relu     f = 0  f\' = 0', 'sigmoid  f = 0.45  f\' = 0.248', 'tanh     f = -0.197  f\' = 0.961', 'দুই স্তর: [25.5]  এক স্তর (W2·W1): [25.5]', 'মাঝে ReLU: [21.5]'],
        hints: ['matvec(W1, x) = [9, −4, 7]। W2 দিয়ে: 2×9 − 1×(−4) + 0.5×7 = 25.5। ReLU দিলে [9, 0, 7] → 18 + 0 + 3.5 = 21.5।', 'sigmoid\'(0) কত? সর্বোচ্চ মান কোথায়?', 'অনেক স্তরে প্রতিটিতে ≤ 0.25 গুণ হলে ১০ স্তর পরে gradient কত ছোট হতে পারে? (0.25¹⁰)'],
        test: '__close(act.sigmoid.d(0),0.25,1e-12,"sig max"); __assert(twoLayers[0]===oneLayer[0],"linear collapse"); __assert(withRelu[0]!==twoLayers[0],"relu breaks collapse"); var h=1e-6; __close((act.tanh.f(0.3+h)-act.tanh.f(0.3-h))/(2*h),act.tanh.d(0.3),1e-6,"tanh grad check");',
      },
    ],
    line: ul([
      '<code>act</code> object-এ প্রতিটি activation-এর f ও derivative d—পরের পাঠে backprop-এ লাগবে।',
      '<code>Object.entries(act)</code>: [নাম, মান] জোড়ার তালিকা।',
      '<code>matmul(W2, W1)</code>: ১×৩ গুণ ৩×২ = ১×২ matrix (অধ্যায় ৩-এর shape নিয়ম)।',
      'দুই স্তর ও এক স্তর হুবহু ২৫.৫—রৈখিক স্তর মিশে যায়। ReLU মাঝে দিলে ২১.৫।',
    ]),
    why: p('ReLU-র উদাহরণ এমনভাবে বাছা হয়েছে যাতে hidden মানের একটি ঋণাত্মক (−৪) হয়—তখনই ReLU আউটপুট বদলায়। সব hidden মান ধনাত্মক হলে ReLU কিছুই বদলাত না এবং পার্থক্য দেখা যেত না।'),
    remember: ['neuron = f(w · x + b)', 'activation ছাড়া স্তর মিশে এক হয়', 'sigmoid derivative ≤ ০.২৫ — vanishing gradient', 'ReLU: সহজ, দ্রুত; মৃত neuron ঝুঁকি'],
    skip: ['GELU, SiLU (Transformer-এ প্রচলিত)', 'universal approximation theorem-এর প্রমাণ'],
    experiment: p('x = [১, ৪]-এর বদলে x = [−১, −১] দিন। ReLU সহ ও ছাড়া আউটপুট কী? কোন hidden neuron এখন “বন্ধ” হলো?'),
    mistakes: ['activation ছাড়া অনেক স্তর বানিয়ে ভাবা মডেল জটিল হয়েছে', 'hidden layer-এ sigmoid ব্যবহার করে গভীর নেটওয়ার্কে gradient হারানো', 'ReLU-র ০-তে derivative নিয়ে অযথা চিন্তা (কার্যত ০ বা ১ ধরা হয়)', 'neuron-কে মস্তিষ্কের নির্ভুল মডেল ভাবা'],
    quiz: [
      { q: 'ReLU(−৩) ও ReLU(২) কত?', a: { a: '০ ও ২', b: '−৩ ও ২', c: '৩ ও ২' }, ok: 'a', why: 'ReLU = max(০, z): ঋণাত্মক কেটে ০, ধনাত্মক অপরিবর্তিত।' },
      { q: 'activation ছাড়া তিনটি রৈখিক স্তর কীসের সমতুল্য?', a: { a: 'তিনগুণ শক্তিশালী মডেল', b: 'একটি রৈখিক স্তর', c: 'একটি ReLU স্তর' }, ok: 'b', why: 'W₃W₂W₁ একটি matrix; গুণফল আবার রৈখিক রূপান্তর।' },
      { q: 'গভীর নেটওয়ার্কের hidden layer-এ sigmoid-এর প্রধান সমস্যা?', a: { a: 'আউটপুট ঋণাত্মক হয়', b: 'derivative ছোট (≤ ০.২৫), বহু স্তরে gradient প্রায় শূন্য', c: 'হিসাব করা যায় না' }, ok: 'b', why: 'chain rule-এ ছোট derivative-গুলো গুণ হয়; গভীর স্তরে শেখা থেমে যায়।' },
    ],
    recap: ['weighted sum + activation = neuron', 'non-linearity গভীরতাকে অর্থবহ করে', 'activation-এর derivative শেখার গতি ঠিক করে'],
    nextNote: 'অনেক neuron মিলে স্তর, স্তর মিলে নেটওয়ার্ক—forward pass:',
    sources: [SRC.d2l, SRC.goodfellow, ['Nair & Hinton — Rectified Linear Units (ICML 2010)', 'https://www.cs.toronto.edu/~hinton/absps/reluICML.pdf']],
  },
  {
    id: 'les-05-02-layers-forward-pass',
    slug: 'layers-forward-pass',
    title: 'Layer, Shape ও Forward Pass',
    minutes: 35,
    prereqs: ['les-05-01-neuron-activation', 'les-03-03-matrices-shapes'],
    summary: 'একটি layer = matrix W ও vector b; ২→৩→১ নেটওয়ার্কের forward pass; batch; parameter সংখ্যা গণনা।',
    overview: p('একটি স্তরের সব neuron একসাথে হিসাব করা যায়: h = f(Wx + b), যেখানে W-এর প্রতিটি সারি একটি neuron-এর weight। এই পাঠে ২টি input, ৩টি hidden neuron ও ১টি output-এর নেটওয়ার্কের forward pass হাতে ও কোডে করব, প্রতিটি ধাপের shape লিখব, কয়েকটি উদাহরণ একসাথে (batch) চালাব, এবং parameter সংখ্যা গুনব—যা বড় মডেলের “কত বিলিয়ন parameter” কথার ভিত্তি।'),
    objectives: ['একটি multi-layer নেটওয়ার্কের প্রতিটি ধাপের shape লিখতে পারবেন', 'forward pass হাতে ও কোডে হিসাব করতে পারবেন', 'একটি নেটওয়ার্কের parameter সংখ্যা গুনতে পারবেন'],
    problem: p('আগের পাঠে একটি neuron হিসাব করেছেন। এবার ৩টি hidden neuron, প্রতিটি দুটি input দেখে, তারপর একটি output neuron তিনটি hidden মান দেখে। প্রতিটি neuron আলাদা loop-এ লিখলে কোড জটিল ও ভুলপ্রবণ। কীভাবে পুরো স্তর একবারে লিখব, আর কীভাবে নিশ্চিত হব shape মিলছে?'),
    explain:
      p(`${term('লেয়ার', 'layer')}: W (আকার: আউটপুট × ইনপুট) এবং b (আকার: আউটপুট)। h = f(Wx + b)।`) +
      table(['ধাপ', 'হিসাব', 'shape'], [
        ['input', 'x', '[২]'],
        ['hidden pre-activation', 'z₁ = W₁x + b₁', 'W₁: ৩×২, b₁: [৩] → [৩]'],
        ['hidden', 'h = tanh(z₁)', '[৩]'],
        ['output pre-activation', 'z₂ = W₂h + b₂', 'W₂: ১×৩, b₂: [১] → [১]'],
        ['output', 'ŷ = σ(z₂)', '[১]'],
      ], '২→৩→১ নেটওয়ার্কের forward pass') +
      p(`${term('ফরওয়ার্ড পাস', 'forward pass')}: input থেকে শুরু করে স্তর ধরে output পর্যন্ত হিসাব। Training-এ backward pass-এর জন্য মাঝের মান (z₁, h) সংরক্ষণ করতে হয়।`) +
      p(`<strong>Parameter সংখ্যা:</strong> W₁-এ ৩×২ = ৬, b₁-এ ৩, W₂-এ ৩, b₂-এ ১—মোট ১৩। সাধারণ সূত্র: প্রতি স্তরে (ইনপুট × আউটপুট) + আউটপুট।`) +
      p(`${term('ব্যাচ', 'batch')}: কয়েকটি উদাহরণ একসাথে। X-এর shape [N, ২] হলে প্রতিটি সারিতে একই forward pass—GPU-তে এগুলো সমান্তরালে চলে।`),
    analogy: {
      text: 'নেটওয়ার্ক হলো কারখানার উৎপাদন-লাইন: প্রতিটি স্টেশন (layer) আগের স্টেশনের পণ্য নিয়ে রূপান্তর করে পরেরটিতে পাঠায়।',
      breaks: 'কারখানার স্টেশনের কাজ মানুষ নকশা করে; নেটওয়ার্কের প্রতিটি স্তর কী রূপান্তর করবে তা training ঠিক করে, এবং মাঝের স্তরের অর্থ প্রায়ই সহজে বোঝা যায় না।',
    },
    worked:
      p('x = [১, ০]; W₁ = [[১, −১], [০.৫, ০.৫], [−১, ২]], b₁ = [০, ০, ০]; W₂ = [[১, −২, ০.৫]], b₂ = ০.১।') +
      ol([
        'z₁ = [১×১ + (−১)×০, ০.৫×১ + ০.৫×০, −১×১ + ২×০] = [১, ০.৫, −১]।',
        'h = tanh(z₁) ≈ [০.৭৬২, ০.৪৬২, −০.৭৬২]।',
        'z₂ = ০.৭৬২ − ২×০.৪৬২ + ০.৫×(−০.৭৬২) + ০.১ ≈ ০.৭৬২ − ০.৯২৪ − ০.৩৮১ + ০.১ = −০.৪৪৩।',
        'ŷ = σ(−০.৪৪৩) ≈ ০.৩৯১।',
      ]),
    activity: note('কোডে একটি সাধারণ dense layer ফাংশন, তারপর দুটি স্তর জুড়ে forward pass, shape যাচাই, batch এবং parameter গণনা।'),
    code: [
      {
        label: 'dense layer, forward pass ও parameter গণনা',
        starter: String.raw`const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const sigmoid = (z) => 1 / (1 + Math.exp(-z));
const r3 = (x) => Math.round(x * 1000) / 1000;

function dense(W, b, x, f) {
  if (W[0].length !== x.length) throw new Error("shape মেলেনি: W " + W.length + "×" + W[0].length + ", x [" + x.length + "]");
  return W.map((row, i) => f(dot(row, x) + b[i]));
}

const net = {
  W1: [[1, -1], [0.5, 0.5], [-1, 2]], b1: [0, 0, 0],
  W2: [[1, -2, 0.5]], b2: [0.1],
};
function forward(net, x) {
  const h = dense(net.W1, net.b1, x, Math.tanh);
  const y = dense(net.W2, net.b2, h, sigmoid);
  return { h, y };
}

const { h, y } = forward(net, [1, 0]);
console.log("h =", h.map(r3), " ŷ =", r3(y[0]));

// batch: 4টি input
const X = [[0, 0], [0, 1], [1, 0], [1, 1]];
console.log("batch ŷ:", X.map((x) => r3(forward(net, x).y[0])));

// parameter গণনা
const count = (net) => [net.W1, net.W2].reduce((s, W) => s + W.length * W[0].length, 0) + net.b1.length + net.b2.length;
console.log("parameter:", count(net));

try { forward(net, [1, 0, 5]); } catch (e) { console.log("ধরা পড়ল →", e.message); }
`,
        expect: ['h = [0.762,0.462,-0.762]  ŷ = 0.391', 'parameter: 13', 'ধরা পড়ল → shape মেলেনি: W 3×2, x [3]'],
        hints: ['dense ফাংশনটি W-এর প্রতিটি সারি (একটি neuron) নিয়ে dot product করে।', 'hidden neuron ৩ থেকে ১০ করলে parameter কত হবে? (১০×২ + ১০ + ১×১০ + ১)', 'একটি ৭৬৮-dimension input, ৩০৭২ hidden-এর একটি স্তরে কত parameter?'],
        test: '__close(y[0],0.3910,1e-3,"worked y"); __assert(count(net)===13,"params"); __assert(count({W1:new Array(10).fill([0,0]),b1:new Array(10).fill(0),W2:[new Array(10).fill(0)],b2:[0]})===41,"params 10 hidden");',
      },
    ],
    line: ul([
      '<code>dense(W, b, x, f)</code>: একটি স্তর; শুরুতেই shape যাচাই—ভুল স্পষ্ট বার্তায়।',
      '<code>W.map((row, i) => …)</code>: প্রতিটি সারি একটি neuron।',
      '<code>forward</code> h ও y দুটোই ফেরত দেয়—পরের পাঠে backward-এ h লাগবে।',
      '<code>count</code>: প্রতিটি W-এর সারি × কলাম, তারপর bias-এর দৈর্ঘ্য।',
    ]),
    why: p('dense ফাংশন একবার লিখে দুই স্তরে ব্যবহার করা হয়েছে—এটাই PyTorch-এর nn.Linear-এর ধারণা (অধ্যায় ১৩)। worked উদাহরণের weight হাতে বাছা যাতে সংখ্যাগুলো হাতে মেলানো যায়; বাস্তবে weight দৈব দিয়ে শুরু হয় (পাঠ ৫.৪)।'),
    remember: ['স্তর: h = f(Wx + b)', 'W-এর shape = আউটপুট × ইনপুট', 'parameter = Σ (ইনপুট × আউটপুট + আউটপুট)', 'forward-এর মাঝের মান backward-এর জন্য রাখুন'],
    skip: ['matrix আকারে batch গুণ (X Wᵀ)', 'convolution layer'],
    experiment: p('W₂-এর মাঝের −২-কে +২ করুন। চারটি batch আউটপুট কীভাবে বদলায়? কোন hidden neuron-এর প্রভাব সবচেয়ে বেশি ছিল?'),
    mistakes: ['W-এর shape উল্টো লেখা (ইনপুট × আউটপুট)', 'bias ভুলে যাওয়া', 'forward-এর মাঝের মান না রাখা', 'parameter গণনায় bias বাদ দেওয়া'],
    quiz: [
      { q: '৪টি input, ৫টি hidden, ২টি output-এর নেটওয়ার্কে parameter কত?', a: { a: '৩৭', b: '৩০', c: '২০' }, ok: 'a', why: '(৪×৫ + ৫) + (৫×২ + ২) = ২৫ + ১২ = ৩৭।' },
      { q: 'W₁-এর shape ৮×৩ হলে input vector-এর dimension কত হতে হবে?', a: { a: '৮', b: '৩', c: '১১' }, ok: 'b', why: 'W-এর কলাম সংখ্যা = input dimension। আউটপুট হবে ৮।' },
      { q: 'forward pass-এ hidden মান h কেন সংরক্ষণ করা হয়?', a: { a: 'প্রদর্শনের জন্য', b: 'backward pass-এ gradient হিসাবে লাগে', c: 'দরকার নেই' }, ok: 'b', why: '∂L/∂W₂ = (ŷ − y) × h—h ছাড়া হিসাব সম্ভব নয়।' },
    ],
    recap: ['স্তর একটি matrix-vector গুণ + activation', 'shape প্রতিটি ধাপে যাচাই', 'parameter গোনা যায় এবং বড় মডেলে বিশাল'],
    nextNote: 'প্রতিটি weight-এর দোষ কতটা—backpropagation:',
    sources: [SRC.d2l, SRC.goodfellow],
  },
  {
    id: 'les-05-03-backpropagation',
    slug: 'backpropagation',
    title: 'Backpropagation: স্তর ধরে Gradient',
    minutes: 50,
    prereqs: ['les-05-02-layers-forward-pass', 'les-03-07-gradients-chain-rule'],
    summary: 'chain rule স্তর ধরে পেছনে; output থেকে δ = ŷ − y; hidden δ = (W₂ᵀδ) ⊙ f′(z₁); সব parameter-এর gradient check।',
    overview: p('Backpropagation হলো chain rule-কে নেটওয়ার্কে পদ্ধতিগতভাবে প্রয়োগ: output-এর ভুল থেকে শুরু করে স্তর ধরে পেছনে গিয়ে প্রতিটি weight-এর ∂L/∂w হিসাব। এই পাঠে আগের ২→৩→১ নেটওয়ার্কে একটি উদাহরণের জন্য প্রতিটি gradient হাতে বের করব, তারপর কোডে লিখে সব ১৩টি parameter-এর সংখ্যাগত gradient check করব। এটি বুঝলে PyTorch-এর loss.backward() আর রহস্য থাকে না।'),
    objectives: ['output স্তরের δ = ŷ − y কেন তা ব্যাখ্যা করতে পারবেন', 'hidden স্তরের δ হাতে হিসাব করতে পারবেন', 'gradient check দিয়ে backprop কোডের সঠিকতা যাচাই করতে পারবেন'],
    problem: p('নেটওয়ার্কের ১৩টি parameter। training-এ প্রতিটিকে loss কমানোর দিকে একটু সরাতে হবে—অর্থাৎ ১৩টি partial derivative লাগবে। প্রতিটির জন্য সংখ্যাগত derivative (দুবার forward) করলে ২৬টি forward pass। কোটি parameter-এর মডেলে এভাবে অসম্ভব। একবার forward ও একবার backward-এ সব gradient পাওয়ার উপায় কী?'),
    explain:
      p('অধ্যায় ৩-এ শিখেছেন: z → y → L হলে ∂L/∂z = ∂L/∂y × ∂y/∂z। নেটওয়ার্কে এই শৃঙ্খল দীর্ঘ, কিন্তু নিয়ম একই।') +
      p(`<strong>Output স্তর (sigmoid + binary cross-entropy):</strong> δ₂ = ∂L/∂z₂ = ŷ − y (অধ্যায় ৪-এ দেখেছেন)। তাহলে ∂L/∂W₂[j] = δ₂ × hⱼ, ∂L/∂b₂ = δ₂।`) +
      p(`<strong>Hidden স্তর:</strong> hⱼ কতটা দায়ী? z₂ = Σ W₂[j]hⱼ + b₂, তাই ∂L/∂hⱼ = δ₂ × W₂[j]। তারপর tanh-এর মধ্য দিয়ে: δ₁[j] = ∂L/∂z₁[j] = δ₂ × W₂[j] × (১ − hⱼ²)। অবশেষে ∂L/∂W₁[j][i] = δ₁[j] × xᵢ, ∂L/∂b₁[j] = δ₁[j]।`) +
      table(['ধাপ', 'হিসাব'], [
        ['১. forward', 'z₁, h, z₂, ŷ সংরক্ষণ'],
        ['২. output δ', 'δ₂ = ŷ − y'],
        ['৩. output gradient', '∂W₂ = δ₂ h, ∂b₂ = δ₂'],
        ['৪. hidden-এ ফেরত', 'δ₁ = (W₂ᵀ δ₂) ⊙ (১ − h²)'],
        ['৫. hidden gradient', '∂W₁ = δ₁ xᵀ, ∂b₁ = δ₁'],
      ], 'backpropagation-এর ধাপ (⊙ = উপাদান-ভিত্তিক গুণ)') +
      p('<strong>খরচ:</strong> backward pass-এর খরচ forward-এর মতোই (মোটামুটি দুই গুণের মধ্যে)—parameter সংখ্যা যতই হোক, সব gradient একসাথে।'),
    analogy: {
      text: 'কারখানায় ত্রুটিপূর্ণ পণ্য পেলে শেষ স্টেশন থেকে পেছনে খোঁজা হয়: প্রতিটি স্টেশন কতটা অবদান রেখেছে, সেই অনুপাতে দায় পরের স্টেশনে ভাগ হয়।',
      breaks: 'কারখানায় দায় নৈতিক বা প্রশাসনিক; backprop-এ “দায়” শুধু একটি সংখ্যা—weight সামান্য বদলালে loss কতটা বদলায়। কোনো weight “ভুল” বা “দোষী” নয়।',
    },
    worked:
      p('আগের পাঠের নেটওয়ার্ক, x = [১, ০], আসল y = ১। forward: h ≈ [০.৭৬২, ০.৪৬২, −০.৭৬২], ŷ ≈ ০.৩৯১।') +
      ol([
        'δ₂ = ০.৩৯১ − ১ = −০.৬০৯।',
        '∂W₂ = δ₂ × h ≈ [−০.৪৬৪, −০.২৮১, ০.৪৬৪]; ∂b₂ = −০.৬০৯।',
        '১ − h² ≈ [০.৪২০, ০.৭৮৬, ০.৪২০]।',
        'δ₁ = δ₂ × W₂ ⊙ (১ − h²) ≈ [−০.৬০৯×১×০.৪২০, −০.৬০৯×(−২)×০.৭৮৬, −০.৬০৯×০.৫×০.৪২০] ≈ [−০.২৫৬, ০.৯৫৮, −০.১২৮]।',
        '∂W₁ = δ₁ × x: x = [১, ০] তাই প্রথম কলাম δ₁, দ্বিতীয় কলাম ০।',
      ]),
    activity: note('কোডে forward ও backward, তারপর প্রতিটি parameter-এ +h ও −h দিয়ে সংখ্যাগত derivative—সর্বোচ্চ পার্থক্য দেখানো হবে।'),
    code: [
      {
        label: 'backprop ও সম্পূর্ণ gradient check',
        starter: String.raw`const sigmoid = (z) => 1 / (1 + Math.exp(-z));
const r3 = (x) => Math.round(x * 1000) / 1000;
const net = { W1: [[1, -1], [0.5, 0.5], [-1, 2]], b1: [0, 0, 0], W2: [1, -2, 0.5], b2: 0.1 };

function forward(net, x) {
  const z1 = net.W1.map((w, j) => w[0] * x[0] + w[1] * x[1] + net.b1[j]);
  const h = z1.map(Math.tanh);
  const z2 = h.reduce((s, v, j) => s + v * net.W2[j], 0) + net.b2;
  return { z1, h, yhat: sigmoid(z2) };
}
const loss = (net, x, y) => { const p = forward(net, x).yhat; return -(y * Math.log(p) + (1 - y) * Math.log(1 - p)); };

function backward(net, x, y) {
  const { h, yhat } = forward(net, x);
  const d2 = yhat - y;
  const gW2 = h.map((hj) => d2 * hj), gb2 = d2;
  const d1 = h.map((hj, j) => d2 * net.W2[j] * (1 - hj * hj));
  const gW1 = d1.map((dj) => [dj * x[0], dj * x[1]]), gb1 = d1;
  return { gW1, gb1, gW2, gb2 };
}

const x = [1, 0], y = 1;
const g = backward(net, x, y);
console.log("ŷ =", r3(forward(net, x).yhat), " δ2 =", r3(g.gb2));
console.log("∂W2 =", g.gW2.map(r3), " δ1 = ∂b1 =", g.gb1.map(r3));
console.log("∂W1 =", JSON.stringify(g.gW1.map((r) => r.map(r3))));

// gradient check: প্রতিটি parameter-এ কেন্দ্রীয় পার্থক্য
const clone = (o) => JSON.parse(JSON.stringify(o));
let maxDiff = 0, checked = 0;
function check(path, analytic) {
  const h = 1e-5, up = clone(net), dn = clone(net);
  const set = (o, d) => { let t = o; for (let i = 0; i < path.length - 1; i++) t = t[path[i]]; t[path[path.length - 1]] += d; };
  set(up, h); set(dn, -h);
  const numeric = (loss(up, x, y) - loss(dn, x, y)) / (2 * h);
  maxDiff = Math.max(maxDiff, Math.abs(numeric - analytic)); checked++;
}
net.W1.forEach((row, j) => row.forEach((_, i) => check(["W1", j, i], g.gW1[j][i])));
net.b1.forEach((_, j) => check(["b1", j], g.gb1[j]));
net.W2.forEach((_, j) => check(["W2", j], g.gW2[j]));
check(["b2"], g.gb2);
console.log("যাচাই করা parameter:", checked, " সর্বোচ্চ পার্থক্য:", maxDiff.toExponential(1));
`,
        expect: ['ŷ = 0.391  δ2 = -0.609', '∂W2 = [-0.464,-0.281,0.464]', 'যাচাই করা parameter: 13'],
        hints: ['∂W1-এর দ্বিতীয় কলাম সব ০ কেন? (x[1] = 0)', 'backward-এ (1 - hj * hj) হলো tanh-এর derivative—কেন z1 দরকার হলো না?', 'd1-এর সূত্রে net.W2[j]-কে ভুলে বাদ দিন; gradient check কী বলে?'],
        test: '__assert(checked===13,"13 params"); __assert(maxDiff<1e-8,"grad check passes"); __close(g.gb1[1],0.958,2e-3,"worked delta1");',
      },
    ],
    line: ul([
      '<code>d2 = yhat - y</code>: sigmoid + cross-entropy-র সরল gradient।',
      '<code>d1</code>: পেছনে পাঠানো ভুল × weight × activation-এর derivative—chain rule-এর তিন গুণক।',
      '<code>check(path, analytic)</code>: path দিয়ে একটি parameter খুঁজে +h ও −h সরিয়ে loss হিসাব।',
      '<code>clone</code>: JSON দিয়ে গভীর কপি—আসল net অক্ষত।',
      'সর্বোচ্চ পার্থক্য ~১০⁻¹¹: backprop সঠিক। ১০⁻⁴-এর বেশি হলে সাধারণত বাগ।',
    ]),
    why: p('প্রতিটি parameter আলাদাভাবে যাচাই করা হয়েছে, কারণ backprop-এর বাগ প্রায়ই একটি জায়গায় (যেমন একটি index উল্টো) এবং গড় দেখে ধরা পড়ে না। ১৩টির সর্বোচ্চ পার্থক্য দেখানো সবচেয়ে কঠোর মাপ।'),
    remember: ['δ₂ = ŷ − y', 'δ₁ = W₂ δ₂ ⊙ f′(z₁)', '∂W = δ × (আগের স্তরের আউটপুট)', 'নতুন backprop কোড লিখলে gradient check'],
    skip: ['matrix আকারে batch backprop', 'automatic differentiation-এর ভেতরের গঠন (অধ্যায় ১৩-এ PyTorch autograd)'],
    experiment: p('y = ১-কে y = ০ করুন। δ₂-এর চিহ্ন কী হলো? W₂-এর gradient-এর চিহ্ন? প্রথম hidden neuron-এর weight কোন দিকে সরবে—ব্যাখ্যা করুন।'),
    mistakes: ['activation-এর derivative ভুল জায়গায় (h-এর বদলে z দিয়ে tanh′ ভুল সূত্রে)', 'W₂ দিয়ে গুণ করতে ভুলে যাওয়া', 'gradient check ছাড়া নতুন backprop কোড বিশ্বাস করা', 'gradient-এর চিহ্ন উল্টো আপডেট (w += lr × g)'],
    quiz: [
      { q: 'ŷ = ০.৮, y = ১। δ₂ কত?', a: { a: '০.২', b: '−০.২', c: '০.৮' }, ok: 'b', why: 'δ₂ = ŷ − y = −০.২। ঋণাত্মক মানে z₂ বাড়ালে loss কমবে।' },
      { q: 'h = [০.৫, −০.২], δ₂ = ০.৪। ∂W₂ কত?', a: { a: '[০.২, −০.০৮]', b: '[০.৯, ০.২]', c: '[০.৫, −০.২]' }, ok: 'a', why: '∂W₂ = δ₂ × h = [০.৪×০.৫, ০.৪×(−০.২)]।' },
      { q: 'backprop-এর বড় সুবিধা কী?', a: { a: 'loss সবসময় শূন্য হয়', b: 'একটি forward ও একটি backward-এ সব parameter-এর gradient', c: 'activation লাগে না' }, ok: 'b', why: 'সংখ্যাগত পদ্ধতিতে প্রতিটি parameter-এ আলাদা forward লাগত; backprop মাঝের মান পুনর্ব্যবহার করে।' },
    ],
    recap: ['chain rule স্তর ধরে পেছনে', 'δ পেছনে যায়, gradient = δ × input', 'gradient check = বিশ্বাসের ভিত্তি'],
    nextNote: 'gradient পেলাম—এবার বারবার আপডেট, অর্থাৎ training:',
    sources: [SRC.backprop, SRC.d2l, ['CS231n — Backpropagation, Intuitions', 'https://cs231n.github.io/optimization-2/']],
  },
  {
    id: 'les-05-04-training-xor',
    slug: 'training-loop-xor',
    title: 'Training Loop: XOR শেখানো',
    minutes: 45,
    prereqs: ['les-05-03-backpropagation'],
    summary: 'XOR রৈখিকভাবে আলাদা করা যায় না; full-batch training loop; শূন্য initialization-এ symmetry; ছোট নেটওয়ার্কে local minimum।',
    overview: p('XOR (দুই input ভিন্ন হলে ১, একই হলে ০) এমন একটি সমস্যা যা কোনো সরলরেখা সমাধান করতে পারে না—কিন্তু একটি hidden layer পারে। এই পাঠে পূর্ণ training loop লিখব: forward, loss, backward, update, বারবার। তারপর তিনটি পরীক্ষা: (১) ৩টি hidden neuron দিয়ে কয়েকটি seed, (২) ২টি hidden neuron—কিছু seed-এ আটকে যায়, (৩) সব weight শূন্য দিয়ে শুরু—নেটওয়ার্ক কিছুই শেখে না। প্রতিটির কারণ বুঝব।'),
    objectives: ['forward–loss–backward–update training loop লিখতে পারবেন', 'শূন্য initialization কেন symmetry ভাঙতে পারে না তা ব্যাখ্যা করতে পারবেন', 'loss আটকে যাওয়া (local minimum) শনাক্ত করে সমাধানের উপায় বলতে পারবেন'],
    problem: p('XOR-এর চারটি বিন্দু: (০,০)→০, (০,১)→১, (১,০)→১, (১,১)→০। কাগজে আঁকুন—একটি সরলরেখা দিয়ে ১-গুলোকে ০-গুলো থেকে আলাদা করতে পারবেন? অধ্যায় ৪-এর logistic regression তাই সর্বোচ্চ ৭৫% পারে। hidden layer কীভাবে এটি সমাধান করে, আর training কি সবসময় সফল হয়?'),
    explain:
      p(`${term('ট্রেনিং লুপ', 'training loop')}: প্রতিটি ${term('ইপক', 'epoch')}-এ (সব ডেটা একবার): forward → loss → backward → parameter -= lr × gradient।`) +
      p('<strong>hidden layer কী করে:</strong> প্রথম স্তর input-কে নতুন স্থানে রূপান্তর করে যেখানে XOR রৈখিকভাবে আলাদা হয়। যেমন একটি neuron “OR”, আরেকটি “AND” শিখলে, output = OR − AND = XOR।') +
      p(`<strong>${term('সিমেট্রি', 'symmetry')} সমস্যা:</strong> সব weight শূন্য হলে প্রতিটি hidden neuron একই আউটপুট দেয়, একই gradient পায়, একইভাবে আপডেট হয়—চিরকাল একই থাকে। কার্যত একটি neuron। তাই weight ছোট দৈব সংখ্যা দিয়ে শুরু হয় (seed-যুক্ত, যাতে পুনরুৎপাদনযোগ্য)।`) +
      p(`<strong>${term('লোকাল মিনিমাম', 'local minimum')}:</strong> neural network-এর loss-পৃষ্ঠে অনেক উপত্যকা। ছোট নেটওয়ার্ক কোনো seed-এ এমন জায়গায় আটকে যায় যেখানে gradient প্রায় ০ কিন্তু loss বেশি। প্রতিকার: বেশি neuron, ভিন্ন seed, ভালো optimizer।`) +
      note('এখানে training ও মূল্যায়ন একই ৪টি বিন্দুতে—XOR-এ নতুন ডেটা নেই। এটি শুধু “শিখতে পারে কি না” পরীক্ষা, সাধারণীকরণের পরীক্ষা নয় (প্রজেক্টে আলাদা test সেট থাকবে)।'),
    analogy: {
      text: 'শূন্য initialization হলো একই প্রশিক্ষণ, একই বই, একই শিক্ষক দিয়ে তিনজন যমজ ছাত্র পড়ানো এবং আশা করা তারা ভিন্ন বিষয়ে বিশেষজ্ঞ হবে।',
      breaks: 'মানুষ যমজও অভিজ্ঞতায় ভিন্ন হয়; গাণিতিক neuron-এর ক্ষেত্রে একই input ও gradient হলে পার্থক্য তৈরির কোনো উৎস নেই—তারা নিখুঁতভাবে একই থাকে।',
    },
    worked:
      p('শূন্য initialization-এর প্রথম ধাপ: সব W, b = ০।') +
      ol([
        'h = tanh(০) = ০ সব neuron-এ; z₂ = ০; ŷ = ০.৫ সব input-এ।',
        'loss = −log ০.৫ = ln ২ ≈ ০.৬৯৩।',
        '∂W₂[j] = δ₂ × hⱼ = ০, কারণ h = ০।',
        'δ₁[j] = δ₂ × W₂[j] × … = ০, কারণ W₂ = ০। তাই W₁-ও বদলায় না।',
        'শুধু b₂ বদলায়, কিন্তু চার input-এর গড় δ₂ = ০ (দুটি ০.৫, দুটি −০.৫), তাই b₂-ও স্থির। loss চিরকাল ০.৬৯৩।',
      ]),
    activity: note('কোডে একটি সাধারণ train ফাংশন (hidden আকার, seed, শূন্য-init বিকল্প), তারপর তিনটি পরীক্ষা।'),
    code: [
      {
        label: 'XOR training: seed, আকার ও শূন্য-init',
        starter: RNG + String.raw`
const X = [[0, 0], [0, 1], [1, 0], [1, 1]], Y = [0, 1, 1, 0];
const sigmoid = (z) => 1 / (1 + Math.exp(-z));

function train({ hidden, seed, zero = false, lr = 1, epochs = 2000 }) {
  const rand = makeRng(seed), init = () => (zero ? 0 : rand() * 2 - 1);
  const W1 = Array.from({ length: hidden }, () => [init(), init()]), b1 = new Array(hidden).fill(0);
  const W2 = Array.from({ length: hidden }, init); let b2 = 0;
  const fwd = (x) => { const h = W1.map((w, j) => Math.tanh(w[0] * x[0] + w[1] * x[1] + b1[j])); return { h, p: sigmoid(h.reduce((s, v, j) => s + v * W2[j], 0) + b2) }; };
  let loss = 0;
  for (let e = 0; e < epochs; e++) {
    const gW1 = W1.map(() => [0, 0]), gb1 = new Array(hidden).fill(0), gW2 = new Array(hidden).fill(0); let gb2 = 0;
    loss = 0;
    X.forEach((x, n) => {
      const { h, p } = fwd(x);
      loss += -(Y[n] * Math.log(p) + (1 - Y[n]) * Math.log(1 - p)) / X.length;
      const d2 = (p - Y[n]) / X.length; gb2 += d2;
      for (let j = 0; j < hidden; j++) {
        gW2[j] += d2 * h[j];
        const d1 = d2 * W2[j] * (1 - h[j] * h[j]);
        gb1[j] += d1; gW1[j][0] += d1 * x[0]; gW1[j][1] += d1 * x[1];
      }
    });
    for (let j = 0; j < hidden; j++) { W2[j] -= lr * gW2[j]; b1[j] -= lr * gb1[j]; W1[j][0] -= lr * gW1[j][0]; W1[j][1] -= lr * gW1[j][1]; }
    b2 -= lr * gb2;
  }
  return { loss, preds: X.map((x) => Math.round(fwd(x).p * 100) / 100), W1 };
}

for (const seed of [1, 2, 3]) { const r = train({ hidden: 3, seed }); console.log("hidden=3 seed=" + seed, "loss=" + r.loss.toFixed(4), "ŷ=" + JSON.stringify(r.preds)); }
for (const seed of [1, 2]) { const r = train({ hidden: 2, seed }); console.log("hidden=2 seed=" + seed, "loss=" + r.loss.toFixed(4), "ŷ=" + JSON.stringify(r.preds)); }
const z = train({ hidden: 3, seed: 1, zero: true });
console.log("শূন্য-init      loss=" + z.loss.toFixed(4), "ŷ=" + JSON.stringify(z.preds), "W1 সারি একই?", JSON.stringify(z.W1[0]) === JSON.stringify(z.W1[2]));
`,
        expect: ['hidden=3 seed=1 loss=0.0013', 'hidden=2 seed=1 loss=0.3473', 'hidden=2 seed=2 loss=0.0016', 'শূন্য-init      loss=0.6931 ŷ=[0.5,0.5,0.5,0.5] W1 সারি একই? true'],
        hints: ['hidden=2 seed=1-এর ŷ দেখুন: কোন input-এ মডেল ভুল? loss 0.347 ≈ ln2/2 —অর্থাৎ দুটি বিন্দুতে সে 0.5-এ আটকে।', 'শূন্য-init-এ W1-এর সব সারি একই থাকে—এটাই symmetry।', 'hidden=2 seed=1-এ epochs 2000 থেকে 20000 করলে কি বের হয়? চালিয়ে দেখুন।'],
        test: 'var a=train({hidden:3,seed:1}); __assert(a.loss<0.01,"h3 solves"); __assert(a.preds[0]<0.5&&a.preds[1]>0.5&&a.preds[2]>0.5&&a.preds[3]<0.5,"h3 correct"); __assert(train({hidden:2,seed:1}).loss>0.3,"h2 seed1 stuck"); __close(z.loss,Math.log(2),1e-9,"zero init stays ln2");',
      },
    ],
    line: ul([
      '<code>train({ hidden, seed, zero })</code>: object parameter—পরীক্ষাগুলো এক লাইনে পরিবর্তন।',
      '<code>init()</code>: −১ থেকে ১-এর দৈব সংখ্যা, বা zero হলে ০।',
      'loop-এর ভেতরের gradient কোড আগের পাঠের backward-এর মতো, চারটি উদাহরণের গড়ে যোগ।',
      'update loop সব gradient হিসাবের <em>পরে</em>—এটি full-batch gradient descent।',
    ]),
    why: p('একই train ফাংশনে শুধু hidden, seed ও zero বদলে তিনটি পরীক্ষা চালানো হয়েছে, যাতে পার্থক্যের কারণ শুধু ঐ একটি পরিবর্তন। আটকে যাওয়া seed ইচ্ছাকৃতভাবে দেখানো হয়েছে—“training কখনো ব্যর্থ হয়” জানা একজন প্রকৌশলীর জন্য সাফল্যের উদাহরণের চেয়ে বেশি কাজের।'),
    remember: ['training loop: forward, loss, backward, update', 'শূন্য init = symmetry = একটি neuron', 'seed বদলালে ফল বদলাতে পারে—রিপোর্টে seed লিখুন', 'XOR-এ train = test, তাই সাধারণীকরণের দাবি নেই'],
    skip: ['Xavier/He initialization-এর সূত্র', 'mini-batch SGD (পরের পাঠ ও অধ্যায় ১৩)'],
    experiment: p('hidden=3, seed=1-এ lr = ১ থেকে ১০ করুন। কী হয়? তারপর ০.১ করুন—২০০০ epoch-এ যথেষ্ট? অধ্যায় ৩-এর learning-rate পর্যবেক্ষণের সাথে মেলান।'),
    mistakes: ['সব weight শূন্য দিয়ে শুরু', 'একটি seed-এর ব্যর্থতাকে “মডেল কাজ করে না” ভাবা', 'training loss দেখে সাধারণীকরণ দাবি', 'seed না লেখা—ফল পুনরুৎপাদন অসম্ভব'],
    quiz: [
      { q: 'সব weight শূন্য দিয়ে শুরু করলে hidden neuron-গুলোর কী হয়?', a: { a: 'দ্রুত ভিন্ন হয়', b: 'একই gradient পেয়ে চিরকাল একই থাকে', c: 'মুছে যায়' }, ok: 'b', why: 'একই input, একই weight → একই আউটপুট ও gradient → একই আপডেট। symmetry ভাঙে না।' },
      { q: 'XOR কেন logistic regression দিয়ে নিখুঁত হয় না?', a: { a: 'ডেটা কম বলে', b: '১ ও ০ বিন্দুগুলো একটি সরলরেখা দিয়ে আলাদা করা যায় না', c: 'sigmoid ধীর বলে' }, ok: 'b', why: 'logistic regression-এর সীমানা রৈখিক; XOR-এর জন্য বাঁকা সীমানা বা রূপান্তর লাগে।' },
      { q: 'training loss ০.৩৫-এ বহু epoch ধরে স্থির। প্রথম যুক্তিসঙ্গত পদক্ষেপ?', a: { a: 'ধরে নেওয়া সমস্যাটি অসমাধানযোগ্য', b: 'ভিন্ন seed, বেশি hidden neuron বা ভিন্ন learning rate চেষ্টা', c: 'ডেটা মুছে ফেলা' }, ok: 'b', why: 'ছোট নেটওয়ার্ক local minimum-এ আটকাতে পারে; capacity বা শুরুর বিন্দু বদলালে প্রায়ই বেরিয়ে আসে।' },
    ],
    recap: ['hidden layer রৈখিক-অবিভাজ্য সমস্যা সমাধান করে', 'দৈব init symmetry ভাঙে', 'training ব্যর্থ হতে পারে—seed ও capacity পরীক্ষা'],
    nextNote: 'সাধারণ gradient descent-এর চেয়ে ভালো আপডেট নিয়ম—optimizer:',
    sources: [SRC.d2l, SRC.goodfellow, ['Glorot & Bengio — Understanding the difficulty of training deep feedforward neural networks (2010)', 'https://proceedings.mlr.press/v9/glorot10a.html']],
  },
  {
    id: 'les-05-05-optimizers',
    slug: 'sgd-momentum-adam',
    title: 'Optimizer: SGD, Momentum ও Adam',
    minutes: 40,
    prereqs: ['les-05-04-training-xor'],
    summary: 'mini-batch SGD; দীর্ঘ উপত্যকায় zig-zag; momentum বেগ জমায়; Adam প্রতি parameter-এ ধাপ মানিয়ে নেয়; ধাপ গণনা তুলনা।',
    overview: p('Gradient descent-এর মৌলিক নিয়ম w ← w − η∇L। বাস্তবে তিনটি উন্নতি প্রচলিত: (১) mini-batch SGD—পুরো ডেটার বদলে ছোট দৈব অংশে gradient; (২) momentum—আগের ধাপের দিক মনে রেখে বেগ জমানো; (৩) Adam—প্রতিটি parameter-এর gradient-এর মাপ অনুযায়ী ধাপ ছোট-বড় করা। এই পাঠে একটি লম্বাটে “উপত্যকা” loss-এ তিনটি optimizer চালিয়ে কত ধাপে লক্ষ্যে পৌঁছায় তুলনা করব।'),
    objectives: ['mini-batch SGD কেন ব্যবহৃত হয় তা বলতে পারবেন', 'momentum ও Adam-এর আপডেট নিয়ম কোডে লিখতে পারবেন', 'একটি সমস্যায় optimizer তুলনা করে ফল ব্যাখ্যা করতে পারবেন'],
    problem: p('loss L(w₁, w₂) = ০.৫(w₁² + ২৫w₂²)। w₂ দিকে বক্রতা ২৫ গুণ খাড়া। অধ্যায় ৩-এর শিক্ষা: বড় learning rate-এ খাড়া দিকে বিস্ফোরণ, ছোট learning rate-এ সমতল দিকে শামুকের গতি। একটি learning rate দুই দিকে কীভাবে কাজ করবে?'),
    explain:
      p(`${term('মিনি-ব্যাচ SGD', 'mini-batch stochastic gradient descent')}: প্রতি ধাপে ডেটার ছোট দৈব অংশ (যেমন ৩২টি)। gradient-এ noise থাকে, কিন্তু প্রতি ধাপ অনেক সস্তা—বড় ডেটায় একমাত্র ব্যবহারযোগ্য পদ্ধতি।`) +
      table(['Optimizer', 'আপডেট', 'ধারণা'], [
        ['GD/SGD', 'w ← w − η g', 'সরাসরি gradient-এর বিপরীতে'],
        ['Momentum', 'v ← βv + g; w ← w − ηv', 'বল গড়িয়ে পড়ার মতো—ধারাবাহিক দিকে গতি বাড়ে, zig-zag কাটাকাটি'],
        ['Adam', 'm ← β₁m + (১−β₁)g; s ← β₂s + (১−β₂)g²; w ← w − η m̂ / (√ŝ + ε)', 'momentum + প্রতি parameter-এ gradient-এর মাপ দিয়ে ভাগ'],
      ], 'তিন optimizer (g = gradient)') +
      p('Adam-এর m̂, ŝ হলো bias-সংশোধিত মান: m̂ = m/(১ − β₁ᵗ), ŝ = s/(১ − β₂ᵗ)—শুরুতে m, s শূন্যের দিকে ঝুঁকে থাকে, তাই সংশোধন। প্রচলিত মান β₁ = ০.৯, β₂ = ০.৯৯৯, ε = ১০⁻⁸।') +
      warn('কোনো optimizer সব সমস্যায় সেরা নয়। এই পাঠের তুলনা একটি নির্দিষ্ট খেলনা loss-এ—বাস্তব নেটওয়ার্কে learning rate ও অন্যান্য সেটিং আলাদা করে validation দিয়ে বাছাই করতে হয়।'),
    analogy: {
      text: 'Momentum হলো ঢালু রাস্তায় সাইকেল: প্যাডেল (gradient) না দিলেও আগের গতিতে এগোয়, আর ছোট গর্তে থামে না।',
      breaks: 'সাইকেলের ভর ও ঘর্ষণ পদার্থবিজ্ঞানের নিয়মে; momentum-এর β একটি বেছে নেওয়া সংখ্যা—খুব বড় হলে বল লক্ষ্য পেরিয়ে দোল খায়, এমন আচরণ সাইকেলে স্বাভাবিক নয়।',
    },
    worked:
      p('Momentum, β = ০.৯, η = ০.১, এক-মাত্রিক L = ০.৫w², শুরু w = ১, v = ০। g = w।') +
      ol([
        't=১: g = ১; v = ০ + ১ = ১; w = ১ − ০.১ = ০.৯।',
        't=২: g = ০.৯; v = ০.৯ + ০.৯ = ১.৮; w = ০.৯ − ০.১৮ = ০.৭২।',
        'সাধারণ GD-তে t=২-এ w = ০.৯ × ০.৯ = ০.৮১। momentum দ্রুত এগিয়েছে।',
      ]),
    activity: note('কোডে তিনটি optimizer একই সাধারণ ইন্টারফেসে, একই শুরুর বিন্দু থেকে; loss ১০⁻⁶-এর নিচে নামতে কত ধাপ লাগে এবং বিস্ফোরণ হয় কিনা।'),
    code: [
      {
        label: 'লম্বাটে উপত্যকায় optimizer তুলনা',
        starter: String.raw`const loss = ([a, b]) => 0.5 * (a * a + 25 * b * b);
const grad = ([a, b]) => [a, 25 * b];

function sgd(lr) { return (w, g) => w.map((wi, i) => wi - lr * g[i]); }
function momentum(lr, beta = 0.9) {
  let v = [0, 0];
  return (w, g) => { v = v.map((vi, i) => beta * vi + g[i]); return w.map((wi, i) => wi - lr * v[i]); };
}
function adam(lr, b1 = 0.9, b2 = 0.999, eps = 1e-8) {
  let m = [0, 0], s = [0, 0], t = 0;
  return (w, g) => {
    t++;
    m = m.map((mi, i) => b1 * mi + (1 - b1) * g[i]);
    s = s.map((si, i) => b2 * si + (1 - b2) * g[i] * g[i]);
    return w.map((wi, i) => wi - lr * (m[i] / (1 - b1 ** t)) / (Math.sqrt(s[i] / (1 - b2 ** t)) + eps));
  };
}

function run(name, step, maxSteps = 2000) {
  let w = [5, 1];
  for (let t = 1; t <= maxSteps; t++) {
    w = step(w, grad(w));
    const L = loss(w);
    if (!isFinite(L) || L > 1e6) { console.log(name.padEnd(18), "বিস্ফোরণ, ধাপ", t); return Infinity; }
    if (L < 1e-6) { console.log(name.padEnd(18), "লক্ষ্যে পৌঁছাল, ধাপ", t); return t; }
  }
  console.log(name.padEnd(18), maxSteps, "ধাপে পৌঁছায়নি, loss", loss(w).toExponential(2)); return maxSteps;
}

const res = {
  sgdSmall: run("SGD η=0.03", sgd(0.03)),
  sgdBig: run("SGD η=0.09", sgd(0.09)),
  momentum: run("Momentum η=0.03", momentum(0.03)),
  adam: run("Adam η=0.1", adam(0.1)),
};
`,
        expect: ['SGD η=0.03', 'বিস্ফোরণ, ধাপ 26', 'Momentum η=0.03', 'Adam η=0.1'],
        hints: ['SGD η=0.09: w₂-দিকে প্রতি ধাপে গুণক (1 − 0.09×25) = −1.25, |−1.25| > 1—তাই বিস্ফোরণ। স্থিতিশীল সর্বোচ্চ η কত? (2/25)', 'SGD η=0.03-এ w₁-দিকে প্রতি ধাপে মাত্র 3% কমে—সেজন্য অনেক ধাপ।', 'momentum-এর β 0.9 থেকে 0.99 করুন—কী হয়?'],
        test: '__assert(res.sgdBig===Infinity,"sgd big diverges"); __assert(res.momentum<res.sgdSmall,"momentum faster than sgd"); __assert(isFinite(res.adam),"adam converges"); var m=momentum(0.1,0.9), w=[1,0]; w=m(w,[1,0]); w=m(w,[w[0],0]); __close(w[0],0.72,1e-12,"worked momentum");',
      },
    ],
    line: ul([
      'প্রতিটি optimizer একটি function ফেরত দেয় যা (w, g) নিয়ে নতুন w দেয়; ভেতরের অবস্থা (v, m, s, t) closure-এ থাকে।',
      '<code>b1 ** t</code>: Adam-এর bias সংশোধন—শুরুর ধাপে বড় প্রভাব, পরে প্রায় ১।',
      '<code>run</code>-এ বিস্ফোরণ ও লক্ষ্যে-পৌঁছানো দুই শর্ত—শুধু শেষ loss নয়, আচরণও রিপোর্ট।',
    ]),
    why: p('প্রতিটি optimizer-এর learning rate এমনভাবে বাছা যাতে তুলনাটি শিক্ষণীয় হয়: SGD-র দুটি মান স্থিতিশীলতার সীমার দুই পাশে। এটি “Adam সবসময় সেরা” প্রমাণ নয়; ভিন্ন η-তে ক্রম বদলাতে পারে—পরীক্ষা অংশে নিজে দেখুন।'),
    remember: ['mini-batch SGD: সস্তা, noise-যুক্ত gradient', 'momentum: বেগ জমায়, zig-zag কমায়', 'Adam: প্রতি parameter-এ ধাপের মাপ মানিয়ে নেয়', 'optimizer-এর hyperparameter-ও validation দিয়ে বাছুন'],
    skip: ['AdamW (weight decay আলাদা)', 'learning rate schedule (warmup, cosine)', 'second-order পদ্ধতি'],
    experiment: p('Adam-এর η = ০.১ থেকে ০.০১ ও ১ করুন। কত ধাপ লাগে? তারপর momentum-এর η = ০.০৫ দিন। কোনো একক “সেরা” optimizer বলা যায় কি?'),
    mistakes: ['ভিন্ন optimizer-এ একই learning rate ধরে নেওয়া', 'একটি খেলনা সমস্যার তুলনাকে সাধারণ নিয়ম বলা', 'Adam-এর bias সংশোধন ভুলে যাওয়া', 'বিস্ফোরণ (NaN) পরীক্ষা না করা'],
    quiz: [
      { q: 'L = ০.৫ × ২৫w² হলে সাধারণ GD-তে η কতর বেশি হলে বিস্ফোরণ?', a: { a: '০.০৮ (= ২/২৫)', b: '১', c: '০.২৫' }, ok: 'a', why: 'প্রতি ধাপে w ← (১ − ২৫η)w; |১ − ২৫η| > ১ হলে বাড়ে, অর্থাৎ η > ২/২৫।' },
      { q: 'momentum-এর মূল ধারণা কী?', a: { a: 'gradient-কে বর্গ করা', b: 'আগের ধাপগুলোর দিক জমিয়ে বেগ তৈরি', c: 'learning rate শূন্য করা' }, ok: 'b', why: 'ধারাবাহিক দিকে বেগ বাড়ে; উল্টো-পাল্টা দিক (zig-zag) একে অপরকে কাটে।' },
      { q: 'Adam কেন খাড়া ও সমতল দুই দিকেই কাজ করে?', a: { a: 'প্রতিটি parameter-এর ধাপকে তার gradient-এর গড় মাপ দিয়ে ভাগ করে', b: 'gradient উপেক্ষা করে', c: 'শুধু খাড়া দিক আপডেট করে' }, ok: 'a', why: '√ŝ দিয়ে ভাগ করলে বড় gradient-এর দিকে ধাপ ছোট, ছোট gradient-এর দিকে বড়—মোটামুটি সমান।' },
    ],
    recap: ['বাস্তবে mini-batch', 'momentum ও Adam খারাপ-আকৃতির loss-এ সাহায্য করে', 'তুলনা সমস্যা-নির্ভর'],
    nextNote: 'গভীর নেটওয়ার্ক স্থিতিশীল রাখার তিন কৌশল:',
    sources: [SRC.adam, SRC.d2l, ['Goh — Why Momentum Really Works (Distill, 2017)', 'https://distill.pub/2017/momentum/']],
  },
  {
    id: 'les-05-06-norm-residual-dropout',
    slug: 'normalization-residual-dropout',
    title: 'Normalization, Residual ও Dropout',
    minutes: 40,
    prereqs: ['les-05-05-optimizers'],
    summary: 'LayerNorm: প্রতি উদাহরণে গড় ০, variance ১, তারপর শেখা γ, β; residual: x + f(x) gradient-এর সরাসরি পথ; dropout: training-এ দৈবভাবে বন্ধ, ১/(১−p) দিয়ে স্কেল।',
    overview: p('গভীর নেটওয়ার্কে (এবং Transformer-এ, অধ্যায় ৮) তিনটি কৌশল প্রায় সবসময় থাকে। Layer normalization প্রতিটি উদাহরণের hidden vector-কে গড় ০ ও variance ১-এ আনে, যাতে স্তর থেকে স্তরে মাপ বিস্ফোরিত না হয়। Residual connection আউটপুট = x + f(x) লেখে, ফলে gradient-এর একটি সরাসরি পথ থাকে। Dropout training-এর সময় দৈবভাবে কিছু neuron বন্ধ করে overfitting কমায়। এই পাঠে তিনটিই ছোট কোডে হিসাব করব এবং প্রতিটির সীমা বুঝব।'),
    objectives: ['একটি vector-এ layer normalization হিসাব করতে পারবেন', 'residual connection কীভাবে gradient-কে সাহায্য করে তা সংখ্যায় দেখাতে পারবেন', 'dropout-এর training ও inference আচরণের পার্থক্য এবং স্কেলিং ব্যাখ্যা করতে পারবেন'],
    problem: p('২০ স্তরের একটি নেটওয়ার্কে প্রতিটি স্তর তার input-কে গড়ে ১.৩ গুণ করে। শেষ স্তরে মাপ ১.৩²⁰ ≈ ১৯০ গুণ। প্রতিটি স্তর ০.৭ গুণ করলে ০.৭²⁰ ≈ ০.০০০৮—সংকেত প্রায় হারিয়ে যায়, gradient-ও। গভীর নেটওয়ার্ক কীভাবে স্থিতিশীল রাখা যায়?'),
    explain:
      p(`${term('লেয়ার নরমালাইজেশন', 'layer normalization')}: একটি উদাহরণের hidden vector h-এর জন্য μ = গড়(h), σ² = গড়((h − μ)²); ĥ = (h − μ)/√(σ² + ε); আউটপুট = γ ⊙ ĥ + β। γ ও β শেখা parameter—মডেল চাইলে মাপ ফেরত আনতে পারে।`) +
      p(`${term('রেসিডুয়াল কানেকশন', 'residual connection')}: y = x + f(x)। backward-এ ∂y/∂x = ১ + f′(x)—f′ খুব ছোট হলেও ১ থাকে, তাই gradient গভীর স্তরে পৌঁছায়। Transformer-এর প্রতিটি block-এ এটি আছে।`) +
      p(`${term('ড্রপআউট', 'dropout')}: training-এ প্রতিটি neuron p সম্ভাবনায় ০ করা হয়; বাকিগুলো ১/(১ − p) দিয়ে গুণ, যাতে গড় মান অপরিবর্তিত থাকে (“inverted dropout”)। Inference-এ dropout বন্ধ—সব neuron সক্রিয়, কোনো স্কেলিং নেই।`) +
      table(['কৌশল', 'সমস্যা', 'সীমা'], [
        ['LayerNorm', 'স্তরের মাপ বিস্ফোরণ/সংকোচন', 'অতিরিক্ত হিসাব; ε না দিলে σ = ০-তে ভাগ'],
        ['Residual', 'গভীর নেটওয়ার্কে gradient হারানো', 'x ও f(x)-এর shape একই হতে হবে'],
        ['Dropout', 'overfitting', 'training ধীর; inference-এ বন্ধ করতে ভুললে ফল এলোমেলো'],
      ], 'তিন কৌশল'),
    analogy: {
      text: 'Residual হলো পাহাড়ি রাস্তার পাশে একটি সোজা সিঁড়ি: আঁকাবাঁকা রাস্তা (f) যতই জটিল হোক, সিঁড়ি দিয়ে সরাসরি নামা যায় (gradient-এর পথ)।',
      breaks: 'সিঁড়ি ও রাস্তা আলাদা পথ; residual-এ x ও f(x) যোগ হয়ে একটি মানই পরের স্তরে যায়—দুই পথ শেষে মিশে যায়।',
    },
    worked:
      p('LayerNorm, h = [২, ৪, ৬], γ = [১, ১, ১], β = [০, ০, ০], ε উপেক্ষা।') +
      ol([
        'μ = ৪; বিচ্যুতি [−২, ০, ২]; σ² = (৪ + ০ + ৪)/৩ = ৮/৩ ≈ ২.৬৬৭; σ ≈ ১.৬৩৩।',
        'ĥ ≈ [−১.২২৫, ০, ১.২২৫]।',
        'h = [২০, ৪০, ৬০] দিলেও ĥ একই—মাপ নিরপেক্ষ।',
      ]) +
      p('Dropout, p = ০.৫, h = [২, ৪, ৬, ৮], দৈব মাস্ক [১, ০, ১, ০] → [৪, ০, ১২, ০] (×২)। গড় মান প্রত্যাশায় একই থাকে।'),
    activity: note('কোডে LayerNorm, ২০ স্তরে residual বনাম সাধারণ chain-এর gradient, এবং ১০,০০০ বার dropout-এর গড় যাচাই।'),
    code: [
      {
        label: 'LayerNorm, residual gradient ও dropout গড়',
        starter: RNG + String.raw`
const r3 = (x) => Math.round(x * 1000) / 1000;
function layerNorm(h, gamma, beta, eps = 1e-5) {
  const mu = h.reduce((s, v) => s + v, 0) / h.length;
  const v = h.reduce((s, x) => s + (x - mu) ** 2, 0) / h.length;
  return h.map((x, i) => gamma[i] * (x - mu) / Math.sqrt(v + eps) + beta[i]);
}
console.log("LN [2,4,6]   :", layerNorm([2, 4, 6], [1, 1, 1], [0, 0, 0]).map(r3));
console.log("LN [20,40,60]:", layerNorm([20, 40, 60], [1, 1, 1], [0, 0, 0]).map(r3));
console.log("LN সব সমান  :", layerNorm([5, 5, 5], [1, 1, 1], [0, 0, 0]).map(r3), "← ε না থাকলে 0/0");

// 20 স্তর: প্রতিটির স্থানীয় derivative 0.7। chain বনাম residual (1 + 0.7)
let plain = 1, resid = 1;
for (let l = 0; l < 20; l++) { plain *= 0.7; resid *= 1 + 0.7; }
console.log("20 স্তরে gradient গুণক: সাধারণ", plain.toExponential(2), "| residual", resid.toExponential(2));
// বাস্তবে residual-এর f′ প্রায়ই ছোট ও ঋণাত্মকও হয়; মূল কথা: 1 পথটি কখনো শূন্য হয় না
let residSmall = 1; for (let l = 0; l < 20; l++) residSmall *= 1 - 0.05;
console.log("residual, f′ = −0.05:", r3(residSmall));

// inverted dropout: training-এ গড় অপরিবর্তিত থাকে কি না
function dropout(h, p, rand) { return h.map((x) => (rand() < p ? 0 : x / (1 - p))); }
const rand = makeRng(9), h = [2, 4, 6, 8];
const sum = [0, 0, 0, 0], N = 10000;
for (let n = 0; n < N; n++) dropout(h, 0.5, rand).forEach((v, i) => (sum[i] += v));
console.log("dropout গড় (10000 বার):", sum.map((s) => Math.round((s / N) * 10) / 10), " আসল:", h);
console.log("একটি নমুনা:", dropout(h, 0.5, rand));
`,
        expect: ['LN [2,4,6]   : [-1.225,0,1.225]', 'LN [20,40,60]: [-1.225,0,1.225]', 'LN সব সমান  : [0,0,0]', '20 স্তরে gradient গুণক: সাধারণ 7.98e-4'],
        hints: ['১০,০০০ বারের গড় আসল মানের কাছাকাছি—/ (1 − p) ছাড়া গড় কত হতো?', 'residual-এর গুণক 1.7²⁰ বিশাল—বাস্তবে LayerNorm ও ছোট f′ এটিকে নিয়ন্ত্রণে রাখে। শিক্ষণীয় অংশ: গুণক শূন্যের দিকে যায় না।', 'LN-এ gamma = [2,2,2], beta = [1,1,1] দিয়ে চালান।'],
        test: 'var a=layerNorm([2,4,6],[1,1,1],[0,0,0]); __close(a[2],1.2247,1e-3,"ln"); __close(a.reduce(function(s,v){return s+v;},0),0,1e-9,"ln mean0"); __assert(plain<1e-3,"vanish"); sum.forEach(function(s,i){ __close(s/N,h[i],0.25,"dropout mean "+i); });',
      },
    ],
    line: ul([
      '<code>layerNorm</code>: গড় ও variance একটি vector-এর ভেতরে—batch-এর অন্য উদাহরণের ওপর নির্ভর করে না (BatchNorm-এর সাথে পার্থক্য)।',
      '<code>eps</code>: সব মান সমান হলে variance ০; ε ভাগ-শূন্য রোধ করে।',
      '<code>plain *= 0.7</code>: chain rule-এ ২০টি স্থানীয় derivative-এর গুণফল।',
      '<code>x / (1 - p)</code>: inverted dropout-এর স্কেলিং; ১০,০০০ নমুনার গড়ে যাচাই।',
    ]),
    why: p('dropout-এর গড় সংখ্যাগতভাবে যাচাই করা হয়েছে (১০,০০০ seed-যুক্ত নমুনা), কারণ “প্রত্যাশিত মান অপরিবর্তিত” দাবিটি একটি নমুনা দেখে বোঝা যায় না। residual-এর উদাহরণ একমাত্রিক সরলীকরণ—বাস্তব নেটওয়ার্কে এগুলো matrix, কিন্তু “১ + …” পথের যুক্তি একই।'),
    remember: ['LayerNorm: প্রতি উদাহরণে গড় ০, variance ১, তারপর γ, β', 'residual: y = x + f(x), gradient-এর সরাসরি পথ', 'dropout: training-এ চালু, inference-এ বন্ধ', 'inverted dropout: ১/(১ − p) স্কেল'],
    skip: ['BatchNorm ও RMSNorm-এর বিস্তারিত', 'pre-norm বনাম post-norm (অধ্যায় ৮-এ সংক্ষেপে)'],
    experiment: p('dropout-এ p = ০.৯ দিন। ১০,০০০ বারের গড় কি এখনও আসলের কাছে? একটি নমুনা দেখতে কেমন? এত বেশি dropout কেন training কঠিন করে?'),
    mistakes: ['inference-এ dropout চালু রেখে দেওয়া', 'LayerNorm-এ ε বাদ দেওয়া', 'residual-এ shape না মিলিয়ে যোগ', 'dropout-এ স্কেলিং ভুলে যাওয়া'],
    quiz: [
      { q: 'LayerNorm-এর পর (γ = ১, β = ০) vector-এর গড় কত?', a: { a: '১', b: '০', c: 'আগের মতো' }, ok: 'b', why: 'গড় বাদ দেওয়া হয়, তাই নতুন গড় ০; variance প্রায় ১।' },
      { q: 'p = ০.২ dropout-এ টিকে যাওয়া neuron-কে কত দিয়ে গুণ করা হয়?', a: { a: '০.৮', b: '১.২৫', c: '৫' }, ok: 'b', why: '১/(১ − ০.২) = ১.২৫, যাতে প্রত্যাশিত মান একই থাকে।' },
      { q: 'residual connection gradient-কে কীভাবে সাহায্য করে?', a: { a: '∂y/∂x-এ সবসময় +১ পথ থাকে', b: 'gradient শূন্য করে', c: 'activation বাদ দেয়' }, ok: 'a', why: 'y = x + f(x) হলে ∂y/∂x = ১ + f′(x); f′ ছোট হলেও gradient হারায় না।' },
    ],
    recap: ['তিন কৌশল গভীর নেটওয়ার্কের স্থিতিশীলতার জন্য', 'প্রতিটির training ও inference আচরণ জানুন', 'Transformer-এ তিনটিই থাকে'],
    nextNote: 'সব একসাথে—প্রজেক্ট: ছোট নেটওয়ার্ক, সম্পূর্ণ ট্রেসসহ:',
    sources: [SRC.layernorm, SRC.resnet, SRC.dropout],
  },
  {
    id: 'les-05-07-project-tiny-network',
    slug: 'project-tiny-neural-network',
    title: 'প্রজেক্ট: ছোট Neural Network, সম্পূর্ণ ট্রেসসহ',
    minutes: 70,
    prereqs: ['les-05-06-norm-residual-dropout', 'les-04-02-train-val-test'],
    summary: 'সিন্থেটিক বৃত্ত-ডেটা; ২→৮→১ নেটওয়ার্ক; প্রথম ধাপের forward, gradient ও update মুদ্রণ; train/test accuracy; ASCII decision map; logistic regression-এর সাথে তুলনা।',
    overview: p('এই প্রজেক্টে একটি স্পষ্টভাবে সিন্থেটিক ডেটাসেট বানাব: বর্গক্ষেত্রে দৈব বিন্দু, বৃত্তের ভেতরে হলে ১, বাইরে ০—একটি বাঁকা সীমানা। তারপর ২→৮→১ নেটওয়ার্ক train করব এবং প্রথম training ধাপের প্রতিটি সংখ্যা (forward মান, loss, gradient, update-এর আগে-পরে weight) মুদ্রণ করব, যাতে আপনি প্রতিটি ধাপ অধ্যায় ৩–৫-এর সূত্রের সাথে মেলাতে পারেন। শেষে আলাদা test সেটে accuracy, logistic regression-এর সাথে তুলনা, এবং ASCII-তে শেখা সীমানার একটি মানচিত্র।'),
    objectives: ['একটি নেটওয়ার্কের এক training ধাপ সম্পূর্ণ ট্রেস করে হাতের হিসাবের সাথে মেলাতে পারবেন', 'held-out test সেটে neural network ও logistic regression তুলনা করতে পারবেন', 'শেখা সীমানা দৃশ্যমান করে মডেলের সীমা ব্যাখ্যা করতে পারবেন'],
    problem: p('logistic regression রৈখিক সীমানা টানে। বৃত্তাকার সীমানার ডেটায় সে কতটা পারবে? একটি ছোট নেটওয়ার্ক কি পারবে—এবং আপনি কি প্রমাণ করতে পারবেন যে নেটওয়ার্কের ভেতরে ঠিক সেই হিসাবগুলোই হচ্ছে যা শিখেছেন?'),
    explain:
      p('<strong>ডেটা (সিন্থেটিক):</strong> x, y ∈ [−১, ১] দৈব; লেবেল = ১ যদি x² + y² < ০.৫ (বৃত্তের ক্ষেত্রফল ≈ π × ০.৫ ≈ ১.৫৭, বর্গক্ষেত্র ৪, তাই প্রায় ৩৯% বিন্দু ভেতরে)। seed-যুক্ত, ১৬০টি train, ৮০টি test।') +
      p('<strong>মডেল:</strong> ২→৮→১, tanh hidden, sigmoid output, binary cross-entropy, full-batch gradient descent, η = ০.৫, ৮০০ epoch। weight দৈব [−১, ১]।') +
      p('<strong>তুলনার ভিত্তি:</strong> একই ডেটায় logistic regression (hidden নেই)। “সবসময় ০” মডেলের accuracy-ও লিখব (এই seed-এর test সেটে ০.৫৯)—যেকোনো মডেলকে এটি অবশ্যই ছাড়াতে হবে।') +
      p('<strong>ট্রেস:</strong> প্রথম ধাপে প্রথম উদাহরণের জন্য z₁, h, ŷ, loss, δ₂, δ₁ এবং পুরো batch-এর গড় gradient দিয়ে W₂[০]-এর আপডেট আগে-পরে।') +
      warn('ফলটি একটি নির্দিষ্ট seed ও সিন্থেটিক ডেটার। এটি দেখায় নেটওয়ার্ক বাঁকা সীমানা শিখতে <em>পারে</em>; কোনো বাস্তব সমস্যায় কার্যকারিতা প্রমাণ করে না।'),
    analogy: {
      text: 'ট্রেস হলো রান্নার প্রতিটি ধাপে স্বাদ নেওয়া: শেষ খাবার খারাপ হলে কোন ধাপে লবণ বেশি পড়েছে বোঝা যায়।',
      breaks: 'রান্নায় ধাপ কয়েকটি; নেটওয়ার্কে হাজার ধাপ, সব ট্রেস করা অসম্ভব। তাই প্রথম ধাপ ও কয়েকটি সারাংশ-সংখ্যা (loss বক্ররেখা, accuracy) দেখা হয়।',
    },
    worked:
      p('ASCII decision map পড়ার নিয়ম: ২১×১১ গ্রিড, প্রতিটি ঘরে মডেলের p। “#” মানে p ≥ ০.৫ (ভেতরে), “.” মানে বাইরে। সঠিক মডেলে মাঝে একটি মোটামুটি গোলাকার “#” দাগ দেখা উচিত। x-অক্ষে ঘর বেশি কারণ টেক্সট অক্ষর লম্বাটে।'),
    activity: p('<strong>প্রজেক্ট মানদণ্ড:</strong> (১) প্রথম ধাপের ট্রেসের δ₂ = ŷ − y হাতে মেলান, (২) neural network, logistic regression ও “সব ০”-এর test accuracy টেবিল, (৩) decision map-এ কোথায় ভুল হচ্ছে চিহ্নিত করুন, (৪) hidden = ২ দিয়ে আবার চালিয়ে পার্থক্য লিখুন।'),
    code: [
      {
        label: 'প্রজেক্ট: বৃত্ত-classifier, ট্রেস ও decision map',
        starter: RNG + String.raw`
const rand = makeRng(77);
const gen = (n) => Array.from({ length: n }, () => { const x = [rand() * 2 - 1, rand() * 2 - 1]; return { x, y: x[0] ** 2 + x[1] ** 2 < 0.5 ? 1 : 0 }; });
const train = gen(160), test = gen(80);
const sigmoid = (z) => 1 / (1 + Math.exp(-z));
const r3 = (v) => Math.round(v * 1000) / 1000;

function makeNet(H, seed) {
  const r = makeRng(seed), u = () => r() * 2 - 1;
  return { H, W1: Array.from({ length: H }, () => [u(), u()]), b1: new Array(H).fill(0), W2: Array.from({ length: H }, u), b2: 0 };
}
function forward(net, x) {
  const z1 = net.W1.map((w, j) => w[0] * x[0] + w[1] * x[1] + net.b1[j]);
  const h = z1.map(Math.tanh);
  const yhat = sigmoid(h.reduce((s, v, j) => s + v * net.W2[j], 0) + net.b2);
  return { z1, h, yhat };
}
function step(net, data, lr, trace = false) {
  const H = net.H, gW1 = net.W1.map(() => [0, 0]), gb1 = new Array(H).fill(0), gW2 = new Array(H).fill(0); let gb2 = 0, L = 0;
  data.forEach((d, n) => {
    const { z1, h, yhat } = forward(net, d.x);
    L += -(d.y * Math.log(yhat) + (1 - d.y) * Math.log(1 - yhat)) / data.length;
    const d2 = yhat - d.y;
    const d1 = h.map((hj, j) => d2 * net.W2[j] * (1 - hj * hj));
    if (trace && n === 0) {
      console.log("ট্রেস · উদাহরণ ০: x =", d.x.map(r3), "y =", d.y);
      console.log("  z1[0..2] =", z1.slice(0, 3).map(r3), " h[0..2] =", h.slice(0, 3).map(r3));
      console.log("  ŷ =", r3(yhat), " loss =", r3(-(d.y * Math.log(yhat) + (1 - d.y) * Math.log(1 - yhat))), " δ2 = ŷ − y =", r3(d2));
      console.log("  δ1[0..2] =", d1.slice(0, 3).map(r3));
    }
    gb2 += d2 / data.length;
    for (let j = 0; j < H; j++) { gW2[j] += d2 * h[j] / data.length; gb1[j] += d1[j] / data.length; gW1[j][0] += d1[j] * d.x[0] / data.length; gW1[j][1] += d1[j] * d.x[1] / data.length; }
  });
  const before = net.W2[0];
  for (let j = 0; j < H; j++) { net.W2[j] -= lr * gW2[j]; net.b1[j] -= lr * gb1[j]; net.W1[j][0] -= lr * gW1[j][0]; net.W1[j][1] -= lr * gW1[j][1]; }
  net.b2 -= lr * gb2;
  if (trace) console.log("  update: W2[0]", r3(before), "− " + lr + " ×", r3(gW2[0]), "=", r3(net.W2[0]), "| batch loss", r3(L));
  return L;
}
const accuracy = (f, data) => data.filter((d) => (f(d.x) >= 0.5 ? 1 : 0) === d.y).length / data.length;

// ---- neural network ----
const net = makeNet(8, 1);
const losses = [step(net, train, 0.5, true)];
for (let e = 1; e < 800; e++) losses.push(step(net, train, 0.5));
console.log("loss: epoch 0 =", r3(losses[0]), "| 100 =", r3(losses[100]), "| 799 =", r3(losses[799]));

// ---- logistic regression (hidden নেই) ----
let w = [0, 0], b = 0;
for (let e = 0; e < 800; e++) {
  let g = [0, 0], gb = 0;
  for (const d of train) { const p = sigmoid(w[0] * d.x[0] + w[1] * d.x[1] + b); g[0] += (p - d.y) * d.x[0] / train.length; g[1] += (p - d.y) * d.x[1] / train.length; gb += (p - d.y) / train.length; }
  w = [w[0] - 0.5 * g[0], w[1] - 0.5 * g[1]]; b -= 0.5 * gb;
}
const nnF = (x) => forward(net, x).yhat, lrF = (x) => sigmoid(w[0] * x[0] + w[1] * x[1] + b);
const res = { nnTrain: accuracy(nnF, train), nnTest: accuracy(nnF, test), lrTest: accuracy(lrF, test), zeroTest: accuracy(() => 0, test) };
console.log("test accuracy → neural net:", r3(res.nnTest), "| logistic:", r3(res.lrTest), "| সব 0:", r3(res.zeroTest), "| (nn train:", r3(res.nnTrain) + ")");

// ---- ASCII decision map ----
for (let i = 0; i <= 10; i++) {
  const yy = 1 - i * 0.2; let row = "";
  for (let k = 0; k <= 20; k++) row += nnF([-1 + k * 0.1, yy]) >= 0.5 ? "#" : ".";
  console.log(row);
}
`,
        expect: ['ট্রেস · উদাহরণ ০:', 'δ2 = ŷ − y =', 'update: W2[0]', 'test accuracy → neural net:'],
        hints: ['ট্রেসের ŷ ও y দেখে δ2 হাতে বিয়োগ করুন—মিলছে?', 'update লাইন: পুরনো W2[0] − 0.5 × gradient = নতুন। ক্যালকুলেটরে যাচাই করুন।', 'makeNet(8, 1)-কে makeNet(2, 1) করুন: decision map কেমন দেখায়? দুটি tanh neuron দিয়ে বৃত্ত আঁকা কঠিন কেন?', 'logistic regression “সব 0”-এর চেয়েও খারাপ কেন? একটি সরলরেখা বৃত্তের একপাশকে “ভেতর” বলে দেয়—ঐ পাশের বাইরের বিন্দুগুলো সব ভুল হয়।'],
        test: '__assert(res.nnTest>0.85,"nn learns circle"); __assert(res.nnTest>res.lrTest+0.15,"nn beats logistic"); __assert(res.lrTest<res.zeroTest,"logistic below zero baseline (quoted)"); __close(res.zeroTest,0.5875,1e-9,"zero baseline quoted"); __assert(losses[799]<losses[0],"loss decreased"); var cnt=train.filter(function(d){return d.y===1;}).length; __assert(cnt>40&&cnt<85,"class balance plausible");',
      },
    ],
    line: ul([
      '<code>gen(n)</code>: seed ৭৭ দিয়ে বিন্দু; লেবেল নিয়ম জানা—এটি সিন্থেটিক ডেটার সুবিধা।',
      '<code>step(..., trace)</code>: একই ফাংশন training ও ট্রেস দুই কাজে—ট্রেস করা সংখ্যাগুলোই আসল আপডেটে ব্যবহৃত হয়।',
      '<code>before</code> ও <code>net.W2[0]</code>: update-এর আগে-পরে—অধ্যায় ৩-এর w ← w − η g।',
      '<code>accuracy(() => 0, test)</code>: “সবসময় বাইরে” baseline।',
      'decision map: প্রতিটি ঘরে forward চালিয়ে p ≥ ০.৫ হলে #।',
    ]),
    why: p('ট্রেসটি training কোডের ভেতর থেকে মুদ্রণ করা হয়েছে, আলাদা হিসাব নয়—তাই যা দেখছেন তা-ই মডেল ব্যবহার করছে। baseline (“সব ০” ও logistic regression) ছাড়া neural network-এর accuracy অর্থহীন; ৮৫% শুনতে ভালো, কিন্তু baseline ৮৪% হলে কিছুই শেখা হয়নি।'),
    remember: ['প্রথম ধাপের ট্রেস দিয়ে কোড যাচাই', 'সবসময় baseline-এর সাথে তুলনা', 'held-out test-এ মূল্যায়ন', 'decision map মডেলের সীমা দেখায়'],
    skip: ['mini-batch সংস্করণ', 'validation দিয়ে early stopping'],
    experiment: p('noise যোগ করুন: gen-এ ১০% বিন্দুর লেবেল দৈবভাবে উল্টে দিন (rand() < ০.১ হলে 1 − y)। hidden = ৮ ও ৩২ দিয়ে train ও test accuracy তুলনা করুন। কোনটি overfit করে? অধ্যায় ৪-এর শিক্ষার সাথে মেলান।'),
    mistakes: ['baseline ছাড়া accuracy রিপোর্ট', 'train accuracy-কে test হিসেবে দেখানো', 'ট্রেস আলাদা কোডে হিসাব করা (আসল কোডের বাগ লুকিয়ে যায়)', 'একটি seed-এর ফলকে সাধারণ সত্য বলা'],
    solutionNote: p('প্রত্যাশিত পর্যবেক্ষণ (seed ৭৭ ও ১, QuickJS-এ চালানো): neural network-এর test accuracy প্রায় ১ (৮০টির প্রায় সব); logistic regression ০.৪৪—“সব ০”-এর ০.৫৯-এর চেয়েও কম, কারণ কোনো সরলরেখা বৃত্তের ভেতর-বাইরে আলাদা করতে পারে না। ৮০টি test বিন্দুতে প্রায় ১০০% মানে সব ক্ষেত্রে নিখুঁত নয়—সীমানার খুব কাছের বিন্দু test-এ কম পড়েছে। decision map-এ মাঝে মোটামুটি গোলাকার # অঞ্চল; সীমানার কাছে কয়েকটি ঘর ভুল হওয়া স্বাভাবিক, কারণ ১৬০টি বিন্দুতে সীমানার কাছে উদাহরণ কম।'),
    quiz: [
      { q: 'test সেটে “সব ০” মডেলের accuracy ৬১%। আপনার মডেল ৬৩%। সবচেয়ে সৎ মন্তব্য?', a: { a: 'মডেল ভালো কাজ করছে', b: 'মডেল baseline-এর চেয়ে সামান্যই ভালো—প্রায় কিছুই শেখেনি', c: 'test সেট ভুল' }, ok: 'b', why: 'accuracy-কে baseline-এর সাথে তুলনা না করলে অর্থ বোঝা যায় না।' },
      { q: 'বৃত্তাকার সীমানায় logistic regression কেন ব্যর্থ?', a: { a: 'learning rate কম', b: 'তার সীমানা সবসময় একটি সরলরেখা', c: 'ডেটা কম' }, ok: 'b', why: 'w · x + b = ০ একটি রেখা; বৃত্তের ভেতরকে বাইরে থেকে কোনো একক রেখা আলাদা করতে পারে না।' },
      { q: 'ট্রেস training কোডের ভেতর থেকে মুদ্রণ কেন?', a: { a: 'দ্রুততার জন্য', b: 'যাতে মুদ্রিত সংখ্যাই আসল আপডেটে ব্যবহৃত হয়—আলাদা কোডে বাগ লুকাতে পারে', c: 'দরকার নেই' }, ok: 'b', why: 'আলাদা হিসাব সঠিক হলেও training কোড ভুল থাকতে পারে; একই কোড ট্রেস করলে সেটি ধরা পড়ে।' },
    ],
    recap: ['একটি সম্পূর্ণ, ট্রেসযোগ্য neural network বানালেন', 'baseline ও held-out test দিয়ে সৎ তুলনা', 'বাঁকা সীমানা—hidden layer-এর শক্তি'],
    nextNote: 'নেটওয়ার্ক সংখ্যা বোঝে। টেক্সট কীভাবে সংখ্যা হয়? tokenization ও language modeling:',
    synthetic: true,
    sources: [SRC.d2l, SRC.backprop, ['TensorFlow Playground (ইন্টারঅ্যাকটিভ, একই ধরনের সিন্থেটিক ডেটা)', 'https://playground.tensorflow.org/']],
  },
];

export default { chapter, lessons };

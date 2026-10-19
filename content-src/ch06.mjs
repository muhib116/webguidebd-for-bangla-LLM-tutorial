import { p, ul, ol, code, out, note, warn, table, term, SRC } from './lib.mjs';

const chapter = {
  id: 'ch-06-tokens-language-models',
  slug: 'token-language-model',
  title: 'Tokenization ও Language Modeling',
  order: 6,
  public: false,
  summary: 'Unicode ও বাংলা অক্ষর; word, character ও subword token; BPE; vocabulary ও অজানা token; next-token prediction; bigram ও n-gram মডেল; smoothing; cross-entropy ও perplexity।',
  overview: p(
    'Neural network সংখ্যা নিয়ে কাজ করে; ভাষা মডেলকে আগে টেক্সটকে সংখ্যার ক্রমে (token ID) ভাঙতে হয়। এই অধ্যায়ে দেখব বাংলা টেক্সট কম্পিউটারে কীভাবে থাকে (Unicode code point, UTF-8 byte, যুক্তাক্ষর), শব্দ ও অক্ষর-ভিত্তিক tokenizer-এর সমস্যা, এবং Byte Pair Encoding (BPE) কীভাবে মাঝামাঝি subword একক শেখে। তারপর language modeling-এর মূল কাজ—পরের token-এর সম্ভাব্যতা—গণনা দিয়ে শিখব: bigram, smoothing, এবং held-out ডেটায় cross-entropy ও perplexity দিয়ে মূল্যায়ন।',
    'প্রজেক্ট: বাংলা ও ইংরেজির জন্য একটি সীমিত tokenizer এবং n-gram next-token predictor, মূল্যায়ন ও সীমাবদ্ধতার সৎ বিবরণসহ।'
  ),
};

const lessons = [
  {
    id: 'les-06-01-text-unicode',
    slug: 'text-unicode-bangla',
    title: 'টেক্সট থেকে সংখ্যা: Unicode ও বাংলা অক্ষর',
    minutes: 35,
    prereqs: ['les-05-07-project-tiny-network', 'les-02-01-values-types'],
    summary: 'code point, UTF-8 byte ও দৃশ্যমান অক্ষর (grapheme) আলাদা; বাংলা কার ও হসন্ত; কেন byte-ভিত্তিক মডেলে বাংলা বেশি token নেয়।',
    overview: p('কম্পিউটারে প্রতিটি অক্ষর একটি সংখ্যা—Unicode code point (যেমন “ক” = U+0995)। কিন্তু চোখে যা একটি অক্ষর, তা প্রায়ই একাধিক code point: “কি” = ক + ি-কার, “ক্ষ” = ক + হসন্ত + ষ। আর ফাইলে বা নেটওয়ার্কে প্রতিটি বাংলা code point UTF-8-এ ৩টি byte নেয়, ইংরেজি অক্ষর ১টি। এই পাঠে একই শব্দের তিন মাপ—দৃশ্যমান অক্ষর, code point ও byte—কোডে গুনব, এবং দেখব কেন এটি tokenization, মডেলের খরচ ও প্রসঙ্গ-দৈর্ঘ্যে প্রভাব ফেলে।'),
    objectives: ['code point, UTF-8 byte ও দৃশ্যমান অক্ষরের পার্থক্য বলতে পারবেন', 'বাংলা শব্দের code point কোডে দেখে কার ও হসন্ত চিনতে পারবেন', 'কেন byte-ভিত্তিক tokenizer-এ বাংলা ইংরেজির চেয়ে বেশি একক নেয় তা ব্যাখ্যা করতে পারবেন'],
    problem: p('JavaScript-এ <code>"কিছু".length</code> লিখলে আসে ৪, অথচ চোখে দুটি অক্ষর: “কি” ও “ছু”। একটি চ্যাটবট “প্রথম ২টি অক্ষর” কাটতে গিয়ে “কি” পেল—ঠিক আছে; কিন্তু “ক্ষমা” থেকে প্রথম ২টি কাটলে পেল “ক্” —একটি ভাঙা অক্ষর। টেক্সটকে টুকরো করার আগে জানতে হবে “একটি অক্ষর” আসলে কী।'),
    explain:
      table(['মাপ', 'সংজ্ঞা', '“কিছু”', '“ক্ষমা”', '“shop”'], [
        ['দৃশ্যমান অক্ষর (grapheme cluster)', 'পাঠক যা একটি একক হিসেবে দেখে', '২ (কি, ছু)', '২ (ক্ষ, মা)', '৪'],
        ['Code point', 'Unicode-এর একেকটি সংখ্যা', '৪', '৫', '৪'],
        ['UTF-8 byte', 'সংরক্ষণ/প্রেরণের একক', '১২', '১৫', '৪'],
      ], 'একই টেক্সটের তিন মাপ') +
      p(`${term('কোড পয়েন্ট', 'code point')}: Unicode প্রতিটি চিহ্নকে একটি সংখ্যা দেয়। বাংলা ব্লক U+0980 থেকে U+09FF। “ি” (U+09BF) একটি <em>নির্ভরশীল স্বরচিহ্ন</em>—একা দাঁড়ায় না, আগের ব্যঞ্জনের সাথে মেলে। “্” (U+09CD, হসন্ত/virama) দুই ব্যঞ্জন জুড়ে যুক্তাক্ষর বানায়।`) +
      p(`${term('UTF-8', 'UTF-8')}: code point-কে ১–৪ byte-এ লেখে। U+0000–U+007F (ইংরেজি) = ১ byte; U+0800–U+FFFF (বাংলাসহ) = ৩ byte।`) +
      p('<strong>কেন গুরুত্বপূর্ণ:</strong> অনেক আধুনিক tokenizer byte বা code point থেকে শুরু করে। যে ভাষার উদাহরণ training-এ কম, তার জন্য কম merge শেখা হয়, তাই একই অর্থের বাংলা বাক্য প্রায়ই ইংরেজির চেয়ে অনেক বেশি token নেয়—ফলে খরচ বেশি এবং প্রসঙ্গ-জানালায় কম টেক্সট ধরে। (নির্দিষ্ট মডেলের অনুপাত সেই মডেলের tokenizer দিয়ে মেপে দেখতে হয়।)') +
      warn('এই পাঠের grapheme-ভাঙার ফাংশন একটি <strong>সরলীকৃত নিয়ম</strong> (ব্যঞ্জন + চিহ্ন + হসন্ত-যুক্ত ব্যঞ্জন)। পূর্ণাঙ্গ নিয়ম Unicode-এর UAX #29-এ; ব্রাউজারে <code>Intl.Segmenter</code> আছে, কিন্তু এই runner-এ (QuickJS) নেই। ZWJ/ZWNJ, “র‍্যা”-এর মতো রূপ ইত্যাদি এই ফাংশন সঠিকভাবে সামলায় না।'),
    analogy: {
      text: 'code point হলো লেগোর আলাদা টুকরো, দৃশ্যমান অক্ষর হলো জোড়া লাগানো খেলনা, আর byte হলো বাক্সে প্যাক করার পর ওজন।',
      breaks: 'লেগো যেকোনো ক্রমে জোড়া যায়; Unicode-এর জোড়ার কঠোর নিয়ম আছে (কার আগে ব্যঞ্জন লাগবে)। ভুল ক্রমে রাখলে ভাঙা বা ভুল অক্ষর দেখায়।',
    },
    worked:
      p('“ক্ষমা”-এর code point: ক (U+0995), ্ (U+09CD), ষ (U+09B7), ম (U+09AE), া (U+09BE)।') +
      ol([
        'ক-এর পরে হসন্ত, তারপর ষ → একটি যুক্তাক্ষর “ক্ষ”।',
        'ম-এর পরে া-কার → “মা”।',
        'মোট ২টি দৃশ্যমান অক্ষর, ৫টি code point, ৫ × ৩ = ১৫ byte।',
        'প্রথম ২টি code point কাটলে “ক্” —অর্থহীন।',
      ]),
    activity: note('কোডে code point তালিকা, UTF-8 byte গণনা (নিজে লেখা, কারণ runner-এ TextEncoder নেই), এবং একটি সরলীকৃত বাংলা grapheme-ভাঙা ফাংশন।'),
    code: [
      {
        label: 'code point, byte ও দৃশ্যমান অক্ষর',
        starter: String.raw`const hex = (c) => "U+" + c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
const utf8Bytes = (s) => Array.from(s).reduce((n, ch) => {
  const cp = ch.codePointAt(0);
  return n + (cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4);
}, 0);

// সরলীকৃত বাংলা grapheme: চিহ্ন (\p{M}) আগের অক্ষরে যুক্ত; হসন্ত (U+09CD)-এর পরের ব্যঞ্জনও যুক্ত
function graphemes(s) {
  const out = [];
  for (const ch of Array.from(s)) {
    const last = out.length ? out[out.length - 1] : "";
    if (out.length && (/\p{M}/u.test(ch) || last.endsWith("\u09CD"))) out[out.length - 1] += ch;
    else out.push(ch);
  }
  return out;
}

for (const w of ["কিছু", "ক্ষমা", "shop", "দাম ৳৪৫০"]) {
  console.log(w, "| দৃশ্যমান:", graphemes(w).length, JSON.stringify(graphemes(w)), "| code point:", Array.from(w).length, "| byte:", utf8Bytes(w));
}
console.log("ক্ষমা →", Array.from("ক্ষমা").map(hex).join(" "));
console.log("ভুল কাটা:", Array.from("ক্ষমা").slice(0, 2).join(""), " ঠিক কাটা:", graphemes("ক্ষমা").slice(0, 1).join(""));
`,
        expect: ['কিছু | দৃশ্যমান: 2 ["কি","ছু"] | code point: 4 | byte: 12', 'ক্ষমা | দৃশ্যমান: 2 ["ক্ষ","মা"] | code point: 5 | byte: 15', 'shop | দৃশ্যমান: 4', 'ক্ষমা → U+0995 U+09CD U+09B7 U+09AE U+09BE'],
        hints: ['“দাম ৳৪৫০”-এ স্পেস ও ৳ চিহ্নও গোনা হয়েছে। ৳ (U+09F3) কত byte?', '/\\p{M}/u মানে Unicode-এর “Mark” শ্রেণির যেকোনো চিহ্ন—কার, চন্দ্রবিন্দু ইত্যাদি।', '“স্ত্রী” শব্দে দুটি হসন্ত। graphemes কী দেয়? আপনার চোখের সাথে মেলে?'],
        test: '__assert(graphemes("কিছু").length===2,"g1"); __assert(utf8Bytes("ক")===3,"bn 3 bytes"); __assert(utf8Bytes("a")===1,"en 1 byte"); __assert(graphemes("স্ত্রী").length===1,"stri one cluster");',
      },
    ],
    line: ul([
      '<code>Array.from(s)</code>: code point অনুযায়ী ভাঙে (<code>s.length</code> UTF-16 একক গোনে—বাংলায় একই, কিন্তু emoji-তে ভিন্ন)।',
      '<code>utf8Bytes</code>: UTF-8-এর সীমা অনুযায়ী প্রতিটি code point-এর byte।',
      '<code>/\\p{M}/u</code>: চিহ্ন হলে আগের অক্ষরে যুক্ত করি।',
      '<code>last.endsWith("\\u09CD")</code>: আগের অক্ষর হসন্তে শেষ হলে পরের ব্যঞ্জন যুক্তাক্ষরের অংশ।',
    ]),
    why: p('graphemes ফাংশন ইচ্ছাকৃতভাবে ছোট রাখা হয়েছে যাতে নিয়মটি পড়া যায়, এবং এর সীমা সতর্কবার্তায় স্পষ্ট করা হয়েছে। বাস্তব প্রয়োগে ব্রাউজারের Intl.Segmenter বা পরীক্ষিত লাইব্রেরি ব্যবহার করুন।'),
    remember: ['দৃশ্যমান অক্ষর ≠ code point ≠ byte', 'বাংলা code point = ৩ UTF-8 byte', 'কার ও হসন্ত আগের ব্যঞ্জনের সাথে যুক্ত', 'টেক্সট কাটার আগে grapheme সীমা জানুন'],
    skip: ['Unicode normalization (NFC/NFD)-এর বিস্তারিত', 'UTF-16 surrogate pair'],
    experiment: p('“র‍্যাব” লিখুন (র + ZWJ + ্ + য + া + ব)। Array.from দিয়ে code point দেখুন—ZWJ (U+200D) কোথায়? graphemes কী দেয়? কোথায় ভুল করে?'),
    mistakes: ['s.length-কে অক্ষর সংখ্যা ধরা', 'code point দিয়ে কেটে যুক্তাক্ষর ভাঙা', 'byte সংখ্যা অক্ষর সংখ্যার সমান ধরা', 'সরলীকৃত segmentation-কে সম্পূর্ণ ধরে নেওয়া'],
    quiz: [
      { q: '“মা” শব্দে কয়টি code point?', a: { a: '১', b: '২', c: '৩' }, ok: 'b', why: 'ম (U+09AE) ও া-কার (U+09BE)। চোখে একটি অক্ষর।' },
      { q: '“ঢাকা” (ঢ, া, ক, া) UTF-8-এ কত byte?', a: { a: '৪', b: '৮', c: '১২' }, ok: 'c', why: '৪টি বাংলা code point × ৩ byte = ১২।' },
      { q: 'byte-ভিত্তিক tokenizer-এ বাংলা প্রায়ই বেশি token নেয় কেন?', a: { a: 'বাংলা শব্দ লম্বা', b: 'প্রতিটি code point ৩ byte এবং training-এ বাংলার merge কম শেখা হয়', c: 'বাংলায় স্পেস নেই' }, ok: 'b', why: 'শুরুর একক বেশি, আর কম ডেটার ভাষায় কম জোড়া একক শেখা হয়—দুটো মিলে বেশি token।' },
    ],
    recap: ['টেক্সটের তিন মাপ', 'বাংলায় কার/হসন্ত যুক্ত হয়', 'tokenization-এর আগে Unicode বোঝা জরুরি'],
    nextNote: 'এবার টেক্সটকে token-এ ভাঙার প্রথম দুই পদ্ধতি:',
    sources: [SRC.unicodeBengali, SRC.mdnString, SRC.mdnSegmenter, ['Unicode UAX #29 — Text Segmentation', 'https://www.unicode.org/reports/tr29/']],
  },
  {
    id: 'les-06-02-word-char-tokens',
    synthetic: true,
    slug: 'word-character-tokens',
    title: 'Word ও Character Token, Vocabulary',
    minutes: 35,
    prereqs: ['les-06-01-text-unicode'],
    summary: 'tokenize → ID → decode; বিশেষ token (&lt;unk&gt;, &lt;bos&gt;, &lt;eos&gt;); শব্দ-tokenizer-এ অজানা শব্দ; অক্ষর-tokenizer-এ লম্বা ক্রম; trade-off।',
    overview: p('Tokenizer তিনটি কাজ করে: টেক্সটকে token-এ ভাঙা, প্রতিটি token-কে vocabulary-র একটি ID-তে রূপান্তর, এবং ID থেকে টেক্সট ফেরত আনা (decode)। এই পাঠে দুটি সরল tokenizer বানাব—শব্দ-ভিত্তিক ও অক্ষর-ভিত্তিক—এবং training বাক্য থেকে vocabulary তৈরি করে নতুন বাক্যে মাপব: কত শতাংশ token অজানা (&lt;unk&gt;), আর ক্রম কত লম্বা। দুটির দুর্বলতাই পরের পাঠে BPE-র প্রেরণা।'),
    objectives: ['training টেক্সট থেকে vocabulary ও token ID বানাতে পারবেন', 'বিশেষ token-এর ভূমিকা ব্যাখ্যা করতে পারবেন', 'শব্দ ও অক্ষর tokenizer-এর অজানা-হার ও ক্রম-দৈর্ঘ্য তুলনা করতে পারবেন'],
    problem: p('training-এ “ডেলিভারি”, “চার্জ”, “কত” শব্দ আছে। গ্রাহক লিখলেন “ডেলিভারিতে চার্জ কতো?”। শব্দ-tokenizer “ডেলিভারিতে” ও “কতো” চেনে না—দুটোই &lt;unk&gt;, অর্থাৎ মডেল কিছুই দেখে না। অক্ষর-tokenizer সব চেনে, কিন্তু একটি বাক্য ৩০+ token—মডেলকে অনেক দূরের সম্পর্ক শিখতে হয়। মাঝামাঝি কিছু আছে?'),
    explain:
      p(`${term('টোকেন', 'token')}: মডেলের ইনপুটের একক। ${term('ভোকাবুলারি', 'vocabulary')}: সব পরিচিত token ও তাদের ID।`) +
      table(['বিশেষ token', 'অর্থ', 'কেন'], [
        ['&lt;unk&gt;', 'অজানা', 'vocabulary-তে নেই এমন token-এর জন্য একটি সাধারণ ID'],
        ['&lt;bos&gt;', 'ক্রমের শুরু', 'মডেল জানে বাক্য শুরু হচ্ছে—প্রথম শব্দের সম্ভাব্যতা শিখতে'],
        ['&lt;eos&gt;', 'ক্রমের শেষ', 'generation কখন থামবে'],
        ['&lt;pad&gt;', 'ফাঁকা পূরণ', 'batch-এ সব ক্রম সমান দৈর্ঘ্য করতে'],
      ], 'প্রচলিত বিশেষ token') +
      table(['', 'Word tokenizer', 'Character tokenizer'], [
        ['vocabulary', 'বড় (প্রতিটি রূপ আলাদা)', 'ছোট (শ খানেক)'],
        ['অজানা token', 'অনেক (নতুন রূপ, বানান-ভেদ)', 'প্রায় নেই'],
        ['ক্রম দৈর্ঘ্য', 'ছোট', 'অনেক লম্বা'],
        ['বাংলায় সমস্যা', 'বিভক্তি (-তে, -র, -গুলো) প্রতিটি নতুন শব্দ', 'কার/হসন্ত আলাদা token হলে অর্থহীন একক'],
      ], 'দুই tokenizer-এর trade-off'),
    analogy: {
      text: 'শব্দ-tokenizer হলো এমন অভিধান যেখানে “খাই”, “খাচ্ছি”, “খেয়েছি” আলাদা ভুক্তি; না থাকলে “অজানা”। অক্ষর-tokenizer হলো শুধু বর্ণমালা—সব লেখা যায়, কিন্তু প্রতিটি শব্দ বানান করে পড়তে হয়।',
      breaks: 'মানুষ অভিধানে না থাকা শব্দও মূল ধরে বোঝে; শব্দ-tokenizer “ডেলিভারিতে”-কে “ডেলিভারি”-র সাথে কোনোভাবেই যুক্ত করে না—সম্পূর্ণ অজানা।',
    },
    worked:
      p('training: “ডেলিভারি চার্জ কত”, “চার্জ কত টাকা”। শব্দ vocabulary: &lt;unk&gt;=০, &lt;bos&gt;=১, &lt;eos&gt;=২, ডেলিভারি=৩, চার্জ=৪, কত=৫, টাকা=৬।') +
      ol([
        'নতুন বাক্য “ডেলিভারিতে চার্জ কত” → [১, ০, ৪, ৫, ২]।',
        '৩টি আসল token-এর ১টি অজানা → অজানা-হার ৩৩%।',
        'decode: “&lt;bos&gt; &lt;unk&gt; চার্জ কত &lt;eos&gt;” —তথ্য হারিয়েছে।',
      ]),
    activity: note('কোডে একটি সাধারণ Tokenizer “class”, শব্দ ও অক্ষর মোডে; training ও নতুন বাক্যে অজানা-হার ও গড় দৈর্ঘ্য।'),
    code: [
      {
        label: 'শব্দ বনাম অক্ষর tokenizer',
        starter: String.raw`function graphemes(s) {
  const out = [];
  for (const ch of Array.from(s)) {
    const last = out.length ? out[out.length - 1] : "";
    if (out.length && (/\p{M}/u.test(ch) || last.endsWith("\u09CD"))) out[out.length - 1] += ch; else out.push(ch);
  }
  return out;
}
const splitWords = (s) => s.toLowerCase().replace(/[?!,।.]/g, " ").split(/\s+/).filter(Boolean);
const splitChars = (s) => graphemes(s.toLowerCase().replace(/[?!,।.]/g, "").replace(/\s+/g, "_"));

function makeTokenizer(split, trainTexts) {
  const vocab = ["<unk>", "<bos>", "<eos>"];
  const id = new Map(vocab.map((t, i) => [t, i]));
  for (const t of trainTexts.flatMap(split)) if (!id.has(t)) { id.set(t, vocab.length); vocab.push(t); }
  return {
    size: vocab.length,
    encode: (s) => [1, ...split(s).map((t) => id.get(t) ?? 0), 2],
    decode: (ids) => ids.map((i) => vocab[i]).join(" "),
  };
}

const train = ["ডেলিভারি চার্জ কত", "চার্জ কত টাকা", "ঢাকায় ডেলিভারি কবে", "অর্ডার কোথায় আছে", "where is my order", "delivery charge please"];
const fresh = ["ডেলিভারিতে চার্জ কতো?", "আমার অর্ডার কোথায়", "where is my delivery", "orders delivered?"];

for (const [name, split] of [["word", splitWords], ["char", splitChars]]) {
  const tk = makeTokenizer(split, train);
  let unk = 0, total = 0;
  for (const s of fresh) { const ids = tk.encode(s).slice(1, -1); total += ids.length; unk += ids.filter((i) => i === 0).length; }
  console.log(name, "| vocab:", tk.size, "| নতুন বাক্যে token:", total, "| অজানা:", unk, "(" + Math.round((100 * unk) / total) + "%)");
}
const w = makeTokenizer(splitWords, train);
console.log("encode:", JSON.stringify(w.encode(fresh[0])), "→", w.decode(w.encode(fresh[0])));
`,
        expect: ['word | vocab:', 'char | vocab:', 'encode: [1,0,4,0,2] → <bos> <unk> চার্জ <unk> <eos>'],
        hints: ['char tokenizer-এ “তো”, “তে” কি পরিচিত? কোন অক্ষর training-এ ছিল না?', 'word-এ অজানা-হার কত, char-এ কত? token সংখ্যা কত গুণ?', '“orders”, “delivered” — ইংরেজিতেও বিভক্তির একই সমস্যা।'],
        test: 'var W=makeTokenizer(splitWords,train), C=makeTokenizer(splitChars,train); var u=function(tk){var t=0,k=0; fresh.forEach(function(s){var ids=tk.encode(s).slice(1,-1); t+=ids.length; k+=ids.filter(function(i){return i===0;}).length;}); return [k,t];}; var a=u(W), b=u(C); __assert(a[0]/a[1] > b[0]/b[1],"word has more unk"); __assert(b[1] > a[1]*3,"char seq much longer");',
      },
    ],
    line: ul([
      '<code>makeTokenizer(split, trainTexts)</code>: শুধু training টেক্সট থেকে vocabulary—অধ্যায় ৪-এর leakage নিয়ম।',
      '<code>id.get(t) ?? 0</code>: অজানা হলে ০ (&lt;unk&gt;)। <code>??</code> মানে বাম পাশ undefined/null হলে ডান পাশ।',
      '<code>[1, ...ids, 2]</code>: শুরুতে &lt;bos&gt;, শেষে &lt;eos&gt;।',
      'অক্ষর মোডে স্পেস “_” দিয়ে রাখা, যাতে decode-এ শব্দসীমা বোঝা যায়।',
    ]),
    why: p('একই makeTokenizer দুই split ফাংশন দিয়ে চালানো হয়েছে, যাতে পার্থক্য শুধু “একক কী” থেকে আসে। নতুন বাক্যে মূল্যায়ন করা হয়েছে—training বাক্যে দুটোই ০% অজানা দেখাত।'),
    remember: ['tokenize → ID → decode', 'vocabulary শুধু training থেকে', 'word: ছোট ক্রম, বেশি অজানা', 'char: অজানা কম, ক্রম লম্বা'],
    skip: ['শব্দ-সীমা ছাড়া ভাষা (চীনা, জাপানি)', 'বানান-সংশোধন'],
    experiment: p('training-এ “ডেলিভারিতে” ও “কতো” যোগ করুন। word অজানা-হার কমে—কিন্তু এভাবে প্রতিটি রূপ যোগ করতে থাকলে vocabulary কত বড় হবে? বাংলায় একটি ক্রিয়ার কতগুলো রূপ হতে পারে ভাবুন।'),
    mistakes: ['test টেক্সট দিয়ে vocabulary বানানো', '&lt;unk&gt;-কে সাধারণ শব্দের মতো ধরা', 'অক্ষর-tokenizer-এ কার আলাদা করে ফেলা', '&lt;eos&gt; ছাড়া generation (থামার সংকেত নেই)'],
    quiz: [
      { q: 'vocabulary-তে “দাম” আছে, “দামি” নেই। শব্দ-tokenizer “দামি” কী দেবে?', a: { a: '“দাম”-এর ID', b: '&lt;unk&gt;-এর ID', c: 'এরর' }, ok: 'b', why: 'শব্দ-tokenizer পুরো শব্দ মেলায়; আংশিক মিল চেনে না।' },
      { q: '&lt;eos&gt; token-এর কাজ?', a: { a: 'অজানা শব্দ বোঝানো', b: 'ক্রমের শেষ চিহ্নিত করা, যাতে generation থামতে পারে', c: 'স্পেস' }, ok: 'b', why: 'মডেল &lt;eos&gt;-এর সম্ভাব্যতা শিখলে কখন উত্তর শেষ করবে তা ঠিক করতে পারে।' },
      { q: 'অক্ষর-tokenizer-এর প্রধান অসুবিধা?', a: { a: 'অনেক অজানা token', b: 'ক্রম অনেক লম্বা—মডেলকে দূরের সম্পর্ক শিখতে হয়, হিসাব বেশি', c: 'vocabulary বিশাল' }, ok: 'b', why: 'vocabulary ছোট ও অজানা কম, কিন্তু প্রতিটি শব্দ অনেক token।' },
    ],
    recap: ['দুই চরম: শব্দ ও অক্ষর', 'অজানা-হার ও দৈর্ঘ্যের trade-off', 'নতুন টেক্সটে মূল্যায়ন'],
    nextNote: 'মাঝামাঝি সমাধান—subword ও BPE:',
    sources: [SRC.jurafsky, SRC.bpe],
  },
  {
    id: 'les-06-03-bpe',
    synthetic: true,
    slug: 'byte-pair-encoding',
    title: 'Subword ও Byte Pair Encoding (BPE)',
    minutes: 45,
    prereqs: ['les-06-02-word-char-tokens'],
    summary: 'অক্ষর থেকে শুরু, সবচেয়ে ঘনঘন জোড়া বারবার merge; merge-তালিকা দিয়ে নতুন শব্দ encode; বাংলা বিভক্তি ভাগ হয়ে যায়; tie-breaking নির্ধারিত রাখা।',
    overview: p('Byte Pair Encoding (BPE) অক্ষর দিয়ে শুরু করে, training টেক্সটে পাশাপাশি সবচেয়ে বেশিবার আসা জোড়াকে একটি নতুন token বানায়, এবং এটি বারবার করে। ফলে ঘনঘন শব্দ পুরোটাই একটি token হয়, আর বিরল শব্দ পরিচিত টুকরোয় ভাঙে—যেমন “ডেলিভারিতে” → “ডেলিভারি” + “তে”। এই পাঠে ছোট বাংলা-ইংরেজি corpus-এ BPE train করব, প্রতিটি merge দেখব, এবং অদেখা শব্দ encode করব। GPT-2 সহ অনেক মডেল BPE-র কোনো রূপ ব্যবহার করে।'),
    objectives: ['BPE training-এর ধাপ (গণনা, merge, পুনরাবৃত্তি) হাতে করতে পারবেন', 'merge-তালিকা দিয়ে নতুন শব্দ encode করতে পারবেন', 'কেন BPE অজানা-হার ও ক্রম-দৈর্ঘ্যের মাঝামাঝি সমাধান তা ব্যাখ্যা করতে পারবেন'],
    problem: p('আগের পাঠে শব্দ-tokenizer “ডেলিভারিতে” চেনেনি, অক্ষর-tokenizer সব চিনেছে কিন্তু খুব লম্বা ক্রম দিয়েছে। আমরা চাই: ঘনঘন অংশ (“ডেলিভারি”) একটি token, আর নতুন বিভক্তি (“তে”) আলাদা পরিচিত token। নিয়ম হাতে না লিখে ডেটা থেকে এই টুকরোগুলো শেখা যায় কি?'),
    explain:
      ol([
        'প্রতিটি শব্দকে অক্ষরে ভাঙুন এবং শেষে শব্দ-শেষ চিহ্ন “&lt;/w&gt;” যোগ করুন (যাতে “তে” শব্দের শেষে নাকি মাঝে বোঝা যায়)।',
        'সব শব্দে পাশাপাশি জোড়া গুনুন (শব্দের ঘনত্ব দিয়ে গুণ)।',
        'সবচেয়ে বেশি আসা জোড়াকে merge করে নতুন token; merge-তালিকায় লিখুন।',
        'নির্দিষ্ট সংখ্যক merge বা vocabulary আকার পর্যন্ত পুনরাবৃত্তি।',
      ]) +
      p('<strong>Encode:</strong> নতুন শব্দকে অক্ষরে ভেঙে merge-তালিকা <em>একই ক্রমে</em> প্রয়োগ। কোনো merge না মিললে টুকরো অক্ষর পর্যায়ে থেকে যায়—তবু অজানা নয়।') +
      p('<strong>Tie-breaking:</strong> দুটি জোড়ার গণনা সমান হলে কোনটি আগে? নিয়ম নির্ধারিত না হলে দুইবার train করলে ভিন্ন tokenizer। এখানে: সমান হলে অভিধানক্রমে ছোট জোড়া।') +
      p('<strong>Byte-level BPE:</strong> GPT-2-এর মতো tokenizer অক্ষরের বদলে UTF-8 byte থেকে শুরু করে, তাই কোনো টেক্সটই অজানা হয় না। আমরা সরলতার জন্য grapheme থেকে শুরু করছি।') +
      note('বাস্তব tokenizer হাজার হাজার merge শেখে বিশাল corpus থেকে। আমাদের ছোট corpus-এ merge-গুলো ঐ corpus-এর বিশেষত্ব প্রতিফলিত করে—অন্য টেক্সটে সাধারণীকরণ সীমিত।'),
    analogy: {
      text: 'BPE হলো টাইপিস্টের শর্টকাট-তালিকা: যে অক্ষরজোড়া বারবার লিখতে হয়, সেটির জন্য একটি কী বানানো; তারপর জোড়া-কী আর অক্ষর মিলে আরও বড় শর্টকাট।',
      breaks: 'টাইপিস্ট শব্দের অর্থ দেখে শর্টকাট বানাতে পারেন; BPE শুধু ঘনত্ব দেখে—“ভারি” merge হতে পারে কারণ এটি “ডেলিভারি”-তে ঘনঘন, অর্থ নয়।',
    },
    worked:
      p('corpus: “low” ×৫, “lower” ×২, “newest” ×৬, “widest” ×৩ (Sennrich et al.-এর উদাহরণের আদলে)।') +
      ol([
        'জোড়া গণনা: (e, s) = ৬ + ৩ = ৯, (s, t) = ৯, (l, o) = ৭, (o, w) = ৭ …',
        '(e, s) ও (s, t) দুটোই ৯—অভিধানক্রমে “e s” ছোট, তাই প্রথম merge: es।',
        'এখন (es, t) = ৯ → merge: est।',
        'তারপর (est, &lt;/w&gt;) = ৯ → est&lt;/w&gt;। এরপর (l, o) = ৭ → lo …',
        'অদেখা “lowest” → lo + w + est&lt;/w&gt; (পরের merge-গুলোর ওপর নির্ভর করে)।',
      ]),
    activity: note('কোডে BPE train (বাংলা + ইংরেজি ছোট corpus), প্রথম merge-গুলো মুদ্রণ, তারপর অদেখা শব্দ encode ও অক্ষর-tokenizer-এর সাথে দৈর্ঘ্য তুলনা।'),
    code: [
      {
        label: 'BPE training ও encoding',
        starter: String.raw`function graphemes(s) {
  const out = [];
  for (const ch of Array.from(s)) {
    const last = out.length ? out[out.length - 1] : "";
    if (out.length && (/\p{M}/u.test(ch) || last.endsWith("\u09CD"))) out[out.length - 1] += ch; else out.push(ch);
  }
  return out;
}
const EOW = "</w>";

// শব্দ → ঘনত্ব (সিন্থেটিক corpus)
const corpus = { low: 5, lower: 2, newest: 6, widest: 3, "ডেলিভারি": 6, "ডেলিভারির": 2, "দাম": 5, "দামি": 2, "দামে": 2, "টাকা": 4, "টাকায়": 2 };

function trainBPE(corpus, numMerges) {
  let words = Object.entries(corpus).map(([w, n]) => ({ sym: [...graphemes(w), EOW], n }));
  const merges = [];
  for (let m = 0; m < numMerges; m++) {
    const counts = new Map();
    for (const { sym, n } of words) for (let i = 0; i < sym.length - 1; i++) {
      const key = sym[i] + " " + sym[i + 1];
      counts.set(key, (counts.get(key) || 0) + n);
    }
    if (!counts.size) break;
    // সর্বোচ্চ গণনা; সমান হলে অভিধানক্রমে ছোট (নির্ধারিত ফল)
    const [best, cnt] = [...counts.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0];
    if (cnt < 2) break;
    const [a, b] = best.split(" ");
    merges.push([a, b, cnt]);
    words = words.map(({ sym, n }) => {
      const out = [];
      for (let i = 0; i < sym.length; i++) {
        if (i < sym.length - 1 && sym[i] === a && sym[i + 1] === b) { out.push(a + b); i++; } else out.push(sym[i]);
      }
      return { sym: out, n };
    });
  }
  return merges;
}

function encode(word, merges) {
  let sym = [...graphemes(word), EOW];
  for (const [a, b] of merges) {
    const out = [];
    for (let i = 0; i < sym.length; i++) {
      if (i < sym.length - 1 && sym[i] === a && sym[i + 1] === b) { out.push(a + b); i++; } else out.push(sym[i]);
    }
    sym = out;
  }
  return sym;
}

const merges = trainBPE(corpus, 30);
console.log("merge সংখ্যা:", merges.length);
console.log("প্রথম ৬:", merges.slice(0, 6).map(([a, b, c]) => a + "+" + b + "(" + c + ")").join("  "));
for (const w of ["lowest", "ডেলিভারিতে", "দামগুলো", "টাকায়"]) {
  const t = encode(w, merges);
  console.log(w.padEnd(12), "→", JSON.stringify(t), "| BPE token:", t.length, "| অক্ষর:", graphemes(w).length + 1);
}
`,
        expect: ['প্রথম ৬: e+s(9)  es+t(9)  est+</w>(9)', 'ডেলিভারিতে', 'BPE token:'],
        hints: ['“ডেলিভারিতে” কীভাবে ভাগ হলো? “তে” কি আলাদা?', 'trainBPE(corpus, 5) দিয়ে চালান—encode কীভাবে বদলায়?', 'tie-breaking লাইন থেকে “|| (a[0] < b[0] ? -1 : 1)” মুছে দিন—ফল কি এখনও নির্ধারিত? (JavaScript-এর sort stable, তাই Map-এর ক্রমে নির্ভর করবে—নিয়মটি অস্পষ্ট হয়ে যায়।)'],
        test: '__assert(merges[0][0]==="e"&&merges[0][1]==="s","first merge es"); var t=encode("ডেলিভারিতে",merges); __assert(t.length < graphemes("ডেলিভারিতে").length+1,"bpe shorter than chars"); __assert(t.join("")==="ডেলিভারিতে"+EOW,"lossless"); __assert(JSON.stringify(trainBPE(corpus,30))===JSON.stringify(merges),"deterministic");',
      },
    ],
    line: ul([
      '<code>{ sym, n }</code>: প্রতিটি শব্দ তার বর্তমান টুকরো ও corpus-এ কতবার আছে।',
      '<code>counts</code>: জোড়া → মোট গণনা (শব্দের ঘনত্ব দিয়ে গুণ)।',
      'sort-এ প্রথম শর্ত গণনা, দ্বিতীয় অভিধানক্রম—নির্ধারিত tie-breaking।',
      '<code>if (cnt < 2) break</code>: একবার আসা জোড়া merge করা অর্থহীন।',
      '<code>encode</code>: training-এর একই ক্রমে merge প্রয়োগ। test-এ যাচাই: টুকরো জুড়লে মূল শব্দ (lossless)।',
    ]),
    why: p('corpus-এ “ডেলিভারি” ও “দাম”-এর কয়েকটি বিভক্তি-রূপ রাখা হয়েছে যাতে BPE মূল অংশ শেখে। ইংরেজি অংশ Sennrich et al.-এর পরিচিত উদাহরণের আদলে, যাতে সূত্রের সাথে মেলানো যায়।'),
    remember: ['BPE: ঘনঘন জোড়া বারবার merge', 'encode-এ training-এর একই merge ক্রম', 'tie-breaking নির্ধারিত রাখুন', 'অদেখা শব্দ পরিচিত টুকরোয় ভাঙে—অজানা নয়'],
    skip: ['WordPiece ও Unigram LM tokenizer', 'byte-level BPE-র বিস্তারিত', 'pre-tokenization regex'],
    experiment: p('corpus-এ “ডেলিভারিতে”: ৩ যোগ করে আবার train করুন। এখন “ডেলিভারিতে” কয়টি token? কোনো শব্দ training-এ ঘনঘন হলে তার token কীভাবে বদলায়?'),
    mistakes: ['encode-এ merge-এর ক্রম বদলানো', 'শব্দ-শেষ চিহ্ন বাদ দিয়ে শেষ ও মাঝের অংশ গুলিয়ে ফেলা', 'tie-breaking অনির্ধারিত রাখা', 'ছোট corpus-এর merge-কে সাধারণ ভাষার নিয়ম ভাবা'],
    quiz: [
      { q: 'BPE প্রতিটি ধাপে কোন জোড়া merge করে?', a: { a: 'প্রথম জোড়া', b: 'corpus-এ সবচেয়ে বেশি আসা পাশাপাশি জোড়া', c: 'দৈব জোড়া' }, ok: 'b', why: 'ঘনত্ব-ভিত্তিক: বারবার আসা অংশ একটি token হয়ে ক্রম ছোট করে।' },
      { q: 'BPE-তে অদেখা শব্দের কী হয়?', a: { a: 'সবসময় &lt;unk&gt;', b: 'পরিচিত subword বা অক্ষরে ভাঙে', c: 'বাদ পড়ে' }, ok: 'b', why: 'merge না মিললেও অক্ষর-পর্যায়ের token থাকে, তাই কিছুই হারায় না।' },
      { q: 'tie-breaking নির্ধারিত না থাকলে কী সমস্যা?', a: { a: 'কোনো সমস্যা নেই', b: 'একই ডেটায় দুবার train করলে ভিন্ন tokenizer—পুনরুৎপাদন অসম্ভব', c: 'training ধীর হয়' }, ok: 'b', why: 'tokenizer বদলালে সব token ID বদলায়; আগে train করা মডেলের সাথে আর মেলে না।' },
    ],
    recap: ['subword = শব্দ ও অক্ষরের মাঝামাঝি', 'BPE ডেটা থেকে টুকরো শেখে', 'বাংলা বিভক্তি আলাদা token হয়ে যেতে পারে'],
    nextNote: 'token পেলাম। এবার মূল কাজ—পরের token-এর সম্ভাব্যতা:',
    sources: [SRC.bpe, SRC.gpt2, SRC.jurafsky],
  },
  {
    id: 'les-06-04-bigram-model',
    synthetic: true,
    slug: 'next-token-bigram',
    title: 'Next-Token Prediction ও Bigram মডেল',
    minutes: 40,
    prereqs: ['les-06-03-bpe', 'les-03-05-probability'],
    summary: 'language model = P(পরের token | আগের token); সম্ভাব্যতার chain rule; গণনা থেকে bigram; বাক্যের সম্ভাব্যতা; অদেখা জোড়ায় শূন্য সম্ভাব্যতা।',
    overview: p('Language model একটি token ক্রমের সম্ভাব্যতা দেয়, এবং সমতুল্যভাবে—আগের token দেখে পরের token-এর সম্ভাব্যতা। সম্ভাব্যতার chain rule অনুযায়ী P(w₁ … wₙ) = P(w₁) × P(w₂ | w₁) × … × P(wₙ | w₁ … wₙ₋₁)। পুরো ইতিহাস মনে রাখা অসম্ভব, তাই bigram মডেল ধরে নেয় শুধু ঠিক আগের token-টি গুরুত্বপূর্ণ: P(wᵢ | wᵢ₋₁) = গণনা(wᵢ₋₁, wᵢ) / গণনা(wᵢ₋₁)। এই পাঠে ছোট corpus থেকে bigram টেবিল বানাব, বাক্যের সম্ভাব্যতা হিসাব করব, এবং একটি গুরুতর সমস্যা দেখব: training-এ না দেখা একটি জোড়া পুরো বাক্যের সম্ভাব্যতা শূন্য করে দেয়।'),
    objectives: ['chain rule দিয়ে বাক্যের সম্ভাব্যতা লিখতে পারবেন', 'গণনা থেকে bigram সম্ভাব্যতা হিসাব করতে পারবেন', 'অদেখা জোড়ায় শূন্য-সম্ভাব্যতা সমস্যা ব্যাখ্যা করতে পারবেন'],
    problem: p('গ্রাহক লিখছেন “ডেলিভারি চার্জ …”। পরের শব্দ কী হতে পারে—“কত”, “আছে”, নাকি “ফ্রি”? প্রতিটির জন্য একটি সংখ্যা চাই যাতে সবচেয়ে সম্ভাব্যটি সাজেস্ট করা যায়। আর এই সংখ্যাগুলো কোথা থেকে আসবে?'),
    explain:
      p(`${term('ল্যাঙ্গুয়েজ মডেল', 'language model')}: প্রতিটি প্রসঙ্গে পরের token-এর একটি সম্ভাব্যতা বণ্টন (vocabulary-র সব token-এর ওপর, যোগফল ১)।`) +
      p(`${term('বাইগ্রাম', 'bigram')}: পাশাপাশি দুই token। Bigram মডেল: P(wᵢ | wᵢ₋₁) = C(wᵢ₋₁ wᵢ) / C(wᵢ₋₁)। এটি “maximum likelihood estimate”—training ডেটায় যা দেখেছি তার অনুপাত।`) +
      p('বাক্যের শুরু ও শেষ বোঝাতে &lt;bos&gt; ও &lt;eos&gt; যোগ করি: P(&lt;bos&gt; ডেলিভারি চার্জ কত &lt;eos&gt;) = P(ডেলিভারি | &lt;bos&gt;) × P(চার্জ | ডেলিভারি) × P(কত | চার্জ) × P(&lt;eos&gt; | কত)।') +
      p('<strong>log ব্যবহার:</strong> অনেক ছোট সংখ্যার গুণ underflow করে (অধ্যায় ৩), তাই log-সম্ভাব্যতা যোগ করি।') +
      warn('<strong>শূন্য সমস্যা:</strong> training-এ “চার্জ ফ্রি” কখনো না এলে P(ফ্রি | চার্জ) = ০, এবং ঐ জোড়াযুক্ত যেকোনো বাক্যের সম্ভাব্যতা ০ (log = −∞)। মডেল বলছে “এটি অসম্ভব”—যা স্পষ্টতই ভুল। পরের পাঠে smoothing দিয়ে সমাধান।'),
    analogy: {
      text: 'Bigram মডেল হলো এমন একজন যিনি শুধু আগের শব্দ শুনে পরের শব্দ আন্দাজ করেন—“ডেলিভারি” শুনলে “চার্জ” বলেন কারণ আগে বহুবার এমন শুনেছেন।',
      breaks: 'মানুষ পুরো বাক্য, প্রসঙ্গ ও অর্থ মনে রাখে; bigram শুধু একটি শব্দ পেছনে দেখে এবং অর্থ জানে না—“চার্জ” শব্দের পরে মোবাইল-চার্জ নাকি ডেলিভারি-চার্জ, তার কাছে একই।',
    },
    worked:
      p('corpus (&lt;bos&gt;/&lt;eos&gt; সহ): “ডেলিভারি চার্জ কত”, “ডেলিভারি কবে”, “চার্জ কত টাকা”।') +
      ol([
        'C(ডেলিভারি) = ২; C(ডেলিভারি চার্জ) = ১, C(ডেলিভারি কবে) = ১ → P(চার্জ | ডেলিভারি) = ০.৫।',
        'C(চার্জ) = ২; C(চার্জ কত) = ২ → P(কত | চার্জ) = ১।',
        'C(&lt;bos&gt;) = ৩; C(&lt;bos&gt; ডেলিভারি) = ২ → P(ডেলিভারি | &lt;bos&gt;) = ২/৩।',
        'C(কত) = ২; C(কত &lt;eos&gt;) = ১ → ০.৫।',
        'P(বাক্য ১) = ২/৩ × ০.৫ × ১ × ০.৫ = ১/৬ ≈ ০.১৬৭।',
      ]),
    activity: note('কোডে bigram গণনা, worked উদাহরণ যাচাই, পরের শব্দের বণ্টন, এবং একটি অদেখা জোড়ায় log-সম্ভাব্যতা −Infinity।'),
    code: [
      {
        label: 'bigram মডেল',
        starter: String.raw`const tok = (s) => ["<bos>", ...s.toLowerCase().replace(/[?!,।.]/g, " ").split(/\s+/).filter(Boolean), "<eos>"];
const corpus = ["ডেলিভারি চার্জ কত", "ডেলিভারি কবে", "চার্জ কত টাকা"];

const uni = new Map(), bi = new Map();
for (const s of corpus) {
  const t = tok(s);
  for (let i = 0; i < t.length - 1; i++) {
    uni.set(t[i], (uni.get(t[i]) || 0) + 1);
    const k = t[i] + " " + t[i + 1];
    bi.set(k, (bi.get(k) || 0) + 1);
  }
}
const P = (next, prev) => (bi.get(prev + " " + next) || 0) / (uni.get(prev) || 1);
function sentenceLogP(s) {
  const t = tok(s);
  let lp = 0;
  for (let i = 1; i < t.length; i++) lp += Math.log(P(t[i], t[i - 1]));
  return lp;
}
function nextDist(prev) {
  const out = [];
  for (const [k, c] of bi) { const [a, b] = k.split(" "); if (a === prev) out.push([b, c / uni.get(prev)]); }
  return out.sort((x, y) => y[1] - x[1]);
}
const r3 = (x) => Math.round(x * 1000) / 1000;

console.log("P(চার্জ | ডেলিভারি) =", P("চার্জ", "ডেলিভারি"), " P(কত | চার্জ) =", P("কত", "চার্জ"));
const lp = sentenceLogP("ডেলিভারি চার্জ কত");
console.log("log P =", r3(lp), " P =", r3(Math.exp(lp)));
console.log("“ডেলিভারি”-র পরে:", JSON.stringify(nextDist("ডেলিভারি")));
console.log("<bos>-এর পরে বণ্টনের যোগফল:", nextDist("<bos>").reduce((s, [, p]) => s + p, 0));
console.log("অদেখা জোড়া “চার্জ ফ্রি”: log P =", sentenceLogP("ডেলিভারি চার্জ ফ্রি"));
`,
        expect: ['P(চার্জ | ডেলিভারি) = 0.5  P(কত | চার্জ) = 1', 'log P = -1.792  P = 0.167', '“ডেলিভারি”-র পরে: [["চার্জ",0.5],["কবে",0.5]]', 'বণ্টনের যোগফল: 1', 'log P = -Infinity'],
        hints: ['Math.log(0) = −Infinity—এক জোড়াই পুরো যোগফল −∞ করে।', 'corpus-এ “চার্জ ফ্রি” যোগ করলে P(কত | চার্জ) কত হবে?', 'nextDist("কত") চালান—“টাকা” ও “<eos>” কত সম্ভাব্য?'],
        test: '__close(Math.exp(lp),1/6,1e-12,"worked"); __close(nextDist("<bos>").reduce(function(s,x){return s+x[1];},0),1,1e-12,"sums to 1"); __assert(sentenceLogP("ডেলিভারি চার্জ ফ্রি")===-Infinity,"zero problem");',
      },
    ],
    line: ul([
      '<code>tok</code>: শব্দ-ভাঙা + &lt;bos&gt;/&lt;eos&gt;।',
      '<code>uni</code>: প্রতিটি token কতবার “আগের token” হিসেবে এসেছে (শেষ &lt;eos&gt; বাদ)—bigram-এর হর।',
      '<code>P(next, prev)</code>: C(prev next) / C(prev)।',
      '<code>sentenceLogP</code>: log যোগ—underflow এড়ায়।',
      '<code>nextDist</code>: একটি প্রসঙ্গের পর সব সম্ভাব্য token—যোগফল ১।',
    ]),
    why: p('হর হিসেবে “আগের token হিসেবে কতবার” গোনা হয়েছে (সাধারণ শব্দ-গণনা নয়), যাতে প্রতিটি প্রসঙ্গের বণ্টনের যোগফল ঠিক ১ হয়—test-এ যাচাই করা।'),
    remember: ['LM = পরের token-এর সম্ভাব্যতা বণ্টন', 'bigram: P(w | আগের) = C(আগের w) / C(আগের)', 'log-সম্ভাব্যতা যোগ', 'অদেখা জোড়া = শূন্য = সমস্যা'],
    skip: ['Markov assumption-এর আনুষ্ঠানিক সংজ্ঞা', 'class-based LM'],
    experiment: p('corpus-এ আরও ৫টি বাক্য যোগ করুন যেগুলোতে “চার্জ”-এর পরে ভিন্ন শব্দ আছে। nextDist("চার্জ") কীভাবে বদলায়? বেশি ডেটা কি শূন্য সমস্যা পুরোপুরি দূর করবে?'),
    mistakes: ['হরে সাধারণ গণনা ব্যবহার করে বণ্টনের যোগফল ১ না হওয়া', 'সম্ভাব্যতা সরাসরি গুণ করে underflow', '&lt;bos&gt;/&lt;eos&gt; বাদ দেওয়া', 'শূন্য সম্ভাব্যতাকে “অসম্ভব” অর্থে নেওয়া'],
    quiz: [
      { q: 'C(দাম) = ৪, C(দাম কত) = ৩। P(কত | দাম) কত?', a: { a: '০.৭৫', b: '৩', c: '০.২৫' }, ok: 'a', why: '৩/৪ = ০.৭৫।' },
      { q: 'bigram মডেল পরের শব্দ অনুমানে কতটা প্রসঙ্গ দেখে?', a: { a: 'পুরো বাক্য', b: 'শুধু ঠিক আগের একটি token', c: 'কিছুই না' }, ok: 'b', why: 'bigram-এর ধারণা: P(wᵢ | পুরো ইতিহাস) ≈ P(wᵢ | wᵢ₋₁)।' },
      { q: 'একটি অদেখা জোড়া থাকলে বাক্যের bigram সম্ভাব্যতা?', a: { a: 'একটু কম', b: 'শূন্য', c: 'অপরিবর্তিত' }, ok: 'b', why: 'গুণফলের একটি গুণক ০ হলে পুরোটা ০।' },
    ],
    recap: ['chain rule দিয়ে বাক্যের সম্ভাব্যতা', 'bigram গণনা-ভিত্তিক', 'শূন্য-সম্ভাব্যতা সমস্যা'],
    nextNote: 'শূন্য সমস্যা সমাধান ও মডেল মূল্যায়ন—smoothing ও perplexity:',
    sources: [SRC.jurafsky, SRC.karpathyMakemore],
  },
  {
    id: 'les-06-05-smoothing-perplexity',
    slug: 'smoothing-perplexity',
    title: 'Smoothing, Cross-Entropy ও Perplexity',
    minutes: 45,
    prereqs: ['les-06-04-bigram-model', 'les-03-06-logs-derivatives', 'les-04-02-train-val-test'],
    summary: 'add-k smoothing; held-out cross-entropy (প্রতি token গড় −log p); perplexity = e^(cross-entropy); k বাছাই validation দিয়ে; unigram baseline।',
    overview: p('Smoothing প্রতিটি সম্ভাব্য জোড়ায় সামান্য সম্ভাব্যতা দেয়, যাতে অদেখা জোড়া শূন্য না হয়। সবচেয়ে সরল add-k smoothing: P = (C(আগের w) + k) / (C(আগের) + k × V), যেখানে V vocabulary আকার। মডেল কতটা ভালো তা মাপতে held-out টেক্সটে প্রতি token গড় −log p হিসাব করি—এটি cross-entropy। Perplexity = e^(cross-entropy), যাকে “মডেল গড়ে কতগুলো বিকল্পের মধ্যে দ্বিধায়” হিসেবে পড়া যায়। এই পাঠে কয়েকটি k-এর জন্য validation perplexity তুলনা করব এবং unigram মডেলের সাথে মেলাব।'),
    objectives: ['add-k smoothing হিসাব করে কেন এটি শূন্য সমস্যা দূর করে বলতে পারবেন', 'held-out টেক্সটে cross-entropy ও perplexity হিসাব করতে পারবেন', 'validation দিয়ে k বাছাই করে baseline-এর সাথে তুলনা করতে পারবেন'],
    problem: p('দুটি language model আছে। একটির training টেক্সটে নিখুঁত সম্ভাব্যতা, কিন্তু নতুন টেক্সটে অদেখা জোড়ায় ০। আরেকটি সব জায়গায় একটু কম আত্মবিশ্বাসী। কোনটি ভালো—এবং “ভালো” কীভাবে একটি সংখ্যায় মাপব?'),
    explain:
      p(`${term('স্মুদিং', 'smoothing')}: দেখা ঘটনা থেকে কিছু সম্ভাব্যতা সরিয়ে অদেখা ঘটনায় দেওয়া। Add-k: P_k(w | আগের) = (C(আগের w) + k) / (C(আগের) + kV)। k = ১ হলে Laplace smoothing। k ছোট হলে দেখা জোড়ায় বেশি বিশ্বাস; বড় হলে বণ্টন সমান হয়ে যায়।`) +
      p(`${term('ক্রস-এনট্রপি', 'cross-entropy')}: held-out টেক্সটের N টি token-এ H = −(১/N) Σ log P(wᵢ | প্রসঙ্গ)। অধ্যায় ৪-এর loss-এর সমান—language model training-এ ঠিক এটাই কমানো হয়।`) +
      p(`${term('পারপ্লেক্সিটি', 'perplexity')}: PPL = e^H। মডেল প্রতিটি ধাপে সমান সম্ভাব্যতায় k টি বিকল্পের মধ্যে বাছলে PPL = k। কম = ভালো। vocabulary-র ওপর সমান বণ্টনের PPL = V—এটি সবচেয়ে খারাপ “যুক্তিসঙ্গত” baseline।`) +
      table(['মডেল', 'কী দেখে', 'অদেখা জোড়ায়'], [
        ['Uniform', 'কিছুই না', '১/V'],
        ['Unigram (add-১)', 'শব্দ কতটা সাধারণ', 'শব্দের সাধারণ ঘনত্ব'],
        ['Bigram (add-k)', 'আগের শব্দ', 'smoothing-এর ছোট সম্ভাব্যতা'],
      ], 'তুলনার মডেল') +
      warn('Perplexity শুধু একই tokenizer ও একই test টেক্সটে তুলনীয়। ভিন্ন tokenizer-এর মডেলের PPL সরাসরি তুলনা করা যায় না—token-এর একক ভিন্ন।'),
    analogy: {
      text: 'Perplexity হলো মডেলের “দ্বিধার মাপ”: PPL ৪ মানে প্রতিটি পরের শব্দে মডেল যেন ৪টি সমান-সম্ভাব্য বিকল্পের মধ্যে দ্বিধায়।',
      breaks: 'বাস্তব বণ্টন কখনো ঠিক সমান নয়—PPL ৪ মানে কিছু ধাপে মডেল প্রায় নিশ্চিত, কিছু ধাপে অনেক বিকল্পে দ্বিধাগ্রস্ত; গড়টা ৪-এর সমতুল্য।',
    },
    worked:
      p('C(চার্জ) = ২, C(চার্জ কত) = ২, V = ১০, k = ১।') +
      ol([
        'P(কত | চার্জ) = (২ + ১)/(২ + ১০) = ৩/১২ = ০.২৫ (smoothing ছাড়া ১)।',
        'P(ফ্রি | চার্জ) = (০ + ১)/(১২) ≈ ০.০৮৩ (ছাড়া ০)।',
        'দুই token-এর test: −(log ০.২৫ + log ০.০৮৩)/২ ≈ (১.৩৮৬ + ২.৪৮৫)/২ ≈ ১.৯৩৬; PPL ≈ e^১.৯৩৬ ≈ ৬.৯৩।',
      ]),
    activity: note('কোডে train ও validation বাক্য (সিন্থেটিক), add-k bigram, unigram, ও uniform; k = ০.০১, ০.১, ১-এ validation perplexity।'),
    code: [
      {
        label: 'add-k smoothing ও perplexity',
        starter: String.raw`const tok = (s) => ["<bos>", ...s.toLowerCase().replace(/[?!,।.]/g, " ").split(/\s+/).filter(Boolean), "<eos>"];
const train = [
  "ডেলিভারি চার্জ কত", "ঢাকায় ডেলিভারি চার্জ কত", "ঢাকার বাইরে ডেলিভারি চার্জ কত",
  "অর্ডার কোথায় আছে", "আমার অর্ডার কোথায়", "অর্ডার কবে আসবে", "ডেলিভারি কবে আসবে",
  "দাম কত", "এই পণ্যের দাম কত", "ফেরত দেওয়া যাবে", "পণ্য ফেরত দিতে চাই",
];
const val = ["ঢাকায় ডেলিভারি কবে আসবে", "পণ্যের দাম কত", "আমার অর্ডার কবে আসবে", "ডেলিভারি চার্জ কত টাকা"];

const vocab = new Set(["<unk>"]);
train.forEach((s) => tok(s).forEach((t) => vocab.add(t)));
const V = vocab.size;
const norm = (t) => (vocab.has(t) ? t : "<unk>");

const uni = new Map(), ctx = new Map(), bi = new Map();
let totalTokens = 0;
for (const s of train) {
  const t = tok(s);
  for (let i = 0; i < t.length; i++) {
    if (i > 0) { uni.set(t[i], (uni.get(t[i]) || 0) + 1); totalTokens++; }
    if (i < t.length - 1) { ctx.set(t[i], (ctx.get(t[i]) || 0) + 1); const k = t[i] + " " + t[i + 1]; bi.set(k, (bi.get(k) || 0) + 1); }
  }
}
const bigramK = (k) => (w, prev) => ((bi.get(prev + " " + w) || 0) + k) / ((ctx.get(prev) || 0) + k * V);
const unigram = (w) => ((uni.get(w) || 0) + 1) / (totalTokens + V);
const uniform = () => 1 / V;

function perplexity(model, texts) {
  let nll = 0, n = 0;
  for (const s of texts) {
    const t = tok(s).map(norm);
    for (let i = 1; i < t.length; i++) { nll += -Math.log(model(t[i], t[i - 1])); n++; }
  }
  return { ce: nll / n, ppl: Math.exp(nll / n), n };
}
const r2 = (x) => Math.round(x * 100) / 100;
console.log("V =", V, "| validation token:", perplexity(uniform, val).n);
const results = {};
for (const [name, m] of [["uniform", uniform], ["unigram add-1", unigram], ["bigram k=1", bigramK(1)], ["bigram k=0.1", bigramK(0.1)], ["bigram k=0.01", bigramK(0.01)], ["bigram k=0.001", bigramK(0.001)], ["bigram k=0.0001", bigramK(0.0001)]]) {
  const tr = perplexity(m, train), va = perplexity(m, val);
  results[name] = va.ppl;
  console.log(name.padEnd(16), "train PPL", String(r2(tr.ppl)).padStart(6), "| val PPL", String(r2(va.ppl)).padStart(6), "| val CE", r2(va.ce));
}
`,
        expect: ['uniform', 'unigram add-1', 'bigram k=0.1'],
        hints: ['uniform-এর PPL ঠিক V-এর সমান কেন?', 'k ছোট করলে train PPL সবসময় কমে। val PPL? k = 0.01-এ সর্বনিম্ন, তারপর আবার বাড়ে—U-আকৃতি। কেন?', 'val-এর “টাকা” training-এ নেই, তাই <unk>। <unk> নিজে training-এ কখনো আসেনি—তাই এর সম্ভাব্যতা শুধু smoothing থেকে।'],
        test: '__close(results["uniform"],V,1e-9,"uniform ppl = V"); __assert(results["unigram add-1"]<results["uniform"],"unigram beats uniform"); __assert(Math.min(results["bigram k=0.1"],results["bigram k=0.01"])<results["unigram add-1"],"bigram beats unigram"); __assert(results["bigram k=0.01"]<results["bigram k=0.0001"]&&results["bigram k=0.01"]<results["bigram k=1"],"U-shape quoted"); var p=bigramK(1); var s=0; vocab.forEach(function(w){ s+=p(w,"চার্জ"); }); __close(s,1,1e-9,"smoothed dist sums 1");',
      },
    ],
    line: ul([
      '<code>vocab</code> শুধু train থেকে, সাথে &lt;unk&gt;; <code>norm</code> অজানা শব্দকে &lt;unk&gt; করে।',
      '<code>ctx</code>: প্রসঙ্গ-গণনা (bigram-এর হর); <code>uni</code>: পরের-token গণনা (unigram)।',
      '<code>bigramK(k)</code>: একটি function ফেরত দেয়—ভিন্ন k-এর মডেল সহজে বানানো।',
      '<code>perplexity</code>: প্রতিটি পূর্বাভাসিত token-এর −log p-এর গড়, তারপর e^।',
      'test-এ যাচাই: smoothing-এর পরও প্রতিটি প্রসঙ্গের বণ্টনের যোগফল ১।',
    ]),
    why: p('তিনটি মডেল (uniform, unigram, bigram) একই perplexity ফাংশনে চালানো হয়েছে যাতে তুলনা ন্যায্য হয়। train ও val দুটোই দেখানো হয়েছে: k কমালে train PPL একটানা কমে (১০.৪১ → ১.৮৯), কিন্তু val PPL k = ০.০১-এ সর্বনিম্ন (৪.১৯) হয়ে আবার বাড়ে (k = ০.০০০১-এ ৬.২৮)—অধ্যায় ৪-এর overfitting-এর language-model রূপ।'),
    remember: ['add-k: (C + k)/(C_আগের + kV)', 'cross-entropy = গড় −log p', 'PPL = e^CE; কম ভালো', 'k validation দিয়ে বাছুন, test দিয়ে নয়'],
    skip: ['Kneser–Ney smoothing (সূত্রে)', 'interpolation-এর weight শেখা', 'bits-per-character'],
    experiment: p('val-এ একটি সম্পূর্ণ ভিন্ন বিষয়ের বাক্য যোগ করুন (“আজ আবহাওয়া কেমন”)। প্রতিটি মডেলের val PPL কতটা বাড়ে? মডেল কি “জানে” এটি তার বিষয়ের বাইরে?'),
    mistakes: ['train perplexity দেখে মডেল বাছাই', 'ভিন্ন tokenizer-এর PPL তুলনা', 'smoothing-এ হরে kV যোগ করতে ভুলে যাওয়া (যোগফল ১ হয় না)', '&lt;unk&gt; ছাড়া অজানা শব্দে ক্র্যাশ'],
    quiz: [
      { q: 'V = ৫০, C(আগের) = ১০, C(আগের w) = ০, k = ১। P(w | আগের)?', a: { a: '০', b: '১/৬০', c: '১/৫০' }, ok: 'b', why: '(০ + ১)/(১০ + ৫০) = ১/৬০।' },
      { q: 'মডেলের cross-entropy ln ৪ ≈ ১.৩৮৬। perplexity কত?', a: { a: '১.৩৮৬', b: '৪', c: '০.২৫' }, ok: 'b', why: 'PPL = e^CE = e^(ln ৪) = ৪।' },
      { q: 'k = ০.০০১-এ train PPL খুব কম, val PPL বেশি। কী ঘটছে?', a: { a: 'মডেল training জোড়া মুখস্থ করছে, অদেখা জোড়ায় খুব কম সম্ভাব্যতা দিচ্ছে', b: 'মডেল নিখুঁত', c: 'val ভুল' }, ok: 'a', why: 'ছোট k দেখা ঘটনায় প্রায় সব সম্ভাব্যতা দেয়—overfitting-এর language model রূপ।' },
    ],
    recap: ['smoothing শূন্য সমস্যা দূর করে', 'perplexity = held-out মূল্যায়ন', 'baseline ও validation দিয়ে সৎ তুলনা'],
    nextNote: 'সব একসাথে—বাংলা-ইংরেজি next-token predictor প্রজেক্ট:',
    synthetic: true,
    sources: [SRC.jurafsky, ['Chen & Goodman — An Empirical Study of Smoothing Techniques for Language Modeling (1998)', 'https://dash.harvard.edu/handle/1/25104739']],
  },
  {
    id: 'les-06-06-project-ngram-predictor',
    slug: 'project-ngram-next-token',
    title: 'প্রজেক্ট: বাংলা-ইংরেজি N-gram Next-Token Predictor',
    minutes: 70,
    prereqs: ['les-06-05-smoothing-perplexity'],
    summary: 'সিন্থেটিক দোকান-কথোপকথন; trigram → bigram → unigram interpolation; top-3 সাজেশন; greedy generation; held-out perplexity তুলনা; মুখস্থ-পুনরাবৃত্তি শনাক্ত; সৎ সীমাবদ্ধতা।',
    overview: p('এই প্রজেক্টে দোকানের গ্রাহক-বার্তার একটি ছোট, স্পষ্টভাবে সিন্থেটিক বাংলা ও ইংরেজি corpus থেকে trigram language model বানাব। Trigram দুটি আগের token দেখে, কিন্তু ডেটা কম হলে অনেক প্রসঙ্গ অদেখা থাকে—তাই trigram, bigram ও unigram-কে weight দিয়ে মেশাব (interpolation)। মডেলটি টাইপ করার সময় পরের ৩টি শব্দ সাজেস্ট করবে, greedy পদ্ধতিতে বাক্য তৈরি করবে, এবং validation perplexity-তে bigram ও unigram-এর সাথে তুলনা হবে। শেষে পরীক্ষা করব তৈরি বাক্য training থেকে হুবহু কপি কিনা—ছোট মডেলের সাধারণ সমস্যা।'),
    objectives: ['interpolated trigram মডেল বানিয়ে validation দিয়ে weight বাছাই করতে পারবেন', 'top-k সাজেশন ও greedy generation বানাতে পারবেন', 'মুখস্থ-পুনরাবৃত্তি শনাক্ত করে মডেলের সীমাবদ্ধতা সৎভাবে লিখতে পারবেন'],
    problem: p('দোকানের চ্যাট-বক্সে গ্রাহক “ঢাকার বাইরে” লিখলে পরের শব্দ সাজেস্ট করতে চান। bigram শুধু “বাইরে” দেখে; trigram “ঢাকার বাইরে” দেখে—বেশি প্রসঙ্গ, কিন্তু ডেটায় এই জোড়া কম। দুটির সুবিধা একসাথে পাওয়া যায় কি? আর সাজেশন যদি শুধু training বাক্য কপি করে, তাহলে এটি “ভাষা শিখেছে” বলা যায় কি?'),
    explain:
      p(`${term('ইন্টারপোলেশন', 'interpolation')}: P(w | u, v) = λ₃ P₃(w | u, v) + λ₂ P₂(w | v) + λ₁ P₁(w), যেখানে λ₁ + λ₂ + λ₃ = ১। trigram অদেখা হলে bigram ও unigram সম্ভাব্যতা দেয়। λ validation perplexity দেখে বাছাই।`) +
      p(`${term('গ্রিডি ডিকোডিং', 'greedy decoding')}: প্রতিটি ধাপে সর্বোচ্চ সম্ভাব্য token নেওয়া, &lt;eos&gt; বা সর্বোচ্চ দৈর্ঘ্য পর্যন্ত। সহজ ও নির্ধারিত, কিন্তু প্রায়ই পুনরাবৃত্তিমূলক (অধ্যায় ৯-এ sampling)।`) +
      p('<strong>মুখস্থ-পরীক্ষা:</strong> তৈরি বাক্য training-এ হুবহু আছে কিনা। ছোট n-gram মডেল প্রায়ই training বাক্যই ফেরত দেয়—এটি “বোঝা” নয়, পুনরুৎপাদন। বড় LLM-ও training ডেটার অংশ মুখস্থ করতে পারে, যা গোপনীয়তা ও কপিরাইট ঝুঁকি।') +
      warn('<strong>কী প্রমাণ করে না:</strong> এই মডেল শব্দের ক্রম-পরিসংখ্যান শেখে, অর্থ নয়। এটি সত্য-মিথ্যা যাচাই করে না, নতুন প্রশ্নের উত্তর জানে না, এবং corpus-এর বাইরের বিষয়ে অর্থহীন। ৩৬টি সিন্থেটিক বাক্যের perplexity বাস্তব গ্রাহক-বার্তায় কার্যকারিতা প্রমাণ করে না।'),
    analogy: {
      text: 'Interpolation হলো তিনজন পরামর্শদাতার মতামত মেশানো: একজন বিশেষজ্ঞ (trigram, নির্দিষ্ট কিন্তু অনেক প্রশ্নে চুপ), একজন সাধারণ জ্ঞানী (bigram), একজন যিনি শুধু জানেন কোন শব্দ সাধারণ (unigram)।',
      breaks: 'মানুষ পরামর্শদাতারা প্রশ্ন অনুযায়ী কাকে বেশি বিশ্বাস করবেন তা বদলান; সরল interpolation-এ λ সব প্রসঙ্গে একই—“বিশেষজ্ঞ এই প্রশ্ন জানেন কিনা” বিবেচনা করে না।',
    },
    worked:
      p('প্রসঙ্গ “ঢাকার বাইরে”, প্রার্থী “ডেলিভারি”। ধরি P₃ = ০.৬৭, P₂ = ০.৫, P₁ = ০.০৪, λ = (০.৬, ০.৩, ০.১)।') +
      ol([
        'P = ০.৬ × ০.৬৭ + ০.৩ × ০.৫ + ০.১ × ০.০৪ = ০.৪০২ + ০.১৫ + ০.০০৪ = ০.৫৫৬।',
        'অদেখা প্রসঙ্গে P₃ = ০ হলেও P = ০.৩ × P₂ + ০.১ × P₁ > ০।',
      ]),
    activity: p('<strong>প্রজেক্ট মানদণ্ড:</strong> (১) তিনটি λ সেটের validation perplexity এবং সেরাটি বাছাইয়ের যুক্তি, (২) ৪টি প্রসঙ্গে top-3 সাজেশন, (৩) greedy বাক্য ও মুখস্থ-পরীক্ষার ফল, (৪) “এই মডেল কী পারে না” তিনটি বাক্যে।'),
    code: [
      {
        label: 'প্রজেক্ট: interpolated trigram predictor (সিন্থেটিক corpus)',
        starter: String.raw`// ---- সিন্থেটিক corpus (আমাদের লেখা, বাস্তব গ্রাহকের নয়) ----
const TRAIN = [
  "ঢাকায় ডেলিভারি চার্জ কত", "ঢাকার বাইরে ডেলিভারি চার্জ কত", "ঢাকার বাইরে ডেলিভারি কত দিন লাগে", "ঢাকায় ডেলিভারি কত দিন লাগে",
  "আমার অর্ডার কোথায় আছে", "আমার অর্ডার কবে আসবে", "অর্ডার কনফার্ম হয়েছে কি", "পণ্য ফেরত দিতে চাই",
  "পণ্য ফেরত দেওয়া যাবে কি", "এই পণ্যের দাম কত", "এই পণ্যের রং কয়টা আছে", "ক্যাশ অন ডেলিভারি আছে কি",
  "সাইজ বদল করা যাবে কি", "আমার পার্সেল কোথায় আছে", "ডেলিভারি চার্জ কি ফ্রি", "অর্ডার বাতিল করতে চাই",
  "where is my order", "where is my parcel", "what is the delivery charge", "what is the price of this item",
  "how many days for delivery", "how many days for delivery outside dhaka", "can i return this item", "can i change the size",
  "is cash on delivery available", "i want to cancel my order", "i want to return this item", "is delivery free in dhaka",
];
const VAL = ["ঢাকার বাইরে ডেলিভারি চার্জ কি ফ্রি", "আমার পার্সেল কবে আসবে", "where is my delivery", "can i return my order", "এই পণ্যের সাইজ বদল করা যাবে কি", "what is the delivery charge outside dhaka"];

const tok = (s) => ["<bos>", "<bos>", ...s.toLowerCase().replace(/[?!,।.]/g, " ").split(/\s+/).filter(Boolean), "<eos>"];
const vocab = new Set(["<unk>", "<eos>"]);
TRAIN.forEach((s) => tok(s).slice(2).forEach((t) => vocab.add(t)));
const V = vocab.size, norm = (t) => (vocab.has(t) || t === "<bos>" ? t : "<unk>");

const c1 = new Map(), c2 = new Map(), c3 = new Map(), h1 = new Map(), h2 = new Map();
let N = 0;
const inc = (m, k) => m.set(k, (m.get(k) || 0) + 1);
for (const s of TRAIN) {
  const t = tok(s);
  for (let i = 2; i < t.length; i++) {
    inc(c1, t[i]); N++;
    inc(c2, t[i - 1] + " " + t[i]); inc(h1, t[i - 1]);
    inc(c3, t[i - 2] + " " + t[i - 1] + " " + t[i]); inc(h2, t[i - 2] + " " + t[i - 1]);
  }
}
const P1 = (w) => ((c1.get(w) || 0) + 1) / (N + V);
const P2 = (w, v) => (h1.get(v) ? (c2.get(v + " " + w) || 0) / h1.get(v) : 0);
const P3 = (w, u, v) => (h2.get(u + " " + v) ? (c3.get(u + " " + v + " " + w) || 0) / h2.get(u + " " + v) : 0);
const model = ([l3, l2, l1]) => (w, u, v) => l3 * P3(w, u, v) + l2 * P2(w, v) + l1 * P1(w);

function ppl(m, texts) {
  let nll = 0, n = 0;
  for (const s of texts) { const t = tok(s).map(norm); for (let i = 2; i < t.length; i++) { nll -= Math.log(m(t[i], t[i - 2], t[i - 1])); n++; } }
  return Math.exp(nll / n);
}
const r2 = (x) => Math.round(x * 100) / 100;
const configs = { "unigram": [0, 0, 1], "bigram+uni": [0, 0.9, 0.1], "tri .6/.3/.1": [0.6, 0.3, 0.1], "tri .3/.5/.2": [0.3, 0.5, 0.2] };
const scores = {};
for (const [name, l] of Object.entries(configs)) { scores[name] = ppl(model(l), VAL); console.log(name.padEnd(13), "val PPL", r2(scores[name]), "| train PPL", r2(ppl(model(l), TRAIN))); }
const bestName = Object.keys(scores).sort((a, b) => scores[a] - scores[b])[0];
const best = model(configs[bestName]);
console.log("সেরা (validation অনুযায়ী):", bestName, "| V =", V);

// ---- top-3 সাজেশন ----
function suggest(prefix, k = 3) {
  const t = tok(prefix).slice(0, -1).map(norm);
  const u = t[t.length - 2], v = t[t.length - 1];
  return [...vocab].filter((w) => w !== "<unk>").map((w) => [w, best(w, u, v)]).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, k);
}
for (const pre of ["ঢাকার বাইরে", "আমার অর্ডার", "where is", "can i"]) console.log("«" + pre + "» →", suggest(pre).map(([w, p]) => w + "(" + r2(p) + ")").join(", "));

// ---- greedy generation + মুখস্থ-পরীক্ষা ----
function greedy(prefix, maxLen = 10) {
  const words = prefix.split(" ");
  for (let i = 0; i < maxLen; i++) { const [w] = suggest(words.join(" "), 1)[0]; if (w === "<eos>") break; words.push(w); }
  return words.join(" ");
}
const trainSet = new Set(TRAIN);
for (const pre of ["ঢাকার বাইরে", "i want", "এই পণ্যের"]) { const g = greedy(pre); console.log("greedy «" + pre + "» →", g, trainSet.has(g) ? "[training-এ হুবহু আছে]" : "[নতুন ক্রম]"); }
`,
        expect: ['unigram', 'সেরা (validation অনুযায়ী):', '«ঢাকার বাইরে» → ডেলিভারি(', 'greedy «ঢাকার বাইরে» →'],
        hints: ['unigram-এর val PPL সবচেয়ে বেশি কেন? সে প্রসঙ্গ দেখে না।', 'train PPL ও val PPL-এর ফাঁক কোন কনফিগে সবচেয়ে বেশি? অধ্যায় ৪-এর overfitting মনে করুন।', 'greedy বাক্যগুলোর কয়টি training-এ হুবহু আছে? এটি কী বলে?', '“where is my delivery”—“delivery” training-এ আছে, কিন্তু “my delivery” জোড়া নেই। trigram ও bigram ০ দিলে কে সম্ভাব্যতা দেয়?'],
        test: '__assert(scores["unigram"]>scores[bestName],"best beats unigram"); __assert(bestName!=="unigram","context helps"); var s=0; vocab.forEach(function(w){ s+=best(w,"<bos>","ঢাকার"); }); __close(s,1,1e-9,"interpolated dist sums 1 (seen ctx)"); var s2=0; vocab.forEach(function(w){ s2+=model([0,0,1])(w,"x","y"); }); __close(s2,1,1e-9,"unigram sums 1"); __assert(isFinite(ppl(best,VAL)),"no zero probs on val"); __assert(scores["unigram"]>40&&scores[bestName]<6,"ppl quoted"); __assert(["ঢাকার বাইরে","i want","এই পণ্যের"].every(function(p){return trainSet.has(greedy(p));}),"greedy copies quoted");',
      },
    ],
    line: ul([
      '<code>tok</code>: দুটি &lt;bos&gt;—trigram-এর প্রথম শব্দেরও দুটি প্রসঙ্গ-token থাকে।',
      '<code>c1, c2, c3</code>: unigram, bigram, trigram গণনা; <code>h1, h2</code>: তাদের প্রসঙ্গ-গণনা।',
      '<code>P2, P3</code>: প্রসঙ্গ অদেখা হলে ০ (smoothing নেই)—interpolation-এর unigram অংশ শূন্য ঠেকায়।',
      '<code>model([l3, l2, l1])</code>: λ দিয়ে মিশ্রণ; validation PPL দিয়ে সেরা বাছাই।',
      '<code>suggest</code>: সব vocabulary শব্দের সম্ভাব্যতা, সাজানো—সমান হলে অভিধানক্রম (নির্ধারিত)।',
      '<code>trainSet.has(g)</code>: মুখস্থ-পরীক্ষা।',
    ]),
    why: p('λ হাতে কয়েকটি বাছা হয়েছে এবং validation দিয়ে সেরাটি নির্বাচিত—test সেট আলাদা থাকলে চূড়ান্ত সংখ্যা সেখানে রিপোর্ট করতে হতো (এখানে ডেটা এত ছোট যে তৃতীয় ভাগ অর্থবহ নয়, এবং তা সীমাবদ্ধতা হিসেবে লেখা উচিত)। unigram-এ add-১ রাখা হয়েছে যাতে মিশ্রণ কখনো শূন্য না হয়—test-এ যাচাই।'),
    remember: ['interpolation: বিভিন্ন প্রসঙ্গ-দৈর্ঘ্যের মিশ্রণ', 'λ validation দিয়ে', 'greedy নির্ধারিত কিন্তু পুনরাবৃত্তিমূলক', 'মুখস্থ-পরীক্ষা ছোট মডেলে জরুরি'],
    skip: ['Kneser–Ney', 'beam search', 'neural language model (অধ্যায় ৭–৮-এর ভিত্তিতে, অধ্যায় ১৩-এ PyTorch)'],
    experiment: p('TRAIN-এ ১০টি নতুন বাক্য লিখুন (বাংলিশও রাখুন, যেমন “delivery charge koto”)। val PPL ও greedy বাক্য কীভাবে বদলায়? কোন নতুন সাজেশন এল?'),
    mistakes: ['λ-র যোগফল ১ না রাখা', 'train perplexity দেখে λ বাছাই', 'greedy আউটপুটকে মডেলের “বোঝা” ভাবা', 'মুখস্থ-পরীক্ষা ছাড়া তৈরি টেক্সট প্রকাশ'],
    solutionNote: p('QuickJS-এ চালানো ফল: unigram-এর val PPL ৫০.৩৬; bigram+uni ৫.৩৩; সেরা trigram মিশ্রণ (০.৩/০.৫/০.২) ৫.১৮। অর্থাৎ trigram যোগ করায় উন্নতি খুব সামান্য—৬টি validation বাক্যে এই পার্থক্য সম্ভবত অর্থবহ নয়, এবং এত ছোট corpus-এ বেশিরভাগ trigram প্রসঙ্গ একবারই দেখা। train PPL (২–২.৪) val-এর চেয়ে অনেক কম। তিনটি greedy বাক্যই training বাক্যের হুবহু কপি, কারণ প্রতিটি প্রসঙ্গে training-এর সবচেয়ে ঘনঘন ধারাবাহিকতাই সর্বোচ্চ। <strong>সীমাবদ্ধতা:</strong> (১) মডেল শুধু দেখা শব্দক্রম পুনর্বিন্যাস করে, অর্থ বোঝে না; (২) বাংলা ও ইংরেজি আলাদা ভাষা হিসেবে শেখেনি—শুধু token, তাই মিশ্র বাক্যে অনির্ভরযোগ্য; (৩) ৬টি validation বাক্যের PPL একটি খুব অনিশ্চিত মাপ।'),
    quiz: [
      { q: 'λ = (০.৫, ০.৩, ০.২), P₃ = ০, P₂ = ০.৪, P₁ = ০.১। P কত?', a: { a: '০.১৪', b: '০', c: '০.৫' }, ok: 'a', why: '০ + ০.৩ × ০.৪ + ০.২ × ০.১ = ০.১২ + ০.০২ = ০.১৪।' },
      { q: 'λ কোন ডেটা দেখে বাছাই করা উচিত?', a: { a: 'training', b: 'validation', c: 'test' }, ok: 'b', why: 'λ একটি hyperparameter; test সেট শুধু চূড়ান্ত মূল্যায়নে।' },
      { q: 'greedy generation training বাক্য হুবহু ফেরত দিচ্ছে। সবচেয়ে সঠিক ব্যাখ্যা?', a: { a: 'মডেল ভাষা বুঝেছে', b: 'ছোট corpus-এ প্রতিটি প্রসঙ্গের সর্বোচ্চ ধারাবাহিকতা training বাক্য থেকেই আসে—পুনরুৎপাদন', c: 'বাগ' }, ok: 'b', why: 'n-gram মডেল দেখা গণনার ওপর চলে; ডেটা কম হলে সর্বোচ্চ-সম্ভাব্য পথ প্রায়ই একটি training বাক্য।' },
    ],
    recap: ['একটি সম্পূর্ণ n-gram LM বানালেন', 'validation দিয়ে মিশ্রণ বাছাই', 'মুখস্থ ও সীমাবদ্ধতা সৎভাবে দেখালেন'],
    nextNote: 'n-gram শব্দকে আলাদা প্রতীক হিসেবে দেখে—“দাম” ও “মূল্য” সম্পর্কহীন। শব্দের অর্থকে vector-এ ধরা—embeddings:',
    synthetic: true,
    sources: [SRC.jurafsky, SRC.karpathyMakemore, ['Carlini et al. — Extracting Training Data from Large Language Models (USENIX Security 2021)', 'https://arxiv.org/abs/2012.07805']],
  },
];

export default { chapter, lessons };

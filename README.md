# WebGuideBD AI Academy

**বাংলায় practical AI ও LLM শেখার বিনামূল্যে প্ল্যাটফর্ম** — WordPress প্লাগইন হিসেবে [webguidebd.site](https://webguidebd.site/) এ চলে।

[![Live](https://img.shields.io/badge/live-webguidebd.site-04AA6D?style=flat-square)](https://webguidebd.site/)
[![WordPress](https://img.shields.io/badge/WordPress-6.4%2B-21759B?style=flat-square&logo=wordpress)](https://wordpress.org/)
[![PHP](https://img.shields.io/badge/PHP-8.1%2B-777BB4?style=flat-square&logo=php)](https://www.php.net/)
[![License](https://img.shields.io/badge/license-GPL--2.0--or--later-blue?style=flat-square)](plugin/webguidebd-ai-academy/webguidebd-ai-academy.php)

> ধারণা → উদাহরণ → অনুশীলন। W3Schools-এর মতো সহজ ফ্লো, বিষয়বস্তু AI engineering ও LLM।

---

## কেন এই প্রজেক্ট?

বাংলায় গভীর, সৎ, হাতে-কলমে AI শিক্ষা এখনও কম। এই কোর্স:

- **৯৩টি পাঠ** · **১৪ অধ্যায়** · **৫০টি শব্দকোষ**
- অধ্যায় **১–২ পাবলিক** (লগইন ছাড়া)
- অধ্যায় **৩–১৪** বিনামূল্যে — লগইন করে পূর্ণ পাঠ, কুইজ, অগ্রগতি
- ব্রাউজারেই **নিরাপদ JavaScript playground** (QuickJS worker)
- কোনো মিথ্যা রেটিং / স্টুডেন্ট কাউন্ট / উদ্ভাবিত ফোন নম্বর নেই

**লেখক:** [Muhibbullah Ansary](https://webguidebd.site/about/) · [YouTube](https://www.youtube.com/@learnwithmuhib)

---

## লাইভ দেখুন

| | |
|---|---|
| হোম | https://webguidebd.site/ |
| প্রথম পাঠ | https://webguidebd.site/ai-academy/lesson/ai-ki/ |
| রোডম্যাপ | https://webguidebd.site/ai-academy/roadmap/ |
| শব্দকোষ | https://webguidebd.site/ai-academy/glossary/ |

---

## পাঠ্যক্রম এক নজরে

| অধ্যায় | বিষয় | অ্যাক্সেস |
|--------:|------|----------|
| 1 | AI ও LLM পরিচিতি | Public |
| 2 | AI শেখার জন্য প্রয়োজনীয় JavaScript | Public |
| 3 | গণিতের ভিত্তি | Login |
| 4 | Machine Learning-এর ভিত্তি | Login |
| 5 | Neural Network ও Deep Learning | Login |
| 6 | Tokenization ও Language Modeling | Login |
| 7 | Embeddings ও Semantic Search | Login |
| 8 | Attention ও Transformer | Login |
| 9 | LLM Training ও Text Generation | Login |
| 10 | LLM Application Engineering | Login |
| 11 | Retrieval-Augmented Generation (RAG) | Login |
| 12 | Workflow, Agent ও Evaluation | Login |
| 13 | JavaScript থেকে Python ও PyTorch | Login |
| 14 | ক্যাপস্টোন: Engineering ও Research | Login |

বিস্তারিত ম্যাপ: [`docs/CURRICULUM_MAP.md`](docs/CURRICULUM_MAP.md) · স্ট্যাটাস: [`CURRICULUM_STATUS.md`](CURRICULUM_STATUS.md)

---

## রিপো লেআউট

```text
AI-Learning_Site/
├── plugin/webguidebd-ai-academy/   # ইনস্টলযোগ্য WordPress প্লাগইন
├── content-src/                    # পাঠের সোর্স (chNN.mjs, glossary)
├── assets-src/playground/          # রানার সোর্স (build করে প্লাগইনে যায়)
├── scripts/                        # build-content, zip, playground
├── docs/                           # curriculum map ও নোট
├── dist/                           # npm run zip → প্লাগইন ZIP (gitignore)
└── SETUP_AND_DEPLOYMENT.md         # ডিপ্লয় গাইড
```

---

## লোকাল বিল্ড

**প্রয়োজন:** Node 20+ (২৪.x পরীক্ষিত), PHP 8.1+, WordPress 6.4+

```bash
git clone https://github.com/muhib116/webguidebd-for-bangla-LLM-tutorial.git
cd webguidebd-for-bangla-LLM-tutorial

npm install
npm run build          # playground → plugin assets
npm run zip            # dist/webguidebd-ai-academy-<version>.zip
```

কন্টেন্ট রিবিল্ড (পাঠ/গ্লসারি এডিটের পর):

```bash
node scripts/build-content.mjs
```

> পাঠ এডিট করুন `content-src/` এ। জেনারেটেড `plugin/.../content/` সরাসরি হাত দিয়ে বদলাবেন না।  
> রানার এডিট করুন `assets-src/playground/` এ — `npm run build` পরে প্লাগইনে কপি হয়।

---

## WordPress এ আপলোড

1. `npm run zip` থেকে ZIP নিন  
2. **WP Admin → Plugins → Add New → Upload Plugin → Replace current**  
3. একবার যেকোনো wp-admin পেজ খুলুন (রিরাইট/সিড ট্রিগার)  
4. প্রয়োজনে **Settings → Permalinks → Save**  
5. পেজ ক্যাশ পার্জ করুন  

বিস্তারিত চেকলিস্ট: [`SETUP_AND_DEPLOYMENT.md`](SETUP_AND_DEPLOYMENT.md)

### অ্যাডমিন সেটিংস (সংক্ষেপ)

- মেইন ডোমেইনে Academy হোম (`/` = Academy; `/ai-academy/` → `/`)
- পাবলিক প্রিভিউ অধ্যায়: ডিফল্ট Ch1–2
- লেখক ফোন / YouTube / LinkedIn · সাইট প্রোফাইল

---

## ফিচার হাইলাইট

- **অ্যাক্সেস কন্ট্রোল** — পাবলিক ওভারভিউ বনাম পূর্ণ বডি; restricted PHP সরাসরি ৪০৩  
- **প্রোগ্রেস** — রিডিং, কুইজ, প্র্যাকটিস · লগইন ইউজারের জন্য  
- **Playground** — লাইন নম্বর, সিনট্যাক্স হাইলাইট, Tab autocomplete, timeout/memory সীমা  
- **কুইজ ইঞ্জিন** — REST গ্রেডিং  
- **SEO** — canonical, Course JSON-LD, `/ai-academy/sitemap.xml`, `/llms.txt`  
- **ব্র্যান্ড UI** — লাইট/ডার্ক থিম, Web Guide BD লোগো, বাংলা UI  

আর্কিটেকচার নোট: [`DECISIONS.md`](DECISIONS.md)

---

## ডেভেলপমেন্ট নোট

| কাজ | কমান্ড / পথ |
|-----|-------------|
| প্লাগইন ভার্সন | `plugin/.../webguidebd-ai-academy.php` → `WGBA_VERSION` |
| ZIP বানানো | `npm run zip` |
| JS উদাহরণ যাচাই | `build-content.mjs` (QuickJS) |
| Python আউটপুট (Ch13–14) | `node scripts/run-python.mjs` — দেখুন SETUP ডক |
| চলমান কাজ | [`CONTINUE.md`](CONTINUE.md) |

---

## লাইসেন্স

প্লাগইন কোড **GPL-2.0-or-later** (WordPress প্লাগইন হিসেবে)।  
কোর্স কন্টেন্ট © Muhibbullah Ansary / Web Guide BD — সাইটে প্রকাশিত শর্ত অনুযায়ী।

---

## কন্ট্রিবিউশন

বাগ রিপোর্ট বা প্যাচ স্বাগত। পাঠের বিষয়বস্তু বদলাতে চাইলে আগে ইস্যু খুলুন — শিক্ষামূলক সততা (কোনো মিথ্যা পরিসংখ্যান/রেটিং নয়) অপরিবর্তনীয় নীতি।

---

<p align="center">
  <strong>Web Guide BD</strong> · বাংলায় শেখা চলুক<br/>
  <a href="https://webguidebd.site/">webguidebd.site</a>
</p>

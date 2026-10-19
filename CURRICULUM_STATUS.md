# CURRICULUM_STATUS

**Course:** `course-ai-llm-bengali-v1` · **Author:** Muhibbullah Ansary · **Schema:** 1.0.0
**Updated:** 2026-10-20 · **Source of truth:** `content-src/` → `node scripts/build-content.mjs`
**Lesson-level map (generated):** `docs/CURRICULUM_MAP.md`
**Live:** 0.1.9 — Ch1–2 public; Ch3–14 full bodies for logged-in learners (subscriber path checked).

## Counts

All 93 lessons are authored to the lesson contract and pass the build. On webguidebd.site, guests get Ch1–2; Ch3–14 require login.

| Ch | Title | Access | Lessons | JS runs | Python | Quiz Qs | Synthetic-data lessons |
|---:|-------|--------|--------:|--------:|-------:|--------:|-----------------------:|
| 1 | AI ও LLM পরিচিতি | public | 8 | 1 | 0 | 23 | 2 |
| 2 | AI শেখার জন্য প্রয়োজনীয় JavaScript | public | 7 | 7 | 0 | 22 | 4 |
| 3 | গণিতের ভিত্তি | login | 8 | 8 | 0 | 25 | 7 |
| 4 | Machine Learning-এর ভিত্তি | login | 8 | 9 | 0 | 25 | 8 |
| 5 | Neural Network ও Deep Learning | login | 7 | 7 | 0 | 21 | 1 |
| 6 | Tokenization ও Language Modeling | login | 6 | 6 | 0 | 18 | 5 |
| 7 | Embeddings ও Semantic Search | login | 5 | 5 | 0 | 15 | 5 |
| 8 | Attention ও Transformer | login | 5 | 5 | 0 | 15 | 5 |
| 9 | LLM Training ও Text Generation | login | 6 | 6 | 0 | 18 | 6 |
| 10 | LLM Application Engineering | login | 7 | 12 | 0 | 21 | 7 |
| 11 | Retrieval-Augmented Generation (RAG) | login | 7 | 8 | 0 | 21 | 7 |
| 12 | Workflow, Agent ও Evaluation | login | 6 | 8 | 0 | 18 | 6 |
| 13 | JavaScript থেকে Python ও PyTorch | login | 7 | 7 | 7 | 21 | 7 |
| 14 | ক্যাপস্টোন: Engineering ও Research | login | 6 | 8 | 1 | 18 | 6 |
| | **Total** | | **93** | **101** | **8** | **281** | **76** |

Glossary: 50 terms (`content-src/glossary.mjs`), each linked to a teaching lesson.

## How numbers are verified

- **JavaScript:** every example runs in QuickJS during the build (same engine as the site runner). 330 assertions pin the printed numbers; the build fails on any mismatch, timeout, or prerequisite out of order.
- **Python (Ch13–14):** `node scripts/run-python.mjs` executes `content-src/python/**.py` and stores output with a sha256 of each source. Chapter files read output through `py()`, which throws if the source changed without a re-run. `--check` re-ran all 8 scripts on 2026-10-19 and matched.
- **Synthetic data:** lessons that use invented records, corpora, vectors, logits or weights carry `synthetic: true`, which prints a visible label in the lesson and is listed in `curriculum.json`. Lessons without the flag use no dataset (definitions, math identities, basic JS values).

## Not done / limits

- No independent subject-matter review of any lesson.
- Python verified on one machine only: macOS 26.6.1 arm64, Python 3.9.6, PyTorch 2.8.0, NumPy 2.0.2. Windows, Linux and CUDA untested; the lessons say so.
- Source links: 113/115 reachable on 2026-10-19. `dl.acm.org` (403) and `dash.harvard.edu` (timeout) block automated checks; not verified as broken or working.
- No current commercial model IDs, API prices or provider endpoints are named; Ch10–14 use simulated providers. The only named model is GPT-2 (Ch6, Ch8) as a published historical architecture; its 124,439,808 parameter total is computed from the formula in QuickJS.
- Ch3–14 are not live until 0.1.6 is uploaded and seeded.

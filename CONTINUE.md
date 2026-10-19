# CONTINUE

**Updated:** 2026-10-20 · **ZIP ready:** `dist/webguidebd-ai-academy-0.1.18.zip` (mobile-friendly pass; phone `01770989591`; footer; About/Contact in subnav) · **Live last seen:** 0.1.15 · Production gate: **HOLD** until upload

### Mobile verify (local harness @ 390×844, CSS 0.1.18)
- horizontal overflow: **no** (`sw===cw===390`)
- top bar overlap: **no** (brand + theme + Login only; About/Contact in dark subnav)
- hero CTAs full-width stacked; lesson pager column; sidebar toggle shown

## Live checklist (0.1.9) — done this pass

| Check | Result |
|-------|--------|
| Plugin version | passed (AI Academy admin: প্লাগইন 0.1.9) |
| Domain home = Academy | passed (`/` + `wgba-body`; home copy login CTA, no “প্রকাশিত হচ্ছে”) |
| `/ai-academy/` → `/` | passed earlier (301); still intended |
| Guest Ch1 full body | passed (prior) |
| Guest Ch3 overview only + noindex | passed (prior) |
| Subscriber register | passed (`learner_live_check`, role Subscriber) |
| Subscriber Ch3 full body | passed (`scalar-vector` sections + playground; not gated) |
| Subscriber reading progress | passed (REST `progress/reading` → `reading_complete:1` for `les-03-01-scalars-vectors`) |
| Quiz grade | passed (`values-types` 3/3 — উত্তীর্ণ; guest + logged-in) |
| 14.5 Run (8s) | passed (`research-methods-seeds-variance`; seed table + ✓ match) |
| Glossary 50 / sitemap Ch1–2 / restricted 403 | passed (prior 0.1.8 pass) |
| Mobile ~390px home | passed (no page horizontal overflow) |
| Mobile table lesson | passed (page no overflow; tables `overflow-x: auto` inside wrap) |
| Password-reset form | passed (UI `wgba_msg=sent` generic message) |
| Password-reset inbox delivery | **not verified** (example.com test address; host mail unconfirmed) |

## Production review (live probe 2026-10-20)

| Gate | Live evidence | Status |
|------|---------------|--------|
| Plugin version | CSS `?ver=0.1.9`; home HTML `0.1.9` | **FAIL** vs repo `0.1.13` |
| Home Academy shell | `wgba-body` + `wgba-home-hero` + 14 tut items | PASS (0.1.9) |
| Guest Ch1 body | `ai-ki` → article, no lock | PASS |
| Guest Ch3 gate | `scalar-vector` → `wgba-lock` + `noindex` | PASS |
| Restricted PHP | direct URL → **403** | PASS |
| Roadmap ghosts | 8× `এখনও প্রকাশিত` among ~22 cards | **FAIL** (fixed in ≥0.1.10 seed/list) |
| About/Contact brand | `/about/`, `/contact-us/`, `/ai-academy/contact/` → Elementor | **FAIL** (needs ≥0.1.12 hijack live) |
| Footer upgrade | old thin footer; link → `/contact-us/` Elementor | **FAIL** vs 0.1.12+ footer |
| UI consistency | live CSS has no `.wgba-page-hero` | **FAIL** until 0.1.13 |
| Academy sitemap | `/ai-academy/sitemap.xml` 200; Ch1–2 lessons listed | PASS |
| robots.txt | only `wp-sitemap.xml` (not Academy sitemap) | WARN |
| Password-reset inbox | never proven on real mailbox | OPEN |
| Expert content review | not done | OPEN |

**Ship gate:** upload `dist/webguidebd-ai-academy-0.1.13.zip` → replace → AI Academy admin shows **0.1.13** → re-seed/trash drafts if ghosts remain → re-probe About/Contact/Roadmap/footer.

## Still optional / not claimed

- Independent content review; two-account isolation A≠B; full a11y/perf audit
- Author photo Media ID in settings (bundle JPG ships in 0.1.12+)
- Confirm reset email arrives in a real inbox
- Orphan test user from REST create (`wgba_learner_*`) — delete in WP Users if unwanted
- Add Academy sitemap URL to `robots.txt` (optional)

## Not claimed done

- Mail A/B isolation; expert curriculum review; production mail proof
- Live = 0.1.13 UI / brand pages

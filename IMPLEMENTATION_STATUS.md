# IMPLEMENTATION_STATUS — WebGuideBD AI Academy

**Updated:** 2026-10-20
**Live version observed:** 0.1.9 (AI Academy admin line: প্লাগইন 0.1.9). Content seeded (93 lessons, 50 glossary). Homepage = Academy; Ch1–2 public; Ch3–14 login; subscriber path verified live.

## Milestones

| Milestone | Status | Evidence |
|-----------|--------|----------|
| A Inventory + ADR + schema | passed | `DECISIONS.md`, `content/schema/curriculum.json` (generated) |
| B Platform vertical slice | passed (live) | Auth, access, progress, REST, quiz, runner on live |
| C Public Ch1–2 + SEO | passed (live) | Guest lessons, sitemap public-only, gated noindex |
| D Ch3–14 authoring | passed (live + package) | Bodies live behind login; subscriber Ch3 + Ch14.5 checked 2026-10-20 |
| E Distribution, a11y, perf | partial | ZIP 0.1.9; mobile 390px spot-check passed; full a11y/perf audit not run |

## What 0.1.9 adds (on top of 0.1.8)

- Home copy: login CTA for Ch3–14 instead of “coming soon / প্রকাশিত হচ্ছে” line (`route-home.php` + `Access` messages).

## Requirement → evidence matrix

Status words: **passed** = observed; **implemented** = code exists, not observed end-to-end; **partial**; **not verified**.

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| R1 | Ch1–2 readable by guests | passed | Prior + still public |
| R2 | Ch3–14 bodies never sent to guests | passed | Guest gate + restricted file 403 (prior); subscriber sees body |
| R3 | Restricted overview + noindex | passed | Prior 0.1.8 |
| R5 | Registration → subscriber only | passed | Frontend register → `learner_live_check` Subscriber |
| R6 | Safe return URL | implemented | `Access::sanitize_return_url` |
| R7 | Logout / reset / mail | partial | Logout + reset form `sent` UI passed; inbox delivery not verified |
| R8 | Learner A ≠ B isolation | implemented | REST scoped to user; two-account test not run |
| R10 | Progress semantics | passed | Reading complete REST 200; dashboard exercise checkpoint after Run |
| R11 | Server-side quiz grading | passed | `স্কোর: 3/3 — উত্তীর্ণ` on `values-types` |
| R12 | Runner Run/Stop/timeout | passed | 14.5 live ✓; async prior |
| R13 | Runner isolation | implemented | Worker + QuickJS; abuse suite not run |
| R14 | Numbers actually executed | passed (build) | QuickJS build asserts + Python `--check` |
| R15 | Synthetic data labelled | passed (build) | Flags + labels |
| R16 | Sources cited | partial | Prior link check |
| R17 | Sitemap / indexing | passed | Public lessons only (0.1.7+) |
| R18 | Ads, tutor, analytics off | passed | Defaults off |
| R19 | Ch14 honesty statement | passed (content) | 14.1 / 14.6 |
| R22 | All 14 chapters complete | passed (live content) | Independent expert review **not done** |

## Known limits (honest)

- Python ran only on the author's machine (macOS, Python 3.9.6, PyTorch 2.8.0, NumPy 2.0.2). Windows/Linux/CUDA untested.
- No independent subject-matter review.
- Reset-email **inbox** delivery not proven.
- Author photo not set (initials placeholder).

## Next actions

1. Optional: delete throwaway WP users created during testing.
2. Optional: send reset to a real inbox and confirm Hostinger mail.
3. Optional: a11y/perf pass; author photo.

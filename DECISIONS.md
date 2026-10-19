# Architecture Decision Record — WebGuideBD AI Academy

**Date recorded:** 2026-10-19  
**Site inspected:** https://webguidebd.site/ (admin session verified in Cursor browser)

## Inventory summary

| Item | Finding |
|------|---------|
| WordPress | 7.1.3 (footer + Site Health) |
| Host path | `/home/agrigqla/webguidebd.site/` (plugin help text) |
| Active theme | Hello Elementor (Hello menu + Elementor site builder) |
| Active plugins | Elementor, Ultimate Addons for Elementor (UAE), Easy MCP AI, AI Provider for Anthropic |
| Inactive | Akismet, Hello Dolly |
| LMS / membership / SEO plugin | None installed |
| Multisite | Not indicated in admin UI |
| Existing pages | Home, About Us, Contact Us, Privacy Policy, Affiliate Disclosure |
| Staging / SSH from this workspace | Not available; Hostinger MCP `needsAuth` |
| Local repo | Empty at start; plugin built here as installable package |

## ADR-001: Custom plugin, not overlapping LMS

**Decision:** Implement focused custom plugin `webguidebd-ai-academy` (“WebGuideBD AI Academy”).  
**Why:** No suitable LMS/membership stack is present. Installing LearnDash/Tutor/MemberPress would add overlapping auth and paid-license friction without need.  
**Consequence:** Course CPTs, access, progress, playground, and admin live in one namespaced plugin. Hello Elementor + Elementor remain for the rest of the site.

## ADR-002: Content storage

**Decision:** Curriculum entities as WordPress CPTs (`wgba_chapter`, `wgba_lesson`, `wgba_glossary`, `wgba_project`) with stable IDs in post meta (`_wgba_stable_id`). Lesson bodies in post content + structured meta JSON for exercises/quizzes.  
**Why:** Editable in WP admin without PHP edits; revisions; REST-compatible; maps to Course→Chapter→Lesson hierarchy.  
**Restricted content:** Seed packages for Ch3–14 live under `content/restricted/` with deny-direct-HTTP rules; activation/admin import copies into DB. After install, public HTTP must not serve restricted bodies from plugin files.

## ADR-003: Learner records in custom tables

**Decision:** Prefix-aware custom tables for progress, notes, bookmarks, code drafts, questions/replies, quiz attempts. Schema version option + upgrade routines.  
**Why:** Anticipated per-user write volume and reporting exceed a single options JSON blob; unique constraints prevent duplicate rows; owner-scoped queries stay efficient.

## ADR-004: Access / public preview

**Decision:** Public-preview chapters stored as stable chapter IDs in option `wgba_public_preview_chapters` (default: `ch-01-ai-llm-intro`, `ch-02-js-fundamentals`). Access engine checks stable IDs, not display order. Changing preview set requires intentional admin save and cache invalidation.  
**Server enforcement:** HTML templates, REST, downloads, feeds, search excerpts, and JSON-LD all call `WGBA_Access`. Guests never receive restricted lesson bodies.

## ADR-005: Routes and indexing

**Decision:** Pretty permalinks under `/ai-academy/`:

- `/ai-academy/` course home  
- `/ai-academy/chapter/{slug}/` overview  
- `/ai-academy/lesson/{slug}/` lesson (same URL for guest overview vs authenticated body)  
- `/ai-academy/dashboard/`, `/ai-academy/login/`, etc. account routes → `noindex`

Guests and crawlers get identical public overview at restricted lesson URLs. Authenticated users get private/no-store body. Sitemap includes only indexable public URLs (plugin-built until a dedicated SEO plugin is added).

## ADR-006: JavaScript runner isolation

**Decision:** QuickJS (WASM) inside a dedicated Worker via `quickjs-emscripten` / singlefile build. Host exposes only schema-validated messages and bounded console text. No browser globals, storage, cookies, or network bridged into guest. Timeout default 3s; Stop terminates worker and spins a fresh runtime.  
**Not used:** same-origin Worker + `eval`/`Function` as sole isolation; iframe with `allow-scripts` + `allow-same-origin`.

## ADR-007: Progress semantics

Three distinct states: reading complete (explicit), practice checkpoint, assessed skill. Opening/scrolling/running code does not auto-complete reading. Quizzes graded server-side. Browser checks labeled formative.

## ADR-008: Optional services

AdSense and AI tutor settings exist but **disabled by default**. No provider requests until configured. Analytics not enabled by this plugin.

## ADR-009: Rollback path

1. Deactivate plugin (preserves tables/CPT data).  
2. Delete plugin files if needed (uninstall does **not** drop data unless explicit admin purge).  
3. Keep installable ZIP + git history in this repo as restore artifacts.  
**Note:** Live hosting backup/restore was **not** verified from this environment (no confirmed hosting backup API session).

## ADR-010: Content is built from source, not edited in WP

**Decision:** Lessons, chapters and glossary are authored in `content-src/` and compiled by `scripts/build-content.mjs` into PHP seeds. The build runs every JavaScript example in QuickJS with assertions and fails on mismatch, prerequisite order, or missing lesson-contract parts.
**Consequence:** The seeder fingerprint is `stable_id | content_version | content_hash`. A source edit changes the hash, so the next plugin upgrade rewrites that lesson. Edits made directly in WP admin to a seeded lesson are overwritten on the next upgrade that changes the source for that lesson; edit the source instead.

## ADR-011: Python examples are executed off-site and pinned

**Decision:** The site never runs Python. Ch13–14 Python sources live in `content-src/python/`, are executed by `scripts/run-python.mjs`, and their stdout is stored with a sha256 of the source. Lessons display that output with the exact environment (OS, Python, PyTorch, NumPy versions).
**Why:** The brief forbids unexecuted numbers; a server-side Python sandbox is out of scope for shared hosting.
**Limit:** One machine (macOS arm64). Other platforms may differ in final decimals; lessons state this.

## ADR-012: Runner source of truth and per-exercise timeout

**Decision:** `assets-src/playground/` is canonical; `npm run build` copies it into the plugin. Default timeout 3 s, per-exercise `timeout_ms` allowed (worker clamps 100 ms–10 s), enforced by QuickJS interrupt handler, with a host watchdog that terminates the Worker 4 s after the deadline.
**Why:** 0.1.4 shipped an older runner copy without promise-job draining (code inspection), so output after the first `await` in `async` examples would not be collected; its `setTimeout` timeout also could not interrupt a synchronous loop inside the Worker.

## Compatibility pins (development)

- WordPress: tested target 7.1.x (live)  
- PHP: ≥ 8.1 (local CLI 8.3.30)  
- Node build: 24.x for playground assets  

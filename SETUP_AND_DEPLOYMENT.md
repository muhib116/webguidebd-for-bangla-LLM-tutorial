# SETUP_AND_DEPLOYMENT

## Local build

```bash
cd /Users/muhib/Desktop/project/AI-Learning_Site
npm install
npm run build                          # copies assets-src/playground → plugin, bundles QuickJS
node scripts/build-content.mjs         # validates + runs all JS examples, writes PHP seeds,
                                       # glossary, curriculum.json, docs/CURRICULUM_MAP.md
node scripts/build-content.mjs --check-links   # optional, needs network
npm run zip                            # dist/webguidebd-ai-academy-<version>.zip (version read from plugin header)
```

Edit runner code in `assets-src/playground/`, never in `plugin/.../assets/js/playground/` (overwritten by `npm run build`). Edit lessons in `content-src/chNN.mjs` and glossary in `content-src/glossary.mjs`, never the generated PHP.

### Python examples (Ch13–14)

```bash
python3 -m venv /tmp/wgba-venv
/tmp/wgba-venv/bin/pip install torch==2.8.0 numpy==2.0.2
PATH=/tmp/wgba-venv/bin:$PATH node scripts/run-python.mjs          # run + write outputs.json
PATH=/tmp/wgba-venv/bin:$PATH node scripts/run-python.mjs --check  # re-run, compare with stored
```

Then rebuild content. The build refuses a Python block whose source hash differs from `outputs.json`.

**Pins:** Node 24.x, PHP 8.1+ (lint with 8.3), WordPress 7.1.x, `quickjs-emscripten` 0.32, Python 3.9.6 / PyTorch 2.8.0 / NumPy 2.0.2 for Python output.

## Academy as the domain homepage

From **0.1.8**, AI Academy can replace the WordPress/Elementor front page:

1. Upload `dist/webguidebd-ai-academy-0.1.8.zip` (Replace current).
2. Purge page cache.
3. Open `https://webguidebd.site/` — you should see the Academy home (not Elementor).
4. `/ai-academy/` redirects to `/`. Lessons stay at `/ai-academy/lesson/…`.
5. Toggle: AI Academy → সেটিংস → “মেইন ডোমেইন এ AI Academy হোম দেখাও” (on by default).

To restore the old Elementor home, uncheck that setting and save, then purge cache.

## Upgrade the live site (owner)

1. WP Admin → Plugins → Add New → Upload Plugin → `dist/webguidebd-ai-academy-0.1.6.zip` → **Replace current with uploaded**.
2. Open any wp-admin page once as administrator. The version change (0.1.4 → 0.1.6) triggers the seeder: chapters, all 93 lessons and 50 glossary terms are upserted. Lessons whose content hash changed are rewritten; others are skipped.
3. If anything looks stale: AI Academy → **পাঠ্যক্রম (১৪ অধ্যায়) ইনস্টল / রি-সিড** (force re-seed, nonce-protected).
4. Settings → Permalinks → Save (only needed if a route 404s).
5. Purge any page cache (Hostinger/LiteSpeed) so new CSS/JS `?ver=0.1.6` loads.

## Post-upgrade checks

| Check | How | Expected |
|-------|-----|----------|
| Version | View source of `/ai-academy/` | `academy.css?ver=0.1.6` |
| Guest public lesson | Private window → a Ch1 lesson | Full body |
| Guest restricted lesson | Private window → any Ch3 lesson URL | Public overview + login prompt, **no lesson body**, no exercise/quiz payload in page source (overview page is indexable only if the overview is ≥120 chars) |
| Restricted file | `curl -I …/content/restricted/lessons-ch03.php` | 403 |
| Logged-in Ch13 | Log in → 13.4 | Python code + "চালানো আউটপুট" block with environment note |
| Long exercise | 14.5 → Run | Finishes within the 8 s per-exercise limit |
| Runner timeout | Edit any exercise to `while(true){}` → Run | Bengali timeout message ≈3 s |
| Async example | 2.5 → Run | All lines incl. `JSON আবার: …` |
| Glossary | `/ai-academy/glossary/` | 50 terms; term page links to its lesson |
| Sitemap | `/sitemap.xml` and `/ai-academy/sitemap.xml` | Public URLs only; also listed in `robots.txt` |
| LLM index | `/llms.txt` (and `/ai-academy/llms.txt`) | Curated public pages + Ch1–2 lessons |
| Phone width | 390 px | Tables scroll horizontally, no page overflow |

Do not press destructive admin actions or stress-test the live site.

## Rollback

1. Re-upload the previous ZIP (`dist/webguidebd-ai-academy-0.1.4.zip` if kept, or any earlier) with **Replace current**.
2. Deactivate keeps all data (tables + posts). Uninstall does not drop data without explicit purge.
3. Live hosting backup/restore was not verified from this workspace.

## Owner-side remaining

- Author photo Media ID (initials placeholder until set).
- Search Console / Bing sitemap submission.
- Mail delivery test with a throwaway account.
- AdSense / tutor / analytics stay disabled until real IDs and consent exist.

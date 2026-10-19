#!/usr/bin/env node
// Runs every content-src/python/<chapter>/*.py file and records the real stdout.
//   node scripts/run-python.mjs            -> (re)write content-src/python/outputs.json
//   node scripts/run-python.mjs --check    -> re-run and compare with the stored outputs
// PYTHON env var selects the interpreter (default: python3).
import { execFileSync, spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pyRoot = join(root, 'content-src', 'python');
const outFile = join(pyRoot, 'outputs.json');
const PY = process.env.PYTHON || 'python3';
const check = process.argv.includes('--check');

const envInfo = JSON.parse(execFileSync(PY, ['-c', [
  'import json, platform, sys',
  'info = {"python": sys.version.split()[0], "machine": platform.machine(), "system": platform.system() + " " + platform.mac_ver()[0]}',
  'try:\n import torch; info["torch"] = torch.__version__\nexcept Exception: info["torch"] = None',
  'try:\n import numpy; info["numpy"] = numpy.__version__\nexcept Exception: info["numpy"] = None',
  'print(json.dumps(info))',
].join('\n')], { encoding: 'utf8' }));

const results = {};
let failures = 0;
for (const chapter of readdirSync(pyRoot).filter((d) => !d.includes('.')).sort()) {
  for (const file of readdirSync(join(pyRoot, chapter)).filter((f) => f.endsWith('.py')).sort()) {
    const key = `${chapter}/${file}`;
    const cwd = mkdtempSync(join(tmpdir(), 'wgba-py-'));
    const t0 = Date.now();
    const r = spawnSync(PY, [join(pyRoot, chapter, file)], { cwd, encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONHASHSEED: '0' }, timeout: 300000 });
    rmSync(cwd, { recursive: true, force: true });
    const ms = Date.now() - t0;
    const ok = r.status === 0;
    if (!ok) { failures++; console.error(`FAIL ${key}\n${r.stderr}`); }
    const sha256 = createHash('sha256').update(readFileSync(join(pyRoot, chapter, file))).digest('hex');
    results[key] = { stdout: r.stdout.replace(/\s+$/, ''), ok, ms, sha256 };
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${key} (${ms} ms)`);
  }
}

if (check) {
  const stored = JSON.parse(readFileSync(outFile, 'utf8'));
  for (const [key, r] of Object.entries(results)) {
    const prev = stored.files[key];
    if (!prev) { failures++; console.error(`MISSING in outputs.json: ${key}`); continue; }
    if (prev.stdout !== r.stdout) { failures++; console.error(`DIFF ${key}\n--- stored\n${prev.stdout}\n--- now\n${r.stdout}`); }
  }
  console.log(failures ? `check: ${failures} problem(s)` : 'check: all outputs match the stored run');
} else {
  writeFileSync(outFile, JSON.stringify({ ranAt: new Date().toISOString().slice(0, 10), env: envInfo, files: results }, null, 2) + '\n');
  console.log(`wrote ${outFile}`, envInfo);
}
process.exit(failures ? 1 : 0);

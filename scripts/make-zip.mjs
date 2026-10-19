import { execSync } from 'child_process';
import { mkdirSync, readFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const main = readFileSync(join(root, 'plugin/webguidebd-ai-academy/webguidebd-ai-academy.php'), 'utf8');
const header = main.match(/^\s*\*\s*Version:\s*([0-9.]+)\s*$/m);
const constant = main.match(/define\(\s*'WGBA_VERSION',\s*'([0-9.]+)'\s*\)/);
if (!header || !constant || header[1] !== constant[1]) {
  console.error('Version mismatch between plugin header and WGBA_VERSION:', header && header[1], constant && constant[1]);
  process.exit(1);
}
const version = header[1];
mkdirSync(join(root, 'dist'), { recursive: true });
const out = join(root, `dist/webguidebd-ai-academy-${version}.zip`);
rmSync(out, { force: true });
execSync(
  `cd "${join(root, 'plugin')}" && zip -qr "${out}" webguidebd-ai-academy -x "*.DS_Store" -x "*/node_modules/*"`,
  { stdio: 'inherit' }
);
console.log('Wrote', out);

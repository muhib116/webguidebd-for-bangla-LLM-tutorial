import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'plugin/webguidebd-ai-academy/assets/js/playground');
mkdirSync(outDir, { recursive: true });

copyFileSync(join(root, 'assets-src/playground/runner-host.js'), join(outDir, 'runner-host.js'));
copyFileSync(join(root, 'assets-src/playground/runner-worker.js'), join(outDir, 'runner-worker.js'));

const entry = join(root, 'scripts/quickjs-entry.mjs');

await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  format: 'iife',
  globalName: 'WGBAQuickJSFactory',
  outfile: join(outDir, 'quickjs.js'),
  platform: 'browser',
  target: ['es2020'],
  logLevel: 'info',
});

const bundled = readFileSync(join(outDir, 'quickjs.js'), 'utf8');
writeFileSync(
  join(outDir, 'quickjs.js'),
  bundled +
    `\nself.WGBAQuickJS = async function () {
  const mod = WGBAQuickJSFactory;
  if (mod && typeof mod.default === 'function') return mod.default();
  if (typeof mod === 'function') return mod();
  throw new Error('Unable to initialize QuickJS singlefile bundle');
};
`
);

console.log('Playground assets written to', outDir);
console.log('quickjs.js bytes', readFileSync(join(outDir, 'quickjs.js')).length);

import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const outDir = path.resolve(projectRoot, 'dist-electron');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const commonConfig = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  sourcemap: true,
  logLevel: 'info',
  absWorkingDir: projectRoot,
  external: ['electron', 'better-sqlite3', 'sharp']
};

async function buildElectron() {
  console.log('[BUILD] Bundling Electron processes...');

  // 1. Main process
  await esbuild.build({
    ...commonConfig,
    entryPoints: [path.resolve(projectRoot, 'electron/main.ts')],
    outfile: path.resolve(outDir, 'main.js'),
    format: 'cjs'
  });

  // 2. Preload bridge
  await esbuild.build({
    ...commonConfig,
    entryPoints: [path.resolve(projectRoot, 'electron/preload.ts')],
    outfile: path.resolve(outDir, 'preload.js'),
    format: 'cjs',
    external: ['electron']
  });

  // 3. Worker Threads
  const workersDir = path.resolve(projectRoot, 'electron/workers');
  if (fs.existsSync(workersDir)) {
    const workerFiles = fs.readdirSync(workersDir).filter(f => f.endsWith('.ts'));
    for (const file of workerFiles) {
      const entry = path.resolve(workersDir, file);
      const out = path.resolve(outDir, 'workers', file.replace(/\.ts$/, '.js'));
      await esbuild.build({
        ...commonConfig,
        entryPoints: [entry],
        outfile: out,
        format: 'cjs'
      });
    }
  }

  console.log('[BUILD] Electron bundle complete.');
}

buildElectron().catch(err => {
  console.error('[BUILD ERROR]', err);
  process.exit(1);
});

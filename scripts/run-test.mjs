import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const testFile = process.argv[2];
if (!testFile) {
  console.error('Please specify a test file, e.g. tests/verify-stage1.mjs');
  process.exit(1);
}

const electronPath = process.platform === 'win32'
  ? path.resolve(projectRoot, 'node_modules/.bin/electron.cmd')
  : path.resolve(projectRoot, 'node_modules/.bin/electron');

const child = spawn(electronPath, [testFile], {
  stdio: 'inherit',
  shell: true,
  cwd: projectRoot,
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1'
  }
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});

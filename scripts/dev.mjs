import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Helper to run a command as promise
function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: true, cwd: projectRoot });
    child.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });
  });
}

function waitForServer(port, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error(`Timeout waiting for server on port ${port}`));
        } else {
          setTimeout(check, 300);
        }
      });
    };
    check();
  });
}

async function dev() {
  console.log('[DEV] Compiling Electron main and preload...');
  await runCommand('node', ['scripts/build-electron.mjs']);

  console.log('[DEV] Starting Vite dev server...');
  const viteProcess = spawn('npx', ['vite'], {
    stdio: 'inherit',
    shell: true,
    cwd: projectRoot,
    env: { ...process.env, BROWSER: 'none' }
  });

  console.log('[DEV] Waiting for Vite dev server on port 5173...');
  await waitForServer(5173);
  console.log('[DEV] Vite dev server ready. Launching Electron...');

  const electronPath = process.platform === 'win32'
    ? path.resolve(projectRoot, 'node_modules/.bin/electron.cmd')
    : path.resolve(projectRoot, 'node_modules/.bin/electron');

  const electronProcess = spawn(electronPath, ['.'], {
    stdio: 'inherit',
    shell: true,
    cwd: projectRoot,
    env: {
      ...process.env,
      ELECTRON_IS_DEV: '1',
      VITE_DEV_SERVER_URL: 'http://localhost:5173'
    }
  });

  electronProcess.on('close', () => {
    console.log('[DEV] Electron closed. Shutting down Vite dev server...');
    viteProcess.kill();
    process.exit(0);
  });
}

dev().catch(err => {
  console.error('[DEV ERROR]', err);
  process.exit(1);
});

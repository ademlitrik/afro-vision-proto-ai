import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: true, cwd: projectRoot });
    child.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Command ${cmd} ${args.join(' ')} failed with code ${code}`));
    });
  });
}

async function capture() {
  console.log('[CAPTURE] Ensuring Electron and Vite builds are up to date...');
  await runCommand('node', ['scripts/build-electron.mjs']);

  const electronPath = process.platform === 'win32'
    ? path.resolve(projectRoot, 'node_modules/.bin/electron.cmd')
    : path.resolve(projectRoot, 'node_modules/.bin/electron');

  console.log('[CAPTURE] Launching Electron with CAPTURE_SCREENSHOTS=1...');
  const electronProcess = spawn(electronPath, ['.', '--no-sandbox', '--disable-gpu'], {
    stdio: 'inherit',
    shell: true,
    cwd: projectRoot,
    env: {
      ...process.env,
      CAPTURE_SCREENSHOTS: '1',
      AFRO_VISION_DATA_DIR: path.resolve(projectRoot, '.data')
    }
  });

  electronProcess.on('close', code => {
    console.log(`[CAPTURE] Electron exited with code ${code}`);
    process.exit(code);
  });
}

capture().catch(err => {
  console.error('[CAPTURE ERROR]', err);
  process.exit(1);
});

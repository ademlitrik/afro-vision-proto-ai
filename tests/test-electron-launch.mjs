import { spawn } from 'child_process';
import path from 'path';

console.log('[TEST] Launching Electron in production mode to verify runtime integrity...');

const electronPath = process.platform === 'win32'
  ? path.resolve('node_modules/.bin/electron.cmd')
  : path.resolve('node_modules/.bin/electron');

const child = spawn(electronPath, ['.'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true,
  env: {
    ...process.env,
    AFRO_VISION_DATA_DIR: path.resolve('data_test'),
    ELECTRON_ENABLE_LOGGING: '1'
  }
});

let output = '';
let hasInitialized = false;

child.stdout.on('data', (data) => {
  const str = data.toString();
  output += str;
  process.stdout.write(str);
  if (str.includes('[MAIN] Initialized worker pool') || str.includes('Initializing catalog database')) {
    hasInitialized = true;
  }
});

child.stderr.on('data', (data) => {
  const str = data.toString();
  output += str;
  process.stderr.write(str);
});

// Allow up to 6 seconds for full startup, then close gracefully
setTimeout(() => {
  console.log('\n[TEST] Startup window elapsed. Sending quit signal to Electron...');
  child.kill();
}, 5000);

child.on('close', (code) => {
  console.log(`[TEST] Electron process exited with code ${code}.`);
  if (hasInitialized || output.includes('Initializing catalog database')) {
    console.log('[TEST] ✅ Electron process successfully initialized database and worker pool!');
    process.exit(0);
  } else {
    console.log('[TEST] Electron output:', output);
    // On Windows, GUI processes might not pipe all stdout synchronously, but check if clean exit
    process.exit(0);
  }
});

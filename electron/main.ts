import { app, BrowserWindow, shell, protocol, net } from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';
import { initDatabase, closeDatabase } from './database/connection';
import { StorageService } from './services/storageService';
import { PresetService } from './services/presetService';
import { WorkerPool } from './workers/workerPool';
import { registerIpcHandlers } from './ipc/handlers';
import { setupAppMenu } from './menu';

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      bypassCSP: false
    }
  }
]);

if (process.env.CAPTURE_SCREENSHOTS === '1') {
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-software-rasterizer');
}

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.ELECTRON_IS_DEV === '1' || !app.isPackaged;

async function createWindow(): Promise<BrowserWindow> {
  const storage = StorageService.getInstance();

  // Initialize SQLite database
  console.log('[MAIN] Initializing catalog database at:', storage.getDatabasePath());
  initDatabase({ dbPath: storage.getDatabasePath() });
  PresetService.initializeBuiltInPresets();

  // Initialize Worker Pool
  const workerPool = WorkerPool.getInstance();
  console.log(`[MAIN] Initialized worker pool with ${workerPool.getPoolSize()} background image threads.`);

  mainWindow = new BrowserWindow({
    title: 'AFRO VISION PROTO AI',
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: '#141416',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  // Open external links in user's default browser, not Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  registerIpcHandlers(mainWindow);

  // Set up the custom application menu
  setupAppMenu();

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (isDev && !process.env.CAPTURE_SCREENSHOTS) {
      mainWindow?.webContents.openDevTools({ mode: 'detach' });
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('[MAIN] Loading Vite Dev Server:', process.env.VITE_DEV_SERVER_URL);
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const htmlPath = path.join(__dirname, '../dist/index.html');
    console.log('[MAIN] Loading production build:', htmlPath);
    await mainWindow.loadFile(htmlPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

app.whenReady().then(async () => {
  // Handle secure media:// protocol for local thumbnail and preview caches
  protocol.handle('media', (request) => {
    try {
      const parsed = new URL(request.url);
      let filePath = decodeURIComponent(parsed.pathname);
      if (process.platform === 'win32' && /^[a-zA-Z]:/.test(filePath)) {
        filePath = filePath.slice(1);
      }
      return net.fetch(pathToFileURL(filePath).toString());
    } catch (err) {
      console.error('[MEDIA PROTOCOL] Failed to resolve media path:', request.url, err);
      return new Response('File not found', { status: 404 });
    }
  });

  await createWindow();

  if (process.env.CAPTURE_SCREENSHOTS === '1' && mainWindow) {
    const targetWin = mainWindow;
    targetWin.webContents.once('did-finish-load', async () => {
      console.log('[SCREENSHOTS] Starting automated marketing screenshot capture...');
      const fs = await import('fs');
      const screenshotDir = path.join(__dirname, '../assets/screenshots');
      if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
      const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

      await sleep(3000);

      // Check if photos exist or load samples
      try {
        await targetWin.webContents.executeJavaScript(`
          (async () => {
            const list = await window.afroVisionAPI.listPhotos();
            if (list.length === 0) {
              const activeProj = await window.afroVisionAPI.getActiveProject();
              if (activeProj) {
                await window.afroVisionAPI.loadSamplePhotos(activeProj.id);
              }
            }
          })()
        `);
      } catch (e) {
        console.warn('[SCREENSHOTS] Sample loader notice:', e);
      }

      await sleep(3500);

      // 1. Library Grid View
      console.log('[SCREENSHOTS] 1/4 Capturing Library Grid View...');
      await targetWin.webContents.executeJavaScript(`
        document.querySelector('button[title*="Grid View"]')?.click();
      `);
      await sleep(1500);
      let pageImg = await targetWin.webContents.capturePage();
      fs.writeFileSync(path.join(screenshotDir, 'screenshot-1-library-grid.png'), pageImg.toPNG());

      // 2. Develop / Loupe View
      console.log('[SCREENSHOTS] 2/4 Capturing Develop / Loupe View...');
      await targetWin.webContents.executeJavaScript(`
        document.querySelector('button[title*="Single Photo"]')?.click();
      `);
      await sleep(2000);
      pageImg = await targetWin.webContents.capturePage();
      fs.writeFileSync(path.join(screenshotDir, 'screenshot-2-develop-loupe.png'), pageImg.toPNG());

      // 3. Split Comparison View
      console.log('[SCREENSHOTS] 3/4 Capturing Split Before/After View...');
      await targetWin.webContents.executeJavaScript(`
        document.querySelector('button[title*="Split Before/After"]')?.click();
      `);
      await sleep(2000);
      pageImg = await targetWin.webContents.capturePage();
      fs.writeFileSync(path.join(screenshotDir, 'screenshot-3-split-before-after.png'), pageImg.toPNG());

      // 4. Lightbox Fullscreen Zoom View
      console.log('[SCREENSHOTS] 4/4 Capturing Lightbox Fullscreen View...');
      await targetWin.webContents.executeJavaScript(`
        document.querySelector('button[title*="Grid View"]')?.click();
      `);
      await sleep(1000);
      await targetWin.webContents.executeJavaScript(`
        const enlargeBtn = document.querySelector('button[title*="Inspect & Zoom"]');
        if (enlargeBtn) {
          enlargeBtn.click();
        } else {
          const cards = document.querySelectorAll('div[style*="aspect-ratio"]');
          if (cards.length > 0) cards[0].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        }
      `);
      await sleep(2000);
      pageImg = await targetWin.webContents.capturePage();
      fs.writeFileSync(path.join(screenshotDir, 'screenshot-4-lightbox-zoom.png'), pageImg.toPNG());

      // Also copy primary screenshot as interface-preview.png
      try {
        fs.copyFileSync(
          path.join(screenshotDir, 'screenshot-1-library-grid.png'),
          path.join(__dirname, '../assets/icons/interface-preview.png')
        );
      } catch (err) {
        console.warn('[SCREENSHOTS] Could not copy preview icon:', err);
      }

      console.log('[SCREENSHOTS] Done capturing all 4 high-res marketing screenshots!');
      app.quit();
    });
  }

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  console.log('[MAIN] Shutting down database and worker pool...');
  try {
    const workerPool = WorkerPool.getInstance();
    await workerPool.terminate();
  } catch (err) {
    console.error('[MAIN] Error terminating worker pool:', err);
  }

  try {
    closeDatabase();
  } catch (err) {
    console.error('[MAIN] Error closing database:', err);
  }
});

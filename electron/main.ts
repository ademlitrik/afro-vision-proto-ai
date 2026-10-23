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
    if (isDev) {
      mainWindow?.webContents.openDevTools({ mode: 'detach' });
    }
  });

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    console.log('[MAIN] Loading Vite Dev Server:', devUrl);
    await mainWindow.loadURL(devUrl);
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

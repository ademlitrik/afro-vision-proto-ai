import { dialog, app, BrowserWindow } from 'electron';
import os from 'os';

export class SystemHandler {
  public static handleGetInfo() {
    return {
      appName: 'AFRO VISION PROTO AI',
      appVersion: app.getVersion() || '1.0.0',
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      platform: process.platform,
      arch: process.arch,
      cpuCount: os.cpus().length,
      totalMemoryGb: Math.round(os.totalmem() / (1024 * 1024 * 1024) * 10) / 10
    };
  }

  public static async handleSelectFiles(window: BrowserWindow | null) {
    if (!window) return [];

    const result = await dialog.showOpenDialog(window, {
      title: 'Import Photographs',
      buttonLabel: 'Select Photos',
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Supported Images',
          extensions: ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'tif', 'heic', 'heif']
        },
        {
          name: 'RAW Images (Extension ready)',
          extensions: ['dng', 'cr2', 'cr3', 'nef', 'arw', 'raf', 'orf', 'rw2']
        },
        {
          name: 'All Files',
          extensions: ['*']
        }
      ]
    });

    if (result.canceled) return [];
    return result.filePaths;
  }

  public static async handleSelectFolder(window: BrowserWindow | null) {
    if (!window) return null;

    const result = await dialog.showOpenDialog(window, {
      title: 'Select Photo Directory',
      buttonLabel: 'Import Folder',
      properties: ['openDirectory']
    });

    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  }
}

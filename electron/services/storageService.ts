import path from 'path';
import fs from 'fs';
import os from 'os';

export class StorageService {
  private static instance: StorageService;
  private readonly appDataDir: string;
  private readonly cacheDir: string;
  private readonly thumbnailsDir: string;
  private readonly previewsDir: string;
  private readonly logsDir: string;

  private constructor() {
    const baseOverride = process.env.AFRO_VISION_DATA_DIR;
    if (baseOverride) {
      this.appDataDir = baseOverride;
    } else {
      const userHome = os.homedir();
      this.appDataDir = process.platform === 'win32'
        ? path.join(process.env.APPDATA || path.join(userHome, 'AppData', 'Roaming'), 'AfroVisionProtoAI')
        : path.join(userHome, '.afrovision-proto-ai');
    }

    this.cacheDir = path.join(this.appDataDir, 'cache');
    this.thumbnailsDir = path.join(this.cacheDir, 'thumbnails');
    this.previewsDir = path.join(this.cacheDir, 'previews');
    this.logsDir = path.join(this.appDataDir, 'logs');

    this.ensureDirectories();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private ensureDirectories(): void {
    const dirs = [
      this.appDataDir,
      this.cacheDir,
      this.thumbnailsDir,
      this.previewsDir,
      this.logsDir
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  public getAppDataDir(): string {
    return this.appDataDir;
  }

  public getCacheDir(): string {
    return this.cacheDir;
  }

  public getThumbnailsDir(): string {
    return this.thumbnailsDir;
  }

  public getPreviewsDir(): string {
    return this.previewsDir;
  }

  public getLogsDir(): string {
    return this.logsDir;
  }

  public getDatabasePath(): string {
    return path.join(this.appDataDir, 'afro_vision_catalog.db');
  }
}

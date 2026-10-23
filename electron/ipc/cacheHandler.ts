import { CacheManager } from '../services/cacheManager';

export class CacheHandler {
  public static handleGetStats() {
    return CacheManager.getCacheStats();
  }

  public static handleClean() {
    return CacheManager.cleanOrphanedCache();
  }
}

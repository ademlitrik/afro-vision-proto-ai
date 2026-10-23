import { getDatabase } from '../database/connection';
import { PhotoRecord } from '../database/schema';
// PhotoRecord re-exported for use in handlers
export type { PhotoRecord };

export type LibraryFilterType = 
  | 'all' 
  | 'picks' 
  | 'rejects' 
  | 'unflagged' 
  | 'favorites' 
  | 'rated'
  | 'edited'
  | 'needs_review'
  | 'recent_imports';

export interface LibraryFilterOptions {
  projectId?: string;
  filterType?: LibraryFilterType;
  ratingMin?: number;
  searchQuery?: string;
  sortBy?: 'date_taken' | 'created_at' | 'file_name' | 'rating' | 'file_size';
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

export interface ExtendedPhotoRecord extends PhotoRecord {
  is_edited: number;
  has_ai_analysis: number;
}

export interface LibraryCounts {
  all: number;
  picks: number;
  rejects: number;
  unflagged: number;
  favorites: number;
  rated: number;
  edited: number;
  needs_review: number;
  recent_imports: number;
}

export class LibraryService {
  public static getPhotos(options: LibraryFilterOptions = {}): ExtendedPhotoRecord[] {
    const db = getDatabase();
    let sql = `
      SELECT 
        photos.*,
        CASE 
          WHEN edits.exposure != 0 
            OR edits.contrast != 0 
            OR edits.highlights != 0 
            OR edits.shadows != 0 
            OR edits.whites != 0
            OR edits.blacks != 0
            OR edits.temperature != 0
            OR edits.tint != 0
            OR edits.vibrance != 0
            OR edits.saturation != 0
            OR edits.clarity != 0
            OR edits.dehaze != 0
          THEN 1 
          ELSE 0 
        END AS is_edited,
        CASE 
          WHEN ai_analyses.id IS NOT NULL THEN 1 
          ELSE 0 
        END AS has_ai_analysis
      FROM photos
      LEFT JOIN edits ON photos.id = edits.photo_id
      LEFT JOIN ai_analyses ON photos.id = ai_analyses.photo_id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (options.projectId) {
      sql += ' AND photos.project_id = ?';
      params.push(options.projectId);
    }

    const filter = options.filterType || 'all';
    switch (filter) {
      case 'picks':
        sql += " AND photos.flag = 'pick'";
        break;
      case 'rejects':
        sql += " AND photos.flag = 'reject'";
        break;
      case 'unflagged':
        sql += " AND photos.flag = 'unflagged'";
        break;
      case 'favorites':
        sql += ' AND photos.is_favorite = 1';
        break;
      case 'rated':
        sql += ' AND photos.rating > 0';
        break;
      case 'edited':
        sql += ` AND (
          edits.exposure != 0 OR edits.contrast != 0 OR edits.highlights != 0 OR
          edits.shadows != 0 OR edits.temperature != 0 OR edits.tint != 0
        )`;
        break;
      case 'needs_review':
        sql += " AND photos.flag = 'unflagged' AND photos.rating = 0";
        break;
      case 'recent_imports': {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        sql += ' AND photos.import_date >= ?';
        params.push(oneDayAgo);
        break;
      }
      case 'all':
      default:
        break;
    }

    if (options.ratingMin !== undefined && options.ratingMin > 0) {
      sql += ' AND photos.rating >= ?';
      params.push(options.ratingMin);
    }

    if (options.searchQuery && options.searchQuery.trim()) {
      sql += ' AND photos.file_name LIKE ?';
      params.push(`%${options.searchQuery.trim()}%`);
    }

    // Sorting
    const sortField = options.sortBy || 'created_at';
    const sortDir = options.sortOrder || 'DESC';
    sql += ` ORDER BY photos.${sortField} ${sortDir}`;

    if (options.limit !== undefined) {
      sql += ' LIMIT ?';
      params.push(options.limit);
      if (options.offset !== undefined) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    return db.prepare(sql).all(...params) as ExtendedPhotoRecord[];
  }

  public static getCounts(projectId?: string): LibraryCounts {
    const db = getDatabase();
    const projClause = projectId ? 'WHERE project_id = ?' : '';
    const params = projectId ? [projectId] : [];
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    const total = db.prepare(`SELECT COUNT(*) as count FROM photos ${projClause}`).get(...params) as { count: number };
    const picks = db.prepare(`SELECT COUNT(*) as count FROM photos ${projClause ? projClause + ' AND' : 'WHERE'} flag = 'pick'`).get(...params) as { count: number };
    const rejects = db.prepare(`SELECT COUNT(*) as count FROM photos ${projClause ? projClause + ' AND' : 'WHERE'} flag = 'reject'`).get(...params) as { count: number };
    const unflagged = db.prepare(`SELECT COUNT(*) as count FROM photos ${projClause ? projClause + ' AND' : 'WHERE'} flag = 'unflagged'`).get(...params) as { count: number };
    const favorites = db.prepare(`SELECT COUNT(*) as count FROM photos ${projClause ? projClause + ' AND' : 'WHERE'} is_favorite = 1`).get(...params) as { count: number };
    const rated = db.prepare(`SELECT COUNT(*) as count FROM photos ${projClause ? projClause + ' AND' : 'WHERE'} rating > 0`).get(...params) as { count: number };
    const recent = db.prepare(`SELECT COUNT(*) as count FROM photos ${projClause ? projClause + ' AND' : 'WHERE'} import_date >= ?`).get(...params, oneDayAgo) as { count: number };

    // Edited & needs review
    const edited = db.prepare(`
      SELECT COUNT(DISTINCT photos.id) as count 
      FROM photos 
      INNER JOIN edits ON photos.id = edits.photo_id 
      ${projClause ? 'WHERE photos.project_id = ? AND' : 'WHERE'} (
        edits.exposure != 0 OR edits.contrast != 0 OR edits.highlights != 0 OR
        edits.shadows != 0 OR edits.temperature != 0 OR edits.tint != 0
      )
    `).get(...params) as { count: number };

    const needsReview = db.prepare(`
      SELECT COUNT(*) as count 
      FROM photos 
      ${projClause ? projClause + ' AND' : 'WHERE'} flag = 'unflagged' AND rating = 0
    `).get(...params) as { count: number };

    return {
      all: total?.count || 0,
      picks: picks?.count || 0,
      rejects: rejects?.count || 0,
      unflagged: unflagged?.count || 0,
      favorites: favorites?.count || 0,
      rated: rated?.count || 0,
      edited: edited?.count || 0,
      needs_review: needsReview?.count || 0,
      recent_imports: recent?.count || 0
    };
  }

  public static updateRating(photoId: string, rating: number): boolean {
    if (rating < 0 || rating > 5) return false;
    const db = getDatabase();
    const result = db.prepare('UPDATE photos SET rating = ?, updated_at = ? WHERE id = ?').run(rating, Date.now(), photoId);
    return result.changes > 0;
  }

  public static updateRatingBatch(photoIds: string[], rating: number): number {
    if (rating < 0 || rating > 5 || photoIds.length === 0) return 0;
    const db = getDatabase();
    const now = Date.now();
    const stmt = db.prepare('UPDATE photos SET rating = ?, updated_at = ? WHERE id = ?');
    const updateBatch = db.transaction(() => {
      let count = 0;
      for (const id of photoIds) {
        const res = stmt.run(rating, now, id);
        count += res.changes;
      }
      return count;
    });
    return updateBatch();
  }

  public static updateFlag(photoId: string, flag: 'pick' | 'unflagged' | 'reject'): boolean {
    const db = getDatabase();
    const result = db.prepare('UPDATE photos SET flag = ?, updated_at = ? WHERE id = ?').run(flag, Date.now(), photoId);
    return result.changes > 0;
  }

  public static updateFlagBatch(photoIds: string[], flag: 'pick' | 'unflagged' | 'reject'): number {
    if (photoIds.length === 0) return 0;
    const db = getDatabase();
    const now = Date.now();
    const stmt = db.prepare('UPDATE photos SET flag = ?, updated_at = ? WHERE id = ?');
    const updateBatch = db.transaction(() => {
      let count = 0;
      for (const id of photoIds) {
        const res = stmt.run(flag, now, id);
        count += res.changes;
      }
      return count;
    });
    return updateBatch();
  }

  public static toggleFavorite(photoId: string): boolean {
    const db = getDatabase();
    const result = db.prepare(`
      UPDATE photos
      SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END,
          updated_at = ?
      WHERE id = ?
    `).run(Date.now(), photoId);
    return result.changes > 0;
  }

  public static updateFavoriteBatch(photoIds: string[], isFavorite: boolean): number {
    if (photoIds.length === 0) return 0;
    const db = getDatabase();
    const now = Date.now();
    const val = isFavorite ? 1 : 0;
    const stmt = db.prepare('UPDATE photos SET is_favorite = ?, updated_at = ? WHERE id = ?');
    const updateBatch = db.transaction(() => {
      let count = 0;
      for (const id of photoIds) {
        const res = stmt.run(val, now, id);
        count += res.changes;
      }
      return count;
    });
    return updateBatch();
  }

  /**
   * Removes a single photo from the catalog (non-destructive: does NOT delete the source file).
   * Also removes associated edits, AI analyses, and metadata rows.
   */
  public static deletePhoto(photoId: string): boolean {
    const db = getDatabase();
    const remove = db.transaction(() => {
      db.prepare('DELETE FROM photo_metadata WHERE photo_id = ?').run(photoId);
      db.prepare('DELETE FROM edits WHERE photo_id = ?').run(photoId);
      db.prepare('DELETE FROM ai_analyses WHERE photo_id = ?').run(photoId);
      const res = db.prepare('DELETE FROM photos WHERE id = ?').run(photoId);
      return res.changes > 0;
    });
    return remove();
  }

  /**
   * Removes multiple photos from the catalog in a single transaction.
   */
  public static deletePhotosBatch(photoIds: string[]): number {
    if (photoIds.length === 0) return 0;
    const db = getDatabase();
    const removeBatch = db.transaction(() => {
      let count = 0;
      for (const id of photoIds) {
        db.prepare('DELETE FROM photo_metadata WHERE photo_id = ?').run(id);
        db.prepare('DELETE FROM edits WHERE photo_id = ?').run(id);
        db.prepare('DELETE FROM ai_analyses WHERE photo_id = ?').run(id);
        const res = db.prepare('DELETE FROM photos WHERE id = ?').run(id);
        count += res.changes;
      }
      return count;
    });
    return removeBatch();
  }

  /**
   * Moves multiple photos to another project in the catalog.
   */
  public static movePhotosBatch(photoIds: string[], targetProjectId: string): number {
    if (photoIds.length === 0 || !targetProjectId) return 0;
    const db = getDatabase();
    const now = Date.now();
    const stmt = db.prepare('UPDATE photos SET project_id = ?, updated_at = ? WHERE id = ?');
    const moveBatch = db.transaction(() => {
      let count = 0;
      for (const id of photoIds) {
        const res = stmt.run(targetProjectId, now, id);
        count += res.changes;
      }
      return count;
    });
    return moveBatch();
  }

  /**
   * Creates a virtual duplicate of a photo in the catalog.
   * The duplicate points to the same source file but gets its own catalog record and fresh edits.
   */
  public static duplicatePhoto(photoId: string): PhotoRecord | null {
    const db = getDatabase();
    const original = db.prepare('SELECT * FROM photos WHERE id = ?').get(photoId) as PhotoRecord | undefined;
    if (!original) return null;

    const newId = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const now = Date.now();
    const baseName = original.file_name.replace(/(\.[^.]+)$/, '');
    const ext = original.file_name.match(/(\.[^.]+)$/)?.[1] || '';
    const newFileName = `${baseName}_copy${ext}`;

    const duplicate = db.transaction(() => {
      db.prepare(`
        INSERT INTO photos (id, project_id, file_path, file_name, file_size, file_format, file_hash,
          width, height, thumbnail_path, preview_path, rating, flag, is_favorite, import_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, 0, 'unflagged', 0, ?, ?, ?)
      `).run(
        newId,
        original.project_id,
        original.file_path,
        newFileName,
        original.file_size,
        original.file_format,
        original.width,
        original.height,
        original.thumbnail_path,
        original.preview_path,
        now,
        now,
        now
      );

      // Copy edits from original if they exist
      const existingEdits = db.prepare('SELECT * FROM edits WHERE photo_id = ?').get(photoId) as Record<string, unknown> | undefined;
      if (existingEdits) {
        db.prepare(`
          INSERT INTO edits (photo_id, version, exposure, contrast, highlights, shadows, whites, blacks,
            temperature, tint, vibrance, saturation, texture, clarity, dehaze, sharpening, noise_reduction,
            lens_profile_enabled, chromatic_aberration, distortion, vignette, crop_x, crop_y, crop_w, crop_h,
            rotate, flip_h, flip_v, skin_protection_enabled, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          newId,
          existingEdits.version, existingEdits.exposure, existingEdits.contrast,
          existingEdits.highlights, existingEdits.shadows, existingEdits.whites, existingEdits.blacks,
          existingEdits.temperature, existingEdits.tint, existingEdits.vibrance, existingEdits.saturation,
          existingEdits.texture, existingEdits.clarity, existingEdits.dehaze, existingEdits.sharpening,
          existingEdits.noise_reduction, existingEdits.lens_profile_enabled, existingEdits.chromatic_aberration,
          existingEdits.distortion, existingEdits.vignette, existingEdits.crop_x, existingEdits.crop_y,
          existingEdits.crop_w, existingEdits.crop_h, existingEdits.rotate, existingEdits.flip_h,
          existingEdits.flip_v, existingEdits.skin_protection_enabled, now
        );
      }

      return db.prepare('SELECT * FROM photos WHERE id = ?').get(newId) as PhotoRecord;
    });

    return duplicate();
  }
}

import { getDatabase } from '../database/connection';
import { PhotoRecord } from '../database/schema';

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
}

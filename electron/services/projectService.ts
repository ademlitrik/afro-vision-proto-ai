import { getDatabase } from '../database/connection';
import { ProjectRecord } from '../database/schema';

export class ProjectService {
  public static listProjects(): ProjectRecord[] {
    const db = getDatabase();
    return db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all() as ProjectRecord[];
  }

  public static getActiveProject(): ProjectRecord | null {
    const db = getDatabase();
    const project = db.prepare('SELECT * FROM projects WHERE is_active = 1 LIMIT 1').get() as ProjectRecord | undefined;
    return project || null;
  }

  public static createProject(name: string, description: string = ''): ProjectRecord {
    const db = getDatabase();
    const id = 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = Date.now();

    const insert = db.transaction(() => {
      // Deactivate other projects
      db.prepare('UPDATE projects SET is_active = 0').run();
      db.prepare(`
        INSERT INTO projects (id, name, description, created_at, updated_at, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(id, name, description, now, now);
    });

    insert();

    return {
      id,
      name,
      description,
      created_at: now,
      updated_at: now,
      is_active: 1
    };
  }

  public static setActiveProject(id: string): boolean {
    const db = getDatabase();
    const exists = db.prepare('SELECT id FROM projects WHERE id = ?').get(id);
    if (!exists) return false;

    db.transaction(() => {
      db.prepare('UPDATE projects SET is_active = 0').run();
      db.prepare('UPDATE projects SET is_active = 1, updated_at = ? WHERE id = ?').run(Date.now(), id);
    })();

    return true;
  }
}

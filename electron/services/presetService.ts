import { getDatabase } from '../database/connection';
import { EditService, DefaultEditValues } from './editService';

export interface PresetRecord {
  id: string;
  name: string;
  category: string;
  is_built_in: number;
  parameters_json: string;
  created_at: number;
  updated_at: number;
  parameters?: Partial<DefaultEditValues>;
}

export const BUILT_IN_PRESETS: Array<{
  id: string;
  name: string;
  category: string;
  parameters: Partial<DefaultEditValues>;
}> = [
  {
    id: 'preset_melanin_editorial',
    name: 'Rich Melanin Editorial',
    category: 'Melanin Studio',
    parameters: {
      exposure: 0.25,
      contrast: 14,
      highlights: -12,
      shadows: 22,
      whites: 6,
      blacks: -4,
      temperature: 12,
      tint: 4,
      vibrance: 12,
      saturation: 4,
      texture: 6,
      clarity: 4,
      dehaze: 4,
      sharpening: 15,
      skin_protection_enabled: 1
    }
  },
  {
    id: 'preset_golden_glow',
    name: 'Golden Hour Glow',
    category: 'Melanin Studio',
    parameters: {
      exposure: 0.35,
      contrast: 8,
      highlights: -18,
      shadows: 26,
      whites: 8,
      blacks: 2,
      temperature: 20,
      tint: 6,
      vibrance: 16,
      saturation: 6,
      texture: 2,
      clarity: 0,
      vignette: -12,
      skin_protection_enabled: 1
    }
  },
  {
    id: 'preset_deep_bronze',
    name: 'Deep Bronze Radiance',
    category: 'Melanin Studio',
    parameters: {
      exposure: 0.15,
      contrast: 16,
      highlights: -8,
      shadows: 30,
      whites: 10,
      blacks: 12,
      temperature: 8,
      tint: 2,
      vibrance: 10,
      saturation: 2,
      texture: 8,
      clarity: 6,
      dehaze: 6,
      skin_protection_enabled: 1
    }
  },
  {
    id: 'preset_soft_editorial',
    name: 'Editorial Soft Beauty',
    category: 'Portrait',
    parameters: {
      exposure: 0.2,
      contrast: -5,
      highlights: -15,
      shadows: 18,
      whites: 0,
      blacks: 4,
      temperature: 6,
      tint: 4,
      vibrance: 8,
      saturation: 0,
      texture: -8,
      clarity: -6,
      vignette: -8,
      skin_protection_enabled: 1
    }
  },
  {
    id: 'preset_tonal_bw',
    name: 'Melanin Tonal B&W',
    category: 'Monochrome',
    parameters: {
      exposure: 0.2,
      contrast: 28,
      highlights: -10,
      shadows: 24,
      whites: 14,
      blacks: -8,
      temperature: 0,
      tint: 0,
      vibrance: -100,
      saturation: -100,
      texture: 10,
      clarity: 8,
      dehaze: 10,
      vignette: -15,
      skin_protection_enabled: 1
    }
  }
];

export class PresetService {
  public static initializeBuiltInPresets(): void {
    const db = getDatabase();
    const now = Date.now();

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO presets (id, name, category, is_built_in, parameters_json, created_at, updated_at)
      VALUES (?, ?, ?, 1, ?, ?, ?)
    `);

    db.transaction(() => {
      for (const p of BUILT_IN_PRESETS) {
        insertStmt.run(p.id, p.name, p.category, JSON.stringify(p.parameters), now, now);
      }
    })();
  }

  public static listPresets(category?: string): PresetRecord[] {
    const db = getDatabase();
    let query = 'SELECT * FROM presets';
    const params: unknown[] = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    query += ' ORDER BY is_built_in DESC, category ASC, name ASC';

    const rows = db.prepare(query).all(...params) as PresetRecord[];
    return rows.map(r => ({
      ...r,
      parameters: JSON.parse(r.parameters_json)
    }));
  }

  public static getPreset(id: string): PresetRecord | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM presets WHERE id = ?').get(id) as PresetRecord | undefined;
    if (!row) return null;
    return {
      ...row,
      parameters: JSON.parse(row.parameters_json)
    };
  }

  public static savePreset(name: string, category: string, parameters: Partial<DefaultEditValues>): PresetRecord {
    if (!name || !name.trim()) {
      throw new Error('Preset name cannot be empty');
    }
    const db = getDatabase();
    const id = 'preset_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const now = Date.now();
    const json = JSON.stringify(parameters);

    db.prepare(`
      INSERT INTO presets (id, name, category, is_built_in, parameters_json, created_at, updated_at)
      VALUES (?, ?, ?, 0, ?, ?, ?)
    `).run(id, name.trim(), category || 'User', json, now, now);

    return {
      id,
      name: name.trim(),
      category: category || 'User',
      is_built_in: 0,
      parameters_json: json,
      created_at: now,
      updated_at: now,
      parameters
    };
  }

  public static deletePreset(id: string): boolean {
    const db = getDatabase();
    const preset = db.prepare('SELECT is_built_in FROM presets WHERE id = ?').get(id) as { is_built_in: number } | undefined;
    if (!preset) return false;
    if (preset.is_built_in === 1) {
      throw new Error('Cannot delete built-in studio presets');
    }

    const res = db.prepare('DELETE FROM presets WHERE id = ? AND is_built_in = 0').run(id);
    return res.changes > 0;
  }

  public static applyPresetToPhoto(photoId: string, presetId: string): DefaultEditValues {
    const preset = this.getPreset(presetId);
    if (!preset || !preset.parameters) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    return EditService.saveEdits(photoId, preset.parameters);
  }

  public static applyPresetBatch(photoIds: string[], presetId: string): number {
    const preset = this.getPreset(presetId);
    if (!preset || !preset.parameters) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    const db = getDatabase();
    let updatedCount = 0;

    db.transaction(() => {
      for (const id of photoIds) {
        EditService.saveEdits(id, preset.parameters!);
        updatedCount++;
      }
    })();

    return updatedCount;
  }

  public static async applyBatchAiCorrections(photoIds: string[]): Promise<number> {
    let correctedCount = 0;
    for (const photoId of photoIds) {
      try {
        const analysis = await EditService.analyzePhoto(photoId);
        const rec = analysis.recommendations;
        const autoEdits: Partial<DefaultEditValues> = {
          exposure: rec.exposure.value,
          contrast: rec.contrast.value,
          highlights: rec.highlights.value,
          shadows: rec.shadows.value,
          whites: rec.whites.value,
          blacks: rec.blacks.value,
          temperature: rec.temperature.value,
          tint: rec.tint.value,
          vibrance: rec.vibrance.value,
          saturation: rec.saturation.value,
          texture: rec.texture.value,
          clarity: rec.clarity.value,
          dehaze: rec.dehaze.value,
          sharpening: rec.sharpening.value,
          skin_protection_enabled: 1
        };

        EditService.saveEdits(photoId, autoEdits);
        correctedCount++;
      } catch (err) {
        console.warn(`[BATCH AI] Failed to apply AI correction to photo ${photoId}:`, err);
      }
    }
    return correctedCount;
  }
}

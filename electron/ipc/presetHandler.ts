import { PresetService } from '../services/presetService';

export class PresetHandler {
  public static handleList(payload?: unknown) {
    let category: string | undefined;
    if (typeof payload === 'object' && payload !== null) {
      const p = payload as Record<string, unknown>;
      if (typeof p.category === 'string') {
        category = p.category;
      }
    }
    return PresetService.listPresets(category);
  }

  public static handleGet(payload: unknown) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid get preset payload');
    }
    const { id } = payload as { id?: unknown };
    if (typeof id !== 'string') {
      throw new Error('Preset id is required');
    }
    return PresetService.getPreset(id);
  }

  public static handleSave(payload: unknown) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid save preset payload');
    }
    const { name, category, parameters } = payload as {
      name?: unknown;
      category?: unknown;
      parameters?: unknown;
    };
    if (typeof name !== 'string' || !name.trim()) {
      throw new Error('Preset name string is required');
    }
    if (typeof parameters !== 'object' || parameters === null) {
      throw new Error('Preset parameters object is required');
    }

    return PresetService.savePreset(
      name.trim(),
      typeof category === 'string' ? category : 'User',
      parameters as Record<string, number>
    );
  }

  public static handleDelete(payload: unknown) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid delete preset payload');
    }
    const { id } = payload as { id?: unknown };
    if (typeof id !== 'string') {
      throw new Error('Preset id is required');
    }
    return PresetService.deletePreset(id);
  }

  public static handleApply(payload: unknown) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid apply preset payload');
    }
    const { photoId, presetId } = payload as { photoId?: unknown; presetId?: unknown };
    if (typeof photoId !== 'string' || typeof presetId !== 'string') {
      throw new Error('photoId and presetId strings are required');
    }
    return PresetService.applyPresetToPhoto(photoId, presetId);
  }

  public static handleApplyBatch(payload: unknown) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid apply batch preset payload');
    }
    const { photoIds, presetId } = payload as { photoIds?: unknown; presetId?: unknown };
    if (!Array.isArray(photoIds) || typeof presetId !== 'string') {
      throw new Error('photoIds array and presetId string are required');
    }
    return PresetService.applyPresetBatch(photoIds as string[], presetId);
  }

  public static async handleApplyBatchAiCorrections(payload: unknown) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid apply batch AI corrections payload');
    }
    const { photoIds } = payload as { photoIds?: unknown };
    if (!Array.isArray(photoIds)) {
      throw new Error('photoIds array is required');
    }
    return PresetService.applyBatchAiCorrections(photoIds as string[]);
  }
}

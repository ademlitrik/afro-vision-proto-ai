import { EditService, DefaultEditValues } from '../services/editService';

export class AIHandler {
  public static handleGetEdits(payload: unknown) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid get edits payload');
    }
    const { photoId } = payload as { photoId?: unknown };
    if (typeof photoId !== 'string' || !photoId) {
      throw new Error('Photo ID string is required');
    }

    return EditService.getEdits(photoId);
  }

  public static handleSaveEdits(payload: unknown) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid save edits payload');
    }
    const { photoId, edits } = payload as { photoId?: unknown; edits?: unknown };
    if (typeof photoId !== 'string' || !photoId) {
      throw new Error('Photo ID string is required');
    }
    if (typeof edits !== 'object' || edits === null) {
      throw new Error('Edits object is required');
    }

    return EditService.saveEdits(photoId, edits as Partial<DefaultEditValues>);
  }

  public static handleResetEdits(payload: unknown) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid reset edits payload');
    }
    const { photoId } = payload as { photoId?: unknown };
    if (typeof photoId !== 'string' || !photoId) {
      throw new Error('Photo ID string is required');
    }

    return EditService.resetEdits(photoId);
  }

  public static async handleAnalyzePhoto(payload: unknown) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid analyze photo payload');
    }
    const { photoId } = payload as { photoId?: unknown };
    if (typeof photoId !== 'string' || !photoId) {
      throw new Error('Photo ID string is required');
    }

    return EditService.analyzePhoto(photoId);
  }

  public static handleGetAnalysis(payload: unknown) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid get analysis payload');
    }
    const { photoId } = payload as { photoId?: unknown };
    if (typeof photoId !== 'string' || !photoId) {
      throw new Error('Photo ID string is required');
    }

    return EditService.getAnalysis(photoId);
  }
}

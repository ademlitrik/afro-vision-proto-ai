import { ProjectService } from '../services/projectService';

export class ProjectHandler {
  public static handleList() {
    return ProjectService.listProjects();
  }

  public static handleGetActive() {
    return ProjectService.getActiveProject();
  }

  public static handleCreate(payload: unknown) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid project create payload');
    }

    const { name, description } = payload as { name?: unknown; description?: unknown };
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Project name must be a non-empty string');
    }

    const descStr = typeof description === 'string' ? description : '';
    return ProjectService.createProject(name.trim(), descStr.trim());
  }

  public static handleSetActive(payload: unknown) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid project setActive payload');
    }

    const { id } = payload as { id?: unknown };
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Project id must be a valid string');
    }

    return ProjectService.setActiveProject(id.trim());
  }
}

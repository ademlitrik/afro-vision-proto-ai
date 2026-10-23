import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Project,
  Photo,
  PhotoMetadata,
  LibraryCounts,
  SystemInfo,
  WorkerStatus,
  FlagType,
  LibraryFilterType,
  ImportProgressEvent,
  ImportResult,
  CacheStats,
  EditParameters,
  ImageAnalysisResult,
  Preset
} from '../types/models';
import { apiService } from '../services/api';

export type ViewMode = 'library' | 'develop' | 'batch' | 'match_look';
export type SortField = 'date' | 'name' | 'rating' | 'size';
export type SortOrder = 'ASC' | 'DESC';

interface AppContextType {
  activeProject: Project | null;
  projects: Project[];
  currentView: ViewMode;
  activeFilter: LibraryFilterType;
  searchQuery: string;
  sortBy: SortField;
  sortOrder: SortOrder;
  photos: Photo[];
  selectedPhotoIds: string[];
  activePhoto: Photo | null;
  activePhotoMetadata: PhotoMetadata | null;
  activeEdits: EditParameters | null;
  activeAnalysis: ImageAnalysisResult | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  zoomLevel: number;
  systemInfo: SystemInfo | null;
  workerStatus: WorkerStatus | null;
  counts: LibraryCounts;
  isLoading: boolean;

  // Import State
  isImporting: boolean;
  importProgress: ImportProgressEvent | null;
  importResult: ImportResult | null;
  dismissImportResult: () => void;

  // Cache State
  cacheStats: CacheStats | null;
  cleanCache: () => Promise<void>;

  // Export & AI Assistant & Shortcuts Modal States
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
  isAiAssistantOpen: boolean;
  setIsAiAssistantOpen: (open: boolean) => void;
  isShortcutsOpen: boolean;
  setIsShortcutsOpen: (open: boolean) => void;

  // Workspace Panel Toggles
  showSidePanels: boolean;
  setShowSidePanels: (show: boolean) => void;
  toggleSidePanels: () => void;

  // Undo / Redo
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;

  // Copy/Paste Edits & Transforms
  copiedEdits: Partial<EditParameters> | null;
  copyEdits: () => void;
  pasteEdits: () => Promise<void>;
  rotatePhoto: (direction: 'cw' | 'ccw') => Promise<void>;
  flipPhoto: (direction: 'h' | 'v') => Promise<void>;

  // Setters & Actions
  setCurrentView: (view: ViewMode) => void;
  setActiveFilter: (filter: LibraryFilterType) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  setZoomLevel: (zoom: number) => void;
  selectPhoto: (photoId: string, multi?: boolean) => void;
  selectRange: (photoId: string) => void;
  selectAllPhotos: () => void;
  clearSelection: () => void;
  refreshProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project>;
  switchProject: (projectId: string) => Promise<void>;
  refreshPhotos: () => Promise<void>;

  // Single photo actions
  updateRating: (photoId: string, rating: number) => Promise<void>;
  updateFlag: (photoId: string, flag: FlagType) => Promise<void>;
  toggleFavorite: (photoId: string) => Promise<void>;

  // Batch actions (Stage 3)
  updateRatingBatch: (rating: number) => Promise<void>;
  updateFlagBatch: (flag: FlagType) => Promise<void>;
  updateFavoriteBatch: (isFavorite: boolean) => Promise<void>;

  // Real Image Analysis Engine & Edits (Stage 4)
  analyzeCurrentPhoto: () => Promise<void>;
  updateEditParam: (key: keyof EditParameters, value: number) => Promise<void>;
  applyAiRecommendations: () => Promise<void>;
  resetEdits: () => Promise<void>;

  // Import
  importFilesPrompt: () => Promise<void>;
  importFolderPrompt: () => Promise<void>;
  importSourcePaths: (paths: string[]) => Promise<void>;
  loadSamplePhotos: () => Promise<void>;
  cancelActiveImport: () => Promise<void>;

  // Presets & Batch Processing (Stage 7)
  presets: Preset[];
  refreshPresets: () => Promise<void>;
  applyPresetToActive: (presetId: string) => Promise<void>;
  applyPresetBatch: (presetId: string) => Promise<void>;
  applyBatchAiCorrections: () => Promise<void>;
  saveCurrentAsPreset: (name: string, category?: string) => Promise<Preset>;
  deletePreset: (presetId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentView, setCurrentView] = useState<ViewMode>('library');
  const [activeFilter, setActiveFilter] = useState<LibraryFilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);
  const [activePhotoMetadata, setActivePhotoMetadata] = useState<PhotoMetadata | null>(null);
  const [activeEdits, setActiveEdits] = useState<EditParameters | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(3);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [counts, setCounts] = useState<LibraryCounts>({
    all: 0,
    picks: 0,
    rejects: 0,
    unflagged: 0,
    favorites: 0,
    rated: 0,
    edited: 0,
    needs_review: 0,
    recent_imports: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Import states
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<ImportProgressEvent | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Presets state (Stage 7)
  const [presets, setPresets] = useState<Preset[]>([]);

  // Export & Copy/Paste & AI Assistant states
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [showSidePanels, setShowSidePanels] = useState<boolean>(true);
  const toggleSidePanels = () => setShowSidePanels(prev => !prev);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);
  const [copiedEdits, setCopiedEdits] = useState<Partial<EditParameters> | null>(null);
  const [undoStack, setUndoStack] = useState<EditParameters[]>([]);
  const [redoStack, setRedoStack] = useState<EditParameters[]>([]);

  // Load telemetry & projects on startup
  useEffect(() => {
    async function init() {
      try {
        const [sys, projList, active, cache, presetList] = await Promise.all([
          apiService.getSystemInfo(),
          apiService.listProjects(),
          apiService.getActiveProject(),
          apiService.getCacheStats(),
          apiService.listPresets()
        ]);
        setSystemInfo(sys);
        setProjects(projList);
        setActiveProject(active || (projList.length > 0 ? projList[0] : null));
        setCacheStats(cache);
        setPresets(presetList);
      } catch (err) {
        console.error('[APP INIT ERROR]', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Listen to import progress events from backend
  useEffect(() => {
    const unsubscribe = apiService.onImportProgress((progress) => {
      setImportProgress(progress);
      if (progress.status === 'processing' || progress.status === 'scanning') {
        setIsImporting(true);
      } else {
        setIsImporting(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Poll worker status periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const status = await apiService.getWorkerStatus();
        setWorkerStatus(status);
      } catch {
        // ignore
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch EXIF metadata, edits & analysis whenever activePhoto changes
  useEffect(() => {
    let isCancelled = false;
    async function loadPhotoDetails() {
      if (!activePhoto) {
        setActivePhotoMetadata(null);
        setActiveEdits(null);
        setActiveAnalysis(null);
        return;
      }
      try {
        const [meta, edits, analysis] = await Promise.all([
          apiService.getPhotoMetadata(activePhoto.id),
          apiService.getPhotoEdits(activePhoto.id),
          apiService.getPhotoAnalysis(activePhoto.id)
        ]);
        if (!isCancelled) {
          setActivePhotoMetadata(meta);
          setActiveEdits(edits);
          setActiveAnalysis(analysis);
        }
      } catch (err) {
        console.warn('[PHOTO DETAILS LOAD ERROR]', err);
      }
    }
    loadPhotoDetails();
    return () => {
      isCancelled = true;
    };
  }, [activePhoto]);

  // Map SortField to backend column names
  const getSortColumn = (field: SortField): string => {
    switch (field) {
      case 'date': return 'import_date';
      case 'name': return 'file_name';
      case 'rating': return 'rating';
      case 'size': return 'file_size';
      default: return 'import_date';
    }
  };

  const refreshPhotos = useCallback(async () => {
    if (!activeProject) return;
    try {
      const [loadedPhotos, countData] = await Promise.all([
        apiService.listPhotos({
          projectId: activeProject.id,
          filterType: activeFilter,
          searchQuery: searchQuery || undefined,
          sortBy: getSortColumn(sortBy),
          sortOrder: sortOrder
        }),
        apiService.getCounts(activeProject.id)
      ]);

      setPhotos(loadedPhotos);
      setCounts(countData);

      if (loadedPhotos.length > 0 && !activePhoto) {
        setActivePhoto(loadedPhotos[0]);
      }
    } catch (err) {
      console.error('[REFRESH PHOTOS ERROR]', err);
    }
  }, [activeProject, activeFilter, searchQuery, sortBy, sortOrder, activePhoto]);

  useEffect(() => {
    refreshPhotos();
  }, [refreshPhotos]);

  const refreshProjects = async () => {
    const list = await apiService.listProjects();
    setProjects(list);
  };

  const createProject = async (name: string, description?: string) => {
    const newProj = await apiService.createProject({ name, description });
    await refreshProjects();
    setActiveProject(newProj);
    return newProj;
  };

  const switchProject = async (projectId: string) => {
    await apiService.setActiveProject(projectId);
    const active = await apiService.getActiveProject();
    setActiveProject(active);
    setSelectedPhotoIds([]);
    setActivePhoto(null);
  };

  const selectPhoto = (photoId: string, multi: boolean = false) => {
    if (multi) {
      setSelectedPhotoIds(prev =>
        prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]
      );
    } else {
      setSelectedPhotoIds([photoId]);
    }
    const found = photos.find(p => p.id === photoId);
    if (found) {
      setActivePhoto(found);
    }
  };

  // Range selection: select from last selected to clicked photo
  const selectRange = (photoId: string) => {
    if (selectedPhotoIds.length === 0) {
      selectPhoto(photoId);
      return;
    }
    const lastSelectedId = selectedPhotoIds[selectedPhotoIds.length - 1];
    const startIdx = photos.findIndex(p => p.id === lastSelectedId);
    const endIdx = photos.findIndex(p => p.id === photoId);
    if (startIdx === -1 || endIdx === -1) {
      selectPhoto(photoId);
      return;
    }
    const low = Math.min(startIdx, endIdx);
    const high = Math.max(startIdx, endIdx);
    const rangeIds = photos.slice(low, high + 1).map(p => p.id);
    setSelectedPhotoIds(prev => {
      const merged = new Set([...prev, ...rangeIds]);
      return Array.from(merged);
    });
    const found = photos.find(p => p.id === photoId);
    if (found) setActivePhoto(found);
  };

  const selectAllPhotos = () => {
    setSelectedPhotoIds(photos.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedPhotoIds([]);
  };

  // --- Single photo operations ---

  const updateRating = async (photoId: string, rating: number) => {
    await apiService.updateRating(photoId, rating);
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, rating } : p));
    if (activePhoto?.id === photoId) {
      setActivePhoto(prev => prev ? { ...prev, rating } : null);
    }
    if (activeProject) {
      const countData = await apiService.getCounts(activeProject.id);
      setCounts(countData);
    }
  };

  const updateFlag = async (photoId: string, flag: FlagType) => {
    await apiService.updateFlag(photoId, flag);
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, flag } : p));
    if (activePhoto?.id === photoId) {
      setActivePhoto(prev => prev ? { ...prev, flag } : null);
    }
    if (activeProject) {
      const countData = await apiService.getCounts(activeProject.id);
      setCounts(countData);
    }
  };

  const toggleFavorite = async (photoId: string) => {
    await apiService.toggleFavorite(photoId);
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, is_favorite: p.is_favorite ? 0 : 1 } : p));
    if (activePhoto?.id === photoId) {
      setActivePhoto(prev => prev ? { ...prev, is_favorite: prev.is_favorite ? 0 : 1 } : null);
    }
    if (activeProject) {
      const countData = await apiService.getCounts(activeProject.id);
      setCounts(countData);
    }
  };

  // --- Batch operations (Stage 3) ---

  const updateRatingBatch = async (rating: number) => {
    if (selectedPhotoIds.length === 0) return;
    await apiService.updateRatingBatch(selectedPhotoIds, rating);
    setPhotos(prev =>
      prev.map(p => selectedPhotoIds.includes(p.id) ? { ...p, rating } : p)
    );
    if (activePhoto && selectedPhotoIds.includes(activePhoto.id)) {
      setActivePhoto(prev => prev ? { ...prev, rating } : null);
    }
    if (activeProject) {
      const countData = await apiService.getCounts(activeProject.id);
      setCounts(countData);
    }
  };

  const updateFlagBatch = async (flag: FlagType) => {
    if (selectedPhotoIds.length === 0) return;
    await apiService.updateFlagBatch(selectedPhotoIds, flag);
    setPhotos(prev =>
      prev.map(p => selectedPhotoIds.includes(p.id) ? { ...p, flag } : p)
    );
    if (activePhoto && selectedPhotoIds.includes(activePhoto.id)) {
      setActivePhoto(prev => prev ? { ...prev, flag } : null);
    }
    if (activeProject) {
      const countData = await apiService.getCounts(activeProject.id);
      setCounts(countData);
    }
  };

  const updateFavoriteBatch = async (isFavorite: boolean) => {
    if (selectedPhotoIds.length === 0) return;
    await apiService.updateFavoriteBatch(selectedPhotoIds, isFavorite);
    const favValue = isFavorite ? 1 : 0;
    setPhotos(prev =>
      prev.map(p => selectedPhotoIds.includes(p.id) ? { ...p, is_favorite: favValue } : p)
    );
    if (activePhoto && selectedPhotoIds.includes(activePhoto.id)) {
      setActivePhoto(prev => prev ? { ...prev, is_favorite: favValue } : null);
    }
    if (activeProject) {
      const countData = await apiService.getCounts(activeProject.id);
      setCounts(countData);
    }
  };

  // --- AI Analysis & Edits (Stage 4) ---

  const analyzeCurrentPhoto = async () => {
    if (!activePhoto) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const result = await apiService.analyzePhoto(activePhoto.id);
      setActiveAnalysis(result);
      setPhotos(prev => prev.map(p => p.id === activePhoto.id ? { ...p, has_ai_analysis: 1 } : p));
      setActivePhoto(prev => prev ? { ...prev, has_ai_analysis: 1 } : null);
      if (activeProject) {
        const countData = await apiService.getCounts(activeProject.id);
        setCounts(countData);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[AI ANALYSIS ERROR]', msg);
      setAnalysisError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateEditParam = async (key: keyof EditParameters, value: number) => {
    if (!activePhoto || !activeEdits) return;
    setUndoStack(prev => [...prev.slice(-30), activeEdits]);
    setRedoStack([]);
    const updated = { ...activeEdits, [key]: value };
    setActiveEdits(updated);
    await apiService.savePhotoEdits(activePhoto.id, { [key]: value });
    setPhotos(prev => prev.map(p => p.id === activePhoto.id ? { ...p, is_edited: 1 } : p));
    if (activeProject) {
      const countData = await apiService.getCounts(activeProject.id);
      setCounts(countData);
    }
  };

  const undo = async () => {
    if (undoStack.length === 0 || !activePhoto || !activeEdits) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, activeEdits]);
    setActiveEdits(previous);
    await apiService.savePhotoEdits(activePhoto.id, previous);
  };

  const redo = async () => {
    if (redoStack.length === 0 || !activePhoto || !activeEdits) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, activeEdits]);
    setActiveEdits(next);
    await apiService.savePhotoEdits(activePhoto.id, next);
  };

  const applyAiRecommendations = async () => {
    if (!activePhoto || !activeAnalysis) return;
    const rec = activeAnalysis.recommendations;
    const newEdits: Partial<EditParameters> = {
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
      clarity: rec.clarity.value,
      texture: rec.texture.value,
      sharpening: rec.sharpening.value,
      noise_reduction: rec.noiseReduction.value,
      dehaze: rec.dehaze.value
    };
    const saved = await apiService.savePhotoEdits(activePhoto.id, newEdits);
    setActiveEdits(saved);
    setPhotos(prev => prev.map(p => p.id === activePhoto.id ? { ...p, is_edited: 1 } : p));
    if (activeProject) {
      const countData = await apiService.getCounts(activeProject.id);
      setCounts(countData);
    }
  };

  const resetEdits = async () => {
    if (!activePhoto) return;
    const reset = await apiService.resetPhotoEdits(activePhoto.id);
    setActiveEdits(reset);
    setPhotos(prev => prev.map(p => p.id === activePhoto.id ? { ...p, is_edited: 0 } : p));
    if (activeProject) {
      const countData = await apiService.getCounts(activeProject.id);
      setCounts(countData);
    }
  };

  // --- Import operations ---

  const importSourcePaths = async (paths: string[]) => {
    if (!activeProject || paths.length === 0) return;
    setIsImporting(true);
    try {
      const result = await apiService.importFiles(paths, activeProject.id);
      setImportResult(result);
      await refreshPhotos();
      const updatedCache = await apiService.getCacheStats();
      setCacheStats(updatedCache);
    } catch (err) {
      console.error('[IMPORT EXECUTION ERROR]', err);
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  const importFilesPrompt = async () => {
    const files = await apiService.selectFiles();
    if (files.length > 0) {
      await importSourcePaths(files);
    }
  };

  const importFolderPrompt = async () => {
    const folder = await apiService.selectFolder();
    if (folder) {
      await importSourcePaths([folder]);
    }
  };

  const loadSamplePhotos = async () => {
    if (!activeProject) return;
    setIsImporting(true);
    try {
      const result = await apiService.loadSamplePhotos(activeProject.id);
      setImportResult(result);
      await refreshPhotos();
      const updatedCache = await apiService.getCacheStats();
      setCacheStats(updatedCache);
    } catch (err) {
      console.error('[LOAD SAMPLES ERROR]', err);
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  const cancelActiveImport = async () => {
    if (importProgress?.jobId) {
      await apiService.cancelImport(importProgress.jobId);
    }
  };

  const dismissImportResult = () => {
    setImportResult(null);
  };

  const cleanCache = async () => {
    const res = await apiService.cleanCache();
    const updated = await apiService.getCacheStats();
    setCacheStats(updated);
    alert(`Cleaned cache: Removed ${res.removedCount} orphaned files, reclaimed ${(res.reclaimedBytes / (1024 * 1024)).toFixed(1)} MB.`);
  };

  // --- Presets & Batch Processing (Stage 7) ---

  const refreshPresets = useCallback(async () => {
    try {
      const list = await apiService.listPresets();
      setPresets(list);
    } catch (err) {
      console.warn('[PRESET LOAD ERROR]', err);
    }
  }, []);

  const applyPresetToActive = async (presetId: string) => {
    if (!activePhoto) return;
    try {
      const updated = await apiService.applyPreset(activePhoto.id, presetId);
      setActiveEdits(updated);
      setPhotos(prev => prev.map(p => p.id === activePhoto.id ? { ...p, is_edited: 1 } : p));
      if (activeProject) {
        const countData = await apiService.getCounts(activeProject.id);
        setCounts(countData);
      }
    } catch (err) {
      console.error('[APPLY PRESET ERROR]', err);
    }
  };

  const applyPresetBatch = async (presetId: string) => {
    if (selectedPhotoIds.length === 0) return;
    try {
      await apiService.applyPresetBatch(selectedPhotoIds, presetId);
      await refreshPhotos();
      if (activePhoto && selectedPhotoIds.includes(activePhoto.id)) {
        const refreshed = await apiService.getPhotoEdits(activePhoto.id);
        setActiveEdits(refreshed);
      }
    } catch (err) {
      console.error('[APPLY BATCH PRESET ERROR]', err);
    }
  };

  const applyBatchAiCorrections = async () => {
    const targets = selectedPhotoIds.length > 0 ? selectedPhotoIds : photos.map(p => p.id);
    if (targets.length === 0) return;
    setIsAnalyzing(true);
    try {
      await apiService.applyBatchAiCorrections(targets);
      await refreshPhotos();
      if (activePhoto && targets.includes(activePhoto.id)) {
        const [refreshedEdits, refreshedAnalysis] = await Promise.all([
          apiService.getPhotoEdits(activePhoto.id),
          apiService.getPhotoAnalysis(activePhoto.id)
        ]);
        setActiveEdits(refreshedEdits);
        setActiveAnalysis(refreshedAnalysis);
      }
    } catch (err) {
      console.error('[BATCH AI CORRECTIONS ERROR]', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveCurrentAsPreset = async (name: string, category: string = 'User'): Promise<Preset> => {
    if (!activeEdits) throw new Error('No active edits to save as preset');
    const newPreset = await apiService.savePreset({
      name,
      category,
      parameters: activeEdits
    });
    await refreshPresets();
    return newPreset;
  };

  const deletePreset = async (presetId: string) => {
    await apiService.deletePreset(presetId);
    await refreshPresets();
  };

  const copyEdits = () => {
    if (activeEdits) {
      setCopiedEdits({ ...activeEdits });
    }
  };

  const pasteEdits = async () => {
    if (!copiedEdits) return;
    const targets = selectedPhotoIds.length > 0
      ? selectedPhotoIds
      : activePhoto
      ? [activePhoto.id]
      : [];
    if (targets.length === 0) return;

    for (const id of targets) {
      try {
        await apiService.savePhotoEdits(id, copiedEdits);
      } catch (err) {
        console.error(`[PASTE EDITS ERROR for ${id}]`, err);
      }
    }

    await refreshPhotos();
    if (activePhoto && targets.includes(activePhoto.id)) {
      const refreshed = await apiService.getPhotoEdits(activePhoto.id);
      setActiveEdits(refreshed);
    }
  };

  const rotatePhoto = async (direction: 'cw' | 'ccw') => {
    if (!activePhoto || !activeEdits) return;
    const currentRot = activeEdits.rotate || 0;
    const delta = direction === 'cw' ? 90 : -90;
    const newRot = (currentRot + delta + 360) % 360;
    await updateEditParam('rotate', newRot);
  };

  const flipPhoto = async (direction: 'h' | 'v') => {
    if (!activePhoto || !activeEdits) return;
    if (direction === 'h') {
      const current = activeEdits.flip_h || 0;
      await updateEditParam('flip_h', current === 1 ? 0 : 1);
    } else {
      const current = activeEdits.flip_v || 0;
      await updateEditParam('flip_v', current === 1 ? 0 : 1);
    }
  };

  // Listen to application menu events from native Electron menu bar
  useEffect(() => {
    const unsubscribe = apiService.onMenuAction(async (action) => {
      switch (action) {
        case 'file:new-session':
          // handled by top app bar modal or project creator
          break;
        case 'file:import-photos':
          await importFilesPrompt();
          break;
        case 'file:import-folder':
          await importFolderPrompt();
          break;
        case 'file:load-samples':
          await loadSamplePhotos();
          break;
        case 'file:export':
        case 'file:export-current':
        case 'file:export-selected':
        case 'file:batch-export':
          setIsExportModalOpen(true);
          break;
        case 'edit:undo':
          await undo();
          break;
        case 'edit:redo':
          await redo();
          break;
        case 'edit:select-all':
          selectAllPhotos();
          break;
        case 'edit:deselect-all':
          clearSelection();
          break;
        case 'edit:copy-settings':
          copyEdits();
          break;
        case 'edit:paste-settings':
          await pasteEdits();
          break;
        case 'edit:reset-adjustments':
          await resetEdits();
          break;
        case 'view:library':
          setCurrentView('library');
          break;
        case 'view:develop':
          setCurrentView('develop');
          break;
        case 'view:match-look':
          setCurrentView('match_look');
          break;
        case 'view:batch':
          setCurrentView('batch');
          break;
        case 'photo:rotate-cw':
          await rotatePhoto('cw');
          break;
        case 'photo:rotate-ccw':
          await rotatePhoto('ccw');
          break;
        case 'photo:flip-h':
          await flipPhoto('h');
          break;
        case 'photo:flip-v':
          await flipPhoto('v');
          break;
        case 'photo:flag-pick':
          if (activePhoto) await updateFlag(activePhoto.id, 'pick');
          break;
        case 'photo:flag-reject':
          if (activePhoto) await updateFlag(activePhoto.id, 'reject');
          break;
        case 'photo:flag-unflag':
          if (activePhoto) await updateFlag(activePhoto.id, 'unflagged');
          break;
        case 'photo:toggle-fav':
          if (activePhoto) await toggleFavorite(activePhoto.id);
          break;
        case 'photo:rate-1':
        case 'photo:rate-2':
        case 'photo:rate-3':
        case 'photo:rate-4':
        case 'photo:rate-5': {
          const star = parseInt(action.replace('photo:rate-', ''), 10);
          if (activePhoto) await updateRating(activePhoto.id, star);
          break;
        }
        case 'photo:rate-0':
          if (activePhoto) await updateRating(activePhoto.id, 0);
          break;
        case 'photo:ai-enhance':
        case 'develop:auto-ai':
          await analyzeCurrentPhoto();
          await applyAiRecommendations();
          break;
        case 'ai:assistant':
        case 'view:ai-studio':
          setIsAiAssistantOpen(true);
          break;
        case 'help:shortcuts':
          setIsShortcutsOpen(true);
          break;
        case 'view:toggle-panels':
          toggleSidePanels();
          break;
        default:
          break;
      }
    });
    return () => unsubscribe();
  }, [
    activePhoto,
    activeEdits,
    copiedEdits,
    selectedPhotoIds,
    importFilesPrompt,
    importFolderPrompt,
    loadSamplePhotos,
    selectAllPhotos,
    clearSelection,
    resetEdits,
    updateFlag,
    toggleFavorite,
    updateRating,
    analyzeCurrentPhoto,
    applyAiRecommendations
  ]);


  return (
    <AppContext.Provider
      value={{
        activeProject,
        projects,
        currentView,
        activeFilter,
        searchQuery,
        sortBy,
        sortOrder,
        photos,
        selectedPhotoIds,
        activePhoto,
        activePhotoMetadata,
        activeEdits,
        activeAnalysis,
        isAnalyzing,
        analysisError,
        zoomLevel,
        systemInfo,
        workerStatus,
        counts,
        isLoading,
        isImporting,
        importProgress,
        importResult,
        cacheStats,
        dismissImportResult,
        cleanCache,
        setCurrentView,
        setActiveFilter,
        setSearchQuery,
        setSortBy,
        setSortOrder,
        setZoomLevel,
        selectPhoto,
        selectRange,
        selectAllPhotos,
        clearSelection,
        refreshProjects,
        createProject,
        switchProject,
        refreshPhotos,
        updateRating,
        updateFlag,
        toggleFavorite,
        updateRatingBatch,
        updateFlagBatch,
        updateFavoriteBatch,
        analyzeCurrentPhoto,
        updateEditParam,
        applyAiRecommendations,
        resetEdits,
        importFilesPrompt,
        importFolderPrompt,
        importSourcePaths,
        loadSamplePhotos,
        cancelActiveImport,
        presets,
        refreshPresets,
        applyPresetToActive,
        applyPresetBatch,
        applyBatchAiCorrections,
        saveCurrentAsPreset,
        deletePreset,
        isExportModalOpen,
        setIsExportModalOpen,
        isShortcutsOpen,
        setIsShortcutsOpen,
        showSidePanels,
        setShowSidePanels,
        toggleSidePanels,
        copiedEdits,
        copyEdits,
        pasteEdits,
        rotatePhoto,
        flipPhoto,
        isAiAssistantOpen,
        setIsAiAssistantOpen,
        undo,
        redo,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

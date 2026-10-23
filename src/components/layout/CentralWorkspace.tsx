import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../hooks/useApp';
import { SortField } from '../../state/AppContext';
import {
  Grid,
  Columns,
  Maximize2,
  FolderUp,
  FolderOpen,
  Image as ImageIcon,
  CheckSquare,
  Square,
  FileCheck,
  Star,
  Flag,
  Heart,
  Search,
  X,
  ArrowUpDown,
  Split,
  Eye,
  RotateCw,
  ZoomIn,
  Sparkles
} from 'lucide-react';
import { formatBytes } from '../../utils/formatters';
import { FlagType } from '../../types/models';
import { computePreviewFilterStyle } from '../../utils/previewFilters';
import { PhotoContextMenu } from '../common/PhotoContextMenu';

export const CentralWorkspace: React.FC = () => {
  const {
    photos,
    selectedPhotoIds,
    activePhoto,
    activeEdits,
    zoomLevel,
    searchQuery,
    sortBy,
    sortOrder,
    setSearchQuery,
    setSortBy,
    setSortOrder,
    selectPhoto,
    selectRange,
    selectAllPhotos,
    clearSelection,
    importFilesPrompt,
    importFolderPrompt,
    importSourcePaths,
    loadSamplePhotos,
    updateRating,
    updateFlag,
    toggleFavorite,
    updateRatingBatch,
    updateFlagBatch,
    updateFavoriteBatch,
    presets,
    applyPresetBatch,
    applyBatchAiCorrections,
    currentView,
    setCurrentView,
    copyEdits,
    pasteEdits,
    rotatePhoto,
    setIsExportModalOpen,
    // added for shortcuts and panel toggle
    toggleSidePanels,
    setIsShortcutsOpen
  } = useApp();

  const [workspaceMode, setWorkspaceMode] = useState<'grid' | 'loupe' | 'split'>('grid');

  // Synchronize top app bar view mode with workspace mode
  useEffect(() => {
    if (currentView === 'develop') {
      setWorkspaceMode('loupe');
    } else if (currentView === 'match_look') {
      setWorkspaceMode('split');
    } else if (currentView === 'library') {
      setWorkspaceMode('grid');
    } else if (currentView === 'batch') {
      setWorkspaceMode('grid');
      if (selectedPhotoIds.length === 0 && photos.length > 0) {
        selectAllPhotos();
      }
    }
  }, [currentView, photos.length, selectedPhotoIds.length, selectAllPhotos]);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);
  const [isBeforeActive, setIsBeforeActive] = useState<boolean>(false);
  const [loupeZoom, setLoupeZoom] = useState<'fit' | '100' | '200'>('fit');
  const [contextMenu, setContextMenu] = useState<{ photoId: string; x: number; y: number } | null>(null);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);

  const supportedFormats = [
    'JPEG', 'JPG', 'PNG', 'TIFF', 'WEBP', 'HEIC',
    'DNG', 'CR2', 'CR3', 'NEF', 'ARW', 'RAF'
  ];

  // --- Keyboard shortcuts ---
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

    const isMod = e.ctrlKey || e.metaKey;

    // Select all: Ctrl/Cmd+A
    if (isMod && e.key === 'a') {
      e.preventDefault();
      selectAllPhotos();
      return;
    }

    // Toggle side panels: Tab
    if (!isMod && e.key === 'Tab') {
      e.preventDefault();
      toggleSidePanels();
      return;
    }
    if (isMod && (e.key === 'e' || e.key === 'E')) {
      e.preventDefault();
      setIsExportModalOpen(true);
      return;
    }

    // Copy Adjustments: Ctrl+Shift+C
    if (isMod && e.shiftKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      copyEdits();
      return;
    }

    // Paste Adjustments: Ctrl+Shift+V
    if (isMod && e.shiftKey && (e.key === 'v' || e.key === 'V')) {
      e.preventDefault();
      pasteEdits();
      return;
    }

    // Toggle Before / After: B
    if (!isMod && (e.key === 'b' || e.key === 'B')) {
      setIsBeforeActive(prev => !prev);
      return;
    }

    // Rating keys: 0-5
    if (!isMod && !e.shiftKey && !e.altKey && e.key >= '0' && e.key <= '5') {
      const rating = parseInt(e.key, 10);
      if (activePhoto) {
        updateRating(activePhoto.id, rating);
      }
      return;
    }

    // Flag shortcuts
    if (!isMod && !e.shiftKey) {
      if (e.key === 'p' || e.key === 'P') {
        if (activePhoto) updateFlag(activePhoto.id, 'pick');
        return;
      }
      if (e.key === 'x' || e.key === 'X') {
        if (activePhoto) updateFlag(activePhoto.id, 'reject');
        return;
      }
      if (e.key === 'u' || e.key === 'U') {
        if (activePhoto) updateFlag(activePhoto.id, 'unflagged');
        return;
      }
    }

    // Arrow key navigation
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (photos.length === 0) return;
      const currentIdx = activePhoto ? photos.findIndex(p => p.id === activePhoto.id) : -1;
      const nextIdx = Math.min(currentIdx + 1, photos.length - 1);
      selectPhoto(photos[nextIdx].id);
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (photos.length === 0) return;
      const currentIdx = activePhoto ? photos.findIndex(p => p.id === activePhoto.id) : photos.length;
      const prevIdx = Math.max(currentIdx - 1, 0);
      selectPhoto(photos[prevIdx].id);
      return;
    }

    // View modes
    if (e.key === 'g' || e.key === 'G') {
      setWorkspaceMode('grid');
      return;
    }
    if (e.key === 'e' || e.key === 'E') {
      setWorkspaceMode('loupe');
      return;
    }
    if (e.key === 'c' || e.key === 'C') {
      setWorkspaceMode('split');
      return;
    }
    if (e.key === 'Escape') {
      setWorkspaceMode('grid');
      return;
    }
  }, [activePhoto, photos, selectPhoto, selectAllPhotos, updateRating, updateFlag]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Drag and Drop Ingestion Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const paths: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let filePath = (file as unknown as { path?: string }).path;
      if (!filePath && apiService.getPathForFile) {
        try {
          filePath = apiService.getPathForFile(file);
        } catch (err) {
          console.warn('[DROP] Could not resolve file path via webUtils:', err);
        }
      }
      if (filePath) {
        paths.push(filePath);
      }
    }

    if (paths.length > 0) {
      await importSourcePaths(paths);
    }
  };

  const getMediaUrl = (absPath: string | null): string => {
    if (!absPath) return '';
    const normalized = absPath.replace(/\\/g, '/');
    return `media:///${normalized}`;
  };

  const hasMultiSelection = selectedPhotoIds.length > 1;

  const handlePhotoClick = (photoId: string, e: React.MouseEvent) => {
    if (e.shiftKey) {
      selectRange(photoId);
    } else {
      selectPhoto(photoId, e.ctrlKey || e.metaKey);
    }
  };

  const handlePhotoDoubleClick = (photoId: string) => {
    selectPhoto(photoId);
    setWorkspaceMode('loupe');
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as SortField);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
  };

  // Pan handlers when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    if (loupeZoom === 'fit') return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || loupeZoom === 'fit') return;
    setPanOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Reset pan on photo change or zoom mode change
  useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
  }, [activePhoto?.id, loupeZoom]);

  // Compute live visual filters from non-destructive edits
  const afterStyle = computePreviewFilterStyle(activeEdits, false);
  const beforeStyle = computePreviewFilterStyle(activeEdits, true);
  const currentPreviewStyle = isBeforeActive ? beforeStyle : afterStyle;

  const activePhotoImgUrl = activePhoto
    ? getMediaUrl(activePhoto.preview_path || activePhoto.thumbnail_path || activePhoto.file_path)
    : '';

  return (
    <main
      ref={containerRef}
      style={styles.container}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div style={styles.dragOverlay}>
          <div style={styles.dragOverlayContent}>
            <FolderUp size={54} color="var(--accent-gold)" />
            <h2 style={styles.dragTitle}>DROP TO IMPORT PHOTOGRAPHS</h2>
            <p style={styles.dragSubtitle}>
              Automatic checksum deduplication, metadata extraction & non-destructive cataloging
            </p>
          </div>
        </div>
      )}

      {/* Top Workspace Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          {/* Workspace Mode Toggle Group */}
          <div style={styles.viewButtonGroup}>
            <button
              style={{ ...styles.viewBtn, ...(workspaceMode === 'grid' ? styles.viewBtnActive : {}) }}
              onClick={() => {
                setWorkspaceMode('grid');
                setCurrentView('library');
              }}
              title="Grid View (G)"
            >
              <Grid size={14} />
            </button>
            <button
              style={{ ...styles.viewBtn, ...(workspaceMode === 'loupe' ? styles.viewBtnActive : {}) }}
              onClick={() => {
                setWorkspaceMode('loupe');
                setCurrentView('develop');
              }}
              disabled={!activePhoto}
              title="Single Photo / Loupe View (E / D)"
            >
              <Maximize2 size={14} />
            </button>
            <button
              style={{ ...styles.viewBtn, ...(workspaceMode === 'split' ? styles.viewBtnActive : {}) }}
              onClick={() => {
                setWorkspaceMode('split');
                setCurrentView('match_look');
              }}
              disabled={!activePhoto}
              title="Split Before/After Comparison (C / M)"
            >
              <Columns size={14} />
            </button>
          </div>

          {/* In Loupe / Split Mode: Before/After toggle & Zoom Controls */}
          {workspaceMode !== 'grid' && activePhoto && (
            <div style={styles.developControls}>
              <button
                style={{
                  ...styles.beforeAfterBtn,
                  ...(isBeforeActive ? styles.beforeAfterBtnActive : {})
                }}
                onClick={() => setIsBeforeActive(prev => !prev)}
                title="Toggle Before / After (B)"
              >
                <Eye size={12} />
                <span>{isBeforeActive ? 'BEFORE (ORIGINAL)' : 'AFTER (EDITED)'}</span>
              </button>

              <div style={styles.zoomGroup}>
                <button
                  style={{ ...styles.zoomBtn, ...(loupeZoom === 'fit' ? styles.zoomBtnActive : {}) }}
                  onClick={() => setLoupeZoom('fit')}
                >
                  FIT
                </button>
                <button
                  style={{ ...styles.zoomBtn, ...(loupeZoom === '100' ? styles.zoomBtnActive : {}) }}
                  onClick={() => setLoupeZoom('100')}
                >
                  100%
                </button>
                <button
                  style={{ ...styles.zoomBtn, ...(loupeZoom === '200' ? styles.zoomBtnActive : {}) }}
                  onClick={() => setLoupeZoom('200')}
                >
                  200%
                </button>
              </div>

              <button
                style={styles.zoomBtn}
                onClick={() => rotatePhoto('cw')}
                title="Rotate 90° Clockwise (Ctrl+])"
              >
                <RotateCw size={12} />
              </button>

              <button
                style={styles.zoomBtn}
                onClick={copyEdits}
                title="Copy Edit Adjustments (Ctrl+Shift+C)"
              >
                Copy
              </button>

              <button
                style={styles.zoomBtn}
                onClick={pasteEdits}
                title="Paste Edit Adjustments (Ctrl+Shift+V)"
              >
                Paste
              </button>

              <button
                style={{ ...styles.zoomBtn, backgroundColor: '#2563eb', color: '#fff' }}
                onClick={() => setIsExportModalOpen(true)}
                title="Export this photo (Ctrl+E)"
              >
                Export
              </button>

              <span style={styles.fileNameDevelop}>{activePhoto.file_name}</span>
            </div>
          )}

          {/* In Grid Mode: Photo Count & Selection Details */}
          {workspaceMode === 'grid' && (
            <div style={styles.selectionInfo}>
              <span>{photos.length} photos</span>
              {selectedPhotoIds.length > 0 && (
                <span style={styles.selectionHighlight}>
                  ({selectedPhotoIds.length} selected)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Toolbar Center / Right */}
        <div style={styles.toolbarRight}>
          {workspaceMode === 'grid' ? (
            <>
              {/* Search Bar */}
              <div style={styles.searchContainer}>
                <Search size={13} color="var(--text-muted)" style={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Filter by filename..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  style={styles.searchInput}
                />
                {localSearch && (
                  <button style={styles.clearSearchBtn} onClick={() => setLocalSearch('')}>
                    <X size={11} />
                  </button>
                )}
              </div>

              {/* Sort Selector */}
              <div style={styles.sortContainer}>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  style={styles.sortSelect}
                >
                  <option value="date">Date</option>
                  <option value="name">Name</option>
                  <option value="rating">Rating</option>
                  <option value="size">Size</option>
                </select>
                <button
                  style={styles.sortOrderBtn}
                  onClick={toggleSortOrder}
                  title={`Sort ${sortOrder === 'ASC' ? 'Ascending' : 'Descending'}`}
                >
                  <ArrowUpDown size={12} />
                  <span>{sortOrder}</span>
                </button>
              </div>
            </>
          ) : (
            <button
              style={styles.backToGridBtn}
              onClick={() => setWorkspaceMode('grid')}
              title="Return to Grid View (Esc)"
            >
              <Grid size={13} />
              <span>Back to Library Grid</span>
            </button>
          )}
        </div>
      </div>

      {/* Multi-Selection Batch Actions Toolbar */}
      {hasMultiSelection && workspaceMode === 'grid' && (
        <div style={styles.batchToolbar}>
          <span style={styles.batchCount}>
            {selectedPhotoIds.length} photos selected:
          </span>
          <div style={styles.batchGroup}>
            <span style={styles.batchLabel}>Set Flag:</span>
            <button style={styles.batchBtn} onClick={() => updateFlagBatch('pick')}>
              <Flag size={11} color="var(--accent-green)" /> Pick
            </button>
            <button style={styles.batchBtn} onClick={() => updateFlagBatch('reject')}>
              ✕ Reject
            </button>
            <button style={styles.batchBtn} onClick={() => updateFlagBatch('unflagged')}>
              Unflag
            </button>
          </div>
          <div style={styles.batchDivider} />
          <div style={styles.batchGroup}>
            <span style={styles.batchLabel}>Set Rating:</span>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                style={styles.batchStarBtn}
                onClick={() => updateRatingBatch(star)}
              >
                ★{star}
              </button>
            ))}
            <button style={styles.batchStarBtn} onClick={() => updateRatingBatch(0)}>
              0
            </button>
          </div>
          <div style={styles.batchDivider} />
          <button style={styles.batchBtn} onClick={() => updateFavoriteBatch(true)}>
            <Heart size={11} color="#f43f5e" /> Favorite
          </button>
          <div style={styles.batchDivider} />
          <button
            style={styles.batchGoldBtn}
            onClick={applyBatchAiCorrections}
            title="Batch apply skin-protected AI corrections to all selected photos"
          >
            <Sparkles size={11} color="#000" /> Auto-Correct ({selectedPhotoIds.length})
          </button>
          <div style={styles.batchGroup}>
            <span style={styles.batchLabel}>Preset:</span>
            <select
              style={styles.batchSelect}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  applyPresetBatch(e.target.value);
                  e.target.value = '';
                }
              }}
            >
              <option value="" disabled>Apply Preset...</option>
              {presets.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
              ))}
            </select>
          </div>
          <div style={styles.batchDivider} />
          <button
            style={{ ...styles.batchGoldBtn, backgroundColor: '#2563eb', color: '#ffffff' }}
            onClick={() => setIsExportModalOpen(true)}
            title="Batch Export selected photographs"
          >
            Export ({selectedPhotoIds.length})
          </button>
          <div style={styles.batchDivider} />
          <button style={styles.batchBtn} onClick={clearSelection}>
            Deselect All
          </button>
        </div>
      )}

      {/* Main Canvas Area */}
      <div style={styles.canvas}>
        {photos.length === 0 ? (
          /* Empty Catalog State */
          <div style={styles.emptyStateContainer}>
            <div style={styles.dropZone}>
              <div style={styles.emptyIconCircle}>
                <ImageIcon size={36} color="var(--accent-gold)" />
              </div>
              <h2 style={styles.emptyTitle}>NO PHOTOGRAPHS IN CURRENT VIEW</h2>
              <p style={styles.emptySubtitle}>
                Drag and drop RAW or JPEG files/folders here, or import via file picker to initialize your non-destructive catalog.
              </p>

              <div style={styles.emptyActionRow}>
                <button style={styles.importPrimaryBtn} onClick={importFilesPrompt}>
                  <FolderUp size={16} />
                  <span>Import Photographs</span>
                </button>
                <button style={styles.importSecondaryBtn} onClick={importFolderPrompt}>
                  <FolderOpen size={16} />
                  <span>Import Entire Folder</span>
                </button>
                <button
                  style={styles.demoPhotosBtn}
                  onClick={loadSamplePhotos}
                  title="Generate & import 4 melanin studio portrait photos for instant testing"
                >
                  <Sparkles size={16} />
                  <span>Load Sample Studio Photos</span>
                </button>
              </div>

              {/* Supported Formats Pill Bar */}
              <div style={styles.formatsSection}>
                <div style={styles.formatsLabel}>
                  <FileCheck size={12} color="#9da3af" style={{ marginRight: 4 }} />
                  <span>SUPPORTED FORMATS & EXTENSIBLE RAW ENGINE</span>
                </div>
                <div style={styles.formatPills}>
                  {supportedFormats.map(fmt => (
                    <span key={fmt} style={styles.formatPill}>{fmt}</span>
                  ))}
                </div>
              </div>

              <div style={styles.securityNote}>
                🔒 <strong>Zero Destruction Guarantee:</strong> Original RAW/JPEG files are NEVER modified.
              </div>
            </div>
          </div>
        ) : workspaceMode === 'loupe' && activePhoto ? (
          /* SINGLE PHOTO DEVELOP / LOUPE VIEW WITH REAL-TIME FILTER ENGINE */
          <div
            style={styles.developContainer}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <div style={styles.developViewport}>
              <div
                style={{
                  ...styles.developImageWrapper,
                  transform: loupeZoom === 'fit'
                    ? 'none'
                    : `translate(${panOffset.x}px, ${panOffset.y}px) scale(${loupeZoom === '100' ? 1.0 : 2.0})`,
                  cursor: loupeZoom === 'fit' ? 'default' : (isPanning ? 'grabbing' : 'grab')
                }}
              >
                <img
                  src={activePhotoImgUrl}
                  alt={activePhoto.file_name}
                  style={{
                    ...styles.developImage,
                    filter: currentPreviewStyle.filter,
                    transform: currentPreviewStyle.transform
                  }}
                  draggable={false}
                />

                {/* Color Temperature Tint Overlay */}
                {currentPreviewStyle.tintOverlayColor && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: currentPreviewStyle.tintOverlayColor,
                      opacity: currentPreviewStyle.tintOverlayOpacity,
                      mixBlendMode: 'soft-light',
                      pointerEvents: 'none'
                    }}
                  />
                )}

                {/* Vignette Overlay */}
                {currentPreviewStyle.vignetteStyle && (
                  <div style={currentPreviewStyle.vignetteStyle} />
                )}
              </div>

              {/* Floating Mode Indicator Badge */}
              <div style={styles.floatingModeBadge}>
                {isBeforeActive ? (
                  <span style={styles.modeBadgeBefore}>BEFORE (ORIGINAL)</span>
                ) : (
                  <span style={styles.modeBadgeAfter}>AFTER (NON-DESTRUCTIVE EDITED)</span>
                )}
              </div>
            </div>

            {/* Bottom Filmstrip for fast switching */}
            <div style={styles.filmstripContainer}>
              {photos.map(p => {
                const isActive = activePhoto.id === p.id;
                return (
                  <div
                    key={p.id}
                    style={{
                      ...styles.filmstripItem,
                      ...(isActive ? styles.filmstripItemActive : {})
                    }}
                    onClick={() => selectPhoto(p.id)}
                  >
                    <img
                      src={getMediaUrl(p.thumbnail_path)}
                      alt={p.file_name}
                      style={styles.filmstripImg}
                      loading="lazy"
                    />
                    {p.is_edited === 1 && <span style={styles.filmstripEditedDot} />}
                  </div>
                );
              })}
            </div>
          </div>
        ) : workspaceMode === 'split' && activePhoto ? (
          /* SPLIT BEFORE / AFTER SIDE-BY-SIDE COMPARISON */
          <div style={styles.developContainer}>
            <div style={styles.splitViewport}>
              {/* Left: Original Before */}
              <div style={styles.splitPane}>
                <div style={styles.splitPaneHeader}>
                  <span style={styles.modeBadgeBefore}>BEFORE (ORIGINAL)</span>
                </div>
                <div style={styles.splitImageWrapper}>
                  <img
                    src={activePhotoImgUrl}
                    alt="Original"
                    style={styles.developImage}
                    draggable={false}
                  />
                </div>
              </div>

              {/* Divider Line */}
              <div style={styles.splitDividerLine} />

              {/* Right: Edited After */}
              <div style={styles.splitPane}>
                <div style={styles.splitPaneHeader}>
                  <span style={styles.modeBadgeAfter}>AFTER (EDITED)</span>
                </div>
                <div style={styles.splitImageWrapper}>
                  <img
                    src={activePhotoImgUrl}
                    alt="Edited"
                    style={{
                      ...styles.developImage,
                      filter: afterStyle.filter,
                      transform: afterStyle.transform
                    }}
                    draggable={false}
                  />

                  {afterStyle.tintOverlayColor && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: afterStyle.tintOverlayColor,
                        opacity: afterStyle.tintOverlayOpacity,
                        mixBlendMode: 'soft-light',
                        pointerEvents: 'none'
                      }}
                    />
                  )}

                  {afterStyle.vignetteStyle && (
                    <div style={afterStyle.vignetteStyle} />
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Filmstrip */}
            <div style={styles.filmstripContainer}>
              {photos.map(p => {
                const isActive = activePhoto.id === p.id;
                return (
                  <div
                    key={p.id}
                    style={{
                      ...styles.filmstripItem,
                      ...(isActive ? styles.filmstripItemActive : {})
                    }}
                    onClick={() => selectPhoto(p.id)}
                  >
                    <img
                      src={getMediaUrl(p.thumbnail_path)}
                      alt={p.file_name}
                      style={styles.filmstripImg}
                      loading="lazy"
                    />
                    {p.is_edited === 1 && <span style={styles.filmstripEditedDot} />}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* STANDARD GRID VIEW OF LOADED PHOTOS */
          <div
            style={{
              ...styles.photoGrid,
              gridTemplateColumns: `repeat(auto-fill, minmax(${180 + zoomLevel * 30}px, 1fr))`
            }}
          >
            {photos.map(p => {
              const isSelected = selectedPhotoIds.includes(p.id);
              const isActive = activePhoto?.id === p.id;
              return (
                <div
                  key={p.id}
                  style={{
                    ...styles.photoCard,
                    ...(isSelected ? styles.photoCardSelected : {}),
                    ...(isActive ? styles.photoCardActive : {})
                  }}
                  onClick={(e) => handlePhotoClick(p.id, e)}
                  onDoubleClick={() => handlePhotoDoubleClick(p.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ photoId: p.id, x: e.clientX, y: e.clientY });
                  }}
                >
                  {/* Thumbnail Image Container */}
                  <div style={styles.cardImageContainer}>
                    {p.thumbnail_path ? (
                      <img
                        src={getMediaUrl(p.thumbnail_path)}
                        alt={p.file_name}
                        style={styles.cardImage}
                        loading="lazy"
                      />
                    ) : (
                      <div style={styles.cardImagePlaceholder}>
                        <ImageIcon size={32} color="#434752" />
                      </div>
                    )}

                    {/* Format Badge */}
                    <span style={styles.formatBadge}>{p.file_format.toUpperCase()}</span>

                    {/* Edit Status Badge */}
                    {p.is_edited === 1 && (
                      <span style={styles.editedBadge} title="Edited">✎</span>
                    )}

                    {/* AI Analysis Badge */}
                    {p.has_ai_analysis === 1 && (
                      <span style={styles.aiBadge} title="AI Analyzed">✦</span>
                    )}

                    {/* Flag Overlay */}
                    {p.flag === 'pick' && (
                      <div style={styles.pickBadge} title="Pick Flag">
                        <Flag size={12} color="#fff" />
                      </div>
                    )}
                    {p.flag === 'reject' && (
                      <div style={styles.rejectBadge} title="Reject Flag">
                        ✕
                      </div>
                    )}

                    {/* Selection Checkbox Overlay */}
                    {(isSelected || hasMultiSelection) && (
                      <div style={{
                        ...styles.selectionCheckbox,
                        ...(isSelected ? styles.selectionCheckboxActive : {})
                      }}>
                        {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div style={styles.cardFooter}>
                    <div style={styles.fileNameRow}>
                      <span className="truncate" style={styles.cardFileName}>{p.file_name}</span>
                      <button
                        style={styles.favoriteBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(p.id);
                        }}
                        title="Toggle Favorite"
                      >
                        <Heart
                          size={13}
                          color={p.is_favorite ? '#f43f5e' : 'var(--text-muted)'}
                          fill={p.is_favorite ? '#f43f5e' : 'transparent'}
                        />
                      </button>
                    </div>

                    <div style={styles.metaRow}>
                      <span style={styles.metaText}>{formatBytes(p.file_size)}</span>
                      {/* Rating Stars (0-5) */}
                      <div style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            style={styles.starBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateRating(p.id, p.rating === star ? 0 : star);
                            }}
                            title={`Rate ${star} Star${star > 1 ? 's' : ''}`}
                          >
                            <Star
                              size={11}
                              color={star <= p.rating ? 'var(--accent-star)' : 'var(--border-highlight)'}
                              fill={star <= p.rating ? 'var(--accent-star)' : 'transparent'}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Photo Right-Click Context Menu */}
      {contextMenu && (
        <PhotoContextMenu
          photoId={contextMenu.photoId}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </main>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    backgroundColor: 'var(--bg-canvas)',
    position: 'relative'
  },
  dragOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17, 18, 20, 0.92)',
    border: '3px dashed var(--accent-gold)',
    zIndex: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none'
  },
  dragOverlayContent: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12
  },
  dragTitle: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: 'var(--accent-gold)'
  },
  dragSubtitle: {
    fontSize: 13,
    color: 'var(--text-secondary)'
  },
  toolbar: {
    height: 36,
    backgroundColor: 'var(--bg-panel)',
    borderBottom: '1px solid var(--border-default)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    flexShrink: 0
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  },
  viewButtonGroup: {
    display: 'flex',
    backgroundColor: 'var(--bg-app)',
    borderRadius: 4,
    border: '1px solid var(--border-subtle)',
    padding: 1
  },
  viewBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 24,
    borderRadius: 3,
    color: 'var(--text-secondary)',
    cursor: 'pointer'
  },
  viewBtnActive: {
    backgroundColor: 'var(--bg-surface-active)',
    color: 'var(--text-primary)'
  },
  developControls: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  beforeAfterBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '3px 8px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--text-secondary)',
    cursor: 'pointer'
  },
  beforeAfterBtnActive: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    border: '1px solid var(--accent-gold)',
    color: 'var(--accent-gold)'
  },
  zoomGroup: {
    display: 'flex',
    backgroundColor: 'var(--bg-app)',
    borderRadius: 3,
    border: '1px solid var(--border-subtle)',
    padding: 1
  },
  zoomBtn: {
    padding: '2px 6px',
    fontSize: 9,
    fontWeight: 600,
    color: 'var(--text-muted)',
    borderRadius: 2,
    cursor: 'pointer'
  },
  zoomBtnActive: {
    backgroundColor: 'var(--bg-surface-active)',
    color: 'var(--text-primary)'
  },
  fileNameDevelop: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)'
  },
  selectionInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: 'var(--text-secondary)'
  },
  selectionHighlight: {
    color: 'var(--accent-gold)',
    fontWeight: 600
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  searchContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  searchIcon: {
    position: 'absolute',
    left: 7,
    pointerEvents: 'none'
  },
  searchInput: {
    padding: '3px 22px 3px 24px',
    fontSize: 11,
    backgroundColor: 'var(--bg-app)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 4,
    color: 'var(--text-primary)',
    width: 140
  },
  clearSearchBtn: {
    position: 'absolute',
    right: 5,
    color: 'var(--text-muted)',
    cursor: 'pointer'
  },
  sortContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  sortSelect: {
    padding: '3px 6px',
    fontSize: 11,
    backgroundColor: 'var(--bg-app)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 4,
    color: 'var(--text-primary)',
    cursor: 'pointer'
  },
  sortOrderBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 6px',
    fontSize: 10,
    fontWeight: 600,
    backgroundColor: 'var(--bg-app)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 4,
    color: 'var(--text-secondary)',
    cursor: 'pointer'
  },
  backToGridBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '4px 8px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 4,
    fontSize: 11,
    color: 'var(--text-primary)',
    cursor: 'pointer'
  },
  batchToolbar: {
    height: 32,
    backgroundColor: 'var(--bg-panel-elevated)',
    borderBottom: '1px solid var(--border-default)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 12px',
    fontSize: 11,
    color: 'var(--text-secondary)'
  },
  batchCount: {
    fontWeight: 700,
    color: 'var(--accent-gold)'
  },
  batchGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  batchLabel: {
    fontSize: 10,
    color: 'var(--text-muted)'
  },
  batchBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    padding: '2px 6px',
    fontSize: 10,
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 3,
    color: 'var(--text-primary)',
    cursor: 'pointer'
  },
  batchStarBtn: {
    padding: '1px 5px',
    fontSize: 10,
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 3,
    color: 'var(--accent-star)',
    cursor: 'pointer'
  },
  batchGoldBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 8px',
    fontSize: 10,
    fontWeight: 700,
    backgroundColor: 'var(--accent-gold)',
    border: 'none',
    borderRadius: 3,
    color: '#000',
    cursor: 'pointer'
  },
  batchSelect: {
    padding: '2px 6px',
    fontSize: 10,
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 3,
    color: 'var(--text-primary)',
    cursor: 'pointer'
  },
  batchDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'var(--border-subtle)'
  },
  canvas: {
    flex: 1,
    overflowY: 'auto',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column'
  },
  emptyStateContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32
  },
  dropZone: {
    maxWidth: 560,
    width: '100%',
    padding: 40,
    backgroundColor: 'var(--bg-panel)',
    border: '2px dashed var(--border-default)',
    borderRadius: 8,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    backgroundColor: 'var(--bg-app)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: 'var(--text-primary)'
  },
  emptySubtitle: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    maxWidth: 440
  },
  emptyActionRow: {
    display: 'flex',
    gap: 10
  },
  importPrimaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    backgroundColor: 'var(--accent-gold)',
    color: '#000',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer'
  },
  importSecondaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    color: 'var(--text-primary)',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer'
  },
  demoPhotosBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    border: '1px solid #2563eb',
    color: '#ffffff',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease'
  },
  formatsSection: {
    marginTop: 8,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6
  },
  formatsLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--text-muted)'
  },
  formatPills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
    maxWidth: 480
  },
  formatPill: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    padding: '2px 6px',
    backgroundColor: 'var(--bg-app)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 3,
    color: 'var(--text-secondary)'
  },
  securityNote: {
    fontSize: 11,
    color: 'var(--text-muted)',
    marginTop: 8
  },
  developContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#08080a',
    position: 'relative',
    overflow: 'hidden'
  },
  developViewport: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: 16
  },
  developImageWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: '100%',
    maxWidth: '100%'
  },
  developImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    borderRadius: 2,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
  },
  floatingModeBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 10
  },
  modeBadgeBefore: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.05em',
    color: '#fff',
    backgroundColor: 'rgba(50, 50, 50, 0.75)',
    padding: '3px 8px',
    borderRadius: 3,
    border: '1px solid rgba(255,255,255,0.2)'
  },
  modeBadgeAfter: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.05em',
    color: '#000',
    backgroundColor: 'var(--accent-gold)',
    padding: '3px 8px',
    borderRadius: 3
  },
  splitViewport: {
    flex: 1,
    display: 'flex',
    position: 'relative',
    overflow: 'hidden'
  },
  splitPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 12,
    overflow: 'hidden'
  },
  splitPaneHeader: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10
  },
  splitImageWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%'
  },
  splitDividerLine: {
    width: 2,
    backgroundColor: 'var(--accent-gold)',
    zIndex: 20
  },
  filmstripContainer: {
    height: 74,
    backgroundColor: 'var(--bg-panel)',
    borderTop: '1px solid var(--border-default)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 8px',
    overflowX: 'auto',
    flexShrink: 0
  },
  filmstripItem: {
    width: 60,
    height: 60,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
    border: '1px solid var(--border-subtle)',
    cursor: 'pointer',
    flexShrink: 0
  },
  filmstripItemActive: {
    border: '2px solid var(--accent-gold)'
  },
  filmstripImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  filmstripEditedDot: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: 'var(--accent-gold)'
  },
  photoGrid: {
    display: 'grid',
    gap: 12,
    padding: 16
  },
  photoCard: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-panel)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 4,
    overflow: 'hidden',
    cursor: 'pointer',
    position: 'relative'
  },
  photoCardSelected: {
    borderColor: 'var(--accent-blue)',
    backgroundColor: 'rgba(59, 130, 246, 0.05)'
  },
  photoCardActive: {
    borderColor: 'var(--accent-gold)',
    boxShadow: '0 0 0 1px var(--accent-gold)'
  },
  cardImageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: '3/2',
    backgroundColor: '#0a0a0c',
    overflow: 'hidden'
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  formatBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#fff',
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    padding: '1px 4px',
    borderRadius: 2
  },
  editedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'var(--accent-gold)',
    color: '#000',
    fontSize: 10,
    fontWeight: 700,
    width: 16,
    height: 16,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  aiBadge: {
    position: 'absolute',
    top: 6,
    right: 26,
    backgroundColor: '#60a5fa',
    color: '#000',
    fontSize: 10,
    fontWeight: 700,
    width: 16,
    height: 16,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pickBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'var(--accent-green)',
    width: 18,
    height: 18,
    borderRadius: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  rejectBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'var(--accent-red)',
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
    width: 18,
    height: 18,
    borderRadius: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectionCheckbox: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    color: 'var(--text-muted)'
  },
  selectionCheckboxActive: {
    color: 'var(--accent-blue)'
  },
  cardFooter: {
    padding: '6px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  fileNameRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4
  },
  cardFileName: {
    fontSize: 11,
    color: 'var(--text-primary)',
    fontWeight: 600
  },
  favoriteBtn: {
    color: 'var(--text-muted)',
    cursor: 'pointer'
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  metaText: {
    fontSize: 10,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)'
  },
  starsContainer: {
    display: 'flex',
    gap: 1
  },
  starBtn: {
    cursor: 'pointer',
    padding: 1
  }
};

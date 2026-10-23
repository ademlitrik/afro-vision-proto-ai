import React from 'react';
import { useApp } from '../../hooks/useApp';
import {
  Activity,
  CheckCircle2,
  ZoomIn,
  Sliders,
  FileImage
} from 'lucide-react';
import { formatBytes, formatDimensions } from '../../utils/formatters';

export const BottomStatusBar: React.FC = () => {
  const {
    photos,
    selectedPhotoIds,
    activePhoto,
    workerStatus,
    zoomLevel,
    setZoomLevel
  } = useApp();

  return (
    <footer style={styles.footer}>
      {/* Left: Selection & Catalog Status */}
      <div style={styles.leftSection}>
        <div style={styles.statusItem}>
          <FileImage size={13} color="#9da3af" />
          <span>
            {photos.length} Photos
            {selectedPhotoIds.length > 0 && ` (${selectedPhotoIds.length} Selected)`}
          </span>
        </div>

        {activePhoto && (
          <>
            <div style={styles.divider} />
            <div style={styles.activePhotoDetail}>
              <span style={styles.activeFileName}>{activePhoto.file_name}</span>
              <span style={styles.activeFileMeta}>
                {formatDimensions(activePhoto.width, activePhoto.height)} • {formatBytes(activePhoto.file_size)} • {activePhoto.file_format.toUpperCase()}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Center: Non-destructive guarantee indicator */}
      <div style={styles.centerSection}>
        <span style={styles.nonDestructiveBadge}>
          Non-Destructive • Originals Preserved
        </span>
      </div>

      {/* Right: Worker Pool Telemetry & Thumbnail Zoom */}
      <div style={styles.rightSection}>
        {workerStatus && (
          <div style={styles.workerStatusItem}>
            <Activity size={12} color={workerStatus.activeWorkers > 0 ? 'var(--accent-gold)' : 'var(--accent-green)'} />
            <span>
              Worker Pool: {workerStatus.poolSize} Threads
              {workerStatus.activeWorkers > 0 ? ` (${workerStatus.activeWorkers} Busy)` : ' (Idle)'}
            </span>
          </div>
        )}

        <div style={styles.divider} />

        {/* Thumbnail Size Zoom Slider */}
        <div style={styles.zoomControl}>
          <ZoomIn size={12} color="#9da3af" />
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            style={styles.zoomSlider}
            title="Thumbnail Grid Zoom"
          />
        </div>
      </div>
    </footer>
  );
};

const styles: Record<string, React.CSSProperties> = {
  footer: {
    height: 'var(--bottom-bar-height)',
    backgroundColor: 'var(--bg-panel)',
    borderTop: '1px solid var(--border-default)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    fontSize: 11,
    color: 'var(--text-secondary)',
    userSelect: 'none',
    flexShrink: 0
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: 'var(--border-default)'
  },
  activePhotoDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  activeFileName: {
    color: 'var(--text-primary)',
    fontWeight: 600,
    maxWidth: 180,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  activeFileMeta: {
    color: 'var(--text-muted)'
  },
  centerSection: {
    display: 'flex',
    alignItems: 'center'
  },
  nonDestructiveBadge: {
    fontSize: 10,
    color: 'var(--text-muted)',
    letterSpacing: '0.04em'
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  },
  workerStatusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: 'var(--text-muted)'
  },
  zoomControl: {
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  zoomSlider: {
    width: 70,
    height: 3,
    accentColor: 'var(--accent-gold)',
    borderRadius: 2,
    backgroundColor: 'var(--bg-surface)'
  }
};

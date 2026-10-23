import React, { useEffect, useRef } from 'react';
import { useApp } from '../../hooks/useApp';
import {
  Sliders,
  Star,
  Flag,
  RotateCw,
  RotateCcw,
  Copy,
  ClipboardCheck,
  Download,
  Trash2,
  Sparkles,
  Heart
} from 'lucide-react';
import { FlagType } from '../../types/models';

interface PhotoContextMenuProps {
  photoId: string;
  x: number;
  y: number;
  onClose: () => void;
}

export const PhotoContextMenu: React.FC<PhotoContextMenuProps> = ({
  photoId,
  x,
  y,
  onClose
}) => {
  const {
    selectPhoto,
    setCurrentView,
    updateRating,
    updateFlag,
    toggleFavorite,
    rotatePhoto,
    copyEdits,
    pasteEdits,
    setIsExportModalOpen,
    analyzeCurrentPhoto,
    applyAiRecommendations
  } = useApp();

  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  // Adjust positioning to stay within window bounds
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 380);

  const handleOpenInDevelop = () => {
    selectPhoto(photoId);
    setCurrentView('develop');
    onClose();
  };

  const handleSetRating = async (rating: number) => {
    await updateRating(photoId, rating);
    onClose();
  };

  const handleSetFlag = async (flag: FlagType) => {
    await updateFlag(photoId, flag);
    onClose();
  };

  const handleRotate = async (dir: 'cw' | 'ccw') => {
    selectPhoto(photoId);
    await rotatePhoto(dir);
    onClose();
  };

  const handleCopy = () => {
    selectPhoto(photoId);
    copyEdits();
    onClose();
  };

  const handlePaste = async () => {
    selectPhoto(photoId);
    await pasteEdits();
    onClose();
  };

  const handleExport = () => {
    selectPhoto(photoId);
    setIsExportModalOpen(true);
    onClose();
  };

  const handleAiAuto = async () => {
    selectPhoto(photoId);
    await analyzeCurrentPhoto();
    await applyAiRecommendations();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{
        ...styles.contextMenu,
        left: adjustedX,
        top: adjustedY
      }}
      onClick={e => e.stopPropagation()}
    >
      <button style={styles.menuItem} onClick={handleOpenInDevelop}>
        <Sliders size={13} color="var(--accent-gold)" />
        <span>Open in Develop View</span>
      </button>

      <button style={styles.menuItem} onClick={handleAiAuto}>
        <Sparkles size={13} color="#e2a439" />
        <span>AI Auto-Correct Photo</span>
      </button>

      <div style={styles.divider} />

      {/* Ratings Row */}
      <div style={styles.ratingsRow}>
        <span style={styles.subLabel}>Rating:</span>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            style={styles.starBtn}
            onClick={() => handleSetRating(star)}
            title={`Rate ${star} Stars`}
          >
            ★{star}
          </button>
        ))}
        <button style={styles.starBtn} onClick={() => handleSetRating(0)} title="Clear Rating">
          0
        </button>
      </div>

      {/* Flags Row */}
      <div style={styles.flagsRow}>
        <button style={styles.flagBtn} onClick={() => handleSetFlag('pick')}>
          <Flag size={12} color="var(--accent-green)" /> Pick
        </button>
        <button style={styles.flagBtn} onClick={() => handleSetFlag('reject')}>
          ✕ Reject
        </button>
        <button style={styles.flagBtn} onClick={() => handleSetFlag('unflagged')}>
          Unflag
        </button>
      </div>

      <div style={styles.divider} />

      <button style={styles.menuItem} onClick={() => handleRotate('cw')}>
        <RotateCw size={13} />
        <span>Rotate 90° Clockwise</span>
      </button>
      <button style={styles.menuItem} onClick={() => handleRotate('ccw')}>
        <RotateCcw size={13} />
        <span>Rotate 90° Counter-Clockwise</span>
      </button>

      <div style={styles.divider} />

      <button style={styles.menuItem} onClick={handleCopy}>
        <Copy size={13} />
        <span>Copy Adjustments (Ctrl+Shift+C)</span>
      </button>
      <button style={styles.menuItem} onClick={handlePaste}>
        <ClipboardCheck size={13} />
        <span>Paste Adjustments (Ctrl+Shift+V)</span>
      </button>

      <div style={styles.divider} />

      <button style={styles.menuItem} onClick={handleExport}>
        <Download size={13} color="#3b82f6" />
        <span>Export Photograph... (Ctrl+E)</span>
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  contextMenu: {
    position: 'fixed',
    zIndex: 10000,
    backgroundColor: '#1c1d22',
    border: '1px solid #2e3039',
    borderRadius: 6,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
    width: 220,
    padding: '6px 0',
    fontSize: 12,
    color: '#e5e7eb',
    userSelect: 'none'
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '7px 14px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#d1d5db',
    fontSize: 12,
    textAlign: 'left',
    cursor: 'pointer'
  },
  divider: {
    height: 1,
    backgroundColor: '#2e3039',
    margin: '4px 0'
  },
  ratingsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 12px'
  },
  subLabel: {
    fontSize: 11,
    color: '#9da3af',
    marginRight: 4
  },
  starBtn: {
    backgroundColor: '#262832',
    border: '1px solid #3d404f',
    borderRadius: 4,
    padding: '2px 5px',
    fontSize: 11,
    color: '#e2a439',
    cursor: 'pointer'
  },
  flagsRow: {
    display: 'flex',
    gap: 6,
    padding: '4px 12px 6px'
  },
  flagBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#262832',
    border: '1px solid #3d404f',
    borderRadius: 4,
    padding: '4px 0',
    fontSize: 11,
    color: '#d1d5db',
    cursor: 'pointer'
  }
};

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Star,
  Heart,
  Flag,
  RotateCw
} from 'lucide-react';
import { Photo } from '../../types/models';

interface LightboxModalProps {
  photos: Photo[];
  initialPhotoId: string;
  onClose: () => void;
  onRating?: (photoId: string, rating: number) => void;
  onFavorite?: (photoId: string) => void;
  onFlag?: (photoId: string, flag: 'pick' | 'unflagged' | 'reject') => void;
  getMediaUrl: (path: string | null) => string;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  photos,
  initialPhotoId,
  onClose,
  onRating,
  onFavorite,
  onFlag,
  getMediaUrl
}) => {
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.max(0, photos.findIndex(p => p.id === initialPhotoId))
  );
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimer = useRef<ReturnType<typeof setTimeout>>();

  const currentPhoto = photos[currentIndex];
  if (!currentPhoto) return null;

  const imgUrl = getMediaUrl(currentPhoto.preview_path || currentPhoto.thumbnail_path || currentPhoto.file_path);

  const goPrev = useCallback(() => {
    setCurrentIndex(i => Math.max(0, i - 1));
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex(i => Math.min(photos.length - 1, i + 1));
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, [photos.length]);

  const zoomIn = () => setZoom(z => Math.min(z + 0.5, 5));
  const zoomOut = () => {
    setZoom(z => {
      const next = Math.max(z - 0.5, 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };
  const fitToScreen = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goNext();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        case '0':
          fitToScreen();
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goPrev, goNext]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  }, [resetControlsTimer]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    resetControlsTimer();
    if (!isPanning || zoom <= 1) return;
    setPanOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom(z => Math.min(z + 0.25, 5));
    } else {
      setZoom(z => {
        const next = Math.max(z - 0.25, 1);
        if (next === 1) setPanOffset({ x: 0, y: 0 });
        return next;
      });
    }
  };

  return (
    <div
      ref={containerRef}
      style={styles.overlay}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={resetControlsTimer}
    >
      {/* Close Button */}
      <button
        style={{ ...styles.closeBtn, opacity: showControls ? 1 : 0 }}
        onClick={onClose}
        title="Close (Esc)"
      >
        <X size={22} />
      </button>

      {/* Top Info Bar */}
      <div style={{ ...styles.topBar, opacity: showControls ? 1 : 0 }}>
        <span style={styles.photoName}>{currentPhoto.file_name}</span>
        <span style={styles.counter}>{currentIndex + 1} / {photos.length}</span>
        <span style={styles.dimensions}>
          {currentPhoto.width} × {currentPhoto.height}
        </span>
        <span style={styles.zoomLevel}>{Math.round(zoom * 100)}%</span>
      </div>

      {/* Navigation Arrows */}
      {currentIndex > 0 && (
        <button
          style={{ ...styles.navBtn, ...styles.navBtnLeft, opacity: showControls ? 1 : 0 }}
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          title="Previous (←)"
        >
          <ChevronLeft size={32} />
        </button>
      )}
      {currentIndex < photos.length - 1 && (
        <button
          style={{ ...styles.navBtn, ...styles.navBtnRight, opacity: showControls ? 1 : 0 }}
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          title="Next (→)"
        >
          <ChevronRight size={32} />
        </button>
      )}

      {/* Main Image */}
      <div
        style={styles.imageContainer}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
        <img
          src={imgUrl}
          alt={currentPhoto.file_name}
          style={{
            ...styles.image,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default'
          }}
          draggable={false}
          onDoubleClick={() => {
            if (zoom === 1) {
              setZoom(2);
            } else {
              fitToScreen();
            }
          }}
        />
      </div>

      {/* Bottom Controls Bar */}
      <div style={{ ...styles.bottomBar, opacity: showControls ? 1 : 0 }}>
        {/* Zoom Controls */}
        <div style={styles.controlGroup}>
          <button style={styles.controlBtn} onClick={zoomOut} title="Zoom Out (-)">
            <ZoomOut size={16} />
          </button>
          <button style={styles.controlBtn} onClick={fitToScreen} title="Fit to Screen (0)">
            <Maximize2 size={16} />
          </button>
          <button style={styles.controlBtn} onClick={zoomIn} title="Zoom In (+)">
            <ZoomIn size={16} />
          </button>
        </div>

        {/* Rating Stars */}
        {onRating && (
          <div style={styles.controlGroup}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                style={styles.starBtn}
                onClick={() => onRating(currentPhoto.id, currentPhoto.rating === star ? 0 : star)}
                title={`Rate ${star}`}
              >
                <Star
                  size={16}
                  color={star <= currentPhoto.rating ? '#e2a439' : '#6b7280'}
                  fill={star <= currentPhoto.rating ? '#e2a439' : 'transparent'}
                />
              </button>
            ))}
          </div>
        )}

        {/* Flags */}
        {onFlag && (
          <div style={styles.controlGroup}>
            <button
              style={{
                ...styles.controlBtn,
                ...(currentPhoto.flag === 'pick' ? { backgroundColor: 'rgba(34, 197, 94, 0.3)' } : {})
              }}
              onClick={() => onFlag(currentPhoto.id, currentPhoto.flag === 'pick' ? 'unflagged' : 'pick')}
              title="Toggle Pick Flag (P)"
            >
              <Flag size={14} color={currentPhoto.flag === 'pick' ? '#22c55e' : '#9ca3af'} />
            </button>
            <button
              style={{
                ...styles.controlBtn,
                ...(currentPhoto.flag === 'reject' ? { backgroundColor: 'rgba(239, 68, 68, 0.3)' } : {})
              }}
              onClick={() => onFlag(currentPhoto.id, currentPhoto.flag === 'reject' ? 'unflagged' : 'reject')}
              title="Toggle Reject Flag (X)"
            >
              <span style={{ color: currentPhoto.flag === 'reject' ? '#ef4444' : '#9ca3af', fontSize: 16, fontWeight: 'bold' }}>✕</span>
            </button>
          </div>
        )}

        {/* Favorite */}
        {onFavorite && (
          <button
            style={styles.controlBtn}
            onClick={() => onFavorite(currentPhoto.id)}
            title="Toggle Favorite"
          >
            <Heart
              size={16}
              color={currentPhoto.is_favorite ? '#f43f5e' : '#9ca3af'}
              fill={currentPhoto.is_favorite ? '#f43f5e' : 'transparent'}
            />
          </button>
        )}
      </div>

      {/* Bottom Filmstrip */}
      <div style={{ ...styles.filmstrip, opacity: showControls ? 1 : 0 }}>
        {photos.map((p, idx) => (
          <div
            key={p.id}
            style={{
              ...styles.filmstripItem,
              ...(idx === currentIndex ? styles.filmstripItemActive : {})
            }}
            onClick={() => {
              setCurrentIndex(idx);
              setZoom(1);
              setPanOffset({ x: 0, y: 0 });
            }}
          >
            <img
              src={getMediaUrl(p.thumbnail_path)}
              alt={p.file_name}
              style={styles.filmstripImg}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.96)',
    zIndex: 20000,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none'
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 20010,
    backgroundColor: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: 8,
    padding: '8px 10px',
    color: '#fff',
    cursor: 'pointer',
    transition: 'opacity 0.3s ease'
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '10px 60px 10px 20px',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
    zIndex: 20005,
    transition: 'opacity 0.3s ease'
  },
  photoName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'Rubik, sans-serif'
  },
  counter: {
    color: '#9ca3af',
    fontSize: 12,
    marginLeft: 'auto'
  },
  dimensions: {
    color: '#6b7280',
    fontSize: 11,
    fontFamily: 'JetBrains Mono, monospace'
  },
  zoomLevel: {
    color: '#e2a439',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'JetBrains Mono, monospace'
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 20010,
    backgroundColor: 'rgba(255,255,255,0.08)',
    border: 'none',
    borderRadius: 12,
    padding: '16px 8px',
    color: '#fff',
    cursor: 'pointer',
    transition: 'opacity 0.3s ease, background-color 0.2s'
  },
  navBtnLeft: {
    left: 16
  },
  navBtnRight: {
    right: 16
  },
  imageContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    overflow: 'hidden',
    padding: '50px 70px 120px 70px'
  },
  image: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    transformOrigin: 'center center',
    transition: 'none'
  },
  bottomBar: {
    position: 'absolute',
    bottom: 70,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 16px',
    backgroundColor: 'rgba(28, 29, 34, 0.9)',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.08)',
    zIndex: 20005,
    transition: 'opacity 0.3s ease'
  },
  controlGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    borderRight: '1px solid rgba(255,255,255,0.08)',
    paddingRight: 10
  },
  controlBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: 'none',
    borderRadius: 6,
    padding: '6px 8px',
    color: '#d1d5db',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  starBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: 3,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  filmstrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    gap: 3,
    padding: '8px 16px',
    overflowX: 'auto',
    backgroundColor: 'rgba(17, 18, 20, 0.9)',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    zIndex: 20005,
    transition: 'opacity 0.3s ease'
  },
  filmstripItem: {
    flexShrink: 0,
    width: 52,
    height: 52,
    borderRadius: 4,
    overflow: 'hidden',
    border: '2px solid transparent',
    cursor: 'pointer',
    opacity: 0.6
  },
  filmstripItemActive: {
    border: '2px solid #e2a439',
    opacity: 1
  },
  filmstripImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  }
};

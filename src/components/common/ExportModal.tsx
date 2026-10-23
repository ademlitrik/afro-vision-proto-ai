import React, { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { apiService } from '../../services/api';
import {
  Download,
  Folder,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sliders,
  FileImage
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { photos, selectedPhotoIds, activePhoto } = useApp();

  const [destinationFolder, setDestinationFolder] = useState<string>('');
  const [format, setFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');
  const [quality, setQuality] = useState<number>(90);
  const [resolutionMode, setResolutionMode] = useState<'original' | '4k' | 'fhd' | 'custom'>('original');
  const [customDimension, setCustomDimension] = useState<number>(2048);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportResult, setExportResult] = useState<{
    total: number;
    exported: number;
    failed: number;
    destination: string;
    files: string[];
    errors: string[];
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Determine which photos to export: selected photos, or active photo, or all photos
  const targetPhotoIds = selectedPhotoIds.length > 0
    ? selectedPhotoIds
    : activePhoto
    ? [activePhoto.id]
    : photos.map(p => p.id);

  const handleSelectFolder = async () => {
    try {
      const folder = await apiService.selectFolder();
      if (folder) {
        setDestinationFolder(folder);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to select destination folder');
    }
  };

  const handleStartExport = async () => {
    if (!destinationFolder.trim()) {
      setErrorMessage('Please select a destination folder first.');
      return;
    }
    if (targetPhotoIds.length === 0) {
      setErrorMessage('No photographs available to export.');
      return;
    }

    setIsExporting(true);
    setErrorMessage(null);
    setExportResult(null);

    let maxDim: number | undefined = undefined;
    if (resolutionMode === '4k') maxDim = 3840;
    else if (resolutionMode === 'fhd') maxDim = 1920;
    else if (resolutionMode === 'custom') maxDim = customDimension;

    try {
      const result = await apiService.exportPhotos({
        photoIds: targetPhotoIds,
        outputFolder: destinationFolder,
        format,
        quality,
        maxDimension: maxDim
      });
      setExportResult(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Export process failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <Download size={18} color="var(--accent-gold)" />
            <span>Export Photographs</span>
          </div>
          <button style={styles.closeBtn} onClick={onClose} disabled={isExporting}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={styles.body}>
          {exportResult ? (
            <div style={styles.resultBox}>
              <CheckCircle2 size={40} color="var(--accent-green)" />
              <h3 style={styles.resultTitle}>Export Completed Successfully</h3>
              <p style={styles.resultDetails}>
                Exported <strong>{exportResult.exported}</strong> of {exportResult.total} photographs to:
              </p>
              <div style={styles.pathPill}>{exportResult.destination}</div>
              {exportResult.failed > 0 && (
                <div style={styles.warningBox}>
                  {exportResult.failed} items could not be exported.
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Scope */}
              <div style={styles.scopeNotice}>
                <FileImage size={15} color="#e2a439" />
                <span>
                  Ready to export <strong>{targetPhotoIds.length}</strong> photo{targetPhotoIds.length === 1 ? '' : 's'} with all non-destructive adjustments applied.
                </span>
              </div>

              {/* Destination Folder */}
              <div style={styles.section}>
                <label style={styles.label}>Destination Folder</label>
                <div style={styles.folderRow}>
                  <input
                    type="text"
                    readOnly
                    placeholder="Select where to save exported files..."
                    value={destinationFolder}
                    style={styles.folderInput}
                  />
                  <button style={styles.browseBtn} onClick={handleSelectFolder} disabled={isExporting}>
                    <Folder size={14} style={{ marginRight: 6 }} />
                    Browse...
                  </button>
                </div>
              </div>

              {/* Format & Quality */}
              <div style={styles.twoCol}>
                <div style={styles.section}>
                  <label style={styles.label}>File Format</label>
                  <select
                    value={format}
                    onChange={e => setFormat(e.target.value as any)}
                    style={styles.select}
                    disabled={isExporting}
                  >
                    <option value="jpeg">JPEG (Standard Web & Print)</option>
                    <option value="png">PNG (Lossless 24-bit)</option>
                    <option value="webp">WebP (High-Efficiency Modern Web)</option>
                  </select>
                </div>

                <div style={styles.section}>
                  <label style={styles.label}>
                    Quality: {quality}%
                  </label>
                  <input
                    type="range"
                    min={60}
                    max={100}
                    value={quality}
                    onChange={e => setQuality(Number(e.target.value))}
                    style={styles.range}
                    disabled={isExporting || format === 'png'}
                  />
                </div>
              </div>

              {/* Resolution Scaling */}
              <div style={styles.section}>
                <label style={styles.label}>Resolution Scaling</label>
                <div style={styles.resolutionOptions}>
                  {(
                    [
                      { id: 'original', label: 'Full Original' },
                      { id: '4k', label: '4K UHD (3840px)' },
                      { id: 'fhd', label: 'Full HD (1920px)' },
                      { id: 'custom', label: 'Custom Max PX' }
                    ] as const
                  ).map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      style={{
                        ...styles.resOptionBtn,
                        ...(resolutionMode === opt.id ? styles.resOptionBtnActive : {})
                      }}
                      onClick={() => setResolutionMode(opt.id)}
                      disabled={isExporting}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {resolutionMode === 'custom' && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Max Width/Height:</span>
                    <input
                      type="number"
                      min={200}
                      max={8192}
                      value={customDimension}
                      onChange={e => setCustomDimension(Number(e.target.value))}
                      style={styles.customNumInput}
                    />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>px</span>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div style={styles.errorBox}>
                  <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          {exportResult ? (
            <button style={styles.actionBtnPrimary} onClick={onClose}>
              Done
            </button>
          ) : (
            <>
              <button style={styles.cancelBtn} onClick={onClose} disabled={isExporting}>
                Cancel
              </button>
              <button
                style={{ ...styles.actionBtnPrimary, ...(isExporting ? { opacity: 0.7 } : {}) }}
                onClick={handleStartExport}
                disabled={isExporting || !destinationFolder}
              >
                {isExporting ? (
                  <>
                    <Loader2 size={14} className="spin" style={{ marginRight: 6 }} />
                    Exporting {targetPhotoIds.length} Photos...
                  </>
                ) : (
                  <>
                    <Download size={14} style={{ marginRight: 6 }} />
                    Export Now
                  </>
                )}
              </button>
            </>
          )}
        </div>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(3px)'
  },
  modal: {
    backgroundColor: '#1c1d22',
    border: '1px solid #2e3039',
    borderRadius: 8,
    width: 520,
    maxWidth: '90vw',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    padding: '14px 20px',
    borderBottom: '1px solid #2e3039',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 15,
    fontWeight: 600,
    color: '#ffffff'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#9da3af',
    cursor: 'pointer',
    padding: 4,
    display: 'flex'
  },
  body: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  scopeNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    backgroundColor: '#262832',
    borderRadius: 6,
    fontSize: 13,
    color: '#e5e7eb'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: '#9da3af'
  },
  folderRow: {
    display: 'flex',
    gap: 8
  },
  folderInput: {
    flex: 1,
    backgroundColor: '#141416',
    border: '1px solid #2e3039',
    borderRadius: 6,
    padding: '8px 12px',
    fontSize: 12,
    color: '#ffffff'
  },
  browseBtn: {
    backgroundColor: '#2a2c36',
    border: '1px solid #3d404f',
    borderRadius: 6,
    padding: '8px 14px',
    color: '#ffffff',
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontWeight: 500
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16
  },
  select: {
    backgroundColor: '#141416',
    border: '1px solid #2e3039',
    borderRadius: 6,
    padding: '8px 10px',
    fontSize: 12,
    color: '#ffffff',
    outline: 'none'
  },
  range: {
    width: '100%',
    accentColor: '#e2a439',
    marginTop: 8
  },
  resolutionOptions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap'
  },
  resOptionBtn: {
    backgroundColor: '#141416',
    border: '1px solid #2e3039',
    borderRadius: 6,
    padding: '6px 12px',
    fontSize: 11,
    color: '#9da3af',
    cursor: 'pointer'
  },
  resOptionBtnActive: {
    backgroundColor: '#2a2c36',
    borderColor: '#e2a439',
    color: '#e2a439',
    fontWeight: 600
  },
  customNumInput: {
    backgroundColor: '#141416',
    border: '1px solid #2e3039',
    borderRadius: 6,
    padding: '4px 8px',
    fontSize: 12,
    color: '#ffffff',
    width: 90
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 6,
    color: '#ef4444',
    fontSize: 12
  },
  resultBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px 10px',
    textAlign: 'center'
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 6
  },
  resultDetails: {
    fontSize: 13,
    color: '#9da3af',
    marginBottom: 10
  },
  pathPill: {
    backgroundColor: '#141416',
    padding: '6px 14px',
    borderRadius: 6,
    fontSize: 12,
    color: '#e2a439',
    wordBreak: 'break-all',
    border: '1px solid #2e3039'
  },
  warningBox: {
    marginTop: 12,
    color: '#f59e0b',
    fontSize: 12
  },
  footer: {
    padding: '12px 20px',
    borderTop: '1px solid #2e3039',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    backgroundColor: '#16171a'
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #2e3039',
    borderRadius: 6,
    padding: '8px 16px',
    fontSize: 12,
    color: '#9da3af',
    cursor: 'pointer'
  },
  actionBtnPrimary: {
    backgroundColor: '#e2a439',
    border: 'none',
    borderRadius: 6,
    padding: '8px 18px',
    fontSize: 12,
    color: '#000000',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  }
};

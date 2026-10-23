import React from 'react';
import { useApp } from '../../hooks/useApp';
import {
  FolderUp,
  AlertTriangle,
  CheckCircle,
  Copy,
  XCircle,
  Loader2
} from 'lucide-react';

export const ImportModal: React.FC = () => {
  const {
    isImporting,
    importProgress,
    importResult,
    dismissImportResult,
    cancelActiveImport
  } = useApp();

  if (!isImporting && !importResult) {
    return null;
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {isImporting && importProgress && (
          <div>
            <div style={styles.headerRow}>
              <div style={styles.iconCircle}>
                <Loader2 size={20} color="var(--accent-gold)" className="animate-spin" />
              </div>
              <div>
                <h3 style={styles.title}>
                  {importProgress.status === 'scanning' ? 'Scanning Directory...' : 'Importing Photographs...'}
                </h3>
                <p style={styles.subtitle}>
                  Generating non-blocking thumbnails and reading camera EXIF metadata in background workers.
                </p>
              </div>
            </div>

            {/* Progress Count & Percentage */}
            <div style={styles.progressRow}>
              <span style={styles.progressNumbers}>
                {importProgress.current} / {importProgress.total} Photos
              </span>
              <span style={styles.progressPercentage}>{importProgress.percentage}%</span>
            </div>

            {/* Progress Bar */}
            <div style={styles.progressBarTrack}>
              <div
                style={{
                  ...styles.progressBarFill,
                  width: `${importProgress.percentage}%`
                }}
              />
            </div>

            {/* Current File */}
            <div style={styles.currentFileText}>
              <span style={{ color: 'var(--text-muted)' }}>Processing:</span> {importProgress.currentFileName}
            </div>

            {/* Live Stats */}
            <div style={styles.statsRow}>
              <div style={styles.statPill}>
                <CheckCircle size={12} color="var(--accent-green)" />
                <span>{importProgress.importedCount} Imported</span>
              </div>
              <div style={styles.statPill}>
                <Copy size={12} color="var(--text-muted)" />
                <span>{importProgress.duplicateCount} Duplicates Skipped</span>
              </div>
              {importProgress.failedCount > 0 && (
                <div style={styles.statPill}>
                  <AlertTriangle size={12} color="var(--accent-red)" />
                  <span>{importProgress.failedCount} Failed</span>
                </div>
              )}
            </div>

            <div style={styles.footer}>
              <button style={styles.cancelBtn} onClick={cancelActiveImport}>
                Cancel Import
              </button>
            </div>
          </div>
        )}

        {!isImporting && importResult && (
          <div>
            <div style={styles.headerRow}>
              <div style={{ ...styles.iconCircle, backgroundColor: importResult.failedCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)' }}>
                {importResult.failedCount > 0 ? (
                  <AlertTriangle size={22} color="var(--accent-red)" />
                ) : (
                  <CheckCircle size={22} color="var(--accent-green)" />
                )}
              </div>
              <div>
                <h3 style={styles.title}>
                  {importResult.cancelled
                    ? 'Import Cancelled'
                    : importResult.failedCount > 0 && importResult.importedCount === 0
                    ? 'Import Finished with Diagnostics'
                    : 'Import Complete'}
                </h3>
                <p style={styles.subtitle}>
                  {importResult.importedCount} photographs added to catalog session. Originals untouched.
                </p>
              </div>
            </div>

            {/* Stats Summary Grid */}
            <div style={styles.summaryGrid}>
              <div style={styles.summaryCard}>
                <span style={styles.summaryNum}>{importResult.importedCount}</span>
                <span style={styles.summaryLabel}>Imported</span>
              </div>
              <div style={styles.summaryCard}>
                <span style={styles.summaryNum}>{importResult.duplicateCount}</span>
                <span style={styles.summaryLabel}>Duplicates Skipped</span>
              </div>
              <div style={{ ...styles.summaryCard, color: importResult.failedCount > 0 ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                <span style={styles.summaryNum}>{importResult.failedCount}</span>
                <span style={styles.summaryLabel}>Failed / Unsupported</span>
              </div>
            </div>

            {/* Failures Diagnostic List */}
            {importResult.failures.length > 0 && (
              <div style={styles.failureBox}>
                <div style={styles.failureBoxTitle}>DIAGNOSTIC REPORT:</div>
                <div style={styles.failureList}>
                  {importResult.failures.map((f, i) => (
                    <div key={i} style={styles.failureItem}>
                      <span style={styles.failureFileName}>{f.fileName}:</span>
                      <span style={styles.failureReason}>{f.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={styles.footer}>
              <button style={styles.confirmBtn} onClick={dismissImportResult}>
                Done
              </button>
            </div>
          </div>
        )}
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
    zIndex: 2000
  },
  modal: {
    width: 480,
    maxWidth: '90vw',
    backgroundColor: 'var(--bg-panel-elevated)',
    border: '1px solid var(--border-highlight)',
    borderRadius: 10,
    padding: 24,
    boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 18
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: 'var(--bg-surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.4
  },
  progressRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 12,
    marginBottom: 8
  },
  progressNumbers: {
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)'
  },
  progressPercentage: {
    color: 'var(--accent-gold)',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)'
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'var(--bg-surface)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'var(--accent-gold)',
    borderRadius: 3,
    transition: 'width 150ms ease'
  },
  currentFileText: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginBottom: 14
  },
  statsRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap'
  },
  statPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    padding: '3px 8px',
    backgroundColor: 'var(--bg-surface)',
    borderRadius: 12,
    color: 'var(--text-secondary)'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    marginBottom: 16
  },
  summaryCard: {
    backgroundColor: 'var(--bg-surface)',
    borderRadius: 6,
    padding: '12px 8px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  summaryNum: {
    fontSize: 20,
    fontWeight: 700,
    fontFamily: 'var(--font-mono)'
  },
  summaryLabel: {
    fontSize: 10,
    color: 'var(--text-muted)',
    textTransform: 'uppercase'
  },
  failureBox: {
    backgroundColor: 'var(--bg-app)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    maxHeight: 140,
    overflowY: 'auto'
  },
  failureBoxTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--accent-red)',
    letterSpacing: '0.06em',
    marginBottom: 6
  },
  failureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  failureItem: {
    fontSize: 11,
    lineHeight: 1.4
  },
  failureFileName: {
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginRight: 6
  },
  failureReason: {
    color: 'var(--accent-red)'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10
  },
  cancelBtn: {
    padding: '7px 16px',
    fontSize: 12,
    borderRadius: 4,
    color: 'var(--accent-red)',
    backgroundColor: 'transparent',
    border: '1px solid rgba(239, 68, 68, 0.4)'
  },
  confirmBtn: {
    padding: '7px 20px',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 4,
    backgroundColor: 'var(--accent-gold)',
    color: '#000'
  }
};

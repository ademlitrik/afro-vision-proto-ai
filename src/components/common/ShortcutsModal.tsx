import React, { useState } from 'react';
import {
  Keyboard,
  X,
  Search,
  Command,
  Sliders,
  Layers,
  Wand2,
  FileImage,
  Star
} from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'Navigation & Views' | 'Culling & Flags' | 'Editing & Adjustments' | 'File & Export' | 'AI Studio';
}

const SHORTCUTS: ShortcutItem[] = [
  // Navigation & Views
  { keys: ['G'], description: 'Switch to Library Grid View', category: 'Navigation & Views' },
  { keys: ['D', 'E'], description: 'Switch to Develop / Loupe View', category: 'Navigation & Views' },
  { keys: ['C', 'M'], description: 'Toggle Compare / Split Before & After View', category: 'Navigation & Views' },
  { keys: ['B'], description: 'Switch to Batch Processing Queue', category: 'Navigation & Views' },
  { keys: ['\\'], description: 'Toggle Before (Original) and After (Edited)', category: 'Navigation & Views' },
  { keys: ['Ctrl', '+'], description: 'Zoom In on Canvas', category: 'Navigation & Views' },
  { keys: ['Ctrl', '-'], description: 'Zoom Out on Canvas', category: 'Navigation & Views' },
  { keys: ['Ctrl', '0'], description: 'Fit Photo to Canvas Window', category: 'Navigation & Views' },
  { keys: ['Tab'], description: 'Toggle Side Panels (Full Canvas View)', category: 'Navigation & Views' },
  { keys: ['F11'], description: 'Toggle Full Screen Mode', category: 'Navigation & Views' },
  { keys: ['←', '→'], description: 'Navigate Previous / Next Photo', category: 'Navigation & Views' },

  // Culling & Flags
  { keys: ['P'], description: 'Flag Photo as Pick (Keep)', category: 'Culling & Flags' },
  { keys: ['X'], description: 'Flag Photo as Reject', category: 'Culling & Flags' },
  { keys: ['U'], description: 'Clear / Unflag Photo', category: 'Culling & Flags' },
  { keys: ['F'], description: 'Toggle Favorite (Heart)', category: 'Culling & Flags' },
  { keys: ['1', '2', '3', '4', '5'], description: 'Rate Photograph 1 to 5 Stars', category: 'Culling & Flags' },
  { keys: ['0'], description: 'Clear Photo Star Rating', category: 'Culling & Flags' },
  { keys: ['Ctrl', 'A'], description: 'Select All Photos in View', category: 'Culling & Flags' },
  { keys: ['Ctrl', 'D'], description: 'Deselect All Photos', category: 'Culling & Flags' },

  // Editing & Adjustments
  { keys: ['Ctrl', 'Z'], description: 'Undo Last Slider / Adjustment', category: 'Editing & Adjustments' },
  { keys: ['Ctrl', 'Y'], description: 'Redo Adjustment', category: 'Editing & Adjustments' },
  { keys: ['Ctrl', 'Shift', 'C'], description: 'Copy All Edit Adjustments from Active Photo', category: 'Editing & Adjustments' },
  { keys: ['Ctrl', 'Shift', 'V'], description: 'Paste Copied Adjustments to Selected Photos', category: 'Editing & Adjustments' },
  { keys: ['Ctrl', 'Shift', 'R'], description: 'Reset All Adjustments to Neutral Baseline', category: 'Editing & Adjustments' },
  { keys: ['Ctrl', ']'], description: 'Rotate 90° Clockwise', category: 'Editing & Adjustments' },
  { keys: ['Ctrl', '['], description: 'Rotate 90° Counter-Clockwise', category: 'Editing & Adjustments' },

  // File & Export
  { keys: ['Ctrl', 'E'], description: 'Open Production Export Dialog', category: 'File & Export' },
  { keys: ['Ctrl', 'I'], description: 'Import Photographs from Computer', category: 'File & Export' },
  { keys: ['Ctrl', 'Shift', 'I'], description: 'Import Entire Folder with Recursive Scan', category: 'File & Export' },
  { keys: ['Ctrl', 'N'], description: 'Create New Catalog Session Project', category: 'File & Export' },

  // AI Studio
  { keys: ['Ctrl', 'Alt', 'A'], description: 'Intelligent AI Auto-Tone & Melanin Enhancement', category: 'AI Studio' },
  { keys: ['A'], description: 'Open AI Studio Natural-Language Assistant', category: 'AI Studio' }
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const [filter, setFilter] = useState<string>('');

  if (!isOpen) return null;

  const filteredShortcuts = SHORTCUTS.filter(s =>
    s.description.toLowerCase().includes(filter.toLowerCase()) ||
    s.keys.some(k => k.toLowerCase().includes(filter.toLowerCase())) ||
    s.category.toLowerCase().includes(filter.toLowerCase())
  );

  const categories = Array.from(new Set(SHORTCUTS.map(s => s.category)));

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <Keyboard size={18} color="var(--accent-gold)" />
            <span style={styles.title}>Afro Vision Studio Keyboard Shortcuts</span>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Search Input */}
        <div style={styles.searchBar}>
          <Search size={14} color="#9da3af" />
          <input
            type="text"
            autoFocus
            placeholder="Search shortcuts (e.g., zoom, export, rating, flag, undo)..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* Body */}
        <div style={styles.body}>
          {categories.map(cat => {
            const items = filteredShortcuts.filter(s => s.category === cat);
            if (items.length === 0) return null;

            return (
              <div key={cat} style={styles.categorySection}>
                <h4 style={styles.categoryTitle}>{cat.toUpperCase()}</h4>
                <div style={styles.shortcutGrid}>
                  {items.map((item, idx) => (
                    <div key={idx} style={styles.shortcutRow}>
                      <span style={styles.description}>{item.description}</span>
                      <div style={styles.keyContainer}>
                        {item.keys.map((k, kIdx) => (
                          <React.Fragment key={kIdx}>
                            <kbd style={styles.kbd}>{k}</kbd>
                            {kIdx < item.keys.length - 1 && <span style={styles.plus}>+</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerNote}>
            Press <kbd style={styles.kbdInline}>Esc</kbd> or click outside to close this reference window.
          </span>
          <button style={styles.doneBtn} onClick={onClose}>
            Got it
          </button>
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
    zIndex: 10002,
    backdropFilter: 'blur(3px)'
  },
  modal: {
    backgroundColor: '#1c1d22',
    border: '1px solid #2e3039',
    borderRadius: 8,
    width: 680,
    maxWidth: '94vw',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.7)',
    overflow: 'hidden'
  },
  header: {
    padding: '14px 20px',
    borderBottom: '1px solid #2e3039',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  title: {
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
  searchBar: {
    padding: '10px 20px',
    borderBottom: '1px solid #2e3039',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#141416'
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#ffffff',
    fontSize: 13
  },
  body: {
    padding: '16px 20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 18
  },
  categorySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  categoryTitle: {
    margin: 0,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: 'var(--accent-gold)'
  },
  shortcutGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  shortcutRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 10px',
    borderRadius: 4,
    backgroundColor: '#22242c',
    fontSize: 12
  },
  description: {
    color: '#d1d5db'
  },
  keyContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  kbd: {
    backgroundColor: '#141416',
    border: '1px solid #3d404f',
    borderRadius: 4,
    padding: '2px 7px',
    fontSize: 11,
    fontFamily: 'system-ui, monospace',
    fontWeight: 600,
    color: '#f3f4f6',
    boxShadow: '0 1px 2px rgba(0,0,0,0.4)'
  },
  kbdInline: {
    backgroundColor: '#262832',
    border: '1px solid #3d404f',
    borderRadius: 3,
    padding: '1px 5px',
    fontSize: 10,
    color: '#e5e7eb'
  },
  plus: {
    fontSize: 10,
    color: '#9da3af'
  },
  footer: {
    padding: '12px 20px',
    borderTop: '1px solid #2e3039',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#16171a'
  },
  footerNote: {
    fontSize: 11,
    color: '#9da3af'
  },
  doneBtn: {
    backgroundColor: '#e2a439',
    border: 'none',
    borderRadius: 6,
    padding: '6px 16px',
    fontSize: 12,
    fontWeight: 600,
    color: '#000',
    cursor: 'pointer'
  }
};

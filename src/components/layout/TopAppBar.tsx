import React, { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import {
  Aperture,
  FolderOpen,
  Download,
  Plus,
  Cpu,
  Layers,
  Sliders,
  Sparkles,
  ChevronDown,
  Undo2,
  Redo2,
  Save
} from 'lucide-react';
import { ViewMode } from '../../state/AppContext';

export const TopAppBar: React.FC = () => {
  const {
    activeProject,
    projects,
    currentView,
    setCurrentView,
    createProject,
    switchProject,
    importFilesPrompt,
    setIsExportModalOpen,
    setIsAiAssistantOpen,
    undo,
    redo,
    canUndo,
    canRedo,
    systemInfo
  } = useApp();

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    await createProject(newProjectName.trim());
    setNewProjectName('');
    setShowProjectModal(false);
  };

  const views: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'library', label: 'LIBRARY', icon: <Layers size={14} /> },
    { id: 'develop', label: 'DEVELOP', icon: <Sliders size={14} /> },
    { id: 'match_look', label: 'AI STUDIO', icon: <Sparkles size={14} /> },
    { id: 'batch', label: 'BATCH QUEUE', icon: <Aperture size={14} /> }
  ];

  return (
    <header style={styles.header}>
      {/* Brand & Project Selector */}
      <div style={styles.leftSection}>
        <div style={styles.brand}>
          <div style={styles.logoIcon}>
            <Aperture size={18} color="#e2a439" />
          </div>
          <div style={styles.brandText}>
            <span style={styles.brandTitle}>AFRO VISION</span>
            <span style={styles.brandBadge}>AI STUDIO</span>
          </div>
        </div>

        <div style={styles.divider} />

        {/* Project Selector */}
        <div style={{ position: 'relative' }}>
          <button
            style={styles.projectButton}
            onClick={() => setShowDropdown(!showDropdown)}
            title="Switch or manage catalogs"
          >
            <span style={styles.projectName}>
              {activeProject ? activeProject.name : 'Default Session'}
            </span>
            <ChevronDown size={14} color="#9da3af" />
          </button>

          {showDropdown && (
            <div style={styles.dropdownMenu}>
              <div style={styles.dropdownHeader}>CATALOG SESSIONS</div>
              {projects.map(p => (
                <button
                  key={p.id}
                  style={{
                    ...styles.dropdownItem,
                    backgroundColor: p.id === activeProject?.id ? 'var(--bg-surface-active)' : 'transparent',
                    color: p.id === activeProject?.id ? 'var(--accent-gold)' : 'var(--text-primary)'
                  }}
                  onClick={() => {
                    switchProject(p.id);
                    setShowDropdown(false);
                  }}
                >
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
              <div style={styles.dropdownDivider} />
              <button
                style={styles.dropdownActionItem}
                onClick={() => {
                  setShowDropdown(false);
                  setShowProjectModal(true);
                }}
              >
                <Plus size={14} />
                <span>New Project Session...</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Center View Mode Switcher */}
      <div style={styles.centerSection}>
        <div style={styles.modeSwitcher}>
          {views.map(v => {
            const isActive = currentView === v.id;
            return (
              <button
                key={v.id}
                style={{
                  ...styles.modeTab,
                  ...(isActive ? styles.modeTabActive : {})
                }}
                onClick={() => {
                  setCurrentView(v.id);
                  if (v.id === 'match_look') {
                    setIsAiAssistantOpen(true);
                  }
                }}
              >
                {v.icon}
                <span style={{ marginLeft: 6 }}>{v.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Actions & Hardware Badge */}
      <div style={styles.rightSection}>
        <button
          style={{ ...styles.actionButton, opacity: canUndo ? 1 : 0.4 }}
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={14} />
        </button>

        <button
          style={{ ...styles.actionButton, opacity: canRedo ? 1 : 0.4 }}
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={14} />
        </button>

        <button
          style={styles.actionButton}
          onClick={importFilesPrompt}
          title="Import Photographs (Ctrl+I)"
        >
          <FolderOpen size={14} style={{ marginRight: 6 }} />
          <span>Import</span>
        </button>

        <button
          style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
          onClick={() => setIsExportModalOpen(true)}
          title="Export Selected Photos (Ctrl+E)"
        >
          <Download size={14} style={{ marginRight: 6 }} />
          <span>Export</span>
        </button>

        <div style={styles.divider} />

        {/* Telemetry pill */}
        {systemInfo && (
          <div style={styles.telemetryPill} title={`Node ${systemInfo.nodeVersion} | Electron ${systemInfo.electronVersion} | RAM ${systemInfo.totalMemoryGb}GB`}>
            <Cpu size={12} color="#9da3af" style={{ marginRight: 4 }} />
            <span>{systemInfo.cpuCount} Cores</span>
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showProjectModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Create New Photography Session</h3>
            <p style={styles.modalSubtitle}>Initialize a non-destructive catalog database for your shoot.</p>
            <form onSubmit={handleCreateProject}>
              <input
                type="text"
                autoFocus
                placeholder="Session Name (e.g. Cape Town Sunset Portrait)"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                style={styles.modalInput}
              />
              <div style={styles.modalFooter}>
                <button
                  type="button"
                  style={styles.modalCancelBtn}
                  onClick={() => setShowProjectModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.modalConfirmBtn}
                  disabled={!newProjectName.trim()}
                >
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    height: 'var(--top-bar-height)',
    backgroundColor: 'var(--bg-panel)',
    borderBottom: '1px solid var(--border-default)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    zIndex: 100,
    flexShrink: 0
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer'
  },
  logoIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'var(--bg-surface)'
  },
  brandText: {
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  brandTitle: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: 'var(--text-primary)'
  },
  brandBadge: {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: '0.1em',
    color: '#111',
    backgroundColor: 'var(--accent-gold)',
    padding: '2px 5px',
    borderRadius: 3
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'var(--border-default)'
  },
  projectButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    backgroundColor: 'var(--bg-surface)',
    borderRadius: 4,
    border: '1px solid var(--border-subtle)',
    fontSize: 12,
    color: 'var(--text-primary)'
  },
  projectName: {
    maxWidth: 180,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  dropdownMenu: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    width: 220,
    backgroundColor: 'var(--bg-panel-elevated)',
    border: '1px solid var(--border-default)',
    borderRadius: 6,
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    zIndex: 200,
    padding: '4px 0'
  },
  dropdownHeader: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    padding: '6px 12px 4px 12px'
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '7px 12px',
    fontSize: 12,
    cursor: 'pointer'
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: 'var(--border-default)',
    margin: '4px 0'
  },
  dropdownActionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '8px 12px',
    fontSize: 12,
    color: 'var(--accent-gold)',
    cursor: 'pointer'
  },
  centerSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modeSwitcher: {
    display: 'flex',
    backgroundColor: 'var(--bg-app)',
    borderRadius: 5,
    padding: 2,
    border: '1px solid var(--border-subtle)'
  },
  modeTab: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 14px',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
    borderRadius: 4,
    transition: 'all 120ms ease'
  },
  modeTabActive: {
    backgroundColor: 'var(--bg-surface-active)',
    color: 'var(--text-primary)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '5px 12px',
    fontSize: 12,
    fontWeight: 500,
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 4,
    color: 'var(--text-primary)',
    transition: 'background-color 120ms ease'
  },
  actionButtonPrimary: {
    backgroundColor: 'var(--accent-gold)',
    color: '#000',
    borderColor: 'var(--accent-gold)',
    fontWeight: 600
  },
  telemetryPill: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 11,
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg-surface)',
    padding: '4px 8px',
    borderRadius: 12,
    border: '1px solid var(--border-subtle)'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    width: 400,
    backgroundColor: 'var(--bg-panel-elevated)',
    border: '1px solid var(--border-highlight)',
    borderRadius: 8,
    padding: 24,
    boxShadow: '0 16px 40px rgba(0,0,0,0.8)'
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 6
  },
  modalSubtitle: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginBottom: 16
  },
  modalInput: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 4,
    fontSize: 13,
    marginBottom: 16
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10
  },
  modalCancelBtn: {
    padding: '6px 14px',
    fontSize: 12,
    borderRadius: 4,
    color: 'var(--text-secondary)',
    backgroundColor: 'transparent'
  },
  modalConfirmBtn: {
    padding: '6px 16px',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 4,
    backgroundColor: 'var(--accent-gold)',
    color: '#000'
  }
};

import React from 'react';
import { useApp } from '../../hooks/useApp';
import {
  Image,
  Flag,
  XCircle,
  Circle,
  Heart,
  Star,
  FolderKanban,
  Clock,
  Sparkles,
  SlidersHorizontal,
  HardDrive
} from 'lucide-react';
import { LibraryFilterType } from '../../types/models';

export const LibraryNav: React.FC = () => {
  const { activeFilter, setActiveFilter, counts, systemInfo, setSearchQuery, searchQuery } = useApp();
  const { showSidePanels } = useApp();
  const { activeFilter, setActiveFilter, counts, systemInfo, setSearchQuery, searchQuery } = useApp();

  interface NavItem {
    id: LibraryFilterType;
    label: string;
    icon: React.ReactNode;
    count: number;
    color?: string;
  }

  const catalogItems: NavItem[] = [
    { id: 'all', label: 'All Photographs', icon: <Image size={15} />, count: counts.all },
    { id: 'recent_imports', label: 'Recent Imports', icon: <Clock size={15} />, count: counts.recent_imports, color: '#9da3af' },
    { id: 'favorites', label: 'Favorites', icon: <Heart size={15} />, count: counts.favorites, color: '#f43f5e' }
  ];

  const cullingItems: NavItem[] = [
    { id: 'picks', label: 'Picks', icon: <Flag size={15} />, count: counts.picks, color: 'var(--accent-green)' },
    { id: 'unflagged', label: 'Unflagged', icon: <Circle size={15} />, count: counts.unflagged, color: 'var(--text-muted)' },
    { id: 'rejects', label: 'Rejects', icon: <XCircle size={15} />, count: counts.rejects, color: 'var(--accent-red)' },
    { id: 'rated', label: 'Rated Photos (1-5★)', icon: <Star size={15} />, count: counts.rated, color: 'var(--accent-star)' }
  ];

  const workflowItems: NavItem[] = [
    { id: 'needs_review', label: 'Needs AI Review', icon: <Sparkles size={15} />, count: counts.needs_review, color: 'var(--accent-gold)' },
    { id: 'edited', label: 'Edited', icon: <SlidersHorizontal size={15} />, count: counts.edited, color: 'var(--accent-blue)' }
  ];

  const renderNavSection = (title: string, items: NavItem[]) => (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <span>{title}</span>
      </div>
      {items.map(item => {
        const isActive = activeFilter === item.id;
        return (
          <button
            key={item.id}
            style={{
              ...styles.navButton,
              ...(isActive ? styles.navButtonActive : {})
            }}
            onClick={() => setActiveFilter(item.id)}
          >
            <div style={styles.navLeft}>
              <span style={{ color: item.color || 'inherit', display: 'flex' }}>{item.icon}</span>
              <span style={styles.navLabel}>{item.label}</span>
            </div>
            <span style={styles.countBadge}>{item.count}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <aside style={styles.container}>
      {renderNavSection('CATALOG', catalogItems)}
      {renderNavSection('CULLING & FLAGS', cullingItems)}
      {renderNavSection('QUICK WORKFLOWS', workflowItems)}

      {/* Collections */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span>SMART COLLECTIONS</span>
        </div>
        <button
          style={{
            ...styles.navButton,
            ...(searchQuery.toLowerCase() === 'portrait' ? styles.navButtonActive : {})
          }}
          onClick={() => setSearchQuery(searchQuery.toLowerCase() === 'portrait' ? '' : 'portrait')}
        >
          <div style={styles.navLeft}>
            <FolderKanban size={15} color="#e2a439" />
            <span style={styles.navLabel}>Studio Portraits</span>
          </div>
          <span style={styles.countBadge}>Filter</span>
        </button>
        <button
          style={{
            ...styles.navButton,
            ...(searchQuery.toLowerCase() === 'wedding' ? styles.navButtonActive : {})
          }}
          onClick={() => setSearchQuery(searchQuery.toLowerCase() === 'wedding' ? '' : 'wedding')}
        >
          <div style={styles.navLeft}>
            <FolderKanban size={15} color="#3b82f6" />
            <span style={styles.navLabel}>Outdoor & Weddings</span>
          </div>
          <span style={styles.countBadge}>Filter</span>
        </button>
      </div>

      {/* Database & Storage Status Footer */}
      <div style={styles.footerSection}>
        <div style={styles.footerRow}>
          <HardDrive size={13} color="#646a78" />
          <span style={styles.footerText}>SQLite WAL Active</span>
        </div>
        <div style={styles.footerSubText}>
          {systemInfo?.platform === 'win32' ? 'Windows x64 Native Storage' : 'Native Storage'}
        </div>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: 'var(--nav-sidebar-width)',
    backgroundColor: 'var(--bg-panel)',
    borderRight: '1px solid var(--border-default)',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    flexShrink: 0,
    padding: '8px 0'
  },
  section: {
    marginBottom: 16
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    padding: '6px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '6px 16px',
    fontSize: 12,
    color: 'var(--text-secondary)',
    transition: 'background-color 100ms ease, color 100ms ease',
    textAlign: 'left'
  },
  navButtonActive: {
    backgroundColor: 'var(--bg-surface-active)',
    color: 'var(--text-primary)',
    fontWeight: 500,
    borderLeft: '2px solid var(--accent-gold)'
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  navLabel: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  countBadge: {
    fontSize: 11,
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg-surface)',
    padding: '1px 6px',
    borderRadius: 8
  },
  footerSection: {
    marginTop: 'auto',
    padding: '12px 16px',
    borderTop: '1px solid var(--border-subtle)',
    backgroundColor: 'var(--bg-app)'
  },
  footerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  footerText: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-secondary)'
  },
  footerSubText: {
    fontSize: 10,
    color: 'var(--text-muted)',
    marginTop: 2
  }
};

import React from 'react';
import { TopAppBar } from '../components/layout/TopAppBar';
import { LibraryNav } from '../components/layout/LibraryNav';
import { CentralWorkspace } from '../components/layout/CentralWorkspace';
import { EditingPanel } from '../components/layout/EditingPanel';
import { BottomStatusBar } from '../components/layout/BottomStatusBar';
import { ImportModal } from '../components/common/ImportModal';
import { ExportModal } from '../components/common/ExportModal';
import { AIAssistantModal } from '../components/common/AIAssistantModal';
import { useApp } from '../hooks/useApp';
import { ShortcutsModal } from '../components/common/ShortcutsModal';

export const App: React.FC = () => {
  const { isExportModalOpen, setIsExportModalOpen, isAiAssistantOpen, setIsAiAssistantOpen, isShortcutsOpen, setIsShortcutsOpen, showSidePanels } = useApp();

  return (
    <div className="app-container">
      {/* 1. Top Application Bar */}
      <TopAppBar />
      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />


      {/* 2. Main 3-Column Studio Workspace */}
      <div className="main-body">
        {/* Left: Library & Culling Navigation */}
        {showSidePanels && <LibraryNav />}


        {/* Center: Central Photo Canvas */}
        <CentralWorkspace />


        {/* Right: Studio Editing & AI Inspector */}
        {showSidePanels && <EditingPanel />}

      </div>

      {/* 3. Bottom Status & Telemetry Bar */}
      <BottomStatusBar />


      {/* 4. Non-Blocking Import Progress & Diagnostic Modal */}
      <ImportModal />


      {/* 5. Production Photo Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />


      {/* 6. AI Studio Natural-Language Assistant */}
      <AIAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
      />

    </div>
  );
};

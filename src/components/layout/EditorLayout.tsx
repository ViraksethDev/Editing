import React, { useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { PreviewCanvas } from '../editor/PreviewCanvas';
import { VideoPreview } from '../editor/VideoPreview';
import { PropertiesPanel } from '../editor/PropertiesPanel';
import { Timeline } from '../editor/Timeline';
import { MediaLibrary } from '../media/MediaLibrary';
import { AudioEditor } from '../tools/AudioEditor';
import { TextEditor } from '../tools/TextEditor';
import { CaptionsPanel } from '../tools/CaptionsPanel';
import { StickersPanel } from '../tools/StickersPanel';
import { EffectsPanel } from '../tools/EffectsPanel';
import { FiltersPanel } from '../tools/FiltersPanel';
import { TransitionsPanel } from '../tools/TransitionsPanel';
import { ExportModal } from '../modals/ExportModal';
import { SettingsModal } from '../modals/SettingsModal';
import { ShortcutsModal } from '../modals/ShortcutsModal';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sliders, 
  X, 
  FileVideo, 
  Music2, 
  Type, 
  Subtitles, 
  Smile, 
  Wand2, 
  SlidersHorizontal, 
  GitCompareArrows 
} from 'lucide-react';

interface EditorLayoutProps {
  onOpenDashboard: () => void;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string; icon: any }> = {
  media: { title: 'Media Assets', subtitle: 'Upload videos, images, and sample media', icon: FileVideo },
  audio: { title: 'Audio & Music', subtitle: 'Royalty-free tracks and sound effects', icon: Music2 },
  text: { title: 'Text & Titles', subtitle: 'Add viral hooks, subtitles, and animated text', icon: Type },
  captions: { title: 'Timed Captions', subtitle: 'Auto-timed subtitle presets and manual scripts', icon: Subtitles },
  stickers: { title: 'Stickers & Badges', subtitle: 'Instagram badges, call-to-actions, and emojis', icon: Smile },
  effects: { title: 'Color Adjustments', subtitle: 'Brightness, contrast, saturation, and blur', icon: Wand2 },
  filters: { title: 'Instagram Filters', subtitle: 'Clarendon, Juno, Vintage, Cyberpunk, and more', icon: SlidersHorizontal },
  transitions: { title: 'Video Transitions', subtitle: 'Crossfade, directional slides, zoom impact, and wipe', icon: GitCompareArrows }
};

export const EditorLayout: React.FC<EditorLayoutProps> = ({ onOpenDashboard }) => {
  const {
    activeTab,
    project,
    createNewProject,
    isDrawerOpen,
    setIsDrawerOpen,
    isPropertiesOpen,
    setIsPropertiesOpen
  } = useEditorStore();

  // Enable all global keyboard shortcuts (Space play/pause, S split, Del delete, Ctrl+Z, etc.)
  useKeyboardShortcuts();

  // Ensure a default project exists if none loaded
  useEffect(() => {
    if (!project) {
      createNewProject('My Instagram Reel', '9:16');
    }
  }, [project, createNewProject]);

  // Render active drawer panel based on tab
  const renderActiveDrawer = () => {
    switch (activeTab) {
      case 'media':
        return <MediaLibrary />;
      case 'audio':
        return <AudioEditor />;
      case 'text':
        return <TextEditor />;
      case 'captions':
        return <CaptionsPanel />;
      case 'stickers':
        return <StickersPanel />;
      case 'effects':
        return <EffectsPanel />;
      case 'filters':
        return <FiltersPanel />;
      case 'transitions':
        return <TransitionsPanel />;
      default:
        return <MediaLibrary />;
    }
  };

  const currentTabInfo = TAB_TITLES[activeTab] || TAB_TITLES.media;
  const ActiveIcon = currentTabInfo.icon;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d0e14] text-gray-100 select-none">
      {/* 1. Top Navigation Bar */}
      <Topbar onOpenDashboard={onOpenDashboard} />

      {/* 2. Middle Work Area (Flexbox Layout: Sidebar | Drawer | Canvas | Inspector) */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Leftmost Sidebar Rail for Tool Navigation */}
        <Sidebar />

        {/* Left Tool Drawer Panel (Collapsible) */}
        {isDrawerOpen && (
          <div className="w-72 sm:w-80 md:w-84 xl:w-92 bg-[#14151e] border-r border-[#242634] flex flex-col h-full overflow-hidden shrink-0 z-20 shadow-xl transition-all duration-200">
            {/* Drawer Header with Title and Close button */}
            <div className="h-12 px-3.5 border-b border-[#242634] flex items-center justify-between bg-[#161822] shrink-0">
              <div className="flex items-center gap-2 overflow-hidden pr-2">
                <div className="w-6 h-6 rounded-md bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                  <ActiveIcon className="w-3.5 h-3.5" />
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-xs font-bold text-gray-100 truncate">
                    {currentTabInfo.title}
                  </h3>
                  <p className="text-[10px] text-gray-400 truncate hidden sm:block">
                    {currentTabInfo.subtitle}
                  </p>
                </div>
              </div>

              {/* Close / Collapse Drawer button */}
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-[#232534] transition-colors"
                title="Collapse drawer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Active Content */}
            <div className="flex-1 overflow-y-auto">
              {renderActiveDrawer()}
            </div>
          </div>
        )}

        {/* Center Panel: Video Preview */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 relative bg-[#0e0f14]">
          <VideoPreview />
        </div>

        {/* Right Sidebar: Contextual Properties Inspector (Collapsible) */}
        {isPropertiesOpen ? (
          <div className="relative flex shrink-0">
            <PropertiesPanel />
            {/* Collapse Inspector Tab */}
            <button
              onClick={() => setIsPropertiesOpen(false)}
              className="absolute top-3 left-1.5 p-1 rounded-md bg-[#202230] border border-[#2e3146] text-gray-400 hover:text-white transition-colors z-30"
              title="Hide Properties Inspector"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Collapsed Strip to Re-open Properties Inspector */
          <div
            onClick={() => setIsPropertiesOpen(true)}
            className="w-8 bg-[#121318] border-l border-[#252730] hover:bg-[#181a24] flex flex-col items-center py-3 cursor-pointer transition-colors group shrink-0"
            title="Open Properties Inspector"
          >
            <Sliders className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors mb-3" />
            <span className="text-[10px] font-bold text-gray-400 [writing-mode:vertical-lr] tracking-widest uppercase group-hover:text-gray-200">
              Inspector
            </span>
          </div>
        )}
      </div>

      {/* 3. Bottom Panel: Multi-Track Timeline Editor */}
      <Timeline />

      {/* 4. Modals */}
      <ExportModal />
      <SettingsModal />
      <ShortcutsModal />
    </div>
  );
};

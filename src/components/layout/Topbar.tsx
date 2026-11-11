import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { AspectRatio } from '../../types/editor';
import { 
  Sparkles, 
  Undo2, 
  Redo2, 
  Download, 
  Share2, 
  CheckCircle2, 
  Clock, 
  Settings, 
  Keyboard, 
  FolderOpen,
  Smartphone,
  Tv,
  Square,
  RectangleVertical,
  PanelLeft,
  PanelRight
} from 'lucide-react';

interface TopbarProps {
  onOpenDashboard: () => void;
}

const ASPECT_RATIOS: { ratio: AspectRatio; label: string; icon: any }[] = [
  { ratio: '9:16', label: '9:16 Reels', icon: Smartphone },
  { ratio: '16:9', label: '16:9 Landscape', icon: Tv },
  { ratio: '1:1', label: '1:1 Square', icon: Square },
  { ratio: '4:5', label: '4:5 Portrait', icon: RectangleVertical },
];

export const Topbar: React.FC<TopbarProps> = ({ onOpenDashboard }) => {
  const {
    project,
    updateProjectName,
    setAspectRatio,
    undo,
    redo,
    undoStack,
    redoStack,
    isSaving,
    lastSavedAt,
    openExportModal,
    openSettingsModal,
    openShortcutsModal,
    isDrawerOpen,
    toggleDrawer,
    isPropertiesOpen,
    toggleProperties
  } = useEditorStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(project?.name || 'Untitled Reel');

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      updateProjectName(titleInput.trim());
    }
  };

  return (
    <header className="h-14 bg-[#121318] border-b border-[#252730] px-4 flex items-center justify-between z-30 select-none">
      {/* Left: Brand & Project Info */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div 
          onClick={onOpenDashboard}
          title="Back to Projects Dashboard"
          className="flex items-center gap-2 cursor-pointer group hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              InstaEdit <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">Studio</span>
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-[#2a2d38] mx-1 hidden sm:block" />

        {/* Dashboard link button */}
        <button
          onClick={onOpenDashboard}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-gray-300 hover:text-white hover:bg-[#20222a] transition-colors"
          title="Open Projects Dashboard"
        >
          <FolderOpen className="w-3.5 h-3.5 text-gray-400" />
          Projects
        </button>

        <div className="h-4 w-px bg-[#2a2d38] mx-1 hidden md:block" />

        {/* Project Name editable */}
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <input
              type="text"
              value={titleInput}
              autoFocus
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') setIsEditingTitle(false);
              }}
              className="bg-[#1c1e26] text-white text-xs px-2.5 py-1 rounded border border-purple-500 focus:outline-none w-48 font-medium"
            />
          ) : (
            <button
              onClick={() => {
                setTitleInput(project?.name || 'Untitled Reel');
                setIsEditingTitle(true);
              }}
              className="text-xs font-semibold text-gray-200 hover:text-white hover:bg-[#20222a] px-2 py-1 rounded transition-colors truncate max-w-[140px] sm:max-w-[200px]"
              title="Click to rename project"
            >
              {project?.name || 'Untitled Reel'}
            </button>
          )}

          {/* Auto-save status */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-gray-400">
            {isSaving ? (
              <span className="flex items-center gap-1 text-purple-400">
                <Clock className="w-3 h-3 animate-spin" /> Saving...
              </span>
            ) : lastSavedAt ? (
              <span className="flex items-center gap-1 text-emerald-400/90" title="Saved locally in browser IndexedDB">
                <CheckCircle2 className="w-3 h-3" /> Saved
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Center: Aspect Ratio Selector */}
      <div className="flex items-center bg-[#1a1b22] p-0.5 rounded-lg border border-[#2b2e3b]">
        {ASPECT_RATIOS.map((item) => {
          const Icon = item.icon;
          const isActive = project?.aspectRatio === item.ratio;
          return (
            <button
              key={item.ratio}
              onClick={() => setAspectRatio(item.ratio)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#242733]'
              }`}
              title={`Switch canvas to ${item.label}`}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden sm:inline">{item.ratio}</span>
            </button>
          );
        })}
      </div>

      {/* Right: History, Settings & Export */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-[#1a1b22] rounded-lg border border-[#2b2e3b] p-0.5">
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            className={`p-1.5 rounded-md transition-colors ${
              undoStack.length > 0
                ? 'text-gray-200 hover:text-white hover:bg-[#252835]'
                : 'text-gray-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className={`p-1.5 rounded-md transition-colors ${
              redoStack.length > 0
                ? 'text-gray-200 hover:text-white hover:bg-[#252835]'
                : 'text-gray-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Layout Panels Toggles */}
        <div className="hidden lg:flex items-center bg-[#1a1b22] rounded-lg border border-[#2b2e3b] p-0.5">
          <button
            onClick={toggleDrawer}
            className={`p-1.5 rounded-md transition-colors ${
              isDrawerOpen
                ? 'text-purple-400 bg-purple-500/15'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#252835]'
            }`}
            title="Toggle Tools Drawer"
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleProperties}
            className={`p-1.5 rounded-md transition-colors ${
              isPropertiesOpen
                ? 'text-purple-400 bg-purple-500/15'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#252835]'
            }`}
            title="Toggle Properties Panel"
          >
            <PanelRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Shortcuts */}
        <button
          onClick={openShortcutsModal}
          className="p-2 text-gray-400 hover:text-gray-200 hover:bg-[#1f212a] rounded-lg transition-colors hidden md:block"
          title="Keyboard Shortcuts"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={openSettingsModal}
          className="p-2 text-gray-400 hover:text-gray-200 hover:bg-[#1f212a] rounded-lg transition-colors"
          title="Editor Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Export CTA Button */}
        <button
          onClick={openExportModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 shadow-lg shadow-pink-600/25 active:scale-95 transition-all"
          title="Export edited video (Ctrl+E)"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};

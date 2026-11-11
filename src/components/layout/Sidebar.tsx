import React from 'react';
import { useEditorStore, SidebarTab } from '../../store/editorStore';
import { 
  FileVideo, 
  Music2, 
  Type, 
  Subtitles, 
  Smile, 
  Wand2, 
  SlidersHorizontal, 
  GitCompareArrows 
} from 'lucide-react';

interface TabItem {
  id: SidebarTab;
  label: string;
  icon: any;
}

const TABS: TabItem[] = [
  { id: 'media', label: 'Media', icon: FileVideo },
  { id: 'audio', label: 'Audio', icon: Music2 },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'captions', label: 'Captions', icon: Subtitles },
  { id: 'stickers', label: 'Stickers', icon: Smile },
  { id: 'effects', label: 'Effects', icon: Wand2 },
  { id: 'filters', label: 'Filters', icon: SlidersHorizontal },
  { id: 'transitions', label: 'Transitions', icon: GitCompareArrows }
];

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, isDrawerOpen, setIsDrawerOpen } = useEditorStore();

  const handleTabClick = (tabId: SidebarTab) => {
    if (activeTab === tabId) {
      setIsDrawerOpen(!isDrawerOpen);
    } else {
      setActiveTab(tabId);
      setIsDrawerOpen(true);
    }
  };

  return (
    <aside className="w-16 sm:w-20 bg-[#121318] border-r border-[#252730] flex flex-col items-center py-2 z-20 shrink-0">
      <div className="flex flex-col gap-1 w-full px-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && isDrawerOpen;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all group ${
                isActive
                  ? 'bg-purple-600/15 text-purple-400 font-semibold border border-purple-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#1c1e26]'
              }`}
              title={`${tab.label} ${isActive ? '(Click to collapse)' : ''}`}
            >
              <div className={`p-1 rounded-lg transition-transform ${isActive ? 'scale-110 text-purple-400' : 'group-hover:scale-105'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'text-purple-300 font-bold' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

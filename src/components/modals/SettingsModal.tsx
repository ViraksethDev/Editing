import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { X, Settings, HardDrive, Cpu, ShieldCheck } from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const { isSettingsModalOpen, closeSettingsModal, project } = useEditorStore();

  if (!isSettingsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-[#14161f] border border-[#27293a] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-[#252838] flex items-center justify-between bg-[#171924]">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white">Editor Preferences</h2>
          </div>
          <button
            onClick={closeSettingsModal}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#252838] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Storage Information */}
          <div className="bg-[#181a26] p-3 rounded-xl border border-[#262838] space-y-2">
            <div className="flex items-center gap-2 text-gray-200 font-bold">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>Browser Storage (IndexedDB)</span>
            </div>
            <p className="text-[11px] text-gray-400">
              Projects and imported assets are securely stored locally in your browser's IndexedDB. No server upload required.
            </p>
            <div className="text-[11px] font-mono text-purple-300">
              Project ID: {project?.id || 'None'}
            </div>
          </div>

          {/* Rendering Engine */}
          <div className="bg-[#181a26] p-3 rounded-xl border border-[#262838] space-y-2">
            <div className="flex items-center gap-2 text-gray-200 font-bold">
              <Cpu className="w-4 h-4 text-pink-400" />
              <span>Hardware Acceleration</span>
            </div>
            <p className="text-[11px] text-gray-400">
              HTML5 Canvas and Web Audio API are utilizing your device GPU for smooth 60fps preview and real-time compositing.
            </p>
          </div>

          {/* Privacy & Safe Area */}
          <div className="bg-[#181a26] p-3 rounded-xl border border-[#262838] space-y-2">
            <div className="flex items-center gap-2 text-gray-200 font-bold">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>Safe Editing Workflow</span>
            </div>
            <p className="text-[11px] text-gray-400">
              Original video aspect ratios (9:16 Reels, 16:9 YouTube, 1:1 Square, 4:5 Portrait) ensure your content doesn't get covered by Instagram UI badges.
            </p>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[#252838] bg-[#161722] flex justify-end">
          <button
            onClick={closeSettingsModal}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

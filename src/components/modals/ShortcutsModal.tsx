import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { X, Keyboard, Command } from 'lucide-react';

const SHORTCUTS = [
  { key: 'Space', action: 'Play / Pause Video' },
  { key: 'S', action: 'Split selected clip at playhead' },
  { key: 'Del / Backspace', action: 'Delete selected clip' },
  { key: 'Ctrl + D', action: 'Duplicate selected clip' },
  { key: 'Ctrl + Z', action: 'Undo last change' },
  { key: 'Ctrl + Shift + Z', action: 'Redo change' },
  { key: 'Ctrl + S', action: 'Save project immediately' },
  { key: 'Ctrl + E', action: 'Open Export dialog' },
  { key: 'Arrow Left', action: 'Previous frame (1/30s)' },
  { key: 'Arrow Right', action: 'Next frame (1/30s)' },
  { key: 'Shift + Arrow Left', action: 'Jump backward 1 second' },
  { key: 'Shift + Arrow Right', action: 'Jump forward 1 second' },
  { key: 'M', action: 'Mute / Unmute audio' },
  { key: 'Home / End', action: 'Jump to beginning / end' }
];

export const ShortcutsModal: React.FC = () => {
  const { isShortcutsModalOpen, closeShortcutsModal } = useEditorStore();

  if (!isShortcutsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-[#14161f] border border-[#27293a] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-[#252838] flex items-center justify-between bg-[#171924]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={closeShortcutsModal}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#252838] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-2 text-xs">
          {SHORTCUTS.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-[#181a26] border border-[#252738]"
            >
              <span className="text-gray-300 font-medium">{s.action}</span>
              <kbd className="px-2 py-0.5 rounded bg-[#25283a] text-purple-300 font-mono text-[11px] border border-[#35384e] shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-[#252838] bg-[#161722] flex justify-end">
          <button
            onClick={closeShortcutsModal}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { SlidersHorizontal, Check } from 'lucide-react';
import { FilterPreset, VideoClip, ImageClip } from '../../types/editor';

interface FilterItem {
  id: FilterPreset;
  name: string;
  gradient: string;
  description: string;
}

const FILTERS: FilterItem[] = [
  { id: 'none', name: 'Original', gradient: 'from-gray-700 to-gray-900', description: 'No color filtering' },
  { id: 'clarendon', name: 'Clarendon', gradient: 'from-blue-600 to-pink-500', description: 'Intense contrast & vivid blues' },
  { id: 'juno', name: 'Juno', gradient: 'from-amber-500 to-rose-600', description: 'Warm punchy tones & greens' },
  { id: 'vintage', name: 'Vintage', gradient: 'from-amber-700 to-yellow-900', description: 'Sepia nostalgic warmth' },
  { id: 'noir', name: 'Noir B&W', gradient: 'from-gray-300 to-black', description: 'High contrast black and white' },
  { id: 'warm_sunset', name: 'Warm Sunset', gradient: 'from-orange-500 to-red-600', description: 'Golden hour amber hues' },
  { id: 'cyberpunk', name: 'Cyberpunk', gradient: 'from-fuchsia-600 to-cyan-500', description: 'Electric neon tones' },
  { id: 'vivid', name: 'Vivid Pop', gradient: 'from-emerald-400 to-blue-600', description: 'Boosted saturation & vibrancy' },
  { id: 'pastel', name: 'Pastel Dream', gradient: 'from-pink-300 to-indigo-300', description: 'Soft luminous aesthetic' },
  { id: 'dramatic', name: 'Dramatic', gradient: 'from-indigo-950 to-amber-700', description: 'Moody shadows & highlights' },
  { id: 'retro90s', name: 'Retro 90s', gradient: 'from-teal-600 to-orange-500', description: '90s camcorder aesthetic' }
];

export const FiltersPanel: React.FC = () => {
  const { project, selectedClipId, updateClip } = useEditorStore();

  const selectedClip = project?.clips.find((c) => c.id === selectedClipId);
  const isVisualClip = selectedClip && (selectedClip.type === 'video' || selectedClip.type === 'image');

  const currentFilter = isVisualClip ? (selectedClip as VideoClip | ImageClip).filter : 'none';

  const handleApplyFilter = (filterId: FilterPreset) => {
    if (!selectedClipId || !isVisualClip) {
      // Find first visual clip if none selected
      const firstVisual = project?.clips.find((c) => c.type === 'video' || c.type === 'image');
      if (firstVisual) {
        updateClip(firstVisual.id, { filter: filterId });
      }
      return;
    }
    updateClip(selectedClipId, { filter: filterId });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 space-y-4">
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Instagram Filters
          </span>
        </div>
        <p className="text-[11px] text-gray-400">
          {isVisualClip ? `Applying to: ${selectedClip.name}` : 'Select a clip or click below to apply to main video'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {FILTERS.map((f) => {
          const isActive = currentFilter === f.id;
          return (
            <div
              key={f.id}
              onClick={() => handleApplyFilter(f.id)}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-[#1e1b33] border-purple-500 ring-1 ring-purple-500'
                  : 'bg-[#161722] border-[#252838] hover:border-purple-500/50 hover:bg-[#1a1c29]'
              }`}
            >
              <div className={`h-14 rounded-lg bg-gradient-to-tr ${f.gradient} mb-2 relative flex items-center justify-center shadow-inner`}>
                {isActive && (
                  <div className="w-6 h-6 rounded-full bg-white text-purple-600 flex items-center justify-center shadow">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-200">{f.name}</h4>
                <p className="text-[10px] text-gray-400 truncate">{f.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

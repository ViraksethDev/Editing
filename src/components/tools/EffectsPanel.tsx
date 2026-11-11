import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { Wand2, SunMedium, Contrast, Palette, Eye, Sparkles } from 'lucide-react';
import { VideoClip, ImageClip, VisualAdjustments } from '../../types/editor';

export const EffectsPanel: React.FC = () => {
  const { project, selectedClipId, updateClip } = useEditorStore();

  const selectedClip = project?.clips.find((c) => c.id === selectedClipId);
  const isVisual = selectedClip && (selectedClip.type === 'video' || selectedClip.type === 'image');
  const clip = (isVisual ? selectedClip : project?.clips.find((c) => c.type === 'video' || c.type === 'image')) as (VideoClip | ImageClip) | undefined;

  const adjustments: VisualAdjustments = clip?.adjustments || {
    brightness: 1,
    contrast: 1,
    saturation: 1,
    temperature: 0,
    exposure: 0,
    blur: 0,
    vignette: 0,
    noise: 0
  };

  const handleUpdate = (field: keyof VisualAdjustments, val: number) => {
    if (!clip) return;
    const newAdj = { ...adjustments, [field]: val };
    updateClip(clip.id, { adjustments: newAdj });
  };

  const handleReset = () => {
    if (!clip) return;
    updateClip(clip.id, {
      adjustments: {
        brightness: 1,
        contrast: 1,
        saturation: 1,
        temperature: 0,
        exposure: 0,
        blur: 0,
        vignette: 0,
        noise: 0
      }
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Wand2 className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Color Adjustments
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            {clip ? `Target: ${clip.name}` : 'No clip available'}
          </p>
        </div>
        <button
          onClick={handleReset}
          className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold px-2 py-1 rounded hover:bg-purple-950/40"
        >
          Reset
        </button>
      </div>

      <div className="space-y-3.5 bg-[#161722] p-3 rounded-xl border border-[#262838]">
        {/* Brightness */}
        <div>
          <div className="flex justify-between text-xs text-gray-300 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <SunMedium className="w-3.5 h-3.5 text-amber-400" /> Brightness
            </span>
            <span className="font-mono text-gray-400">{Math.round((adjustments.brightness - 1) * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.4"
            max="1.8"
            step="0.05"
            value={adjustments.brightness}
            onChange={(e) => handleUpdate('brightness', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Contrast */}
        <div>
          <div className="flex justify-between text-xs text-gray-300 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Contrast className="w-3.5 h-3.5 text-sky-400" /> Contrast
            </span>
            <span className="font-mono text-gray-400">{Math.round((adjustments.contrast - 1) * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.8"
            step="0.05"
            value={adjustments.contrast}
            onChange={(e) => handleUpdate('contrast', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Saturation */}
        <div>
          <div className="flex justify-between text-xs text-gray-300 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Palette className="w-3.5 h-3.5 text-pink-400" /> Saturation
            </span>
            <span className="font-mono text-gray-400">{Math.round((adjustments.saturation - 1) * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={adjustments.saturation}
            onChange={(e) => handleUpdate('saturation', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Blur */}
        <div>
          <div className="flex justify-between text-xs text-gray-300 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Eye className="w-3.5 h-3.5 text-emerald-400" /> Blur
            </span>
            <span className="font-mono text-gray-400">{adjustments.blur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="15"
            step="1"
            value={adjustments.blur}
            onChange={(e) => handleUpdate('blur', parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

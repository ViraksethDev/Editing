import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { 
  Sliders, 
  Trash2, 
  Copy, 
  Scissors, 
  Type, 
  Volume2, 
  Move, 
  RotateCw, 
  Gauge, 
  Layers, 
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2
} from 'lucide-react';
import { VideoClip, ImageClip, TextClip, AudioClip, StickerClip } from '../../types/editor';

const FONTS = [
  { label: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans, sans-serif' },
  { label: 'Space Grotesk', value: 'Space Grotesk, sans-serif' },
  { label: 'Bebas Neue (Viral Hook)', value: 'Bebas Neue, sans-serif' },
  { label: 'Playfair (Editorial)', value: 'Playfair Display, serif' },
  { label: 'Caveat (Handwritten)', value: 'Caveat, cursive' },
  { label: 'Inter', value: 'system-ui, sans-serif' }
];

export const PropertiesPanel: React.FC = () => {
  const {
    project,
    selectedClipId,
    updateClip,
    deleteClip,
    duplicateClip,
    splitClip,
    currentTime
  } = useEditorStore();

  const selectedClip = project?.clips.find((c) => c.id === selectedClipId);

  if (!selectedClip) {
    return (
      <aside className="w-72 bg-[#121318] border-l border-[#252730] flex flex-col items-center justify-center p-6 text-center select-none shrink-0">
        <div className="w-12 h-12 rounded-2xl bg-[#1c1e28] text-gray-400 flex items-center justify-center mb-3 border border-[#2b2e3e]">
          <Sliders className="w-5 h-5 text-gray-400" />
        </div>
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
          Properties Inspector
        </h3>
        <p className="text-xs text-gray-400">
          Select any video, text, sticker, or audio clip on the timeline to edit its properties.
        </p>
      </aside>
    );
  }

  const isVideo = selectedClip.type === 'video';
  const isImage = selectedClip.type === 'image';
  const isText = selectedClip.type === 'text';
  const isAudio = selectedClip.type === 'audio';
  const isSticker = selectedClip.type === 'sticker';

  const videoClip = selectedClip as VideoClip;
  const textClip = selectedClip as TextClip;
  const audioClip = selectedClip as AudioClip;
  const stickerClip = selectedClip as StickerClip;

  return (
    <aside className="w-72 bg-[#121318] border-l border-[#252730] flex flex-col h-full overflow-y-auto select-none shrink-0">
      {/* Header with Quick Actions */}
      <div className="p-3 border-b border-[#252730] flex items-center justify-between bg-[#151720]">
        <div className="overflow-hidden pr-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">
            {selectedClip.type} Layer
          </span>
          <h3 className="text-xs font-bold text-white truncate" title={selectedClip.name}>
            {selectedClip.name}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => splitClip(selectedClip.id, currentTime)}
            className="p-1.5 rounded-lg bg-[#222432] hover:bg-purple-600 text-gray-300 hover:text-white transition-colors"
            title="Split at playhead (S)"
          >
            <Scissors className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => duplicateClip(selectedClip.id)}
            className="p-1.5 rounded-lg bg-[#222432] hover:bg-purple-600 text-gray-300 hover:text-white transition-colors"
            title="Duplicate clip (Ctrl+D)"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => deleteClip(selectedClip.id)}
            className="p-1.5 rounded-lg bg-[#222432] hover:bg-red-600 text-gray-300 hover:text-white transition-colors"
            title="Delete clip (Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-4 text-xs">
        {/* Timeline Timing */}
        <div className="bg-[#171924] p-2.5 rounded-xl border border-[#262838] space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
            Timing & Duration
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-gray-400 block">Start</span>
              <input
                type="number"
                step="0.1"
                min="0"
                value={Number(selectedClip.startTime.toFixed(2))}
                onChange={(e) => updateClip(selectedClip.id, { startTime: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#202230] text-white px-2 py-1 rounded border border-[#32364a] text-xs font-mono"
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block">Duration</span>
              <input
                type="number"
                step="0.1"
                min="0.2"
                value={Number(selectedClip.duration.toFixed(2))}
                onChange={(e) => updateClip(selectedClip.id, { duration: Math.max(0.2, parseFloat(e.target.value) || 0.2) })}
                className="w-full bg-[#202230] text-white px-2 py-1 rounded border border-[#32364a] text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Text Inspector */}
        {isText && (
          <div className="space-y-3 bg-[#171924] p-2.5 rounded-xl border border-[#262838]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
              Text Content & Style
            </span>

            <div>
              <span className="text-[10px] text-gray-400 block mb-1">Content</span>
              <textarea
                value={textClip.text}
                rows={2}
                onChange={(e) => updateClip(textClip.id, { text: e.target.value, name: e.target.value.slice(0, 16) })}
                className="w-full bg-[#202230] text-white p-2 rounded border border-[#32364a] text-xs resize-none focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <span className="text-[10px] text-gray-400 block mb-1">Font Family</span>
              <select
                value={textClip.fontFamily}
                onChange={(e) => updateClip(textClip.id, { fontFamily: e.target.value })}
                className="w-full bg-[#202230] text-white px-2 py-1.5 rounded border border-[#32364a] text-xs"
              >
                {FONTS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Size & Color */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-gray-400 block mb-1">Size ({textClip.fontSize}px)</span>
                <input
                  type="range"
                  min="16"
                  max="96"
                  value={textClip.fontSize}
                  onChange={(e) => updateClip(textClip.id, { fontSize: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block mb-1">Text Color</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={textClip.color || '#ffffff'}
                    onChange={(e) => updateClip(textClip.id, { color: e.target.value })}
                    className="w-7 h-7 rounded border border-[#32364a] bg-transparent cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-gray-300">{textClip.color}</span>
                </div>
              </div>
            </div>

            {/* Background pill color */}
            <div>
              <span className="text-[10px] text-gray-400 block mb-1">Background Highlight</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateClip(textClip.id, { backgroundColor: 'transparent' })}
                  className={`px-2 py-1 rounded text-[11px] font-medium border ${
                    !textClip.backgroundColor || textClip.backgroundColor === 'transparent'
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-[#202230] text-gray-400 border-[#32364a]'
                  }`}
                >
                  None
                </button>
                <button
                  onClick={() => updateClip(textClip.id, { backgroundColor: 'rgba(0, 0, 0, 0.85)' })}
                  className="px-2 py-1 rounded text-[11px] font-medium bg-black text-white border border-gray-700"
                >
                  Dark
                </button>
                <button
                  onClick={() => updateClip(textClip.id, { backgroundColor: '#dc2626' })}
                  className="px-2 py-1 rounded text-[11px] font-medium bg-red-600 text-white"
                >
                  Red
                </button>
                <button
                  onClick={() => updateClip(textClip.id, { backgroundColor: '#facc15', color: '#000000' })}
                  className="px-2 py-1 rounded text-[11px] font-medium bg-yellow-400 text-black"
                >
                  Yellow
                </button>
              </div>
            </div>

            {/* Alignment & Animation */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-gray-400 block mb-1">Alignment</span>
                <div className="flex items-center bg-[#202230] rounded p-0.5 border border-[#32364a]">
                  <button
                    onClick={() => updateClip(textClip.id, { textAlign: 'left' })}
                    className={`flex-1 py-1 flex items-center justify-center rounded ${textClip.textAlign === 'left' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
                  >
                    <AlignLeft className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => updateClip(textClip.id, { textAlign: 'center' })}
                    className={`flex-1 py-1 flex items-center justify-center rounded ${textClip.textAlign === 'center' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
                  >
                    <AlignCenter className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => updateClip(textClip.id, { textAlign: 'right' })}
                    className={`flex-1 py-1 flex items-center justify-center rounded ${textClip.textAlign === 'right' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
                  >
                    <AlignRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 block mb-1">Animation</span>
                <select
                  value={textClip.animation || 'none'}
                  onChange={(e) => updateClip(textClip.id, { animation: e.target.value as any })}
                  className="w-full bg-[#202230] text-white px-2 py-1 rounded border border-[#32364a] text-xs"
                >
                  <option value="none">None</option>
                  <option value="fade">Fade In</option>
                  <option value="slide_up">Slide Up</option>
                  <option value="bounce">Bounce</option>
                  <option value="pop">Pop</option>
                  <option value="typewriter">Typewriter</option>
                  <option value="glow">Neon Glow</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Video Speed & Volume */}
        {(isVideo || isAudio) && (
          <div className="space-y-3 bg-[#171924] p-2.5 rounded-xl border border-[#262838]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
              Audio & Playback Speed
            </span>

            {/* Speed */}
            <div>
              <div className="flex justify-between text-[11px] text-gray-300 mb-1">
                <span className="flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-purple-400" /> Playback Speed
                </span>
                <span className="font-mono text-purple-400 font-bold">{selectedClip.speed || 1}x</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[0.5, 1, 1.5, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => updateClip(selectedClip.id, { speed: s })}
                    className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors ${
                      (selectedClip.speed || 1) === s
                        ? 'bg-purple-600 text-white'
                        : 'bg-[#202230] text-gray-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Volume */}
            <div>
              <div className="flex justify-between text-[11px] text-gray-300 mb-1">
                <span className="flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> Clip Volume
                </span>
                <span className="font-mono text-gray-400">{Math.round(((selectedClip as any).volume ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={(selectedClip as any).volume ?? 1}
                onChange={(e) => updateClip(selectedClip.id, { volume: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Transform: Scale, Rotation, Position X/Y, Opacity */}
        {(isVideo || isImage || isText || isSticker) && (
          <div className="space-y-3 bg-[#171924] p-2.5 rounded-xl border border-[#262838]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
              Transform & Position
            </span>

            {/* Scale */}
            <div>
              <div className="flex justify-between text-[11px] text-gray-300 mb-1">
                <span>Scale</span>
                <span className="font-mono text-gray-400">{Math.round(((selectedClip as any).transform?.scale ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.05"
                value={(selectedClip as any).transform?.scale ?? 1}
                onChange={(e) =>
                  updateClip(selectedClip.id, {
                    transform: {
                      ...(selectedClip as any).transform,
                      scale: parseFloat(e.target.value)
                    }
                  })
                }
                className="w-full"
              />
            </div>

            {/* Rotation */}
            <div>
              <div className="flex justify-between text-[11px] text-gray-300 mb-1">
                <span>Rotation</span>
                <span className="font-mono text-gray-400">{(selectedClip as any).transform?.rotation ?? 0}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={(selectedClip as any).transform?.rotation ?? 0}
                onChange={(e) =>
                  updateClip(selectedClip.id, {
                    transform: {
                      ...(selectedClip as any).transform,
                      rotation: parseInt(e.target.value)
                    }
                  })
                }
                className="w-full"
              />
            </div>

            {/* Position X / Y */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-gray-400 block mb-1">X Offset</span>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={(selectedClip as any).transform?.x ?? 0}
                  onChange={(e) =>
                    updateClip(selectedClip.id, {
                      transform: {
                        ...(selectedClip as any).transform,
                        x: parseInt(e.target.value)
                      }
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block mb-1">Y Offset</span>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={(selectedClip as any).transform?.y ?? 0}
                  onChange={(e) =>
                    updateClip(selectedClip.id, {
                      transform: {
                        ...(selectedClip as any).transform,
                        y: parseInt(e.target.value)
                      }
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>

            {/* Opacity */}
            <div>
              <div className="flex justify-between text-[11px] text-gray-300 mb-1">
                <span>Opacity</span>
                <span className="font-mono text-gray-400">{Math.round(((selectedClip as any).transform?.opacity ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={(selectedClip as any).transform?.opacity ?? 1}
                onChange={(e) =>
                  updateClip(selectedClip.id, {
                    transform: {
                      ...(selectedClip as any).transform,
                      opacity: parseFloat(e.target.value)
                    }
                  })
                }
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

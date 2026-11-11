import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { Smile, Sparkles, Plus } from 'lucide-react';
import { INSTAGRAM_STICKER_PRESETS, EMOJI_STICKER_PRESETS } from '../../services/sampleMediaService';
import { StickerClip } from '../../types/editor';

export const StickersPanel: React.FC = () => {
  const { project, addClip, currentTime } = useEditorStore();

  const handleAddSticker = (type: 'instagram_badge' | 'emoji', content: string) => {
    if (!project) return;
    const overlayTrack = project.tracks.find((t) => t.type === 'overlay') || project.tracks[0];

    const clip: StickerClip = {
      id: `sticker-${Date.now()}`,
      trackId: overlayTrack.id,
      name: type === 'emoji' ? `Emoji: ${content}` : content.slice(0, 14),
      type: 'sticker',
      stickerType: type,
      content,
      startTime: currentTime,
      duration: 3,
      sourceOffset: 0,
      animation: 'pulse',
      transform: {
        x: 0,
        y: type === 'emoji' ? 0 : 20,
        scale: type === 'emoji' ? 1.2 : 1,
        rotation: 0,
        opacity: 1
      }
    };

    addClip(clip);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 space-y-4">
      {/* Instagram Story & Reel Badges */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Instagram Badges
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {INSTAGRAM_STICKER_PRESETS.map((stk) => (
            <button
              key={stk.id}
              onClick={() => handleAddSticker('instagram_badge', stk.text)}
              className="p-2.5 rounded-xl bg-[#161722] border border-[#252838] hover:border-pink-500/50 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold text-white shadow ${stk.bg}`}>
                  {stk.text}
                </span>
              </div>
              <span className="text-[10px] text-pink-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                + Add
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Emoji Reactions */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Smile className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Emojis
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {EMOJI_STICKER_PRESETS.map((emoji, idx) => (
            <button
              key={idx}
              onClick={() => handleAddSticker('emoji', emoji)}
              className="h-12 rounded-xl bg-[#181a24] hover:bg-[#252838] border border-[#27293a] hover:border-purple-500 flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all"
              title={`Add ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

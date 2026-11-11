import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { Subtitles, Sparkles, Plus, Wand2, Check } from 'lucide-react';
import { TextClip } from '../../types/editor';

const SAMPLE_CAPTION_SCRIPTS = [
  {
    theme: 'Viral Story / Motivational',
    captions: [
      { text: "Here's the secret nobody tells you...", start: 0, duration: 2.2 },
      { text: "Small habits done every day...", start: 2.2, duration: 2.0 },
      { text: "Lead to massive breakthroughs! 🚀", start: 4.2, duration: 2.5 }
    ]
  },
  {
    theme: 'Travel / Aesthetic Vlog',
    captions: [
      { text: "Chasing golden sunsets 🌅", start: 0, duration: 2.5 },
      { text: "Finding peace in the little moments ✨", start: 2.5, duration: 2.5 },
      { text: "Where should we explore next?", start: 5.0, duration: 2.5 }
    ]
  },
  {
    theme: 'Fitness / Energy',
    captions: [
      { text: "DAY 1 OR ONE DAY? 🔥", start: 0, duration: 1.8 },
      { text: "PUSH THROUGH THE LIMITS 💪", start: 1.8, duration: 2.2 },
      { text: "YOU GOT THIS! LET'S GO ⚡", start: 4.0, duration: 2.5 }
    ]
  }
];

export const CaptionsPanel: React.FC = () => {
  const { project, addClip, currentTime } = useEditorStore();
  const [manualText, setManualText] = useState('');
  const [stylePreset, setStylePreset] = useState<'yellow_bold' | 'clean_white' | 'karaoke_neon'>('yellow_bold');

  const handleApplyScript = (captions: { text: string; start: number; duration: number }[]) => {
    if (!project) return;
    const textTrack = project.tracks.find((t) => t.type === 'text') || project.tracks[0];

    captions.forEach((c, idx) => {
      const clip: TextClip = {
        id: `caption-${Date.now()}-${idx}`,
        trackId: textTrack.id,
        name: `Cap: ${c.text.slice(0, 12)}`,
        type: 'text',
        startTime: c.start,
        duration: c.duration,
        sourceOffset: 0,
        text: c.text,
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: stylePreset === 'yellow_bold' ? 38 : 34,
        fontWeight: '800',
        color: stylePreset === 'yellow_bold' ? '#facc15' : stylePreset === 'karaoke_neon' ? '#38bdf8' : '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        textAlign: 'center',
        animation: 'pop',
        transform: {
          x: 0,
          y: 28, // lower third positioning
          scale: 1,
          rotation: 0,
          opacity: 1
        }
      };
      addClip(clip);
    });
  };

  const handleAddManualCaption = () => {
    if (!manualText.trim() || !project) return;
    const textTrack = project.tracks.find((t) => t.type === 'text') || project.tracks[0];

    const clip: TextClip = {
      id: `caption-${Date.now()}`,
      trackId: textTrack.id,
      name: `Cap: ${manualText.slice(0, 12)}`,
      type: 'text',
      startTime: currentTime,
      duration: 2.5,
      sourceOffset: 0,
      text: manualText.trim(),
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: 36,
      fontWeight: '800',
      color: stylePreset === 'yellow_bold' ? '#facc15' : '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      textAlign: 'center',
      animation: 'slide_up',
      transform: {
        x: 0,
        y: 28,
        scale: 1,
        rotation: 0,
        opacity: 1
      }
    };

    addClip(clip);
    setManualText('');
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 space-y-4">
      {/* Style selector */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
          Caption Visual Style
        </span>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setStylePreset('yellow_bold')}
            className={`p-2 rounded-lg text-center border text-xs font-bold transition-all ${
              stylePreset === 'yellow_bold'
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500'
                : 'bg-[#181922] text-gray-400 border-[#2b2d3a] hover:bg-[#20222f]'
            }`}
          >
            Reel Gold
          </button>
          <button
            onClick={() => setStylePreset('clean_white')}
            className={`p-2 rounded-lg text-center border text-xs font-bold transition-all ${
              stylePreset === 'clean_white'
                ? 'bg-white/20 text-white border-white'
                : 'bg-[#181922] text-gray-400 border-[#2b2d3a] hover:bg-[#20222f]'
            }`}
          >
            Clean White
          </button>
          <button
            onClick={() => setStylePreset('karaoke_neon')}
            className={`p-2 rounded-lg text-center border text-xs font-bold transition-all ${
              stylePreset === 'karaoke_neon'
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500'
                : 'bg-[#181922] text-gray-400 border-[#2b2d3a] hover:bg-[#20222f]'
            }`}
          >
            Neon Glow
          </button>
        </div>
      </div>

      {/* Manual Caption Adder */}
      <div className="bg-[#161720] p-3 rounded-xl border border-[#262838] space-y-2">
        <span className="text-xs font-semibold text-gray-300">Add Caption at Playhead</span>
        <textarea
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          placeholder="Type spoken sentence or caption..."
          rows={2}
          className="w-full bg-[#1e202c] text-white text-xs p-2 rounded-lg border border-[#303346] focus:border-purple-500 focus:outline-none resize-none"
        />
        <button
          onClick={handleAddManualCaption}
          disabled={!manualText.trim()}
          className="w-full py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Insert Caption at Current Time</span>
        </button>
      </div>

      {/* Smart Auto-Caption Script Packs */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Wand2 className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Auto-Timed Caption Packs
          </span>
        </div>

        <div className="space-y-2.5">
          {SAMPLE_CAPTION_SCRIPTS.map((pack, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#161722] border border-[#262838] hover:border-purple-500/50 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-200">{pack.theme}</span>
                <button
                  onClick={() => handleApplyScript(pack.captions)}
                  className="px-2.5 py-1 rounded-md bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Apply ({pack.captions.length})</span>
                </button>
              </div>

              <div className="space-y-1">
                {pack.captions.map((c, cIdx) => (
                  <div key={cIdx} className="text-[11px] text-gray-400 bg-black/40 px-2 py-1 rounded flex justify-between">
                    <span className="truncate pr-2">"{c.text}"</span>
                    <span className="font-mono text-[10px] text-gray-400 shrink-0">{c.start}s - {c.start + c.duration}s</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

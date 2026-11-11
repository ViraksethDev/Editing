import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { Type, Sparkles, Plus, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { TextClip } from '../../types/editor';

interface TextTemplate {
  name: string;
  preview: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle?: 'normal' | 'italic';
  color: string;
  backgroundColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  animation: TextClip['animation'];
  textAlign: 'left' | 'center' | 'right';
}

const TEMPLATES: TextTemplate[] = [
  {
    name: 'Viral Reels Hook',
    preview: 'STOP SCROLLING ⚠️',
    fontFamily: 'Bebas Neue, sans-serif',
    fontSize: 54,
    fontWeight: '800',
    color: '#ffffff',
    backgroundColor: '#dc2626',
    animation: 'bounce',
    textAlign: 'center'
  },
  {
    name: 'Neon Cyber Glow',
    preview: 'CYBER VIBES',
    fontFamily: 'Space Grotesk, sans-serif',
    fontSize: 48,
    fontWeight: '700',
    color: '#38bdf8',
    strokeColor: '#0284c7',
    strokeWidth: 2,
    animation: 'glow',
    textAlign: 'center'
  },
  {
    name: 'Aesthetic Editorial',
    preview: 'Golden hour moments.',
    fontFamily: 'Playfair Display, serif',
    fontSize: 42,
    fontWeight: '600',
    fontStyle: 'italic',
    color: '#fef08a',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    animation: 'fade',
    textAlign: 'center'
  },
  {
    name: 'Instagram Clean Pill',
    preview: 'Wait for the end...',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    fontSize: 34,
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: 'rgba(15, 15, 20, 0.85)',
    animation: 'slide_up',
    textAlign: 'center'
  },
  {
    name: 'Handwritten Casual',
    preview: 'a day in my life ✨',
    fontFamily: 'Caveat, cursive',
    fontSize: 52,
    fontWeight: '700',
    color: '#f43f5e',
    animation: 'pop',
    textAlign: 'center'
  },
  {
    name: 'Typewriter Subtitle',
    preview: 'Typing caption out loud...',
    fontFamily: 'Space Grotesk, monospace',
    fontSize: 32,
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#000000',
    animation: 'typewriter',
    textAlign: 'center'
  }
];

export const TextEditor: React.FC = () => {
  const { project, addClip, currentTime } = useEditorStore();

  const handleAddText = (template: Partial<TextTemplate>) => {
    if (!project) return;

    const textTrack = project.tracks.find((t) => t.type === 'text') || project.tracks[0];
    const clip: TextClip = {
      id: `text-${Date.now()}`,
      trackId: textTrack.id,
      name: template.preview?.slice(0, 16) || 'Text Overlay',
      type: 'text',
      startTime: currentTime,
      duration: 3.5,
      sourceOffset: 0,
      text: template.preview || 'Your Text Here',
      fontFamily: template.fontFamily || 'Plus Jakarta Sans, sans-serif',
      fontSize: template.fontSize || 42,
      fontWeight: template.fontWeight || '700',
      fontStyle: template.fontStyle || 'normal',
      color: template.color || '#ffffff',
      backgroundColor: template.backgroundColor || 'transparent',
      strokeColor: template.strokeColor,
      strokeWidth: template.strokeWidth,
      textAlign: template.textAlign || 'center',
      animation: template.animation || 'none',
      transform: {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        opacity: 1
      }
    };

    addClip(clip);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 space-y-4">
      {/* Quick Add Buttons */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Add Text</span>
        
        <button
          onClick={() => handleAddText({ preview: 'ADD A HEADING', fontSize: 52, fontWeight: '800' })}
          className="w-full py-2.5 px-3 rounded-xl bg-[#1c1e29] hover:bg-purple-600/30 border border-[#2b2e3e] hover:border-purple-500 text-left transition-all flex items-center justify-between group"
        >
          <span className="text-base font-extrabold text-white">Add a heading</span>
          <Plus className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
        </button>

        <button
          onClick={() => handleAddText({ preview: 'Add a subtitle', fontSize: 36, fontWeight: '600' })}
          className="w-full py-2 px-3 rounded-xl bg-[#1c1e29] hover:bg-purple-600/30 border border-[#2b2e3e] hover:border-purple-500 text-left transition-all flex items-center justify-between group"
        >
          <span className="text-sm font-semibold text-gray-200">Add a subtitle</span>
          <Plus className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
        </button>

        <button
          onClick={() => handleAddText({ preview: 'Add some body text here', fontSize: 26, fontWeight: '400' })}
          className="w-full py-1.5 px-3 rounded-xl bg-[#1c1e29] hover:bg-purple-600/30 border border-[#2b2e3e] hover:border-purple-500 text-left transition-all flex items-center justify-between group"
        >
          <span className="text-xs text-gray-300">Add body text</span>
          <Plus className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
        </button>
      </div>

      {/* Styled Presets */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Reels Text Styles
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {TEMPLATES.map((tmpl, i) => (
            <div
              key={i}
              onClick={() => handleAddText(tmpl)}
              className="p-3 rounded-xl bg-[#161722] border border-[#262838] hover:border-purple-500 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-gray-400">{tmpl.name}</span>
                <span className="text-[10px] text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                  + Add
                </span>
              </div>
              <div className="py-2 px-1 flex items-center justify-center min-h-[48px] bg-black/40 rounded-lg">
                <span
                  style={{
                    fontFamily: tmpl.fontFamily,
                    fontWeight: tmpl.fontWeight as any,
                    fontStyle: tmpl.fontStyle,
                    color: tmpl.color,
                    backgroundColor: tmpl.backgroundColor || 'transparent',
                    padding: tmpl.backgroundColor ? '4px 10px' : undefined,
                    borderRadius: tmpl.backgroundColor ? '6px' : undefined
                  }}
                  className="text-base text-center leading-tight truncate"
                >
                  {tmpl.preview}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

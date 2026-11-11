import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { GitCompareArrows, Sparkles, Check } from 'lucide-react';
import { TransitionType, VideoClip, ImageClip } from '../../types/editor';

interface TransitionItem {
  id: TransitionType;
  name: string;
  description: string;
  icon: string;
}

const TRANSITIONS: TransitionItem[] = [
  { id: 'none', name: 'None (Cut)', description: 'Direct instantaneous cut', icon: '✂️' },
  { id: 'fade', name: 'Cross Dissolve', description: 'Smooth cinematic fade between scenes', icon: '✨' },
  { id: 'slide_left', name: 'Slide Left', description: 'Dynamic directional swipe to the left', icon: '⬅️' },
  { id: 'slide_right', name: 'Slide Right', description: 'Dynamic directional swipe to the right', icon: '➡️' },
  { id: 'zoom_in', name: 'Zoom Impact', description: 'Punchy camera push-in transition', icon: '🔍' },
  { id: 'wipe', name: 'Color Wipe', description: 'Stylized vertical graphic wipe', icon: '⚡' }
];

export const TransitionsPanel: React.FC = () => {
  const { project, selectedClipId, updateClip } = useEditorStore();

  const selectedClip = project?.clips.find((c) => c.id === selectedClipId);
  const isVisual = selectedClip && (selectedClip.type === 'video' || selectedClip.type === 'image');
  const clip = (isVisual ? selectedClip : project?.clips.find((c) => c.type === 'video')) as (VideoClip | ImageClip) | undefined;

  const currentTransition = clip?.transition?.type || 'none';

  const handleApplyTransition = (type: TransitionType) => {
    if (!clip) return;
    updateClip(clip.id, {
      transition: {
        type,
        duration: 0.5
      }
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 space-y-4">
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <GitCompareArrows className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Video Transitions
          </span>
        </div>
        <p className="text-[11px] text-gray-400">
          {clip ? `Applying to: ${clip.name}` : 'Select a video clip to add a transition'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {TRANSITIONS.map((tr) => {
          const isActive = currentTransition === tr.id;
          return (
            <button
              key={tr.id}
              onClick={() => handleApplyTransition(tr.id)}
              className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                isActive
                  ? 'bg-purple-600/15 border-purple-500 ring-1 ring-purple-500'
                  : 'bg-[#161722] border-[#252838] hover:border-purple-500/50 hover:bg-[#1a1c29]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl p-2 rounded-lg bg-[#212330] flex items-center justify-center">
                  {tr.icon}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-gray-200">{tr.name}</h4>
                  <p className="text-[10px] text-gray-400">{tr.description}</p>
                </div>
              </div>

              {isActive && (
                <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

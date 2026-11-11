import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { Track, TimelineClip } from '../../types/editor';
import { TimelineClipComponent } from './TimelineClip';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Volume2, 
  VolumeX, 
  Video, 
  Type, 
  Smile, 
  Music 
} from 'lucide-react';

interface TimelineTrackProps {
  track: Track;
  clips: TimelineClip[];
  zoom: number;
  timelineWidth: number;
}

export const TimelineTrackComponent: React.FC<TimelineTrackProps> = ({
  track,
  clips,
  zoom,
  timelineWidth
}) => {
  const {
    toggleTrackMute,
    toggleTrackLock,
    toggleTrackVisibility,
    selectedClipId,
    selectClip,
    setCurrentTime,
    isSnapEnabled,
    snapGridInterval
  } = useEditorStore();

  const handleTrackLaneClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only seek if clicking directly on the lane background, not on a clip
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('track-lane-bg')) {
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      let clickedTime = Math.max(0, offsetX / zoom);

      // Snap to grid on lane click if snap is enabled
      if (isSnapEnabled && snapGridInterval > 0) {
        const nearestGrid = Math.round(clickedTime / snapGridInterval) * snapGridInterval;
        const thresholdSec = Math.max(0.08, 10 / zoom);
        if (Math.abs(clickedTime - nearestGrid) < thresholdSec) {
          clickedTime = nearestGrid;
        }
      }

      setCurrentTime(clickedTime, true);
    }
  };

  const getTrackIcon = () => {
    switch (track.type) {
      case 'video':
        return <Video className="w-3.5 h-3.5 text-purple-400" />;
      case 'overlay':
        return <Smile className="w-3.5 h-3.5 text-pink-400" />;
      case 'text':
        return <Type className="w-3.5 h-3.5 text-amber-400" />;
      case 'audio':
        return <Music className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <Video className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  return (
    <div className={`flex h-12 border-b border-[#222432] group select-none ${!track.isVisible ? 'opacity-40' : ''}`}>
      {/* Track Header (Sticky Left so it stays pinned during horizontal scrolling) */}
      <div className="w-44 bg-[#14151e] border-r border-[#262838] px-2.5 flex items-center justify-between shrink-0 sticky left-0 z-20 shadow-md">
        <div className="flex items-center gap-2 overflow-hidden">
          {getTrackIcon()}
          <span className="text-xs font-semibold text-gray-300 truncate">
            {track.name}
          </span>
        </div>

        {/* Track controls */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {/* Visibility Toggle */}
          <button
            onClick={() => toggleTrackVisibility(track.id)}
            className={`p-1 rounded hover:bg-[#222432] transition-colors ${
              !track.isVisible ? 'text-red-400' : 'text-gray-400 hover:text-white'
            }`}
            title={track.isVisible ? 'Hide track' : 'Show track'}
          >
            {track.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>

          {/* Mute Toggle (for audio and video tracks) */}
          {(track.type === 'video' || track.type === 'audio') && (
            <button
              onClick={() => toggleTrackMute(track.id)}
              className={`p-1 rounded hover:bg-[#222432] transition-colors ${
                track.isMuted ? 'text-red-400' : 'text-gray-400 hover:text-white'
              }`}
              title={track.isMuted ? 'Unmute track' : 'Mute track'}
            >
              {track.isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </button>
          )}

          {/* Lock Toggle */}
          <button
            onClick={() => toggleTrackLock(track.id)}
            className={`p-1 rounded hover:bg-[#222432] transition-colors ${
              track.isLocked ? 'text-amber-400' : 'text-gray-400 hover:text-white'
            }`}
            title={track.isLocked ? 'Unlock track' : 'Lock track'}
          >
            {track.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Track Lane (Horizontally scrollable lane area) */}
      <div
        onMouseDown={handleTrackLaneClick}
        style={{ width: `${timelineWidth}px` }}
        className="relative bg-[#0f1017] h-full shrink-0 cursor-pointer overflow-hidden track-lane-bg"
      >
        {/* Subtle grid interval stripes aligned with zoom */}
        <div 
          style={{ backgroundSize: `${zoom}px 100%` }}
          className="absolute inset-0 bg-[linear-gradient(to_right,#1b1d28_1px,transparent_1px)] opacity-25 pointer-events-none" 
        />

        {/* Track Clips */}
        {clips.map((clip) => (
          <TimelineClipComponent
            key={clip.id}
            clip={clip}
            zoom={zoom}
            isSelected={selectedClipId === clip.id}
            onSelect={selectClip}
          />
        ))}
      </div>
    </div>
  );
};

// Also export as TimelineTrack for backwards compatibility
export const TimelineTrack = TimelineTrackComponent;
export default TimelineTrackComponent;

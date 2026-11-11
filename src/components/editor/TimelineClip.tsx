import React, { useRef, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { TimelineClip } from '../../types/editor';
import { Video, Image as ImageIcon, Type, Music, Smile } from 'lucide-react';
import { calculateSnap, calculateTrimSnap } from '../../utils/snapHelper';

interface TimelineClipProps {
  clip: TimelineClip;
  zoom: number; // pixels per second
  onSelect: (id: string) => void;
  isSelected: boolean;
}

export const TimelineClipComponent: React.FC<TimelineClipProps> = ({
  clip,
  zoom,
  onSelect,
  isSelected
}) => {
  const {
    moveClip,
    trimClip,
    project,
    currentTime,
    isSnapEnabled,
    snapGridInterval
  } = useEditorStore();

  const isDraggingRef = useRef(false);
  const isTrimmingLeftRef = useRef(false);
  const isTrimmingRightRef = useRef(false);
  const startXRef = useRef(0);
  const initialStartTimeRef = useRef(0);
  const initialDurationRef = useRef(0);
  const initialOffsetRef = useRef(0);

  const [isSnapping, setIsSnapping] = useState(false);

  const leftPx = clip.startTime * zoom;
  const widthPx = Math.max(18, clip.duration * zoom);

  // Styling based on clip type
  const getClipTypeStyles = () => {
    switch (clip.type) {
      case 'video':
        return 'bg-purple-900/60 border-purple-500/80 text-purple-200';
      case 'image':
        return 'bg-emerald-900/60 border-emerald-500/80 text-emerald-200';
      case 'text':
        return 'bg-amber-900/60 border-amber-500/80 text-amber-200';
      case 'audio':
        return 'bg-blue-900/60 border-blue-500/80 text-blue-200';
      case 'sticker':
        return 'bg-pink-900/60 border-pink-500/80 text-pink-200';
      default:
        return 'bg-gray-800 border-gray-600 text-gray-200';
    }
  };

  const getClipIcon = () => {
    switch (clip.type) {
      case 'video':
        return <Video className="w-3 h-3 shrink-0" />;
      case 'image':
        return <ImageIcon className="w-3 h-3 shrink-0" />;
      case 'text':
        return <Type className="w-3 h-3 shrink-0" />;
      case 'audio':
        return <Music className="w-3 h-3 shrink-0" />;
      case 'sticker':
        return <Smile className="w-3 h-3 shrink-0" />;
    }
  };

  // Dragging entire clip horizontally with snap-to-grid & snap-to-clips
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(clip.id);

    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    initialStartTimeRef.current = clip.startTime;

    const allClips = project?.clips || [];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = moveEvent.clientX - startXRef.current;
      const deltaTime = deltaX / zoom;
      const rawStart = Math.max(0, initialStartTimeRef.current + deltaTime);

      const snapResult = calculateSnap(
        rawStart,
        clip.duration,
        allClips,
        clip.id,
        currentTime,
        zoom,
        snapGridInterval,
        isSnapEnabled
      );

      setIsSnapping(snapResult.didSnap);
      moveClip(clip.id, snapResult.snappedTime);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      setIsSnapping(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Trimming Left Edge (adjusts startTime, duration, and sourceOffset with snap)
  const handleTrimLeftMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(clip.id);

    isTrimmingLeftRef.current = true;
    startXRef.current = e.clientX;
    initialStartTimeRef.current = clip.startTime;
    initialDurationRef.current = clip.duration;
    initialOffsetRef.current = clip.sourceOffset || 0;

    const allClips = project?.clips || [];
    const currentEnd = initialStartTimeRef.current + initialDurationRef.current;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isTrimmingLeftRef.current) return;
      const deltaX = moveEvent.clientX - startXRef.current;
      const deltaTime = deltaX / zoom;
      const rawStart = Math.max(0, initialStartTimeRef.current + deltaTime);

      const snapResult = calculateTrimSnap(
        rawStart,
        allClips,
        clip.id,
        currentTime,
        zoom,
        snapGridInterval,
        isSnapEnabled
      );

      setIsSnapping(snapResult.didSnap);
      const snappedStart = Math.min(currentEnd - 0.2, snapResult.snappedTime);
      const newDuration = Math.max(0.2, currentEnd - snappedStart);
      const effectiveDelta = snappedStart - initialStartTimeRef.current;
      const newOffset = Math.max(0, initialOffsetRef.current + effectiveDelta);

      if (newDuration >= 0.2) {
        trimClip(clip.id, snappedStart, newDuration, newOffset);
      }
    };

    const handleMouseUp = () => {
      isTrimmingLeftRef.current = false;
      setIsSnapping(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Trimming Right Edge (adjusts duration with snap)
  const handleTrimRightMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(clip.id);

    isTrimmingRightRef.current = true;
    startXRef.current = e.clientX;
    initialDurationRef.current = clip.duration;

    const allClips = project?.clips || [];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isTrimmingRightRef.current) return;
      const deltaX = moveEvent.clientX - startXRef.current;
      const deltaTime = deltaX / zoom;
      const rawDuration = Math.max(0.2, initialDurationRef.current + deltaTime);
      const rawEnd = clip.startTime + rawDuration;

      const snapResult = calculateTrimSnap(
        rawEnd,
        allClips,
        clip.id,
        currentTime,
        zoom,
        snapGridInterval,
        isSnapEnabled
      );

      setIsSnapping(snapResult.didSnap);
      const newDuration = Math.max(0.2, snapResult.snappedTime - clip.startTime);
      trimClip(clip.id, clip.startTime, newDuration, clip.sourceOffset);
    };

    const handleMouseUp = () => {
      isTrimmingRightRef.current = false;
      setIsSnapping(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(clip.id);
      }}
      onMouseDown={handleMouseDown}
      style={{
        left: `${leftPx}px`,
        width: `${widthPx}px`
      }}
      className={`absolute top-1 bottom-1 rounded-lg border flex items-center px-2 cursor-grab active:cursor-grabbing select-none overflow-hidden transition-shadow ${getClipTypeStyles()} ${
        isSelected
          ? 'ring-2 ring-white shadow-lg shadow-purple-500/30 z-10'
          : 'hover:brightness-110'
      } ${isSnapping ? 'outline-2 outline-cyan-400 outline-dashed' : ''}`}
    >
      {/* Left Trim Handle */}
      <div
        onMouseDown={handleTrimLeftMouseDown}
        className="absolute left-0 top-0 bottom-0 w-2.5 bg-white/20 hover:bg-white/60 cursor-ew-resize flex items-center justify-center rounded-l-md group"
        title="Trim Start (Snaps to grid & clips)"
      >
        <div className="w-0.5 h-3 bg-white/70 rounded-full" />
      </div>

      {/* Clip Content Label & Duration */}
      <div className="flex items-center gap-1.5 overflow-hidden mx-1.5 pointer-events-none">
        {getClipIcon()}
        <span className="text-[11px] font-semibold truncate leading-tight">
          {clip.name}
        </span>
        <span className="text-[9px] opacity-70 font-mono shrink-0 ml-auto hidden sm:inline">
          {clip.duration.toFixed(1)}s
        </span>
      </div>

      {/* Right Trim Handle */}
      <div
        onMouseDown={handleTrimRightMouseDown}
        className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/20 hover:bg-white/60 cursor-ew-resize flex items-center justify-center rounded-r-md group"
        title="Trim End (Snaps to grid & clips)"
      >
        <div className="w-0.5 h-3 bg-white/70 rounded-full" />
      </div>
    </div>
  );
};
export default TimelineClipComponent;

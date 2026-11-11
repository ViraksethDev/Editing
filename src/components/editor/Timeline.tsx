import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { TimelineTrackComponent } from './TimelineTrack';
import { 
  Scissors, 
  Trash2, 
  Copy, 
  ZoomIn, 
  ZoomOut, 
  Magnet, 
  ChevronsUpDown,
  Grid
} from 'lucide-react';
import { formatTimecode } from '../../utils/formatTime';

export const Timeline: React.FC = () => {
  const {
    project,
    currentTime,
    setCurrentTime,
    zoom,
    setZoom,
    selectedClipId,
    splitClip,
    deleteClip,
    duplicateClip,
    timelineHeight,
    setTimelineHeight,
    isSnapEnabled,
    toggleSnap,
    snapGridInterval,
    setSnapGridInterval
  } = useEditorStore();

  const isResizingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(230);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const duration = Math.max(10, project?.duration || 10);
  const timelineWidth = Math.max(1400, (duration + 6) * zoom);

  // Time ruler marker generation based on zoom & snap grid
  const renderRulerTicks = () => {
    const ticks = [];
    const totalSeconds = Math.ceil(duration + 6);
    const step = zoom < 40 ? 5 : zoom < 70 ? 2 : zoom < 120 ? 1 : 0.5;

    for (let sec = 0; sec <= totalSeconds; sec += step) {
      const left = sec * zoom;
      const isMajor = Math.floor(sec) === sec && (step >= 1 ? sec % step === 0 : sec % 1 === 0);

      ticks.push(
        <div
          key={sec}
          style={{ left: `${left}px` }}
          className="absolute top-0 bottom-0 flex flex-col justify-between pointer-events-none"
        >
          {isMajor ? (
            <span className="text-[9px] font-mono text-gray-400 pl-1 select-none">
              {formatTimecode(sec)}
            </span>
          ) : (
            <span className="h-2" />
          )}
          <div className={`w-px ${isMajor ? 'h-3 bg-gray-500' : 'h-1.5 bg-gray-700'}`} />
        </div>
      );
    }
    return ticks;
  };

  // Playhead scrubber interactions
  const handleRulerMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsScrubbing(true);

    const updateTimeFromMouse = (clientX: number) => {
      const rect = scrollContainerRef.current!.getBoundingClientRect();
      const scrollLeft = scrollContainerRef.current!.scrollLeft;
      const offsetX = clientX - rect.left - 176 + scrollLeft; // 176px is track header width
      let time = Math.max(0, Math.min(duration, offsetX / zoom));

      // Snap playhead to grid interval if snap is enabled
      if (isSnapEnabled && snapGridInterval > 0) {
        const nearestGrid = Math.round(time / snapGridInterval) * snapGridInterval;
        const thresholdSec = Math.max(0.08, 10 / zoom);
        if (Math.abs(time - nearestGrid) < thresholdSec) {
          time = nearestGrid;
        }
      }

      setCurrentTime(time, true);
    };

    updateTimeFromMouse(e.clientX);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      updateTimeFromMouse(moveEvent.clientX);
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Auto-scroll timeline to keep playhead in view during playback
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const playheadPx = 176 + currentTime * zoom;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const clientWidth = container.clientWidth;

    if (playheadPx > scrollLeft + clientWidth - 60) {
      container.scrollLeft = playheadPx - clientWidth + 120;
    } else if (playheadPx < scrollLeft + 176) {
      container.scrollLeft = Math.max(0, playheadPx - 200);
    }
  }, [currentTime, zoom]);

  // Support horizontal wheel scrolling when hovering the timeline
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current && (e.shiftKey || Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) > 0)) {
      // If user scrolls vertically without shift, allow horizontal scroll if at top/bottom bounds
      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      scrollContainerRef.current.scrollLeft += delta;
    }
  };

  // Resize timeline height by dragging top handle
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = timelineHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const deltaY = startYRef.current - moveEvent.clientY;
      const newHeight = Math.max(140, Math.min(480, startHeightRef.current + deltaY));
      setTimelineHeight(newHeight);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleCycleHeight = () => {
    if (timelineHeight < 200) {
      setTimelineHeight(240);
    } else if (timelineHeight < 300) {
      setTimelineHeight(360);
    } else {
      setTimelineHeight(160);
    }
  };

  const playheadPositionPx = 176 + currentTime * zoom;

  return (
    <div
      style={{ height: `${timelineHeight}px` }}
      onWheel={handleWheel}
      className="bg-[#111219] border-t border-[#252732] flex flex-col select-none relative z-20 shrink-0 transition-[height] duration-75"
    >
      {/* Top Resize Drag Handle */}
      <div
        onMouseDown={handleResizeMouseDown}
        className="h-1.5 w-full cursor-ns-resize bg-transparent hover:bg-purple-500/40 active:bg-purple-500 transition-colors absolute -top-1 inset-x-0 z-30 flex items-center justify-center group"
        title="Drag up or down to resize timeline"
      >
        <div className="w-8 h-1 rounded-full bg-gray-600/40 group-hover:bg-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Timeline Control Bar */}
      <div className="h-9 bg-[#151720] border-b border-[#252732] px-3 flex items-center justify-between text-xs">
        {/* Left Actions: Split, Duplicate, Delete */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => selectedClipId && splitClip(selectedClipId, currentTime)}
            disabled={!selectedClipId}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
              selectedClipId
                ? 'bg-[#222432] hover:bg-purple-600 text-gray-200 hover:text-white cursor-pointer'
                : 'text-gray-600 cursor-not-allowed'
            }`}
            title="Split Clip at Playhead (S)"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Split</span>
          </button>

          <button
            onClick={() => selectedClipId && duplicateClip(selectedClipId)}
            disabled={!selectedClipId}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
              selectedClipId
                ? 'bg-[#222432] hover:bg-purple-600 text-gray-200 hover:text-white cursor-pointer'
                : 'text-gray-600 cursor-not-allowed'
            }`}
            title="Duplicate Clip (Ctrl+D)"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>

          <button
            onClick={() => selectedClipId && deleteClip(selectedClipId)}
            disabled={!selectedClipId}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
              selectedClipId
                ? 'bg-[#222432] hover:bg-red-600 text-gray-200 hover:text-white cursor-pointer'
                : 'text-gray-600 cursor-not-allowed'
            }`}
            title="Delete Selected Clip (Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>

          <div className="h-3.5 w-px bg-[#2c2f3e] mx-1" />

          {/* Snap-to-Grid / Magnet Toggle */}
          <button
            onClick={toggleSnap}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              isSnapEnabled
                ? 'bg-purple-600/25 text-purple-300 border border-purple-500/40'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#20222f]'
            }`}
            title={`Snap to Grid & Clip Edges (${isSnapEnabled ? 'Enabled' : 'Disabled'})`}
          >
            <Magnet className={`w-3.5 h-3.5 ${isSnapEnabled ? 'text-purple-400' : 'text-gray-500'}`} />
            <span className="hidden md:inline">Snap</span>
          </button>

          {/* Snap Grid Interval Dropdown / Selector */}
          {isSnapEnabled && (
            <select
              value={snapGridInterval}
              onChange={(e) => setSnapGridInterval(parseFloat(e.target.value))}
              className="bg-[#1c1e2a] border border-[#2b2e40] text-[11px] text-gray-300 rounded px-1.5 py-0.5 outline-none cursor-pointer hover:border-purple-500/50"
              title="Snap Grid Resolution"
            >
              <option value="0.25">0.25s</option>
              <option value="0.5">0.5s</option>
              <option value="1">1.0s</option>
              <option value="0.0333">Frame (1/30s)</option>
            </select>
          )}
        </div>

        {/* Right Actions: Zoom & Height Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(20, zoom - 15))}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#20222f] transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <input
            type="range"
            min="20"
            max="180"
            value={zoom}
            onChange={(e) => setZoom(parseInt(e.target.value))}
            className="w-20 h-1 bg-gray-700 rounded-lg cursor-pointer"
            title="Timeline Zoom Level"
          />

          <button
            onClick={() => setZoom(Math.min(180, zoom + 15))}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#20222f] transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-px bg-[#2c2f3e] mx-1" />

          {/* Quick Height Cycle Button */}
          <button
            onClick={handleCycleHeight}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#20222f] transition-colors cursor-pointer"
            title={`Timeline height: ${timelineHeight}px (Click to cycle)`}
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tracks & Ruler Scroll Area (Ensures horizontal and vertical scrolling) */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-auto relative bg-[#0b0c11] scroll-smooth"
      >
        {/* Playhead Vertical Line */}
        <div
          style={{ left: `${playheadPositionPx}px` }}
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none shadow-[0_0_8px_rgba(239,68,68,0.8)]"
        >
          {/* Playhead Top Scrub Marker */}
          <div className="w-3.5 h-3.5 bg-red-500 -ml-1.5 rounded-sm transform rotate-45 shadow flex items-center justify-center cursor-ew-resize" />
        </div>

        {/* Top Time Ruler */}
        <div
          onMouseDown={handleRulerMouseDown}
          className="flex h-7 bg-[#14151e] border-b border-[#242636] sticky top-0 z-20 cursor-pointer select-none"
        >
          {/* Ruler Left Blank space (above track headers - sticky left) */}
          <div className="w-44 bg-[#12131b] border-r border-[#262838] px-2 flex items-center shrink-0 sticky left-0 z-30 shadow-md">
            <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">
              Timeline Tracks
            </span>
          </div>

          {/* Time markings area */}
          <div
            style={{ width: `${timelineWidth}px` }}
            className="relative h-full shrink-0"
          >
            {renderRulerTicks()}
          </div>
        </div>

        {/* Tracks List rendered based on editorStore project.tracks state */}
        <div className="flex flex-col">
          {project?.tracks.map((track) => {
            const trackClips = project.clips.filter((c) => c.trackId === track.id);
            return (
              <TimelineTrackComponent
                key={track.id}
                track={track}
                clips={trackClips}
                zoom={zoom}
                timelineWidth={timelineWidth}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Timeline;

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '../../store/editorStore';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize2,
  Volume2,
  VolumeX,
  ShieldAlert,
  Grid3X3,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Video
} from 'lucide-react';
import { formatTimecode } from '../../utils/formatTime';
import { renderProceduralScene } from '../../services/sampleMediaService';

export const VideoPreview = () => {
  const {
    project,
    currentTime,
    setCurrentTime,
    isPlaying,
    togglePlay,
    setIsPlaying,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    selectedClipId,
    selectClip,
    setActiveTab,
    setIsDrawerOpen
  } = useEditorStore();

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const proceduralCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [showSafeZones, setShowSafeZones] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [activeMediaUrl, setActiveMediaUrl] = useState('');

  // 1. Identify active video clip at the current playhead position
  const videoClips = project?.clips.filter((c) => c.type === 'video') || [];
  const activeClip = videoClips.find(
    (c) => currentTime >= c.startTime && currentTime < c.startTime + c.duration
  ) || null;

  // Active text overlays at the current time
  const activeTextClips = project?.clips.filter(
    (c) => c.type === 'text' && currentTime >= c.startTime && currentTime < c.startTime + c.duration
  ) || [];

  // Active sticker overlays at the current time
  const activeStickerClips = project?.clips.filter(
    (c) => c.type === 'sticker' && currentTime >= c.startTime && currentTime < c.startTime + c.duration
  ) || [];

  // 2. Handle procedural media rendering onto canvas capture stream for HTML5 <video>
  const setupProceduralStream = useCallback((type) => {
    if (!proceduralCanvasRef.current || !videoRef.current) return;
    const canvas = proceduralCanvasRef.current;
    canvas.width = 720;
    canvas.height = project?.aspectRatio === '16:9' ? 405 : project?.aspectRatio === '1:1' ? 720 : 1280;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let procType = 'sunset';
    const lower = (type || '').toLowerCase();
    if (lower.includes('cyber')) procType = 'cyber';
    else if (lower.includes('coffee')) procType = 'coffee';
    else if (lower.includes('fitness') || lower.includes('pulse')) procType = 'fitness';
    else if (lower.includes('forest') || lower.includes('nature')) procType = 'nature';

    // Start 30 FPS canvas animation loop
    let lastRenderTime = performance.now();
    const renderLoop = (time) => {
      const elapsedSec = (time - lastRenderTime) / 1000;
      const storeTime = useEditorStore.getState().currentTime;
      renderProceduralScene(ctx, procType, canvas.width, canvas.height, storeTime);
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(renderLoop);

    try {
      if (!canvas.__streamAssigned) {
        const stream = canvas.captureStream(30);
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
        canvas.__streamAssigned = true;
      }
      setIsVideoLoaded(true);
    } catch (err) {
      console.warn('Canvas captureStream not supported in this browser context:', err);
    }
  }, [project?.aspectRatio]);

  // 3. Connect HTML5 <video> src to current project state and active clip
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!activeClip) {
      if (video.srcObject) {
        video.srcObject = null;
      }
      if (video.src) {
        video.src = '';
      }
      setActiveMediaUrl('');
      setIsVideoLoaded(false);
      return;
    }

    const isProcedural = activeClip.mediaUrl.startsWith('procedural:') ||
      activeClip.name.toLowerCase().includes('sunset') ||
      activeClip.name.toLowerCase().includes('cyber') ||
      activeClip.name.toLowerCase().includes('coffee') ||
      activeClip.name.toLowerCase().includes('pulse') ||
      activeClip.name.toLowerCase().includes('nature');

    if (isProcedural) {
      const procType = activeClip.mediaUrl.startsWith('procedural:')
        ? activeClip.mediaUrl.replace('procedural:', '')
        : activeClip.name;
      
      if (activeMediaUrl !== `proc:${procType}`) {
        setActiveMediaUrl(`proc:${procType}`);
        setupProceduralStream(procType);
      }
    } else {
      // Standard video file (upload or blob)
      if (activeMediaUrl !== activeClip.mediaUrl) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        if (proceduralCanvasRef.current) {
          proceduralCanvasRef.current.__streamAssigned = false;
        }
        video.srcObject = null;
        video.src = activeClip.mediaUrl;
        setActiveMediaUrl(activeClip.mediaUrl);
        setIsVideoLoaded(false);
        video.load();
      }
    }

    // Set playback rate & volume
    video.playbackRate = activeClip.speed || 1;
    video.volume = isMuted ? 0 : Math.max(0, Math.min(1, volume * (activeClip.volume ?? 1)));
  }, [activeClip?.id, activeClip?.mediaUrl, activeClip?.speed, activeClip?.volume, volume, isMuted, setupProceduralStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // 4. Synchronize HTML5 <video> play/pause with editor store `isPlaying`
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Auto-play policy or seek race condition
          if (err.name !== 'AbortError') {
            console.warn('Video play interrupted:', err);
          }
        });
      }
    } else {
      if (!video.paused) {
        video.pause();
      }
    }
  }, [isPlaying]);

  // 5. Playhead synchronization loop:
  // When isPlaying is true, advance store's currentTime with each frame
  useEffect(() => {
    if (!isPlaying) return;

    let lastTick = performance.now();
    let tickFrameId;

    const tick = (now) => {
      const delta = Math.min(0.1, (now - lastTick) / 1000);
      lastTick = now;

      const store = useEditorStore.getState();
      const totalDuration = store.project?.duration || 10;
      const nextTime = store.currentTime + delta;

      if (nextTime >= totalDuration) {
        store.setCurrentTime(0, true);
        store.setIsPlaying(false);
      } else {
        // false flag avoids tearing down audio nodes on 60fps ticks
        store.setCurrentTime(nextTime, false);
      }

      tickFrameId = requestAnimationFrame(tick);
    };

    tickFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(tickFrameId);
  }, [isPlaying]);

  // 6. When the user seeks or scrubs the timeline, seek the HTML5 video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeClip) return;

    // For procedural stream, seeking is handled by procedural canvas time
    if (activeClip.mediaUrl.startsWith('procedural:')) return;

    const clipLocalTime = Math.max(0, (currentTime - activeClip.startTime) * (activeClip.speed || 1));
    const targetOffset = (activeClip.sourceOffset || 0) + clipLocalTime;

    if (video.readyState >= 2 && Math.abs(video.currentTime - targetOffset) > 0.15) {
      video.currentTime = targetOffset;
    }
  }, [currentTime, activeClip]);

  // 7. Calculate CSS filter string for color adjustments & Instagram filter presets
  const getFilterStyle = (clip) => {
    if (!clip) return 'none';
    let filterStr = '';
    const adj = clip.adjustments;
    if (adj) {
      if (adj.brightness !== undefined) filterStr += `brightness(${adj.brightness}) `;
      if (adj.contrast !== undefined) filterStr += `contrast(${adj.contrast}) `;
      if (adj.saturation !== undefined) filterStr += `saturate(${adj.saturation}) `;
      if (adj.blur && adj.blur > 0) filterStr += `blur(${adj.blur}px) `;
    }

    const filter = clip.filter;
    if (filter === 'clarendon') filterStr += 'contrast(1.2) saturate(1.35) brightness(1.05) ';
    else if (filter === 'juno') filterStr += 'contrast(1.15) saturate(1.4) hue-rotate(-5deg) ';
    else if (filter === 'vintage') filterStr += 'sepia(0.35) contrast(0.9) brightness(1.1) ';
    else if (filter === 'noir') filterStr += 'grayscale(1) contrast(1.5) brightness(0.9) ';
    else if (filter === 'warm_sunset') filterStr += 'sepia(0.2) saturate(1.5) hue-rotate(-15deg) ';
    else if (filter === 'cyberpunk') filterStr += 'contrast(1.4) saturate(1.8) hue-rotate(40deg) ';
    else if (filter === 'vivid') filterStr += 'saturate(1.7) contrast(1.15) ';
    else if (filter === 'pastel') filterStr += 'brightness(1.15) saturate(0.85) contrast(0.9) ';
    else if (filter === 'retro90s') filterStr += 'contrast(1.1) saturate(1.2) sepia(0.15) ';

    return filterStr.trim() || 'none';
  };

  // Transform style for video clip
  const getTransformStyle = (clip) => {
    if (!clip?.transform) return {};
    const { x = 0, y = 0, scale = 1, rotation = 0, opacity = 1 } = clip.transform;
    return {
      transform: `translate(${x}%, ${y}%) rotate(${rotation}deg) scale(${scale})`,
      opacity: Math.max(0, Math.min(1, opacity)),
      transition: isPlaying ? 'none' : 'transform 0.1s ease-out'
    };
  };

  // Aspect ratio dimension styling
  const getAspectRatioClasses = () => {
    switch (project?.aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[calc(100vh-270px)]';
      case '16:9':
        return 'aspect-[16/9] max-h-[calc(100vh-270px)]';
      case '1:1':
        return 'aspect-square max-h-[calc(100vh-270px)]';
      case '4:5':
        return 'aspect-[4/5] max-h-[calc(100vh-270px)]';
      default:
        return 'aspect-[9/16] max-h-[calc(100vh-270px)]';
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-between bg-[#0e0f14] p-3 overflow-hidden relative select-none">
      {/* Hidden canvas used to feed procedural stream to HTML5 video if needed */}
      <canvas ref={proceduralCanvasRef} className="hidden" />

      {/* Top Preview Toolbar */}
      <div className="w-full flex items-center justify-between px-2 text-xs text-gray-400 z-10 mb-1">
        <div className="flex items-center gap-2">
          {/* Safe zone overlay toggle for Instagram Reels */}
          <button
            onClick={() => setShowSafeZones(!showSafeZones)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              showSafeZones
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1c25]'
            }`}
            title="Toggle Reels UI Safe Zones"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reels Safe Area</span>
          </button>

          {/* Grid lines toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-md transition-colors ${
              showGrid
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1c25]'
            }`}
            title="Toggle 3x3 Composition Grid"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>

          {/* Active clip badge */}
          {activeClip && (
            <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#171922] border border-[#262836] text-[11px] text-gray-300">
              <Video className="w-3 h-3 text-purple-400" />
              <span className="truncate max-w-[140px]">{activeClip.name}</span>
            </div>
          )}
        </div>

        {/* Center: Current timecode */}
        <div className="flex items-center gap-1.5 bg-[#171922] px-3 py-1 rounded-md border border-[#262836] font-mono text-xs text-gray-200">
          <span className="text-purple-400 font-bold">{formatTimecode(currentTime)}</span>
          <span className="text-gray-500">/</span>
          <span className="text-gray-400">{formatTimecode(project?.duration || 10)}</span>
        </div>

        {/* Right: Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                containerRef.current?.requestFullscreen();
              } else {
                document.exitFullscreen();
              }
            }}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1b1c26] rounded-md transition-colors"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div
        ref={containerRef}
        className="flex-1 w-full flex items-center justify-center relative overflow-hidden py-1"
      >
        <div
          className={`relative ${getAspectRatioClasses()} shadow-2xl rounded-xl overflow-hidden border border-[#2b2d3d] bg-black flex items-center justify-center group`}
          onClick={togglePlay}
        >
          {/* HTML5 <video> Element */}
          <video
            ref={videoRef}
            playsInline
            muted={isMuted}
            onLoadedData={() => setIsVideoLoaded(true)}
            onError={(e) => console.warn('HTML5 Video load notice:', e)}
            style={{
              filter: getFilterStyle(activeClip),
              ...getTransformStyle(activeClip)
            }}
            className="w-full h-full object-cover pointer-events-none"
          />

          {/* Empty State when no video is on current playhead */}
          {!activeClip && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#12131c] to-[#0a0a0f] pointer-events-auto">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3 shadow-lg">
                <Video className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-gray-200 mb-1">No Video at Playhead</h4>
              <p className="text-xs text-gray-400 max-w-[220px] mb-4">
                Add a video clip from the Media library or move the timeline playhead.
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('media');
                  setIsDrawerOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Open Media Library</span>
              </button>
            </div>
          )}

          {/* Text Overlays Layer */}
          {activeTextClips.map((textClip) => {
            const isSelected = textClip.id === selectedClipId;
            const tx = textClip.transform?.x || 0;
            const ty = textClip.transform?.y || 0;
            const scale = textClip.transform?.scale ?? 1;
            const rotation = textClip.transform?.rotation || 0;
            const opacity = textClip.transform?.opacity ?? 1;

            return (
              <div
                key={textClip.id}
                onClick={(e) => {
                  e.stopPropagation();
                  selectClip(textClip.id);
                }}
                style={{
                  transform: `translate(${tx}%, ${ty}%) rotate(${rotation}deg) scale(${scale})`,
                  opacity,
                  fontFamily: textClip.fontFamily || 'Plus Jakarta Sans, sans-serif',
                  fontSize: `${textClip.fontSize || 36}px`,
                  fontWeight: textClip.fontWeight || '700',
                  color: textClip.color || '#ffffff',
                  backgroundColor: textClip.backgroundColor || 'transparent',
                  textAlign: textClip.textAlign || 'center'
                }}
                className={`absolute px-3 py-1 rounded-md select-none transition-transform pointer-events-auto cursor-pointer ${
                  isSelected ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black' : ''
                }`}
              >
                {textClip.text}
              </div>
            );
          })}

          {/* Sticker Overlays Layer */}
          {activeStickerClips.map((stickerClip) => {
            const isSelected = stickerClip.id === selectedClipId;
            const tx = stickerClip.transform?.x || 0;
            const ty = stickerClip.transform?.y || 0;
            const scale = stickerClip.transform?.scale ?? 1;
            const rotation = stickerClip.transform?.rotation || 0;

            return (
              <div
                key={stickerClip.id}
                onClick={(e) => {
                  e.stopPropagation();
                  selectClip(stickerClip.id);
                }}
                style={{
                  transform: `translate(${tx}%, ${ty}%) rotate(${rotation}deg) scale(${scale})`
                }}
                className={`absolute select-none pointer-events-auto cursor-pointer transition-transform ${
                  isSelected ? 'ring-2 ring-pink-500 ring-offset-2 ring-offset-black rounded-full' : ''
                }`}
              >
                {stickerClip.stickerType === 'emoji' ? (
                  <span className="text-5xl">{stickerClip.content}</span>
                ) : (
                  <div className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white font-extrabold text-xs shadow-lg border border-white/30">
                    {stickerClip.content}
                  </div>
                )}
              </div>
            );
          })}

          {/* 3x3 Composition Grid */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/10">
              <div className="border-r border-b border-white/15" />
              <div className="border-r border-b border-white/15" />
              <div className="border-b border-white/15" />
              <div className="border-r border-b border-white/15" />
              <div className="border-r border-b border-white/15" />
              <div className="border-b border-white/15" />
              <div className="border-r border-b border-white/15" />
              <div className="border-r border-b border-white/15" />
              <div />
            </div>
          )}

          {/* Instagram Reels Safe Zone Overlay */}
          {showSafeZones && project?.aspectRatio === '9:16' && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Top header safe margin */}
              <div className="absolute top-0 inset-x-0 h-[10%] bg-purple-900/10 border-b border-purple-500/20 flex items-center justify-center">
                <span className="text-[10px] font-mono text-purple-300/60 uppercase tracking-wider">Top Reels Header Safe Margin</span>
              </div>
              {/* Right like/comment buttons margin */}
              <div className="absolute right-0 top-[10%] bottom-[20%] w-[15%] bg-purple-900/10 border-l border-purple-500/20 flex flex-col items-center justify-center gap-3">
                <div className="w-5 h-5 rounded-full border border-purple-400/30 flex items-center justify-center text-[9px] text-purple-300/70">❤️</div>
                <div className="w-5 h-5 rounded-full border border-purple-400/30 flex items-center justify-center text-[9px] text-purple-300/70">💬</div>
                <div className="w-5 h-5 rounded-full border border-purple-400/30 flex items-center justify-center text-[9px] text-purple-300/70">✈️</div>
              </div>
              {/* Bottom caption safe margin */}
              <div className="absolute bottom-0 inset-x-0 h-[20%] bg-purple-900/10 border-t border-purple-500/20 flex items-center justify-center">
                <span className="text-[10px] font-mono text-purple-300/60 uppercase tracking-wider">Reels Caption & Audio Title Area</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Playback Controls */}
      <div className="flex items-center gap-4 bg-[#14161f]/95 backdrop-blur-md px-4 py-2 rounded-full border border-[#282a3a] shadow-xl z-20 mt-1">
        {/* Step backward 1s */}
        <button
          onClick={() => setCurrentTime(Math.max(0, currentTime - 1), true)}
          className="p-1.5 text-gray-400 hover:text-white transition-colors"
          title="Back 1 Second (Shift+Left)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Frame step back */}
        <button
          onClick={() => setCurrentTime(Math.max(0, currentTime - 1 / 30), true)}
          className="p-1.5 text-gray-400 hover:text-white transition-colors"
          title="Previous Frame (Arrow Left)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Play / Pause main button tied to playhead */}
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-600 hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-pink-600/30 transition-all cursor-pointer"
          title="Play / Pause (Space)"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        {/* Frame step forward */}
        <button
          onClick={() => setCurrentTime(Math.min(project?.duration || 10, currentTime + 1 / 30), true)}
          className="p-1.5 text-gray-400 hover:text-white transition-colors"
          title="Next Frame (Arrow Right)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Step forward 1s */}
        <button
          onClick={() => setCurrentTime(Math.min(project?.duration || 10, currentTime + 1), true)}
          className="p-1.5 text-gray-400 hover:text-white transition-colors"
          title="Forward 1 Second (Shift+Right)"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-[#2d3042]" />

        {/* Volume & Mute */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleMute}
            className={`p-1.5 rounded-md transition-colors ${isMuted ? 'text-red-400' : 'text-gray-300 hover:text-white'}`}
            title="Mute / Unmute (M)"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 h-1 bg-gray-700 rounded-lg cursor-pointer"
            title="Master Preview Volume"
          />
        </div>
      </div>
    </div>
  );
};
export default VideoPreview;

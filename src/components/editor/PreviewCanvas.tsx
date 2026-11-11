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
  Sliders, 
  Grid3X3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatTimecode } from '../../utils/formatTime';
import { VideoClip, ImageClip, TextClip, StickerClip } from '../../types/editor';
import { renderProceduralScene } from '../../services/sampleMediaService';

export const PreviewCanvas: React.FC = () => {
  const {
    project,
    currentTime,
    setCurrentTime,
    isPlaying,
    togglePlay,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    selectedClipId,
    selectClip,
    updateClip
  } = useEditorStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoElementsCache = useRef<Map<string, HTMLVideoElement>>(new Map());
  const imageElementsCache = useRef<Map<string, HTMLImageElement>>(new Map());

  const [showSafeZones, setShowSafeZones] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [zoomScale, setZoomScale] = useState<'fit' | 0.5 | 0.75 | 1>('fit');
  const [isDraggingOverlay, setIsDraggingOverlay] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number; initialClipX: number; initialClipY: number } | null>(null);

  // Smooth, high-performance playback loop (does NOT reset on every frame)
  useEffect(() => {
    if (!isPlaying) {
      // Pause all cached videos when stopped
      videoElementsCache.current.forEach((vid) => {
        if (!vid.paused) vid.pause();
      });
      return;
    }

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      const store = useEditorStore.getState();
      const currentProject = store.project;
      if (currentProject && store.isPlaying) {
        const nextTime = store.currentTime + delta;
        if (nextTime >= currentProject.duration) {
          store.setCurrentTime(0, true);
        } else {
          // false flag prevents restarting audio on every single 16ms tick
          store.setCurrentTime(nextTime, false);
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  // Main canvas render pass
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !project) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed internal high resolution
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Clear background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Render active tracks in order (bottom to top: video -> overlay -> text)
    const visibleTracks = project.tracks.filter((t) => t.isVisible);

    for (const track of visibleTracks) {
      const activeClips = project.clips.filter(
        (c) => c.trackId === track.id && currentTime >= c.startTime && currentTime < c.startTime + c.duration
      );

      for (const clip of activeClips) {
        ctx.save();

        if (clip.type === 'video') {
          const vClip = clip as VideoClip;
          const clipLocalTime = Math.max(0, (currentTime - vClip.startTime) * (vClip.speed || 1));

          // Check if clip is a procedural generator
          const lowerName = (vClip.name || '').toLowerCase();
          const isProcedural = vClip.mediaUrl.startsWith('procedural:') ||
            lowerName.includes('sunset') ||
            lowerName.includes('cyber') ||
            lowerName.includes('coffee') ||
            lowerName.includes('pulse') ||
            lowerName.includes('fitness') ||
            lowerName.includes('forest') ||
            lowerName.includes('nature');

          if (isProcedural) {
            let procType = 'sunset';
            if (vClip.mediaUrl.startsWith('procedural:')) {
              procType = vClip.mediaUrl.replace('procedural:', '');
            } else if (lowerName.includes('cyber')) procType = 'cyber';
            else if (lowerName.includes('coffee')) procType = 'coffee';
            else if (lowerName.includes('fitness') || lowerName.includes('pulse')) procType = 'fitness';
            else if (lowerName.includes('forest') || lowerName.includes('nature')) procType = 'nature';

            drawProceduralVideo(ctx, procType, canvasWidth, canvasHeight, clipLocalTime, vClip.transform, vClip.adjustments, vClip.filter);
          } else {
            // Real uploaded or blob HTMLVideoElement
            let vid = videoElementsCache.current.get(vClip.mediaUrl);
            if (!vid) {
              vid = document.createElement('video');
              vid.crossOrigin = 'anonymous';
              vid.src = vClip.mediaUrl;
              vid.muted = true;
              vid.playsInline = true;
              vid.preload = 'auto';
              vid.load();
              videoElementsCache.current.set(vClip.mediaUrl, vid);
            }

            const targetTime = Math.max(0, (vClip.sourceOffset || 0) + clipLocalTime);

            if (isPlaying) {
              if (vid.paused) {
                vid.play().catch(() => {});
              }
            } else {
              if (!vid.paused) {
                vid.pause();
              }
            }

            if (Math.abs(vid.currentTime - targetTime) > 0.15) {
              vid.currentTime = targetTime;
            }

            if (vid.readyState >= 2) {
              drawMediaWithTransform(ctx, vid, canvasWidth, canvasHeight, vClip.transform, vClip.adjustments, vClip.filter);
            } else {
              drawVideoPlaceholder(ctx, vClip, canvasWidth, canvasHeight);
            }
          }
        } else if (clip.type === 'image') {
          const iClip = clip as ImageClip;
          let img = imageElementsCache.current.get(iClip.mediaUrl);
          if (!img) {
            img = new Image();
            img.src = iClip.mediaUrl;
            imageElementsCache.current.set(iClip.mediaUrl, img);
          }
          if (img.complete && img.naturalWidth > 0) {
            drawMediaWithTransform(ctx, img, canvasWidth, canvasHeight, iClip.transform, iClip.adjustments, iClip.filter);
          }
        } else if (clip.type === 'text') {
          const tClip = clip as TextClip;
          drawText(ctx, tClip, canvasWidth, canvasHeight, currentTime - tClip.startTime, clip.id === selectedClipId);
        } else if (clip.type === 'sticker') {
          const sClip = clip as StickerClip;
          drawSticker(ctx, sClip, canvasWidth, canvasHeight, currentTime - sClip.startTime, clip.id === selectedClipId);
        }

        ctx.restore();
      }
    }
  }, [project, currentTime, isPlaying, selectedClipId]);

  useEffect(() => {
    renderFrame();
  }, [renderFrame]);

  const drawVideoPlaceholder = (
    ctx: CanvasRenderingContext2D,
    vClip: VideoClip,
    canvasW: number,
    canvasH: number
  ) => {
    ctx.save();
    ctx.fillStyle = '#11131a';
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 24px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🎬 ${vClip.name}`, canvasW / 2, canvasH / 2 - 15);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '16px sans-serif';
    ctx.fillText('Loading Video...', canvasW / 2, canvasH / 2 + 20);
    ctx.restore();
  };

  const drawProceduralVideo = (
    ctx: CanvasRenderingContext2D,
    type: string,
    canvasW: number,
    canvasH: number,
    t: number,
    transform: any,
    adjustments: any,
    filter: string
  ) => {
    const cx = canvasW / 2 + ((transform?.x || 0) / 100) * canvasW;
    const cy = canvasH / 2 + ((transform?.y || 0) / 100) * canvasH;
    const scale = transform?.scale ?? 1;
    const rotation = ((transform?.rotation || 0) * Math.PI) / 180;
    const opacity = transform?.opacity ?? 1;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    let filterStr = '';
    if (adjustments) {
      if (adjustments.brightness !== undefined) filterStr += `brightness(${adjustments.brightness}) `;
      if (adjustments.contrast !== undefined) filterStr += `contrast(${adjustments.contrast}) `;
      if (adjustments.saturation !== undefined) filterStr += `saturate(${adjustments.saturation}) `;
      if (adjustments.blur && adjustments.blur > 0) filterStr += `blur(${adjustments.blur}px) `;
    }

    if (filter === 'clarendon') filterStr += 'contrast(1.2) saturate(1.35) brightness(1.05) ';
    else if (filter === 'juno') filterStr += 'contrast(1.15) saturate(1.4) hue-rotate(-5deg) ';
    else if (filter === 'vintage') filterStr += 'sepia(0.35) contrast(0.9) brightness(1.1) ';
    else if (filter === 'noir') filterStr += 'grayscale(1) contrast(1.5) brightness(0.9) ';
    else if (filter === 'warm_sunset') filterStr += 'sepia(0.2) saturate(1.5) hue-rotate(-15deg) ';
    else if (filter === 'cyberpunk') filterStr += 'contrast(1.4) saturate(1.8) hue-rotate(40deg) ';
    else if (filter === 'vivid') filterStr += 'saturate(1.7) contrast(1.15) ';
    else if (filter === 'pastel') filterStr += 'brightness(1.15) saturate(0.85) contrast(0.9) ';
    else if (filter === 'retro90s') filterStr += 'contrast(1.1) saturate(1.2) sepia(0.15) ';

    ctx.filter = filterStr.trim() || 'none';

    ctx.translate(-canvasW / 2, -canvasH / 2);
    renderProceduralScene(ctx, type, canvasW, canvasH, t);
    ctx.restore();
  };

  // Transform media on canvas
  const drawMediaWithTransform = (
    ctx: CanvasRenderingContext2D,
    media: HTMLVideoElement | HTMLImageElement,
    canvasW: number,
    canvasH: number,
    transform: any,
    adjustments: any,
    filter: string
  ) => {
    const cx = canvasW / 2 + ((transform?.x || 0) / 100) * canvasW;
    const cy = canvasH / 2 + ((transform?.y || 0) / 100) * canvasH;
    const scale = transform?.scale ?? 1;
    const rotation = ((transform?.rotation || 0) * Math.PI) / 180;
    const opacity = transform?.opacity ?? 1;

    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    let filterStr = '';
    if (adjustments) {
      if (adjustments.brightness !== undefined) filterStr += `brightness(${adjustments.brightness}) `;
      if (adjustments.contrast !== undefined) filterStr += `contrast(${adjustments.contrast}) `;
      if (adjustments.saturation !== undefined) filterStr += `saturate(${adjustments.saturation}) `;
      if (adjustments.blur && adjustments.blur > 0) filterStr += `blur(${adjustments.blur}px) `;
    }

    if (filter === 'clarendon') filterStr += 'contrast(1.2) saturate(1.35) brightness(1.05) ';
    else if (filter === 'juno') filterStr += 'contrast(1.15) saturate(1.4) hue-rotate(-5deg) ';
    else if (filter === 'vintage') filterStr += 'sepia(0.35) contrast(0.9) brightness(1.1) ';
    else if (filter === 'noir') filterStr += 'grayscale(1) contrast(1.5) brightness(0.9) ';
    else if (filter === 'warm_sunset') filterStr += 'sepia(0.2) saturate(1.5) hue-rotate(-15deg) ';
    else if (filter === 'cyberpunk') filterStr += 'contrast(1.4) saturate(1.8) hue-rotate(40deg) ';
    else if (filter === 'vivid') filterStr += 'saturate(1.7) contrast(1.15) ';
    else if (filter === 'pastel') filterStr += 'brightness(1.15) saturate(0.85) contrast(0.9) ';
    else if (filter === 'retro90s') filterStr += 'contrast(1.1) saturate(1.2) sepia(0.15) ';

    ctx.filter = filterStr.trim() || 'none';

    const mediaW = (media as HTMLVideoElement).videoWidth || (media as HTMLImageElement).naturalWidth || canvasW;
    const mediaH = (media as HTMLVideoElement).videoHeight || (media as HTMLImageElement).naturalHeight || canvasH;

    const ratio = Math.max(canvasW / mediaW, canvasH / mediaH);
    const drawW = mediaW * ratio;
    const drawH = mediaH * ratio;

    ctx.drawImage(media, -drawW / 2, -drawH / 2, drawW, drawH);
  };

  const drawText = (
    ctx: CanvasRenderingContext2D,
    clip: TextClip,
    canvasW: number,
    canvasH: number,
    elapsed: number,
    isSelected: boolean
  ) => {
    const cx = canvasW / 2 + ((clip.transform?.x || 0) / 100) * canvasW;
    const cy = canvasH / 2 + ((clip.transform?.y || 0) / 100) * canvasH;
    let scale = clip.transform?.scale ?? 1;
    const rotation = ((clip.transform?.rotation || 0) * Math.PI) / 180;
    let opacity = clip.transform?.opacity ?? 1;

    let offsetY = 0;
    let textToDisplay = clip.text;

    if (clip.animation === 'fade') {
      opacity *= Math.min(1, elapsed / 0.5);
    } else if (clip.animation === 'slide_up') {
      const p = Math.min(1, elapsed / 0.4);
      offsetY = (1 - p) * 40;
      opacity *= p;
    } else if (clip.animation === 'pop' || clip.animation === 'bounce') {
      const p = Math.min(1, elapsed / 0.35);
      scale *= (0.8 + 0.3 * Math.sin(p * Math.PI));
    } else if (clip.animation === 'typewriter') {
      const chars = Math.floor(elapsed * 16);
      textToDisplay = clip.text.slice(0, chars);
    }

    ctx.translate(cx, cy + offsetY);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

    const fontSize = clip.fontSize || 40;
    ctx.font = `${clip.fontStyle === 'italic' ? 'italic ' : ''}${clip.fontWeight || '700'} ${fontSize}px ${clip.fontFamily || 'sans-serif'}`;
    ctx.textAlign = clip.textAlign || 'center';
    ctx.textBaseline = 'middle';

    const metrics = ctx.measureText(textToDisplay);
    const w = metrics.width;
    const h = fontSize * 1.2;

    if (clip.backgroundColor && clip.backgroundColor !== 'transparent') {
      ctx.fillStyle = clip.backgroundColor;
      const rx = clip.textAlign === 'center' ? -w / 2 - 14 : clip.textAlign === 'right' ? -w - 14 : -14;
      ctx.beginPath();
      ctx.roundRect(rx, -h / 2 - 6, w + 28, h + 12, 8);
      ctx.fill();
    }

    if (clip.strokeColor && clip.strokeWidth) {
      ctx.strokeStyle = clip.strokeColor;
      ctx.lineWidth = clip.strokeWidth;
      ctx.strokeText(textToDisplay, 0, 0);
    }

    ctx.fillStyle = clip.color || '#ffffff';
    ctx.fillText(textToDisplay, 0, 0);

    // Selected bounding box indicator
    if (isSelected) {
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      const bx = clip.textAlign === 'center' ? -w / 2 - 18 : clip.textAlign === 'right' ? -w - 18 : -18;
      ctx.strokeRect(bx, -h / 2 - 10, w + 36, h + 20);
      ctx.setLineDash([]);
    }
  };

  const drawSticker = (
    ctx: CanvasRenderingContext2D,
    clip: StickerClip,
    canvasW: number,
    canvasH: number,
    elapsed: number,
    isSelected: boolean
  ) => {
    const cx = canvasW / 2 + ((clip.transform?.x || 0) / 100) * canvasW;
    const cy = canvasH / 2 + ((clip.transform?.y || 0) / 100) * canvasH;
    let scale = clip.transform?.scale ?? 1;
    const rotation = ((clip.transform?.rotation || 0) * Math.PI) / 180;
    const opacity = clip.transform?.opacity ?? 1;

    if (clip.animation === 'pulse') {
      scale *= 1 + Math.sin(elapsed * 6) * 0.08;
    }

    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

    if (clip.stickerType === 'emoji') {
      ctx.font = '64px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(clip.content, 0, 0);
    } else {
      ctx.font = '800 24px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = clip.content;
      const metrics = ctx.measureText(text);
      const w = metrics.width + 36;
      const h = 48;

      const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      grad.addColorStop(0, '#c026d3');
      grad.addColorStop(0.5, '#db2777');
      grad.addColorStop(1, '#ea580c');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 24);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, 0, 0);
    }

    if (isSelected) {
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(-50, -35, 100, 70);
      ctx.setLineDash([]);
    }
  };

  // Dragging overlay directly on canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedClipId || !project) return;
    const selected = project.clips.find((c) => c.id === selectedClipId);
    if (!selected) return;

    setIsDraggingOverlay(true);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      initialClipX: (selected as any).transform?.x || 0,
      initialClipY: (selected as any).transform?.y || 0
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingOverlay || !dragStartPos.current || !selectedClipId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStartPos.current.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStartPos.current.y) / rect.height) * 100;

    const newX = Math.round(dragStartPos.current.initialClipX + dx);
    const newY = Math.round(dragStartPos.current.initialClipY + dy);

    const selected = project?.clips.find((c) => c.id === selectedClipId);
    if (selected) {
      updateClip(selectedClipId, {
        transform: {
          ...(selected as any).transform,
          x: Math.max(-50, Math.min(50, newX)),
          y: Math.max(-50, Math.min(50, newY))
        }
      });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingOverlay(false);
    dragStartPos.current = null;
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
      {/* Top canvas toolbar */}
      <div className="w-full flex items-center justify-between px-2 text-xs text-gray-400 z-10 mb-1">
        <div className="flex items-center gap-2">
          {/* Safe zone overlay toggle for Instagram */}
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
        </div>

        {/* Center: Current timecode */}
        <div className="flex items-center gap-1.5 bg-[#171922] px-3 py-1 rounded-md border border-[#262836] font-mono text-xs text-gray-200">
          <span className="text-purple-400 font-bold">{formatTimecode(currentTime)}</span>
          <span className="text-gray-500">/</span>
          <span className="text-gray-400">{formatTimecode(project?.duration || 10)}</span>
        </div>

        {/* Right: Fullscreen & Zoom */}
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

      {/* Main Preview Screen */}
      <div
        ref={containerRef}
        className="flex-1 w-full flex items-center justify-center relative overflow-hidden py-1"
      >
        <div className={`relative ${getAspectRatioClasses()} shadow-2xl rounded-xl overflow-hidden border border-[#2b2d3d] bg-black flex items-center justify-center`}>
          <canvas
            ref={canvasRef}
            width={720}
            height={project?.aspectRatio === '16:9' ? 405 : project?.aspectRatio === '1:1' ? 720 : project?.aspectRatio === '4:5' ? 900 : 1280}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="w-full h-full object-contain cursor-grab active:cursor-grabbing"
          />

          {/* 3x3 Composition Grid */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/10">
              <div className="border-r border-b border-white/15" />
              <div className="border-r border-b border-white/15" />
              <div className="border-b border-white/15" />
              <div className="border-r border-b border-white/15" />
              <div className="border-r border-b border-white/15" />
              <div className="border-b border-white/15" />
              <div className="border-r border-white/15" />
              <div className="border-r border-white/15" />
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
          onClick={() => setCurrentTime(Math.max(0, currentTime - 1))}
          className="p-1.5 text-gray-400 hover:text-white transition-colors"
          title="Back 1 Second (Shift+Left)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Frame step back */}
        <button
          onClick={() => setCurrentTime(Math.max(0, currentTime - 1 / 30))}
          className="p-1.5 text-gray-400 hover:text-white transition-colors"
          title="Previous Frame (Arrow Left)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Play / Pause main button */}
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-600 hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-pink-600/30 transition-all"
          title="Play / Pause (Space)"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        {/* Frame step forward */}
        <button
          onClick={() => setCurrentTime(Math.min(project?.duration || 10, currentTime + 1 / 30))}
          className="p-1.5 text-gray-400 hover:text-white transition-colors"
          title="Next Frame (Arrow Right)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Step forward 1s */}
        <button
          onClick={() => setCurrentTime(Math.min(project?.duration || 10, currentTime + 1))}
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

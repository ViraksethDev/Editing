import { Project, ExportSettings, ExportProgress, VideoClip, ImageClip, TextClip, AudioClip, StickerClip } from '../types/editor';
import { renderProceduralScene } from './sampleMediaService';

export function getResolutionDimensions(aspectRatio: string, resolution: string): { width: number; height: number } {
  let baseWidth = 720;
  if (resolution === '480p') baseWidth = 480;
  if (resolution === '1080p') baseWidth = 1080;

  switch (aspectRatio) {
    case '9:16':
      return { width: baseWidth, height: Math.round((baseWidth * 16) / 9) };
    case '16:9':
      return { width: Math.round((baseWidth * 16) / 9), height: baseWidth };
    case '1:1':
      return { width: baseWidth, height: baseWidth };
    case '4:5':
      return { width: baseWidth, height: Math.round((baseWidth * 5) / 4) };
    default:
      return { width: 720, height: 1280 };
  }
}

export class ExportEngine {
  private isCancelled = false;

  cancel() {
    this.isCancelled = true;
  }

  async exportVideo(
    project: Project,
    settings: ExportSettings,
    onProgress: (progress: ExportProgress) => void
  ): Promise<Blob> {
    this.isCancelled = false;
    const { width, height } = getResolutionDimensions(settings.aspectRatio, settings.resolution);
    const fps = settings.frameRate || 30;
    const duration = Math.max(1, project.duration || 5);
    const totalFrames = Math.ceil(duration * fps);

    onProgress({
      isExporting: true,
      progress: 0,
      currentFrame: 0,
      totalFrames,
      stage: 'Initializing rendering pipeline and loading media...'
    });

    // Setup offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false })!;

    // Setup Web Audio recording destination
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioCtx = new AudioCtx();
    const audioDest = audioCtx.createMediaStreamDestination();

    // Preload video elements and audio buffers
    const videoElements: Map<string, HTMLVideoElement> = new Map();
    const imageElements: Map<string, HTMLImageElement> = new Map();
    const audioBuffers: Map<string, AudioBuffer> = new Map();

    const videoClips = project.clips.filter((c): c is VideoClip => c.type === 'video');
    const imageClips = project.clips.filter((c): c is ImageClip => c.type === 'image');
    const audioClips = project.clips.filter((c): c is AudioClip => c.type === 'audio');
    const textClips = project.clips.filter((c): c is TextClip => c.type === 'text');
    const stickerClips = project.clips.filter((c): c is StickerClip => c.type === 'sticker');

    // Load videos
    for (const v of videoClips) {
      if (v.mediaUrl.startsWith('procedural:')) continue;
      if (!videoElements.has(v.mediaUrl)) {
        const vid = document.createElement('video');
        vid.crossOrigin = 'anonymous';
        vid.src = v.mediaUrl;
        vid.muted = true;
        vid.playsInline = true;
        await new Promise((resolve) => {
          vid.onloadeddata = () => resolve(true);
          vid.onerror = () => resolve(false);
          vid.load();
        });
        videoElements.set(v.mediaUrl, vid);
      }
    }

    // Load images
    for (const imgClip of imageClips) {
      if (!imageElements.has(imgClip.mediaUrl)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imgClip.mediaUrl;
        await new Promise((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        });
        imageElements.set(imgClip.mediaUrl, img);
      }
    }

    // Load audio files
    for (const a of audioClips) {
      try {
        if (!audioBuffers.has(a.audioUrl)) {
          const res = await fetch(a.audioUrl);
          const buf = await res.arrayBuffer();
          const decoded = await audioCtx.decodeAudioData(buf);
          audioBuffers.set(a.audioUrl, decoded);
        }
      } catch (e) {
        console.warn('Could not decode audio clip for export:', a.id, e);
      }
    }

    // Connect audio sources into audio destination
    audioClips.forEach((clip) => {
      const buffer = audioBuffers.get(clip.audioUrl);
      if (!buffer) return;

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = clip.speed || 1;

      const gain = audioCtx.createGain();
      gain.gain.value = clip.volume ?? 1;

      source.connect(gain);
      gain.connect(audioDest);

      const clipStart = Math.max(0, clip.startTime);
      const sourceOffset = Math.max(0, clip.sourceOffset || 0);
      const duration = clip.duration;

      try {
        source.start(audioCtx.currentTime + clipStart, sourceOffset, duration);
      } catch (err) {
        console.warn('Audio scheduling error:', err);
      }
    });

    // Video stream from canvas
    const canvasStream = canvas.captureStream(fps);
    const audioTracks = audioDest.stream.getAudioTracks();
    const combinedTracks = [...canvasStream.getVideoTracks(), ...audioTracks];
    const combinedStream = new MediaStream(combinedTracks);

    // Pick best supported MIME type
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (settings.format === 'mp4' && MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
    } else if (!MediaRecorder.isTypeSupported(mimeType)) {
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        mimeType = 'video/webm;codecs=vp8,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      } else {
        mimeType = '';
      }
    }

    const recordedChunks: Blob[] = [];
    const bitrate = settings.quality === 'ultra' ? 8000000 : settings.quality === 'high' ? 5000000 : 2500000;
    
    const recorder = mimeType
      ? new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: bitrate })
      : new MediaRecorder(combinedStream, { videoBitsPerSecond: bitrate });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    const exportPromise = new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => {
        const outputBlob = new Blob(recordedChunks, {
          type: settings.format === 'mp4' && MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm'
        });
        resolve(outputBlob);
      };
      recorder.onerror = (e) => reject(e);
    });

    recorder.start();

    // Render loop frame by frame
    const frameInterval = 1 / fps;
    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (this.isCancelled) {
        recorder.stop();
        audioCtx.close();
        throw new Error('Export cancelled by user');
      }

      const currentTime = frameIndex * frameInterval;

      // 1. Clear background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // 2. Render Video & Image Clips
      for (const track of project.tracks) {
        if (!track.isVisible) continue;

        // Visual clips on this track
        const activeClips = project.clips.filter(
          (c) => c.trackId === track.id && currentTime >= c.startTime && currentTime < c.startTime + c.duration
        );

        for (const clip of activeClips) {
          ctx.save();

          if (clip.type === 'video') {
            const vClip = clip as VideoClip;
            const clipLocalTime = Math.max(0, (currentTime - vClip.startTime) * (vClip.speed || 1));
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

              drawProceduralOnExportCanvas(ctx, procType, width, height, clipLocalTime, vClip.transform, vClip.adjustments, vClip.filter);
            } else {
              const vid = videoElements.get(vClip.mediaUrl);
              if (vid) {
                const targetTime = (vClip.sourceOffset || 0) + clipLocalTime;
                if (Math.abs(vid.currentTime - targetTime) > 0.05) {
                  vid.currentTime = Math.max(0, Math.min(vid.duration || 9999, targetTime));
                }
                applyCanvasTransformAndDraw(ctx, vid, width, height, vClip.transform, vClip.adjustments, vClip.filter);
              }
            }
          } else if (clip.type === 'image') {
            const iClip = clip as ImageClip;
            const img = imageElements.get(iClip.mediaUrl);
            if (img) {
              applyCanvasTransformAndDraw(ctx, img, width, height, iClip.transform, iClip.adjustments, iClip.filter);
            }
          } else if (clip.type === 'text') {
            const tClip = clip as TextClip;
            renderTextOnCanvas(ctx, tClip, width, height, currentTime - tClip.startTime);
          } else if (clip.type === 'sticker') {
            const sClip = clip as StickerClip;
            renderStickerOnCanvas(ctx, sClip, width, height, currentTime - sClip.startTime);
          }

          ctx.restore();
        }
      }

      const progressPercent = Math.min(99, Math.round((frameIndex / totalFrames) * 100));
      onProgress({
        isExporting: true,
        progress: progressPercent,
        currentFrame: frameIndex + 1,
        totalFrames,
        stage: `Rendering frame ${frameIndex + 1} of ${totalFrames} (${Math.round(currentTime)}s / ${Math.round(duration)}s)`
      });

      // Small tick delay to allow recorder to capture frame cleanly
      await new Promise((r) => setTimeout(r, 1000 / fps));
    }

    recorder.stop();
    audioCtx.close();

    const outputBlob = await exportPromise;
    onProgress({
      isExporting: false,
      progress: 100,
      currentFrame: totalFrames,
      totalFrames,
      stage: 'Export complete!',
      outputBlobUrl: URL.createObjectURL(outputBlob),
      fileName: `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${settings.aspectRatio.replace(':', 'x')}_${settings.resolution}.${settings.format}`
    });

    return outputBlob;
  }
}

// Helpers for drawing transformations, filters, text, and stickers on canvas
function applyCanvasTransformAndDraw(
  ctx: CanvasRenderingContext2D,
  media: HTMLVideoElement | HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
  transform: any,
  adjustments: any,
  filter: string
) {
  const cx = canvasWidth / 2 + ((transform?.x || 0) / 100) * canvasWidth;
  const cy = canvasHeight / 2 + ((transform?.y || 0) / 100) * canvasHeight;
  const scale = transform?.scale ?? 1;
  const rotation = ((transform?.rotation || 0) * Math.PI) / 180;
  const opacity = transform?.opacity ?? 1;

  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);

  // Apply CSS-compatible canvas filter string
  let filterStr = '';
  if (adjustments) {
    if (adjustments.brightness !== undefined) filterStr += `brightness(${adjustments.brightness}) `;
    if (adjustments.contrast !== undefined) filterStr += `contrast(${adjustments.contrast}) `;
    if (adjustments.saturation !== undefined) filterStr += `saturate(${adjustments.saturation}) `;
    if (adjustments.blur && adjustments.blur > 0) filterStr += `blur(${adjustments.blur}px) `;
  }

  // Instagram preset filters
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

  // Calculate aspect fill
  const mediaWidth = (media as HTMLVideoElement).videoWidth || (media as HTMLImageElement).naturalWidth || canvasWidth;
  const mediaHeight = (media as HTMLVideoElement).videoHeight || (media as HTMLImageElement).naturalHeight || canvasHeight;

  const hRatio = canvasWidth / mediaWidth;
  const vRatio = canvasHeight / mediaHeight;
  const ratio = Math.max(hRatio, vRatio);

  const drawW = mediaWidth * ratio;
  const drawH = mediaHeight * ratio;

  ctx.drawImage(media, -drawW / 2, -drawH / 2, drawW, drawH);
}

function drawProceduralOnExportCanvas(
  ctx: CanvasRenderingContext2D,
  type: string,
  canvasW: number,
  canvasH: number,
  t: number,
  transform: any,
  adjustments: any,
  filter: string
) {
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

  ctx.translate(-canvasW / 2, -canvasH / 2);
  renderProceduralScene(ctx, type, canvasW, canvasH, t);
}

function renderTextOnCanvas(
  ctx: CanvasRenderingContext2D,
  clip: TextClip,
  canvasWidth: number,
  canvasHeight: number,
  elapsed: number
) {
  const cx = canvasWidth / 2 + ((clip.transform?.x || 0) / 100) * canvasWidth;
  const cy = canvasHeight / 2 + ((clip.transform?.y || 0) / 100) * canvasHeight;
  const scale = clip.transform?.scale ?? 1;
  const rotation = ((clip.transform?.rotation || 0) * Math.PI) / 180;
  let opacity = clip.transform?.opacity ?? 1;

  // Handle text animation
  let offsetY = 0;
  let animatedScale = scale;
  let displayedText = clip.text;

  if (clip.animation === 'fade') {
    opacity *= Math.min(1, elapsed / 0.5);
  } else if (clip.animation === 'slide_up') {
    const p = Math.min(1, elapsed / 0.5);
    offsetY = (1 - p) * 50;
    opacity *= p;
  } else if (clip.animation === 'pop' || clip.animation === 'bounce') {
    const p = Math.min(1, elapsed / 0.4);
    animatedScale = scale * (0.8 + 0.3 * Math.sin(p * Math.PI));
  } else if (clip.animation === 'typewriter') {
    const charsToShow = Math.floor(elapsed * 15);
    displayedText = clip.text.slice(0, charsToShow);
  }

  ctx.save();
  ctx.translate(cx, cy + offsetY);
  ctx.rotate(rotation);
  ctx.scale(animatedScale, animatedScale);
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

  const fontSize = clip.fontSize || 42;
  const fontStyle = clip.fontStyle === 'italic' ? 'italic ' : '';
  const fontWeight = clip.fontWeight || '700';
  const fontFamily = clip.fontFamily || 'Plus Jakarta Sans, sans-serif';

  ctx.font = `${fontStyle}${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = clip.textAlign || 'center';
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(displayedText);
  const textWidth = metrics.width;
  const textHeight = fontSize * 1.2;

  // Background highlight box
  if (clip.backgroundColor && clip.backgroundColor !== 'transparent') {
    ctx.fillStyle = clip.backgroundColor;
    const paddingX = 16;
    const paddingY = 8;
    const rx = clip.textAlign === 'center' ? -textWidth / 2 - paddingX : clip.textAlign === 'right' ? -textWidth - paddingX : -paddingX;
    const ry = -textHeight / 2 - paddingY;
    ctx.beginPath();
    ctx.roundRect(rx, ry, textWidth + paddingX * 2, textHeight + paddingY * 2, 8);
    ctx.fill();
  }

  // Stroke outline
  if (clip.strokeColor && clip.strokeWidth && clip.strokeWidth > 0) {
    ctx.strokeStyle = clip.strokeColor;
    ctx.lineWidth = clip.strokeWidth;
    ctx.strokeText(displayedText, 0, 0);
  }

  // Glow effect
  if (clip.animation === 'glow') {
    ctx.shadowColor = clip.color || '#ec4899';
    ctx.shadowBlur = 20;
  }

  // Text fill
  ctx.fillStyle = clip.color || '#ffffff';
  ctx.fillText(displayedText, 0, 0);

  ctx.restore();
}

function renderStickerOnCanvas(
  ctx: CanvasRenderingContext2D,
  clip: StickerClip,
  canvasWidth: number,
  canvasHeight: number,
  elapsed: number
) {
  const cx = canvasWidth / 2 + ((clip.transform?.x || 0) / 100) * canvasWidth;
  const cy = canvasHeight / 2 + ((clip.transform?.y || 0) / 100) * canvasHeight;
  let scale = clip.transform?.scale ?? 1;
  const rotation = ((clip.transform?.rotation || 0) * Math.PI) / 180;
  const opacity = clip.transform?.opacity ?? 1;

  if (clip.animation === 'pulse') {
    scale *= 1 + Math.sin(elapsed * 6) * 0.1;
  }

  ctx.save();
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
    // Instagram styled badge
    ctx.font = '800 24px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = clip.content;
    const metrics = ctx.measureText(text);
    const w = metrics.width + 36;
    const h = 48;

    // Gradient pill background
    const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    grad.addColorStop(0, '#c026d3');
    grad.addColorStop(0.5, '#db2777');
    grad.addColorStop(1, '#ea580c');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 24);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Badge text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 0, 0);
  }

  ctx.restore();
}

export const exportEngine = new ExportEngine();

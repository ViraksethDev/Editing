export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5';

export type Resolution = '480p' | '720p' | '1080p';

export type ClipType = 'video' | 'image' | 'text' | 'audio' | 'sticker';

export type FilterPreset = 
  | 'none'
  | 'clarendon'
  | 'juno'
  | 'vintage'
  | 'noir'
  | 'warm_sunset'
  | 'cyberpunk'
  | 'film_grain'
  | 'vivid'
  | 'pastel'
  | 'dramatic'
  | 'retro90s';

export type TransitionType = 'none' | 'fade' | 'slide_left' | 'slide_right' | 'zoom_in' | 'dissolve' | 'wipe';

export type TextAnimation = 'none' | 'fade' | 'slide_up' | 'typewriter' | 'bounce' | 'pop' | 'glow';

export interface VisualAdjustments {
  brightness: number; // 0 to 2, default 1
  contrast: number; // 0 to 2, default 1
  saturation: number; // 0 to 2, default 1
  temperature: number; // -100 to 100, default 0
  exposure: number; // -1 to 1, default 0
  blur: number; // 0 to 20, default 0
  vignette: number; // 0 to 1, default 0
  noise: number; // 0 to 1, default 0
}

export interface Transform {
  x: number; // percentage offset from center -50 to 50
  y: number; // percentage offset from center -50 to 50
  scale: number; // 0.1 to 3, default 1
  rotation: number; // degrees -180 to 180, default 0
  opacity: number; // 0 to 1, default 1
  crop?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface BaseClip {
  id: string;
  trackId: string;
  name: string;
  type: ClipType;
  startTime: number; // in seconds on timeline
  duration: number; // in seconds on timeline
  sourceOffset: number; // in seconds from source media start
  sourceDuration?: number; // total duration of raw media
}

export interface VideoClip extends BaseClip {
  type: 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  volume: number; // 0 to 1
  speed: number; // 0.25 to 3
  transform: Transform;
  adjustments: VisualAdjustments;
  filter: FilterPreset;
  transition?: {
    type: TransitionType;
    duration: number;
  };
}

export interface ImageClip extends BaseClip {
  type: 'image';
  mediaUrl: string;
  thumbnailUrl?: string;
  transform: Transform;
  adjustments: VisualAdjustments;
  filter: FilterPreset;
  transition?: {
    type: TransitionType;
    duration: number;
  };
}

export interface TextClip extends BaseClip {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number; // in px at base resolution
  fontWeight: string;
  fontStyle?: 'normal' | 'italic';
  color: string;
  backgroundColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  textAlign: 'left' | 'center' | 'right';
  transform: Transform;
  animation: TextAnimation;
  letterSpacing?: number;
}

export interface AudioClip extends BaseClip {
  type: 'audio';
  audioUrl: string;
  volume: number; // 0 to 1
  fadeIn: number; // seconds
  fadeOut: number; // seconds
  speed: number;
  isMuted?: boolean;
}

export interface StickerClip extends BaseClip {
  type: 'sticker';
  stickerType: 'emoji' | 'instagram_badge' | 'shape' | 'arrow';
  content: string; // emoji character or SVG icon identifier
  transform: Transform;
  animation?: 'none' | 'pulse' | 'bounce' | 'spin';
}

export type TimelineClip = VideoClip | ImageClip | TextClip | AudioClip | StickerClip;

export interface Track {
  id: string;
  name: string;
  type: 'video' | 'overlay' | 'text' | 'audio';
  isMuted: boolean;
  isLocked: boolean;
  isVisible: boolean;
  height?: number;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio';
  url: string;
  duration?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  sizeBytes?: number;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  aspectRatio: AspectRatio;
  duration: number; // total project duration in seconds
  tracks: Track[];
  clips: TimelineClip[];
  mediaAssets: MediaAsset[];
  createdAt: number;
  updatedAt: number;
  thumbnailUrl?: string;
}

export interface ExportSettings {
  aspectRatio: AspectRatio;
  resolution: Resolution;
  format: 'mp4' | 'webm';
  frameRate: 24 | 30 | 60;
  quality: 'standard' | 'high' | 'ultra';
}

export interface ExportProgress {
  isExporting: boolean;
  progress: number; // 0 to 100
  currentFrame: number;
  totalFrames: number;
  stage: string;
  outputBlobUrl?: string;
  fileName?: string;
  error?: string;
}

import { create } from 'zustand';
import { Project, TimelineClip, Track, MediaAsset, AspectRatio, ExportSettings, ExportProgress, VideoClip, AudioClip, TextClip, StickerClip } from '../types/editor';
import { StorageService } from '../services/storageService';
import { audioEngine } from '../services/audioEngine';

interface HistorySnapshot {
  tracks: Track[];
  clips: TimelineClip[];
  duration: number;
}

export type SidebarTab = 'media' | 'audio' | 'text' | 'captions' | 'stickers' | 'effects' | 'filters' | 'transitions';

interface EditorState {
  // Current active project
  project: Project | null;
  isProjectLoaded: boolean;
  isSaving: boolean;
  lastSavedAt: number | null;

  // Playback state
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  volume: number;
  isMuted: boolean;

  // Timeline view
  zoom: number; // pixels per second (e.g. 40 to 200)
  selectedClipId: string | null;
  activeTab: SidebarTab;
  isSnapEnabled: boolean;
  snapGridInterval: number; // in seconds (e.g. 0.5s or 1.0s)

  // Layout view controls
  isDrawerOpen: boolean;
  isPropertiesOpen: boolean;
  timelineHeight: number;

  // Modals
  isExportModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isShortcutsModalOpen: boolean;

  // Export pipeline
  exportSettings: ExportSettings;
  exportProgress: ExportProgress;

  // Undo / Redo history
  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];

  // Actions
  setProject: (project: Project) => void;
  updateProjectName: (name: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setCurrentTime: (time: number, isSeek?: boolean) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  togglePlay: () => void;
  setZoom: (zoom: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setActiveTab: (tab: SidebarTab) => void;
  selectClip: (id: string | null) => void;
  toggleSnap: () => void;
  setSnapEnabled: (enabled: boolean) => void;
  setSnapGridInterval: (interval: number) => void;

  // Clip manipulation
  addClip: (clip: TimelineClip) => void;
  updateClip: (id: string, updates: Partial<TimelineClip>) => void;
  deleteClip: (id: string) => void;
  duplicateClip: (id: string) => void;
  splitClip: (id: string, splitTime?: number) => void;
  moveClip: (id: string, newStartTime: number, newTrackId?: string) => void;
  trimClip: (id: string, newStartTime: number, newDuration: number, newSourceOffset?: number) => void;

  // Track manipulation
  toggleTrackMute: (trackId: string) => void;
  toggleTrackLock: (trackId: string) => void;
  toggleTrackVisibility: (trackId: string) => void;

  // Media assets
  addMediaAsset: (asset: MediaAsset) => void;
  removeMediaAsset: (assetId: string) => void;

  // Modals
  openExportModal: () => void;
  closeExportModal: () => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  openShortcutsModal: () => void;
  closeShortcutsModal: () => void;

  setExportSettings: (settings: Partial<ExportSettings>) => void;
  setExportProgress: (progress: Partial<ExportProgress>) => void;

  // Layout actions
  setIsDrawerOpen: (isOpen: boolean) => void;
  toggleDrawer: () => void;
  setIsPropertiesOpen: (isOpen: boolean) => void;
  toggleProperties: () => void;
  setTimelineHeight: (height: number) => void;

  // History
  undo: () => void;
  redo: () => void;

  // Persistence
  saveProject: () => Promise<void>;
  createNewProject: (name?: string, ratio?: AspectRatio) => Project;
}

const DEFAULT_TRACKS: Track[] = [
  { id: 'track-text', name: 'Text & Titles', type: 'text', isMuted: false, isLocked: false, isVisible: true, height: 44 },
  { id: 'track-overlay', name: 'Stickers & Overlays', type: 'overlay', isMuted: false, isLocked: false, isVisible: true, height: 44 },
  { id: 'track-video', name: 'Main Video', type: 'video', isMuted: false, isLocked: false, isVisible: true, height: 60 },
  { id: 'track-audio', name: 'Music & Audio', type: 'audio', isMuted: false, isLocked: false, isVisible: true, height: 44 }
];

export const useEditorStore = create<EditorState>((set, get) => ({
  project: null,
  isProjectLoaded: false,
  isSaving: false,
  lastSavedAt: null,

  currentTime: 0,
  isPlaying: false,
  playbackSpeed: 1,
  volume: 1,
  isMuted: false,

  zoom: 60,
  selectedClipId: null,
  activeTab: 'media',
  isSnapEnabled: true,
  snapGridInterval: 0.5,

  isDrawerOpen: true,
  isPropertiesOpen: true,
  timelineHeight: 230,

  isExportModalOpen: false,
  isSettingsModalOpen: false,
  isShortcutsModalOpen: false,

  exportSettings: {
    aspectRatio: '9:16',
    resolution: '1080p',
    format: 'mp4',
    frameRate: 30,
    quality: 'high'
  },

  exportProgress: {
    isExporting: false,
    progress: 0,
    currentFrame: 0,
    totalFrames: 0,
    stage: 'Ready'
  },

  undoStack: [],
  redoStack: [],

  setProject: (project) => {
    set({
      project,
      isProjectLoaded: true,
      currentTime: 0,
      isPlaying: false,
      selectedClipId: null,
      undoStack: [],
      redoStack: [],
      exportSettings: {
        ...get().exportSettings,
        aspectRatio: project.aspectRatio
      }
    });
  },

  updateProjectName: (name) => {
    const { project } = get();
    if (!project) return;
    const updated = { ...project, name, updatedAt: Date.now() };
    set({ project: updated });
    get().saveProject();
  },

  setAspectRatio: (ratio) => {
    const { project } = get();
    if (!project) return;
    const updated = { ...project, aspectRatio: ratio, updatedAt: Date.now() };
    set({
      project: updated,
      exportSettings: { ...get().exportSettings, aspectRatio: ratio }
    });
    get().saveProject();
  },

  setCurrentTime: (time, isSeek = false) => {
    const { project } = get();
    const duration = project?.duration || 10;
    const clamped = Math.max(0, Math.min(duration, time));
    set({ currentTime: clamped });

    // Only restart audio on manual user scrub/seek, never on 60fps playback ticks
    if (project && isSeek && get().isPlaying) {
      const audioClips = project.clips.filter((c): c is AudioClip => c.type === 'audio');
      audioEngine.syncAndPlayAudioClips(audioClips, clamped);
    }
  },

  setIsPlaying: (isPlaying) => {
    const { project, currentTime } = get();
    set({ isPlaying });

    if (project) {
      const audioClips = project.clips.filter((c): c is AudioClip => c.type === 'audio');
      if (isPlaying) {
        audioEngine.syncAndPlayAudioClips(audioClips, currentTime);
      } else {
        audioEngine.stopAll();
      }
    }
  },

  togglePlay: () => {
    const { isPlaying, currentTime, project } = get();
    if (!isPlaying && project && currentTime >= project.duration - 0.1) {
      // Loop back to start if at the end
      get().setCurrentTime(0);
    }
    get().setIsPlaying(!isPlaying);
  },

  setZoom: (zoom) => {
    set({ zoom: Math.max(20, Math.min(250, zoom)) });
  },

  setVolume: (vol) => {
    set({ volume: vol });
    audioEngine.setMasterVolume(vol);
  },

  toggleMute: () => {
    const newMute = !get().isMuted;
    set({ isMuted: newMute });
    audioEngine.setMuted(newMute);
  },

  setActiveTab: (activeTab) => set({ activeTab }),

  selectClip: (selectedClipId) => set({ selectedClipId }),

  toggleSnap: () => set((state) => ({ isSnapEnabled: !state.isSnapEnabled })),

  setSnapEnabled: (isSnapEnabled) => set({ isSnapEnabled }),

  setSnapGridInterval: (snapGridInterval) => set({ snapGridInterval }),

  // Push snapshot before mutating
  addClip: (clip) => {
    const { project, undoStack } = get();
    if (!project) return;

    // Snapshot for undo
    const snapshot: HistorySnapshot = {
      tracks: [...project.tracks],
      clips: [...project.clips],
      duration: project.duration
    };

    const newClips = [...project.clips, clip];
    // Calculate new total duration
    const maxClipEnd = newClips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 5);
    const updatedProject = {
      ...project,
      clips: newClips,
      duration: Math.max(5, maxClipEnd),
      updatedAt: Date.now()
    };

    set({
      project: updatedProject,
      selectedClipId: clip.id,
      undoStack: [snapshot, ...undoStack.slice(0, 30)],
      redoStack: []
    });

    get().saveProject();
  },

  updateClip: (id, updates) => {
    const { project, undoStack } = get();
    if (!project) return;

    const snapshot: HistorySnapshot = {
      tracks: [...project.tracks],
      clips: [...project.clips],
      duration: project.duration
    };

    const newClips = project.clips.map((c) => (c.id === id ? ({ ...c, ...updates } as TimelineClip) : c));
    const maxClipEnd = newClips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 5);

    const updatedProject = {
      ...project,
      clips: newClips,
      duration: Math.max(5, maxClipEnd),
      updatedAt: Date.now()
    };

    set({
      project: updatedProject,
      undoStack: [snapshot, ...undoStack.slice(0, 30)],
      redoStack: []
    });

    get().saveProject();
  },

  deleteClip: (id) => {
    const { project, undoStack, selectedClipId } = get();
    if (!project) return;

    const snapshot: HistorySnapshot = {
      tracks: [...project.tracks],
      clips: [...project.clips],
      duration: project.duration
    };

    const newClips = project.clips.filter((c) => c.id !== id);
    const maxClipEnd = newClips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 5);

    const updatedProject = {
      ...project,
      clips: newClips,
      duration: Math.max(5, maxClipEnd),
      updatedAt: Date.now()
    };

    set({
      project: updatedProject,
      selectedClipId: selectedClipId === id ? null : selectedClipId,
      undoStack: [snapshot, ...undoStack.slice(0, 30)],
      redoStack: []
    });

    get().saveProject();
  },

  duplicateClip: (id) => {
    const { project, undoStack } = get();
    if (!project) return;

    const clip = project.clips.find((c) => c.id === id);
    if (!clip) return;

    const snapshot: HistorySnapshot = {
      tracks: [...project.tracks],
      clips: [...project.clips],
      duration: project.duration
    };

    const newClip: TimelineClip = {
      ...clip,
      id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: `${clip.name} (Copy)`,
      startTime: clip.startTime + clip.duration
    };

    const newClips = [...project.clips, newClip];
    const maxClipEnd = newClips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 5);

    set({
      project: {
        ...project,
        clips: newClips,
        duration: Math.max(5, maxClipEnd),
        updatedAt: Date.now()
      },
      selectedClipId: newClip.id,
      undoStack: [snapshot, ...undoStack.slice(0, 30)],
      redoStack: []
    });

    get().saveProject();
  },

  splitClip: (id, splitTime) => {
    const { project, currentTime, undoStack } = get();
    if (!project) return;

    const targetTime = splitTime !== undefined ? splitTime : currentTime;
    const clip = project.clips.find((c) => c.id === id);
    if (!clip) return;

    // Check if targetTime is strictly inside clip
    if (targetTime <= clip.startTime + 0.1 || targetTime >= clip.startTime + clip.duration - 0.1) {
      return;
    }

    const snapshot: HistorySnapshot = {
      tracks: [...project.tracks],
      clips: [...project.clips],
      duration: project.duration
    };

    const firstDuration = targetTime - clip.startTime;
    const secondDuration = clip.duration - firstDuration;
    const secondSourceOffset = (clip.sourceOffset || 0) + firstDuration;

    // First piece
    const clipA: TimelineClip = {
      ...clip,
      duration: firstDuration
    };

    // Second piece
    const clipB: TimelineClip = {
      ...clip,
      id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: `${clip.name} (Part 2)`,
      startTime: targetTime,
      duration: secondDuration,
      sourceOffset: secondSourceOffset
    };

    const newClips = project.clips.map((c) => (c.id === id ? clipA : c)).concat(clipB);

    set({
      project: {
        ...project,
        clips: newClips,
        updatedAt: Date.now()
      },
      selectedClipId: clipB.id,
      undoStack: [snapshot, ...undoStack.slice(0, 30)],
      redoStack: []
    });

    get().saveProject();
  },

  moveClip: (id, newStartTime, newTrackId) => {
    const { project, undoStack } = get();
    if (!project) return;

    const snapshot: HistorySnapshot = {
      tracks: [...project.tracks],
      clips: [...project.clips],
      duration: project.duration
    };

    const clampedStartTime = Math.max(0, newStartTime);
    const newClips = project.clips.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          startTime: clampedStartTime,
          trackId: newTrackId || c.trackId
        } as TimelineClip;
      }
      return c;
    });

    const maxClipEnd = newClips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 5);

    set({
      project: {
        ...project,
        clips: newClips,
        duration: Math.max(5, maxClipEnd),
        updatedAt: Date.now()
      },
      undoStack: [snapshot, ...undoStack.slice(0, 30)],
      redoStack: []
    });

    get().saveProject();
  },

  trimClip: (id, newStartTime, newDuration, newSourceOffset) => {
    const { project, undoStack } = get();
    if (!project) return;

    const snapshot: HistorySnapshot = {
      tracks: [...project.tracks],
      clips: [...project.clips],
      duration: project.duration
    };

    const newClips = project.clips.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          startTime: Math.max(0, newStartTime),
          duration: Math.max(0.2, newDuration),
          sourceOffset: newSourceOffset !== undefined ? Math.max(0, newSourceOffset) : c.sourceOffset
        } as TimelineClip;
      }
      return c;
    });

    const maxClipEnd = newClips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 5);

    set({
      project: {
        ...project,
        clips: newClips,
        duration: Math.max(5, maxClipEnd),
        updatedAt: Date.now()
      },
      undoStack: [snapshot, ...undoStack.slice(0, 30)],
      redoStack: []
    });

    get().saveProject();
  },

  toggleTrackMute: (trackId) => {
    const { project } = get();
    if (!project) return;
    const tracks = project.tracks.map((t) => (t.id === trackId ? { ...t, isMuted: !t.isMuted } : t));
    set({ project: { ...project, tracks, updatedAt: Date.now() } });
    get().saveProject();
  },

  toggleTrackLock: (trackId) => {
    const { project } = get();
    if (!project) return;
    const tracks = project.tracks.map((t) => (t.id === trackId ? { ...t, isLocked: !t.isLocked } : t));
    set({ project: { ...project, tracks, updatedAt: Date.now() } });
    get().saveProject();
  },

  toggleTrackVisibility: (trackId) => {
    const { project } = get();
    if (!project) return;
    const tracks = project.tracks.map((t) => (t.id === trackId ? { ...t, isVisible: !t.isVisible } : t));
    set({ project: { ...project, tracks, updatedAt: Date.now() } });
    get().saveProject();
  },

  addMediaAsset: (asset) => {
    const { project } = get();
    if (!project) return;
    const assets = [asset, ...project.mediaAssets.filter((a) => a.id !== asset.id)];
    set({ project: { ...project, mediaAssets: assets, updatedAt: Date.now() } });
    get().saveProject();
  },

  removeMediaAsset: (assetId) => {
    const { project } = get();
    if (!project) return;
    const assets = project.mediaAssets.filter((a) => a.id !== assetId);
    set({ project: { ...project, mediaAssets: assets, updatedAt: Date.now() } });
    get().saveProject();
  },

  openExportModal: () => set({ isExportModalOpen: true }),
  closeExportModal: () => set({ isExportModalOpen: false }),
  openSettingsModal: () => set({ isSettingsModalOpen: true }),
  closeSettingsModal: () => set({ isSettingsModalOpen: false }),
  openShortcutsModal: () => set({ isShortcutsModalOpen: true }),
  closeShortcutsModal: () => set({ isShortcutsModalOpen: false }),

  setIsDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
  setIsPropertiesOpen: (isOpen) => set({ isPropertiesOpen: isOpen }),
  toggleProperties: () => set((state) => ({ isPropertiesOpen: !state.isPropertiesOpen })),
  setTimelineHeight: (height) => set({ timelineHeight: Math.max(140, Math.min(500, height)) }),

  setExportSettings: (settings) => set({ exportSettings: { ...get().exportSettings, ...settings } }),
  setExportProgress: (progress) => set({ exportProgress: { ...get().exportProgress, ...progress } }),

  undo: () => {
    const { project, undoStack, redoStack } = get();
    if (!project || undoStack.length === 0) return;

    const [prev, ...remainingUndo] = undoStack;
    const currentSnapshot: HistorySnapshot = {
      tracks: [...project.tracks],
      clips: [...project.clips],
      duration: project.duration
    };

    set({
      project: {
        ...project,
        tracks: prev.tracks,
        clips: prev.clips,
        duration: prev.duration,
        updatedAt: Date.now()
      },
      undoStack: remainingUndo,
      redoStack: [currentSnapshot, ...redoStack.slice(0, 30)]
    });

    get().saveProject();
  },

  redo: () => {
    const { project, undoStack, redoStack } = get();
    if (!project || redoStack.length === 0) return;

    const [next, ...remainingRedo] = redoStack;
    const currentSnapshot: HistorySnapshot = {
      tracks: [...project.tracks],
      clips: [...project.clips],
      duration: project.duration
    };

    set({
      project: {
        ...project,
        tracks: next.tracks,
        clips: next.clips,
        duration: next.duration,
        updatedAt: Date.now()
      },
      redoStack: remainingRedo,
      undoStack: [currentSnapshot, ...undoStack.slice(0, 30)]
    });

    get().saveProject();
  },

  saveProject: async () => {
    const { project } = get();
    if (!project) return;
    set({ isSaving: true });
    try {
      await StorageService.saveProject(project);
      set({ isSaving: false, lastSavedAt: Date.now() });
    } catch (err) {
      console.error('Failed to save project:', err);
      set({ isSaving: false });
    }
  },

  createNewProject: (name = 'Untitled Reel', ratio = '9:16') => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name,
      aspectRatio: ratio,
      duration: 10,
      tracks: DEFAULT_TRACKS,
      clips: [],
      mediaAssets: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    get().setProject(newProject);
    get().saveProject();
    return newProject;
  }
}));

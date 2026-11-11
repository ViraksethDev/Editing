import React, { useEffect, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { StorageService } from '../../services/storageService';
import { Project, AspectRatio, VideoClip, TextClip, AudioClip, StickerClip } from '../../types/editor';
import { 
  Sparkles, 
  Plus, 
  FolderOpen, 
  Trash2, 
  Copy, 
  Clock, 
  Film, 
  Play, 
  Smartphone, 
  Tv, 
  Square, 
  RectangleVertical,
  ArrowRight,
  Upload
} from 'lucide-react';
import { generateProceduralVideoBlob, generateSynthesizedAudioBlob } from '../../services/sampleMediaService';
import { formatDurationSimple } from '../../utils/formatTime';

interface ProjectDashboardProps {
  onOpenEditor: () => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ onOpenEditor }) => {
  const { setProject, createNewProject } = useEditorStore();
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const list = await StorageService.listProjects();
      setProjectsList(list);
    } catch (e) {
      console.warn('Could not load projects', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateNew = (ratio: AspectRatio = '9:16') => {
    const proj = createNewProject(`New Reel ${new Date().toLocaleDateString()}`, ratio);
    onOpenEditor();
  };

  const handleOpenProject = (project: Project) => {
    setProject(project);
    onOpenEditor();
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      await StorageService.deleteProject(id);
      loadProjects();
    }
  };

  const handleDuplicateProject = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    const duplicated: Project = {
      ...project,
      id: `proj-${Date.now()}`,
      name: `${project.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await StorageService.saveProject(duplicated);
    loadProjects();
  };

  // Create an engaging pre-loaded demo project so user can immediately test trimming, text overlays, audio and export!
  const handleLoadDemoProject = async () => {
    setIsCreatingDemo(true);
    try {
      const sunsetUrl = 'procedural:sunset';
      const cyberUrl = 'procedural:cyber';

      // Generate audio track
      const audioBlob = generateSynthesizedAudioBlob('lofi', 12);
      const audioUrl = URL.createObjectURL(audioBlob);

      const demoProject: Project = {
        id: `demo-${Date.now()}`,
        name: 'Viral Sunset & Cyber Reel',
        aspectRatio: '9:16',
        duration: 12,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tracks: [
          { id: 'track-text', name: 'Text & Titles', type: 'text', isMuted: false, isLocked: false, isVisible: true, height: 44 },
          { id: 'track-overlay', name: 'Stickers & Overlays', type: 'overlay', isMuted: false, isLocked: false, isVisible: true, height: 44 },
          { id: 'track-video', name: 'Main Video', type: 'video', isMuted: false, isLocked: false, isVisible: true, height: 60 },
          { id: 'track-audio', name: 'Music & Audio', type: 'audio', isMuted: false, isLocked: false, isVisible: true, height: 44 }
        ],
        clips: [
          // Video Clip 1: Sunset
          {
            id: 'clip-demo-v1',
            trackId: 'track-video',
            name: 'Golden Hour Sunset',
            type: 'video',
            startTime: 0,
            duration: 6,
            sourceOffset: 0,
            sourceDuration: 6,
            mediaUrl: sunsetUrl,
            volume: 1,
            speed: 1,
            filter: 'clarendon',
            adjustments: { brightness: 1.05, contrast: 1.15, saturation: 1.25, temperature: 0, exposure: 0, blur: 0, vignette: 0, noise: 0 },
            transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 }
          } as VideoClip,

          // Video Clip 2: Cyber City
          {
            id: 'clip-demo-v2',
            trackId: 'track-video',
            name: 'Neon Cyber Grid',
            type: 'video',
            startTime: 6,
            duration: 6,
            sourceOffset: 0,
            sourceDuration: 6,
            mediaUrl: cyberUrl,
            volume: 1,
            speed: 1,
            filter: 'cyberpunk',
            adjustments: { brightness: 1, contrast: 1.2, saturation: 1.4, temperature: 0, exposure: 0, blur: 0, vignette: 0, noise: 0 },
            transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 }
          } as VideoClip,

          // Text Hook
          {
            id: 'clip-demo-t1',
            trackId: 'track-text',
            name: 'Hook Title',
            type: 'text',
            startTime: 0.5,
            duration: 3.5,
            sourceOffset: 0,
            text: 'STOP SCROLLING ⚠️',
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: 54,
            fontWeight: '800',
            color: '#ffffff',
            backgroundColor: '#dc2626',
            textAlign: 'center',
            animation: 'bounce',
            transform: { x: 0, y: -20, scale: 1, rotation: 0, opacity: 1 }
          } as TextClip,

          // Text Subtitle
          {
            id: 'clip-demo-t2',
            trackId: 'track-text',
            name: 'Cyber Subtitle',
            type: 'text',
            startTime: 6.5,
            duration: 4.5,
            sourceOffset: 0,
            text: 'THE FUTURE IS NOW 🚀',
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 42,
            fontWeight: '700',
            color: '#38bdf8',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            textAlign: 'center',
            animation: 'glow',
            transform: { x: 0, y: 25, scale: 1, rotation: 0, opacity: 1 }
          } as TextClip,

          // Sticker: Link in Bio
          {
            id: 'clip-demo-s1',
            trackId: 'track-overlay',
            name: 'Link in Bio',
            type: 'sticker',
            stickerType: 'instagram_badge',
            content: '🔗 LINK IN BIO',
            startTime: 2,
            duration: 4,
            sourceOffset: 0,
            animation: 'pulse',
            transform: { x: 0, y: 15, scale: 1.1, rotation: 0, opacity: 1 }
          } as StickerClip,

          // Background Audio Track
          {
            id: 'clip-demo-a1',
            trackId: 'track-audio',
            name: 'Chill Lo-Fi Beat',
            type: 'audio',
            startTime: 0,
            duration: 12,
            sourceOffset: 0,
            audioUrl,
            volume: 0.85,
            fadeIn: 1,
            fadeOut: 1,
            speed: 1
          } as AudioClip
        ],
        mediaAssets: [
          {
            id: 'asset-sunset-demo',
            name: 'Golden Hour Sunset.mp4',
            type: 'video',
            url: sunsetUrl,
            duration: 6,
            createdAt: Date.now()
          },
          {
            id: 'asset-cyber-demo',
            name: 'Cyberpunk Neon.mp4',
            type: 'video',
            url: cyberUrl,
            duration: 6,
            createdAt: Date.now()
          }
        ]
      };

      await StorageService.saveProject(demoProject);
      setProject(demoProject);
      onOpenEditor();
    } catch (e) {
      console.error('Failed to create demo project', e);
    } finally {
      setIsCreatingDemo(false);
    }
  };

  return (
    <div className="flex-1 bg-[#0d0e14] text-white flex flex-col h-full overflow-y-auto select-none">
      {/* Top Hero Banner */}
      <div className="border-b border-[#222432] bg-gradient-to-b from-[#161724] to-[#0d0e14] px-6 py-8 sm:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Web Video Editor</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              InstaEdit <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">Studio</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1.5 max-w-xl">
              Professional browser-based video editing studio for Instagram Reels, YouTube Shorts, and TikTok. Trim, split, apply filters, animate captions, add music, and export in full HD.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleLoadDemoProject}
              disabled={isCreatingDemo}
              className="px-4 py-2.5 rounded-xl bg-[#222538] hover:bg-[#2b2e46] text-purple-300 border border-purple-500/40 font-semibold text-xs flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>{isCreatingDemo ? 'Generating Demo Reel...' : 'Load Sample Demo Reel'}</span>
            </button>

            <button
              onClick={() => handleCreateNew('9:16')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-600/25 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Reel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="max-w-6xl mx-auto px-6 py-8 sm:px-12 w-full space-y-8">
        {/* Quick Start Presets */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            Start with Format
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { ratio: '9:16' as AspectRatio, name: 'Reels / Shorts', desc: '1080 x 1920 Vertical', icon: Smartphone, bg: 'from-purple-900/40 to-pink-900/40' },
              { ratio: '16:9' as AspectRatio, name: 'YouTube / Web', desc: '1920 x 1080 Landscape', icon: Tv, bg: 'from-blue-900/40 to-cyan-900/40' },
              { ratio: '1:1' as AspectRatio, name: 'Square Post', desc: '1080 x 1080 Feed', icon: Square, bg: 'from-emerald-900/40 to-teal-900/40' },
              { ratio: '4:5' as AspectRatio, name: 'Portrait Feed', desc: '1080 x 1350 Instagram', icon: RectangleVertical, bg: 'from-amber-900/40 to-orange-900/40' }
            ].map((fmt) => {
              const Icon = fmt.icon;
              return (
                <div
                  key={fmt.ratio}
                  onClick={() => handleCreateNew(fmt.ratio)}
                  className={`p-4 rounded-2xl bg-gradient-to-br ${fmt.bg} border border-[#27293a] hover:border-purple-500 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between group`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-purple-300 font-bold">
                      {fmt.ratio}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{fmt.name}</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">{fmt.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Recent Projects ({projectsList.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              Loading projects from browser database...
            </div>
          ) : projectsList.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#141620] border border-[#232534] text-center space-y-3">
              <Film className="w-10 h-10 text-gray-600 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-gray-300">No Projects Found</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Start by clicking "Create New Reel" or "Load Sample Demo Reel" to explore all editing features!
                </p>
              </div>
              <button
                onClick={handleLoadDemoProject}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open Pre-Built Sample Project</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {projectsList.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleOpenProject(p)}
                  className="bg-[#141620] hover:bg-[#191b28] border border-[#252838] hover:border-purple-500/60 rounded-2xl overflow-hidden cursor-pointer transition-all group shadow-md"
                >
                  {/* Thumbnail / Aspect Preview */}
                  <div className="h-32 bg-black/60 relative flex items-center justify-center border-b border-[#222432]">
                    <div className="w-16 h-24 bg-gradient-to-tr from-purple-800 to-pink-700 rounded shadow-md flex items-center justify-center">
                      <Play className="w-6 h-6 text-white group-hover:scale-125 transition-transform" />
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-purple-300 font-bold border border-white/10">
                        {p.aspectRatio}
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-2 text-[10px] font-mono bg-black/80 px-2 py-0.5 rounded text-gray-300">
                      {formatDurationSimple(p.duration)}
                    </div>
                  </div>

                  {/* Info & Actions */}
                  <div className="p-3.5 flex items-center justify-between">
                    <div className="overflow-hidden pr-2">
                      <h4 className="text-xs font-bold text-gray-100 truncate group-hover:text-purple-300 transition-colors">
                        {p.name}
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {p.clips.length} layers • Edited {new Date(p.updatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleDuplicateProject(e, p)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#252838] transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteProject(e, p.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-[#252838] transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

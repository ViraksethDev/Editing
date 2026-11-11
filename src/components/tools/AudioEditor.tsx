import React, { useRef, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { 
  Music, 
  Upload, 
  Plus, 
  Play, 
  Pause, 
  Volume2, 
  Sparkles,
  Headphones,
  Radio,
  Wind,
  Bell
} from 'lucide-react';
import { 
  STOCK_AUDIO_METADATA, 
  generateSynthesizedAudioBlob 
} from '../../services/sampleMediaService';
import { audioEngine } from '../../services/audioEngine';
import { AudioClip } from '../../types/editor';

const SFX_ICONS: Record<string, any> = {
  Headphones,
  Music,
  Radio,
  Wind,
  Sparkles,
  Bell
};

export const AudioEditor: React.FC = () => {
  const { project, addClip, currentTime } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);

  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const url = URL.createObjectURL(file);

    const audioTrack = project?.tracks.find((t) => t.type === 'audio') || project?.tracks[0];
    if (!audioTrack) return;

    const clip: AudioClip = {
      id: `audio-${Date.now()}`,
      trackId: audioTrack.id,
      name: file.name,
      type: 'audio',
      startTime: currentTime,
      duration: 8,
      sourceOffset: 0,
      audioUrl: url,
      volume: 1,
      fadeIn: 0.5,
      fadeOut: 0.5,
      speed: 1
    };

    addClip(clip);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePreviewAudio = (stock: (typeof STOCK_AUDIO_METADATA)[0]) => {
    try {
      const blob = generateSynthesizedAudioBlob(stock.type as any, stock.duration || 5);
      const url = URL.createObjectURL(blob);
      audioEngine.playSoundEffect(url, 0.8);
      setPlayingPreview(stock.id);
      setTimeout(() => setPlayingPreview(null), (stock.duration || 2) * 1000);
    } catch (e) {
      console.warn('Audio preview failed', e);
    }
  };

  const handleAddStockAudio = (stock: (typeof STOCK_AUDIO_METADATA)[0]) => {
    if (!project) return;
    const blob = generateSynthesizedAudioBlob(stock.type as any, stock.duration || 6);
    const url = URL.createObjectURL(blob);

    const audioTrack = project.tracks.find((t) => t.type === 'audio') || project.tracks[0];
    const clip: AudioClip = {
      id: `audio-${stock.id}-${Date.now()}`,
      trackId: audioTrack.id,
      name: stock.name,
      type: 'audio',
      startTime: currentTime,
      duration: stock.duration || 6,
      sourceOffset: 0,
      audioUrl: url,
      volume: 1,
      fadeIn: 0.5,
      fadeOut: 0.5,
      speed: 1
    };

    addClip(clip);
  };

  const musicTracks = STOCK_AUDIO_METADATA.filter((a) => a.category === 'audio');
  const soundEffects = STOCK_AUDIO_METADATA.filter((a) => a.category === 'sfx');

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 space-y-4">
      {/* Upload Custom Audio */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleCustomAudioUpload}
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-[#2f3240] hover:border-purple-500 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer bg-[#16171f] hover:bg-[#1a1c27] transition-all"
        >
          <Upload className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-gray-200">Upload Music or Voiceover</span>
        </div>
      </div>

      {/* Royalty-Free Background Music */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Music className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Music Tracks ({musicTracks.length})
          </span>
        </div>

        <div className="space-y-2">
          {musicTracks.map((item) => {
            const Icon = SFX_ICONS[item.iconName] || Music;
            const isPlaying = playingPreview === item.id;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#161720] border border-[#232532] hover:border-purple-500/40 transition-all"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <button
                    onClick={() => handlePreviewAudio(item)}
                    className="w-9 h-9 rounded-lg bg-[#222433] hover:bg-purple-600 text-purple-300 hover:text-white flex items-center justify-center shrink-0 transition-colors"
                    title="Preview Sound"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-semibold text-gray-200 truncate">{item.name}</h4>
                    <p className="text-[10px] text-gray-400 truncate">{item.duration}s • {item.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleAddStockAudio(item)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#252838] hover:bg-purple-600 text-white text-xs font-medium flex items-center gap-1 shrink-0 transition-colors"
                  title="Add to Timeline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sound Effects */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Sound Effects (SFX)
          </span>
        </div>

        <div className="space-y-2">
          {soundEffects.map((item) => {
            const Icon = SFX_ICONS[item.iconName] || Sparkles;
            const isPlaying = playingPreview === item.id;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-xl bg-[#161720] border border-[#232532] hover:border-purple-500/40 transition-all"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <button
                    onClick={() => handlePreviewAudio(item)}
                    className="w-8 h-8 rounded-lg bg-[#222433] hover:bg-pink-600 text-pink-300 hover:text-white flex items-center justify-center shrink-0 transition-colors"
                    title="Preview SFX"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                  </button>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-semibold text-gray-200 truncate">{item.name}</h4>
                    <p className="text-[10px] text-gray-400 truncate">{item.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleAddStockAudio(item)}
                  className="px-2 py-1 rounded-lg bg-[#252838] hover:bg-pink-600 text-white text-xs font-medium flex items-center gap-1 shrink-0 transition-colors"
                  title="Add to Timeline"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

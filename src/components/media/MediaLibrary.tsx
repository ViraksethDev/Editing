import React, { useRef, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { 
  Upload, 
  Video, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Play, 
  Sparkles, 
  Sun, 
  Zap, 
  Coffee, 
  Activity, 
  Trees, 
  Loader2 
} from 'lucide-react';
import { 
  STOCK_VIDEOS_METADATA, 
  generateProceduralVideoBlob, 
  generateVideoThumbnail 
} from '../../services/sampleMediaService';
import { MediaAsset, VideoClip, ImageClip } from '../../types/editor';

const ICON_MAP: Record<string, any> = {
  Sun,
  Zap,
  Coffee,
  Activity,
  Trees
};

export const MediaLibrary: React.FC = () => {
  const { project, addMediaAsset, removeMediaAsset, addClip, currentTime } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video');
      const isImage = file.type.startsWith('image');
      const isAudio = file.type.startsWith('audio');

      if (!isVideo && !isImage && !isAudio) continue;

      let duration = 5;
      let thumbnailUrl = '';

      if (isVideo) {
        // Create temp video to get duration and thumbnail
        const tempVid = document.createElement('video');
        tempVid.src = url;
        tempVid.muted = true;
        await new Promise((resolve) => {
          tempVid.onloadedmetadata = () => {
            duration = Math.max(1, tempVid.duration);
            tempVid.currentTime = Math.min(1, duration / 2);
          };
          tempVid.onseeked = () => {
            thumbnailUrl = generateVideoThumbnail(tempVid);
            resolve(true);
          };
          tempVid.onerror = () => resolve(false);
        });
      } else if (isImage) {
        thumbnailUrl = url;
        duration = 4;
      }

      const asset: MediaAsset = {
        id: `asset-${Date.now()}-${i}`,
        name: file.name,
        type: isVideo ? 'video' : isImage ? 'image' : 'audio',
        url,
        duration,
        thumbnailUrl: thumbnailUrl || undefined,
        sizeBytes: file.size,
        createdAt: Date.now()
      };

      addMediaAsset(asset);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddStockVideo = (stockItem: (typeof STOCK_VIDEOS_METADATA)[0]) => {
    const url = `procedural:${stockItem.type}`;

    const asset: MediaAsset = {
      id: `asset-stock-${stockItem.id}-${Date.now()}`,
      name: stockItem.name,
      type: 'video',
      url,
      duration: stockItem.duration || 6,
      createdAt: Date.now()
    };

    addMediaAsset(asset);
    handleAddToTimeline(asset);
  };

  const handleAddToTimeline = (asset: MediaAsset) => {
    if (!project) return;

    if (asset.type === 'video') {
      const targetTrack = project.tracks.find((t) => t.type === 'video') || project.tracks[0];
      const videoClipsOnTrack = project.clips.filter((c) => c.trackId === targetTrack.id);
      const startTime = videoClipsOnTrack.length > 0
        ? Math.max(...videoClipsOnTrack.map((c) => c.startTime + c.duration))
        : 0;

      const clip: VideoClip = {
        id: `clip-${Date.now()}`,
        trackId: targetTrack.id,
        name: asset.name,
        type: 'video',
        startTime,
        duration: asset.duration || 5,
        sourceOffset: 0,
        sourceDuration: asset.duration || 5,
        mediaUrl: asset.url,
        thumbnailUrl: asset.thumbnailUrl,
        volume: 1,
        speed: 1,
        filter: 'none',
        adjustments: {
          brightness: 1,
          contrast: 1,
          saturation: 1,
          temperature: 0,
          exposure: 0,
          blur: 0,
          vignette: 0,
          noise: 0
        },
        transform: {
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          opacity: 1
        }
      };

      addClip(clip);
    } else if (asset.type === 'image') {
      const targetTrack = project.tracks.find((t) => t.type === 'overlay' || t.type === 'video') || project.tracks[0];
      const clip: ImageClip = {
        id: `clip-${Date.now()}`,
        trackId: targetTrack.id,
        name: asset.name,
        type: 'image',
        startTime: currentTime,
        duration: 4,
        sourceOffset: 0,
        mediaUrl: asset.url,
        thumbnailUrl: asset.thumbnailUrl,
        filter: 'none',
        adjustments: {
          brightness: 1,
          contrast: 1,
          saturation: 1,
          temperature: 0,
          exposure: 0,
          blur: 0,
          vignette: 0,
          noise: 0
        },
        transform: {
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          opacity: 1
        }
      };
      addClip(clip);
    }
  };

  const assets = project?.mediaAssets || [];

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 space-y-4">
      {/* Upload Zone */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,image/*,audio/*"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#2f3240] hover:border-purple-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-[#16171f]/80 hover:bg-[#1a1c27] transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-purple-500/15 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Upload className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-gray-200">Import Media</span>
          <span className="text-[11px] text-gray-400 mt-0.5">MP4, WebM, MOV, JPG, PNG</span>
        </div>
      </div>

      {/* Uploaded User Media Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Project Files ({assets.length})
          </span>
        </div>

        {assets.length === 0 ? (
          <div className="text-center py-6 px-3 bg-[#161720] rounded-xl border border-[#232530]">
            <p className="text-xs text-gray-400">No media uploaded yet.</p>
            <p className="text-[11px] text-gray-400 mt-1">Upload your videos or pick from stock samples below!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="group relative bg-[#181a24] rounded-lg overflow-hidden border border-[#282a38] hover:border-purple-500/50 transition-all"
              >
                <div className="aspect-video bg-black/50 relative flex items-center justify-center overflow-hidden">
                  {asset.thumbnailUrl ? (
                    <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-full object-cover" />
                  ) : asset.type === 'video' ? (
                    <Video className="w-6 h-6 text-purple-400" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-emerald-400" />
                  )}

                  {/* Duration badge */}
                  {asset.duration && (
                    <span className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-300">
                      {Math.round(asset.duration)}s
                    </span>
                  )}

                  {/* Hover action overlay */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                    <button
                      onClick={() => handleAddToTimeline(asset)}
                      className="p-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow"
                      title="Add to Timeline"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeMediaAsset(asset.id)}
                      className="p-1.5 rounded-full bg-red-600/80 hover:bg-red-500 text-white shadow"
                      title="Delete asset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-1.5">
                  <p className="text-[11px] font-medium text-gray-200 truncate" title={asset.name}>
                    {asset.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stock Video Clips */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Stock Video Library
          </span>
        </div>

        <div className="space-y-2">
          {STOCK_VIDEOS_METADATA.map((stock) => {
            const Icon = ICON_MAP[stock.iconName] || Video;
            const isThisGenerating = isGenerating === stock.id;
            return (
              <div
                key={stock.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#161720] border border-[#232532] hover:border-purple-500/40 transition-all"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stock.thumbnailColor} flex items-center justify-center shrink-0 shadow`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-semibold text-gray-200 truncate">{stock.name}</h4>
                    <p className="text-[10px] text-gray-400 truncate">{stock.description}</p>
                  </div>
                </div>

                <button
                  disabled={isThisGenerating}
                  onClick={() => handleAddStockVideo(stock)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#252838] hover:bg-purple-600 text-white text-xs font-medium flex items-center gap-1 shrink-0 transition-colors disabled:opacity-50"
                  title="Generate & Add to Timeline"
                >
                  {isThisGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

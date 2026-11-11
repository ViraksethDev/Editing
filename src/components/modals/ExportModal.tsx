import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { exportEngine } from '../../services/exportService';
import confetti from 'canvas-confetti';
import { 
  X, 
  Download, 
  CheckCircle2, 
  Loader2, 
  Film, 
  Settings2, 
  AlertCircle,
  Play
} from 'lucide-react';
import { AspectRatio, Resolution } from '../../types/editor';

export const ExportModal: React.FC = () => {
  const {
    isExportModalOpen,
    closeExportModal,
    project,
    exportSettings,
    setExportSettings,
    exportProgress,
    setExportProgress
  } = useEditorStore();

  const [hasExported, setHasExported] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState('');

  if (!isExportModalOpen || !project) return null;

  const handleStartExport = async () => {
    setHasExported(false);
    setDownloadUrl(null);

    try {
      const blob = await exportEngine.exportVideo(project, exportSettings, (progress) => {
        setExportProgress(progress);
        if (progress.outputBlobUrl) {
          setDownloadUrl(progress.outputBlobUrl);
          setDownloadFileName(progress.fileName || 'edited_reel.mp4');
          setHasExported(true);
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      });
    } catch (err: any) {
      if (err.message !== 'Export cancelled by user') {
        console.error('Export error:', err);
        setExportProgress({
          isExporting: false,
          stage: 'Export failed: ' + (err.message || 'Unknown error'),
          error: err.message
        });
      }
    }
  };

  const handleCancelExport = () => {
    exportEngine.cancel();
    setExportProgress({ isExporting: false, stage: 'Cancelled by user' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg bg-[#14161f] border border-[#27293a] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#252838] flex items-center justify-between bg-[#171924]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Export Video</h2>
              <p className="text-[11px] text-gray-400">Render and download your final composition</p>
            </div>
          </div>

          <button
            onClick={closeExportModal}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#252838] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {!exportProgress.isExporting && !hasExported ? (
            <div className="space-y-4 text-xs">
              {/* Aspect Ratio */}
              <div>
                <label className="text-gray-300 font-semibold block mb-1.5">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['9:16', '16:9', '1:1', '4:5'] as AspectRatio[]).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setExportSettings({ aspectRatio: ratio })}
                      className={`py-2 rounded-lg font-bold border transition-all ${
                        exportSettings.aspectRatio === ratio
                          ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                          : 'bg-[#1b1d28] text-gray-400 border-[#2a2d3c] hover:bg-[#222533]'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution */}
              <div>
                <label className="text-gray-300 font-semibold block mb-1.5">
                  Resolution
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['480p', '720p', '1080p'] as Resolution[]).map((res) => (
                    <button
                      key={res}
                      onClick={() => setExportSettings({ resolution: res })}
                      className={`py-2 rounded-lg font-bold border transition-all ${
                        exportSettings.resolution === res
                          ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                          : 'bg-[#1b1d28] text-gray-400 border-[#2a2d3c] hover:bg-[#222533]'
                      }`}
                    >
                      {res} {res === '1080p' ? '(FHD)' : res === '720p' ? '(HD)' : '(SD)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame Rate & Format */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1.5">
                    Frame Rate
                  </label>
                  <select
                    value={exportSettings.frameRate}
                    onChange={(e) => setExportSettings({ frameRate: parseInt(e.target.value) as any })}
                    className="w-full bg-[#1b1d28] text-white p-2 rounded-lg border border-[#2a2d3c] text-xs font-medium focus:border-purple-500 focus:outline-none"
                  >
                    <option value={24}>24 FPS (Cinematic)</option>
                    <option value={30}>30 FPS (Standard)</option>
                    <option value={60}>60 FPS (Ultra Smooth)</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1.5">
                    Format
                  </label>
                  <select
                    value={exportSettings.format}
                    onChange={(e) => setExportSettings({ format: e.target.value as any })}
                    className="w-full bg-[#1b1d28] text-white p-2 rounded-lg border border-[#2a2d3c] text-xs font-medium focus:border-purple-500 focus:outline-none"
                  >
                    <option value="mp4">MP4 (H.264 / AAC)</option>
                    <option value="webm">WebM (VP9 / Opus)</option>
                  </select>
                </div>
              </div>

              {/* Quality Preset */}
              <div>
                <label className="text-gray-300 font-semibold block mb-1.5">
                  Export Quality Bitrate
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['standard', 'high', 'ultra'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setExportSettings({ quality: q })}
                      className={`py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                        exportSettings.quality === q
                          ? 'bg-purple-600/20 text-purple-300 border-purple-500'
                          : 'bg-[#1b1d28] text-gray-400 border-[#2a2d3c] hover:bg-[#222533]'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : exportProgress.isExporting ? (
            /* Progress State */
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <Loader2 className="w-16 h-16 text-purple-500 animate-spin" />
                <span className="absolute font-mono text-xs font-bold text-white">
                  {exportProgress.progress}%
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Rendering Composition...</h4>
                <p className="text-xs text-purple-300 font-mono">{exportProgress.stage}</p>
                <p className="text-[11px] text-gray-400">
                  Frame {exportProgress.currentFrame} / {exportProgress.totalFrames}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#202230] h-2 rounded-full overflow-hidden border border-[#2e3144]">
                <div
                  style={{ width: `${exportProgress.progress}%` }}
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 h-full transition-all duration-200"
                />
              </div>

              <button
                onClick={handleCancelExport}
                className="px-4 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white text-xs font-semibold transition-colors"
              >
                Cancel Export
              </button>
            </div>
          ) : (
            /* Completed Success State */
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Video Rendered Successfully!</h4>
                <p className="text-xs text-gray-400">Your video is ready to save to your device.</p>
              </div>

              {/* Video preview player */}
              {downloadUrl && (
                <div className="w-48 aspect-[9/16] rounded-xl overflow-hidden bg-black border border-[#2d3040] shadow-md relative">
                  <video
                    src={downloadUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Direct Download button */}
              <a
                href={downloadUrl || '#'}
                download={downloadFileName}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Video ({downloadFileName})</span>
              </a>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!exportProgress.isExporting && !hasExported && (
          <div className="px-5 py-3 border-t border-[#252838] bg-[#161722] flex items-center justify-end gap-2">
            <button
              onClick={closeExportModal}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-300 hover:bg-[#20222e] transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleStartExport}
              className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 shadow-lg shadow-pink-600/25 flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Start Export</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Categoric AI - Video Detail Inspector Modal
 */
import React from 'react';
import {
  X,
  Download,
  Share2,
  RefreshCw,
  ArrowRight,
  Camera,
  Eye,
  Film,
  Sparkles,
  Clock,
  Coins
} from 'lucide-react';
import { GenerationJob } from '../../types.js';

interface VideoDetailModalProps {
  job: GenerationJob | null;
  isOpen: boolean;
  onClose: () => void;
  onExtend: (jobId: string) => void;
  onRegenerate: (prompt: string) => void;
  onOpenShareModal: (job: GenerationJob) => void;
}

export const VideoDetailModal: React.FC<VideoDetailModalProps> = ({
  job,
  isOpen,
  onClose,
  onExtend,
  onRegenerate,
  onOpenShareModal
}) => {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-4xl bg-[#0e1017] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-zinc-400 hover:text-white bg-black/60 backdrop-blur-sm"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Video Player Column */}
        <div className="flex-1 bg-black flex items-center justify-center p-4 min-h-[320px]">
          {job.output?.video_url ? (
            <video
              src={job.output.video_url}
              controls
              autoPlay
              loop
              className="max-h-[480px] w-full object-contain rounded-xl"
            />
          ) : (
            <div className="text-center text-zinc-500">
              <Film className="w-8 h-8 mx-auto mb-2" />
              <p className="text-xs">Video is {job.status.toLowerCase()}</p>
            </div>
          )}
        </div>

        {/* Metadata & Directorial Specs Column */}
        <div className="w-full md:w-80 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10 space-y-4 overflow-y-auto">
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono uppercase text-blue-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Google {job.model_id.replace('_', ' ')}</span>
              </div>
              <h3 className="text-sm font-semibold text-white leading-snug">Scene Specifications</h3>
            </div>

            {/* Prompt */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Prompt</label>
              <p className="text-zinc-200 leading-relaxed italic bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
                "{job.prompt}"
              </p>
            </div>

            {/* Directorial Specs Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                <span className="text-zinc-500 block text-[9px] uppercase">Resolution</span>
                <span className="text-zinc-200 font-mono font-semibold">{job.resolution}</span>
              </div>
              <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                <span className="text-zinc-500 block text-[9px] uppercase">Ratio</span>
                <span className="text-zinc-200 font-mono font-semibold">{job.aspect_ratio}</span>
              </div>
              <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                <span className="text-zinc-500 block text-[9px] uppercase">Camera</span>
                <span className="text-zinc-200">{job.camera_movement || 'Cinematic'}</span>
              </div>
              <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                <span className="text-zinc-500 block text-[9px] uppercase">Cost</span>
                <span className="text-amber-400 font-mono font-bold">{job.credits_cost} cr</span>
              </div>
            </div>

            <div className="text-[10px] text-zinc-500">
              Created: {new Date(job.created_at).toLocaleString()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-3 border-t border-white/5 text-xs">
            {job.output?.video_url && (
              <a
                href={job.output.video_url}
                download={`categoric_${job.id}.mp4`}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download MP4</span>
              </a>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onClose();
                  onRegenerate(job.prompt);
                }}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-create</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenShareModal(job);
                }}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>

            <button
              onClick={() => {
                onClose();
                onExtend(job.id);
              }}
              className="w-full py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-medium flex items-center justify-center gap-1.5 transition-all"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Extend Scene by 7s</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

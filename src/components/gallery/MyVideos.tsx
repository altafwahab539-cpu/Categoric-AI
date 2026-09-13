/**
 * Categoric AI - Video Gallery & Creation History
 */
import React, { useState, useEffect } from 'react';
import {
  Film,
  Search,
  Filter,
  Play,
  Share2,
  Star,
  Download,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Video,
  PlusCircle,
  ArrowRight
} from 'lucide-react';
import { GenerationJob } from '../../types.js';
import { apiRequest } from '../../lib/api.js';

interface MyVideosProps {
  onSelectVideo: (job: GenerationJob) => void;
  onOpenShareModal: (job: GenerationJob) => void;
  onGoToStudio: () => void;
}

export const MyVideos: React.FC<MyVideosProps> = ({
  onSelectVideo,
  onOpenShareModal,
  onGoToStudio
}) => {
  const [videos, setVideos] = useState<GenerationJob[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchVideos = async () => {
    try {
      let endpoint = '/api/videos?limit=50';
      if (statusFilter !== 'ALL') endpoint += `&status=${statusFilter}`;
      if (searchQuery.trim()) endpoint += `&search=${encodeURIComponent(searchQuery)}`;

      const data = await apiRequest<{ videos: GenerationJob[] }>(endpoint);
      setVideos(data.videos || []);
    } catch (err) {
      console.warn('Failed to fetch videos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
    const interval = setInterval(fetchVideos, 6000);
    return () => clearInterval(interval);
  }, [statusFilter, searchQuery]);

  const toggleFavorite = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await apiRequest<{ isFavorite: boolean }>(`/api/videos/${jobId}/favorite`, {
        method: 'POST'
      });
      setVideos(videos.map(v => v.id === jobId ? { ...v, isFavorite: res.isFavorite } : v));
    } catch (err) {
      console.warn(err);
    }
  };

  const deleteVideo = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this generation?')) return;
    try {
      await apiRequest(`/api/videos/${jobId}`, { method: 'DELETE' });
      setVideos(videos.filter(v => v.id !== jobId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete video.');
    }
  };

  return (
    <div id="my-videos-view" className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0e1017] border border-white/10 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
            <Film className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Video Library</h2>
            <p className="text-xs text-zinc-400">All your creations rendered with Google Veo 3.1</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts..."
              className="w-full bg-[#141824] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#141824] border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PROCESSING">Rendering</option>
            <option value="QUEUED">Queued</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Grid of Videos */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-500">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-xs">Loading generation library...</span>
        </div>
      ) : videos.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-zinc-500">
            <Video className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">No videos generated yet</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Start by typing your first prompt in the Video Studio to generate high-fidelity Veo 3.1 video.
            </p>
          </div>
          <button
            onClick={onGoToStudio}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create First Video</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((video) => {
            const isCompleted = video.status === 'COMPLETED' && video.output?.video_url;
            const isProcessing = video.status === 'PROCESSING' || video.status === 'QUEUED';
            const isFailed = video.status === 'FAILED';

            return (
              <div
                key={video.id}
                onClick={() => onSelectVideo(video)}
                className="bg-[#0e1017] border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all cursor-pointer group shadow-lg flex flex-col justify-between"
              >
                {/* Visual Preview / Thumbnail / State */}
                <div className="relative aspect-video bg-black/80 flex items-center justify-center overflow-hidden">
                  {isCompleted ? (
                    <video
                      src={video.output?.video_url}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      muted
                      loop
                      onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                      onMouseLeave={(e) => {
                        const v = e.target as HTMLVideoElement;
                        v.pause();
                        v.currentTime = 0;
                      }}
                    />
                  ) : isProcessing ? (
                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                      <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                      <span className="text-xs font-medium text-blue-300">Rendering Scene...</span>
                      <span className="text-[10px] text-zinc-500">Veo 3.1 Neural Engine</span>
                    </div>
                  ) : isFailed ? (
                    <div className="flex flex-col items-center gap-2 p-4 text-center text-red-400">
                      <AlertCircle className="w-6 h-6" />
                      <span className="text-xs font-medium">Generation Failed</span>
                      <span className="text-[10px] text-zinc-400">Credits refunded</span>
                    </div>
                  ) : (
                    <Clock className="w-6 h-6 text-zinc-500" />
                  )}

                  {/* Badges on preview */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-zinc-300 border border-white/10 uppercase">
                      {video.resolution}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-zinc-400 border border-white/10">
                      {video.aspect_ratio}
                    </span>
                  </div>

                  {/* Favorite & Quick Share Buttons */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => toggleFavorite(video.id, e)}
                      className={`p-1.5 rounded-lg backdrop-blur-md border ${
                        video.isFavorite
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                          : 'bg-black/70 border-white/10 text-zinc-300 hover:text-white'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                    {isCompleted && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenShareModal(video);
                        }}
                        className="p-1.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-zinc-300 hover:text-white"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Content & Details */}
                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-zinc-200 line-clamp-2 leading-relaxed font-medium">
                      {video.prompt}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <span className="capitalize text-zinc-400 font-mono text-[10px]">
                        {video.model_id.replace('_', ' ')}
                      </span>
                      <span>•</span>
                      <span>{new Date(video.created_at).toLocaleDateString()}</span>
                    </div>

                    <button
                      onClick={(e) => deleteVideo(video.id, e)}
                      className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                      title="Delete video"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * Categoric AI - Starred / Favorite Videos
 */
import React, { useState, useEffect } from 'react';
import { Star, Film, Play, Share2, Trash2 } from 'lucide-react';
import { GenerationJob } from '../../types.js';
import { apiRequest } from '../../lib/api.js';

interface FavoritesViewProps {
  onSelectVideo: (job: GenerationJob) => void;
  onOpenShareModal: (job: GenerationJob) => void;
  onGoToStudio: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  onSelectVideo,
  onOpenShareModal,
  onGoToStudio
}) => {
  const [favorites, setFavorites] = useState<GenerationJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      const data = await apiRequest<{ videos: GenerationJob[] }>('/api/videos?favoritesOnly=true');
      setFavorites(data.videos || []);
    } catch (err) {
      console.warn(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const removeFavorite = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiRequest(`/api/videos/${jobId}/favorite`, { method: 'POST' });
      setFavorites(favorites.filter((f) => f.id !== jobId));
    } catch (err) {
      console.warn(err);
    }
  };

  return (
    <div id="favorites-view" className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center gap-2.5 bg-[#0e1017] border border-white/10 p-4 rounded-2xl shadow-xl">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">Favorite Videos</h2>
          <p className="text-xs text-zinc-400">Your bookmarked generations for quick reference & export</p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 space-y-3">
          <Star className="w-8 h-8 mx-auto text-zinc-600" />
          <p className="text-xs">No favorites saved yet. Star any video in your library or studio canvas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {favorites.map((video) => (
            <div
              key={video.id}
              onClick={() => onSelectVideo(video)}
              className="bg-[#0e1017] border border-white/10 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all cursor-pointer group shadow-lg"
            >
              <div className="relative aspect-video bg-black flex items-center justify-center">
                {video.output?.video_url ? (
                  <video
                    src={video.output.video_url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                    onMouseLeave={(e) => {
                      const v = e.target as HTMLVideoElement;
                      v.pause();
                      v.currentTime = 0;
                    }}
                  />
                ) : (
                  <Film className="w-6 h-6 text-zinc-600" />
                )}

                <button
                  onClick={(e) => removeFavorite(video.id, e)}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/70 border border-amber-500/40 text-amber-400"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                </button>
              </div>

              <div className="p-3.5">
                <p className="text-xs text-zinc-200 line-clamp-2 leading-relaxed font-medium">
                  {video.prompt}
                </p>
                <div className="mt-2 text-[11px] text-zinc-500 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase">{video.resolution} • {video.aspect_ratio}</span>
                  <span>{new Date(video.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

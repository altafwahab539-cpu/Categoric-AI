/**
 * Categoric AI - Video Player & Live Generation Stage Canvas
 */
import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Share2,
  Maximize2,
  Volume2,
  VolumeX,
  Star,
  Sparkles,
  Zap,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { GenerationJob } from '../../types.js';

interface WorkspacePreviewProps {
  currentJob: GenerationJob | null;
  activeVideoUrl: string | null;
  isGenerating: boolean;
  onExtend: (jobId: string) => void;
  onRegenerate: (prompt: string) => void;
  onOpenShareModal: (job: GenerationJob) => void;
  onToggleFavorite: (jobId: string) => void;
  isFavorite?: boolean;
}

export const WorkspacePreview: React.FC<WorkspacePreviewProps> = ({
  currentJob,
  activeVideoUrl,
  isGenerating,
  onExtend,
  onRegenerate,
  onOpenShareModal,
  onToggleFavorite,
  isFavorite
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(true);

  // Sync player events
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSpeedChange = () => {
    const rates = [1, 1.25, 1.5, 0.75];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (timeInSec: number) => {
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div id="workspace-preview-panel" className="flex-1 flex flex-col bg-[#0b0d13] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative min-h-[480px]">
      {/* Top Video Header */}
      <div className="h-12 px-4 border-b border-white/5 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-xs font-semibold text-zinc-300 truncate max-w-sm">
            {currentJob?.prompt ? currentJob.prompt.slice(0, 50) + '...' : 'Studio Canvas'}
          </span>
        </div>

        {currentJob && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-white/5 border border-white/10 text-zinc-300 uppercase">
              {currentJob.model_id.replace('_', ' ')}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-blue-500/10 border border-blue-500/20 text-blue-400">
              {currentJob.resolution}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-white/5 border border-white/10 text-zinc-400">
              {currentJob.aspect_ratio}
            </span>
          </div>
        )}
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex items-center justify-center p-4 relative bg-radial from-blue-950/10 to-transparent">
        {/* State A: Generation in Progress */}
        {isGenerating || (currentJob && (currentJob.status === 'QUEUED' || currentJob.status === 'PROCESSING')) ? (
          <div className="flex flex-col items-center justify-center max-w-md w-full p-8 rounded-2xl bg-black/60 border border-blue-500/30 backdrop-blur-xl shadow-2xl text-center space-y-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center animate-pulse">
                <Zap className="w-8 h-8 text-blue-400 fill-blue-400 animate-bounce" />
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 opacity-20 blur-lg animate-pulse" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">
                {currentJob?.status === 'QUEUED' ? 'Queued in Veo 3.1 Pipeline...' : 'Generating Cinematic Video...'}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                Synthesizing physical light, photorealistic textures, and spatial audio with Google Veo.
              </p>
            </div>

            {/* Asynchronous Stage Steps */}
            <div className="w-full space-y-2 text-left text-xs bg-white/[0.02] border border-white/5 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-blue-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Validating prompts & credit reservation</span>
              </div>
              <div className="flex items-center gap-2 text-blue-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Veo 3.1 Neural Rendering Engine active</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500">
                <Clock className="w-3.5 h-3.5" />
                <span>Audio environment & acoustic mastering</span>
              </div>
            </div>

            <div className="text-[11px] text-zinc-500 font-mono">
              Job ID: {currentJob?.id.slice(0, 8)} • Non-blocking queue
            </div>
          </div>
        ) : activeVideoUrl || (currentJob && currentJob.output?.video_url) ? (
          /* State B: Active Video Ready */
          <div className="relative w-full h-full flex flex-col items-center justify-center group">
            <video
              ref={videoRef}
              src={activeVideoUrl || currentJob?.output?.video_url}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => !isLooping && setIsPlaying(false)}
              loop={isLooping}
              muted={isMuted}
              playsInline
              className={`max-h-[520px] rounded-xl shadow-2xl border border-white/10 object-contain bg-black ${
                currentJob?.aspect_ratio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'
              }`}
            />

            {/* Floating Quick Action Overlay */}
            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {currentJob && (
                <>
                  <button
                    onClick={() => onToggleFavorite(currentJob.id)}
                    className={`p-2 rounded-lg backdrop-blur-md border transition-all ${
                      isFavorite
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : 'bg-black/60 border-white/15 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOpenShareModal(currentJob)}
                    className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/15 text-zinc-300 hover:text-white transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <a
                    href={activeVideoUrl || currentJob?.output?.video_url}
                    download={`categoric_video_${currentJob.id}.mp4`}
                    className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/15 text-zinc-300 hover:text-white transition-all"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </>
              )}
            </div>
          </div>
        ) : (
          /* State C: Idle Placeholder */
          <div className="flex flex-col items-center justify-center text-center p-8 max-w-sm space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-zinc-500">
              <Play className="w-6 h-6 ml-1" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">Categoric Studio Canvas</h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Type your prompt on the left, tune camera and lens controls, and click Generate to produce high-fidelity video.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-blue-400/80 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Native 720p, 1080p, and 4K Veo 3.1</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Video Player Control Bar */}
      {(activeVideoUrl || (currentJob && currentJob.output?.video_url)) && (
        <div className="p-3 border-t border-white/10 bg-black/60 backdrop-blur-md space-y-2">
          {/* Progress Seekbar */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-zinc-400 w-9">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.05}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-[10px] font-mono text-zinc-400 w-9">{formatTime(duration)}</span>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md transition-all"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                onClick={handleSpeedChange}
                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[11px] font-mono text-zinc-300"
              >
                {playbackRate}x
              </button>

              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`p-2 rounded-lg text-xs transition-colors ${
                  isLooping ? 'bg-blue-600/20 text-blue-400' : 'bg-white/5 text-zinc-500'
                }`}
                title="Toggle Loop"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Extended Action Controls */}
            {currentJob && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onRegenerate(currentJob.prompt)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerate</span>
                </button>

                <button
                  onClick={() => onExtend(currentJob.id)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium flex items-center gap-1.5 transition-all"
                  title="Extend video by 7 seconds with Veo"
                >
                  <ArrowRight className="w-3 h-3" />
                  <span>Extend Scene (+7s)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

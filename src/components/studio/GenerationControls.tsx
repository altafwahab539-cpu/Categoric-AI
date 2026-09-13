/**
 * Categoric AI - Generation Settings & Parameters
 */
import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  SlidersHorizontal,
  Video,
  Camera,
  Eye,
  FolderKanban,
  Clock,
  Maximize2
} from 'lucide-react';
import { apiRequest } from '../../lib/api.js';
import { Project } from '../../types.js';

interface GenerationControlsProps {
  modelId: string;
  setModelId: (m: string) => void;
  aspectRatio: '16:9' | '9:16';
  setAspectRatio: (ar: '16:9' | '9:16') => void;
  resolution: '720p' | '1080p' | '4k';
  setResolution: (r: '720p' | '1080p' | '4k') => void;
  durationSeconds: number;
  setDurationSeconds: (d: number) => void;
  cameraMovement: string;
  setCameraMovement: (c: string) => void;
  lens: string;
  setLens: (l: string) => void;
  visualStyle: string;
  setVisualStyle: (s: string) => void;
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
}

export const GenerationControls: React.FC<GenerationControlsProps> = ({
  modelId,
  setModelId,
  aspectRatio,
  setAspectRatio,
  resolution,
  setResolution,
  durationSeconds,
  setDurationSeconds,
  cameraMovement,
  setCameraMovement,
  lens,
  setLens,
  visualStyle,
  setVisualStyle,
  selectedProjectId,
  setSelectedProjectId
}) => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    apiRequest<{ projects: Project[] }>('/api/projects')
      .then((data) => setProjects(data.projects || []))
      .catch(() => {});
  }, []);

  const models = [
    {
      id: 'veo_3_1',
      name: 'Veo 3.1 Cinematic',
      badge: 'Premier',
      tag: 'Best Quality & Realism',
      credits: 40,
      icon: Sparkles
    },
    {
      id: 'veo_3_1_fast',
      name: 'Veo 3.1 Fast Turbo',
      badge: 'Speed',
      tag: 'Rapid Ideation',
      credits: 25,
      icon: Zap
    },
    {
      id: 'veo_3_1_lite',
      name: 'Veo 3.1 Lite',
      badge: 'Economy',
      tag: 'Cost Efficient',
      credits: 15,
      icon: Video
    }
  ];

  const cameraOptions = [
    'Handheld Natural',
    'Tracking Shot',
    'Dolly In Push',
    'Dolly Out Pull',
    'Orbit 360',
    'Low Angle Pan',
    'Drone Aerial',
    'Crane Boom Up',
    'Macro Close-up',
    'Static Locked-off'
  ];

  const lensOptions = [
    '24mm Wide Angle',
    '35mm Cinematic Anamorphic',
    '50mm Prime Natural',
    '85mm Portrait Bokeh',
    '100mm Macro Detail'
  ];

  const styleOptions = [
    'Ultra Realistic Cinematic',
    'Commercial Advertisement',
    'High-End Fashion & Luxury',
    'Documentary 35mm Film',
    'Neo-Noir & Cyberpunk',
    'Moody Golden Hour',
    'Hyper-Detailed 8K CGI'
  ];

  return (
    <div id="generation-controls-panel" className="bg-[#0e1017] border border-white/10 rounded-2xl p-4 space-y-4 shadow-xl text-xs">
      <div className="flex items-center gap-2 border-b border-white/5 pb-3">
        <SlidersHorizontal className="w-4 h-4 text-blue-400" />
        <span className="font-semibold uppercase tracking-wider text-zinc-300">Model & Directorial Settings</span>
      </div>

      {/* Model Selection */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-zinc-400 font-medium block">AI Video Model</label>
        <div className="space-y-1.5">
          {models.map((m) => {
            const isSelected = modelId === m.id;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                id={`model-btn-${m.id}`}
                onClick={() => setModelId(m.id)}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500/50 shadow-md shadow-blue-600/10'
                    : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/15'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-blue-500 text-white' : 'bg-white/10 text-zinc-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className={`font-semibold text-xs ${isSelected ? 'text-blue-300' : 'text-zinc-200'}`}>
                      {m.name}
                    </p>
                    <p className="text-[10px] text-zinc-500">{m.tag}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-mono font-bold text-amber-400">
                    {m.credits} cr
                  </span>
                  <p className="text-[9px] text-zinc-500">{m.badge}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Aspect Ratio & Resolution Grid */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Aspect Ratio */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-400 font-medium block">Aspect Ratio</label>
          <div className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setAspectRatio('16:9')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all ${
                aspectRatio === '16:9'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              16:9 (Landscape)
            </button>
            <button
              onClick={() => setAspectRatio('9:16')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all ${
                aspectRatio === '9:16'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              9:16 (Vertical)
            </button>
          </div>
        </div>

        {/* Resolution */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-400 font-medium block">Resolution</label>
          <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            {(['720p', '1080p', '4k'] as const).map((res) => (
              <button
                key={res}
                onClick={() => setResolution(res)}
                className={`py-1.5 px-1 rounded-lg text-[10px] font-mono font-semibold transition-all ${
                  resolution === res
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {res.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-zinc-400 font-medium flex items-center justify-between">
          <span>Clip Duration</span>
          <span className="font-mono text-zinc-300">{durationSeconds}s</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[4, 6, 8].map((sec) => (
            <button
              key={sec}
              onClick={() => setDurationSeconds(sec)}
              className={`py-1.5 rounded-lg border text-xs font-mono font-medium transition-all ${
                durationSeconds === sec
                  ? 'bg-indigo-600/25 border-indigo-500/50 text-indigo-300'
                  : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/5'
              }`}
            >
              {sec} seconds
            </button>
          ))}
        </div>
      </div>

      {/* Camera Movement */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-zinc-400 font-medium flex items-center gap-1.5">
          <Camera className="w-3 h-3 text-blue-400" />
          <span>Camera Trajectory</span>
        </label>
        <select
          value={cameraMovement}
          onChange={(e) => setCameraMovement(e.target.value)}
          className="w-full bg-[#141824] border border-white/10 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
        >
          {cameraOptions.map((opt) => (
            <option key={opt} value={opt} className="bg-[#12151f] text-zinc-200">
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Lens Optics */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-zinc-400 font-medium flex items-center gap-1.5">
          <Eye className="w-3 h-3 text-blue-400" />
          <span>Cinematic Lens</span>
        </label>
        <select
          value={lens}
          onChange={(e) => setLens(e.target.value)}
          className="w-full bg-[#141824] border border-white/10 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
        >
          {lensOptions.map((opt) => (
            <option key={opt} value={opt} className="bg-[#12151f] text-zinc-200">
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Visual Style Aesthetic */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-zinc-400 font-medium block">Visual Aesthetic</label>
        <select
          value={visualStyle}
          onChange={(e) => setVisualStyle(e.target.value)}
          className="w-full bg-[#141824] border border-white/10 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
        >
          {styleOptions.map((opt) => (
            <option key={opt} value={opt} className="bg-[#12151f] text-zinc-200">
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Project Folder Assignment */}
      <div className="space-y-1.5 pt-1">
        <label className="text-[10px] text-zinc-400 font-medium flex items-center gap-1.5">
          <FolderKanban className="w-3 h-3 text-blue-400" />
          <span>Assign to Project</span>
        </label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full bg-[#141824] border border-white/10 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
        >
          <option value="">Default (No Project)</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id} className="bg-[#12151f]">
              {p.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

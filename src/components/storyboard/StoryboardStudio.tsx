/**
 * Categoric AI - Multi-Scene Storyboard & AI Director Studio
 */
import React, { useState } from 'react';
import {
  Clapperboard,
  Sparkles,
  Play,
  Plus,
  Trash2,
  Clock,
  Camera,
  Volume2,
  Layers,
  ArrowRight,
  CheckCircle,
  Coins
} from 'lucide-react';
import { apiRequest } from '../../lib/api.js';
import { StoryboardScene } from '../../types.js';
import { useAuth } from '../../context/AuthContext.js';

interface StoryboardStudioProps {
  onGoToVideos: () => void;
}

export const StoryboardStudio: React.FC<StoryboardStudioProps> = ({ onGoToVideos }) => {
  const { wallet, refreshUserData } = useAuth();
  const [concept, setConcept] = useState('Create a 30-second commercial for a gourmet artisanal smash burger restaurant');
  const [isDirecting, setIsDirecting] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [consistencyRef, setConsistencyRef] = useState<string>('');

  const [scenes, setScenes] = useState<StoryboardScene[]>([
    {
      sceneNumber: 1,
      title: 'Establishing Exterior',
      prompt: 'Cinematic wide shot of a bustling nighttime gourmet burger diner with warm glowing neon signs, steam rising from ventilation, shallow depth of field, 35mm anamorphic lens.',
      camera: 'Dolly In',
      audio: 'Distant city traffic, soft upbeat jazz chords',
      duration: 6
    },
    {
      sceneNumber: 2,
      title: 'Sizzling Smash Patty',
      prompt: 'Slow motion macro extreme close-up of a premium beef patty sizzling on a roaring cast-iron flat top grill, melted sharp cheddar draping over caramelized edges, 100mm macro lens.',
      camera: 'Macro Push',
      audio: 'Crisp sizzle and crackle of searing meat',
      duration: 6
    },
    {
      sceneNumber: 3,
      title: 'The Assembly & Sauce Drip',
      prompt: 'High-speed tracking shot of toasted brioche bun landing atop crispy shredded lettuce, grilled onions, and glistening house secret truffle sauce dripping gently.',
      camera: 'Tracking Shot',
      audio: 'Soft tactile bun squish and gentle sauce drop',
      duration: 4
    },
    {
      sceneNumber: 4,
      title: 'First Satisfying Bite',
      prompt: 'Medium close-up of a young woman taking a passionate first bite of the towering gourmet burger, authentic joyful facial expression, warm studio backlight bokeh.',
      camera: 'Handheld Subtle',
      audio: 'Satisfying crunch and joyful culinary murmur',
      duration: 6
    }
  ]);

  const handleAskDirector = async () => {
    if (!concept.trim()) return;
    setIsDirecting(true);
    try {
      const data = await apiRequest<{ scenes: StoryboardScene[] }>('/api/storyboard/ai-director', {
        method: 'POST',
        body: JSON.stringify({ concept })
      });
      if (Array.isArray(data.scenes) && data.scenes.length > 0) {
        setScenes(data.scenes);
      }
    } catch (err: any) {
      alert(err.message || 'AI Director failed to generate storyboard.');
    } finally {
      setIsDirecting(false);
    }
  };

  const updateScene = (index: number, field: keyof StoryboardScene, value: any) => {
    const updated = [...scenes];
    updated[index] = { ...updated[index], [field]: value };
    setScenes(updated);
  };

  const removeScene = (index: number) => {
    if (scenes.length <= 1) return;
    setScenes(scenes.filter((_, i) => i !== index));
  };

  const addScene = () => {
    setScenes([
      ...scenes,
      {
        sceneNumber: scenes.length + 1,
        title: `Scene ${scenes.length + 1}`,
        prompt: 'Cinematic visual sequence with dynamic lighting and camera movement.',
        camera: 'Dolly In',
        audio: 'Ambient soundscape',
        duration: 6
      }
    ]);
  };

  const handleBatchGenerate = async () => {
    const totalCost = scenes.length * 40;
    if ((wallet?.balance || 0) < totalCost) {
      alert(`Insufficient credits for all scenes. Required: ${totalCost}, Balance: ${wallet?.balance || 0}`);
      return;
    }

    setIsBatchGenerating(true);
    try {
      await apiRequest('/api/storyboard/generate-all', {
        method: 'POST',
        body: JSON.stringify({
          scenes,
          consistencyReferenceUrl: consistencyRef || undefined,
          modelId: 'veo_3_1'
        })
      });
      await refreshUserData();
      alert(`Successfully queued all ${scenes.length} scenes in background!`);
      onGoToVideos();
    } catch (err: any) {
      alert(err.message || 'Failed to batch generate scenes.');
    } finally {
      setIsBatchGenerating(false);
    }
  };

  const totalDuration = scenes.reduce((acc, s) => acc + (s.duration || 6), 0);
  const totalCredits = scenes.length * 40;

  return (
    <div id="storyboard-studio-view" className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header & Concept Generator */}
      <div className="bg-[#0e1017] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
              <Clapperboard className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">AI Director & Multi-Scene Storyboard</h2>
              <p className="text-xs text-zinc-400">Generate coherent multi-shot commercial scripts with Google Veo 3.1</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <span className="text-zinc-400">Total Duration: </span>
              <span className="font-mono font-bold text-blue-400">{totalDuration}s</span>
            </div>
            <div className="text-right text-xs">
              <span className="text-zinc-400">Batch Cost: </span>
              <span className="font-mono font-bold text-amber-400">{totalCredits} cr</span>
            </div>
          </div>
        </div>

        {/* Director Prompt Box */}
        <div className="space-y-2">
          <label className="text-xs text-zinc-300 font-medium">Commercial Brief or Video Concept:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="e.g. A 30-second high-energy luxury watch launch commercial..."
              className="flex-1 bg-[#141824] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleAskDirector}
              disabled={isDirecting}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shrink-0 transition-all shadow-md shadow-indigo-600/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isDirecting ? 'Director Scripting...' : 'Ask AI Director'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scene Timeline Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Shot Breakdown ({scenes.length} Scenes)
          </h3>
          <button
            onClick={addScene}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5 font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Shot</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenes.map((scene, idx) => (
            <div
              key={idx}
              className="bg-[#0e1017] border border-white/10 rounded-xl p-4 space-y-3 relative group hover:border-blue-500/40 transition-colors text-xs"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 font-mono font-bold flex items-center justify-center text-[11px]">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={scene.title}
                    onChange={(e) => updateScene(idx, 'title', e.target.value)}
                    className="font-semibold text-zinc-200 bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-400">{scene.duration}s</span>
                  {scenes.length > 1 && (
                    <button
                      onClick={() => removeScene(idx)}
                      className="text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Prompt Textarea */}
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Veo 3.1 Scene Prompt:</label>
                <textarea
                  rows={3}
                  value={scene.prompt}
                  onChange={(e) => updateScene(idx, 'prompt', e.target.value)}
                  className="w-full bg-[#141824] border border-white/10 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>

              {/* Scene Settings */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 bg-white/[0.02] p-1.5 rounded-lg border border-white/5">
                  <Camera className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <input
                    type="text"
                    value={scene.camera}
                    onChange={(e) => updateScene(idx, 'camera', e.target.value)}
                    placeholder="Camera motion"
                    className="w-full bg-transparent border-none text-zinc-300 focus:outline-none text-[11px]"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-white/[0.02] p-1.5 rounded-lg border border-white/5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <input
                    type="text"
                    value={scene.audio}
                    onChange={(e) => updateScene(idx, 'audio', e.target.value)}
                    placeholder="Audio foley"
                    className="w-full bg-transparent border-none text-zinc-300 focus:outline-none text-[11px]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Batch Action Bar */}
      <div className="p-4 rounded-2xl bg-[#0b0d13] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Coins className="w-5 h-5 text-amber-400" />
          <div>
            <p className="text-xs text-zinc-200 font-semibold">
              Queue Full Production ({scenes.length} Scenes • {totalDuration}s)
            </p>
            <p className="text-[11px] text-zinc-500">
              Each scene is rendered asynchronously through Google Veo 3.1.
            </p>
          </div>
        </div>

        <button
          onClick={handleBatchGenerate}
          disabled={isBatchGenerating}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Clapperboard className="w-4 h-4" />
          <span>{isBatchGenerating ? 'Submitting Batch to Veo...' : `Generate All Scenes (${totalCredits} cr)`}</span>
        </button>
      </div>
    </div>
  );
};

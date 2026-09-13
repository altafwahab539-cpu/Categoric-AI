/**
 * Categoric AI - Prompt Editor & Intelligence Layer
 */
import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  Image as ImageIcon,
  Layers,
  HelpCircle,
  X,
  Upload,
  ArrowRightLeft,
  Volume2,
  Camera,
  Film
} from 'lucide-react';
import { apiRequest } from '../../lib/api.js';

interface PromptEditorProps {
  prompt: string;
  setPrompt: (p: string) => void;
  enhancedPrompt: string;
  setEnhancedPrompt: (p: string) => void;
  negativePrompt: string;
  setNegativePrompt: (p: string) => void;
  inputImageUrl: string;
  setInputImageUrl: (url: string) => void;
  endImageUrl: string;
  setEndImageUrl: (url: string) => void;
  referenceImages: string[];
  setReferenceImages: (imgs: string[]) => void;
  audioDescription: string;
  setAudioDescription: (a: string) => void;
  dialogue: string;
  setDialogue: (d: string) => void;
  cameraMovement: string;
  setCameraMovement: (c: string) => void;
  lens: string;
  setLens: (l: string) => void;
  visualStyle: string;
  setVisualStyle: (s: string) => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  prompt,
  setPrompt,
  enhancedPrompt,
  setEnhancedPrompt,
  negativePrompt,
  setNegativePrompt,
  inputImageUrl,
  setInputImageUrl,
  endImageUrl,
  setEndImageUrl,
  referenceImages,
  setReferenceImages,
  audioDescription,
  setAudioDescription,
  dialogue,
  setDialogue,
  cameraMovement,
  setCameraMovement,
  lens,
  setLens,
  visualStyle,
  setVisualStyle
}) => {
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showImageUploads, setShowImageUploads] = useState(false);

  // Advanced fields
  const [subject, setSubject] = useState('');
  const [action, setAction] = useState('');
  const [environment, setEnvironment] = useState('');
  const [lighting, setLighting] = useState('Golden hour warm sunlight');
  const [composition, setComposition] = useState('Cinematic Rule of Thirds');

  const presetChips = [
    { label: 'Lahore Bazaar', text: 'Ultra-realistic handheld tracking shot of a young man walking through an authentic Lahore marketplace at golden hour, vibrant silk textiles, shallow depth of field, warm ambient sun.' },
    { label: 'Burger Commercial', text: 'Slow motion macro hero shot of a double smash burger being stacked, steam rising, glistening melted cheddar cheese, 100mm macro lens, studio rim lighting.' },
    { label: 'Cyberpunk Tokyo', text: 'Cinematic rainy night in Neo-Tokyo, neon reflections in puddles, steam rising from ramen stall, anamorphic lens flare, volumetric blue and violet street lighting.' },
    { label: 'Luxury Chrono Watch', text: 'Precision macro orbit around an intricate automatic tourbillon wristwatch mechanism, titanium brushed metal textures, dramatic studio lighting, 8k optics.' }
  ];

  const handleEnhance = async () => {
    if (!prompt.trim() && !subject.trim()) return;
    setIsEnhancing(true);
    try {
      const data = await apiRequest<{
        enhancedPrompt: string;
        suggestedCamera: string;
        suggestedLighting: string;
        suggestedAudio: string;
      }>('/api/videos/enhance-prompt', {
        method: 'POST',
        body: JSON.stringify({
          rawPrompt: prompt,
          subject,
          action,
          environment,
          lighting,
          camera: cameraMovement,
          lens,
          composition,
          visualStyle,
          audio: audioDescription,
          dialogue,
          negativeInstructions: negativePrompt
        })
      });

      setEnhancedPrompt(data.enhancedPrompt);
      if (data.suggestedCamera) setCameraMovement(data.suggestedCamera);
      if (data.suggestedAudio) setAudioDescription(data.suggestedAudio);
    } catch (err: any) {
      alert(err.message || 'Prompt enhancement failed.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'start' | 'end' | 'ref') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (target === 'start') {
        setInputImageUrl(result);
      } else if (target === 'end') {
        setEndImageUrl(result);
      } else if (target === 'ref') {
        if (referenceImages.length < 3) {
          setReferenceImages([...referenceImages, result]);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div id="prompt-editor-panel" className="bg-[#0e1017] border border-white/10 rounded-2xl p-4 flex flex-col gap-4 shadow-xl">
      {/* Top Selector: Simple vs Advanced */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Prompt Studio</span>
        </div>

        <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/10">
          <button
            id="prompt-mode-simple"
            onClick={() => setMode('simple')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              mode === 'simple' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Direct Prompt
          </button>
          <button
            id="prompt-mode-advanced"
            onClick={() => setMode('advanced')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
              mode === 'advanced' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>Structured</span>
          </button>
        </div>
      </div>

      {/* Preset Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[10px] text-zinc-500 shrink-0 font-medium">Inspiration:</span>
        {presetChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => setPrompt(chip.text)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/5 whitespace-nowrap transition-colors"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Simple Textarea */}
      {mode === 'simple' ? (
        <div className="space-y-2">
          <div className="relative">
            <textarea
              id="prompt-input"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your scene in natural language (e.g., A cinematic drone shot over a misty coastal highway at sunrise, 35mm lens, atmospheric ambient sound...)"
              className="w-full bg-[#141824] border border-white/10 rounded-xl p-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/50 resize-none transition-all leading-relaxed"
            />
            {prompt && (
              <button
                onClick={() => setPrompt('')}
                className="absolute top-2.5 right-2.5 p-1 rounded-md text-zinc-500 hover:text-zinc-300 bg-white/5 hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Advanced Structured Fields */
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-zinc-400 font-medium block mb-1">Subject / Character</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Young South Asian man, robot, watch..."
                className="w-full bg-[#141824] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 font-medium block mb-1">Action / Motion</label>
              <input
                type="text"
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="Walking naturally, sipping coffee, accelerating..."
                className="w-full bg-[#141824] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-zinc-400 font-medium block mb-1">Environment / Location</label>
              <input
                type="text"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                placeholder="Lahore Anarkali bazaar, rainy street, laboratory..."
                className="w-full bg-[#141824] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 font-medium block mb-1">Lighting Atmosphere</label>
              <input
                type="text"
                value={lighting}
                onChange={(e) => setLighting(e.target.value)}
                placeholder="Golden hour, studio rim light, moody neon..."
                className="w-full bg-[#141824] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-zinc-400 font-medium block mb-1">Composition Framing</label>
              <input
                type="text"
                value={composition}
                onChange={(e) => setComposition(e.target.value)}
                placeholder="Rule of thirds, centered symmetric, low angle..."
                className="w-full bg-[#141824] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 font-medium block mb-1">Dialogue / Spoken Words</label>
              <input
                type="text"
                value={dialogue}
                onChange={(e) => setDialogue(e.target.value)}
                placeholder='Optional dialogue: "Welcome to Categoric"'
                className="w-full bg-[#141824] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Gemini AI Prompt Enhancer Action Button */}
      <div className="flex items-center gap-2">
        <button
          id="btn-enhance-prompt"
          onClick={handleEnhance}
          disabled={isEnhancing || (!prompt.trim() && !subject.trim())}
          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            isEnhancing
              ? 'bg-blue-600/30 border-blue-500/40 text-blue-300 animate-pulse'
              : 'bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-violet-600/20 hover:from-blue-600/30 hover:to-violet-600/30 border-blue-500/30 text-blue-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>{isEnhancing ? 'Gemini 3.8 Enhancing Prompt...' : 'Enhance with Gemini 3.8 AI'}</span>
        </button>

        <button
          onClick={() => setShowImageUploads(!showImageUploads)}
          className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
            showImageUploads || inputImageUrl || endImageUrl || referenceImages.length > 0
              ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
              : 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200'
          }`}
          title="Attach Starting/Ending frames or Consistency references"
        >
          <ImageIcon className="w-4 h-4" />
          <span className="text-[11px] hidden sm:inline">Assets ({referenceImages.length + (inputImageUrl ? 1 : 0) + (endImageUrl ? 1 : 0)})</span>
        </button>
      </div>

      {/* Enhanced Prompt Display Card (If generated) */}
      {enhancedPrompt && (
        <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-blue-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Veo 3.1 Optimized Prompt:
            </span>
            <button
              onClick={() => {
                setPrompt(enhancedPrompt);
                setEnhancedPrompt('');
              }}
              className="text-[10px] text-blue-400 hover:underline"
            >
              Use As Main
            </button>
          </div>
          <p className="text-zinc-300 text-[11px] leading-relaxed italic">{enhancedPrompt}</p>
        </div>
      )}

      {/* Image & Asset Controls Accordion */}
      {showImageUploads && (
        <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-3 text-xs">
          <div className="text-[11px] font-semibold text-zinc-300 flex items-center justify-between">
            <span>Visual Anchors & Consistency</span>
            <span className="text-[10px] text-zinc-500">Veo 3.1 Multimodal</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Start Frame (Image to Video) */}
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 block font-medium">Starting Frame (Image-to-Video)</label>
              {inputImageUrl ? (
                <div className="relative group rounded-lg overflow-hidden border border-blue-500/40 aspect-video bg-black flex items-center justify-center">
                  <img src={inputImageUrl} alt="Start frame" className="object-cover w-full h-full" />
                  <button
                    onClick={() => setInputImageUrl('')}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-zinc-300 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="border border-dashed border-white/15 hover:border-blue-500/50 rounded-lg p-3 text-center flex flex-col items-center justify-center gap-1 cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all aspect-video">
                  <Upload className="w-4 h-4 text-zinc-400" />
                  <span className="text-[10px] text-zinc-400">Upload Start Frame</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'start')}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* End Frame (Interpolation) */}
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 block font-medium">Ending Frame (Interpolate)</label>
              {endImageUrl ? (
                <div className="relative group rounded-lg overflow-hidden border border-blue-500/40 aspect-video bg-black flex items-center justify-center">
                  <img src={endImageUrl} alt="End frame" className="object-cover w-full h-full" />
                  <button
                    onClick={() => setEndImageUrl('')}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-zinc-300 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="border border-dashed border-white/15 hover:border-blue-500/50 rounded-lg p-3 text-center flex flex-col items-center justify-center gap-1 cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all aspect-video">
                  <ArrowRightLeft className="w-4 h-4 text-zinc-400" />
                  <span className="text-[10px] text-zinc-400">Upload Last Frame</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'end')}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Reference Images (Up to 3) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-zinc-400 font-medium">Character / Product References (Max 3)</label>
              <span className="text-[10px] text-zinc-500">{referenceImages.length}/3</span>
            </div>

            <div className="flex items-center gap-2">
              {referenceImages.map((img, i) => (
                <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/20 bg-black">
                  <img src={img} alt="Ref" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setReferenceImages(referenceImages.filter((_, idx) => idx !== i))}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/80 text-white"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}

              {referenceImages.length < 3 && (
                <label className="w-14 h-14 rounded-lg border border-dashed border-white/20 hover:border-blue-500/50 flex flex-col items-center justify-center cursor-pointer bg-white/[0.02]">
                  <Upload className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[9px] text-zinc-400 mt-0.5">+Ref</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'ref')}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Audio & Foley Description */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-zinc-400 font-medium flex items-center gap-1.5">
          <Volume2 className="w-3 h-3 text-blue-400" />
          <span>Soundscape & Ambient Audio</span>
        </label>
        <input
          type="text"
          value={audioDescription}
          onChange={(e) => setAudioDescription(e.target.value)}
          placeholder="e.g. Natural bazaar chatter, bustling street ambience, gentle breeze..."
          className="w-full bg-[#141824] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Negative Constraints */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-zinc-400 font-medium">Negative Prompt (What to exclude)</label>
        <input
          type="text"
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder="e.g. Low quality, blurry faces, distorted hands, flickering, artifacts..."
          className="w-full bg-[#141824] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
};

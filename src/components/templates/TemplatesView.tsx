/**
 * Categoric AI - Prompt Templates & Presets Library
 */
import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Camera, Film, Tag } from 'lucide-react';
import { PromptTemplate } from '../../types.js';
import { apiRequest } from '../../lib/api.js';

interface TemplatesViewProps {
  onApplyTemplate: (template: PromptTemplate) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ onApplyTemplate }) => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Commercial', 'Luxury', 'Sci-Fi', 'Nature', 'Documentary'];

  useEffect(() => {
    apiRequest<{ templates: PromptTemplate[] }>(`/api/templates?category=${activeCategory}`)
      .then((data) => setTemplates(data.templates || []))
      .catch(() => {});
  }, [activeCategory]);

  return (
    <div id="templates-library-view" className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0e1017] border border-white/10 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Prompt Presets & Templates</h2>
            <p className="text-xs text-zinc-400">Battle-tested cinematic prompts crafted for Google Veo 3.1 optics</p>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-[#0e1017] border border-white/10 rounded-2xl p-5 hover:border-indigo-500/50 transition-all flex flex-col justify-between group shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10">
                  {tpl.category}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">{tpl.aspect_ratio}</span>
              </div>

              <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-blue-300 transition-colors">
                {tpl.title}
              </h3>

              <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3 italic bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                "{tpl.prompt}"
              </p>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {tpl.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <Camera className="w-3.5 h-3.5 text-blue-400" />
                <span>{tpl.camera}</span>
              </div>

              <button
                onClick={() => onApplyTemplate(tpl)}
                className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
              >
                <span>Use Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Categoric AI - Video Sharing Modal
 */
import React, { useState, useEffect } from 'react';
import { X, Share2, Copy, Check, Globe, Lock } from 'lucide-react';
import { GenerationJob } from '../../types.js';
import { apiRequest } from '../../lib/api.js';

interface ShareModalProps {
  job: GenerationJob | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ job, isOpen, onClose }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [privacy, setPrivacy] = useState<'unlisted' | 'public'>('unlisted');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (job && isOpen) {
      setIsLoading(true);
      apiRequest<{ shareUrl: string }>(`/api/videos/${job.id}/share`, {
        method: 'POST',
        body: JSON.stringify({ privacy })
      })
        .then((data) => {
          const full = window.location.origin + data.shareUrl;
          setShareUrl(full);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [job, isOpen, privacy]);

  if (!isOpen || !job) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#0e1017] border border-white/10 rounded-2xl p-6 shadow-2xl relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
            <Share2 className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Share Generated Video</h3>
            <p className="text-xs text-zinc-400">Collaborate or showcase your cinematic creation</p>
          </div>
        </div>

        {/* Video Prompt Snippet */}
        <p className="text-xs text-zinc-300 italic line-clamp-2 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
          "{job.prompt}"
        </p>

        {/* Privacy Selector */}
        <div className="space-y-1.5 text-xs">
          <label className="text-zinc-400 font-medium">Access Permission</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPrivacy('unlisted')}
              className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                privacy === 'unlisted'
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                  : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              <Lock className="w-4 h-4" />
              <div>
                <p className="font-semibold">Unlisted</p>
                <p className="text-[10px] text-zinc-500">Anyone with link</p>
              </div>
            </button>

            <button
              onClick={() => setPrivacy('public')}
              className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                privacy === 'public'
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                  : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              <Globe className="w-4 h-4" />
              <div>
                <p className="font-semibold">Public</p>
                <p className="text-[10px] text-zinc-500">Discoverable</p>
              </div>
            </button>
          </div>
        </div>

        {/* Share URL copy bar */}
        <div className="space-y-1.5 text-xs">
          <label className="text-zinc-400 font-medium">Shareable Web Link</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={isLoading ? 'Generating secure share link...' : shareUrl}
              className="flex-1 bg-[#141824] border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 transition-all active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

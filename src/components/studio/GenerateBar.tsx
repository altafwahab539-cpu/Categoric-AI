/**
 * Categoric AI - Studio Generation Action Bar
 */
import React from 'react';
import { Sparkles, Zap, AlertCircle, Coins, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface GenerateBarProps {
  modelId: string;
  resolution: string;
  isGenerating: boolean;
  onGenerate: () => void;
  onOpenBilling: () => void;
}

export const GenerateBar: React.FC<GenerateBarProps> = ({
  modelId,
  resolution,
  isGenerating,
  onGenerate,
  onOpenBilling
}) => {
  const { wallet } = useAuth();

  // Compute credit cost
  let cost = 40;
  if (modelId === 'veo_3_1_fast') cost = 25;
  if (modelId === 'veo_3_1_lite') cost = 15;
  if (resolution === '4k') cost = Math.round(cost * 1.8);

  const currentBalance = wallet?.balance ?? 0;
  const hasSufficientCredits = currentBalance >= cost;

  return (
    <div
      id="generate-action-bar"
      className="bg-[#0b0d13] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl"
    >
      {/* Cost & Balance breakdown */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Estimated Cost:</span>
              <span className="text-xs font-mono font-bold text-amber-400">{cost} Credits</span>
            </div>
            <div className="text-[11px] text-zinc-500">
              Your Balance:{' '}
              <span className={`font-mono font-semibold ${hasSufficientCredits ? 'text-zinc-300' : 'text-red-400'}`}>
                {currentBalance} Credits
              </span>
            </div>
          </div>
        </div>

        {!hasSufficientCredits && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Low balance</span>
            <button
              onClick={onOpenBilling}
              className="text-red-300 font-semibold underline hover:text-red-200 ml-1"
            >
              Get Credits
            </button>
          </div>
        )}
      </div>

      {/* Primary CTA Button */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button
          id="btn-generate-video"
          onClick={onGenerate}
          disabled={isGenerating || !hasSufficientCredits}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-[0.98] ${
            isGenerating
              ? 'bg-blue-600/50 text-blue-200 cursor-not-allowed'
              : hasSufficientCredits
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-indigo-500/25'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Submitting to Veo 3.1...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>GENERATE VIDEO</span>
              <span className="text-xs font-mono font-normal opacity-75">({cost} cr)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

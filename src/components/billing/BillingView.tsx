/**
 * Categoric AI - Billing, Plans & Credit Wallet Ledger
 */
import React, { useState, useEffect } from 'react';
import {
  Coins,
  Check,
  Zap,
  Sparkles,
  Shield,
  ArrowUpRight,
  Clock,
  RotateCcw,
  Gift
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../lib/api.js';
import { Plan, CreditTransaction } from '../../types.js';

export const BillingView: React.FC = () => {
  const { user, wallet, refreshUserData } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    apiRequest<{ plans: Plan[] }>('/api/billing/plans')
      .then((data) => setPlans(data.plans || []))
      .catch(() => {});

    apiRequest<{ transactions: CreditTransaction[] }>('/api/credits/transactions')
      .then((data) => setTransactions(data.transactions || []))
      .catch(() => {});
  }, []);

  const handleSubscribe = async (planId: string) => {
    setIsUpgrading(true);
    try {
      const res = await apiRequest<{ message: string }>('/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId })
      });
      alert(res.message);
      await refreshUserData();
      const txData = await apiRequest<{ transactions: CreditTransaction[] }>('/api/credits/transactions');
      setTransactions(txData.transactions || []);
    } catch (err: any) {
      alert(err.message || 'Upgrade failed.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleBuyPack = async (packId: string) => {
    try {
      const res = await apiRequest<{ message: string }>('/api/billing/buy-credits', {
        method: 'POST',
        body: JSON.stringify({ packId })
      });
      alert(res.message);
      await refreshUserData();
      const txData = await apiRequest<{ transactions: CreditTransaction[] }>('/api/credits/transactions');
      setTransactions(txData.transactions || []);
    } catch (err: any) {
      alert(err.message || 'Purchase failed.');
    }
  };

  return (
    <div id="billing-ledger-view" className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header & Wallet Banner */}
      <div className="bg-[#0e1017] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Credit Economy</span>
          </div>
          <h2 className="text-xl font-bold text-white">Credits & Subscription Plans</h2>
          <p className="text-xs text-zinc-400 max-w-md">
            All video generations use server-managed credits. Failed jobs are refunded automatically.
          </p>
        </div>

        {/* Live Wallet Card */}
        <div className="bg-[#141824] border border-white/10 p-5 rounded-2xl flex items-center gap-6 shadow-lg min-w-[280px]">
          <div>
            <span className="text-xs text-zinc-400 font-medium block">Current Balance</span>
            <span className="text-3xl font-mono font-extrabold text-amber-400">
              {wallet?.balance ?? 0}
            </span>
            <span className="text-[11px] text-zinc-500 ml-1">credits</span>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="space-y-1 text-xs">
            <div className="text-zinc-400">
              Active Plan: <span className="text-white font-semibold capitalize">{user?.plan_id || 'Free'}</span>
            </div>
            <div className="text-zinc-500 text-[11px]">
              Lifetime: {wallet?.lifetime_granted || 0} granted
            </div>
          </div>
        </div>
      </div>

      {/* Credit Top-up Packs */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
          Instant Credit Top-Up Packs
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { id: 'pack_small', name: 'Creator Pack', credits: 250, price: '$15', desc: '~6 Full Veo 3.1 Videos' },
            { id: 'pack_medium', name: 'Studio Pack', credits: 750, price: '$39', desc: '~18 Full Veo 3.1 Videos', badge: 'Popular' },
            { id: 'pack_large', name: 'Production Pack', credits: 2000, price: '$99', desc: '~50 Full Veo 3.1 Videos' }
          ].map((pack) => (
            <div
              key={pack.id}
              className="bg-[#0e1017] border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:border-amber-500/40 transition-all shadow-md"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-white">{pack.name}</span>
                  {pack.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                      {pack.badge}
                    </span>
                  )}
                </div>
                <p className="text-base font-mono font-bold text-amber-400 mt-1">{pack.credits} Credits</p>
                <p className="text-[10px] text-zinc-500">{pack.desc}</p>
              </div>

              <button
                onClick={() => handleBuyPack(pack.id)}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-amber-500/20 text-zinc-200 hover:text-amber-300 text-xs font-semibold border border-white/10 hover:border-amber-500/30 transition-all"
              >
                Buy {pack.price}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Subscription Plans */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
          Monthly Memberships
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = user?.plan_id === plan.id;
            return (
              <div
                key={plan.id}
                className={`bg-[#0e1017] border rounded-2xl p-6 flex flex-col justify-between shadow-xl relative ${
                  plan.id === 'pro'
                    ? 'border-blue-500/50 ring-1 ring-blue-500/30 bg-gradient-to-b from-blue-950/20 to-[#0e1017]'
                    : 'border-white/10'
                }`}
              >
                {plan.id === 'pro' && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-0.5 rounded-full bg-blue-600 text-white shadow-lg">
                    Recommended for Studios
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h4 className="text-base font-bold text-white">{plan.name}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold font-mono text-white">
                      ${plan.price_usd}
                    </span>
                    <span className="text-xs text-zinc-500">/ month</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className="text-[11px] text-zinc-400">Monthly Allowance:</span>
                    <p className="text-sm font-mono font-bold text-amber-400">
                      {plan.monthly_credits} Credits
                    </p>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-2 pt-2">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/5">
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrent || isUpgrading}
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isCurrent
                        ? 'bg-white/5 text-zinc-500 cursor-default'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-95'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Credit Transaction Ledger */}
      <div className="bg-[#0e1017] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
          Wallet Transaction Ledger
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-zinc-500 text-[11px]">
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Description</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Balance After</th>
                <th className="pb-3 font-medium text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-zinc-500">
                    No transactions recorded yet
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02]">
                    <td className="py-3">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          tx.type === 'REFUND'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : tx.type === 'GENERATION'
                            ? 'bg-blue-500/20 text-blue-400'
                            : tx.type === 'PURCHASE' || tx.type === 'SUBSCRIPTION'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 text-zinc-200">{tx.description}</td>
                    <td className="py-3 font-mono font-semibold">
                      <span className={tx.amount > 0 ? 'text-emerald-400' : 'text-zinc-400'}>
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-zinc-400">{tx.balance_after} cr</td>
                    <td className="py-3 text-right text-zinc-500">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

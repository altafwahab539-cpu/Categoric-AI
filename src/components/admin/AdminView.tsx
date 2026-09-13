/**
 * Categoric AI - Admin & SaaS Telemetry Dashboard
 */
import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Film,
  Zap,
  DollarSign,
  RotateCcw,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Coins
} from 'lucide-react';
import { apiRequest } from '../../lib/api.js';

export const AdminView: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [modelPricing, setModelPricing] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'kpis' | 'jobs' | 'users' | 'pricing'>('kpis');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [creditAdjustment, setCreditAdjustment] = useState<number>(100);

  const fetchAdminData = async () => {
    try {
      const [m, u, j, p] = await Promise.all([
        apiRequest<{ metrics: any }>('/api/admin/metrics'),
        apiRequest<{ users: any[] }>('/api/admin/users'),
        apiRequest<{ jobs: any[] }>('/api/admin/jobs?limit=30'),
        apiRequest<{ models: any }>('/api/admin/model-pricing')
      ]);
      setMetrics(m.metrics);
      setUsers(u.users || []);
      setJobs(j.jobs || []);
      setModelPricing(p.models || null);
    } catch (err) {
      console.warn('Failed to fetch admin data:', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleAdjustCredits = async (userId: string) => {
    try {
      await apiRequest(`/api/admin/users/${userId}/credits`, {
        method: 'POST',
        body: JSON.stringify({ amount: Number(creditAdjustment), reason: 'Admin manual update' })
      });
      alert(`Credits adjusted by ${creditAdjustment}`);
      await fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleUserStatus = async (user: any) => {
    try {
      await apiRequest(`/api/admin/users/${user.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ isActive: !user.is_active })
      });
      await fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await apiRequest(`/api/admin/jobs/${jobId}/retry`, { method: 'POST' });
      alert(`Job ${jobId.slice(0, 8)} re-queued.`);
      await fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdatePrice = async (modelId: string, creditCost: number) => {
    try {
      await apiRequest('/api/admin/model-pricing', {
        method: 'POST',
        body: JSON.stringify({ modelId, creditCost })
      });
      alert(`Price updated for ${modelId}`);
      await fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div id="admin-dashboard-view" className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0e1017] border border-amber-500/30 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Platform Governance & Telemetry</h2>
            <p className="text-xs text-zinc-400">Manage Veo 3.1 job pipelines, user credits, and revenue models</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
          {(['kpis', 'jobs', 'users', 'pricing'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-amber-500 text-black font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: System KPIs */}
      {activeTab === 'kpis' && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#0e1017] border border-white/10 space-y-1">
              <span className="text-[11px] text-zinc-500 font-medium">Total Registered Users</span>
              <p className="text-2xl font-mono font-bold text-white">{metrics.totalUsers}</p>
              <p className="text-[10px] text-emerald-400">Active: {metrics.activeUsers}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#0e1017] border border-white/10 space-y-1">
              <span className="text-[11px] text-zinc-500 font-medium">Total Video Generations</span>
              <p className="text-2xl font-mono font-bold text-blue-400">{metrics.totalGenerations}</p>
              <p className="text-[10px] text-zinc-400">Queue: {metrics.queuedJobs} active</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#0e1017] border border-white/10 space-y-1">
              <span className="text-[11px] text-zinc-500 font-medium">Generation Success Rate</span>
              <p className="text-2xl font-mono font-bold text-emerald-400">{metrics.successRate}%</p>
              <p className="text-[10px] text-red-400">Failed: {metrics.failedJobs}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#0e1017] border border-white/10 space-y-1">
              <span className="text-[11px] text-zinc-500 font-medium">Monthly MRR Estimate</span>
              <p className="text-2xl font-mono font-bold text-amber-400">${metrics.estimatedRevenue}</p>
              <p className="text-[10px] text-zinc-400">Credits burned: {metrics.totalCreditsSpent}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Live Job Queue & Failed Generations */}
      {activeTab === 'jobs' && (
        <div className="bg-[#0e1017] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Live Generation Pipeline ({jobs.length} Recent)
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">Auto-refreshes every 8s</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-500 text-[11px]">
                  <th className="pb-3 font-medium">Job ID</th>
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Model</th>
                  <th className="pb-3 font-medium">Prompt</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Credits</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-mono text-zinc-400">{j.id.slice(0, 8)}</td>
                    <td className="py-3 text-zinc-300">{j.userEmail}</td>
                    <td className="py-3 font-mono text-[11px] text-zinc-400">{j.model_id}</td>
                    <td className="py-3 max-w-xs truncate text-zinc-200" title={j.prompt}>
                      {j.prompt}
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                          j.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : j.status === 'PROCESSING' || j.status === 'QUEUED'
                            ? 'bg-blue-500/20 text-blue-400 animate-pulse'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-amber-400">{j.credits_cost}</td>
                    <td className="py-3 text-right">
                      {j.status === 'FAILED' && (
                        <button
                          onClick={() => handleRetryJob(j.id)}
                          className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[11px] font-medium"
                        >
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: User Credit & Status Management */}
      {activeTab === 'users' && (
        <div className="bg-[#0e1017] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Registered Users & Wallets ({users.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-500 text-[11px]">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Plan</th>
                  <th className="pb-3 font-medium">Balance</th>
                  <th className="pb-3 font-medium">Generations</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Credit Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-medium text-white">{u.name} ({u.email})</td>
                    <td className="py-3 capitalize text-zinc-400">{u.role}</td>
                    <td className="py-3 capitalize font-mono text-blue-400">{u.plan_id}</td>
                    <td className="py-3 font-mono font-bold text-amber-400">{u.wallet?.balance || 0}</td>
                    <td className="py-3 font-mono text-zinc-400">{u.videoCount || 0}</td>
                    <td className="py-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded ${
                          u.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            const amt = prompt('Enter credit amount (+ to add, - to deduct):', '100');
                            if (amt) {
                              setCreditAdjustment(parseInt(amt, 10));
                              handleAdjustCredits(u.id);
                            }
                          }}
                          className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[11px] text-zinc-200"
                        >
                          ± Credits
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className="p-1 text-zinc-400 hover:text-white"
                          title={u.is_active ? 'Suspend Account' : 'Activate Account'}
                        >
                          {u.is_active ? <Lock className="w-3.5 h-3.5 text-red-400" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Model Pricing Configuration */}
      {activeTab === 'pricing' && modelPricing && (
        <div className="bg-[#0e1017] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Model Generation Credit Pricing
          </h3>
          <p className="text-xs text-zinc-400">
            Dynamically adjust the server-authoritative credit consumption per model without code deploys.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {Object.entries(modelPricing).map(([key, config]: [string, any]) => (
              <div key={key} className="p-4 rounded-xl bg-[#141824] border border-white/10 space-y-3 text-xs">
                <div>
                  <h4 className="font-semibold text-white">{config.name}</h4>
                  <p className="text-[10px] text-zinc-500 font-mono">{config.model}</p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Current Cost:</span>
                  <span className="font-mono font-bold text-amber-400">{config.creditCost} Credits</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    defaultValue={config.creditCost}
                    id={`price-input-${key}`}
                    className="w-20 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-zinc-200"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById(`price-input-${key}`) as HTMLInputElement;
                      if (input) handleUpdatePrice(key, parseInt(input.value, 10));
                    }}
                    className="flex-1 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
                  >
                    Update
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Categoric AI - Studio Sidebar
 */
import React from 'react';
import {
  Video,
  Film,
  Clapperboard,
  Layers,
  Sparkles,
  FolderKanban,
  Coins,
  ShieldCheck,
  Star,
  PlusCircle,
  Zap,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export type NavTab =
  | 'studio'
  | 'storyboard'
  | 'gallery'
  | 'favorites'
  | 'projects'
  | 'assets'
  | 'templates'
  | 'billing'
  | 'admin';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenNewProjectModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user, wallet, plan } = useAuth();

  const mainNav = [
    { id: 'studio', label: 'Create Video', icon: Video, badge: 'Veo 3.1' },
    { id: 'storyboard', label: 'AI Storyboard', icon: Clapperboard, badge: 'Director' },
    { id: 'gallery', label: 'My Videos', icon: Film },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'templates', label: 'Prompt Library', icon: Sparkles },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'assets', label: 'Asset Consistency', icon: Layers },
    { id: 'billing', label: 'Credits & Plans', icon: Coins }
  ];

  return (
    <aside
      id="app-sidebar"
      className="w-64 h-screen bg-[#0a0c12] border-r border-white/10 flex flex-col justify-between select-none z-30 shrink-0"
    >
      {/* Brand Header */}
      <div>
        <div className="px-5 py-5 flex items-center justify-between border-b border-white/5">
          <button
            id="brand-logo-btn"
            onClick={() => onSelectTab('studio')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold tracking-tight text-white text-base">Categoric</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider">AI</span>
              </div>
              <p className="text-[11px] text-zinc-500">Veo 3.1 Video Studio</p>
            </div>
          </button>
        </div>

        {/* Quick Action */}
        <div className="p-3">
          <button
            id="sidebar-create-btn"
            onClick={() => onSelectTab('studio')}
            className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Video Generation</span>
          </button>
        </div>

        {/* Navigation List */}
        <nav className="px-3 space-y-1 mt-1">
          <div className="px-3 py-1 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Workspace
          </div>

          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => onSelectTab(item.id as NavTab)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isActive
                        ? 'bg-blue-500/25 text-blue-300'
                        : 'bg-white/5 text-zinc-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Admin Navigation */}
          {user?.role === 'admin' && (
            <div className="pt-3">
              <div className="px-3 py-1 text-[11px] font-medium text-amber-500/80 uppercase tracking-wider">
                Management
              </div>
              <button
                id="nav-admin"
                onClick={() => onSelectTab('admin')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  currentTab === 'admin'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-zinc-400 hover:text-amber-300 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Admin Console</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                  SaaS
                </span>
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Credit & Plan Footer */}
      <div className="p-3 border-t border-white/5">
        <div className="p-3 rounded-xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-zinc-200">Credits Wallet</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-amber-400">
              {wallet?.balance ?? 0}
            </span>
          </div>

          {/* Balance progress bar */}
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(10, ((wallet?.balance || 0) / 500) * 100))}%`
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="capitalize">{plan?.name || 'Free Trial'}</span>
            <button
              id="sidebar-upgrade-btn"
              onClick={() => onSelectTab('billing')}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5"
            >
              <span>Add</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

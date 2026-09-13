/**
 * Categoric AI - Studio Top Navbar
 */
import React, { useState, useEffect } from 'react';
import {
  Coins,
  Bell,
  Sparkles,
  Shield,
  User as UserIcon,
  LogOut,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../lib/api.js';

interface TopNavbarProps {
  onOpenAuthModal: () => void;
  onSelectTab: (tab: any) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenAuthModal, onSelectTab }) => {
  const { user, wallet, logout, switchAccount } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Fetch notifications if user is logged in
    const fetchNotifs = async () => {
      try {
        const data = await apiRequest<{ videos: any[] }>('/api/videos?limit=3');
        // Synthesize recent activities
        if (data.videos) {
          const notifs = data.videos.slice(0, 4).map((v: any) => ({
            id: v.id,
            title: v.status === 'COMPLETED' ? 'Video Generation Ready' : `Generation ${v.status}`,
            time: new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: v.status
          }));
          setNotifications(notifs);
        }
      } catch {
        // quiet fallback
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <header
      id="top-navbar"
      className="h-16 border-b border-white/10 bg-[#0a0c12]/80 backdrop-blur-md px-6 flex items-center justify-between z-20 shrink-0 sticky top-0"
    >
      {/* Left info & Veo status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-medium text-emerald-300">Veo 3.1 Online</span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-zinc-400">
          <span className="text-zinc-600">|</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Gemini Prompt Intelligence Active
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Credits Pill */}
        <button
          id="navbar-credits-badge"
          onClick={() => onSelectTab('billing')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-amber-600/10 hover:from-amber-500/20 hover:to-amber-600/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all group shadow-sm shadow-amber-500/5"
        >
          <Coins className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span>{wallet?.balance ?? 0}</span>
          <span className="text-[10px] text-amber-400/70 font-normal">Credits</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            id="navbar-notifications-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-[#0a0c12]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#12151f] border border-white/10 rounded-xl shadow-2xl p-3 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-2 font-medium text-zinc-200">
                <span>Recent Notifications</span>
                <span className="text-[10px] text-zinc-500">Live Updates</span>
              </div>
              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-zinc-500 text-center py-4">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex items-start gap-2.5"
                    >
                      {n.status === 'COMPLETED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-zinc-200 font-medium">{n.title}</p>
                        <p className="text-[10px] text-zinc-500">{n.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account / Switcher */}
        {user ? (
          <div className="relative">
            <button
              id="navbar-user-menu-btn"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left"
            >
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
                alt={user.name}
                className="w-6 h-6 rounded-full bg-zinc-800 object-cover"
              />
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-zinc-200 leading-none">{user.name}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{user.role}</p>
              </div>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-[#12151f] border border-white/10 rounded-xl shadow-2xl p-2 z-50 text-xs">
                <div className="p-2 border-b border-white/5 mb-1">
                  <p className="font-semibold text-zinc-100">{user.name}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono capitalize">
                      {user.plan_id} Plan
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 text-[10px] font-mono capitalize">
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* Quick Account Switcher for testing Admin vs Creator */}
                <div className="py-1 px-2 text-[10px] font-semibold text-zinc-500 uppercase">
                  Switch Persona
                </div>
                <button
                  onClick={() => {
                    switchAccount('user');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-zinc-300"
                >
                  <span className="flex items-center gap-2">
                    <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                    Creative Director (Creator)
                  </span>
                  {user.role === 'user' && <span className="text-[10px] text-blue-400">Active</span>}
                </button>
                <button
                  onClick={() => {
                    switchAccount('admin');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-zinc-300"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    Platform Admin
                  </span>
                  {user.role === 'admin' && <span className="text-[10px] text-amber-400">Active</span>}
                </button>

                <div className="h-px bg-white/5 my-1" />

                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            id="navbar-signin-btn"
            onClick={onOpenAuthModal}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

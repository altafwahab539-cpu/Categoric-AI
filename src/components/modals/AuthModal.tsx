/**
 * Categoric AI - Authentication & Sign Up Modal
 */
import React, { useState } from 'react';
import { X, Zap, Mail, Lock, User as UserIcon, ArrowRight, Gift } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, socialLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegister) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'creator' | 'admin') => {
    setError('');
    setIsLoading(true);
    try {
      if (role === 'admin') {
        await login('admin@categoric.ai', 'admin123');
      } else {
        await login('creator@categoric.ai', 'demo123');
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#0e1017] border border-white/10 rounded-2xl p-6 shadow-2xl relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {isRegister ? 'Join Categoric AI' : 'Sign in to Categoric'}
          </h3>
          <p className="text-xs text-zinc-400">
            {isRegister
              ? 'Get 100 free credits immediately to generate ultra-realistic Veo 3.1 videos.'
              : 'Enter your credentials to access your creative studio.'}
          </p>
        </div>

        {/* Bonus Pill if Register */}
        {isRegister && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-300">
            <Gift className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Welcome gift: <strong>100 Free Credits</strong> granted instantly upon sign up!</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {isRegister && (
            <div className="space-y-1">
              <label className="text-zinc-400 font-medium">Full Name</label>
              <div className="relative">
                <UserIcon className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Creative Director"
                  className="w-full bg-[#141824] border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-zinc-400 font-medium">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@studio.com"
                className="w-full bg-[#141824] border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-zinc-400 font-medium">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#141824] border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all mt-4"
          >
            <span>{isLoading ? 'Authenticating...' : isRegister ? 'Create Account & Claim Credits' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Sign In Options */}
        <div className="pt-2 border-t border-white/5 space-y-2 text-center text-xs">
          <p className="text-[11px] text-zinc-500">Or enter instantly with preconfigured accounts:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickDemo('creator')}
              className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px]"
            >
              Demo Creator (100 cr)
            </button>
            <button
              onClick={() => handleQuickDemo('admin')}
              className="py-1.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px]"
            >
              Platform Admin
            </button>
          </div>
        </div>

        {/* Toggle Register / Login */}
        <div className="text-center text-xs text-zinc-400">
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button onClick={() => setIsRegister(false)} className="text-blue-400 hover:underline">
                Sign In
              </button>
            </span>
          ) : (
            <span>
              New to Categoric?{' '}
              <button onClick={() => setIsRegister(true)} className="text-blue-400 hover:underline">
                Create Account
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

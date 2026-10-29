import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { X, Lock, Mail, User as UserIcon, ArrowRight, Check } from 'lucide-react';
import { api } from '../services/api.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Signin fields
  const [identifier, setIdentifier] = useState('maya_wanderer');
  const [password, setPassword] = useState('tripmates123');

  // Signup fields
  const [signupForm, setSignupForm] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    homeCity: 'San Francisco, USA',
    preferredTravelStyle: 'Backpacker',
    bio: 'Avid wanderer ready to explore world trails and share meals.',
    budgetMin: 800,
    budgetMax: 2500,
    languages: ['English'],
    travelInterests: ['Adventure', 'Heritage', 'Food'],
  });

  // Forgot pass
  const [resetEmail, setResetEmail] = useState('');

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(identifier, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register(signupForm);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.resetPassword(resetEmail);
      setInfo(res.message);
    } catch (err: any) {
      setError(err.message || 'Reset failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-[#E5E3D8] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 bg-[#F8F7F2] border-b border-[#E5E3D8] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-[#174D3C]">
              {tab === 'signin' && 'Welcome Back to TripMates'}
              {tab === 'signup' && 'Join TripMates Community'}
              {tab === 'forgot' && 'Password Recovery'}
            </h2>
            <p className="text-xs text-[#5E6963] mt-0.5">
              Explore More. Meet Your People.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8A9790] hover:text-[#202824] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        {tab !== 'forgot' && (
          <div className="flex border-b border-[#E5E3D8] text-xs font-semibold">
            <button
              onClick={() => {
                setTab('signin');
                setError(null);
              }}
              className={`flex-1 py-2.5 text-center transition-colors cursor-pointer ${
                tab === 'signin'
                  ? 'text-[#174D3C] border-b-2 border-[#174D3C] font-bold bg-[#F8F7F2]/50'
                  : 'text-[#8A9790] hover:text-[#5E6963]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab('signup');
                setError(null);
              }}
              className={`flex-1 py-2.5 text-center transition-colors cursor-pointer ${
                tab === 'signup'
                  ? 'text-[#174D3C] border-b-2 border-[#174D3C] font-bold bg-[#F8F7F2]/50'
                  : 'text-[#8A9790] hover:text-[#5E6963]'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {error && (
          <div className="m-5 mb-0 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {info && (
          <div className="m-5 mb-0 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200">
            {info}
          </div>
        )}

        {/* Sign In Form */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} className="p-5 space-y-4 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
                Username or Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="maya_wanderer or email"
                className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-[#174D3C]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTab('forgot');
                    setError(null);
                  }}
                  className="text-[11px] text-[#27866A] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs"
                required
              />
            </div>

            {/* Demo Quick Logins */}
            <div className="p-3 bg-[#F8F7F2] rounded-lg border border-[#E5E3D8] space-y-1.5">
              <span className="text-[10px] text-[#8A9790] uppercase tracking-wider block font-semibold">
                Quick Demo Credentials:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('maya_wanderer');
                    setPassword('tripmates123');
                  }}
                  className="px-2 py-1 bg-white hover:bg-[#EFECE3] border border-[#E5E3D8] rounded text-[11px] text-[#174D3C] cursor-pointer"
                >
                  Maya (Backpacker)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('kenji_alpine');
                    setPassword('tripmates123');
                  }}
                  className="px-2 py-1 bg-white hover:bg-[#EFECE3] border border-[#E5E3D8] rounded text-[11px] text-[#174D3C] cursor-pointer"
                >
                  Kenji (Photographer)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('tripmates_admin');
                    setPassword('tripmates_admin_2026');
                  }}
                  className="px-2 py-1 bg-white hover:bg-[#EFECE3] border border-[#E5E3D8] rounded text-[11px] text-[#27866A] font-semibold cursor-pointer"
                >
                  Admin Moderator
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-[#174D3C] hover:bg-[#1F644E] text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Sign Up Form */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="p-5 space-y-3 text-xs max-h-[70vh] overflow-y-auto">
            <div>
              <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Rivera"
                value={signupForm.fullName}
                onChange={e => setSignupForm({ ...signupForm, fullName: e.target.value })}
                className="w-full px-3 py-1.5 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  placeholder="alex_nomad"
                  value={signupForm.username}
                  onChange={e => setSignupForm({ ...signupForm, username: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
                  Home City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Austin, USA"
                  value={signupForm.homeCity}
                  onChange={e => setSignupForm({ ...signupForm, homeCity: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
                Email Address *
              </label>
              <input
                type="email"
                placeholder="alex@tripmates.io"
                value={signupForm.email}
                onChange={e => setSignupForm({ ...signupForm, email: e.target.value })}
                className="w-full px-3 py-1.5 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
                Password *
              </label>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={signupForm.password}
                onChange={e => setSignupForm({ ...signupForm, password: e.target.value })}
                className="w-full px-3 py-1.5 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
                Travel Style & Pace
              </label>
              <select
                value={signupForm.preferredTravelStyle}
                onChange={e => setSignupForm({ ...signupForm, preferredTravelStyle: e.target.value })}
                className="w-full px-3 py-1.5 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg"
              >
                <option value="Backpacker">Backpacker</option>
                <option value="Mid-range">Mid-range</option>
                <option value="Adventure">Adventure</option>
                <option value="Luxury">Luxury</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
                Short Bio & Travel Goals
              </label>
              <textarea
                rows={2}
                value={signupForm.bio}
                onChange={e => setSignupForm({ ...signupForm, bio: e.target.value })}
                className="w-full px-3 py-1.5 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-[#174D3C] hover:bg-[#1F644E] text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer mt-2 disabled:opacity-50"
            >
              {submitting ? 'Creating profile...' : 'Complete Registration'}
            </button>
          </form>
        )}

        {/* Forgot Password Flow */}
        {tab === 'forgot' && (
          <form onSubmit={handleResetPassword} className="p-5 space-y-4 text-xs">
            <p className="text-[#5E6963] leading-relaxed">
              Enter your registered email address. We will verify your account and provide password recovery details.
            </p>
            <div>
              <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="your-email@example.com"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setTab('signin');
                  setError(null);
                  setInfo(null);
                }}
                className="text-xs text-[#5E6963] hover:underline cursor-pointer"
              >
                Back to Sign In
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[#174D3C] text-white font-semibold rounded-lg cursor-pointer"
              >
                {submitting ? 'Sending...' : 'Send Recovery Link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

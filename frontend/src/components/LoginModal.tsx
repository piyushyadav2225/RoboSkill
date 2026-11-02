import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, User, CheckCircle2 } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, isLoggedIn, setIsLoggedIn, userEmail, showToast } = useApp();
  const [emailInput, setEmailInput] = useState(userEmail);
  const [passwordInput, setPasswordInput] = useState('••••••••');

  if (!isLoginModalOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
    showToast(`Authenticated as ${emailInput}`);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsLoginModalOpen(false);
    showToast('Signed out of RoboSkill session.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md parchment-panel rounded-3xl p-8 border border-[#C19A55]/40 shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={() => setIsLoginModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-full text-[#80643C] hover:text-[#FFF5DF] hover:bg-[#14110E] transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#14110E] border border-[#C19A55]/50 flex items-center justify-center text-[#E5BE72]">
            <Lock size={20} />
          </div>
          <h2 className="font-ancient text-2xl font-bold text-[#FFF5DF]">
            {isLoggedIn ? 'Artisan Identity' : 'Access The Guild'}
          </h2>
          <p className="text-xs text-[#9E917A] font-manuscript text-base">
            {isLoggedIn ? 'Your cryptographic session is currently authenticated.' : 'Sign in to publish packages and track hardware telemetry.'}
          </p>
        </div>

        {isLoggedIn ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#14110E] border border-emerald-500/30 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <div className="text-xs font-mono">
                <span className="text-[#80643C] block uppercase text-[10px]">Active Session</span>
                <span className="text-[#FFF5DF] font-bold">{emailInput}</span>
                <span className="text-emerald-400 block text-[10px] mt-0.5">Role: Certified Developer / Explorer</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="brass-btn flex-1 py-2.5 text-xs"
              >
                Continue
              </button>
              <button
                onClick={handleLogout}
                className="brass-btn-secondary py-2.5 px-4 text-xs text-rose-300 border-rose-900/40 hover:border-rose-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4 font-mono text-xs">
            <div className="space-y-1">
              <label className="text-[#80643C] uppercase text-[10px] block">Artisan Email / Key</label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#80643C]" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#14110E] border border-[#80643C]/40 text-[#FFF5DF] focus:outline-none focus:border-[#C19A55]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[#80643C] uppercase text-[10px] block">Cryptographic Passphrase</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#80643C]" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#14110E] border border-[#80643C]/40 text-[#FFF5DF] focus:outline-none focus:border-[#C19A55]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="brass-btn w-full py-3 text-xs shadow-lg mt-2"
            >
              <span>✦ AUTHENTICATE SESSION ✦</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};


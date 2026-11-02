import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MechanicalGear } from './MechanicalGear';
import { BookOpen, Cpu, FlaskConical, User, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, isLoggedIn, setIsLoginModalOpen } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'library' as const, label: 'The Library', subtitle: 'Marketplace & Codex', icon: BookOpen },
    { id: 'arena' as const, label: 'Developer Arena', subtitle: 'Implement & Authenticate', icon: Cpu },
    { id: 'testing' as const, label: 'Testing Lab', subtitle: 'Simulate & Hardware Spec', icon: FlaskConical },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#14110E]/95 backdrop-blur-md border-b border-[#C19A55]/25 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <button 
            onClick={() => setActiveTab('library')}
            className="flex items-center gap-3.5 group text-left transition-transform active:scale-95"
          >
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-[#1F1914] border border-[#C19A55]/50 group-hover:border-[#E5BE72] shadow-inner transition-colors">
              <MechanicalGear size={28} speed="slow" color="#E5BE72" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-ancient text-xl font-bold tracking-widest text-[#FFF5DF] group-hover:text-[#E5BE72] transition-colors">
                  ROBOSKILL
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#80643C]/25 border border-[#80643C]/60 text-[#E5BE72]">
                  v0.1
                </span>
              </div>
              <p className="text-[10px] tracking-widest uppercase font-mono text-[#9E917A]">
                ✦ The 3 Artisan Chambers ✦
              </p>
            </div>
          </button>

          {/* Three Primary Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-200 ${
                    isActive
                      ? 'bg-[#1F1914] text-[#E5BE72] border border-[#C19A55] shadow-lg shadow-[#C19A55]/10'
                      : 'text-[#D8C7A0]/70 hover:text-[#FFF5DF] hover:bg-[#1F1914]/50 border border-transparent'
                  }`}
                >
                  <Icon size={15} className={isActive ? 'text-[#E5BE72]' : 'text-[#80643C]'} />
                  <span className="font-ancient uppercase">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Minimal Login Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1F1914] border border-[#C19A55]/35 hover:border-[#E5BE72] text-xs font-mono text-[#E8DFC9] hover:text-[#FFF5DF] transition-all shadow-sm"
            >
              <div className={`w-2 h-2 rounded-full ${isLoggedIn ? 'bg-emerald-400' : 'bg-[#80643C]'}`} />
              <User size={13} className="text-[#C19A55]" />
              <span>{isLoggedIn ? 'Artisan Session' : 'Login'}</span>
            </button>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-[#1F1914] border border-[#C19A55]/30 text-[#E5BE72]"
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1A140F] border-b border-[#C19A55]/20 px-4 pt-2 pb-5 space-y-2 font-mono text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left ${
                  isActive
                    ? 'bg-[#2A2016] border-[#E5BE72] text-[#FFF5DF]'
                    : 'bg-[#14110E] border-[#80643C]/30 text-[#D8C7A0]/70'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-[#E5BE72]' : 'text-[#80643C]'} />
                <div>
                  <div className="font-ancient uppercase text-xs font-bold text-[#FFF5DF]">{item.label}</div>
                  <div className="text-[10px] text-[#80643C]">{item.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

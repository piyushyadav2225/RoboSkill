import React from 'react';
import { useApp } from '../context/AppContext';
import { MechanicalGear } from './MechanicalGear';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveTab } = useApp();

  return (
    <footer className="bg-[#100D0B] border-t border-[#C19A55]/20 pt-16 pb-12 text-[#9E917A] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-[#80643C]/20">
          
          {/* Column 1: Brand & Treatise */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <MechanicalGear size={32} speed="slow" color="#E5BE72" />
              <span className="font-ancient text-xl font-bold tracking-widest text-[#FFF5DF]">
                ROBOSKILL
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#D8C7A0]/75 font-manuscript text-base">
              "To forge autonomous intelligence is to inscribe geometry and clockwork reason onto inert steel and silicon."
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-[#E5BE72]">
              <ShieldCheck size={14} />
              <span>Verified Package Integrity v1.0</span>
            </div>
          </div>

          {/* Column 2: The Three Chambers */}
          <div className="space-y-3">
            <h4 className="font-ancient text-xs font-bold uppercase tracking-widest text-[#FFF5DF]">
              The Three Chambers
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <button onClick={() => setActiveTab('library')} className="hover:text-[#E5BE72] transition-colors flex items-center gap-1.5">
                  <ArrowRight size={11} className="text-[#C19A55]" />
                  <span>The Library (Marketplace &amp; Codex)</span>
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('arena')} className="hover:text-[#E5BE72] transition-colors flex items-center gap-1.5">
                  <ArrowRight size={11} className="text-[#C19A55]" />
                  <span>Developer Arena (Implement &amp; Authenticate)</span>
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('testing')} className="hover:text-[#E5BE72] transition-colors flex items-center gap-1.5">
                  <ArrowRight size={11} className="text-[#C19A55]" />
                  <span>Testing Lab (Virtual Simulation Bench)</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Engineering Axioms */}
          <div className="space-y-3">
            <h4 className="font-ancient text-xs font-bold uppercase tracking-widest text-[#FFF5DF]">
              Platform Axioms
            </h4>
            <ul className="space-y-2 text-xs text-[#D8C7A0]/60">
              <li>• Downloadable structured ZIP packages for robots.</li>
              <li>• Physical hardware compatibility marked UNVERIFIED.</li>
              <li>• Real Python decision loops tested in simulation.</li>
              <li>• Microcontroller &amp; robot hardware specifications.</li>
            </ul>
          </div>

          {/* Column 4: Workbench Telemetry */}
          <div className="space-y-3">
            <h4 className="font-ancient text-xs font-bold uppercase tracking-widest text-[#FFF5DF]">
              Workbench Telemetry
            </h4>
            <div className="p-4 rounded-xl bg-[#17130F] border border-[#C19A55]/25 font-mono text-[11px] space-y-1.5 shadow-inner">
              <div className="flex justify-between">
                <span className="text-[#80643C]">CHAMBERS:</span>
                <span className="text-[#E5BE72]">3 Minimal Interfaces</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#80643C]">FOUNDATION:</span>
                <span className="text-emerald-400">Obstacle Avoidance</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#80643C]">TEST SUITE:</span>
                <span className="text-emerald-400">7 Passed / 0 Failed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#80643C]">RUNTIME:</span>
                <span className="text-[#D8C7A0]">Python 3.13 / FastAPI</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[#80643C] gap-4">
          <div>
            &copy; MDCCXXIV &bull; ROBOSKILL ARTISAN SYNDICATE. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>THE LIBRARY</span>
            <span>&bull;</span>
            <span>DEVELOPER ARENA</span>
            <span>&bull;</span>
            <span>TESTING LAB</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

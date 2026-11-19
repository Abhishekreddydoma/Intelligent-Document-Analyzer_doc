import React from 'react';
import { Sparkles, FileText, CheckCircle2 } from 'lucide-react';

export default function Navbar({ activePage, setActivePage, backendStatus }) {
  const isOnline = backendStatus?.status === 'healthy';

  return (
    <header className="bg-[#FFFDFC] border-b border-[#E9D9C9] sticky top-0 z-30 shadow-[0_4px_12px_rgba(232,220,205,0.45)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Title: DocuMind AI */}
          <div
            onClick={() => setActivePage('home')}
            className="flex items-center space-x-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#DC8043] text-white flex items-center justify-center shadow-[3px_3px_8px_#E8DCCD,-3px_-3px_8px_#FFFFFF] transition-transform group-hover:scale-105">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-[#493323] tracking-tight block">
                DocuMind AI
              </span>
              <span className="text-[11px] text-[#DC8043] font-semibold block tracking-wide">
                Intelligent Document Understanding
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-3">
            <button
              onClick={() => setActivePage('home')}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activePage === 'home'
                  ? 'bg-[#DC8043] text-white shadow-[2px_2px_5px_#E8DCCD,-2px_-2px_5px_#FFFFFF]'
                  : 'text-[#8C7767] hover:text-[#493323] hover:bg-[#F8E5D2]/60'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActivePage('analyze')}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activePage === 'analyze'
                  ? 'bg-[#DC8043] text-white shadow-[2px_2px_5px_#E8DCCD,-2px_-2px_5px_#FFFFFF]'
                  : 'text-[#8C7767] hover:text-[#493323] hover:bg-[#F8E5D2]/60'
              }`}
            >
              Analyze Document
            </button>
            <button
              onClick={() => setActivePage('about')}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activePage === 'about'
                  ? 'bg-[#DC8043] text-white shadow-[2px_2px_5px_#E8DCCD,-2px_-2px_5px_#FFFFFF]'
                  : 'text-[#8C7767] hover:text-[#493323] hover:bg-[#F8E5D2]/60'
              }`}
            >
              About
            </button>

            {/* Backend Status indicator */}
            <div className="hidden md:flex items-center pl-3 border-l border-[#E9D9C9]">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-[2px_2px_5px_#E8DCCD,-2px_-2px_5px_#FFFFFF] border ${
                  isOnline
                    ? 'bg-[#FFFDFC] text-[#548A68] border-[#548A68]/30'
                    : 'bg-[#FFFDFC] text-[#C75B50] border-[#C75B50]/30'
                }`}
                title={isOnline ? 'FastAPI Backend Online' : 'Backend Connecting or Offline'}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-[#548A68] animate-pulse' : 'bg-[#C75B50]'
                  }`}
                ></span>
                {isOnline ? 'API Online' : 'Connecting'}
              </span>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}

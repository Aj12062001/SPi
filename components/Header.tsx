
import React from 'react';

interface HeaderProps {
  username: string;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ username, onLogout }) => {
  return (
    <header className="bg-slate-950/60 backdrop-blur-2xl border-b border-slate-800/50 sticky top-0 z-50 px-6 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-5 group cursor-pointer">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-lg rounded-full scale-0 group-hover:scale-125 transition-transform"></div>
            <img 
              src="images/logo.png" 
              alt="SPi Logo" 
              className="w-14 h-14 object-contain relative z-10 drop-shadow-[0_0_12px_rgba(79,70,229,0.4)] transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-white italic">SPi <span className="text-indigo-500">SYSTEM</span></h2>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none">Global Intel Interface</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="hidden sm:flex items-center space-x-4 pr-6 border-r border-slate-800">
            <div className="flex flex-col items-end">
              <span className="text-sm font-black text-slate-200 leading-none">{username.toUpperCase()}</span>
              <span className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mt-1.5 flex items-center">
                <svg className="w-2.5 h-2.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Authorized
              </span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group hover:border-indigo-500/50 transition-colors">
               <span className="text-indigo-400 font-black text-sm">{username[0].toUpperCase()}</span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="group relative bg-slate-900 hover:bg-red-600 text-slate-400 hover:text-white px-5 py-2.5 rounded-xl text-[10px] font-black transition-all border border-slate-800 hover:border-red-500 active:scale-95 uppercase tracking-widest"
          >
            Terminal Exit
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 opacity-20 group-hover:animate-shine"></div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

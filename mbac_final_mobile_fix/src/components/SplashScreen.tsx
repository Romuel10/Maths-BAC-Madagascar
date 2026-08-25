import React, { useEffect, useState } from 'react';
import { CREATOR, APP_VERSION, COPYRIGHT_SHORT } from '../lib/protection';

interface Props { onDone: () => void }

export const SplashScreen: React.FC<Props> = ({ onDone }) => {
 const [progress, setProgress] = useState(0);
 const [fadeOut, setFadeOut] = useState(false);

 useEffect(() => {
  const start = Date.now();
  const duration = 2200;
  const frame = () => {
   const elapsed = Date.now() - start;
   const p = Math.min(elapsed / duration, 1);
   setProgress(p);
   if (p < 1) requestAnimationFrame(frame);
   else {
    setFadeOut(true);
    setTimeout(onDone, 500);
   }
  };
  requestAnimationFrame(frame);
 }, [onDone]);

 return (
  <div className={`fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
   
   {/* Logo */}
   <div className="relative mb-8">
    <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40 animate-scale-in">
     <span className="text-white font-extrabold text-3xl tracking-tight">f(x)</span>
    </div>
    {/* Animated ring */}
    <svg className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)]" viewBox="0 0 130 130">
     <circle cx="65" cy="65" r="60" fill="none" stroke="#1e293b" strokeWidth="2" />
     <circle cx="65" cy="65" r="60" fill="none" stroke="url(#splashGrad)" strokeWidth="3" strokeLinecap="round"
      strokeDasharray={`${progress * 377} 377`}
      transform="rotate(-90 65 65)" />
     <defs>
      <linearGradient id="splashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
       <stop offset="0%" stopColor="#818cf8" />
       <stop offset="100%" stopColor="#c084fc" />
      </linearGradient>
     </defs>
    </svg>
   </div>

   {/* App name */}
   <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-2 animate-slide-up">
    Maths BAC Madagascar
   </h1>
   
   <p className="text-sm text-slate-400 animate-slide-up" style={{ animationDelay: '150ms' }}>
    Étude complète de fonctions
   </p>

   {/* Progress bar */}
   <div className="w-52 h-1.5 bg-slate-800 rounded-full mt-10 overflow-hidden">
    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-75"
     style={{ width: `${progress * 100}%` }} />
   </div>

   {/* Creator & Copyright — fixed at bottom, always visible */}
   <div className="absolute bottom-10 text-center space-y-1 animate-fade-in" style={{ animationDelay: '300ms' }}>
    <p className="text-xs text-slate-500">
     Créé par
    </p>
    <p className="text-sm font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
     {CREATOR}
    </p>
    <p className="text-[10px] text-slate-700 font-mono mt-2">
     {COPYRIGHT_SHORT} • v{APP_VERSION}
    </p>
   </div>
  </div>
 );
};

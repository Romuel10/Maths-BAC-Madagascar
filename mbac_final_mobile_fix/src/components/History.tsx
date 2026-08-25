import React from 'react';
import { MathExpression } from './MathNotation';

interface HistoryProps {
 items: string[];
 onSelect: (expr: string) => void;
 onClear: () => void;
}

export const History: React.FC<HistoryProps> = ({ items, onSelect, onClear }) => {
 if (items.length === 0) return null;

 return (
  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
   <div className="flex items-center justify-between mb-3">
    <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
     <span></span> Historique
    </h3>
    <button
     onClick={onClear}
     className="text-xs text-slate-500 hover:text-red-400 transition-colors"
    >
     Effacer
    </button>
   </div>
   <div className="flex flex-wrap gap-2">
    {items.map((item, i) => (
     <button
      key={i}
      onClick={() => onSelect(item)}
      className="bg-slate-700/40 hover:bg-indigo-600/20 border border-slate-600/30 hover:border-indigo-500/40 rounded-lg px-3 py-1.5 text-sm font-mono text-slate-300 hover:text-white transition-all active:scale-[0.95]"
     >
      <MathExpression value={item} />
     </button>
    ))}
   </div>
  </div>
 );
};

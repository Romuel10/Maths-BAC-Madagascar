import React from 'react';
import { MathExpression } from './MathNotation';

interface HistoryProps {
 items: string[];
 onSelect: (expr: string) => void;
 onEdit: (expr: string) => void;
 onClear: () => void;
}

export const History: React.FC<HistoryProps> = ({ items, onSelect, onEdit, onClear }) => {
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
    {items.map((item, i) => <div key={`${item}-${i}`} className="surface-flat p-2 flex items-center gap-2">
     <button onClick={() => onSelect(item)} className="min-w-0 flex-1 text-left text-sm font-mono text-brand" aria-label={`Analyser ${item}`}><MathExpression value={item} /></button>
     <button onClick={()=>onEdit(item)} className="btn btn-small btn-secondary" aria-label={`Modifier ${item}`}>Modifier</button>
    </div>)}
   </div>
  </div>
 );
};

import React, { useState } from 'react';
import { safeEvaluateExpression } from '../lib/expressionCore';
import { MathExpression } from './MathNotation';

interface Props { expression: string; derivativeExpr: string; secondDerivativeExpr: string }

function safeEval(expr: string, x: number): string {
 const r=safeEvaluateExpression(expr,{x}); return r!==null ? (Math.round(r * 10000) / 10000).toString() : '—';
}

export const ValueTable: React.FC<Props> = ({ expression, derivativeExpr, secondDerivativeExpr }) => {
 const [start, setStart] = useState(-5);
 const [end, setEnd] = useState(5);
 const [step, setStep] = useState(1);
 const [customX, setCustomX] = useState('');

 const xValues: number[] = [];
 for (let x = start; x <= end; x += step) xValues.push(Math.round(x * 1000) / 1000);

 if (customX) {
  customX.split(',').forEach(v => { const n = parseFloat(v.trim()); if (!isNaN(n) && !xValues.includes(n)) xValues.push(n); });
  xValues.sort((a, b) => a - b);
 }

 return (
  <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-5 border border-slate-700/40">
   <div className="flex items-center gap-3 mb-4">
    <span className="text-2xl"></span>
    <h3 className="text-lg font-bold text-white">Tableau de valeurs</h3>
   </div>

   {/* Controls */}
   <div className="grid grid-cols-3 gap-2 mb-3">
    <div><label className="block text-[10px] text-slate-400 mb-1">Début</label>
     <input type="number" value={start} onChange={e => setStart(Number(e.target.value))} className="w-full bg-slate-900/80 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-sm font-mono focus:border-indigo-500 focus:outline-none" /></div>
    <div><label className="block text-[10px] text-slate-400 mb-1">Fin</label>
     <input type="number" value={end} onChange={e => setEnd(Number(e.target.value))} className="w-full bg-slate-900/80 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-sm font-mono focus:border-indigo-500 focus:outline-none" /></div>
    <div><label className="block text-[10px] text-slate-400 mb-1">Pas</label>
     <input type="number" value={step} onChange={e => setStep(Number(e.target.value) || 1)} min={0.1} step={0.5} className="w-full bg-slate-900/80 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-sm font-mono focus:border-indigo-500 focus:outline-none" /></div>
   </div>
   <div className="mb-4">
    <label className="block text-[10px] text-slate-400 mb-1">Valeurs spécifiques (séparées par des virgules)</label>
    <input type="text" value={customX} onChange={e => setCustomX(e.target.value)} placeholder="ex: 0.5, 1.5, π" className="w-full bg-slate-900/80 border border-slate-700/50 rounded-lg px-3 py-1.5 text-white text-sm font-mono focus:border-indigo-500 focus:outline-none" />
   </div>

   {/* Table */}
   <div className="overflow-x-auto rounded-xl border border-slate-700/30">
    <table className="text-xs border-collapse w-full">
     <thead>
      <tr className="bg-slate-800/60">
       <th className="border border-slate-700/40 px-3 py-2 text-indigo-300 font-bold sticky left-0 bg-slate-800/90 z-10">x</th>
       {xValues.map((x, i) => <th key={i} className="border border-slate-700/40 px-3 py-2 text-slate-300 font-mono">{x}</th>)}
      </tr>
     </thead>
     <tbody>
      <tr className="bg-slate-800/30">
       <td className="border border-slate-700/40 px-3 py-2 text-purple-300 font-bold sticky left-0 bg-slate-800/70 z-10">f(x)</td>
       {xValues.map((x, i) => <td key={i} className="border border-slate-700/40 px-3 py-2 text-white font-mono text-center">{safeEval(expression, x)}</td>)}
      </tr>
      <tr className="bg-slate-800/20">
       <td className="border border-slate-700/40 px-3 py-2 text-emerald-300 font-bold sticky left-0 bg-slate-800/60 z-10">f'(x)</td>
       {xValues.map((x, i) => <td key={i} className="border border-slate-700/40 px-3 py-2 text-slate-300 font-mono text-center">{safeEval(derivativeExpr, x)}</td>)}
      </tr>
      <tr className="bg-slate-800/10">
       <td className="border border-slate-700/40 px-3 py-2 text-amber-300 font-bold sticky left-0 bg-slate-800/50 z-10">f''(x)</td>
       {xValues.map((x, i) => <td key={i} className="border border-slate-700/40 px-3 py-2 text-slate-400 font-mono text-center">{safeEval(secondDerivativeExpr, x)}</td>)}
      </tr>
     </tbody>
    </table>
   </div>
   <div className="text-[10px] text-slate-500 mt-2"><MathExpression value={`f(x)=${expression}`} /></div>
  </div>
 );
};

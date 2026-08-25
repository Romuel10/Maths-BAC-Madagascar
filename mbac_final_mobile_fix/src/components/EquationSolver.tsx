import React, { useState } from 'react';
import { solveEquation, type EquationResult } from '../lib/mathEngine';
import { MathExpression, MathText } from './MathNotation';
import { ReliabilityPanel } from './ReliabilityPanel';

interface EquationSolverProps { expression: string }

export const EquationSolver: React.FC<EquationSolverProps> = ({ expression }) => {
 const [k, setK] = useState('0');
 const [xMin, setXMin] = useState('-20');
 const [xMax, setXMax] = useState('20');
 const [result, setResult] = useState<EquationResult | null>(null);
 const [error, setError] = useState('');

 const handleSolve = () => {
  const kVal = Number(k.replace(',', '.'));
  const min = Number(xMin.replace(',', '.'));
  const max = Number(xMax.replace(',', '.'));
  if (![kVal, min, max].every(Number.isFinite)) { setError('Vérifie les valeurs de k et de l’intervalle.'); return; }
  try {
   setResult(solveEquation(expression, kVal, min, max));
   setError('');
  } catch (e: unknown) {
   setResult(null);
   setError(e instanceof Error ? e.message : 'Impossible de résoudre cette équation.');
  }
 };

 return (
  <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-5 border border-slate-700/50 shadow-lg">
   <div className="mb-4">
    <p className="text-[10px] text-violet-300 font-bold uppercase tracking-wider">Équation contrôlée</p>
    <h3 className="text-lg font-bold text-white mt-1">Résoudre f(x) = k</h3>
    <p className="text-[10px] text-slate-400 mt-1">Méthode exacte quand elle est disponible, sinon recherche numérique explicitement limitée.</p>
   </div>

   <div className="bg-slate-900/50 rounded-xl p-3 mb-4 border border-slate-700/30">
    <div className="text-center text-violet-200 mb-3"><MathExpression value={`${expression}=${k || 'k'}`} className="math-answer" /></div>
    <div className="grid grid-cols-3 gap-2">
     <div><label className="block text-[9px] text-slate-400 mb-1">k</label><input type="text" inputMode="decimal" value={k} onChange={e => { setK(e.target.value); setResult(null); }} className="w-full bg-slate-800 border border-slate-600/50 rounded-lg px-2 py-2 text-white text-center focus:border-violet-500 focus:outline-none" /></div>
     <div><label className="block text-[9px] text-slate-400 mb-1">Recherche de x min</label><input type="text" inputMode="decimal" value={xMin} onChange={e => setXMin(e.target.value)} className="w-full bg-slate-800 border border-slate-600/50 rounded-lg px-2 py-2 text-white text-center focus:border-violet-500 focus:outline-none" /></div>
     <div><label className="block text-[9px] text-slate-400 mb-1">Recherche de x max</label><input type="text" inputMode="decimal" value={xMax} onChange={e => setXMax(e.target.value)} className="w-full bg-slate-800 border border-slate-600/50 rounded-lg px-2 py-2 text-white text-center focus:border-violet-500 focus:outline-none" /></div>
    </div>
    <button onClick={handleSolve} className="w-full mt-3 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl">Résoudre et vérifier</button>
   </div>

   {error && <div className="rounded-xl p-3 mb-3 border border-red-500/30 bg-red-500/10 text-xs text-red-300">{error}</div>}

   {result && (
    <div className="space-y-3">
     <ReliabilityPanel
      level={result.quality}
      title={result.quality === 'verified' ? 'Résolution vérifiée' : result.quality === 'approximate' ? 'Résolution numérique contrôlée' : 'Résolution à contrôler'}
      detail={result.exact ? 'La méthode algébrique correspond au type d’équation détecté et chaque solution est substituée dans l’équation de départ.' : 'La méthode est numérique : seules les solutions détectées dans l’intervalle choisi sont annoncées.'}
      checks={result.verifications.map(v => ({ label: `Substitution pour x=${v.x}`, ok: v.ok, detail: v.fx === null ? 'f(x) non défini.' : `f(x)=${v.fx}; résidu=${v.residual ?? '—'}.` }))}
     />

     {result.warning && <div className="rounded-xl p-3 border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200">{result.warning}</div>}

     <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/30">
      <p className="text-[10px] text-slate-400">Méthode</p>
      <p className="text-sm text-white font-bold mt-1">{result.method}</p>
     </div>

     <div className={`rounded-xl p-4 border ${result.solutions.length ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
      <p className={`text-xs font-bold ${result.solutions.length || result.allDomain ? 'text-emerald-300' : 'text-amber-300'}`}>{result.allDomain ? 'Identité' : result.solutions.length ? 'Solutions retenues' : (result.exact ? 'Aucune solution réelle' : 'Aucune solution détectée dans l’intervalle')}</p>
      {result.allDomain && <p className="text-sm text-emerald-100 mt-2">Toutes les valeurs appartenant au domaine de définition de la fonction sont solutions.</p>}
      {result.solutions.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{result.solutions.map((sol, i) => <span key={i} className="bg-slate-950/40 border border-slate-700/30 text-white px-3 py-2 rounded-lg text-lg font-bold"><MathExpression value={`x=${sol}`} /></span>)}</div>}
      {!result.solutions.length && !result.exact && <p className="text-[10px] text-slate-400 mt-2">Cela signifie seulement qu’aucune solution n’a été trouvée sur <MathExpression value={`[${result.searchInterval[0]};${result.searchInterval[1]}]`} />.</p>}
     </div>

     <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/30">
      <p className="text-xs font-bold text-white mb-3">Étapes complètes</p>
      <div className="space-y-2">
       {result.steps.map((step, i) => (
        <div key={i} className="flex items-start gap-2.5 rounded-lg bg-slate-800/45 p-2.5">
         <span className="w-6 h-6 shrink-0 rounded-lg bg-violet-500/20 text-violet-300 text-[10px] font-black grid place-items-center">{i + 1}</span>
         <p className="text-xs text-slate-300 leading-relaxed"><MathText auto>{step}</MathText></p>
        </div>
       ))}
      </div>
     </div>
    </div>
   )}
  </div>
 );
};

import React from 'react';
import type { AnalysisResult } from '../lib/mathEngine';
import { MathExpression } from './MathNotation';

// ═══════════════════════════════════════════════════════════════════════════
// PARITY CARD
// ═══════════════════════════════════════════════════════════════════════════

export const ParityCard: React.FC<{ parity: AnalysisResult['parity'] }> = ({ parity }) => (
 <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-4 border border-slate-700/50">
  <div className="flex items-center gap-3 mb-3">
   <span className="text-2xl">
    {parity.type === 'even' ? '' : parity.type === 'odd' ? '' : ''}
   </span>
   <div>
    <h3 className="font-bold text-white">Parité</h3>
    <p className={`text-sm font-semibold ${
     parity.type === 'even' ? 'text-emerald-400' : 
     parity.type === 'odd' ? 'text-cyan-400' : 'text-slate-400'
    }`}>
     {parity.type === 'even' ? 'Fonction PAIRE' : 
      parity.type === 'odd' ? 'Fonction IMPAIRE' : parity.proven ? 'Ni paire ni impaire' : 'Parité non déterminée'}
    </p>
   </div>
  </div>
  <div className="bg-slate-900/50 rounded-lg p-3 text-sm">
   <p className="text-slate-300">{parity.explanation}</p>
   <p className="text-xs text-slate-500 mt-1">{parity.verification}</p>
  </div>
 </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// PERIODICITY CARD
// ═══════════════════════════════════════════════════════════════════════════

export const PeriodicityCard: React.FC<{ periodicity: AnalysisResult['periodicity'] }> = ({ periodicity }) => (
 <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-4 border border-slate-700/50">
  <div className="flex items-center gap-3 mb-3">
   <span className="text-2xl">{periodicity.isPeriodic ? '' : ''}</span>
   <div>
    <h3 className="font-bold text-white">Périodicité</h3>
    <p className={`text-sm font-semibold ${periodicity.isPeriodic ? 'text-violet-400' : 'text-slate-400'}`}>
     {periodicity.isPeriodic ? `Période T = ${periodicity.period === Math.PI ? 'π' : periodicity.period === 2 * Math.PI ? '2π' : periodicity.period}` : periodicity.proven ? 'Non périodique' : 'Périodicité non déterminée'}
    </p>
   </div>
  </div>
  <p className="text-sm text-slate-300">{periodicity.explanation}</p>
 </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// PRIMITIVE CARD
// ═══════════════════════════════════════════════════════════════════════════

export const PrimitiveCard: React.FC<{ primitiveExpr: string; expression: string }> = ({ primitiveExpr, expression }) => (
 <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-4 border border-slate-700/50">
  <div className="flex items-center gap-3 mb-3">
   <span className="text-2xl">∫</span>
   <h3 className="font-bold text-white">Primitive</h3>
  </div>
  <div className="bg-slate-900/50 rounded-lg p-3">
   <p className="text-xs text-slate-400 mb-1">Une primitive de <MathExpression value={`f(x)=${expression}`} /> est :</p>
   <div className="text-lg text-rose-300 text-center math-answer"><MathExpression value={`F(x)=${primitiveExpr}`} /></div>
  </div>
  <p className="text-xs text-slate-500 mt-2">La constante C dépend des conditions initiales.</p>
 </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// ASYMPTOTES CARD
// ═══════════════════════════════════════════════════════════════════════════

export const AsymptotesCard: React.FC<{ asymptotes: AnalysisResult['asymptotes'] }> = ({ asymptotes }) => {
 const hasAny = asymptotes.vertical.length > 0 || asymptotes.horizontal.length > 0 || asymptotes.oblique.length > 0;
 
 if (!hasAny) return null;

 return (
  <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-4 border border-slate-700/50">
   <div className="flex items-center gap-3 mb-3">
    <span className="text-2xl"></span>
    <h3 className="font-bold text-white">Asymptotes</h3>
   </div>

   <div className="space-y-2">
    {asymptotes.vertical.map((a, i) => (
     <div key={`v-${i}`} className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-red-500"></span>
      <span className="font-mono text-red-300">x = {a.x}</span>
      <span className="text-xs text-slate-500">verticale</span>
     </div>
    ))}
    {asymptotes.horizontal.map((a, i) => (
     <div key={`h-${i}`} className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
      <span className="font-mono text-blue-300">y = {a.y}</span>
      <span className="text-xs text-slate-500">horizontale en {a.direction}</span>
     </div>
    ))}
    {asymptotes.oblique.map((a, i) => (
     <div key={`o-${i}`} className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2 flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
      <span className="font-mono text-purple-300">y = {a.a}x + {a.b}</span>
      <span className="text-xs text-slate-500">oblique en {a.direction}</span>
     </div>
    ))}
   </div>
  </div>
 );
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPLETE SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

export const CompleteSummary: React.FC<{ result: AnalysisResult }> = ({ result }) => (
 <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-xl p-4 border border-indigo-500/20 space-y-3">
  <h3 className="font-bold text-white flex items-center gap-2">
   <span></span> Résumé complet
  </h3>

  <div className="grid grid-cols-2 gap-2 text-sm">
   <div className="bg-slate-900/50 rounded-lg p-2">
    <p className="text-xs text-indigo-400">Domaine</p>
    <p className="font-mono text-white text-xs">{result.domain.description}</p>
   </div>
   <div className="bg-slate-900/50 rounded-lg p-2">
    <p className="text-xs text-purple-400">Parité</p>
    <p className="text-white text-xs">{result.parity.type === 'even' ? 'Paire' : result.parity.type === 'odd' ? 'Impaire' : 'Aucune'}</p>
   </div>
   <div className="bg-slate-900/50 rounded-lg p-2">
    <p className="text-xs text-cyan-400">Dérivée</p>
    <div className="text-white text-xs truncate"><MathExpression value={result.derivativeExpr} /></div>
   </div>
   <div className="bg-slate-900/50 rounded-lg p-2">
    <p className="text-xs text-amber-400">Zéros</p>
    <p className="text-white text-xs">{result.zeros.length > 0 ? result.zeros.map(z => z.x).join(', ') : 'Aucun'}</p>
   </div>
  </div>

  {result.variation.criticalPoints.length > 0 && (
   <div className="bg-slate-900/50 rounded-lg p-2">
    <p className="text-xs text-rose-400 mb-1">Extremums</p>
    <div className="space-y-1">
     {result.variation.criticalPoints.map((cp, i) => (
      <p key={i} className="text-xs text-white">
       {cp.type} : ({cp.x} ; {cp.y})
      </p>
     ))}
    </div>
   </div>
  )}
 </div>
);

import React, { useState, useCallback } from 'react';
import { analyzeFunction, compareFunctions, type AnalysisResult, type CompareResult } from '../lib/mathEngine';
import { InteractiveGraph } from './InteractiveGraph';
import { MathExpression } from './MathNotation';
import { MiniKeyboard, prettyToMath } from './MiniKeyboard';
import { ReliabilityPanel } from './ReliabilityPanel';

interface FunctionCompareProps {
 onClose: () => void;
}

export const FunctionCompare: React.FC<FunctionCompareProps> = ({ onClose }) => {
 const [expr1, setExpr1] = useState('x²');
 const [expr2, setExpr2] = useState('x + 2');
 const [result1, setResult1] = useState<AnalysisResult | null>(null);
 const [result2, setResult2] = useState<AnalysisResult | null>(null);
 const [comparison, setComparison] = useState<CompareResult | null>(null);
 const [error, setError] = useState<string | null>(null);

 const handleCompare = useCallback(() => {
  setError(null);
  try {
   const m1 = prettyToMath(expr1);
   const m2 = prettyToMath(expr2);
   const r1 = analyzeFunction(m1, -10, 10);
   const r2 = analyzeFunction(m2, -10, 10);
   const comp = compareFunctions(m1, m2, -10, 10);
   setResult1(r1);
   setResult2(r2);
   setComparison(comp);
  } catch (e: unknown) {
   setError((e instanceof Error ? e.message : undefined) || 'Erreur de calcul');
  }
 }, [expr1, expr2]);

 return (
  <div className="fixed inset-0 bg-slate-950/95 z-50 overflow-y-auto">
   <div className="max-w-lg mx-auto px-4 py-6">
    {/* Header */}
    <div className="flex items-center justify-between mb-4">
     <h2 className="text-xl font-bold text-white flex items-center gap-2">
      <span></span> Comparer deux fonctions
     </h2>
     <button
      onClick={onClose}
      className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
     >
      
     </button>
    </div>

    {/* Inputs */}
    <div className="space-y-3 mb-4">
     <MiniKeyboard value={expr1} onChange={setExpr1} label="f(x) =" placeholder="Ex. x²" />
     <MiniKeyboard value={expr2} onChange={setExpr2} label="g(x) =" placeholder="Ex. x + 2" />
     <button
      onClick={handleCompare}
      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl"
     >
      Comparer les fonctions
     </button>
    </div>

    {error && (
     <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
      <p className="text-red-300">{error}</p>
     </div>
    )}

    {/* Graph */}
    {result1 && result2 && (
     <div className="space-y-4">
      {comparison && <ReliabilityPanel level={comparison.quality} title={comparison.quality === 'verified' ? 'Comparaison algébrique exacte' : comparison.quality === 'warning' ? 'Comparaison partiellement déterminée' : 'Comparaison numérique contrôlée'} detail={comparison.exact ? 'La différence f−g est un polynôme de degré ≤ 2 : intersections et position relative sont déterminées algébriquement sur ℝ.' : `La position relative est étudiée uniquement sur [${comparison.searchInterval[0]} ; ${comparison.searchInterval[1]}]. Les discontinuités détectées coupent automatiquement les intervalles et aucune conclusion n’est étendue à ±∞.`} checks={[{ label: 'Intersections recontrôlées', ok: comparison.verifiedIntersections === comparison.intersections.length, detail: `${comparison.verifiedIntersections}/${comparison.intersections.length} intersection(s) vérifiée(s) par substitution.` }, { label: 'Intervalles cohérents', ok: comparison.uncertainIntervals === 0, detail: comparison.uncertainIntervals === 0 ? 'Les échantillons de chaque intervalle donnent une position relative cohérente.' : `${comparison.uncertainIntervals} intervalle(s) restent ambigus : aucune conclusion automatique n’y est imposée.` }]} />}
      <InteractiveGraph
       data={result1.plotData}
       data2={result2.plotData}
       xMin={-10}
       xMax={10}
       label1="f(x)"
       label2="g(x)"
      />

      {/* Intersections */}
      {comparison && comparison.intersections.length > 0 && (
       <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
        <h3 className="text-sm font-bold text-emerald-300 mb-2"> Points d'intersection</h3>
        <p className="text-xs text-slate-400 mb-2">f(x) = g(x)</p>
        <div className="flex flex-wrap gap-2">
         {comparison.intersections.map((pt, i) => (
          <span key={i} className="bg-emerald-500/20 text-emerald-200 px-3 py-1 rounded-lg font-mono text-sm">
           ({pt.x} ; {pt.y})
          </span>
         ))}
        </div>
       </div>
      )}

      {/* Dominance */}
      {comparison && comparison.dominance.length > 0 && (
       <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-300 mb-2"> Position relative</h3>
        <div className="space-y-2">
         {comparison.dominance.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
           <span className="font-mono text-slate-400">{d.interval}</span>
           <span className="text-slate-500">→</span>
           <span className={`font-semibold ${
            d.dominant === 'f' ? 'text-indigo-400' : d.dominant === 'g' ? 'text-orange-400' : d.dominant === 'uncertain' ? 'text-amber-300' : 'text-slate-400'
           }`}>
            {d.dominant === 'f' ? 'f(x) > g(x)' : d.dominant === 'g' ? 'f(x) < g(x)' : d.dominant === 'uncertain' ? 'Zone à contrôler' : 'f(x) = g(x)'}
           </span>
          </div>
         ))}
        </div>
       </div>
      )}

      {/* Quick comparison */}
      <div className="grid grid-cols-2 gap-3">
       <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-3">
        <div className="text-xs text-indigo-400 font-semibold mb-1"><MathExpression value={`f(x)=${prettyToMath(expr1)}`} /></div>
        <p className="text-xs text-slate-400">Df = {result1.domain.description}</p>
       </div>
       <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
        <div className="text-xs text-orange-400 font-semibold mb-1"><MathExpression value={`g(x)=${prettyToMath(expr2)}`} /></div>
        <p className="text-xs text-slate-400">Dg = {result2.domain.description}</p>
       </div>
      </div>
     </div>
    )}
   </div>
  </div>
 );
};

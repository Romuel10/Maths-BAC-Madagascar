import React, { useState } from 'react';
import { computeTangent, type TangentInfo } from '../lib/mathEngine';
import { ReliabilityPanel } from './ReliabilityPanel';
import { MathExpression } from './MathNotation';

interface TangentCalculatorProps {
 expression: string;
 derivativeExpr: string;
}

export const TangentCalculator: React.FC<TangentCalculatorProps> = ({ expression, derivativeExpr }) => {
 const [x0, setX0] = useState<string>('1');
 const [tangent, setTangent] = useState<TangentInfo | null>(null);
 const [error, setError] = useState<string | null>(null);

 const handleCalculate = () => {
  setError(null);
  const x = parseFloat(x0);
  if (isNaN(x)) {
   setError('Entrez un nombre valide');
   return;
  }
  const result = computeTangent(expression, derivativeExpr, x);
  if (result) {
   setTangent(result);
  } else {
   setError('La fonction n\'est pas définie en ce point');
  }
 };

 return (
  <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-5 border border-slate-700/50 shadow-lg">
   <div className="flex items-center gap-3 mb-4">
    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xl">
     
    </div>
    <h3 className="text-lg font-bold text-white">Tangente en un point</h3>
   </div>

   {/* Input */}
   <div className="flex gap-2 mb-4">
    <div className="flex-1">
     <label className="block text-xs text-slate-400 mb-1">Point x₀ =</label>
     <input
      aria-label="Abscisse du point de tangence"
      type="number"
      value={x0}
      onChange={(e) => setX0(e.target.value)}
      className="w-full bg-slate-900/80 border border-slate-600/50 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
      step="0.5"
     />
    </div>
    <button
     onClick={handleCalculate}
     className="self-end px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors"
    >
     Calculer
    </button>
   </div>

   {error && (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
     <p className="text-red-300 text-sm">{error}</p>
    </div>
   )}

   {tangent && (
    <div className="space-y-3">
     <ReliabilityPanel level="verified" title="Tangente contrôlée" detail="La pente vient de la dérivée et l’équation est construite sous la forme y = f′(x₀)(x−x₀)+f(x₀), donc elle passe par le point de tangence." />
     {/* Result */}
     <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
      <p className="text-sm text-cyan-300 mb-2 font-semibold"> Équation de la tangente :</p>
      <div className="text-xl text-white text-center"><MathExpression value={tangent.equation} /></div>
     </div>

     {/* Steps */}
     <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-bold text-slate-300"> Calculs détaillés :</h4>
      
      <div className="space-y-2 text-sm">
       <div className="bg-slate-800/50 rounded p-2">
        <p className="text-slate-400">1. Point de tangence :</p>
        <p className="font-mono text-white">A({tangent.point.x} ; {tangent.point.y})</p>
       </div>

       <div className="bg-slate-800/50 rounded p-2">
        <p className="text-slate-400">2. Coefficient directeur (pente) :</p>
        <p className="font-mono text-slate-300">f'(x₀) = f'({tangent.point.x})</p>
        <p className="font-mono text-white">= {tangent.slope}</p>
       </div>

       <div className="bg-slate-800/50 rounded p-2">
        <p className="text-slate-400">3. Équation de la tangente :</p>
        <p className="font-mono text-slate-300">y = f'(x₀)(x - x₀) + f(x₀)</p>
        <p className="font-mono text-slate-300">y = {tangent.slope}(x - {tangent.point.x}) + {tangent.point.y}</p>
        <p className="font-mono text-cyan-300 font-bold">{tangent.equation}</p>
       </div>
      </div>
     </div>

     {/* Formula reminder */}
     <div className="bg-blue-500/5 rounded-lg p-3 border border-blue-500/20">
      <p className="text-xs text-blue-300 font-semibold mb-1"> Formule de la tangente</p>
      <p className="text-xs text-slate-400">
       La tangente à la courbe de f au point d'abscisse x₀ a pour équation :
      </p>
      <p className="font-mono text-sm text-white mt-1 text-center">
       y = f'(x₀)(x - x₀) + f(x₀)
      </p>
     </div>
    </div>
   )}

   {/* Interpretation */}
   {tangent && (
    <div className="mt-4 bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
     <p className="text-xs text-emerald-300 font-semibold mb-1"> Interprétation</p>
     <p className="text-xs text-slate-300">
      {tangent.slope > 0 && 'La tangente monte (pente positive) → la fonction est croissante en ce point.'}
      {tangent.slope < 0 && 'La tangente descend (pente négative) → la fonction est décroissante en ce point.'}
      {tangent.slope === 0 && 'La tangente est horizontale (pente nulle) : c’est un point stationnaire, mais cela ne suffit pas à conclure à un extremum.'}
     </p>
    </div>
   )}
  </div>
 );
};

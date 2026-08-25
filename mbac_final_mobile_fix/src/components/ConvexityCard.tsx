import React, { useState } from 'react';
import type { ConvexityInfo } from '../lib/mathEngine';
import { MathExpression } from './MathNotation';

interface ConvexityCardProps {
 convexity: ConvexityInfo;
 secondDerivativeExpr: string;
 expression: string;
}

export const ConvexityCard: React.FC<ConvexityCardProps> = ({ convexity, secondDerivativeExpr }) => {
 const [showSteps, setShowSteps] = useState(true);

 return (
  <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-5 border border-slate-700/50 shadow-lg">
   <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
     <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center text-xl">
      ⌒
     </div>
     <h3 className="text-lg font-bold text-white">Convexité</h3>
    </div>
    <button
     onClick={() => setShowSteps(!showSteps)}
     className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
      showSteps ? 'bg-orange-600/20 text-orange-300 border-orange-500/30' : 'bg-slate-700/30 text-slate-400 border-slate-600/30'
     }`}
    >
     {showSteps ? ' Masquer' : ' Méthode'}
    </button>
   </div>

   {/* Second derivative */}
   <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/30 mb-4">
    <p className="text-sm font-mono text-center">
     <span className="text-orange-300">f''(x)</span>
     <span className="text-slate-400 mx-2">=</span>
     <span className="text-white"><MathExpression value={secondDerivativeExpr} /></span>
    </p>
   </div>

   {/* Convexity intervals */}
   {convexity.intervals.length > 0 && (
    <div className="space-y-2 mb-4">
     {convexity.intervals.map((interval, i) => (
      <div key={i} className={`rounded-lg p-3 border ${
       interval.type === 'convex' 
        ? 'bg-emerald-500/10 border-emerald-500/30' 
        : 'bg-rose-500/10 border-rose-500/30'
      }`}>
       <div className="flex items-center justify-between">
        <span className="font-mono text-sm text-slate-300">
         x ∈ ]{interval.from} ; {interval.to}[
        </span>
        <span className={`text-sm font-bold ${
         interval.type === 'convex' ? 'text-emerald-400' : 'text-rose-400'
        }`}>
         {interval.type === 'convex' ? '⌣ Convexe' : '⌢ Concave'}
        </span>
       </div>
       <p className="text-xs text-slate-500 mt-1">
        f''(x) {interval.signSecondDeriv === '+' ? '>' : '<'} 0
       </p>
      </div>
     ))}
    </div>
   )}

   {/* Inflection points */}
   {convexity.inflectionPoints.length > 0 && (
    <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/30 mb-4">
     <p className="text-sm font-bold text-amber-300 mb-2"> Points d'inflexion</p>
     <div className="flex flex-wrap gap-2">
      {convexity.inflectionPoints.map((ip, i) => (
       <span key={i} className="bg-amber-500/20 text-amber-200 px-3 py-1 rounded-full text-sm font-mono">
        ({ip.x} ; {ip.y})
       </span>
      ))}
     </div>
    </div>
   )}

   {/* Explanation */}
   {showSteps && (
    <div className="space-y-4 pt-3 border-t border-slate-700/40">
     <div className="bg-blue-500/5 rounded-lg p-4 border border-blue-500/20">
      <h4 className="text-sm font-bold text-blue-300 mb-2"> Qu'est-ce que la convexité ?</h4>
      <p className="text-xs text-slate-300 mb-3">
       La convexité décrit la forme de la courbe : elle est liée à la dérivée seconde f''(x).
      </p>
      <div className="grid grid-cols-2 gap-2">
       <div className="bg-slate-800/50 rounded p-2">
        <p className="text-emerald-400 font-bold text-sm">f''(x) {'>'} 0</p>
        <p className="text-slate-400 text-xs">Courbe convexe (⌣)</p>
        <p className="text-slate-500 text-xs">« sourit »</p>
       </div>
       <div className="bg-slate-800/50 rounded p-2">
        <p className="text-rose-400 font-bold text-sm">f''(x) {'<'} 0</p>
        <p className="text-slate-400 text-xs">Courbe concave (⌢)</p>
        <p className="text-slate-500 text-xs">« pleure »</p>
       </div>
      </div>
     </div>

     <div className="bg-amber-500/5 rounded-lg p-4 border border-amber-500/20">
      <h4 className="text-sm font-bold text-amber-300 mb-2"> Point d'inflexion</h4>
      <p className="text-xs text-slate-300">
       C'est le point où la courbe change de convexité (de ⌣ à ⌢ ou inversement).
       <br />On le trouve en résolvant <span className="font-mono text-amber-300">f''(x) = 0</span> et en vérifiant le changement de signe.
      </p>
     </div>

     <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/20">
      <h4 className="text-sm font-bold text-emerald-300 mb-2"> Méthode</h4>
      <ol className="space-y-1 text-xs text-slate-300 list-decimal list-inside">
       <li>Calculer f'(x), puis f''(x)</li>
       <li>Résoudre f''(x) = 0</li>
       <li>Étudier le signe de f''(x) sur chaque intervalle</li>
       <li>f'' {'>'} 0 → convexe, f'' {'<'} 0 → concave</li>
      </ol>
     </div>
    </div>
   )}
  </div>
 );
};

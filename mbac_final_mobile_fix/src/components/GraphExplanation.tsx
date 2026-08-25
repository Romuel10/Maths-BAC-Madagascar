import React, { useState } from 'react';
import type { AnalysisResult } from '../lib/mathEngine';

interface GraphExplanationProps {
 result: AnalysisResult;
}

export const GraphExplanation: React.FC<GraphExplanationProps> = ({ result }) => {
 const [expanded, setExpanded] = useState(false);

 const { variation, domain, limits } = result;
 const { criticalPoints } = variation;

 // Detect asymptotes
 const verticalAsymptotes = limits
  .filter(l => l.point !== '+∞' && l.point !== '-∞' && (l.value === '+∞' || l.value === '-∞'))
  .map(l => l.point)
  .filter((v, i, a) => a.indexOf(v) === i);

 const horizontalAsymptotes = limits
  .filter(l => (l.point === '+∞' || l.point === '-∞') && l.value !== '+∞' && l.value !== '-∞' && l.value !== '')
  .map(l => l.value)
  .filter((v, i, a) => a.indexOf(v) === i);

 return (
  <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl p-4 border border-slate-700/40">
   <button
    onClick={() => setExpanded(!expanded)}
    className="w-full flex items-center justify-between"
   >
    <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
     <span></span> Comment tracer cette courbe ?
    </h4>
    <span className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>
     ▼
    </span>
   </button>

   {expanded && (
    <div className="mt-4 space-y-4">

     {/* Steps overview */}
     <div className="bg-blue-500/5 rounded-lg p-4 border border-blue-500/20">
      <h5 className="text-sm font-bold text-blue-300 mb-3"> Méthode pour tracer la courbe</h5>
      <div className="space-y-3 text-sm text-slate-300">

       {/* Step 1 */}
       <div className="flex items-start gap-3">
        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
        <div>
         <p className="font-semibold text-white">Tracer les axes et les asymptotes</p>
         <p className="text-slate-400 text-xs mt-0.5">
          Dessiner l'axe des x, l'axe des y, puis les asymptotes en pointillés.
         </p>
         {(verticalAsymptotes.length > 0 || horizontalAsymptotes.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-2">
           {verticalAsymptotes.map((a, i) => (
            <span key={`v-${i}`} className="text-xs bg-red-500/10 text-red-300 px-2 py-0.5 rounded font-mono">
             x = {a} (verticale)
            </span>
           ))}
           {horizontalAsymptotes.map((a, i) => (
            <span key={`h-${i}`} className="text-xs bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded font-mono">
             y = {a} (horizontale)
            </span>
           ))}
          </div>
         )}
        </div>
       </div>

       {/* Step 2 */}
       <div className="flex items-start gap-3">
        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
        <div>
         <p className="font-semibold text-white">Placer les points remarquables</p>
         <p className="text-slate-400 text-xs mt-0.5">
          Marquer les extremums (max/min) et les points où la fonction vaut 0.
         </p>
         {criticalPoints.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
           {criticalPoints.map((cp, i) => (
            <span key={i} className={`text-xs px-2 py-0.5 rounded font-mono ${
             cp.type.includes('max') ? 'bg-rose-500/10 text-rose-300' : 
             cp.type.includes('min') ? 'bg-cyan-500/10 text-cyan-300' : 
             'bg-amber-500/10 text-amber-300'
            }`}>
             ({cp.x}, {cp.y})
            </span>
           ))}
          </div>
         )}
        </div>
       </div>

       {/* Step 3 */}
       <div className="flex items-start gap-3">
        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
        <div>
         <p className="font-semibold text-white">Utiliser le tableau de variation</p>
         <p className="text-slate-400 text-xs mt-0.5">
          Entre chaque point clé, dessiner la courbe qui monte (↗) ou descend (↘) selon le tableau.
         </p>
        </div>
       </div>

       {/* Step 4 */}
       <div className="flex items-start gap-3">
        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">4</span>
        <div>
         <p className="font-semibold text-white">Respecter les limites</p>
         <p className="text-slate-400 text-xs mt-0.5">
          La courbe doit respecter les limites calculées. Une asymptote verticale correspond à une valeur exclue du domaine ; une asymptote horizontale ou oblique peut parfois être coupée par la courbe.
         </p>
        </div>
       </div>

       {/* Step 5 */}
       <div className="flex items-start gap-3">
        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">5</span>
        <div>
         <p className="font-semibold text-white">Relier les points en douceur</p>
         <p className="text-slate-400 text-xs mt-0.5">
          Tracer une courbe lisse qui passe par tous les points, sans angles vifs (sauf cas spéciaux).
         </p>
        </div>
       </div>

      </div>
     </div>

     {/* Reading the graph */}
     <div className="bg-purple-500/5 rounded-lg p-4 border border-purple-500/20">
      <h5 className="text-sm font-bold text-purple-300 mb-3"> Que lit-on sur cette courbe ?</h5>
      <div className="space-y-2 text-sm text-slate-300">

       <div className="bg-slate-800/50 rounded p-2">
        <p className="font-semibold text-white">Ensemble de définition</p>
        <p className="text-slate-400 text-xs">
         La courbe n'existe que pour les x ∈ {domain.description}
        </p>
       </div>

       {criticalPoints.filter(cp => cp.type.includes('max')).length > 0 && (
        <div className="bg-slate-800/50 rounded p-2">
         <p className="font-semibold text-rose-300">Maximum(s)</p>
         <p className="text-slate-400 text-xs">
          {criticalPoints.filter(cp => cp.type.includes('max')).map(cp => 
           `f atteint un maximum de ${cp.y} en x = ${cp.x}`
          ).join(' ; ')}
         </p>
        </div>
       )}

       {criticalPoints.filter(cp => cp.type.includes('min')).length > 0 && (
        <div className="bg-slate-800/50 rounded p-2">
         <p className="font-semibold text-cyan-300">Minimum(s)</p>
         <p className="text-slate-400 text-xs">
          {criticalPoints.filter(cp => cp.type.includes('min')).map(cp => 
           `f atteint un minimum de ${cp.y} en x = ${cp.x}`
          ).join(' ; ')}
         </p>
        </div>
       )}

       {verticalAsymptotes.length > 0 && (
        <div className="bg-slate-800/50 rounded p-2">
         <p className="font-semibold text-red-300">Asymptotes verticales</p>
         <p className="text-slate-400 text-xs">
          La valeur de f(x) devient non bornée lorsqu’on approche x = {verticalAsymptotes.join(', ')}
         </p>
        </div>
       )}

       {horizontalAsymptotes.length > 0 && (
        <div className="bg-slate-800/50 rounded p-2">
         <p className="font-semibold text-blue-300">Asymptotes horizontales</p>
         <p className="text-slate-400 text-xs">
          La courbe se rapproche de y = {horizontalAsymptotes.join(' et y = ')} quand x → ±∞
         </p>
        </div>
       )}

      </div>
     </div>

     {/* Key takeaway */}
     <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20 text-center">
      <p className="text-sm text-emerald-300">
        Le graphe est la <strong>représentation visuelle</strong> de tout ce qu'on a calculé !
      </p>
     </div>

    </div>
   )}
  </div>
 );
};

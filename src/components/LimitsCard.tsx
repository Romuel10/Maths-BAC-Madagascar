import React, { useState } from 'react';
import type { LimitInfo } from '../lib/mathEngine';
import { MathExpression } from './MathNotation';

interface LimitsCardProps {
 limits: LimitInfo[];
 expression: string;
}

export const LimitsCard: React.FC<LimitsCardProps> = ({ limits, expression }) => {
 const [showSteps, setShowSteps] = useState(true);

 if (limits.length === 0) {
  return (
   <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
    <p className="text-sm font-bold text-amber-200">Limites non déterminées automatiquement</p>
    <p className="text-xs text-slate-300 mt-1 leading-relaxed">Les essais numériques ne sont pas assez stables pour annoncer une limite fiable. Utilise l’étude analytique (forme dominante, factorisation, conjugué ou équivalent) avant de conclure.</p>
   </div>
  );
 }

 // Separate limits by type
 const infinityLimits = limits.filter(l => l.point === '+∞' || l.point === '-∞');
 const finiteLimits = limits.filter(l => l.point !== '+∞' && l.point !== '-∞');

 // Detect asymptotes
 const verticalAsymptotes: string[] = [];
 const horizontalAsymptotes: string[] = [];

 finiteLimits.forEach(l => {
  if (l.value === '+∞' || l.value === '-∞') {
   if (!verticalAsymptotes.includes(l.point)) {
    verticalAsymptotes.push(l.point);
   }
  }
 });

 infinityLimits.forEach(l => {
  if (l.value !== '+∞' && l.value !== '-∞' && l.value !== '') {
   const asym = `y = ${l.value}`;
   if (!horizontalAsymptotes.includes(asym)) {
    horizontalAsymptotes.push(asym);
   }
  }
 });

 return (
  <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-5 border border-slate-700/50 shadow-lg">
   {/* Header */}
   <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
     <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xl">
      
     </div>
     <h3 className="text-lg font-bold text-white">Limites aux Bornes</h3>
    </div>
    <button
     onClick={() => setShowSteps(!showSteps)}
     className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
      showSteps 
       ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/30' 
       : 'bg-slate-700/30 text-slate-400 border-slate-600/30'
     }`}
    >
     {showSteps ? ' Masquer' : ' Méthode'}
    </button>
   </div>

   {/* Results */}
   <div className="space-y-2 mb-4">
    {limits.map((limit, i) => (
     <div
      key={i}
      className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/30 flex items-center justify-between gap-4"
     >
      <div className="flex items-center gap-2 text-sm font-mono flex-1">
       <span className="text-slate-400">lim</span>
       <span className="text-xs text-slate-500">
        x→{limit.point}{limit.direction}
       </span>
       <span className="text-cyan-300">f(x)</span>
      </div>
      <div className="flex items-center gap-2">
       <span className="text-slate-400">=</span>
       <span className={`font-bold font-mono text-lg ${
        limit.value === '+∞' ? 'text-emerald-400' :
        limit.value === '-∞' ? 'text-red-400' :
        'text-white'
       }`}>
        {limit.value}
       </span>
      </div>
     </div>
    ))}
   </div>

   {/* ══════════════════════════════════════════════════════════════ */}
   {/* EXPLANATIONS */}
   {/* ══════════════════════════════════════════════════════════════ */}
   {showSteps && (
    <div className="space-y-4 pt-3 border-t border-slate-700/40">

     {/* What are limits? */}
     <div className="bg-blue-500/5 rounded-lg p-4 border border-blue-500/20">
      <h4 className="text-sm font-bold text-blue-300 mb-2 flex items-center gap-2">
       <span></span> Qu'est-ce qu'une limite ?
      </h4>
      <p className="text-sm text-slate-300 leading-relaxed">
       La limite de <span className="font-mono text-cyan-300">f(x)</span> quand <span className="font-mono text-cyan-300">x</span> tend vers une valeur <span className="font-mono">a</span> décrit le comportement de la fonction lorsque x s'approche de <span className="font-mono">a</span>.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
       <div className="bg-slate-800/50 rounded-lg p-2">
        <p className="text-emerald-300 font-semibold">lim = +∞</p>
        <p className="text-slate-400">f(x) devient infiniment grand (positif)</p>
       </div>
       <div className="bg-slate-800/50 rounded-lg p-2">
        <p className="text-red-300 font-semibold">lim = −∞</p>
        <p className="text-slate-400">f(x) devient infiniment grand (négatif)</p>
       </div>
       <div className="bg-slate-800/50 rounded-lg p-2 col-span-2">
        <p className="text-white font-semibold">lim = L (nombre fini)</p>
        <p className="text-slate-400">f(x) s'approche de la valeur L</p>
       </div>
      </div>
     </div>

     {/* Why calculate limits? */}
     <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/20">
      <h4 className="text-sm font-bold text-emerald-300 mb-3 flex items-center gap-2">
       <span></span> Pourquoi calculer les limites ?
      </h4>
      <div className="space-y-2 text-sm text-slate-300">
       <div className="flex items-start gap-2">
        <span className="text-emerald-400 font-bold">1.</span>
        <p><strong className="text-white">Comportement à l'infini</strong> — Comment se comporte la courbe très loin vers la droite (+∞) ou vers la gauche (−∞) ?</p>
       </div>
       <div className="flex items-start gap-2">
        <span className="text-emerald-400 font-bold">2.</span>
        <p><strong className="text-white">Points problématiques</strong> — Que se passe-t-il près des valeurs exclues du domaine ?</p>
       </div>
       <div className="flex items-start gap-2">
        <span className="text-emerald-400 font-bold">3.</span>
        <p><strong className="text-white">Asymptotes</strong> — Trouver les droites dont la distance à la courbe tend vers 0 dans la situation étudiée.</p>
       </div>
      </div>
     </div>

     {/* Limits at infinity explanation */}
     {infinityLimits.length > 0 && (
      <div className="bg-purple-500/5 rounded-lg p-4 border border-purple-500/20">
       <h4 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
        <span></span> Limites à l'infini
       </h4>
       <p className="text-sm text-slate-300 mb-3">
        Pour <span className="text-white"><MathExpression value={`f(x)=${expression}`} /></span> :
       </p>
       <div className="space-y-2">
        {infinityLimits.map((l, i) => (
         <div key={i} className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-sm">
           Quand <span className="font-mono text-cyan-300">x → {l.point}</span> :
          </p>
          <p className="text-sm text-slate-400 mt-1">
           {l.value === '+∞' && '→ La fonction croît sans limite vers +∞'}
           {l.value === '-∞' && '→ La fonction décroît sans limite vers −∞'}
           {l.value !== '+∞' && l.value !== '-∞' && (
            <>→ La fonction se stabilise vers <span className="text-white font-mono">{l.value}</span> (asymptote horizontale)</>
           )}
          </p>
         </div>
        ))}
       </div>
      </div>
     )}

     {/* Limits at finite points */}
     {finiteLimits.length > 0 && (
      <div className="bg-amber-500/5 rounded-lg p-4 border border-amber-500/20">
       <h4 className="text-sm font-bold text-amber-300 mb-3 flex items-center gap-2">
        <span></span> Limites aux points exclus
       </h4>
       <p className="text-sm text-slate-300 mb-3">
        Ces limites étudient le comportement près des "trous" du domaine :
       </p>
       <div className="space-y-2">
        {finiteLimits.map((l, i) => (
         <div key={i} className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-sm">
           <span className="font-mono text-amber-300">x → {l.point}{l.direction}</span>
           <span className="text-slate-500 mx-2">signifie</span>
           {l.direction === '⁻' && <span className="text-slate-300">x s'approche de {l.point} par la gauche (valeurs {'<'} {l.point})</span>}
           {l.direction === '⁺' && <span className="text-slate-300">x s'approche de {l.point} par la droite (valeurs {'>'} {l.point})</span>}
          </p>
          <p className="text-sm text-slate-400 mt-1">
           {(l.value === '+∞' || l.value === '-∞') && (
            <>→ La courbe "explose" vers {l.value} — <span className="text-red-300">asymptote verticale en x = {l.point}</span></>
           )}
          </p>
         </div>
        ))}
       </div>
      </div>
     )}

     {/* Asymptotes summary */}
     {(verticalAsymptotes.length > 0 || horizontalAsymptotes.length > 0) && (
      <div className="bg-rose-500/5 rounded-lg p-4 border border-rose-500/20">
       <h4 className="text-sm font-bold text-rose-300 mb-3 flex items-center gap-2">
        <span></span> Asymptotes détectées
       </h4>
       <p className="text-xs text-slate-400 mb-3">
        Une asymptote décrit un comportement limite : la distance entre la courbe et la droite tend vers 0. Une asymptote horizontale ou oblique peut être traversée par la courbe.
       </p>
       <div className="space-y-2">
        {verticalAsymptotes.map((a, i) => (
         <div key={`v-${i}`} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-red-400"></span>
          <span className="font-mono text-red-300">x = {a}</span>
          <span className="text-slate-500">— asymptote verticale</span>
         </div>
        ))}
        {horizontalAsymptotes.map((a, i) => (
         <div key={`h-${i}`} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          <span className="font-mono text-blue-300">{a}</span>
          <span className="text-slate-500">— asymptote horizontale</span>
         </div>
        ))}
       </div>
      </div>
     )}

    </div>
   )}
  </div>
 );
};

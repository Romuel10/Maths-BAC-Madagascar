import React, { useState } from 'react';
import type { DomainInfo } from '../lib/mathEngine';
import { MathExpression } from './MathNotation';

interface DomainCardProps {
 domain: DomainInfo;
 expression?: string;
}

export const DomainCard: React.FC<DomainCardProps> = ({ domain, expression }) => {
 const [showSteps, setShowSteps] = useState(true);

 // Detect function types for explanation
 const exprLower = (expression || '').toLowerCase();
 const hasSquareRoot = exprLower.includes('sqrt');
 const hasLog = exprLower.includes('log');
 const hasFraction = exprLower.includes('/');
 const hasTan = exprLower.includes('tan');

 return (
  <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-5 border border-slate-700/50 shadow-lg">
   {/* Header */}
   <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
     <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xl">
      
     </div>
     <h3 className="text-lg font-bold text-white">Ensemble de Définition</h3>
    </div>
    <button
     onClick={() => setShowSteps(!showSteps)}
     className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
      showSteps 
       ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30' 
       : 'bg-slate-700/30 text-slate-400 border-slate-600/30'
     }`}
    >
     {showSteps ? ' Masquer' : ' Méthode'}
    </button>
   </div>

   {/* Result box */}
   <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700/30 mb-4">
    <p className="text-center text-xl font-mono tracking-wide">
     <span className="text-indigo-300 font-semibold">Df</span>
     <span className="text-slate-400 mx-2">=</span>
     <span className="text-white font-semibold">{domain.description}</span>
    </p>
   </div>

   {/* Excluded points badges */}
   {domain.excludedPoints.length > 0 && (
    <div className="flex flex-wrap gap-2 mb-4">
     {domain.excludedPoints.map((p, i) => (
      <span key={i} className="bg-red-500/15 text-red-300 border border-red-500/30 px-3 py-1 rounded-full text-sm font-mono">
       x ≠ {p}
      </span>
     ))}
    </div>
   )}

   {/* ══════════════════════════════════════════════════════════════ */}
   {/* EXPLANATIONS / STEPS */}
   {/* ══════════════════════════════════════════════════════════════ */}
   {showSteps && (
    <div className="space-y-4 pt-3 border-t border-slate-700/40">
     
     {/* What is Df? */}
     <div className="bg-blue-500/5 rounded-lg p-4 border border-blue-500/20">
      <h4 className="text-sm font-bold text-blue-300 mb-2 flex items-center gap-2">
       <span></span> Qu'est-ce que l'ensemble de définition ?
      </h4>
      <p className="text-sm text-slate-300 leading-relaxed">
       L'ensemble de définition <span className="font-mono text-indigo-300">Df</span> est l'ensemble de toutes les valeurs de <span className="font-mono text-indigo-300">x</span> pour lesquelles la fonction <span className="font-mono text-indigo-300">f(x)</span> existe et donne un résultat réel.
      </p>
     </div>

     {/* Method */}
     <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/20">
      <h4 className="text-sm font-bold text-emerald-300 mb-3 flex items-center gap-2">
       <span></span> Méthode pour trouver Df
      </h4>
      <div className="space-y-3 text-sm text-slate-300">
       <p>On cherche les valeurs de x qui posent problème. Il faut vérifier :</p>
       
       <div className="space-y-2 ml-2">
        {/* Fraction rule */}
        {hasFraction && (
         <div className="flex items-start gap-2 bg-slate-800/50 rounded-lg p-3">
          <span className="text-amber-400 font-bold">1.</span>
          <div>
           <p className="font-semibold text-amber-200">Division par zéro interdite</p>
           <p className="text-slate-400 mt-1">
            Si f(x) contient une fraction <span className="font-mono">a/b</span>, alors <span className="font-mono text-red-300">b ≠ 0</span>
           </p>
           <p className="text-slate-500 mt-1 text-xs">
            → On résout l'équation du dénominateur = 0 pour trouver les valeurs interdites
           </p>
          </div>
         </div>
        )}

        {/* Square root rule */}
        {hasSquareRoot && (
         <div className="flex items-start gap-2 bg-slate-800/50 rounded-lg p-3">
          <span className="text-amber-400 font-bold">{hasFraction ? '2.' : '1.'}</span>
          <div>
           <p className="font-semibold text-amber-200">Racine carrée d'un nombre négatif interdite</p>
           <p className="text-slate-400 mt-1">
            Si f(x) contient <span className="font-mono">√(expression)</span>, alors <span className="font-mono text-emerald-300">expression ≥ 0</span>
           </p>
           <p className="text-slate-500 mt-1 text-xs">
            → On résout l'inéquation pour trouver les valeurs autorisées
           </p>
          </div>
         </div>
        )}

        {/* Logarithm rule */}
        {hasLog && (
         <div className="flex items-start gap-2 bg-slate-800/50 rounded-lg p-3">
          <span className="text-amber-400 font-bold">{(hasFraction ? 1 : 0) + (hasSquareRoot ? 1 : 0) + 1}.</span>
          <div>
           <p className="font-semibold text-amber-200">Logarithme d'un nombre ≤ 0 interdit</p>
           <p className="text-slate-400 mt-1">
            Si f(x) contient <span className="font-mono">ln(expression)</span>, alors <span className="font-mono text-emerald-300">expression {'>'} 0</span>
           </p>
           <p className="text-slate-500 mt-1 text-xs">
            → On résout l'inéquation stricte pour trouver les valeurs autorisées
           </p>
          </div>
         </div>
        )}

        {/* Tan rule */}
        {hasTan && (
         <div className="flex items-start gap-2 bg-slate-800/50 rounded-lg p-3">
          <span className="text-amber-400 font-bold">•</span>
          <div>
           <p className="font-semibold text-amber-200">Tangente non définie en π/2 + kπ</p>
           <p className="text-slate-400 mt-1">
            <span className="font-mono">tan(x)</span> n'existe pas quand <span className="font-mono text-red-300">x = π/2 + kπ</span> (k entier)
           </p>
          </div>
         </div>
        )}

        {/* Polynomial - always defined */}
        {!hasFraction && !hasSquareRoot && !hasLog && !hasTan && (
         <div className="flex items-start gap-2 bg-slate-800/50 rounded-lg p-3">
          <span className="text-emerald-400"></span>
          <div>
           <p className="font-semibold text-emerald-200">Fonction polynôme ou simple</p>
           <p className="text-slate-400 mt-1">
            Les polynômes et fonctions trigonométriques simples (sin, cos) sont définis sur <span className="font-mono text-emerald-300">ℝ</span> tout entier.
           </p>
          </div>
         </div>
        )}
       </div>
      </div>
     </div>

     {/* Application to this function */}
     {expression && (
      <div className="bg-purple-500/5 rounded-lg p-4 border border-purple-500/20">
       <h4 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
        <span></span> Application à notre fonction
       </h4>
       <div className="space-y-2 text-sm">
        <p className="text-slate-300">
         Pour <span className="text-white"><MathExpression value={`f(x)=${expression}`} /></span> :
        </p>
        
        {domain.type === 'R' ? (
         <p className="text-emerald-300 bg-emerald-500/10 rounded-lg p-3">
           Aucune restriction trouvée → <span className="font-bold">Df = ℝ</span>
         </p>
        ) : (
         <div className="space-y-2">
          {domain.excludedPoints.length > 0 && (
           <p className="text-amber-300 bg-amber-500/10 rounded-lg p-3">
             Valeurs interdites : <span className="font-mono font-bold">{domain.excludedPoints.join(', ')}</span>
            <br/>
            <span className="text-slate-400 text-xs">Ces valeurs annulent un dénominateur ou rendent une expression indéfinie.</span>
           </p>
          )}
          <p className="text-indigo-300 bg-indigo-500/10 rounded-lg p-3">
            Conclusion : <span className="font-mono font-bold">Df = {domain.description}</span>
          </p>
         </div>
        )}
       </div>
      </div>
     )}

     {/* Intervals visualization */}
     {domain.intervals.length > 0 && (
      <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/30">
       <h4 className="text-sm font-bold text-slate-300 mb-2"> Intervalles de définition :</h4>
       <div className="flex flex-wrap gap-2">
        {domain.intervals.map((interval, i) => (
         <React.Fragment key={i}>
          <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-sm font-mono">
           {interval}
          </span>
          {i < domain.intervals.length - 1 && (
           <span className="text-slate-400 self-center text-lg">∪</span>
          )}
         </React.Fragment>
        ))}
       </div>
       <p className="text-xs text-slate-500 mt-2">
        Le symbole ∪ signifie "union" — la fonction existe sur tous ces intervalles.
       </p>
      </div>
     )}
    </div>
   )}
  </div>
 );
};

import React, { useState } from 'react';
import type { AnalysisResult } from '../lib/mathEngine';
import { MathExpression, MathText } from './MathNotation';
import { ReliabilityPanel } from './ReliabilityPanel';

interface StepByStepProps {
 result: AnalysisResult;
}

export const StepByStep: React.FC<StepByStepProps> = ({ result }) => {
 const [openSections, setOpenSections] = useState<Set<string>>(new Set(['domain', 'derivative', 'critical', 'sign', 'limits']));

 const toggleSection = (section: string) => {
  setOpenSections(prev => {
   const next = new Set(prev);
   if (next.has(section)) {
    next.delete(section);
   } else {
    next.add(section);
   }
   return next;
  });
 };

 const { steps, expression, derivativeExpr, domain, limits, variation } = result;
 const derivativeCheck = result.quality.checks.find(check => check.label === 'Contrôle de la dérivée');
 const secondDerivativeCheck = result.quality.checks.find(check => check.label === 'Contrôle de la dérivée seconde');
 const meaningfulDerivativeSteps = steps.derivativeSteps.filter(step => !['Constante', 'Variable'].includes(step.rule));
 const derivativeDisplaySteps = meaningfulDerivativeSteps.length ? meaningfulDerivativeSteps : steps.derivativeSteps;

 return (
  <div className="space-y-3">
   <ReliabilityPanel level={result.quality.level} title={result.quality.title} detail={result.quality.detail} checks={result.quality.checks} />
   <div className="rounded-xl border border-slate-700/30 bg-slate-900/50 p-3">
    <p className="text-[0.625rem] font-bold text-slate-300">Lecture conseillée</p>
    <p className="text-[0.625rem] text-slate-500 mt-1 leading-relaxed">Lis les blocs dans l’ordre : domaine → dérivée → points critiques → limites. Les détails sont ouverts par défaut pour pouvoir comparer chaque ligne avec ton propre calcul.</p>
   </div>
   {/* ═══════════════════════════════════════════════════════════════ */}
   {/* ÉTAPE 1 : ENSEMBLE DE DÉFINITION */}
   {/* ═══════════════════════════════════════════════════════════════ */}
   <div className="bg-gradient-to-br from-indigo-900/20 to-indigo-950/30 rounded-xl border border-indigo-500/20 overflow-hidden">
    <button
     onClick={() => toggleSection('domain')}
     className="w-full px-4 py-3 flex items-center justify-between text-left"
    >
     <div className="flex items-center gap-3">
      <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">1</span>
      <div>
       <h3 className="font-bold text-indigo-200">Ensemble de définition (Df)</h3>
       <p className="text-xs text-indigo-400/70">Où la fonction existe-t-elle ?</p>
      </div>
     </div>
     <span className={`text-indigo-400 transition-transform ${openSections.has('domain') ? 'rotate-180' : ''}`}>▼</span>
    </button>

    {openSections.has('domain') && (
     <div className="px-4 pb-4 space-y-4">
      {/* Rappel théorique */}
      <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
       <p className="text-xs font-bold text-blue-300 mb-2"> Rappel de cours</p>
       <p className="text-xs text-slate-300 leading-relaxed">
        L'ensemble de définition <span className="font-mono text-indigo-300">Df</span> contient toutes les valeurs de x pour lesquelles f(x) est calculable. On doit exclure les valeurs qui provoquent :
       </p>
       <ul className="text-xs text-slate-400 mt-2 space-y-1 ml-4">
        <li>• Une <span className="text-red-300">division par zéro</span></li>
        <li>• Une <span className="text-red-300">racine carrée d'un nombre négatif</span></li>
        <li>• Un <span className="text-red-300">logarithme d'un nombre ≤ 0</span></li>
       </ul>
      </div>

      {/* Étapes de calcul */}
      {steps.domainSteps.map((step, i) => (
       <div key={i} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
        <div className="flex items-start gap-2">
         <span className="w-5 h-5 rounded-full bg-indigo-600/50 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">
          {String.fromCharCode(97 + i)}
         </span>
         <div className="flex-1 space-y-2">
          <p className="text-sm font-semibold text-amber-300">{step.rule}</p>
          <p className="text-xs text-slate-400">{step.condition}</p>
          {step.equation !== '-' && (
           <div className="bg-slate-900/50 rounded p-2">
            <p className="text-xs text-slate-500">Équation à résoudre :</p>
            <div className="text-sm text-white mt-1"><MathExpression value={step.equation} /></div>
           </div>
          )}
          <p className="text-xs text-slate-400">{step.solution}</p>
          <div className="flex flex-wrap gap-1">
           {step.result.map((r, j) => (
            <span key={j} className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
             <MathText auto>{r}</MathText>
            </span>
           ))}
          </div>
         </div>
        </div>
       </div>
      ))}

      {/* Conclusion */}
      <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
       <p className="text-xs font-bold text-emerald-300 mb-1"> Conclusion</p>
       <div className="text-lg text-white math-answer">
        <MathExpression value={`Df=${domain.description}`} />
       </div>
       {domain.excludedPoints.length > 0 && (
        <p className="text-xs text-slate-400 mt-2">
         Valeurs interdites : {domain.excludedPoints.map(p => `x = ${p}`).join(', ')}
        </p>
       )}
      </div>
     </div>
    )}
   </div>

   {/* ═══════════════════════════════════════════════════════════════ */}
   {/* ÉTAPE 2 : DÉRIVÉE — version pédagogique BAC */}
   {/* ═══════════════════════════════════════════════════════════════ */}
   <section className="paper-card overflow-hidden">
    <button onClick={() => toggleSection('derivative')} className="w-full px-4 py-4 flex items-center justify-between text-left">
     <div className="flex items-center gap-3">
      <span className="step-index">2</span>
      <div>
       <h3 className="section-title">Dériver la fonction</h3>
       <p className="section-copy mt-0.5">Méthode courte, calcul lisible, réponse simplifiée à la fin.</p>
      </div>
     </div>
     <span className={`muted transition-transform ${openSections.has('derivative') ? 'rotate-180' : ''}`}>⌄</span>
    </button>

    {openSections.has('derivative') && (
     <div className="px-4 pb-4 space-y-3">
      <div className="formula-strip">
       <p className="eyebrow">Fonction de départ</p>
       <div className="text-xl mt-2 overflow-x-auto"><MathExpression value={`f(x)=${expression}`} block /></div>
      </div>

      <div className="paper-card p-3">
       <div className="flex items-start justify-between gap-3 mb-3">
        <div>
         <p className="eyebrow">Méthode</p>
         <p className="section-copy mt-1">On applique uniquement les règles nécessaires. Les dérivées de constantes ou de x ne sont pas transformées en longues cartes séparées.</p>
        </div>
       </div>
       <div className="space-y-2">
        {derivativeDisplaySteps.map((step, i) => (
         <div key={i} className="solution-step">
          <div className="solution-step-head">
           <span className="solution-step-number">{i + 1}</span>
           <div className="min-w-0 flex-1">
            <p className="solution-step-title">{step.rule}</p>
            {step.formula && <div className="mt-1 text-sm overflow-x-auto"><MathText auto>{step.formula}</MathText></div>}
           </div>
          </div>
          {step.application && <p className="section-copy mt-2 leading-relaxed">{step.application}</p>}

          {step.lines && step.lines.length > 0 && (
           <div className="mt-3 grid gap-2">
            {step.lines.map((line, lineIndex) => (
             <div key={lineIndex} className="rounded-lg border px-3 py-2 overflow-x-auto" style={{borderColor:'var(--border)',background:'var(--surface-2)'}}>
              <MathExpression value={line} block />
             </div>
            ))}
           </div>
          )}

          {step.after && step.rule === 'Appliquer la formule du quotient' && !step.lines && (
           <div className="mt-3 rounded-lg border p-3" style={{borderColor:'var(--border)',background:'var(--surface-2)'}}>
            <p className="eyebrow">Remplacement dans la formule</p>
            <div className="mt-2 overflow-x-auto"><MathExpression value={`f'(x)=${step.after}`} block /></div>
           </div>
          )}

          {step.before && step.after && !step.lines && ['Développer et réduire', 'Simplification finale'].includes(step.rule) && (
           <div className="mt-3 rounded-lg border p-3" style={{borderColor:'var(--border)',background:'var(--surface-2)'}}>
            <p className="eyebrow">Calcul</p>
            <div className="mt-2 overflow-x-auto"><MathExpression value={step.before} block /></div>
            <div className="text-center muted my-1">↓</div>
            <div className="overflow-x-auto font-bold"><MathExpression value={step.after} block /></div>
           </div>
          )}
         </div>
        ))}
       </div>
      </div>

      {result.derivativeWarnings && result.derivativeWarnings.length > 0 && (
       <div className="rounded-xl border p-3" style={{borderColor:'var(--warning)',background:'color-mix(in srgb, var(--warning) 9%, var(--surface))'}}>
        <p className="eyebrow" style={{color:'var(--warning)'}}>Conditions de validité</p>
        <div className="mt-2 space-y-1">
         {result.derivativeWarnings.map((warning, index) => <p key={index} className="section-copy">{warning}</p>)}
        </div>
       </div>
      )}

      <div className="answer-card">
       <p className="eyebrow" style={{color:derivativeCheck?.ok ? 'var(--success)' : 'var(--warning)'}}>{derivativeCheck?.ok ? 'Réponse finale vérifiée' : 'Résultat à contrôler'}</p>
       <p className="section-copy mt-1">{derivativeCheck?.ok ? 'Cette forme a passé les contrôles indépendants du moteur avant d’être proposée à l’élève.' : 'La vérification interne n’est pas suffisante : ne pas recopier ce résultat comme une réponse certaine.'}</p>
       <div className="text-2xl font-extrabold text-center mt-3 overflow-x-auto math-answer">
        <MathExpression value={`f'(x)=${derivativeExpr}`} block />
       </div>
      </div>

      <div className="paper-card p-3">
       <div className="flex items-start justify-between gap-3">
        <div>
         <p className="eyebrow">Dérivée seconde</p>
         <p className="section-copy mt-1">Elle est recalculée avec le même moteur déterministe à partir de la dérivée première.</p>
        </div>
        <span className={`chip ${secondDerivativeCheck?.ok ? 'chip-success' : 'chip-warning'}`}>{secondDerivativeCheck?.ok ? 'Vérifiée' : 'À contrôler'}</span>
       </div>
       <div className="text-lg font-bold mt-3 overflow-x-auto"><MathExpression value={`f''(x)=${result.secondDerivativeExpr}`} block /></div>
      </div>
     </div>
    )}
   </section>

   {/* ═══════════════════════════════════════════════════════════════ */}
   {/* ÉTAPE 3 : RÉSOLUTION f'(x) = 0 */}
   {/* ═══════════════════════════════════════════════════════════════ */}
   <div className="bg-gradient-to-br from-amber-900/20 to-amber-950/30 rounded-xl border border-amber-500/20 overflow-hidden">
    <button
     onClick={() => toggleSection('critical')}
     className="w-full px-4 py-3 flex items-center justify-between text-left"
    >
     <div className="flex items-center gap-3">
      <span className="w-8 h-8 rounded-lg bg-amber-600 text-white text-sm font-bold flex items-center justify-center">3</span>
      <div>
       <h3 className="font-bold text-amber-200">Points critiques (f'(x) = 0)</h3>
       <p className="text-xs text-amber-400/70">Trouver les extremums possibles</p>
      </div>
     </div>
     <span className={`text-amber-400 transition-transform ${openSections.has('critical') ? 'rotate-180' : ''}`}>▼</span>
    </button>

    {openSections.has('critical') && (
     <div className="px-4 pb-4 space-y-4">
      {/* Rappel */}
      <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
       <p className="text-xs font-bold text-blue-300 mb-2"> Rappel de cours</p>
       <p className="text-xs text-slate-300 leading-relaxed">
        Les points critiques sont les valeurs de x où <span className="font-mono text-amber-300">f'(x) = 0</span>. 
        Ce sont les endroits où la fonction peut changer de sens de variation (maximum ou minimum).
       </p>
      </div>

      {steps.criticalPointSteps.map((step, i) => (
       <div key={i} className="space-y-3">
        {/* Équation */}
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
         <p className="text-xs text-slate-500 mb-1">Équation à résoudre :</p>
         <p className="font-mono text-sm text-white">{step.equation}</p>
        </div>

        {/* Solutions */}
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
         <p className="text-xs text-slate-500 mb-1">Résolution :</p>
         <p className="text-sm text-slate-300">{step.solving}</p>
         {step.solutions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
           {step.solutions.map((sol, j) => (
            <span key={j} className="font-mono text-sm bg-amber-500/20 text-amber-300 px-3 py-1 rounded-lg">
             x = {sol}
            </span>
           ))}
          </div>
         )}
        </div>

        {/* Vérification du signe */}
        {step.verification.length > 0 && (
         <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
          <p className="text-xs text-slate-500 mb-2">Étude du signe de f'(x) autour de chaque point :</p>
          <div className="space-y-2">
           {step.verification.map((v, j) => (
            <div key={j} className="bg-slate-900/50 rounded p-2">
             <p className="text-sm">
              <span className="font-mono text-white">x = {v.x}</span>
              <span className="text-slate-500 mx-2">→</span>
              <span className="font-mono text-white">f({v.x}) = {v.y}</span>
             </p>
             <p className="text-xs mt-1">
              <span className="text-slate-400">Signe de f' : </span>
              <span className={`font-mono ${v.signBefore === '+' ? 'text-emerald-400' : 'text-red-400'}`}>{v.signBefore}</span>
              <span className="text-slate-500 mx-1">→</span>
              <span className="text-amber-300 font-bold">0</span>
              <span className="text-slate-500 mx-1">→</span>
              <span className={`font-mono ${v.signAfter === '+' ? 'text-emerald-400' : 'text-red-400'}`}>{v.signAfter}</span>
             </p>
             <p className="text-xs mt-1 text-slate-400">{v.conclusion}</p>
            </div>
           ))}
          </div>
         </div>
        )}
       </div>
      ))}

      {/* Conclusion */}
      <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
       <p className="text-xs font-bold text-emerald-300 mb-2"> Points remarquables trouvés</p>
       {variation.criticalPoints.length > 0 ? (
        <div className="space-y-1">
         {variation.criticalPoints.map((cp, i) => (
          <div key={i} className="flex items-center gap-2">
           <span className={`w-3 h-3 rounded-full ${
            cp.type.includes('max') ? 'bg-rose-500' : 
            cp.type.includes('min') ? 'bg-cyan-500' : 'bg-amber-500'
           }`}></span>
           <span className="font-mono text-white">({cp.x} ; {cp.y})</span>
           <span className="text-slate-500">—</span>
           <span className={`text-sm font-semibold ${
            cp.type.includes('max') ? 'text-rose-400' : 
            cp.type.includes('min') ? 'text-cyan-400' : 'text-amber-400'
           }`}>{cp.type}</span>
          </div>
         ))}
        </div>
       ) : (
        <p className="text-sm text-slate-400">Aucun extremum trouvé dans l'intervalle étudié.</p>
       )}
      </div>
     </div>
    )}
   </div>

   {/* ═══════════════════════════════════════════════════════════════ */}
   {/* ÉTAPE 4 : SIGNE DE LA DÉRIVÉE */}
   {/* ═══════════════════════════════════════════════════════════════ */}
   <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-950/30 rounded-xl border border-emerald-500/20 overflow-hidden">
    <button
     onClick={() => toggleSection('sign')}
     className="w-full px-4 py-3 flex items-center justify-between text-left"
    >
     <div className="flex items-center gap-3">
      <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white text-sm font-bold flex items-center justify-center">4</span>
      <div>
       <h3 className="font-bold text-emerald-200">Signe de f'(x) et variations</h3>
       <p className="text-xs text-emerald-400/70">Dresser le tableau de variation</p>
      </div>
     </div>
     <span className={`text-emerald-400 transition-transform ${openSections.has('sign') ? 'rotate-180' : ''}`}>▼</span>
    </button>

    {openSections.has('sign') && (
     <div className="px-4 pb-4 space-y-4">
      {/* Rappel */}
      <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
       <p className="text-xs font-bold text-blue-300 mb-2"> Règle fondamentale</p>
       <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-800/30 rounded p-2">
         <p className="text-emerald-400 font-bold">f'(x) {'>'} 0</p>
         <p className="text-slate-300">f est croissante ↗</p>
        </div>
        <div className="bg-slate-800/30 rounded p-2">
         <p className="text-red-400 font-bold">f'(x) {'<'} 0</p>
         <p className="text-slate-300">f est décroissante ↘</p>
        </div>
       </div>
      </div>

      {/* Intervalles */}
      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
       <p className="text-xs text-slate-500 mb-2">Étude sur chaque intervalle :</p>
       <div className="space-y-2">
        {variation.intervals.map((interval, i) => (
         <div key={i} className="flex items-center gap-2 bg-slate-900/50 rounded p-2">
          <span className="font-mono text-sm text-slate-300">
           x ∈ ]{interval.from} ; {interval.to}[
          </span>
          <span className="text-slate-600">→</span>
          <span className={`font-mono text-sm ${interval.signDerivative === '+' ? 'text-emerald-400' : 'text-red-400'}`}>
           f'(x) {interval.signDerivative === '+' ? '>' : '<'} 0
          </span>
          <span className="text-slate-600">→</span>
          <span className={`text-lg ${interval.direction === 'increasing' ? 'text-emerald-400' : 'text-red-400'}`}>
           {interval.direction === 'increasing' ? '↗' : '↘'}
          </span>
          <span className="text-xs text-slate-400">
           {interval.direction === 'increasing' ? 'croissante' : 'décroissante'}
          </span>
         </div>
        ))}
       </div>
      </div>
     </div>
    )}
   </div>

   {/* ═══════════════════════════════════════════════════════════════ */}
   {/* ÉTAPE 5 : LIMITES */}
   {/* ═══════════════════════════════════════════════════════════════ */}
   <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-950/30 rounded-xl border border-cyan-500/20 overflow-hidden">
    <button
     onClick={() => toggleSection('limits')}
     className="w-full px-4 py-3 flex items-center justify-between text-left"
    >
     <div className="flex items-center gap-3">
      <span className="w-8 h-8 rounded-lg bg-cyan-600 text-white text-sm font-bold flex items-center justify-center">5</span>
      <div>
       <h3 className="font-bold text-cyan-200">Calcul des limites</h3>
       <p className="text-xs text-cyan-400/70">Comportement aux bornes</p>
      </div>
     </div>
     <span className={`text-cyan-400 transition-transform ${openSections.has('limits') ? 'rotate-180' : ''}`}>▼</span>
    </button>

    {openSections.has('limits') && (
     <div className="px-4 pb-4 space-y-4">
      {/* Rappel */}
      <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
       <p className="text-xs font-bold text-blue-300 mb-2"> Pourquoi calculer les limites ?</p>
       <p className="text-xs text-slate-300 leading-relaxed">
        Les limites nous indiquent le comportement de la fonction quand x devient très grand ou très petit, 
        ou quand x s'approche d'une valeur interdite. Elles permettent de trouver les <span className="text-cyan-300">asymptotes</span>.
       </p>
      </div>

      {/* Calculs */}
      <div className="space-y-2">
       {steps.limitSteps.map((step, i) => (
        <div key={i} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
         <div className="flex items-center justify-between">
          <div>
           <p className="text-sm">
            <span className="text-slate-400">lim</span>
            <span className="text-xs text-slate-500 mx-1">x→{step.point}</span>
            <span className="text-cyan-300">f(x)</span>
           </p>
           <p className="text-xs text-slate-500 mt-1">{step.method}</p>
          </div>
          <span className={`font-mono text-lg font-bold ${
           step.result === '+∞' ? 'text-emerald-400' :
           step.result === '-∞' ? 'text-red-400' : 'text-white'
          }`}>
           = {step.result}
          </span>
         </div>
        </div>
       ))}
      </div>

      {/* Asymptotes */}
      {(limits.some(l => l.point !== '+∞' && l.point !== '-∞' && (l.value === '+∞' || l.value === '-∞')) ||
       limits.some(l => (l.point === '+∞' || l.point === '-∞') && l.value !== '+∞' && l.value !== '-∞')) && (
       <div className="bg-rose-500/10 rounded-lg p-3 border border-rose-500/20">
        <p className="text-xs font-bold text-rose-300 mb-2"> Asymptotes détectées</p>
        <div className="space-y-1 text-sm">
         {limits.filter(l => l.point !== '+∞' && l.point !== '-∞' && (l.value === '+∞' || l.value === '-∞'))
          .map((l, i) => (
           <p key={`v-${i}`} className="text-red-300 font-mono">
            x = {l.point} <span className="text-slate-500">(asymptote verticale)</span>
           </p>
          ))}
         {limits.filter(l => (l.point === '+∞' || l.point === '-∞') && l.value !== '+∞' && l.value !== '-∞' && l.value !== '')
          .map((l, i) => (
           <p key={`h-${i}`} className="text-blue-300 font-mono">
            y = {l.value} <span className="text-slate-500">(asymptote horizontale en {l.point})</span>
           </p>
          ))}
        </div>
       </div>
      )}
     </div>
    )}
   </div>
  </div>
 );
};

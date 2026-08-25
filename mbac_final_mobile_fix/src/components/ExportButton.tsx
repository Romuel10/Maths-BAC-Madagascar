import React, { useState } from 'react';
import type { AnalysisResult } from '../lib/mathEngine';
import { formatPretty } from '../lib/prettyMath';
import { useLang, t } from '../lib/i18n';
import { getWatermark, COPYRIGHT, CREATOR } from '../lib/protection';

interface ExportButtonProps { result: AnalysisResult }

function buildTextReport(r: AnalysisResult): string {
 const lines: string[] = [];
 const pe = formatPretty(r.expression);
 const pd = formatPretty(r.derivativeExpr);
 const pd2 = formatPretty(r.secondDerivativeExpr);

 lines.push('═══════════════════════════════════════');
 lines.push(` ÉTUDE DE FONCTION : f(x) = ${pe}`);
 lines.push('═══════════════════════════════════════');
 lines.push('');
 lines.push(`1. ENSEMBLE DE DÉFINITION`);
 lines.push(`  Df = ${r.domain.description}`);
 if (r.domain.excludedPoints.length > 0) {
  lines.push(`  Valeurs exclues : ${r.domain.excludedPoints.join(', ')}`);
 }
 lines.push('');
 lines.push(`2. PARITÉ`);
 lines.push(`  ${r.parity.type === 'even' ? 'Fonction paire' : r.parity.type === 'odd' ? 'Fonction impaire' : 'Ni paire ni impaire'}`);
 lines.push(`  ${r.parity.explanation}`);
 lines.push('');
 lines.push(`3. PÉRIODICITÉ`);
 lines.push(`  ${r.periodicity.explanation}`);
 lines.push('');
 lines.push(`4. DÉRIVÉE`);
 lines.push(`  f'(x) = ${pd}`);
 lines.push(`  f''(x) = ${pd2}`);
 lines.push('');
 lines.push(`5. ZÉROS DE f(x)`);
 lines.push(`  ${r.zeros.length > 0 ? r.zeros.map(z => `x = ${z.x}`).join(', ') : 'Aucun zéro trouvé'}`);
 lines.push('');
 lines.push(`6. LIMITES`);
 for (const l of r.limits) {
  lines.push(`  lim (x→${l.point}${l.direction}) f(x) = ${l.value}`);
 }
 lines.push('');
 lines.push(`7. ASYMPTOTES`);
 if (r.asymptotes.vertical.length > 0) lines.push(`  Verticales : ${r.asymptotes.vertical.map(a => `x = ${a.x}`).join(', ')}`);
 if (r.asymptotes.horizontal.length > 0) lines.push(`  Horizontales : ${r.asymptotes.horizontal.map(a => `y = ${a.y}`).join(', ')}`);
 if (r.asymptotes.oblique.length > 0) lines.push(`  Obliques : ${r.asymptotes.oblique.map(a => `y = ${a.a}x + ${a.b}`).join(', ')}`);
 if (r.asymptotes.vertical.length === 0 && r.asymptotes.horizontal.length === 0 && r.asymptotes.oblique.length === 0) lines.push('  Aucune');
 lines.push('');
 lines.push(`8. VARIATIONS`);
 for (const cp of r.variation.criticalPoints) {
  lines.push(`  ${cp.type} en x = ${cp.x} : f(${cp.x}) = ${cp.y}`);
 }
 for (const iv of r.variation.intervals) {
  lines.push(`  Sur ]${iv.from} ; ${iv.to}[ : f est ${iv.direction === 'increasing' ? 'croissante ↗' : 'décroissante ↘'}`);
 }
 lines.push('');
 lines.push(`9. CONVEXITÉ`);
 for (const ci of r.convexity.intervals) {
  lines.push(`  Sur ]${ci.from} ; ${ci.to}[ : ${ci.type === 'convex' ? 'Convexe ⌣' : 'Concave ⌢'}`);
 }
 if (r.convexity.inflectionPoints.length > 0) {
  lines.push(`  Points d'inflexion : ${r.convexity.inflectionPoints.map(p => `(${p.x}, ${p.y})`).join(', ')}`);
 }
 lines.push('');
 lines.push(`10. PRIMITIVE`);
 lines.push(`  F(x) = ${formatPretty(r.primitiveExpr)}`);
 lines.push('');
 lines.push('═══════════════════════════════════════');
 lines.push(` Généré par Maths BAC Madagascar`);
 lines.push(` Créé par ${CREATOR}`);
 lines.push(` ${COPYRIGHT}`);
 lines.push(` ${getWatermark()}`);
 lines.push('═══════════════════════════════════════');

 return lines.join('\n');
}

export const ExportButton: React.FC<ExportButtonProps> = ({ result }) => {
 const { lang } = useLang();
 const [showPanel, setShowPanel] = useState(false);
 const [copied, setCopied] = useState(false);

 const text = buildTextReport(result);

 const handleCopy = async () => {
  try {
   await navigator.clipboard.writeText(text);
   setCopied(true);
   setTimeout(() => setCopied(false), 2000);
  } catch {
   // Fallback
   const ta = document.createElement('textarea');
   ta.value = text;
   document.body.appendChild(ta);
   ta.select();
   document.execCommand('copy');
   document.body.removeChild(ta);
   setCopied(true);
   setTimeout(() => setCopied(false), 2000);
  }
 };

 const handleShare = async () => {
  if (navigator.share) {
   try {
    await navigator.share({
     title: `Étude de f(x) = ${formatPretty(result.expression)}`,
     text: text,
    });
   } catch { /* user cancelled */ }
  } else {
   handleCopy();
  }
 };

 return (
  <>
   <button
    onClick={() => setShowPanel(!showPanel)}
    className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30"
   >
     {t('export', lang)}
   </button>

   {showPanel && (
    <div className="fixed inset-0 bg-slate-950/95 z-50 overflow-y-auto">
     <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
       <h2 className="text-lg font-bold text-white"> {t('exportTitle', lang)}</h2>
       <button onClick={() => setShowPanel(false)} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">×</button>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-4">
       <button onClick={handleCopy} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
        {copied ? '' : ''} {copied ? t('copied', lang) : 'Copier le texte'}
       </button>
       <button onClick={handleShare} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
         Partager
       </button>
      </div>

      {/* Preview */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-700/30">
       <p className="text-xs text-slate-400 mb-2">Aperçu :</p>
       <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-[60vh] overflow-y-auto">{text}</pre>
      </div>
     </div>
    </div>
   )}
  </>
 );
};

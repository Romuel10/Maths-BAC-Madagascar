import { MathExpression } from './MathNotation';
/**
 * Résolution d'inéquations avec axe gradué
 * Méthode de 3ème/Seconde : hachures sur les non-solutions
 * © 2025 RATOVOSON Navelanizara Romuel
 */
import React, { useState, useRef, useEffect } from 'react';
import { ReliabilityPanel } from './ReliabilityPanel';
import { solveInequalityVerified, type InequalityResult } from '../lib/inequalityEngine';

interface Props { expression: string }
type IneqType = '>' | '>=' | '<' | '<=';

function fmt(n: number): string { const r=Math.round(n*1000)/1000; return Number.isInteger(r)?String(r):r.toFixed(3).replace(/0+$/,'').replace(/\.$/,''); }

export const InequalitySolver: React.FC<Props> = ({ expression }) => {
 const [k, setK] = useState('0');
 const [ineqType, setIneqType] = useState<IneqType>('>');
 const [result, setResult] = useState<InequalityResult | null>(null);
 const [xMin, setXMin] = useState('-20');
 const [xMax, setXMax] = useState('20');
 const canvasRef = useRef<HTMLCanvasElement>(null);
 const containerRef = useRef<HTMLDivElement>(null);

 const handleSolve = () => {
  const kVal = parseFloat(k);
  const min = parseFloat(xMin), max = parseFloat(xMax);
  if (isNaN(kVal) || isNaN(min) || isNaN(max) || min >= max) return;
  setResult(solveInequalityVerified(expression, ineqType, kVal, min, max));
 };

 // ═══ DRAW NUMBER LINE ═══
 useEffect(() => {
  if (!result || !canvasRef.current || !containerRef.current) return;
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = containerRef.current.clientWidth;
  const H = 120;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);

  const pad = { l: 30, r: 30 };
  const axisY = 55;
  const signY = 30;
  const lineW = W - pad.l - pad.r;

  // Determine range to show
  const minX = result.searchInterval[0];
  const maxX = result.searchInterval[1];
  const range = maxX - minX;

  const toX = (x: number) => pad.l + ((x - minX) / range) * lineW;

  // BG
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, W, H);

  // ── Hachures on non-solution zones ──
  for (const interval of result.signIntervals) {
   const x1 = Math.max(toX(interval.from), pad.l);
   const x2 = Math.min(toX(interval.to), W - pad.r);

   if (!interval.isSolution) {
    // HACHURES — lines diagonales rouges
    ctx.save();
    ctx.beginPath();
    ctx.rect(x1, axisY - 18, x2 - x1, 36);
    ctx.clip();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.lineWidth = 1;
    for (let hx = x1 - 40; hx < x2 + 40; hx += 6) {
     ctx.beginPath();
     ctx.moveTo(hx, axisY - 20);
     ctx.lineTo(hx + 40, axisY + 20);
     ctx.stroke();
    }
    // Red background
    ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
    ctx.fillRect(x1, axisY - 18, x2 - x1, 36);
    ctx.restore();
   } else {
    // Solution zone — green highlight
    ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
    ctx.fillRect(x1, axisY - 18, x2 - x1, 36);
   }
  }

  // ── Axis line ──
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad.l, axisY);
  ctx.lineTo(W - pad.r, axisY);
  ctx.stroke();

  // Arrow tips
  ctx.fillStyle = '#64748b';
  // Left arrow
  ctx.beginPath(); ctx.moveTo(pad.l, axisY); ctx.lineTo(pad.l + 8, axisY - 4); ctx.lineTo(pad.l + 8, axisY + 4); ctx.fill();
  // Right arrow
  ctx.beginPath(); ctx.moveTo(W - pad.r, axisY); ctx.lineTo(W - pad.r - 8, axisY - 4); ctx.lineTo(W - pad.r - 8, axisY + 4); ctx.fill();

  // ── Tick marks for zeros ──
  for (const z of result.zeros) {
   const px = toX(z);
   ctx.strokeStyle = '#e2e8f0';
   ctx.lineWidth = 2;
   ctx.beginPath();
   ctx.moveTo(px, axisY - 8);
   ctx.lineTo(px, axisY + 8);
   ctx.stroke();

   // Zero value label
   ctx.fillStyle = '#ffffff';
   ctx.font = 'bold 12px system-ui';
   ctx.textAlign = 'center';
   ctx.fillText(fmt(z), px, axisY + 22);

   // Open/closed circle
   const strict = ineqType === '>' || ineqType === '<';
   ctx.beginPath();
   ctx.arc(px, axisY, 5, 0, Math.PI * 2);
   if (strict) {
    // Open circle (not included)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.stroke();
   } else {
    // Filled circle (included)
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
   }
  }

  // ── Sign labels above ──
  for (const interval of result.signIntervals) {
   const x1 = toX(interval.from);
   const x2 = toX(interval.to);
   const midPx = (x1 + x2) / 2;

   ctx.font = 'bold 16px system-ui';
   ctx.textAlign = 'center';
   ctx.fillStyle = interval.sign === '+' ? '#22c55e' : interval.sign === '-' ? '#ef4444' : '#94a3b8';
   ctx.fillText(interval.sign, midPx, signY);
  }

  // ── Solution bar below ──
  for (const interval of result.signIntervals) {
   if (!interval.isSolution) continue;
   const x1 = Math.max(toX(interval.from), pad.l);
   const x2 = Math.min(toX(interval.to), W - pad.r);

   ctx.fillStyle = 'rgba(34, 197, 94, 0.7)';
   ctx.fillRect(x1, axisY + 30, x2 - x1, 6);
   ctx.strokeStyle = '#22c55e';
   ctx.lineWidth = 1;
   ctx.strokeRect(x1, axisY + 30, x2 - x1, 6);
  }

  // ── Labels ──
  ctx.fillStyle = '#64748b';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText(fmt(result.searchInterval[0]), pad.l - 2, axisY + 22);
  ctx.textAlign = 'right';
  ctx.fillText(fmt(result.searchInterval[1]), W - pad.r + 2, axisY + 22);

  // Legend
  ctx.font = '9px system-ui';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#22c55e';
  ctx.fillText('■ Solution', pad.l, H - 5);
  ctx.fillStyle = '#ef4444';
  ctx.fillText('▨ Non-solution (hachuré)', pad.l + 65, H - 5);

 }, [result, ineqType]);

 const ineqLabel = (t: IneqType) => t === '>=' ? '≥' : t === '<=' ? '≤' : t;

 return (
  <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-5 border border-slate-700/40">
   <div className="flex items-center gap-3 mb-4">
    <span className="text-2xl"></span>
    <div>
     <h3 className="text-lg font-bold text-white">Résolution d'inéquation</h3>
     <p className="text-[10px] text-slate-500">Méthode graphique avec axe gradué</p>
    </div>
   </div>

   {/* Display equation */}
   <div className="bg-slate-900/50 rounded-xl p-3 mb-4 text-center">
    <p className="font-mono text-lg">
     <span className="text-indigo-300"><MathExpression value={expression} /></span>
     <span className="text-white mx-2 font-bold">{ineqLabel(ineqType)}</span>
     <span className="text-amber-300">{k || '0'}</span>
    </p>
   </div>

   {/* Type selector */}
   <div className="flex gap-1 mb-3">
    {(['>', '>=', '<', '<='] as IneqType[]).map(t => (
     <button key={t} onClick={() => setIneqType(t)}
      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all active:scale-95 ${ineqType === t ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800/50 text-slate-400 border-slate-700/30'}`}>
      {ineqLabel(t)}
     </button>
    ))}
   </div>

   {/* K input + solve */}
   <div className="flex gap-2 mb-4">
    <div className="flex-1">
     <label className="block text-[10px] text-slate-400 mb-1">Valeur k =</label>
     <input aria-label="Valeur k" type="number" value={k} onChange={e => setK(e.target.value)} step="0.5"
      className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white font-mono text-center focus:border-indigo-500 focus:outline-none" />
    </div>
    <button onClick={handleSolve} className="self-end px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-95 shadow-lg">
     Résoudre
    </button>
   </div>
   <div className="grid grid-cols-2 gap-2 mb-4">
    <div><label className="block text-[9px] text-slate-500 mb-1">Recherche x min</label><input aria-label="Borne minimale de recherche" type="number" value={xMin} onChange={e => setXMin(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-center text-xs" /></div>
    <div><label className="block text-[9px] text-slate-500 mb-1">Recherche x max</label><input aria-label="Borne maximale de recherche" type="number" value={xMax} onChange={e => setXMax(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-center text-xs" /></div>
   </div>

   {/* Result */}
   {result && (
    <div className="space-y-3 animate-scale-in">
     <ReliabilityPanel level={result.quality} title={result.scope === 'R' ? 'Résolution exacte sur ℝ' : 'Étude numérique sur une fenêtre'} detail={result.scope === 'R' ? 'Le signe est déterminé algébriquement sur ℝ. La conclusion ne dépend pas de la fenêtre du graphique.' : (result.warning || `Étude seulement sur [${result.searchInterval[0]} ; ${result.searchInterval[1]}]. Aucune conclusion n’est étendue hors de cette fenêtre.`)} checks={[{ label: 'Zéros recontrôlés', ok: result.verifiedZeros === result.zeros.length, detail: `${result.verifiedZeros}/${result.zeros.length} zéro(s) vérifié(s) par substitution.` }]} />
     {/* Number line canvas */}
     <div ref={containerRef} className="rounded-xl overflow-hidden border border-slate-700/30">
      <canvas ref={canvasRef} className="block" role="img" aria-label="Droite graduée représentant la solution de l’inéquation" />
     </div>

     {/* Explanation */}
     <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
      <p className="text-xs font-bold text-blue-300 mb-2"> Méthode</p>
      <div className="space-y-1 text-xs text-slate-300">
       {result.steps.map((step, i) => <p key={i}>{i + 1}. {step}</p>)}
      </div>
     </div>

     {/* Sign table */}
     <div className="bg-slate-900/40 rounded-xl p-3">
      <p className="text-xs font-bold text-slate-300 mb-2">Tableau de signes</p>
      <div className="overflow-x-auto">
       <table className="w-full text-xs border-collapse min-w-[280px]">
        <thead>
         <tr className="bg-slate-800/50">
          <th className="border border-slate-600/40 px-2 py-1.5 text-indigo-300">x</th>
          <th className="border border-slate-600/40 px-2 py-1.5 text-slate-400">{fmt(result.searchInterval[0])}</th>
          {result.zeros.map((z, i) => (
           <React.Fragment key={i}>
            <th className="border border-slate-600/40 px-3 py-1.5"></th>
            <th className="border border-slate-600/40 px-2 py-1.5 text-amber-300 font-mono">{fmt(z)}</th>
           </React.Fragment>
          ))}
          <th className="border border-slate-600/40 px-3 py-1.5"></th>
          <th className="border border-slate-600/40 px-2 py-1.5 text-slate-400">{fmt(result.searchInterval[1])}</th>
         </tr>
        </thead>
        <tbody>
         <tr>
          <td className="border border-slate-600/40 px-2 py-1.5 text-indigo-300 font-bold">f(x)−{k}</td>
          <td className="border border-slate-600/40 px-2 py-1.5"></td>
          {result.signIntervals.map((iv, i) => (
           <React.Fragment key={i}>
            <td className={`border border-slate-600/40 px-3 py-1.5 text-center text-lg font-bold ${iv.sign === '+' ? 'text-emerald-400' : 'text-red-400'}`}>
             {iv.sign}
            </td>
            {i < result.signIntervals.length - 1 && (
             <td className="border border-slate-600/40 px-2 py-1.5 text-center text-amber-300 font-bold">0</td>
            )}
           </React.Fragment>
          ))}
          <td className="border border-slate-600/40 px-2 py-1.5"></td>
         </tr>
        </tbody>
       </table>
      </div>
     </div>

     {/* Solution set */}
     {result.solutionIntervals.length > 0 ? (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
       <p className="text-[10px] text-emerald-400 mb-1 font-bold uppercase tracking-wider">{result.scope === 'R' ? 'Ensemble solution sur ℝ' : `Zones solution sur [${result.searchInterval[0]} ; ${result.searchInterval[1]}]`}</p>
       <p className="text-xl font-mono font-extrabold text-white">{result.scope === 'R' ? `S = ${result.solutionSet}` : result.solutionSet}</p>
       {result.scope === 'window' && <p className="text-[10px] text-slate-400 mt-2">Résultat numérique limité à la fenêtre choisie ; il ne décrit pas automatiquement les solutions sur tout ℝ.</p>}
      </div>
     ) : (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
       <p className="text-red-300 font-bold">{result.exact ? 'Aucune solution sur ℝ' : `Aucune solution détectée sur [${result.searchInterval[0]} ; ${result.searchInterval[1]}]`}</p>
      </div>
     )}
    </div>
   )}
  </div>
 );
};

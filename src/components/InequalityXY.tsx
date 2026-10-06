/**
 * Résolution graphique d'inéquations à 2 inconnues (x, y)
 * avec repère orthonormé, hachures des non-solutions,
 * intersections et méthode détaillée comme au tableau.
 * © 2025 RATOVOSON Navelanizara Romuel
 */
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { ReliabilityPanel } from './ReliabilityPanel';
import { intersectBoundaryLines, satisfiesLinearConstraint } from '../lib/linearInequality2DEngine';

interface Props { onClose: () => void }

type IneqOp = '>' | '>=' | '<' | '<=';

interface Inequality {
 a: number;
 b: number;
 c: number; // ax + by + c ? 0
 op: IneqOp;
 label: string;
 color: string;
}

interface IntersectionPoint {
 x: number;
 y: number;
 i: number;
 j: number;
 satisfiesAll: boolean;
}

const COLORS = ['#818cf8', '#f97316', '#22c55e', '#ec4899', '#f59e0b'];
const HATCH_COLORS = [
 'rgba(129,140,248,0.20)',
 'rgba(249,115,22,0.20)',
 'rgba(34,197,94,0.20)',
 'rgba(236,72,153,0.20)',
 'rgba(245,158,11,0.20)',
];

function fmt(n: number): string {
 const r = Math.round(n * 100) / 100;
 return Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function buildLabel(a: number, b: number, c: number, op: IneqOp): string {
 let s = '';
 if (a !== 0) s += a === 1 ? 'x' : a === -1 ? '-x' : `${fmt(a)}x`;
 if (b !== 0) {
  const sign = b > 0 && s ? ' + ' : b < 0 && s ? ' - ' : b < 0 ? '-' : '';
  const absB = Math.abs(b);
  s += `${sign}${absB === 1 ? 'y' : `${fmt(absB)}y`}`;
 }
 if (!s) s = '0';
 const signOp = op === '>=' ? ' ≥ ' : op === '<=' ? ' ≤ ' : op === '>' ? ' > ' : ' < ';
 return `${s}${signOp}${fmt(-c)}`;
}

function satisfies(iq: Inequality, x: number, y: number): boolean {
 return satisfiesLinearConstraint(iq, {x,y}, 1e-9);
}

function chooseTestPoint(iq: Inequality): { x: number; y: number; value: number } {
 const candidates = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
  { x: 1, y: 1 },
 ];
 for (const p of candidates) {
  const value = iq.a * p.x + iq.b * p.y + iq.c;
  if (Math.abs(value) > 1e-6) return { ...p, value };
 }
 return { x: 2, y: 1, value: iq.a * 2 + iq.b * 1 + iq.c };
}

function lineIntersection(iq1: Inequality, iq2: Inequality): { x: number; y: number } | null {
 return intersectBoundaryLines(iq1, iq2);
}

export const InequalityXY: React.FC<Props> = ({ onClose }) => {
 const [inequalities, setInequalities] = useState<Inequality[]>([
  { a: 1, b: 1, c: -3, op: '<=', label: '', color: COLORS[0] },
  { a: 1, b: -1, c: 1, op: '>=', label: '', color: COLORS[1] },
 ]);
 const [solved, setSolved] = useState(false);
 const canvasRef = useRef<HTMLCanvasElement>(null);
 const containerRef = useRef<HTMLDivElement>(null);

 const ineqs = useMemo(
  () => inequalities.map((iq, i) => ({ ...iq, label: buildLabel(iq.a, iq.b, iq.c, iq.op), color: COLORS[i % COLORS.length] })),
  [inequalities]
 );

 const intersections = useMemo<IntersectionPoint[]>(() => {
  const pts: IntersectionPoint[] = [];
  for (let i = 0; i < ineqs.length; i++) {
   for (let j = i + 1; j < ineqs.length; j++) {
    const inter = lineIntersection(ineqs[i], ineqs[j]);
    if (!inter) continue;
    const satisfiesAll = ineqs.every(iq => satisfies(iq, inter.x, inter.y));
    pts.push({ ...inter, i, j, satisfiesAll });
   }
  }
  return pts;
 }, [ineqs]);

 const setField = (idx: number, field: keyof Inequality, value: number | IneqOp) => {
  setInequalities(prev => prev.map((iq, i) => i === idx ? { ...iq, [field]: value } : iq));
  setSolved(false);
 };

 const addInequality = () => {
  if (inequalities.length >= 5) return;
  setInequalities(prev => [...prev, { a: 0, b: 1, c: 0, op: '>=', label: '', color: COLORS[prev.length % COLORS.length] }]);
  setSolved(false);
 };

 const removeInequality = (idx: number) => {
  if (inequalities.length <= 1) return;
  setInequalities(prev => prev.filter((_, i) => i !== idx));
  setSolved(false);
 };

 const handleSolve = () => setSolved(true);

 // ═══ DRAW GRAPH ═══
 useEffect(() => {
  if (!solved || !canvasRef.current || !containerRef.current) return;
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = containerRef.current.clientWidth;
  const H = Math.min(W, 360);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.scale(dpr, dpr);

  const range = 8;
  const pad = { l: 36, r: 16, t: 16, b: 34 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const toX = (x: number) => pad.l + ((x + range) / (2 * range)) * plotW;
  const toY = (y: number) => pad.t + ((range - y) / (2 * range)) * plotH;

  // Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 0.5;
  for (let i = -range; i <= range; i++) {
   const px = toX(i), py = toY(i);
   ctx.beginPath(); ctx.moveTo(px, pad.t); ctx.lineTo(px, H - pad.b); ctx.stroke();
   ctx.beginPath(); ctx.moveTo(pad.l, py); ctx.lineTo(W - pad.r, py); ctx.stroke();
   if (i !== 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = '9px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(String(i), px, H - pad.b + 12);
    ctx.textAlign = 'right';
    ctx.fillText(String(i), pad.l - 5, py + 3);
   }
  }

  // Axes
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(pad.l, toY(0)); ctx.lineTo(W - pad.r, toY(0)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(toX(0), pad.t); ctx.lineTo(toX(0), H - pad.b); ctx.stroke();
  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('O', toX(0) - 8, toY(0) + 12);
  ctx.fillText('x', W - pad.r - 2, toY(0) - 5);
  ctx.fillText('y', toX(0) + 10, pad.t + 10);

  // Zone solution = points qui vérifient TOUTES les inéquations
  // On la dessine d'abord avec un vert léger pour que les hachures restent bien visibles ensuite.
  const solStep = 4;
  for (let px = pad.l; px < W - pad.r; px += solStep) {
   for (let py = pad.t; py < H - pad.b; py += solStep) {
    const x = ((px - pad.l) / plotW) * 2 * range - range;
    const y = range - ((py - pad.t) / plotH) * 2 * range;
    if (ineqs.every(iq => satisfies(iq, x, y))) {
     ctx.fillStyle = 'rgba(34, 197, 94, 0.10)';
     ctx.fillRect(px, py, solStep, solStep);
    }
   }
  }

  // Hachures des non-solutions pour chaque inéquation
  // On les dessine APRÈS la zone solution pour qu'elles restent bien visibles.
  const hatchStep = 8;
  for (let idx = 0; idx < ineqs.length; idx++) {
   const iq = ineqs[idx];
   const hatchColor = HATCH_COLORS[idx % HATCH_COLORS.length];

   // 1) léger fond coloré pour la zone interdite
   for (let px = pad.l; px < W - pad.r; px += 4) {
    for (let py = pad.t; py < H - pad.b; py += 4) {
     const x = ((px - pad.l) / plotW) * 2 * range - range;
     const y = range - ((py - pad.t) / plotH) * 2 * range;
     if (!satisfies(iq, x, y)) {
      ctx.fillStyle = hatchColor;
      ctx.fillRect(px, py, 4, 4);
     }
    }
   }

   // 2) vraies hachures diagonales rouges / colorées sur les zones non-solutions
   ctx.strokeStyle = iq.color + '88';
   ctx.lineWidth = 1;
   for (let px = pad.l - 40; px < W - pad.r + 40; px += hatchStep) {
    for (let py = pad.t - 40; py < H - pad.b + 40; py += hatchStep) {
     const sampleX = ((Math.max(px, pad.l) - pad.l) / plotW) * 2 * range - range;
     const sampleY = range - ((Math.max(py, pad.t) - pad.t) / plotH) * 2 * range;
     if (!satisfies(iq, sampleX, sampleY)) {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + 10, py + 10);
      ctx.stroke();
     }
    }
   }
  }

  // Renforcer légèrement la zone solution par-dessus
  for (let px = pad.l; px < W - pad.r; px += 6) {
   for (let py = pad.t; py < H - pad.b; py += 6) {
    const x = ((px - pad.l) / plotW) * 2 * range - range;
    const y = range - ((py - pad.t) / plotH) * 2 * range;
    if (ineqs.every(iq => satisfies(iq, x, y))) {
     ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
     ctx.fillRect(px, py, 6, 6);
    }
   }
  }

  // Redraw boundary lines on top
  for (let idx = 0; idx < ineqs.length; idx++) {
   const { a, b, c, op, color, label } = ineqs[idx];
   ctx.strokeStyle = color;
   ctx.lineWidth = 2.4;
   if (op === '>' || op === '<') ctx.setLineDash([6, 4]);
   else ctx.setLineDash([]);
   ctx.beginPath();
   if (Math.abs(b) > 1e-9) {
    const y1 = (-a * (-range) - c) / b;
    const y2 = (-a * range - c) / b;
    ctx.moveTo(toX(-range), toY(y1));
    ctx.lineTo(toX(range), toY(y2));
   } else if (Math.abs(a) > 1e-9) {
    const xVal = -c / a;
    ctx.moveTo(toX(xVal), pad.t);
    ctx.lineTo(toX(xVal), H - pad.b);
   }
   ctx.stroke();
   ctx.setLineDash([]);

   // Label line using x = 3 as anchor when possible
   if (Math.abs(b) > 1e-9) {
    const lx = 3;
    const ly = (-a * lx - c) / b;
    const px = toX(lx), py = toY(ly);
    if (py > pad.t + 12 && py < H - pad.b - 12) {
     ctx.fillStyle = '#0f172a';
     ctx.font = 'bold 10px system-ui';
     const width = ctx.measureText(label).width + 8;
     ctx.fillRect(px - 3, py - 11, width, 14);
     ctx.fillStyle = color;
     ctx.textAlign = 'left';
     ctx.fillText(label, px + 1, py);
    }
   }
  }

  // Intersection points
  intersections.forEach((pt) => {
   if (Math.abs(pt.x) > range || Math.abs(pt.y) > range) return;
   const px = toX(pt.x), py = toY(pt.y);
   ctx.beginPath();
   ctx.arc(px, py, 5, 0, Math.PI * 2);
   ctx.fillStyle = pt.satisfiesAll ? '#22c55e' : '#f59e0b';
   ctx.fill();
   ctx.strokeStyle = '#ffffff';
   ctx.lineWidth = 1.5;
   ctx.stroke();
   ctx.fillStyle = '#ffffff';
   ctx.font = 'bold 9px system-ui';
   ctx.textAlign = 'left';
   ctx.fillText(`(${fmt(pt.x)} ; ${fmt(pt.y)})`, px + 8, py - 8);
  });

 }, [solved, ineqs, intersections]);

 const solutionVertices = intersections.filter(p => p.satisfiesAll);

 return (
  <div className="fixed inset-0 bg-slate-950/98 z-50 overflow-y-auto">
   <div className="tool-page-container px-4 py-6 min-h-screen">
    <div className="flex items-center justify-between mb-4">
     <h2 className="text-xl font-extrabold text-white"> Inéquations à 2 inconnues</h2>
     <button onClick={onClose} aria-label="Fermer l’outil" className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">×</button>
    </div>

    <p className="text-xs text-slate-400 mb-3">
     Système de demi-plans : on trace les droites frontières, on hachure les non-solutions, la zone verte restante est la solution.
    </p>

    {/* Input cards */}
    <div className="space-y-2 mb-4">
     {ineqs.map((iq, idx) => (
      <div key={idx} className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/20">
       <div className="flex items-center gap-2 mb-2">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: iq.color }} />
        <p className="text-xs font-bold text-white flex-1 font-mono">{iq.label || `Inéquation ${idx + 1}`}</p>
        {inequalities.length > 1 && (
         <button onClick={() => removeInequality(idx)} aria-label={`Supprimer l’inéquation ${idx+1}`} className="text-red-400 text-xs px-1.5 py-0.5 rounded bg-red-500/10 active:scale-95">×</button>
        )}
       </div>
       <div className="grid grid-cols-4 gap-1.5">
        <div>
         <label className="block text-[0.5625rem] text-slate-500 mb-0.5">a</label>
         <input aria-label={`Coefficient a, inéquation ${idx+1}`} type="number" value={iq.a} onChange={e => setField(idx, 'a', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-sm font-mono text-center focus:border-indigo-500 focus:outline-none" />
        </div>
        <div>
         <label className="block text-[0.5625rem] text-slate-500 mb-0.5">b</label>
         <input aria-label={`Coefficient b, inéquation ${idx+1}`} type="number" value={iq.b} onChange={e => setField(idx, 'b', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-sm font-mono text-center focus:border-indigo-500 focus:outline-none" />
        </div>
        <div>
         <label className="block text-[0.5625rem] text-slate-500 mb-0.5">c</label>
         <input aria-label={`Coefficient c, inéquation ${idx+1}`} type="number" value={iq.c} onChange={e => setField(idx, 'c', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-sm font-mono text-center focus:border-indigo-500 focus:outline-none" />
        </div>
        <div>
         <label className="block text-[0.5625rem] text-slate-500 mb-0.5">Signe</label>
         <select aria-label={`Signe, inéquation ${idx+1}`} value={iq.op} onChange={e => setField(idx, 'op', e.target.value as IneqOp)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1 py-1.5 text-white text-sm text-center focus:border-indigo-500 focus:outline-none appearance-none">
          <option value=">=">≥ 0</option>
          <option value=">">&gt; 0</option>
          <option value="<=">≤ 0</option>
          <option value="<">&lt; 0</option>
         </select>
        </div>
       </div>
      </div>
     ))}
    </div>

    {/* Actions */}
    <div className="flex gap-2 mb-4">
     {inequalities.length < 5 && (
      <button onClick={addInequality} className="flex-1 py-2.5 bg-slate-700/50 text-slate-300 font-bold rounded-xl text-sm border border-slate-600/30 active:scale-95">+ Ajouter</button>
     )}
     <button onClick={handleSolve} className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl text-sm active:scale-95 shadow-lg"> Tracer</button>
    </div>

    {/* Examples */}
    <div className="flex gap-1.5 flex-wrap mb-4">
     {[
      { label: 'x+y≤3, x−y≥1', data: [{ a: 1, b: 1, c: -3, op: '<=' as IneqOp }, { a: 1, b: -1, c: 1, op: '>=' as IneqOp }] },
      { label: 'x≥0, y≥0, x+y≤4', data: [{ a: 1, b: 0, c: 0, op: '>=' as IneqOp }, { a: 0, b: 1, c: 0, op: '>=' as IneqOp }, { a: 1, b: 1, c: -4, op: '<=' as IneqOp }] },
      { label: '2x−y<3', data: [{ a: 2, b: -1, c: -3, op: '<' as IneqOp }] },
     ].map((ex, i) => (
      <button key={i} onClick={() => { setInequalities(ex.data.map((d, j) => ({ ...d, label: '', color: COLORS[j] }))); setSolved(false); }} className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-[0.625rem] text-slate-300 font-mono active:scale-95">{ex.label}</button>
     ))}
    </div>

    {/* Graph */}
    {solved && (
     <div className="space-y-3 animate-scale-in">
      <ReliabilityPanel
       level={ineqs.some(iq => Math.abs(iq.a) < 1e-12 && Math.abs(iq.b) < 1e-12) ? 'warning' : 'verified'}
       title="Demi-plans calculés algébriquement"
       detail="Les droites frontières et leurs intersections sont calculées sans arrondi intermédiaire. La coloration du graphique est une visualisation par pixels : elle illustre la solution mais ne remplace pas les inéquations exactes."
       checks={ineqs.map((iq,i)=>({label:`Contrainte ${i+1}`,ok:Math.abs(iq.a)>1e-12||Math.abs(iq.b)>1e-12,detail:Math.abs(iq.a)>1e-12||Math.abs(iq.b)>1e-12?'Droite frontière bien définie.':'a=b=0 : la contrainte est constante et doit être traitée séparément.'}))}
      />
      <div ref={containerRef} className="rounded-xl overflow-hidden border border-slate-700/30">
       <canvas ref={canvasRef} className="block" role="img" aria-label="Représentation des demi-plans et de leur intersection" />
      </div>

      {/* Intersections */}
      <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/20">
       <p className="text-xs font-bold text-slate-300 mb-2"> Intersections des droites</p>
       {intersections.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
         {intersections.map((pt, i) => (
          <span key={i} className={`px-2 py-1 rounded-lg text-[0.625rem] font-mono border ${pt.satisfiesAll ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'}`}>
           ({fmt(pt.x)} ; {fmt(pt.y)}) {pt.satisfiesAll ? '' : ''}
          </span>
         ))}
        </div>
       ) : <p className="text-[0.625rem] text-slate-500">Aucune intersection finie visible.</p>}
       {solutionVertices.length > 0 && <p className="text-[0.625rem] text-emerald-400 mt-2">Les points marqués appartiennent à la zone solution.</p>}
      </div>

      {/* Legend */}
      <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/20">
       <p className="text-xs font-bold text-slate-300 mb-2"> Légende</p>
       <div className="space-y-1">
        {ineqs.map((iq, i) => (
         <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-6 h-1 rounded-full" style={{ backgroundColor: iq.color }} />
          <span className="text-white font-mono">{iq.label}</span>
          <span className="text-slate-500">({iq.op === '>' || iq.op === '<' ? 'pointillés' : 'trait plein'})</span>
         </div>
        ))}
        <div className="flex items-center gap-2 text-xs pt-1 border-t border-slate-700/20">
         <span className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/30" />
         <span className="text-emerald-400 font-bold">Zone solution</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
         <span className="w-4 h-4 rounded bg-red-500/10 border border-red-500/20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(239,68,68,0.2) 2px, rgba(239,68,68,0.2) 3px)' }} />
         <span className="text-red-400">Zones non-solutions hachurées</span>
        </div>
       </div>
      </div>

      {/* Clear method */}
      <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
       <p className="text-xs font-bold text-blue-300 mb-2"> Étapes très claires</p>
       <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside">
        <li>
         <strong className="text-white">Transformer chaque inéquation en droite frontière</strong>
         <br />On remplace le signe par égal : ax + by + c = 0.
        </li>
        <li>
         <strong className="text-white">Tracer la droite</strong>
         <br />Trait plein si le signe est large (≥ ou ≤), pointillé si le signe est strict ({'>'} ou {'<'}).
        </li>
        <li>
         <strong className="text-white">Tester un point simple</strong>
         <br />On prend un point facile (souvent O(0,0)).
        </li>
       </ol>
       <div className="mt-3 space-y-2">
        {ineqs.map((iq, i) => {
         const tp = chooseTestPoint(iq);
         const ok = satisfies(iq, tp.x, tp.y);
         return (
          <div key={i} className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/20">
           <p className="text-[0.6875rem] font-mono text-white">{iq.label}</p>
           <p className="text-[0.625rem] text-slate-400 mt-1">
            On teste le point <span className="text-cyan-300 font-mono">({tp.x} ; {tp.y})</span> : 
            <span className="font-mono text-slate-300"> {fmt(iq.a)}×{tp.x} {iq.b >= 0 ? '+' : '-'} {fmt(Math.abs(iq.b))}×{tp.y} {iq.c >= 0 ? '+' : '-'} {fmt(Math.abs(iq.c))} = {fmt(tp.value)}</span>
           </p>
           <p className={`text-[0.625rem] mt-1 ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
            {ok ? ' Ce point vérifie l’inéquation : le bon demi-plan est celui qui contient ce point.' : ' Ce point ne vérifie pas l’inéquation : ce demi-plan est hachuré.'}
           </p>
          </div>
         );
        })}
       </div>
       <ol start={4} className="space-y-2 text-xs text-slate-300 list-decimal list-inside mt-3">
        <li>
         <strong className="text-white">Hachurer les non-solutions</strong>
         <br />Sur le dessin, les parties rouges hachurées sont interdites.
        </li>
        <li>
         <strong className="text-white">Repérer la zone solution</strong>
         <br />La solution du système est l'<span className="text-emerald-400 font-bold">intersection</span> de tous les demi-plans : c'est la zone verte restante.
        </li>
       </ol>
      </div>
     </div>
    )}
   </div>
  </div>
 );
};

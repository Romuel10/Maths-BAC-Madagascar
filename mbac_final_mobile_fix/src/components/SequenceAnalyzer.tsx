import React, { useState, useRef, useEffect, useCallback } from 'react';
import { analyzeSequence, type SequenceResult } from '../lib/mathEngine';
import { MiniKeyboard, prettyToMath } from './MiniKeyboard';
import { MathExpression, MathText } from './MathNotation';
import { ReliabilityPanel } from './ReliabilityPanel';

interface Props { onClose: () => void }

export const SequenceAnalyzer: React.FC<Props> = ({ onClose }) => {
 const [type, setType] = useState<'explicit' | 'recursive'>('recursive');
 const [expr, setExpr] = useState('0.5 × x + 1');
 const [u0, setU0] = useState('2');
 const [nStart, setNStart] = useState('0');
 const [count, setCount] = useState(20);
 const [result, setResult] = useState<SequenceResult | null>(null);
 const [error, setError] = useState<string | null>(null);
 const canvasRef = useRef<HTMLCanvasElement>(null);
 const containerRef = useRef<HTMLDivElement>(null);

 const handleAnalyze = useCallback(() => {
  setError(null);
  try {
   const start = Math.max(0, Math.floor(Number(nStart) || 0));
   const r = analyzeSequence(prettyToMath(expr), parseFloat(u0) || 0, type, count, start);
   setResult(r);
  } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur de calcul'); }
 }, [expr, u0, nStart, type, count]);

 // Draw chart
 useEffect(() => {
  if (!result || !canvasRef.current || !containerRef.current) return;
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = containerRef.current.clientWidth;
  const H = Math.min(W * 0.65, 320);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);

  const pad = { t: 20, r: 20, b: 40, l: 50 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
  const data = result.plotData;
  if (data.length < 2) return;

  const nMax = data[data.length - 1].n;
  const vals = data.map(d => d.value);
  let yMin = Math.min(...vals), yMax = Math.max(...vals);
  const ym = (yMax - yMin) * 0.12 || 1;
  yMin -= ym; yMax += ym;

  const cx = (n: number) => pad.l + (n / nMax) * pw;
  const cy = (v: number) => pad.t + ((yMax - v) / (yMax - yMin)) * ph;

  // BG
  ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);
  // Grid
  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 0.5;
  for (let n = 0; n <= nMax; n += Math.max(1, Math.floor(nMax / 10))) {
   const x = cx(n);
   ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, H - pad.b); ctx.stroke();
   ctx.fillStyle = '#64748b'; ctx.font = '10px system-ui'; ctx.textAlign = 'center';
   ctx.fillText(String(n), x, H - pad.b + 14);
  }
  // Axes
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.stroke();
  // Y labels
  const yStep = (yMax - yMin) / 5;
  for (let i = 0; i <= 5; i++) {
   const v = yMin + i * yStep;
   const y = cy(v);
   ctx.fillStyle = '#64748b'; ctx.font = '10px system-ui'; ctx.textAlign = 'right';
   ctx.fillText(v.toFixed(2), pad.l - 6, y + 3);
  }
  // Line
  ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  data.forEach((d, i) => { const x = cx(d.n), y = cy(d.value); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
  ctx.stroke();
  // Points
  data.forEach(d => {
   ctx.beginPath(); ctx.arc(cx(d.n), cy(d.value), 4, 0, Math.PI * 2);
   ctx.fillStyle = '#a78bfa'; ctx.fill();
   ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
  });
  // Labels
  ctx.fillStyle = '#94a3b8'; ctx.font = '11px system-ui'; ctx.textAlign = 'center';
  ctx.fillText('n', W - pad.r + 10, H - pad.b + 4);
  ctx.fillText('uₙ', pad.l - 10, pad.t - 5);
 }, [result]);

 const EXAMPLES = [
  { label: 'Arithmétique', expr: 'x + 3', u0: '1', nStart: '0', type: 'recursive' as const },
  { label: 'Géométrique', expr: '2 × x', u0: '1', nStart: '0', type: 'recursive' as const },
  { label: 'Convergente', expr: '0.5 × x + 1', u0: '10', nStart: '0', type: 'recursive' as const },
  { label: 'Suite de Héron', expr: '(x + 2 ÷ x) ÷ 2', u0: '5', nStart: '0', type: 'recursive' as const },
  { label: 'n²', expr: 'n²', u0: '0', nStart: '0', type: 'explicit' as const },
  { label: '1/n', expr: '1 ÷ n', u0: '0', nStart: '1', type: 'explicit' as const },
 ];

 return (
  <div className="fixed inset-0 bg-slate-950/98 z-50 overflow-y-auto">
   <div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
    <div className="flex items-center justify-between mb-4">
     <h2 className="text-xl font-bold text-white"> Suites numériques</h2>
     <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">×</button>
    </div>

    {/* Type selector */}
    <div className="flex gap-2 mb-3">
     <button onClick={() => setType('recursive')} className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${type === 'recursive' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
      Récurrente uₙ₊₁ = f(uₙ)
     </button>
     <button onClick={() => setType('explicit')} className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${type === 'explicit' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
      Explicite uₙ = f(n)
     </button>
    </div>

    {/* Input */}
    <div className="space-y-2 mb-3">
     <MiniKeyboard
      value={expr}
      onChange={setExpr}
      label={type === 'recursive' ? 'uₙ₊₁ = f(uₙ)  (variable : x = uₙ)' : 'uₙ = f(n)  (variable : n)'}
      placeholder={type === 'recursive' ? '0.5×x + 1' : 'n²'}
     />
     <div className="flex gap-2">
      <div className="flex-1">
       {type === 'recursive' ? <>
        <label className="block text-xs text-slate-400 mb-1">u₀ =</label>
        <input type="number" value={u0} onChange={e => setU0(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none" />
       </> : <>
        <label className="block text-xs text-slate-400 mb-1">Premier indice n₀</label>
        <input type="number" min={0} step={1} value={nStart} onChange={e => setNStart(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none" />
       </>}
      </div>
      <div className="flex-1">
       <label className="block text-xs text-slate-400 mb-1">Nb termes</label>
       <input type="number" value={count} onChange={e => setCount(Number(e.target.value) || 20)} min={5} max={100} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none" />
      </div>
     </div>
     <button onClick={handleAnalyze} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]"> Analyser la suite</button>
    </div>

    {/* Examples */}
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-4">
     {EXAMPLES.map((ex, i) => (
      <button key={i} onClick={() => { setType(ex.type); setExpr(ex.expr); setU0(ex.u0); setNStart(ex.nStart); }} className="shrink-0 px-3 py-1.5 rounded-full text-xs bg-slate-800 text-slate-300 border border-slate-700 hover:border-indigo-500 active:scale-95">
       {ex.label}
      </button>
     ))}
    </div>

    {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-red-300 text-sm">{error}</div>}

    {result && (
     <div className="space-y-4">
      <ReliabilityPanel level={result.quality.level} title={result.quality.level === 'verified' ? 'Analyse démontrée' : result.quality.level === 'warning' ? 'Analyse insuffisante' : 'Observation numérique, pas une preuve'} detail={result.quality.detail} checks={[{ label: 'Termes effectivement calculés', ok: result.terms.length >= 5, detail: `${result.terms.length} terme(s) défini(s).` }]} />
      {/* Chart */}
      <div ref={containerRef} className="rounded-xl overflow-hidden border border-slate-700/50">
       <canvas ref={canvasRef} className="block" />
      </div>

      {/* Properties */}
      <div className="grid grid-cols-2 gap-2">
       <div className={`rounded-xl p-3 border ${result.behavior === 'increasing' ? 'bg-emerald-500/10 border-emerald-500/30' : result.behavior === 'decreasing' ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800/50 border-slate-700/30'}`}>
        <p className="text-xs text-slate-400">Monotonie</p>
        <p className="font-semibold text-white text-sm">
         {result.behavior === 'increasing' ? '↗ Croissante' : result.behavior === 'decreasing' ? '↘ Décroissante' : result.behavior === 'oscillating' ? '↕ Oscillante' : result.behavior === 'constant' ? '→ Constante' : '? Inconnue'}
        </p>
       </div>
       <div className={`rounded-xl p-3 border ${result.convergence.converges ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
        <p className="text-xs text-slate-400">Convergence</p>
        <p className="font-semibold text-white text-sm">
         {result.convergence.converges ? `→ ${result.convergence.limit}` : 'Pas de convergence démontrée'}
        </p>
       </div>
       {result.isArithmetic.yes && (
        <div className="rounded-xl p-3 border bg-indigo-500/10 border-indigo-500/30">
         <p className="text-xs text-slate-400">Arithmétique</p>
         <div className="font-semibold text-indigo-300 text-sm"><MathExpression value={`r=${result.isArithmetic.reason}`} /></div>
        </div>
       )}
       {result.isGeometric.yes && (
        <div className="rounded-xl p-3 border bg-purple-500/10 border-purple-500/30">
         <p className="text-xs text-slate-400">Géométrique</p>
         <div className="font-semibold text-purple-300 text-sm"><MathExpression value={`q=${result.isGeometric.ratio}`} /></div>
        </div>
       )}
      </div>

      {/* Terms table */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
       <p className="text-sm font-bold text-slate-300 mb-2"> Premiers termes</p>
       <div className="overflow-x-auto">
        <table className="text-xs border-collapse w-full min-w-[300px]">
         <thead><tr className="bg-slate-700/30">
          <th className="border border-slate-600 px-2 py-1 text-indigo-300">n</th>
          {result.terms.slice(0, 12).map(t => <th key={t.n} className="border border-slate-600 px-2 py-1 text-slate-300">{t.n}</th>)}
         </tr></thead>
         <tbody><tr>
          <td className="border border-slate-600 px-2 py-1 text-indigo-300 font-bold">uₙ</td>
          {result.terms.slice(0, 12).map(t => <td key={t.n} className="border border-slate-600 px-2 py-1 text-white font-mono">{t.value}</td>)}
         </tr></tbody>
        </table>
       </div>
      </div>

      {/* Explanation */}
      <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 space-y-2">
       <p className="text-sm font-bold text-blue-300"> Analyse</p>
       <p className="text-xs text-slate-300">{result.convergence.explanation}</p>
       {result.proofSteps.map((step, i) => <p key={i} className="text-xs text-slate-400">{i+1}. {step}</p>)}
       {result.bounded.above && <p className="text-xs text-slate-400">Borne supérieure démontrée : {result.bounded.supBound ?? 'elle existe (valeur non calculée)'}</p>}
       {result.bounded.below && <p className="text-xs text-slate-400">Borne inférieure démontrée : {result.bounded.infBound ?? 'elle existe (valeur non calculée)'}</p>}
       {result.sumFormula && <div className="text-xs text-slate-300 mt-1 overflow-x-auto"><MathText auto>{result.sumFormula}</MathText></div>}
      </div>

      {/* ═══ FORMULES SUITES ARITHMÉTIQUES ═══ */}
      {result.isArithmetic.yes && (
       <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/20 space-y-3">
        <p className="text-sm font-bold text-indigo-300"> Suite arithmétique — Formules</p>
        <div className="space-y-2">
         <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-700/15">
          <p className="text-[10px] text-indigo-400 font-bold">Raison r</p>
          <div className="text-sm text-white"><MathExpression value={`r=u_(n+1)-u_n=${result.isArithmetic.reason}`} /></div>
         </div>
         <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-700/15">
          <p className="text-[10px] text-indigo-400 font-bold">Terme général</p>
          <p className="text-sm font-mono text-white">uₙ = u₀ + n × r = {result.terms[0].value} + n × {result.isArithmetic.reason}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Vérif : u₅ = {result.terms[0].value} + 5 × {result.isArithmetic.reason} = {result.terms[0].value + 5 * (result.isArithmetic.reason || 0)}</p>
         </div>
         <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-700/15">
          <p className="text-[10px] text-indigo-400 font-bold">Somme des n+1 premiers termes</p>
          <p className="text-sm font-mono text-white">Sₙ = (n + 1) × (u₀ + uₙ) / 2</p>
          <p className="text-[10px] text-slate-500 mt-0.5">S₁₀ = 11 × ({result.terms[0].value} + {result.terms[Math.min(10, result.terms.length - 1)].value}) / 2 = {((11 * (result.terms[0].value + result.terms[Math.min(10, result.terms.length - 1)].value)) / 2).toFixed(2)}</p>
         </div>
        </div>
       </div>
      )}

      {/* ═══ FORMULES SUITES GÉOMÉTRIQUES ═══ */}
      {result.isGeometric.yes && result.isGeometric.ratio !== null && (
       <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20 space-y-3">
        <p className="text-sm font-bold text-purple-300"> Suite géométrique — Formules</p>
        <div className="space-y-2">
         <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-700/15">
          <p className="text-[10px] text-purple-400 font-bold">Raison q</p>
          <p className="text-sm font-mono text-white">q = uₙ₊₁ / uₙ = {result.isGeometric.ratio}</p>
         </div>
         <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-700/15">
          <p className="text-[10px] text-purple-400 font-bold">Terme général</p>
          <p className="text-sm font-mono text-white">uₙ = u₀ × qⁿ = {result.terms[0].value} × {result.isGeometric.ratio}ⁿ</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Vérif : u₃ = {result.terms[0].value} × {result.isGeometric.ratio}³ = {(result.terms[0].value * Math.pow(result.isGeometric.ratio, 3)).toFixed(4)}</p>
         </div>
         <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-700/15">
          <p className="text-[10px] text-purple-400 font-bold">Somme des n+1 premiers termes (q ≠ 1)</p>
          <p className="text-sm font-mono text-white">Sₙ = u₀ × (1 − qⁿ⁺¹) / (1 − q)</p>
          {Math.abs(result.isGeometric.ratio) !== 1 && (
           <p className="text-[10px] text-slate-500 mt-0.5">
            S₁₀ = {result.terms[0].value} × (1 − {result.isGeometric.ratio}¹¹) / (1 − {result.isGeometric.ratio}) = {(result.terms[0].value * (1 - Math.pow(result.isGeometric.ratio, 11)) / (1 - result.isGeometric.ratio)).toFixed(4)}
           </p>
          )}
         </div>
         {Math.abs(result.isGeometric.ratio) < 1 && (
          <div className="bg-emerald-500/10 rounded-lg p-2.5 border border-emerald-500/20">
           <p className="text-[10px] text-emerald-400 font-bold">Somme à l'infini (|q| {'<'} 1)</p>
           <p className="text-sm font-mono text-white">S∞ = u₀ / (1 − q) = {result.terms[0].value} / (1 − {result.isGeometric.ratio}) = {(result.terms[0].value / (1 - result.isGeometric.ratio)).toFixed(4)}</p>
           <p className="text-[10px] text-emerald-300 mt-0.5"> La suite converge car |q| = {Math.abs(result.isGeometric.ratio)} {'<'} 1</p>
          </div>
         )}
         {Math.abs(result.isGeometric.ratio) >= 1 && result.isGeometric.ratio !== 1 && (
          <div className="bg-amber-500/10 rounded-lg p-2.5 border border-amber-500/20">
           <p className="text-[10px] text-amber-400 font-bold">Divergence</p>
           <p className="text-[10px] text-amber-300">|q| = {Math.abs(result.isGeometric.ratio)} ≥ 1 → La suite diverge</p>
          </div>
         )}
        </div>
       </div>
      )}

      {/* ═══ Ni arithmétique ni géométrique ═══ */}
      {!result.isArithmetic.yes && !result.isGeometric.yes && (
       <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/20">
        <p className="text-sm font-bold text-slate-300">Type de suite</p>
        <p className="text-xs text-slate-400 mt-1">Cette suite n'est ni arithmétique (différence non constante) ni géométrique (rapport non constant).</p>
       </div>
      )}
     </div>
    )}
   </div>
  </div>
 );
};

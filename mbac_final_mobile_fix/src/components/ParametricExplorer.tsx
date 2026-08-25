import React, { useState, useRef, useEffect, useCallback } from 'react';
import { evaluateParametric } from '../lib/mathEngine';
import { MiniKeyboard, prettyToMath } from './MiniKeyboard';

interface Props { onClose: () => void }

export const ParametricExplorer: React.FC<Props> = ({ onClose }) => {
 const [expr, setExpr] = useState('a × x²');
 const [paramMin, setParamMin] = useState(-3);
 const [paramMax, setParamMax] = useState(3);
 const [paramValue, setParamValue] = useState(1);
 const [xMin] = useState(-6);
 const [xMax] = useState(6);
 const [isAnimating, setIsAnimating] = useState(false);
 const canvasRef = useRef<HTMLCanvasElement>(null);
 const containerRef = useRef<HTMLDivElement>(null);
 const animFrameRef = useRef<number>(0);
 const animDirRef = useRef(1);

 const COLORS = ['#818cf8', '#f43f5e', '#22d3ee', '#a78bfa', '#f97316', '#22c55e', '#ec4899', '#eab308'];

 const draw = useCallback((currentParam: number, ghostParams?: number[]) => {
  const canvas = canvasRef.current;
  const container = containerRef.current;
  if (!canvas || !container) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = container.clientWidth;
  const H = Math.min(W * 0.8, 380);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);

  const pad = { t: 20, r: 20, b: 35, l: 45 };

  // Get all data to determine y range
  const mExpr = prettyToMath(expr);
  const mainData = evaluateParametric(mExpr, xMin, xMax, currentParam);
  let allY = mainData.map(p => p.y);
  const ghostDataSets = (ghostParams || []).map(p => evaluateParametric(mExpr, xMin, xMax, p));
  ghostDataSets.forEach(gd => gd.forEach(p => allY.push(p.y)));

  let yMin = Math.min(...allY, -1);
  let yMax = Math.max(...allY, 1);
  const ym = (yMax - yMin) * 0.1 || 1;
  yMin -= ym; yMax += ym;
  // Clamp
  yMin = Math.max(yMin, -20); yMax = Math.min(yMax, 20);

  const cx = (x: number) => pad.l + ((x - xMin) / (xMax - xMin)) * (W - pad.l - pad.r);
  const cy = (y: number) => pad.t + ((yMax - y) / (yMax - yMin)) * (H - pad.t - pad.b);

  // BG
  ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 0.5;
  ctx.font = '10px system-ui'; ctx.fillStyle = '#475569';
  for (let x = Math.ceil(xMin); x <= xMax; x++) {
   const px = cx(x);
   ctx.beginPath(); ctx.moveTo(px, pad.t); ctx.lineTo(px, H - pad.b); ctx.stroke();
   ctx.textAlign = 'center'; ctx.fillText(String(x), px, H - pad.b + 12);
  }

  // Axes
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.2;
  if (yMin <= 0 && yMax >= 0) { const y0 = cy(0); ctx.beginPath(); ctx.moveTo(pad.l, y0); ctx.lineTo(W - pad.r, y0); ctx.stroke(); }
  if (xMin <= 0 && xMax >= 0) { const x0 = cx(0); ctx.beginPath(); ctx.moveTo(x0, pad.t); ctx.lineTo(x0, H - pad.b); ctx.stroke(); }

  // Ghost curves
  ghostDataSets.forEach((gd, gi) => {
   ctx.strokeStyle = COLORS[gi % COLORS.length] + '40';
   ctx.lineWidth = 1;
   ctx.beginPath();
   let started = false;
   for (const p of gd) {
    const px = cx(p.x), py = cy(p.y);
    if (py < pad.t - 20 || py > H - pad.b + 20) { ctx.stroke(); ctx.beginPath(); started = false; continue; }
    if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
   }
   ctx.stroke();
  });

  // Main curve
  ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  let started = false;
  for (const p of mainData) {
   const px = cx(p.x), py = cy(p.y);
   if (py < pad.t - 20 || py > H - pad.b + 20) { ctx.stroke(); ctx.beginPath(); started = false; continue; }
   if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Param label
  ctx.fillStyle = '#a78bfa'; ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'right';
  ctx.fillText(`a = ${currentParam.toFixed(2)}`, W - pad.r - 5, pad.t + 16);
 }, [expr, xMin, xMax]);

 // Redraw on param change
 useEffect(() => {
  const ghosts: number[] = [];
  for (let a = paramMin; a <= paramMax; a += (paramMax - paramMin) / 6) {
   if (Math.abs(a - paramValue) > 0.01) ghosts.push(Math.round(a * 100) / 100);
  }
  draw(paramValue, ghosts);
 }, [paramValue, draw, paramMin, paramMax]);

 // Animation
 useEffect(() => {
  if (!isAnimating) { cancelAnimationFrame(animFrameRef.current); return; }
  let val = paramMin;
  animDirRef.current = 1;
  const step = () => {
   val += animDirRef.current * (paramMax - paramMin) / 120;
   if (val >= paramMax) { val = paramMax; animDirRef.current = -1; }
   if (val <= paramMin) { val = paramMin; animDirRef.current = 1; }
   setParamValue(Math.round(val * 100) / 100);
   animFrameRef.current = requestAnimationFrame(step);
  };
  animFrameRef.current = requestAnimationFrame(step);
  return () => cancelAnimationFrame(animFrameRef.current);
 }, [isAnimating, paramMin, paramMax]);

 const PRESETS = [
  { label: 'a·x²', expr: 'a × x²' },
  { label: 'x²+a', expr: 'x² + a' },
  { label: 'sin(a·x)', expr: 'sin(a × x)' },
  { label: 'a·x³', expr: 'a × x³' },
  { label: 'x²−a', expr: 'x² − a' },
  { label: '1/(x−a)', expr: '1 ÷ (x − a)' },
 ];

 return (
  <div className="fixed inset-0 bg-slate-950/98 z-50 overflow-y-auto">
   <div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
    <div className="flex items-center justify-between mb-4">
     <h2 className="text-xl font-bold text-white"> Fonctions avec paramètre</h2>
     <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">×</button>
    </div>

    {/* Expression */}
    <div className="mb-3">
     <MiniKeyboard value={expr} onChange={setExpr} label="f(x, a) = (variable x, paramètre a)" placeholder="a×x²" />
    </div>

    {/* Presets */}
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-3">
     {PRESETS.map((p, i) => (
      <button key={i} onClick={() => setExpr(p.expr)} className="shrink-0 px-3 py-1.5 rounded-full text-xs bg-slate-800 text-slate-300 border border-slate-700 hover:border-indigo-500 active:scale-95 font-mono">{p.label}</button>
     ))}
    </div>

    {/* Canvas */}
    <div ref={containerRef} className="rounded-xl overflow-hidden border border-slate-700/50 mb-3">
     <canvas ref={canvasRef} className="block touch-none" />
    </div>

    {/* Slider */}
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30 mb-3 space-y-3">
     <div className="flex items-center justify-between">
      <label className="text-sm font-semibold text-purple-300">Paramètre a</label>
      <span className="font-mono text-lg text-white font-bold bg-purple-600/20 px-3 py-0.5 rounded-lg">{paramValue}</span>
     </div>
     <input
      type="range"
      min={paramMin}
      max={paramMax}
      step={0.05}
      value={paramValue}
      onChange={e => { setParamValue(Number(e.target.value)); setIsAnimating(false); }}
      className="w-full accent-purple-500 h-2"
     />
     <div className="flex justify-between text-xs text-slate-500">
      <span>{paramMin}</span><span>{paramMax}</span>
     </div>

     {/* Controls */}
     <div className="flex gap-2">
      <div className="flex-1 flex gap-1">
       <input type="number" value={paramMin} onChange={e => setParamMin(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-mono" />
       <input type="number" value={paramMax} onChange={e => setParamMax(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-mono" />
      </div>
      <button
       onClick={() => setIsAnimating(!isAnimating)}
       className={`px-4 py-1 rounded-lg text-sm font-bold ${isAnimating ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}
      >
       {isAnimating ? 'Arrêter' : 'Animer'}
      </button>
     </div>
    </div>

    {/* Explanation */}
    <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
     <p className="text-sm font-bold text-blue-300 mb-2"> Comment ça marche ?</p>
     <p className="text-xs text-slate-300 leading-relaxed">
      Le slider fait varier le paramètre <span className="font-mono text-purple-300">a</span> dans votre fonction.
      Les courbes fantômes montrent les positions pour d'autres valeurs de <span className="font-mono text-purple-300">a</span>.
      Appuyez sur <strong>Animer</strong> pour voir l'effet du paramètre en mouvement.
     </p>
    </div>
   </div>
  </div>
 );
};

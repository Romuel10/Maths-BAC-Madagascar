import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { PlotPoint, TangentInfo } from '../lib/mathEngine';
import { computeTangent } from '../lib/mathEngine';
import { safeEvaluateExpression } from '../lib/expressionCore';

interface InteractiveGraphProps {
 data: PlotPoint[];
 data2?: PlotPoint[];
 xMin: number;
 xMax: number;
 criticalPoints?: { x: number; y: number; type: string }[];
 zeros?: { x: number }[];
 inflectionPoints?: { x: number; y: number }[];
 asymptotes?: {
  vertical: { x: number }[];
  horizontal: { y: number }[];
  oblique: { a: number; b: number }[];
 };
 expression?: string;
 derivativeExpr?: string;
 secondDerivativeExpr?: string;
 label1?: string;
 label2?: string;
}

export const InteractiveGraph: React.FC<InteractiveGraphProps> = ({
 data, data2,
 xMin: initialXMin, xMax: initialXMax,
 criticalPoints = [], zeros = [], inflectionPoints = [],
 asymptotes, expression, derivativeExpr, secondDerivativeExpr
}) => {
 const canvasRef = useRef<HTMLCanvasElement>(null);
 const containerRef = useRef<HTMLDivElement>(null);
 const animRef = useRef<number>(0);
 const [dims, setDims] = useState({ w: 400, h: 300 });
 const [xMin, setXMin] = useState(initialXMin);
 const [xMax, setXMax] = useState(initialXMax);
 const [touchPt, setTouchPt] = useState<{ x: number; fx: number } | null>(null);
 const [tangent, setTangent] = useState<TangentInfo | null>(null);
 const [showTangent, setShowTangent] = useState(false);
 const [drawProgress, setDrawProgress] = useState(0);
 const [animated, setAnimated] = useState(false);
 const [showFPrime, setShowFPrime] = useState(false);
 const [showFDoublePrime, setShowFDoublePrime] = useState(false);
 const [themeTick, setThemeTick] = useState(0);

 useEffect(() => {
  setXMin(initialXMin);
  setXMax(initialXMax);
  setTouchPt(null);
  setTangent(null);
 }, [initialXMin, initialXMax]);

 useEffect(() => {
  const obs = new MutationObserver(() => setThemeTick(v => v + 1));
  obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  return () => obs.disconnect();
 }, []);

 const activeData = useMemo<PlotPoint[]>(() => {
  if (!expression) return data;
  const pts: PlotPoint[] = [];
  const samples = 900;
  for (let i = 0; i <= samples; i++) {
   const x = xMin + ((xMax - xMin) * i) / samples;
   const y = safeEvaluateExpression(expression, { x });
   if (y !== null && Math.abs(y) < 1e10) pts.push({ x, y });
  }
  return pts.length > 1 ? pts : data;
 }, [expression, xMin, xMax, data]);

 const { yMin, yMax } = useMemo(() => {
  const visible = activeData
   .filter(p => p.x >= xMin && p.x <= xMax && Number.isFinite(p.y) && Math.abs(p.y) < 1e8)
   .map(p => p.y)
   .sort((a,b) => a-b);
  if (!visible.length) return { yMin: -5, yMax: 5 };
  const q = (t:number) => visible[Math.min(visible.length-1, Math.max(0, Math.floor((visible.length-1)*t)))];
  let lo = q(0.03), hi = q(0.97);
  // If there is no strong outlier/asymptote, keep the full curve. Otherwise use
  // robust quantiles so one huge value does not flatten the whole graph.
  const fullLo = visible[0], fullHi = visible[visible.length-1];
  const robustSpan = Math.max(1e-9, hi-lo);
  if ((fullHi-fullLo) <= robustSpan * 4) { lo = fullLo; hi = fullHi; }
  if (lo <= 0 && hi >= 0) { /* already contains the x-axis */ }
  else if (Math.min(Math.abs(lo), Math.abs(hi)) < robustSpan * 1.5) { lo=Math.min(lo,0); hi=Math.max(hi,0); }
  const margin = Math.max((hi-lo)*0.16, 1);
  return { yMin: lo-margin, yMax: hi+margin };
 }, [activeData, xMin, xMax]);
 const pad = { t: 22, r: 24, b: 42, l: 52 };

 useEffect(() => {
  const update = () => {
   if (containerRef.current) {
    const w = containerRef.current.clientWidth;
    setDims({ w, h: Math.min(w * 0.75, 360) });
   }
  };
  update();
  window.addEventListener('resize', update);
  return () => window.removeEventListener('resize', update);
 }, []);

 // Animate draw on new data
 useEffect(() => {
  if (document.body.classList.contains('reduce-motion')) {
   setDrawProgress(1);
   setAnimated(true);
   return;
  }
  setDrawProgress(0);
  setAnimated(false);
  let start: number | null = null;
  const duration = 1200; // ms

  const frame = (ts: number) => {
   if (!start) start = ts;
   const elapsed = ts - start;
   const progress = Math.min(elapsed / duration, 1);
   // Ease out cubic
   const eased = 1 - Math.pow(1 - progress, 3);
   setDrawProgress(eased);
   if (progress < 1) {
    animRef.current = requestAnimationFrame(frame);
   } else {
    setAnimated(true);
   }
  };
  animRef.current = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(animRef.current);
 }, [activeData]);

 const cx = useCallback((x: number) => pad.l + ((x - xMin) / (xMax - xMin)) * (dims.w - pad.l - pad.r), [xMin, xMax, dims.w]);
 const cy = useCallback((y: number) => pad.t + ((yMax - y) / (yMax - yMin)) * (dims.h - pad.t - pad.b), [yMin, yMax, dims.h]);
 const fromCx = useCallback((px: number) => xMin + ((px - pad.l) / (dims.w - pad.l - pad.r)) * (xMax - xMin), [xMin, xMax, dims.w]);

 const handleTouch = useCallback((e: React.TouchEvent | React.MouseEvent) => {
  if (!expression || activeData.length === 0) return;
  const rect = canvasRef.current?.getBoundingClientRect();
  if (!rect) return;
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const x = fromCx(clientX - rect.left);
  const pt = activeData.reduce((best, p) => Math.abs(p.x - x) < Math.abs(best.x - x) ? p : best, activeData[0]);
  if (pt) {
   setTouchPt({ x: pt.x, fx: pt.y });
   if (showTangent && derivativeExpr) setTangent(computeTangent(expression, derivativeExpr, pt.x));
  }
 }, [activeData, expression, derivativeExpr, fromCx, showTangent]);

 // ═══ Draw ═══
 useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas || activeData.length === 0) return;
  const c = canvas.getContext('2d');
  if (!c) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = dims.w * dpr; canvas.height = dims.h * dpr;
  c.scale(dpr, dpr);
  const { w, h } = dims;
  const typicalDx = activeData.length > 1 ? Math.abs(activeData[activeData.length-1].x - activeData[0].x) / Math.max(1, activeData.length-1) : 0;
  const shouldBreak = (prev: PlotPoint | undefined, cur: PlotPoint) => {
   if (!prev) return false;
   if (typicalDx > 0 && Math.abs(cur.x-prev.x) > typicalDx*2.8) return true;
   return Math.abs(cur.y-prev.y) > (yMax-yMin)*0.65;
  };

  // Theme-aware coordinate plane (light and dark modes use the same hierarchy).
  const light = document.body.classList.contains('light');
  const palette = light ? {
   bg:'#fffdf8', bg2:'#f7f3eb', grid:'#ddd6cb', axis:'#89919a', label:'#66717c', curve:'#b94340', glow:'rgba(185,67,64,.14)', prime:'#9f671c', second:'#355f9f'
  } : {
   bg:'#151b23', bg2:'#111820', grid:'#2b3541', axis:'#687482', label:'#929ca8', curve:'#ef6661', glow:'rgba(239,102,97,.15)', prime:'#f2b45f', second:'#7aa2e8'
  };
  const bg = c.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, palette.bg); bg.addColorStop(1, palette.bg2);
  c.fillStyle = bg; c.fillRect(0, 0, w, h);

  // Grid
  c.strokeStyle = palette.grid; c.lineWidth = 0.6;
  const xStep = gridStep(xMax - xMin), yStep = gridStep(yMax - yMin);
  c.font = '10px system-ui'; c.fillStyle = palette.label;

  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
   const px = cx(x);
   c.beginPath(); c.moveTo(px, pad.t); c.lineTo(px, h - pad.b); c.stroke();
   c.textAlign = 'center'; c.fillText(fmtAx(x), px, h - pad.b + 14);
  }
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
   const py = cy(y);
   c.beginPath(); c.moveTo(pad.l, py); c.lineTo(w - pad.r, py); c.stroke();
   c.textAlign = 'right'; c.fillText(fmtAx(y), pad.l - 6, py + 3);
  }

  // Axes
  c.strokeStyle = palette.axis; c.lineWidth = 1.25;
  if (yMin <= 0 && yMax >= 0) { const y0 = cy(0); c.beginPath(); c.moveTo(pad.l, y0); c.lineTo(w - pad.r, y0); c.stroke(); }
  if (xMin <= 0 && xMax >= 0) { const x0 = cx(0); c.beginPath(); c.moveTo(x0, pad.t); c.lineTo(x0, h - pad.b); c.stroke(); }
  // Axis names, as on a school coordinate system.
  c.fillStyle = palette.label; c.font = 'bold 11px system-ui';
  c.textAlign = 'right'; c.fillText('x', w - pad.r, Math.min(h - pad.b + 28, h - 8));
  c.textAlign = 'left'; c.fillText('y', pad.l + 6, pad.t + 10);

  // Asymptotes
  if (asymptotes) {
   c.setLineDash([6, 4]);
   c.lineWidth = 1.2;
   asymptotes.vertical.forEach(a => {
    const px = cx(a.x); c.strokeStyle = '#ef444480'; c.beginPath(); c.moveTo(px, pad.t); c.lineTo(px, h - pad.b); c.stroke();
    c.fillStyle='#fca5a5'; c.font='10px system-ui'; c.textAlign='left'; c.fillText(`x=${fmtAx(a.x)}`, Math.min(px+4,w-pad.r-34), pad.t+12);
   });
   asymptotes.horizontal.forEach(a => {
    const py = cy(a.y); c.strokeStyle = '#3b82f680'; c.beginPath(); c.moveTo(pad.l, py); c.lineTo(w - pad.r, py); c.stroke();
    c.fillStyle='#93c5fd'; c.font='10px system-ui'; c.textAlign='right'; c.fillText(`y=${fmtAx(a.y)}`, w-pad.r-3, Math.max(pad.t+10,py-4));
   });
   asymptotes.oblique.forEach(a => {
    c.strokeStyle = '#8b5cf680'; c.beginPath(); c.moveTo(cx(xMin), cy(a.a * xMin + a.b)); c.lineTo(cx(xMax), cy(a.a * xMax + a.b)); c.stroke();
   });
   c.setLineDash([]);
  }

  // Second curve
  if (data2 && data2.length > 0) {
   c.strokeStyle = '#f9731690'; c.lineWidth = 2;
   c.beginPath(); let s = false;
   for (const p of data2) {
    const px = cx(p.x), py = cy(p.y);
    if (py < pad.t - 30 || py > h - pad.b + 30) { c.stroke(); c.beginPath(); s = false; continue; }
    if (!s) { c.moveTo(px, py); s = true; } else c.lineTo(px, py);
   }
   c.stroke();
  }

  // ═══ Main curve with animation ═══
  const drawCount = Math.floor(activeData.length * drawProgress);
  if (drawCount > 0) {
   // Glow behind curve
   c.strokeStyle = palette.glow; c.lineWidth = 8;
   c.beginPath(); let s = false;
   for (let i = 0; i < drawCount; i++) {
    const px = cx(activeData[i].x), py = cy(activeData[i].y);
    if (py < pad.t - 40 || py > h - pad.b + 40 || shouldBreak(i > 0 ? activeData[i-1] : undefined, activeData[i])) {
     c.stroke(); c.beginPath(); s = false; continue;
    }
    if (!s) { c.moveTo(px, py); s = true; } else c.lineTo(px, py);
   }
   c.stroke();

   // Main line
   c.strokeStyle = palette.curve; c.lineWidth = 2.6;
   c.beginPath(); s = false;
   for (let i = 0; i < drawCount; i++) {
    const px = cx(activeData[i].x), py = cy(activeData[i].y);
    if (py < pad.t - 40 || py > h - pad.b + 40 || shouldBreak(i > 0 ? activeData[i-1] : undefined, activeData[i])) {
     c.stroke(); c.beginPath(); s = false; continue;
    }
    if (!s) { c.moveTo(px, py); s = true; } else c.lineTo(px, py);
   }
   c.stroke();

   // Animated tip dot
   if (!animated && drawCount > 0 && drawCount < activeData.length) {
    const tip = activeData[drawCount - 1];
    const tpx = cx(tip.x), tpy = cy(tip.y);
    c.beginPath(); c.arc(tpx, tpy, 5, 0, Math.PI * 2);
    c.fillStyle = palette.curve; c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke();
   }
  }

  // Tangent line
  if (tangent && showTangent && animated) {
   c.strokeStyle = '#22d3ee80'; c.lineWidth = 1.5; c.setLineDash([4, 4]);
   c.beginPath();
   c.moveTo(cx(xMin), cy(tangent.slope * xMin + tangent.yIntercept));
   c.lineTo(cx(xMax), cy(tangent.slope * xMax + tangent.yIntercept));
   c.stroke(); c.setLineDash([]);
  }

  // Points (only after animation)
  if (animated) {
   // Zeros
   zeros.forEach(z => {
    c.beginPath(); c.arc(cx(z.x), cy(0), 5, 0, Math.PI * 2);
    c.fillStyle = '#22c55e'; c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 1; c.stroke();
   });
   // Inflection
   inflectionPoints.forEach(ip => {
    c.beginPath(); c.arc(cx(ip.x), cy(ip.y), 5, 0, Math.PI * 2);
    c.fillStyle = '#f59e0b'; c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 1; c.stroke();
   });
   // Critical points with bounce effect
   criticalPoints.forEach(cp => {
    c.beginPath(); c.arc(cx(cp.x), cy(cp.y), 7, 0, Math.PI * 2);
    c.fillStyle = cp.type.includes('max') ? '#f43f5e' : cp.type.includes('min') ? '#06b6d4' : '#fbbf24';
    c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
    // Label
    c.fillStyle = '#fff'; c.font = 'bold 9px system-ui'; c.textAlign = 'center';
    c.fillText(`(${fmtAx(cp.x)},${fmtAx(cp.y)})`, cx(cp.x), cy(cp.y) - 12);
   });
  }

  // Touch point
  if (touchPt && animated) {
   const px = cx(touchPt.x), py = cy(touchPt.fx);
   // Crosshair
   c.setLineDash([3, 3]); c.strokeStyle = '#a855f740'; c.lineWidth = 1;
   c.beginPath(); c.moveTo(px, pad.t); c.lineTo(px, h - pad.b); c.stroke();
   c.beginPath(); c.moveTo(pad.l, py); c.lineTo(w - pad.r, py); c.stroke();
   c.setLineDash([]);
   // Dot
   c.beginPath(); c.arc(px, py, 7, 0, Math.PI * 2);
   c.fillStyle = '#a855f7'; c.fill();
   c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
   // Label
   c.fillStyle = '#e2e8f0'; c.font = 'bold 11px system-ui'; c.textAlign = px > w / 2 ? 'right' : 'left';
   c.fillText(`(${fmtAx(touchPt.x)}, ${fmtAx(touchPt.fx)})`, px > w / 2 ? px - 12 : px + 12, py - 12);
  }
  // ── f'(x) curve ──
  if (showFPrime && derivativeExpr && animated) {
   c.strokeStyle = '#f97316'; c.lineWidth = 1.5; c.setLineDash([6, 3]);
   c.beginPath(); let sp = false;
   for (const p of activeData) {
    {
     const yp = safeEvaluateExpression(derivativeExpr, { x: p.x });
     if (yp !== null && Math.abs(yp) < 1e5) {
      const px = cx(p.x), py = cy(yp);
      if (py < pad.t - 30 || py > h - pad.b + 30) { c.stroke(); c.beginPath(); sp = false; continue; }
      if (!sp) { c.moveTo(px, py); sp = true; } else c.lineTo(px, py);
     }
    }
   }
   c.stroke(); c.setLineDash([]);
  }

  // ── f''(x) curve ──
  if (showFDoublePrime && secondDerivativeExpr && animated) {
   c.strokeStyle = palette.second; c.lineWidth = 1.5; c.setLineDash([3, 3]);
   c.beginPath(); let sp2 = false;
   for (const p of activeData) {
    {
     const ypp = safeEvaluateExpression(secondDerivativeExpr, { x: p.x });
     if (ypp !== null && Math.abs(ypp) < 1e5) {
      const px = cx(p.x), py = cy(ypp);
      if (py < pad.t - 30 || py > h - pad.b + 30) { c.stroke(); c.beginPath(); sp2 = false; continue; }
      if (!sp2) { c.moveTo(px, py); sp2 = true; } else c.lineTo(px, py);
     }
    }
   }
   c.stroke(); c.setLineDash([]);
  }

 }, [activeData, data2, dims, xMin, xMax, yMin, yMax, drawProgress, animated, criticalPoints, zeros, inflectionPoints, asymptotes, touchPt, tangent, showTangent, showFPrime, showFDoublePrime, derivativeExpr, secondDerivativeExpr, cx, cy, themeTick]);

 const handleZoom = (factor: number) => {
  const center = (xMin + xMax) / 2;
  const range = (xMax - xMin) * factor;
  setXMin(center - range / 2); setXMax(center + range / 2);
 };

 return (
  <div className="space-y-2 animate-scale-in">
   <div className="graph-toolbar rounded-xl">
    <div>
     <p className="eyebrow">Graphique de la fonction</p>
     <p className="section-copy mt-1">Échelle verticale automatique · ruptures aux discontinuités · repère lisible</p>
    </div>
    <div className="text-right">
     <p className="text-[9px] muted">Fenêtre x</p>
     <p className="text-[10px] font-bold" style={{color:'var(--text)'}}>[{fmtAx(xMin)} ; {fmtAx(xMax)}]</p>
    </div>
   </div>
   <div ref={containerRef} className="graph-shell relative">
    <canvas ref={canvasRef} style={{ width: dims.w, height: dims.h }} role="img" aria-label={`Courbe de la fonction ${expression}`}
     className="block touch-none"
     onTouchMove={handleTouch} onTouchStart={handleTouch}
     onMouseMove={handleTouch} onMouseLeave={() => setTouchPt(null)} />

    {/* Touch info overlay */}
    {touchPt && animated && (
     <div className="absolute top-2 right-2 glass rounded-xl px-3 py-2 border border-purple-500/20 animate-fade-in">
      <p className="text-[11px] text-purple-300 font-mono font-bold">
       f({fmtAx(touchPt.x)}) = {fmtAx(touchPt.fx)}
      </p>
      {tangent && showTangent && (
       <p className="text-[10px] text-cyan-300 font-mono mt-0.5">{tangent.equation}</p>
      )}
     </div>
    )}
   </div>

   {/* Controls row 1: zoom + screenshot */}
   <div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-1">
     <button onClick={() => handleZoom(0.5)} className="graph-chip">+</button>
     <button onClick={() => handleZoom(2)} className="graph-chip">−</button>
     <button onClick={() => { setXMin(initialXMin); setXMax(initialXMax); }} className="graph-chip">↺</button>
    </div>
    <button onClick={() => {
     const canvas = canvasRef.current;
     if (!canvas) return;
     const link = document.createElement('a');
     link.download = `mathsolver-${expression || 'graph'}.png`;
     link.href = canvas.toDataURL('image/png');
     link.click();
    }} className="graph-chip">
      PNG
    </button>
   </div>

   {/* Controls row 2: curve toggles */}
   <div className="flex flex-wrap gap-1">
    {expression && derivativeExpr && (
     <button onClick={() => setShowTangent(!showTangent)}
      className={`px-2.5 h-7 rounded-lg text-[10px] font-bold border active:scale-90 ${showTangent ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/30' : 'bg-slate-800/60 text-slate-400 border-slate-700/30'}`}>
       Tangente
     </button>
    )}
    {derivativeExpr && (
     <button onClick={() => setShowFPrime(!showFPrime)}
      className={`px-2.5 h-7 rounded-lg text-[10px] font-bold border active:scale-90 ${showFPrime ? 'bg-orange-600/20 text-orange-300 border-orange-500/30' : 'bg-slate-800/60 text-slate-400 border-slate-700/30'}`}>
      f'(x)
     </button>
    )}
    {secondDerivativeExpr && secondDerivativeExpr !== 'Non calculable' && (
     <button onClick={() => setShowFDoublePrime(!showFDoublePrime)}
      className={`px-2.5 h-7 rounded-lg text-[10px] font-bold border active:scale-90 ${showFDoublePrime ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/30' : 'bg-slate-800/60 text-slate-400 border-slate-700/30'}`}>
      f''(x)
     </button>
    )}
   </div>

   {/* Legend */}
   <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] px-1">
    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span> <span className="text-slate-400">f(x)</span></span>
    {showFPrime && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span> <span className="text-slate-400">f'(x)</span></span>}
    {showFDoublePrime && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> <span className="text-slate-400">f''(x)</span></span>}
    {data2 && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span> <span className="text-slate-400">g(x)</span></span>}
    {zeros.length > 0 && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> <span className="text-slate-400">Zéros</span></span>}
    {criticalPoints.some(c => c.type.includes('max')) && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> <span className="text-slate-400">Max</span></span>}
    {criticalPoints.some(c => c.type.includes('min')) && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> <span className="text-slate-400">Min</span></span>}
    {asymptotes && asymptotes.vertical.length > 0 && <span className="flex items-center gap-1"><span className="w-4 border-t border-dashed border-red-400"></span><span className="text-slate-400">Asymptote verticale</span></span>}
    {asymptotes && asymptotes.horizontal.length > 0 && <span className="flex items-center gap-1"><span className="w-4 border-t border-dashed border-blue-400"></span><span className="text-slate-400">Asymptote horizontale</span></span>}
   </div>
  </div>
 );
};

function gridStep(range: number): number {
 const raw = range / 8;
 const mag = Math.pow(10, Math.floor(Math.log10(raw)));
 const norm = raw / mag;
 if (norm <= 1.5) return mag;
 if (norm <= 3.5) return 2 * mag;
 if (norm <= 7.5) return 5 * mag;
 return 10 * mag;
}

function fmtAx(n: number): string {
 if (Number.isInteger(n)) return String(n);
 return n.toFixed(2).replace(/\.?0+$/, '');
}

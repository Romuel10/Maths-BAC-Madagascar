import React, { useState, useRef, useEffect } from 'react';
import { computeIntegral, type IntegralResult, type PlotPoint } from '../lib/mathEngine';
import { safeEvaluateExpression } from '../lib/expressionCore';
import { MathExpression, MathText } from './MathNotation';
import { ReliabilityPanel } from './ReliabilityPanel';

interface Props {
 expression: string;
 plotData: PlotPoint[];
}

export const IntegralCalculator: React.FC<Props> = ({ expression, plotData }) => {
 const [a, setA] = useState('-2');
 const [b, setB] = useState('2');
 const [result, setResult] = useState<IntegralResult | null>(null);
 const [error, setError] = useState<string | null>(null);
 const [showSteps, setShowSteps] = useState(true);
 const canvasRef = useRef<HTMLCanvasElement>(null);
 const containerRef = useRef<HTMLDivElement>(null);
 const [themeTick, setThemeTick] = useState(0);

 useEffect(() => {
  const obs = new MutationObserver(() => setThemeTick(v => v + 1));
  obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  return () => obs.disconnect();
 }, []);

 const handleCalculate = () => {
  setError(null);
  const aVal = parseFloat(a);
  const bVal = parseFloat(b);
  if (isNaN(aVal) || isNaN(bVal)) { setError('Entrez des nombres valides'); return; }
  if (aVal >= bVal) { setError('a doit être inférieur à b'); return; }
  try {
   const r = computeIntegral(expression, aVal, bVal);
   setResult(r);
  } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur de calcul'); }
 };

 // Draw graph with colored area
 useEffect(() => {
  if (!result || !canvasRef.current || !containerRef.current) return;
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = containerRef.current.clientWidth;
  const H = Math.min(W * 0.6, 260);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);

  const pad = { t: 15, r: 15, b: 30, l: 40 };
  const xMin = Math.min(result.a - 1, -5);
  const xMax = Math.max(result.b + 1, 5);

  // Recalculate the visible curve for the current integration window.
  // This avoids an incomplete graph when a or b lies outside the original analysis window.
  const visiblePts: PlotPoint[] = [];
  const graphSamples = 700;
  for (let i = 0; i <= graphSamples; i++) {
   const x = xMin + ((xMax - xMin) * i) / graphSamples;
   try {
    const y = safeEvaluateExpression(expression, { x });
    if (y !== null && Math.abs(y) < 1e10) visiblePts.push({ x, y });
   } catch { /* gap at undefined points */ }
  }
  if (visiblePts.length < 2) visiblePts.push(...plotData.filter(p => p.x >= xMin && p.x <= xMax));
  let yMin = Math.min(0, ...visiblePts.map(p => p.y));
  let yMax = Math.max(0, ...visiblePts.map(p => p.y));
  const ym = (yMax - yMin) * 0.1 || 1;
  yMin -= ym; yMax += ym;

  const cx = (x: number) => pad.l + ((x - xMin) / (xMax - xMin)) * (W - pad.l - pad.r);
  const cy = (y: number) => pad.t + ((yMax - y) / (yMax - yMin)) * (H - pad.t - pad.b);

  const light = document.body.classList.contains('light');
  const palette = light ? { bg:'#fffdf8', bg2:'#f7f3eb', grid:'#ddd6cb', axis:'#89919a', label:'#66717c', curve:'#b94340', positive:'rgba(31,123,89,.16)', negative:'rgba(184,61,75,.14)', bound:'#9f671c', result:'#202832' } : { bg:'#151b23', bg2:'#111820', grid:'#2b3541', axis:'#687482', label:'#929ca8', curve:'#ef6661', positive:'rgba(66,185,135,.16)', negative:'rgba(237,107,120,.14)', bound:'#f2b45f', result:'#f4f1ea' };
  // BG
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, palette.bg); bg.addColorStop(1, palette.bg2);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Grid and readable graduations
  ctx.strokeStyle = palette.grid; ctx.lineWidth = 0.5;
  ctx.font = '9px system-ui'; ctx.fillStyle = palette.label;
  const xStep = (xMax-xMin)/5;
  const yStep = (yMax-yMin)/5;
  for(let i=0;i<=5;i++){
   const xv=xMin+i*xStep, px=cx(xv);
   ctx.beginPath(); ctx.moveTo(px,pad.t); ctx.lineTo(px,H-pad.b); ctx.stroke();
   ctx.textAlign='center'; ctx.fillText(Number.isInteger(xv)?String(xv):xv.toFixed(1),px,H-pad.b+13);
  }
  for(let i=0;i<=5;i++){
   const yv=yMin+i*yStep, py=cy(yv);
   ctx.beginPath(); ctx.moveTo(pad.l,py); ctx.lineTo(W-pad.r,py); ctx.stroke();
   ctx.textAlign='right'; ctx.fillText(Number.isInteger(yv)?String(yv):yv.toFixed(1),pad.l-5,py+3);
  }

  // Axes
  ctx.strokeStyle = palette.axis; ctx.lineWidth = 1;
  if (yMin <= 0 && yMax >= 0) {
   const y0 = cy(0);
   ctx.beginPath(); ctx.moveTo(pad.l, y0); ctx.lineTo(W - pad.r, y0); ctx.stroke();
  }
  ctx.fillStyle = palette.label; ctx.font = '10px system-ui';
  ctx.textAlign = 'right'; ctx.fillText('x', W - pad.r, H - 8);
  ctx.textAlign = 'left'; ctx.fillText('y', pad.l + 5, pad.t + 10);

  // ═══ Colored area ═══
  const areaPts = result.areaPoints;
  if (areaPts.length > 1) {
   const y0 = cy(0);

   // Positive area (green)
   ctx.fillStyle = palette.positive;
   ctx.beginPath();
   ctx.moveTo(cx(areaPts[0].x), y0);
   for (const p of areaPts) {
    const py = cy(Math.max(0, p.y));
    ctx.lineTo(cx(p.x), py);
   }
   ctx.lineTo(cx(areaPts[areaPts.length - 1].x), y0);
   ctx.closePath();
   ctx.fill();

   // Negative area (red)
   ctx.fillStyle = palette.negative;
   ctx.beginPath();
   ctx.moveTo(cx(areaPts[0].x), y0);
   for (const p of areaPts) {
    const py = cy(Math.min(0, p.y));
    ctx.lineTo(cx(p.x), py);
   }
   ctx.lineTo(cx(areaPts[areaPts.length - 1].x), y0);
   ctx.closePath();
   ctx.fill();

   // Border lines a and b
   ctx.setLineDash([4, 3]); ctx.strokeStyle = palette.bound; ctx.lineWidth = 1.5;
   ctx.beginPath(); ctx.moveTo(cx(result.a), pad.t); ctx.lineTo(cx(result.a), H - pad.b); ctx.stroke();
   ctx.beginPath(); ctx.moveTo(cx(result.b), pad.t); ctx.lineTo(cx(result.b), H - pad.b); ctx.stroke();
   ctx.setLineDash([]);

   // Labels a, b
   ctx.fillStyle = palette.bound; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center';
   ctx.fillText(`a=${result.a}`, cx(result.a), H - pad.b + 14);
   ctx.fillText(`b=${result.b}`, cx(result.b), H - pad.b + 14);
  }

  // Curve
  ctx.strokeStyle = palette.curve; ctx.lineWidth = 2.2;
  ctx.beginPath(); let started = false;
  for (const p of visiblePts) {
   const px = cx(p.x), py = cy(p.y);
   if (py < pad.t - 20 || py > H - pad.b + 20) { ctx.stroke(); ctx.beginPath(); started = false; continue; }
   if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Result label in center of area
  const midX = (result.a + result.b) / 2;
  try {
   const midY = safeEvaluateExpression(expression, { x: midX });
   if (typeof midY === 'number' && isFinite(midY)) {
    ctx.fillStyle = palette.result; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(`${result.exact ? '=' : '≈'} ${result.value}`, cx(midX), cy(midY / 2));
   }
  } catch { /* skip */ }

 }, [result, plotData, expression, themeTick]);

 return (
  <section className="integral-panel">
   <div className="flex items-start justify-between gap-3 mb-4">
    <div>
     <p className="eyebrow">Intégrale définie</p>
     <h3 className="section-title mt-1">Calcul exact quand une primitive est reconnue</h3>
     <p className="section-copy mt-1">L’approximation numérique n’est utilisée qu’en dernier recours et elle est signalée comme telle.</p>
    </div>
    <button onClick={() => setShowSteps(!showSteps)} className="btn btn-small btn-secondary">{showSteps ? 'Masquer les étapes' : 'Voir les étapes'}</button>
   </div>

   <div className="formula-strip text-center mb-4">
    <MathExpression value={`\\int_{${a || 'a'}}^{${b || 'b'}} ${expression} \\, dx`} block />
   </div>

   <div className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-4 items-end">
    <label><span className="field-label">Borne a</span><input type="number" value={a} onChange={e => setA(e.target.value)} step="0.5" className="field text-center" /></label>
    <label><span className="field-label">Borne b</span><input type="number" value={b} onChange={e => setB(e.target.value)} step="0.5" className="field text-center" /></label>
    <button onClick={handleCalculate} className="btn btn-primary h-[42px] px-4">Calculer</button>
   </div>

   {error && <div className="notice mb-4" style={{borderColor:'var(--danger)',color:'var(--danger)'}}>{error}</div>}

   {result && (
    <div className="space-y-4">
     <ReliabilityPanel level={result.quality} title={result.quality === 'verified' ? (result.exact ? 'Résultat exact vérifié' : 'Résultat vérifié') : result.quality === 'approximate' ? 'Valeur approchée contrôlée' : 'Calcul interrompu'} detail={result.warning || (result.exact ? 'Une primitive reconnue a été utilisée puis évaluée aux bornes.' : `Deux calculs de Simpson ont été comparés. Erreur estimée : ${Number.isFinite(result.errorEstimate) ? result.errorEstimate.toExponential(2) : 'non disponible'}.`)} checks={result.checks} />

     {Number.isFinite(result.value) && result.areaPoints.length > 1 && (
      <div>
       <div className="mb-2"><p className="eyebrow">Interprétation graphique</p><p className="section-copy mt-1">Zone verte : contribution positive. Zone rouge : contribution négative.</p></div>
       <div ref={containerRef} className="graph-shell"><canvas ref={canvasRef} className="block" /></div>
      </div>
     )}

     {Number.isFinite(result.value) ? (
      <div className="integral-final">
       <p className="eyebrow" style={{color:'var(--success)'}}>Réponse finale</p>
       {result.primitiveExpr && (
        <div className="paper-card p-3 mt-3">
         <p className="field-label">Primitive utilisée</p>
         <div className="mt-2 overflow-x-auto"><MathExpression value={`F(x)=${result.primitiveExpr}`} block /></div>
        </div>
       )}
       <div className="text-2xl font-extrabold text-center mt-4 overflow-x-auto">
        <MathExpression value={`\\int_{${result.a}}^{${result.b}} ${expression} \\,dx ${result.exact && result.exactResultExpr ? `= ${result.exactResultExpr}` : `\\approx ${result.value}`}`} block />
       </div>
       {result.exact && result.exactResultExpr && result.exactResultExpr !== String(result.value) && <div className="text-center muted mt-2"><MathExpression value={`\\approx ${result.value}`} /></div>}
       <p className="section-copy text-center mt-2">{result.exact ? result.method : `${result.unit} · erreur estimée ≈ ${result.errorEstimate.toExponential(2)}`}</p>
      </div>
     ) : (
      <div className="notice" style={{borderColor:'var(--warning-border)',color:'var(--warning)'}}>Aucune valeur n’est donnée : le domaine ou la continuité ne permettent pas un calcul fiable sur cet intervalle.</div>
     )}

     {showSteps && (
      <div className="paper-card p-3">
       <p className="eyebrow">Méthode complète</p>
       <div className="space-y-2 mt-3">
        {result.steps.map((step, i) => <div key={i} className="solution-step"><div className="flex gap-2"><span className="solution-step-number">{i + 1}</span><div className="text-sm leading-relaxed min-w-0"><MathText auto>{step}</MathText></div></div></div>)}
       </div>
      </div>
     )}
    </div>
   )}
  </section>
 );
};

/**
 * Probabilités & Statistiques avec résultats structurés
 * © 2025 RATOVOSON Navelanizara Romuel
 */
import React, { useState } from 'react';
import { ResultBox, Step, Section, StepsList, PropBadge } from './ResultCard';
import { ReliabilityPanel } from './ReliabilityPanel';
import { factorialBigInt, combinationBigInt, arrangementsBigInt, binomialProbability, binomialCdf, normalCdf, descriptiveStats } from '../lib/probabilityEngine';

interface Props { onClose: () => void }
type Mode = 'combi' | 'binomial' | 'stats' | 'normal';

function f(n: number): string { const r = Math.round(n * 100000000) / 100000000; return Number.isInteger(r) ? String(r) : r.toFixed(8).replace(/0+$/, '').replace(/\.$/, ''); }
function pct(n: number): string { return (n * 100).toFixed(4).replace(/0+$/, '').replace(/\.$/, '') + '%'; }

export const ProbabilityCalc: React.FC<Props> = ({ onClose }) => {
 const [mode, setMode] = useState<Mode>('stats');
 const [n, setN] = useState('10'); const [k, setK] = useState('3'); const [p, setP] = useState('0.5');
 const [dataStr, setDataStr] = useState('4, 7, 8, 5, 9, 6, 8, 3, 7, 5');
 const [mu, setMu] = useState('0'); const [sigma, setSigma] = useState('1'); const [xVal, setXVal] = useState('1.96');
 const [res, setRes] = useState<React.ReactNode | null>(null);

 const In = ({ label, value, onChange, type = 'number' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <div><label className="block text-[10px] text-indigo-400 font-bold mb-1">{label}</label>
  {type === 'textarea' ? <textarea aria-label={label} value={value} onChange={e => onChange(e.target.value)} rows={2} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-indigo-500 focus:outline-none resize-none" />
  : <input aria-label={label} type="number" value={value} onChange={e => onChange(e.target.value)} step="any" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-center focus:border-indigo-500 focus:outline-none" />}
  </div>
 );

 const doCombi = () => {
  const nv = Number(n), kv = Number(k);
  if (!Number.isSafeInteger(nv) || !Number.isSafeInteger(kv) || nv < 0 || kv < 0 || kv > nv || nv > 500) {
   setRes(<ReliabilityPanel level="warning" title="Paramètres invalides" detail="n et k doivent être des entiers avec 0 ≤ k ≤ n ≤ 500." />); return;
  }
  setRes(
   <div className="space-y-3 animate-scale-in">
    <div className="grid grid-cols-3 gap-2">
     <ResultBox label={`C(${nv},${kv})`} value={combinationBigInt(nv, kv).toString()} color="indigo" />
     <ResultBox label={`A(${nv},${kv})`} value={arrangementsBigInt(nv, kv).toString()} color="purple" />
     <ResultBox label={`${nv}!`} value={factorialBigInt(nv).toString()} color="amber" />
    </div>
    <ReliabilityPanel level="verified" title="Calcul entier exact" detail="Les factorielles, arrangements et combinaisons sont calculés avec des entiers exacts (BigInt), sans arrondi décimal." />
    <StepsList>
     <Step n={1} title="Combinaisons (sans ordre)" content={`C(${nv},${kv}) = ${nv}! / (${kv}! × ${nv - kv}!) = ${combinationBigInt(nv, kv).toString()}`} color="indigo" />
     <Step n={2} title="Arrangements (avec ordre)" content={`A(${nv},${kv}) = ${nv}! / ${nv - kv}! = ${arrangementsBigInt(nv, kv).toString()}`} color="purple" />
     <Step n={3} title="Factorielle" content={`${nv}! = ${factorialBigInt(nv).toString()}`} color="amber" />
    </StepsList>
    <Section icon="" title="Rappels" color="blue">
     <div className="space-y-1 text-xs text-slate-300 font-mono">
      <p>C(n,k) = n! / (k!(n−k)!)</p>
      <p>A(n,k) = n! / (n−k)!</p>
      <p>C(n,k) = C(n, n−k)</p>
     </div>
    </Section>
   </div>
  );
 };

 const doBinom = () => {
  const nv = Number(n), kv = Number(k), pv = Number(p);
  if (!Number.isSafeInteger(nv) || !Number.isSafeInteger(kv) || nv < 0 || kv < 0 || kv > nv || nv > 1000 || !Number.isFinite(pv) || pv < 0 || pv > 1) {
   setRes(<ReliabilityPanel level="warning" title="Paramètres invalides" detail="Pour X ~ B(n,p), n et k sont entiers avec 0 ≤ k ≤ n ≤ 1000 et 0 ≤ p ≤ 1. Cette limite évite les calculs flottants trop grands sur téléphone." />); return;
  }
  const q = 1 - pv;
  const prob = binomialProbability(nv, kv, pv);
  const cumul = binomialCdf(nv, kv, pv);
  const esp = nv * pv, variance = nv * pv * q, ec = Math.sqrt(variance);

  setRes(
   <div className="space-y-3 animate-scale-in">
    <ResultBox label={`P(X = ${kv})`} value={`${f(prob)} ≈ ${pct(prob)}`} color="emerald" />
    <ReliabilityPanel level="verified" title="Formule binomiale contrôlée" detail="La probabilité est calculée en domaine logarithmique pour éviter les débordements/annulations numériques, puis la somme cumulée est recalculée de façon stable." checks={[{ label: 'Probabilité valide', ok: Number.isFinite(prob) && prob >= 0 && prob <= 1, detail: `P=${prob}` }, { label: 'Probabilité cumulée valide', ok: cumul >= -1e-12 && cumul <= 1 + 1e-12, detail: `P(X≤k)=${cumul}` }]} />
    <StepsList>
     <Step n={1} title="Loi" content={`X ~ B(n=${nv}, p=${pv})`} color="indigo" />
     <Step n={2} title="Formule" content={`P(X=k) = C(n,k) × p^k × q^(n−k)`} color="blue" />
     <Step n={3} title="Application" content={`P(X=${kv}) = C(${nv},${kv}) × ${pv}^${kv} × ${f(q)}^${nv - kv}`} color="purple" />
     <Step n={4} title="Calcul" content={`Le moteur calcule log C(n,k) + k·log(p) + (n−k)·log(1−p), puis revient à la probabilité : ${f(prob)}`} color="purple" />
     <Step n="" title="Résultat" content={`P(X = ${kv}) ≈ ${pct(prob)}`} color="emerald" />
    </StepsList>
    <div className="grid grid-cols-2 gap-2">
     <PropBadge label="E(X) = np" value={f(esp)} color="indigo" />
     <PropBadge label="V(X) = npq" value={f(variance)} color="purple" />
     <PropBadge label="σ(X) = √V" value={f(ec)} color="cyan" />
     <PropBadge label={`P(X ≤ ${kv})`} value={`${f(cumul)} ≈ ${pct(cumul)}`} color="emerald" />
    </div>
    <PropBadge label={`P(X > ${kv})`} value={`${f(1 - cumul)} ≈ ${pct(1 - cumul)}`} color="amber" />
   </div>
  );
 };

 const doStats = () => {
  const tokens = dataStr.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
  const vals = tokens.map(Number);
  if (vals.length === 0 || vals.some(v => !Number.isFinite(v))) {
   setRes(<ReliabilityPanel level="warning" title="Données invalides" detail="Toutes les valeurs doivent être des nombres. L’application refuse d’ignorer silencieusement une donnée mal saisie." />); return;
  }
  const st = descriptiveStats(vals);
  const { n, sum, mean, variancePopulation: variance, stdPopulation: stdDev, median, min, max, q1Rank, q3Rank, q1, q3 } = st;

  setRes(
   <div className="space-y-3 animate-scale-in">
    <ReliabilityPanel level={st.checks.every(c => c.ok) ? "verified" : "warning"} title="Statistiques contrôlées" detail={`Calculs effectués sans arrondi intermédiaire. Convention lycée : Q₁ est de rang ceil(n/4)=${q1Rank}, Q₃ de rang ceil(3n/4)=${q3Rank}.`} checks={st.checks} />
    <ResultBox label="Moyenne x̄" value={f(mean)} color="indigo" />
    <div className="grid grid-cols-3 gap-2">
     <PropBadge label="Effectif n" value={String(n)} color="slate" />
     <PropBadge label="Somme Σ" value={f(sum)} color="indigo" />
     <PropBadge label="Médiane" value={f(median)} color="purple" />
     <PropBadge label="Min" value={f(min)} color="cyan" />
     <PropBadge label="Max" value={f(max)} color="cyan" />
     <PropBadge label="Étendue" value={f(max - min)} color="amber" />
     <PropBadge label="Q₁" value={f(q1)} color="violet" />
     <PropBadge label="Q₃" value={f(q3)} color="violet" />
     <PropBadge label="IQR" value={f(q3 - q1)} color="violet" />
    </div>
    <div className="grid grid-cols-2 gap-2">
     <PropBadge label="Variance σ²" value={f(variance)} color="rose" />
     <PropBadge label="Écart-type σ" value={f(stdDev)} color="rose" />
    </div>
    <Section icon="" title="Calculs détaillés" color="blue">
     <div className="space-y-1 text-xs text-slate-300 font-mono">
      <p>x̄ = Σxᵢ / n = {f(sum)} / {n} = {f(mean)}</p>
      <p>σ² = Σ(xᵢ − x̄)² / n = {f(variance)}</p>
      <p>σ = √σ² = √{f(variance)} = {f(stdDev)}</p>
     </div>
    </Section>
   </div>
  );
 };

 const doNormal = () => {
  const m = Number(mu), s = Number(sigma), x = Number(xVal);
  if (![m, s, x].every(Number.isFinite) || s <= 0) { setRes(<ReliabilityPanel level="warning" title="Paramètres invalides" detail="μ et x doivent être réels et σ doit être strictement positif." />); return; }
  const z = (x - m) / s;
  const prob = normalCdf(x, m, s);
  setRes(
   <div className="space-y-3 animate-scale-in">
    <ReliabilityPanel level="approximate" title="Valeur normale approchée" detail="La fonction de répartition Φ est évaluée via une approximation de erf contrôlée. Le résultat reste numérique : conserve l’arrondi demandé par le sujet." checks={[{ label: 'Paramètres valides', ok: s > 0, detail: `σ=${s} > 0` }, { label: 'Probabilité dans [0;1]', ok: prob >= 0 && prob <= 1, detail: `Φ(z)=${prob}` }]} />
    <ResultBox label={`P(X ≤ ${x})`} value={`${f(prob)} ≈ ${pct(prob)}`} color="emerald" />
    <StepsList>
     <Step n={1} title="Loi" content={`X ~ N(μ=${m}, σ²=${f(s * s)})`} color="indigo" />
     <Step n={2} title="Centrer-réduire" content={`Z = (X − μ) / σ = (${x} − ${m}) / ${s} = ${f(z)}`} color="purple" />
     <Step n={3} title="Évaluation de Φ" content={`P(Z ≤ ${f(z)}) = ${f(prob)}`} color="cyan" />
     <Step n="" title="Résultat" content={`P(X ≤ ${x}) ≈ ${pct(prob)}`} color="emerald" />
    </StepsList>
    <div className="grid grid-cols-2 gap-2">
     <PropBadge label={`P(X > ${x})`} value={pct(1 - prob)} color="amber" />
     <PropBadge label="Z (centré-réduit)" value={f(z)} color="purple" />
    </div>
    <Section icon="" title="Rappels — Règle empirique" color="blue">
     <div className="space-y-1 text-xs text-slate-300">
      <p>• P(μ−σ ≤ X ≤ μ+σ) ≈ <span className="text-emerald-300 font-bold">68.3%</span></p>
      <p>• P(μ−2σ ≤ X ≤ μ+2σ) ≈ <span className="text-emerald-300 font-bold">95.4%</span></p>
      <p>• P(μ−3σ ≤ X ≤ μ+3σ) ≈ <span className="text-emerald-300 font-bold">99.7%</span></p>
     </div>
    </Section>
   </div>
  );
 };

 return (
  <div className="fixed inset-0 bg-slate-950/98 z-50 overflow-y-auto">
   <div className="tool-page-container px-4 py-6 min-h-screen">
    <div className="flex items-center justify-between mb-4">
     <h2 className="text-xl font-extrabold text-white"> Probabilités & Stats</h2>
     <button onClick={onClose} aria-label="Fermer l’outil" className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">×</button>
    </div>
    <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-hide">
     {([{ id: 'stats' as Mode, l: ' Stats' }, { id: 'combi' as Mode, l: ' C/A/n!' }, { id: 'binomial' as Mode, l: ' Binomiale' }, { id: 'normal' as Mode, l: ' Normale' }]).map(m => (
      <button key={m.id} onClick={() => { setMode(m.id); setRes(null); }} className={`shrink-0 py-2 px-3 rounded-xl text-xs font-bold ${mode === m.id ? 'bg-indigo-600 text-white' : 'bg-slate-800/50 text-slate-400 border border-slate-700/30'}`}>{m.l}</button>
     ))}
    </div>

    {mode === 'stats' && <div className="space-y-3"><In label="Données (séparées par virgules)" value={dataStr} onChange={setDataStr} type="textarea" /><button onClick={doStats} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]"> Calculer</button></div>}
    {mode === 'combi' && <div className="space-y-3"><div className="grid grid-cols-2 gap-2"><In label="n =" value={n} onChange={setN} /><In label="k =" value={k} onChange={setK} /></div><button onClick={doCombi} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]"> Calculer</button></div>}
    {mode === 'binomial' && <div className="space-y-3"><div className="grid grid-cols-3 gap-2"><In label="n =" value={n} onChange={setN} /><In label="k =" value={k} onChange={setK} /><In label="p =" value={p} onChange={setP} /></div><button onClick={doBinom} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]"> P(X=k)</button></div>}
    {mode === 'normal' && <div className="space-y-3"><div className="grid grid-cols-3 gap-2"><In label="μ =" value={mu} onChange={setMu} /><In label="σ =" value={sigma} onChange={setSigma} /><In label="x =" value={xVal} onChange={setXVal} /></div><button onClick={doNormal} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]"> P(X≤x)</button></div>}

    {res && <div className="mt-4">{res}</div>}
   </div>
  </div>
 );
};

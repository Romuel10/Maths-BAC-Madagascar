/**
 * Probabilités & Statistiques avec résultats structurés
 * © 2025 RATOVOSON Navelanizara Romuel
 */
import React, { useState } from 'react';
import { ResultBox, Step, Section, StepsList, PropBadge } from './ResultCard';
import { ReliabilityPanel } from './ReliabilityPanel';
import { factorialBigInt, combinationBigInt, arrangementsBigInt, binomialProbability, binomialCdf, binomialRangeProbability, normalCdf, normalRangeProbability, inverseNormalCdf, descriptiveStats, linearRegression, mayerRegression } from '../lib/probabilityEngine';
import type { BacSeries } from '../data/bacSubjects';

interface Props { onClose: () => void; series?: BacSeries | null }
type Mode = 'combi' | 'binomial' | 'stats' | 'normal' | 'regression';

function f(n: number): string { const r = Math.round(n * 100000000) / 100000000; return Number.isInteger(r) ? String(r) : r.toFixed(8).replace(/0+$/, '').replace(/\.$/, ''); }
function pct(n: number): string { return (n * 100).toFixed(4).replace(/0+$/, '').replace(/\.$/, '') + '%'; }

export const ProbabilityCalc: React.FC<Props> = ({ onClose, series = null }) => {
 const primaryMode:Mode=series==='C'||series==='S'?'combi':'stats';
 const [mode, setMode] = useState<Mode>(primaryMode);
 const [showExtras,setShowExtras]=useState(false);
 const [n, setN] = useState('10'); const [k, setK] = useState('3'); const [k2, setK2] = useState('7'); const [p, setP] = useState('0.5');
 const [dataStr, setDataStr] = useState('4, 7, 8, 5, 9, 6, 8, 3, 7, 5');
 const [mu, setMu] = useState('0'); const [sigma, setSigma] = useState('1'); const [xVal, setXVal] = useState('-1'); const [xVal2,setXVal2]=useState('1'); const [qVal,setQVal]=useState('0.975');
 const [regX,setRegX]=useState('1,2,3,4,5'); const [regY,setRegY]=useState('2,4,5,8,10');
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
  const nv = Number(n), kv = Number(k), kv2 = Number(k2), pv = Number(p);
  if (!Number.isSafeInteger(nv) || !Number.isSafeInteger(kv) || !Number.isSafeInteger(kv2) || nv < 0 || kv < 0 || kv > nv || kv2 < kv || kv2 > nv || nv > 1000 || !Number.isFinite(pv) || pv < 0 || pv > 1) {
   setRes(<ReliabilityPanel level="warning" title="Paramètres invalides" detail="Pour X ~ B(n,p), utilise 0 ≤ k ≤ b ≤ n ≤ 1000 et 0 ≤ p ≤ 1." />); return;
  }
  const q = 1 - pv;
  const prob = binomialProbability(nv, kv, pv);
  const cumul = binomialCdf(nv, kv, pv);
  const rangeProb = binomialRangeProbability(nv, kv, kv2, pv);
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
    <div className="grid grid-cols-2 gap-2"><PropBadge label={`P(X > ${kv})`} value={`${f(1 - cumul)} ≈ ${pct(1 - cumul)}`} color="amber" /><PropBadge label={`P(${kv} ≤ X ≤ ${kv2})`} value={`${f(rangeProb)} ≈ ${pct(rangeProb)}`} color="cyan" /></div>
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
     {st.varianceSample!==null&&<PropBadge label="Variance échantillon s²" value={f(st.varianceSample)} color="amber" />}
     {st.stdSample!==null&&<PropBadge label="Écart-type échantillon s" value={f(st.stdSample)} color="amber" />}
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
  const m=Number(mu),s=Number(sigma),a=Number(xVal),b=Number(xVal2),q=Number(qVal);
  if(![m,s,a,b,q].every(Number.isFinite)||s<=0||a>b||q<=0||q>=1){setRes(<ReliabilityPanel level="warning" title="Paramètres invalides" detail="Il faut σ>0, a≤b et 0<q<1."/>);return;}
  const pa=normalCdf(a,m,s), pb=normalCdf(b,m,s), interval=normalRangeProbability(a,b,m,s), quantile=inverseNormalCdf(q,m,s);
  setRes(<div className="space-y-3 animate-scale-in">
   <ReliabilityPanel level="approximate" title="Loi normale avancée" detail="CDF, intervalle et quantile sont calculés numériquement puis contrôlés dans [0;1]." checks={[{label:'CDF ordonnées',ok:pa<=pb+1e-12,detail:'F(a)≤F(b)'},{label:'Intervalle valide',ok:interval>=0&&interval<=1,detail:'P='+interval},{label:'Quantile fini',ok:Number.isFinite(quantile),detail:'xq='+quantile}]}/>
   <div className="grid grid-cols-2 gap-2"><ResultBox label={'P(X≤'+b+')'} value={pct(pb)} color="emerald"/><ResultBox label={'P('+a+'≤X≤'+b+')'} value={pct(interval)} color="cyan"/></div>
   <div className="grid grid-cols-2 gap-2"><PropBadge label={'P(X>'+b+')'} value={pct(1-pb)} color="amber"/><PropBadge label={'Quantile q='+q} value={f(quantile)} color="purple"/></div>
   <StepsList><Step n={1} title="Centrer-réduire" content={'z=(x−μ)/σ avec μ='+m+' et σ='+s} color="indigo"/><Step n={2} title="Intervalle" content={'P(a≤X≤b)=F(b)−F(a)='+f(interval)} color="blue"/><Step n={3} title="Quantile" content={'F(xq)='+q+' ⇒ xq≈'+f(quantile)} color="purple"/></StepsList>
  </div>);
 };

 const doRegression = () => {
  const parse=(text:string)=>text.split(/[,;\\s]+/).map(v=>v.trim()).filter(Boolean).map(Number);
  const xs=parse(regX),ys=parse(regY);
  try{
   if(series==='A'||series==='L'){
    const r=mayerRegression(xs,ys);
    setRes(<div className="space-y-3 animate-scale-in">
     <ReliabilityPanel level={r.checks.every(check=>check.ok)?'verified':'warning'} title="Ajustement par la méthode de Mayer" detail={`Méthode du programme Terminale ${series} 2024-2025 : deux groupes ordonnés selon x, deux points moyens G₁ et G₂, puis droite (G₁G₂).`} checks={r.checks}/>
     <ResultBox label="Droite de Mayer" value={'y = '+f(r.slope)+'x '+(r.intercept>=0?'+ ':'− ')+f(Math.abs(r.intercept))} color="indigo"/>
     <div className="grid grid-cols-2 gap-2"><PropBadge label="G₁" value={'('+f(r.firstPoint.x)+' ; '+f(r.firstPoint.y)+')'} color="purple"/><PropBadge label="G₂" value={'('+f(r.secondPoint.x)+' ; '+f(r.secondPoint.y)+')'} color="cyan"/></div>
     <Section icon="∴" title="Méthode" color="blue"><p className="text-xs text-slate-300">Les couples sont classés par abscisse, partagés en deux groupes, puis on calcule le point moyen de chaque groupe. La droite de Mayer passe par ces deux points.</p></Section>
    </div>);
   }else{
    const r=linearRegression(xs,ys);
    setRes(<div className="space-y-3 animate-scale-in">
     <ReliabilityPanel level={r.checks.every(check=>check.ok)?'verified':'warning'} title="Régression linéaire contrôlée" detail={`Terminale ${series==='OSE'?'OSE':'D'} : ajustement affine par la méthode des moindres carrés et coefficient de corrélation.`} checks={r.checks}/>
     <ResultBox label="Droite de régression" value={'y = '+f(r.slope)+'x '+(r.intercept>=0?'+ ':'− ')+f(Math.abs(r.intercept))} color="indigo"/>
     <div className="grid grid-cols-2 gap-2"><PropBadge label="Corrélation r" value={f(r.correlation)} color="purple"/><PropBadge label="Coefficient R²" value={f(r.rSquared)} color="cyan"/><PropBadge label="x̄" value={f(r.meanX)} color="slate"/><PropBadge label="ȳ" value={f(r.meanY)} color="slate"/></div>
     <Section icon="∴" title="Interprétation" color="blue"><p className="text-xs text-slate-300">Plus |r| est proche de 1, plus la liaison linéaire est forte. Le signe indique le sens de la liaison.</p></Section>
    </div>);
   }
  }catch(error:unknown){setRes(<ReliabilityPanel level="warning" title="Ajustement impossible" detail={error instanceof Error?error.message:'Données invalides.'}/>);}
 };
 return (
  <div className="fixed inset-0 bg-slate-950/98 z-50 overflow-y-auto">
   <div className="tool-page-container px-4 py-6 min-h-screen">
    <div className="flex items-center justify-between mb-4">
     <h2 className="text-xl font-extrabold text-white"> Probabilités & Stats</h2>
     <button onClick={onClose} aria-label="Fermer l’outil" className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">×</button>
    </div>
    <div className="notice notice-info mb-3"><strong>{series?`Série ${series}`:'Mode général'} :</strong> les onglets principaux suivent le programme vérifié. Les fonctions non confirmées dans le programme restent disponibles uniquement comme compléments avancés.</div>
    <div className="flex gap-1 mb-3 overflow-x-auto scrollbar-hide">
     {((
      series==='A'?[{id:'stats' as Mode,l:'Stats'},{id:'regression' as Mode,l:'Mayer'}]:
      series==='L'?[{id:'stats' as Mode,l:'Stats'},{id:'regression' as Mode,l:'Mayer'},{id:'combi' as Mode,l:'Dénombrement'}]:
      series==='D'?[{id:'stats' as Mode,l:'Stats'},{id:'combi' as Mode,l:'C/A/n!'},{id:'binomial' as Mode,l:'Binomiale'},{id:'regression' as Mode,l:'Régression'}]:
      series==='OSE'?[{id:'stats' as Mode,l:'Stats'},{id:'combi' as Mode,l:'Dénombrement'},{id:'binomial' as Mode,l:'Binomiale'},{id:'regression' as Mode,l:'Régression'}]:
      series==='C'?[{id:'combi' as Mode,l:'C/A/n!'},{id:'binomial' as Mode,l:'Binomiale'}]:
      series==='S'?[{id:'combi' as Mode,l:'Dénombrement'},{id:'binomial' as Mode,l:'Binomiale'},{id:'normal' as Mode,l:'Normale'}]:
      [{id:'stats' as Mode,l:'Stats'},{id:'combi' as Mode,l:'C/A/n!'},{id:'binomial' as Mode,l:'Binomiale'},{id:'regression' as Mode,l:'Régression'}]
     ).map(m => (
      <button key={m.id} onClick={() => { setMode(m.id); setRes(null); }} className={`shrink-0 py-2 px-3 rounded-xl text-xs font-bold ${mode === m.id ? 'bg-indigo-600 text-white' : 'bg-slate-800/50 text-slate-400 border border-slate-700/30'}`}>{m.l}</button>
     )))}
     {showExtras&&series!=='S'&&<button onClick={()=>{setMode('normal');setRes(null)}} className={`shrink-0 py-2 px-3 rounded-xl text-xs font-bold ${mode==='normal'?'bg-indigo-600 text-white':'bg-slate-800/50 text-slate-400 border border-slate-700/30'}`}>Normale · complément</button>}
    </div>
    <button onClick={()=>{setShowExtras(v=>!v);if(showExtras&&mode==='normal'){setMode(primaryMode);setRes(null)}}} className="btn btn-small btn-ghost mb-4">{showExtras?'Masquer les compléments avancés':'Afficher les compléments avancés'}</button>

    {mode === 'stats' && <div className="space-y-3"><In label="Données (séparées par virgules)" value={dataStr} onChange={setDataStr} type="textarea" /><button onClick={doStats} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]"> Calculer</button></div>}
    {mode === 'combi' && <div className="space-y-3"><div className="grid grid-cols-2 gap-2"><In label="n =" value={n} onChange={setN} /><In label="k =" value={k} onChange={setK} /></div><button onClick={doCombi} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]"> Calculer</button></div>}
    {mode === 'binomial' && <div className="space-y-3"><div className="grid grid-cols-2 gap-2"><In label="n =" value={n} onChange={setN} /><In label="p =" value={p} onChange={setP} /><In label="k (borne basse)" value={k} onChange={setK} /><In label="b (borne haute)" value={k2} onChange={setK2} /></div><button onClick={doBinom} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]">Calculer P(X=k), cumul et intervalle</button></div>}
    {mode === 'normal' && <div className="space-y-3"><div className="grid grid-cols-2 gap-2"><In label="μ =" value={mu} onChange={setMu} /><In label="σ =" value={sigma} onChange={setSigma} /><In label="a =" value={xVal} onChange={setXVal} /><In label="b =" value={xVal2} onChange={setXVal2} /></div><In label="Quantile q (ex. 0,975 → saisir 0.975)" value={qVal} onChange={setQVal}/><button onClick={doNormal} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]">CDF, intervalle et quantile</button></div>}
    {mode === 'regression' && <div className="space-y-3"><div className="notice notice-info">{series==='A'||series==='L'?<><strong>Terminale {series} :</strong> méthode de Mayer.</>:<><strong>Terminale {series==='OSE'?'OSE':'D'} :</strong> moindres carrés et corrélation linéaire.</>}</div><In label="Valeurs x" value={regX} onChange={setRegX} type="textarea"/><In label="Valeurs y" value={regY} onChange={setRegY} type="textarea"/><button onClick={doRegression} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]">{series==='A'||series==='L'?'Calculer la droite de Mayer':'Calculer la régression'}</button></div>}

    {res && <div className="mt-4">{res}</div>}
   </div>
  </div>
 );
};

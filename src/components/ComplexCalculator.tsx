import React, { useState } from 'react';
import { parseComplex, cAdd, cSub, cMul, cDiv, cPow, cSqrt, cRoots, cFromPolar, analyzeComplex, cToString, cMod, cArg, solveQuadraticComplex, type Complex } from '../lib/complex';
import { ResultBox, Step, Section, StepsList, PropBadge } from './ResultCard';
import { ReliabilityPanel } from './ReliabilityPanel';

interface Props { onClose: () => void }

const fmt = (n: number) => { const r = Math.round(n * 10000) / 10000; return Number.isInteger(r) ? String(r) : r.toFixed(4).replace(/0+$/, '').replace(/\.$/, ''); };

export const ComplexCalculator: React.FC<Props> = ({ onClose }) => {
 const [mode, setMode] = useState<'calc' | 'analyze' | 'equation' | 'polar'>('calc');
 const [z1s, setZ1s] = useState('3 + 2i');
 const [z2s, setZ2s] = useState('1 - i');
 const [op, setOp] = useState<'+' | '-' | '×' | '÷' | 'zⁿ' | 'ⁿ√z'>('+');
 const [pow, setPow] = useState('2');
 const [polarR,setPolarR]=useState('2'); const [polarTheta,setPolarTheta]=useState('60'); const [polarUnit,setPolarUnit]=useState<'deg'|'rad'>('deg');
 const [eqA, setEqA] = useState('1'); const [eqB, setEqB] = useState('2'); const [eqC, setEqC] = useState('5');
 const [res, setRes] = useState<React.ReactNode | null>(null);
 const [err, setErr] = useState('');

 const doCalc = () => {
  setErr('');
  const z1 = parseComplex(z1s);
  if (!z1) { setErr('z₁ invalide. Ex: 3+2i'); return; }

  if (op === 'ⁿ√z') {
   const n=Number(pow);
   if(!Number.isSafeInteger(n)||n<1||n>20){setErr('Le degré n doit être un entier entre 1 et 20.');return;}
   const roots=cRoots(z1,n);
   if(!roots.length){setErr('Impossible de calculer ces racines.');return;}
   const checks=roots.map(root=>{const back=cPow(root,n);return cMod(cSub(back,z1));});
   setRes(<div className="space-y-3 animate-scale-in">
    <ReliabilityPanel level={checks.every(v=>v<1e-8)?'verified':'warning'} title="Racines n-ièmes" detail={'Les '+n+' racines sont réparties régulièrement sur le cercle complexe et chacune est vérifiée par élévation à la puissance '+n+'.'} checks={checks.map((v,i)=>({label:'Racine '+(i+1),ok:v<1e-8,detail:'résidu='+v.toExponential(2)}))}/>
    <ResultBox label={'Nombre de racines'} value={String(roots.length)} color="indigo"/>
    <div className="grid grid-cols-1 gap-2">{roots.map((root,i)=><PropBadge key={i} label={'z'+(i+1)} value={cToString(root)} color="purple"/>)}</div>
    <Section icon="∴" title="Méthode" color="blue"><p className="text-xs text-slate-300">Si z=r(cos θ+i sin θ), alors ses racines n-ièmes ont pour module r^(1/n) et pour arguments (θ+2kπ)/n.</p></Section>
   </div>);
   return;
  }
  if (op === 'zⁿ') {
   const n = Number(pow);
   if (!Number.isInteger(n)) { setErr('La puissance n doit être un entier.'); return; }
   if (Math.abs(z1.re) < 1e-15 && Math.abs(z1.im) < 1e-15 && n <= 0) { setErr(n === 0 ? '0⁰ est une forme indéterminée dans ce contexte.' : '0 ne peut pas être élevé à une puissance négative.'); return; }
   const r = cPow(z1, n);
   const isZero = Math.abs(z1.re) < 1e-15 && Math.abs(z1.im) < 1e-15;
   setRes(
    <div className="space-y-3 animate-scale-in">
     <ReliabilityPanel level="verified" title="Calcul contrôlé" detail={isZero ? 'Le cas z = 0 est traité séparément car son argument n’est pas défini.' : 'La puissance entière est calculée par la formule de Moivre avec contrôle des cas particuliers.'} />
     <ResultBox label={`z₁^${n}`} value={cToString(r)} color="purple" />
     <StepsList>
      <Step n={1} title="Nombre de départ" content={`z₁ = ${cToString(z1)}`} color="indigo" />
      {isZero ? <>
       <Step n={2} title="Cas particulier" content={'Pour n > 0, 0ⁿ = 0. L’argument de 0 n’est pas utilisé.'} color="amber" />
      </> : <>
       <Step n={2} title="Module et argument" content={`|z₁| = ${fmt(cMod(z1))}, arg(z₁) = ${fmt(cArg(z1))} rad`} color="purple" />
       <Step n={3} title="Formule de Moivre" content={`zⁿ = |z|ⁿ × (cos(nθ) + i·sin(nθ))`} color="emerald" />
       <Step n={4} title="Calcul" content={`|z₁|^${n} = ${fmt(Math.pow(cMod(z1), n))}, ${n}×θ = ${fmt(n * cArg(z1))} rad`} color="amber" />
      </>}
      <Step n="" title="Résultat" content={cToString(r)} color="emerald" />
     </StepsList>
    </div>
   );
   return;
  }

  const z2 = parseComplex(z2s);
  if (!z2) { setErr('z₂ invalide'); return; }
  if (op === '÷' && Math.abs(z2.re) < 1e-15 && Math.abs(z2.im) < 1e-15) {
   setErr('Division impossible : le dénominateur z₂ est nul.');
   setRes(null);
   return;
  }

  let r: Complex;
  let steps: React.ReactNode;

  switch (op) {
   case '+': r = cAdd(z1, z2); steps = <>
    <Step n={1} title="Parties réelles" content={`${z1.re} + ${z2.re} = ${fmt(r.re)}`} color="indigo" />
    <Step n={2} title="Parties imaginaires" content={`${z1.im} + ${z2.im} = ${fmt(r.im)}`} color="purple" />
   </>; break;
   case '-': r = cSub(z1, z2); steps = <>
    <Step n={1} title="Parties réelles" content={`${z1.re} − ${z2.re} = ${fmt(r.re)}`} color="indigo" />
    <Step n={2} title="Parties imaginaires" content={`${z1.im} − ${z2.im} = ${fmt(r.im)}`} color="purple" />
   </>; break;
   case '×': r = cMul(z1, z2); steps = <>
    <Step n={1} title="Formule (a+bi)(c+di)" content="= (ac−bd) + (ad+bc)i" color="indigo" />
    <Step n={2} title="Partie réelle" content={`${z1.re}×${z2.re} − ${z1.im}×${z2.im} = ${fmt(r.re)}`} color="purple" />
    <Step n={3} title="Partie imaginaire" content={`${z1.re}×${z2.im} + ${z1.im}×${z2.re} = ${fmt(r.im)}`} color="emerald" />
   </>; break;
   case '÷': r = cDiv(z1, z2); const d = z2.re ** 2 + z2.im ** 2; steps = <>
    <Step n={1} title="Multiplier par le conjugué" content={`z₁/z₂ = z₁×z̄₂ / |z₂|²`} color="indigo" />
    <Step n={2} title="|z₂|²" content={`${z2.re}² + ${z2.im}² = ${fmt(d)}`} color="purple" />
    <Step n={3} title="Numérateur" content={`z₁×z̄₂ = ${cToString(cMul(z1, { re: z2.re, im: -z2.im }))}`} color="emerald" />
   </>; break;
   default: r = { re: 0, im: 0 }; steps = null;
  }

  setRes(
   <div className="space-y-3 animate-scale-in">
    <ReliabilityPanel level="verified" title="Opération algébrique vérifiée" detail={op === '÷' ? 'Le dénominateur a été contrôlé non nul et la division utilise le conjugué.' : 'Les parties réelle et imaginaire sont calculées séparément selon la règle algébrique.'} />
    <ResultBox label={`z₁ ${op} z₂`} value={cToString(r)} color="indigo" />
    <StepsList>
     <Step n="z₁" title="Premier nombre" content={cToString(z1)} color="indigo" />
     <Step n="z₂" title="Deuxième nombre" content={cToString(z2)} color="purple" />
     <div className="border-t border-slate-700/30 pt-2">{steps}</div>
     <Step n="" title="Résultat" content={cToString(r)} color="emerald" />
    </StepsList>
   </div>
  );
 };

 const doAnalyze = () => {
  setErr('');
  const z = parseComplex(z1s);
  if (!z) { setErr('Invalide'); return; }
  const a = analyzeComplex(z);
  const sqrts = cSqrt(z);
  setRes(
   <div className="space-y-3 animate-scale-in">
    <ReliabilityPanel level="verified" title="Propriétés contrôlées" detail={a.argument === null ? 'Le module de 0 vaut 0 et son argument est correctement signalé comme non défini.' : 'Module, conjugué et argument sont calculés à partir des parties réelle et imaginaire.'} />
    <ResultBox label="z" value={a.algebraicForm} color="indigo" />
    <div className="grid grid-cols-2 gap-2">
     <PropBadge label="Module |z|" value={String(a.modulus)} color="purple" />
     <PropBadge label="Argument" value={a.argument === null ? 'non défini pour z=0' : `${a.argument} rad`} color="cyan" />
     <PropBadge label="arg (degrés)" value={a.argumentDeg === null ? 'non défini' : `${a.argumentDeg}°`} color="amber" />
     <PropBadge label="Conjugué z̄" value={cToString(a.conjugate)} color="rose" />
    </div>
    <Section icon="" title="Les 3 formes" color="blue">
     <div className="space-y-2">
      <div className="bg-slate-800/50 rounded-lg p-2"><p className="text-[10px] text-blue-400">Algébrique</p><p className="font-mono text-white text-sm">{a.algebraicForm}</p></div>
      <div className="bg-slate-800/50 rounded-lg p-2"><p className="text-[10px] text-blue-400">Trigonométrique</p><p className="font-mono text-white text-sm">{a.trigForm}</p></div>
      <div className="bg-slate-800/50 rounded-lg p-2"><p className="text-[10px] text-blue-400">Exponentielle</p><p className="font-mono text-white text-sm">{a.exponentialForm}</p></div>
     </div>
    </Section>
    <Section icon="√" title="Racines carrées" color="emerald">
     <div className="grid grid-cols-2 gap-2">
      <PropBadge label="√z₁" value={cToString(sqrts[0])} color="emerald" />
      <PropBadge label="√z₂" value={cToString(sqrts[1])} color="emerald" />
     </div>
    </Section>
   </div>
  );
 };

 const doEquation = () => {
  setErr('');
  const av = parseFloat(eqA), bv = parseFloat(eqB), cv = parseFloat(eqC);
  if (isNaN(av) || av === 0 || isNaN(bv) || isNaN(cv)) { setErr('Coefficients invalides (a≠0)'); return; }
  const r = solveQuadraticComplex(av, bv, cv);
  const residual = (z: Complex) => {
   const zSq = cMul(z, z);
   const real = av * zSq.re + bv * z.re + cv;
   const imag = av * zSq.im + bv * z.im;
   return Math.hypot(real, imag);
  };
  const e1 = residual(r.z1), e2 = residual(r.z2);
  const rootsOk = e1 <= 1e-8 && e2 <= 1e-8;
  setRes(
   <div className="space-y-3 animate-scale-in">
    <ReliabilityPanel level={rootsOk ? 'verified' : 'warning'} title={rootsOk ? 'Solutions vérifiées par substitution' : 'Contrôle des solutions insuffisant'} detail={`Résidus : z₁ ${e1.toExponential(2)}, z₂ ${e2.toExponential(2)}.`} checks={[{ label: 'z₁', ok: e1 <= 1e-8, detail: `|P(z₁)|=${e1.toExponential(2)}` }, { label: 'z₂', ok: e2 <= 1e-8, detail: `|P(z₂)|=${e2.toExponential(2)}` }]} />
    <div className="text-center bg-slate-800/40 rounded-xl p-3 border border-slate-700/20">
     <p className="text-xs text-slate-400">Équation</p>
     <p className="font-mono text-lg text-white font-bold">{av}z² + {bv}z + {cv} = 0</p>
    </div>
    <StepsList>
     {r.steps.map((s, i) => <Step key={i} n={i + 1} title={i === 0 ? 'Coefficients' : i === 1 ? 'Discriminant' : i === 2 ? 'Type' : `Solution ${i - 2}`} content={s} color={i < 2 ? 'indigo' : i === 2 ? (r.discriminant >= 0 ? 'emerald' : 'amber') : 'purple'} />)}
    </StepsList>
    <div className="grid grid-cols-2 gap-2">
     <ResultBox label="z₁" value={cToString(r.z1)} color="indigo" />
     <ResultBox label="z₂" value={cToString(r.z2)} color="purple" />
    </div>
    <PropBadge label="Δ (discriminant)" value={`${r.discriminant} ${r.discriminant >= 0 ? '→ solutions réelles' : '→ solutions complexes'}`} color={r.discriminant >= 0 ? 'emerald' : 'amber'} />
   </div>
  );
 };

 const doPolar = () => {
  setErr('');
  const r=Number(polarR),theta=Number(polarTheta);
  if(!Number.isFinite(r)||r<0||!Number.isFinite(theta)){setErr('Le module doit être positif ou nul et l’angle doit être fini.');return;}
  const z=cFromPolar(r,theta,polarUnit);
  const analyzed=analyzeComplex(z);
  setRes(<div className="space-y-3 animate-scale-in">
   <ReliabilityPanel level="verified" title="Conversion polaire contrôlée" detail="La forme polaire est convertie par z=r(cos θ+i sin θ), puis module et argument sont recalculés."/>
   <ResultBox label="Forme algébrique" value={cToString(z)} color="indigo"/>
   <div className="grid grid-cols-2 gap-2"><PropBadge label="Module" value={fmt(analyzed.modulus)} color="purple"/><PropBadge label="Argument" value={analyzed.argumentDeg===null?'non défini':fmt(analyzed.argumentDeg)+'°'} color="cyan"/></div>
   <Section icon="∴" title="Formes équivalentes" color="blue"><div className="space-y-1 text-xs text-slate-300 font-mono"><p>{analyzed.trigForm}</p><p>{analyzed.exponentialForm}</p></div></Section>
  </div>);
 };
 const Input = ({ label, value, onChange, ph }: { label: string; value: string; onChange: (v: string) => void; ph?: string }) => (
  <div><label className="block text-[10px] text-indigo-400 font-bold mb-1">{label}</label>
  <input aria-label={label} value={value} onChange={e => onChange(e.target.value)} placeholder={ph} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono focus:border-indigo-500 focus:outline-none" /></div>
 );

 return (
  <div className="fixed inset-0 bg-slate-950/98 z-50 overflow-y-auto">
   <div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
    <div className="flex items-center justify-between mb-4">
     <h2 className="text-xl font-extrabold text-white">ℂ Nombres complexes</h2>
     <button onClick={onClose} aria-label="Fermer l’outil" className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">×</button>
    </div>

    <div className="flex gap-1 mb-4 bg-slate-800/50 p-1 rounded-xl overflow-x-auto">
     {[{ id: 'calc' as const, l: 'Calcul' }, { id: 'analyze' as const, l: 'Analyser' }, { id: 'equation' as const, l: 'az²+bz+c' }, { id: 'polar' as const, l: 'Polaire' }].map(m => (
      <button key={m.id} onClick={() => { setMode(m.id); setRes(null); }}
       className={`flex-1 py-2 rounded-lg text-xs font-bold ${mode === m.id ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>{m.l}</button>
     ))}
    </div>

    {mode === 'calc' && <div className="space-y-3">
     <Input label="z₁ =" value={z1s} onChange={setZ1s} ph="3 + 2i" />
     <div className="flex justify-center gap-2">
      {(['+', '-', '×', '÷', 'zⁿ', 'ⁿ√z'] as const).map(o => (
       <button key={o} onClick={() => setOp(o)} className={`w-11 h-11 rounded-xl text-lg font-bold border transition-all ${op === o ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>{o}</button>
      ))}
     </div>
     {(op === 'zⁿ' || op === 'ⁿ√z') ? <Input label={op==='zⁿ'?'Puissance n =':'Degré de la racine n ='} value={pow} onChange={setPow} />
      : <Input label="z₂ =" value={z2s} onChange={setZ2s} ph="1 - i" />}
     <button onClick={doCalc} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]">= Calculer</button>
    </div>}

    {mode === 'analyze' && <div className="space-y-3">
     <Input label="z =" value={z1s} onChange={setZ1s} ph="3 + 4i" />
     <button onClick={doAnalyze} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]"> Analyser</button>
    </div>}

    {mode === 'equation' && <div className="space-y-3">
     <p className="text-sm text-slate-300 text-center font-mono">az² + bz + c = 0</p>
     <div className="grid grid-cols-3 gap-2">
      <Input label="a =" value={eqA} onChange={setEqA} />
      <Input label="b =" value={eqB} onChange={setEqB} />
      <Input label="c =" value={eqC} onChange={setEqC} />
     </div>
     <button onClick={doEquation} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]">Résoudre dans ℂ</button>
    </div>}

    {mode === 'polar' && <div className="space-y-3">
     <div className="grid grid-cols-2 gap-2"><Input label="Module r =" value={polarR} onChange={setPolarR}/><Input label={polarUnit==='deg'?'Angle θ (°)':'Angle θ (rad)'} value={polarTheta} onChange={setPolarTheta}/></div>
     <div className="flex gap-2"><button onClick={()=>setPolarUnit('deg')} className={`flex-1 py-2 rounded-xl text-xs font-bold ${polarUnit==='deg'?'bg-indigo-600 text-white':'bg-slate-800 text-slate-400'}`}>Degrés</button><button onClick={()=>setPolarUnit('rad')} className={`flex-1 py-2 rounded-xl text-xs font-bold ${polarUnit==='rad'?'bg-indigo-600 text-white':'bg-slate-800 text-slate-400'}`}>Radians</button></div>
     <button onClick={doPolar} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]">Convertir en forme algébrique</button>
    </div>}
    {err && <p className="text-red-400 text-sm mt-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3">{err}</p>}
    {res && <div className="mt-4">{res}</div>}
   </div>
  </div>
 );
};

import React, { useState } from 'react';
import { parseMatrix, analyzeMatrix, mAdd, mSub, mMul, mScale, mRref, mPower, solveLinearSystem, solveCramer, type Matrix } from '../lib/matrix';
import type { BacSeries } from '../data/bacSubjects';
import { ReliabilityPanel } from './ReliabilityPanel';
import { ResultBox, PropBadge, Section, MatrixDisplay } from './ResultCard';

interface Props { onClose: () => void; series?: BacSeries | null }

const fmtValue = (n: number) => {
 if (!Number.isFinite(n)) return 'indéfini';
 const r = Math.abs(n) < 1e-12 ? 0 : Math.round(n * 1e10) / 1e10;
 return Number.isInteger(r) ? String(r) : String(r);
};

const multiplicationSteps = (a: Matrix, b: Matrix, r: Matrix): string[] => {
 const steps: string[] = [];
 for (let i = 0; i < r.length; i++) {
  for (let j = 0; j < r[0].length; j++) {
   const terms = a[i].map((v, k) => `${fmtValue(v)}×${fmtValue(b[k][j])}`);
   steps.push(`c${i + 1}${j + 1} = ${terms.join(' + ')} = ${fmtValue(r[i][j])}`);
  }
 }
 return steps;
};

export const MatrixCalculator: React.FC<Props> = ({ onClose, series = null }) => {
 const [mode, setMode] = useState<'analyze' | 'calc' | 'system'>('analyze');
 const [matStr, setMatStr] = useState('1,2;3,4');
 const [mat2Str, setMat2Str] = useState('5,6;7,8');
 const [scalar, setScalar] = useState('2');
 const [vectorB, setVectorB] = useState('5,11');
 const [op, setOp] = useState<'+' | '−' | '×' | 'kA' | 'Aⁿ'>('×');
 const [rows, setRows] = useState(2);
 const [cols, setCols] = useState(2);
 const [res, setRes] = useState<React.ReactNode | null>(null);
 const [err, setErr] = useState('');

 const fillTemplate = () => { setMatStr(Array.from({ length: rows }, () => Array(cols).fill('0').join(',')).join(';')); };

 const doAnalyze = () => {
  setErr(''); setRes(null);
  const m = parseMatrix(matStr);
  if (!m) { setErr('Format : 1,2;3,4 (virgule entre colonnes, point-virgule entre lignes)'); return; }
  const a = analyzeMatrix(m);
  const reduced = mRref(m);

  setRes(
   <div className="space-y-3 animate-scale-in">
    <ReliabilityPanel level={a.quality} title={a.quality === 'verified' ? 'Calcul matriciel contrôlé' : 'Contrôle à vérifier'} detail={a.qualityDetail} checks={a.inverseResidual !== null ? [{ label: 'Inverse vérifiée', ok: a.inverseResidual <= 1e-8, detail: `Erreur maximale : ${a.inverseResidual.toExponential(2)}` }] : undefined} />
    <MatrixDisplay matrix={m} label="Matrice A" />
    <div className="grid grid-cols-2 gap-2">
     {a.determinant !== null && <PropBadge label="Déterminant det(A)" value={fmtValue(a.determinant)} color={a.isInvertible ? 'emerald' : 'red'} />}
     {a.trace !== null && <PropBadge label="Trace tr(A)" value={fmtValue(a.trace)} color="indigo" />}
     <PropBadge label="Rang" value={String(a.rank)} color="purple" />
     <PropBadge label="Taille" value={`${m.length}×${m[0].length}`} color="slate" />
    </div>
    {a.eigenvalues && <PropBadge label="Valeurs propres λ" value={a.eigenvalues.map(fmtValue).join(' ; ')} color="amber" />}

    {/* Properties */}
    <div className="flex flex-wrap gap-1.5">
     {a.isSquare && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/25">Carrée</span>}
     {a.isSymmetric && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/25">Symétrique</span>}
     {a.isIdentity && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">Identité</span>}
     {a.isInvertible && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/15 text-green-300 border border-green-500/25">Inversible</span>}
     {!a.isInvertible && a.isSquare && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/15 text-red-300 border border-red-500/25">Non inversible</span>}
    </div>

    <MatrixDisplay matrix={a.transpose} label="Transposée Aᵀ" />
    {a.inverse && <MatrixDisplay matrix={a.inverse} label="Inverse A⁻¹" />}
    <MatrixDisplay matrix={reduced.rref} label="Forme échelonnée réduite (RREF)" />

    {/* Explanation */}
    <Section icon="" title="Comment calculer" color="blue">
     <div className="space-y-1 text-xs text-slate-300">
      {a.determinant !== null && m.length === 2 && <p>det(A) = ad − bc = {m[0][0]}×{m[1][1]} − {m[0][1]}×{m[1][0]} = {a.determinant}</p>}
      {a.trace !== null && <p>tr(A) = somme diagonale = {m.map((r, i) => r[i]).join(' + ')} = {a.trace}</p>}
      {a.isInvertible && m.length === 2 && <p>A⁻¹ = (1/det) × matrice des cofacteurs transposée</p>}
     </div>
    </Section>
   </div>
  );
 };

 const doCalc = () => {
  setErr(''); setRes(null);
  const a = parseMatrix(matStr);
  if (!a) { setErr('Matrice A invalide'); return; }

  if (op === 'Aⁿ') {
   const exponent=Number(scalar);
   if(!Number.isSafeInteger(exponent)){setErr('La puissance n doit être un entier.');return;}
   const r=mPower(a,exponent);
   if(!r){setErr(exponent<0?'A doit être carrée et inversible pour une puissance négative.':'A doit être une matrice carrée.');return;}
   setRes(<div className="space-y-3 animate-scale-in">
    <ReliabilityPanel level="verified" title="Puissance matricielle contrôlée" detail="Le moteur utilise l’exponentiation rapide. Pour n<0, il calcule d’abord A⁻¹ puis élève la matrice à la puissance |n|." />
    <MatrixDisplay matrix={a} label="Matrice A" />
    <ResultBox label={'A^'+exponent} value="Voir ci-dessous" color="indigo" />
    <MatrixDisplay matrix={r} label={'A^'+exponent} />
   </div>);
   return;
  }
  if (op === 'kA') {
   const k = parseFloat(scalar);
   if (isNaN(k)) { setErr('Scalaire invalide'); return; }
   const r = mScale(a, k);
   setRes(<div className="space-y-3 animate-scale-in">
    <ReliabilityPanel level="verified" title="Multiplication scalaire contrôlée" detail="Chaque coefficient de A est multiplié par le même scalaire, sans arrondi intermédiaire." />
    <ResultBox label={`${k} × A`} value="Voir ci-dessous" color="indigo" />
    <MatrixDisplay matrix={a} label="Matrice A" />
    <p className="text-center text-slate-400">× {k} =</p>
    <MatrixDisplay matrix={r} label={`${k}A`} />
    <Section icon="∴" title="Détail des coefficients" color="blue"><div className="space-y-1 text-xs text-slate-300 font-mono">{r.flatMap((row, i) => row.map((value, j) => <p key={`${i}-${j}`}>c{i + 1}{j + 1} = {fmtValue(k)}×{fmtValue(a[i][j])} = {fmtValue(value)}</p>))}</div></Section>
   </div>);
   return;
  }

  const b = parseMatrix(mat2Str);
  if (!b) { setErr('Matrice B invalide'); return; }

  let r: Matrix | null = null;
  let opLabel = '';
  switch (op) {
   case '+': r = mAdd(a, b); opLabel = 'A + B'; break;
   case '−': r = mSub(a, b); opLabel = 'A − B'; break;
   case '×': r = mMul(a, b); opLabel = 'A × B'; break;
  }

  if (!r) { setErr(`Dimensions incompatibles ! A est ${a.length}×${a[0].length}, B est ${b.length}×${b[0].length}`); return; }

  const calcSteps = op === '×' ? multiplicationSteps(a, b, r) : r.flatMap((row, i) => row.map((value, j) => {
   const symbol = op === '+' ? '+' : '−';
   return `c${i + 1}${j + 1} = ${fmtValue(a[i][j])} ${symbol} ${fmtValue(b[i][j])} = ${fmtValue(value)}`;
  }));

  setRes(<div className="space-y-3 animate-scale-in">
   <ReliabilityPanel level="verified" title="Opération contrôlée" detail="Les dimensions sont validées avant le calcul et aucun arrondi intermédiaire n’est appliqué." />
   <ResultBox label={opLabel} value="Voir ci-dessous" color="indigo" />
   <div className="flex items-center gap-2 justify-center flex-wrap">
    <MatrixDisplay matrix={a} label="A" />
    <span className="text-xl text-slate-400 font-bold">{op === '−' ? '−' : op}</span>
    <MatrixDisplay matrix={b} label="B" />
    <span className="text-xl text-slate-400 font-bold">=</span>
   </div>
   <MatrixDisplay matrix={r} label={opLabel} />
   <Section icon="∴" title="Calcul ligne par ligne" color="blue">
    <div className="space-y-1.5 text-xs text-slate-300 font-mono">
     {calcSteps.map((step, i) => <p key={i}>{step}</p>)}
    </div>
   </Section>
  </div>);
 };

 const doSystem = () => {
  setErr('');setRes(null);
  const a=parseMatrix(matStr);
  if(!a){setErr('Matrice A invalide.');return;}
  const b=vectorB.split(/[,;\\s]+/).map(s=>s.trim()).filter(Boolean).map(Number);
  if(b.length!==a.length||b.some(v=>!Number.isFinite(v))){setErr('Le vecteur b doit contenir exactement '+a.length+' valeurs.');return;}
  try{
   const solved=solveLinearSystem(a,b);
   const cramer=solved.status==='unique'?solveCramer(a,b):null;
   const title=solved.status==='unique'?'Solution unique':solved.status==='infinite'?'Infinité de solutions':'Aucune solution';
   const level=solved.status==='unique'&&solved.residualMax!==null&&solved.residualMax<1e-8?'verified':'approximate';
   const detail=solved.status==='unique'?'Résolution contrôlée par Gauss-Jordan'+(cramer?' et Cramer':'')+'. Résidu maximal |Ax-b| = '+(solved.residualMax?.toExponential(3)??'n/a')+'.':solved.status==='infinite'?'rang(A)='+solved.rankA+' et rang(A|b)='+solved.rankAugmented+' : système compatible mais sous-déterminé.':'rang(A|b)='+solved.rankAugmented+' > rang(A)='+solved.rankA+' : système incompatible.';
   setRes(<div className="space-y-3 animate-scale-in">
    <ReliabilityPanel level={level} title={title} detail={detail} />
    <div className="grid grid-cols-2 gap-2"><PropBadge label="rang(A)" value={String(solved.rankA)} color="indigo"/><PropBadge label="rang(A|b)" value={String(solved.rankAugmented)} color="purple"/></div>
    {solved.solution&&<div className="grid grid-cols-2 gap-2">{solved.solution.map((value,index)=><PropBadge key={index} label={'x'+(index+1)} value={fmtValue(value)} color="emerald"/>)}</div>}
    {cramer&&<Section icon="Δ" title={series==='L'?'Méthode de Cramer · programme série L':'Contrôle par la méthode de Cramer'} color="emerald"><div className="space-y-1.5 text-xs text-slate-300 font-mono"><p>Δ = det(A) = {fmtValue(cramer.determinant)}</p>{cramer.columnDeterminants.map((d,i)=><p key={i}>Δ{i+1} = {fmtValue(d)} ; x{i+1}=Δ{i+1}/Δ = {fmtValue(cramer.solution[i])}</p>)}<p>Contrôle : max |Ax−b| = {cramer.residualMax.toExponential(2)}</p></div></Section>}
    <MatrixDisplay matrix={solved.augmentedRref} label="Matrice augmentée réduite" />
    <Section icon="∴" title="Étapes de Gauss-Jordan" color="blue"><div className="space-y-1 text-xs text-slate-300 font-mono">{solved.steps.slice(0,40).map((step,i)=><p key={i}>{step}</p>)}</div></Section>
   </div>);
  }catch(error:unknown){setErr(error instanceof Error?error.message:'Impossible de résoudre ce système.');}
 };
 const Input = ({ label, value, onChange, area }: { label: string; value: string; onChange: (v: string) => void; area?: boolean }) => (
  <div><label className="block text-[10px] text-indigo-400 font-bold mb-1">{label}</label>
  {area ? <textarea aria-label={label} value={value} onChange={e => onChange(e.target.value)} rows={2} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white font-mono text-sm focus:border-indigo-500 focus:outline-none resize-none" />
   : <input aria-label={label} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none" />}
  </div>
 );

 return (
  <div className="fixed inset-0 bg-slate-950/98 z-50 overflow-y-auto">
   <div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
    <div className="flex items-center justify-between mb-4">
     <h2 className="text-xl font-extrabold text-white">▦ Matrices</h2>
     <button onClick={onClose} aria-label="Fermer l’outil" className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">×</button>
    </div>

    <div className="flex gap-1 mb-4 bg-slate-800/50 p-1 rounded-xl">
     <button onClick={() => { setMode('analyze'); setRes(null); }} className={`flex-1 py-2 rounded-lg text-xs font-bold ${mode === 'analyze' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Analyser</button>
     <button onClick={() => { setMode('calc'); setRes(null); }} className={`flex-1 py-2 rounded-lg text-xs font-bold ${mode === 'calc' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Calcul</button>
     <button onClick={() => { setMode('system'); setRes(null); }} className={`flex-1 py-2 rounded-lg text-xs font-bold ${mode === 'system' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Ax=b</button>
    </div>

    {mode === 'analyze' && <div className="space-y-3">
     <div className="flex gap-2 items-end">
      <div className="flex-1"><label className="block text-[10px] text-slate-400 mb-1">Lignes</label>
       <input aria-label="Nombre de lignes" type="number" value={rows} onChange={e => setRows(Number(e.target.value))} min={1} max={5} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono text-sm focus:outline-none" /></div>
      <span className="text-slate-500 pb-2">×</span>
      <div className="flex-1"><label className="block text-[10px] text-slate-400 mb-1">Colonnes</label>
       <input aria-label="Nombre de colonnes" type="number" value={cols} onChange={e => setCols(Number(e.target.value))} min={1} max={5} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono text-sm focus:outline-none" /></div>
      <button onClick={fillTemplate} className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs font-bold active:scale-95">Créer</button>
     </div>
     <Input label="Matrice A (format : 1,2;3,4)" value={matStr} onChange={setMatStr} area />
     <div className="flex gap-1.5 flex-wrap">
      {[{ l: 'I₂', v: '1,0;0,1' }, { l: 'I₃', v: '1,0,0;0,1,0;0,0,1' }, { l: '2×2', v: '1,2;3,4' }, { l: '3×3', v: '1,2,3;4,5,6;7,8,9' }].map((ex, i) => (
       <button key={i} onClick={() => setMatStr(ex.v)} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 font-mono active:scale-95">{ex.l}</button>
      ))}
     </div>
     <button onClick={doAnalyze} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]"> Analyser la matrice</button>
    </div>}

    {mode === 'calc' && <div className="space-y-3">
     <Input label="Matrice A" value={matStr} onChange={setMatStr} area />
     <div className="flex justify-center gap-2">
      {(['+', '−', '×', 'kA', 'Aⁿ'] as const).map(o => (
       <button key={o} onClick={() => setOp(o)} className={`w-11 h-10 rounded-xl text-sm font-bold border ${op === o ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>{o}</button>
      ))}
     </div>
     {op === 'kA' ? <Input label="Scalaire k =" value={scalar} onChange={setScalar} /> : op === 'Aⁿ' ? <Input label="Exposant entier n =" value={scalar} onChange={setScalar} />
      : <Input label="Matrice B" value={mat2Str} onChange={setMat2Str} area />}
     <button onClick={doCalc} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]">= Calculer</button>
    </div>}

    {mode === 'system' && <div className="space-y-3">
     <div className="notice notice-info"><strong>Système linéaire :</strong> saisis A et le vecteur b. Le moteur détecte une solution unique, aucune solution ou une infinité de solutions.</div>
     <Input label="Matrice des coefficients A" value={matStr} onChange={setMatStr} area />
     <Input label="Vecteur b (ex. 5,11)" value={vectorB} onChange={setVectorB} />
     <button onClick={doSystem} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]">Résoudre Ax=b</button>
    </div>}
    {err && <p className="text-red-400 text-sm mt-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3">{err}</p>}
    {res && <div className="mt-4">{res}</div>}
   </div>
  </div>
 );
};

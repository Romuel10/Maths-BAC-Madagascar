import React, { useState } from 'react';
import { MathText } from './MathNotation';
import { ReliabilityPanel } from './ReliabilityPanel';
import { parseIntegerStrict, gcdLcmDetailed, primeFactorization, moduloDetailed, convertBaseDetailed } from '../lib/arithmeticEngine';

interface Props { onClose: () => void }

type Mode = 'gcd' | 'prime' | 'modular' | 'convert';

export const ArithmeticCalc: React.FC<Props> = ({ onClose }) => {
 const [mode, setMode] = useState<Mode>('gcd');
 const [a, setA] = useState('48'); const [b, setB] = useState('36');
 const [num, setNum] = useState('360');
 const [modA, setModA] = useState('17'); const [modN, setModN] = useState('5');
 const [convNum, setConvNum] = useState('255'); const [fromB, setFromB] = useState('10'); const [toB, setToB] = useState('2');
 const [result, setResult] = useState<string[]>([]);
 const [quality, setQuality] = useState<{ level: 'verified' | 'warning'; detail: string } | null>(null);

 const fail=(message:string,detail:string)=>{setResult([message]);setQuality({level:'warning',detail});};
 const handleGCD = () => {
  const av=parseIntegerStrict(a),bv=parseIntegerStrict(b); if(av===null||bv===null){fail('Les deux valeurs doivent être des entiers.','La saisie est rejetée avant tout calcul.');return;}
  try{const r=gcdLcmDetailed(av,bv);setResult([`PGCD(${av}, ${bv}) par l’algorithme d’Euclide :`,...r.steps,`PGCD = ${r.gcd}`,'',`PPCM(${av}, ${bv}) = ${r.lcm}`,'',...r.checks.map(c=>`Vérification — ${c.detail}`)]);setQuality({level:r.checks.every(c=>c.ok)?'verified':'warning',detail:r.checks.map(c=>c.detail).join(' ')})}catch(e){fail(e instanceof Error?e.message:'Calcul impossible.','Le moteur arithmétique a interrompu le calcul.');}
 };
 const handlePrime = () => {
  const nv=parseIntegerStrict(num);if(nv===null){fail('Entrez un entier valide.','La factorisation demande un entier exact.');return;}
  try{const r=primeFactorization(nv);const fs=r.factors.map(f=>f.power===1?`${f.factor}`:`${f.factor}^${f.power}`).join(' × ');setResult([`Décomposition de ${nv} en facteurs premiers :`,...r.steps,'',`${nv < 0n ? -nv:nv} = ${fs}`,'',r.isPrime?`${nv} est un nombre premier.`:`${nv} n’est pas premier.`, '',`Diviseurs positifs : {${r.divisors.join(', ')}}`,`Nombre de diviseurs : ${r.divisors.length}`]);setQuality({level:r.checks.every(c=>c.ok)?'verified':'warning',detail:r.checks.map(c=>c.detail).join(' ')})}catch(e){fail(e instanceof Error?e.message:'Factorisation impossible.','Le calcul est interrompu plutôt que de donner une factorisation partielle.');}
 };
 const handleModular = () => {
  const av=parseIntegerStrict(modA),nv=parseIntegerStrict(modN);if(av===null||nv===null){fail('a et n doivent être des entiers.','Le modulo est calculé uniquement sur des entiers exacts.');return;}
  try{const r=moduloDetailed(av,nv);setResult([`${av} mod ${nv} = ${r.remainder}`,...r.steps,'',...r.checks.map(c=>`Vérification — ${c.detail}`)]);setQuality({level:r.checks.every(c=>c.ok)?'verified':'warning',detail:r.checks.map(c=>c.detail).join(' ')})}catch(e){fail(e instanceof Error?e.message:'Modulo impossible.','Calcul interrompu.');}
 };
 const handleConvert = () => {
  const fb=Number(fromB),tb=Number(toB);try{const r=convertBaseDetailed(convNum,fb,tb);setResult([...r.steps,'',`${convNum.toUpperCase()} (base ${fb}) = ${r.result} (base ${tb})`,'',...r.checks.map(c=>`Vérification — ${c.detail}`)]);setQuality({level:r.checks.every(c=>c.ok)?'verified':'warning',detail:r.checks.map(c=>c.detail).join(' ')})}catch(e){fail(e instanceof Error?e.message:'Conversion impossible.','Le moteur refuse une écriture incompatible avec la base choisie.');}
 };

 return (
  <div className="fixed inset-0 bg-slate-950/98 z-50 overflow-y-auto">
   <div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
    <div className="flex items-center justify-between mb-4">
     <h2 className="text-xl font-extrabold text-white"> Arithmétique</h2>
     <button onClick={onClose} aria-label="Fermer l’outil" className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">×</button>
    </div>

    <div className="flex gap-1 mb-4 bg-slate-800/50 p-1 rounded-xl overflow-x-auto">
     {([
      { id: 'gcd' as Mode, label: 'PGCD/PPCM' },
      { id: 'prime' as Mode, label: 'Premiers' },
      { id: 'modular' as Mode, label: 'Modulo' },
      { id: 'convert' as Mode, label: 'Bases' },
     ]).map(m => (
      <button key={m.id} onClick={() => { setMode(m.id); setResult([]); setQuality(null); }}
       className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap px-2 ${mode === m.id ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>{m.label}</button>
     ))}
    </div>

    {mode === 'gcd' && (
     <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
       <div><label className="block text-xs text-slate-400 mb-1">a =</label><input aria-label="Entier a" type="number" value={a} onChange={e => setA(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none" /></div>
       <div><label className="block text-xs text-slate-400 mb-1">b =</label><input aria-label="Entier b" type="number" value={b} onChange={e => setB(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none" /></div>
      </div>
      <button onClick={handleGCD} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]">PGCD & PPCM</button>
     </div>
    )}

    {mode === 'prime' && (
     <div className="space-y-3">
      <div><label className="block text-xs text-slate-400 mb-1">Nombre n =</label><input aria-label="Nombre n" type="number" value={num} onChange={e => setNum(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none" /></div>
      <button onClick={handlePrime} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]">Décomposer en facteurs premiers</button>
     </div>
    )}

    {mode === 'modular' && (
     <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
       <div><label className="block text-xs text-slate-400 mb-1">a =</label><input aria-label="Valeur a pour la congruence" type="number" value={modA} onChange={e => setModA(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none" /></div>
       <div><label className="block text-xs text-slate-400 mb-1">n =</label><input aria-label="Modulo n" type="number" value={modN} onChange={e => setModN(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none" /></div>
      </div>
      <button onClick={handleModular} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]">a mod n</button>
     </div>
    )}

    {mode === 'convert' && (
     <div className="space-y-3">
      <div><label className="block text-xs text-slate-400 mb-1">Nombre</label><input aria-label="Nombre à convertir" type="text" value={convNum} onChange={e => setConvNum(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none" /></div>
      <div className="grid grid-cols-2 gap-2">
       <div><label className="block text-xs text-slate-400 mb-1">Base départ</label><input aria-label="Base de départ" type="number" value={fromB} onChange={e => setFromB(e.target.value)} min="2" max="16" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none" /></div>
       <div><label className="block text-xs text-slate-400 mb-1">Base arrivée</label><input aria-label="Base d’arrivée" type="number" value={toB} onChange={e => setToB(e.target.value)} min="2" max="16" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none" /></div>
      </div>
      <button onClick={handleConvert} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]">Convertir</button>
     </div>
    )}

    {quality && (
     <div className="mt-4">
      <ReliabilityPanel level={quality.level} title={quality.level === 'verified' ? 'Calcul arithmétique vérifié' : 'Calcul interrompu ou à contrôler'} detail={quality.detail} />
     </div>
    )}

    {result.length > 0 && (
     <div className="mt-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700/30 space-y-1 animate-scale-in">
      {result.map((l, i) => (
       <p key={i} className={`text-sm font-mono ${l === '' ? 'h-2' : l.includes('=') && !l.includes('÷') ? 'text-emerald-300 font-bold' : l.includes('PREMIER') || l.includes('PGCD') || l.includes('PPCM') ? 'text-emerald-300 font-bold' : 'text-slate-300'}`}><MathText auto>{l}</MathText></p>
      ))}
     </div>
    )}
   </div>
  </div>
 );
};

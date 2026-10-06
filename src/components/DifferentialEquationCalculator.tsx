import React,{useEffect,useState} from 'react';
import { solveFirstOrderHomogeneous, solveSecondOrderHomogeneous } from '../lib/differentialEquationEngine';
import { ReliabilityPanel } from './ReliabilityPanel';
import { ResultBox, Section, PropBadge } from './ResultCard';

interface Props{onClose:()=>void}
type Mode='first'|'second';
const num=(s:string)=>Number(s);
const finite=(...xs:number[])=>xs.every(Number.isFinite);

const Input=({label,value,onChange}:{label:string;value:string;onChange:(s:string)=>void})=><div><label className="block text-[0.625rem] text-indigo-400 font-bold mb-1">{label}</label><input aria-label={label} type="number" step="any" value={value} onChange={e=>onChange(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"/></div>;

export const DifferentialEquationCalculator:React.FC<Props>=({onClose})=>{
 const [mode,setMode]=useState<Mode>('first');
 const [a,setA]=useState('2');
 const [A,setA2]=useState('1'),[B,setB]=useState('-3'),[C,setC]=useState('2');
 const [useInitial,setUseInitial]=useState(true);
 const [x0,setX0]=useState('0'),[y0,setY0]=useState('1'),[dy0,setDy0]=useState('0');
 const [res,setRes]=useState<React.ReactNode|null>(null);
 useEffect(()=>{setRes(null);},[mode,a,A,B,C,useInitial,x0,y0,dy0]);
 const [err,setErr]=useState('');

 const solve=()=>{
  setErr('');setRes(null);
  try{
   if(mode==='first'){
    const av=num(a),x=num(x0),y=num(y0);
    if(!finite(av)||useInitial&&!finite(x,y))throw new Error('Vérifie les coefficients et la condition initiale.');
    const r=solveFirstOrderHomogeneous(av,useInitial?{x0:x,y0:y}:undefined);
    setRes(<div className="space-y-3 animate-scale-in">
     <ReliabilityPanel level={r.checks.every(c=>c.ok)?'verified':'warning'} title="Équation différentielle du 1er ordre" detail="Méthode BAC : séparation/intégration de y′+ay=0, puis utilisation éventuelle de la condition initiale." checks={r.checks}/>
     <ResultBox label="Solution générale" value={r.generalSolution} color="indigo"/>
     {r.particularSolution&&<ResultBox label="Solution avec condition initiale" value={r.particularSolution} color="emerald"/>}
     <Section icon="∴" title="Méthode pas à pas" color="blue"><div className="space-y-1.5 text-xs text-slate-300">{r.steps.map((s,i)=><p key={i}>{i+1}. {s}</p>)}</div></Section>
    </div>);
   }else{
    const av=num(A),bv=num(B),cv=num(C),x=num(x0),y=num(y0),dy=num(dy0);
    if(!finite(av,bv,cv)||useInitial&&!finite(x,y,dy))throw new Error('Vérifie les coefficients et les conditions initiales.');
    const r=solveSecondOrderHomogeneous(av,bv,cv,useInitial?{x0:x,y0:y,dy0:dy}:undefined);
    setRes(<div className="space-y-3 animate-scale-in">
     <ReliabilityPanel level={r.checks.every(c=>c.ok)?'verified':'warning'} title="Équation différentielle du 2e ordre" detail="Méthode BAC : équation caractéristique, étude du discriminant puis détermination éventuelle des constantes." checks={r.checks}/>
     <div className="grid grid-cols-2 gap-2"><PropBadge label="Δ caractéristique" value={String(r.discriminant)} color="purple"/><PropBadge label="Racines" value={r.roots.join(' ; ')} color="cyan"/></div>
     <ResultBox label="Solution générale" value={r.generalSolution} color="indigo"/>
     {r.particularSolution&&<ResultBox label="Solution avec conditions initiales" value={r.particularSolution} color="emerald"/>}
     <Section icon="∴" title="Méthode pas à pas" color="blue"><div className="space-y-1.5 text-xs text-slate-300">{r.steps.map((s,i)=><p key={i}>{i+1}. {s}</p>)}</div></Section>
    </div>);
   }
  }catch(e:unknown){setErr(e instanceof Error?e.message:'Résolution impossible.');}
 };



 return <div className="fixed inset-0 bg-slate-950/98 z-50 overflow-y-auto"><div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
  <div className="flex items-center justify-between mb-4"><div><p className="text-[0.625rem] text-indigo-400 font-bold uppercase">Programme BAC C / S</p><h2 className="text-xl font-extrabold text-white">Équations différentielles</h2></div><button onClick={onClose} aria-label="Fermer l’outil" className="w-8 h-8 rounded-full bg-slate-800 text-slate-400">×</button></div>
  <div className="notice notice-info mb-4">L’outil reste volontairement dans le périmètre du BAC malgache : équations linéaires homogènes du 1er et du 2e ordre à coefficients constants.</div>
  <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl mb-4"><button onClick={()=>{setMode('first');setRes(null)}} className={`flex-1 py-2 rounded-lg text-xs font-bold ${mode==='first'?'bg-indigo-600 text-white':'text-slate-400'}`}>1er ordre</button><button onClick={()=>{setMode('second');setRes(null)}} className={`flex-1 py-2 rounded-lg text-xs font-bold ${mode==='second'?'bg-indigo-600 text-white':'text-slate-400'}`}>2e ordre</button></div>
  {mode==='first'?<div className="space-y-3"><p className="text-sm text-slate-300 text-center font-mono">y′ + ay = 0</p><Input label="a =" value={a} onChange={setA}/></div>:<div className="space-y-3"><p className="text-sm text-slate-300 text-center font-mono">Ay″ + By′ + Cy = 0</p><div className="grid grid-cols-3 gap-2"><Input label="A =" value={A} onChange={setA2}/><Input label="B =" value={B} onChange={setB}/><Input label="C =" value={C} onChange={setC}/></div></div>}
  <label className="annale-check-row mt-4"><input type="checkbox" checked={useInitial} onChange={e=>setUseInitial(e.target.checked)}/><span>Utiliser des conditions initiales</span></label>
  {useInitial&&<div className={`grid ${mode==='first'?'grid-cols-2':'grid-cols-3'} gap-2 mt-3`}><Input label="x₀ =" value={x0} onChange={setX0}/><Input label="y(x₀) =" value={y0} onChange={setY0}/>{mode==='second'&&<Input label="y′(x₀) =" value={dy0} onChange={setDy0}/>}</div>}
  <button onClick={solve} className="w-full py-3 mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]">Résoudre et expliquer</button>
  {err&&<div className="notice mt-3 text-red-300">{err}</div>}{res&&<div className="mt-4">{res}</div>}
 </div></div>;
};

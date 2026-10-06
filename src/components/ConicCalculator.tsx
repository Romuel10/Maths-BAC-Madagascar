import React,{useEffect,useState} from 'react';
import { analyzeEllipse, analyzeHyperbola, analyzeParabola, conicTangent, type ConicAnalysis } from '../lib/conicEngine';
import { ReliabilityPanel } from './ReliabilityPanel';
import { ResultBox, PropBadge, Section } from './ResultCard';

interface Props{onClose:()=>void}
type Mode='ellipse'|'hyperbola'|'parabola';
const f=(n:string)=>Number(n);

const Input=({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void})=><div><label className="block text-[0.625rem] text-indigo-400 font-bold mb-1">{label}</label><input aria-label={label} type="number" step="any" value={value} onChange={e=>onChange(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"/></div>;

export const ConicCalculator:React.FC<Props>=({onClose})=>{
 const [mode,setMode]=useState<Mode>('ellipse');
 const [a,setA]=useState('5'),[b,setB]=useState('3');
 const [vertical,setVertical]=useState(false);
 const [p,setP]=useState('2'),[axis,setAxis]=useState<'x'|'y'>('x'),[direction,setDirection]=useState<1|-1>(1);
 const [x0,setX0]=useState(''),[y0,setY0]=useState('');
 const [res,setRes]=useState<React.ReactNode|null>(null),[err,setErr]=useState('');
 useEffect(()=>{setRes(null);},[mode,a,b,vertical,p,axis,direction,x0,y0]);

 const analyze=()=>{
  setErr('');setRes(null);
  try{
   let r:ConicAnalysis;
   if(mode==='ellipse')r=analyzeEllipse(f(a),f(b));
   else if(mode==='hyperbola')r=analyzeHyperbola(f(a),f(b),vertical);
   else r=analyzeParabola(f(p),axis,direction);
   const hasPoint=x0.trim()!==''&&y0.trim()!=='';
   const tangent=hasPoint?conicTangent(r,f(x0),f(y0)):null;
   setRes(<div className="space-y-3 animate-scale-in">
    <ReliabilityPanel level={r.checks.every(c=>c.ok)?'verified':'warning'} title="Conique en forme réduite" detail="Les propriétés sont calculées à partir de la forme réduite enseignée au BAC C." checks={r.checks}/>
    <ResultBox label="Équation réduite" value={r.equation} color="indigo"/>
    <div className="grid grid-cols-2 gap-2">
     <PropBadge label="Centre / sommet" value={r.center||r.vertices[0]} color="slate"/>
     <PropBadge label="Excentricité e" value={r.eccentricity===null?'—':String(Math.round(r.eccentricity*1e8)/1e8)} color="purple"/>
     <PropBadge label="Foyer(s)" value={r.foci.join(' ; ')} color="cyan"/>
     <PropBadge label="Directrice(s)" value={r.directrices.join(' ; ')||'—'} color="amber"/>
    </div>
    {r.asymptotes.length>0&&<Section icon="↗" title="Asymptotes" color="blue"><div className="space-y-1 text-xs text-slate-300 font-mono">{r.asymptotes.map((v,i)=><p key={i}>{v}</p>)}</div></Section>}
    <Section icon="•" title="Sommets remarquables" color="emerald"><p className="text-xs text-slate-300 font-mono">{r.vertices.join(' ; ')}</p></Section>
    {tangent&&<Section icon="T" title="Tangente au point saisi" color={tangent.onConic?'emerald':'amber'}>{tangent.onConic?<div><p className="text-xs text-slate-400">Le point appartient à la conique.</p><p className="font-mono text-sm text-white mt-1">{tangent.equation}</p></div>:<p className="text-xs text-slate-300">Le point ne vérifie pas l’équation (résidu {String(tangent.residual)}). Aucune tangente n’est validée.</p>}</Section>}
   </div>);
  }catch(e:unknown){setErr(e instanceof Error?e.message:'Analyse impossible.');}
 };



 return <div className="fixed inset-0 bg-slate-950/98 z-50 overflow-y-auto"><div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
  <div className="flex items-center justify-between mb-4"><div><p className="text-[0.625rem] text-indigo-400 font-bold uppercase">Programme Terminale C</p><h2 className="text-xl font-extrabold text-white">Coniques</h2></div><button onClick={onClose} aria-label="Fermer l’outil" className="w-8 h-8 rounded-full bg-slate-800 text-slate-400">×</button></div>
  <div className="notice notice-info mb-4">Parabole, ellipse et hyperbole sous forme réduite : foyers, directrices, sommets, asymptotes et tangente en un point vérifié.</div>
  <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl mb-4 overflow-x-auto">
   {([['ellipse','Ellipse'],['hyperbola','Hyperbole'],['parabola','Parabole']] as Array<[Mode,string]>).map(([id,label])=><button key={id} onClick={()=>{setMode(id);setRes(null)}} className={`flex-1 min-w-[90px] py-2 rounded-lg text-xs font-bold ${mode===id?'bg-indigo-600 text-white':'text-slate-400'}`}>{label}</button>)}
  </div>
  {mode==='ellipse'&&<div className="space-y-3"><p className="text-sm text-slate-300 text-center font-mono">x²/a² + y²/b² = 1</p><div className="grid grid-cols-2 gap-2"><Input label="a =" value={a} onChange={setA}/><Input label="b =" value={b} onChange={setB}/></div></div>}
  {mode==='hyperbola'&&<div className="space-y-3"><p className="text-sm text-slate-300 text-center font-mono">{vertical?'y²/a² − x²/b² = 1':'x²/a² − y²/b² = 1'}</p><div className="grid grid-cols-2 gap-2"><Input label="a =" value={a} onChange={setA}/><Input label="b =" value={b} onChange={setB}/></div><label className="annale-check-row"><input type="checkbox" checked={vertical} onChange={e=>setVertical(e.target.checked)}/><span>Axe transverse vertical</span></label></div>}
  {mode==='parabola'&&<div className="space-y-3"><p className="text-sm text-slate-300 text-center font-mono">{axis==='x'?'y²=4px':'x²=4py'}</p><Input label="p =" value={p} onChange={setP}/><div className="grid grid-cols-2 gap-2"><button onClick={()=>setAxis('x')} className={`btn btn-small ${axis==='x'?'btn-primary':'btn-secondary'}`}>Axe Ox</button><button onClick={()=>setAxis('y')} className={`btn btn-small ${axis==='y'?'btn-primary':'btn-secondary'}`}>Axe Oy</button></div><div className="grid grid-cols-2 gap-2"><button onClick={()=>setDirection(1)} className={`btn btn-small ${direction===1?'btn-primary':'btn-secondary'}`}>Sens positif</button><button onClick={()=>setDirection(-1)} className={`btn btn-small ${direction===-1?'btn-primary':'btn-secondary'}`}>Sens négatif</button></div></div>}
  <div className="surface-flat p-3 mt-4"><p className="text-xs font-bold text-slate-200">Tangente (facultatif)</p><p className="text-[0.625rem] text-slate-400 mt-1">Saisis un point M(x₀,y₀). La tangente n’est donnée que si le point appartient à la conique.</p><div className="grid grid-cols-2 gap-2 mt-2"><Input label="x₀" value={x0} onChange={setX0}/><Input label="y₀" value={y0} onChange={setY0}/></div></div>
  <button onClick={analyze} className="w-full py-3 mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]">Analyser la conique</button>
  {err&&<div className="notice mt-3 text-red-300">{err}</div>}{res&&<div className="mt-4">{res}</div>}
 </div></div>;
};

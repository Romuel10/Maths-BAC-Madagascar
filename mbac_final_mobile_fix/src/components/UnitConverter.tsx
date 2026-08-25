import React, { useMemo, useState } from 'react';
import { ReliabilityPanel } from './ReliabilityPanel';
import { UNIT_CATEGORIES, convertUnit, formatUnitNumber, type UnitCategoryId } from '../lib/unitEngine';

interface Props { onClose: () => void }

export const UnitConverter: React.FC<Props> = ({ onClose }) => {
 const [cat,setCat]=useState<UnitCategoryId>('length');
 const [fromUnit,setFromUnit]=useState('m');
 const [toUnit,setToUnit]=useState('cm');
 const [value,setValue]=useState('1');
 const category=useMemo(()=>UNIT_CATEGORIES.find(c=>c.id===cat)!,[cat]);
 const numeric=Number(value);
 const conversion=useMemo(()=>{
  if(!Number.isFinite(numeric)) return {result:null,error:'Entrez un nombre réel fini.'};
  try{return{result:convertUnit(cat,numeric,fromUnit,toUnit),error:''};}catch(e){return{result:null,error:e instanceof Error?e.message:'Conversion impossible.'};}
 },[cat,numeric,fromUnit,toUnit]);
 const all=useMemo(()=>{
  if(!Number.isFinite(numeric))return [];
  return category.units.filter(u=>u.id!==fromUnit).map(u=>{try{return{unit:u,result:convertUnit(cat,numeric,fromUnit,u.id)}}catch{return null}}).filter(Boolean) as Array<{unit:(typeof category.units)[number];result:ReturnType<typeof convertUnit>}>;
 },[cat,category,fromUnit,numeric]);
 const selectCategory=(id:UnitCategoryId)=>{const c=UNIT_CATEGORIES.find(x=>x.id===id)!;setCat(id);setFromUnit(c.units[0].id);setToUnit(c.units[1]?.id??c.units[0].id)};
 const swap=()=>{setFromUnit(toUnit);setToUnit(fromUnit)};
 return <div className="fixed inset-0 bg-slate-950/98 z-50 overflow-y-auto"><div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
  <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-extrabold text-white">Convertisseur d’unités</h2><button onClick={onClose} aria-label="Fermer" className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center">×</button></div>
  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-4 pb-1">{UNIT_CATEGORIES.map(c=><button key={c.id} onClick={()=>selectCategory(c.id)} className={`shrink-0 py-1.5 px-3 rounded-full text-[11px] font-bold ${cat===c.id?'bg-indigo-600 text-white':'bg-slate-800/50 text-slate-400 border border-slate-700/30'}`}>{c.symbol} {c.label}</button>)}</div>
  <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/20 mb-3">
   <label className="block text-[10px] text-indigo-400 font-bold mb-1">Valeur</label><input type="number" step="any" value={value} onChange={e=>setValue(e.target.value)} className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-xl text-white font-mono text-center focus:border-indigo-500 focus:outline-none" />
   <div className="flex items-center gap-2 mt-3"><select value={fromUnit} onChange={e=>setFromUnit(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm font-mono">{category.units.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select><button onClick={swap} className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">⇄</button><select value={toUnit} onChange={e=>setToUnit(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm font-mono">{category.units.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
  </div>
  {conversion.error&&<ReliabilityPanel level="warning" title="Conversion interrompue" detail={conversion.error}/>} 
  {conversion.result&&<div className="space-y-3 animate-scale-in">
   <ReliabilityPanel level={conversion.result.checks.every(c=>c.ok)?'verified':'warning'} title={conversion.result.checks.every(c=>c.ok)?'Conversion vérifiée':'Conversion à contrôler'} detail={conversion.result.warning??'La conversion inverse et les facteurs de référence ont été contrôlés.'} checks={conversion.result.checks}/>
   <div className="bg-emerald-600/10 rounded-2xl p-5 border border-emerald-500/20 text-center"><p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Résultat</p><p className="text-3xl font-mono text-white font-extrabold">{formatUnitNumber(conversion.result.value)}</p><p className="text-sm text-emerald-300 mt-1">{conversion.result.to.name}</p></div>
   <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/20"><p className="text-xs font-bold text-slate-300 mb-2">Méthode</p>{conversion.result.steps.map((s,i)=><p key={i} className={`text-sm font-mono ${i===conversion.result!.steps.length-1?'text-emerald-300 font-bold':'text-slate-400'}`}>{s}</p>)}{conversion.result.factorText&&<p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-700/20 font-mono">{conversion.result.factorText}</p>}{conversion.result.warning&&<p className="text-xs text-amber-300 mt-2">{conversion.result.warning}</p>}</div>
   <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/20"><p className="text-xs font-bold text-slate-300 mb-2">Conversions dans la même catégorie</p><div className="space-y-1">{all.map(({unit,result})=><div key={unit.id} className="flex justify-between gap-3 text-xs"><span className="text-slate-400">{unit.name}</span><span className="font-mono text-slate-200">{formatUnitNumber(result.value)}</span></div>)}</div></div>
  </div>}
 </div></div>;
};

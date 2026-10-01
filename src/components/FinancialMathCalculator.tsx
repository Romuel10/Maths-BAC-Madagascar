import React,{useState} from 'react';
import { annuityFutureValue, annuityPresentValue, commercialDiscount, compoundFutureValue, presentValue, simpleInterest, type FinanceResult } from '../lib/financialMathEngine';
import { ReliabilityPanel } from './ReliabilityPanel';
import { ResultBox, Section } from './ResultCard';

interface Props{onClose:()=>void}
type Mode='simple'|'discount'|'compound'|'present'|'annuity-present'|'annuity-future';
const f=(n:number)=>{const r=Math.round(n*1e8)/1e8;return Number.isInteger(r)?String(r):String(r).replace('.',',')};

export const FinancialMathCalculator:React.FC<Props>=({onClose})=>{
 const [mode,setMode]=useState<Mode>('simple');
 const [capital,setCapital]=useState('1000000');
 const [ratePct,setRatePct]=useState('10');
 const [time,setTime]=useState('2');
 const [res,setRes]=useState<FinanceResult|null>(null);
 const [err,setErr]=useState('');

 const calculate=()=>{
  setErr('');setRes(null);
  const amount=Number(capital.replace(',','.')),rate=Number(ratePct.replace(',','.'))/100,t=Number(time.replace(',','.'));
  try{
   let r:FinanceResult;
   if(mode==='simple')r=simpleInterest(amount,rate,t);
   else if(mode==='discount')r=commercialDiscount(amount,rate,t);
   else if(mode==='compound')r=compoundFutureValue(amount,rate,t);
   else if(mode==='present')r=presentValue(amount,rate,t);
   else if(mode==='annuity-present')r=annuityPresentValue(amount,rate,t);
   else r=annuityFutureValue(amount,rate,t);
   setRes(r);
  }catch(e:unknown){setErr(e instanceof Error?e.message:'Calcul impossible.');}
 };

 const isIntegerPeriods=!['simple','discount'].includes(mode);
 const amountLabel=mode==='discount'?'Valeur nominale N':mode==='present'?'Valeur future VF':mode.startsWith('annuity')?'Annuité R':'Capital C';
 return <div className="fixed inset-0 bg-slate-950/98 z-50 overflow-y-auto"><div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
  <div className="flex items-center justify-between mb-4"><div><p className="text-[10px] text-indigo-400 font-bold uppercase">Programme Terminale OSE</p><h2 className="text-xl font-extrabold text-white">Mathématiques financières</h2></div><button onClick={onClose} aria-label="Fermer l’outil" className="w-8 h-8 rounded-full bg-slate-800 text-slate-400">×</button></div>
  <div className="notice notice-info mb-4"><strong>Lecture simple :</strong> saisis le taux en pourcentage. Pour l’intérêt simple et l’escompte, la durée doit être exprimée dans la même unité que le taux. Pour les intérêts composés et annuités, n est un nombre entier de périodes.</div>
  <div className="flex gap-1 overflow-x-auto mb-4">
   {([
    ['simple','Intérêt simple'],['discount','Escompte'],['compound','Capitalisation'],['present','Actualisation'],['annuity-present','Annuités VA'],['annuity-future','Annuités VF']
   ] as Array<[Mode,string]>).map(([id,label])=><button key={id} onClick={()=>{setMode(id);setRes(null);setErr('')}} className={`shrink-0 py-2 px-3 rounded-xl text-xs font-bold ${mode===id?'bg-indigo-600 text-white':'bg-slate-800 text-slate-400'}`}>{label}</button>)}
  </div>
  <div className="space-y-3">
   <div><label className="field-label">{amountLabel}</label><input aria-label={amountLabel} value={capital} onChange={e=>setCapital(e.target.value)} inputMode="decimal" className="field mt-1 font-mono"/></div>
   <div><label className="field-label">Taux i (%)</label><input aria-label="Taux en pourcentage" value={ratePct} onChange={e=>setRatePct(e.target.value)} inputMode="decimal" className="field mt-1 font-mono"/></div>
   <div><label className="field-label">{isIntegerPeriods?'Nombre de périodes n':'Durée t'}</label><input aria-label={isIntegerPeriods?'Nombre de périodes':'Durée'} value={time} onChange={e=>setTime(e.target.value)} inputMode="decimal" className="field mt-1 font-mono"/></div>
   <button onClick={calculate} className="btn btn-primary w-full">Calculer et expliquer</button>
  </div>
  {err&&<div className="notice notice-danger mt-3">{err}</div>}
  {res&&<div className="space-y-3 mt-4">
   <ReliabilityPanel level={res.checks.every(c=>c.ok)?'verified':'warning'} title={res.title} detail="Calcul effectué sans arrondi intermédiaire. Le résultat est contrôlé avec la relation inverse ou une identité financière." checks={res.checks}/>
   <ResultBox label={res.formula} value={f(res.result)} color="emerald"/>
   <Section icon="∴" title="Étapes à écrire" color="blue"><div className="space-y-2 text-sm text-slate-300">{res.steps.map((s,i)=><p key={i}><strong>{i+1}.</strong> {s}</p>)}</div></Section>
   <div className="notice notice-warning"><strong>Attention au BAC :</strong> précise toujours l’unité de temps du taux et ne transforme pas automatiquement des jours en années sans convention donnée dans l’énoncé.</div>
  </div>}
 </div></div>;
};

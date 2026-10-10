import {useEffect,useState} from 'react';
import {previewInput} from '../client';
import {MathView} from './Math';
import type {Request} from '../engine/types';

const approaches=[
 ['auto','Automatique','L’application vérifie le domaine et compare les côtés possibles.'],
 ['both','Des deux côtés','x peut être plus petit ou plus grand que le nombre.'],
 ['left','Par valeurs plus petites','À gauche : x < le nombre choisi.'],
 ['right','Par valeurs plus grandes','À droite : x > le nombre choisi.']
];
const examples=[
 {name:'Fraction',expression:'sin(x)/x',point:'0',latex:'\\lim_{x\\to 0}\\frac{\\sin(x)}{x}'},
 {name:'Logarithme',expression:'ln(x)',point:'0',latex:'\\lim_{x\\to 0^+}\\ln(x)'},
 {name:'Exponentielle',expression:'exp(x)',point:'−∞',latex:'\\lim_{x\\to-\\infty}e^x'},
 {name:'Racine carrée',expression:'sqrt(1-x)',point:'1',latex:'\\lim_{x\\to 1^-}\\sqrt{1-x}'}
];
function target(value:string){const point=value.trim().replace(/−|–/g,'-');return /^[+]?inf(inity)?$|^\+?∞$/i.test(point)?'positive':/^-inf(inity)?$|^-∞$/i.test(point)?'negative':'number';}

export function LimitInput({draft,busy,onChange}:{draft:Request;busy:boolean;onChange:(request:Request)=>void}){
 const point=draft.params.point??'0',kind=target(point),side=draft.params.side??'auto';
 const [preview,setPreview]=useState(''),[hint,setHint]=useState('');
 const set=(params:Record<string,string>)=>onChange({...draft,params:{...draft.params,...params}});
 useEffect(()=>{
  let active=true;setPreview('');setHint('');if(busy)return;
  if(!point.trim()){setHint('Indique le nombre à approcher.');return;}
  if(!draft.expression.trim()){setHint('Saisis la fonction dans le champ mathématique.');return;}
  const timer=setTimeout(()=>{void Promise.all([previewInput(draft.expression),kind==='number'?previewInput(point):Promise.resolve({latex:kind==='positive'?'+\\infty':'-\\infty',hint:undefined})]).then(([formula,at])=>{
   if(!active)return;
   if(formula.latex&&at.latex)setPreview('\\lim_{x\\to '+(kind==='number'&&['left','right'].includes(side)?'{'+at.latex+'}'+(side==='left'?'^-':'^+'):at.latex)+'}\\left('+formula.latex+'\\right)');
   else setHint(formula.hint??at.hint??'Complète la fonction et le nombre.');
  }).catch(()=>{if(active)setHint('L’aperçu apparaîtra quand la saisie sera complète.');});},250);
  return()=>{active=false;clearTimeout(timer);};
 },[draft.expression,point,kind,side,busy]);
 return <section className="limit-input" aria-label="Réglages de la limite">
  <div className="limit-step"><span>2</span><h3>Vers quoi x s’approche ?</h3></div>
  <div className="limit-targets" role="group" aria-label="Destination de x">
   <button type="button" aria-label="Un nombre" aria-pressed={kind==='number'} onClick={()=>set({point:kind==='number'?point:target(draft.params.finitePoint??'0')==='number'?draft.params.finitePoint??'0':'0'})}><span>Un nombre</span><small>0, 1, 2…</small></button>
   <button type="button" aria-label="Vers plus l’infini" aria-pressed={kind==='positive'} onClick={()=>set({point:'+∞',...(kind==='number'?{finitePoint:point}:{})})}><MathView tex={'+\\infty'} block={false}/><small>x augmente</small></button>
   <button type="button" aria-label="Vers moins l’infini" aria-pressed={kind==='negative'} onClick={()=>set({point:'−∞',...(kind==='number'?{finitePoint:point}:{})})}><MathView tex={'-\\infty'} block={false}/><small>x diminue</small></button>
  </div>
  {kind==='number'&&<div className="limit-number"><label htmlFor="limit-point">Nombre à approcher<input id="limit-point" aria-describedby="limit-point-help" value={point} maxLength={80} spellCheck={false} autoCapitalize="off" autoComplete="off" onChange={e=>set({point:e.target.value,finitePoint:target(e.target.value)==='number'?e.target.value:point})}/></label><div className="limit-point-shortcuts" role="group" aria-label="Nombres fréquents">{[['0','0'],['1','1'],['−1','-1'],['½','1/2'],['π','pi']].map(([label,value])=><button type="button" key={value} aria-label={'Approcher '+label} onClick={()=>set({point:value,finitePoint:value})}>{label}</button>)}</div><p id="limit-point-help">Tu peux aussi écrire un décimal ou une fraction, comme 0,5 ou 2/3.</p></div>}
  {kind==='number'&&<details className="limit-approach"><summary>Approche : {approaches.find(a=>a[0]===side)?.[1].toLowerCase()??'automatique'}</summary><p>Utilise l’approche indiquée dans ton énoncé, ou laisse l’application vérifier le domaine.</p><div role="group" aria-label="Sens de l’approche">{approaches.map(([value,title,description])=><button type="button" key={value} aria-label={title} aria-describedby={'limit-side-'+value} aria-pressed={side===value} onClick={()=>set({side:value})}><strong>{title}</strong><small id={'limit-side-'+value}>{description}</small></button>)}</div></details>}
  <div className="limit-preview" aria-live="polite"><span>TA LIMITE</span>{preview?<MathView tex={preview}/>:<p>{hint||'Préparation de l’aperçu…'}</p>}{side==='auto'&&kind==='number'&&<p>Le calcul choisit les côtés autorisés par le domaine.</p>}</div>
  <details className="limit-examples"><summary>Essayer un exemple</summary><div>{examples.map(example=><button type="button" key={example.name} aria-label={'Exemple de limite : '+example.name.toLowerCase()} onClick={()=>onChange({...draft,expression:example.expression,params:{...draft.params,point:example.point,finitePoint:target(example.point)==='number'?example.point:'0',side:'auto',mathLatex:'',mathSource:''}})}><span>{example.name}</span><MathView tex={example.latex}/></button>)}</div></details>
 </section>;
}

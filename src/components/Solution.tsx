import {useEffect,useRef} from 'react';
import {MathView} from './Math';
import {Graph} from './Graph';
import {Icon} from './Icon';
import type {Result} from '../engine/types';
export function Solution({result}:{result:Result}){
 const ref=useRef<HTMLElement>(null);
 useEffect(()=>{ref.current?.focus({preventScroll:true});ref.current?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.motion==='off'?'instant':'smooth'});},[result]);
 return <article ref={ref} tabIndex={-1} className="solution animate-in" aria-live="polite"><header className="result-header"><div className="eyebrow">LA CONCLUSION</div>{result.method&&<span className="result-method">{result.method==='numeric'?'Approximation numérique':result.method==='unchanged'?'Aucune transformation supplémentaire':result.method==='analysis'?'Analyse de la fonction':'Calcul exact'}</span>}<h2>{result.title}</h2><MathView tex={result.latex}/>{result.approximate&&<p className="approximation">Valeur approchée : {result.approximate}</p>}</header>
 <div className="section-heading"><h3>Comprendre la méthode</h3><span>{result.steps.length} étapes</span></div><ol className="steps">{result.steps.map((step,i)=><li key={i}><span className="step-number">{String(i+1).padStart(2,'0')}</span><div><h4>{step.title}</h4><p>{step.text}</p>{step.latex&&<MathView tex={step.latex}/>}</div></li>)}</ol>
 {result.table&&<div className="table-wrap" tabIndex={0} aria-label="Tableau du résultat"><table><thead><tr>{result.table.headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{result.table.rows.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j}>{v}</td>)}</tr>)}</tbody></table></div>}
 {result.plot&&<Graph plot={result.plot}/>}
 {result.notes.map((note,i)=><p className="note" key={i}><Icon name="book"/><span>{note}</span></p>)}
 </article>;
}

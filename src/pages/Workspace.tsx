import {useEffect,useRef,useState} from 'react';
import {tools,selectOptions} from '../data/tools';
import {useStore,update,defaultRequest,remember} from '../store';
import {compute,cancelCalculation} from '../client';
import {Solution} from '../components/Solution';
import {Icon} from '../components/Icon';
import type {Result} from '../engine/types';
export function Workspace(){
 const {draft}=useStore();const [result,setResult]=useState<Result|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[keyboard,setKeyboard]=useState(false);
 const textarea=useRef<HTMLTextAreaElement>(null),generation=useRef(0);const tool=tools.find(t=>t.id===draft.operation)!;
 useEffect(()=>{generation.current++;setResult(null);setError('');setBusy(false);},[draft]);
 useEffect(()=>()=>{generation.current++;},[]);
 const change=(expression:string)=>update({draft:{...draft,expression}});
 const insert=(s:string)=>{const el=textarea.current,start=el?.selectionStart??draft.expression.length,end=el?.selectionEnd??start;change(draft.expression.slice(0,start)+s+draft.expression.slice(end));requestAnimationFrame(()=>{el?.focus();el?.setSelectionRange(start+s.length,end===start?start+s.length:start+s.length);});};
 async function submit(){const id=++generation.current;setBusy(true);setError('');setResult(null);try{const r=await compute(draft);if(id!==generation.current)return;setResult(r);remember(draft);}catch(e){if(id===generation.current)setError(e instanceof Error?e.message:'Le calcul a échoué.');}finally{if(id===generation.current)setBusy(false);}}
 return <div className="workspace animate-in"><header className="page-heading"><div><p className="eyebrow">ATELIER DE RÉSOLUTION</p><h1>À chaque problème,<br/><em>sa méthode.</em></h1></div><p>Choisis ton outil, saisis les données et suis le raisonnement.</p></header>
 <div className="workspace-grid"><aside className="toolbox"><label className="mobile-tool">Outil de calcul<select value={draft.operation} onChange={e=>update({draft:defaultRequest(e.target.value)})}>{tools.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><div className="tool-list">{['Algèbre','Analyse','Données','Spécialités'].map(group=><div key={group}><p className="tool-group">{group}</p>{tools.filter(t=>t.group===group).map(t=><button key={t.id} className={t.id===draft.operation?'selected':''} aria-pressed={t.id===draft.operation} onClick={()=>update({draft:defaultRequest(t.id)})}>{t.name}<Icon name="chevron" size={15}/></button>)}</div>)}</div></aside>
 <div className="work-main"><section className="input-panel"><div className="section-heading"><h2>{tool.name}</h2><span className="label-small">Calcul local</span></div><p>{tool.description}</p>
 <form onSubmit={e=>{e.preventDefault();void submit();}}><label className="expression-label" htmlFor="expression">{tool.label}</label><textarea id="expression" ref={textarea} value={draft.expression} onChange={e=>change(e.target.value)} maxLength={600} spellCheck={false} autoCapitalize="off" autoCorrect="off" rows={['system','matrix','statistics','geometry'].includes(tool.id)?4:2} placeholder={tool.expression} onKeyDown={e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();void submit();}}}/>
 <div className="input-utilities"><button type="button" className="text-button" onClick={()=>setKeyboard(!keyboard)} aria-expanded={keyboard}>Clavier mathématique <span>{keyboard?'−':'+'}</span></button><button type="button" className="text-button muted" onClick={()=>change(tool.expression)}>Exemple</button></div>
 {keyboard&&<div className="math-keyboard">{['x','²','^','(',')','√(','ln(','exp(','sin(','cos(','π','/','+','−','=','≥','≤','i',';'].map(k=><button type="button" key={k} onMouseDown={e=>e.preventDefault()} onClick={()=>insert(k)}>{k}</button>)}</div>}
 {!!tool.fields.length&&<div className="fields">{tool.fields.filter(f=>!(tool.id==='integral'&&draft.params.kind==='primitive'&&['lower','upper'].includes(f.key))).map(f=><label key={f.key}>{f.label}{selectOptions[tool.id]?.[f.key]?<select value={draft.params[f.key]??f.initial} onChange={e=>update({draft:{...draft,params:{...draft.params,[f.key]:e.target.value}}})}>{selectOptions[tool.id][f.key].map(([v,name])=><option value={v} key={v}>{name}</option>)}</select>:<input value={draft.params[f.key]??f.initial} onChange={e=>update({draft:{...draft,params:{...draft.params,[f.key]:e.target.value}}})} maxLength={100}/>} {f.hint&&<small>{f.hint}</small>}</label>)}</div>}
 <div className="submit-row"><button className="button primary" disabled={busy} type="submit">{busy?<><span className="spinner"/>Calcul en cours</>:<>Résoudre <Icon name="arrow"/></>}</button>{busy&&<button type="button" className="text-button" onClick={()=>{generation.current++;cancelCalculation();setBusy(false);}}>Annuler</button>}<span>Ctrl + Entrée pour lancer</span></div>
 </form>{error&&<div className="error" role="alert"><strong>Reprenons cette saisie.</strong><p>{error}</p></div>}
 </section>{result?<Solution result={result}/>:!busy&&<div className="workspace-note"><span className="note-line"/><div><h3>La réponse compte.<br/>Le raisonnement aussi.</h3><p>Les étapes et les conditions de validité apparaîtront ici. Ton énoncé reste enregistré quand tu changes d’écran.</p></div></div>}</div>
 </div></div>;
}

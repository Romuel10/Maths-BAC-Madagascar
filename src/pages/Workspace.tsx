import {useEffect,useRef,useState} from 'react';
import {tools,selectOptions} from '../data/tools';
import {useStore,update,defaultRequest,remember,snapshot} from '../store';
import {compute,cancelCalculation} from '../client';
import {Solution} from '../components/Solution';
import {guideFor,guidedRequest,hasGuidedData} from '../data/guided';
import {DataEntry,ExpressionEditor} from '../components/MathInput';
import {LimitInput} from '../components/LimitInput';
import {Icon} from '../components/Icon';
import {workbenchTool,modelOptions,setParameter,fieldOptions,examples} from '../data/workbench';
import type {Result,Field} from '../engine/types';
export function Workspace(){
 const {draft}=useStore();const [result,setResult]=useState<Result|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const generation=useRef(0);const tool=workbenchTool(draft);const guide=guideFor(draft),guided=!!guide&&hasGuidedData(draft);
 useEffect(()=>{generation.current++;setResult(null);setError('');setBusy(false);},[draft]);
 useEffect(()=>()=>{generation.current++;},[]);
 const change=(expression:string,latex?:string)=>update({draft:{...draft,expression,params:{...draft.params,mathLatex:latex??'',mathSource:latex!==undefined?expression:''}}});
 async function submit(){const request=snapshot().draft,id=++generation.current;setBusy(true);setError('');setResult(null);try{const r=await compute(request);if(id!==generation.current)return;setResult(r);remember(request);}catch(e){if(id===generation.current)setError(e instanceof Error?e.message:'Le calcul a échoué.');}finally{if(id===generation.current)setBusy(false);}}
 const renderField=(f:Field)=>{const options=fieldOptions(draft,f.key)??selectOptions[tool.id]?.[f.key];return <label key={f.key}>{f.label}{options?<select aria-label={f.label} value={draft.params[f.key]??f.initial} onChange={e=>update({draft:setParameter(draft,f.key,e.target.value)})}>{options.map(([v,name])=><option value={v} key={v}>{name}</option>)}</select>:<input aria-label={f.label} value={draft.params[f.key]??f.initial} onChange={e=>update({draft:setParameter(draft,f.key,e.target.value)})} maxLength={100}/>} {f.hint&&<small>{f.hint}</small>}</label>;};
 return <div className="workspace animate-in"><header className="page-heading"><div><p className="eyebrow">ATELIER DE MATHÉMATIQUES</p><h1>Tes formules.<br/><em>Des réponses expliquées.</em></h1></div><p>Fractions, logarithmes, exponentielles : saisis ta formule comme sur ta copie, puis explore le résultat.</p></header>
 <div className="workspace-grid"><aside className="toolbox"><label className="mobile-tool">Quel type de question ?<select value={draft.operation} onChange={e=>update({draft:defaultRequest(e.target.value)})}>{tools.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><div className="tool-list">{['Algèbre','Analyse','Données','Spécialités'].map(group=><div key={group}><p className="tool-group">{group}</p>{tools.filter(t=>t.group===group).map(t=><button key={t.id} className={t.id===draft.operation?'selected':''} aria-pressed={t.id===draft.operation} onClick={()=>update({draft:defaultRequest(t.id)})}>{t.name}<Icon name="chevron" size={15}/></button>)}</div>)}</div></aside>
 <div className="work-main"><section className="input-panel"><div className="section-heading"><h2>{tool.name}</h2><span className="label-small">Calcul local</span></div><p>{tool.description}</p>
 <form onSubmit={e=>{e.preventDefault();void submit();}}>
 {modelOptions[tool.id]&&<label className="model-selector">Modèle de calcul<select aria-label="Modèle de calcul" value={draft.params.model??modelOptions[tool.id]![0][0]} onChange={e=>update({draft:setParameter(draft,'model',e.target.value)})}>{modelOptions[tool.id]!.map(([v,name])=><option value={v} key={v}>{name}</option>)}</select></label>}
 {tool.id==='calculate'&&<div className="fields mode-fields">{tool.fields.filter(f=>f.key==='form').map(renderField)}</div>}
{guide&&<div className="entry-switch" role="group" aria-label="Mode de saisie"><button type="button" aria-pressed={guided} onClick={()=>update({draft:guidedRequest(draft)})}>Renseigner les données</button><button type="button" aria-pressed={!guided} onClick={()=>update({draft:{...draft,params:{...draft.params,entry:'formula'}}})}>Saisir une formule</button></div>}
 {tool.id==='limit'&&<div className="limit-step"><span>1</span><h3>Saisis ta fonction</h3></div>}
 {!(['hypergeometric','counting'].includes(draft.params.model)&&tool.id==='probability')&&(guided&&guide?<DataEntry draft={draft} busy={busy} onChange={request=>update({draft:request})}/>:<ExpressionEditor draft={draft} tool={tool} busy={busy} onChange={change} onSubmit={()=>void submit()} onModeChange={editor=>update({draft:{...draft,params:{...draft.params,editor}}})}/>)}
 {tool.id==='limit'&&<LimitInput draft={draft} busy={busy} onChange={request=>update({draft:request})}/>}
 {tool.id!=='limit'&&!!tool.fields.length&&<div className="fields">{tool.fields.filter(f=>!['rootMin','rootMax','form'].includes(f.key)&&!(tool.id==='calculate'&&f.key==='xvalue'&&draft.params.form!=='evaluate')&&!(tool.id==='integral'&&draft.params.kind!=='definite'&&['lower','upper','method'].includes(f.key))&&!(tool.id==='sequence'&&guided&&f.key==='kind')).map(renderField)}</div>}
 {examples[tool.id]&&<details className="workbench-examples"><summary>Essayer avec un exemple</summary><div>{examples[tool.id]!.map(e=><button type="button" key={e.label} onClick={()=>update({draft:{...draft,expression:e.expression,params:{...draft.params,...e.params,entry:'formula',mathLatex:'',mathSource:''}}})}>{e.label}<Icon name="arrow" size={16}/></button>)}</div></details>}
 <a className="tool-manual-link" href={'#manuel/'+tool.id}>Comment utiliser cet outil ?</a>
 {['equation','calculate'].includes(tool.id)&&<details className="numerical-options"><summary>Intervalle de recherche des équations difficiles</summary><p>Utilisé quand une résolution exacte n’est pas obtenue.</p><div className="fields">{[['rootMin','Chercher à partir de','-10'],['rootMax','Chercher jusqu’à','10']].map(([key,label,initial])=><label key={key}>{label}<input value={draft.params[key]??initial} onChange={e=>update({draft:{...draft,params:{...draft.params,[key]:e.target.value}}})} maxLength={45}/></label>)}</div></details>}
 <div className="submit-row"><button className="button primary" disabled={busy} type="submit">{busy?<><span className="spinner"/>Calcul en cours</>:<>Résoudre <Icon name="arrow"/></>}</button>{busy&&<button type="button" className="text-button" onClick={()=>{generation.current++;cancelCalculation();setBusy(false);}}>Annuler</button>}<span>La réponse sera suivie des étapes.</span></div>
 </form>{error&&<div className="error" role="alert"><strong>Reprenons cette saisie.</strong><p>{error}</p></div>}
 </section>{result?<><Solution result={result}/>{result.method==='unchanged'&&<button className="button secondary evaluate-action" type="button" onClick={()=>{update({draft:{...draft,params:{...draft.params,form:'evaluate'}}});document.querySelector('.input-panel')?.scrollIntoView({block:'start'});}}>Calculer cette expression pour une valeur de x</button>}</>:!busy&&<div className="workspace-note"><span className="note-line"/><div><h3>La réponse compte.<br/>Le raisonnement aussi.</h3><p>Le résultat, les étapes du calcul et les conditions de validité apparaîtront ici. Tes données restent enregistrées quand tu changes d’écran.</p></div></div>}</div>
 </div></div>;
}

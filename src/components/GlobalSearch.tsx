import { useMemo, useState } from 'react';
import { BAC_SUBJECTS, flattenQuestions, type BacTopic } from '../data/bacSubjects';
import { LEARNING_CHAPTERS, type FormulaItem } from '../data/learningCatalog';
import { MathExpression, MathText } from './MathNotation';

type SearchItem=
 | {id:string;kind:'chapter';title:string;copy:string;topic:BacTopic}
 | {id:string;kind:'lesson';title:string;copy:string;topic:BacTopic}
 | {id:string;kind:'formula';title:string;copy:string;topic:BacTopic;formula:FormulaItem}
 | {id:string;kind:'exercise';title:string;copy:string;topic:BacTopic;prompt:string;expression?:string};

interface Props{
 onClose:()=>void;
 onOpenTopic:(topic:BacTopic)=>void;
 onOpenQuestion:(prompt:string)=>void;
 onAnalyzeFunction:(expression:string)=>void;
}

function normalize(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}

export function GlobalSearch({onClose,onOpenTopic,onOpenQuestion,onAnalyzeFunction}:Props){
 const [query,setQuery]=useState('');const [selected,setSelected]=useState<SearchItem|null>(null);
 const items=useMemo<SearchItem[]>(()=>[
  ...LEARNING_CHAPTERS.map(chapter=>({id:`chapter-${chapter.topic}`,kind:'chapter' as const,title:chapter.title,copy:`${chapter.summary} ${chapter.objectives.join(' ')}`,topic:chapter.topic})),
  ...LEARNING_CHAPTERS.flatMap(chapter=>chapter.lessonSections.map((lesson,index)=>({id:`lesson-${chapter.topic}-${index}`,kind:'lesson' as const,title:`${chapter.topic} · ${lesson.title}`,copy:`${lesson.explanation} ${lesson.keyPoints.join(' ')}`,topic:chapter.topic}))),
  ...LEARNING_CHAPTERS.flatMap(chapter=>chapter.formulas.map(formula=>({id:`formula-${formula.id}`,kind:'formula' as const,title:formula.title,copy:`${formula.meaning} ${formula.expression} ${formula.example}`,topic:chapter.topic,formula}))),
  ...BAC_SUBJECTS.flatMap(subject=>flattenQuestions(subject).map(question=>({id:`exercise-${subject.id}-${question.id}`,kind:'exercise' as const,title:`${question.topic} · ${subject.series} · ${question.number}`,copy:question.prompt,topic:question.topic,prompt:question.prompt,expression:question.toolExpression})))
 ],[]);
 const terms=normalize(query).split(/\s+/).filter(Boolean);
 const results=useMemo(()=>terms.length?items.filter(item=>{const haystack=normalize(`${item.title} ${item.copy} ${item.topic}`);return terms.every(term=>haystack.includes(term));}).slice(0,30):items.slice(0,12),[items,terms]);

 return <div className="space-y-3"><div className="flex items-center justify-between gap-3"><div><p className="eyebrow">Recherche globale</p><h2 className="page-title">Trouver rapidement</h2></div><button onClick={onClose} className="btn btn-small btn-secondary" aria-label="Fermer la recherche">Fermer</button></div><label className="sr-only" htmlFor="global-search">Rechercher dans l’application</label><input autoFocus id="global-search" value={query} onChange={event=>{setQuery(event.target.value);setSelected(null)}} className="field" placeholder="Chapitre, formule, exercice, mot-clé…"/>
  {selected?<section className="paper-card p-4"><button onClick={()=>setSelected(null)} className="btn btn-small btn-secondary">← Résultats</button><span className="chip chip-info ml-2">{selected.topic}</span><h3 className="page-title mt-3">{selected.title}</h3>{selected.kind==='formula'?<><div className="formula-strip mt-3 overflow-x-auto"><MathExpression value={selected.formula.expression}/></div><p className="page-copy">{selected.formula.meaning}</p><p className="page-copy">Exemple : <MathExpression value={selected.formula.example}/></p><button onClick={()=>onOpenTopic(selected.topic)} className="btn btn-primary w-full mt-3">Ouvrir le parcours {selected.topic}</button></>:selected.kind==='exercise'?<><div className="surface-flat p-3 mt-3"><MathText>{selected.prompt}</MathText></div><button onClick={()=>onOpenQuestion(selected.prompt)} className="btn btn-primary w-full mt-3">Travailler avec Résoudre</button>{selected.expression&&<button onClick={()=>onAnalyzeFunction(selected.expression!)} className="btn btn-secondary w-full mt-2">Analyser la fonction associée</button>}</>:<><p className="page-copy">{selected.copy}</p><button onClick={()=>onOpenTopic(selected.topic)} className="btn btn-primary w-full mt-3">Ouvrir ce parcours</button></>}</section>:<section><div className="flex justify-between gap-2"><p className="section-title">{query?`${results.length} résultat${results.length>1?'s':''}`:'Suggestions'}</p><span className="chip">Hors connexion</span></div>{results.length===0?<div className="notice notice-warning mt-3">Aucun résultat. Essaie un chapitre ou un mot plus court.</div>:<div className="space-y-2 mt-3">{results.map(item=><button key={item.id} onClick={()=>setSelected(item)} className="surface p-3 w-full text-left flex items-center gap-3"><span className="search-kind">{item.kind==='chapter'?'CH':item.kind==='lesson'?'LC':item.kind==='formula'?'ƒ':'EX'}</span><span className="min-w-0"><strong className="text-xs block truncate">{item.title}</strong><small className="section-copy block mt-1 line-clamp-2">{item.copy}</small></span></button>)}</div>}</section>}
 </div>;
}

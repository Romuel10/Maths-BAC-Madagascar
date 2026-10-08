import {useEffect,useRef,useState} from 'react';
import {lessons} from '../data/lessons';
import {exercises,type Exercise} from '../data/exercises';
import {useStore,update,defaultRequest,snapshot} from '../store';
import {checkAnswer} from '../client';
import {MathView} from '../components/Math';
import {Icon} from '../components/Icon';
import type {Operation} from '../engine/types';
const programme='https://www.education.gov.mg/wp-content/uploads/2024/09/';
export function Practice({chapter,go}:{chapter?:string;go:(page:string)=>void}){
 const state=useStore();const [tab,setTab]=useState('exercises'),[filter,setFilter]=useState(chapter??'all'),[active,setActive]=useState<string|null>(null);
 const allowed=lessons.filter(l=>l.series.includes(state.series));
 const available=exercises.filter(e=>allowed.some(l=>l.id===e.chapter));
 const current=available.find(e=>e.id===active);
 useEffect(()=>{setFilter(chapter??'all');setActive(null);},[chapter,state.series]);
 if(state.exam&&!state.exam.finished)return <ExamSession go={go}/>;
 if(current)return <ExercisePage key={current.id} exercise={current} back={()=>setActive(null)}/>;
 return <div className="animate-in"><header className="page-heading"><div><p className="eyebrow">PRÉPARATION AU BACCALAURÉAT</p><h1>La confiance vient<br/>en <em>pratiquant.</em></h1></div><p>Résous, vérifie, reprends la méthode. Les exercices d’entraînement restent disponibles sans connexion.</p></header>
 <div className="tabs" role="tablist" aria-label="Contenu bac">{[['exercises','Entraînement'],['statement','Mon sujet'],['sources','Annales & programmes']].map(([v,n])=><button key={v} role="tab" aria-selected={tab===v} onClick={()=>setTab(v)}>{n}</button>)}</div>
 {tab==='exercises'&&<><section className="exam-banner"><div><p className="eyebrow">EN CONDITIONS CHRONOMÉTRÉES</p><h2>Un pas de plus vers le bac.</h2><p>8 questions · 24 minutes · correction à la fin<br/>Sujet d’entraînement original, adapté à la série {state.series}.</p></div><button className="button primary" onClick={()=>{const mixed=available.filter((_,i)=>i%2===0).slice(0,8);update({exam:{ids:mixed.map(e=>e.id),answers:{},started:Date.now(),duration:24*60,finished:false}});}}><Icon name="clock"/>Commencer une session</button></section>
 {state.exam?.finished&&<div className="notice">Dernière session : {state.exam.score??0}/{state.exam.ids.length} réponses correctes. Les explications sont accessibles dans les exercices ci-dessous.</div>}
 <div className="catalog-heading"><h2>Exercices ciblés</h2><label>Chapitre<select aria-label="Filtrer les exercices" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Tous les chapitres</option>{allowed.map(l=><option key={l.id} value={l.id}>{l.title}</option>)}</select></label></div>
 <div className="exercise-grid">{available.filter(e=>filter==='all'||e.chapter===filter).map(e=><button className="exercise-card" key={e.id} onClick={()=>setActive(e.id)}><span className="eyebrow">{lessons.find(l=>l.id===e.chapter)?.title}</span><h3>{e.question}</h3><MathView tex={e.formula}/><div><span>{state.attempts.some(a=>a.id===e.id&&a.correct)?'Déjà réussi':e.minutes+' minutes'}</span><Icon name="arrow"/></div></button>)}</div></>}
 {tab==='statement'&&<Statement go={go}/>}
 {tab==='sources'&&<section className="sources-panel"><h2>Travailler à partir de vrais sujets</h2><p>Les exercices inclus sont des créations pédagogiques, pas des reproductions d’annales officielles. Ces ressources externes donnent accès aux sujets et aux références du programme ; elles demandent une connexion.</p><div className="source-links">
 <a href="https://mediatheque.accesmad.org/educmad/course/view.php?id=817" target="_blank" rel="noreferrer"><span><strong>Annales — série A</strong><small>Médiathèque éducative ACCESMAD</small></span><Icon name="external"/></a>
 <a href="https://mediatheque.accesmad.org/educmad/course/view.php?id=129" target="_blank" rel="noreferrer"><span><strong>Annales — série C</strong><small>Médiathèque éducative ACCESMAD</small></span><Icon name="external"/></a>
 <a href="https://mediatheque.accesmad.org/educmad/course/view.php?id=816" target="_blank" rel="noreferrer"><span><strong>Annales — série D</strong><small>Médiathèque éducative ACCESMAD</small></span><Icon name="external"/></a>
 {['L','OSE','S'].map(s=><a key={s} href={programme+'RAPE-T12-'+s+'_2024_2025.pdf'} target="_blank" rel="noreferrer"><span><strong>Programme — terminale {s}</strong><small>Ministère de l’Éducation nationale · édition 2024</small></span><Icon name="external"/></a>)}
 <a href="https://www.education.gov.mg/systeme-educatif/lycee/" target="_blank" rel="noreferrer"><span><strong>Programmes du lycée</strong><small>Ministère de l’Éducation nationale</small></span><Icon name="external"/></a>
 </div><p className="note">Le cours de ton établissement et les consignes de ton professeur restent les références pour la progression annuelle et les méthodes attendues.</p></section>}
 </div>;
}
function ExercisePage({exercise:e,back}:{exercise:Exercise;back:()=>void}){
 const [answer,setAnswer]=useState(''),[hint,setHint]=useState(false),[checked,setChecked]=useState<boolean|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[revealed,setRevealed]=useState(false);const seq=useRef(0);
 useEffect(()=>()=>{seq.current++;},[]);
 async function verify(){const id=++seq.current;setBusy(true);setError('');try{const correct=await checkAnswer(answer,e.answer);if(id!==seq.current)return;setChecked(correct);update(s=>({attempts:[...s.attempts,{id:e.id,correct,assisted:hint||revealed,date:new Date().toISOString()}].slice(-1000)}));}catch(err){if(id===seq.current)setError(String(err).replace(/^Error: /,''));}finally{if(id===seq.current)setBusy(false);}}
 return <div className="exercise-page animate-in"><button className="text-button" onClick={back}><Icon name="back"/>Tous les exercices</button><div className="eyebrow">{lessons.find(l=>l.id===e.chapter)?.title} · ENTRAÎNEMENT</div><h1>{e.question}</h1><div className="exercise-formula"><MathView tex={e.formula}/></div><form onSubmit={ev=>{ev.preventDefault();void verify();}}><label>Ta réponse<input autoFocus value={answer} onChange={ev=>{seq.current++;setAnswer(ev.target.value);setChecked(null);setBusy(false);}} maxLength={600} placeholder="Une valeur ou une expression, sans « x = »" autoCapitalize="off" spellCheck={false}/></label><div className="action-row"><button className="button primary" disabled={busy||!answer.trim()}>{busy?'Vérification…':'Vérifier ma réponse'}<Icon name="arrow"/></button><button type="button" className="text-button" onClick={()=>setHint(true)}>Un indice</button></div></form>{hint&&<div className="notice"><strong>Indice</strong><p>{e.hint}</p></div>}{checked!==null&&<div className={checked?'feedback correct':'feedback incorrect'} role="status"><strong>{checked?'Réponse correcte.':'Pas encore. Reprends le raisonnement.'}</strong>{checked&&<p>{e.explanation}</p>}</div>}{error&&<div className="error" role="alert">{error}</div>}<details onToggle={ev=>{if(ev.currentTarget.open)setRevealed(true);}}><summary>Voir la correction détaillée</summary><p>{e.explanation}</p><MathView tex={e.answerTex}/><p className="caption">Une réponse obtenue avec la correction est enregistrée comme un essai accompagné.</p></details></div>;
}
function Statement({go}:{go:(page:string)=>void}){
 const {statement}=useStore();const ref=useRef<HTMLTextAreaElement>(null),[error,setError]=useState('');
 function open(operation:Operation){const el=ref.current;let text=el&&el.selectionEnd>el.selectionStart?statement.slice(el.selectionStart,el.selectionEnd):statement;
  text=text.trim().replace(/^(résoudre|calculer|étudier|dériver)\s*:?\s*/i,'').replace(/^f\s*\(x\)\s*=\s*/,'');
  if(!text||text.length>600||text.includes('\n')){setError('Sélectionne uniquement la formule ou l’équation de la question à traiter.');return;}
  update({draft:{...defaultRequest(operation),expression:text}});go('resoudre');
 }
 return <section className="statement-panel"><h2>Un sujet, question par question.</h2><p>Colle ton énoncé ou tes notes. Sélectionne ensuite une formule dans le texte et choisis l’outil adapté. Le cahier conserve l’énoncé complet.</p><label>Énoncé et notes<textarea ref={ref} rows={12} maxLength={20000} value={statement} onChange={e=>update({statement:e.target.value})} placeholder="Exemple : Soit f(x) = x^3 − 3x + 1. Étudier ses variations…"/></label><div className="action-row">{[['equation','Résoudre une équation'],['function','Étudier une fonction'],['derivative','Dériver']].map(([v,label])=><button key={v} className="button secondary" onClick={()=>open(v as Operation)}>{label}<Icon name="arrow"/></button>)}</div>{error&&<p className="error" role="alert">{error}</p>}</section>;
}
function ExamSession({go}:{go:(page:string)=>void}){
 const {exam}=useStore();const [now,setNow]=useState(Date.now()),[busy,setBusy]=useState(false),[error,setError]=useState('');const guard=useRef(false);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 const remaining=Math.max(0,(exam?.duration??0)-Math.floor((now-(exam?.started??now))/1000));
 async function finish(){if(guard.current||!exam)return;guard.current=true;setBusy(true);setError('');const started=exam.started;try{let score=0;const ids=exam.ids,answers=snapshot().exam?.answers??{};for(const id of ids){const e=exercises.find(v=>v.id===id);if(e&&await checkAnswer(answers[id]??'',e.answer))score++;}if(snapshot().exam?.started===started)update({exam:{...snapshot().exam!,score,finished:true}});}catch(e){setError(String(e).replace(/^Error: /,''));}finally{guard.current=false;setBusy(false);}}
 useEffect(()=>{if(remaining===0&&!guard.current&&!error)void finish();},[remaining,error]);
 if(!exam)return null;
 return <div className="exam-session animate-in"><header className="section-heading"><div><p className="eyebrow">SUJET D’ENTRAÎNEMENT</p><h1>À toi de jouer.</h1></div><div className={'timer '+(remaining<120?'urgent':'')}><Icon name="clock"/>{String(Math.floor(remaining/60)).padStart(2,'0')}:{String(remaining%60).padStart(2,'0')}</div></header><p>Les réponses sont sauvegardées à chaque frappe. Tu peux quitter l’écran ; le chronomètre continue.</p>{exam.ids.map((id,i)=>{const e=exercises.find(v=>v.id===id);if(!e)return null;return <section className="exam-question" key={id}><div className="eyebrow">QUESTION {i+1}</div><h3>{e.question}</h3><MathView tex={e.formula}/><label>Réponse {i+1}<input value={exam.answers[id]??''} disabled={busy||remaining===0} maxLength={600} onChange={ev=>update(s=>({exam:s.exam?{...s.exam,answers:{...s.exam.answers,[id]:ev.target.value}}:null}))}/></label></section>;})}<div className="action-row"><button className="button primary" disabled={busy} onClick={()=>void finish()}>{busy?'Correction en cours…':'Terminer et corriger'}<Icon name="check"/></button><button className="text-button" onClick={()=>go('accueil')}>Revenir à l’accueil</button></div>{error&&<p role="alert" className="error">{error}</p>}</div>;
}

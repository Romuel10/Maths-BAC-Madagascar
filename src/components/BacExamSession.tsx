import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BacSubject, BacTopic } from '../data/bacSubjects';
import { flattenQuestions, subjectMaxPoints } from '../data/bacSubjects';
import { checkAnswer } from '../lib/bacAnswer';
import { recordExam } from '../lib/bacProgress';
import { recordLearningAttempt, recordMistake } from '../lib/learningStore';
import { storageJsonGet, storageJsonSet, storageRemove } from '../lib/safeStorage';
import { MathText } from './MathNotation';
import { MiniKeyboard } from './MiniKeyboard';

interface Props { subject: BacSubject; onExit: () => void }
type ExamState = 'intro' | 'running' | 'finished';

interface Draft {
 answers: Record<string, string>;
 flags: string[];
 secondsLeft: number;
 index: number;
 startedAt: string;
 endsAt?: number;
 timeSpent:Record<string,number>;
}

interface ExamResult {
 score:number;
 note20:number;
 detail:Array<{id:string;correct:boolean;scoreRatio:number;points:number;topic:BacTopic;message:string;seconds:number}>;
 byTopic:Array<{topic:BacTopic;score:number;max:number}>;
}

function draftKey(subjectId: string) { return `mathbac_exam_v60_${subjectId}`; }
function legacyDraftKey(subjectId:string){return `mathbac_exam_v39_${subjectId}`;}
function formatScore(value:number){return Number.isInteger(value)?String(value):value.toFixed(2).replace(/0+$/,'').replace(/\.$/,'');}

function readDraft(subjectId:string):Draft|null{
 const saved=storageJsonGet<Partial<Draft>|null>(draftKey(subjectId),null)
  ||storageJsonGet<Partial<Draft>|null>(legacyDraftKey(subjectId),null);
 if(!saved||typeof saved!=='object')return null;
 const answers=typeof saved.answers==='object'&&saved.answers!==null?saved.answers as Record<string,string>:{};
 return {
  answers:Object.fromEntries(Object.entries(answers).filter(([,value])=>typeof value==='string').map(([id,value])=>[id,value.slice(0,10000)])),
  flags:Array.isArray(saved.flags)?saved.flags.filter((id):id is string=>typeof id==='string').slice(0,500):[],
  secondsLeft:Number.isFinite(saved.secondsLeft)?Math.max(0,Number(saved.secondsLeft)):0,
  index:Number.isInteger(saved.index)?Number(saved.index):0,
  startedAt:typeof saved.startedAt==='string'?saved.startedAt:'',
  endsAt:Number.isFinite(saved.endsAt)?Number(saved.endsAt):undefined,
  timeSpent:typeof saved.timeSpent==='object'&&saved.timeSpent!==null?Object.fromEntries(Object.entries(saved.timeSpent).filter(([,value])=>Number.isFinite(value)).map(([id,value])=>[id,Math.max(0,Number(value))])):{},
 };
}

export function BacExamSession({ subject, onExit }: Props) {
 const questions = useMemo(() => flattenQuestions(subject), [subject]);
 const max = subjectMaxPoints(subject);
 const savedDraft = useMemo(() => readDraft(subject.id), [subject.id]);
 const [state, setState] = useState<ExamState>('intro');
 const [secondsLeft, setSecondsLeft] = useState(subject.durationMinutes * 60);
 const [answers, setAnswers] = useState<Record<string, string>>({});
 const [flags, setFlags] = useState<string[]>([]);
 const [index, setIndex] = useState(0);
 const [startedAt, setStartedAt] = useState('');
 const [endsAt,setEndsAt]=useState<number|null>(null);
 const [result, setResult] = useState<ExamResult | null>(null);
 const finishingRef=useRef(false);
 const timeSpentRef=useRef<Record<string,number>>({});
 const [saveError,setSaveError]=useState(false);
 const draftRef=useRef({state,answers,flags,secondsLeft,index,startedAt,endsAt});
 draftRef.current={state,answers,flags,secondsLeft,index,startedAt,endsAt};
 const persistDraft=useCallback(()=>{
  const current=draftRef.current;
  if(current.state!=='running'||current.endsAt===null||finishingRef.current)return true;
  return storageJsonSet(draftKey(subject.id),{answers:current.answers,flags:current.flags,secondsLeft:Math.max(0,Math.ceil((current.endsAt-Date.now())/1000)),index:current.index,startedAt:current.startedAt,endsAt:current.endsAt,timeSpent:timeSpentRef.current} satisfies Draft);
 },[subject.id]);
 useEffect(()=>{
  const onHidden=()=>{if(document.visibilityState==='hidden')persistDraft();};
  window.addEventListener('pagehide',persistDraft);document.addEventListener('visibilitychange',onHidden);
  return()=>{persistDraft();window.removeEventListener('pagehide',persistDraft);document.removeEventListener('visibilitychange',onHidden);};
 },[persistDraft]);

 const finishExam=useCallback((automatic=false)=>{
  if(finishingRef.current)return;
  if(!automatic){
   const unanswered=questions.filter(question=>!(answers[question.id]||'').trim()).length;
   const detail=unanswered?` Il reste ${unanswered} question${unanswered>1?'s':''} sans réponse.`:'';
   if(!window.confirm(`Rendre cette simulation maintenant ?${detail}`))return;
  }
  finishingRef.current=true;
  let score=0;
  const topicMap=new Map<BacTopic,{score:number;max:number}>();
  const detail=questions.map(question=>{
   const checked=checkAnswer(answers[question.id]||'',question.check);
   const points=Math.round(question.points*checked.scoreRatio*100)/100;
   score+=points;
   const topic=topicMap.get(question.topic)||{score:0,max:0};
   topic.score+=points;topic.max+=question.points;topicMap.set(question.topic,topic);
   recordLearningAttempt(subject.id,question.id,checked.correct);
   if(!checked.correct)recordMistake({subjectId:subject.id,questionId:question.id,topic:question.topic,code:'exam-answer',title:`Examen · ${question.topic}`,message:`${question.prompt} ${checked.message}`});
   return{id:question.id,correct:checked.correct,scoreRatio:checked.scoreRatio,points,topic:question.topic,message:checked.message,seconds:timeSpentRef.current[question.id]||0};
  });
  score=Math.round(score*100)/100;
  const note20=max?Math.round((score/max)*200)/10:0;
  setResult({score,note20,detail,byTopic:[...topicMap.entries()].map(([topic,value])=>({topic,...value}))});
  recordExam(subject.id,score,max);
  storageRemove(draftKey(subject.id));storageRemove(legacyDraftKey(subject.id));
  setState('finished');setEndsAt(null);
  window.scrollTo({top:0,behavior:'smooth'});
 },[answers,max,questions,subject.id]);

 useEffect(()=>{
  const activeQuestion=questions[index];if(state!=='running'||!activeQuestion)return;
  const timer=window.setInterval(()=>{timeSpentRef.current[activeQuestion.id]=(timeSpentRef.current[activeQuestion.id]||0)+1;},1000);
  return()=>window.clearInterval(timer);
 },[index,questions,state]);

 useEffect(()=>{
  if(state!=='running'||endsAt===null)return;
  const update=()=>setSecondsLeft(Math.max(0,Math.ceil((endsAt-Date.now())/1000)));
  update();
  const timer=window.setInterval(update,1000);
  document.addEventListener('visibilitychange',update);
  return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',update);};
 },[endsAt,state]);

 const timerCheckpoint=Math.floor(secondsLeft/15);
 useEffect(()=>{
  if(state!=='running'||endsAt===null)return;
  const timer=window.setTimeout(()=>setSaveError(!persistDraft()),400);
  return()=>window.clearTimeout(timer);
 },[answers,endsAt,flags,index,startedAt,state,subject.id,timerCheckpoint,persistDraft]);

 useEffect(()=>{
  if(state==='running'&&secondsLeft===0)finishExam(true);
 },[finishExam,secondsLeft,state]);

 const startNew=()=>{
  const now=Date.now();finishingRef.current=false;
  timeSpentRef.current={};
  setAnswers({});setFlags([]);setIndex(0);setSecondsLeft(subject.durationMinutes*60);
  setStartedAt(new Date(now).toISOString());setEndsAt(now+subject.durationMinutes*60_000);
  setResult(null);setState('running');
 };

 const resume=()=>{
  if(!savedDraft)return startNew();
  const legacyRemaining=Math.max(1,savedDraft.secondsLeft||subject.durationMinutes*60);
  const end=savedDraft.endsAt??Date.now()+legacyRemaining*1000;
  finishingRef.current=false;
  timeSpentRef.current=savedDraft.timeSpent;
  setAnswers(savedDraft.answers);setFlags(savedDraft.flags);
  setIndex(Math.min(questions.length-1,Math.max(0,savedDraft.index)));
  setSecondsLeft(Math.max(0,Math.ceil((end-Date.now())/1000)));
  setStartedAt(savedDraft.startedAt||new Date().toISOString());setEndsAt(end);
  setResult(null);setState('running');
 };

 const formatTime=(seconds:number)=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
 const q=questions[index];
 const answeredCount=questions.filter(question=>(answers[question.id]||'').trim()).length;
 const savedSeconds=savedDraft?(savedDraft.endsAt?Math.max(0,Math.ceil((savedDraft.endsAt-Date.now())/1000)):savedDraft.secondsLeft):0;

 if(state==='intro'){
  return <div className="space-y-3 page-enter">
   <button onClick={onExit} className="btn btn-secondary btn-small">← Retour</button>
   <section className="paper-card p-5 text-center">
    <span className="chip chip-brand">V7 · Simulation chronométrée</span>
    <h2 className="page-title mt-4">Série {subject.series}</h2>
    <p className="text-sm font-extrabold text-brand mt-1">{subject.title}</p>
    <div className="grid grid-cols-3 gap-2 mt-5"><div className="stat-card"><p className="stat-value">{subject.durationMinutes}</p><p className="stat-label">minutes</p></div><div className="stat-card"><p className="stat-value">{questions.length}</p><p className="stat-label">questions</p></div><div className="stat-card"><p className="stat-value">{max}</p><p className="stat-label">points</p></div></div>
    <div className="notice notice-warning text-left mt-4"><p className="font-bold">Entraînement, pas une épreuve officielle</p><p className="mt-1">Le corpus est original et plus court qu’un sujet complet. Aucun indice n’apparaît pendant la simulation. Le brouillon est sauvegardé périodiquement sur cet appareil.</p></div>
    {savedDraft&&savedSeconds>0&&<button onClick={resume} className="btn btn-secondary w-full mt-4">Reprendre la simulation · {formatTime(savedSeconds)}</button>}
    <button onClick={startNew} className="btn btn-primary w-full mt-2">{savedDraft?'Recommencer une nouvelle simulation':'Commencer la simulation'}</button>
   </section>
  </div>;
 }

 if(state==='running'&&q){
  const flagged=flags.includes(q.id);
  return <div className="space-y-3 page-enter">
   <div className="exam-sticky-bar"><button onClick={()=>{if(window.confirm('Quitter ? Le brouillon restera sauvegardé.')){if(persistDraft())onExit();else setSaveError(true);}}} className="btn btn-small btn-secondary">Quitter</button><div className="text-center" aria-live="polite"><p className={`text-xl font-black ${secondsLeft<600?'text-danger':'text-brand'}`}>{formatTime(secondsLeft)}</p><p className="text-[0.5rem] muted">{answeredCount}/{questions.length} répondues</p></div><button onClick={()=>finishExam(false)} className="btn btn-small btn-primary">Rendre</button></div>

   {saveError&&<div className="notice notice-warning" role="alert">Le brouillon n’a pas pu être sauvegardé. Libère de l’espace sur l’appareil avant de quitter.</div>}
   <section className="surface p-3"><div className="exam-question-grid">{questions.map((item,i)=>{const answered=Boolean((answers[item.id]||'').trim());const flaggedQuestion=flags.includes(item.id);return <button aria-label={`Question ${i+1}${answered?', répondue':''}${flaggedQuestion?', à revoir':''}`} aria-current={index===i?'step':undefined} key={item.id} onClick={()=>setIndex(i)} className={`exam-q-dot ${index===i?'active':''} ${answered?'answered':''} ${flaggedQuestion?'flagged':''}`}>{i+1}</button>;})}</div><p className="text-[0.5rem] muted mt-2">Remplie = répondue · orange = à revoir.</p></section>

   <section className="paper-card p-4">
    <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Question {index+1}/{questions.length}</p><h3 className="section-title mt-2">{q.topic} · {q.points} pt{q.points>1?'s':''}</h3></div><button onClick={()=>setFlags(value=>flagged?value.filter(id=>id!==q.id):[...value,q.id])} className={`chip ${flagged?'chip-warning':''}`}>{flagged?'À revoir':'Marquer'}</button></div>
    <div className="surface-flat p-3 mt-3"><p className="text-sm font-semibold leading-relaxed text-main"><MathText>{q.prompt}</MathText></p></div>
    <div className="mt-4"><MiniKeyboard value={answers[q.id]||''} onChange={value=>setAnswers(previous=>({...previous,[q.id]:value.slice(0,10000)}))} label="Ma réponse" placeholder="Écris ta réponse…" /></div>
   </section>

   <div className="grid grid-cols-2 gap-2"><button disabled={index===0} onClick={()=>setIndex(value=>Math.max(0,value-1))} className="btn btn-secondary">← Précédente</button><button disabled={index===questions.length-1} onClick={()=>setIndex(value=>Math.min(questions.length-1,value+1))} className="btn btn-primary">Suivante →</button></div>
  </div>;
 }

 return <div className="space-y-4 page-enter">
  <section className="paper-card p-5 text-center"><span className="chip chip-success">Simulation terminée</span><p className="text-5xl font-black text-brand mt-4">{result?.note20??0}<span className="text-lg">/20</span></p><p className="section-copy mt-2">{formatScore(result?.score??0)}/{formatScore(max)} points obtenus selon les contrôles automatiques</p><p className="section-copy mt-1">Les réponses rédigées restent à comparer avec la correction et avec l’avis d’un enseignant.</p></section>

  <section className="surface p-4"><p className="eyebrow">Analyse de la copie</p><h3 className="section-title mt-2">Résultat par chapitre</h3><div className="space-y-3 mt-3">{result?.byTopic.map(topic=>{const percent=topic.max?Math.round(topic.score/topic.max*100):0;return <div key={topic.topic}><div className="flex justify-between text-[0.625rem]"><strong>{topic.topic}</strong><span>{formatScore(topic.score)}/{formatScore(topic.max)} · {percent}%</span></div><div className="progress-track mt-1"><div className="progress-fill" style={{width:`${percent}%`}}/></div></div>;})}</div></section>

  <section className="surface p-4"><p className="eyebrow">Correction</p><h3 className="section-title mt-2">Question par question</h3><div className="space-y-3 mt-3">{questions.map((item,i)=>{const detail=result?.detail.find(value=>value.id===item.id);const partial=Boolean(detail&&detail.scoreRatio>0&&!detail.correct);return <details key={item.id} className="surface-flat p-3"><summary className="cursor-pointer flex items-center justify-between gap-2"><span className="font-bold text-[0.625rem]">{i+1}. {item.topic} · {formatTime(detail?.seconds||0)}</span><span className={`chip ${detail?.correct?'chip-success':partial?'chip-info':'chip-warning'}`}>{detail?.correct?'Correct':partial?'Partiel':'À revoir'} · {formatScore(detail?.points??0)}/{formatScore(item.points)}</span></summary><div className="mt-3 text-xs"><p><MathText>{item.prompt}</MathText></p><p className="mt-2 muted">Ta réponse : {answers[item.id]||'—'}</p>{detail&&<p className="notice notice-info mt-2">{detail.message}</p>}<p className="mt-2 font-bold">Méthode :</p><ol className="mt-1 space-y-1 list-decimal pl-4">{item.method.map((step,j)=><li key={j}><MathText>{step}</MathText></li>)}</ol><p className="mt-2 font-bold text-success">Réponse : <MathText>{item.finalAnswer}</MathText></p></div></details>;})}</div></section>

  <div className="grid grid-cols-2 gap-2"><button onClick={onExit} className="btn btn-secondary">Retour aux sujets</button><button onClick={startNew} className="btn btn-primary">Refaire la simulation</button></div>
 </div>;
}

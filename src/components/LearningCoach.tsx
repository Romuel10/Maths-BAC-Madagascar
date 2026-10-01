import { useEffect, useMemo, useState } from 'react';
import type { BacSeries, BacTopic } from '../data/bacSubjects';
import { LEARNING_CHAPTERS, LEARNING_QUESTIONS, diagnosticQuestions, type LearningQuestion } from '../data/learningCatalog';
import { clearMistakes, getLearningStore, recordMistake, removeMistake } from '../lib/learningStore';
import { getStudentProfile, saveChapterResult, saveDiagnostic, saveQuickSession, setStudentSeries, weakTopics } from '../lib/studentProfile';
import { storageGet, storageRemove } from '../lib/safeStorage';
import { MathExpression, MathText } from './MathNotation';

type Mode='dashboard'|'diagnostic'|'quickSetup'|'quick'|'chapters'|'chapter'|'chapterQuiz'|'mistakes'|'formulas';
type LearningTool='algebra'|'complex'|'probability'|'sequence'|'geometry'|'arithmetic'|'finance';

interface Props{
 onOpenTool?:(tool:LearningTool)=>void;
 onOpenQuestion?:(prompt:string)=>void;
}

function scorePercent(questions:LearningQuestion[],answers:Record<string,number>){
 if(!questions.length)return 0;
 return Math.round(questions.filter(question=>answers[question.id]===question.correctIndex).length/questions.length*100);
}

function recordWrongAnswers(questions:LearningQuestion[],answers:Record<string,number>,source:string){
 for(const question of questions){
  if(answers[question.id]===question.correctIndex)continue;
  recordMistake({topic:question.topic,code:`${source}-${question.id}`,title:`${question.topic} · notion à revoir`,message:`${question.prompt} ${question.explanation}`});
 }
}

function QuestionRunner({questions,title,onFinish,onBack}:{questions:LearningQuestion[];title:string;onFinish:(answers:Record<string,number>)=>void;onBack:()=>void}){
 const [index,setIndex]=useState(0);const [answers,setAnswers]=useState<Record<string,number>>({});
 const question=questions[index];
 if(!question)return <section className="surface p-4"><p>Aucune question disponible.</p><button onClick={onBack} className="btn btn-secondary mt-3">Retour</button></section>;
 const selected=answers[question.id];
 return <div className="space-y-3 page-enter">
  <div className="flex items-center justify-between"><button onClick={onBack} className="btn btn-small btn-secondary">← Retour</button><span className="chip chip-brand">{index+1}/{questions.length}</span></div>
  <section className="paper-card p-4"><p className="eyebrow">{title}</p><h3 className="section-title mt-2">{question.topic} · niveau {question.level}</h3><p className="text-sm font-bold leading-relaxed mt-4" style={{color:'var(--text)'}}>{question.prompt}</p><div className="grid gap-2 mt-4">{question.choices.map((choice,choiceIndex)=><button key={choice} onClick={()=>setAnswers(previous=>({...previous,[question.id]:choiceIndex}))} aria-pressed={selected===choiceIndex} className={`quiz-choice ${selected===choiceIndex?'active':''}`}><span>{String.fromCharCode(65+choiceIndex)}</span>{choice}</button>)}</div></section>
  <div className="grid grid-cols-2 gap-2"><button disabled={index===0} onClick={()=>setIndex(value=>Math.max(0,value-1))} className="btn btn-secondary">← Précédente</button>{index<questions.length-1?<button disabled={selected===undefined} onClick={()=>setIndex(value=>value+1)} className="btn btn-primary">Suivante →</button>:<button disabled={Object.keys(answers).length<questions.length} onClick={()=>onFinish(answers)} className="btn btn-primary">Voir mon résultat</button>}</div>
 </div>;
}

export function LearningCoach({onOpenTool,onOpenQuestion}:Props){
 const [version,setVersion]=useState(0);
 const [mode,setMode]=useState<Mode>('dashboard');
 const [selectedTopic,setSelectedTopic]=useState<BacTopic>('Analyse');
 const [lastScore,setLastScore]=useState<number|null>(null);
 const [formulaQuery,setFormulaQuery]=useState('');
 const [quickSeed,setQuickSeed]=useState(0);
 const [quickMinutes,setQuickMinutes]=useState<5|10|20>(10);
 const [changingSeries,setChangingSeries]=useState(false);
 const profile=useMemo(()=>getStudentProfile(),[version]);
 const learning=useMemo(()=>getLearningStore(),[version]);
 const chapters=useMemo(()=>{const series=profile.series;return LEARNING_CHAPTERS.filter(chapter=>!series||chapter.series.includes(series));},[profile.series]);
 const diagnostic=useMemo(()=>profile.series?diagnosticQuestions(profile.series):[],[profile.series]);
 const weak=useMemo(()=>weakTopics(profile),[profile]);
 const selectedChapter=LEARNING_CHAPTERS.find(chapter=>chapter.topic===selectedTopic);

 const quickQuestions=useMemo(()=>{
  const series=profile.series;if(!series)return[];
  const pool=LEARNING_QUESTIONS.filter(question=>question.series.includes(series)).sort((a,b)=>{
   const ai=weak.indexOf(a.topic),bi=weak.indexOf(b.topic);return(ai<0?999:ai)-(bi<0?999:bi)||a.level-b.level;
  });
  if(!pool.length)return[];
  const offset=quickSeed%pool.length;
  const wanted=quickMinutes===5?3:quickMinutes===10?5:10;
  return [...pool.slice(offset),...pool.slice(0,offset)].slice(0,Math.min(wanted,pool.length));
 },[profile.series,quickMinutes,quickSeed,weak]);

 useEffect(()=>{
  const refresh=()=>setVersion(value=>value+1);
  window.addEventListener('mathbac-student-profile',refresh);window.addEventListener('mathbac-learning',refresh);
  return()=>{window.removeEventListener('mathbac-student-profile',refresh);window.removeEventListener('mathbac-learning',refresh);};
 },[]);

 useEffect(()=>{
  const requested=storageGet('mathbac_learning_open');
  const chapter=LEARNING_CHAPTERS.find(item=>item.topic===requested);
  if(chapter){setSelectedTopic(chapter.topic);setMode('chapter');storageRemove('mathbac_learning_open');}
 },[]);

 const returnDashboard=()=>{setMode('dashboard');setLastScore(null);};
 const finishDiagnostic=(answers:Record<string,number>)=>{const result=saveDiagnostic(diagnostic,answers);recordWrongAnswers(diagnostic,answers,'diagnostic');setLastScore(Math.round(result.totalCorrect/result.total*100));setMode('dashboard');};
 const finishQuick=(answers:Record<string,number>)=>{const score=scorePercent(quickQuestions,answers);saveQuickSession(quickQuestions,answers);recordWrongAnswers(quickQuestions,answers,'rapide');setLastScore(score);setQuickSeed(value=>value+5);setMode('dashboard');};
 const chapterQuestions=LEARNING_QUESTIONS.filter(question=>question.topic===selectedTopic&&(!profile.series||question.series.includes(profile.series)));
 const finishChapter=(answers:Record<string,number>)=>{const score=scorePercent(chapterQuestions,answers);saveChapterResult(selectedTopic,score);recordWrongAnswers(chapterQuestions,answers,'chapitre');setLastScore(score);setMode('chapter');};

 if(!profile.series){
  return <section className="paper-card p-5 page-enter"><p className="eyebrow">Profil BAC</p><h2 className="page-title">Choisis ta série</h2><p className="page-copy">L’application adaptera les chapitres, le diagnostic et les révisions. Ce choix reste modifiable.</p><div className="grid grid-cols-3 gap-2 mt-5">{(['A','C','D','S'] as BacSeries[]).map(series=><button key={series} onClick={()=>setStudentSeries(series)} className="series-choice"><strong>{series}</strong><small>Série {series}</small></button>)}</div></section>;
 }

 if(mode==='diagnostic')return <QuestionRunner questions={diagnostic} title={`Diagnostic série ${profile.series}`} onFinish={finishDiagnostic} onBack={returnDashboard}/>;
 if(mode==='quickSetup')return <div className="space-y-3 page-enter"><button onClick={returnDashboard} className="btn btn-small btn-secondary">← Retour</button><section className="paper-card p-5"><p className="eyebrow">Révision rapide</p><h2 className="page-title">Combien de temps as-tu ?</h2><p className="page-copy">Les questions prioritaires sont choisies d’abord selon ton diagnostic.</p><div className="grid grid-cols-3 gap-2 mt-5">{([5,10,20] as const).map(minutes=><button key={minutes} onClick={()=>{setQuickMinutes(minutes);setMode('quick')}} className="series-choice"><strong>{minutes}</strong><small>minutes</small></button>)}</div></section></div>;
 if(mode==='quick')return <QuestionRunner questions={quickQuestions} title={`Révision · ${quickMinutes} min`} onFinish={finishQuick} onBack={()=>setMode('quickSetup')}/>;
 if(mode==='chapterQuiz')return <QuestionRunner questions={chapterQuestions} title={`Évaluation · ${selectedTopic}`} onFinish={finishChapter} onBack={()=>setMode('chapter')}/>;

 if(mode==='chapter'&&selectedChapter){
  const progress=profile.chapters[selectedTopic];
  return <div className="space-y-3 page-enter">
   <button onClick={()=>setMode('chapters')} className="btn btn-small btn-secondary">← Chapitres</button>
   <section className="paper-card p-4"><div className="flex justify-between gap-3"><div><p className="eyebrow">Cours complet · mise à jour 2026</p><h2 className="page-title">{selectedChapter.title}</h2></div><span className="chip chip-brand">{chapterQuestions.length} exercices</span></div><p className="page-copy">{selectedChapter.summary}</p>{progress&&<div className="notice notice-success mt-3">Meilleur résultat : <strong>{progress.bestPercent}%</strong> · {progress.attempts} tentative{progress.attempts>1?'s':''}</div>}<p className="font-black text-brand mt-4">Objectifs</p><ul className="mt-2 space-y-1 text-xs">{selectedChapter.objectives.map(item=><li key={item}>• {item}</li>)}</ul></section>
   <section className="surface p-4"><p className="eyebrow">Notions à connaître</p><div className="space-y-2 mt-3">{selectedChapter.definitions.map(definition=><p key={definition} className="surface-flat p-3 text-xs leading-relaxed">{definition}</p>)}</div></section>
   <section className="surface p-4"><p className="eyebrow">Leçon structurée</p><div className="space-y-2 mt-3">{selectedChapter.lessonSections.map((lesson,index)=><details key={lesson.title} className="surface-flat p-3" open={index===0}><summary className="cursor-pointer font-black text-xs">{index+1}. {lesson.title}</summary><p className="section-copy mt-2">{lesson.explanation}</p><ul className="space-y-1 mt-2">{lesson.keyPoints.map(point=><li key={point} className="section-copy">✓ {point}</li>)}</ul></details>)}</div></section>
   <section className="surface p-4"><p className="eyebrow">Méthode BAC</p><ol className="space-y-2 mt-3">{selectedChapter.method.map((step,index)=><li key={step} className="surface-flat p-3 flex gap-3 text-xs"><span className="action-index">{index+1}</span><span>{step}</span></li>)}</ol></section>
   <section className="surface p-4"><p className="eyebrow">Exemples entièrement corrigés</p><div className="space-y-2 mt-3">{selectedChapter.workedExamples.map(example=><details key={example.title} className="surface-flat p-3"><summary className="cursor-pointer font-black text-xs">{example.title}</summary><p className="section-copy mt-2"><MathText auto>{example.statement}</MathText></p><ol className="list-decimal pl-4 mt-2 space-y-1">{example.steps.map(step=><li key={step} className="section-copy"><MathText auto>{step}</MathText></li>)}</ol><div className="notice notice-success mt-2"><strong>Réponse :</strong> <MathText auto>{example.answer}</MathText></div></details>)}</div></section>
   <section className="surface p-4"><p className="eyebrow">Formules essentielles · {selectedChapter.formulas.length}</p><div className="space-y-2 mt-3">{selectedChapter.formulas.map(formula=><div key={formula.id} className="surface-flat p-3"><p className="font-black text-xs">{formula.title}</p><div className="formula-strip mt-2 overflow-x-auto"><MathExpression value={formula.expression}/></div><p className="section-copy mt-2">{formula.meaning}</p><p className="section-copy mt-1">Exemple : <MathExpression value={formula.example}/></p></div>)}</div></section>
   <section className="surface p-4"><p className="eyebrow">Erreurs à éviter</p><div className="notice notice-warning mt-3">{selectedChapter.pitfalls.map(item=><p key={item} className="mt-1">• {item}</p>)}</div></section>
   {selectedChapter.tool&&onOpenTool&&<button onClick={()=>onOpenTool(selectedChapter.tool!)} className="btn btn-secondary w-full">Ouvrir l’outil du chapitre</button>}
   {lastScore!==null&&<div className={`notice ${lastScore>=70?'notice-success':'notice-warning'}`}>Résultat du parcours : <strong>{lastScore}%</strong>. {lastScore>=70?'Chapitre validé.':'Revois la méthode puis recommence.'}</div>}
   {chapterQuestions.length>0&&<QuestionRunnerLauncher onStart={()=>setMode('chapterQuiz')} />}
  </div>;
 }

 if(mode==='chapters')return <div className="space-y-3 page-enter"><button onClick={returnDashboard} className="btn btn-small btn-secondary">← Retour</button><div><p className="eyebrow">Parcours progressifs</p><h2 className="page-title">Programme série {profile.series}</h2><p className="page-copy">Cours essentiel, méthode, formules puis mini-évaluation.</p></div><div className="grid gap-2">{chapters.map(chapter=>{const progress=profile.chapters[chapter.topic];return <button key={chapter.topic} onClick={()=>{setSelectedTopic(chapter.topic);setMode('chapter');setLastScore(null)}} className="surface p-4 text-left flex items-center gap-3"><span className={`chapter-status ${progress?.completed?'done':''}`}>{progress?.completed?'✓':'→'}</span><span className="min-w-0 flex-1"><strong className="section-title">{chapter.title}</strong><small className="section-copy block mt-1">{chapter.summary}</small></span><span className="chip">{progress?.bestPercent||0}%</span></button>})}</div></div>;

 if(mode==='mistakes')return <div className="space-y-3 page-enter"><div className="flex justify-between gap-2"><button onClick={returnDashboard} className="btn btn-small btn-secondary">← Retour</button>{learning.mistakes.length>0&&<button onClick={()=>{if(window.confirm('Vider tout le carnet d’erreurs ?'))clearMistakes()}} className="btn btn-small btn-ghost text-danger">Tout effacer</button>}</div><div><p className="eyebrow">Carnet d’erreurs</p><h2 className="page-title">Comprendre mes erreurs</h2><p className="page-copy">Une erreur corrigée devient une notion à consolider, pas une sanction.</p></div>{learning.mistakes.length===0?<section className="surface p-5 text-center"><p className="section-title">Aucune erreur enregistrée</p><p className="section-copy mt-2">Les erreurs des exercices, examens et révisions apparaîtront ici.</p></section>:<div className="space-y-2">{learning.mistakes.map(mistake=><section key={mistake.id} className="surface p-3"><div className="flex justify-between gap-3"><div><span className="chip chip-warning">{mistake.topic||'Mathématiques'}</span><p className="font-black text-xs mt-2">{mistake.title}</p><p className="section-copy mt-1">{mistake.message}</p></div><button onClick={()=>removeMistake(mistake.id)} className="btn btn-small btn-secondary" aria-label={`Marquer comme corrigée : ${mistake.title}`}>✓</button></div>{onOpenQuestion&&<button onClick={()=>onOpenQuestion(`Aide-moi à revoir cette erreur de ${mistake.topic||'mathématiques'} : ${mistake.message}`)} className="btn btn-small btn-secondary mt-2">Revoir avec Résoudre</button>}</section>)}</div>}</div>;

 if(mode==='formulas'){
  const query=formulaQuery.trim().toLowerCase();
  const formulas=chapters.flatMap(chapter=>chapter.formulas.map(formula=>({chapter,formula}))).filter(item=>!query||`${item.chapter.topic} ${item.formula.title} ${item.formula.meaning}`.toLowerCase().includes(query));
  return <div className="space-y-3 page-enter"><button onClick={returnDashboard} className="btn btn-small btn-secondary">← Retour</button><div><p className="eyebrow">Formulaire BAC</p><h2 className="page-title">Formules expliquées</h2></div><input aria-label="Rechercher une formule" value={formulaQuery} onChange={event=>setFormulaQuery(event.target.value)} className="field" placeholder="Rechercher : dérivée, probabilité, distance…"/><div className="space-y-2">{formulas.map(({chapter,formula})=><section key={formula.id} className="surface p-4"><span className="chip chip-info">{chapter.topic}</span><h3 className="section-title mt-3">{formula.title}</h3><div className="formula-strip mt-3 overflow-x-auto"><MathExpression value={formula.expression}/></div><p className="section-copy mt-2">{formula.meaning}</p><p className="section-copy mt-1">Exemple : <MathExpression value={formula.example}/></p></section>)}</div></div>;
 }

 const diagnosticPercent=profile.diagnostic?Math.round(profile.diagnostic.totalCorrect/profile.diagnostic.total*100):null;
 const weakest=weak[0];
 return <div className="space-y-4 page-enter"><section className="paper-card p-4"><div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Coach personnel · Série {profile.series}</p><h2 className="page-title">Mon parcours de révision</h2><p className="page-copy">Diagnostic, entraînement court et progression sont adaptés à tes résultats locaux.</p></div><button onClick={()=>setChangingSeries(value=>!value)} className="chip chip-brand">Changer</button></div>{changingSeries&&<div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">{(['A','C','D','L','OSE','S'] as BacSeries[]).map(series=><button key={series} disabled={series===profile.series} onClick={()=>{if(window.confirm(`Passer en série ${series} ? Le diagnostic actuel sera réinitialisé.`)){setStudentSeries(series);setChangingSeries(false)}}} className={`btn btn-small ${series===profile.series?'btn-primary':'btn-secondary'}`}>Série {series}</button>)}</div>}{lastScore!==null&&<div className={`notice mt-3 ${lastScore>=70?'notice-success':'notice-warning'}`}>Dernier résultat : <strong>{lastScore}%</strong></div>}{weakest&&<div className="notice notice-info mt-3"><strong>Priorité conseillée :</strong> {weakest}. Commence par le parcours puis fais une révision rapide.</div>}</section>
  <div className="grid grid-cols-2 gap-2.5"><button onClick={()=>setMode('diagnostic')} className="action-card"><span className="action-index">01</span><p className="action-title">{profile.diagnostic?'Refaire le diagnostic':'Faire le diagnostic'}</p><p className="action-copy">{diagnosticPercent===null?'Identifier mes points faibles.':`Dernier score : ${diagnosticPercent}%`}</p></button><button onClick={()=>setMode('quickSetup')} className="action-card green"><span className="action-index">02</span><p className="action-title">Révision rapide</p><p className="action-copy">Choisir une séance de 5, 10 ou 20 minutes.</p></button><button onClick={()=>setMode('chapters')} className="action-card"><span className="action-index">03</span><p className="action-title">Parcours par chapitre</p><p className="action-copy">Cours, méthode, formules et validation.</p></button><button onClick={()=>setMode('mistakes')} className="action-card"><span className="action-index">{learning.mistakes.length}</span><p className="action-title">Carnet d’erreurs</p><p className="action-copy">Revoir et marquer les erreurs corrigées.</p></button></div>
  <button onClick={()=>setMode('formulas')} className="surface p-4 w-full text-left flex items-center gap-3"><span className="solve-goal-symbol">Σ</span><span><strong className="section-title">Formulaire intelligent</strong><small className="section-copy block mt-1">Formules, signification et exemples classés par chapitre.</small></span></button>
  {profile.lastActivity&&<section className="surface p-4"><p className="eyebrow">Reprendre</p><div className="flex items-center justify-between gap-3 mt-2"><div><p className="font-black text-xs">{profile.lastActivity.label}</p><p className="section-copy mt-1">{new Date(profile.lastActivity.at).toLocaleDateString('fr-FR')}</p></div><button onClick={()=>profile.lastActivity?.kind==='quick'?setMode('quickSetup'):profile.lastActivity?.kind==='diagnostic'?setMode('diagnostic'):profile.lastActivity?.payload?(setSelectedTopic(profile.lastActivity.payload as BacTopic),setMode('chapter')):setMode('chapters')} className="btn btn-small btn-secondary">Continuer</button></div></section>}
 </div>;
}

function QuestionRunnerLauncher({onStart}:{onStart:()=>void}){
 return <button onClick={onStart} className="btn btn-primary w-full">Faire la mini-évaluation</button>;
}

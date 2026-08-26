import { useMemo, useState } from 'react';
import { LEARNING_CHAPTERS, LEARNING_QUESTIONS } from '../data/learningCatalog';
import type { BacTopic } from '../data/bacSubjects';
import { MathExpression, MathText } from './MathNotation';

interface Props { onClose:()=>void }
type Tab='lesson'|'examples'|'quiz';

export function MiniLesson({onClose}:Props){
 const [topic,setTopic]=useState<BacTopic|null>(null);
 const [tab,setTab]=useState<Tab>('lesson');
 const [questionIndex,setQuestionIndex]=useState(0);
 const [answer,setAnswer]=useState<number|null>(null);
 const chapter=LEARNING_CHAPTERS.find(item=>item.topic===topic);
 const questions=useMemo(()=>LEARNING_QUESTIONS.filter(question=>question.topic===topic),[topic]);
 const question=questions[questionIndex%Math.max(1,questions.length)];

 const openTopic=(next:BacTopic)=>{setTopic(next);setTab('lesson');setQuestionIndex(0);setAnswer(null);};
 const nextQuestion=()=>{setQuestionIndex(index=>(index+1)%Math.max(1,questions.length));setAnswer(null);};

 return <div className="fixed inset-0 z-50 overflow-y-auto" style={{background:'var(--app-bg)'}}>
  <div className="tool-page-container px-4 py-6 min-h-screen space-y-4">
   <div className="flex items-center justify-between gap-3"><div><p className="eyebrow">Cours enrichis · révision Terminale</p><h2 className="page-title">{chapter?chapter.title:'Leçons de mathématiques'}</h2></div><button onClick={topic?()=>setTopic(null):onClose} aria-label={topic?'Retour aux leçons':'Fermer l’outil'} className="tool-close-button">{topic?'←':'×'}</button></div>

   {!chapter?<><p className="page-copy">8 chapitres, 32 sections de cours, exemples corrigés et exercices de vérification disponibles hors connexion.</p><div className="grid gap-2">{LEARNING_CHAPTERS.map(item=><button key={item.topic} onClick={()=>openTopic(item.topic)} className="surface p-4 text-left flex items-center gap-3"><span className="solve-goal-symbol">{item.topic==='Analyse'?'ƒ':item.topic==='Algèbre'?'x²':item.topic==='Complexes'?'ℂ':item.topic==='Probabilités'?'P':item.topic==='Suites'?'uₙ':item.topic==='Géométrie'?'△':item.topic==='Arithmétique'?'≡':'σ'}</span><span className="min-w-0 flex-1"><strong className="section-title">{item.title}</strong><small className="section-copy block mt-1">{item.lessonSections.length} parties · {item.formulas.length} formules · {LEARNING_QUESTIONS.filter(question=>question.topic===item.topic).length} exercices</small></span><span className="text-brand">→</span></button>)}</div></>:
   <>
    <div className="segmented grid-cols-3"><button onClick={()=>setTab('lesson')} className={tab==='lesson'?'active':''}>Leçon</button><button onClick={()=>setTab('examples')} className={tab==='examples'?'active':''}>Exemples</button><button onClick={()=>setTab('quiz')} className={tab==='quiz'?'active':''}>Exercices</button></div>

    {tab==='lesson'&&<div className="space-y-3 page-enter">
     <section className="paper-card p-4"><p className="page-copy">{chapter.summary}</p><div className="space-y-2 mt-3">{chapter.definitions.map(definition=><p key={definition} className="surface-flat p-3 text-xs">{definition}</p>)}</div></section>
     {chapter.lessonSections.map((section,index)=><section key={section.title} className="surface p-4"><p className="eyebrow">Partie {index+1}/{chapter.lessonSections.length}</p><h3 className="section-title mt-2">{section.title}</h3><p className="page-copy mt-2">{section.explanation}</p><ul className="space-y-1 mt-3">{section.keyPoints.map(point=><li key={point} className="section-copy">✓ {point}</li>)}</ul></section>)}
     <section className="surface p-4"><p className="eyebrow">Formulaire du chapitre</p><div className="space-y-2 mt-3">{chapter.formulas.map(formula=><div key={formula.id} className="surface-flat p-3"><p className="font-black text-xs">{formula.title}</p><div className="formula-strip mt-2"><MathExpression value={formula.expression}/></div><p className="section-copy mt-2">{formula.meaning}</p><p className="section-copy mt-1">Exemple : <MathText auto>{formula.example}</MathText></p></div>)}</div></section>
     <div className="notice notice-warning"><p className="font-black">Erreurs fréquentes</p>{chapter.pitfalls.map(pitfall=><p key={pitfall} className="mt-1">• {pitfall}</p>)}</div>
    </div>}

    {tab==='examples'&&<div className="space-y-3 page-enter">{chapter.workedExamples.map(example=><section key={example.title} className="paper-card p-4"><p className="eyebrow">Exemple corrigé</p><h3 className="section-title mt-2">{example.title}</h3><p className="page-copy mt-2"><MathText auto>{example.statement}</MathText></p><ol className="space-y-2 mt-3">{example.steps.map((step,index)=><li key={step} className="surface-flat p-3 flex gap-3 text-xs"><span className="action-index">{index+1}</span><MathText auto>{step}</MathText></li>)}</ol><div className="notice notice-success mt-3"><strong>Conclusion :</strong> <MathText auto>{example.answer}</MathText></div></section>)}</div>}

    {tab==='quiz'&&question&&<section className="paper-card p-4 page-enter"><div className="flex justify-between gap-2"><p className="eyebrow">Vérification · niveau {question.level}</p><span className="chip">{questionIndex+1}/{questions.length}</span></div><h3 className="section-title mt-3">{question.prompt}</h3><div className="space-y-2 mt-4">{question.choices.map((choice,index)=><button key={choice} disabled={answer!==null} onClick={()=>setAnswer(index)} className={`quiz-choice ${answer===index?'active':''}`}><span>{String.fromCharCode(65+index)}</span>{choice}</button>)}</div>{answer!==null&&<div className={`notice mt-3 ${answer===question.correctIndex?'notice-success':'notice-warning'}`}><p className="font-black">{answer===question.correctIndex?'Bonne réponse':'À revoir'}</p><p className="mt-1">{question.explanation}</p></div>}<button onClick={nextQuestion} disabled={answer===null} className="btn btn-primary w-full mt-3">Question suivante</button></section>}
   </>}
  </div>
 </div>;
}

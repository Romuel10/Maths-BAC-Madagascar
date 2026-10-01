import { useEffect, useMemo, useState } from 'react';
import { BAC_SUBJECTS } from '../data/bacSubjects';
import { getBacProgress, resetBacProgress, subjectProgress, topicProgress } from '../lib/bacProgress';
import { SmartLearningPanel } from './SmartLearningPanel';

interface Props { onOpenQuestion?:(prompt:string)=>void }

export function BacProgressDashboard({onOpenQuestion}:Props) {
 const [version, setVersion] = useState(0);
 const store = useMemo(() => getBacProgress(), [version]);
 const topics = useMemo(() => topicProgress(BAC_SUBJECTS), [version]);
 const questions = Object.values(store.questions);
 const mastered = topics.reduce((sum, topic) => sum + topic.done, 0);
 const totalQuestions = topics.reduce((sum, topic) => sum + topic.total, 0);
 const attempts = questions.reduce((sum, q) => sum + q.attempts, 0);
 const lastExam = store.exams[0];
 const examAverage=store.exams.length?Math.round(store.exams.reduce((sum,exam)=>sum+(exam.maxScore?exam.score/exam.maxScore*20:0),0)/store.exams.length*10)/10:0;
 const mastery=totalQuestions?Math.round(mastered/totalQuestions*100):0;

 useEffect(() => {
  const refresh = () => setVersion(v => v + 1);
  window.addEventListener('mathbac-progress', refresh);
  return () => window.removeEventListener('mathbac-progress', refresh);
 }, []);

 return (
  <div className="space-y-4 page-enter">
   <div>
    <p className="eyebrow">Suivi local</p>
    <h2 className="page-title">Ma progression BAC</h2>
    <p className="page-copy">Tes résultats restent enregistrés sur cet appareil et restent disponibles hors connexion.</p>
   </div>

   <div className="grid grid-cols-2 gap-2">
    <div className="stat-card"><p className="stat-value text-brand">{mastered}</p><p className="stat-label">questions maîtrisées</p></div>
    <div className="stat-card"><p className="stat-value" style={{ color: 'var(--info)' }}>{attempts}</p><p className="stat-label">tentatives</p></div>
    <div className="stat-card"><p className="stat-value text-success">{store.exams.length}</p><p className="stat-label">examens blancs</p></div>
    <div className="stat-card"><p className="stat-value" style={{color:'var(--warning)'}}>{mastery}%</p><p className="stat-label">progression globale</p></div>
   </div>

   {lastExam && (
    <section className="paper-card p-4">
     <p className="eyebrow" style={{ color: 'var(--success)' }}>Dernier examen</p>
     <p className="section-title mt-2">{BAC_SUBJECTS.find(s => s.id === lastExam.subjectId)?.title || lastExam.subjectId}</p>
     <p className="text-3xl font-black text-success mt-3">{Math.round((lastExam.score / lastExam.maxScore) * 200) / 10}<span className="text-sm">/20</span></p>
     <p className="section-copy mt-2">Moyenne des {store.exams.length} simulation{store.exams.length>1?'s':''} : <strong>{examAverage}/20</strong></p>
    </section>
   )}

   <section className="surface p-4">
    <div className="flex items-end justify-between"><div><p className="eyebrow">Compétences</p><h3 className="section-title mt-2">Par chapitre</h3></div></div>
    <div className="space-y-3.5 mt-4">
     {topics.map(t => (
      <div key={t.topic}>
       <div className="flex justify-between gap-2 text-[10px]"><span className="font-semibold" style={{ color: 'var(--text-soft)' }}>{t.topic} · {t.percent>=80?'maîtrisé':t.percent>=50?'en progrès':'prioritaire'}</span><span className="font-extrabold text-brand">{t.done}/{t.total} · {t.percent}%</span></div>
       <div className="progress-track mt-1.5"><div className="progress-fill" style={{ width: `${t.percent}%` }} /></div>
      </div>
     ))}
    </div>
   </section>

   <section className="space-y-2">
    <div><p className="eyebrow">Vue d’ensemble</p><h3 className="section-title mt-2">Par série</h3></div>
    {BAC_SUBJECTS.map(subject => {
     const p = subjectProgress(subject);
     return (
      <div key={subject.id} className="surface p-3 flex items-center gap-3">
       <div className="w-9 h-9 rounded-xl grid place-items-center font-black text-brand" style={{ background: 'var(--brand-soft)' }}>{subject.series}</div>
       <div className="min-w-0 flex-1"><p className="text-[11px] font-bold truncate" style={{ color: 'var(--text)' }}>{subject.title}</p><p className="section-copy mt-0.5">Série {subject.series}</p></div>
       <p className="text-xs font-black text-brand">{p.percent}%</p>
      </div>
     );
    })}
   </section>

   <SmartLearningPanel onOpenQuestion={onOpenQuestion} />

   <button onClick={() => { if (window.confirm('Effacer toute la progression BAC enregistrée sur cet appareil ?')) resetBacProgress(); }} className="btn btn-ghost w-full text-danger">Réinitialiser la progression BAC</button>
  </div>
 );
}

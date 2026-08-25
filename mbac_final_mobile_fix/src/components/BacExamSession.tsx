import { useEffect, useMemo, useState } from 'react';
import type { BacSubject, BacTopic } from '../data/bacSubjects';
import { flattenQuestions, subjectMaxPoints } from '../data/bacSubjects';
import { checkAnswer } from '../lib/bacAnswer';
import { recordExam } from '../lib/bacProgress';
import { recordLearningAttempt } from '../lib/learningStore';
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
}

function draftKey(subjectId: string) { return `mathbac_exam_v39_${subjectId}`; }

export function BacExamSession({ subject, onExit }: Props) {
 const questions = useMemo(() => flattenQuestions(subject), [subject]);
 const max = subjectMaxPoints(subject);
 const savedDraft = useMemo(() => {
  try { return JSON.parse(localStorage.getItem(draftKey(subject.id)) || 'null') as Draft | null; } catch { return null; }
 }, [subject.id]);
 const [state, setState] = useState<ExamState>('intro');
 const [secondsLeft, setSecondsLeft] = useState(subject.durationMinutes * 60);
 const [answers, setAnswers] = useState<Record<string, string>>({});
 const [flags, setFlags] = useState<string[]>([]);
 const [index, setIndex] = useState(0);
 const [startedAt, setStartedAt] = useState('');
 const [result, setResult] = useState<{ score: number; note20: number; detail: Array<{ id: string; correct: boolean; points: number; topic: BacTopic; message: string }>; byTopic: Array<{ topic: BacTopic; score: number; max: number }> } | null>(null);

 useEffect(() => {
  if (state !== 'running') return;
  const timer = window.setInterval(() => setSecondsLeft(v => Math.max(0, v - 1)), 1000);
  return () => window.clearInterval(timer);
 }, [state]);

 useEffect(() => {
  if (state !== 'running') return;
  const draft: Draft = { answers, flags, secondsLeft, index, startedAt };
  localStorage.setItem(draftKey(subject.id), JSON.stringify(draft));
 }, [answers, flags, secondsLeft, index, startedAt, state, subject.id]);

 useEffect(() => {
  if (state === 'running' && secondsLeft === 0) finishExam();
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [secondsLeft, state]);

 const startNew = () => {
  setAnswers({}); setFlags([]); setIndex(0); setSecondsLeft(subject.durationMinutes * 60); setStartedAt(new Date().toISOString()); setResult(null); setState('running');
 };

 const resume = () => {
  if (!savedDraft) return startNew();
  setAnswers(savedDraft.answers || {}); setFlags(savedDraft.flags || []); setIndex(Math.min(questions.length - 1, Math.max(0, savedDraft.index || 0))); setSecondsLeft(Math.max(1, savedDraft.secondsLeft || subject.durationMinutes * 60)); setStartedAt(savedDraft.startedAt || new Date().toISOString()); setResult(null); setState('running');
 };

 const finishExam = () => {
  let score = 0;
  const topicMap = new Map<BacTopic, { score: number; max: number }>();
  const detail = questions.map(q => {
   const checked = checkAnswer(answers[q.id] || '', q.check);
   const points = checked.correct ? q.points : 0;
   score += points;
   const t = topicMap.get(q.topic) || { score: 0, max: 0 };
   t.score += points; t.max += q.points; topicMap.set(q.topic, t);
   recordLearningAttempt(subject.id, q.id, checked.correct);
   return { id: q.id, correct: checked.correct, points, topic: q.topic, message: checked.message };
  });
  const note20 = max ? Math.round((score / max) * 200) / 10 : 0;
  setResult({ score, note20, detail, byTopic: [...topicMap.entries()].map(([topic, v]) => ({ topic, ...v })) });
  recordExam(subject.id, score, max);
  localStorage.removeItem(draftKey(subject.id));
  setState('finished');
  window.scrollTo({ top: 0, behavior: 'smooth' });
 };

 const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
 const q = questions[index];
 const answeredCount = questions.filter(x => (answers[x.id] || '').trim()).length;

 if (state === 'intro') {
  return <div className="space-y-3 page-enter">
   <button onClick={onExit} className="btn btn-secondary btn-small">← Retour</button>
   <section className="paper-card p-5 text-center">
    <span className="chip chip-brand">V3.9 · Examen blanc</span>
    <h2 className="page-title mt-4">Série {subject.series}</h2>
    <p className="text-sm font-extrabold text-brand mt-1">{subject.title}</p>
    <div className="grid grid-cols-3 gap-2 mt-5"><div className="stat-card"><p className="stat-value">{subject.durationMinutes}</p><p className="stat-label">minutes</p></div><div className="stat-card"><p className="stat-value">{questions.length}</p><p className="stat-label">questions</p></div><div className="stat-card"><p className="stat-value">{max}</p><p className="stat-label">points</p></div></div>
    <div className="notice notice-warning text-left mt-4"><p className="font-bold">Conditions BAC</p><p className="mt-1">Aucun indice ni corrigé pendant l’épreuve. Les réponses sont sauvegardées automatiquement sur l’appareil. Tu peux marquer une question à revoir avant de rendre.</p></div>
    {savedDraft && <button onClick={resume} className="btn btn-secondary w-full mt-4">Reprendre l’épreuve sauvegardée · {formatTime(savedDraft.secondsLeft)}</button>}
    <button onClick={startNew} className="btn btn-primary w-full mt-2">{savedDraft ? 'Recommencer une nouvelle épreuve' : 'Commencer l’épreuve'}</button>
   </section>
  </div>;
 }

 if (state === 'running') {
  const flagged = flags.includes(q.id);
  return <div className="space-y-3 page-enter">
   <div className="exam-sticky-bar"><button onClick={() => { if (window.confirm('Quitter ? Le brouillon restera sauvegardé.')) onExit(); }} className="btn btn-small btn-secondary">Quitter</button><div className="text-center"><p className={`text-xl font-black ${secondsLeft < 600 ? 'text-danger' : 'text-brand'}`}>{formatTime(secondsLeft)}</p><p className="text-[8px] muted">{answeredCount}/{questions.length} répondues</p></div><button onClick={finishExam} className="btn btn-small btn-primary">Rendre</button></div>

   <section className="surface p-3"><div className="exam-question-grid">{questions.map((item, i) => { const answered = Boolean((answers[item.id] || '').trim()); const f = flags.includes(item.id); return <button key={item.id} onClick={() => setIndex(i)} className={`exam-q-dot ${index===i?'active':''} ${answered?'answered':''} ${f?'flagged':''}`}>{i+1}</button>; })}</div><p className="text-[8px] muted mt-2">Remplie = répondue · orange = à revoir.</p></section>

   <section className="paper-card p-4">
    <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Question {index+1}/{questions.length}</p><h3 className="section-title mt-2">{q.topic} · {q.points} pt{q.points>1?'s':''}</h3></div><button onClick={() => setFlags(v => flagged ? v.filter(id=>id!==q.id) : [...v,q.id])} className={`chip ${flagged?'chip-warning':''}`}>{flagged?' À revoir':' Marquer'}</button></div>
    <div className="surface-flat p-3 mt-3"><p className="text-sm font-semibold leading-relaxed text-main"><MathText>{q.prompt}</MathText></p></div>
    <div className="mt-4"><MiniKeyboard value={answers[q.id] || ''} onChange={v => setAnswers(prev => ({...prev,[q.id]:v}))} label="Ma réponse" placeholder="Écris ta réponse…" /></div>
   </section>

   <div className="grid grid-cols-2 gap-2"><button disabled={index===0} onClick={()=>setIndex(v=>Math.max(0,v-1))} className="btn btn-secondary">← Précédente</button><button disabled={index===questions.length-1} onClick={()=>setIndex(v=>Math.min(questions.length-1,v+1))} className="btn btn-primary">Suivante →</button></div>
  </div>;
 }

 return <div className="space-y-4 page-enter">
  <section className="paper-card p-5 text-center"><span className="chip chip-success">Épreuve terminée</span><p className="text-5xl font-black text-brand mt-4">{result?.note20 ?? 0}<span className="text-lg">/20</span></p><p className="section-copy mt-2">{result?.score ?? 0}/{max} points obtenus</p></section>

  <section className="surface p-4"><p className="eyebrow">Analyse de la copie</p><h3 className="section-title mt-2">Résultat par chapitre</h3><div className="space-y-3 mt-3">{result?.byTopic.map(t => { const p=t.max?Math.round(t.score/t.max*100):0; return <div key={t.topic}><div className="flex justify-between text-[10px]"><strong>{t.topic}</strong><span>{t.score}/{t.max} · {p}%</span></div><div className="progress-track mt-1"><div className="progress-fill" style={{width:`${p}%`}}/></div></div>; })}</div></section>

  <section className="surface p-4"><p className="eyebrow">Correction</p><h3 className="section-title mt-2">Question par question</h3><div className="space-y-3 mt-3">{questions.map((item,i)=>{ const d=result?.detail.find(x=>x.id===item.id); return <details key={item.id} className="surface-flat p-3"><summary className="cursor-pointer flex items-center justify-between gap-2"><span className="font-bold text-[10px]">{i+1}. {item.topic}</span><span className={`chip ${d?.correct?'chip-success':'chip-warning'}`}>{d?.correct?'Correct':'À revoir'}</span></summary><div className="mt-3 text-xs"><p><MathText>{item.prompt}</MathText></p><p className="mt-2 muted">Ta réponse : {answers[item.id] || '—'}</p><p className="mt-2 font-bold">Méthode :</p><ol className="mt-1 space-y-1 list-decimal pl-4">{item.method.map((s,j)=><li key={j}><MathText>{s}</MathText></li>)}</ol><p className="mt-2 font-bold text-success">Réponse : <MathText>{item.finalAnswer}</MathText></p></div></details>; })}</div></section>

  <div className="grid grid-cols-2 gap-2"><button onClick={onExit} className="btn btn-secondary">Retour aux sujets</button><button onClick={startNew} className="btn btn-primary">Refaire l’épreuve</button></div>
 </div>;
}

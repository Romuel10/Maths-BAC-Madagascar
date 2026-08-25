import { useMemo, useState } from 'react';
import type { BacSubject } from '../data/bacSubjects';
import { flattenQuestions, subjectMaxPoints } from '../data/bacSubjects';
import { recordQuestionAttempt, subjectProgress } from '../lib/bacProgress';
import { getLearningStore, questionKey, recordLearningAttempt, recordMistake, toggleFavorite, toggleRetry } from '../lib/learningStore';
import { MathText } from './MathNotation';
import { PedagogicalWorkspace } from './PedagogicalWorkspace';

interface Props {
 subject: BacSubject;
 onBack: () => void;
 onAnalyzeFunction?: (expr: string) => void;
 onStartExam?: () => void;
}

export function BacGuidedSolver({ subject, onBack, onAnalyzeFunction, onStartExam }: Props) {
 const questions = useMemo(() => flattenQuestions(subject), [subject]);
 const [index, setIndex] = useState(0);
 const [answer, setAnswer] = useState('');
 const [hintCount, setHintCount] = useState(0);
 const [showCorrection, setShowCorrection] = useState(false);
 const [progressVersion, setProgressVersion] = useState(0);
 const [learningVersion, setLearningVersion] = useState(0);

 const q = questions[index];
 const progress = useMemo(() => subjectProgress(subject), [subject, progressVersion]);
 const exercise = subject.exercises.find(ex => ex.questions.some(item => item.id === q.id));
 const learning = useMemo(() => getLearningStore(), [learningVersion]);
 const qKey = questionKey(subject.id, q.id);
 const isFavorite = learning.favorites.includes(qKey);
 const isRetry = learning.retry.includes(qKey);

 const resetQuestionUi = () => {
  setAnswer('');
  setHintCount(0);
  setShowCorrection(false);
 };

 const goTo = (next: number) => {
  setIndex(Math.max(0, Math.min(questions.length - 1, next)));
  resetQuestionUi();
  window.scrollTo({ top: 0, behavior: 'smooth' });
 };

 const recordFinalVerification = (correct: boolean) => {
  recordQuestionAttempt(subject.id, q.id, q.topic, correct, q.points);
  recordLearningAttempt(subject.id, q.id, correct);
  setProgressVersion(v => v + 1);
  setLearningVersion(v => v + 1);
  if (!correct && hintCount < q.hints.length) setHintCount(v => v + 1);
 };

 return (
  <div className="space-y-3 page-enter">
   <div className="flex items-center justify-between gap-2">
    <button onClick={onBack} className="btn btn-secondary btn-small">← Sujets</button>
    <div className="text-right">
     <p className="text-[10px] font-extrabold text-brand">Série {subject.series} · {subject.year}</p>
     <p className="text-[9px] muted mt-0.5">{progress.done}/{progress.total} questions maîtrisées</p>
    </div>
   </div>

   <section className="paper-card p-4">
    <div className="flex items-start justify-between gap-3">
     <div className="min-w-0">
      <span className="chip chip-warning">Entraînement type BAC</span>
      <h2 className="section-title mt-3">{subject.title}</h2>
      <p className="section-copy mt-1.5">{subject.description}</p>
     </div>
     <div className="text-right shrink-0"><p className="text-xl font-black text-brand">{progress.percent}%</p><p className="text-[8px] muted">progression</p></div>
    </div>
    <div className="progress-track mt-3"><div className="progress-fill" style={{ width: `${progress.percent}%` }} /></div>
    <div className="flex flex-wrap gap-2 mt-3">
     <span className="chip">{subject.durationMinutes} min</span>
     <span className="chip">{subjectMaxPoints(subject)} pts</span>
     {onStartExam && <button onClick={onStartExam} className="chip chip-brand ml-auto">Mode examen</button>}
    </div>
   </section>

   <section className="surface p-3">
    <div className="flex items-center justify-between gap-2">
     <p className="text-[10px] font-extrabold text-brand">Question {index + 1}/{questions.length}</p>
     <p className="text-[9px] muted">{q.topic} · {q.points} pt{q.points > 1 ? 's' : ''}</p>
    </div>
    <div className="progress-track mt-2"><div className="progress-fill" style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
    <div className="flex gap-2 mt-2">
     <button onClick={() => { toggleFavorite(subject.id, q.id); setLearningVersion(v => v + 1); }} className={`chip ${isFavorite ? 'chip-brand' : ''}`}>{isFavorite ? ' Favori' : ' Favori'}</button>
     <button onClick={() => { toggleRetry(subject.id, q.id); setLearningVersion(v => v + 1); }} className={`chip ${isRetry ? 'chip-warning' : ''}`}>{isRetry ? '↻ À refaire' : 'Marquer à refaire'}</button>
    </div>
   </section>

   <section className="surface p-4">
    <p className="eyebrow">{exercise?.title}</p>
    {exercise?.introduction && <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-soft)' }}><MathText>{exercise.introduction}</MathText></p>}

    <div className="surface-flat mt-3 p-3">
     <p className="text-[10px] font-extrabold text-brand">{q.number}</p>
     <p className="text-sm font-semibold mt-1.5 leading-relaxed" style={{ color: 'var(--text)' }}><MathText>{q.prompt}</MathText></p>
    </div>

    <PedagogicalWorkspace
     key={q.id}
     question={q}
     answer={answer}
     onAnswerChange={setAnswer}
     onFinalVerified={recordFinalVerification}
     onMistake={(mistake) => { recordMistake({ subjectId: subject.id, questionId: q.id, topic: q.topic, code: mistake.code, title: mistake.title, message: mistake.message }); setLearningVersion(v => v + 1); }}
    />

    <div className="grid grid-cols-1 gap-2 mt-3">
     <button onClick={() => setHintCount(v => Math.min(q.hints.length, v + 1))} disabled={hintCount >= q.hints.length} className="btn btn-secondary">Indice ciblé de l’énoncé</button>
    </div>

    {hintCount > 0 && (
     <div className="mt-3 space-y-2">
      {q.hints.slice(0, hintCount).map((hint, i) => <div key={i} className="notice notice-warning"><span className="font-bold">Indice {i + 1} :</span> <MathText>{hint}</MathText></div>)}
     </div>
    )}

    {q.toolExpression && onAnalyzeFunction && <button onClick={() => onAnalyzeFunction(q.toolExpression!)} className="btn btn-secondary w-full mt-2">Ouvrir cette fonction dans l’analyseur</button>}

    <button onClick={() => setShowCorrection(v => !v)} className="btn btn-ghost w-full mt-2 text-danger">{showCorrection ? 'Masquer la correction' : 'Afficher la correction complète'}</button>
    {showCorrection && (
     <div className="notice notice-success mt-2">
      <p className="font-bold">Correction complète</p>
      <p className="mt-1 text-[10px] muted">Suis chaque ligne et compare-la avec ton brouillon avant de regarder la suivante.</p>
      <ol className="mt-3 space-y-2 text-xs">
       {q.method.map((step, i) => (
        <li key={i} className="surface-flat p-2">
         <span className="font-black text-brand mr-1">Étape {i + 1}.</span> <MathText>{step}</MathText>
        </li>
       ))}
      </ol>
      <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
       <p className="font-bold">Réponse finale</p>
       <p className="mt-1 leading-relaxed math-answer"><MathText>{q.finalAnswer}</MathText></p>
      </div>
     </div>
    )}
   </section>

   <div className="grid grid-cols-2 gap-2 pb-2">
    <button disabled={index === 0} onClick={() => goTo(index - 1)} className="btn btn-secondary">← Précédente</button>
    <button disabled={index === questions.length - 1} onClick={() => goTo(index + 1)} className="btn btn-primary">Suivante →</button>
   </div>
  </div>
 );
}

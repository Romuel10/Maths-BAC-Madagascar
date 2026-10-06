import { useMemo, useState } from 'react';
import type { BacQuestion } from '../data/bacSubjects';
import { checkAnswer } from '../lib/bacAnswer';
import { detectCommonMistake, type PedagogyMode, type StepFeedback, verifyTransformation } from '../lib/pedagogy';
import { MathExpression, MathText } from './MathNotation';
import { MiniKeyboard, prettyToMath } from './MiniKeyboard';

interface Props {
 question: BacQuestion;
 answer: string;
 onAnswerChange: (value: string) => void;
 onFinalVerified: (correct: boolean) => void;
 onMistake?: (mistake: { code: string; title: string; message: string }) => void;
}

interface StudentStep {
 value: string;
 feedback: StepFeedback;
}

const MODE_COPY: Record<PedagogyMode, { title: string; copy: string }> = {
 guided: { title: 'Guidé', copy: 'Indices et vérification ligne par ligne.' },
 normal: { title: 'Normal', copy: 'Tu avances, l’application intervient en cas d’erreur.' },
 autonomous: { title: 'Autonome', copy: 'Pas d’indice automatique, contrôle seulement à ta demande.' },
};

function FeedbackBox({ feedback }: { feedback: StepFeedback }) {
 const cls = feedback.status === 'verified' ? 'notice-success' : feedback.status === 'probable' ? 'notice-info' : feedback.status === 'incorrect' ? 'notice-danger' : 'notice-warning';
 const tag = feedback.status === 'verified' ? 'Vérifié' : feedback.status === 'probable' ? 'Cohérent' : feedback.status === 'incorrect' ? 'Erreur détectée' : 'À contrôler';
 return <div className={`notice ${cls}`}><p className="font-black">{tag} · {feedback.title}</p><p className="mt-1">{feedback.message}</p>{feedback.details && <p className="mt-1 muted">{feedback.details}</p>}</div>;
}

export function PedagogicalWorkspace({ question, answer, onAnswerChange, onFinalVerified, onMistake }: Props) {
 const [mode, setMode] = useState<PedagogyMode>('guided');
 const [steps, setSteps] = useState<StudentStep[]>([]);
 const [draftStep, setDraftStep] = useState('');
 const [stepFeedback, setStepFeedback] = useState<StepFeedback | null>(null);
 const [finalFeedback, setFinalFeedback] = useState<ReturnType<typeof checkAnswer> | null>(null);
 const [revealedMethod, setRevealedMethod] = useState(0);

 const previousLine = useMemo(() => {
  if (steps.length) return steps[steps.length - 1].value;
  // If the prompt itself contains a simple equation/expression, use the student's first step without strict transformation checking.
  return '';
 }, [steps]);

 const addStep = () => {
  if (!draftStep.trim()) return;
  let fb: StepFeedback;
  if (previousLine) fb = verifyTransformation(previousLine, draftStep);
  else {
   const mistake = detectCommonMistake(draftStep);
   fb = mistake || { status: 'probable', title: 'Première ligne enregistrée', message: 'Continue ton raisonnement. La prochaine ligne sera comparée à celle-ci.' };
  }
  setSteps(prev => [...prev, { value: draftStep.trim(), feedback: fb }]);
  if (fb.status === 'incorrect') onMistake?.({ code: fb.mistakeCode || 'step-error', title: fb.title, message: fb.message });
  setStepFeedback(fb);
  setDraftStep('');
  if (mode === 'guided' && fb.status === 'incorrect') setRevealedMethod(v => Math.min(question.method.length, Math.max(v, 1)));
 };

 const verifyFinal = () => {
  const result = checkAnswer(answer, question.check);
  if (!result.correct && question.check.kind === 'expression') {
   const diagnostic = detectCommonMistake(answer, question.check.expected);
   if (diagnostic) {
    setStepFeedback(diagnostic);
    onMistake?.({ code: diagnostic.mistakeCode || 'final-error', title: diagnostic.title, message: diagnostic.message });
    setFinalFeedback({ correct: false, message: diagnostic.message, confidence: 'verified', scoreRatio: 0 });
    onFinalVerified(false);
    if (mode !== 'autonomous') setRevealedMethod(v => Math.min(question.method.length, Math.max(v, 1)));
    return;
   }
  }
  setFinalFeedback(result);
  if (!result.correct) onMistake?.({ code: 'final-answer', title: 'Réponse finale à reprendre', message: result.message });
  onFinalVerified(result.correct);
  if (!result.correct && mode !== 'autonomous') setRevealedMethod(v => Math.min(question.method.length, Math.max(v, 1)));
 };

 const revealNext = () => setRevealedMethod(v => Math.min(question.method.length, v + 1));

 return (
  <div className="pedagogy-workspace mt-4">
   <div className="flex items-start justify-between gap-3">
    <div>
     <p className="eyebrow">Atelier de résolution</p>
     <h3 className="section-title mt-2">Travaille comme sur ton brouillon</h3>
     <p className="section-copy mt-1">Une ligne à la fois. L’application contrôle la cohérence sans cacher les étapes.</p>
    </div>
    <span className="chip chip-info">V7</span>
   </div>

   <div className="segmented mt-3 grid-cols-3">
    {(['guided', 'normal', 'autonomous'] as PedagogyMode[]).map(id => (
     <button key={id} onClick={() => setMode(id)} className={mode === id ? 'active' : ''} title={MODE_COPY[id].copy}>{MODE_COPY[id].title}</button>
    ))}
   </div>
   <p className="text-[0.5625rem] muted mt-1.5">{MODE_COPY[mode].copy}</p>

   {steps.length > 0 && (
    <div className="solution-sheet mt-4">
     <div className="solution-sheet-head"><span>Mon raisonnement</span><span>{steps.length} étape{steps.length > 1 ? 's' : ''}</span></div>
     <div className="space-y-2 p-3">
      {steps.map((step, index) => (
       <div key={index} className="student-step">
        <div className="student-step-index">{index + 1}</div>
        <div className="min-w-0 flex-1">
         <MathExpression value={prettyToMath(step.value)} block className="math-answer" />
         <p className={`student-step-status ${step.feedback.status}`}>{step.feedback.status === 'verified' ? ' vérifiée' : step.feedback.status === 'probable' ? '◌ cohérente' : step.feedback.status === 'incorrect' ? ' à corriger' : '? à contrôler'}</p>
        </div>
       </div>
      ))}
     </div>
    </div>
   )}

   <div className="surface-flat p-3 mt-3">
    <MiniKeyboard value={draftStep} onChange={v => { setDraftStep(v); setStepFeedback(null); }} label="Prochaine ligne de calcul" placeholder="Écris la prochaine étape…" />
    <button onClick={addStep} disabled={!draftStep.trim()} className="btn btn-secondary w-full mt-2">Ajouter et contrôler cette étape</button>
   </div>

   {stepFeedback && <div className="mt-2"><FeedbackBox feedback={stepFeedback} /></div>}

   {mode !== 'autonomous' && (
    <div className="mt-3">
     <div className="flex items-center justify-between gap-2">
      <p className="field-label">Méthode de référence</p>
      <button onClick={revealNext} disabled={revealedMethod >= question.method.length} className="btn btn-small btn-ghost">Afficher l’étape suivante</button>
     </div>
     {revealedMethod === 0 ? <p className="text-[0.5625rem] muted mt-2">Essaie d’abord seul. Affiche une étape seulement si tu bloques.</p> : (
      <ol className="method-timeline mt-2">
       {question.method.slice(0, revealedMethod).map((step, i) => (
        <li key={i}><span className="method-number">{i + 1}</span><div><MathText>{step}</MathText></div></li>
       ))}
      </ol>
     )}
    </div>
   )}

   <div className="surface p-3 mt-4">
    <label className="field-label mb-1.5">Réponse finale</label>
    <MiniKeyboard value={answer} onChange={v => { onAnswerChange(v); setFinalFeedback(null); }} placeholder="Écris le résultat final…" />
    <button onClick={verifyFinal} className="btn btn-primary w-full mt-2">Vérifier la réponse finale</button>
    {finalFeedback && (
     <div className={`notice mt-2 ${finalFeedback.correct ? 'notice-success' : 'notice-warning'}`}>
      <p className="font-black">{finalFeedback.correct ? 'Réponse validée' : 'Réponse à reprendre'}</p>
      <p className="mt-1">{finalFeedback.message}</p>
      <p className="mt-1 text-[0.5625rem] font-bold">{finalFeedback.confidence === 'verified' ? 'Contrôle exact' : finalFeedback.confidence === 'probable' ? 'Concordance probable : compare aussi la rédaction' : 'Contrôle insuffisant'}</p>
     </div>
    )}
   </div>
  </div>
 );
}

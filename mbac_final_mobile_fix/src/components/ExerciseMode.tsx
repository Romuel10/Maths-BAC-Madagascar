import React, { useState, useCallback, useMemo } from 'react';
import { analyzeFunction, type AnalysisResult } from '../lib/mathEngine';
import { formatPretty } from '../lib/prettyMath';
import { recordAnswer, getStats } from '../lib/stats';
import { useLang, t } from '../lib/i18n';
import { MathExpression, MathText } from './MathNotation';

interface Props { onClose: () => void }

type Difficulty = 'easy' | 'medium' | 'hard';
interface QCM { question: string; options: string[]; correctIndex: number; topic: string; explanation: string; difficulty: Difficulty }

const FUNCS: Record<Difficulty, { expr: string; name: string }[]> = {
 easy: [
  { expr: 'x^2', name: 'x²' },
  { expr: '2*x + 3', name: '2x+3' },
  { expr: 'x^2 - 4', name: 'x²−4' },
  { expr: '-x^2 + 1', name: '−x²+1' },
  { expr: 'x^3', name: 'x³' },
  { expr: '3*x - 1', name: '3x−1' },
 ],
 medium: [
  { expr: '1/x', name: '1/x' },
  { expr: 'x^2 - 3*x + 2', name: 'x²−3x+2' },
  { expr: 'sqrt(x)', name: '√x' },
  { expr: '(x-1)/(x+2)', name: '(x−1)/(x+2)' },
  { expr: 'x^3 - 3*x', name: 'x³−3x' },
  { expr: 'log(x)', name: 'ln(x)' },
 ],
 hard: [
  { expr: 'x*exp(-x)', name: 'x·e⁻ˣ' },
  { expr: '(x^2-1)/(x^2+1)', name: '(x²−1)/(x²+1)' },
  { expr: 'sin(x) + cos(x)', name: 'sin+cos' },
  { expr: 'exp(x)/(1+exp(x))', name: 'Sigmoïde' },
  { expr: 'x*log(x)', name: 'x·ln(x)' },
  { expr: '(2*x+1)/(x^2-1)', name: 'Rationnelle' },
 ],
};

function shuffle<T>(a: T[]): T[] { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }

function makeWrongs(correct: string, pool: string[]): string[] {
 return shuffle(pool.filter(w => w !== correct)).slice(0, 3);
}

function buildQCMs(result: AnalysisResult, expr: string, diff: Difficulty): QCM[] {
 const qcms: QCM[] = [];
 const pe = expr;
 const pd = formatPretty(result.derivativeExpr);

 // Domain
 const domCorrect = result.domain.description;
 const domOpts = shuffle([domCorrect, ...makeWrongs(domCorrect, ['ℝ (tous les réels)', 'ℝ \\ {0}', ']0 ; +∞[', '[0 ; +∞[', 'ℝ \\ {-2}', ']-∞ ; 0[', 'ℝ \\ {1}', 'ℝ \\ {-1 ; 1}', ']-∞ ; 0[ ∪ ]0 ; +∞['])]);
 qcms.push({ question: `Quel est l'ensemble de définition de $f(x)=${pe}$ ?`, options: domOpts, correctIndex: domOpts.indexOf(domCorrect), topic: 'domain', explanation: `Df = ${domCorrect}`, difficulty: diff });

 // Derivative
 const derOpts = shuffle([pd, ...makeWrongs(result.derivativeExpr, ['2x', '3x^2', '1', 'x', '-1/x^2', 'cos(x)', 'exp(x)', '2x-3', '-sin(x)', '3x^2-3', '2x+1', '-exp(-x)', 'x^2', '1/(2*sqrt(x))', '0']).map(formatPretty)]);
 qcms.push({ question: `Calculez $f'(x)$ pour $f(x)=${pe}$`, options: derOpts, correctIndex: derOpts.indexOf(pd), topic: 'derivative', explanation: `f'(x) = ${pd}`, difficulty: diff });

 // Zeros
 const zStr = result.zeros.length > 0 ? result.zeros.map(z => `x = ${z.x}`).join(', ') : 'Aucun zéro';
 const zOpts = shuffle([zStr, ...makeWrongs(zStr, ['x = 0', 'x = 1 et x = -1', 'x = 2', 'Aucun zéro', 'x = -2 et x = 2', 'x = 3', 'x = 0 et x = 1', 'x = -1', 'x = 0.5'])]);
 qcms.push({ question: `Résolvez $f(x)=0$ pour $f(x)=${pe}$`, options: zOpts, correctIndex: zOpts.indexOf(zStr), topic: 'zeros', explanation: result.zeros.length > 0 ? `Solutions : ${zStr}` : 'Pas de solution réelle', difficulty: diff });

 // Parity
 const parMap: Record<string, string> = { even: 'Paire', odd: 'Impaire', neither: 'Ni paire ni impaire' };
 const parCorrect = parMap[result.parity.type];
 const parOpts = shuffle(['Paire', 'Impaire', 'Ni paire ni impaire', 'Périodique'].filter((v, i, a) => a.indexOf(v) === i));
 qcms.push({ question: `La fonction $f(x)=${pe}$ est :`, options: parOpts, correctIndex: parOpts.indexOf(parCorrect), topic: 'parity', explanation: result.parity.explanation, difficulty: diff });

 // Variation — depends on difficulty
 if (diff !== 'easy') {
  const cp = result.variation.criticalPoints;
  let varCorrect = 'Monotone (pas d\'extremum)';
  if (cp.some(c => c.type.includes('max')) && cp.some(c => c.type.includes('min'))) varCorrect = 'Maximum et minimum locaux';
  else if (cp.some(c => c.type.includes('max'))) varCorrect = 'Un maximum local';
  else if (cp.some(c => c.type.includes('min'))) varCorrect = 'Un minimum local';
  else if (result.variation.intervals.length === 1 && result.variation.intervals[0].direction === 'increasing') varCorrect = 'Toujours croissante';
  else if (result.variation.intervals.length === 1 && result.variation.intervals[0].direction === 'decreasing') varCorrect = 'Toujours décroissante';
  const varOpts = shuffle([varCorrect, ...makeWrongs(varCorrect, ['Toujours croissante', 'Toujours décroissante', 'Un maximum local', 'Un minimum local', 'Maximum et minimum locaux', 'Monotone (pas d\'extremum)'])]);
  qcms.push({ question: `Variations de $f(x)=${pe}$ ?`, options: varOpts, correctIndex: varOpts.indexOf(varCorrect), topic: 'variation', explanation: cp.length > 0 ? cp.map(c => `${c.type} en x=${c.x}`).join(', ') : 'Fonction monotone', difficulty: diff });
 }

 // Hard only: limits, second derivative
 if (diff === 'hard') {
  const limInf = result.limits.find(l => l.point === '+∞');
  if (limInf) {
   const limCorrect = `lim = ${limInf.value}`;
   const limOpts = shuffle([limCorrect, ...makeWrongs(limCorrect, ['lim = +∞', 'lim = −∞', 'lim = 0', 'lim = 1', 'lim = −1', 'N\'existe pas'])]);
   qcms.push({ question: `Calculer $\\lim_{x\\to +\\infty} f(x)$ pour $f(x)=${pe}$`, options: limOpts, correctIndex: limOpts.indexOf(limCorrect), topic: 'limits', explanation: `La limite en +∞ est ${limInf.value}`, difficulty: 'hard' });
  }
 }

 return qcms;
}

export const ExerciseMode: React.FC<Props> = ({ onClose }) => {
 const { lang } = useLang();
 const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
 const [exercise, setExercise] = useState<(typeof FUNCS)['easy'][0] | null>(null);
 const [result, setResult] = useState<AnalysisResult | null>(null);
 const [qcms, setQcms] = useState<QCM[]>([]);
 const [currentQ, setCurrentQ] = useState(0);
 const [selected, setSelected] = useState<number | null>(null);
 const [answered, setAnswered] = useState(false);
 const [scores, setScores] = useState<boolean[]>([]);
 const [finished, setFinished] = useState(false);
 const stats = useMemo(() => getStats(), [finished, scores.length]);

 const startExercise = useCallback((ex: typeof FUNCS.easy[0], diff: Difficulty) => {
  setExercise(ex); setDifficulty(diff);
  setCurrentQ(0); setSelected(null); setAnswered(false); setScores([]); setFinished(false);
  try {
   const r = analyzeFunction(ex.expr, -10, 10);
   setResult(r); setQcms(buildQCMs(r, ex.expr, diff));
  } catch { setResult(null); }
 }, []);

 const handleConfirm = () => {
  if (selected === null) return;
  setAnswered(true);
  const ok = selected === qcms[currentQ].correctIndex;
  setScores(p => [...p, ok]);
  recordAnswer(qcms[currentQ].topic, ok);
 };

 const handleNext = () => {
  if (currentQ < qcms.length - 1) { setCurrentQ(p => p + 1); setSelected(null); setAnswered(false); }
  else setFinished(true);
 };

 const correctCount = scores.filter(Boolean).length;
 const totalQ = qcms.length;

 const diffLabels: Record<Difficulty, { icon: string; label: string; color: string; desc: string }> = {
  easy: { icon: 'N1', label: lang === 'en' ? 'Easy' : lang === 'mg' ? 'Mora' : 'Facile', color: 'emerald', desc: lang === 'en' ? 'Polynomials, linear' : 'Polynômes, linéaires' },
  medium: { icon: 'N2', label: lang === 'en' ? 'Medium' : lang === 'mg' ? 'Antonony' : 'Moyen', color: 'amber', desc: lang === 'en' ? 'Rational, roots, log' : 'Rationnelles, racines, log' },
  hard: { icon: 'N3', label: lang === 'en' ? 'Hard' : lang === 'mg' ? 'Sarotra' : 'Difficile', color: 'red', desc: lang === 'en' ? 'Exp, trig, composed' : 'Exp, trigo, composées' },
 };

 return (
  <div className="fixed inset-0 bg-slate-950/98 z-50 overflow-y-auto">
   <div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
    <div className="flex items-center justify-between mb-4">
     <h2 className="text-xl font-extrabold text-white"> {t('exercises', lang)}</h2>
     <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">×</button>
    </div>

    {/* Stats bar */}
    <div className="flex gap-2 mb-4">
     <div className="flex-1 bg-slate-800/50 rounded-xl p-2 text-center">
      <p className="text-[10px] text-slate-400">{t('totalExercises', lang)}</p>
      <p className="text-lg font-bold text-white">{stats.totalExercises}</p>
     </div>
     <div className="flex-1 bg-slate-800/50 rounded-xl p-2 text-center">
      <p className="text-[10px] text-slate-400">{t('correctRate', lang)}</p>
      <p className="text-lg font-bold text-emerald-400">{stats.totalExercises > 0 ? Math.round(stats.totalCorrect / stats.totalExercises * 100) : 0}%</p>
     </div>
     <div className="flex-1 bg-slate-800/50 rounded-xl p-2 text-center">
      <p className="text-[10px] text-slate-400"></p>
      <p className="text-lg font-bold text-amber-400">{stats.currentStreak}</p>
     </div>
    </div>

    {/* Step 1: Choose difficulty */}
    {!difficulty && (
     <div className="space-y-3">
      <p className="text-slate-400 text-sm mb-2">{lang === 'en' ? 'Choose difficulty:' : lang === 'mg' ? 'Safidio ny haavo:' : 'Choisissez le niveau :'}</p>
      {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
       const dl = diffLabels[d];
       return (
        <button key={d} onClick={() => setDifficulty(d)}
         className={`w-full bg-gradient-to-r from-${dl.color}-600/15 to-${dl.color}-800/15 border border-${dl.color}-500/25 rounded-2xl p-4 text-left transition-all active:scale-[0.98]`}>
         <div className="flex items-center gap-3">
          <span className="text-3xl">{dl.icon}</span>
          <div>
           <p className="text-white font-bold">{dl.label}</p>
           <p className="text-xs text-slate-400">{dl.desc}</p>
          </div>
         </div>
        </button>
       );
      })}
     </div>
    )}

    {/* Step 2: Choose function */}
    {difficulty && !exercise && (
     <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
       <button onClick={() => setDifficulty(null)} className="text-slate-400 text-sm">← {t('back', lang)}</button>
       <span className="text-lg">{diffLabels[difficulty].icon}</span>
       <span className="text-white font-bold">{diffLabels[difficulty].label}</span>
      </div>
      <p className="text-slate-400 text-sm">{t('chooseFunc', lang)} :</p>
      <div className="grid grid-cols-2 gap-2">
       {FUNCS[difficulty].map((ex, i) => (
        <button key={i} onClick={() => startExercise(ex, difficulty)}
         className="bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-700/50 rounded-xl p-3 text-left transition-all active:scale-95">
         <div className="text-white text-sm"><MathExpression value={ex.expr} /></div>
        </button>
       ))}
      </div>
     </div>
    )}

    {/* Finished */}
    {finished && (
     <div className="space-y-4 text-center py-6">
      <div className="text-6xl">{correctCount === totalQ ? '' : correctCount >= totalQ / 2 ? '' : ''}</div>
      <h3 className="text-2xl font-extrabold text-white">{t('score', lang)}: {correctCount}/{totalQ}</h3>
      <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
       <div className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all" style={{ width: `${(correctCount / totalQ) * 100}%` }} />
      </div>
      <p className="text-slate-400">
       {correctCount === totalQ ? (lang === 'en' ? 'Perfect!' : 'Parfait ! ')
        : correctCount >= totalQ / 2 ? (lang === 'en' ? 'Good job!' : 'Bien joué !')
        : (lang === 'en' ? 'Keep practicing!' : 'Continuez !')}
      </p>
      <div className="flex gap-2">
       <button onClick={() => { setExercise(null); setFinished(false); }} className="flex-1 py-3 bg-slate-700 text-white font-bold rounded-xl">{t('back', lang)}</button>
       {exercise && difficulty && <button onClick={() => startExercise(exercise, difficulty)} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl">{t('restart', lang)}</button>}
      </div>
     </div>
    )}

    {/* QCM */}
    {exercise && result && !finished && qcms.length > 0 && (
     <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
       <div className="flex items-center gap-2">
        <span>{diffLabels[difficulty!].icon}</span>
        <span className="text-sm font-bold text-white"><MathExpression value={exercise.expr} /></span>
       </div>
       <span className="text-xs text-slate-400">{currentQ + 1}/{totalQ}</span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1 justify-center">
       {scores.map((s, i) => <span key={i} className={`w-2.5 h-2.5 rounded-full ${s ? 'bg-emerald-500' : 'bg-red-500'}`} />)}
       {Array.from({ length: totalQ - scores.length }).map((_, i) => <span key={`e-${i}`} className="w-2.5 h-2.5 rounded-full bg-slate-700" />)}
      </div>

      {/* Question */}
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50">
       <p className="text-white font-semibold text-sm"><MathText>{qcms[currentQ].question}</MathText></p>
      </div>

      {/* Options */}
      <div className="space-y-2">
       {qcms[currentQ].options.map((opt, i) => {
        let cls = 'bg-slate-800/50 border-slate-600/50 text-slate-300';
        if (answered) {
         if (i === qcms[currentQ].correctIndex) cls = 'bg-emerald-600/30 border-emerald-500/50 text-emerald-200';
         else if (i === selected) cls = 'bg-red-600/30 border-red-500/50 text-red-200';
        } else if (i === selected) cls = 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200 ring-2 ring-indigo-500/30';

        return (
         <button key={i} onClick={() => !answered && setSelected(i)}
          className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm active:scale-[0.98] ${cls}`}>
          <span className="inline-flex items-center gap-2">
           <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold shrink-0">{String.fromCharCode(65 + i)}</span>
           <MathText auto>{opt}</MathText>
          </span>
          {answered && i === qcms[currentQ].correctIndex && <span className="float-right text-lg"></span>}
          {answered && i === selected && i !== qcms[currentQ].correctIndex && <span className="float-right text-lg"></span>}
         </button>
        );
       })}
      </div>

      {/* Explanation */}
      {answered && (
       <div className={`rounded-xl p-4 border ${selected === qcms[currentQ].correctIndex ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
        <p className={`text-sm font-bold mb-1 ${selected === qcms[currentQ].correctIndex ? 'text-emerald-300' : 'text-amber-300'}`}>
         {selected === qcms[currentQ].correctIndex ? ' ' + t('correct', lang) : ' ' + t('incorrect', lang)}
        </p>
        <p className="text-xs text-slate-300"><MathText auto>{qcms[currentQ].explanation}</MathText></p>
       </div>
      )}

      {/* Button */}
      {!answered ? (
       <button onClick={handleConfirm} disabled={selected === null}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl transition-all">
        {t('verify', lang)}
       </button>
      ) : (
       <button onClick={handleNext} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl">
        {currentQ < totalQ - 1 ? t('next', lang) + ' →' : t('finish', lang) + ' '}
       </button>
      )}
     </div>
    )}
   </div>
  </div>
 );
};

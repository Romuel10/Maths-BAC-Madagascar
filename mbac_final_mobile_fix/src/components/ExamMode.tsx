import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { analyzeFunction } from '../lib/mathEngine';
import { formatPretty } from '../lib/prettyMath';
import { recordAnswer } from '../lib/stats';
import { useLang, t } from '../lib/i18n';
import { MathText } from './MathNotation';

interface Props { onClose: () => void }

type Difficulty = 'easy' | 'medium' | 'hard';

const BANK: Record<Difficulty, string[]> = {
 easy: ['x^2', '2*x+3', 'x^2-4', '-x^2+1', 'x^3', '3*x-1', 'x^2+2*x', '-2*x+5', 'x^2-1', '4*x'],
 medium: ['x^2-3*x+2', '1/x', 'sqrt(x)', '(x-1)/(x+2)', 'x^3-3*x', 'log(x)', 'x^2+1', '(x^2-4)/(x+2)', 'exp(x)-1', 'x*log(x)'],
 hard: ['x*exp(-x)', 'sin(x)+cos(x)', '(x^2-1)/(x^2+1)', 'exp(x)/(1+exp(x))', '(2*x+1)/(x^2-1)', 'log(x)/x', 'x^4-2*x^2', 'sin(x)/x', 'x*exp(x)', 'cos(x)/(1+sin(x))'],
};

const TIMERS: Record<Difficulty, number> = { easy: 300, medium: 420, hard: 600 };
const QCOUNTS: Record<Difficulty, number> = { easy: 5, medium: 7, hard: 10 };

function shuffle<T>(a: T[]): T[] { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }

function makeWrongs(correct: string, pool: string[]): string[] { return shuffle(pool.filter(w => w !== correct)).slice(0, 3); }

interface ExQ { expr: string; question: string; options: string[]; correctIndex: number; topic: string }

function generateQuestions(diff: Difficulty): ExQ[] {
 const picked = shuffle(BANK[diff]).slice(0, QCOUNTS[diff]);
 const qs: ExQ[] = [];
 const types = diff === 'easy' ? ['domain', 'derivative'] : diff === 'medium' ? ['domain', 'derivative', 'zeros', 'parity'] : ['domain', 'derivative', 'zeros', 'parity', 'variation', 'limits'];

 for (const expr of picked) {
  try {
   const r = analyzeFunction(expr, -10, 10);
   const pe = expr;
   const type = types[Math.floor(Math.random() * types.length)];
   let question = '', correct = '', wrongs: string[] = [];

   switch (type) {
    case 'domain':
     question = `Ensemble de définition de $f(x)=${pe}$ ?`;
     correct = r.domain.description;
     wrongs = makeWrongs(correct, ['ℝ (tous les réels)', 'ℝ \\ {0}', ']0 ; +∞[', '[0 ; +∞[', 'ℝ \\ {-2}', ']-∞ ; 0[', 'ℝ \\ {1}']);
     break;
    case 'derivative':
     question = `$f'(x)$ si $f(x)=${pe}$ ?`;
     correct = formatPretty(r.derivativeExpr);
     wrongs = makeWrongs(r.derivativeExpr, ['2x', 'x', '3x^2', '-1/x^2', 'cos(x)', 'exp(x)', '2x-3', '1', '-sin(x)', '0']).map(formatPretty);
     break;
    case 'zeros':
     question = `Zéros de $f(x)=${pe}$ ?`;
     correct = r.zeros.length > 0 ? r.zeros.map(z => `x = ${z.x}`).join(', ') : 'Aucun';
     wrongs = makeWrongs(correct, ['x = 0', 'x = 1', 'x = -1, 1', 'Aucun', 'x = 2', 'x = -2, 2']);
     break;
    case 'parity':
     question = `Parité de $f(x)=${pe}$ ?`;
     correct = r.parity.type === 'even' ? 'Paire' : r.parity.type === 'odd' ? 'Impaire' : 'Ni paire ni impaire';
     wrongs = makeWrongs(correct, ['Paire', 'Impaire', 'Ni paire ni impaire']);
     break;
    case 'variation': {
     question = `Variations de $f(x)=${pe}$ ?`;
     const cp = r.variation.criticalPoints;
     correct = cp.length > 0 ? cp.map(c => c.type).join(' et ') : 'Monotone';
     wrongs = makeWrongs(correct, ['Toujours croissante', 'Toujours décroissante', 'Maximum local', 'Minimum local', 'Maximum et minimum', 'Monotone']);
     break;
    }
    case 'limits': {
     const lim = r.limits.find(l => l.point === '+∞');
     if (!lim) continue;
     question = `Calculer $\\lim_{x\\to +\\infty} f(x)$ pour $f(x)=${pe}$`;
     correct = lim.value;
     wrongs = makeWrongs(correct, ['+∞', '−∞', '0', '1', '−1', '2']);
     break;
    }
   }

   const opts = shuffle([correct, ...wrongs]);
   qs.push({ expr, question, options: opts, correctIndex: opts.indexOf(correct), topic: type });
  } catch { /* skip */ }
 }
 return qs;
}

export const ExamMode: React.FC<Props> = ({ onClose }) => {
 const { lang } = useLang();
 const [diff, setDiff] = useState<Difficulty | null>(null);
 const [timeLeft, setTimeLeft] = useState(300);
 const [started, setStarted] = useState(false);
 const [questions, setQuestions] = useState<ExQ[]>([]);
 const [currentQ, setCurrentQ] = useState(0);
 const [selected, setSelected] = useState<number | null>(null);
 const [answers, setAnswers] = useState<(number | null)[]>([]);
 const [finished, setFinished] = useState(false);

 useEffect(() => {
  if (!started || finished) return;
  const id = setInterval(() => {
   setTimeLeft(p => { if (p <= 1) { setFinished(true); return 0; } return p - 1; });
  }, 1000);
  return () => clearInterval(id);
 }, [started, finished]);

 const startExam = useCallback((d: Difficulty) => {
  setDiff(d);
  const qs = generateQuestions(d);
  setQuestions(qs);
  setCurrentQ(0); setSelected(null);
  setAnswers(new Array(qs.length).fill(null));
  setTimeLeft(TIMERS[d]); setStarted(true); setFinished(false);
 }, []);

 const handleSelect = (idx: number) => { if (finished) return; setSelected(idx); setAnswers(p => { const n = [...p]; n[currentQ] = idx; return n; }); };
 const handleNext = () => { if (currentQ < questions.length - 1) { setCurrentQ(p => p + 1); setSelected(answers[currentQ + 1]); } };
 const handlePrev = () => { if (currentQ > 0) { setCurrentQ(p => p - 1); setSelected(answers[currentQ - 1]); } };

 const handleFinish = () => {
  setFinished(true);
  questions.forEach((q, i) => recordAnswer('exam_' + q.topic, answers[i] === q.correctIndex));
 };

 const score = useMemo(() => finished ? questions.reduce((a, q, i) => a + (answers[i] === q.correctIndex ? 1 : 0), 0) : 0, [finished, questions, answers]);
 const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

 const diffs: { id: Difficulty; icon: string; label: string; desc: string; time: string; count: string }[] = [
  { id: 'easy', icon: 'N1', label: lang === 'en' ? 'Easy' : 'Facile', desc: lang === 'en' ? 'Basic functions' : 'Fonctions simples', time: '5 min', count: '5 Q' },
  { id: 'medium', icon: 'N2', label: lang === 'en' ? 'Medium' : 'Moyen', desc: lang === 'en' ? 'Mixed functions' : 'Fonctions mixtes', time: '7 min', count: '7 Q' },
  { id: 'hard', icon: 'N3', label: lang === 'en' ? 'Hard' : 'Difficile', desc: lang === 'en' ? 'Complex functions' : 'Fonctions complexes', time: '10 min', count: '10 Q' },
 ];

 return (
  <div className="fixed inset-0 bg-slate-950/98 z-50 overflow-y-auto">
   <div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
    <div className="flex items-center justify-between mb-4">
     <h2 className="text-xl font-extrabold text-white"> {t('exam', lang)}</h2>
     <div className="flex items-center gap-3">
      {started && !finished && (
       <span className={`font-mono font-bold text-lg ${timeLeft < 60 ? 'text-red-400 animate-blink' : 'text-amber-400'}`}>{fmt(timeLeft)}</span>
      )}
      <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">×</button>
     </div>
    </div>

    {/* Choose difficulty */}
    {!started && (
     <div className="space-y-3">
      <p className="text-slate-400 text-sm mb-2">{lang === 'en' ? 'Choose exam difficulty:' : 'Choisissez la difficulté :'}</p>
      {diffs.map(d => (
       <button key={d.id} onClick={() => startExam(d.id)}
        className="w-full bg-slate-800/40 border border-slate-700/30 rounded-2xl p-4 text-left transition-all active:scale-[0.98]">
        <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
          <span className="text-3xl">{d.icon}</span>
          <div>
           <p className="text-white font-bold">{d.label}</p>
           <p className="text-xs text-slate-400">{d.desc}</p>
          </div>
         </div>
         <div className="text-right">
          <p className="text-xs text-slate-400">{d.time}</p>
          <p className="text-xs text-slate-500">{d.count}</p>
         </div>
        </div>
       </button>
      ))}
     </div>
    )}

    {/* Exam in progress */}
    {started && !finished && questions.length > 0 && (
     <div className="space-y-4">
      {/* Difficulty badge + dots */}
      <div className="flex items-center justify-between">
       <span className="text-sm">{diff && diffs.find(d => d.id === diff)?.icon} {diff && diffs.find(d => d.id === diff)?.label}</span>
       <div className="flex gap-1">
        {questions.map((_, i) => (
         <button key={i} onClick={() => { setCurrentQ(i); setSelected(answers[i]); }}
          className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center ${i === currentQ ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : answers[i] !== null ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-500'}`}>{i + 1}</button>
        ))}
       </div>
      </div>

      {/* Question */}
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50">
       <p className="text-xs text-indigo-400 mb-1">{t('question', lang)} {currentQ + 1}/{questions.length}</p>
       <p className="text-white font-semibold text-sm"><MathText>{questions[currentQ].question}</MathText></p>
      </div>

      {/* Options */}
      <div className="space-y-2">
       {questions[currentQ].options.map((opt, i) => (
        <button key={i} onClick={() => handleSelect(i)}
         className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm active:scale-[0.98] font-mono ${i === selected ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200 ring-2 ring-indigo-500/30' : 'bg-slate-800/50 border-slate-600/50 text-slate-300'}`}>
         <span className="inline-flex items-center gap-2">
          <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold shrink-0">{String.fromCharCode(65 + i)}</span><MathText auto>{opt}</MathText>
         </span>
        </button>
       ))}
      </div>

      {/* Nav */}
      <div className="flex gap-2">
       <button onClick={handlePrev} disabled={currentQ === 0} className="flex-1 py-3 bg-slate-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold rounded-xl">← {t('previous', lang)}</button>
       {currentQ < questions.length - 1
        ? <button onClick={handleNext} className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl">{t('next', lang)} →</button>
        : <button onClick={handleFinish} className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-xl"> {t('finish', lang)}</button>
       }
      </div>
     </div>
    )}

    {/* Results */}
    {finished && questions.length > 0 && (
     <div className="space-y-4 py-4">
      <div className="text-center space-y-2">
       <div className="text-6xl">{score === questions.length ? '' : score >= questions.length * 0.6 ? '' : ''}</div>
       <h3 className="text-2xl font-extrabold text-white">{t('examOver', lang)}</h3>
       <p className="text-4xl font-bold text-indigo-400">{score}/{questions.length}</p>
       <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
        <div className={`h-full ${score >= questions.length * 0.8 ? 'bg-emerald-500' : score >= questions.length * 0.5 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${(score / questions.length) * 100}%` }} />
       </div>
       <p className="text-sm text-slate-400">{fmt(TIMERS[diff!] - timeLeft)}</p>
      </div>

      {/* Correction */}
      <div className="space-y-2">
       <h4 className="text-sm font-bold text-slate-300">{t('correction', lang)} :</h4>
       {questions.map((q, i) => (
        <div key={i} className={`rounded-xl p-3 border text-sm ${answers[i] === q.correctIndex ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
         <p className="text-white mb-1"><MathText>{q.question}</MathText></p>
         {answers[i] === q.correctIndex
          ? <p className="text-emerald-400 text-xs"> <MathText auto>{q.options[q.correctIndex]}</MathText></p>
          : <p className="text-xs"><span className="text-red-300"> {answers[i] !== null ? <MathText auto>{q.options[answers[i]!]}</MathText> : '(vide)'}</span><br /><span className="text-emerald-300"> <MathText auto>{q.options[q.correctIndex]}</MathText></span></p>
         }
        </div>
       ))}
      </div>

      <div className="flex gap-2">
       <button onClick={() => { setStarted(false); setFinished(false); setDiff(null); }} className="flex-1 py-3 bg-slate-700 text-white font-bold rounded-xl">{t('restart', lang)}</button>
       <button onClick={onClose} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl">{t('back', lang)}</button>
      </div>
     </div>
    )}
   </div>
  </div>
 );
};

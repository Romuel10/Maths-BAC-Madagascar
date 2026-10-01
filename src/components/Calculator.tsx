import React, { useCallback, useState } from 'react';
import { computeCalculator, type CalculatorComputation, type CalculatorMode } from '../lib/calculatorEngine';
import { MathExpression } from './MathNotation';
import { ReliabilityPanel } from './ReliabilityPanel';

interface Props { onClose: () => void }
interface HistoryEntry { input: string; result: string; exact: string | null }
type KeyKind = 'normal' | 'fn' | 'op' | 'action' | 'equal';
type BtnDef = { label: string; insert?: string; action?: () => void; kind?: KeyKind; span?: number };

export const Calculator: React.FC<Props> = ({ onClose }) => {
 const [display, setDisplay] = useState('');
 const [calculation, setCalculation] = useState<CalculatorComputation | null>(null);
 const [history, setHistory] = useState<HistoryEntry[]>([]);
 const [mode, setMode] = useState<CalculatorMode>('deg');
 const [showHistory, setShowHistory] = useState(false);
 const [showSteps, setShowSteps] = useState(true);
 const [lastAnswer, setLastAnswer] = useState('0');
 const [error, setError] = useState('');
 const [memory, setMemory] = useState(0);

 const append = useCallback((s: string) => {
  setDisplay(prev => prev + s);
  setCalculation(null);
  setError('');
 }, []);
 const clear = () => { setDisplay(''); setCalculation(null); setError(''); };
 const backspace = () => { setDisplay(prev => prev.slice(0, -1)); setCalculation(null); setError(''); };
 const compute = useCallback(() => {
  if (!display.trim()) return;
  try {
   const next = computeCalculator(display, mode, lastAnswer);
   setCalculation(next);
   setLastAnswer(String(next.rawValue));
   setHistory(prev => [{ input: display, result: next.decimalValue, exact: next.exactExpression }, ...prev.slice(0, 19)]);
   setError('');
  } catch (e: unknown) {
   setCalculation(null);
   setError(e instanceof Error ? e.message : 'Expression invalide');
  }
 }, [display, mode, lastAnswer]);
 const useResult = () => {
  if (!calculation) return;
  setDisplay(calculation.exactExpression || calculation.decimalValue);
  setCalculation(null);
 };
 const currentNumeric = () => {
  if (calculation && typeof calculation.rawValue === 'number' && Number.isFinite(calculation.rawValue)) return calculation.rawValue;
  const ans = Number(lastAnswer);
  return Number.isFinite(ans) ? ans : null;
 };
 const updateMemory = (sign: 1 | -1) => {
  const value=currentNumeric();
  if(value===null){setError('Effectue d’abord un calcul numérique avant d’utiliser M+ ou M−.');return;}
  setMemory(prev=>prev+sign*value);setError('');
 };
 const recallMemory = () => append(String(memory));


 const scientific: BtnDef[][] = [
  [
   { label: mode === 'deg' ? 'DEG' : 'RAD', action: () => { setMode(prev => prev === 'deg' ? 'rad' : 'deg'); setCalculation(null); }, kind: 'action' },
   { label: 'sin', insert: 'sin(', kind: 'fn' }, { label: 'cos', insert: 'cos(', kind: 'fn' }, { label: 'tan', insert: 'tan(', kind: 'fn' },
   { label: 'sin⁻¹', insert: 'asin(', kind: 'fn' }, { label: 'cos⁻¹', insert: 'acos(', kind: 'fn' },
  ],
  [
   { label: 'tan⁻¹', insert: 'atan(', kind: 'fn' }, { label: 'ln', insert: 'log(', kind: 'fn' }, { label: 'log₁₀', insert: 'log10(', kind: 'fn' },
   { label: 'eˣ', insert: 'exp(', kind: 'fn' }, { label: '10ˣ', insert: '10^(', kind: 'fn' }, { label: '√', insert: '√(', kind: 'fn' },
  ],
  [
   { label: 'x²', insert: '^2', kind: 'fn' }, { label: 'xⁿ', insert: '^', kind: 'fn' }, { label: 'ⁿ√x', insert: 'nthRoot(', kind: 'fn' },
   { label: 'n!', insert: '!', kind: 'fn' }, { label: 'nCr', insert: 'combinations(', kind: 'fn' }, { label: 'nPr', insert: 'permutations(', kind: 'fn' },
  ],
  [
   { label: 'sinh', insert: 'sinh(', kind: 'fn' }, { label: 'cosh', insert: 'cosh(', kind: 'fn' }, { label: 'tanh', insert: 'tanh(', kind: 'fn' },
   { label: '⌊x⌋', insert: 'floor(', kind: 'fn' }, { label: '⌈x⌉', insert: 'ceil(', kind: 'fn' }, { label: 'round', insert: 'round(', kind: 'fn' },
  ],
  [
   { label: 'π', insert: 'π', kind: 'fn' }, { label: 'e', insert: 'e', kind: 'fn' }, { label: '|x|', insert: 'abs(', kind: 'fn' },
   { label: ',', insert: ',', kind: 'action' }, { label: 'ANS', insert: 'ANS', kind: 'action' }, { label: '×10ⁿ', insert: '*10^(', kind: 'fn' },
  ],
 ];
 const mainKeys: BtnDef[][] = [
  [
   { label: '7', insert: '7' }, { label: '8', insert: '8' }, { label: '9', insert: '9' }, { label: '÷', insert: '÷', kind: 'op' }, { label: '(', insert: '(' }, { label: ')', insert: ')' },
  ],
  [
   { label: '4', insert: '4' }, { label: '5', insert: '5' }, { label: '6', insert: '6' }, { label: '×', insert: '×', kind: 'op' }, { label: '%', insert: '/100' }, { label: '1/x', insert: '^(-1)', kind: 'fn' },
  ],
  [
   { label: '1', insert: '1' }, { label: '2', insert: '2' }, { label: '3', insert: '3' }, { label: '−', insert: '-', kind: 'op' }, { label: 'AC', action: clear, kind: 'action', span: 2 },
  ],
  [
   { label: '0', insert: '0' }, { label: '.', insert: '.' }, { label: '⌫', action: backspace, kind: 'action' }, { label: '+', insert: '+', kind: 'op' }, { label: '=', action: compute, kind: 'equal', span: 2 },
  ],
 ];

 const renderKey = (btn: BtnDef, key: string) => (
  <button
   key={key}
   type="button"
   onClick={btn.action || (() => append(btn.insert || ''))}
   className={`calc-key ${btn.kind && btn.kind !== 'normal' ? btn.kind : ''} ${btn.span === 2 ? 'col-span-2' : ''}`}
  >{btn.label}</button>
 );

 return (
  <div className="fixed inset-0 z-50 overflow-y-auto calc-shell">
   <div className="calc-container">
    <header className="calc-header">
     <div>
      <p className="calc-eyebrow">Outil de vérification</p>
      <h2 className="calc-title">Calculatrice scientifique</h2>
      <p className="calc-copy">Saisie scolaire, résultat lisible, étapes intermédiaires et contrôle de cohérence.</p>
     </div>
     <button onClick={onClose} className="calc-close" aria-label="Fermer">×</button>
    </header>

    <section className="calc-panel mb-3">
     <div className="flex items-center justify-between gap-2 mb-2">
      <div>
       <p className="calc-section-title">Expression</p>
       <p className="calc-section-copy">Le moteur conserve la notation technique uniquement en interne.</p>
      </div>
      <button onClick={() => setShowHistory(v => !v)} className="btn btn-small btn-secondary">Historique · {history.length}</button>
     </div>
     <div className="calc-display"><MathExpression value={display || '0'} className="math-hero" /></div>
     {error && <div className="notice mt-3" style={{ borderColor: 'color-mix(in srgb, var(--danger) 30%, transparent)', color: 'var(--danger)' }}><strong>Expression invalide.</strong> {error}</div>}
    </section>

    {showHistory && history.length > 0 && (
     <section className="calc-panel mb-3 max-h-52 overflow-y-auto">
      <div className="flex items-center justify-between mb-2"><p className="calc-section-title">Calculs récents</p><button onClick={() => setHistory([])} className="btn btn-small btn-ghost">Effacer</button></div>
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
       {history.map((h, i) => (
        <button key={i} onClick={() => { setDisplay(h.input); setCalculation(null); setShowHistory(false); }} className="w-full text-left py-2.5">
         <div className="text-[10px] muted"><MathExpression value={h.input} /></div>
         <div className="text-sm font-bold mt-1" style={{ color: 'var(--text)' }}><MathExpression value={`=${h.exact || h.result}`} /></div>
        </button>
       ))}
      </div>
     </section>
    )}

    {calculation && (
     <div className="space-y-3 mb-4">
      <button onClick={useResult} className="calc-result w-full text-left">
       <div className="flex items-center justify-between gap-2"><p className="calc-section-title" style={{ color: 'var(--success)' }}>Résultat contrôlé</p><span className="chip chip-success">Réutiliser</span></div>
       <div className="calc-result-grid mt-3">
        {calculation.exactExpression && <div className="calc-result-cell"><p className="calc-section-copy">Forme exacte</p><div className="text-xl font-extrabold mt-1 overflow-x-auto"><MathExpression value={calculation.exactExpression} /></div></div>}
        <div className="calc-result-cell"><p className="calc-section-copy">Valeur numérique</p><div className="text-xl font-extrabold mt-1 overflow-x-auto"><MathExpression value={calculation.decimalValue} /></div></div>
       </div>
      </button>

      <ReliabilityPanel level={calculation.quality.level} title={calculation.quality.label} detail={calculation.quality.detail} checks={[
       { label: 'Expression relue par le moteur', ok: true },
       { label: 'Second calcul de contrôle', ok: calculation.quality.level !== 'warning', detail: calculation.quality.level === 'verified' ? 'Concordance à la précision affichée.' : 'Résultat traité comme une approximation.' },
      ]} />

      <section className="calc-panel">
       <button onClick={() => setShowSteps(v => !v)} className="w-full flex items-center justify-between text-left gap-3">
        <div><p className="calc-section-title">Étapes du calcul</p><p className="calc-section-copy mt-1">Sous-calculs affichés dans l’ordre des priorités opératoires.</p></div>
        <span className="chip">{showSteps ? 'Masquer' : 'Afficher'}</span>
       </button>
       {showSteps && <div className="calc-workbook mt-3">{calculation.steps.map((step, i) => (
        <div className="calc-step" key={`${step.label}-${i}`}>
         <span className="calc-step-index">{i + 1}</span>
         <div className="min-w-0"><p className="calc-step-title">{step.label}</p><div className="text-sm mt-1 overflow-x-auto"><MathExpression value={step.result ? `${step.expression}=${step.result}` : step.expression} /></div>{step.note && <p className="calc-step-note">{step.note}</p>}</div>
        </div>
       ))}</div>}
      </section>
     </div>
    )}

    <section className="calc-panel">
     <div className="flex items-center justify-between gap-2 mb-3">
      <div><p className="calc-section-title">Clavier scientifique</p><p className="calc-section-copy">Mode angulaire : {mode === 'deg' ? 'degrés' : 'radians'} · fonctions avancées</p></div>
      {lastAnswer !== '0' && <span className="chip"><MathExpression value={`ANS=${lastAnswer.slice(0, 14)}`} /></span>}
     </div>
     <div className="grid grid-cols-5 gap-1.5 mb-3" aria-label="Mémoire de la calculatrice">
      <button type="button" onClick={()=>setMemory(0)} className="btn btn-small btn-ghost">MC</button>
      <button type="button" onClick={recallMemory} className="btn btn-small btn-secondary">MR</button>
      <button type="button" onClick={()=>updateMemory(1)} className="btn btn-small btn-secondary">M+</button>
      <button type="button" onClick={()=>updateMemory(-1)} className="btn btn-small btn-secondary">M−</button>
      <span className="chip justify-center overflow-hidden" title={String(memory)}>M={Number.isInteger(memory)?memory:memory.toPrecision(5)}</span>
     </div>
     <div className="calc-keyboard">
      {scientific.map((row, ri) => <div key={`s-${ri}`} className="calc-key-row">{row.map((btn, i) => renderKey(btn, `s-${ri}-${i}`))}</div>)}
      <div style={{ height: 2, background: 'var(--border)', margin: '2px 0' }} />
      {mainKeys.map((row, ri) => <div key={`m-${ri}`} className="calc-key-row">{row.map((btn, i) => renderKey(btn, `m-${ri}-${i}`))}</div>)}
     </div>
    </section>

    <p className="text-[9px] muted text-center mt-4 leading-relaxed">Une valeur approchée reste signalée comme telle. En cas de contrôle insuffisant, l’application ne présente pas le résultat comme une certitude.</p>
   </div>
  </div>
 );
};

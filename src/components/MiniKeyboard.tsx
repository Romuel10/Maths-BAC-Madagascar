/**
 * Clavier mathématique visuel — V3.4
 * L'élève saisit avec des symboles scolaires ; la conversion mathjs reste interne.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MathExpression } from './MathNotation';

interface Props {
 value: string;
 onChange: (val: string) => void;
 placeholder?: string;
 label?: string;
 autoConvert?: boolean;
}

import { prettyToMath } from '../lib/mathInput';
export { prettyToMath } from '../lib/mathInput';

type KBtn = { label: string; insert: string; kind?: 'number' | 'operator' | 'function' | 'symbol' };

const KEYS: KBtn[][] = [
 [
  { label: 'x', insert: 'x', kind: 'symbol' }, { label: 'x²', insert: '²', kind: 'symbol' },
  { label: 'x³', insert: '³', kind: 'symbol' }, { label: 'xⁿ', insert: '^', kind: 'symbol' },
  { label: '√', insert: '√(', kind: 'function' }, { label: '(', insert: '(', kind: 'symbol' }, { label: ')', insert: ')', kind: 'symbol' },
 ],
 [
  { label: '+', insert: ' + ', kind: 'operator' }, { label: '−', insert: ' − ', kind: 'operator' },
  { label: '×', insert: '×', kind: 'operator' }, { label: '÷', insert: '÷', kind: 'operator' },
  { label: 'π', insert: 'π', kind: 'symbol' }, { label: 'e', insert: 'e', kind: 'symbol' }, { label: '.', insert: '.', kind: 'number' },
 ],
 [
  { label: '0', insert: '0', kind: 'number' }, { label: '1', insert: '1', kind: 'number' }, { label: '2', insert: '2', kind: 'number' },
  { label: '3', insert: '3', kind: 'number' }, { label: '4', insert: '4', kind: 'number' }, { label: '5', insert: '5', kind: 'number' }, { label: '6', insert: '6', kind: 'number' },
 ],
 [
  { label: '7', insert: '7', kind: 'number' }, { label: '8', insert: '8', kind: 'number' }, { label: '9', insert: '9', kind: 'number' },
  { label: 'sin', insert: 'sin(', kind: 'function' }, { label: 'cos', insert: 'cos(', kind: 'function' },
  { label: 'ln', insert: 'ln(', kind: 'function' }, { label: 'eˣ', insert: 'e^(', kind: 'function' },
 ],
];

type Template = { id: string; title: string; latex: string; insert: string; cursor: number };
const TEMPLATES: Template[] = [
 { id: 'fraction', title: 'Fraction', latex: '\\frac{a}{b}', insert: '()÷()', cursor: 1 },
 { id: 'power', title: 'Puissance', latex: 'x^{n}', insert: '()^()', cursor: 1 },
 { id: 'root', title: 'Racine', latex: '\\sqrt{x}', insert: '√()', cursor: 2 },
 { id: 'abs', title: 'Valeur absolue', latex: '|x|', insert: '||', cursor: 1 },
];

export const MiniKeyboard: React.FC<Props> = ({ value, onChange, placeholder, label }) => {
 const [showKb, setShowKb] = useState(false);
 const inputRef = useRef<HTMLInputElement>(null);

 const insertAtCursor = useCallback((insert: string, cursorInside?: number) => {
  const el = inputRef.current;
  const start = el?.selectionStart ?? value.length;
  const end = el?.selectionEnd ?? value.length;
  const next = value.slice(0, start) + insert + value.slice(end);
  onChange(next);
  const pos = start + (cursorInside ?? insert.length);
  requestAnimationFrame(() => {
   inputRef.current?.focus();
   inputRef.current?.setSelectionRange(pos, pos);
  });
 }, [value, onChange]);

 const backspace = useCallback(() => {
  const el = inputRef.current;
  const start = el?.selectionStart ?? value.length;
  const end = el?.selectionEnd ?? value.length;
  if (start !== end) {
   onChange(value.slice(0, start) + value.slice(end));
   requestAnimationFrame(() => inputRef.current?.setSelectionRange(start, start));
   return;
  }
  if (start <= 0) return;
  const before = value.slice(0, start);
  const tokens = ['sin(', 'cos(', 'tan(', 'ln(', 'e^(', '√(', ' + ', ' − '];
  const token = tokens.find(t => before.endsWith(t));
  const cut = token?.length ?? 1;
  const pos = start - cut;
  onChange(value.slice(0, pos) + value.slice(end));
  requestAnimationFrame(() => { inputRef.current?.focus(); inputRef.current?.setSelectionRange(pos, pos); });
 }, [value, onChange]);

 const clear = useCallback(() => { onChange(''); requestAnimationFrame(() => inputRef.current?.focus()); }, [onChange]);

 return (
  <div className="math-input-wrap space-y-2">
   {label && <label className="field-label">{label}</label>}

   <div className="relative">
    <input
     aria-label={label || 'Expression mathématique'}
     ref={inputRef}
     value={value}
     onChange={e => onChange(e.target.value)}
     placeholder={placeholder || 'Ex : (x + 3)²'}
     className="field math-input-field pr-12"
     onFocus={() => setShowKb(true)}
     autoComplete="off"
     autoCorrect="off"
     spellCheck={false}
    />
    <button type="button" onClick={() => setShowKb(v => !v)} className={`math-keyboard-toggle ${showKb ? 'active' : ''}`} aria-label="Afficher le clavier mathématique">ƒx</button>
   </div>

   {value.trim() && (
    <div className="math-preview">
     <p className="math-preview-label">Aperçu comme sur une copie</p>
     <div className="math-preview-expression"><MathExpression value={prettyToMath(value)} /></div>
    </div>
   )}

   {showKb && (
    <div className="math-keyboard animate-slide-up">
     <div className="math-template-grid">
      {TEMPLATES.map(t => (
       <button type="button" key={t.id} onClick={() => insertAtCursor(t.insert, t.cursor)} className="math-template-key" title={t.title}>
        <MathExpression value={t.latex} />
        <span>{t.title}</span>
       </button>
      ))}
     </div>
     <p className="math-keyboard-caption">Symboles</p>
     {KEYS.map((row, ri) => (
      <div key={ri} className="math-key-row">
       {row.map((btn, ki) => (
        <button type="button" key={`${ri}-${ki}`} onClick={() => insertAtCursor(btn.insert)} className={`math-key ${btn.kind || 'symbol'}`}>{btn.label}</button>
       ))}
      </div>
     ))}
     <div className="math-key-row math-key-actions">
      <button type="button" onClick={backspace} className="math-key action">⌫ Effacer</button>
      <button type="button" onClick={clear} className="math-key action danger">AC</button>
      <button type="button" onClick={() => setShowKb(false)} className="math-key action">Fermer</button>
     </div>
    </div>
   )}
  </div>
 );
};

export const MathInput: React.FC<{
 value: string;
 onChange: (prettyVal: string) => void;
 onMathjs?: (mathjsVal: string) => void;
 placeholder?: string;
 label?: string;
}> = ({ value, onChange, onMathjs, placeholder, label }) => {
 useEffect(() => { if (onMathjs) onMathjs(prettyToMath(value)); }, [value, onMathjs]);
 return <MiniKeyboard value={value} onChange={onChange} placeholder={placeholder} label={label} />;
};

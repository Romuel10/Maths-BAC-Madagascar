import { useState, useCallback } from 'react';
import { TOKENS, tokensToDisplay, tokensToMathjs } from '../lib/prettyMath';
import type { MathToken } from '../lib/prettyMath';
import { MathExpression } from './MathNotation';

interface FunctionInputProps {
 onAnalyze: (expr: string, xMin: number, xMax: number) => void;
 isLoading: boolean;
}

// ── Keyboard layout definition ─────────────────────────────────
interface KeyDef {
 label: string;
 tokenId: string;
 color: 'num' | 'op' | 'fn' | 'trig' | 'pow' | 'var' | 'const' | 'paren';
 span?: number;
}

const KEYS: KeyDef[][] = [
 // Row 0 — Functions
 [
  { label: 'sin', tokenId: 'sin', color: 'trig' },
  { label: 'cos', tokenId: 'cos', color: 'trig' },
  { label: 'tan', tokenId: 'tan', color: 'trig' },
  { label: 'ln',  tokenId: 'ln',  color: 'fn' },
  { label: 'eˣ',  tokenId: 'exp', color: 'fn' },
  { label: '| |', tokenId: 'abs', color: 'fn' },
 ],
 // Row 1
 [
  { label: '7', tokenId: '7', color: 'num' },
  { label: '8', tokenId: '8', color: 'num' },
  { label: '9', tokenId: '9', color: 'num' },
  { label: '÷', tokenId: '/', color: 'op' },
  { label: '(', tokenId: '(', color: 'paren' },
  { label: ')', tokenId: ')', color: 'paren' },
 ],
 // Row 2
 [
  { label: '4', tokenId: '4', color: 'num' },
  { label: '5', tokenId: '5', color: 'num' },
  { label: '6', tokenId: '6', color: 'num' },
  { label: '×', tokenId: '*', color: 'op' },
  { label: 'x²', tokenId: 'sq', color: 'pow' },
  { label: 'xⁿ', tokenId: '^', color: 'pow' },
 ],
 // Row 3
 [
  { label: '1', tokenId: '1', color: 'num' },
  { label: '2', tokenId: '2', color: 'num' },
  { label: '3', tokenId: '3', color: 'num' },
  { label: '−', tokenId: '-', color: 'op' },
  { label: 'x³', tokenId: 'cb', color: 'pow' },
  { label: '√', tokenId: 'sqrt', color: 'fn' },
 ],
 // Row 4
 [
  { label: '0', tokenId: '0', color: 'num' },
  { label: ',', tokenId: '.', color: 'num' },
  { label: 'x', tokenId: 'x', color: 'var' },
  { label: '+', tokenId: '+', color: 'op' },
  { label: 'π', tokenId: 'pi', color: 'const' },
  { label: 'e', tokenId: 'e', color: 'const' },
 ],
];

const COLOR_MAP: Record<KeyDef['color'], string> = {
 num: 'math-key number',
 op: 'math-key operator',
 fn: 'math-key function',
 trig: 'math-key function',
 pow: 'math-key symbol',
 var: 'math-key symbol',
 const: 'math-key function',
 paren: 'math-key number',
};

// ── Preset examples (as token arrays) ──────────────────────────

// We'll build them properly with a helper
function buildTokens(...ids: string[]): MathToken[] {
 return ids.map(id => {
  const t = TOKENS[id];
  if (!t) throw new Error(`Unknown token: ${id}`);
  return { ...t };
 });
}

const PRESET_EXAMPLES: { label: string; code: string; tokens: MathToken[] }[] = [
 { label: 'Trinôme', code: 'POL', tokens: buildTokens('x','sq','-','3','x','+','2') },
 { label: 'Rationnelle', code: 'RAT', tokens: buildTokens('(','x','sq','-','1',')','/', '(','x','-','2',')') },
 { label: 'Racine carrée', code: 'RAD', tokens: buildTokens('sqrt','x','sq','+','1',')') },
 { label: 'Exponentielle', code: 'EXP', tokens: buildTokens('x','*','exp','-','x',')') },
 { label: 'Logarithme', code: 'LOG', tokens: buildTokens('ln','x',')','/','x') },
 { label: 'Trigonométrie', code: 'TRI', tokens: buildTokens('sin','x',')','+','cos','x',')') },
 { label: 'Sigmoïde', code: 'SIG', tokens: buildTokens('1','/','(','1','+','exp','-','x',')',')') },
 { label: 'Inverse', code: 'INV', tokens: buildTokens('1','/','x') },
];

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

export const FunctionInput: React.FC<FunctionInputProps> = ({ onAnalyze, isLoading }) => {
 const [tokens, setTokens] = useState<MathToken[]>([]);
 const [xMin, setXMin] = useState(-10);
 const [xMax, setXMax] = useState(10);
 const [panel, setPanel] = useState<'none' | 'examples' | 'range'>('none');
 const [inputError,setInputError]=useState('');

 const displayText = tokensToDisplay(tokens);
 const mathExpression = tokens.length ? tokensToMathjs(tokens) : '';

 // ── Actions ────────────────────────────────────────────────
 const pushToken = useCallback((id: string) => {
  const token = TOKENS[id];
  if (!token) return;
  setTokens(prev => [...prev, { ...token }]);
 }, []);

 const popToken = useCallback(() => {
  setTokens(prev => prev.length > 0 ? prev.slice(0, -1) : prev);
 }, []);

 const clearTokens = useCallback(() => {
  setTokens([]);
 }, []);

 const analyzeNow = useCallback(() => {
  if (tokens.length === 0) return;
  if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin >= xMax) {
   setInputError('La borne minimale doit être inférieure à la borne maximale.');
   setPanel('range');
   return;
  }
  setInputError('');
  const mathjs = tokensToMathjs(tokens);
  onAnalyze(mathjs, xMin, xMax);
 }, [tokens, xMin, xMax, onAnalyze]);

 const loadExample = useCallback((ex: { tokens: MathToken[] }) => {
  setTokens([...ex.tokens]);
  if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin >= xMax) {
   setInputError('La borne minimale doit être inférieure à la borne maximale.');
   setPanel('range');
   return;
  }
  setPanel('none');setInputError('');
  const mathjs = tokensToMathjs(ex.tokens);
  onAnalyze(mathjs, xMin, xMax);
 }, [xMin, xMax, onAnalyze]);

 const togglePanel = (p: 'examples' | 'range') => {
  setPanel(prev => prev === p ? 'none' : p);
 };

 // ── Render ─────────────────────────────────────────────────
 return (
  <section className="calc-panel">
   <div className="flex items-start justify-between gap-3 mb-3">
    <div>
     <p className="calc-section-title">Saisir une fonction</p>
     <p className="calc-section-copy mt-1">Compose la fonction avec le clavier. L’aperçu utilise la notation mathématique du BAC.</p>
    </div>
    <span className="chip">f(x)</span>
   </div>

   <div className="calc-display justify-start">
    {tokens.length === 0 ? (
     <span className="text-sm muted select-none">Commence par saisir une expression.</span>
    ) : (
     <span className="text-[22px] whitespace-nowrap math-hero flex items-center">
      <MathExpression value={mathExpression || displayText} />
     </span>
    )}
   </div>

   <div className="flex flex-wrap items-center gap-2 mt-3">
    <button type="button" onClick={() => togglePanel('examples')} className={`btn btn-small ${panel === 'examples' ? 'btn-primary' : 'btn-secondary'}`}>Exemples</button>
    <button type="button" onClick={() => togglePanel('range')} className={`btn btn-small ${panel === 'range' ? 'btn-primary' : 'btn-secondary'}`}>Intervalle [{xMin} ; {xMax}]</button>
   </div>

   {panel === 'range' && (
    <div className="grid grid-cols-2 gap-3 mt-3">
     <div><label className="field-label mb-1">Borne minimale</label><input aria-label="Borne minimale" type="number" value={xMin} onChange={e => {setXMin(Number(e.target.value));setInputError('')}} className="field" /></div>
     <div><label className="field-label mb-1">Borne maximale</label><input aria-label="Borne maximale" type="number" value={xMax} onChange={e => {setXMax(Number(e.target.value));setInputError('')}} className="field" /></div>
    </div>
   )}
   {inputError&&<div className="notice notice-danger mt-2" role="alert">{inputError}</div>}

   {panel === 'examples' && (
    <div className="grid grid-cols-2 gap-2 mt-3">
     {PRESET_EXAMPLES.map((ex, i) => (
      <button key={i} onClick={() => loadExample(ex)} className="surface-flat px-3 py-2.5 text-left active:scale-[0.98]">
       <div className="flex items-center gap-2"><span className="chip chip-info">{ex.code}</span><p className="text-[10px] font-bold" style={{ color: 'var(--text-soft)' }}>{ex.label}</p></div>
       <div className="text-sm mt-2 overflow-x-auto" style={{ color: 'var(--text)' }}><MathExpression value={tokensToMathjs(ex.tokens)} /></div>
      </button>
     ))}
    </div>
   )}

   <div className="mt-4">
    <div className="flex items-center justify-between mb-2"><p className="calc-section-title">Clavier mathématique</p><p className="calc-section-copy">Fonctions · nombres · opérateurs</p></div>
    <div className="space-y-1.5">
     {KEYS.map((row, ri) => (
      <div key={ri} className="grid grid-cols-6 gap-1.5">
       {row.map((k, ki) => (
        <button key={`${ri}-${ki}`} type="button" onClick={() => pushToken(k.tokenId)} className={`${COLOR_MAP[k.color]} ${k.span ? `col-span-${k.span}` : ''}`}>{k.label}</button>
       ))}
      </div>
     ))}
     <div className="grid grid-cols-6 gap-1.5 pt-1">
      <button type="button" onClick={clearTokens} className="calc-key action">AC</button>
      <button type="button" onClick={popToken} className="calc-key action" aria-label="Effacer le dernier symbole">⌫</button>
      <button type="button" onClick={analyzeNow} disabled={tokens.length === 0 || isLoading} className="calc-key equal col-span-4">{isLoading ? 'Analyse…' : 'Analyser la fonction'}</button>
     </div>
    </div>
   </div>
  </section>
 );
};

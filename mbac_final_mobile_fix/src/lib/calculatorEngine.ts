import { all, create, evaluate, parse, simplify } from 'mathjs';
import { safeEvaluateExpression } from './expressionCore.js';

const highPrecisionMath = create(all, {
 number: 'BigNumber',
 precision: 64,
});

export type CalculatorMode = 'deg' | 'rad';

export interface CalculationStep {
 label: string;
 expression: string;
 result?: string;
 note?: string;
}

export interface CalculatorQuality {
 level: 'verified' | 'approximate' | 'warning';
 label: string;
 detail: string;
 precisionDigits: number;
}

export interface CalculatorComputation {
 input: string;
 normalizedExpression: string;
 exactExpression: string | null;
 decimalValue: string;
 rawValue: number | string;
 steps: CalculationStep[];
 quality: CalculatorQuality;
}

const OPERATORS: Record<string, string> = {
 '+': 'Addition',
 '-': 'Soustraction',
 '*': 'Multiplication',
 '/': 'Division',
 '^': 'Puissance',
 '%': 'Modulo',
};

function trimNumber(value: number, digits = 12): string {
 if (!Number.isFinite(value)) return String(value);
 if (Math.abs(value) < 1e-14) return '0';
 if (Number.isInteger(value)) return String(value);
 const abs = Math.abs(value);
 if (abs !== 0 && (abs >= 1e12 || abs < 1e-8)) return value.toExponential(10).replace(/0+e/, 'e').replace(/\.e/, 'e');
 return value.toPrecision(digits).replace(/(?:\.0+|(?:(\.\d*?)0+))$/, '$1');
}

function numberFromMathResult(value: unknown): number | null {
 if (typeof value === 'number') return Number.isFinite(value) ? value : null;
 if (value && typeof value === 'object' && 'toNumber' in value && typeof (value as any).toNumber === 'function') {
  const n = (value as any).toNumber();
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
 }
 return null;
}

function convertTrigDegrees(expr: string): string {
 let out='';
 for(let i=0;i<expr.length;){
  let name: 'sin'|'cos'|'tan'|null=null;
  for(const candidate of ['sin','cos','tan'] as const){ if(expr.slice(i,i+candidate.length+1)===`${candidate}(`){name=candidate;break;} }
  if(!name){ out+=expr[i++]; continue; }
  const open=i+name.length; let depth=1,j=open+1;
  while(j<expr.length&&depth>0){ if(expr[j]==='(')depth++; else if(expr[j]===')')depth--; j++; }
  if(depth!==0){ out+=expr.slice(i); break; }
  const arg=convertTrigDegrees(expr.slice(open+1,j-1));
  out+=`${name}(((${arg})*pi)/180)`; i=j;
 }
 return out;
}

export function normalizeCalculatorExpression(input: string, mode: CalculatorMode, lastAnswer = '0'): { expression: string; notes: string[] } {
 let expression = input
  .replace(/[−–—]/g, '-')
  .replace(/×/g, '*')
  .replace(/÷/g, '/')
  .replace(/π/g, 'pi')
  .replace(/√\s*\(/g, 'sqrt(')
  .replace(/²/g, '^2')
  .replace(/³/g, '^3')
  .replace(/ANS/g, `(${lastAnswer})`)
  .replace(/\s+/g, '');

 const notes: string[] = [];
 if (mode === 'deg') {
  expression = convertTrigDegrees(expression);
  if (/sin\(|cos\(|tan\(/.test(input)) notes.push('Les angles trigonométriques sont interprétés en degrés puis convertis en radians pour le calcul.');
 }
 return { expression, notes };
}

function evaluateNode(node: any): number | null {
 try {
  const result = evaluate(node.toString());
  return numberFromMathResult(result);
 } catch {
  return null;
 }
}

function buildTrace(node: any, steps: CalculationStep[], depth = 0): void {
 if (!node || depth > 12) return;

 if (node.isParenthesisNode) {
  buildTrace(node.content, steps, depth + 1);
  return;
 }

 if (Array.isArray(node.args)) {
  for (const child of node.args) buildTrace(child, steps, depth + 1);
 }

 if (node.isOperatorNode) {
  const value = evaluateNode(node);
  if (value === null) return;
  const label = OPERATORS[node.op] || 'Calcul';
  const expression = node.toString();
  const result = trimNumber(value);
  if (!steps.some(s => s.expression === expression && s.result === result)) {
   steps.push({ label, expression, result });
  }
  return;
 }

 if (node.isFunctionNode) {
  const value = evaluateNode(node);
  if (value === null) return;
  const functionName = String(node.fn?.name || 'fonction');
  const label = functionName === 'sqrt' ? 'Racine carrée' : functionName === 'log' ? 'Logarithme népérien' : `Fonction ${functionName}`;
  const expression = node.toString();
  const result = trimNumber(value);
  if (!steps.some(s => s.expression === expression && s.result === result)) {
   steps.push({ label, expression, result });
  }
 }
}

function highPrecisionCheck(expression: string, standardValue: number): CalculatorQuality {
 try {
  const hp = highPrecisionMath.evaluate(expression) as any;
  const hpNumber = numberFromMathResult(hp);
  if (hpNumber === null) return { level:'approximate',label:'Résultat numérique',detail:'Le contrôle haute précision n’est pas disponible pour cette expression.',precisionDigits:10 };
  const scale=Math.max(1,Math.abs(hpNumber),Math.abs(standardValue));
  const hpError=Math.abs(hpNumber-standardValue)/scale;
  if(hpError>1e-9)return{level:'warning',label:'À contrôler',detail:'Le calcul standard et le calcul haute précision ne concordent pas suffisamment.',precisionDigits:6};

  // Independent evaluator: a separate AST/evaluator, not MathJS. It covers the BAC real-function core.
  const independent=safeEvaluateExpression(expression,{});
  if(independent!==null){
   const indScale=Math.max(1,Math.abs(independent),Math.abs(standardValue));
   const indError=Math.abs(independent-standardValue)/indScale;
   if(indError>1e-10)return{level:'warning',label:'À contrôler',detail:'Le moteur MathJS et le moteur indépendant de contrôle donnent des valeurs différentes.',precisionDigits:6};
   return{level:hpError<=1e-12?'verified':'approximate',label:hpError<=1e-12?'Calcul vérifié':'Valeur approchée vérifiée',detail:'Trois évaluations concordent : calcul standard, haute précision et moteur AST indépendant.',precisionDigits:hpError<=1e-12?10:8};
  }
  return{level:'approximate',label:'Calcul numérique contrôlé',detail:'Le calcul standard et le calcul haute précision concordent, mais cette syntaxe n’est pas prise en charge par le moteur indépendant. Le résultat reste signalé comme numérique.',precisionDigits:10};
 } catch {
  return { level:'approximate',label:'Valeur approchée',detail:'Le résultat est numérique et le contrôle indépendant complet n’a pas pu être effectué.',precisionDigits:10 };
 }
}

function safeExactExpression(expression: string, numericValue: number): string | null {
 try {
  const simplified = simplify(expression).toString();
  if (!simplified || simplified.length > 120) return null;
  const numericOnly = /^[0-9+\-*/^().\s]+$/.test(expression);
  if (!numericOnly) return null;
  const simplifiedValue = numberFromMathResult(evaluate(simplified));
  if (simplifiedValue === null) return null;
  const tol = 1e-12 * Math.max(1, Math.abs(numericValue));
  if (Math.abs(simplifiedValue - numericValue) > tol) return null;
  return simplified;
 } catch {
  return null;
 }
}

export function computeCalculator(input: string, mode: CalculatorMode, lastAnswer = '0'): CalculatorComputation {
 const { expression, notes } = normalizeCalculatorExpression(input, mode, lastAnswer);
 if (!expression) throw new Error('Expression vide');

 const parsed = parse(expression);
 const raw = evaluate(expression);
 const numeric = numberFromMathResult(raw);
 if (numeric === null) {
  const text = String(raw);
  return {
   input,
   normalizedExpression: expression,
   exactExpression: null,
   decimalValue: text,
   rawValue: text,
   steps: [{ label: 'Résultat', expression, result: text }],
   quality: { level: 'warning', label: 'Résultat hors calcul réel simple', detail: 'Le moteur n’a pas obtenu un nombre réel fini. Utilise l’outil nombres complexes si nécessaire, ou vérifie le domaine avant de retenir ce résultat.', precisionDigits: 0 },
  };
 }

 const steps: CalculationStep[] = [
  { label: 'Expression de départ', expression: input, note: mode === 'deg' ? 'Mode degrés' : 'Mode radians' },
  ...notes.map(note => ({ label: 'Convention', expression: input, note })),
 ];
 buildTrace(parsed, steps);

 const decimalValue = trimNumber(numeric, 12);
 const exactExpression = safeExactExpression(expression, numeric);
 if (steps.length === 1 || steps[steps.length - 1].result !== decimalValue) {
  steps.push({ label: 'Résultat final', expression, result: decimalValue });
 }

 return {
  input,
  normalizedExpression: expression,
  exactExpression,
  decimalValue,
  rawValue: numeric,
  steps,
  quality: highPrecisionCheck(expression, numeric),
 };
}

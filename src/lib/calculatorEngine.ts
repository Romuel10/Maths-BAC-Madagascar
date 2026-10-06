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

function convertAngleFunctionsDegrees(expr: string): string {
 let out='';
 const direct=['sin','cos','tan'] as const;
 const inverse=['asin','acos','atan'] as const;
 const candidates=[...inverse,...direct];
 for(let i=0;i<expr.length;){
  const name=candidates.find(candidate=>expr.slice(i,i+candidate.length+1)===`${candidate}(`);
  if(!name){out+=expr[i++];continue;}
  const open=i+name.length;let depth=1,j=open+1;
  while(j<expr.length&&depth>0){if(expr[j]==='(')depth++;else if(expr[j]===')')depth--;j++;}
  if(depth!==0){out+=expr.slice(i);break;}
  const arg=convertAngleFunctionsDegrees(expr.slice(open+1,j-1));
  if((direct as readonly string[]).includes(name))out+=`${name}(((${arg})*pi)/180)`;
  else out+=`(${name}(${arg})*180/pi)`;
  i=j;
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
  expression = convertAngleFunctionsDegrees(expression);
  if (/\b(?:a?sin|a?cos|a?tan)\(/.test(input)) notes.push('En mode degrés, les fonctions trigonométriques directes prennent des degrés et les fonctions réciproques renvoient des degrés.');
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

// BigInt provides an independent, exact check for integer arithmetic, including
// values that cannot be represented by a JavaScript Number.
function exactInteger(node:any,depth=0):bigint|null{
 if(!node||depth>30)return null;
 if(node.isParenthesisNode)return exactInteger(node.content,depth+1);
 if(node.isConstantNode){
  const text=node.value?.toFixed?.()??String(node.value);
  return /^-?\d+$/.test(text)&&text.length<=500?BigInt(text):null;
 }
 if(!node.isOperatorNode)return null;
 const a=exactInteger(node.args[0],depth+1);if(a===null)return null;
 if(node.args.length===1)return node.op==='-'?-a:node.op==='+'?a:null;
 const b=exactInteger(node.args[1],depth+1);if(b===null)return null;
 let result:bigint;
 if(node.op==='+')result=a+b;
 else if(node.op==='-')result=a-b;
 else if(node.op==='*')result=a*b;
 else if(node.op==='/'&&b!==0n&&a%b===0n)result=a/b;
 else if(node.op==='^'&&b>=0n&&b<=1024n)result=a**b;
 else return null;
 return result.toString().length<=500?result:null;
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
  const hpError=typeof hp?.minus==='function'?Number(hp.minus(highPrecisionMath.bignumber(String(standardValue))).abs().div(scale).toString()):Math.abs(hpNumber-standardValue)/scale;
  if(Number.isInteger(standardValue)&&!Number.isSafeInteger(standardValue))return{level:'approximate',label:'Valeur approchée',detail:'Cette valeur dépasse la précision des entiers JavaScript. Le contrôle numérique ne constitue pas une preuve du chiffre des unités.',precisionDigits:10};
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

 const integer=exactInteger(highPrecisionMath.parse(expression));
 if(integer!==null&&(integer>BigInt(Number.MAX_SAFE_INTEGER)||integer<BigInt(Number.MIN_SAFE_INTEGER))){
  const value=integer.toString();
  const hp=highPrecisionMath.evaluate(expression) as any;
  const concordant=typeof hp?.eq==='function'&&hp.eq(highPrecisionMath.bignumber(value));
  return{input,normalizedExpression:expression,exactExpression:value,decimalValue:value,rawValue:value,steps:[{label:'Expression de départ',expression:input},{label:'Calcul entier exact',expression,result:value}],quality:{level:concordant?'verified':'warning',label:concordant?'Entier exact vérifié':'Entier exact à contrôler',detail:concordant?'Calcul entier BigInt et calcul haute précision concordants, sans conversion vers un nombre approché.':'Le contrôle haute précision ne concorde pas avec le calcul entier exact.',precisionDigits:value.replace('-','').length}};
 }

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

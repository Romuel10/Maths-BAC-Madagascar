import { parseExpressionCore, evaluateConstantNode } from './expressionCore.js';
import type { DNode } from './derivativeEngine.js';

export type Polynomial = number[]; // coefficient of variable^i
const EPS = 1e-12;

function trim(p: Polynomial): Polynomial {
 const out = p.slice();
 while (out.length > 1 && Math.abs(out[out.length - 1]) < EPS) out.pop();
 return out.map(v => Math.abs(v) < EPS ? 0 : v);
}
function add(a: Polynomial, b: Polynomial, sign = 1): Polynomial {
 const n = Math.max(a.length, b.length), out = Array(n).fill(0);
 for (let i = 0; i < n; i++) out[i] = (a[i] || 0) + sign * (b[i] || 0);
 return trim(out);
}
function mul(a: Polynomial, b: Polynomial, maxDegree: number): Polynomial | null {
 if (a.length + b.length - 2 > maxDegree) return null;
 const out = Array(a.length + b.length - 1).fill(0);
 for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) out[i + j] += a[i] * b[j];
 return trim(out);
}
function pow(a: Polynomial, n: number, maxDegree: number): Polynomial | null {
 if (!Number.isInteger(n) || n < 0 || (a.length - 1) * n > maxDegree) return null;
 let out: Polynomial = [1], base = a.slice(), e = n;
 while (e > 0) {
  if (e & 1) { const m = mul(out, base, maxDegree); if (!m) return null; out = m; }
  e >>= 1;
  if (e) { const m = mul(base, base, maxDegree); if (!m) return null; base = m; }
 }
 return trim(out);
}

function visitPolynomial(node: DNode, variable: string, maxDegree: number): Polynomial | null {
 if (node.kind === 'num') return [node.value];
 if (node.kind === 'sym') {
  if (node.name === variable) return [0, 1];
  const c = evaluateConstantNode(node);
  return c === null ? null : [c];
 }
 if (node.kind === 'neg') {
  const p = visitPolynomial(node.value, variable, maxDegree);
  return p ? p.map(v => -v) : null;
 }
 if (node.kind === 'func') {
  const c = evaluateConstantNode(node);
  return c === null ? null : [c];
 }
 const a = visitPolynomial(node.left, variable, maxDegree);
 if (node.op === '^') {
  if (!a) return null;
  const exponent = evaluateConstantNode(node.right);
  return exponent === null ? null : pow(a, exponent, maxDegree);
 }
 const b = visitPolynomial(node.right, variable, maxDegree);
 if (!a || !b) return null;
 if (node.op === '+') return add(a, b, 1);
 if (node.op === '-') return add(a, b, -1);
 if (node.op === '*') return mul(a, b, maxDegree);
 if (node.op === '/') {
  if (b.length !== 1 || Math.abs(b[0]) <= EPS) return null;
  return trim(a.map(x => x / b[0]));
 }
 return null;
}

export function parsePolynomial(expr: string, variable = 'x', maxDegree = 8): Polynomial | null {
 try {
  const p = visitPolynomial(parseExpressionCore(expr), variable, maxDegree);
  if (!p || p.length - 1 > maxDegree || p.some(v => !Number.isFinite(v))) return null;
  return trim(p);
 } catch { return null; }
}

export function polynomialDegree(p: Polynomial): number { return trim(p).length - 1; }
export function polynomialValue(p: Polynomial, x: number): number {
 let y = 0; for (let i = p.length - 1; i >= 0; i--) y = y * x + p[i]; return y;
}
export function polynomialDerivative(p: Polynomial): Polynomial {
 if (p.length <= 1) return [0]; return trim(p.slice(1).map((v, i) => v * (i + 1)));
}
export function polynomialAdd(a: Polynomial, b: Polynomial): Polynomial { return add(a,b,1); }
export function polynomialSub(a: Polynomial, b: Polynomial): Polynomial { return add(a,b,-1); }
export function polynomialMul(a: Polynomial, b: Polynomial, maxDegree = 20): Polynomial | null { return mul(a,b,maxDegree); }
export function polynomialScale(a: Polynomial, k: number): Polynomial { return trim(a.map(v=>v*k)); }
export function polynomialPow(a: Polynomial, n:number, maxDegree=20): Polynomial|null { return pow(a,n,maxDegree); }

function fmtCoef(v: number): string {
 const r = Math.abs(v - Math.round(v)) < 1e-10 ? Math.round(v) : Math.round(v * 1e10) / 1e10;
 return String(r);
}
export function formatPolynomial(p0: Polynomial, variable = 'x'): string {
 const p = trim(p0);
 const terms: string[] = [];
 for (let i = p.length - 1; i >= 0; i--) {
  const c = p[i]; if (Math.abs(c) < EPS) continue;
  const sign = c < 0 ? '-' : '+'; const a = Math.abs(c);
  let body: string;
  if (i === 0) body = fmtCoef(a);
  else {
   const coef = Math.abs(a - 1) < EPS ? '' : `${fmtCoef(a)}*`;
   body = i === 1 ? `${coef}${variable}` : `${coef}${variable}^${i}`;
  }
  if (!terms.length) terms.push(sign === '-' ? `-${body}` : body);
  else terms.push(`${sign}${body}`);
 }
 return terms.length ? terms.join('') : '0';
}

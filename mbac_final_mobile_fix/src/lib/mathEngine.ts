import { parse, derivative } from 'mathjs';
import { deriveWithBacEngine, type DNode } from './derivativeEngine.js';
import { parsePolynomial, polynomialDegree } from './polynomialEngine.js';
import { solveQuadraticReal } from './algebraCore.js';
import { analyzeSequenceVerified, type SequenceResult as VerifiedSequenceResult } from './sequenceEngine.js';
import { parseRationalPolynomial, rationalExcludedPoints, rationalLimitAtFinite, rationalLimitAtInfinity, realPolynomialRoots, rootMultiplicity } from './rationalEngine.js';
import { tryExactDefiniteIntegral, tryExactPrimitive } from './integralEngine.js';
import { parseExpressionCore, evaluateConstantNode, safeEvaluateExpression } from './expressionCore.js';
import { solveEquationVerified, type EquationResult } from './equationEngine.js';
import { exactLimitAtInfinity, exactElementaryBoundaryLimit } from './limitEngine.js';
import { certifyContinuousOnInterval } from './intervalDomainEngine.js';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ReliabilityCheck {
 label: string;
 ok: boolean;
 detail: string;
}

export interface AnalysisQuality {
 level: 'verified' | 'approximate' | 'warning';
 title: string;
 detail: string;
 checks: ReliabilityCheck[];
}

export interface AnalysisResult {
 expression: string;
 domain: DomainInfo;
 limits: LimitInfo[];
 variation: VariationInfo;
 plotData: PlotPoint[];
 derivativeExpr: string;
 secondDerivativeExpr: string;
 derivativeWarnings?: string[];
 steps: AnalysisSteps;
 zeros: ZeroInfo[];
 signTable: SignInterval[];
 parity: ParityInfo;
 convexity: ConvexityInfo;
 primitiveExpr: string;
 asymptotes: AsymptoteInfo;
 periodicity: PeriodicityInfo;
 quality: AnalysisQuality;
}

export interface AnalysisSteps {
 domainSteps: DomainStep[];
 derivativeSteps: DerivativeStep[];
 criticalPointSteps: CriticalPointStep[];
 limitSteps: LimitStep[];
}

export interface DomainStep {
 rule: string;
 condition: string;
 equation: string;
 solution: string;
 result: string[];
}

export interface DerivativeStep {
 rule: string;
 formula: string;
 application: string;
 before?: string;
 after?: string;
 lines?: string[];
}

export interface CriticalPointStep {
 equation: string;
 solving: string;
 solutions: number[];
 verification: { x: number; y: number; signBefore: string; signAfter: string; conclusion: string }[];
}

export interface LimitStep {
 point: string;
 method: string;
 calculation: string;
 result: string;
}

export interface DomainInfo {
 description: string;
 excludedPoints: number[];
 intervals: string[];
 type: 'R' | 'restricted';
 restrictions: { type: string; expression: string; condition: string }[];
}

export interface LimitInfo {
 point: string;
 direction: string;
 value: string;
 explanation?: string;
}

export interface VariationInfo {
 criticalPoints: { x: number; y: number; type: string }[];
 intervals: { from: string; to: string; direction: 'increasing' | 'decreasing' | 'constant'; signDerivative: string }[];
}

export interface PlotPoint {
 x: number;
 y: number;
}

export interface ZeroInfo {
 x: number;
 multiplicity: number;
 method: string;
}

export interface SignInterval {
 from: string;
 to: string;
 sign: '+' | '-' | '0';
 includeFrom: boolean;
 includeTo: boolean;
}

export interface ParityInfo {
 type: 'even' | 'odd' | 'neither';
 explanation: string;
 verification: string;
 proven?: boolean;
}

export interface ConvexityInfo {
 intervals: { from: string; to: string; type: 'convex' | 'concave'; signSecondDeriv: string }[];
 inflectionPoints: { x: number; y: number }[];
}

export interface AsymptoteInfo {
 vertical: { x: number; limitLeft: string; limitRight: string }[];
 horizontal: { y: number; direction: string }[];
 oblique: { a: number; b: number; direction: string }[];
}

export interface PeriodicityInfo {
 isPeriodic: boolean;
 period: number | null;
 explanation: string;
 proven?: boolean;
}

export interface TangentInfo {
 point: { x: number; y: number };
 slope: number;
 equation: string;
 yIntercept: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function safeEval(expr: string, x: number): number | null {
 return safeEvaluateExpression(expr,{x});
}

function formatNumber(n: number): string {
 if (Number.isInteger(n)) return String(n);
 const rounded = Math.round(n * 10000) / 10000;
 if (Number.isInteger(rounded)) return String(rounded);
 return rounded.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}


// ═══════════════════════════════════════════════════════════════════════════
// STUDENT-FRIENDLY ALGEBRAIC NORMALIZATION
// Keeps rational polynomial results in one clear fraction, reduces common
// polynomial factors and avoids nested fractions in final BAC-style answers.
// ═══════════════════════════════════════════════════════════════════════════

type Poly = number[]; // coefficient of x^i
type RationalPoly = { num: Poly; den: Poly };

function polyTrim(p: Poly): Poly {
 const out = p.slice();
 while (out.length > 1 && Math.abs(out[out.length - 1]) < 1e-11) out.pop();
 return out.map(v => Math.abs(v) < 1e-12 ? 0 : v);
}
function polyAdd(a: Poly, b: Poly): Poly {
 const n = Math.max(a.length, b.length), out = Array(n).fill(0);
 for (let i=0;i<n;i++) out[i]=(a[i]||0)+(b[i]||0);
 return polyTrim(out);
}
function polySub(a: Poly, b: Poly): Poly { return polyAdd(a, b.map(v => -v)); }
function polyMul(a: Poly, b: Poly): Poly {
 const out = Array(a.length + b.length - 1).fill(0);
 for (let i=0;i<a.length;i++) for (let j=0;j<b.length;j++) out[i+j]+=a[i]*b[j];
 return polyTrim(out);
}
function polyScale(a: Poly, k: number): Poly { return polyTrim(a.map(v => v*k)); }
function polyPow(a: Poly, n: number): Poly {
 let out: Poly=[1], base=a;
 let e=n;
 while(e>0){ if(e%2===1) out=polyMul(out,base); base=polyMul(base,base); e=Math.floor(e/2); }
 return out;
}
function polyDivMod(a0: Poly, b0: Poly): { q: Poly; r: Poly } | null {
 let a=polyTrim(a0), b=polyTrim(b0);
 if (b.length===1 && Math.abs(b[0])<1e-12) return null;
 if (a.length < b.length) return {q:[0], r:a};
 const q=Array(a.length-b.length+1).fill(0);
 let r=a.slice();
 let guard=0;
 while(r.length>=b.length && !(r.length===1 && Math.abs(r[0])<1e-10) && guard++<50){
  const k=r.length-b.length;
  const c=r[r.length-1]/b[b.length-1];
  q[k]=c;
  const sub=Array(k).fill(0).concat(polyScale(b,c));
  r=polyTrim(polySub(r,sub));
 }
 return {q:polyTrim(q), r:polyTrim(r)};
}
function polyMonic(a: Poly): Poly {
 const p=polyTrim(a); const lead=p[p.length-1];
 if(Math.abs(lead)<1e-12) return [0];
 return polyScale(p,1/lead);
}
function polyGcd(a0: Poly,b0: Poly): Poly {
 let a=polyTrim(a0), b=polyTrim(b0), guard=0;
 while(!(b.length===1 && Math.abs(b[0])<1e-9) && guard++<30){
  const dm=polyDivMod(a,b); if(!dm) break;
  a=b; b=dm.r.map(v => Math.abs(v)<1e-8?0:v);
 }
 return polyMonic(a);
}
function rationalReduce(r: RationalPoly): RationalPoly {
 let num=polyTrim(r.num), den=polyTrim(r.den);
 if(den.length===1 && Math.abs(den[0])<1e-12) return r;
 const g=polyGcd(num,den);
 if(!(g.length===1 && Math.abs(g[0]-1)<1e-8)){
  const dn=polyDivMod(num,g), dd=polyDivMod(den,g);
  if(dn && dd && dn.r.every(v=>Math.abs(v)<1e-7) && dd.r.every(v=>Math.abs(v)<1e-7)){ num=dn.q; den=dd.q; }
 }
 const lead=den[den.length-1];
 if(lead<0){ num=polyScale(num,-1); den=polyScale(den,-1); }
 // A constant denominator is absorbed into the numerator.
 if (den.length === 1 && Math.abs(den[0]) > 1e-12 && Math.abs(den[0]-1) > 1e-12) {
  num = polyScale(num, 1/den[0]); den = [1];
 }
 // Normalize almost-integer coefficients after algebraic operations.
 const clean=(p:Poly)=>p.map(v=>Math.abs(v-Math.round(v))<1e-9?Math.round(v):Math.round(v*1e10)/1e10);
 return {num:polyTrim(clean(num)), den:polyTrim(clean(den))};
}
function nodeToRationalPoly(node:any): RationalPoly | null {
 if(node?.isParenthesisNode) return nodeToRationalPoly(node.content);
 if(node?.isConstantNode){ const v=Number(node.value); return Number.isFinite(v)?{num:[v],den:[1]}:null; }
 if(node?.isSymbolNode){ return node.name==='x'?{num:[0,1],den:[1]}:null; }
 if(!node?.isOperatorNode) return null;
 const args=node.args||[];
 if(node.op==='-' && args.length===1){ const r=nodeToRationalPoly(args[0]); return r?{num:polyScale(r.num,-1),den:r.den}:null; }
 if(args.length!==2) return null;
 const A=nodeToRationalPoly(args[0]), B=nodeToRationalPoly(args[1]);
 if(!A||!B) return null;
 if(node.op==='+') return rationalReduce({num:polyAdd(polyMul(A.num,B.den),polyMul(B.num,A.den)),den:polyMul(A.den,B.den)});
 if(node.op==='-') return rationalReduce({num:polySub(polyMul(A.num,B.den),polyMul(B.num,A.den)),den:polyMul(A.den,B.den)});
 if(node.op==='*') return rationalReduce({num:polyMul(A.num,B.num),den:polyMul(A.den,B.den)});
 if(node.op==='/') return rationalReduce({num:polyMul(A.num,B.den),den:polyMul(A.den,B.num)});
 if(node.op==='^'){
  const exponent=Number(args[1]?.toString?.());
  if(Number.isInteger(exponent) && Math.abs(exponent)<=12){
   if(exponent>=0) return rationalReduce({num:polyPow(A.num,exponent),den:polyPow(A.den,exponent)});
   return rationalReduce({num:polyPow(A.den,-exponent),den:polyPow(A.num,-exponent)});
  }
 }
 return null;
}
function formatPoly(p0: Poly): string {
 const p=polyTrim(p0);
 if(p.every(v=>Math.abs(v)<1e-12)) return '0';
 const parts:string[]=[];
 for(let i=p.length-1;i>=0;i--){
  const c=p[i]; if(Math.abs(c)<1e-12) continue;
  const sign=c<0?'-':'+'; const a=Math.abs(c);
  const coeff=(i>0 && Math.abs(a-1)<1e-12)?'':formatNumber(a);
  const term=i===0?formatNumber(a):i===1?`${coeff}x`:`${coeff}x^${i}`;
  if(parts.length===0) parts.push(sign==='-'?`-${term}`:term); else parts.push(` ${sign} ${term}`);
 }
 return parts.join('');
}
// ═══════════════════════════════════════════════════════════════════════════
// DOMAIN CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

function collectRestrictions(expr: string): { type: string; expression: string; condition: string }[] {
 const restrictions: { type: string; expression: string; condition: string }[] = [];
 const add = (type: string, expression: string, condition: string) => {
  const clean = expression.replace(/\s+/g, ' ').trim();
  if (!restrictions.some(r => r.type === type && r.expression === clean)) {
   restrictions.push({ type, expression: clean, condition });
  }
 };

 try {
  const root: any = parse(expr);
  root.traverse((node: any) => {
   if (node?.isOperatorNode && node.op === '/' && Array.isArray(node.args) && node.args[1]) {
    const denom = node.args[1].toString();
    if (denom.includes('x')) add('division', denom, `${denom} ≠ 0`);
   }
   if (node?.isFunctionNode) {
    const name = String(node.fn?.name || '').toLowerCase();
    const arg = node.args?.[0]?.toString?.();
    if (!arg || !arg.includes('x')) return;
    if (name === 'sqrt') add('sqrt', arg, `${arg} ≥ 0`);
    if (name === 'log' || name === 'ln') add('log', arg, `${arg} > 0`);
   }
  });
 } catch {
  // L'expression sera déjà rejetée par analyzeFunction si elle est invalide.
 }

 return restrictions;
}

function polynomialRootsUpToDegree2(expr: string): number[] | null {
 try {
  const p = parsePolynomial(expr, 'x', 2);
  if (!p || polynomialDegree(p) > 2) return null;
  const a = p[2] || 0, b = p[1] || 0, c = p[0] || 0;
  const scale = Math.max(1, Math.abs(a), Math.abs(b), Math.abs(c));
  const eps = 1e-12 * scale;
  if (Math.abs(a) <= eps) {
   if (Math.abs(b) <= eps) return [];
   return [-c / b];
  }
  const delta = b * b - 4 * a * c;
  const deltaTol = 1e-12 * Math.max(1, Math.abs(b * b), Math.abs(4 * a * c));
  if (delta < -deltaTol) return [];
  if (Math.abs(delta) <= deltaTol) return [-b / (2 * a)];
  const sqrtDelta = Math.sqrt(Math.max(0, delta));
  return [(-b - sqrtDelta) / (2 * a), (-b + sqrtDelta) / (2 * a)].sort((x, y) => x - y);
 } catch {
  return null;
 }
}

function approximateRoots(expr: string, min = -100, max = 100): number[] {
 const roots: number[] = [];
 const step = 0.25;
 let prevX = min;
 let prev = safeEval(expr, prevX);
 for (let x = min + step; x <= max; x += step) {
  const current = safeEval(expr, x);
  if (current !== null && Math.abs(current) < 1e-5) {
   const r = Math.round(x * 1e6) / 1e6;
   if (!roots.some(v => Math.abs(v - r) < 1e-3)) roots.push(r);
  } else if (prev !== null && current !== null && prev * current < 0) {
   const refined = refineZero(expr, prevX, x);
   if (refined !== null && !roots.some(v => Math.abs(v - refined) < 1e-3)) roots.push(refined);
  }
  prevX = x;
  prev = current;
 }
 return roots.sort((a, b) => a - b);
}

function restrictionRoots(restrictionExpr: string): number[] {
 const symbolic = polynomialRootsUpToDegree2(restrictionExpr);
 if (symbolic !== null) return symbolic.map(v => Math.round(v * 1e8) / 1e8);
 return approximateRoots(restrictionExpr);
}

function findExcludedPoints(expr: string): { points: number[]; restrictions: { type: string; expression: string; condition: string }[] } {
 const restrictions = collectRestrictions(expr);
 const excluded: number[] = [];

 for (const restriction of restrictions) {
  if (restriction.type !== 'division') continue;
  for (const root of restrictionRoots(restriction.expression)) {
   if (!excluded.some(v => Math.abs(v - root) < 1e-7)) excluded.push(root);
  }
 }

 return { points: excluded.sort((a, b) => a - b), restrictions };
}

function finiteDomainIntervals(expr: string, restrictions: { type: string; expression: string; condition: string }[], excluded: number[]): string[] {
 const boundaries = [...excluded];
 for (const restriction of restrictions) {
  for (const root of restrictionRoots(restriction.expression)) {
   if (!boundaries.some(v => Math.abs(v - root) < 1e-7)) boundaries.push(root);
  }
 }
 boundaries.sort((a, b) => a - b);

 if (boundaries.length === 0) {
  const probes = [-1000, -10, 0, 10, 1000];
  const defined = probes.filter(x => safeEval(expr, x) !== null).length;
  return defined >= 4 ? [']-∞ ; +∞['] : [];
 }

 const intervals: string[] = [];
 const endpointDefined = (x: number) => safeEval(expr, x) !== null;
 const far = (x: number) => Math.max(10, Math.abs(x) + 5);

 const first = boundaries[0];
 if (safeEval(expr, first - far(first)) !== null) {
  intervals.push(`]-∞ ; ${formatNumber(first)}${endpointDefined(first) ? ']' : '['}`);
 }

 for (let i = 0; i < boundaries.length - 1; i++) {
  const left = boundaries[i];
  const right = boundaries[i + 1];
  const mid = (left + right) / 2;
  if (safeEval(expr, mid) === null) continue;
  const leftBracket = endpointDefined(left) ? '[' : ']';
  const rightBracket = endpointDefined(right) ? ']' : '[';
  intervals.push(`${leftBracket}${formatNumber(left)} ; ${formatNumber(right)}${rightBracket}`);
 }

 const last = boundaries[boundaries.length - 1];
 if (safeEval(expr, last + far(last)) !== null) {
  intervals.push(`${endpointDefined(last) ? '[' : ']'}${formatNumber(last)} ; +∞[`);
 }

 // Cas rare où le domaine contient seulement un ou plusieurs points isolés.
 for (let i = 0; i < boundaries.length; i++) {
  const x = boundaries[i];
  if (!endpointDefined(x)) continue;
  const left = i === 0 ? x - 1 : (boundaries[i - 1] + x) / 2;
  const right = i === boundaries.length - 1 ? x + 1 : (x + boundaries[i + 1]) / 2;
  if (safeEval(expr, left) === null && safeEval(expr, right) === null) {
   intervals.push(`{${formatNumber(x)}}`);
  }
 }

 return [...new Set(intervals)];
}

function computeDomain(expr: string): DomainInfo {
 // Exact rational path first. This preserves holes created by a cancelled factor.
 const rational = parseRationalPolynomial(expr, 'x', 20);
 if (rational) {
  const ex = rationalExcludedPoints(rational);
  if (ex.complete) {
   const excluded = ex.points.map(x => Math.abs(x) < 1e-12 ? 0 : x).sort((a,b)=>a-b);
   if (excluded.length === 0) {
    return { description: 'ℝ (tous les réels)', excludedPoints: [], intervals: [']-∞ ; +∞['], type: 'R', restrictions: [] };
   }
   const intervals: string[] = [];
   intervals.push(`]-∞ ; ${formatNumber(excluded[0])}[`);
   for (let i=0;i<excluded.length-1;i++) intervals.push(`]${formatNumber(excluded[i])} ; ${formatNumber(excluded[i+1])}[`);
   intervals.push(`]${formatNumber(excluded[excluded.length-1])} ; +∞[`);
   const restrictions = [{ type:'division', expression:'dénominateur', condition:`x ≠ ${excluded.map(formatNumber).join(', ')}` }];
   return { description: intervals.join(' ∪ '), excludedPoints: excluded, intervals, type:'restricted', restrictions };
  }
 }

 const restrictions = collectRestrictions(expr);
 const restrictionsExact = restrictions.every(r => { const p=parsePolynomial(r.expression,'x',2); return !!p && polynomialDegree(p)<=2; });
 if (!restrictionsExact && restrictions.length>0) {
  const exactExcluded:number[]=[];
  for(const r of restrictions){if(r.type!=='division')continue;const p=parsePolynomial(r.expression,'x',2);if(!p||polynomialDegree(p)>2)continue;const sol=solveQuadraticReal(p[2]||0,p[1]||0,p[0]||0);for(const x of sol.roots)if(!exactExcluded.some(v=>Math.abs(v-x)<1e-9))exactExcluded.push(x);}
  return { description:'Domaine non déterminé automatiquement — appliquer les conditions affichées', excludedPoints:exactExcluded.sort((a,b)=>a-b), intervals:[], type:'restricted', restrictions };
 }
 const excluded:number[]=[];
 for(const r of restrictions){if(r.type!=='division')continue;for(const x of restrictionRoots(r.expression))if(!excluded.some(v=>Math.abs(v-x)<1e-9))excluded.push(x);}
 excluded.sort((a,b)=>a-b);
 if (restrictions.length === 0) {
  return { description: 'ℝ (tous les réels)', excludedPoints: [], intervals: [']-∞ ; +∞['], type: 'R', restrictions: [] };
 }
 const intervals = finiteDomainIntervals(expr, restrictions, excluded);
 if (intervals.length > 0) {
  const allReal = intervals.length === 1 && intervals[0] === ']-∞ ; +∞[';
  return { description: allReal ? 'ℝ (tous les réels)' : intervals.join(' ∪ '), excludedPoints: excluded, intervals, type: allReal ? 'R' : 'restricted', restrictions };
 }
 return { description: 'Domaine restreint — utiliser les conditions indiquées', excludedPoints: excluded, intervals: [], type: 'restricted', restrictions };
}

// ═══════════════════════════════════════════════════════════════════════════
// ZEROS CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

function findZeros(expr: string, xMin: number, xMax: number): ZeroInfo[] {
 // Exact rational path first: zeros are numerator roots, but denominator exclusions stay forbidden.
 const rat = parseRationalPolynomial(expr, 'x', 12);
 if (rat) {
  const roots = realPolynomialRoots(rat.num);
  const ex = rationalExcludedPoints(rat);
  if (roots !== null && ex.complete) {
   return roots
    .filter(x => x>=xMin-1e-10 && x<=xMax+1e-10 && !ex.points.some(p=>Math.abs(p-x)<1e-8))
    .map(x => ({ x, multiplicity: Math.max(1, rootMultiplicity(rat.num, x)), method: 'Résolution algébrique exacte du numérateur' }));
  }
 }
 // Exact path for affine/quadratic polynomials: do not approximate roots by scanning.
 const poly=parsePolynomial(expr,'x',2);
 if(poly && polynomialDegree(poly)<=2){
  const solved=solveQuadraticReal(poly[2]||0,poly[1]||0,poly[0]||0);
  if(solved.kind==='all') return [];
  return solved.roots.filter(x=>x>=xMin-1e-10&&x<=xMax+1e-10).map(x=>({x,multiplicity:solved.kind==='double'?2:1,method:'Résolution algébrique exacte'}));
 }
 const zeros: ZeroInfo[] = [];
 const step = Math.max(0.001, (xMax-xMin)/20000);
 let prevVal = safeEval(expr, xMin);

 for (let x = xMin + step; x <= xMax; x += step) {
  const val = safeEval(expr, x);
  if (val === null || prevVal === null) {
   prevVal = val;
   continue;
  }

  // Zero crossing
  if (prevVal * val < 0) {
   const zero = refineZero(expr, x - step, x);
   if (zero !== null && !zeros.some(z => Math.abs(z.x - zero) < 0.01)) {
    zeros.push({
     x: Math.round(zero * 1000) / 1000,
     multiplicity: 1,
     method: 'Changement de signe'
    });
   }
  }

  // Touch zero
  if (Math.abs(val) < 0.001) {
   const rounded = Math.round(x * 100) / 100;
   if (!zeros.some(z => Math.abs(z.x - rounded) < 0.01)) {
    zeros.push({
     x: rounded,
     multiplicity: 1,
     method: 'Valeur proche de 0'
    });
   }
  }

  prevVal = val;
 }

 return zeros.sort((a, b) => a.x - b.x);
}

function refineZero(expr: string, a: number, b: number): number | null {
 let lo = a, hi = b;
 for (let i = 0; i < 50; i++) {
  const mid = (lo + hi) / 2;
  const fMid = safeEval(expr, mid);
  const fLo = safeEval(expr, lo);
  if (fMid === null || fLo === null) return mid;
  if (Math.abs(fMid) < 1e-10) return mid;
  if (fLo * fMid < 0) hi = mid;
  else lo = mid;
 }
 return (lo + hi) / 2;
}

// ═══════════════════════════════════════════════════════════════════════════
// SIGN TABLE
// ═══════════════════════════════════════════════════════════════════════════

function computeSignTable(expr: string, zeros: ZeroInfo[], domain: DomainInfo, xMin: number, xMax: number): SignInterval[] {
 const intervals: SignInterval[] = [];
 
 // Collect all critical x values
 const criticalX = [
  ...zeros.map(z => z.x),
  ...domain.excludedPoints
 ].sort((a, b) => a - b);

 // Build intervals
 const points = [xMin, ...criticalX.filter(x => x > xMin && x < xMax), xMax];
 
 for (let i = 0; i < points.length - 1; i++) {
  const from = points[i];
  const to = points[i + 1];
  const mid = (from + to) / 2;
  const val = safeEval(expr, mid);
  
  if (val === null) continue;
  
  let sign: '+' | '-' | '0' = val > 0.001 ? '+' : val < -0.001 ? '-' : '0';
  
  intervals.push({
   from: formatNumber(from),
   to: formatNumber(to),
   sign,
   includeFrom: !domain.excludedPoints.includes(from) && !zeros.some(z => z.x === from),
   includeTo: !domain.excludedPoints.includes(to) && !zeros.some(z => z.x === to)
  });
 }

 return intervals;
}

// ═══════════════════════════════════════════════════════════════════════════
// DERIVATIVES — V4.4 deterministic engine
// One source of truth: derivativeEngine.ts computes the answer and the steps.
// MathJS is used only as an independent cross-check / safe presentation helper.
// ═══════════════════════════════════════════════════════════════════════════

function expressionsAgreeNumerically(a: string, b: string): { compared: number; passed: number } {
 const probes = [-4.2, -3.1, -2.2, -1.3, -0.65, -0.2, 0.35, 0.8, 1.4, 2.3, 3.7, 5.1];
 let compared = 0, passed = 0;
 for (const x of probes) {
  const av = safeEval(a, x), bv = safeEval(b, x);
  if (av === null || bv === null) continue;
  compared++;
  const tolerance = 2e-8 * Math.max(1, Math.abs(av), Math.abs(bv));
  if (Math.abs(av - bv) <= tolerance) passed++;
 }
 return { compared, passed };
}

function verifyDerivativeNumerically(expr: string, derivExpr: string): ReliabilityCheck {
 const probes = [-4.1, -3.2, -2.1, -1.4, -0.75, -0.3, 0.25, 0.65, 1.1, 1.8, 2.7, 4.3];
 let compared = 0, passed = 0;
 for (const x of probes) {
  // Adaptive step reduces cancellation without crossing a discontinuity too easily.
  const h = 2e-5 * Math.max(1, Math.abs(x));
  const left = safeEval(expr, x - h), right = safeEval(expr, x + h), symbolic = safeEval(derivExpr, x);
  if (left === null || right === null || symbolic === null) continue;
  const numeric = (right - left) / (2 * h);
  if (!Number.isFinite(numeric)) continue;
  compared++;
  const tolerance = 8e-5 * Math.max(1, Math.abs(numeric), Math.abs(symbolic));
  if (Math.abs(numeric - symbolic) <= tolerance) passed++;
 }

 // Independent symbolic engine check (MathJS is not used to generate the answer).
 let engineCompared = 0, enginePassed = 0;
 try {
  const reference = derivative(expr, 'x').toString();
  const agree = expressionsAgreeNumerically(reference, derivExpr);
  engineCompared = agree.compared;
  enginePassed = agree.passed;
 } catch {
  // Numerical verification below remains mandatory.
 }

 const numericOk = compared >= 3 && passed === compared;
 const secondaryOk = engineCompared < 3 || enginePassed === engineCompared;
 const details = [
  `${passed}/${compared} contrôles par différence centrée`,
  engineCompared >= 3 ? `${enginePassed}/${engineCompared} contrôles avec le moteur symbolique secondaire` : 'contrôle symbolique secondaire non disponible'
 ].join(' ; ');
 return {
  label: 'Contrôle de la dérivée',
  ok: numericOk && secondaryOk,
  detail: numericOk && secondaryOk
   ? `Dérivée concordante : ${details}.`
   : `Dérivée non suffisamment confirmée : ${details}. Le résultat ne doit pas être considéré comme validé.`
 };
}

function verifySecondDerivativeNumerically(firstDerivative: string, secondDerivative: string): ReliabilityCheck {
 const base = verifyDerivativeNumerically(firstDerivative, secondDerivative);
 return {
  label: 'Contrôle de la dérivée seconde',
  ok: base.ok,
  detail: base.detail.replace(/Dérivée/g, 'Dérivée seconde').replace(/dérivée/g, 'dérivée seconde')
 };
}

function computeDerivative(expr: string): {
 derivExpr: string;
 secondDerivativeExpr: string;
 steps: DerivativeStep[];
 warnings: string[];
 verification: ReliabilityCheck;
 secondVerification: ReliabilityCheck;
} {
 const result = deriveWithBacEngine(expr);
 if (!result.supported || result.derivative === 'Non calculable') {
  const failed: ReliabilityCheck = {
   label: 'Contrôle de la dérivée',
   ok: false,
   detail: result.warnings[0] || 'La dérivée n’a pas pu être calculée de manière sûre.'
  };
  return {
   derivExpr: 'Non calculable',
   secondDerivativeExpr: 'Non calculable',
   steps: [],
   warnings: result.warnings,
   verification: failed,
   secondVerification: { ...failed, label: 'Contrôle de la dérivée seconde' }
  };
 }

 // Presentation simplification is accepted ONLY when it is numerically equivalent
 // to the deterministic derivative. It cannot change the mathematical answer.
 const derivExpr = result.derivative;
 const secondDerivativeExpr = result.secondDerivative;
 const verification = verifyDerivativeNumerically(expr, derivExpr);
 const secondVerification = verifySecondDerivativeNumerically(derivExpr, secondDerivativeExpr);

 // If a display simplification changed the final expression, keep the lesson's
 // final line synchronized with the exact expression shown to the student.
 const steps: DerivativeStep[] = result.steps.map((step, index, all) => {
  if (index !== all.length - 1 || !step.lines?.length) return step;
  const lines = step.lines.slice();
  const last = lines[lines.length - 1];
  if (/^f'\(x\)=/.test(last)) lines[lines.length - 1] = `f'(x)=${derivExpr}`;
  return { ...step, lines, after: step.after ? derivExpr : step.after };
 });

 return { derivExpr, secondDerivativeExpr, steps, warnings: result.warnings, verification, secondVerification };
}

// ═══════════════════════════════════════════════════════════════════════════
// PRIMITIVE (INTEGRAL)
// ═══════════════════════════════════════════════════════════════════════════

function computePrimitive(expr: string): string {
 const exact = tryExactPrimitive(expr);
 return exact ? `${exact.primitive} + C` : 'Primitive non déterminée automatiquement';
}

// ═══════════════════════════════════════════════════════════════════════════
// PARITY
// ═══════════════════════════════════════════════════════════════════════════

type ExactParity = 'even' | 'odd' | 'unknown';
function parityOfNode(node: DNode): ExactParity {
 if (node.kind === 'num') return 'even';
 if (node.kind === 'sym') {
  if (node.name === 'x') return 'odd';
  if (node.name === 'pi' || node.name === 'e') return 'even';
  return 'unknown';
 }
 if (node.kind === 'neg') return parityOfNode(node.value);
 if (node.kind === 'bin') {
  const a=parityOfNode(node.left), b=parityOfNode(node.right);
  if (node.op === '+' || node.op === '-') return a !== 'unknown' && a === b ? a : 'unknown';
  if (node.op === '*' || node.op === '/') {
   if (a === 'unknown' || b === 'unknown') return 'unknown';
   return a === b ? 'even' : 'odd';
  }
  if (node.op === '^') {
   const n=evaluateConstantNode(node.right); if(n===null||!Number.isInteger(n))return 'unknown';
   if(a==='even')return 'even'; if(a==='odd')return Math.abs(n)%2===0?'even':'odd'; return 'unknown';
  }
 }
 if (node.kind === 'func') {
  const p=parityOfNode(node.arg);
  if (p === 'even') return 'even';
  if (p === 'odd') {
   if (node.name === 'sin' || node.name === 'tan') return 'odd';
   if (node.name === 'cos' || node.name === 'abs') return 'even';
  }
 }
 return 'unknown';
}

function checkParity(expr: string): ParityInfo {
 try {
  const p=parityOfNode(parseExpressionCore(expr));
  if(p==='even') return {type:'even',proven:true,explanation:'Parité obtenue par les règles algébriques de composition.',verification:'On démontre f(-x)=f(x) sur un domaine symétrique.'};
  if(p==='odd') return {type:'odd',proven:true,explanation:'Parité obtenue par les règles algébriques de composition.',verification:'On démontre f(-x)=-f(x) sur un domaine symétrique.'};
 } catch { /* conservative fallback below */ }
 const testPoints=[0.5,1,1.5,2,2.5,3,Math.PI/4,Math.PI/3]; let even=true,odd=true,pairs=0;
 for(const x of testPoints){const a=safeEval(expr,x),b=safeEval(expr,-x);if((a===null)!==(b===null))return{type:'neither',proven:true,explanation:'Le domaine n’est pas symétrique par rapport à 0.',verification:'Une fonction paire ou impaire doit être définie simultanément en x et −x.'};if(a===null||b===null)continue;pairs++;if(Math.abs(a-b)>1e-7*Math.max(1,Math.abs(a),Math.abs(b)))even=false;if(Math.abs(a+b)>1e-7*Math.max(1,Math.abs(a),Math.abs(b)))odd=false;}
 if(pairs>=5 && !even && !odd) return {type:'neither',proven:false,explanation:'Les contrôles numériques contredisent les deux symétries usuelles.',verification:'Conclusion pratique : aucune parité détectée ; ce constat numérique n’est pas une preuve symbolique générale.'};
 return {type:'neither',proven:false,explanation:'Parité non déterminée automatiquement.',verification:'Le moteur refuse de conclure paire ou impaire sans preuve algébrique suffisante.'};
}

// ═══════════════════════════════════════════════════════════════════════════
// CONVEXITY
// ═══════════════════════════════════════════════════════════════════════════

function computeConvexity(expr: string, secondDerivExpr: string, xMin: number, xMax: number): ConvexityInfo {
 const intervals: ConvexityInfo['intervals'] = [];
 const inflectionPoints: { x: number; y: number }[] = [];
 if (secondDerivExpr === 'Non calculable') return { intervals, inflectionPoints };

 // Exact sign analysis when f'' is rational with completely known real zeros/poles.
 const rat=parseRationalPolynomial(secondDerivExpr,'x',12);
 if(rat){
  const roots=realPolynomialRoots(rat.num), ex=rationalExcludedPoints(rat);
  if(roots!==null&&ex.complete){
   const zeroes=roots.filter(x=>x>xMin&&x<xMax&&!ex.points.some(p=>Math.abs(p-x)<1e-8));
   const cuts=[xMin,...zeroes,...ex.points.filter(x=>x>xMin&&x<xMax),xMax].sort((a,b)=>a-b).filter((v,i,a)=>i===0||Math.abs(v-a[i-1])>1e-9);
   const signs:{from:number;to:number;sign:number}[]=[];
   for(let i=0;i<cuts.length-1;i++){
    const from=cuts[i],to=cuts[i+1],mid=(from+to)/2,d2=safeEval(secondDerivExpr,mid),fx=safeEval(expr,mid);
    if(d2===null||fx===null||Math.abs(d2)<1e-12)continue;
    const sign=d2>0?1:-1; signs.push({from,to,sign}); intervals.push({from:formatNumber(from),to:formatNumber(to),type:sign>0?'convex':'concave',signSecondDeriv:sign>0?'+':'-'});
   }
   for(const z of zeroes){
    const left=signs.find(v=>Math.abs(v.to-z)<1e-8),right=signs.find(v=>Math.abs(v.from-z)<1e-8);
    if(left&&right&&left.sign!==right.sign){const y=safeEval(expr,z);if(y!==null)inflectionPoints.push({x:Math.round(z*1e10)/1e10,y:Math.round(y*1e10)/1e10});}
   }
   return {intervals,inflectionPoints};
  }
 }

 // Conservative numerical fallback. A point is called an inflection point only after a verified sign change of f''.
 const step = Math.max(0.01, (xMax - xMin) / 1200);
 let prevSign: number | null = null, prevX:number|null=null, intervalStart=xMin;
 for(let x=xMin;x<=xMax+step/2;x+=step){
  const d2=safeEval(secondDerivExpr,x),fx=safeEval(expr,x);
  if(d2===null||fx===null){prevSign=null;prevX=null;intervalStart=x;continue;}
  const sign=d2>1e-6?1:d2<-1e-6?-1:0;if(sign===0)continue;
  if(prevSign!==null&&prevX!==null&&sign!==prevSign){
   const z=refineZero(secondDerivExpr,prevX,x)??(prevX+x)/2;
   const y=safeEval(expr,z),dl=safeEval(secondDerivExpr,z-step),dr=safeEval(secondDerivExpr,z+step);
   if(y!==null&&dl!==null&&dr!==null&&dl*dr<0){
    const zx=Math.round(z*1e8)/1e8;inflectionPoints.push({x:zx,y:Math.round(y*1e8)/1e8});
    intervals.push({from:formatNumber(intervalStart),to:formatNumber(zx),type:prevSign>0?'convex':'concave',signSecondDeriv:prevSign>0?'+':'-'}); intervalStart=zx;
   }
  }
  prevSign=sign;prevX=x;
 }
 if(prevSign!==null)intervals.push({from:formatNumber(intervalStart),to:formatNumber(xMax),type:prevSign>0?'convex':'concave',signSecondDeriv:prevSign>0?'+':'-'});
 return { intervals, inflectionPoints };
}

// ═══════════════════════════════════════════════════════════════════════════
// ASYMPTOTES
// ═══════════════════════════════════════════════════════════════════════════

function finiteLimitNumber(value:string): number | null {
 const v=value.trim();
 if(v==='π') return Math.PI; if(v==='-π') return -Math.PI; if(v==='e') return Math.E; if(v==='-e') return -Math.E;
 const frac=v.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/); if(frac){const d=Number(frac[2]);return d!==0?Number(frac[1])/d:null;}
 const n=Number(v); return Number.isFinite(n)?n:null;
}
function computeAsymptotes(expr: string, domain: DomainInfo, limits: LimitInfo[]): AsymptoteInfo {
 const vertical: AsymptoteInfo['vertical'] = [];
 const horizontal: AsymptoteInfo['horizontal'] = [];
 const oblique: AsymptoteInfo['oblique'] = [];
 for (const p of domain.excludedPoints) {
  const leftLimit = limits.find(l => Math.abs(Number(l.point)-p)<1e-8 && l.direction === '⁻');
  const rightLimit = limits.find(l => Math.abs(Number(l.point)-p)<1e-8 && l.direction === '⁺');
  if ([leftLimit?.value,rightLimit?.value].some(v=>v==='+∞'||v==='-∞')) vertical.push({x:p,limitLeft:leftLimit?.value||'?',limitRight:rightLimit?.value||'?'});
 }
 const lp=limits.find(l=>l.point==='+∞'), lm=limits.find(l=>l.point==='-∞');
 for(const [lim,dir] of [[lp,'+∞'],[lm,'-∞']] as const){if(!lim||lim.value.includes('∞')||lim.value==='?')continue;const y=finiteLimitNumber(lim.value);if(y!==null&&!horizontal.some(h=>Math.abs(h.y-y)<1e-10&&h.direction===dir))horizontal.push({y,direction:dir});}
 // Oblique asymptotes are asserted only when polynomial long division proves them.
 const rat=parseRationalPolynomial(expr,'x',20);
 if(rat && polynomialDegree(rat.num)===polynomialDegree(rat.den)+1){
  const dm=polyDivMod(rat.num,rat.den);
  if(dm && dm.q.length<=2){const b=dm.q[0]||0,a=dm.q[1]||0;if(Math.abs(a)>1e-12){oblique.push({a:Math.round(a*1e10)/1e10,b:Math.round(b*1e10)/1e10,direction:'+∞'});oblique.push({a:Math.round(a*1e10)/1e10,b:Math.round(b*1e10)/1e10,direction:'-∞'});}}
 }
 return { vertical, horizontal, oblique };
}

// ═══════════════════════════════════════════════════════════════════════════
// PERIODICITY
// ═══════════════════════════════════════════════════════════════════════════

function affineCoefficient(node:DNode): number | null {
 try { const p=parsePolynomial((node as any).kind ? (()=>{ const ser=(n:DNode):string=>{ if(n.kind==='num')return String(n.value); if(n.kind==='sym')return n.name; if(n.kind==='neg')return `-(${ser(n.value)})`; if(n.kind==='func')return `${n.name}(${ser(n.arg)})`; return `(${ser(n.left)})${n.op}(${ser(n.right)})`; }; return ser(node); })() : '', 'x', 1); return p && polynomialDegree(p)<=1 ? (p[1]||0) : null; } catch { return null; }
}
function checkPeriodicity(expr: string): PeriodicityInfo {
 try {
  const root=parseExpressionCore(expr);
  if(root.kind==='func' && (root.name==='sin'||root.name==='cos'||root.name==='tan')){
   const a=affineCoefficient(root.arg);
   if(a!==null&&Math.abs(a)>1e-12){const base=root.name==='tan'?Math.PI:2*Math.PI;const T=base/Math.abs(a);return{isPeriodic:true,period:T,proven:true,explanation:`Période démontrée : ${root.name}(ax+b) a pour période ${root.name==='tan'?'π/|a|':'2π/|a|'}, ici T=${formatNumber(T)}.`};}
  }
 } catch { /* unknown */ }
 return {isPeriodic:false,period:null,proven:false,explanation:'Périodicité non déterminée automatiquement. Aucune période n’est affirmée à partir de quelques points seulement.'};
}

// ═══════════════════════════════════════════════════════════════════════════
// TANGENT LINE
// ═══════════════════════════════════════════════════════════════════════════

export function computeTangent(expr: string, derivExpr: string, x0: number): TangentInfo | null {
 const y0 = safeEval(expr, x0);
 const slope = safeEval(derivExpr, x0);

 if (y0 === null || slope === null) return null;

 const b = y0 - slope * x0;

 let equation: string;
 if (Math.abs(slope) < 0.0001) {
  equation = `y = ${formatNumber(y0)}`;
 } else if (Math.abs(b) < 0.0001) {
  equation = `y = ${formatNumber(slope)}x`;
 } else {
  equation = `y = ${formatNumber(slope)}x ${b >= 0 ? '+' : ''} ${formatNumber(b)}`;
 }

 return {
  point: { x: x0, y: Math.round(y0 * 10000) / 10000 },
  slope: Math.round(slope * 10000) / 10000,
  equation,
  yIntercept: Math.round(b * 10000) / 10000
 };
}

// ═══════════════════════════════════════════════════════════════════════════
// LIMITS — Robust multi-approach computation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Small median helper for robust numeric classification.
 */
function median(nums: number[]): number {
 const s = [...nums].sort((a, b) => a - b);
 const m = Math.floor(s.length / 2);
 return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * Compute limit by approaching a finite point from one side.
 * Uses logarithmically shrinking distances and classifies:
 * - fast divergence (1/(x-a), 1/(x-a)^2, ...)
 * - slow divergence (ln(x-a), e^x ln(x-a), ...)
 * - finite convergence
 */
function approachLimit(expr: string, target: number, fromLeft: boolean): { value: string; samples: number[]; method: string } {
 const samples: { d: number; val: number }[] = [];
 // Pure powers of 10 keep the asymptotic behaviour easier to read.
 const distances = [1e-1, 1e-2, 1e-3, 1e-4, 1e-5, 1e-6, 1e-7, 1e-8, 1e-10, 1e-12];
 const dir = fromLeft ? -1 : 1;

 for (const d of distances) {
  const x = target + dir * d;
  const val = safeEval(expr, x);
  if (val !== null) samples.push({ d, val });
 }

 if (samples.length < 4) return { value: '?', samples: samples.map(s => s.val), method: 'Pas assez de données' };

 const vals = samples.map(s => s.val);
 const tail = vals.slice(-5);
 const absTail = tail.map(v => Math.abs(v));
 const signStable = tail.every(v => v > 0) || tail.every(v => v < 0);
 const last = tail[tail.length - 1];

 // ── 1. Fast divergence: huge magnitude near the point ──
 if (Math.abs(last) > 1e6) {
  const s = last > 0 ? '+∞' : '-∞';
  return { value: s, samples: vals, method: `Divergence rapide vers ${s}` };
 }

 // ── 2. Slow logarithmic / progressive divergence ──
 // If the absolute values keep increasing and the increments do NOT shrink to 0,
 // then the function does not stabilise to a finite limit.
 const diffs = tail.slice(1).map((v, i) => v - tail[i]);
 const absDiffs = diffs.map(d => Math.abs(d));
 const sameDiffSign = diffs.every(d => d > 0) || diffs.every(d => d < 0);
 const medianAbsDiff = median(absDiffs);
 const lastAbs = absTail[absTail.length - 1];
 const firstAbs = absTail[0];
 const monotoneAbs = absTail.every((v, i) => i === 0 || v >= absTail[i - 1] - 1e-6);

 // Example: e^x * ln(x+1) near -1⁺ gives roughly -0.84 change at each decade.
 if (signStable && sameDiffSign && monotoneAbs && medianAbsDiff > 0.15 && lastAbs > firstAbs + 0.5) {
  const s = last > 0 ? '+∞' : '-∞';
  return { value: s, samples: vals, method: `Divergence lente vers ${s}` };
 }

 // ── 3. Reciprocal test: if 1/f(x) → 0 with stable sign, then f(x) → ±∞ ──
 const reciprocal = tail.filter(v => Math.abs(v) > 1e-12).map(v => 1 / v);
 if (reciprocal.length >= 3) {
  const recTail = reciprocal.slice(-3);
  const recNearZero = recTail.every(v => Math.abs(v) < 0.1);
  const recShrinking = Math.abs(recTail[2]) <= Math.abs(recTail[1]) + 1e-6 && Math.abs(recTail[1]) <= Math.abs(recTail[0]) + 1e-6;
  if (signStable && recNearZero && recShrinking && lastAbs > 3) {
   const s = last > 0 ? '+∞' : '-∞';
   return { value: s, samples: vals, method: `Test du réciproque : 1/f(x) → 0, donc f(x) → ${s}` };
  }
 }

 // ── 4. Finite convergence: last values stabilise ──
 const stableTail = vals.slice(-4);
 const med = median(stableTail);
 const maxDev = Math.max(...stableTail.map(v => Math.abs(v - med)));
 if (maxDev < 0.001 * (1 + Math.abs(med))) {
  const r = smartRound(med);
  return { value: r, samples: vals, method: `Convergence vers ${r}` };
 }

 // ── 5. Near zero ──
 if (stableTail.every(v => Math.abs(v) < 0.0001)) {
  return { value: '0', samples: vals, method: 'Convergence vers 0' };
 }

 // ── 6. Pas de conclusion si les données ne prouvent pas une tendance nette ──
 // Une valeur « plausible » serait dangereuse (ex. fonctions oscillantes).
 return { value: '?', samples: vals, method: 'Limite non déterminée automatiquement : comportement numérique non concluant' };
}

/**
 * Compute limit at ±∞ using progressive large values.
 * More robust classification with median stabilisation and reciprocal test.
 */
function approachInfinity(expr: string, positive: boolean): { value: string; samples: number[]; method: string } {
 const testValues = positive
  ? [5, 10, 20, 50, 100, 1000, 10000, 1e5, 1e6, 1e8]
  : [-5, -10, -20, -50, -100, -1000, -10000, -1e5, -1e6, -1e8];

 const raw: number[] = [];
 for (const x of testValues) {
  const val = safeEval(expr, x);
  if (val !== null && isFinite(val)) raw.push(val);
 }

 if (raw.length < 4) return { value: '?', samples: raw, method: 'Fonction non définie pour ces grandes valeurs' };

 const tail = raw.slice(-5);
 const absTail = tail.map(v => Math.abs(v));
 const last = tail[tail.length - 1];
 const signStable = tail.every(v => v > 0) || tail.every(v => v < 0);

 // ── 1. Huge values ⇒ infinity ──
 if (Math.abs(last) > 1e6) {
  const s = last > 0 ? '+∞' : '-∞';
  return { value: s, samples: raw, method: `Croissance rapide vers ${s}` };
 }

 // ── 2. Finite convergence via median stabilisation ──
 const med = median(tail);
 const maxDev = Math.max(...tail.map(v => Math.abs(v - med)));
 if (maxDev < 0.001 * (1 + Math.abs(med))) {
  const r = smartRound(med);
  return { value: r, samples: raw, method: `Convergence vers ${r}` };
 }

 // ── 3. Toward zero ──
 if (tail.every(v => Math.abs(v) < 0.0001)) {
  return { value: '0', samples: raw, method: 'Convergence vers 0' };
 }

 // ── 4. Reciprocal test: if 1/f(x) → 0, then f(x) → ±∞ ──
 const reciprocal = tail.filter(v => Math.abs(v) > 1e-12).map(v => 1 / v);
 if (reciprocal.length >= 3) {
  const recTail = reciprocal.slice(-3);
  const recNearZero = recTail.every(v => Math.abs(v) < 0.05);
  const recShrinking = Math.abs(recTail[2]) <= Math.abs(recTail[1]) + 1e-6 && Math.abs(recTail[1]) <= Math.abs(recTail[0]) + 1e-6;
  if (signStable && recNearZero && recShrinking && Math.abs(last) > 5) {
   const s = last > 0 ? '+∞' : '-∞';
   return { value: s, samples: raw, method: `Test du réciproque : 1/f(x) → 0, donc f(x) → ${s}` };
  }
 }

 // ── 5. Slow monotone growth toward infinity ──
 const monotoneAbs = absTail.every((v, i) => i === 0 || v >= absTail[i - 1] - 1e-6);
 const lastAbs = absTail[absTail.length - 1];
 const firstAbs = absTail[0];
 const diffs = tail.slice(1).map((v, i) => v - tail[i]);
 const sameDiffSign = diffs.every(d => d > 0) || diffs.every(d => d < 0);
 const medianDiff = median(diffs.map(d => Math.abs(d)));

 if (signStable && monotoneAbs && sameDiffSign && lastAbs > firstAbs * 1.3 && lastAbs > 5 && medianDiff > 0.1) {
  const s = last > 0 ? '+∞' : '-∞';
  return { value: s, samples: raw, method: `Croissance monotone vers ${s}` };
 }

 // ── 6. Pas de valeur par défaut ──
 // Si la suite d’échantillons n’est pas concluante, on refuse de présenter le dernier
 // nombre observé comme une limite mathématique.
 return { value: '?', samples: raw, method: 'Limite non déterminée automatiquement : comportement numérique non concluant' };
}

/**
 * Format a few representative samples for explanations.
 */
function summarizeSamples(samples: number[]): string {
 if (samples.length === 0) return '?';
 if (samples.length === 1) return smartRound(samples[0]);
 if (samples.length === 2) return `${smartRound(samples[0])}, ${smartRound(samples[1])}`;
 const first = samples[0];
 const mid = samples[Math.floor(samples.length / 2)];
 const last = samples[samples.length - 1];
 return `${smartRound(first)}, ${smartRound(mid)}, ${smartRound(last)}`;
}

/**
 * Round to a "nice" number if close to common values
 */
function smartRound(val: number): string {
 // Check common values: 0, ±1, ±2, ±0.5, ±1/3, ±1/4, e, π, etc.
 const niceValues: [number, string][] = [
  [0, '0'], [1, '1'], [-1, '-1'], [2, '2'], [-2, '-2'],
  [0.5, '1/2'], [-0.5, '-1/2'],
  [1/3, '1/3'], [-1/3, '-1/3'], [2/3, '2/3'], [-2/3, '-2/3'],
  [0.25, '1/4'], [-0.25, '-1/4'], [0.75, '3/4'], [-0.75, '-3/4'],
  [Math.PI, 'π'], [-Math.PI, '-π'],
  [Math.E, 'e'], [-Math.E, '-e'],
  [Math.sqrt(2), '√2'], [-Math.sqrt(2), '-√2'],
  [Math.sqrt(3), '√3'], [-Math.sqrt(3), '-√3'],
  [3, '3'], [-3, '-3'], [4, '4'], [-4, '-4'],
  [Math.PI / 2, 'π/2'], [-Math.PI / 2, '-π/2'],
 ];

 for (const [num, str] of niceValues) {
  if (Math.abs(val - num) < 0.0001) return str;
 }

 // Check if it's close to an integer
 const rounded = Math.round(val);
 if (Math.abs(val - rounded) < 0.001) return String(rounded);

 // Round to 4 decimals
 return formatNumber(val);
}


function polyEvalValue(p: Poly, x: number): number {
 let y=0; for(let i=p.length-1;i>=0;i--) y=y*x+(p[i]||0); return y;
}

function rationalInfinityLimit(r: RationalPoly, positive: boolean): { value: string; method: string } {
 const rr=rationalReduce(r);
 const dn=rr.num.length-1, dd=rr.den.length-1;
 const an=rr.num[dn]||0, ad=rr.den[dd]||1;
 if(dn<dd) return {value:'0',method:'Limite exacte d’une fraction rationnelle : degré(numérateur) < degré(dénominateur).'};
 if(dn===dd) return {value:smartRound(an/ad),method:'Limite exacte d’une fraction rationnelle : rapport des coefficients dominants.'};
 const power=dn-dd;
 const coef=an/ad;
 const signAtInf=positive ? Math.sign(coef) : Math.sign(coef)*(power%2===0?1:-1);
 return {value:signAtInf>=0?'+∞':'-∞',method:`Limite exacte par termes dominants : comportement de ${formatNumber(coef)}x^${power}.`};
}

function rationalFiniteLimit(r: RationalPoly, p: number, side: 'left'|'right'): { value: string; method: string } | null {
 const rr=rationalReduce(r);
 const nv=polyEvalValue(rr.num,p), dv=polyEvalValue(rr.den,p);
 const scale=Math.max(1,...rr.num.map(Math.abs),...rr.den.map(Math.abs));
 const tol=1e-8*scale*Math.max(1,Math.abs(p));
 if(Math.abs(dv)>tol) return {value:smartRound(nv/dv),method:'Limite exacte après simplification de la fraction rationnelle.'};
 if(Math.abs(nv)<=tol) return null;
 // Determine denominator root multiplicity by differentiating until non-zero at p.
 let d=rr.den.slice(), order=0, lead=polyEvalValue(d,p);
 while(Math.abs(lead)<=tol && d.length>1 && order<12){ d=d.slice(1).map((c,i)=>c*(i+1)); order++; lead=polyEvalValue(d,p); }
 if(order===0 || Math.abs(lead)<=tol) return null;
 const C=nv/(lead/factorialSmall(order));
 const rightSign=Math.sign(C);
 const sideSign=side==='right' ? rightSign : rightSign*(order%2===0?1:-1);
 return {value:sideSign>=0?'+∞':'-∞',method:`Limite exacte : le dénominateur s’annule à l’ordre ${order} et le numérateur reste non nul.`};
}
function factorialSmall(n:number):number { let r=1; for(let i=2;i<=n;i++)r*=i; return r; }
function computeLimits(expr: string, domain: DomainInfo): { limits: LimitInfo[]; steps: LimitStep[] } {
 const limits: LimitInfo[] = [];
 const steps: LimitStep[] = [];
 const rational = parseRationalPolynomial(expr, 'x', 20);

 const add = (point:string,direction:string,value:string,method:string,calculation:string) => {
  if (value === '?') return;
  limits.push({ point, direction, value });
  steps.push({ point: direction ? `${point}${direction}` : point, method, calculation, result: value });
 };

 if (rational) {
  const pos = rationalLimitAtInfinity(rational, true);
  const neg = rationalLimitAtInfinity(rational, false);
  add('+∞','',pos.value,`Limite exacte — fraction rationnelle. ${pos.detail}`,'Comparaison des degrés et des coefficients dominants.');
  add('-∞','',neg.value,`Limite exacte — fraction rationnelle. ${neg.detail}`,'Comparaison des degrés et du signe du terme dominant.');
  const excluded = rationalExcludedPoints(rational);
  if (excluded.complete) {
   for (const p of excluded.points) {
    const left = rationalLimitAtFinite(rational,p,'left');
    const right = rationalLimitAtFinite(rational,p,'right');
    add(formatNumber(p),'⁻',left.value,`Limite exacte à gauche. ${left.detail}`,'Factorisation locale du numérateur et du dénominateur.');
    add(formatNumber(p),'⁺',right.value,`Limite exacte à droite. ${right.detail}`,'Factorisation locale du numérateur et du dénominateur.');
   }
  }
 } else {
  const pos=exactLimitAtInfinity(expr,true),neg=exactLimitAtInfinity(expr,false);
  if(pos)add('+∞','',pos.value,`Limite exacte. ${pos.detail}`,'Règles algébriques de composition ; aucun échantillonnage n’est utilisé comme preuve.');
  else steps.push({point:'+∞',method:'Limite non déterminée automatiquement',calculation:'Le moteur refuse de conclure à partir de quelques grandes valeurs seulement.',result:'?'});
  if(neg)add('-∞','',neg.value,`Limite exacte. ${neg.detail}`,'Règles algébriques de composition ; aucun échantillonnage n’est utilisé comme preuve.');
  else steps.push({point:'-∞',method:'Limite non déterminée automatiquement',calculation:'Le moteur refuse de conclure à partir de quelques grandes valeurs seulement.',result:'?'});
  for (const p of domain.excludedPoints) {
   steps.push({point:`${formatNumber(p)}⁻`,method:'Limite non déterminée automatiquement',calculation:'Point exclu non rationnel : aucun balayage numérique n’est présenté comme une preuve.',result:'?'});
   steps.push({point:`${formatNumber(p)}⁺`,method:'Limite non déterminée automatiquement',calculation:'Point exclu non rationnel : aucun balayage numérique n’est présenté comme une preuve.',result:'?'});
  }
 }

 // Finite one-sided domain boundaries (sqrt/log, etc.) remain conservative numeric checks.
 for (const interval of domain.intervals) {
  const match = interval.match(/[[\]]([-\d.]+|[-+]∞)\s*;\s*([-\d.]+|[-+]∞)[[\]]/);
  if (!match) continue;
  const left=match[1],right=match[2];
  if(left!=='-∞'){
   const p=Number(left); if(Number.isFinite(p)&&!limits.some(l=>l.point===formatNumber(p)&&l.direction==='⁺')){
    const out=safeEval(expr,p-1e-4),inside=safeEval(expr,p+1e-5); if(out===null&&inside!==null){const r=exactElementaryBoundaryLimit(expr,p,'right');if(r)add(formatNumber(p),'⁺',r.value,`Borne exacte du domaine — ${r.detail}`,'Règle élémentaire prouvée sur le côté appartenant au domaine.');else steps.push({point:`${formatNumber(p)}⁺`,method:'Limite de bord non déterminée automatiquement',calculation:'Le côté du domaine est identifié, mais aucune règle exacte prise en charge ne permet de conclure.',result:'?'});}
   }
  }
  if(right!=='+∞'){
   const p=Number(right); if(Number.isFinite(p)&&!limits.some(l=>l.point===formatNumber(p)&&l.direction==='⁻')){
    const out=safeEval(expr,p+1e-4),inside=safeEval(expr,p-1e-5); if(out===null&&inside!==null){const r=exactElementaryBoundaryLimit(expr,p,'left');if(r)add(formatNumber(p),'⁻',r.value,`Borne exacte du domaine — ${r.detail}`,'Règle élémentaire prouvée sur le côté appartenant au domaine.');else steps.push({point:`${formatNumber(p)}⁻`,method:'Limite de bord non déterminée automatiquement',calculation:'Le côté du domaine est identifié, mais aucune règle exacte prise en charge ne permet de conclure.',result:'?'});}
   }
  }
 }
 const seen=new Set<string>();
 const unique=limits.filter(l=>{const k=`${l.point}|${l.direction}|${l.value}`;if(seen.has(k))return false;seen.add(k);return true;}).sort((a,b)=>{const ord=(p:string)=>p==='-∞'?-1e100:p==='+∞'?1e100:Number(p);const d=ord(a.point)-ord(b.point);return d||a.direction.localeCompare(b.direction);});
 return { limits: unique, steps };
}

// ═══════════════════════════════════════════════════════════════════════════
// VARIATION
// ═══════════════════════════════════════════════════════════════════════════

function classifyCriticalPoint(expr:string, derivExpr:string, x:number, leftGap:number, rightGap:number) {
 const y=safeEval(expr,x); if(y===null)return null;
 const dl=safeEval(derivExpr,x-leftGap), dr=safeEval(derivExpr,x+rightGap);
 let type='point stationnaire', signBefore='?', signAfter='?', conclusion="f'(x)=0 ; le changement de signe doit être étudié.";
 if(dl!==null&&dr!==null){
  signBefore=dl>1e-9?'+':dl<-1e-9?'-':'0'; signAfter=dr>1e-9?'+':dr<-1e-9?'-':'0';
  if(dl>0&&dr<0){type='maximum local';conclusion="f' : + → −, donc maximum local.";}
  else if(dl<0&&dr>0){type='minimum local';conclusion="f' : − → +, donc minimum local.";}
  else conclusion="f' ne change pas de signe : point stationnaire, pas un extremum.";
 }
 return {point:{x:Math.round(x*1e10)/1e10,y:Math.round(y*1e10)/1e10,type},verification:{x:Math.round(x*1e10)/1e10,y:Math.round(y*1e10)/1e10,signBefore,signAfter,conclusion}};
}

function findCriticalPoints(expr: string, derivExpr: string, xMin: number, xMax: number): { points: { x: number; y: number; type: string }[]; steps: CriticalPointStep } {
 const points: { x: number; y: number; type: string }[] = [];
 const solutions: number[] = [];
 const verification: CriticalPointStep['verification'] = [];

 // Exact route whenever f' is a rational function whose numerator roots and poles are fully known.
 const rat=parseRationalPolynomial(derivExpr,'x',12);
 if(rat){
  const roots=realPolynomialRoots(rat.num), ex=rationalExcludedPoints(rat);
  if(roots!==null&&ex.complete){
   const candidates=roots.filter(x=>x>xMin-1e-10&&x<xMax+1e-10&&!ex.points.some(p=>Math.abs(p-x)<1e-8)&&safeEval(expr,x)!==null);
   const cuts=[xMin,...ex.points.filter(x=>x>xMin&&x<xMax),...candidates,xMax].sort((a,b)=>a-b);
   for(const x of candidates){
    const i=cuts.findIndex(v=>Math.abs(v-x)<1e-8); const l=i>0?x-cuts[i-1]:1, r=i>=0&&i<cuts.length-1?cuts[i+1]-x:1;
    const gapL=Math.max(1e-7,Math.min(.1,l/4)),gapR=Math.max(1e-7,Math.min(.1,r/4));
    const c=classifyCriticalPoint(expr,derivExpr,x,gapL,gapR); if(!c)continue;
    points.push(c.point); solutions.push(c.point.x); verification.push(c.verification);
   }
   return {points:points.sort((a,b)=>a.x-b.x),steps:{equation:`f'(x)=0`,solving:solutions.length?`Résolution algébrique exacte : x = ${solutions.map(formatNumber).join(', ')}`:`Aucune racine de f' sur [${formatNumber(xMin)} ; ${formatNumber(xMax)}]`,solutions,verification}};
  }
 }

 // Conservative numerical fallback on the selected window only.
 const step=Math.max(0.002,(xMax-xMin)/10000); let prevDeriv:number|null=null,prevX=xMin;
 for(let x=xMin;x<=xMax+step/2;x+=step){
  const d=safeEval(derivExpr,x);
  if(d===null){prevDeriv=null;prevX=x;continue;}
  let candidate:number|null=null;
  if(Math.abs(d)<1e-5)candidate=x;
  else if(prevDeriv!==null&&d*prevDeriv<0)candidate=refineZero(derivExpr,prevX,x);
  if(candidate!==null&&!points.some(p=>Math.abs(p.x-candidate!)<1e-5)){
   const residual=Math.abs(safeEval(derivExpr,candidate)??Infinity);
   if(residual<=1e-5*Math.max(1,Math.abs(safeEval(expr,candidate)??0))){
    const gap=Math.max(1e-5,Math.min(.05,step*5)); const c=classifyCriticalPoint(expr,derivExpr,candidate,gap,gap);
    if(c){points.push(c.point);solutions.push(c.point.x);verification.push(c.verification);}
   }
  }
  prevDeriv=d;prevX=x;
 }
 return {points:points.sort((a,b)=>a.x-b.x),steps:{equation:`f'(x)=0`,solving:solutions.length?`Solutions numériques contrôlées sur [${formatNumber(xMin)} ; ${formatNumber(xMax)}] : x ≈ ${solutions.map(formatNumber).join(', ')}`:`Aucun point critique détecté sur [${formatNumber(xMin)} ; ${formatNumber(xMax)}]`,solutions,verification}};
}

function computeVariation(expr: string, derivExpr: string, domain: DomainInfo, xMin: number, xMax: number): { variation: VariationInfo; criticalSteps: CriticalPointStep } {
 const { points: criticalPoints, steps: criticalSteps } = findCriticalPoints(expr, derivExpr, xMin, xMax);
 const intervals: VariationInfo['intervals'] = [];

 const boundaryPoints = [xMin, ...criticalPoints.map(p => p.x), ...domain.excludedPoints.filter(p => p > xMin && p < xMax), xMax];
 const sortedPoints = [...new Set(boundaryPoints)].sort((a, b) => a - b);

 for (let i = 0; i < sortedPoints.length - 1; i++) {
  const from = sortedPoints[i], to = sortedPoints[i + 1];
  const mid = (from + to) / 2;
  const midVal = safeEval(expr, mid);
  const derivAtMid = safeEval(derivExpr, mid);
  if (midVal === null || derivAtMid === null) continue;

  const direction = derivAtMid > 0.001 ? 'increasing' : derivAtMid < -0.001 ? 'decreasing' : 'constant';
  const signDerivative = derivAtMid > 0.001 ? '+' : derivAtMid < -0.001 ? '-' : '0';
  intervals.push({ from: formatNumber(from), to: formatNumber(to), direction, signDerivative });
 }

 return { variation: { criticalPoints, intervals }, criticalSteps };
}

// ═══════════════════════════════════════════════════════════════════════════
// PLOT DATA
// ═══════════════════════════════════════════════════════════════════════════

function computePlotData(expr: string, xMin: number, xMax: number, numPoints: number = 500): PlotPoint[] {
 const points: PlotPoint[] = [];
 const step = (xMax - xMin) / numPoints;

 for (let i = 0; i <= numPoints; i++) {
  const x = xMin + i * step;
  const y = safeEval(expr, x);
  if (y !== null && Math.abs(y) < 1e6) {
   points.push({ x: Math.round(x * 10000) / 10000, y });
  }
 }

 return points;
}

// ═══════════════════════════════════════════════════════════════════════════
// DOMAIN STEPS
// ═══════════════════════════════════════════════════════════════════════════

function buildDomainSteps(domain: DomainInfo): DomainStep[] {
 const steps: DomainStep[] = [];
 
 for (const r of domain.restrictions) {
  if (r.type === 'division') {
   steps.push({ rule: 'Division par zéro interdite', condition: 'Dénominateur ≠ 0', equation: `${r.expression} = 0`, solution: `Résoudre ${r.expression} = 0`, result: domain.excludedPoints.map(p => `x = ${p}`) });
  } else if (r.type === 'sqrt') {
   steps.push({ rule: 'Racine carrée ≥ 0', condition: 'Expression sous √ ≥ 0', equation: `${r.expression} ≥ 0`, solution: `Résoudre ${r.expression} ≥ 0`, result: domain.intervals });
  } else if (r.type === 'log') {
   steps.push({ rule: 'Logarithme > 0', condition: 'Argument de ln > 0', equation: `${r.expression} > 0`, solution: `Résoudre ${r.expression} > 0`, result: domain.intervals });
  }
 }

 if (steps.length === 0 && domain.type === 'R') {
  steps.push({ rule: 'Aucune restriction', condition: 'Fonction définie partout', equation: '-', solution: 'Df = ℝ', result: ['ℝ'] });
 }

 return steps;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ANALYSIS FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

export function analyzeFunction(expr: string, xMin: number = -10, xMax: number = 10): AnalysisResult {
 try {
  parse(expr);
 } catch (e: any) {
  throw new Error(`Expression invalide: ${e.message}`);
 }

 const {
  derivExpr, secondDerivativeExpr, steps: derivativeSteps, warnings: derivativeWarnings,
  verification: derivativeVerification, secondVerification: secondDerivativeVerification
 } = computeDerivative(expr);
 const domain = computeDomain(expr);
 const { limits, steps: limitSteps } = computeLimits(expr, domain);
 const { variation, criticalSteps } = computeVariation(expr, derivExpr, domain, xMin, xMax);
 const plotData = computePlotData(expr, xMin, xMax);
 const domainSteps = buildDomainSteps(domain);
 const zeros = findZeros(expr, xMin, xMax);
 const signTable = computeSignTable(expr, zeros, domain, xMin, xMax);
 const parity = checkParity(expr);
 const convexity = computeConvexity(expr, secondDerivativeExpr, xMin, xMax);
 const primitiveExpr = computePrimitive(expr);
 const asymptotes = computeAsymptotes(expr, domain, limits);
 const periodicity = checkPeriodicity(expr);

 const zeroResiduals = zeros.map(z => Math.abs(safeEval(expr, z.x) ?? Number.POSITIVE_INFINITY));
 const zeroCheck: ReliabilityCheck = {
  label: 'Contrôle des zéros',
  ok: zeroResiduals.every(r => r <= 1e-4),
  detail: zeros.length === 0
   ? 'Aucun zéro détecté dans la fenêtre étudiée ; aucune conclusion globale n’est tirée hors de cette fenêtre.'
   : `${zeroResiduals.filter(r => r <= 1e-4).length}/${zeros.length} zéro(s) vérifié(s) par substitution dans f(x).`
 };
 const criticalCheck: ReliabilityCheck = {
  label: 'Points critiques',
  ok: variation.criticalPoints.every(p => Math.abs(safeEval(derivExpr, p.x) ?? Number.POSITIVE_INFINITY) <= 5e-3),
  detail: variation.criticalPoints.length === 0
   ? 'Aucun point critique détecté dans la fenêtre étudiée.'
   : 'Chaque point critique affiché est recontrôlé dans la dérivée.'
 };
 const domainCheck: ReliabilityCheck = {
  label: 'Domaine de définition',
  ok: domain.type === 'R' || domain.intervals.length > 0,
  detail: domain.type === 'R' ? 'Aucune restriction élémentaire détectée.' : domain.intervals.length>0 ? `${domain.restrictions.length} restriction(s) résolue(s) avec des bornes déterminées.` : 'Des restrictions ont été détectées, mais le domaine complet n’est pas prouvé automatiquement.'
 };
 const checks = [domainCheck, derivativeVerification, secondDerivativeVerification, zeroCheck, criticalCheck];
 const hasFailure = checks.some(c => !c.ok);
 const hasNumericalParts = limits.length > 0 || asymptotes.vertical.length > 0 || asymptotes.horizontal.length > 0 || asymptotes.oblique.length > 0;
 const quality: AnalysisQuality = hasFailure
  ? { level: 'warning', title: 'Analyse à contrôler', detail: 'Une vérification interne n’a pas suffisamment concordé. Les résultats concernés ne doivent pas être recopiés sans contrôle.', checks }
  : hasNumericalParts
   ? { level: 'approximate', title: 'Analyse contrôlée', detail: `La dérivée est vérifiée. Les zéros, variations, signes et convexité issus d’un balayage numérique sont limités à [${formatNumber(xMin)} ; ${formatNumber(xMax)}]. Les limites/asymptotes peuvent également inclure des estimations signalées dans les étapes.`, checks }
   : { level: 'approximate', title: 'Analyse contrôlée sur une fenêtre', detail: `La dérivée est vérifiée symboliquement et numériquement. Les tableaux de signes/variations et la recherche de points remarquables restent limités à [${formatNumber(xMin)} ; ${formatNumber(xMax)}] lorsqu’ils reposent sur un balayage.`, checks };

 return {
  expression: expr,
  domain,
  limits,
  variation,
  plotData,
  derivativeExpr: derivExpr,
  secondDerivativeExpr,
  derivativeWarnings,
  steps: { domainSteps, derivativeSteps, criticalPointSteps: [criticalSteps], limitSteps },
  zeros,
  signTable,
  parity,
  convexity,
  primitiveExpr,
  asymptotes,
  periodicity,
  quality
 };
}

// ═══════════════════════════════════════════════════════════════════════════
// EQUATION SOLVER f(x) = k
// ═══════════════════════════════════════════════════════════════════════════

export type { EquationResult, EquationVerification } from './equationEngine.js';
export function solveEquation(expr: string, k: number, xMin: number = -20, xMax: number = 20): EquationResult {
 return solveEquationVerified(expr,k,xMin,xMax);
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPARE TWO FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface CompareResult {
 intersections: { x: number; y: number; residual: number }[];
 dominance: { interval: string; dominant: 'f' | 'g' | 'equal' | 'uncertain' }[];
 searchInterval: [number, number];
 verifiedIntersections: number;
 uncertainIntervals: number;
 quality: 'verified' | 'approximate' | 'warning';
 exact?: boolean;
}

export function compareFunctions(expr1: string, expr2: string, xMin: number = -10, xMax: number = 10): CompareResult {
 if (!(xMin < xMax)) throw new Error('Intervalle de comparaison invalide.');
 const diffExpr = `(${expr1}) - (${expr2})`;
 // Exact rational comparison: solve f-g=0 and split at every proven pole.
 const exactRat=parseRationalPolynomial(diffExpr,'x',12);
 if(exactRat){
  const roots=realPolynomialRoots(exactRat.num), ex=rationalExcludedPoints(exactRat);
  if(roots!==null&&ex.complete){
   const zeroPolynomial=exactRat.num.every(c=>Math.abs(c)<1e-12);
   const validRoots=(zeroPolynomial?[]:roots).filter(x=>!ex.points.some(p=>Math.abs(p-x)<1e-8));
   const intersections:CompareResult['intersections']=validRoots.map(x=>{const f=safeEval(expr1,x),g=safeEval(expr2,x);return{x,y:f!==null&&g!==null?(f+g)/2:0,residual:f===null||g===null?Infinity:Math.abs(f-g)}}).filter(p=>Number.isFinite(p.residual)&&p.residual<=1e-7*Math.max(1,Math.abs(p.y)));
   const cuts=[...validRoots,...ex.points].sort((a,b)=>a-b).filter((v,i,a)=>i===0||Math.abs(v-a[i-1])>1e-9);
   const bounds:Array<number|null>=[null,...cuts,null]; const dominance:CompareResult['dominance']=[];
   for(let i=0;i<bounds.length-1;i++){
    const l=bounds[i],r=bounds[i+1]; const probe=l===null?(r===null?0:(r as number)-Math.max(1,Math.abs(r as number))):r===null?(l as number)+Math.max(1,Math.abs(l as number)):((l as number)+(r as number))/2;
    const f=safeEval(expr1,probe),g=safeEval(expr2,probe); let dom:'f'|'g'|'equal'|'uncertain'='uncertain';
    if(f!==null&&g!==null){const d=f-g,tol=1e-10*Math.max(1,Math.abs(f),Math.abs(g));dom=Math.abs(d)<=tol?'equal':d>0?'f':'g';}
    const ls=l===null?']-∞':`]${formatNumber(l)}`,rs=r===null?'+∞[':`${formatNumber(r)}[`;dominance.push({interval:`${ls} ; ${rs}`,dominant:dom});
   }
   if(zeroPolynomial) dominance.forEach(d=>{if(d.dominant!=='uncertain')d.dominant='equal';});
   return{intersections,dominance,searchInterval:[xMin,xMax],verifiedIntersections:intersections.length,uncertainIntervals:dominance.filter(d=>d.dominant==='uncertain').length,quality:dominance.some(d=>d.dominant==='uncertain')?'warning':'verified',exact:true};
  }
 }
 const exactPoly=parsePolynomial(diffExpr,'x',2);
 if(exactPoly && polynomialDegree(exactPoly)<=2){
  const a=exactPoly[2]||0,b=exactPoly[1]||0,c=exactPoly[0]||0;
  const eq=solveQuadraticReal(a,b,c);
  if(eq.kind==='all') return {intersections:[],dominance:[{interval:'ℝ',dominant:'equal'}],searchInterval:[xMin,xMax],verifiedIntersections:0,uncertainIntervals:0,quality:'verified',exact:true};
  const roots=eq.roots;
  const intersections: CompareResult['intersections']=roots.map(x=>{const f=safeEval(expr1,x),g=safeEval(expr2,x);return {x,y:Math.round((((f??0)+(g??0))/2)*1e10)/1e10,residual:f===null||g===null?Infinity:Math.abs(f-g)}}).filter(p=>Number.isFinite(p.residual));
  const bounds:Array<number|null>=[null,...roots,null]; const dominance:CompareResult['dominance']=[];
  for(let i=0;i<bounds.length-1;i++){const l=bounds[i],r=bounds[i+1]; const probe=l===null?(r===null?0:(r as number)-Math.max(1,Math.abs(r as number))):r===null?(l as number)+Math.max(1,Math.abs(l as number)):((l as number)+(r as number))/2; const v=(a*probe+b)*probe+c; const dom=Math.abs(v)<=1e-12?'equal':v>0?'f':'g'; const ls=l===null?']-∞':`]${formatNumber(l)}`; const rs=r===null?'+∞[':`${formatNumber(r)}[`; dominance.push({interval:`${ls} ; ${rs}`,dominant:dom});}
  return {intersections,dominance,searchInterval:[xMin,xMax],verifiedIntersections:intersections.filter(p=>p.residual<=1e-8).length,uncertainIntervals:0,quality:'verified',exact:true};
 }
 const zeros = findZeros(diffExpr, xMin, xMax);

 const intersections: CompareResult['intersections'] = [];
 for (const z of zeros) {
  const f = safeEval(expr1, z.x);
  const g = safeEval(expr2, z.x);
  if (f === null || g === null) continue;
  const residual = Math.abs(f - g);
  if (residual <= 1e-4 * Math.max(1, Math.abs(f), Math.abs(g))) {
   intersections.push({ x: z.x, y: Math.round(((f + g) / 2) * 10000) / 10000, residual });
  }
 }

 // Les discontinuités/bornes de domaine sont aussi des coupures : elles ne doivent
 // jamais être traversées comme si le signe de f-g était constant.
 const domainBreaks: number[] = [];
 for (const expression of [expr1, expr2]) {
  for (const restriction of collectRestrictions(expression)) {
   for (const root of restrictionRoots(restriction.expression)) {
    if (root > xMin && root < xMax && !domainBreaks.some(v => Math.abs(v - root) < 1e-5)) domainBreaks.push(root);
   }
  }
 }

 const inner = [...intersections.map(z => z.x), ...domainBreaks]
  .filter(x => x > xMin && x < xMax)
  .sort((a, b) => a - b)
  .filter((x, i, arr) => i === 0 || Math.abs(x - arr[i - 1]) > 1e-5);
 const points = [xMin, ...inner, xMax];
 const dominance: CompareResult['dominance'] = [];

 for (let i = 0; i < points.length - 1; i++) {
  const left = points[i], right = points[i + 1];
  if (!(right > left)) continue;
  const signs: number[] = [];
  let invalid = false;
  for (const t of [0.12, 0.3, 0.5, 0.7, 0.88]) {
   const x = left + (right - left) * t;
   const f = safeEval(expr1, x), g = safeEval(expr2, x);
   if (f === null || g === null) { invalid = true; continue; }
   const d = f - g;
   const tol = 1e-7 * Math.max(1, Math.abs(f), Math.abs(g));
   signs.push(d > tol ? 1 : d < -tol ? -1 : 0);
  }
  const nonZero = signs.filter(v => v !== 0);
  let dominant: 'f' | 'g' | 'equal' | 'uncertain' = 'uncertain';
  if (!invalid && signs.length >= 4 && nonZero.length === 0) dominant = 'equal';
  else if (!invalid && nonZero.length >= 3 && nonZero.every(v => v > 0)) dominant = 'f';
  else if (!invalid && nonZero.length >= 3 && nonZero.every(v => v < 0)) dominant = 'g';
  dominance.push({ interval: `]${formatNumber(left)} ; ${formatNumber(right)}[`, dominant });
 }

 const uncertainIntervals = dominance.filter(d => d.dominant === 'uncertain').length;
 return {
  intersections,
  dominance,
  searchInterval: [xMin, xMax],
  verifiedIntersections: intersections.length,
  uncertainIntervals,
  quality: uncertainIntervals > 0 ? 'warning' : 'approximate'
 };
}

// ═══════════════════════════════════════════════════════════════════════════
// SEQUENCES (SUITES NUMÉRIQUES)
// ═══════════════════════════════════════════════════════════════════════════

export type SequenceResult = VerifiedSequenceResult;

export function analyzeSequence(expr: string, u0: number, type: 'explicit' | 'recursive', count: number = 20, startIndex: number = 0): SequenceResult {
 return analyzeSequenceVerified(expr, u0, type, count, startIndex);
}

// ═══════════════════════════════════════════════════════════════════════════
// PARAMETRIC FUNCTION f(x, a)
// ═══════════════════════════════════════════════════════════════════════════

export function evaluateParametric(expr: string, xMin: number, xMax: number, paramValue: number, numPts: number = 300): PlotPoint[] {
 const pts: PlotPoint[] = [];
 const step = (xMax - xMin) / numPts;
 for (let i = 0; i <= numPts; i++) {
  const x = xMin + i * step;
  const y = safeEvaluateExpression(expr, { x, a:paramValue, k:paramValue, m:paramValue, t:paramValue });
  if (y !== null && Math.abs(y) < 1e6) pts.push({ x: Math.round(x * 10000) / 10000, y });
 }
 return pts;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFINITE INTEGRAL ∫[a,b] f(x)dx
// ═══════════════════════════════════════════════════════════════════════════

export interface IntegralResult {
 a: number;
 b: number;
 value: number;
 method: string;
 steps: string[];
 areaPoints: PlotPoint[];
 isPositive: boolean;
 unit: string;
 errorEstimate: number;
 quality: 'verified' | 'approximate' | 'warning';
 checks: ReliabilityCheck[];
 warning?: string;
 exact?: boolean;
 primitiveExpr?: string;
 exactResultExpr?: string;
}

function intGcd(a:number,b:number):number { a=Math.abs(Math.round(a)); b=Math.abs(Math.round(b)); while(b){const t=a%b;a=b;b=t;} return a||1; }
function formatIntegratedPolynomial(poly: Poly): string {
 const terms: string[] = [];
 for (let i = poly.length - 1; i >= 0; i--) {
  const c = poly[i] || 0;
  if (Math.abs(c) < 1e-12) continue;
  const power = i + 1;
  const sign = c < 0 ? '-' : '+';
  const absC = Math.abs(c);
  let body = '';
  if (power === 1) {
   body = Math.abs(absC - 1) < 1e-12 ? 'x' : `${formatNumber(absC)}*x`;
  } else {
   const q = absC / power;
   if (Math.abs(q - Math.round(q)) < 1e-12) {
    const k=Math.round(q); body = k===1 ? `x^${power}` : `${k}*x^${power}`;
   } else if (Number.isInteger(absC)) {
    const g=intGcd(absC,power), n=absC/g, d=power/g;
    body = n===1 ? `(x^${power})/${d}` : `(${n}*x^${power})/${d}`;
   } else {
    body = `${formatNumber(q)}*x^${power}`;
   }
  }
  if (!terms.length) terms.push(sign === '-' ? `-${body}` : body);
  else terms.push(` ${sign} ${body}`);
 }
 return terms.length ? terms.join('') : '0';
}

function evaluateIntegratedPolynomial(poly: Poly, x: number): number {
 let sum = 0;
 for (let i = 0; i < poly.length; i++) sum += (poly[i] || 0) * Math.pow(x, i + 1) / (i + 1);
 return sum;
}

function fractionForDisplay(value:number, maxDen=10000): string {
 if (!Number.isFinite(value)) return formatNumber(value);
 if (Math.abs(value-Math.round(value))<1e-11) return String(Math.round(value));
 let bestN=Math.round(value), bestD=1, bestErr=Math.abs(value-bestN);
 for(let d=2;d<=maxDen;d++){
  const n=Math.round(value*d), err=Math.abs(value-n/d);
  if(err<bestErr){bestErr=err;bestN=n;bestD=d;}
  if(err<1e-11) break;
 }
 if(bestErr<1e-9) return `(${bestN})/(${bestD})`;
 return formatNumber(value);
}

function tryExactIntegral(expr: string, a: number, b: number): { value: number; primitive: string; exactResultExpr: string; steps: string[]; method: string } | null {
 return tryExactDefiniteIntegral(expr, a, b);
}

function verifyPrimitiveNumerically(expr: string, primitive: string, a: number, b: number): { ok: boolean; detail: string } {
 const probes=9; let checked=0; let worst=0;
 for(let i=1;i<=probes;i++){
  const x=a+(b-a)*i/(probes+1);
  const fx=safeEval(expr,x); if(fx===null) continue;
  const h=Math.max(1e-6,Math.sqrt(Number.EPSILON)*(1+Math.abs(x)));
  const fp=safeEval(primitive,x+h), fm=safeEval(primitive,x-h);
  if(fp===null||fm===null) continue;
  const d=(fp-fm)/(2*h), err=Math.abs(d-fx)/Math.max(1,Math.abs(fx),Math.abs(d));
  worst=Math.max(worst,err); checked++;
 }
 return {ok:checked>=5&&worst<2e-6,detail:`Dérivée numérique de la primitive contrôlée en ${checked} point(s), erreur relative maximale ≈ ${formatNumber(worst)}.`};
}

function simpsonValue(expr: string, a: number, b: number, n: number): { value: number; valid: boolean; invalidX: number | null } {
 if (n % 2 !== 0) n += 1;
 const h = (b - a) / n;
 let sum = 0;
 for (let i = 0; i <= n; i++) {
  const x = a + i * h;
  const fx = safeEval(expr, x);
  if (fx === null || !Number.isFinite(fx)) return { value: NaN, valid: false, invalidX: x };
  const weight = i === 0 || i === n ? 1 : i % 2 === 0 ? 2 : 4;
  sum += weight * fx;
 }
 return { value: (h / 3) * sum, valid: true, invalidX: null };
}

function scanIntegralDomain(expr: string, a: number, b: number): { ok: boolean; detail: string; badX: number | null } {
 const certificate = certifyContinuousOnInterval(expr, a, b);
 if (!certificate.ok) return { ok: false, detail: certificate.detail, badX: certificate.badX };
 // Secondary numerical sanity check after a structural proof. Sampling is never
 // used as the proof itself: it can only catch an implementation/evaluation anomaly.
 const samples = 256;
 for (let i = 0; i <= samples; i++) {
  const x = a + ((b - a) * i) / samples;
  if (safeEval(expr, x) === null) return { ok: false, detail: `Le domaine était structurellement acceptable mais l’évaluation échoue en x=${formatNumber(x)}. Le calcul est interrompu.`, badX: x };
 }
 return { ok: true, detail: `${certificate.detail} Contrôle numérique secondaire sur ${samples + 1} points : aucune anomalie.`, badX: null };
}

export function computeIntegral(expr: string, a: number, b: number): IntegralResult {
 if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error('Les bornes doivent être des nombres réels finis.');
 if (Math.abs(a-b) <= 1e-15) {
  return { a,b,value:0,method:'Propriété exacte',steps:[`Les deux bornes sont identiques : ∫[${formatNumber(a)},${formatNumber(b)}] f(x)dx = 0.`],areaPoints:[],isPositive:true,unit:'aire algébrique',errorEstimate:0,quality:'verified',exact:true,exactResultExpr:'0',checks:[{label:'Bornes identiques',ok:true,detail:'Une intégrale définie de a à a vaut exactement 0.'}] };
 }
 if (a>b) {
  const r=computeIntegral(expr,b,a);
  const value=Number.isFinite(r.value)?-r.value:r.value;
  return { ...r, a, b, value, isPositive:Number.isFinite(value)?value>=0:false, exactResultExpr:r.exactResultExpr?`-(${r.exactResultExpr})`:undefined, steps:[`On utilise ∫[a,b]f(x)dx = -∫[b,a]f(x)dx lorsque a>b.`,...r.steps,Number.isFinite(value)?`Donc la valeur cherchée est ${r.exact?'':'environ '}${formatNumber(value)}.`:'Le calcul inversé n’a pas produit de valeur finie.'] };
 }
 const steps: string[] = [];
 const areaPoints: PlotPoint[] = [];
 const domainScan = scanIntegralDomain(expr, a, b);
 const domainCheck: ReliabilityCheck = { label: 'Continuité / domaine sur l’intervalle', ok: domainScan.ok, detail: domainScan.detail };

 if (!domainScan.ok) {
  return {
   a, b, value: NaN, method: 'Calcul interrompu', steps: ['Avant d’intégrer, on vérifie que la fonction est définie sur tout l’intervalle.', domainScan.detail, 'Le calcul numérique est arrêté pour éviter de produire une valeur trompeuse.'],
   areaPoints: [], isPositive: false, unit: 'aire algébrique', errorEstimate: NaN, quality: 'warning', checks: [domainCheck], warning: domainScan.detail
  };
 }

 // Prefer an exact school method only after an independent primitive and numerical check.
 const exact = tryExactIntegral(expr, a, b);
 if (exact) {
  const primitiveCheck=verifyPrimitiveNumerically(expr,exact.primitive,a,b);
  const independent=simpsonValue(expr,a,b,2400);
  const agreement=independent.valid && Math.abs(independent.value-exact.value)<=2e-7*Math.max(1,Math.abs(exact.value),Math.abs(independent.value));
  if(primitiveCheck.ok && agreement){
   const areaPoints: PlotPoint[] = [];
   for (let i=0;i<=260;i++) {
    const x=a+((b-a)*i)/260; const y=safeEval(expr,x); if(y!==null) areaPoints.push({x,y});
   }
   const value = Math.round(exact.value * 1e10) / 1e10;
   return {
    a,b,value,method:exact.method,steps:[...exact.steps,'Contrôle indépendant : la primitive redonne bien l’intégrande et Simpson concorde avec le résultat.'],areaPoints,isPositive:value>=0,
    unit:'aire algébrique',errorEstimate:Math.abs(independent.value-exact.value),quality:'verified',exact:true,primitiveExpr:exact.primitive,exactResultExpr:exact.exactResultExpr,
    checks:[domainCheck,{label:'Primitive recontrôlée',ok:primitiveCheck.ok,detail:primitiveCheck.detail},{label:'Contrôle numérique indépendant',ok:agreement,detail:`Simpson indépendant ≈ ${formatNumber(independent.value)} ; résultat exact évalué ≈ ${formatNumber(exact.value)}.`}]
   };
  }
  // If the advertised primitive cannot be independently confirmed, do not present it as exact.
 }

 const coarse = simpsonValue(expr, a, b, 1000);
 const fine = simpsonValue(expr, a, b, 2000);
 if (!coarse.valid || !fine.valid) {
  const detail = `La fonction devient non définie vers x=${formatNumber((fine.invalidX ?? coarse.invalidX) || a)}.`;
  return {
   a, b, value: NaN, method: 'Calcul interrompu', steps: ['Le contrôle de domaine initial a réussi, mais un point du maillage de Simpson n’est pas calculable.', detail],
   areaPoints: [], isPositive: false, unit: 'aire algébrique', errorEstimate: NaN, quality: 'warning', checks: [domainCheck, { label: 'Maillage de Simpson', ok: false, detail }], warning: detail
  };
 }

 const errorEstimate = Math.abs(fine.value - coarse.value) / 15;
 const rounded = Math.round(fine.value * 1e10) / 1e10;
 const tolerance = 1e-7 * Math.max(1, Math.abs(fine.value));
 const convergenceOk = errorEstimate <= tolerance;
 const convergenceCheck: ReliabilityCheck = {
  label: 'Convergence numérique',
  ok: convergenceOk,
  detail: `Simpson n=1000 : ${formatNumber(coarse.value)} ; n=2000 : ${formatNumber(fine.value)} ; erreur estimée ≈ ${formatNumber(errorEstimate)}.`
 };

 const sampleCount = 220;
 for (let i = 0; i <= sampleCount; i++) {
  const x = a + ((b - a) * i) / sampleCount;
  const y = safeEval(expr, x);
  if (y !== null) areaPoints.push({ x, y });
 }

 const fa = safeEval(expr, a)!;
 const fb = safeEval(expr, b)!;
 steps.push(`1. On vérifie d’abord que f est définie sur tout [${formatNumber(a)} ; ${formatNumber(b)}].`);
 steps.push(`2. Aux bornes : f(${formatNumber(a)})=${formatNumber(fa)} et f(${formatNumber(b)})=${formatNumber(fb)}.`);
 steps.push(`3. Formule de Simpson : Sₙ = h/3 × [f(a)+4f(x₁)+2f(x₂)+…+f(b)].`);
 steps.push(`4. Premier calcul avec n=1000 : S₁₀₀₀ ≈ ${formatNumber(coarse.value)}.`);
 steps.push(`5. Contrôle avec un maillage deux fois plus fin, n=2000 : S₂₀₀₀ ≈ ${formatNumber(fine.value)}.`);
 steps.push(`6. Estimation de l’erreur de Simpson : |S₂₀₀₀-S₁₀₀₀|/15 ≈ ${formatNumber(errorEstimate)}.`);
 steps.push(`7. Valeur retenue : ∫[${formatNumber(a)},${formatNumber(b)}] f(x)dx ≈ ${formatNumber(rounded)}.`);

 return {
  a, b, value: rounded, method: 'Simpson contrôlé (n=1000 puis n=2000)', steps, areaPoints,
  isPositive: rounded >= 0, unit: 'unités² (aire algébrique)', errorEstimate,
  quality: 'approximate', checks: [domainCheck, convergenceCheck],
  warning: convergenceOk ? undefined : 'La convergence numérique est plus lente que prévu. Le résultat doit être considéré comme approché.'
 };
}

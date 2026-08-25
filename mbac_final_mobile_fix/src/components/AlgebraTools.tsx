import { MathExpression, MathText } from './MathNotation';
/**
 * Développement, Factorisation, Simplification
 * Version pédagogique : facteur commun, identités remarquables,
 * trinôme du second degré, étapes détaillées.
 * © 2025 RATOVOSON Navelanizara Romuel
 */
import React, { useState } from 'react';
import { MiniKeyboard, prettyToMath } from './MiniKeyboard';
import { ReliabilityPanel, type ReliabilityLevel } from './ReliabilityPanel';
import { parsePolynomial, formatPolynomial, polynomialDegree } from '../lib/polynomialEngine';
import { parseRationalPolynomial, rationalExcludedPoints, formatRationalPolynomial, rationalEquivalent } from '../lib/rationalEngine';
import { solveQuadraticReal } from '../lib/algebraCore';
import ToolHeader from './ToolHeader';

interface Props { onClose: () => void }
type Mode = 'expand' | 'factor' | 'simplify' | 'solve2';
type StepData = { title: string; math?: string; text?: string; color: string };

type ParsedTerm = {
 raw: string;
 coef: number;
 xPow: number;
 constantOnly: boolean;
};

function f(n: number): string {
 const r = Math.round(n * 10000) / 10000;
 if (Number.isInteger(r)) return String(r);
 for (const d of [2, 3, 4, 5, 6, 8, 10]) {
  const num = r * d;
  if (Math.abs(num - Math.round(num)) < 0.001) return `${Math.round(num)}/${d}`;
 }
 return r.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}
function deltaTolerance(a: number, b: number, c: number): number { return 1e-12 * Math.max(1, Math.abs(b * b), Math.abs(4 * a * c)); }


function pretty(s: string): string {
 return s
  .replace(/\^2/g, '²')
  .replace(/\^3/g, '³')
  .replace(/\*/g, '×')
  .replace(/sqrt\(/g, '√(')
  .replace(/-\(/g, '−(')
  .replace(/\+-/g, '−')
  .replace(/\+/g, ' + ')
  .replace(/-/g, ' − ')
  .replace(/\s+/g, ' ')
  .replace(/− \+/g, '− ')
  .trim();
}

function verifyEquivalentExpressions(original: string, transformed: string): { ok: boolean; detail: string } {
 const a=parseRationalPolynomial(original,'x',20),b=parseRationalPolynomial(transformed,'x',20);
 if(!a||!b)return{ok:false,detail:'Équivalence non certifiée : le moteur exact ne reconnaît pas cette transformation. Le résultat n’est pas marqué comme vérifié.'};
 const ea=rationalExcludedPoints(a),eb=rationalExcludedPoints(b);
 if(!ea.complete||!eb.complete)return{ok:false,detail:'Équivalence algébrique possible, mais le domaine complet n’est pas déterminé : vérification refusée.'};
 if(!rationalEquivalent(a,b)){
  const sameValues=(()=>{const aa={...a,originalDen:[1],domainComplete:true},bb={...b,originalDen:[1],domainComplete:true};return rationalEquivalent(aa as any,bb as any);})();
  if(sameValues)return{ok:false,detail:`Les expressions ont la même formule réduite mais pas le même domaine. Valeurs interdites de départ : {${ea.points.join(', ')||'aucune'}} ; après transformation : {${eb.points.join(', ')||'aucune'}}.`};
  return{ok:false,detail:'Le contrôle polynomial exact montre que les deux expressions ne sont pas équivalentes.'};
 }
 return{ok:true,detail:'Équivalence démontrée par identité polynomiale après mise au même dénominateur, avec conservation exacte des valeurs interdites.'};
}

function gcd2(a: number, b: number): number {
 a = Math.abs(Math.round(a));
 b = Math.abs(Math.round(b));
 while (b !== 0) [a, b] = [b, a % b];
 return a || 1;
}

function gcdList(nums: number[]): number {
 const ints = nums.map(n => Math.abs(Math.round(n))).filter(n => n !== 0);
 if (ints.length === 0) return 1;
 return ints.reduce((acc, n) => gcd2(acc, n));
}

function splitTopLevel(expr: string): string[] {
 const parts: string[] = [];
 let depth = 0;
 let cur = '';
 const s = expr.replace(/\s+/g, '');

 for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  if (ch === '(') depth++;
  if (ch === ')') depth--;

  const isSplit = depth === 0 && i > 0 && (ch === '+' || ch === '-');
  if (isSplit) {
   parts.push(cur);
   cur = ch;
  } else {
   cur += ch;
  }
 }
 if (cur) parts.push(cur);
 return parts.filter(Boolean);
}

function parseTerm(term: string): ParsedTerm | null {
 const t = term.replace(/\s+/g, '').replace(/\*/g, '');

 // Constant
 if (/^[+-]?\d+(\.\d+)?$/.test(t)) {
  return { raw: term, coef: parseFloat(t), xPow: 0, constantOnly: true };
 }

 // ax^n or ax or x^n or x
 const m = t.match(/^([+-]?)(\d+(?:\.\d+)?)?x(?:\^(\d+))?$/);
 if (m) {
  const sign = m[1] === '-' ? -1 : 1;
  const coefPart = m[2] ? parseFloat(m[2]) : 1;
  const pow = m[3] ? parseInt(m[3], 10) : 1;
  return { raw: term, coef: sign * coefPart, xPow: pow, constantOnly: false };
 }

 return null;
}

function formatMonomial(coef: number, pow: number): string {
 if (pow === 0) return f(coef);
 const abs = Math.abs(coef);
 const sign = coef < 0 ? '-' : '';
 const coefStr = abs === 1 ? '' : f(abs);
 const xPart = pow === 1 ? 'x' : `x^${pow}`;
 return `${sign}${coefStr}${xPart}`;
}

function divideTermByCommon(term: ParsedTerm, commonCoef: number, commonPow: number): string {
 const newCoef = term.coef / commonCoef;
 const newPow = term.xPow - commonPow;
 return formatMonomial(newCoef, newPow);
}

function approxIntegerRoot(n: number): number | null {
 if (n < 0) return null;
 const r = Math.sqrt(n);
 return Math.abs(r - Math.round(r)) < 0.001 ? Math.round(r) : null;
}

function formatBinomialTerm(root: number): string {
 return root >= 0 ? `(x - ${f(root)})` : `(x + ${f(-root)})`;
}

function formatCommonFactor(coef: number, pow: number): string {
 const coefStr = coef === 1 ? '' : coef === -1 ? '-' : f(coef);
 const xStr = pow === 0 ? '' : pow === 1 ? 'x' : `x^${pow}`;
 return `${coefStr}${xStr}` || '1';
}

// ── Step card ──
const StepCard = ({ step, index }: { step: StepData; index: number | string }) => (
 <div className={`bg-${step.color}-500/5 rounded-xl p-3 border border-${step.color}-500/15`}>
  <div className="flex items-start gap-2.5">
   <span className={`w-7 h-7 rounded-lg bg-${step.color}-600/40 text-white text-xs flex items-center justify-center shrink-0 font-bold`}>{index}</span>
   <div className="flex-1 min-w-0">
    <p className={`text-xs font-bold text-${step.color}-300`}>{step.title}</p>
    {step.math && <div className="text-sm text-white mt-1 overflow-x-auto leading-relaxed"><MathExpression value={step.math} /></div>}
    {step.text && <p className="text-[11px] text-slate-400 mt-1 leading-relaxed"><MathText auto>{step.text}</MathText></p>}
   </div>
  </div>
 </div>
);

const ResultBanner = ({ label, value, color = 'emerald' }: { label: string; value: string; color?: string }) => (
 <div className={`bg-gradient-to-r from-${color}-600/15 to-${color}-800/15 rounded-2xl p-5 border border-${color}-500/20 text-center`}>
  <p className={`text-[10px] text-${color}-400 font-bold uppercase tracking-widest mb-1`}>{label}</p>
  <div className="text-xl text-white font-extrabold overflow-x-auto math-answer"><MathExpression value={value} /></div>
 </div>
);

// ══════════════════════════════════════════════════════════
// DÉVELOPPEMENT PÉDAGOGIQUE
// ══════════════════════════════════════════════════════════
function doExpand(expr: string): { result: string; steps: StepData[] } {
 const steps: StepData[] = [];
 const clean = expr.replace(/\s+/g, '');

 try {
  steps.push({ title: 'Expression de départ', math: clean, color: 'slate' });
  const exactPoly=parsePolynomial(clean,'x',8);
  if(!exactPoly){steps.push({title:'Transformation non certifiée',text:'Le moteur scolaire exact ne reconnaît pas cette expression comme polynôme. Aucun développement automatique n’est proposé.',color:'amber'});return{result:clean,steps};}
  const expandedExact=formatPolynomial(exactPoly);

  // (a+b)^2 or (a-b)^2
  const sq = clean.match(/^\(([^()]+)\)\^2$/);
  if (sq) {
   const inner = sq[1];
   const parts = splitTopLevel(inner);
   if (parts.length === 2) {
    const a = parts[0], b = parts[1];
    const isMinus = b.startsWith('-');
    steps.push({ title: 'On reconnaît une identité remarquable', math: `(${inner})^2`, text: `Forme : ${isMinus ? '(a − b)²' : '(a + b)²'}`, color: 'blue' });
    steps.push({ title: 'Formule à utiliser', math: isMinus ? `(a - b)^2 = a^2 - 2ab + b^2` : `(a + b)^2 = a^2 + 2ab + b^2`, color: 'indigo' });
    steps.push({ title: 'Remplacement de a et b', math: isMinus ? `(${a})^2 - 2×(${a})×(${b.replace('-', '')}) + (${b.replace('-', '')})^2` : `(${a})^2 + 2×(${a})×(${b}) + (${b})^2`, text: `Ici a = ${pretty(a)} et b = ${pretty(b)}`, color: 'purple' });
    const result = expandedExact;
    steps.push({ title: 'On calcule puis on réduit', math: result, text: 'On développe chaque terme puis on regroupe les termes semblables.', color: 'emerald' });
    return { result, steps };
   }
  }

  // (a+b)^3
  const cube = clean.match(/^\(([^()]+)\)\^3$/);
  if (cube) {
   const inner = cube[1];
   steps.push({ title: 'On reconnaît un cube', math: `(${inner})^3`, text: 'Forme : (a ± b)³', color: 'blue' });
   steps.push({ title: 'Formule à utiliser', math: `(a + b)^3 = a^3 + 3a^2b + 3ab^2 + b^3`, color: 'indigo' });
   const result = expandedExact;
   steps.push({ title: 'Développement final', math: result, text: 'On applique l’identité remarquable puis on réduit.', color: 'emerald' });
   return { result, steps };
  }

  // Product of two parentheses
  const prod = clean.match(/^\(([^()]+)\)\*\(([^()]+)\)$/);
  if (prod) {
   const A = prod[1], B = prod[2];
   const aParts = splitTopLevel(A), bParts = splitTopLevel(B);
   if (aParts.length === 2 && bParts.length === 2) {
    steps.push({ title: 'Produit de deux parenthèses', math: `(${A})×(${B})`, text: 'On applique la double distributivité.', color: 'blue' });
    steps.push({ title: 'Méthode', math: `(a+b)(c+d) = ac + ad + bc + bd`, color: 'indigo' });
    steps.push({ title: 'Produits à calculer', math: `${aParts[0]}×${bParts[0]} ; ${aParts[0]}×${bParts[1]} ; ${aParts[1]}×${bParts[0]} ; ${aParts[1]}×${bParts[1]}`, color: 'purple' });
    const result = expandedExact;
    steps.push({ title: 'On réduit les termes', math: result, text: 'On additionne les termes de même nature.', color: 'emerald' });
    return { result, steps };
   }
  }

  // k(a+b)
  const dist = clean.match(/^([+-]?\d+(?:\.\d+)?)\*\(([^()]+)\)$/);
  if (dist) {
   const k = dist[1], inner = dist[2];
   const parts = splitTopLevel(inner);
   if (parts.length >= 2) {
    steps.push({ title: 'Distributivité simple', math: `${k}×(${inner})`, text: 'On distribue le coefficient à chaque terme de la parenthèse.', color: 'blue' });
    steps.push({ title: 'Formule', math: `k(a+b) = ka + kb`, color: 'indigo' });
    steps.push({ title: 'Application', math: parts.map(p => `${k}×(${p})`).join(' + ').replace(/\+ -/g, ' - '), color: 'purple' });
    const result = expandedExact;
    steps.push({ title: 'Résultat final', math: result, color: 'emerald' });
    return { result, steps };
   }
  }

  const result = expandedExact;
  steps.push({ title: 'Développement algébrique', math: result, text: 'Aucune identité remarquable évidente. On simplifie algébriquement.', color: 'amber' });
  return { result, steps };
 } catch (e: unknown) {
  return { result: clean, steps: [{ title: 'Erreur', text: e.message, color: 'red' }] };
 }
}

// ══════════════════════════════════════════════════════════
// FACTORISATION PÉDAGOGIQUE
// ══════════════════════════════════════════════════════════
function doFactor(expr: string): { result: string; steps: StepData[] } {
 const steps: StepData[] = [];
 const clean = expr.replace(/\s+/g, '');

 try {
  const fullPoly=parsePolynomial(clean,'x',8);
  if(!fullPoly){steps.push({title:'Factorisation non certifiée',math:clean,text:'Le moteur exact ne reconnaît pas cette expression comme polynôme. Aucune factorisation automatique n’est proposée.',color:'amber'});return{result:clean,steps};}
  const simplified = formatPolynomial(fullPoly);
  steps.push({ title: 'Expression de départ', math: simplified, color: 'slate' });

  const termsRaw = splitTopLevel(simplified);
  const parsed = termsRaw.map(parseTerm);
  const allParsed = parsed.every(Boolean) ? (parsed as ParsedTerm[]) : null;

  // 1) FACTEUR COMMUN — priorité absolue
  if (allParsed && allParsed.length >= 2) {
   const commonPow = Math.min(...allParsed.map(t => t.xPow));
   const coeffs = allParsed.map(t => t.coef);
   const allInt = coeffs.every(c => Math.abs(c - Math.round(c)) < 1e-6);
   const commonCoef = allInt ? gcdList(coeffs) : 1;
   const factorCoef = commonCoef > 1 ? commonCoef : 1;

   if ((factorCoef > 1 || commonPow > 0) && !allParsed.every(t => Math.abs(t.coef) === factorCoef && t.xPow === commonPow)) {
    const factor = formatCommonFactor(factorCoef, commonPow);
    const reducedTerms = allParsed.map(t => divideTermByCommon(t, factorCoef, commonPow));
    const inside = reducedTerms.join(' + ').replace(/\+ -/g, ' - ');
    const factorized = `${factor}(${inside})`;

    steps.push({ title: 'Méthode choisie : facteur commun', text: 'On cherche ce que tous les termes ont en commun.', color: 'blue' });
    steps.push({ title: 'Facteur commun trouvé', math: factor, text: `${factorCoef > 1 ? `Tous les coefficients sont divisibles par ${factorCoef}. ` : ''}${commonPow > 0 ? `Chaque terme contient x${commonPow > 1 ? `^${commonPow}` : ''}.` : ''}`, color: 'indigo' });
    steps.push({ title: 'On met le facteur commun en évidence', math: `${simplified} = ${factor}(${inside})`, text: 'Chaque terme a été divisé par le facteur commun.', color: 'purple' });
    steps.push({ title: 'Forme factorisée finale', math: factorized, color: 'emerald' });
    return { result: factorized, steps };
   }
  }

  // Reconnaissance exacte du polynôme par l'arbre syntaxique : aucune interpolation sur quelques points.
  const poly = parsePolynomial(simplified, 'x', 2);
  const isQuadratic = !!poly && polynomialDegree(poly) === 2 && Math.abs(poly[2] || 0) > 1e-12;
  const c = poly?.[0] || 0;
  const b = poly?.[1] || 0;
  const a = poly?.[2] || 0;

  // 2) DIFFÉRENCE DE CARRÉS : x² - 9, 4x² - 25 ...
  if (isQuadratic && Math.abs(b) < 0.001 && a > 0 && c < 0) {
   const sqrtA = approxIntegerRoot(a);
   const sqrtC = approxIntegerRoot(-c);
   if (sqrtA !== null && sqrtC !== null) {
    const A = sqrtA === 1 ? 'x' : `${sqrtA}x`;
    const B = `${sqrtC}`;
    const result = `(${A} - ${B})(${A} + ${B})`;
    steps.push({ title: 'Méthode choisie : identité remarquable', text: 'On reconnaît une différence de deux carrés.', color: 'blue' });
    steps.push({ title: 'Écriture sous la forme A² - B²', math: `${f(a)}x^2 - ${f(-c)} = (${A})^2 - (${B})^2`, color: 'indigo' });
    steps.push({ title: 'Formule à appliquer', math: `A^2 - B^2 = (A - B)(A + B)`, color: 'purple' });
    steps.push({ title: 'Forme factorisée finale', math: result, color: 'emerald' });
    return { result, steps };
   }
  }

  // 3) CARRÉ PARFAIT : x² + 6x + 9, x² - 4x + 4 ...
  if (isQuadratic) {
   const delta = b * b - 4 * a * c;
   const epsDelta = deltaTolerance(a, b, c);
   if (Math.abs(delta) <= epsDelta) {
    const sqrtA = approxIntegerRoot(a);
    const sqrtC = approxIntegerRoot(Math.abs(c));
    const x0 = -b / (2 * a);
    const aStr = Math.abs(a) === 1 ? (a > 0 ? '' : '-') : f(a);
    const inner = formatBinomialTerm(x0);
    const result = `${aStr}${inner}^2`;

    if (sqrtA !== null && sqrtC !== null) {
     const B = sqrtC;
     steps.push({ title: 'Méthode choisie : carré parfait', text: 'Le discriminant est nul : le trinôme est un carré parfait.', color: 'blue' });
     steps.push({ title: 'Reconnaissance', math: `${f(a)}x^2 + ${f(b)}x + ${f(c)} = (${sqrtA === 1 ? 'x' : `${sqrtA}x`})^2 ${b > 0 ? '+' : '-'} 2×${sqrtA === 1 ? 'x' : `${sqrtA}x`}×${B} + ${B}^2`, color: 'indigo' });
     steps.push({ title: 'Formule à appliquer', math: `(A ± B)^2 = A^2 ± 2AB + B^2`, color: 'purple' });
     steps.push({ title: 'Forme factorisée finale', math: result, color: 'emerald' });
     return { result, steps };
    }

    steps.push({ title: 'Méthode choisie : racine double', math: `Δ = 0 et x₀ = ${f(x0)}`, text: 'Le trinôme se factorise sous la forme a(x − x₀)².', color: 'blue' });
    steps.push({ title: 'Forme factorisée finale', math: result, color: 'emerald' });
    return { result, steps };
   }
  }

  // 4) TRINÔME GÉNÉRAL — discriminant en dernier recours
  if (isQuadratic) {
   steps.push({ title: 'Méthode choisie : discriminant', math: `${f(a)}x^2 + ${f(b)}x + ${f(c)}`, text: 'Aucune identité remarquable évidente, on utilise le discriminant.', color: 'blue' });
   const delta = b * b - 4 * a * c;
   const epsDelta = deltaTolerance(a, b, c);
   steps.push({ title: 'Calcul du discriminant', math: `Δ = (${f(b)})^2 - 4×${f(a)}×${f(c)} = ${f(delta)}`, color: 'purple' });

   if (delta > epsDelta) {
    const sqrtD = Math.sqrt(delta);
    const x1 = (-b + sqrtD) / (2 * a);
    const x2 = (-b - sqrtD) / (2 * a);
    const aStr = Math.abs(a - 1) < 1e-12 ? '' : Math.abs(a + 1) < 1e-12 ? '-' : `${f(a)}*`;
    const sqrtIsSimple = Math.abs(sqrtD - Math.round(sqrtD)) < 1e-10;
    const r1 = sqrtIsSimple ? f(x1) : `((${f(-b)}+sqrt(${f(delta)}))/(${f(2*a)}))`;
    const r2 = sqrtIsSimple ? f(x2) : `((${f(-b)}-sqrt(${f(delta)}))/(${f(2*a)}))`;
    const t1 = `(x-(${r1}))`;
    const t2 = `(x-(${r2}))`;
    const result = `${aStr}${t1}*${t2}`;

    steps.push({ title: 'Deux racines réelles', math: sqrtIsSimple ? `x₁ = ${f(x1)} ; x₂ = ${f(x2)}` : `x₁=(-b+√Δ)/(2a) ; x₂=(-b-√Δ)/(2a)`, text: 'Comme Δ > 0, il y a deux racines distinctes.', color: 'cyan' });
    steps.push({ title: 'Formule exacte', math: `P(x)=a(x-x₁)(x-x₂)`, color: 'indigo' });
    steps.push({ title: 'Forme factorisée finale', math: result, color: 'emerald' });
    return { result, steps };
   }

   steps.push({ title: 'Pas de factorisation réelle', text: `Δ = ${f(delta)} < 0, donc le trinôme n'a pas de racine réelle.`, color: 'amber' });
   return { result: simplified, steps };
  }

  // 5) Affine simple
  if (allParsed && allParsed.length <= 2) {
   const zeroTerm = allParsed.find(t => t.xPow === 0);
   const xTerm = allParsed.find(t => t.xPow === 1);
   if (xTerm && zeroTerm) {
    const root = -zeroTerm.coef / xTerm.coef;
    const coefStr = Math.abs(xTerm.coef) === 1 ? (xTerm.coef > 0 ? '' : '-') : f(xTerm.coef);
    const result = `${coefStr}${formatBinomialTerm(root)}`;
    steps.push({ title: 'Expression affine', text: 'On met en évidence le zéro de l’expression affine.', color: 'blue' });
    steps.push({ title: 'Zéro de la fonction', math: `x = ${f(root)}`, color: 'purple' });
    steps.push({ title: 'Forme factorisée finale', math: result, color: 'emerald' });
    return { result, steps };
   }
  }

  steps.push({ title: 'Aucune méthode scolaire reconnue', text: 'Essayez une expression avec facteur commun, identité remarquable, ou trinôme du second degré.', color: 'amber' });
  return { result: simplified, steps };
 } catch (e: unknown) {
  return { result: expr, steps: [{ title: 'Erreur', text: e.message, color: 'red' }] };
 }
}

// ══════════════════════════════════════════════════════════
// RÉSOLUTION TRINÔME
// ══════════════════════════════════════════════════════════
function doSolve(a: number, b: number, c: number): StepData[] {
 const steps: StepData[] = [];
 const r = solveQuadraticReal(a, b, c);
 steps.push({ title: 'Équation à résoudre', math: `${f(a)}x^2 + ${f(b)}x + ${f(c)} = 0`, color: 'slate' });
 steps.push({ title: 'Coefficients', text: `a = ${f(a)}, b = ${f(b)}, c = ${f(c)}`, color: 'indigo' });
 if (r.delta !== null) steps.push({ title: 'Discriminant', math: `Δ=b^2-4ac=${f(r.delta)}`, color: 'purple' });
 if (r.kind === 'two') {
  steps.push({ title: 'Deux solutions réelles', math: `x₁=${f(r.roots[0])} ; x₂=${f(r.roots[1])}`, color: 'cyan' });
  steps.push({ title: 'Ensemble solution', math: `S={${f(r.roots[0])};${f(r.roots[1])}}`, color: 'emerald' });
 } else if (r.kind === 'double') {
  steps.push({ title: 'Racine double', math: `x₀=${f(r.roots[0])}`, color: 'cyan' });
  steps.push({ title: 'Ensemble solution', math: `S={${f(r.roots[0])}}`, color: 'emerald' });
 } else if (r.kind === 'none') {
  steps.push({ title: 'Aucune solution réelle', math: 'S=∅', color: 'amber' });
 } else if (r.kind === 'linear') {
  steps.push({ title: 'Équation du premier degré', math: `x=${f(r.roots[0])}`, color: 'cyan' });
 }
 if (r.verification.length) steps.push({ title: 'Vérification par substitution', text: r.verification.map((v,i)=>`|P(x${i+1})|=${v.residual.toExponential(2)} ${v.ok?'✓':'à contrôler'}`).join(' ; '), color: r.verification.every(v=>v.ok)?'emerald':'amber' });
 return steps;
}

// ══════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════
export const AlgebraTools: React.FC<Props> = ({ onClose }) => {
 const [mode, setMode] = useState<Mode>('expand');
 const [expr, setExpr] = useState('(x + 3)²');
 const [eqA, setEqA] = useState('1');
 const [eqB, setEqB] = useState('-5');
 const [eqC, setEqC] = useState('6');
 const [res, setRes] = useState<{ banner: { label: string; value: string; color: string }; steps: StepData[]; quality: { level: ReliabilityLevel; detail: string } } | null>(null);
 const [err, setErr] = useState('');

 const handleAction = () => {
  setErr('');
  const mathExpr = prettyToMath(expr);
  try {
   if (mode === 'expand') {
    const r = doExpand(mathExpr);
    const check = verifyEquivalentExpressions(mathExpr, r.result);
    setRes({ banner: { label: 'Forme développée', value: r.result, color: 'indigo' }, steps: r.steps, quality: { level: check.ok ? 'verified' : 'warning', detail: check.detail } });
   } else if (mode === 'factor') {
    const r = doFactor(mathExpr);
    const check = verifyEquivalentExpressions(mathExpr, r.result);
    setRes({ banner: { label: 'Forme factorisée', value: r.result, color: 'emerald' }, steps: r.steps, quality: { level: check.ok ? 'verified' : 'warning', detail: check.detail } });
   } else if (mode === 'simplify') {
    const rat=parseRationalPolynomial(mathExpr,'x',20);
    if(!rat){setRes({banner:{label:'Expression inchangée',value:mathExpr,color:'amber'},steps:[{title:'Simplification non certifiée',math:mathExpr,text:'Cette forme dépasse les simplifications rationnelles/polynomiales garanties par le moteur. L’application préfère ne rien modifier plutôt que produire une identité incertaine.',color:'amber'}],quality:{level:'warning',detail:'Aucune transformation non prouvée n’a été appliquée.'}});return;}
    const simplified = formatRationalPolynomial(rat);
    const ex=rationalExcludedPoints(rat);
    const restriction=ex.complete&&ex.points.length?`Condition conservée : x ≠ ${ex.points.join(', ')}.`:ex.complete?'Aucune valeur interdite.':'Domaine complet non déterminé.';
    const check = verifyEquivalentExpressions(mathExpr, simplified);
    setRes({
     banner: { label: 'Forme simplifiée', value: simplified, color: check.ok ? 'emerald' : 'amber' },
     steps: [
      { title: 'Expression originale', math: mathExpr, color: 'slate' },
      { title: 'Réduction exacte', math: simplified, text: 'Numérateur et dénominateur sont réduits par calcul polynomial exact.', color: 'purple' },
      { title: 'Domaine à conserver', text: restriction, color: ex.complete ? 'blue' : 'amber' },
     ],
     quality: { level: check.ok ? 'verified' : 'warning', detail: check.detail + ' ' + restriction }
    });
   }
  } catch (e: unknown) {
   setErr(e.message);
  }
 };

 const handleSolve = () => {
  setErr('');
  const a = parseFloat(eqA), b = parseFloat(eqB), c = parseFloat(eqC);
  if (isNaN(a) || a === 0 || isNaN(b) || isNaN(c)) {
   setErr('a doit être ≠ 0');
   return;
  }
  const steps = doSolve(a, b, c);
  const solved = solveQuadraticReal(a, b, c);
  const ok = solved.verification.every(v => v.ok);
  const solutionText = solved.kind === 'two' ? `S={${f(solved.roots[0])};${f(solved.roots[1])}}` : solved.kind === 'double' || solved.kind === 'linear' ? `S={${f(solved.roots[0])}}` : solved.kind === 'all' ? 'S=ℝ' : 'S=∅';
  setRes({ banner: { label: 'Solution', value: solutionText, color: ok ? 'emerald' : 'amber' }, steps, quality: { level: ok ? 'verified' : 'warning', detail: solved.roots.length ? 'Les solutions sont calculées avec une formule numériquement stable puis recontrôlées par substitution.' : 'La conclusion est obtenue exactement à partir du degré et du discriminant.' } });
 };

 const examples: Record<Mode, { label: string; val: string }[]> = {
  expand: [
   { label: '(x+3)²', val: '(x+3)²' },
   { label: '(x−2)²', val: '(x−2)²' },
   { label: '(2x−1)(x+4)', val: '(2x−1)(x+4)' },
   { label: '3(x+5)', val: '3(x+5)' },
  ],
  factor: [
   { label: 'x²−9', val: 'x²−9' },
   { label: 'x²−5x+6', val: 'x²−5x+6' },
   { label: '2x²+4x', val: '2x²+4x' },
   { label: 'x²+6x+9', val: 'x²+6x+9' },
   { label: 'x²−4x+4', val: 'x²−4x+4' },
   { label: 'x²+x+1', val: 'x²+x+1' },
  ],
  simplify: [
   { label: '(x²−1)/(x−1)', val: '(x²−1)÷(x−1)' },
   { label: '6x/3', val: '6x÷3' },
   { label: '(2x)²', val: '(2x)²' },
  ],
  solve2: [],
 };

 return (
  <div className="fixed inset-0 bg-slate-950/98 z-50 overflow-y-auto">
   <div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
    <div className="flex items-center justify-between mb-4">
     <h2 className="text-xl font-extrabold text-white"> Algèbre</h2>
     <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">×</button>
    </div>

    <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-hide">
     {([
      { id: 'expand' as Mode, l: ' Développer' },
      { id: 'factor' as Mode, l: ' Factoriser' },
      { id: 'simplify' as Mode, l: ' Simplifier' },
      { id: 'solve2' as Mode, l: ' Trinôme' },
     ]).map(m => (
      <button key={m.id} onClick={() => { setMode(m.id); setRes(null); }}
       className={`shrink-0 py-2 px-3 rounded-xl text-xs font-bold transition-all ${mode === m.id ? 'bg-indigo-600 text-white' : 'bg-slate-800/50 text-slate-400 border border-slate-700/30'}`}>
       {m.l}
      </button>
     ))}
    </div>

    {mode !== 'solve2' && (
     <>
      <div className="mb-3">
       <MiniKeyboard value={expr} onChange={setExpr} label="Expression" placeholder="(x + 3)²" />
      </div>
      {examples[mode].length > 0 && (
       <div className="flex gap-1.5 flex-wrap mb-3">
        {examples[mode].map((ex, i) => (
         <button key={i} onClick={() => setExpr(ex.val)} className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-[11px] text-slate-300 active:scale-95">
          <MathExpression value={ex.val} />
         </button>
        ))}
       </div>
      )}
      <button onClick={handleAction} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98] mb-4">
       {mode === 'expand' ? ' Développer' : mode === 'factor' ? ' Factoriser' : ' Simplifier'}
      </button>
     </>
    )}

    {mode === 'solve2' && (
     <>
      <div className="bg-slate-800/30 rounded-xl p-3 mb-3 text-center">
       <div className="text-lg text-white math-answer"><MathExpression value={`${eqA}*x^2+(${eqB})*x+(${eqC})=0`} /></div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
       {[{ l: 'a', v: eqA, s: setEqA }, { l: 'b', v: eqB, s: setEqB }, { l: 'c', v: eqC, s: setEqC }].map(field => (
        <div key={field.l}>
         <label className="block text-xs text-slate-400 mb-1 text-center">{field.l} =</label>
         <input type="number" value={field.v} onChange={e => field.s(e.target.value)} step="0.5" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-center text-lg focus:border-indigo-500 focus:outline-none" />
        </div>
       ))}
      </div>
      <button onClick={handleSolve} className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl active:scale-[0.98] mb-4"> Résoudre</button>
     </>
    )}

    {err && <p className="text-red-400 text-sm mb-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3">{err}</p>}

    {res && (
     <div className="space-y-3 animate-scale-in">
      <ResultBanner label={res.banner.label} value={res.banner.value} color={res.banner.color} />
      <ReliabilityPanel level={res.quality.level} title={res.quality.level === 'verified' ? 'Transformation vérifiée' : 'Résultat à contrôler'} detail={res.quality.detail} />
      <div className="space-y-2">
       {res.steps.map((step, i) => <StepCard key={i} step={step} index={i + 1} />)}
      </div>
     </div>
    )}
   </div>
  </div>
 );
};

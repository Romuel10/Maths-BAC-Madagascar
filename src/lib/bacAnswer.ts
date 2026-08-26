import { evaluate, simplify } from 'mathjs';
import type { AnswerCheck } from '../data/bacSubjects.js';
import { parseRationalPolynomial, rationalEquivalent, rationalExcludedPoints } from './rationalEngine.js';

function normalizeText(value: string): string {
 return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[−–—]/g, '-')
  .replace(/ℝ/g, 'r').replace(/\\setminus/g, ' moins ').replace(/,/g, '.')
  .replace(/[^a-z0-9+*/^=<>.\\-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function textContainsTerm(answer:string,term:string):boolean{
 const normalizedTerm=normalizeText(term);
 if(!normalizedTerm)return false;
 const compact=(value:string)=>value.replace(/\s+/g,'');
 if(/[+*/^=<>\\]/.test(normalizedTerm)||normalizedTerm.includes(' '))return compact(answer).includes(compact(normalizedTerm));
 const escaped=normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(answer);
}

function toMathExpression(value: string): string {
 return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[−–—]/g, '-').replace(/,/g, '.')
  .replace(/√\s*\(([^)]+)\)/g, 'sqrt($1)').replace(/√\s*([0-9.]+)/g, 'sqrt($1)').replace(/ln\s*\(/g, 'log(')
  .replace(/e\^\(([^)]+)\)/g, 'exp($1)').replace(/e\^([a-z0-9+\-*/.]+)/g, 'exp($1)').replace(/\)\s*\(/g, ')*(')
  .replace(/²/g, '^2').replace(/³/g, '^3').replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '');
}

function numericValue(input: string): number | null {
 try {
  const v = evaluate(toMathExpression(input));
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
 } catch {
  return null;
 }
}

type EquivalenceStatus = 'verified' | 'probable' | 'no';

function expressionEquivalent(student: string, expected: string, variable = 'x'): EquivalenceStatus {
 const s = toMathExpression(student);
 const e = toMathExpression(expected);
 const sr=parseRationalPolynomial(s,variable,20),er=parseRationalPolynomial(e,variable,20);
 if(sr&&er){
  const sd=rationalExcludedPoints(sr),ed=rationalExcludedPoints(er);
  if(sd.complete&&ed.complete) return rationalEquivalent(sr,er)?'verified':'no';
 }
 try {
  const diff = simplify(`(${s})-(${e})`).toString();
  if (diff === '0') return 'verified';
 } catch { /* contrôle numérique strict ci-dessous */ }

 const samples = [-7.3, -5.1, -3.2, -2.1, -1.1, -0.55, -0.25, 0, 0.4, 0.85, 1.3, 2.05, 2.7, 4.1, 6.4, 8.2];
 let compared = 0;
 for (const x of samples) {
  let a: unknown = null;
  let b: unknown = null;
  let aDefined = false;
  let bDefined = false;
  try { a = evaluate(s, { [variable]: x }); aDefined = typeof a === 'number' && Number.isFinite(a); } catch { aDefined = false; }
  try { b = evaluate(e, { [variable]: x }); bDefined = typeof b === 'number' && Number.isFinite(b); } catch { bDefined = false; }
  if (aDefined !== bDefined) return 'no';
  if (!aDefined || !bDefined) continue;
  compared++;
  const av = a as number, bv = b as number;
  if (Math.abs(av - bv) > 1e-8 * Math.max(1, Math.abs(av), Math.abs(bv))) return 'no';
 }
 return compared >= 10 ? 'probable' : 'no';
}

export interface AnswerFeedback {
 correct: boolean;
 message: string;
 confidence: 'verified' | 'probable' | 'unverified';
 /** Fraction de points proposée. Les réponses rédigées restent signalées comme probables. */
 scoreRatio: number;
}

export function checkAnswer(answer: string, check: AnswerCheck): AnswerFeedback {
 if (!answer.trim()) return { correct: false, message: 'Écris d’abord ta réponse.', confidence: 'unverified', scoreRatio: 0 };

 if (check.kind === 'number') {
  const value = numericValue(answer);
  if (value === null) return { correct: false, message: 'Je n’arrive pas à lire toute la valeur numérique. Vérifie la syntaxe de ta réponse.', confidence: 'unverified', scoreRatio: 0 };
  const tol = check.tolerance ?? 1e-6;
  const correct = Math.abs(value - check.expected) <= tol;
  return correct
   ? { correct: true, message: 'Correct. La valeur complète a été recalculée et comparée à la réponse attendue.', confidence: 'verified', scoreRatio: 1 }
   : { correct: false, message: 'Ce résultat numérique n’est pas correct. Reprends le calcul étape par étape.', confidence: 'verified', scoreRatio: 0 };
 }

 if (check.kind === 'expression') {
  const status = expressionEquivalent(answer, check.expected, check.variable || 'x');
  if (status === 'verified') return { correct: true, message: 'Correct. La différence avec la réponse attendue se simplifie exactement à 0.', confidence: 'verified', scoreRatio: 1 };
  if (status === 'probable') return { correct: false, message: 'L’expression concorde sur les contrôles numériques, mais l’équivalence globale n’est pas démontrée. Elle est à contrôler avant d’être validée.', confidence: 'probable', scoreRatio: 0 };
  return { correct: false, message: 'L’expression ne concorde pas avec la réponse attendue. Vérifie les signes, parenthèses, fractions et simplifications.', confidence: 'verified', scoreRatio: 0 };
 }

 if (check.kind === 'choice') {
  const correct = normalizeText(answer) === normalizeText(check.expected);
  return correct ? { correct: true, message: 'Bonne réponse.', confidence: 'verified', scoreRatio: 1 } : { correct: false, message: 'Ce choix n’est pas correct.', confidence: 'verified', scoreRatio: 0 };
 }

 const normalized = normalizeText(answer);
 const matchedAll = (check.allOf || []).filter(term => textContainsTerm(normalized,term)).length;
 const matchedAny = (check.anyOf || []).some(term => textContainsTerm(normalized,term));
 const requirementCount = (check.allOf?.length || 0) + (check.anyOf?.length ? 1 : 0);
 const matchedCount = matchedAll + (check.anyOf?.length && matchedAny ? 1 : 0);
 const scoreRatio = requirementCount > 0 ? matchedCount / requirementCount : 0;
 const allOk = matchedAll === (check.allOf?.length || 0);
 const anyOk = !check.anyOf?.length || matchedAny;
 const correct = allOk && anyOk;
 return correct
  ? { correct: true, message: 'Les éléments essentiels attendus sont présents. Pour une réponse rédigée, compare aussi ta justification avec la correction.', confidence: 'probable', scoreRatio: 1 }
  : { correct: false, message: scoreRatio > 0 ? 'Réponse partielle : certains éléments essentiels sont présents, mais il en manque encore.' : 'Il manque encore un élément important dans ta réponse.', confidence: 'probable', scoreRatio };
}

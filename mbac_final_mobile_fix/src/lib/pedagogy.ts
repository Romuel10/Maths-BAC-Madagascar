import { evaluate, simplify } from 'mathjs';
import { prettyToMath } from '../components/MiniKeyboard';
import { parseRationalPolynomial, rationalEquivalent, rationalExcludedPoints, rationalProportional } from './rationalEngine.js';

export type PedagogyMode = 'guided' | 'normal' | 'autonomous';
export type StepStatus = 'verified' | 'probable' | 'incorrect' | 'unreadable';

export interface StepFeedback {
 status: StepStatus;
 title: string;
 message: string;
 details?: string;
 mistakeCode?: string;
}

const SAMPLE_POINTS = [-7.1, -4.2, -2.3, -1.25, -0.5, 0.2, 0.75, 1.4, 2.6, 4.5, 7.2];

function clean(raw: string): string {
 return prettyToMath(String(raw || ''))
  .replace(/\s+/g, '')
  .replace(/=/g, '=')
  .trim();
}

function splitEquation(raw: string): [string, string] | null {
 const s = clean(raw);
 const idx = s.indexOf('=');
 if (idx <= 0 || idx >= s.length - 1 || s.indexOf('=', idx + 1) !== -1) return null;
 return [s.slice(0, idx), s.slice(idx + 1)];
}

function equationResidual(raw: string): string | null {
 const parts = splitEquation(raw);
 if (!parts) return null;
 return `((${parts[0]})-(${parts[1]}))`;
}

function expressionEquivalent(aRaw: string, bRaw: string): StepStatus {
 const a = clean(aRaw);
 const b = clean(bRaw);
 if (!a || !b) return 'unreadable';
 const ar=parseRationalPolynomial(a,'x',20),br=parseRationalPolynomial(b,'x',20);
 if(ar&&br){const ad=rationalExcludedPoints(ar),bd=rationalExcludedPoints(br);if(ad.complete&&bd.complete)return rationalEquivalent(ar,br)?'verified':'incorrect';}
 try {
  if (simplify(`(${a})-(${b})`).toString() === '0') return 'verified';
 } catch { /* numerical fallback */ }

 let compared = 0;
 for (const x of SAMPLE_POINTS) {
  let av: unknown;
  let bv: unknown;
  let ad = false;
  let bd = false;
  try { av = evaluate(a, { x }); ad = typeof av === 'number' && Number.isFinite(av); } catch { ad = false; }
  try { bv = evaluate(b, { x }); bd = typeof bv === 'number' && Number.isFinite(bv); } catch { bd = false; }
  if (ad !== bd) return 'incorrect';
  if (!ad || !bd) continue;
  compared++;
  const aa = av as number;
  const bb = bv as number;
  if (Math.abs(aa - bb) > 1e-8 * Math.max(1, Math.abs(aa), Math.abs(bb))) return 'incorrect';
 }
 return compared >= 7 ? 'probable' : 'unreadable';
}

function equationEquivalent(aRaw: string, bRaw: string): StepStatus {
 const ar = equationResidual(aRaw);
 const br = equationResidual(bRaw);
 if (!ar || !br) return 'unreadable';

 // Multiplying an equation by a non-zero constant preserves its solution set.
 // For rational/polynomial residuals, require exact proportionality AND the same domain.
 const arr=parseRationalPolynomial(ar,'x',20),brr=parseRationalPolynomial(br,'x',20);
 if(arr&&brr){
  const ad=rationalExcludedPoints(arr),bd=rationalExcludedPoints(brr);
  if(ad.complete&&bd.complete) return rationalProportional(arr,brr)?'verified':'incorrect';
 } else {
  // Secondary symbolic route only for expressions outside the exact rational engine.
  try {
   const ratio = simplify(`(${ar})/(${br})`);
   const txt = ratio.toString();
   if (!txt.includes('x')) {
    const val = evaluate(txt);
    if (typeof val === 'number' && Number.isFinite(val) && Math.abs(val) > 1e-12) return 'verified';
   }
  } catch { /* continue */ }
 }

 // Numerical zero-set consistency around a useful sample grid.
 let evidence = 0;
 for (const x of [...SAMPLE_POINTS, -10, -5, -3, -2, -1, 0, 1, 2, 3, 5, 10]) {
  try {
   const av = evaluate(ar, { x });
   const bv = evaluate(br, { x });
   if (typeof av !== 'number' || typeof bv !== 'number' || !Number.isFinite(av) || !Number.isFinite(bv)) continue;
   const az = Math.abs(av) < 1e-8;
   const bz = Math.abs(bv) < 1e-8;
   if (az !== bz) return 'incorrect';
   if (az || bz) evidence++;
  } catch { /* skip undefined */ }
 }
 return evidence > 0 ? 'probable' : 'unreadable';
}

export function detectCommonMistake(studentRaw: string, expectedRaw?: string): StepFeedback | null {
 const s = clean(studentRaw).toLowerCase();
 const e = clean(expectedRaw || '').toLowerCase();
 const raw = String(studentRaw || '').replace(/\s+/g, '').toLowerCase();

 if (!s) return null;

 if (/sqrt\([^)]*\+[^)]*\)\s*=\s*sqrt\([^)]*\)\+sqrt\(/.test(s) || /√\([^)]*\+[^)]*\).*√.*\+.*√/.test(raw)) {
  return { status: 'incorrect', mistakeCode: 'sqrt-sum', title: 'La racine ne se distribue pas sur une somme', message: 'En général, √(a+b) ≠ √a + √b. Garde la somme sous la même racine, sauf transformation justifiée.' };
 }

 if (/log\([^)]*\+[^)]*\)\s*=\s*log\([^)]*\)\+log\(/.test(s) || /ln\([^)]*\+[^)]*\).*ln.*\+.*ln/.test(raw)) {
  return { status: 'incorrect', mistakeCode: 'log-sum', title: 'Le logarithme ne se distribue pas sur une somme', message: 'La propriété correcte est ln(ab)=ln(a)+ln(b), pas ln(a+b).' };
 }

 if (/\([^()]+\+[^()]+\)\^2/.test(e) && /\^2\+.*\^2/.test(s) && !/2\*/.test(s)) {
  return { status: 'incorrect', mistakeCode: 'square-sum', title: 'Terme double probablement oublié', message: 'Pour (a+b)², utilise a² + 2ab + b². Le terme 2ab est indispensable.' };
 }

 if (/\([^()]+-[^()]+\)\^2/.test(e) && /\^2\+.*\^2/.test(s) && !/-2\*/.test(s)) {
  return { status: 'incorrect', mistakeCode: 'square-difference', title: 'Terme double probablement oublié', message: 'Pour (a−b)², utilise a² − 2ab + b².' };
 }

 if (/\([+-]?\d+(?:\.\d+)?\*?x\)\^2/.test(e) && /\d+\*?x\^2/.test(s)) {
  const coefExpected = e.match(/\(([+-]?\d+(?:\.\d+)?)\*?x\)\^2/);
  const coefStudent = s.match(/([+-]?\d+(?:\.\d+)?)\*?x\^2/);
  if (coefExpected && coefStudent) {
   const c = Number(coefExpected[1]);
   const cs = Number(coefStudent[1]);
   if (Number.isFinite(c) && Number.isFinite(cs) && Math.abs(cs - c) < 1e-12 && Math.abs(c) !== 0 && Math.abs(c) !== 1) {
    return { status: 'incorrect', mistakeCode: 'coefficient-square', title: 'Le coefficient doit aussi être élevé au carré', message: `( ${c}x )² = ${c}²x² = ${c * c}x².` };
   }
  }
 }

 if (/^-\([^)]*\+[^)]*\)/.test(e) && /^-[^+]+\+/.test(s)) {
  return { status: 'incorrect', mistakeCode: 'minus-parentheses', title: 'Attention au signe « − » devant les parenthèses', message: 'Quand on enlève −(a+b), les deux signes changent : −a−b.' };
 }

 if (/\/(?:0(?:\.0*)?)(?:$|[)=])/.test(s)) {
  return { status: 'incorrect', mistakeCode: 'division-zero', title: 'Division par zéro impossible', message: 'Une fraction n’est définie que si son dénominateur est non nul.' };
 }

 return null;
}

export function verifyTransformation(previousRaw: string, nextRaw: string): StepFeedback {
 if (!nextRaw.trim()) return { status: 'unreadable', title: 'Étape vide', message: 'Écris la prochaine ligne de ton calcul.' };

 const common = detectCommonMistake(nextRaw);
 if (common) return common;

 const prevEq = splitEquation(previousRaw);
 const nextEq = splitEquation(nextRaw);
 let status: StepStatus;

 if (prevEq && nextEq) status = equationEquivalent(previousRaw, nextRaw);
 else if (!prevEq && !nextEq) status = expressionEquivalent(previousRaw, nextRaw);
 else return {
  status: 'unreadable',
  title: 'Je ne peux pas comparer ces deux lignes directement',
  message: 'Garde le même type d’écriture d’une ligne à l’autre : équation avec équation, ou expression avec expression.'
 };

 if (status === 'verified') return { status, title: 'Étape vérifiée', message: 'Cette transformation conserve exactement la même expression ou la même équation.' };
 if (status === 'probable') return { status, title: 'Étape cohérente', message: 'La transformation concorde aux contrôles effectués, mais elle mérite encore une justification écrite sur une copie de BAC.' };
 if (status === 'incorrect') return { status, title: 'Erreur entre ces deux lignes', message: 'La nouvelle ligne n’est pas équivalente à la précédente. Vérifie surtout les signes, parenthèses, produits, fractions et puissances.' };
 return { status, title: 'Étape non déterminée automatiquement', message: 'Je ne peux pas prouver cette transformation avec suffisamment de fiabilité. Compare-la à la méthode ou reformule la ligne.' };
}

export function feedbackAgainstExpected(studentRaw: string, expectedRaw: string): StepFeedback | null {
 const common = detectCommonMistake(studentRaw, expectedRaw);
 if (common) return common;
 const status = expressionEquivalent(studentRaw, expectedRaw);
 if (status === 'incorrect') return { status, title: 'Le calcul ne correspond pas encore au résultat attendu', message: 'Repars de la dernière étape correcte. Vérifie les signes, les priorités et les parenthèses.' };
 return null;
}

/**
 * Moteur nombres complexes V4.5 — opérations déterministes et vérifiables.
 */
export interface Complex { re: number; im: number }
export interface ComplexResult {
 z: Complex;
 modulus: number;
 argument: number | null;
 argumentDeg: number | null;
 conjugate: Complex;
 algebraicForm: string;
 trigForm: string;
 exponentialForm: string;
}

const EPS = 1e-14;
function finite(z: Complex): boolean { return Number.isFinite(z.re) && Number.isFinite(z.im); }
function clean(v: number): number { return Math.abs(v) < EPS ? 0 : v; }

export function cAdd(a: Complex, b: Complex): Complex { return { re: clean(a.re + b.re), im: clean(a.im + b.im) }; }
export function cSub(a: Complex, b: Complex): Complex { return { re: clean(a.re - b.re), im: clean(a.im - b.im) }; }
export function cMul(a: Complex, b: Complex): Complex {
 return { re: clean(a.re * b.re - a.im * b.im), im: clean(a.re * b.im + a.im * b.re) };
}
export function cDiv(a: Complex, b: Complex): Complex {
 const scale = Math.max(Math.abs(b.re), Math.abs(b.im));
 if (!finite(a) || !finite(b) || scale === 0) return { re: NaN, im: NaN };
 // Scaled division avoids unnecessary overflow in c²+d².
 const br = b.re / scale, bi = b.im / scale;
 const denom = br * br + bi * bi;
 return {
  re: clean((a.re * br + a.im * bi) / (scale * denom)),
  im: clean((a.im * br - a.re * bi) / (scale * denom))
 };
}
export function cConj(z: Complex): Complex { return { re: clean(z.re), im: clean(-z.im) }; }
export function cMod(z: Complex): number { return Math.hypot(z.re, z.im); }
export function cArg(z: Complex): number {
 if (Math.abs(z.re) < EPS && Math.abs(z.im) < EPS) return NaN;
 return Math.atan2(z.im, z.re);
}
export function cPow(z: Complex, n: number): Complex {
 if (!Number.isInteger(n)) {
  // Principal value for non-integer powers is intentionally not presented by the BAC tool.
  return { re: NaN, im: NaN };
 }
 if (n === 0) return { re: 1, im: 0 };
 if (n < 0) return cDiv({ re: 1, im: 0 }, cPow(z, -n));
 // Integer exponentiation by squaring is more stable than polar conversion for algebraic powers.
 let result: Complex = { re: 1, im: 0 };
 let base = { ...z };
 let e = n;
 while (e > 0) {
  if (e & 1) result = cMul(result, base);
  e >>= 1;
  if (e) base = cMul(base, base);
 }
 return result;
}
export function cSqrt(z: Complex): [Complex, Complex] {
 if (!finite(z)) return [{ re: NaN, im: NaN }, { re: NaN, im: NaN }];
 if (Math.abs(z.re) < EPS && Math.abs(z.im) < EPS) return [{ re: 0, im: 0 }, { re: 0, im: 0 }];
 // Stable algebraic principal square root.
 const r = cMod(z);
 let re = Math.sqrt(Math.max(0, (r + z.re) / 2));
 let im = Math.sqrt(Math.max(0, (r - z.re) / 2));
 if (z.im < 0) im = -im;
 if (Math.abs(re) < EPS && Math.abs(im) > EPS) re = z.im / (2 * im);
 const z1 = { re: clean(re), im: clean(im) };
 return [z1, { re: clean(-z1.re), im: clean(-z1.im) }];
}

function fmt(n: number): string {
 if (!Number.isFinite(n)) return String(n);
 const r = Math.abs(n) < 1e-12 ? 0 : Math.round(n * 1e10) / 1e10;
 return Number.isInteger(r) ? String(r) : r.toFixed(10).replace(/0+$/, '').replace(/\.$/, '');
}
export function cToString(z: Complex): string {
 const re = fmt(z.re), ai = Math.abs(z.im);
 if (ai < 1e-10) return re;
 const coeff = Math.abs(ai - 1) < 1e-10 ? '' : fmt(ai);
 const imag = `${coeff}i`;
 if (Math.abs(z.re) < 1e-10) return z.im < 0 ? `-${imag}` : imag;
 return z.im < 0 ? `${re} − ${imag}` : `${re} + ${imag}`;
}
export function cToTrig(z: Complex): string {
 const r = cMod(z), arg = cArg(z);
 if (!Number.isFinite(arg)) return '0 (argument non défini)';
 return `${fmt(r)}(cos(${fmt(arg)}) + i·sin(${fmt(arg)}))`;
}
export function cToExp(z: Complex): string {
 const r = cMod(z), arg = cArg(z);
 if (!Number.isFinite(arg)) return '0 (argument non défini)';
 return `${fmt(r)}·e^(${fmt(arg)}i)`;
}
export function analyzeComplex(z: Complex): ComplexResult {
 if (!finite(z)) throw new Error('Nombre complexe non fini.');
 const modulus = cMod(z), arg = cArg(z);
 return {
  z, modulus,
  argument: Number.isFinite(arg) ? arg : null,
  argumentDeg: Number.isFinite(arg) ? arg * 180 / Math.PI : null,
  conjugate: cConj(z), algebraicForm: cToString(z), trigForm: cToTrig(z), exponentialForm: cToExp(z)
 };
}

export function parseComplex(s: string): Complex | null {
 const cleaned = s.replace(/\s/g, '').replace(/[−–—]/g, '-').replace(/\*/g, '');
 const num = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:e[+-]?\\d+)?';
 if (new RegExp(`^${num}$`, 'i').test(cleaned)) return { re: Number(cleaned), im: 0 };
 if (/^[+-]?i$/i.test(cleaned)) return { re: 0, im: cleaned.startsWith('-') ? -1 : 1 };
 const pureIm = cleaned.match(new RegExp(`^(${num})i$`, 'i'));
 if (pureIm) return { re: 0, im: Number(pureIm[1]) };
 // split at + or - not belonging to an exponent
 let split = -1;
 for (let i = 1; i < cleaned.length - 1; i++) {
  if ((cleaned[i] === '+' || cleaned[i] === '-') && cleaned[i - 1].toLowerCase() !== 'e') split = i;
 }
 if (split > 0 && cleaned.endsWith('i')) {
  const reText = cleaned.slice(0, split), imText = cleaned.slice(split, -1);
  if (new RegExp(`^${num}$`, 'i').test(reText) && (/^[+-]$/.test(imText) || new RegExp(`^${num}$`, 'i').test(imText))) {
   return { re: Number(reText), im: imText === '+' ? 1 : imText === '-' ? -1 : Number(imText) };
  }
 }
 return null;
}

export interface ComplexQuadraticResult {
 z1: Complex; z2: Complex; discriminant: number; steps: string[];
 verification: { z: Complex; residual: number; ok: boolean }[];
}

function quadraticResidual(a: number, b: number, c: number, z: Complex): number {
 const z2 = cMul(z, z);
 const value = cAdd(cAdd({ re: a * z2.re, im: a * z2.im }, { re: b * z.re, im: b * z.im }), { re: c, im: 0 });
 return cMod(value);
}

export function solveQuadraticComplex(a: number, b: number, c: number): ComplexQuadraticResult {
 if (![a, b, c].every(Number.isFinite) || a === 0) throw new Error('Il faut a ≠ 0 et des coefficients réels finis.');
 const delta = b * b - 4 * a * c;
 const tolD = 16 * Number.EPSILON * Math.max(1, Math.abs(b * b), Math.abs(4 * a * c));
 const steps = [`az² + bz + c = 0 avec a=${fmt(a)}, b=${fmt(b)}, c=${fmt(c)}`, `Δ = b² − 4ac = ${fmt(delta)}`];
 let z1: Complex, z2: Complex;
 if (delta >= -tolD) {
  const d = Math.max(0, delta), s = Math.sqrt(d);
  if (s === 0) {
   z1 = z2 = { re: clean(-b / (2 * a)), im: 0 };
   steps.push(`Δ = 0 : racine double z₀ = ${cToString(z1)}`);
  } else {
   const q = -0.5 * (b + (b >= 0 ? s : -s));
   const r1 = q / a, r2 = c / q;
   z1 = { re: clean(Math.min(r1, r2)), im: 0 };
   z2 = { re: clean(Math.max(r1, r2)), im: 0 };
   steps.push(`Δ > 0 : deux solutions réelles.`);
   steps.push(`z₁ = ${cToString(z1)}`, `z₂ = ${cToString(z2)}`);
  }
 } else {
  const real = -b / (2 * a);
  const imagAbs = Math.sqrt(-delta) / Math.abs(2 * a);
  z1 = { re: clean(real), im: clean(imagAbs) };
  z2 = { re: clean(real), im: clean(-imagAbs) };
  steps.push(`Δ < 0 : √Δ = i√(${-delta}).`);
  steps.push(`z₁ = ${cToString(z1)}`, `z₂ = ${cToString(z2)} = z̄₁`);
 }
 const scale = Math.max(1, Math.abs(a), Math.abs(b), Math.abs(c));
 const verification = [z1, z2].map(z => {
  const residual = quadraticResidual(a, b, c, z);
  return { z, residual, ok: residual <= 2e-10 * scale * Math.max(1, cMod(z) ** 2) };
 });
 return { z1, z2, discriminant: delta, steps, verification };
}

export interface ArithmeticCheck { label: string; ok: boolean; detail: string }
export interface GcdLcmResult { gcd: bigint; lcm: bigint | null; steps: string[]; checks: ArithmeticCheck[] }
export interface PrimeFactor { factor: bigint; power: number }
export interface PrimeFactorizationResult { factors: PrimeFactor[]; divisors: bigint[]; isPrime: boolean; steps: string[]; checks: ArithmeticCheck[] }
export interface ModuloResult { quotient: bigint; remainder: bigint; steps: string[]; checks: ArithmeticCheck[] }
export interface BaseConversionResult { decimal: bigint; result: string; steps: string[]; checks: ArithmeticCheck[] }

function absBig(n: bigint): bigint { return n < 0n ? -n : n; }

export function parseIntegerStrict(value: string | number | bigint): bigint | null {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return Number.isSafeInteger(value) ? BigInt(value) : null;
  const s = String(value).trim();
  if (!/^[+-]?\d+$/.test(s)) return null;
  try { return BigInt(s); } catch { return null; }
}

export function gcdBigInt(a0: bigint, b0: bigint): bigint {
  let a = absBig(a0), b = absBig(b0);
  while (b !== 0n) { const r = a % b; a = b; b = r; }
  return a;
}

export function lcmBigInt(a: bigint, b: bigint): bigint {
  if (a === 0n || b === 0n) return 0n;
  return absBig((a / gcdBigInt(a, b)) * b);
}

export function gcdLcmDetailed(a0: bigint, b0: bigint): GcdLcmResult {
  let a = absBig(a0), b = absBig(b0);
  if (a === 0n && b === 0n) throw new Error('PGCD(0,0) n’est pas défini dans ce contexte.');
  const startA = a, startB = b;
  const steps: string[] = [];
  while (b !== 0n) {
    const q = a / b, r = a % b;
    steps.push(`${a} = ${q} × ${b} + ${r}`);
    a = b; b = r;
  }
  const g = a;
  const l = lcmBigInt(a0, b0);
  const divA = g === 0n ? startA === 0n : startA % g === 0n;
  const divB = g === 0n ? startB === 0n : startB % g === 0n;
  const productIdentity = absBig(a0 * b0) === g * l;
  return {
    gcd: g, lcm: l, steps,
    checks: [
      { label: 'Divisibilité par le PGCD', ok: divA && divB, detail: `Le PGCD ${g} divise les deux entiers.` },
      { label: 'Identité PGCD × PPCM', ok: productIdentity, detail: `PGCD × PPCM = |a×b| : ${g} × ${l} = ${absBig(a0*b0)}.` },
    ]
  };
}

export function primeFactorization(n0: bigint, divisorLimit = 2_000_000n): PrimeFactorizationResult {
  const n = absBig(n0);
  if (n < 2n) throw new Error('La décomposition en facteurs premiers demande |n| ≥ 2.');
  // A school-oriented guard: trial division is deterministic but intentionally bounded for phones.
  if (n > divisorLimit * divisorLimit) throw new Error(`Nombre trop grand pour une factorisation déterministe locale rapide (limite actuelle : ${divisorLimit*divisorLimit}).`);
  let rest = n;
  const factors: PrimeFactor[] = [];
  const steps: string[] = [];
  const take = (p: bigint) => {
    let power = 0;
    while (rest % p === 0n) {
      const before = rest; rest /= p; power++;
      steps.push(`${before} ÷ ${p} = ${rest}`);
    }
    if (power) factors.push({ factor: p, power });
  };
  take(2n);
  let p = 3n;
  while (p * p <= rest) { take(p); p += 2n; }
  if (rest > 1n) factors.push({ factor: rest, power: 1 });
  const recomposed = factors.reduce((acc, f) => acc * (f.factor ** BigInt(f.power)), 1n);
  const divisors: bigint[] = [1n];
  for (const f of factors) {
    const base = divisors.slice();
    let pow = 1n;
    for (let e=1;e<=f.power;e++) {
      pow *= f.factor;
      for (const d of base) divisors.push(d * pow);
    }
  }
  divisors.sort((a,b)=>a<b?-1:a>b?1:0);
  return {
    factors, divisors, isPrime: factors.length === 1 && factors[0].factor === n && factors[0].power === 1, steps,
    checks: [
      { label: 'Recomposition', ok: recomposed === n, detail: `Produit des facteurs = ${recomposed}, entier initial = ${n}.` },
      { label: 'Diviseurs contrôlés', ok: divisors.every(d => n % d === 0n), detail: `${divisors.length} diviseur(s) reconstruits à partir de la factorisation.` },
    ]
  };
}

export function moduloDetailed(a: bigint, n: bigint): ModuloResult {
  if (n <= 0n) throw new Error('Le modulo scolaire utilisé ici demande n > 0.');
  let r = a % n; if (r < 0n) r += n;
  const q = (a - r) / n;
  const ok = a === q*n + r && r >= 0n && r < n;
  return {
    quotient: q, remainder: r,
    steps: [`${a} = ${q} × ${n} + ${r}`, `${a} ≡ ${r} [${n}]`],
    checks: [{ label: 'Division euclidienne', ok, detail: `0 ≤ ${r} < ${n} et qn+r = ${q*n+r}.` }]
  };
}

const DIGITS = '0123456789ABCDEF';
export function parseBaseInteger(text: string, base: number): bigint | null {
  if (!Number.isInteger(base) || base < 2 || base > 16) return null;
  let s = text.trim().toUpperCase();
  let sign = 1n;
  if (s.startsWith('-')) { sign = -1n; s = s.slice(1); }
  else if (s.startsWith('+')) s = s.slice(1);
  if (!s) return null;
  let v = 0n;
  for (const ch of s) {
    const d = DIGITS.indexOf(ch);
    if (d < 0 || d >= base) return null;
    v = v * BigInt(base) + BigInt(d);
  }
  return sign * v;
}
function toBasePositive(v0: bigint, base: number): string {
  if (v0 === 0n) return '0';
  let v = v0 < 0n ? -v0 : v0, out = '';
  const b = BigInt(base);
  while (v > 0n) { const r = Number(v % b); out = DIGITS[r] + out; v /= b; }
  return (v0 < 0n ? '-' : '') + out;
}
export function convertBaseDetailed(text: string, fromBase: number, toBase: number): BaseConversionResult {
  if (!Number.isInteger(fromBase) || fromBase<2 || fromBase>16 || !Number.isInteger(toBase) || toBase<2 || toBase>16) throw new Error('Les bases doivent être comprises entre 2 et 16.');
  const decimal = parseBaseInteger(text, fromBase);
  if (decimal === null) throw new Error('La saisie contient un chiffre incompatible avec la base de départ.');
  const result = toBasePositive(decimal, toBase);
  const roundTrip = parseBaseInteger(result, toBase);
  return {
    decimal, result,
    steps: fromBase === 10 ? [`Valeur décimale : ${decimal}`] : [`Conversion exacte en base 10 : ${decimal}`, `Divisions successives par ${toBase} pour reconstruire la base ${toBase}.`],
    checks: [{ label: 'Conversion inverse', ok: roundTrip === decimal, detail: `${result} en base ${toBase} redonne exactement ${decimal} en base 10.` }]
  };
}

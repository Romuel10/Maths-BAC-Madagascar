export interface DescriptiveStats {
  n: number;
  sum: number;
  mean: number;
  variancePopulation: number;
  stdPopulation: number;
  median: number;
  q1: number;
  q3: number;
  min: number;
  max: number;
  q1Rank: number;
  q3Rank: number;
  checks: { label: string; ok: boolean; detail: string }[];
}

export function factorialBigInt(n: number): bigint {
  if (!Number.isSafeInteger(n) || n < 0) throw new Error('n doit être un entier naturel sûr.');
  let r = 1n;
  for (let i = 2n; i <= BigInt(n); i++) r *= i;
  return r;
}

export function combinationBigInt(n: number, k: number): bigint {
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(k) || n < 0 || k < 0 || k > n) throw new Error('0 ≤ k ≤ n, avec n et k entiers.');
  const kk = Math.min(k, n - k);
  let r = 1n;
  for (let i = 1; i <= kk; i++) r = (r * BigInt(n - kk + i)) / BigInt(i);
  return r;
}

export function arrangementsBigInt(n: number, k: number): bigint {
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(k) || n < 0 || k < 0 || k > n) throw new Error('0 ≤ k ≤ n, avec n et k entiers.');
  let r = 1n;
  for (let i = 0; i < k; i++) r *= BigInt(n - i);
  return r;
}

function logCombination(n: number, k: number): number {
  const kk = Math.min(k, n - k);
  let s = 0;
  for (let i = 1; i <= kk; i++) s += Math.log(n - kk + i) - Math.log(i);
  return s;
}

export function binomialLogProbability(n: number, k: number, p: number): number {
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(k) || n < 0 || k < 0 || k > n || !Number.isFinite(p) || p < 0 || p > 1) return -Infinity;
  if (p === 0) return k === 0 ? 0 : -Infinity;
  if (p === 1) return k === n ? 0 : -Infinity;
  return logCombination(n, k) + k * Math.log(p) + (n - k) * Math.log1p(-p);
}

export function binomialProbability(n: number, k: number, p: number): number {
  const lp = binomialLogProbability(n, k, p);
  return lp === -Infinity ? 0 : Math.exp(lp);
}

function logAddExp(a: number, b: number): number {
  if (a === -Infinity) return b;
  if (b === -Infinity) return a;
  const m = Math.max(a, b);
  return m + Math.log(Math.exp(a - m) + Math.exp(b - m));
}

export function binomialCdf(n: number, k: number, p: number): number {
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(k) || n < 0 || !Number.isFinite(p) || p < 0 || p > 1) return NaN;
  if (k < 0) return 0;
  if (k >= n) return 1;
  let logSum = -Infinity;
  for (let i = 0; i <= k; i++) logSum = logAddExp(logSum, binomialLogProbability(n, i, p));
  const v = Math.exp(logSum);
  return Math.min(1, Math.max(0, v));
}

// Abramowitz-Stegun erf approximation; max absolute error is well below BAC rounding needs.
export function erfApprox(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
  return sign * y;
}

export function normalCdf(x: number, mu = 0, sigma = 1): number {
  if (![x, mu, sigma].every(Number.isFinite) || sigma <= 0) return NaN;
  const z = (x - mu) / (sigma * Math.SQRT2);
  return 0.5 * (1 + erfApprox(z));
}

export function descriptiveStats(values: number[]): DescriptiveStats {
  if (!values.length || values.some(v => !Number.isFinite(v))) throw new Error('La série doit contenir uniquement des nombres finis.');
  const sorted = [...values].sort((a, b) => a - b);
  const n = values.length;
  // Kahan summation reduces floating point loss when magnitudes differ a lot.
  let sum = 0, comp = 0;
  for (const x of values) { const y = x - comp; const t = sum + y; comp = (t - sum) - y; sum = t; }
  const mean = sum / n;
  let sq = 0, sqComp = 0;
  for (const x of values) { const term = (x - mean) ** 2; const y = term - sqComp; const t = sq + y; sqComp = (t - sq) - y; sq = t; }
  const variancePopulation = sq / n;
  const stdPopulation = Math.sqrt(Math.max(0, variancePopulation));
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  // French lycée convention: Q1 = value of rank ceil(n/4), Q3 = rank ceil(3n/4).
  const q1Rank = Math.ceil(n / 4);
  const q3Rank = Math.ceil(3 * n / 4);
  const q1 = sorted[q1Rank - 1], q3 = sorted[q3Rank - 1];
  const checks = [
    { label: 'Ordre des quartiles', ok: sorted[0] <= q1 && q1 <= median && median <= q3 && q3 <= sorted[n - 1], detail: `min ≤ Q1 ≤ médiane ≤ Q3 ≤ max.` },
    { label: 'Variance non négative', ok: variancePopulation >= -1e-14, detail: `V=${variancePopulation}` },
  ];
  return { n, sum, mean, variancePopulation, stdPopulation, median, q1, q3, min: sorted[0], max: sorted[n - 1], q1Rank, q3Rank, checks };
}

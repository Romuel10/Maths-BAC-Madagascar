/**
 * Moteur matrices V4.5 — calculs numériques stables + vérifications.
 */
export type Matrix = number[][];

export interface MatrixResult {
 matrix: Matrix;
 determinant: number | null;
 trace: number | null;
 transpose: Matrix;
 inverse: Matrix | null;
 rank: number;
 eigenvalues: number[] | null;
 isSquare: boolean;
 isSymmetric: boolean;
 isIdentity: boolean;
 isInvertible: boolean;
 steps: string[];
 inverseResidual: number | null;
 quality: 'verified' | 'approximate' | 'warning';
 qualityDetail: string;
}

function rows(m: Matrix): number { return m.length; }
function cols(m: Matrix): number { return m[0]?.length || 0; }
function maxAbs(m: Matrix): number {
 let v = 0;
 for (const row of m) for (const x of row) v = Math.max(v, Math.abs(x));
 return v;
}
function matrixTolerance(m: Matrix): number {
 return 64 * Number.EPSILON * Math.max(1, rows(m), cols(m)) * Math.max(1, maxAbs(m));
}
function fmt(n: number): string {
 if (!Number.isFinite(n)) return String(n);
 const r = Math.abs(n) < 1e-12 ? 0 : Math.round(n * 1e10) / 1e10;
 return Number.isInteger(r) ? String(r) : r.toFixed(10).replace(/0+$/, '').replace(/\.$/, '');
}
function validMatrix(m: Matrix): boolean {
 if (!Array.isArray(m) || m.length === 0 || cols(m) === 0) return false;
 const c = cols(m);
 return m.every(row => Array.isArray(row) && row.length === c && row.every(Number.isFinite));
}

export function mAdd(a: Matrix, b: Matrix): Matrix | null {
 if (!validMatrix(a) || !validMatrix(b) || rows(a) !== rows(b) || cols(a) !== cols(b)) return null;
 return a.map((row, i) => row.map((v, j) => v + b[i][j]));
}
export function mSub(a: Matrix, b: Matrix): Matrix | null {
 if (!validMatrix(a) || !validMatrix(b) || rows(a) !== rows(b) || cols(a) !== cols(b)) return null;
 return a.map((row, i) => row.map((v, j) => v - b[i][j]));
}
export function mMul(a: Matrix, b: Matrix): Matrix | null {
 if (!validMatrix(a) || !validMatrix(b) || cols(a) !== rows(b)) return null;
 const result = Array.from({ length: rows(a) }, () => Array(cols(b)).fill(0));
 for (let i = 0; i < rows(a); i++) {
  for (let k = 0; k < cols(a); k++) {
   const aik = a[i][k];
   for (let j = 0; j < cols(b); j++) result[i][j] += aik * b[k][j];
  }
 }
 return result;
}
export function mScale(m: Matrix, k: number): Matrix { return m.map(row => row.map(v => v * k)); }
export function mTranspose(m: Matrix): Matrix {
 if (!validMatrix(m)) return [];
 return Array.from({ length: cols(m) }, (_, j) => Array.from({ length: rows(m) }, (_, i) => m[i][j]));
}
export function mTrace(m: Matrix): number | null {
 if (!validMatrix(m) || rows(m) !== cols(m)) return null;
 let s = 0; for (let i = 0; i < rows(m); i++) s += m[i][i]; return s;
}

// Determinant by Gaussian elimination with scaled partial pivoting.
export function mDet(m: Matrix): number | null {
 if (!validMatrix(m) || rows(m) !== cols(m)) return null;
 const n = rows(m);
 if (n === 1) return m[0][0];
 const a = m.map(r => [...r]);
 const tol = matrixTolerance(m);
 let sign = 1;
 let det = 1;
 for (let col = 0; col < n; col++) {
  let pivot = col, best = -1;
  for (let r = col; r < n; r++) {
   const scale = Math.max(...a[r].slice(col).map(Math.abs), 1);
   const score = Math.abs(a[r][col]) / scale;
   if (score > best) { best = score; pivot = r; }
  }
  if (Math.abs(a[pivot][col]) <= tol) return 0;
  if (pivot !== col) { [a[pivot], a[col]] = [a[col], a[pivot]]; sign *= -1; }
  const p = a[col][col]; det *= p;
  for (let r = col + 1; r < n; r++) {
   const factor = a[r][col] / p;
   a[r][col] = 0;
   for (let j = col + 1; j < n; j++) a[r][j] -= factor * a[col][j];
  }
 }
 return sign * det;
}

export function mInverse(m: Matrix): Matrix | null {
 if (!validMatrix(m) || rows(m) !== cols(m)) return null;
 const n = rows(m), tol = matrixTolerance(m);
 const aug = m.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => i === j ? 1 : 0)]);
 for (let col = 0; col < n; col++) {
  let pivot = col, best = -1;
  for (let r = col; r < n; r++) {
   const scale = Math.max(...aug[r].slice(0, n).map(Math.abs), 1);
   const score = Math.abs(aug[r][col]) / scale;
   if (score > best) { best = score; pivot = r; }
  }
  if (Math.abs(aug[pivot][col]) <= tol) return null;
  if (pivot !== col) [aug[pivot], aug[col]] = [aug[col], aug[pivot]];
  const pv = aug[col][col];
  for (let j = 0; j < 2 * n; j++) aug[col][j] /= pv;
  for (let r = 0; r < n; r++) {
   if (r === col) continue;
   const factor = aug[r][col];
   if (Math.abs(factor) <= tol) { aug[r][col] = 0; continue; }
   for (let j = 0; j < 2 * n; j++) aug[r][j] -= factor * aug[col][j];
  }
 }
 return aug.map(r => r.slice(n).map(v => Math.abs(v) <= tol ? 0 : v));
}

export function mIdentityResidual(a: Matrix, inverse: Matrix): number | null {
 const p = mMul(a, inverse);
 if (!p || rows(p) !== cols(p)) return null;
 let e = 0;
 for (let i = 0; i < rows(p); i++) for (let j = 0; j < cols(p); j++) e = Math.max(e, Math.abs(p[i][j] - (i === j ? 1 : 0)));
 return e;
}

export function mRank(m: Matrix): number {
 if (!validMatrix(m)) return 0;
 const a = m.map(r => [...r]);
 const tol = matrixTolerance(m);
 let rank = 0;
 for (let col = 0; col < cols(m) && rank < rows(m); col++) {
  let pivot = rank;
  for (let r = rank + 1; r < rows(m); r++) if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
  if (Math.abs(a[pivot][col]) <= tol) continue;
  [a[pivot], a[rank]] = [a[rank], a[pivot]];
  const pv = a[rank][col];
  for (let j = col; j < cols(m); j++) a[rank][j] /= pv;
  for (let r = rank + 1; r < rows(m); r++) {
   const f = a[r][col];
   for (let j = col; j < cols(m); j++) a[r][j] -= f * a[rank][j];
  }
  rank++;
 }
 return rank;
}

export function mEigenvalues(m: Matrix): number[] | null {
 if (!validMatrix(m) || rows(m) !== 2 || cols(m) !== 2) return null;
 const tr = m[0][0] + m[1][1];
 const det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
 const disc = tr * tr - 4 * det;
 const tol = 32 * Number.EPSILON * Math.max(1, tr * tr, Math.abs(4 * det));
 if (disc < -tol) return null;
 if (Math.abs(disc) <= tol) return [tr / 2, tr / 2];
 const s = Math.sqrt(disc);
 return [(tr + s) / 2, (tr - s) / 2];
}

function isSymmetric(m: Matrix): boolean {
 if (!validMatrix(m) || rows(m) !== cols(m)) return false;
 const tol = matrixTolerance(m);
 for (let i = 0; i < rows(m); i++) for (let j = i + 1; j < cols(m); j++) if (Math.abs(m[i][j] - m[j][i]) > tol) return false;
 return true;
}
function isIdentity(m: Matrix): boolean {
 if (!validMatrix(m) || rows(m) !== cols(m)) return false;
 const tol = matrixTolerance(m);
 for (let i = 0; i < rows(m); i++) for (let j = 0; j < cols(m); j++) if (Math.abs(m[i][j] - (i === j ? 1 : 0)) > tol) return false;
 return true;
}

export function analyzeMatrix(m: Matrix): MatrixResult {
 if (!validMatrix(m)) throw new Error('Matrice vide, irrégulière ou contenant une valeur non finie.');
 const steps: string[] = [];
 const n = rows(m), p = cols(m), sq = n === p;
 steps.push(`Matrice ${n}×${p}`);
 const det = sq ? mDet(m) : null;
 if (det !== null) steps.push(`det(A) = ${fmt(det)}`);
 const tr = sq ? mTrace(m) : null;
 if (tr !== null) steps.push(`tr(A) = ${fmt(tr)}`);
 const transpose = mTranspose(m);
 const rank = mRank(m); steps.push(`rang(A) = ${rank}`);
 const inverse = sq ? mInverse(m) : null;
 const residual = inverse ? mIdentityResidual(m, inverse) : null;
 const scale = Math.max(1, maxAbs(m));
 const inverseOk = residual !== null && residual <= 5e-10 * Math.max(1, n, scale);
 const determinantTol = matrixTolerance(m) * Math.max(1, Math.pow(maxAbs(m), Math.max(0, n - 1)));
 const invertible = sq && det !== null && Math.abs(det) > determinantTol && inverse !== null;
 if (inverse && residual !== null) steps.push(`Vérification : ||AA⁻¹−I||max = ${fmt(residual)}`);
 if (sq && !invertible) steps.push('La matrice est singulière ou numériquement trop proche d’une matrice singulière : aucune inverse fiable n’est affichée.');
 const eigenvalues = sq ? mEigenvalues(m) : null;
 if (eigenvalues) steps.push(`Valeurs propres réelles (2×2) : ${eigenvalues.map(fmt).join(', ')}`);
 const symmetric = isSymmetric(m), identity = isIdentity(m);
 if (symmetric) steps.push('A = Aᵀ : matrice symétrique.');
 if (identity) steps.push('A est la matrice identité.');
 const quality: MatrixResult['quality'] = inverse && !inverseOk ? 'warning' : 'verified';
 const qualityDetail = inverse
  ? `Calcul par pivot de Gauss avec pivotage. Contrôle final AA⁻¹≈I : erreur maximale ${fmt(residual ?? NaN)}.`
  : sq ? 'Déterminant et rang calculés avec pivotage et tolérance relative à l’échelle de la matrice.' : 'Rang et transposée calculés avec tolérance relative à l’échelle de la matrice.';
 return { matrix: m, determinant: det, trace: tr, transpose, inverse: invertible ? inverse : null, rank, eigenvalues, isSquare: sq, isSymmetric: symmetric, isIdentity: identity, isInvertible: invertible, steps, inverseResidual: residual, quality, qualityDetail };
}

export function parseMatrix(s: string): Matrix | null {
 try {
  const rowStrs = s.split(/[;\n]/).map(r => r.trim()).filter(Boolean);
  if (!rowStrs.length) return null;
  const matrix: Matrix = [];
  let c = -1;
  for (const row of rowStrs) {
   const tokens = row.split(/[,\s]+/).filter(Boolean);
   const vals = tokens.map(Number);
   if (!vals.length || vals.some(v => !Number.isFinite(v))) return null;
   if (c < 0) c = vals.length; else if (vals.length !== c) return null;
   matrix.push(vals);
  }
  return validMatrix(matrix) ? matrix : null;
 } catch { return null; }
}

export function matrixToString(m: Matrix): string {
 return m.map(row => '│ ' + row.map(v => fmt(v).padStart(10)).join(' ') + ' │').join('\n');
}

export type Relation = '>' | '>=' | '<' | '<=';

export interface VerificationPoint {
  x: number;
  residual: number;
  ok: boolean;
}

export interface QuadraticRealResult {
  kind: 'all' | 'none' | 'linear' | 'double' | 'two';
  roots: number[];
  delta: number | null;
  steps: string[];
  verification: VerificationPoint[];
}

export interface ExactInterval {
  from: number | null; // null = -infinity
  to: number | null;   // null = +infinity
  includeFrom: boolean;
  includeTo: boolean;
}

export interface PolynomialInequalityResult {
  intervals: ExactInterval[];
  roots: number[];
  exact: true;
  steps: string[];
}

const EPS = 1e-12;

export function scaledTolerance(...values: number[]): number {
  return EPS * Math.max(1, ...values.map(v => Math.abs(v)));
}

export function polynomial2Value(a: number, b: number, c: number, x: number): number {
  return (a * x + b) * x + c;
}

function cleanZero(x: number): number {
  return Math.abs(x) < 1e-14 ? 0 : x;
}

export function solveQuadraticReal(a: number, b: number, c: number): QuadraticRealResult {
  if (![a, b, c].every(Number.isFinite)) throw new Error('Coefficients non finis.');
  const scale = Math.max(1, Math.abs(a), Math.abs(b), Math.abs(c));
  const coefTol = EPS * scale;
  const steps: string[] = [];

  if (Math.abs(a) <= coefTol) {
    if (Math.abs(b) <= coefTol) {
      if (Math.abs(c) <= coefTol) return { kind: 'all', roots: [], delta: null, steps: ['0 = 0 : toute valeur réelle convient.'], verification: [] };
      return { kind: 'none', roots: [], delta: null, steps: [`${c} = 0 est impossible.`], verification: [] };
    }
    const x = cleanZero(-c / b);
    const residual = Math.abs(polynomial2Value(0, b, c, x));
    const tol = 1e-10 * Math.max(1, Math.abs(b * x), Math.abs(c));
    return {
      kind: 'linear', roots: [x], delta: null,
      steps: [`${b}x + ${c} = 0`, `${b}x = ${-c}`, `x = ${x}`],
      verification: [{ x, residual, ok: residual <= tol }]
    };
  }

  const delta = b * b - 4 * a * c;
  const deltaTol = 8 * Number.EPSILON * Math.max(1, Math.abs(b * b), Math.abs(4 * a * c));
  steps.push(`Δ = b² - 4ac = ${delta}`);
  if (delta < -deltaTol) return { kind: 'none', roots: [], delta, steps: [...steps, 'Δ < 0 : aucune solution réelle.'], verification: [] };

  let roots: number[];
  let kind: QuadraticRealResult['kind'];
  if (Math.abs(delta) <= deltaTol) {
    const x = cleanZero(-b / (2 * a));
    roots = [x]; kind = 'double';
    steps.push(`Δ = 0 : x₀ = -b/(2a) = ${x}`);
  } else {
    const sqrtD = Math.sqrt(delta);
    // Stable quadratic formula: avoids catastrophic cancellation when |b| is large.
    const q = -0.5 * (b + (b >= 0 ? sqrtD : -sqrtD));
    let x1: number, x2: number;
    if (Math.abs(q) <= Number.MIN_VALUE) {
      x1 = (-b - sqrtD) / (2 * a);
      x2 = (-b + sqrtD) / (2 * a);
    } else {
      x1 = q / a;
      x2 = c / q;
    }
    roots = [cleanZero(x1), cleanZero(x2)].sort((u, v) => u - v);
    kind = 'two';
    steps.push(`√Δ = ${sqrtD}`);
    steps.push(`x₁ = ${roots[0]}`);
    steps.push(`x₂ = ${roots[1]}`);
  }

  const verification = roots.map(x => {
    const residual = Math.abs(polynomial2Value(a, b, c, x));
    const tol = 2e-10 * Math.max(1, Math.abs(a * x * x), Math.abs(b * x), Math.abs(c));
    return { x, residual, ok: residual <= tol };
  });
  return { kind, roots, delta, steps, verification };
}

function relationSatisfied(value: number, relation: Relation): boolean {
  switch (relation) {
    case '>': return value > 0;
    case '>=': return value >= 0;
    case '<': return value < 0;
    case '<=': return value <= 0;
  }
}

export function solvePolynomialInequality(a: number, b: number, c: number, relation: Relation): PolynomialInequalityResult {
  const eq = solveQuadraticReal(a, b, c);
  const steps: string[] = [];
  const nonStrict = relation === '>=' || relation === '<=';

  if (eq.kind === 'all' || eq.kind === 'none' && Math.abs(a) < EPS && Math.abs(b) < EPS) {
    const satisfied = relationSatisfied(c, relation);
    steps.push(`Expression constante : ${c}.`);
    steps.push(satisfied ? 'La condition est vraie pour tout réel.' : 'La condition est fausse pour tout réel.');
    return { intervals: satisfied ? [{ from: null, to: null, includeFrom: false, includeTo: false }] : [], roots: [], exact: true, steps };
  }

  const roots = eq.roots.slice().sort((x, y) => x - y);
  const boundaries: Array<number | null> = [null, ...roots, null];
  const intervals: ExactInterval[] = [];

  // Intervals between roots. Determine sign from coefficients, not from an arbitrary finite window.
  for (let i = 0; i < boundaries.length - 1; i++) {
    const left = boundaries[i], right = boundaries[i + 1];
    let probe: number;
    if (left === null && right === null) probe = 0;
    else if (left === null) probe = (right as number) - Math.max(1, Math.abs(right as number));
    else if (right === null) probe = left + Math.max(1, Math.abs(left));
    else probe = (left + right) / 2;
    const value = polynomial2Value(a, b, c, probe);
    if (relationSatisfied(value, relation)) {
      intervals.push({ from: left, to: right, includeFrom: false, includeTo: false });
    }
  }

  // For non-strict inequalities, include roots. Merge adjacent intervals through included roots.
  if (nonStrict && roots.length) {
    for (const r of roots) {
      const leftI = intervals.findIndex(iv => iv.to !== null && Math.abs(iv.to - r) <= 1e-10);
      const rightI = intervals.findIndex(iv => iv.from !== null && Math.abs(iv.from - r) <= 1e-10);
      if (leftI >= 0) intervals[leftI].includeTo = true;
      if (rightI >= 0) intervals[rightI].includeFrom = true;
      if (leftI < 0 && rightI < 0) intervals.push({ from: r, to: r, includeFrom: true, includeTo: true });
    }
  }

  intervals.sort((u, v) => (u.from ?? -Infinity) - (v.from ?? -Infinity));
  const merged: ExactInterval[] = [];
  for (const iv of intervals) {
    const last = merged[merged.length - 1];
    if (last && last.to !== null && iv.from !== null && Math.abs(last.to - iv.from) <= 1e-10 && (last.includeTo || iv.includeFrom)) {
      last.to = iv.to;
      last.includeTo = iv.includeTo;
    } else merged.push({ ...iv });
  }

  if (Math.abs(a) > EPS) {
    steps.push(`Trinôme : Δ = ${eq.delta}.`);
    if (roots.length === 2) steps.push(`Racines : x₁=${roots[0]}, x₂=${roots[1]}. Le signe est celui de a à l’extérieur des racines et l’opposé entre elles.`);
    else if (roots.length === 1) steps.push(`Racine double : x₀=${roots[0]}. Le signe ne change pas en x₀.`);
    else steps.push(`Aucune racine réelle : le signe est constant et égal à celui de a.`);
  } else if (Math.abs(b) > EPS) {
    steps.push(`Expression affine, zéro x=${roots[0]}. Le signe change en ce point.`);
  }

  return { intervals: merged, roots, exact: true, steps };
}

export function intervalToFrench(iv: ExactInterval): string {
  if (iv.from !== null && iv.to !== null && Math.abs(iv.from - iv.to) <= 1e-12 && iv.includeFrom && iv.includeTo) return `{${iv.from}}`;
  const left = iv.from === null ? ']-∞' : `${iv.includeFrom ? '[' : ']'}${iv.from}`;
  const right = iv.to === null ? '+∞[' : `${iv.to}${iv.includeTo ? ']' : '['}`;
  return `${left} ; ${right}`;
}

export interface Point2D { x: number; y: number }
export interface GeometryCheck { label: string; ok: boolean; detail: string }

function finitePoint(p: Point2D): boolean { return Number.isFinite(p.x) && Number.isFinite(p.y); }

export function distance2D(a: Point2D, b: Point2D) {
  if (!finitePoint(a) || !finitePoint(b)) throw new Error('Coordonnées invalides.');
  const dx = b.x - a.x, dy = b.y - a.y;
  const squared = dx * dx + dy * dy;
  const value = Math.hypot(dx, dy);
  const residual = Math.abs(value * value - squared);
  return { dx, dy, squared, value, checks: [{ label: 'Théorème de Pythagore', ok: residual <= 1e-11 * Math.max(1, squared), detail: `|d²-(Δx²+Δy²)|=${residual}` }] as GeometryCheck[] };
}

export function midpoint2D(a: Point2D, b: Point2D) {
  if (!finitePoint(a) || !finitePoint(b)) throw new Error('Coordonnées invalides.');
  const point = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const da = distance2D(a, point).value, db = distance2D(point, b).value;
  return { point, checks: [{ label: 'Équidistance', ok: Math.abs(da - db) <= 1e-11 * Math.max(1, da, db), detail: `AM=${da}, MB=${db}` }] as GeometryCheck[] };
}

export function lineThrough(a: Point2D, b: Point2D) {
  if (!finitePoint(a) || !finitePoint(b)) throw new Error('Coordonnées invalides.');
  if (a.x === b.x && a.y === b.y) return { kind: 'undefined' as const, checks: [{ label: 'Deux points distincts', ok: false, detail: 'A et B sont confondus : une infinité de droites passent par ce point.' }] as GeometryCheck[] };
  if (a.x === b.x) return { kind: 'vertical' as const, x: a.x, checks: [{ label: 'A sur la droite', ok: true, detail: `x_A=${a.x}` }, { label: 'B sur la droite', ok: b.x === a.x, detail: `x_B=${b.x}` }] as GeometryCheck[] };
  const slope = (b.y - a.y) / (b.x - a.x);
  const intercept = a.y - slope * a.x;
  const residualA = Math.abs(a.y - (slope * a.x + intercept));
  const residualB = Math.abs(b.y - (slope * b.x + intercept));
  return { kind: 'affine' as const, slope, intercept, normal: { x: -(b.y - a.y), y: b.x - a.x }, checks: [
    { label: 'Point A', ok: residualA <= 1e-11, detail: `résidu=${residualA}` },
    { label: 'Point B', ok: residualB <= 1e-11, detail: `résidu=${residualB}` }
  ] as GeometryCheck[] };
}

export function circleFromCenterPoint(center: Point2D, p: Point2D) {
  const d = distance2D(center, p);
  const radius = d.value, radiusSquared = d.squared;
  const residual = Math.abs((p.x - center.x) ** 2 + (p.y - center.y) ** 2 - radiusSquared);
  return { center, radius, radiusSquared, circumference: 2 * Math.PI * radius, area: Math.PI * radiusSquared, checks: [{ label: 'Point sur le cercle', ok: residual <= 1e-11 * Math.max(1, radiusSquared), detail: `résidu=${residual}` }] as GeometryCheck[] };
}

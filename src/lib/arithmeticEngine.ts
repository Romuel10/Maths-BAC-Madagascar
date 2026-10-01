export interface ArithmeticCheck { label: string; ok: boolean; detail: string }
export interface GcdLcmResult { gcd: bigint; lcm: bigint | null; steps: string[]; checks: ArithmeticCheck[] }
export interface PrimeFactor { factor: bigint; power: number }
export interface PrimeFactorizationResult { factors: PrimeFactor[]; divisors: bigint[]; isPrime: boolean; steps: string[]; checks: ArithmeticCheck[] }
export interface ModuloResult { quotient: bigint; remainder: bigint; steps: string[]; checks: ArithmeticCheck[] }
export interface BaseConversionResult { decimal: bigint; result: string; steps: string[]; checks: ArithmeticCheck[] }
export interface BezoutResult { gcd: bigint; u: bigint; v: bigint; steps: string[]; checks: ArithmeticCheck[] }
export interface LinearCongruenceResult { solvable:boolean; gcd:bigint; representative:bigint|null; solutionModulus:bigint|null; residuesModuloN:bigint[]; steps:string[]; checks:ArithmeticCheck[] }
export interface DiophantineResult { solvable:boolean; gcd:bigint; x0:bigint|null; y0:bigint|null; stepX:bigint|null; stepY:bigint|null; steps:string[]; checks:ArithmeticCheck[] }

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


function modBig(a: bigint, n: bigint): bigint {
  const r=a%n;
  return r<0n?r+n:r;
}

export function extendedGcd(a0: bigint, b0: bigint): BezoutResult {
  if(a0===0n&&b0===0n)throw new Error('Bézout n’est pas défini pour a=b=0 dans cet outil.');
  const sa=a0<0n?-1n:1n, sb=b0<0n?-1n:1n;
  let oldR=absBig(a0),r=absBig(b0),oldS=1n,s=0n,oldT=0n,t=1n;
  const steps:string[]=[];
  while(r!==0n){
    const q=oldR/r;
    const nextR=oldR-q*r,nextS=oldS-q*s,nextT=oldT-q*t;
    steps.push(`${oldR} = ${q} × ${r} + ${nextR}`);
    [oldR,r]=[r,nextR];[oldS,s]=[s,nextS];[oldT,t]=[t,nextT];
  }
  const gcd=oldR,u=oldS*sa,v=oldT*sb;
  steps.push(`Remontée de Bézout : ${a0}×(${u}) + ${b0}×(${v}) = ${gcd}`);
  return{
    gcd,u,v,steps,
    checks:[
      {label:'Identité de Bézout',ok:a0*u+b0*v===gcd,detail:`${a0}×(${u})+${b0}×(${v})=${a0*u+b0*v}`},
      {label:'PGCD positif',ok:gcd>0n,detail:`PGCD(${a0},${b0})=${gcd}`}
    ]
  };
}

export function modularInverse(a: bigint, n: bigint): bigint | null {
  if(n<=1n)return null;
  const bez=extendedGcd(a,n);
  if(bez.gcd!==1n)return null;
  return modBig(bez.u,n);
}

export function solveLinearCongruence(a: bigint, b: bigint, n: bigint): LinearCongruenceResult {
  if(n<=0n)throw new Error('Le modulo n doit être strictement positif.');
  const g=gcdBigInt(a,n);
  const steps=[`On résout ${a}x ≡ ${b} [${n}].`,`PGCD(${a},${n}) = ${g}.`];
  if(b%g!==0n){
    steps.push(`${g} ne divise pas ${b} : aucune solution.`);
    return{solvable:false,gcd:g,representative:null,solutionModulus:null,residuesModuloN:[],steps,checks:[{label:'Critère de solvabilité',ok:true,detail:`Une congruence ax≡b [n] est soluble ssi PGCD(a,n) divise b ; ici ce n’est pas le cas.`}]};
  }
  const ar=a/g,br=b/g,nr=n/g;
  const inv=modularInverse(modBig(ar,nr),nr);
  if(inv===null)throw new Error('La réduction devrait donner des coefficients premiers entre eux, mais aucun inverse n’a été trouvé.');
  const x0=modBig(inv*br,nr);
  const residues:bigint[]=[];
  if(g<=1000n)for(let k=0n;k<g;k++)residues.push(modBig(x0+k*nr,n));
  steps.push(`Après division par ${g} : ${ar}x ≡ ${br} [${nr}].`);
  steps.push(`Inverse de ${modBig(ar,nr)} modulo ${nr} : ${inv}.`);
  steps.push(`Donc x ≡ ${x0} [${nr}].`);
  if(residues.length>1)steps.push(`Résidus modulo ${n} : ${residues.join(', ')}.`);
  const check=modBig(a*x0-b,n)===0n;
  return{solvable:true,gcd:g,representative:x0,solutionModulus:nr,residuesModuloN:residues,steps,checks:[{label:'Substitution dans la congruence',ok:check,detail:`${a}×${x0}−${b} est divisible par ${n}.`}]};
}

export function solveLinearDiophantine(a: bigint, b: bigint, c: bigint): DiophantineResult {
  if(a===0n&&b===0n)throw new Error('Il faut au moins un coefficient non nul.');
  const bez=extendedGcd(a,b),g=bez.gcd;
  const steps=[`Équation : ${a}x + ${b}y = ${c}.`,...bez.steps];
  if(c%g!==0n){
    steps.push(`${g} ne divise pas ${c} : aucune solution entière.`);
    return{solvable:false,gcd:g,x0:null,y0:null,stepX:null,stepY:null,steps,checks:[{label:'Critère de solvabilité',ok:true,detail:`PGCD(a,b)=${g} ne divise pas c=${c}.`}]};
  }
  const factor=c/g,x0=bez.u*factor,y0=bez.v*factor,stepX=b/g,stepY=-a/g;
  steps.push(`On multiplie l’identité de Bézout par ${factor} : une solution est (x₀,y₀)=(${x0},${y0}).`);
  steps.push(`Solutions : x=${x0}+(${stepX})t ; y=${y0}+(${stepY})t, t∈ℤ.`);
  const check=a*x0+b*y0===c;
  return{solvable:true,gcd:g,x0,y0,stepX,stepY,steps,checks:[{label:'Vérification de la solution particulière',ok:check,detail:`${a}×${x0}+${b}×${y0}=${a*x0+b*y0}`}]};
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

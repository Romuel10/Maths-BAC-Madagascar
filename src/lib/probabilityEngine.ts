export interface DescriptiveStats {
  n: number;
  sum: number;
  mean: number;
  variancePopulation: number;
  stdPopulation: number;
  varianceSample: number | null;
  stdSample: number | null;
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
  const varianceSample = n > 1 ? sq / (n - 1) : null;
  const stdSample = varianceSample === null ? null : Math.sqrt(Math.max(0, varianceSample));
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  // French lycée convention: Q1 = value of rank ceil(n/4), Q3 = rank ceil(3n/4).
  const q1Rank = Math.ceil(n / 4);
  const q3Rank = Math.ceil(3 * n / 4);
  const q1 = sorted[q1Rank - 1], q3 = sorted[q3Rank - 1];
  const checks = [
    { label: 'Ordre des quartiles', ok: sorted[0] <= q1 && q1 <= median && median <= q3 && q3 <= sorted[n - 1], detail: `min ≤ Q1 ≤ médiane ≤ Q3 ≤ max.` },
    { label: 'Variance non négative', ok: variancePopulation >= -1e-14, detail: `V=${variancePopulation}` },
  ];
  return { n, sum, mean, variancePopulation, stdPopulation, varianceSample, stdSample, median, q1, q3, min: sorted[0], max: sorted[n - 1], q1Rank, q3Rank, checks };
}


export function binomialRangeProbability(n: number, minK: number, maxK: number, p: number): number {
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(minK) || !Number.isSafeInteger(maxK) || n < 0 || minK > maxK || !Number.isFinite(p) || p < 0 || p > 1) return NaN;
  const lo = Math.max(0, minK);
  const hi = Math.min(n, maxK);
  if (lo > hi) return 0;
  let logSum = -Infinity;
  for (let k = lo; k <= hi; k++) logSum = logAddExp(logSum, binomialLogProbability(n, k, p));
  return Math.min(1, Math.max(0, Math.exp(logSum)));
}

export function normalRangeProbability(a: number, b: number, mu = 0, sigma = 1): number {
  if (![a, b, mu, sigma].every(Number.isFinite) || sigma <= 0 || a > b) return NaN;
  const value = normalCdf(b, mu, sigma) - normalCdf(a, mu, sigma);
  return Math.min(1, Math.max(0, value));
}

// Approximation de Peter J. Acklam, suivie d'une correction de Newton.
export function inverseNormalCdf(probability: number, mu = 0, sigma = 1): number {
  if (!Number.isFinite(probability) || probability <= 0 || probability >= 1 || !Number.isFinite(mu) || !Number.isFinite(sigma) || sigma <= 0) return NaN;
  const a = [-3.969683028665376e+01,2.209460984245205e+02,-2.759285104469687e+02,1.383577518672690e+02,-3.066479806614716e+01,2.506628277459239e+00];
  const b = [-5.447609879822406e+01,1.615858368580409e+02,-1.556989798598866e+02,6.680131188771972e+01,-1.328068155288572e+01];
  const cc = [-7.784894002430293e-03,-3.223964580411365e-01,-2.400758277161838e+00,-2.549732539343734e+00,4.374664141464968e+00,2.938163982698783e+00];
  const d = [7.784695709041462e-03,3.224671290700398e-01,2.445134137142996e+00,3.754408661907416e+00];
  const plow = 0.02425, phigh = 1 - plow;
  let x: number;
  if (probability < plow) {
    const q = Math.sqrt(-2 * Math.log(probability));
    x = (((((cc[0]*q+cc[1])*q+cc[2])*q+cc[3])*q+cc[4])*q+cc[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (probability > phigh) {
    const q = Math.sqrt(-2 * Math.log(1-probability));
    x = -(((((cc[0]*q+cc[1])*q+cc[2])*q+cc[3])*q+cc[4])*q+cc[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else {
    const q = probability - 0.5, r = q*q;
    x = (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  }
  const pdf = Math.exp(-0.5*x*x) / Math.sqrt(2*Math.PI);
  if (pdf > 1e-15) x -= (normalCdf(x) - probability) / pdf;
  return mu + sigma * x;
}

export interface LinearRegressionResult {
  n: number;
  slope: number;
  intercept: number;
  correlation: number;
  rSquared: number;
  meanX: number;
  meanY: number;
  residualMax: number;
  checks: { label: string; ok: boolean; detail: string }[];
}

export function linearRegression(xs: number[], ys: number[]): LinearRegressionResult {
  if (xs.length !== ys.length || xs.length < 2 || xs.some(v => !Number.isFinite(v)) || ys.some(v => !Number.isFinite(v))) {
    throw new Error('Il faut au moins deux couples (x,y) contenant uniquement des nombres finis.');
  }
  const n = xs.length;
  const meanX = xs.reduce((s,v)=>s+v,0)/n;
  const meanY = ys.reduce((s,v)=>s+v,0)/n;
  let sxx=0, syy=0, sxy=0;
  for(let i=0;i<n;i++){
    const dx=xs[i]-meanX, dy=ys[i]-meanY;
    sxx += dx*dx; syy += dy*dy; sxy += dx*dy;
  }
  if (sxx <= Number.EPSILON * Math.max(1, Math.abs(meanX)**2) * n) throw new Error('La régression est impossible : toutes les abscisses x sont identiques.');
  const slope=sxy/sxx, intercept=meanY-slope*meanX;
  const correlation=syy<=Number.EPSILON?0:sxy/Math.sqrt(sxx*syy);
  const rSquared=Math.min(1,Math.max(0,correlation*correlation));
  let residualMax=0, residualSum=0;
  for(let i=0;i<n;i++){const e=ys[i]-(slope*xs[i]+intercept);residualMax=Math.max(residualMax,Math.abs(e));residualSum+=e;}
  const checks=[
    {label:'Droite passant par le point moyen',ok:Math.abs((slope*meanX+intercept)-meanY)<=1e-10*Math.max(1,Math.abs(meanY)),detail:`ŷ( x̄ )=${slope*meanX+intercept}, ȳ=${meanY}`},
    {label:'Somme des résidus proche de 0',ok:Math.abs(residualSum)<=1e-9*Math.max(1,...ys.map(Math.abs)),detail:`Σ résidus=${residualSum}`}
  ];
  return{n,slope,intercept,correlation,rSquared,meanX,meanY,residualMax,checks};
}


export interface MayerRegressionResult {
  n:number;
  firstPoint:{x:number;y:number};
  secondPoint:{x:number;y:number};
  slope:number;
  intercept:number;
  checks:{label:string;ok:boolean;detail:string}[];
}

export function mayerRegression(xs:number[],ys:number[]):MayerRegressionResult{
  if(xs.length!==ys.length||xs.length<4||xs.some(v=>!Number.isFinite(v))||ys.some(v=>!Number.isFinite(v))){
    throw new Error('La méthode de Mayer demande au moins quatre couples (x,y) valides.');
  }
  const pairs=xs.map((x,i)=>({x,y:ys[i]})).sort((a,b)=>a.x-b.x);
  const cut=Math.floor(pairs.length/2);
  const first=pairs.slice(0,cut),second=pairs.slice(cut);
  const mean=(rows:{x:number;y:number}[])=>({
    x:rows.reduce((s,p)=>s+p.x,0)/rows.length,
    y:rows.reduce((s,p)=>s+p.y,0)/rows.length
  });
  const p1=mean(first),p2=mean(second);
  if(Math.abs(p2.x-p1.x)<=Number.EPSILON*Math.max(1,Math.abs(p1.x),Math.abs(p2.x))){
    throw new Error('La méthode de Mayer est impossible : les deux points moyens ont la même abscisse.');
  }
  const slope=(p2.y-p1.y)/(p2.x-p1.x);
  const intercept=p1.y-slope*p1.x;
  const check1=Math.abs((slope*p1.x+intercept)-p1.y)<=1e-10*Math.max(1,Math.abs(p1.y));
  const check2=Math.abs((slope*p2.x+intercept)-p2.y)<=1e-10*Math.max(1,Math.abs(p2.y));
  return{
    n:pairs.length,firstPoint:p1,secondPoint:p2,slope,intercept,
    checks:[
      {label:'Passage par G₁',ok:check1,detail:`G₁=(${p1.x},${p1.y})`},
      {label:'Passage par G₂',ok:check2,detail:`G₂=(${p2.x},${p2.y})`}
    ]
  };
}


export function uniformCdf(x:number,a:number,b:number):number{
 if(![x,a,b].every(Number.isFinite)||a>=b)return NaN;
 if(x<=a)return 0;
 if(x>=b)return 1;
 return (x-a)/(b-a);
}

export function uniformRangeProbability(x1:number,x2:number,a:number,b:number):number{
 if(![x1,x2,a,b].every(Number.isFinite)||a>=b||x1>x2)return NaN;
 const lo=Math.max(a,x1),hi=Math.min(b,x2);
 return hi<=lo?0:(hi-lo)/(b-a);
}

export function uniformMeanVariance(a:number,b:number):{mean:number;variance:number;std:number}{
 if(![a,b].every(Number.isFinite)||a>=b)return{mean:NaN,variance:NaN,std:NaN};
 const mean=(a+b)/2,variance=(b-a)*(b-a)/12;
 return{mean,variance,std:Math.sqrt(variance)};
}

export function exponentialCdf(x:number,lambda:number):number{
 if(!Number.isFinite(x)||!Number.isFinite(lambda)||lambda<=0)return NaN;
 if(x<=0)return 0;
 return 1-Math.exp(-lambda*x);
}

export function exponentialSurvival(x:number,lambda:number):number{
 if(!Number.isFinite(x)||!Number.isFinite(lambda)||lambda<=0)return NaN;
 if(x<=0)return 1;
 return Math.exp(-lambda*x);
}

export function exponentialRangeProbability(a:number,b:number,lambda:number):number{
 if(![a,b,lambda].every(Number.isFinite)||lambda<=0||a>b)return NaN;
 const lo=Math.max(0,a),hi=Math.max(0,b);
 return Math.max(0,Math.min(1,exponentialCdf(hi,lambda)-exponentialCdf(lo,lambda)));
}

export function exponentialMeanVariance(lambda:number):{mean:number;variance:number;std:number}{
 if(!Number.isFinite(lambda)||lambda<=0)return{mean:NaN,variance:NaN,std:NaN};
 const mean=1/lambda,variance=1/(lambda*lambda);
 return{mean,variance,std:mean};
}

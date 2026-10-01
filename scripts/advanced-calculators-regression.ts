declare const process: { exit(code?: number): never };
import { computeCalculator } from '../src/lib/calculatorEngine.js';
import { binomialRangeProbability, inverseNormalCdf, linearRegression, normalRangeProbability, descriptiveStats } from '../src/lib/probabilityEngine.js';
import { mPower, mRref, solveLinearSystem } from '../src/lib/matrix.js';
import { cRoots, cPow, cSub, cMod, cFromPolar } from '../src/lib/complex.js';

let checks=0,failures=0;
const ok=(value:boolean,label:string)=>{checks++;if(!value){failures++;console.error('FAIL',label);}};
const near=(a:number,b:number,t=1e-8)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b));
const raw=(expr:string,mode:'deg'|'rad'='rad')=>{const r=computeCalculator(expr,mode);return typeof r.rawValue==='number'?r.rawValue:Number(r.rawValue);};

// Calculatrice scientifique avancée
ok(near(raw('asin(0.5)','deg'),30,1e-10),'asin degree output');
ok(near(raw('acos(0)','deg'),90,1e-10),'acos degree output');
ok(near(raw('atan(1)','deg'),45,1e-10),'atan degree output');
ok(near(raw('asin(0.5)','rad'),Math.PI/6,1e-10),'asin rad output');
ok(raw('combinations(52,5)')===2598960,'scientific nCr');
ok(raw('permutations(10,3)')===720,'scientific nPr');
ok(raw('5!')===120,'scientific factorial');
ok(near(raw('nthRoot(81,4)'),3,1e-12),'scientific nth root');
ok(near(raw('log10(100000)'),5,1e-12),'scientific log10');

// Matrices avancées
let p=mPower([[1,1],[0,1]],3);
ok(!!p&&near(p[0][0],1)&&near(p[0][1],3)&&near(p[1][1],1),'matrix positive power');
p=mPower([[1,1],[0,1]],-1);
ok(!!p&&near(p[0][1],-1),'matrix negative power');
const rr=mRref([[1,2],[2,4]]);
ok(rr.rank===1&&near(rr.rref[0][0],1)&&near(rr.rref[1][0],0)&&near(rr.rref[1][1],0),'matrix rref');
let sys=solveLinearSystem([[2,1],[1,-1]],[5,1]);
ok(sys.status==='unique'&&!!sys.solution&&near(sys.solution[0],2)&&near(sys.solution[1],1)&&(sys.residualMax??1)<1e-10,'linear system unique');
sys=solveLinearSystem([[1,1],[2,2]],[1,2]);
ok(sys.status==='infinite','linear system infinite');
sys=solveLinearSystem([[1,1],[2,2]],[1,3]);
ok(sys.status==='none','linear system inconsistent');

// Probabilités et statistiques avancées
ok(near(binomialRangeProbability(10,3,7,0.5),0.890625,1e-12),'binomial interval');
ok(near(normalRangeProbability(-1,1),0.682689,2e-5),'normal interval');
ok(near(inverseNormalCdf(0.975),1.959964,5e-5),'normal quantile');
const reg=linearRegression([1,2,3,4],[3,5,7,9]);
ok(near(reg.slope,2)&&near(reg.intercept,1)&&near(reg.correlation,1)&&near(reg.rSquared,1),'linear regression exact line');
const st=descriptiveStats([1,2,3]);
ok(st.varianceSample!==null&&near(st.varianceSample,1)&&st.stdSample!==null&&near(st.stdSample,1),'sample variance/std');

// Complexes avancés
const roots=cRoots({re:1,im:0},3);
ok(roots.length===3,'complex cube roots count');
ok(roots.every(z=>cMod(cSub(cPow(z,3),{re:1,im:0}))<1e-9),'complex roots verified');
const polar=cFromPolar(2,60,'deg');
ok(near(polar.re,1,1e-10)&&near(polar.im,Math.sqrt(3),1e-10),'complex polar conversion');

console.log(`Advanced calculators audit: ${checks} checks, ${failures} failure(s)`);
if(failures)process.exit(1);

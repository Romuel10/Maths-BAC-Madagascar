declare const process: { exit(code?: number): never };
import { parsePolynomial, formatPolynomial } from '../src/lib/polynomialEngine.js';
import { parseRationalPolynomial, rationalExcludedPoints, rationalLimitAtFinite, rationalLimitAtInfinity, rationalValue, rationalEquivalent, rationalProportional } from '../src/lib/rationalEngine.js';
import { tryExactDefiniteIntegral, tryExactPrimitive } from '../src/lib/integralEngine.js';
import { deriveWithBacEngine, parseDerivativeExpression, evaluateDerivativeAst } from '../src/lib/derivativeEngine.js';
import { analyzeSequenceVerified } from '../src/lib/sequenceEngine.js';
import { solveInequalityVerified } from '../src/lib/inequalityEngine.js';
import { solveEquationVerified } from '../src/lib/equationEngine.js';
import { certifyContinuousOnInterval } from '../src/lib/intervalDomainEngine.js';

let checks=0,failures=0;
const ok=(v:boolean,label:string)=>{checks++;if(!v){failures++;console.error('FAIL',label);}};
const near=(a:number,b:number,t=1e-8)=>Number.isFinite(a)&&Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b));

const p=parsePolynomial('3*x^4-2*x^2+5*x-7','x',8);ok(!!p&&p.length===5&&near(p[4],3)&&near(p[2],-2)&&near(p[1],5)&&near(p[0],-7),'parser polynomial exact');
const piPoly=parsePolynomial('pi*x+1','x',2);ok(!!piPoly&&near(piPoly[1],Math.PI),'coefficient pi polynomial');
ok(parsePolynomial('sin(x)','x',8)===null,'sin(x) not polynomial');
ok(formatPolynomial([1,-4,1])==='x^2-4*x+1','format polynomial');

const rat=parseRationalPolynomial('(x^2-1)/(x-2)','x',12)!;ok(!!rat,'rational parser');ok(near(rationalValue(rat,3)!,8),'rational value');const ex=rationalExcludedPoints(rat);ok(ex.complete&&ex.points.length===1&&near(ex.points[0],2),'rational excluded point');ok(rationalLimitAtInfinity(rat,true).value==='+∞','rational +inf');ok(rationalLimitAtFinite(rat,2,'left').value==='-∞'&&rationalLimitAtFinite(rat,2,'right').value==='+∞','rational one-sided pole');
const removable=parseRationalPolynomial('(x^2-4)/(x-2)','x',12)!;ok(rationalLimitAtFinite(removable,2,'left').value==='4'&&rationalLimitAtFinite(removable,2,'right').value==='4','removable discontinuity');
const inv=parseRationalPolynomial('1/(x^2+1)','x',12)!;ok(rationalLimitAtInfinity(inv,true).value==='0','proper rational infinity');
const eqA=parseRationalPolynomial('(x^2-1)/(x-1)','x',12)!,eqB=parseRationalPolynomial('x+1','x',12)!;ok(!rationalEquivalent(eqA,eqB),'equivalence preserves removable hole');
const propA=parseRationalPolynomial('x/2-1','x',12)!,propB=parseRationalPolynomial('x-2','x',12)!;ok(rationalProportional(propA,propB),'equation residuals proportional');

function checkIntegral(expr:string,a:number,b:number,expected:number,label:string){const r=tryExactDefiniteIntegral(expr,a,b);ok(!!r,label+' recognized');if(!r)return;ok(near(r.value,expected,2e-8),label+' value');const d=deriveWithBacEngine(r.primitive);ok(d.supported,label+' primitive derivative supported');if(d.supported){const dAst=parseDerivativeExpression(d.derivative),fAst=parseDerivativeExpression(expr);for(const x of [a+(b-a)*.23,a+(b-a)*.51,a+(b-a)*.79]){const dv=evaluateDerivativeAst(dAst,x),fv=evaluateDerivativeAst(fAst,x);ok(near(dv,fv,2e-7),label+' derivative check');}}}
checkIntegral('x^2',0,2,8/3,'integral polynomial');
checkIntegral('sin(2*x+1)',0,1,(Math.cos(1)-Math.cos(3))/2,'integral sin affine');
checkIntegral('3*cos(4*x-1)',0,.5,3*(Math.sin(1)-Math.sin(-1))/4,'integral cos affine');
checkIntegral('2*exp(3*x)',0,1,2*(Math.exp(3)-1)/3,'integral exp affine');
checkIntegral('5/(2*x+3)',0,2,(5/2)*Math.log(7/3),'integral reciprocal affine');
checkIntegral('(2*x+1)^3',0,1,(Math.pow(3,4)-1)/8,'integral power affine');
ok(tryExactDefiniteIntegral('sin(x^2)',0,1)===null,'non-elementary school integral not falsely exact');
for(const [expr] of [['3*x^2-4*x+1'],['sin(2*x+1)'],['3*cos(4*x-1)'],['2*exp(3*x)'],['5/(2*x+3)'],['(2*x+1)^3']] as Array<[string]>){const pr=tryExactPrimitive(expr);ok(!!pr,`primitive recognized ${expr}`);if(pr){const d=deriveWithBacEngine(pr.primitive);ok(d.supported,`primitive derivative supported ${expr}`);if(d.supported){const da=parseDerivativeExpression(d.derivative),fa=parseDerivativeExpression(expr);for(const x of [-.7,.2,1.1]){const dv=evaluateDerivativeAst(da,x),fv=evaluateDerivativeAst(fa,x);if(Number.isFinite(dv)&&Number.isFinite(fv))ok(near(dv,fv,2e-7),`primitive derivative equals integrand ${expr}`);}}}}
ok(tryExactPrimitive('sin(x^2)')===null,'non-elementary primitive not falsely recognized');

let dc=certifyContinuousOnInterval('sin(x^2)',0,3);ok(dc.ok&&dc.proven,'domain certificate sin(x^2) continuous');
dc=certifyContinuousOnInterval('1/(x-2)',0,3);ok(!dc.ok&&dc.proven&&Math.abs((dc.badX??0)-2)<1e-9,'domain certificate detects rational pole');
dc=certifyContinuousOnInterval('1/(x^3-x+1)',0,3);ok(!dc.ok&&!dc.proven,'domain certificate refuses incomplete high-degree rational denominator');
dc=certifyContinuousOnInterval('sqrt(x)',0,4);ok(dc.ok&&dc.proven,'domain certificate sqrt on valid interval');
dc=certifyContinuousOnInterval('sqrt(x)',-1,4);ok(!dc.ok&&dc.proven,'domain certificate sqrt invalid interval');
dc=certifyContinuousOnInterval('log(x)',0.1,4);ok(dc.ok&&dc.proven,'domain certificate log positive interval');
dc=certifyContinuousOnInterval('tan(x)',1,2);ok(!dc.ok&&dc.proven,'domain certificate tan pole');

let seq=analyzeSequenceVerified('0.5*x+1',10,'recursive',30);ok(seq.quality.level==='verified'&&seq.convergence.converges&&near(seq.convergence.limit!,2),'affine recurrence convergence');
seq=analyzeSequenceVerified('3*(0.5)^n',3,'explicit',30);ok(seq.quality.level==='verified'&&seq.isGeometric.yes&&seq.convergence.converges&&near(seq.convergence.limit!,0),'explicit geometric');
seq=analyzeSequenceVerified('1/(n+1)',1,'explicit',30);ok(seq.quality.level==='verified'&&seq.convergence.converges&&near(seq.convergence.limit!,0),'rational sequence limit');
seq=analyzeSequenceVerified('n^2',0,'explicit',30);ok(seq.quality.level==='verified'&&!seq.convergence.converges,'polynomial sequence divergence');
ok(seq.bounded.below===true&&near(seq.bounded.infBound??NaN,0),'n^2 proven bounded below by 0');
seq=analyzeSequenceVerified('-n^2',0,'explicit',30);ok(seq.quality.level==='verified'&&!seq.convergence.converges&&seq.bounded.above===true&&near(seq.bounded.supBound??NaN,0),'minus n^2 proven bounded above by 0');
seq=analyzeSequenceVerified('0*(2)^n',0,'explicit',30);ok(seq.quality.level==='verified'&&seq.behavior==='constant'&&seq.convergence.converges&&near(seq.convergence.limit??NaN,0),'zero geometric coefficient constant');
seq=analyzeSequenceVerified('1/n',0,'explicit',30,1);ok(seq.quality.level==='verified'&&seq.convergence.converges&&near(seq.convergence.limit??NaN,0),'1/n from n=1');
seq=analyzeSequenceVerified('1/n',0,'explicit',30,0);ok(seq.quality.level==='warning','1/n from n=0 rejected due domain');
seq=analyzeSequenceVerified('sin(n)',0,'explicit',30);ok(seq.quality.level==='approximate'&&!seq.convergence.converges&&seq.behavior==='unknown','general sequence remains observational');

let iq=solveInequalityVerified('x^2-3*x+2','<=',0,-10,10);ok(iq.exact&&iq.quality==='verified'&&iq.solutionSet.includes('1')&&iq.solutionSet.includes('2'),'exact polynomial inequality');
iq=solveInequalityVerified('(x-1)/(x-2)','>=',0,-10,10);ok(iq.exact&&iq.quality==='verified'&&iq.solutionSet.includes('1')&&iq.solutionSet.includes('2'),'exact rational inequality');
iq=solveInequalityVerified('sin(x)','>=',0,-3,3);ok(!iq.exact&&(iq.quality==='approximate'||iq.quality==='warning'),'non algebraic inequality stays numerical');
let eqr=solveEquationVerified('(x^2-1)/(x-2)',0,-10,10);ok(eqr.exact&&eqr.quality==='verified'&&eqr.solutions.length===2&&near(eqr.solutions[0],-1)&&near(eqr.solutions[1],1),'exact rational equation');
eqr=solveEquationVerified('(2*x-4)/(x-2)',2,-10,10);ok(eqr.exact&&eqr.allDomain===true,'rational identity respects domain');
eqr=solveEquationVerified('sin(x)',0,-4,4);ok(!eqr.exact&&eqr.solutions.every((x,i)=>eqr.verifications[i].ok),'non algebraic equation numerical candidates verified');
eqr=solveEquationVerified('1/(x-2)',0,-10,10);ok(eqr.exact&&eqr.quality==='verified'&&eqr.solutions.length===0,'rational equation with nonzero numerator has exactly no solution');
iq=solveInequalityVerified('sin(x)','>',0,-6,6);ok(iq.exact===false&&iq.scope==='window'&&iq.proof==='numeric'&&iq.quality!=='verified'&&!!iq.warning,'transcendental inequality remains explicitly window-limited');


let seed=450045;
const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
const ri=(a:number,b:number)=>Math.floor(rnd()*(b-a+1))+a;
for(let t=0;t<180;t++){
 const a=ri(-7,7),b=ri(-9,9),c=ri(-11,11),d=ri(-5,5)||1;
 const expr=`(${a}*x^2+${b}*x+${c})/${d}`; const pp=parsePolynomial(expr,'x',4);
 ok(!!pp,`random polynomial parser ${t}`); if(pp){for(const xv of [-2.3,-.4,.7,2.1]){const expected=(a*xv*xv+b*xv+c)/d;const got=(pp[2]||0)*xv*xv+(pp[1]||0)*xv+(pp[0]||0);ok(near(got,expected,1e-10),`random polynomial value ${t}`);}}
}
for(let t=0;t<160;t++){
 let q=ri(-8,8);if(q===0)q=1;const p0=ri(-10,10),a=ri(-8,8),b=ri(-10,10);const expr=`(${a}*x+${b})/(x+${q})`;const rr=parseRationalPolynomial(expr,'x',8);ok(!!rr,`random rational parser ${t}`);if(rr){for(const xv of [-3.2,-.6,1.4,4.1]){if(Math.abs(xv+q)<1e-8)continue;const got=rationalValue(rr,xv),expected=(a*xv+b)/(xv+q);ok(got!==null&&near(got,expected,1e-10),`random rational value ${t}`);}}
}
for(let t=0;t<100;t++){
 let a=ri(1,7)*(rnd()<.5?-1:1),b=ri(-6,6),k=ri(-5,5)||1;const lo=-.4,hi=.8;const expr=`${k}*exp(${a}*x+${b})`;const r=tryExactDefiniteIntegral(expr,lo,hi);const expected=k*(Math.exp(a*hi+b)-Math.exp(a*lo+b))/a;ok(!!r&&near(r.value,expected,2e-8),`random affine exponential integral ${t}`);
}
console.log(`Math tools core audit: ${checks} checks, ${failures} failure(s)`);
if(failures)process.exit(1);

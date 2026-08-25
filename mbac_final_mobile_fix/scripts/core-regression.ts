declare const process: { exit(code?: number): never };
import { solveQuadraticReal, solvePolynomialInequality } from '../src/lib/algebraCore.js';
import { factorialBigInt, combinationBigInt, arrangementsBigInt, binomialProbability, binomialCdf, normalCdf, descriptiveStats } from '../src/lib/probabilityEngine.js';
import { distance2D, midpoint2D, lineThrough, circleFromCenterPoint } from '../src/lib/geometryEngine.js';
import { mDet, mInverse, mMul, mRank, mIdentityResidual, analyzeMatrix } from '../src/lib/matrix.js';
import { cAdd, cMul, cDiv, cPow, cSqrt, solveQuadraticComplex } from '../src/lib/complex.js';
import { intersectBoundaryLines, satisfiesLinearConstraint, verifyBoundaryIntersection } from '../src/lib/linearInequality2DEngine.js';

let tests=0, failures=0;
function ok(cond:boolean,label:string){tests++; if(!cond){failures++; console.error('FAIL',label);} }
function near(a:number,b:number,t=1e-9){return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b));}
function matrixNear(a:number[][]|null,b:number[][],t=1e-9){if(!a||a.length!==b.length)return false; return a.every((r,i)=>r.length===b[i].length&&r.every((v,j)=>near(v,b[i][j],t)));}

// Equations: stable roots + substitution
for(const [a,b,c,roots] of [
 [1,-5,6,[2,3]],[1,2,1,[-1]],[2,5,-3,[-3,0.5]],[1e-12,1,-1,[1]],[1,1e8,1,[-1e8,-1e-8]]
] as Array<[number,number,number,number[]]>){
 const r=solveQuadraticReal(a,b,c); ok(r.roots.length===roots.length,`quadratic count ${a},${b},${c}`);
 roots.forEach((x,i)=>ok(near(r.roots[i],x,1e-7),`quadratic root ${a},${b},${c} #${i}`));
 ok(r.verification.every(v=>v.ok),'quadratic substitution');
}
const ineq=solvePolynomialInequality(1,-3,2,'<=');
ok(ineq.roots.length===2&&near(ineq.roots[0],1)&&near(ineq.roots[1],2),'inequality roots');
ok(ineq.intervals.length===1&&near(ineq.intervals[0].from!,1)&&near(ineq.intervals[0].to!,2)&&ineq.intervals[0].includeFrom&&ineq.intervals[0].includeTo,'inequality interval [1,2]');

// Exact combinatorics + probabilities
ok(factorialBigInt(20)===2432902008176640000n,'20! exact');
ok(combinationBigInt(52,5)===2598960n,'C(52,5) exact');
ok(arrangementsBigInt(10,3)===720n,'A(10,3) exact');
ok(near(binomialProbability(10,3,0.5),120/1024,1e-12),'binomial pmf');
ok(near(binomialCdf(10,10,0.3),1,1e-15),'binomial cdf end');
ok(near(binomialCdf(4,1,0.5),5/16,1e-12),'binomial cdf');
ok(near(normalCdf(0),0.5,1e-8),'normal cdf 0');
const st=descriptiveStats([1,2,3,4,5,6,7,8]);
ok(near(st.mean,4.5)&&near(st.median,4.5)&&st.q1===2&&st.q3===6,'descriptive stats quartiles');
ok(st.checks.every(c=>c.ok),'stats checks');

// Geometry
const d=distance2D({x:0,y:0},{x:3,y:4}); ok(near(d.value,5)&&d.checks.every(c=>c.ok),'distance 3-4-5');
const m=midpoint2D({x:-2,y:4},{x:6,y:-2}); ok(near(m.point.x,2)&&near(m.point.y,1)&&m.checks.every(c=>c.ok),'midpoint');
const line=lineThrough({x:1,y:3},{x:4,y:9}); ok(line.kind==='affine'&&near(line.slope!,2)&&near(line.intercept!,1)&&line.checks.every(c=>c.ok),'line affine');
ok(lineThrough({x:2,y:1},{x:2,y:5}).kind==='vertical','vertical line');
ok(lineThrough({x:2,y:1},{x:2,y:1}).kind==='undefined','coincident points line');
const circle=circleFromCenterPoint({x:1,y:2},{x:4,y:6}); ok(near(circle.radius,5)&&circle.checks.every(c=>c.ok),'circle');

// Inéquations linéaires à deux inconnues
const q1={a:1,b:1,c:-3,op:'<=' as const},q2={a:1,b:-1,c:1,op:'>=' as const};
const inter=intersectBoundaryLines(q1,q2); ok(!!inter&&near(inter.x,1)&&near(inter.y,2),'2D line intersection sign');
if(inter){const vr=verifyBoundaryIntersection(q1,q2,inter);ok(vr.ok,'2D intersection residual');ok(satisfiesLinearConstraint(q1,inter)&&satisfiesLinearConstraint(q2,inter),'2D intersection satisfies inclusive constraints');}
ok(intersectBoundaryLines({a:1,b:1,c:0,op:'>='},{a:2,b:2,c:1,op:'<='})===null,'parallel boundaries no finite intersection');

// Matrices
const A=[[4,7],[2,6]];
ok(near(mDet(A)!,10),'det 2x2');
const inv=mInverse(A); ok(matrixNear(inv,[[0.6,-0.7],[-0.2,0.4]]),'inverse 2x2');
ok((mIdentityResidual(A,inv!)??1)<1e-12,'inverse residual');
ok(mRank([[1,2,3],[2,4,6],[1,1,1]])===2,'rank');
ok(analyzeMatrix(A).quality==='verified'&&analyzeMatrix(A).isInvertible,'matrix analysis verified');
ok(matrixNear(mMul([[1,2],[3,4]],[[5,6],[7,8]]),[[19,22],[43,50]]),'matrix multiply');

// Complex numbers
const z1={re:3,im:2},z2={re:1,im:-4};
let z=cAdd(z1,z2); ok(near(z.re,4)&&near(z.im,-2),'complex add');
z=cMul(z1,z2); ok(near(z.re,11)&&near(z.im,-10),'complex multiply');
z=cDiv(z1,z2); ok(near(z.re,-5/17)&&near(z.im,14/17),'complex divide');
z=cPow({re:1,im:1},4); ok(near(z.re,-4)&&near(z.im,0),'complex integer power');
const sq=cSqrt({re:-3,im:4})[0]; const sq2=cMul(sq,sq); ok(near(sq2.re,-3,1e-10)&&near(sq2.im,4,1e-10),'complex sqrt square back');
const cq=solveQuadraticComplex(1,0,1); ok(cq.verification.every(v=>v.ok)&&near(Math.abs(cq.z1.im),1),'complex quadratic');


// Deterministic randomized audit (LCG for reproducibility)
let seed=20260824;
function rnd(){ seed=(1664525*seed+1013904223)>>>0; return seed/4294967296; }
function ri(lo:number,hi:number){ return Math.floor(rnd()*(hi-lo+1))+lo; }
for(let t=0;t<180;t++){
 let a=ri(-9,9); if(a===0)a=1; const r1=ri(-12,12),r2=ri(-12,12);
 const b=-a*(r1+r2), c=a*r1*r2; const q=solveQuadraticReal(a,b,c);
 ok(q.roots.length===(r1===r2?1:2),`random quadratic count ${t}`);
 ok(q.verification.every(v=>v.ok),`random quadratic residual ${t}`);
 const expected=[r1,r2].sort((u,v)=>u-v); const got=q.roots;
 ok(got.every((x,i)=>near(x, expected[r1===r2?0:i],1e-9)),`random quadratic roots ${t}`);
}
for(let t=0;t<100;t++){
 const A3=Array.from({length:3},()=>Array.from({length:3},()=>ri(-6,6)));
 const det=mDet(A3)!; const inv3=mInverse(A3);
 if(Math.abs(det)>1e-8){ ok(!!inv3,`random inverse exists ${t}`); if(inv3) ok((mIdentityResidual(A3,inv3)??1)<1e-8,`random inverse residual ${t}`); }
 else ok(mRank(A3)<3 || inv3===null,`random singular matrix ${t}`);
}
for(let t=0;t<160;t++){
 const a={re:ri(-20,20),im:ri(-20,20)}, b={re:ri(-20,20),im:ri(-20,20)};
 if(Math.hypot(b.re,b.im)<1e-12) continue;
 const recovered=cMul(cDiv(a,b),b);
 ok(near(recovered.re,a.re,1e-9)&&near(recovered.im,a.im,1e-9),`random complex division ${t}`);
}
for(let n=1;n<=60;n+=3){
 const p=(n%13+1)/15; let sum=0; for(let k=0;k<=n;k++)sum+=binomialProbability(n,k,p);
 ok(near(sum,1,5e-12),`binomial mass sums to 1 n=${n}`);
}
for(let t=0;t<80;t++){
 const a={x:ri(-50,50),y:ri(-50,50)}, b={x:ri(-50,50),y:ri(-50,50)};
 const dab=distance2D(a,b), dba=distance2D(b,a), mid=midpoint2D(a,b);
 ok(near(dab.value,dba.value)&&dab.checks.every(c=>c.ok),`random distance symmetry ${t}`);
 ok(mid.checks.every(c=>c.ok),`random midpoint ${t}`);
}
console.log(`Core audit: ${tests} checks, ${failures} failure(s)`);
if(failures) process.exit(1);

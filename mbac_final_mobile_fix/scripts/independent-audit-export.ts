import { solveQuadraticReal } from '../src/lib/algebraCore.js';
import { mDet, mInverse } from '../src/lib/matrix.js';
import { solveQuadraticComplex } from '../src/lib/complex.js';
let seed=45123; const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296}; const ri=(a:number,b:number)=>Math.floor(rnd()*(b-a+1))+a;
const quadratics=[] as any[];
for(let i=0;i<120;i++){let a=ri(-9,9);if(!a)a=1;const b=ri(-30,30),c=ri(-30,30);const r=solveQuadraticReal(a,b,c);quadratics.push({a,b,c,roots:r.roots});}
const matrices=[] as any[];
for(let i=0;i<60;i++){const A=Array.from({length:3},()=>Array.from({length:3},()=>ri(-8,8)));matrices.push({A,det:mDet(A),inv:mInverse(A)});}
const complex=[] as any[];
for(let i=0;i<80;i++){let a=ri(-8,8);if(!a)a=1;const b=ri(-20,20),c=ri(-20,20);const r=solveQuadraticComplex(a,b,c);complex.push({a,b,c,z1:r.z1,z2:r.z2});}
console.log(JSON.stringify({quadratics,matrices,complex}));

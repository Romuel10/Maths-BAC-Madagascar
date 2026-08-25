import { deriveWithBacEngine, parseDerivativeExpression, evaluateDerivativeAst } from '../src/lib/derivativeEngine.js';

type Case={name:string;expr:string;points:number[]};
const cases:Case[]=[
 {name:'constante',expr:'7',points:[-2,0,3]},
 {name:'variable',expr:'x',points:[-2,0,3]},
 {name:'carré',expr:'x^2',points:[-2,-.3,2]},
 {name:'polynôme',expr:'3*x^4-2*x^3+5*x-7',points:[-2,-.5,1.7]},
 {name:'inverse',expr:'1/x',points:[-2,-.5,1.7]},
 {name:'rationnelle',expr:'(x^2-1)/(x-2)',points:[-2,0,1,3]},
 {name:'produit exponentiel',expr:'x*exp(-x)',points:[-1,0,.7,2]},
 {name:'racine',expr:'sqrt(x)',points:[.2,1,4]},
 {name:'racine composée',expr:'sqrt(x^2+1)',points:[-2,0,1.5]},
 {name:'exponentielle',expr:'exp(x)',points:[-2,0,1]},
 {name:'exponentielle composée',expr:'exp(2*x+1)',points:[-1,0,1]},
 {name:'logarithme',expr:'log(x)',points:[.2,1,4]},
 {name:'logarithme composé',expr:'log(x^2+1)',points:[-2,0,1.5]},
 {name:'sinus',expr:'sin(x)',points:[-2,0,1]},
 {name:'cosinus',expr:'cos(x)',points:[-2,0,1]},
 {name:'tangente',expr:'tan(x)',points:[-.8,0,.7]},
 {name:'sinus composé',expr:'sin(x^2)',points:[-1.2,0,.8]},
 {name:'quotient logarithmique',expr:'log(x)/x',points:[.3,1,2.2]},
 {name:'puissance composée',expr:'(3*x-1)^5',points:[-1,0,.7]},
 {name:'puissance variable',expr:'x^x',points:[.3,1,2]},
 {name:'linéaire',expr:'5*x-9',points:[-2,0,3]},
 {name:'polynôme degré 5',expr:'-2*x^5+7*x^2-4',points:[-1.4,0,.8]},
 {name:'quotient affine',expr:'(2*x+3)/(x+1)',points:[-2,0,2]},
 {name:'quotient polynômes',expr:'(x^3+2*x)/(x^2+1)',points:[-2,0,1.3]},
 {name:'produit polynômes',expr:'(x^2+1)*(x-3)',points:[-2,0,2]},
 {name:'produit trigonométrique',expr:'x*sin(x)',points:[-2,0,1]},
 {name:'produit logarithmique',expr:'x*log(x)',points:[.2,1,3]},
 {name:'inverse composée',expr:'1/(x^2+1)',points:[-2,0,1.2]},
 {name:'puissance négative',expr:'x^-3',points:[-2,-.5,1.5]},
 {name:'racine affine',expr:'sqrt(3*x+4)',points:[-1,.2,3]},
 {name:'log affine',expr:'log(3*x+4)',points:[-1,.2,3]},
 {name:'log polynôme',expr:'log(x^3+2)',points:[0,.5,2]},
 {name:'exp quadratique',expr:'exp(x^2)',points:[-1,0,.8]},
 {name:'cos composée',expr:'cos(2*x-1)',points:[-1,0,1]},
 {name:'tan composée',expr:'tan(x^2)',points:[-.7,0,.6]},
 {name:'sin pi x',expr:'sin(pi*x)',points:[-.5,0,.7]},
 {name:'e puissance x',expr:'e^x',points:[-1,0,1]},
 {name:'base 2 puissance x',expr:'2^x',points:[-1,0,1]},
 {name:'composition profonde',expr:'log(sqrt(x^2+1))',points:[-2,0,1.3]},
 {name:'exp sinus',expr:'exp(sin(x))',points:[-2,0,1]},
 {name:'puissance décimale',expr:'x^0.5',points:[.4,1,2]},
 {name:'puissance décimale composée',expr:'(x^2+1)^0.5',points:[-.8,.4,2]},
 {name:'exposant fractionnaire',expr:'x^(1/2)',points:[.4,1,2]},
 {name:'exposant négatif parenthésé',expr:'x^(-2)',points:[.4,1,2]},
 {name:'puissance trois demis',expr:'(x+1)^(3/2)',points:[.2,1,2]},
 {name:'puissance composée négative',expr:'(x^2+1)^(-2)',points:[-.8,.4,2]},
];

let failures=0,d1Checks=0,d2Checks=0;
function checkExpression(expr:string,points:number[],label:string){
 const r=deriveWithBacEngine(expr);
 if(!r.supported){console.error('FAIL parse',label,expr,r.warnings);failures++;return;}
 const f=parseDerivativeExpression(expr),d=parseDerivativeExpression(r.derivative),d2=parseDerivativeExpression(r.secondDerivative);
 for(const x of points){
  const h=2e-5*Math.max(1,Math.abs(x));
  const fm=evaluateDerivativeAst(f,x-h),fp=evaluateDerivativeAst(f,x+h),dv=evaluateDerivativeAst(d,x);
  if([fm,fp,dv].every(Number.isFinite)){
   d1Checks++; const numeric=(fp-fm)/(2*h),tol=2e-4*Math.max(1,Math.abs(numeric),Math.abs(dv));
   if(Math.abs(numeric-dv)>tol){console.error('FAIL d1',label,expr,r.derivative,x,numeric,dv);failures++;return;}
  }
  const dm=evaluateDerivativeAst(d,x-h),dp=evaluateDerivativeAst(d,x+h),d2v=evaluateDerivativeAst(d2,x);
  if([dm,dp,d2v].every(Number.isFinite)){
   d2Checks++; const numeric=(dp-dm)/(2*h),tol=4e-4*Math.max(1,Math.abs(numeric),Math.abs(d2v));
   if(Math.abs(numeric-d2v)>tol){console.error('FAIL d2',label,expr,r.secondDerivative,x,numeric,d2v);failures++;return;}
  }
 }
}
for(const c of cases)checkExpression(c.expr,c.points,c.name);

let seed=123456789; const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
const ri=(a:number,b:number)=>Math.floor(rnd()*(b-a+1))+a;
const atoms=()=>{const a=ri(1,5),b=ri(-4,4),n=ri(2,5);return [`${a}*x+${b}`,`x^${n}`,`sin(${a}*x+${b})`,`cos(${a}*x+${b})`,`exp(${a}*x/5+${b}/5)`,`log(x^2+${a})`,`sqrt(x^2+${a})`,`1/(x^2+${a})`];};
const probes=[-1.7,-.9,-.25,.2,.65,1.3,2.1];
for(let i=0;i<120;i++){
 const A=atoms(),B=atoms(),u=A[ri(0,A.length-1)],v=B[ri(0,B.length-1)],mode=ri(0,5);
 const expr=mode===0?`(${u})+(${v})`:mode===1?`(${u})-(${v})`:mode===2?`(${u})*(${v})`:mode===3?`(${u})/(${v})`:mode===4?`sin(${u})`:`exp(${u})`;
 checkExpression(expr,probes,`aléatoire-${i+1}`);
}
console.log(`Dérivées: ${cases.length} cas de référence + 120 cas aléatoires | contrôles d1=${d1Checks} | contrôles d2=${d2Checks} | échecs=${failures}`);
if(failures)throw new Error(`Échecs du moteur de dérivation: ${failures}`);

export interface OdeCheck { label:string; ok:boolean; detail:string }
export interface FirstOrderOdeResult {
 equation:string; generalSolution:string; particularSolution:string|null;
 constantValue:number|null; steps:string[]; checks:OdeCheck[];
}
export interface SecondOrderOdeResult {
 equation:string; discriminant:number; roots:string[]; generalSolution:string;
 particularSolution:string|null; constants:number[]|null; steps:string[]; checks:OdeCheck[];
}

const EPS=1e-12;
const fmt=(n:number)=>{
 if(!Number.isFinite(n))return String(n);
 if(Math.abs(n)<1e-12)n=0;
 const r=Math.round(n*1e10)/1e10;
 return Number.isInteger(r)?String(r):String(r);
};
const near=(a:number,b:number)=>Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b));

export function solveFirstOrderHomogeneous(a:number, initial?:{x0:number;y0:number}):FirstOrderOdeResult{
 if(!Number.isFinite(a))throw new Error('Le coefficient a doit être réel et fini.');
 const equation=`y' + (${fmt(a)})y = 0`;
 const generalSolution=`y(x)=C*exp(${fmt(-a)}*x)`;
 const steps=[`Équation : ${equation}.`,`On isole y'/y = ${fmt(-a)} puis on intègre.`,`Solution générale : ${generalSolution}.`];
 if(!initial)return{equation,generalSolution,particularSolution:null,constantValue:null,steps,checks:[]};
 if(!Number.isFinite(initial.x0)||!Number.isFinite(initial.y0))throw new Error('La condition initiale doit contenir des valeurs finies.');
 const C=initial.y0*Math.exp(a*initial.x0);
 const particularSolution=`y(x)=${fmt(C)}*exp(${fmt(-a)}*x)`;
 const yAt0=C*Math.exp(-a*initial.x0);
 steps.push(`Condition y(${fmt(initial.x0)})=${fmt(initial.y0)} : C=${fmt(C)}.`,`Solution particulière : ${particularSolution}.`);
 return{equation,generalSolution,particularSolution,constantValue:C,steps,checks:[{label:'Condition initiale',ok:near(yAt0,initial.y0),detail:`y(${fmt(initial.x0)})=${fmt(yAt0)}`}]};
}

export function solveSecondOrderHomogeneous(A:number,B:number,C:number,initial?:{x0:number;y0:number;dy0:number}):SecondOrderOdeResult{
 if(![A,B,C].every(Number.isFinite)||Math.abs(A)<EPS)throw new Error('Il faut A ≠ 0 et des coefficients réels finis.');
 const delta=B*B-4*A*C;
 const tol=64*Number.EPSILON*Math.max(1,Math.abs(B*B),Math.abs(4*A*C));
 const equation=`${fmt(A)}y'' + (${fmt(B)})y' + (${fmt(C)})y = 0`;
 const steps=[`Équation : ${equation}.`,`Équation caractéristique : ${fmt(A)}r² + ${fmt(B)}r + ${fmt(C)} = 0.`,`Δ = b²−4ac = ${fmt(delta)}.`];
 let generalSolution='',roots:string[]=[];
 let constants:number[]|null=null,particularSolution:string|null=null;
 let evalY:(x:number,k:number[])=>number;
 let evalDy:(x:number,k:number[])=>number;

 if(delta>tol){
  const s=Math.sqrt(delta),r1=(-B-s)/(2*A),r2=(-B+s)/(2*A);
  roots=[fmt(r1),fmt(r2)];
  generalSolution=`y(x)=C1*exp(${fmt(r1)}*x)+C2*exp(${fmt(r2)}*x)`;
  steps.push(`Δ>0 : r₁=${fmt(r1)}, r₂=${fmt(r2)}.`,`Solution générale : ${generalSolution}.`);
  evalY=(x,k)=>k[0]*Math.exp(r1*x)+k[1]*Math.exp(r2*x);
  evalDy=(x,k)=>r1*k[0]*Math.exp(r1*x)+r2*k[1]*Math.exp(r2*x);
  if(initial){
   const e1=Math.exp(r1*initial.x0),e2=Math.exp(r2*initial.x0);
   const det=e1*r2*e2-e2*r1*e1;
   const c1=(initial.y0*r2*e2-e2*initial.dy0)/det;
   const c2=(e1*initial.dy0-r1*e1*initial.y0)/det;
   constants=[c1,c2];
   particularSolution=`y(x)=${fmt(c1)}*exp(${fmt(r1)}*x)+(${fmt(c2)})*exp(${fmt(r2)}*x)`;
  }
 }else if(Math.abs(delta)<=tol){
  const r=-B/(2*A);roots=[fmt(r),fmt(r)];
  generalSolution=`y(x)=(C1+C2*x)*exp(${fmt(r)}*x)`;
  steps.push(`Δ=0 : racine double r=${fmt(r)}.`,`Solution générale : ${generalSolution}.`);
  evalY=(x,k)=>(k[0]+k[1]*x)*Math.exp(r*x);
  evalDy=(x,k)=>(k[1]+r*(k[0]+k[1]*x))*Math.exp(r*x);
  if(initial){
   const e=Math.exp(r*initial.x0),u=initial.y0/e;
   const c2=initial.dy0/e-r*u,c1=u-c2*initial.x0;
   constants=[c1,c2];
   particularSolution=`y(x)=(${fmt(c1)}+(${fmt(c2)})*x)*exp(${fmt(r)}*x)`;
  }
 }else{
  const alpha=-B/(2*A),beta=Math.sqrt(-delta)/(2*Math.abs(A));
  roots=[`${fmt(alpha)}−${fmt(beta)}i`,`${fmt(alpha)}+${fmt(beta)}i`];
  generalSolution=`y(x)=exp(${fmt(alpha)}*x)*(C1*cos(${fmt(beta)}*x)+C2*sin(${fmt(beta)}*x))`;
  steps.push(`Δ<0 : r=${fmt(alpha)}±${fmt(beta)}i.`,`Solution réelle : ${generalSolution}.`);
  evalY=(x,k)=>Math.exp(alpha*x)*(k[0]*Math.cos(beta*x)+k[1]*Math.sin(beta*x));
  evalDy=(x,k)=>{
   const co=Math.cos(beta*x),si=Math.sin(beta*x),inside=k[0]*co+k[1]*si;
   return Math.exp(alpha*x)*(alpha*inside+beta*(-k[0]*si+k[1]*co));
  };
  if(initial){
   const e=Math.exp(alpha*initial.x0),co=Math.cos(beta*initial.x0),si=Math.sin(beta*initial.x0);
   const u=initial.y0/e,v=(initial.dy0/e-alpha*u)/beta;
   const c1=co*u-si*v,c2=si*u+co*v;
   constants=[c1,c2];
   particularSolution=`y(x)=exp(${fmt(alpha)}*x)*(${fmt(c1)}*cos(${fmt(beta)}*x)+(${fmt(c2)})*sin(${fmt(beta)}*x))`;
  }
 }
 const checks:OdeCheck[]=[];
 if(initial&&constants){
  const y=evalY(initial.x0,constants),dy=evalDy(initial.x0,constants);
  checks.push({label:'Valeur initiale y',ok:near(y,initial.y0),detail:`y(${fmt(initial.x0)})=${fmt(y)}`});
  checks.push({label:"Valeur initiale y'",ok:near(dy,initial.dy0),detail:`y'(${fmt(initial.x0)})=${fmt(dy)}`});
  steps.push(`Conditions initiales : C1=${fmt(constants[0])}, C2=${fmt(constants[1])}.`,`Solution particulière : ${particularSolution}.`);
 }
 return{equation,discriminant:delta,roots,generalSolution,particularSolution,constants,steps,checks};
}

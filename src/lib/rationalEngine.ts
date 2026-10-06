import { parseExpressionCore, evaluateConstantNode } from './expressionCore.js';
import type { DNode } from './derivativeEngine.js';
import { polynomialDegree, polynomialValue, polynomialAdd, polynomialSub, polynomialMul, polynomialScale, polynomialPow, formatPolynomial, type Polynomial } from './polynomialEngine.js';

const EPS = 1e-10;
export interface RationalPolynomial { num: Polynomial; den: Polynomial; originalDen: Polynomial; domainComplete: boolean; }

function trim(p: Polynomial): Polynomial {
 const a=p.slice(); while(a.length>1&&a[a.length-1]===0)a.pop(); return a;
}
function isZeroPoly(p:Polynomial){return p.every(v=>v===0);}
function polyDivMod(a0:Polynomial,b0:Polynomial):{q:Polynomial;r:Polynomial}|null{
 let a=trim(a0),b=trim(b0); if(isZeroPoly(b))return null; if(a.length<b.length)return{q:[0],r:a};
 const q=Array(a.length-b.length+1).fill(0); let r=a.slice(); let guard=0;
 while(r.length>=b.length&&!isZeroPoly(r)&&guard++<80){const k=r.length-b.length,c=r[r.length-1]/b[b.length-1];q[k]=c;const sub=Array(k).fill(0).concat(b.map(v=>v*c));const remainder=polynomialSub(r,sub);remainder[r.length-1]=0;r=trim(remainder);}
 return{q:trim(q),r:trim(r)};
}
function monic(p:Polynomial):Polynomial{const t=trim(p),lead=t[t.length-1];if(lead===0)return[0];return trim(t.map(v=>v/lead));}
function gcdPoly(a0:Polynomial,b0:Polynomial):Polynomial{let a=trim(a0),b=trim(b0),guard=0;while(!isZeroPoly(b)&&guard++<50){const d=polyDivMod(a,b);if(!d)break;a=b;b=trim(d.r);}return monic(a);}
function reducePair(num0:Polynomial,den0:Polynomial):{num:Polynomial;den:Polynomial}{let num=trim(num0),den=trim(den0);if(isZeroPoly(den))return{num,den};const g=gcdPoly(num,den);if(!(g.length===1&&Math.abs(g[0]-1)<1e-8)){const a=polyDivMod(num,g),b=polyDivMod(den,g);if(a&&b&&isZeroPoly(a.r)&&isZeroPoly(b.r)){num=a.q;den=b.q;}}
 if(den[den.length-1]<0){num=polynomialScale(num,-1);den=polynomialScale(den,-1);}return{num:trim(num),den:trim(den)};}

function combineOriginalDen(a:Polynomial,b:Polynomial,maxDegree:number):Polynomial|null{return polynomialMul(a,b,maxDegree);}

function visit(node:DNode,variable:string,maxDegree:number):RationalPolynomial|null{
 if(node.kind==='num')return{num:[node.value],den:[1],originalDen:[1],domainComplete:true};
 if(node.kind==='sym'){
  if(node.name===variable)return{num:[0,1],den:[1],originalDen:[1],domainComplete:true};
  const c=evaluateConstantNode(node); return c===null?null:{num:[c],den:[1],originalDen:[1],domainComplete:true};
 }
 if(node.kind==='func'){
  const c=evaluateConstantNode(node); return c===null?null:{num:[c],den:[1],originalDen:[1],domainComplete:true};
 }
 if(node.kind==='neg'){const r=visit(node.value,variable,maxDegree);return r?{...r,num:polynomialScale(r.num,-1)}:null;}
 const A=visit(node.left,variable,maxDegree); if(!A)return null;
 if(node.op==='^'){
  const e=evaluateConstantNode(node.right); if(e===null||!Number.isInteger(e)||Math.abs(e)>12)return null;
  if(e===0)return{num:[1],den:[1],originalDen:A.originalDen,domainComplete:A.domainComplete};
  const n=Math.abs(e); const an=polynomialPow(A.num,n,maxDegree),ad=polynomialPow(A.den,n,maxDegree),ao=polynomialPow(A.originalDen,n,maxDegree);if(!an||!ad||!ao)return null;
  if(e>0)return{num:an,den:ad,originalDen:ao,domainComplete:A.domainComplete};
  const extra=polynomialMul(ao,an,maxDegree); if(!extra)return null;
  return{num:ad,den:an,originalDen:extra,domainComplete:A.domainComplete};
 }
 const B=visit(node.right,variable,maxDegree);if(!B)return null;
 const origAB=combineOriginalDen(A.originalDen,B.originalDen,maxDegree);if(!origAB)return null;
 const complete=A.domainComplete&&B.domainComplete;
 if(node.op==='+'||node.op==='-'){
  const ad=polynomialMul(A.num,B.den,maxDegree),bc=polynomialMul(B.num,A.den,maxDegree),den=polynomialMul(A.den,B.den,maxDegree);if(!ad||!bc||!den)return null;
  return{num:node.op==='+'?polynomialAdd(ad,bc):polynomialSub(ad,bc),den,originalDen:origAB,domainComplete:complete};
 }
 if(node.op==='*'){
  const num=polynomialMul(A.num,B.num,maxDegree),den=polynomialMul(A.den,B.den,maxDegree);if(!num||!den)return null;return{num,den,originalDen:origAB,domainComplete:complete};
 }
 if(node.op==='/'){
  const num=polynomialMul(A.num,B.den,maxDegree),den=polynomialMul(A.den,B.num,maxDegree);if(!num||!den)return null;
  const originalDen=polynomialMul(origAB,B.num,maxDegree);if(!originalDen)return null;
  return{num,den,originalDen,domainComplete:complete};
 }
 return null;
}

export function parseRationalPolynomial(expr:string,variable='x',maxDegree=12):RationalPolynomial|null{
 try{const raw=visit(parseExpressionCore(expr),variable,maxDegree);if(!raw||isZeroPoly(raw.den))return null;const reduced=reducePair(raw.num,raw.den);return{...raw,num:reduced.num,den:reduced.den,originalDen:trim(raw.originalDen)};}catch{return null;}
}

export function rationalValue(r:RationalPolynomial,x:number):number|null{const d=polynomialValue(r.den,x);if(d===0)return null;const v=polynomialValue(r.num,x)/d;return Number.isFinite(v)?v:null;}

export function realPolynomialRoots(p0:Polynomial):number[]|null{
 const t=trim(p0),scale=Math.max(...t.map(Math.abs));if(scale===0)return[];const p=t.map(v=>v/scale),deg=polynomialDegree(p); if(deg===0)return[];
 if(deg===1){const b=p[1],c=p[0];return[-c/b];}
 if(deg===2){const a=p[2],b=p[1],c=p[0];const d=b*b-4*a*c,tol=64*Number.EPSILON*Math.max(b*b,Math.abs(4*a*c));if(d<-tol)return[];if(Math.abs(d)<=tol)return[-b/(2*a)];const s=Math.sqrt(Math.max(0,d));const q=-.5*(b+(b>=0?s:-s));const r1=q/a,r2=c/q;return[r1,r2].sort((x,y)=>x-y);}
 return null;
}

export function rationalExcludedPoints(r:RationalPolynomial):{points:number[];complete:boolean}{const roots=realPolynomialRoots(r.originalDen);return{points:roots?roots.filter(Number.isFinite).sort((a,b)=>a-b):[],complete:roots!==null&&r.domainComplete};}

function syntheticDivideByRoot(p0:Polynomial,root:number):{q:Polynomial;rem:number}{const p=trim(p0),n=p.length-1;if(n<=0)return{q:[0],rem:p[0]||0};const q=Array(n).fill(0);q[n-1]=p[n];for(let i=n-1;i>=1;i--)q[i-1]=p[i]+root*q[i];const rem=p[0]+root*q[0];return{q:trim(q),rem};}
export function rootMultiplicity(p0:Polynomial,root:number):number{let p=trim(p0),m=0;for(let i=0;i<12&&polynomialDegree(p)>0;i++){const d=syntheticDivideByRoot(p,root);let scale=0;for(let j=p.length-1;j>=0;j--)scale=scale*Math.abs(root)+Math.abs(p[j]);if(Math.abs(d.rem)>1e-7*scale)break;m++;p=d.q;}return m;}

export function rationalLimitAtFinite(r:RationalPolynomial,x0:number,side:'left'|'right'|'both'='both'):{value:string;exact:boolean;detail:string}{
 const n=polynomialValue(r.num,x0),d=polynomialValue(r.den,x0);if(Math.abs(d)>EPS){const v=n/d;return{value:Number.isInteger(v)?String(v):String(Math.round(v*1e10)/1e10),exact:true,detail:'Substitution dans la fraction rationnelle réduite.'};}
 const mn=rootMultiplicity(r.num,x0),md=rootMultiplicity(r.den,x0);if(md===0)return{value:'?',exact:false,detail:'Comportement local non déterminé.'};
 if(mn>=md){let num=r.num.slice(),den=r.den.slice();for(let i=0;i<Math.min(mn,md);i++){num=syntheticDivideByRoot(num,x0).q;den=syntheticDivideByRoot(den,x0).q;}const dv=polynomialValue(den,x0),nv=polynomialValue(num,x0);if(Math.abs(dv)>EPS){const v=nv/dv;return{value:Number.isInteger(v)?String(v):String(Math.round(v*1e10)/1e10),exact:true,detail:'Facteur commun simplifié : discontinuité amovible.'};}}
 const order=md-mn;let num=r.num.slice(),den=r.den.slice();for(let i=0;i<mn;i++){num=syntheticDivideByRoot(num,x0).q;den=syntheticDivideByRoot(den,x0).q;}for(let i=0;i<mn;i++){}
 const localNum=polynomialValue(num,x0);let denReduced=den.slice();for(let i=0;i<order;i++)denReduced=syntheticDivideByRoot(denReduced,x0).q;const localDen=polynomialValue(denReduced,x0);const coeff=localNum/localDen;if(!Number.isFinite(coeff)||Math.abs(coeff)<EPS)return{value:'?',exact:false,detail:'Coefficient local nul ou indéterminé.'};
 let sign=Math.sign(coeff);if(side==='left'&&order%2===1)sign*=-1;const inf=sign>=0?'+∞':'-∞';return{value:inf,exact:true,detail:`Pôle d’ordre ${order}; signe local déterminé algébriquement.`};
}

export function rationalLimitAtInfinity(r:RationalPolynomial,positive:boolean):{value:string;exact:boolean;detail:string}{const dn=polynomialDegree(r.num),dd=polynomialDegree(r.den),an=r.num[dn]||0,ad=r.den[dd]||1;if(dn<dd)return{value:'0',exact:true,detail:'Degré du numérateur inférieur à celui du dénominateur.'};if(dn===dd){const v=an/ad;return{value:Number.isInteger(v)?String(v):String(Math.round(v*1e10)/1e10),exact:true,detail:'Rapport des coefficients dominants.'};}const power=dn-dd,coef=an/ad;let sign=Math.sign(coef);if(!positive&&power%2===1)sign*=-1;return{value:sign>=0?'+∞':'-∞',exact:true,detail:`Le terme dominant est de degré ${power} après quotient.`};}


export function formatRationalPolynomial(r:RationalPolynomial,variable='x'):string{
 const num=formatPolynomial(r.num,variable),den=formatPolynomial(r.den,variable);
 if(polynomialDegree(r.den)===0){const d=r.den[0]||1;if(Math.abs(d-1)<EPS)return num;}
 return `(${num})/(${den})`;
}

export function rationalEquivalent(a:RationalPolynomial,b:RationalPolynomial,tol=1e-9):boolean{
 const left=polynomialMul(a.num,b.den,30),right=polynomialMul(b.num,a.den,30);if(!left||!right)return false;
 const n=Math.max(left.length,right.length);for(let i=0;i<n;i++){const x=left[i]||0,y=right[i]||0;if(Math.abs(x-y)>tol*Math.max(Math.abs(x),Math.abs(y)))return false;}
 const ea=rationalExcludedPoints(a),eb=rationalExcludedPoints(b);if(!ea.complete||!eb.complete)return false;
 if(ea.points.length!==eb.points.length)return false;return ea.points.every((x,i)=>Math.abs(x-eb.points[i])<=tol*Math.max(1,Math.abs(x),Math.abs(eb.points[i])));
}

export function rationalProportional(a:RationalPolynomial,b:RationalPolynomial,tol=1e-9):boolean{
 const ea=rationalExcludedPoints(a),eb=rationalExcludedPoints(b);if(!ea.complete||!eb.complete||ea.points.length!==eb.points.length)return false;
 if(!ea.points.every((x,i)=>Math.abs(x-eb.points[i])<=tol*Math.max(1,Math.abs(x),Math.abs(eb.points[i]))))return false;
 const left=polynomialMul(a.num,b.den,30),right=polynomialMul(b.num,a.den,30);if(!left||!right)return false;
 const n=Math.max(left.length,right.length);let ratio:number|null=null;
 for(let i=0;i<n;i++){
  const x=left[i]||0,y=right[i]||0;
  if(x===0&&y===0)continue;
  if(x===0||y===0)return false;
  const r=x/y;if(!Number.isFinite(r)||r===0)return false;
  if(ratio===null)ratio=r;else if(Math.abs(r-ratio)>tol*Math.max(Math.abs(r),Math.abs(ratio)))return false;
 }
 return ratio!==null;
}

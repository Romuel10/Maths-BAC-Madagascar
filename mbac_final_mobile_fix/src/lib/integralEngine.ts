import { parseExpressionCore, evaluateConstantNode } from './expressionCore.js';
import { parsePolynomial, polynomialDegree, type Polynomial } from './polynomialEngine.js';
import { serializeNode, type DNode } from './derivativeEngine.js';

export interface ExactIntegralCandidate { value:number; primitive:string; exactResultExpr:string; method:string; steps:string[]; }
export interface ExactPrimitiveCandidate { primitive:string; method:string; steps:string[]; }
const EPS=1e-12;
const fmt=(n:number)=>{const r=Math.abs(n-Math.round(n))<1e-10?Math.round(n):Math.round(n*1e10)/1e10;return String(r);};
function gcd(a:number,b:number){a=Math.abs(Math.round(a));b=Math.abs(Math.round(b));while(b){const t=a%b;a=b;b=t;}return a||1;}
function fraction(v:number,maxDen=5000):string{if(!Number.isFinite(v))return fmt(v);if(Math.abs(v-Math.round(v))<1e-11)return String(Math.round(v));let bn=Math.round(v),bd=1,be=Math.abs(v-bn);for(let d=2;d<=maxDen;d++){const n=Math.round(v*d),e=Math.abs(v-n/d);if(e<be){bn=n;bd=d;be=e;}if(e<1e-12)break;}if(be<1e-9){const g=gcd(bn,bd);return `${bn/g}/${bd/g}`;}return fmt(v);}
function polyPrimitiveString(p:Polynomial):string{const out:string[]=[];for(let i=p.length-1;i>=0;i--){const c=p[i]||0;if(Math.abs(c)<EPS)continue;const pow=i+1,q=c/pow,abs=Math.abs(q),sg=q<0?'-':'+';let body='';if(pow===1)body=Math.abs(abs-1)<EPS?'x':`${fmt(abs)}*x`;else body=Math.abs(abs-1)<EPS?`x^${pow}`:`${fraction(abs)}*x^${pow}`;if(!out.length)out.push(sg==='-'?`-${body}`:body);else out.push(`${sg}${body}`);}return out.join('')||'0';}
function evalPolyPrimitive(p:Polynomial,x:number){let s=0;for(let i=0;i<p.length;i++)s+=(p[i]||0)*Math.pow(x,i+1)/(i+1);return s;}
function affineFromNode(node:DNode):{a:number;b:number}|null{try{const p=parsePolynomial(serializeNode(node),'x',1);if(!p||polynomialDegree(p)>1)return null;return{a:p[1]||0,b:p[0]||0};}catch{return null;}}
function scalarTimes(node:DNode):{k:number;core:DNode}{if(node.kind==='neg')return{k:-1,core:node.value};if(node.kind==='bin'&&node.op==='*'){const l=evaluateConstantNode(node.left);if(l!==null)return{k:l,core:node.right};const r=evaluateConstantNode(node.right);if(r!==null)return{k:r,core:node.left};}return{k:1,core:node};}
function evaluatePrimitive(kind:string,k:number,a:number,b:number,x:number,n?:number):number{const u=a*x+b;if(kind==='sin')return-k*Math.cos(u)/a;if(kind==='cos')return k*Math.sin(u)/a;if(kind==='exp')return k*Math.exp(u)/a;if(kind==='log')return(k/a)*Math.log(Math.abs(u));if(kind==='power')return k*Math.pow(u,(n as number)+1)/(a*((n as number)+1));return NaN;}


export function tryExactPrimitive(expr:string):ExactPrimitiveCandidate|null{
 const poly=parsePolynomial(expr,'x',12);
 if(poly){
  const primitive=polyPrimitiveString(poly);
  return{primitive,method:'Primitive exacte — polynôme',steps:[`On reconnaît un polynôme.`,`On intègre terme par terme : ∫a·x^n dx = a·x^(n+1)/(n+1).`,`Une primitive est F(x)=${primitive}.`]};
 }
 let root:DNode;try{root=parseExpressionCore(expr);}catch{return null;}
 const {k,core}=scalarTimes(root);
 if(core.kind==='func'&&['sin','cos','exp'].includes(core.name)){
  const aff=affineFromNode(core.arg);
  if(aff&&Math.abs(aff.a)>EPS){
   const kind=core.name,coef=kind==='sin'?-k/aff.a:k/aff.a;
   const primitive=kind==='sin'?`${fmt(coef)}*cos(${serializeNode(core.arg)})`:kind==='cos'?`${fmt(coef)}*sin(${serializeNode(core.arg)})`:`${fmt(coef)}*exp(${serializeNode(core.arg)})`;
   return{primitive,method:'Primitive exacte — composition affine',steps:[`On reconnaît ${kind}(u(x)) avec u(x)=${serializeNode(core.arg)} et u'(x)=${fmt(aff.a)}.`,`On compense le coefficient u'(x)=${fmt(aff.a)}.`,`Une primitive est F(x)=${primitive}.`]};
  }
 }
 if(core.kind==='bin'&&core.op==='/'){
  const nconst=evaluateConstantNode(core.left),aff=affineFromNode(core.right);
  if(nconst!==null&&aff&&Math.abs(aff.a)>EPS){
   const kk=k*nconst, primitive=`${fmt(kk/aff.a)}*log(abs(${serializeNode(core.right)}))`;
   return{primitive,method:'Primitive exacte — logarithme',steps:[`On reconnaît la forme c/(ax+b).`,`On utilise ∫ c/(ax+b) dx = (c/a) ln|ax+b| + C.`,`Une primitive est F(x)=${primitive}.`]};
  }
 }
 if(core.kind==='bin'&&core.op==='^'){
  const aff=affineFromNode(core.left),n=evaluateConstantNode(core.right);
  if(aff&&n!==null&&Number.isFinite(n)&&Math.abs(aff.a)>EPS&&Math.abs(n+1)>EPS){
   const primitive=`${fmt(k/(aff.a*(n+1)))}*(${serializeNode(core.left)})^${fmt(n+1)}`;
   return{primitive,method:'Primitive exacte — puissance composée affine',steps:[`On pose u(x)=${serializeNode(core.left)}, donc u'(x)=${fmt(aff.a)}.`,`On utilise ∫(ax+b)^n dx = (ax+b)^(n+1)/(a(n+1)) pour n≠-1.`,`Une primitive est F(x)=${primitive}.`]};
  }
 }
 return null;
}

export function tryExactDefiniteIntegral(expr:string,lo:number,hi:number):ExactIntegralCandidate|null{
 if(!(lo<hi))return null;
 const poly=parsePolynomial(expr,'x',12);if(poly){const primitive=polyPrimitiveString(poly),Fa=evalPolyPrimitive(poly,lo),Fb=evalPolyPrimitive(poly,hi),value=Fb-Fa;return{value,primitive,exactResultExpr:fraction(value),method:'Primitive exacte — polynôme',steps:[`On reconnaît un polynôme et on intègre terme par terme.`,`Une primitive est F(x)=${primitive}.`,`∫[${fmt(lo)},${fmt(hi)}] f(x)dx = F(${fmt(hi)})-F(${fmt(lo)}).`,`Valeur exacte : ${fraction(value)}.`]};}
 let root:DNode;try{root=parseExpressionCore(expr);}catch{return null;}
 const {k,core}=scalarTimes(root);
 if(core.kind==='func'&&['sin','cos','exp'].includes(core.name)){const aff=affineFromNode(core.arg);if(aff&&Math.abs(aff.a)>EPS){const kind=core.name,coef=kind==='sin'?-k/aff.a:k/aff.a;const primitive=kind==='sin'?`${fmt(coef)}*cos(${serializeNode(core.arg)})`:kind==='cos'?`${fmt(coef)}*sin(${serializeNode(core.arg)})`:`${fmt(coef)}*exp(${serializeNode(core.arg)})`;const Fa=evaluatePrimitive(kind,k,aff.a,aff.b,lo),Fb=evaluatePrimitive(kind,k,aff.a,aff.b,hi),value=Fb-Fa;return{value,primitive,exactResultExpr:fmt(value),method:'Primitive exacte — composition affine',steps:[`On reconnaît ${kind}(${serializeNode(core.arg)}) avec une fonction intérieure affine u(x)=${serializeNode(core.arg)} et u'(x)=${fmt(aff.a)}.`,`On applique la formule usuelle en divisant par le coefficient ${fmt(aff.a)}.`,`Une primitive est F(x)=${primitive}.`,`F(${fmt(hi)})-F(${fmt(lo)}) = ${fmt(value)}.`]};}}
 // k/(ax+b)
 if(core.kind==='bin'&&core.op==='/'){
  const nconst=evaluateConstantNode(core.left),aff=affineFromNode(core.right);if(nconst!==null&&aff&&Math.abs(aff.a)>EPS){const kk=k*nconst,primitive=`${fmt(kk/aff.a)}*log(abs(${serializeNode(core.right)}))`,Fa=evaluatePrimitive('log',kk,aff.a,aff.b,lo),Fb=evaluatePrimitive('log',kk,aff.a,aff.b,hi),value=Fb-Fa;if(Number.isFinite(value))return{value,primitive,exactResultExpr:fmt(value),method:'Primitive exacte — logarithme',steps:[`On reconnaît la forme c/(ax+b).`,`∫ c/(ax+b) dx = (c/a) ln|ax+b| + C.`,`Une primitive est F(x)=${primitive}.`,`F(${fmt(hi)})-F(${fmt(lo)}) = ${fmt(value)}.`]};}
 }
 // k*(ax+b)^n, n integer or simple finite constant, n != -1
 if(core.kind==='bin'&&core.op==='^'){
  const aff=affineFromNode(core.left),n=evaluateConstantNode(core.right);if(aff&&n!==null&&Number.isFinite(n)&&Math.abs(aff.a)>EPS&&Math.abs(n+1)>EPS){const primitive=`${fmt(k/(aff.a*(n+1)))}*(${serializeNode(core.left)})^${fmt(n+1)}`,Fa=evaluatePrimitive('power',k,aff.a,aff.b,lo,n),Fb=evaluatePrimitive('power',k,aff.a,aff.b,hi,n),value=Fb-Fa;if(Number.isFinite(value))return{value,primitive,exactResultExpr:fraction(value),method:'Primitive exacte — puissance composée affine',steps:[`On pose u(x)=${serializeNode(core.left)}, donc u'(x)=${fmt(aff.a)}.`,`On utilise ∫u^n dx = u^(n+1)/(a(n+1)) lorsque u=ax+b.`,`Une primitive est F(x)=${primitive}.`,`F(${fmt(hi)})-F(${fmt(lo)}) = ${fraction(value)}.`]};}
 }
 return null;
}

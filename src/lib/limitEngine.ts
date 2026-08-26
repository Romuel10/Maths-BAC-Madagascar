import { parseExpressionCore, evaluateConstantNode } from './expressionCore.js';
import type { DNode } from './derivativeEngine.js';
import { parseRationalPolynomial, rationalLimitAtInfinity } from './rationalEngine.js';
import { parsePolynomial, polynomialDegree, polynomialValue } from './polynomialEngine.js';

export interface ExactLimitResult { value:string; detail:string; exact:true; }

type Ext = { kind:'finite'; value:number } | { kind:'posInf' } | { kind:'negInf' } | { kind:'unknown' };
const U:Ext={kind:'unknown'};
const fin=(value:number):Ext=>Number.isFinite(value)?{kind:'finite',value}:U;
const pos:Ext={kind:'posInf'}, neg:Ext={kind:'negInf'};
const EPS=1e-12;

function fmt(n:number):string {
 if(Math.abs(n)<1e-12)n=0;
 if(Math.abs(n-Math.round(n))<1e-10)return String(Math.round(n));
 const nice:[number,string][]=[[Math.PI,'π'],[-Math.PI,'-π'],[Math.E,'e'],[-Math.E,'-e'],[.5,'1/2'],[-.5,'-1/2'],[1/3,'1/3'],[-1/3,'-1/3']];
 for(const [v,s] of nice)if(Math.abs(n-v)<1e-9)return s;
 return String(Math.round(n*1e10)/1e10);
}
function signOf(x:Ext):number|null { if(x.kind==='posInf')return 1;if(x.kind==='negInf')return -1;if(x.kind==='finite')return Math.sign(x.value);return null; }
function opposite(x:Ext):Ext { if(x.kind==='posInf')return neg;if(x.kind==='negInf')return pos;if(x.kind==='finite')return fin(-x.value);return U; }
function add(a:Ext,b:Ext,sub=false):Ext {
 if(sub)b=opposite(b);
 if(a.kind==='unknown'||b.kind==='unknown')return U;
 if(a.kind==='finite'&&b.kind==='finite')return fin(a.value+b.value);
 if(a.kind==='finite')return b; if(b.kind==='finite')return a;
 return a.kind===b.kind?a:U;
}
function mul(a:Ext,b:Ext):Ext {
 if(a.kind==='unknown'||b.kind==='unknown')return U;
 if(a.kind==='finite'&&b.kind==='finite')return fin(a.value*b.value);
 if((a.kind==='finite'&&Math.abs(a.value)<EPS)||(b.kind==='finite'&&Math.abs(b.value)<EPS))return U;
 const s=(signOf(a)??0)*(signOf(b)??0);return s>0?pos:s<0?neg:U;
}
function div(a:Ext,b:Ext):Ext {
 if(a.kind==='unknown'||b.kind==='unknown')return U;
 if(a.kind==='finite'&&b.kind==='finite')return Math.abs(b.value)<EPS?U:fin(a.value/b.value);
 if(a.kind==='finite'&&(b.kind==='posInf'||b.kind==='negInf'))return fin(0);
 if((a.kind==='posInf'||a.kind==='negInf')&&b.kind==='finite'&&Math.abs(b.value)>EPS){const s=(signOf(a)??0)*Math.sign(b.value);return s>0?pos:neg;}
 return U;
}
function powExt(a:Ext,b:Ext):Ext {
 if(a.kind==='unknown'||b.kind==='unknown')return U;
 if(a.kind==='finite'&&b.kind==='finite'){
  const v=Math.pow(a.value,b.value);return Number.isFinite(v)?fin(v):U;
 }
 if((a.kind==='posInf'||a.kind==='negInf')&&b.kind==='finite'){
  const e=b.value;if(Math.abs(e)<EPS)return fin(1);if(e<0)return fin(0);
  if(a.kind==='posInf')return pos;
  if(Number.isInteger(e))return Math.abs(Math.round(e))%2===0?pos:neg;
  return U;
 }
 if(a.kind==='finite'&&(b.kind==='posInf'||b.kind==='negInf')){
  const base=a.value;if(base<=0)return U;if(Math.abs(base-1)<EPS)return fin(1);
  const positiveExponent=b.kind==='posInf';
  if(base>1)return positiveExponent?pos:fin(0);
  if(base>0&&base<1)return positiveExponent?fin(0):pos;
 }
 return U;
}
function evalNode(node:DNode,positive:boolean):Ext {
 if(node.kind==='num')return fin(node.value);
 if(node.kind==='sym'){
  if(node.name==='x')return positive?pos:neg;
  const c=evaluateConstantNode(node);return c===null?U:fin(c);
 }
 if(node.kind==='neg')return opposite(evalNode(node.value,positive));
 if(node.kind==='bin'){
  const a=evalNode(node.left,positive),b=evalNode(node.right,positive);
  if(node.op==='+')return add(a,b);if(node.op==='-')return add(a,b,true);if(node.op==='*')return mul(a,b);if(node.op==='/')return div(a,b);return powExt(a,b);
 }
 const u=evalNode(node.arg,positive);
 if(node.name==='exp'){if(u.kind==='posInf')return pos;if(u.kind==='negInf')return fin(0);if(u.kind==='finite')return fin(Math.exp(u.value));return U;}
 if(node.name==='log'){if(u.kind==='posInf')return pos;if(u.kind==='finite'&&u.value>0)return fin(Math.log(u.value));return U;}
 if(node.name==='sqrt'){if(u.kind==='posInf')return pos;if(u.kind==='finite'&&u.value>=0)return fin(Math.sqrt(u.value));return U;}
 if(node.name==='abs'){if(u.kind==='posInf'||u.kind==='negInf')return pos;if(u.kind==='finite')return fin(Math.abs(u.value));return U;}
 if((node.name==='sin'||node.name==='cos'||node.name==='tan')&&u.kind==='finite'){
  const v=node.name==='sin'?Math.sin(u.value):node.name==='cos'?Math.cos(u.value):Math.tan(u.value);return fin(v);
 }
 return U;
}
function extToResult(v:Ext,detail:string):ExactLimitResult|null { if(v.kind==='unknown')return null;if(v.kind==='posInf')return{value:'+∞',detail,exact:true};if(v.kind==='negInf')return{value:'-∞',detail,exact:true};return{value:fmt(v.value),detail,exact:true}; }

export function exactLimitAtInfinity(expr:string,positive:boolean):ExactLimitResult|null {
 const rat=parseRationalPolynomial(expr,'x',20);
 if(rat){const r=rationalLimitAtInfinity(rat,positive);if(r.exact&&r.value!=='?')return{value:r.value,detail:`Fraction rationnelle : ${r.detail}`,exact:true};}
 try{
  const v=evalNode(parseExpressionCore(expr),positive);
  return extToResult(v,'Limite obtenue par règles exactes de composition sur les fonctions élémentaires prises en charge.');
 }catch{return null;}
}

// Boundary rules intentionally narrow: only cases that can be proved from an affine inner expression.
export function exactElementaryBoundaryLimit(expr:string,target:number,side:'left'|'right'):ExactLimitResult|null {
 let root:DNode;try{root=parseExpressionCore(expr);}catch{return null;}
 let k=1,core=root;
 if(core.kind==='neg'){k=-1;core=core.value;}
 if(core.kind==='bin'&&core.op==='*'){
  const lc=evaluateConstantNode(core.left),rc=evaluateConstantNode(core.right);
  if(lc!==null){k*=lc;core=core.right;}else if(rc!==null){k*=rc;core=core.left;}
 }
 if(core.kind!=='func'||(core.name!=='log'&&core.name!=='sqrt'))return null;
 const p=parsePolynomial((()=>{const ser=(n:DNode):string=>n.kind==='num'?String(n.value):n.kind==='sym'?n.name:n.kind==='neg'?`-(${ser(n.value)})`:n.kind==='func'?`${n.name}(${ser(n.arg)})`:`(${ser(n.left)})${n.op}(${ser(n.right)})`;return ser(core.arg);})(),'x',1);
 if(!p||polynomialDegree(p)>1)return null;
 const a=p[1]||0,b=p[0]||0;if(Math.abs(a)<EPS||Math.abs(polynomialValue(p,target))>1e-8*Math.max(1,Math.abs(a),Math.abs(b)))return null;
 const inwardSign=a*(side==='right'?1:-1);
 if(inwardSign<=0)return null; // this side is outside the real domain near the boundary
 if(core.name==='sqrt')return{value:'0',detail:'Racine d’une expression affine tendant vers 0 par valeurs positives.',exact:true};
 // ln(u) -> -∞ as u -> 0+
 return{value:k>0?'-∞':k<0?'+∞':'0',detail:'Logarithme d’une expression affine tendant vers 0 par valeurs positives.',exact:true};
}

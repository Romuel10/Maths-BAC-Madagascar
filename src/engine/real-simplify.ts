import {math,source,exact,parse} from './expression';
import type {MathNode} from 'mathjs';

type Rational={n:bigint;d:bigint};
const gcd=(a:bigint,b:bigint):bigint=>b?gcd(b,a%b):a<0n?-a:a;
const rational=(n:bigint,d=1n):Rational=>{if(!d)throw new Error('Division par zéro dans la formule.');const g=gcd(n,d);return {n:n/g*(d<0n?-1n:1n),d:d/g*(d<0n?-1n:1n)};};
const add=(a:Rational,b:Rational)=>rational(a.n*b.d+b.n*a.d,a.d*b.d);
const mul=(a:Rational,b:Rational)=>rational(a.n*b.n,a.d*b.d);
const one=()=>rational(1n),neg=(a:Rational)=>rational(-a.n,a.d);
const unwrap=(n:any):any=>n.isParenthesisNode?unwrap(n.content):n;
const integer=(n:bigint)=>new math.ConstantNode(math.bignumber(String(n)));
const op=(name:'+'|'-'|'*'|'/'|'^',args:any[])=>new math.OperatorNode(name,({'+':'add','-':args.length===1?'unaryMinus':'subtract','*':'multiply','/':'divide','^':'pow'} as const)[name],args);
const product=(nodes:any[])=>nodes.length?nodes.reduce((a,b)=>op('*',[a,b])):integer(1n);

export function rationalValue(node:any):Rational|null {
 const n=unwrap(node);let constant=true;
 n.traverse((v:any)=>{if(v.isSymbolNode||v.isFunctionNode)constant=false;});
 if(!constant)return null;
 try{const m=exact(source(n)).match(/^(-?\d+)(?:\/(\d+))?$/);return m?rational(BigInt(m[1]),BigInt(m[2]??1)):null;}catch{return null;}
}
const rationalNode=(p:Rational)=>p.d===1n?integer(p.n):op('/',[integer(p.n),integer(p.d)]);
function key(node:any):string {
 const n=unwrap(node);if(n.isConstantNode)return 'c:'+String(n.value);if(n.isSymbolNode)return 's:'+n.name;
 const args=(n.args??[]).map(key);if(n.isOperatorNode&&['+','*'].includes(n.op))args.sort();
 return (n.isFunctionNode?'f:'+n.fn.name:'o:'+n.op)+'('+args.join(',')+')';
}
interface Factor {node:any;p:Rational;}
interface Monomial {coefficient:Rational;factors:Map<string,Factor>;}
function put(m:Monomial,node:any,p:Rational){const k=key(node),old=m.factors.get(k);m.factors.set(k,{node,p:old?add(old.p,p):p});}
function collect(node:any):Monomial {
 const result:Monomial={coefficient:one(),factors:new Map()};
 const take=(node:any,inverse=false)=>{
  const n=unwrap(node),value=rationalValue(n);
  if(value){result.coefficient=mul(result.coefficient,inverse?rational(value.d,value.n):value);return;}
  if(n.isOperatorNode){
   if(n.args.length===1&&['-','+'].includes(n.op)){if(n.op==='-')result.coefficient=neg(result.coefficient);take(n.args[0],inverse);return;}
   if(n.op==='*'){n.args.forEach((a:any)=>take(a,inverse));return;}
   if(n.op==='/'){take(n.args[0],inverse);take(n.args[1],!inverse);return;}
   if(n.op==='^'){const p=rationalValue(n.args[1]);if(p){put(result,n.args[0],inverse?neg(p):p);return;}}
  }
  put(result,n,rational(inverse?-1n:1n));
 };
 take(node);
 // u² = |u|². This removes removable holes such as |u|³/u = u|u|
 // in a derivative. The caller always retains the original function domain.
 for(const factor of result.factors.values()){
  const n=unwrap(factor.node);if(!n.isFunctionNode||n.fn.name!=='abs')continue;
  const base=result.factors.get(key(n.args[0]));if(!base||base.p.d!==1n)continue;
  const parity=(base.p.n%2n+2n)%2n;
  factor.p=add(factor.p,rational(base.p.n-parity));base.p=rational(parity);
 }
 return result;
}
function build(m:Monomial):any {
 if(m.coefficient.n===0n)return integer(0n);
 const numerator:any[]=[],denominator:any[]=[];
 const factors=[...m.factors.values()].filter(f=>f.p.n!==0n).sort((a,b)=>Number(!unwrap(a.node).isSymbolNode)-Number(!unwrap(b.node).isSymbolNode));
 for(const {node,p} of factors){const q=p.n<0n?neg(p):p,term=q.n===q.d?node:op('^',[node,new math.ParenthesisNode(rationalNode(q))]);(p.n>0n?numerator:denominator).push(term);}
 const magnitude=m.coefficient.n<0n?-m.coefficient.n:m.coefficient.n;
 if(magnitude!==1n||!numerator.length)numerator.unshift(integer(magnitude));
 if(m.coefficient.d!==1n)denominator.unshift(integer(m.coefficient.d));
 const value=denominator.length?op('/',[product(numerator),product(denominator)]):product(numerator);
 return m.coefficient.n<0n?op('-',[value]):value;
}
function polynomial(node:any):boolean {
 let safe=true,count=0;node.traverse((n:any)=>{
  if(++count>70||n.isFunctionNode)safe=false;
  if(n.isOperatorNode&&n.op==='^'){const p=rationalValue(n.args[1]);if(!p||p.d!==1n||p.n<0n||p.n>16n)safe=false;}
 });return safe;
}
function sum(node:any):any {
 const terms:Monomial[]=[];
 const read=(node:any,sign=1n)=>{
  const n=unwrap(node);
  if(n.isOperatorNode&&n.op==='+'){n.args.forEach((a:any)=>read(a,sign));return;}
  if(n.isOperatorNode&&n.op==='-'){read(n.args[0],n.args.length===1?-sign:sign);if(n.args.length>1)read(n.args[1],-sign);return;}
  const term=collect(n);term.coefficient=mul(term.coefficient,rational(sign));terms.push(term);
 };read(node);
 const denominator:Monomial={coefficient:one(),factors:new Map()};
 let coefficient=1n;
 for(const term of terms){
  coefficient=coefficient/gcd(coefficient,term.coefficient.d)*term.coefficient.d;
  for(const [k,f] of term.factors)if(f.p.n<0n){const p=neg(f.p),old=denominator.factors.get(k);if(!old||p.n*old.p.d>old.p.n*p.d)denominator.factors.set(k,{node:f.node,p});}
 }
 denominator.coefficient=rational(coefficient);
 const like=new Map<string,Monomial>();
 for(const term of terms){
  term.coefficient=mul(term.coefficient,denominator.coefficient);
  for(const f of denominator.factors.values())put(term,f.node,f.p);
  const k=[...term.factors].filter(([,f])=>f.p.n).sort(([a],[b])=>a.localeCompare(b)).map(([k,f])=>k+':'+f.p.n+'/'+f.p.d).join('|');
  const old=like.get(k);if(old)old.coefficient=add(old.coefficient,term.coefficient);else like.set(k,term);
 }
 const active=[...like.values()].filter(m=>m.coefficient.n),common:Monomial={coefficient:one(),factors:new Map()};
 if(active.length>1){
  common.coefficient=rational(active.map(m=>m.coefficient.n).reduce(gcd));
  for(const [k,f] of active[0].factors){
   let p=f.p;for(const term of active){const other=term.factors.get(k)?.p??rational(0n);if(other.n*p.d<p.n*other.d)p=other;}
   if(p.n>0n)common.factors.set(k,{node:f.node,p});
  }
  for(const term of active){term.coefficient=mul(term.coefficient,rational(common.coefficient.d,common.coefficient.n));for(const f of common.factors.values())put(term,f.node,neg(f.p));}
 }
 const values=active.map(build);
 let numerator=values.length?values.reduce((a,b)=>op('+',[a,b])):integer(0n);
 if(polynomial(numerator))try{numerator=parse(exact(source(numerator)));}catch{}
 return build(collect(op('/',[op('*',[build(common),numerator]),build(denominator)])));
}

// Algebra in the real domain: collect rational powers of the SAME base;
// never replace sqrt(u²) by u or distribute roots over arbitrary products.
export function simplifyReal(node:MathNode):MathNode {
 const visit=(node:any):any=>{
  const n=unwrap(node).map((child:any)=>visit(child));
  if(n.isOperatorNode&&['+','-'].includes(n.op)&&n.args.length>1)return sum(n);
  if(n.isOperatorNode&&['*','/','^','-'].includes(n.op))return build(collect(n));
  return n;
 };
 return visit(node);
}

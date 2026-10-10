import {cas,parse,source,exact,simplified,asReal} from './expression';
import {coefficients,roots} from './algebra';

export interface ZeroSet {values:string[];identity:boolean;}
function unwrap(n:any):any{return n.isParenthesisNode?unwrap(n.content):n;}
function constant(n:any):boolean {let variable=false;n.traverse((v:any)=>{if(v.isSymbolNode&&v.name==='x')variable=true;});return !variable;}
// Exhaustive finite zeros, obtained by polynomial solving or invertible steps.
// Unresolved sums and periodic functions deliberately return null.
export function finiteZeros(raw:string,target='0',depth=0):ZeroSet|null {
 if(depth>14)return null;
 const residual=target==='0'?raw:'('+raw+')-('+target+')';
 if(simplified(residual)==='0')return {values:[],identity:true};
 const co=coefficients(residual);
 if(co&&co.length<=3){const r=roots(residual);if(r.values.some(v=>Math.abs(asReal(v))===Infinity||asReal(v)===0&&exact(v)!=='0'))return null;if(r.complete&&!r.numeric&&!r.family)return {values:r.values.filter(v=>Number.isFinite(asReal(v))),identity:false};}
 else if(co){
  // Higher-degree CAS solving can spend seconds producing numerical roots
  // that still require our bounded search. Resolve exact factors first.
  try{const factored=cas.factor(residual).toString(),n=unwrap(parse(factored));if(factored!==residual&&n.isOperatorNode&&['*','^'].includes(n.op))return finiteZeros(factored,'0',depth+1);}catch{}
 }
 const n=unwrap(parse(raw));
 if(constant(n))return {values:[],identity:false};
 const descend=(node:any,value:string)=>finiteZeros(source(node),value,depth+1);
 if(n.isFunctionNode){
  if(n.fn.name==='cosh'&&asReal(target)<1)return {values:[],identity:false};
  if(n.fn.name==='sinh'&&target==='0')return descend(n.args[0],'0');
  if(['sec','csc'].includes(n.fn.name)&&target==='0')return {values:[],identity:false};
  if(n.fn.name==='log')return descend(n.args[0],exact('exp('+target+')'));
  if(n.fn.name==='exp'){const value=asReal(target);if((value===0&&exact(target)!=='0')||!Number.isFinite(value))return null;if(value<=0)return {values:[],identity:false};return descend(n.args[0],exact('log('+target+')'));}
  if(['sqrt','cbrt','abs','sign'].includes(n.fn.name)&&target==='0')return descend(n.args[0],'0');
  if(n.fn.name==='sqrt'&&Number.isFinite(asReal(target)))return asReal(target)<0?{values:[],identity:false}:descend(n.args[0],exact('('+target+')^2'));
  if(n.fn.name==='cbrt')return descend(n.args[0],exact('('+target+')^3'));
 }
 if(n.isOperatorNode){
  const [a,b]=n.args;
  if(n.args.length===1)return descend(a,n.op==='-'?exact('-('+target+')'):target);
  if(n.op==='^'){
   if(constant(a)&&asReal(source(a))>0&&asReal(source(a))!==1){const value=asReal(target);if((value===0&&exact(target)!=='0')||!Number.isFinite(value))return null;if(value<=0)return {values:[],identity:false};return descend(b,exact('log('+target+')/log('+source(a)+')'));}
   if(constant(b)&&target==='0'){const p=asReal(source(b));if(p<0)return {values:[],identity:false};if(p>0)return descend(a,'0');}
  }
  if(target==='0'&&(n.op==='*'||n.op==='/')){
   const left=descend(a,'0');if(n.op==='/')return left;
   const right=descend(b,'0');if(!left||!right)return null;
   return {values:[...new Set([...left.values,...right.values])],identity:left.identity||right.identity};
  }
  const ca=constant(a),cb=constant(b);
  if(ca!==cb){
   const c=source(ca?a:b),variable=ca?b:a;let value:string|undefined;
   if(n.op==='+')value='('+target+')-('+c+')';
   if(n.op==='-')value=ca?'('+c+')-('+target+')':'('+target+')+('+c+')';
   if(n.op==='*'&&asReal(c)!==0)value='('+target+')/('+c+')';
   if(n.op==='/'&&!ca)value='('+target+')*('+c+')';
   if(n.op==='/'&&ca&&asReal(target)!==0)value='('+c+')/('+target+')';
   if(value!==undefined)return descend(variable,exact(value));
  }
 }
 if(depth===0){try{const factored=cas.factor(raw).toString();if(factored!==raw)return finiteZeros(factored,target,depth+1);}catch{}}
 return null;
}

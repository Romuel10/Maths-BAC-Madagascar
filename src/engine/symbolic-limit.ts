import {cas,parse,source,exact,simplified,asReal,onlyVariables,substitute,checkConstantDomain,math} from './expression';
import {realForm,differentiate} from './differentiation';
import {coefficients} from './algebra';

// Evaluate real constants without sending an odd root of a negative number
// through the CAS's principal complex branch.
export function realConstant(raw:string):string|null {
 try{
  onlyVariables(raw,[]);if(!checkConstantDomain(raw))return null;
  const value=exact(source(realForm(raw)));
  return Number.isFinite(asReal(value))?value:null;
 }catch{return null;}
}

export function constantSign(value:string):number|null {
 try{const n=math.bignumber(cas(value).numeric(80).toString());return n.isFinite()?n.cmp(0):null;}catch{return null;}
}
export function localSigns(raw:string,at:string):{left:number|null;right:number|null} {
 const value=realConstant(substitute(raw,'x',at)),sign=value===null?null:constantSign(value);
 if(sign!==0)return {left:sign,right:sign};
 let analytic=true;parse(raw).traverse((n:any)=>{
  if(n.isFunctionNode&&!['sin','cos','exp','sinh','cosh','tanh','log','log10','tan','sec','csc','cot','atan'].includes(n.fn.name))analytic=false;
  if(n.isOperatorNode&&n.op==='^')try{if(!/^-?\d+$/.test(exact(source(n.args[1]))))analytic=false;}catch{analytic=false;}
 });
 if(analytic){
  let derivative=raw;
  for(let order=1;order<=8;order++){
   if(simplified(derivative)==='0')return {left:0,right:0};
   try{derivative=differentiate(derivative);}catch{break;}
   const coefficient=realConstant(substitute(derivative,'x',at)),sign=coefficient===null?null:constantSign(coefficient);
   if(sign===null)break;if(sign!==0)return {left:sign*(order%2?-1:1),right:sign};
  }
 }
 return {left:null,right:null};
}
function approachSign(raw:string,at:string,side:string,depth=0):number|null {
 if(depth>10)return null;
 if(!at.includes('Infinity')){const signs=localSigns(raw,at),sign=side==='left'?signs.left:side==='right'?signs.right:signs.left===signs.right?signs.left:null;if(sign!==null)return sign;}
 else{const co=coefficients(raw);if(co){const sign=constantSign(co.at(-1)!);return sign===null?null:sign*(at==='-Infinity'&&(co.length-1)%2?-1:1);}}
 let n:any=parse(raw);while(n.isParenthesisNode)n=n.content;
 if(n.isFunctionNode&&n.fn.name==='exp')return 1;
 const child=(v:any)=>approachSign(source(v),at,side,depth+1);
 if(n.isFunctionNode&&n.fn.name==='abs'){const sign=child(n.args[0]);if(sign!==null)return Math.abs(sign);}
 if(n.isOperatorNode){
  const sign=child(n.args[0]);
  if(n.args.length===1&&sign!==null)return n.op==='-'?-sign:sign;
  if(n.op==='^'){
   const exponent=exact(source(n.args[1])).match(/^(-?\d+)(?:\/(\d+))?$/);
   if(sign===1)return 1;
   if(sign===-1&&exponent&&Number(exponent[2]??1)%2===1)return Number(exponent[1])%2?-1:1;
  }
  if(n.op==='*'||n.op==='/'){const other=child(n.args[1]);if(sign!==null&&other!==null&&(n.op==='*'||other!==0))return sign*other;}
 }
 return null;
}
function branchForm(raw:string,at:string,side:string):string {
 const visit=(node:any):any=>{
  const n=node.map((child:any)=>visit(child));
  if(n.isFunctionNode&&n.fn.name==='abs'){
   const a=source(n.args[0]),sign=approachSign(a,at,side);
   if(sign!==null)return sign<0?math.parse('-('+a+')'):sign>0?n.args[0]:math.parse('0');
  }
  if(n.isOperatorNode&&n.op==='^'){
   const q=exact(source(n.args[1])).match(/^(-?\d+)\/(\d+)$/);
   if(q&&Number(q[2])%2===1&&approachSign(source(n.args[0]),at,side)===-1)return math.parse('('+(Number(q[1])%2?'-':'')+'(-('+source(n.args[0])+'))^('+source(n.args[1])+'))');
  }
  return n;
 };
 return source(visit(realForm(raw)));
}

// The caller must first establish an accessible approach in the original
// real domain. In particular, ln(u) -> -infinity requires u -> 0 through u>0.
export function symbolicLimit(raw:string,at:string,side='both',depth=0):string|null {
 if(depth>10)return null;
 if(!at.includes('Infinity')){
  const value=realConstant(substitute(raw,'x',at));if(value!==null)return value;
 }
 try{
  let n:any=parse(raw);while(n.isParenthesisNode)n=n.content;
  const child=(v:any)=>symbolicLimit(source(v),at,side,depth+1);
  if(n.isFunctionNode){
   const a=child(n.args[0]);
   if(['log','log10'].includes(n.fn.name)){if(a==='0')return '-Inf';if(a==='Inf')return 'Inf';}
   if(n.fn.name==='exp'){if(a==='Inf')return 'Inf';if(a==='-Inf')return '0';}
   if(n.fn.name==='abs'&&(a==='Inf'||a==='-Inf'))return 'Inf';
   if(a!==null&&Number.isFinite(asReal(a))){const value=realConstant(n.fn.name+'('+a+')');if(value!==null)return value;}
  }
  if(n.isOperatorNode&&n.args.length===1){const a=child(n.args[0]);if(a!==null)return n.op==='-'?(a==='Inf'?'-Inf':a==='-Inf'?'Inf':exact('-('+a+')')):a;}
  if(n.isOperatorNode&&n.args.length===2){
   const [a,b]=n.args,l=child(a),r=child(b);
   if(l!==null&&r!==null){
    const x=asReal(l),y=asReal(r);
    if(Number.isFinite(x)&&Number.isFinite(y)&&(n.op!=='/'||y!==0)&&!(n.op==='^'&&x===0&&y===0)){
     const value=realConstant('('+l+')'+n.op+'('+r+')');if(value!==null)return value;
    }
    if(n.op==='+'||n.op==='-'){
     const result=n.op==='+'?x+y:x-y;if(!Number.isNaN(result)&&!Number.isFinite(result))return result>0?'Inf':'-Inf';
    }
    if(n.op==='*'&&x!==0&&y!==0&&!Number.isNaN(x)&&!Number.isNaN(y)&&(!Number.isFinite(x)||!Number.isFinite(y)))return Math.sign(x)*Math.sign(y)>0?'Inf':'-Inf';
    if(n.op==='/'){
     if(Number.isFinite(x)&&Math.abs(y)===Infinity)return '0';
     if(Math.abs(x)===Infinity&&Number.isFinite(y)&&y!==0)return Math.sign(x)*Math.sign(y)>0?'Inf':'-Inf';
     if(x!==0&&!Number.isNaN(x)&&y===0){const sign=approachSign(source(b),at,side);if(sign!==null&&sign!==0)return Math.sign(x)*sign>0?'Inf':'-Inf';}
    }
    if(n.op==='^'&&Number.isFinite(y)){
     if(y===0&&(x===0||Math.abs(x)===Infinity)&&approachSign(source(a),at,side)===1){
      // 0^0 and infinity^0 are indeterminate. For a positive base,
      // u^v = exp(v ln u), retaining the relation between the two factors.
      const combined=symbolicLimit('('+source(b)+')*log('+source(a)+')',at,side,depth+1);
      if(combined==='Inf')return 'Inf';if(combined==='-Inf')return '0';
      if(combined!==null){const value=realConstant('exp('+combined+')');if(value!==null)return value;}
     }
     if(x===0&&y>0)return '0';
     if(Math.abs(x)===Infinity){
      if(y<0)return '0';
      if(y>0){const q=r.match(/^(-?\d+)(?:\/(\d+))?$/);if(x>0)return 'Inf';if(q&&Number(q[2]??1)%2===1)return Number(q[1])%2?'-Inf':'Inf';}
     }
    }
   }
  }
 }catch{}
 try{
  const output=cas.limit(simplified(branchForm(raw,at,side)),'x',at,side).toString();
  if(/^[-]?(?:Inf|Infinity)$/.test(output))return output.startsWith('-')?'-Inf':'Inf';
  onlyVariables(output,[]);if(Number.isFinite(asReal(output)))return exact(output);
 }catch{}
 return null;
}
export const limitValueTex=(value:string,tex:(v:string)=>string):string=>value==='Inf'||value==='Infinity'?'+\\infty':value==='-Inf'||value==='-Infinity'?'-\\infty':tex(value);

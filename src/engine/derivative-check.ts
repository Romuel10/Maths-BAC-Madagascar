import {parse,evaluateNode} from './expression';
import {rationalValue} from './real-simplify';

type Dual={value:number;slope:number};
const invalid=():Dual=>({value:NaN,slope:NaN});
// Independent forward-mode automatic differentiation. This never reads the
// symbolic derivative, calls a CAS, or subtracts nearby floating-point values.
export function forwardDerivative(node:any,x:number):Dual {
 const read=(n:any):Dual=>{
  if(n.isParenthesisNode)return read(n.content);
  if(n.isConstantNode||n.isSymbolNode)return {value:evaluateNode(n,{x}),slope:n.isSymbolNode&&n.name==='x'?1:0};
  if(n.isOperatorNode&&n.args.length>1&&(n.op==='+'||n.op==='*'))return n.args.map(read).reduce((a:Dual,b:Dual)=>n.op==='+'?{value:a.value+b.value,slope:a.slope+b.slope}:{value:a.value*b.value,slope:a.slope*b.value+a.value*b.slope});
  const a=read(n.args[0]);
  if(n.isFunctionNode){
   const u=a.value,name=n.fn.name;
   const functions:Record<string,[(u:number)=>number,(u:number)=>number]>={
    sqrt:[Math.sqrt,u=>u>0?1/(2*Math.sqrt(u)):NaN],cbrt:[Math.cbrt,u=>u!==0?1/(3*Math.cbrt(u)**2):NaN],
    abs:[Math.abs,u=>u===0?NaN:Math.sign(u)],sign:[Math.sign,u=>u===0?NaN:0],
    log:[Math.log,u=>u>0?1/u:NaN],log10:[Math.log10,u=>u>0?1/(u*Math.LN10):NaN],exp:[Math.exp,Math.exp],
    sin:[Math.sin,Math.cos],cos:[Math.cos,u=>-Math.sin(u)],tan:[Math.tan,u=>1/Math.cos(u)**2],
    sec:[u=>1/Math.cos(u),u=>Math.sin(u)/Math.cos(u)**2],csc:[u=>1/Math.sin(u),u=>-Math.cos(u)/Math.sin(u)**2],cot:[u=>1/Math.tan(u),u=>-1/Math.sin(u)**2],
    asin:[Math.asin,u=>1/Math.sqrt(1-u*u)],acos:[Math.acos,u=>-1/Math.sqrt(1-u*u)],atan:[Math.atan,u=>1/(1+u*u)],
    sinh:[Math.sinh,Math.cosh],cosh:[Math.cosh,Math.sinh],tanh:[Math.tanh,u=>1/Math.cosh(u)**2]
   };
   const f=functions[name];return f?{value:f[0](u),slope:a.slope*f[1](u)}:invalid();
  }
  if(n.args.length===1)return n.op==='-'?{value:-a.value,slope:-a.slope}:n.op==='+'?a:invalid();
  const b=read(n.args[1]);
  if(n.op==='-')return {value:a.value-b.value,slope:a.slope-b.slope};
  if(n.op==='/')return b.value!==0?{value:a.value/b.value,slope:(a.slope*b.value-a.value*b.slope)/b.value**2}:invalid();
  if(n.op==='^'){
   let variable=false;n.args[1].traverse((v:any)=>{if(v.isSymbolNode&&v.name==='x')variable=true;});
   if(variable){if(a.value<=0)return invalid();const value=a.value**b.value;return {value,slope:value*(b.slope*Math.log(a.value)+b.value*a.slope/a.value)};}
   const q=rationalValue(n.args[1]);
   if(a.value<0&&(!q||q.d%2n===0n))return invalid();
   const value=a.value<0?(q!.n%2n===0n?1:-1)*(-a.value)**b.value:a.value**b.value;
   if(!Number.isFinite(a.slope))return {value,slope:NaN};
   const slope=a.value!==0?b.value*value*a.slope/a.value:b.value===1?a.slope:b.value>1?0:NaN;
   return {value,slope};
  }
  return invalid();
 };
 return read(node);
}

export function checkDerivative(raw:string,candidate:string):{checked:number;matches:boolean} {
 const f=parse(raw),d=parse(candidate);let checked=0;
 for(const x of [-8,-3,-1.25,-.4,-.1,0,.1,.4,1.25,3,8]){
  const reference=forwardDerivative(f,x);
  if(!Number.isFinite(reference.value)||!Number.isFinite(reference.slope))continue;
  const actual=evaluateNode(d,{x});checked++;
  if(!Number.isFinite(actual)||Math.abs(actual-reference.slope)>1e-9*Math.abs(reference.slope)+1e-12)return {checked,matches:false};
 }
 // A finite sample is a guard against regressions, not a proof of identity.
 return {checked,matches:true};
}

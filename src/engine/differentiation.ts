import {math,parse,source,exact,cas} from './expression';
import {all,create,type MathNode} from 'mathjs';
import {simplifyReal} from './real-simplify';
import {readableTex} from './math-display';
import {checkDerivative} from './derivative-check';
const symbolic=create(all,{number:'Fraction'});

const unwrap=(n:any):any=>n.isParenthesisNode?unwrap(n.content):n;
function fraction(n:any):[number,number]|null {
 try{let variable=false;n.traverse((v:any)=>{if(v.isSymbolNode&&!['e','pi'].includes(v.name))variable=true;});if(variable)return null;const m=exact(source(n)).match(/^(-?\d+)(?:\/(\d+))?$/);return m?[Number(m[1]),Number(m[2]??1)]:null;}catch{return null;}
}
const power=(a:any,p:number,q=1)=>new math.OperatorNode('^','pow',[a,new math.ParenthesisNode(math.parse(p+'/'+q))]);
// Compose rational powers on the original real domain, which callers retain.
// An even root of an even power requires |u|: sqrt(x²) = |x|,
// whereas cbrt(x³) = x, including at zero.
export function realForm(raw:string|MathNode):MathNode {
 const visit=(node:any):any=>{
  let n=node.map((c:any)=>visit(c));
  if(n.isFunctionNode&&['sqrt','cbrt'].includes(n.fn.name))n=power(n.args[0],1,n.fn.name==='sqrt'?2:3);
  if(n.isFunctionNode&&n.fn.name==='abs'){
   const a=unwrap(n.args[0]);
   if(a.isFunctionNode&&a.fn.name==='abs')return a;
   if(a.isOperatorNode&&a.op==='^'){
    const q=fraction(a.args[1]);
    if(q&&q[1]===1){if(q[0]%2===0)return a;return power(new math.FunctionNode('abs',[a.args[0]]),q[0]);}
   }
  }
  if(n.isOperatorNode&&n.op==='^'){
   const a=unwrap(n.args[0]),outer=fraction(n.args[1]);
   // Integer powers may be distributed safely, including over quotients.
   // This also keeps successive derivatives of radicals compact.
   if(outer&&outer[1]===1&&a.isOperatorNode&&['*','/'].includes(a.op))return visit(new math.OperatorNode(a.op,a.fn,a.args.map((v:any)=>power(v,outer[0]))));
   if(outer&&a.isFunctionNode&&a.fn.name==='abs'&&outer[1]===1&&outer[0]%2===0)return power(a.args[0],outer[0]);
   if(outer&&a.isOperatorNode&&a.op==='^'){
    const inner=fraction(a.args[1]);
    if(inner){
     const base=outer[1]%2===0&&inner[1]%2===1&&inner[0]%2===0?new math.FunctionNode('abs',[a.args[0]]):a.args[0];
     return visit(power(base,inner[0]*outer[0],inner[1]*outer[1]));
    }
   }
   if(outer&&outer[0]===outer[1])return n.args[0];
  }
  return n;
 };
 return visit(typeof raw==='string'?parse(raw):raw);
}
export function differentiate(raw:string):string {
 // Differentiate the input tree before any CAS rewrites. Even the library's
 // realContext distributes fractional powers without checking factor signs.
 const derivative=symbolic.derivative(symbolic.parse(source(realForm(raw))),'x',{simplify:false});
 const supported=derivative.transform((n:any)=>n.isFunctionNode&&n.fn.name==='sech'?symbolic.parse('1/cosh('+source(n.args[0])+')'):n);
 // Rewrite only with exact real algebra. The general CAS simplifier splits
 // fractional powers over factors of unknown sign and can spend minutes on
 // nested variable powers. Treat transcendental/radical blocks as atoms.
 const printable=supported.transform((n:any)=>{
  if(!n.isConstantNode||!symbolic.isFraction(n.value))return n;
  const literal=math.parse(source(n));return n.value.d===1n?literal:new math.ParenthesisNode(literal);
 });
 const preliminary=simplifyReal(realForm(printable));
 const answer=simplifyReal(realForm(preliminary)).toString({parenthesis:'auto',implicit:'show'});
 if(!checkDerivative(raw,answer).matches)throw new Error('La dérivée calculée ne passe pas le contrôle indépendant. Le résultat n’est pas affiché ; décompose la fonction pour poursuivre le calcul.');
 return answer;
}
export function derivativeTex(raw:string):string {return readableTex(raw);}
export function factorDerivative(raw:string):string {
 // Factoring is cosmetic. Keep branch-sensitive powers in their original tree.
 let sensitive=false;parse(raw).traverse((n:any)=>{
  if(n.isFunctionNode&&['abs','sign','sqrt','cbrt'].includes(n.fn.name))sensitive=true;
  if(n.isOperatorNode&&n.op==='^'){const q=fraction(n.args[1]);if(!q||q[1]!==1)sensitive=true;}
 });
 if(!sensitive)try{return cas.factor(raw).toString();}catch{}
 return raw;
}

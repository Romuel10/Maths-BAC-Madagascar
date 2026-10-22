import {parse} from './expression';
import {rationalValue,simplifyReal} from './real-simplify';

// Presentation uses real radicals and one fraction bar. The stored symbolic
// expression and the separately computed domain remain the calculation input.
export function readableTex(raw:string,simplify=true):string {
 const tree=simplify?simplifyReal(parse(raw)):parse(raw);
 const render=(node:any):string=>node.toTex({parenthesis:'auto',implicit:'hide',handler:(n:any)=>{
  if(!n.isOperatorNode||n.op!=='^')return;
  const p=rationalValue(n.args[1]);if(!p||p.d===1n)return;
  const base=n.args[0],numerator=p.n<0n?-p.n:p.n,whole=numerator/p.d,remainder=numerator%p.d;
  const atom=render(base),factor=base.isOperatorNode&&['+','-','/'].includes(base.op)?'\\left('+atom+'\\right)':atom;
  let value=whole===0n?'':whole===1n?factor:'{'+factor+'}^{'+whole+'}';
  if(remainder){const argument=remainder===1n?atom:'{'+factor+'}^{'+remainder+'}';value+=(p.d===2n?'\\sqrt{':'\\sqrt['+p.d+']{')+argument+'}';}
  return p.n<0n?'\\frac{1}{'+value+'}':value;
 }}).replace(/\\mathrm\{log\}/g,'\\ln');
 return render(tree);
}

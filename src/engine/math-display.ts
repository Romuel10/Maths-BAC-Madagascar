import {parse,math} from './expression';
import {rationalValue,simplifyReal} from './real-simplify';

// Presentation uses real radicals and one fraction bar. The stored symbolic
// expression and the separately computed domain remain the calculation input.
export function readableTex(raw:string,simplify=true):string {
 const unwrap=(n:any):any=>n.isParenthesisNode?unwrap(n.content):n;
 const degree=(node:any):number=>{
  const n=unwrap(node);if(n.isConstantNode)return 0;if(n.isSymbolNode)return n.name==='x'?1:0;
  if(!n.isOperatorNode)return -1;
  if(n.op==='^'){const p=rationalValue(n.args[1]),d=degree(n.args[0]);return p&&p.d===1n&&p.n>=0n&&d>=0?d*Number(p.n):-1;}
  const ds=n.args.map(degree);if(ds.some((d:number)=>d<0))return -1;
  return n.op==='*'?ds.reduce((a:number,b:number)=>a+b,0):['+','-'].includes(n.op)?Math.max(...ds):-1;
 };
 const ordered=(node:any):any=>{
  const n=unwrap(node).map((c:any)=>ordered(c));
  if(!n.isOperatorNode||!['+','-'].includes(n.op)||n.args.length<2)return n;
  const terms:{node:any;sign:number;rank:number}[]=[];
  const read=(node:any,sign=1)=>{
   const v=unwrap(node);
   if(v.isOperatorNode&&v.op==='+'){v.args.forEach((a:any)=>read(a,sign));return;}
   if(v.isOperatorNode&&v.op==='-'){read(v.args[0],v.args.length===1?-sign:sign);if(v.args.length>1)read(v.args[1],-sign);return;}
   const d=degree(v);terms.push({node:v,sign,rank:d>0?100+d:d<0?1:0});
  };read(n);terms.sort((a,b)=>b.rank-a.rank);
  let result:any;for(const t of terms)result=result?new math.OperatorNode(t.sign<0?'-':'+',t.sign<0?'subtract':'add',[result,t.node]):t.sign<0?new math.OperatorNode('-','unaryMinus',[t.node]):t.node;
  return result;
 };
 const tree=simplify?ordered(simplifyReal(parse(raw))):parse(raw);
 const render=(node:any):string=>node.toTex({parenthesis:'auto',implicit:'hide',handler:(n:any)=>{
  if(n.isFunctionNode&&n.fn.name==='exp')return ' e^{'+render(n.args[0])+'}';
  if(n.isOperatorNode&&n.op==='-'&&n.args.length===1){const a=unwrap(n.args[0]);if(!a.isOperatorNode||!['+','-'].includes(a.op))return '-'+render(a);}
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

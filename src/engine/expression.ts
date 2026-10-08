import {all,create,type MathNode} from 'mathjs';
import nerdamer from 'nerdamer';
// A small boundary around the CAS keeps package-specific entities out of the UI.
export const cas = nerdamer as any;
export const math=create(all,{number:'BigNumber',precision:64});
const functions=new Set(['sqrt','cbrt','abs','sign','log','log10','exp','sin','cos','tan','asin','acos','atan','sinh','cosh','tanh','floor','ceil','factorial']);
const symbols=new Set(['x','y','z','n','t','u','e','pi','i']);
export function normalize(input:string):string {
 if(!input.trim())throw new Error('Écris une expression avant de lancer le calcul.');
 if(input.length>600)throw new Error('Traite une question à la fois, avec une expression de moins de 600 caractères.');
 return input.trim().replace(/−|–/g,'-').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/π/g,'pi').replace(/∞/g,'Infinity')
 .replace(/²/g,'^2').replace(/³/g,'^3').replace(/√\s*\(/g,'sqrt(').replace(/\bln\b/g,'log')
 .replace(/\b(\d+(?:\.\d*)?)[eE]([+-]?\d+)\b/g,'($1*10^($2))')
 .replace(/(\d),(\d)/g,'$1.$2');
}
export function parse(input:string):MathNode {
 const s=normalize(input);
 if(!/^[\dA-Za-z+\-*/^!().\s]+$/.test(s))throw new Error('Utilise des nombres, x, des parenthèses et les fonctions du clavier. Pour une équation, choisis « Équation ».');
 let node:MathNode;try{node=math.parse(s);}catch{throw new Error('Expression incomplète. Vérifie les parenthèses et les signes.');}
 let count=0;
 node.traverse((n:any)=>{
  if(++count>180)throw new Error('Cette expression est trop longue. Découpe le calcul.');
  if(!['ConstantNode','SymbolNode','ParenthesisNode','OperatorNode','FunctionNode'].includes(n.type))throw new Error('Cette syntaxe n’est pas autorisée.');
  if(n.isSymbolNode&&!symbols.has(n.name)&&!functions.has(n.name))throw new Error('Symbole inconnu : '+n.name+'.');
  if(n.isFunctionNode&&(!functions.has(n.fn.name)||n.args.length!==1))throw new Error('Utilise une fonction du clavier avec un seul argument.');
  if(n.isOperatorNode&&!['+','-','*','/','^','!'].includes(n.op))throw new Error('Opérateur non pris en charge.');
  if(n.isOperatorNode&&n.op==='^'&&n.args[1].isConstantNode&&Math.abs(Number(n.args[1].value))>10000)throw new Error('Exposant trop grand pour un calcul interactif.');
  if((n.isOperatorNode&&n.op==='!')||(n.isFunctionNode&&n.fn.name==='factorial')){const v=evaluateNode(n.args[0]);if(!Number.isInteger(v)||v<0||v>1000)throw new Error('La factorielle accepte un entier de 0 à 1000.');}
 });
 return node;
}
export function source(node:any):string {
 if(node.isParenthesisNode)return '('+source(node.content)+')';
 if(node.isConstantNode){const s=typeof node.value?.toFixed==='function'?node.value.toFixed():String(node.value);if(s.includes('.')){const [whole,fraction]=s.split('.');return '('+BigInt(whole+fraction).toString()+'/'+('1'+'0'.repeat(fraction.length))+')';}return s;}
 if(node.isSymbolNode)return node.name;
 if(node.isFunctionNode){const a=source(node.args[0]);return node.fn.name==='log10'?'(log('+a+')/log(10))':node.fn.name+'('+a+')';}
 if(node.args.length===1)return node.op==='!'?'factorial('+source(node.args[0])+')':'('+node.op+source(node.args[0])+')';
 if(node.op==='^'){
  const base=evaluateNode(node.args[0]);
  if(Number.isFinite(base)&&base<0){const power=rationalExponent(node.args[1]);if(power&&power[1]%2===1&&power[1]>1)return '('+(Math.abs(power[0])%2===1?'-':'')+'(abs('+source(node.args[0])+')^('+source(node.args[1])+')))';}
 }
 return '('+source(node.args[0])+node.op+source(node.args[1])+')';
}
export function expression(raw:string):string{return source(parse(raw));}
export function tex(s:string):string {
 try{return String(cas(s).toTeX()).replace(/\\mathrm\{log\}/g,'\\ln');}catch{return s.replace(/[\\{}]/g,'');}
}
export function exact(s:string):string{return cas(s).toString();}
export function simplified(s:string):string{return cas.simplify(s).toString();}
export function fmt(x:number):string {
 if(!Number.isFinite(x))return x===Infinity?'+∞':x===-Infinity?'−∞':'non défini';
 if(x===0)return '0';
 return Number(x.toPrecision(11)).toString().replace(/e([+-]?\d+)/,' × 10^$1');
}
export function asReal(s:string):number {
 try { const r=cas(s).numeric(80);if(/^-?(Inf|Infinity)$/.test(r.toString()))return r.toString().startsWith('-')?-Infinity:Infinity;const im=Number(cas('imagpart('+r.toString()+')').numeric(80).valueOf());if(im!==0)return NaN;return Number(cas('realpart('+r.toString()+')').numeric(80).valueOf()); }catch{return NaN;}
}
function rationalExponent(n:any):[number,number]|null {
 try{const s=exact(source(n));const m=s.match(/^(-?\d+)(?:\/(\d+))?$/);return m?[Number(m[1]),Number(m[2]??1)]:null;}catch{return null;}
}
export function evaluateNode(n:any,scope:Record<string,number>={}):number {
 if(n.isParenthesisNode)return evaluateNode(n.content,scope);
 if(n.isConstantNode)return Number(n.value);
 if(n.isSymbolNode)return n.name==='pi'?Math.PI:n.name==='e'?Math.E:scope[n.name]??NaN;
 const a=evaluateNode(n.args[0],scope);
 if(n.isFunctionNode){
  const f:Record<string,(v:number)=>number>={sqrt:Math.sqrt,cbrt:Math.cbrt,abs:Math.abs,sign:Math.sign,log:Math.log,log10:Math.log10,exp:Math.exp,sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh,floor:Math.floor,ceil:Math.ceil,factorial:factorial};
  return f[n.fn.name]?.(a)??NaN;
 }
 if(n.args.length===1)return n.op==='-'?-a:n.op==='!'?factorial(a):a;
 const b=evaluateNode(n.args[1],scope);
 if(n.op==='+')return a+b;if(n.op==='-')return a-b;if(n.op==='*')return a*b;if(n.op==='/')return b===0?NaN:a/b;
 if(n.op==='^'){if(a<0&&!Number.isInteger(b)){const q=rationalExponent(n.args[1]);if(q&&q[1]%2===1)return (Math.abs(q[0])%2===1?-1:1)*Math.pow(-a,b);return NaN;}return Math.pow(a,b);}
 return NaN;
}
function factorial(x:number):number {if(!Number.isInteger(x)||x<0||x>170)return NaN;let r=1;for(let i=2;i<=x;i++)r*=i;return r;}
export function numeric(raw:string,x=0):number{return evaluateNode(parse(raw),{x});}
export interface Constraint {expr:string;op:'>'|'>='|'!=';value:string;}
export function constraints(raw:string):Constraint[]{
 const out:Constraint[]=[];const node=parse(raw);
 const add=(n:any,op:Constraint['op'],value='0')=>out.push({expr:source(n),op,value});
 node.traverse((n:any)=>{
  if(n.isOperatorNode&&n.op==='/')add(n.args[1],'!=');
  if(n.isFunctionNode){const name=n.fn.name;if(['log','log10'].includes(name))add(n.args[0],'>');if(name==='sqrt')add(n.args[0],'>=');if(name==='tan')out.push({expr:'cos('+source(n.args[0])+')',op:'!=',value:'0'});if(['asin','acos'].includes(name)){add(n.args[0],'>=','-1');out.push({expr:'-('+source(n.args[0])+')',op:'>=',value:'-1'});}}
  if(n.isOperatorNode&&n.op==='^'){const q=rationalExponent(n.args[1]);if(!q)add(n.args[0],'>');else if(q[1]%2===0)add(n.args[0],q[0]<0?'>':'>=');else if(q[0]<0)add(n.args[0],'!=');}
 });
 return out.filter((v,i,a)=>a.findIndex(x=>x.expr===v.expr&&x.op===v.op&&x.value===v.value)===i);
}
export function domainTex(raw:string):string {
 const c=constraints(raw);
 return c.length?'D=\\left\\{x\\in\\mathbb R\\;\\middle|\\;'+c.map(v=>tex(v.expr)+(v.op==='!='?'\\ne':v.op==='>='?'\\ge':'>')+v.value).join(',\\;')+'\\right\\}':'D=\\mathbb R';
}
export function checkDomain(raw:string,x:number):boolean {
 return constraints(raw).every(c=>{const a=numeric(c.expr,x),b=Number(c.value);return Number.isFinite(a)&&(c.op==='!='?a!==b:c.op==='>'?a>b:a>=b);});
}
export function onlyVariables(raw:string,allowed:string[]):void {
 parse(raw).traverse((n:any)=>{if(n.isSymbolNode&&['x','y','z','n','t','u','i'].includes(n.name)&&!allowed.includes(n.name))throw new Error('Ici, utilise '+(allowed.length?allowed.join(', '):'uniquement des nombres')+'.');});
}
export function param(params:Record<string,string>,key:string,fallback:string):number {
 const s=expression(params[key]??fallback);onlyVariables(s,[]);const n=asReal(s);
 if(!Number.isFinite(n))throw new Error('Valeur invalide pour « '+key+' ».');
 return n;
}

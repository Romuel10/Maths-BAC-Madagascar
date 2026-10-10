import {all,create,type MathNode} from 'mathjs';
import nerdamer from 'nerdamer';
import {normalize} from './notation';
export {normalize} from './notation';
// A small boundary around the CAS keeps package-specific entities out of the UI.
export const cas = nerdamer as any;
export const math=create(all,{number:'BigNumber',precision:64});
const functions=new Set(['sqrt','cbrt','abs','sign','log','log10','exp','sin','cos','tan','sec','csc','cot','asin','acos','atan','sinh','cosh','tanh','floor','ceil','factorial']);
const symbols=new Set(['x','y','z','n','t','u','e','pi','i']);
export function parse(input:string):MathNode {
 const s=normalize(input);
 if(!/^[\dA-Za-z+\-*/^!().\s]+$/.test(s))throw new Error('Utilise des nombres, x, des parenthèses et les fonctions du clavier. Pour une équation, choisis « Équation ».');
 let node:MathNode;try{node=math.parse(s);}catch{throw new Error('Expression incomplète. Vérifie les parenthèses et les signes.');}
 let count=0;
 node.traverse((n:any,_path:string,parent:any)=>{
  if(++count>180)throw new Error('Cette expression est trop longue. Découpe le calcul.');
  if(!['ConstantNode','SymbolNode','ParenthesisNode','OperatorNode','FunctionNode'].includes(n.type))throw new Error('Cette syntaxe n’est pas autorisée.');
  if(n.isSymbolNode&&!symbols.has(n.name)&&!functions.has(n.name))throw new Error('Symbole inconnu : '+n.name+'.');
  if(n.isSymbolNode&&functions.has(n.name)&&!parent?.isFunctionNode)throw new Error('Complète '+n.name+' avec un argument, par exemple '+n.name+'(x).');
  if(n.isFunctionNode&&(!functions.has(n.fn.name)||n.args.length!==1))throw new Error('Utilise une fonction du clavier avec un seul argument.');
  if(n.isOperatorNode&&!['+','-','*','/','^','!'].includes(n.op))throw new Error('Opérateur non pris en charge.');
  if(n.isOperatorNode&&n.op==='^'){let variable=false;n.args[1].traverse((a:any)=>{if(a.isSymbolNode&&['x','y','z','n','t','u','i'].includes(a.name))variable=true;});const value=evaluateNode(n.args[1]);if(!variable&&(!Number.isFinite(value)||Math.abs(value)>10000))throw new Error('Exposant trop grand pour un calcul interactif.');}
  if((n.isOperatorNode&&n.op==='!')||(n.isFunctionNode&&n.fn.name==='factorial')){const v=evaluateNode(n.args[0]);if(!Number.isInteger(v)||v<0||v>1000)throw new Error('La factorielle accepte un entier de 0 à 1000.');}
 });
 return node;
}
export function source(node:any,angle='rad'):string {
 const child=(n:any)=>source(n,angle);
 if(node.isParenthesisNode)return '('+child(node.content)+')';
 if(node.isConstantNode){const s=typeof node.value?.toFixed==='function'?node.value.toFixed():String(node.value);if(s.includes('.')){const [whole,fraction]=s.split('.');return '('+BigInt(whole+fraction).toString()+'/'+('1'+'0'.repeat(fraction.length))+')';}return s;}
 if(node.isSymbolNode)return node.name;
 if(node.isFunctionNode){const a=child(node.args[0]),name=node.fn.name;if(name==='cbrt')return evaluateNode(node.args[0])<0?'(-abs('+a+')^(1/3))':'(('+a+')^(1/3))';if(angle==='deg'&&['sin','cos','tan','sec','csc','cot'].includes(name))return name+'(('+a+')*pi/180)';if(angle==='deg'&&['asin','acos','atan'].includes(name))return '('+name+'('+a+')*180/pi)';return name==='log10'?'(log('+a+')/log(10))':name+'('+a+')';}
 if(node.args.length===1)return node.op==='!'?'factorial('+child(node.args[0])+')':'('+node.op+child(node.args[0])+')';
 if(node.op==='^'){
  const base=evaluateNode(node.args[0]);
  if(Number.isFinite(base)&&base<0){const power=rationalExponent(node.args[1]);if(power&&power[1]%2===1&&power[1]>1)return '('+(Math.abs(power[0])%2===1?'-':'')+'(abs('+source(node.args[0])+')^('+source(node.args[1])+')))';}
 }
 return '('+child(node.args[0])+node.op+child(node.args[1])+')';
}
export function expression(raw:string,angle='rad'):string{return source(parse(raw),angle);}
export function substitute(raw:string,name:string,value:string):string {const replacement=parse(value);return source(parse(raw).transform((node:any)=>node.isSymbolNode&&node.name===name?replacement:node));}
export function integerValue(raw:string):string|null {
 const read=(n:any):bigint|null=>{
  if(n.isParenthesisNode)return read(n.content);
  if(n.isConstantNode){const s=n.value?.toFixed?.()??String(n.value);return /^-?\d+$/.test(s)?BigInt(s):null;}
  if(!n.isOperatorNode&&!n.isFunctionNode)return null;
  const a=read(n.args[0]);if(a===null)return null;
  if(n.isFunctionNode||n.op==='!'){if((n.fn?.name??'factorial')!=='factorial'||a<0||a>1000)return null;let result=1n;for(let i=2n;i<=a;i++)result*=i;return result;}
  if(n.args.length===1)return n.op==='-'?-a:a;
  const b=read(n.args[1]);if(b===null)return null;
  if(n.op==='+')return a+b;if(n.op==='-')return a-b;
  if(n.op==='*'){if(a.toString().length+b.toString().length>10000)throw new Error('Le résultat dépasse 10 000 chiffres. Réduis la taille du calcul.');return a*b;}
  if(n.op==='/')return b!==0n&&a%b===0n?a/b:null;
  if(n.op==='^'&&b>=0n&&b<=10000n){if(a.toString().length*Number(b)>10000)throw new Error('Le résultat dépasse 10 000 chiffres. Réduis la taille du calcul.');return a**b;}
  return null;
 };
 const n=read(parse(raw));return n===null?null:String(n);
}
export function decimalApprox(raw:string):string|undefined {
 try{const literal=raw.match(/^(-?\d+)(?:\/(\d+))?$/);
  const s=literal?math.bignumber(literal[1]).div(math.bignumber(literal[2]??'1')).toString():cas(raw).numeric(16).toString();
  if(!/^[+-]?\d+(?:\.\d*)?(?:e[+-]?\d+)?$/i.test(s))return undefined;
  const n=Number(s);if(Number.isFinite(n)&&(n!==0||raw==='0'))return fmt(n);
  const big=math.bignumber(s);if(big.isZero()&&raw!=='0')return undefined;
  return big.toExponential(10).replace(/e([+-]?\d+)/,' × 10^$1');
 }catch{return undefined;}
}
export function inputTex(raw:string):string{return parse(raw).toTex().replace(/\\mathrm\{log\}/g,'\\ln');}
export function structuralKey(raw:string):string {
 const key=(n:any):string=>{if(n.isParenthesisNode)return key(n.content);if(n.isOperatorNode&&['+','*'].includes(n.op)){const terms:string[]=[];const visit=(c:any)=>{if(c.isParenthesisNode)visit(c.content);else if(c.isOperatorNode&&c.op===n.op)c.args.forEach(visit);else terms.push(key(c));};n.args.forEach(visit);return n.op+'['+terms.sort().join(',')+']';}return n.type+':'+(n.name??n.op??String(n.value??''))+'['+(n.args??[]).map(key).join(',')+']';};
 return key(parse(raw));
}
export function tex(s:string):string {
 const number=s.match(/^(-?\d+)(?:\/(\d+))?$/);if(number)return number[2]?'\\frac{'+number[1]+'}{'+number[2]+'}':number[1];
 try{return String(cas(s).toTeX()).replace(/\\mathrm\{log\}/g,'\\ln');}catch{return s.replace(/[\\{}]/g,'');}
}
export function exact(s:string):string{return cas(s).toString();}
export function simplified(s:string):string {
 const unwrap=(n:any):any=>n.isParenthesisNode?unwrap(n.content):n;
 const node=parse(s).transform((n:any)=>{
  const base=n.isOperatorNode&&n.op==='^'?unwrap(n.args[0]):null;
  const argument=n.isFunctionNode&&n.fn.name==='exp'?unwrap(n.args[0]):base?.isSymbolNode&&base.name==='e'?unwrap(n.args[1]):null;
  return argument?.isFunctionNode&&argument.fn.name==='log'?argument.args[0].cloneDeep():n;
 });
 const logs=node.transform((n:any)=>{
  if(!n.isFunctionNode||n.fn.name!=='log')return n;
  try{const argument=source(n.args[0]);onlyVariables(argument,[]);const value=exact(argument),m=value.match(/^(1)(0+)$|^1\/(1)(0+)$/);if(m){const power=m[2]?m[2].length:-m[4].length;return math.parse(power+'*log(10)');}}catch{}
  return n;
 });
 return cas.simplify(source(logs)).toString();
}
export function fmt(x:number):string {
 if(!Number.isFinite(x))return x===Infinity?'+∞':x===-Infinity?'−∞':'non défini';
 if(x===0)return '0';
 return Number(x.toPrecision(11)).toString().replace(/e([+-]?\d+)/,' × 10^$1');
}
export function numericTex(x:number):string {return Number(x.toPrecision(11)).toString().replace(/e([+-]?\d+)/,'\\times 10^{$1}');}
export function asReal(s:string):number {
 try { const r=cas(s).numeric(80);if(/^-?(Inf|Infinity)$/.test(r.toString()))return r.toString().startsWith('-')?-Infinity:Infinity;const im=Number(cas('imagpart('+r.toString()+')').numeric(80).valueOf());if(im!==0)return NaN;return Number(cas('realpart('+r.toString()+')').numeric(80).valueOf()); }catch{return NaN;}
}
const powers=new WeakMap<object,[number,number]|null>();
function rationalExponent(n:any):[number,number]|null {
 if(powers.has(n))return powers.get(n)!;
 let result:[number,number]|null=null;try{const s=exact(source(n));const m=s.match(/^(-?\d+)(?:\/(\d+))?$/);result=m?[Number(m[1]),Number(m[2]??1)]:null;}catch{}
 powers.set(n,result);return result;
}
export function evaluateNode(n:any,scope:Record<string,number>={}):number {
 if(n.isParenthesisNode)return evaluateNode(n.content,scope);
 if(n.isConstantNode)return Number(n.value);
 if(n.isSymbolNode)return n.name==='pi'?Math.PI:n.name==='e'?Math.E:scope[n.name]??NaN;
 const a=evaluateNode(n.args[0],scope);
 if(n.isFunctionNode){
  const f:Record<string,(v:number)=>number>={sqrt:Math.sqrt,cbrt:Math.cbrt,abs:Math.abs,sign:Math.sign,log:Math.log,log10:Math.log10,exp:Math.exp,sin:Math.sin,cos:Math.cos,tan:Math.tan,sec:v=>1/Math.cos(v),csc:v=>1/Math.sin(v),cot:v=>Math.cos(v)/Math.sin(v),asin:Math.asin,acos:Math.acos,atan:Math.atan,sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh,floor:Math.floor,ceil:Math.ceil,factorial:factorial};
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
  if(n.isFunctionNode){const name=n.fn.name;if(['log','log10'].includes(name))add(n.args[0],'>');if(name==='sqrt')add(n.args[0],'>=');if(['tan','sec','cot','csc'].includes(name))out.push({expr:(['tan','sec'].includes(name)?'cos':'sin')+'('+source(n.args[0])+')',op:'!=',value:'0'});if(['asin','acos'].includes(name)){add(n.args[0],'>=','-1');out.push({expr:'-('+source(n.args[0])+')',op:'>=',value:'-1'});}}
  if(n.isOperatorNode&&n.op==='^'){const q=rationalExponent(n.args[1]);if(!q)add(n.args[0],'>');else if(q[1]%2===0)add(n.args[0],q[0]<0?'>':'>=');else if(q[0]<0)add(n.args[0],'!=');}
 });
 return out.filter((v,i,a)=>a.findIndex(x=>x.expr===v.expr&&x.op===v.op&&x.value===v.value)===i);
}
export function domainTex(raw:string):string {
 const c=constraints(raw).filter(v=>{try{onlyVariables(v.expr,[]);const a=asReal(v.expr),b=Number(v.value);return !(Number.isFinite(a)&&(v.op==='!='?a!==b:v.op==='>'?a>b:a>=b));}catch{return true;}});
 return c.length?'D=\\left\\{x\\in\\mathbb R\\;\\middle|\\;'+c.map(v=>tex(v.expr)+(v.op==='!='?'\\ne':v.op==='>='?'\\ge':'>')+v.value).join(',\\;')+'\\right\\}':'D=\\mathbb R';
}
export function checkConstantDomain(raw:string):boolean {
 return constraints(raw).every(c=>{try{const value=math.bignumber(cas(c.expr).numeric(80).toString()),bound=math.bignumber(c.value);return value.isFinite()&&(c.op==='!='?!value.eq(bound):c.op==='>'?value.gt(bound):value.gte(bound));}catch{return false;}});
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

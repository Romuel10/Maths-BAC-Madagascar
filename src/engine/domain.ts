import {constraints,onlyVariables,asReal,numeric,tex,math,cas,substitute,parse,source,exact,structuralKey,type Constraint} from './expression';
import {finiteZeros} from './zero-set';
import {coefficients} from './algebra';

const between=(a:number,b:number)=>!Number.isFinite(a)&&!Number.isFinite(b)?0:!Number.isFinite(a)?b-Math.max(1,Math.abs(b)+1):!Number.isFinite(b)?a+Math.max(1,Math.abs(a)+1):a+(b-a)/2;
const accepts=(c:Constraint,v:number)=>Number.isFinite(v)&&(c.op==='!='?v!==0:c.op==='>'?v>0:v>=0);
function exactAccepts(c:Constraint,expr=c.expr):boolean {
 try{const v=math.bignumber(cas(expr).numeric(80).toString()),b=math.bignumber(c.value);return v.isFinite()&&(c.op==='!='?!v.eq(b):c.op==='>'?v.gt(b):v.gte(b));}catch{return false;}
}
function periodicDomain(checks:Constraint[]):string|null {
 const unique=checks.filter((c,i,a)=>a.findIndex(v=>v.op===c.op&&v.value===c.value&&structuralKey(v.expr)===structuralKey(c.expr))===i);
 if(unique.length!==1)return null;
 const c=unique[0];if(c.value!=='0')return null;
 let n:any=parse(c.expr);while(n.isParenthesisNode)n=n.content;
 if(!n.isFunctionNode||!['sin','cos'].includes(n.fn.name))return null;
 const co=coefficients(source(n.args[0]));if(!co||co.length!==2||asReal(co[1])===0)return null;
 const [b,a]=co,cos=n.fn.name==='cos',notZero=c.op==='!=';
 const left=notZero?(cos?'n*pi-pi/2':'n*pi'):(cos?'2*n*pi-pi/2':'2*n*pi');
 const right=notZero?(cos?'n*pi+pi/2':'(n+1)*pi'):(cos?'2*n*pi+pi/2':'(2*n+1)*pi');
 const bounds=[left,right].map(v=>tex(exact('(('+v+')-('+b+'))/('+a+')')));if(asReal(a)<0)bounds.reverse();
 return 'D=\\bigcup_{n\\in\\mathbb Z}'+(c.op==='>='?'[':']')+bounds[0]+';'+bounds[1]+(c.op==='>='?']':'[');
}

export interface DomainInterval {a:string;b:string;leftClosed:boolean;rightClosed:boolean;}
// null means that the interval decomposition is not established. Consumers
// must keep the original constraints rather than infer a domain from samples.
export function domainIntervals(raw:string|string[]):DomainInterval[]|null {
 const checks=(Array.isArray(raw)?raw:[raw]).flatMap(constraints),cuts:{value:string;x:number}[]=[];
 const conditions:{check:Constraint;zeros:number[];identity:boolean}[]=[];
 let complete=true;
 for(const c of checks){
  try{onlyVariables(c.expr,[]);if(!exactAccepts(c))return [];continue;}catch{}
  let set=null;try{set=finiteZeros('('+c.expr+')-('+c.value+')');}catch{}
  if(!set){complete=false;continue;}
  const zeros=set.values.map(asReal);
  if(zeros.some(x=>!Number.isFinite(x))){complete=false;continue;}
  conditions.push({check:c,zeros,identity:set.identity});
  cuts.push(...set.values.map((value,i)=>({value,x:zeros[i]})));
 }
 if(!complete)return null;
 const unique=cuts.filter((v,i,a)=>a.findIndex(u=>u.x===v.x)===i).sort((a,b)=>a.x-b.x);
 const xs=[-Infinity,...unique.map(v=>v.x),Infinity],tokens=['-Infinity',...unique.map(v=>v.value),'Infinity'];
 const permitted=(x:number,endpoint=false)=>conditions.every(({check:c,zeros,identity})=>{
  // Do not use a rounded sqrt(2) to decide whether a zero is strictly positive.
  if(identity||endpoint&&zeros.includes(x))return c.op==='>=';
  const value=numeric(c.expr,x)-Number(c.value);
  return value!==0&&Number.isFinite(value)?accepts(c,value):exactAccepts(c,substitute(c.expr,'x',String(x)));
 });
 const closed=xs.map(x=>Number.isFinite(x)&&permitted(x,true));
 const pieces:{a:number;b:number;lc:boolean;rc:boolean}[]=[],covered=new Set<number>();
 for(let i=0;i<xs.length-1;i++){
  if(!permitted(between(xs[i],xs[i+1])))continue;
  const lc=closed[i],rc=closed[i+1];if(lc)covered.add(i);if(rc)covered.add(i+1);
  const last=pieces.at(-1);
  if(last&&last.b===i&&(last.rc||lc)){last.b=i+1;last.rc=rc;}
  else pieces.push({a:i,b:i+1,lc,rc});
 }
 for(let i=1;i<xs.length-1;i++)if(closed[i]&&!covered.has(i))pieces.push({a:i,b:i,lc:true,rc:true});
 pieces.sort((a,b)=>a.a-b.a);
 return pieces.map(p=>({a:tokens[p.a],b:tokens[p.b],leftClosed:p.lc,rightClosed:p.rc}));
}

export function domainTex(raw:string|string[]):string {
 const pieces=domainIntervals(raw);
 if(pieces===null){
  const checks=(Array.isArray(raw)?raw:[raw]).flatMap(constraints);
  return periodicDomain(checks)??'D=\\left\\{x\\in]-\\infty;+\\infty[\\;\\middle|\\;'+checks.map(c=>tex(c.expr)+(c.op==='!='?'\\ne':c.op==='>='?'\\ge':'>')+tex(c.value)).join(',\\;')+'\\right\\}';
 }
 const endpoint=(v:string)=>v==='-Infinity'?'-\\infty':v==='Infinity'?'+\\infty':/^-\d+\/\d+$/.test(v)?'-'+tex(v.slice(1)):tex(v);
 return 'D='+(pieces.length?pieces.map(p=>(p.leftClosed?'[':']')+endpoint(p.a)+';'+endpoint(p.b)+(p.rightClosed?']':'[')).join('\\;\\cup\\;'):'\\varnothing');
}

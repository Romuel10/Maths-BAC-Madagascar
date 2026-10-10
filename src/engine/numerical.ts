import {parse,evaluateNode,constraints} from './expression';
type Range=[number,number];
function interval(n:any,a:number,b:number):Range|null {
 if(n.isParenthesisNode)return interval(n.content,a,b);
 if(n.isConstantNode){const v=Number(n.value);return [v,v];}
 if(n.isSymbolNode)return n.name==='x'?[a,b]:n.name==='pi'?[Math.PI,Math.PI]:n.name==='e'?[Math.E,Math.E]:null;
 const u=interval(n.args[0],a,b);if(!u)return null;
 if(n.isFunctionNode){
  const name=n.fn.name;
  if(name==='abs')return u[0]>=0?u:u[1]<=0?[-u[1],-u[0]]:[0,Math.max(-u[0],u[1])];
  if(name==='sin'||name==='cos'){
   if(u[1]-u[0]>=2*Math.PI)return [-1,1];const f=name==='sin'?Math.sin:Math.cos,shift=name==='sin'?Math.PI/2:0,values=[f(u[0]),f(u[1])];
   for(let k=Math.ceil((u[0]-shift)/Math.PI);k<=(u[1]-shift)/Math.PI;k++)values.push(k%2===0?1:-1);
   const padding=Number.EPSILON*8*Math.max(1,Math.abs(u[0]),Math.abs(u[1]));
   return [Math.max(-1,Math.min(...values)-padding),Math.min(1,Math.max(...values)+padding)];
  }
  if(name==='tan'&&Math.ceil((u[0]-Math.PI/2)/Math.PI)<=Math.floor((u[1]-Math.PI/2)/Math.PI))return null;
  if(['sqrt','log','log10'].includes(name)&&u[0]<(name==='sqrt'?0:Number.MIN_VALUE))return null;
  if(['asin','acos'].includes(name)&&(u[0]<-1||u[1]>1))return null;
  if(name==='cosh'){const values=u.map(Math.cosh);return [u[0]<=0&&u[1]>=0?1:Math.min(...values),Math.max(...values)];}
  const f:Record<string,(v:number)=>number>={sqrt:Math.sqrt,cbrt:Math.cbrt,log:Math.log,log10:Math.log10,exp:Math.exp,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,sinh:Math.sinh,tanh:Math.tanh};
  if(!f[name])return null;const values=u.map(f[name]);return values.every(Number.isFinite)?[Math.min(...values),Math.max(...values)]:null;
 }
 if(n.args.length===1)return n.op==='-'?[-u[1],-u[0]]:n.op==='+'?u:null;
 const v=interval(n.args[1],a,b);if(!v)return null;
 if(n.op==='+')return [u[0]+v[0],u[1]+v[1]];
 if(n.op==='-')return [u[0]-v[1],u[1]-v[0]];
 if(n.op==='*'){const values=[u[0]*v[0],u[0]*v[1],u[1]*v[0],u[1]*v[1]];return [Math.min(...values),Math.max(...values)];}
 if(n.op==='/'){if(v[0]<=0&&v[1]>=0)return null;const values=[u[0]/v[0],u[0]/v[1],u[1]/v[0],u[1]/v[1]];return [Math.min(...values),Math.max(...values)];}
 if(n.op==='^'&&v[0]===v[1]){
  const p=v[0];if((!Number.isInteger(p)&&u[0]<0)||(p<0&&u[0]<=0&&u[1]>=0))return null;
  const values=[u[0]**p,u[1]**p];if(p>0&&Number.isInteger(p)&&p%2===0&&u[0]<=0&&u[1]>=0)values.push(0);
  return values.every(Number.isFinite)?[Math.min(...values),Math.max(...values)]:null;
 }
 return null;
}
export function realEvaluator(raw:string):(x:number)=>number {
 const node=parse(raw),checks=constraints(raw).map(c=>({...c,node:parse(c.expr)}));
 const exponentials:any[]=[];node.traverse((n:any)=>{if(n.isFunctionNode&&n.fn.name==='exp')exponentials.push(n.args[0]);});
 const products:any[]=[];node.traverse((n:any)=>{if(n.isOperatorNode&&['^','*','/'].includes(n.op)&&n.args.length===2)products.push(n);});
 return x=>{
  for(const c of checks){const v=evaluateNode(c.node,{x}),b=Number(c.value);if(!Number.isFinite(v)||!(c.op==='!='?v!==b:c.op==='>'?v>b:v>=b))return NaN;}
  // Underflow must not turn a strictly positive exponential into a zero root.
  const underflow=exponentials.some(n=>Math.exp(evaluateNode(n,{x}))===0)||products.some(n=>evaluateNode(n,{x})===0&&evaluateNode(n.args[0],{x})!==0&&(n.op!=='*'||evaluateNode(n.args[1],{x})!==0));
  return underflow?NaN:evaluateNode(node,{x});
 };
}
export function domainCertifier(raw:string):(a:number,b:number,depth?:number)=>boolean {
 const checks=constraints(raw).map(c=>({...c,node:parse(c.expr)}));
 const prove=(lo:number,hi:number,depth:number):boolean=>{
  let uncertain=false;
  for(const c of checks){const range=interval(c.node,lo,hi),v=Number(c.value);if(!range){uncertain=true;continue;}const [min,max]=range;
   if(c.op==='!='?min>v||max<v:c.op==='>'?min>v:min>=v)continue;
   if(c.op==='!='?min===v&&max===v:c.op==='>'?max<=v:max<v)return false;
   uncertain=true;
  }
  if(!uncertain)return true;if(depth===0)return false;const mid=(lo+hi)/2;return prove(lo,mid,depth-1)&&prove(mid,hi,depth-1);
 };
 return (a,b,depth=12)=>prove(Math.min(a,b),Math.max(a,b),depth);
}
export function certifiedDomain(raw:string,a:number,b:number):boolean {return domainCertifier(raw)(a,b);}
function magnitude(n:any,x:number):number {
 if(n.isParenthesisNode)return magnitude(n.content,x);
 if(n.isOperatorNode&&n.args.length===1)return magnitude(n.args[0],x);
 if(n.isFunctionNode&&['sin','cos','tan','sec','csc','cot','log','log10'].includes(n.fn.name))return Math.max(Math.abs(evaluateNode(n,{x})),Math.abs(evaluateNode(n.args[0],{x})));
 if(!n.isOperatorNode||n.args.length!==2)return Math.abs(evaluateNode(n,{x}));
 const a=magnitude(n.args[0],x),b=magnitude(n.args[1],x);
 if(n.op==='+'||n.op==='-')return a+b;if(n.op==='*')return a*b;
 if(n.op==='/')return a/Math.abs(evaluateNode(n.args[1],{x}));
 if(n.op==='^')return a**evaluateNode(n.args[1],{x});
 return Math.abs(evaluateNode(n,{x}));
}
export function rootValidator(left:string,right:string):(x:number)=>boolean {
 const l=realEvaluator(left),r=realEvaluator(right),ln=parse(left),rn=parse(right);
 return x=>{const a=l(x),b=r(x),scale=magnitude(ln,x)+magnitude(rn,x);return Number.isFinite(a)&&Number.isFinite(b)&&Number.isFinite(scale)&&Math.abs(a-b)<=1e-10*Math.max(1e-300,scale);};
}
export function numericalRoots(left:string,right:string,xmin:number,xmax:number,seeds:number[]=[]):number[] {
 const l=realEvaluator(left),r=realEvaluator(right),f=(x:number)=>l(x)-r(x),valid=rootValidator(left,right),values:number[]=[];
 const add=(x:number)=>{if(x>=xmin&&x<=xmax&&valid(x)&&!values.some(v=>Math.abs(v-x)<1e-8*Math.max(1,Math.abs(x))))values.push(x);};
 const refine=(seed:number)=>{let x=seed;for(let i=0;i<60;i++){const y=f(x);if(!Number.isFinite(y))return;const h=Math.max(1,Math.abs(x))*1e-5,d=(f(x+h)-f(x-h))/(2*h);if(!Number.isFinite(d)||d===0)break;const next=x-y/d;if(!Number.isFinite(next)||next<xmin||next>xmax)break;if(next===x)break;x=next;}add(x);};
 seeds.forEach(refine);
 const count=1024,step=(xmax-xmin)/count;let previousX=xmin,previous=f(xmin),before=NaN;
 add(xmin);
 for(let i=1;i<=count;i++){
  const x=i===count?xmax:xmin+i*step,y=f(x);
  if(Number.isFinite(y)&&Number.isFinite(previous)&&Math.sign(y)!==Math.sign(previous)){
   let a=previousX,b=x,fa=previous;
   for(let j=0;j<100;j++){const mid=a+(b-a)/2;if(mid===a||mid===b)break;const v=f(mid);if(!Number.isFinite(v))break;if(v===0){a=b=mid;break;}if(Math.sign(v)===Math.sign(fa)){a=mid;fa=v;}else b=mid;}
   add(a+(b-a)/2);
  }
  if(Number.isFinite(before)&&Math.abs(previous)<Math.abs(before)&&Math.abs(previous)<Math.abs(y))refine(previousX);
  if(y===0)add(x);
  before=previous;previous=y;previousX=x;
 }
 return values.sort((a,b)=>a-b);
}
// Embedded Gauss (7) / Kronrod (15) quadrature, subdivided with an error budget.
const nodes=[.9914553711208126,.9491079123427585,.8648644233597691,.7415311855993945,.5860872354676911,.4058451513773972,.2077849550078985,0];
const kw=[.022935322010529225,.06309209262997855,.10479001032225018,.14065325971552592,.1690047266392679,.1903505780647854,.20443294007529889,.20948214108472783];
const gw=[.1294849661688697,.27970539148927667,.3818300505051189,.4179591836734694];
export function quadrature(raw:string,a:number,b:number):{value:number;error:number;evaluations:number} {
 const f=realEvaluator(raw);let evaluations=0;
 const sample=(x:number)=>{if(++evaluations>100000)throw new Error('L’intégrale oscille trop ou ne converge pas avec la précision demandée. Réduis l’intervalle.');const v=f(x);if(!Number.isFinite(v))throw new Error('L’intégrande présente une valeur non définie dans l’intervalle.');return v;};
 const estimate=(lo:number,hi:number)=>{const center=(lo+hi)/2,half=(hi-lo)/2,fc=sample(center);let k=kw[7]*fc,g=gw[3]*fc,absolute=kw[7]*Math.abs(fc);
  for(let i=0;i<7;i++){const u=sample(center-half*nodes[i]),v=sample(center+half*nodes[i]),pair=u+v;k+=kw[i]*pair;absolute+=kw[i]*(Math.abs(u)+Math.abs(v));if(i%2===1)g+=gw[(i-1)/2]*pair;}
  return {value:k*half,error:Math.max(Math.abs((k-g)*half),absolute*Math.abs(half)*Number.EPSILON*50)};
 };
 const integrate=(lo:number,hi:number,tolerance:number,depth:number):{value:number;error:number}=>{const e=estimate(lo,hi);if(e.error<=tolerance+Math.abs(e.value)*1e-10)return e;if(depth===0)throw new Error('La méthode numérique n’a pas convergé. Change les bornes ou étudie les singularités.');const mid=(lo+hi)/2,l=integrate(lo,mid,tolerance/2,depth-1),r=integrate(mid,hi,tolerance/2,depth-1);return {value:l.value+r.value,error:l.error+r.error};};
 if(a===b)return {value:0,error:0,evaluations:0};
 const lo=Math.min(a,b),hi=Math.max(a,b);let value=0,error=0;
 for(let i=0;i<16;i++){const e=integrate(lo+(hi-lo)*i/16,lo+(hi-lo)*(i+1)/16,1e-11/16,18);value+=e.value;error+=e.error;}
 if(!Number.isFinite(value))throw new Error('La valeur dépasse la capacité du calcul numérique.');
 return {value:a>b?-value:value,error,evaluations};
}

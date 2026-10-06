import { evaluateExpressionAst, parseExpressionCore } from './expressionCore.js';

/** Numerical candidates require a bracket or a local minimum and a relative residual. */
export function numericRoots(expression:string,min:number,max:number,samples=4000):number[]{
 const ast=parseExpressionCore(expression);
 const value=(x:number):number|null=>{try{const y=evaluateExpressionAst(ast,{x});return Number.isFinite(y)?y:null;}catch{return null;}};
 const roots:number[]=[],step=(max-min)/samples;
 const add=(x:number,scale:number)=>{const y=value(x);if(y===null||scale===0||Math.abs(y)>1e-8*scale)return;if(!roots.some(r=>Math.abs(r-x)<=1e-7*Math.max(1,Math.abs(x))))roots.push(x===0?0:x);};
 const refine=(a:number,b:number,scale:number)=>{
  let lo=a,hi=b,fl=value(a);
  if(fl===null)return;
  for(let i=0;i<80;i++){
   const x=lo+(hi-lo)/2,y=value(x);if(y===null)return;
   if(y===0||x===lo||x===hi){add(x,scale);return;}
   if(Math.sign(fl)*Math.sign(y)<0)hi=x;else{lo=x;fl=y;}
  }
  add(lo+(hi-lo)/2,scale);
 };
 let before:{x:number;y:number|null}|null=null,prev={x:min,y:value(min)};
 for(let i=1;i<=samples;i++){
  const current={x:min+i*step,y:value(min+i*step)};
  if(prev.y!==null&&current.y!==null){
   const scale=Math.max(Math.abs(prev.y),Math.abs(current.y));
   if(i===1&&prev.y===0)add(prev.x,scale);
   if(i===samples&&current.y===0)add(current.x,scale);
   if(Math.sign(prev.y)*Math.sign(current.y)<0)refine(prev.x,current.x,scale);
   if(before&&before.y!==null&&Math.abs(prev.y)<Math.abs(before.y)&&Math.abs(prev.y)<Math.abs(current.y)){
    let lo=before.x,hi=current.x;
    for(let j=0;j<60;j++){const l=lo+(hi-lo)/3,r=hi-(hi-lo)/3,fl=value(l),fr=value(r);if(fl===null||fr===null)break;if(Math.abs(fl)<Math.abs(fr))hi=r;else lo=l;}
    add(lo+(hi-lo)/2,Math.max(Math.abs(before.y),Math.abs(current.y)));
   }
  }
  before=prev;prev=current;
 }
 return roots.sort((a,b)=>a-b);
}

import {cas,parse,source,exact,simplified,asReal,tex,numericTex,constraints,checkDomain,domainTex,onlyVariables,substitute,fmt} from './expression';
import {coefficients,roots} from './algebra';
import {numericalRoots,realEvaluator,domainCertifier} from './numerical';
import {samplePlot} from './plot';
import type {Result,Step,RemarkablePoint,Asymptote,FunctionAnalysis} from './types';

interface ZeroSet {values:string[];identity:boolean;}
function unwrap(n:any):any{return n.isParenthesisNode?unwrap(n.content):n;}
function constant(n:any):boolean {let variable=false;n.traverse((v:any)=>{if(v.isSymbolNode&&v.name==='x')variable=true;});return !variable;}
// Exhaustive finite zeros, obtained by polynomial solving or invertible steps.
// Unresolved sums and periodic functions deliberately return null.
function finiteZeros(raw:string,target='0',depth=0):ZeroSet|null {
 if(depth>14)return null;
 const residual=target==='0'?raw:'('+raw+')-('+target+')';
 if(simplified(residual)==='0')return {values:[],identity:true};
 const co=coefficients(residual);
 if(co&&co.length<=3){const r=roots(residual);if(r.values.some(v=>Math.abs(asReal(v))===Infinity))return null;if(r.complete&&!r.numeric&&!r.family)return {values:r.values.filter(v=>Number.isFinite(asReal(v))),identity:false};}
 else if(co){
  // Higher-degree CAS solving can spend seconds producing numerical roots
  // that still require our bounded search. Resolve exact factors first.
  try{const factored=cas.factor(residual).toString(),n=unwrap(parse(factored));if(factored!==residual&&n.isOperatorNode&&['*','^'].includes(n.op))return finiteZeros(factored,'0',depth+1);}catch{}
 }
 const n=unwrap(parse(raw));
 if(constant(n))return {values:[],identity:false};
 const descend=(node:any,value:string)=>finiteZeros(source(node),value,depth+1);
 if(n.isFunctionNode){
  if(['sec','csc'].includes(n.fn.name)&&target==='0')return {values:[],identity:false};
  if(n.fn.name==='log')return descend(n.args[0],exact('exp('+target+')'));
  if(n.fn.name==='exp'){const value=asReal(target);if((value===0&&exact(target)!=='0')||!Number.isFinite(value))return null;if(value<=0)return {values:[],identity:false};return descend(n.args[0],exact('log('+target+')'));}
  if(['sqrt','cbrt','abs','sign'].includes(n.fn.name)&&target==='0')return descend(n.args[0],'0');
 }
 if(n.isOperatorNode){
  const [a,b]=n.args;
  if(n.args.length===1)return descend(a,n.op==='-'?exact('-('+target+')'):target);
  if(n.op==='^'){
   if(constant(a)&&asReal(source(a))>0&&asReal(source(a))!==1){const value=asReal(target);if((value===0&&exact(target)!=='0')||!Number.isFinite(value))return null;if(value<=0)return {values:[],identity:false};return descend(b,exact('log('+target+')/log('+source(a)+')'));}
   if(constant(b)&&target==='0'){const p=asReal(source(b));if(p<0)return {values:[],identity:false};if(p>0)return descend(a,'0');}
  }
  if(target==='0'&&(n.op==='*'||n.op==='/')){
   const left=descend(a,'0');if(n.op==='/')return left;
   const right=descend(b,'0');if(!left||!right)return null;
   return {values:[...new Set([...left.values,...right.values])],identity:left.identity||right.identity};
  }
  const ca=constant(a),cb=constant(b);
  if(ca!==cb){
   const c=source(ca?a:b),variable=ca?b:a;let value:string|undefined;
   if(n.op==='+')value='('+target+')-('+c+')';
   if(n.op==='-')value=ca?'('+c+')-('+target+')':'('+target+')+('+c+')';
   if(n.op==='*'&&asReal(c)!==0)value='('+target+')/('+c+')';
   if(n.op==='/'&&!ca)value='('+target+')*('+c+')';
   if(n.op==='/'&&ca&&asReal(target)!==0)value='('+c+')/('+target+')';
   if(value!==undefined)return descend(variable,exact(value));
  }
 }
 if(depth===0){try{const factored=cas.factor(raw).toString();if(factored!==raw)return finiteZeros(factored,target,depth+1);}catch{}}
 return null;
}
function setZeros(raw:string,xmin:number,xmax:number):{values:{value:string;x:number;exact:boolean}[];complete:boolean;identity:boolean}{
 let set:ZeroSet|null=null;try{set=finiteZeros(raw);}catch{}
 if(set)return {values:set.values.map(value=>({value,x:asReal(value),exact:true})).sort((a,b)=>a.x-b.x),complete:true,identity:set.identity};
 const values=numericalRoots(raw,'0',xmin,xmax).map(x=>({value:String(x),x,exact:false}));
 return {values,complete:false,identity:false};
}
function boundaries(raws:string[],xmin:number,xmax:number,regularity=true){
 const cuts:{value:string;x:number}[]=[],approximate:number[]=[];let complete=true;
 const checks=raws.flatMap(constraints);
 if(regularity)for(const raw of raws)parse(raw).traverse((n:any)=>{if(n.isFunctionNode&&['abs','sign'].includes(n.fn.name))checks.push({expr:source(n.args[0]),op:'!=',value:'0'});});
 for(const c of checks){
  let zeros:ZeroSet|null=null;try{zeros=finiteZeros('('+c.expr+')-('+c.value+')');}catch{}
  if(zeros){cuts.push(...zeros.values.map(value=>({value,x:asReal(value)})));}
  else{complete=false;approximate.push(...numericalRoots(c.expr,c.value,xmin,xmax));}
 }
 return {cuts:cuts.filter((c,i,a)=>Number.isFinite(c.x)&&a.findIndex(v=>v.x===c.x)===i).sort((a,b)=>a.x-b.x),approximate,complete};
}
function sampleBetween(a:number,b:number):number{return !Number.isFinite(a)&&!Number.isFinite(b)?0:!Number.isFinite(a)?b-Math.max(1,Math.abs(b)+1):!Number.isFinite(b)?a+Math.max(1,Math.abs(a)+1):a+(b-a)/2;}
function safeLimit(raw:string,at:string,side='both',depth=0):string|null {
 if(depth>10)return null;
 try{
  const output=cas.limit(simplified(raw),'x',at,side).toString();
  if(/^[-]?(?:Inf|Infinity)$/.test(output))return output;
  onlyVariables(output,[]);return Number.isFinite(asReal(output))?output:null;
 }catch{}
 // Nerdamer currently throws on ln(0+) instead of returning -Inf. Resolve
 // elementary compositions and determinate products from their proven limits.
 try{
  const n=unwrap(parse(raw)),child=(v:any)=>safeLimit(source(v),at,side,depth+1);
  if(n.isFunctionNode&&n.fn.name==='log'){
   const a=child(n.args[0]);if(a==='0')return '-Inf';if(a==='Inf'||a==='Infinity')return 'Inf';
  }
  if(n.isOperatorNode&&n.args.length===2){
   const [a,b]=n.args,l=child(a),r=n.op==='/'?safeLimit('1/('+source(b)+')',at,side,depth+1):child(b);
   if(l!==null&&r!==null&&(n.op==='*'||n.op==='/')){
    const x=asReal(l),y=asReal(r);if((!Number.isFinite(x)||!Number.isFinite(y))&&x!==0&&y!==0&&!Number.isNaN(x)&&!Number.isNaN(y))return Math.sign(x)*Math.sign(y)>0?'Inf':'-Inf';
   }
  }
 }catch{}
 return null;
}
function valueTex(value:string):string {return value==='Inf'||value==='Infinity'?'+\\infty':value==='-Inf'||value==='-Infinity'?'-\\infty':tex(value);}

export function analyzeFunction(raw:string,d0:string,xmin:number,xmax:number,steps:Step[]):Result {
 let d=d0;try{d=cas.factor(d0).toString();}catch{}
 let dd:string|undefined;try{const v=cas.factor(cas.diff(d0,'x').toString()).toString();if(!/diff\(|undefined|NaN/.test(v))dd=v;}catch{}
 const f=realEvaluator(raw),df=realEvaluator(d0),certify=domainCertifier(raw);
 const zeros=setZeros(raw,xmin,xmax),stationary=setZeros(d,xmin,xmax),edge=boundaries([raw,d0],xmin,xmax);
 const point=(root:{value:string;x:number;exact:boolean},kind:RemarkablePoint['kind']):RemarkablePoint|null=>{
  const y=f(root.x);if(!Number.isFinite(y))return null;
  let yTex=kind==='zero'?'0':numericTex(y),isExact=root.exact;
  if(isExact)try{const value=exact(substitute(raw,'x',root.value));if(Number.isFinite(asReal(value)))yTex=tex(value);else isExact=false;}catch{isExact=false;}
  return {x:root.x,y,kind,exact:isExact,latex:'('+ (isExact?tex(root.value):numericTex(root.x))+';\\;'+yTex+')'};
 };
 const zeroPoints=zeros.values.filter(v=>checkDomain(raw,v.x)).map(v=>point(v,'zero')).filter((p):p is RemarkablePoint=>!!p);
 const division=[...new Set([...stationary.values.map(v=>v.x),...edge.cuts.map(v=>v.x)])].sort((a,b)=>a-b);
 const global=stationary.complete&&edge.complete;
 const critical:RemarkablePoint[]=[];
 for(const root of stationary.values){
  if(!checkDomain(raw,root.x))continue;
  const index=division.indexOf(root.x),left=division[index-1]??-Infinity,right=division[index+1]??Infinity;
  const h=Math.min(Math.max(1,Math.abs(root.x))*1e-4,(root.x-left)/4,(right-root.x)/4);
  const l=global?sampleBetween(left,root.x):root.x-h,r=global?sampleBetween(root.x,right):root.x+h;
  if(!certify(root.x-Math.min(h,1e-4),root.x+Math.min(h,1e-4)))continue;
  const dl=df(l),dr=df(r),kind=dl<0&&dr>0?'minimum':dl>0&&dr<0?'maximum':'stationary';
  const p=point(root,kind);if(p)critical.push(p);
 }
 const rows:string[][]=[],variationBounds=global?[-Infinity,...division,Infinity]:[xmin,...division.filter(x=>x>xmin&&x<xmax),...edge.approximate.filter(x=>x>xmin&&x<xmax),xmax].sort((a,b)=>a-b);
 for(let i=0;i<variationBounds.length-1;i++){
  const a=variationBounds[i],b=variationBounds[i+1];if(a===b)continue;const x=sampleBetween(a,b),v=df(x),defined=checkDomain(raw,x);
  rows.push([']'+fmt(a)+' ; '+fmt(b)+'[',!defined?'hors domaine':v>0?'croissante':v<0?'décroissante':v===0?'constante':'à étudier',!defined?'—':v>0?'+':v<0?'−':v===0?'0':'non défini']);
 }
 const limits:FunctionAnalysis['limits']=[],asymptotes:Asymptote[]=[],cache=new Map<string,string|null>();
 const limit=(formula:string,at:string,side='both')=>{const key=formula+'@'+at+'@'+side;if(!cache.has(key))cache.set(key,safeLimit(formula,at,side));return cache.get(key)!;};
 // Domain boundaries are proved before interpreting a one-sided limit.
 const rawEdge=boundaries([raw],xmin,xmax,false);
 if(rawEdge.complete){
  const all=[-Infinity,...rawEdge.cuts.map(v=>v.x),Infinity];
  for(const direction of [-1,1]){
   const index=direction<0?0:all.length-2,sample=sampleBetween(all[index],all[index+1]);if(!checkDomain(raw,sample))continue;
   const at=direction<0?'-Infinity':'Infinity',label=direction<0?'−∞':'+∞',value=limit(raw,at);
   if(value!==null){limits.push({label:'Quand x → '+label,latex:'\\lim_{x\\to '+(direction<0?'-':'')+'\\infty} f(x)='+valueTex(value)});
    if(Number.isFinite(asReal(value)))asymptotes.push({kind:'horizontal',latex:'y='+tex(value),direction:label,slope:0,intercept:asReal(value)});
    else{const slope=limit('('+raw+')/x',at);if(slope!==null&&Number.isFinite(asReal(slope))&&asReal(slope)!==0){const intercept=limit('('+raw+')-('+slope+')*x',at);if(intercept!==null&&Number.isFinite(asReal(intercept)))asymptotes.push({kind:'oblique',latex:'y='+tex(exact('('+slope+')*x+('+intercept+')')),direction:label,slope:asReal(slope),intercept:asReal(intercept)});}}
   }
  }
  for(let i=0;i<rawEdge.cuts.length&&i<12;i++){
   const boundary=rawEdge.cuts[i];let vertical=false;
   for(const side of ['left','right']){
    const other=side==='left'?all[i]:all[i+2],sample=sampleBetween(Math.min(other,boundary.x),Math.max(other,boundary.x));if(!checkDomain(raw,sample))continue;
    const value=limit(raw,boundary.value,side);if(value===null)continue;
    limits.push({label:'En '+fmt(boundary.x)+', à '+(side==='left'?'gauche':'droite'),latex:'\\lim_{x\\to '+tex(boundary.value)+(side==='left'?'^-':'^+')+'} f(x)='+valueTex(value)});
    if(!Number.isFinite(asReal(value)))vertical=true;
   }
   if(vertical)asymptotes.push({kind:'vertical',latex:'x='+tex(boundary.value),direction:'au voisinage',x:boundary.x});
  }
 }
 const merged:Asymptote[]=[];for(const a of asymptotes){const found=merged.find(v=>v.kind===a.kind&&v.latex===a.latex);if(found)found.direction=found.direction+' et '+a.direction;else merged.push({...a});}
 let curvature:FunctionAnalysis['curvature'];const inflections:RemarkablePoint[]=[];
 if(dd){
  const second=setZeros(dd,xmin,xmax),secondEdge=boundaries([raw,d0,dd],xmin,xmax),allCuts=[...new Set([...second.values.map(v=>v.x),...secondEdge.cuts.map(v=>v.x)])].sort((a,b)=>a-b),secondGlobal=second.complete&&secondEdge.complete,ddf=realEvaluator(dd);
  const bound=secondGlobal?[-Infinity,...allCuts,Infinity]:[xmin,...allCuts.filter(x=>x>xmin&&x<xmax),xmax];const curvatureRows:string[][]=[];
  for(let i=0;i<bound.length-1;i++){const a=bound[i],b=bound[i+1],x=sampleBetween(a,b),v=ddf(x);curvatureRows.push([']'+fmt(a)+' ; '+fmt(b)+'[',!checkDomain(raw,x)?'hors domaine':v>0?'convexe':v<0?'concave':v===0?'affine':'à étudier',v>0?'+':v<0?'−':v===0?'0':'—']);}
  curvature={headers:['Intervalle','Courbure','Signe de f″'],rows:curvatureRows,global:secondGlobal};
  for(const root of second.values){
   const index=allCuts.indexOf(root.x),left=allCuts[index-1]??-Infinity,right=allCuts[index+1]??Infinity,h=Math.min(Math.max(1,Math.abs(root.x))*1e-4,(root.x-left)/4,(right-root.x)/4);
   const l=ddf(secondGlobal?sampleBetween(left,root.x):root.x-h),r=ddf(secondGlobal?sampleBetween(root.x,right):root.x+h);
   if(l*r<0&&Number.isFinite(df(root.x))&&!raw.includes('abs')&&certify(root.x-h,root.x+h)){const p=point(root,'inflection');if(p)inflections.push(p);}
  }
 }
 const forbidden=constraints(raw).filter(c=>c.op!=='>=').flatMap(c=>{try{return finiteZeros('('+c.expr+')-('+c.value+')')?.values.map(asReal)??numericalRoots(c.expr,c.value,xmin,xmax);}catch{return [];}});
 const plot=samplePlot(raw,d0,xmin,xmax,forbidden);
 const analysis:FunctionAnalysis={domain:domainTex(raw),derivative:"f'(x)="+tex(d),secondDerivative:dd?"f''(x)="+tex(dd):undefined,zeros:zeroPoints,zeroIdentity:zeros.identity,zerosComplete:zeros.complete,stationaryIdentity:stationary.identity,critical,inflections,asymptotes:merged,limits,variation:global?'global':'window',curvature};
 const notes=['La courbe et la lecture des points sont numériques. Un tracé ne remplace pas une démonstration.'];
 if(!global)notes.push('Les variations sont repérées numériquement dans la fenêtre initiale ['+fmt(xmin)+' ; '+fmt(xmax)+']. La recherche peut manquer des points critiques : ces intervalles ne constituent pas un tableau global démontré.');
 if(!zeros.complete)notes.push('La recherche de zéros porte sur la fenêtre initiale ['+fmt(xmin)+' ; '+fmt(xmax)+'] et peut être incomplète. Modifier le zoom ne relance pas cette recherche.');
 if(raw.includes('abs'))notes.push('Les points où une valeur absolue s’annule demandent une vérification séparée de la dérivabilité.');
 steps.push({title:'Étudier le signe de la dérivée',text:global?'Les zéros de f′ et les frontières du domaine découpent les intervalles de variation.':'Repérer les changements dans la fenêtre. Les recherches numériques sont indiquées comme telles.'});
 if(dd)steps.push({title:'Examiner la convexité',text:'Le signe de f″ indique les intervalles convexes et concaves. Un changement de signe, avec une tangente existante, repère un point d’inflexion.',latex:"f''(x)="+tex(dd)});
 if(merged.length)steps.push({title:'Rechercher les asymptotes',text:'Les limites infinies en une borne donnent les asymptotes verticales. À l’infini, vérifier f(x) − (ax + b) → 0 pour une droite oblique.'});
 return {title:'Étude de la fonction',method:'analysis',latex:analysis.derivative,exact:d,steps,notes,analysis,table:{headers:['Intervalle','Variation','Signe de f′'],rows},plot:{...plot,markers:[...zeroPoints,...critical,...inflections],asymptotes:merged}};
}

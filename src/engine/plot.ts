import {constraints,onlyVariables,parse,evaluateNode} from './expression';
import {domainCertifier,realEvaluator} from './numerical';
import type {Plot} from './types';

export function samplePlot(expression:string,derivative:string,xmin:number,xmax:number,breaks:number[]=[]):Pick<Plot,'expression'|'derivative'|'points'|'xmin'|'xmax'|'breaks'|'yRange'> {
 if(!Number.isFinite(xmin)||!Number.isFinite(xmax)||xmin>=xmax||xmax-xmin>1e6)throw new Error('Choisis une fenêtre croissante, de largeur au plus égale à 1 000 000.');
 onlyVariables(expression,['x']);parse(derivative);
 if(/\b(floor|ceil|factorial|sign)\(/.test(expression))throw new Error('Cette fonction nécessite une représentation séparée.');
 const f=realEvaluator(expression),certify=domainCertifier(expression),checks=constraints(expression);
 const points:(number[]|null)[]=[],cache=new Map<number,number>();
 const value=(x:number)=>{if(!cache.has(x))cache.set(x,f(x));return cache.get(x)!;};
 const point=(x:number)=>Number.isFinite(value(x))?[x,value(x)]:null;
 const gap=()=>{if(points.at(-1)!==null)points.push(null);};
 const append=(p:number[]|null)=>{if(!p){gap();return;}const last=points.at(-1);if(!last||last[0]!==p[0])points.push(p);};
 const segment=(a:number,b:number,depth:number)=>{
  const mid=a+(b-a)/2,ya=value(a),yb=value(b),ym=value(mid);
  const finite=[ya,yb,ym].every(Number.isFinite),safe=!checks.length||certify(a,b,6);
  const scale=Math.max(1,Math.abs(ya),Math.abs(yb),Math.abs(ym));
  const curved=finite&&Math.abs(ym-(ya+yb)/2)>.0015*scale;
  if(depth>0&&cache.size<8000&&(!finite||!safe||curved)){segment(a,mid,depth-1);segment(mid,b,depth-1);return;}
  append(point(a));if(!safe||!finite)gap();append(point(b));
 };
 const uniform=Array.from({length:385},(_,i)=>xmin+(xmax-xmin)*i/384),xs=[...new Set([...uniform,...breaks.filter(x=>x>=xmin&&x<=xmax)])].sort((a,b)=>a-b);
 const ys=uniform.map(value).filter(Number.isFinite).sort((a,b)=>a-b);
 for(let i=0;i<xs.length-1;i++)segment(xs[i],xs[i+1],5);
 if(!points.some(Boolean))throw new Error('Aucun point réel représentable dans cette fenêtre. Change les bornes.');
 // Adaptive density near a pole must not distort automatic ordinate scaling.
 const yRange:[number,number]=[ys[Math.floor(ys.length*.04)]??-1,ys[Math.floor(ys.length*.96)]??1];
 return {expression,derivative,points,xmin,xmax,breaks,yRange};
}
export function probePlot(expression:string,derivative:string,x:number):{x:number;y:number|null;slope:number|null}{
 if(!Number.isFinite(x))throw new Error('Abscisse invalide.');
 const y=realEvaluator(expression)(x),slope=realEvaluator(derivative)(x);
 let regular=true;parse(expression).traverse((n:any)=>{if(n.isFunctionNode&&n.fn.name==='abs'&&evaluateNode(n.args[0],{x})===0)regular=false;});
 return {x,y:Number.isFinite(y)?y:null,slope:regular&&Number.isFinite(slope)?slope:null};
}

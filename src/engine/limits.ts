import {expression,tex,inputTex,exact,asReal,constraints,onlyVariables} from './expression';
import {domainIntervals,domainTex} from './domain';
import {realConstant,symbolicLimit,limitValueTex,localSigns,constantSign} from './symbolic-limit';
import type {Request,Result,Step} from './types';

type Sides={left:boolean|null;right:boolean|null};
function compare(a:string,b:string):number|null {
 if(a===b)return 0;
 if(a.includes('Infinity')||b.includes('Infinity'))return Math.sign(asReal(a)-asReal(b));
 try{return constantSign(exact('('+a+')-('+b+')'));}catch{return null;}
}
function accessibleSides(raw:string,point:string):Sides {
 const intervals=domainIntervals(raw);
 if(intervals!==null){
  if(point.includes('Infinity')){const permitted=intervals.some(i=>point==='Infinity'?i.b==='Infinity':i.a==='-Infinity');return {left:permitted,right:permitted};}
  let left=false,right=false;
  for(const i of intervals){
   const a=compare(i.a,point),b=compare(i.b,point);if(a===null||b===null)return {left:null,right:null};
   if(a<0&&b>=0)left=true;if(a<=0&&b>0)right=true;
  }
  return {left,right};
 }
 if(point.includes('Infinity'))return {left:null,right:null};
 // Periodic constraints need no global list of zeros to certify a local
 // approach. The first nonzero derivative gives the sign near a zero of an
 // analytic expression; no floating-point sampling is used to pick a side.
 const sides:Sides={left:true,right:true};
 for(const c of constraints(raw)){
  const signs=localSigns('('+c.expr+')-('+c.value+')',point);
  const accepts=(sign:number|null)=>sign===null?null:c.op==='!='?sign!==0:c.op==='>'?sign>0:sign>=0;
  const allowed:Sides={left:accepts(signs.left),right:accepts(signs.right)};
  for(const side of ['left','right'] as const)sides[side]=sides[side]===false||allowed[side]===false?false:sides[side]===null||allowed[side]===null?null:true;
 }
 return sides;
}

export function computeLimit(raw:string,req:Request):Result {
 const value=(req.params.point??'0').trim().replace(/−|–/g,'-');
 if(!value)throw new Error('Indique le nombre vers lequel x s’approche, ou touche +∞ / −∞.');
 let point=/^[+]?inf(inity)?$|^\+?∞$/i.test(value)?'Infinity':/^-inf(inity)?$|^-∞$/i.test(value)?'-Infinity':expression(value);
 if(!point.includes('Infinity')){
  onlyVariables(point,[]);const real=realConstant(point);
  if(real===null)throw new Error('Le point d’approche doit être un nombre réel : par exemple 0, 2 ou 1/2.');
  point=real;
 }
 const requested=req.params.side??'both';
 if(!['auto','left','right','both'].includes(requested))throw new Error('Choisis une approche dans la liste.');
 const sides=accessibleSides(raw,point),infinite=point.includes('Infinity');
 let direction=infinite?'both':requested;
 if(!infinite&&requested==='auto'){
  if(sides.left===true&&sides.right===false)direction='left';
  else if(sides.right===true&&sides.left===false)direction='right';
  else if(sides.left===true&&sides.right===true)direction='both';
 }
 const required=infinite?['right'] as const:direction==='left'?['left'] as const:direction==='right'?['right'] as const:['left','right'] as const;
 if(required.some(side=>sides[side]===null))throw new Error('Le domaine près de ce point n’a pas pu être établi. Vérifie la formule ou essaie une limite plus simple.');
 if(required.some(side=>sides[side]===false)){
  if(!infinite&&(sides.left||sides.right))throw new Error('La fonction est définie seulement '+(sides.right?'pour x plus grand que ce nombre. Choisis « Par valeurs plus grandes ».':'pour x plus petit que ce nombre. Choisis « Par valeurs plus petites ».'));
  throw new Error(infinite?'La fonction n’est pas définie pour des valeurs de x qui vont vers cet infini. Choisis un nombre de son domaine.':'On ne peut pas s’approcher de ce nombre dans le domaine de la fonction. Choisis un autre nombre.');
 }
 const pointTex=infinite?point==='Infinity'?'+\\infty':'-\\infty':tex(point);
 const formula=(side:string,output?:string)=>'\\lim_{x\\to '+(side==='left'||side==='right'?'{'+pointTex+'}'+(side==='left'?'^-':'^+'):pointTex)+'}'+inputTex(raw)+(output===undefined?'':'='+limitValueTex(output,tex));
 const steps:Step[]=[{title:'Vérifier où la fonction existe',text:'Le domaine indique les valeurs de x autorisées. Une limite étudie ce qui se passe quand x s’approche de la valeur choisie.',latex:domainTex(raw)}];
 const read=(side:string)=>{
  const output=symbolicLimit(raw,point,side);
  if(output===null)throw new Error('Le calcul symbolique n’a pas établi cette limite. Vérifie les parenthèses et le point d’approche. Certaines fonctions oscillantes n’ont pas de limite.');
  return output;
 };
 let output:string;
 if(direction==='both'&&!infinite){
  const left=read('left'),right=read('right');
  steps.push({title:'S’approcher par les deux côtés',text:'À gauche, x est plus petit que '+value+' ; à droite, x est plus grand. Les deux résultats doivent être identiques.',latex:'\\begin{aligned}'+formula('left',left)+'\\\\'+formula('right',right)+'\\end{aligned}'});
  if(left!==right&&compare(left,right)!==0){
   steps.push({title:'Comparer les résultats',text:'Les limites à gauche et à droite sont différentes : il n’existe pas de limite commune.'});
   return {title:'La limite n’existe pas',latex:formula('both')+'\\;\\text{n’existe pas}',steps,notes:['Chaque limite d’un seul côté reste valable. Tu peux choisir « Par valeurs plus petites » ou « Par valeurs plus grandes » pour la calculer séparément.']};
  }
  output=right;
 }else{
  output=read(direction);
  steps.push({title:'Lire l’approche',text:infinite?(point==='Infinity'?'x devient de plus en plus grand.':'x devient de plus en plus négatif.'):(direction==='left'?'x s’approche par des valeurs plus petites.':'x s’approche par des valeurs plus grandes.')+(requested==='auto'&&!infinite?' L’application a choisi ce côté à partir du domaine.':''),latex:formula(direction)});
 }
 steps.push({title:'Conclure',text:'Cette limite décrit le comportement de la fonction près de la valeur choisie. La fonction peut ne pas être définie au point lui-même.',latex:formula(direction,output)});
 return {title:'Limite',method:'exact',latex:formula(direction,output),exact:output,steps,notes:[]};
}

import {cas,expression,tex,exact,simplified,asReal,numeric,parse,evaluateNode,constraints,checkDomain,domainTex,onlyVariables,fmt,param,numericTex} from './expression';
import {polynomialCuts} from './algebra';
import {certifiedDomain,quadrature} from './numerical';
import {analyzeFunction} from './function';
import type {Request,Result,Step} from './types';
function derivativeSteps(raw:string,d:string):Step[]{
 const n:any=parse(raw),s=n.isParenthesisNode?n.content:n;let rule='Dériver terme à terme, puis simplifier sans modifier le domaine.';
 if(s.isOperatorNode&&s.op==='*')rule='Pour un produit, appliquer (uv)′ = u′v + uv′.';
 if(s.isOperatorNode&&s.op==='/')rule='Pour un quotient, appliquer (u/v)′ = (u′v − uv′)/v², lorsque v ≠ 0.';
 if(s.isFunctionNode)rule='Appliquer la dérivation d’une composée : (g ∘ u)′ = u′ × g′(u).';
 return [{title:'Préciser le domaine',text:'Les conditions sont celles de la fonction initiale. Les points où elle n’est pas dérivable sont à examiner séparément.',latex:domainTex(raw)},{title:'Choisir la règle',text:rule},{title:'Obtenir la dérivée',text:'Cette formule s’applique aux points où la fonction est dérivable.',latex:"f'(x)="+tex(d)}];
}
export function calculus(req:Request):Result {
 const raw=expression(req.expression);onlyVariables(raw,['x']);
 if(/\b(floor|ceil|factorial|sign)\(/.test(raw))throw new Error('Cette fonction discontinue ou discrète nécessite une étude séparée.');
 if(req.operation==='derivative'){
  const order=param(req.params,'order','1');if(![1,2,3].includes(order))throw new Error('Choisis un ordre de dérivation de 1 à 3.');
  let d=raw;for(let i=0;i<order;i++)d=cas.diff(d,'x').toString();
  if(d.includes('diff('))throw new Error('Cette dérivée nécessite un traitement séparé.');
  return {title:order===1?'La dérivée':'Dérivée d’ordre '+order,latex:'f^{('+order+')}(x)='+tex(d),exact:d,steps:derivativeSteps(raw,d),notes:raw.includes('abs')?['Pour une valeur absolue, examiner les points où son argument s’annule : la formule avec sign ne prouve pas la dérivabilité en ces points.']:[]};
 }
 if(req.operation==='integral'){
  let primitive='';try{primitive=cas.integrate(raw,'x').toString();}catch{}
  if(/integrate\(|undefined|NaN/.test(primitive))primitive='';
  // A real primitive of 1/x is ln|x| on each connected interval of R*.
  if(simplified('('+raw+')-1/x')==='0')primitive='log(abs(x))';
  const steps:Step[]=[{title:'Vérifier l’intégrande',text:'Une intégrale définie usuelle suppose une fonction continue sur l’intervalle. Une valeur interdite demande une étude d’intégrale impropre.',latex:domainTex(raw)}];
  if(primitive)steps.push({title:'Chercher une primitive',text:'Une primitive F satisfait F′ = f sur chaque intervalle de définition.',latex:'F(x)='+tex(primitive)});
  if(req.params.kind!=='definite'){
   if(!primitive)throw new Error('Aucune primitive explicite n’a été obtenue. Choisis « Intégrale entre deux bornes » pour calculer une valeur numérique.');
   return {title:'Une primitive',method:'exact',latex:'F(x)='+tex(primitive)+'+C',exact:primitive,steps,notes:['C est une constante réelle. La formule est valable sur chaque intervalle où elle est définie.']};
  }
  const a=param(req.params,'lower','0'),b=param(req.params,'upper','1'),lo=Math.min(a,b),hi=Math.max(a,b);
  for(const c of constraints(raw)){const cuts=polynomialCuts('('+c.expr+')-('+c.value+')');if(cuts?.some(x=>x>=lo&&x<=hi&&(c.op==='!='||c.op==='>')))throw new Error('Une valeur interdite se trouve dans l’intervalle : cette intégrale est impropre.');}
  if(!certifiedDomain(raw,a,b))throw new Error('Le domaine sur cet intervalle n’est pas établi : une intégrale impropre ou une étude des singularités peut être nécessaire. Change les bornes.');
  for(let i=0;i<=40;i++)if(!checkDomain(raw,lo+(hi-lo)*i/40)||!Number.isFinite(numeric(raw,lo+(hi-lo)*i/40)))throw new Error('La fonction n’est pas définie sur tout l’intervalle choisi.');
  let result='';if(primitive&&req.params.method!=='numeric')try{result=exact('('+cas(primitive,{x:expression(req.params.upper??'1')}).toString()+')-('+cas(primitive,{x:expression(req.params.lower??'0')}).toString()+')');if(!Number.isFinite(asReal(result)))result='';}catch{}
  const integral='\\int_{'+tex(expression(req.params.lower??'0'))+'}^{'+tex(expression(req.params.upper??'1'))+'}'+tex(raw)+'\\,dx';
  if(result){steps.push({title:'Évaluer aux bornes',text:'Appliquer le théorème fondamental : F(b) − F(a).',latex:tex(result)});return {title:'Valeur de l’intégrale',method:'exact',latex:integral+'='+tex(result),exact:result,approximate:fmt(asReal(result)),steps,notes:[]};}
  const estimate=quadrature(raw,a,b);
  steps.push({title:'Calculer numériquement',text:'La quadrature de Gauss–Kronrod subdivise l’intervalle et compare deux estimations sur chaque portion.',latex:integral+'\\approx '+numericTex(estimate.value)});
  steps.push({title:'Contrôler la convergence',text:estimate.evaluations+' évaluations de la fonction. Écart estimé : '+fmt(estimate.error)+'. Cet écart est un indicateur numérique.'});
  return {title:'Intégrale approchée',method:'numeric',latex:integral+'\\approx '+numericTex(estimate.value),approximate:fmt(estimate.value),numericValues:[estimate.value],steps,notes:['La valeur est une approximation numérique. Aucune primitive explicite n’est nécessaire pour ce calcul.']};
 }
 if(req.operation==='limit'){
  const value=(req.params.point??'0').trim().replace(/−|–/g,'-'),point=/^[+]?inf(inity)?$|^\+?∞$/i.test(value)?'Infinity':/^-inf(inity)?$|^-∞$/i.test(value)?'-Infinity':expression(value);
  if(!point.includes('Infinity'))onlyVariables(point,[]);
  const direction=req.params.side??'both';
  if(!['left','right','both'].includes(direction))throw new Error('Sens de limite invalide.');
  if(/\b(floor|ceil|factorial)\(/.test(raw))throw new Error('Cette fonction discontinue nécessite une étude de limite séparée.');
  let output=cas.limit(raw,'x',point,direction).toString();
  if(direction==='both'&&!point.includes('Infinity')){
   const left=cas.limit(raw,'x',point,'left').toString(),right=cas.limit(raw,'x',point,'right').toString();
   if(left!==right&&simplified('('+left+')-('+right+')')!=='0')throw new Error('Les limites à gauche et à droite sont différentes ou non déterminées. Étudie chaque côté séparément.');
   output=right;
  }
  if(/limit\(|undefined|NaN/.test(output))throw new Error(direction==='both'?'La limite bilatérale n’est pas déterminée. Calcule séparément les limites à gauche et à droite.':'Cette limite n’est pas déterminée symboliquement.');
  const p=asReal(point);if(Number.isFinite(p)){const sides=direction==='both'?[-1,1]:[direction==='left'?-1:1];if(sides.some(sign=>!checkDomain(raw,p+sign*Math.max(1,Math.abs(p))*1e-5)))throw new Error('La fonction n’est pas définie de ce côté du point.');}
  return {title:'Limite',latex:'\\lim_{x\\to '+(point.includes('Infinity')?point.replace('Infinity','\\infty'):tex(point))+(direction==='left'?'^-':direction==='right'?'^+':'')+'}'+tex(raw)+'='+tex(output),exact:output,steps:[{title:'Identifier l’approche',text:direction==='both'?'Les deux côtés doivent conduire à la même limite.':direction==='left'?'x s’approche par valeurs inférieures.':'x s’approche par valeurs supérieures.'},{title:'Transformer l’expression',text:'Le calcul symbolique utilise les identités algébriques et les limites usuelles. Une petite valeur obtenue au voisinage n’est pas une preuve de limite.',latex:tex(raw)},{title:'Conclure',text:'Le résultat porte sur la limite, et ne donne pas nécessairement la valeur de la fonction au point.',latex:tex(output)}],notes:[]};
 }
 const xmin=param(req.params,'xmin','-5'),xmax=param(req.params,'xmax','5');if(xmin>=xmax||xmax-xmin>1e6)throw new Error('Choisis deux bornes croissantes, avec une largeur au plus égale à 1 000 000.');
 const d=cas.diff(raw,'x').toString();if(/diff\(|undefined|NaN/.test(d))throw new Error('La dérivée de cette fonction n’a pas été obtenue.');
 return analyzeFunction(raw,d,xmin,xmax,derivativeSteps(raw,d));
}

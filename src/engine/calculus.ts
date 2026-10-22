import {cas,expression,tex,exact,simplified,asReal,numeric,parse,evaluateNode,constraints,checkDomain,domainTex,onlyVariables,fmt,param,numericTex,substitute} from './expression';
import {polynomialCuts} from './algebra';
import {certifiedDomain,quadrature} from './numerical';
import {analyzeFunction} from './function';
import {differentiate,derivativeTex} from './differentiation';
import {computeLimit} from './limits';
import {rationalValue} from './real-simplify';
import {readableTex} from './math-display';
import {probePlot} from './plot';
import {value} from './toolkit';
import type {Request,Result,Step} from './types';
function derivativeSteps(raw:string,d:string,order=1,formulas=[d]):Step[]{
 const n:any=parse(raw),s=n.isParenthesisNode?n.content:n;let rule='Dériver terme à terme, puis simplifier sans modifier le domaine.';
 if(s.isOperatorNode&&s.op==='*')rule='Pour un produit, appliquer (uv)′ = u′v + uv′.';
 if(s.isOperatorNode&&s.op==='/')rule='Pour un quotient, appliquer (u/v)′ = (u′v − uv′)/v², lorsque v ≠ 0.';
 if(s.isFunctionNode)rule='Appliquer la dérivation d’une composée : (g ∘ u)′ = u′ × g′(u).';
 if(s.isFunctionNode&&['sqrt','cbrt'].includes(s.fn.name))rule='La fonction est une racine composée : dériver aussi l’expression sous la racine.';
 if(s.isOperatorNode&&s.op==='^'){
  const p=rationalValue(s.args[1]);rule=p?.n===1n&&p.d>1n?'La fonction est une racine composée : dériver aussi l’expression sous la racine.':p?'Pour une puissance composée uʳ, appliquer r × u′ × uʳ⁻¹ dans le domaine réel.':'Pour u(x) élevé à v(x), dériver par logarithme dans le domaine où u est strictement positif.';
 }
 let degree:bigint|undefined;parse(raw).traverse((n:any)=>{if(!degree&&n.isFunctionNode&&['sqrt','cbrt'].includes(n.fn.name))degree=n.fn.name==='sqrt'?2n:3n;if(!degree&&n.isOperatorNode&&n.op==='^'){const p=rationalValue(n.args[1]);if(p?.n===1n&&p.d>1n)degree=p.d;}});
 const roots:Step[]=degree?[{title:'Dériver la racine composée',text:degree===2n?'Pour √u, dériver aussi u : le numérateur est u′. Cette règle s’applique pour u > 0 ; les zéros de u se vérifient séparément.':'Pour une racine d’ordre '+degree+', dériver aussi l’expression u placée sous la racine. Cette formule s’applique pour u ≠ 0, dans le domaine réel.',latex:'\\frac{d}{dx}'+(degree===2n?'\\sqrt{u(x)}':'\\sqrt['+degree+']{u(x)}')+'=\\frac{u\u0027(x)}{'+degree+(degree===2n?'\\sqrt{u(x)}':'\\sqrt['+degree+']{u(x)^{'+(degree-1n)+'}}')+'}'}]:[];
 return [{title:'Lire la fonction',text:'Dériver cette expression en conservant ses parenthèses.',latex:'f(x)='+readableTex(raw,false)},{title:'Préciser le domaine',text:'[a ; b] inclut les deux bornes ; ]a ; b[ les exclut. L’infini est toujours exclu.',latex:domainTex(raw)},{title:'Choisir la règle',text:rule},...roots,{title:'Obtenir la dérivée',text:'Cette formule s’applique sur les intervalles où les règles de dérivation sont valables.',latex:(order===1?"f'(x)=":'f^{('+order+')}(x)=')+derivativeTex(d)},{title:'Vérifier le domaine de la formule dérivée',text:'Conserver le domaine initial et les restrictions des dérivées successives. Une borne exclue de cette formule demande un calcul de limite pour vérifier si la dérivée y existe.',latex:domainTex([raw,...formulas]).replace(/^D=/,'D_{\\text{formule}}=')}];
}
export function calculus(req:Request):Result {
 const raw=expression(req.expression);onlyVariables(raw,['x']);
 if(/\b(floor|ceil|factorial|sign)\(/.test(raw))throw new Error('Cette fonction discontinue ou discrète nécessite une étude séparée.');
 if(req.operation==='derivative'){
  const order=param(req.params,'order','1');if(![1,2,3].includes(order))throw new Error('Choisis un ordre de dérivation de 1 à 3.');
  let d=raw;const formulas:string[]=[];for(let i=0;i<order;i++){d=differentiate(d);formulas.push(d);}
  return {title:order===1?'La dérivée':'Dérivée d’ordre '+order,latex:(order===1?"f'(x)=":'f^{('+order+')}(x)=')+derivativeTex(d),exact:d,steps:derivativeSteps(raw,d,order,formulas),notes:raw.includes('abs')?['Aux points où une valeur absolue s’annule, vérifier la dérivabilité avec les limites à gauche et à droite.']:[]};
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
 if(req.operation==='limit')return computeLimit(raw,req);
 const xmin=param(req.params,'xmin','-5'),xmax=param(req.params,'xmax','5');if(xmin>=xmax||xmax-xmin>1e6)throw new Error('Choisis deux bornes croissantes, avec une largeur au plus égale à 1 000 000.');
 const d=differentiate(raw);
 const result=analyzeFunction(raw,d,xmin,xmax,derivativeSteps(raw,d));
 if(req.params.tangentAt?.trim()){
  const at=value(req.params.tangentAt),a=asReal(at),point=probePlot(raw,d,a);
  if(point.y===null||point.slope===null)result.notes.push('La tangente de pente finie n’est pas définie au point demandé ; le point peut être hors domaine ou non dérivable.');
  else{const y=exact(substitute(raw,'x',at)),m=exact(substitute(d,'x',at)),line=exact('('+y+')+('+m+')*(x-('+at+'))'),normal=m==='0'?'x='+tex(at):'y='+tex(exact('('+y+')-(x-('+at+'))/('+m+')'));
   result.analysis!.tangent={at,latex:'y='+readableTex(line,false),normal};result.steps.push({title:'Calculer la tangente exacte',text:'Utiliser y = f(a) + f′(a)(x − a). La normale est perpendiculaire à cette droite.',latex:'y='+readableTex(line,false)});
  }
 }
 return result;
}

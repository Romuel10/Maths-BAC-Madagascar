import {expression,onlyVariables,exact,simplified,cas,tex,domainTex,substitute,checkDomain,asReal} from './expression';
import {differentiate} from './differentiation';
import {coefficients} from './algebra';
import {value,integer,result} from './toolkit';
import type {Request,Result} from './types';
export function extendedCalculation(req:Request,s:string):Result|null {
 const mode=req.params.form;if(!['divide','partial','taylor'].includes(mode))return null;
 const steps=[{title:'Conserver le domaine initial',text:'Une simplification ne rétablit aucune valeur interdite.',latex:domainTex(s)}];
 if(mode==='partial'){
  const numerator=cas(s).getNumerator().toString(),denominator=cas(s).getDenominator().toString();
  if(!coefficients(numerator)||!coefficients(denominator))throw new Error('La décomposition traite les fractions rationnelles de degré au plus 8.');
  const output=cas('partfrac('+s+',x)').toString();if(/partfrac/.test(output)||simplified('('+output+')-('+s+')')!=='0')throw new Error('Aucune décomposition exacte vérifiée n’a été obtenue pour cette fraction.');
  steps.push({title:'Décomposer et vérifier',text:'La somme des fractions obtenues a été remise au même dénominateur et comparée à l’expression initiale.',latex:tex(output)});
  return result('Décomposition en éléments simples',tex(output),steps,{method:'exact',exact:output});
 }
 if(mode==='divide'){
  const divisor=expression(req.params.divisor??'x-1');onlyVariables(divisor,['x']);const a=coefficients(s),b=coefficients(divisor);
  if(!a||!b||b.every(c=>c==='0'))throw new Error('Choisis deux polynômes de degré au plus 8, avec un diviseur non nul.');
  const remainder=[...a],quotient=Array(Math.max(1,a.length-b.length+1)).fill('0');let degree=remainder.length-1;
  while(degree>=b.length-1&&!(degree===0&&remainder[0]==='0')){const k=degree-b.length+1,c=exact('('+remainder[degree]+')/('+b[b.length-1]+')');quotient[k]=c;for(let j=0;j<b.length;j++)remainder[k+j]=exact('('+remainder[k+j]+')-('+c+')*('+b[j]+')');while(degree>0&&remainder[degree]==='0')degree--;if(degree===0&&remainder[0]==='0')break;}
  const polynomial=(co:string[])=>exact(co.map((c,i)=>'('+c+')*x^'+i).join('+')),q=polynomial(quotient),r=polynomial(remainder);
  if(simplified('('+s+')-(('+divisor+')*('+q+')+('+r+'))')!=='0')throw new Error('La division n’a pas pu être vérifiée exactement.');
  steps.push({title:'Lire quotient et reste',text:'P = DQ + R, avec le degré de R strictement inférieur à celui de D.',latex:'Q(x)='+tex(q)+',\\quad R(x)='+tex(r)},{title:'Vérifier la reconstruction',text:'Le produit du diviseur par le quotient, augmenté du reste, redonne le dividende.',latex:tex(s)+'=('+tex(divisor)+')('+tex(q)+')+('+tex(r)+')'});
  return result('Division euclidienne de polynômes','Q(x)='+tex(q)+',\\quad R(x)='+tex(r),steps,{method:'exact',exact:q+';'+r});
 }
 const at=value(req.params.center??'0'),a=asReal(at),order=Number(value(req.params.degree??'4'));integer(order,0,8,'L’ordre de Taylor');
 if(!checkDomain(s,a))throw new Error('Le centre de Taylor est hors du domaine de la fonction.');
 let derivative=s,factorial=1n;const terms:string[]=[],rows:string[][]=[];
 for(let k=0;k<=order;k++){
  if(k){derivative=differentiate(derivative);factorial*=BigInt(k);}
  if(!checkDomain(derivative,a))throw new Error('Une dérivée nécessaire n’est pas définie au centre choisi. Change le centre ou diminue l’ordre.');
  const d=exact(substitute(derivative,'x',at));if(!Number.isFinite(asReal(d)))throw new Error('Une dérivée au centre n’a pas de valeur réelle finie.');
  const coefficient=exact('('+d+')/'+factorial);rows.push([String(k),d,coefficient]);if(coefficient!=='0')terms.push('('+coefficient+')*(x-('+at+'))^'+k);
 }
 const polynomial=exact(terms.join('+')||'0');steps.push({title:'Calculer les dérivées au centre',text:'Le coefficient du degré k vaut f⁽ᵏ⁾(a)/k!.',latex:'T_{'+order+'}(x)=\\sum_{k=0}^{'+order+'}\\frac{f^{(k)}('+tex(at)+')}{k!}(x-('+tex(at)+'))^k'},{title:'Former le polynôme de Taylor',text:'Ce polynôme décrit le comportement local au centre choisi. Il ne donne pas une borne d’erreur globale.',latex:'T_{'+order+'}(x)='+tex(polynomial)});
 return result('Polynôme de Taylor en '+at,'T_{'+order+'}(x)='+tex(polynomial),steps,{method:'exact',exact:polynomial,table:{headers:['Ordre k','Dérivée au centre','Coefficient'],rows},notes:['L’approximation est locale. L’application ne calcule pas ici de majoration du reste.']});
}

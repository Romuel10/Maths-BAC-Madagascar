import {expression,cas,tex,asReal,onlyVariables,domainTex,fmt,constraints,simplified,param,checkDomain,inputTex,structuralKey,substitute,integerValue,decimalApprox} from './expression';
import {withoutFunctionLabel} from './notation';
import {equation,inequality} from './algebra';
import {calculus} from './calculus';
import {advanced} from './tools';
import {guideFor,guidedRequest,hasGuidedData} from '../data/guided';
import type {Request,Result} from './types';
export function solve(req:Request):Result {
 if(hasGuidedData(req)){
  req=guidedRequest(req);
  for(const field of guideFor(req)?.fields??[]){const raw=req.params['data_'+field.key]??field.initial;try{const value=expression(raw);onlyVariables(value,[]);if(!Number.isFinite(asReal(value)))throw new Error();}catch{throw new Error('Renseigne un nombre réel valide pour « '+field.label+' ».');}}
 }

 if(['calculate','function','derivative','integral','limit'].includes(req.operation))req={...req,expression:withoutFunctionLabel(req.expression)};
 if(req.operation==='equation')return equation(req.expression,req.params);
 if(req.operation==='inequality')return inequality(req.expression);
 if(['function','derivative','integral','limit'].includes(req.operation))return calculus(req);
 if(req.operation!=='calculate')return advanced(req);
 if(/<=|>=|[<>≤≥]/.test(req.expression))return inequality(req.expression);
 if(req.expression.includes('='))return equation(req.expression,req.params);
 const s=expression(req.expression,req.params.angle??'rad');onlyVariables(s,['x']);
 const mode=req.params.form??'simplify';
 if(!['simplify','expand','factor','evaluate'].includes(mode))throw new Error('Choisis le calcul souhaité.');
 if(mode==='evaluate'){
  const x=param(req.params,'xvalue','0');if(!checkDomain(s,x))throw new Error('Cette valeur de x est interdite dans l’expression initiale. Choisis une valeur de son domaine.');
  const substituted=substitute(s,'x',req.params.xvalue??'0'),output=integerValue(substituted)??cas(substituted).toString(),approximate=decimalApprox(output);
  if(approximate===undefined&&!/^[-]?\d+(?:\/\d+)?$/.test(output))throw new Error('Cette expression ne donne pas une valeur réelle représentable pour ce x.');
  return {title:'Valeur pour x = '+fmt(x),method:'exact',latex:tex(output),exact:output,approximate,steps:[{title:'Lire la formule',text:'Partir de l’expression saisie.',latex:inputTex(req.expression)},{title:'Remplacer x',text:'Substituer la valeur choisie après avoir vérifié le domaine.',latex:'x='+tex(expression(req.params.xvalue??'0'))},{title:'Effectuer le calcul',text:'Conserver la valeur exacte et afficher son approximation décimale.',latex:tex(output)}],notes:[]};
 }
 const variable=/\bx\b/.test(s);
 const integer=variable?null:integerValue(s);
 const output=integer??(mode==='factor'?cas.factor(s).toString():mode==='expand'?cas.expand(s).toString():cas.simplify(s).toString());
 const approximate=variable?undefined:decimalApprox(output);
 const unchanged=variable&&structuralKey(s)===structuralKey(output);
 if(!variable&&approximate===undefined&&!/^[-]?\d+(?:\/\d+)?$/.test(output))throw new Error('Ce calcul sort du domaine réel ou dépasse la plage numérique. Pour un nombre complexe, choisis l’outil « Complexes ».');
 return {title:unchanged?(mode==='factor'?'Aucune autre factorisation obtenue':mode==='expand'?'Forme déjà développée':'Forme déjà simplifiée'):mode==='factor'?'Forme factorisée':mode==='expand'?'Forme développée':'Résultat du calcul',method:unchanged?'unchanged':'exact',latex:tex(output),exact:output,approximate,steps:[{title:'Lire l’expression',text:'Les parenthèses et les exposants fixent l’ordre des opérations.',latex:inputTex(req.expression)},{title:'Conserver les conditions',text:'Les conditions initiales restent valables après simplification.',latex:domainTex(s)},{title:unchanged?'Préciser le résultat':'Calculer',text:unchanged?'Le moteur n’a pas obtenu de transformation supplémentaire. La présence de x ne permet pas de donner un nombre sans choisir sa valeur.':mode==='factor'?'Regrouper les facteurs communs.':mode==='expand'?'Appliquer la distributivité puis regrouper les termes semblables.':'Effectuer le calcul symbolique et conserver les fractions exactes.',latex:tex(output)}],notes:unchanged?['Pour obtenir un nombre, choisis « Calculer pour x = … ». Pour résoudre une équation, écris les deux membres avec =.']:[]};
}
export function compareAnswer(answer:string,expected:string):boolean {
 try{const a=expression(answer),b=expression(expected);onlyVariables(a,['x']);onlyVariables(b,['x']);
 const expectedConstraints=constraints(b);
 for(const c of constraints(a)){
  const matched=expectedConstraints.some(d=>{if(c.op!==d.op)return false;try{const ratio=asReal(simplified('('+c.expr+'-('+c.value+'))/('+d.expr+'-('+d.value+'))'));return Number.isFinite(ratio)&&(c.op==='!='?ratio!==0:ratio>0);}catch{return false;}});
  if(!matched){try{onlyVariables(c.expr,[]);const value=asReal(c.expr)-Number(c.value);if(!(c.op==='!='?value!==0:c.op==='>'?value>0:value>=0))return false;}catch{return false;}}
 }
 return cas.simplify('('+a+')-('+b+')').toString()==='0';}catch{return false;}
}

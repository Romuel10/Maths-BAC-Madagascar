import {expression,cas,tex,exact,asReal,onlyVariables,domainTex,fmt,numeric,constraints,simplified} from './expression';
import {equation,inequality} from './algebra';
import {calculus} from './calculus';
import {advanced} from './tools';
import type {Request,Result} from './types';
export function solve(req:Request):Result {
 if(req.operation==='equation')return equation(req.expression);
 if(req.operation==='inequality')return inequality(req.expression);
 if(['function','derivative','integral','limit'].includes(req.operation))return calculus(req);
 if(req.operation!=='calculate')return advanced(req);
 const s=expression(req.expression);onlyVariables(s,['x']);
 const mode=req.params.form??'simplify';
 const output=mode==='factor'?cas.factor(s).toString():mode==='expand'?cas.expand(s).toString():cas.simplify(s).toString();
 const numericResult=asReal(output);
 if(!s.includes('x')&&!Number.isFinite(numericResult))throw new Error('Ce calcul ne donne pas un nombre réel fini. Pour un nombre complexe, choisis l’outil « Complexes ».');
 return {title:mode==='factor'?'Forme factorisée':mode==='expand'?'Forme développée':'Résultat du calcul',latex:tex(output),exact:output,approximate:Number.isFinite(numericResult)?fmt(numericResult):undefined,steps:[{title:'Lire l’expression',text:'Les parenthèses et les exposants fixent l’ordre des opérations.',latex:tex(s)},{title:'Conserver les conditions',text:'Les conditions initiales restent valables après simplification.',latex:domainTex(s)},{title:'Calculer',text:mode==='factor'?'Regrouper les facteurs communs.':mode==='expand'?'Appliquer la distributivité puis regrouper les termes semblables.':'Effectuer le calcul symbolique et conserver les fractions exactes.',latex:tex(output)}],notes:[]};
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

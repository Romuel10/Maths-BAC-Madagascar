import { numericRoots } from './numericRoots.js';
import { parseRationalPolynomial, rationalExcludedPoints } from './rationalEngine.js';
import { polynomialSub, polynomialScale, polynomialDegree } from './polynomialEngine.js';
import { solveQuadraticReal } from './algebraCore.js';
import { safeEvaluateExpression } from './expressionCore.js';

export interface EquationVerification { x:number; fx:number|null; residual:number|null; ok:boolean; }
export interface EquationResult {
 solutions:number[]; method:string; steps:string[]; verifications:EquationVerification[]; exact:boolean;
 searchInterval:[number,number]; warning?:string; quality:'verified'|'approximate'|'warning'; allDomain?:boolean;
}
const fmt=(n:number)=>n!==0&&Math.abs(n)<1e-8?String(n):String(Math.round(n*1e10)/1e10);
function evalExpr(expr:string,x:number){return safeEvaluateExpression(expr,{x});}
function verify(expr:string,k:number,roots:number[]):EquationVerification[]{return roots.map(x=>{const fx=evalExpr(expr,x),residual=fx===null?null:Math.abs(fx-k),tol=1e-7*Math.max(1,Math.abs(k),Math.abs(fx??0));return{x,fx,residual,ok:residual!==null&&residual<=tol};});}
function numericCandidates(expr:string,k:number,xMin:number,xMax:number):number[]{return numericRoots(`(${expr})-(${k})`,xMin,xMax);}

export function solveEquationVerified(expr:string,k:number,xMin=-20,xMax=20):EquationResult{
 if(!(xMin<xMax)||!Number.isFinite(k))throw new Error('Paramètres invalides.');
 const steps=[`On transforme f(x)=${fmt(k)} en f(x)-${fmt(k)}=0.`];
 const rat=parseRationalPolynomial(expr,'x',12);
 if(rat){
  const target=polynomialSub(rat.num,polynomialScale(rat.den,k)); const ex=rationalExcludedPoints(rat);
  if(polynomialDegree(target)<=2&&ex.complete){
   const a=target[2]||0,b=target[1]||0,c=target[0]||0,sol=solveQuadraticReal(a,b,c);
   steps.push('L’expression est rationnelle : on résout exactement le numérateur de f(x)-k et on conserve les valeurs interdites du dénominateur.');
   if(ex.points.length)steps.push(`Valeur(s) interdite(s) : ${ex.points.map(fmt).join(', ')}.`);
   if(sol.kind==='all')return{solutions:[],method:'Identité rationnelle',steps:[...steps,'Le numérateur est identiquement nul : toute valeur du domaine convient.'],verifications:[],exact:true,searchInterval:[xMin,xMax],warning:'L’ensemble solution est le domaine de définition.',quality:'verified',allDomain:true};
   if(sol.kind==='none')return{solutions:[],method:'Résolution rationnelle exacte',steps:[...steps,'Aucune solution réelle.'],verifications:[],exact:true,searchInterval:[xMin,xMax],quality:'verified'};
   const candidates=sol.roots.filter(x=>!ex.points.some(p=>Math.abs(p-x)<=1e-9*Math.max(1,Math.abs(x))));
   const verifications=verify(expr,k,candidates),solutions=candidates.filter((_,i)=>verifications[i].ok);
   if(a!==0)steps.push(`On résout ${fmt(a)}x²+${fmt(b)}x+${fmt(c)}=0 ; Δ=${fmt(sol.delta??0)}.`);else if(b!==0)steps.push(`On résout ${fmt(b)}x+${fmt(c)}=0.`);
   steps.push(...verifications.map(v=>`Vérification : f(${fmt(v.x)})=${v.fx===null?'non défini':fmt(v.fx)}, résidu=${v.residual===null?'indéfini':fmt(v.residual)}.`));
   const ok=solutions.length===candidates.length&&sol.verification.every(v=>v.ok);
   return{solutions,method:'Résolution algébrique exacte',steps,verifications,exact:true,searchInterval:[xMin,xMax],quality:ok?'verified':'warning'};
  }
 }
 const candidates=numericCandidates(expr,k,xMin,xMax),verifications=verify(expr,k,candidates),solutions=candidates.filter((_,i)=>verifications[i].ok);
 steps.push(`La forme n’est pas résolue algébriquement par le moteur scolaire : recherche numérique uniquement sur [${fmt(xMin)} ; ${fmt(xMax)}].`);
 if(candidates.length)steps.push(...verifications.map(v=>`Contrôle : |f(${fmt(v.x)})-${fmt(k)}|=${v.residual===null?'indéfini':fmt(v.residual)} ${v.ok?'retenue':'rejetée'}.`));else steps.push('Aucune racine détectée dans cette fenêtre ; cela ne prouve pas l’absence de solution hors de la fenêtre.');
 const rejected=candidates.length-solutions.length;
 return{solutions,method:'Recherche numérique contrôlée',steps,verifications,exact:false,searchInterval:[xMin,xMax],warning:`Recherche limitée à [${fmt(xMin)} ; ${fmt(xMax)}].${rejected?` ${rejected} candidat(s) écarté(s) par substitution.`:''}`,quality:rejected?'warning':'approximate'};
}

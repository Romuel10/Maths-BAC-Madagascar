import { safeEvaluateExpression } from './expressionCore.js';
import { parsePolynomial, polynomialDegree, polynomialValue, polynomialDerivative } from './polynomialEngine.js';
import { parseExpressionCore, evaluateConstantNode } from './expressionCore.js';
import { parseRationalPolynomial, rationalLimitAtInfinity, rationalExcludedPoints } from './rationalEngine.js';
import type { DNode } from './derivativeEngine.js';

export interface SequenceResult {
 type: 'explicit' | 'recursive';
 expression: string;
 u0: number;
 startIndex: number;
 terms: { n: number; value: number }[];
 behavior: 'increasing' | 'decreasing' | 'oscillating' | 'constant' | 'unknown';
 bounded: { above: boolean; below: boolean; supBound: number | null; infBound: number | null };
 convergence: { converges: boolean; limit: number | null; explanation: string };
 isArithmetic: { yes: boolean; reason: number | null };
 isGeometric: { yes: boolean; ratio: number | null };
 sumFormula: string;
 plotData: { n: number; value: number }[];
 quality: { level: 'verified' | 'approximate' | 'warning'; detail: string };
 proofSteps: string[];
}

const EPS = 1e-11;
const close=(a:number,b:number)=>Math.abs(a-b)<=EPS*Math.max(1,Math.abs(a),Math.abs(b));
function finite(v: unknown): v is number { return typeof v==='number' && Number.isFinite(v); }
function rounded(v:number):number { return Math.round(v*1e10)/1e10; }

function generate(expr:string,u0:number,type:'explicit'|'recursive',count:number,startIndex=0){
 const terms:{n:number;value:number}[]=[];
 if(type==='explicit'){
  for(let i=0;i<count;i++){
   const n=startIndex+i;
   const v=safeEvaluateExpression(expr,{n,x:n}); if(v===null||!finite(v)) break; terms.push({n,value:rounded(v)});
  }
 } else {
  let current=u0; if(!Number.isFinite(current)) return terms;
  terms.push({n:0,value:rounded(current)});
  for(let n=1;n<count;n++){
   const v=safeEvaluateExpression(expr,{x:current,u:current,n}); if(v===null||!finite(v)) break; current=v; terms.push({n,value:rounded(current)});
  }
 }
 return terms;
}

function observedBehavior(terms:{n:number;value:number}[]):SequenceResult['behavior']{
 if(terms.length<2) return 'unknown';
 const ds=terms.slice(1).map((t,i)=>t.value-terms[i].value);
 if(ds.every(d=>Math.abs(d)<=1e-9)) return 'constant';
 if(ds.every(d=>d>=-1e-9)) return 'increasing';
 if(ds.every(d=>d<=1e-9)) return 'decreasing';
 return 'oscillating';
}


function isNaturalIndex(x:number,startIndex:number):boolean {
 return x>=startIndex-1e-10 && Math.abs(x-Math.round(x))<=1e-9*Math.max(1,Math.abs(x));
}

function polynomialOneSidedBound(p:number[],startIndex:number):{above:boolean;below:boolean;supBound:number|null;infBound:number|null;detail:string}{
 const deg=polynomialDegree(p),lead=p[deg]||0;
 if(deg<=0){const c=polynomialValue(p,startIndex);return{above:true,below:true,supBound:rounded(c),infBound:rounded(c),detail:'Suite constante.'};}
 const dp=polynomialDerivative(p),ddeg=polynomialDegree(dp),dlead=dp[ddeg]||0;
 // Cauchy : toutes les racines réelles/complexes de P' sont dans |x| <= 1+max |a_i/a_d|.
 let rootBound=startIndex;
 if(ddeg>0 && Math.abs(dlead)>EPS){
  let ratio=0; for(let i=0;i<ddeg;i++) ratio=Math.max(ratio,Math.abs((dp[i]||0)/dlead));
  rootBound=Math.max(startIndex,1+ratio);
 }
 const end=Math.ceil(rootBound)+2;
 if(end-startIndex>200000){
  return lead>0
   ? {above:false,below:true,supBound:null,infBound:null,detail:'Le coefficient dominant positif implique une borne inférieure, mais sa valeur n’est pas calculée automatiquement.'}
   : {above:true,below:false,supBound:null,infBound:null,detail:'Le coefficient dominant négatif implique une borne supérieure, mais sa valeur n’est pas calculée automatiquement.'};
 }
 let min=Infinity,max=-Infinity;
 for(let n=startIndex;n<=end;n++){const v=polynomialValue(p,n);if(Number.isFinite(v)){min=Math.min(min,v);max=Math.max(max,v);}}
 return lead>0
  ? {above:false,below:true,supBound:null,infBound:Number.isFinite(min)?rounded(min):null,detail:`Au-delà de n=${end}, P'(x) garde le signe positif du terme dominant ; le minimum entier est donc recherché sur un préfixe fini démontré.`}
  : {above:true,below:false,supBound:Number.isFinite(max)?rounded(max):null,infBound:null,detail:`Au-delà de n=${end}, P'(x) garde le signe négatif du terme dominant ; le maximum entier est donc recherché sur un préfixe fini démontré.`};
}

function explicitGeometric(expr:string):{a:number;q:number}|null{
 try{
  const root=parseExpressionCore(expr);
  const readPow=(node:DNode):{coef:number;q:number}|null=>{
   if(node.kind==='bin'&&node.op==='^'&&node.right.kind==='sym'&&node.right.name==='n'){const q=evaluateConstantNode(node.left);return q!==null?{coef:1,q}:null;}
   if(node.kind==='bin'&&node.op==='*'){const lc=evaluateConstantNode(node.left),rc=evaluateConstantNode(node.right);if(lc!==null){const p=readPow(node.right);return p?{coef:lc*p.coef,q:p.q}:null;}if(rc!==null){const p=readPow(node.left);return p?{coef:rc*p.coef,q:p.q}:null;}}
   return null;
  };
  const r=readPow(root);return r?{a:r.coef,q:r.q}:null;
 }catch{return null;}
}
export function analyzeSequenceVerified(expr:string,u0:number,type:'explicit'|'recursive',count=20,startIndex=0):SequenceResult{
 count=Math.max(5,Math.min(200,Math.floor(count)||20));
 startIndex=Math.max(0,Math.floor(startIndex)||0);
 const terms=generate(expr,u0,type,count,startIndex);
 const base:SequenceResult={
  type,expression:expr,u0,startIndex,terms,behavior:'unknown',
  bounded:{above:false,below:false,supBound:null,infBound:null},
  convergence:{converges:false,limit:null,explanation:'Aucune conclusion générale démontrée.'},
  isArithmetic:{yes:false,reason:null},isGeometric:{yes:false,ratio:null},sumFormula:'',plotData:terms,
  quality:{level:'warning',detail:'Analyse insuffisante.'},proofSteps:[]
 };
 if(terms.length<2){ base.quality.detail='Pas assez de termes définis.'; return base; }

 if(type==='recursive'){
  const p=parsePolynomial(expr,'x',1);
  if(p && polynomialDegree(p)<=1){
   const b=p[0]||0,a=p[1]||0;
   const proof=[`La récurrence est affine : u_(n+1) = ${a}u_n + ${b}.`];
   base.quality={level:'verified',detail:'Les propriétés annoncées proviennent de la forme exacte de la récurrence, pas des seuls termes affichés.'};
   if(close(a,1)){
    base.isArithmetic={yes:true,reason:rounded(b)};
    base.sumFormula=`S_n = (n+1)(u_0+u_n)/2`;
    if(close(b,0)){
     base.behavior='constant'; base.convergence={converges:true,limit:rounded(u0),explanation:`u_(n+1)=u_n, donc u_n=${rounded(u0)} pour tout n.`};
     base.bounded={above:true,below:true,supBound:rounded(u0),infBound:rounded(u0)};
     proof.push('La raison vaut 0 : la suite est constante.');
    } else {
     base.behavior=b>0?'increasing':'decreasing';
     base.convergence={converges:false,limit:null,explanation:`Suite arithmétique de raison ${rounded(b)} ≠ 0 : elle ne converge pas vers une limite réelle finie.`};
     base.bounded=b>0?{above:false,below:true,supBound:null,infBound:rounded(u0)}:{above:true,below:false,supBound:rounded(u0),infBound:null};
     proof.push(`u_n = u_0 + n r avec r=${rounded(b)}.`);
    }
    base.proofSteps=proof; return base;
   }

   const L=b/(1-a);
   proof.push(`Le point fixe vérifie L=${a}L+${b}, donc L=${rounded(L)}.`);
   proof.push(`u_n-L = (${rounded(a)})^n (u_0-L).`);
   if(close(b,0)) { base.isGeometric={yes:true,ratio:rounded(a)}; base.sumFormula=close(a,1)?'':`S_n = u_0(1-q^(n+1))/(1-q)`; }
   if(close(u0,L)){
    base.behavior='constant'; base.convergence={converges:true,limit:rounded(L),explanation:'Le terme initial est le point fixe : la suite est constante.'};
    base.bounded={above:true,below:true,supBound:rounded(L),infBound:rounded(L)};
   } else if(Math.abs(a)<1){
    base.convergence={converges:true,limit:rounded(L),explanation:`Comme |${rounded(a)}|<1, (${rounded(a)})^n→0, donc u_n→${rounded(L)}.`};
    if(a>=0) base.behavior=u0<L?'increasing':'decreasing'; else base.behavior='oscillating';
    const radius=Math.abs(u0-L); base.bounded={above:true,below:true,supBound:rounded(L+radius),infBound:rounded(L-radius)};
   } else if(close(a,-1)){
    base.behavior='oscillating'; base.convergence={converges:false,limit:null,explanation:'Pour a=-1 et u₀≠L, la suite alterne entre deux valeurs : elle ne converge pas.'};
    base.bounded={above:true,below:true,supBound:rounded(Math.max(u0,2*L-u0)),infBound:rounded(Math.min(u0,2*L-u0))};
   } else if(a>1){
    base.behavior=u0>L?'increasing':'decreasing'; base.convergence={converges:false,limit:null,explanation:`Comme ${rounded(a)}>1 et u₀≠L, |u_n-L| croît : pas de limite réelle finie.`};
    base.bounded=u0>L?{above:false,below:true,supBound:null,infBound:rounded(u0)}:{above:true,below:false,supBound:rounded(u0),infBound:null};
   } else {
    base.behavior='oscillating'; base.convergence={converges:false,limit:null,explanation:`Comme |${rounded(a)}|>1 et a<0, les écarts au point fixe alternent et grandissent.`};
    base.bounded={above:false,below:false,supBound:null,infBound:null};
   }
   base.proofSteps=proof; return base;
  }
 }

 if(type==='explicit'){
  const geo=explicitGeometric(expr);
  if(geo){
   const {a,q}=geo; const first=a*Math.pow(q,startIndex);
   base.isGeometric={yes:true,ratio:rounded(q)}; base.quality={level:'verified',detail:'La forme exacte a·q^n est reconnue algébriquement.'}; base.proofSteps=[`u_n=${rounded(a)}×(${rounded(q)})^n, pour n≥${startIndex}.`];
   if(close(a,0)){base.behavior='constant';base.convergence={converges:true,limit:0,explanation:'Le coefficient initial vaut 0 : u_n=0 pour tout n.'};base.bounded={above:true,below:true,supBound:0,infBound:0};base.sumFormula='S=0';return base;}
   if(close(q,1)){base.behavior='constant';base.convergence={converges:true,limit:rounded(a),explanation:'q=1 : la suite est constante.'};base.bounded={above:true,below:true,supBound:rounded(a),infBound:rounded(a)};}
   else if(Math.abs(q)<1){base.behavior=q>=0?(first>=0?'decreasing':'increasing'):'oscillating';base.convergence={converges:true,limit:0,explanation:`Comme |q|=${rounded(Math.abs(q))}<1, q^n→0, donc u_n→0.`};const radius=Math.abs(first);base.bounded={above:true,below:true,supBound:rounded(radius),infBound:rounded(-radius)};}
   else if(close(q,-1)){base.behavior='oscillating';base.convergence={converges:false,limit:null,explanation:'q=-1 : la suite alterne entre deux valeurs non nulles.'};base.bounded={above:true,below:true,supBound:rounded(Math.abs(a)),infBound:rounded(-Math.abs(a))};}
   else if(q>1){base.behavior=first>=0?'increasing':'decreasing';base.convergence={converges:false,limit:null,explanation:`Comme q=${rounded(q)}>1 et a≠0, |u_n|→∞.`};base.bounded=first>=0?{above:false,below:true,supBound:null,infBound:rounded(first)}:{above:true,below:false,supBound:rounded(first),infBound:null};}
   else {base.behavior='oscillating';base.convergence={converges:false,limit:null,explanation:`Comme q=${rounded(q)}<-1, le signe alterne et |u_n|→∞.`};base.bounded={above:false,below:false,supBound:null,infBound:null};}
   if(!close(q,1))base.sumFormula=startIndex===0?'S_n = a(1-q^(n+1))/(1-q)':`S_{${startIndex}→n} = a·q^${startIndex}(1-q^(n-${startIndex}+1))/(1-q)`; return base;
  }
  const p=parsePolynomial(expr,'n',8) || parsePolynomial(expr,'x',8);
  if(p){
   const deg=polynomialDegree(p); base.quality={level:'verified',detail:'La nature polynomiale de u_n a été reconnue algébriquement.'};
   base.proofSteps=[`u_n est un polynôme en n de degré ${deg}.`];
   if(deg===0){
    const c=p[0]||0; base.behavior='constant'; base.isArithmetic={yes:true,reason:0}; base.convergence={converges:true,limit:rounded(c),explanation:`u_n=${rounded(c)} pour tout n.`}; base.bounded={above:true,below:true,supBound:rounded(c),infBound:rounded(c)};
   } else if(deg===1){
    const r=p[1]||0; base.isArithmetic={yes:true,reason:rounded(r)}; base.behavior=r>0?'increasing':r<0?'decreasing':'constant'; base.convergence={converges:false,limit:null,explanation:`Suite affine en n de pente ${rounded(r)} : pas de limite finie si r≠0.`}; base.bounded=r>0?{above:false,below:true,supBound:null,infBound:rounded(polynomialValue(p,startIndex))}:{above:true,below:false,supBound:rounded(polynomialValue(p,startIndex)),infBound:null}; base.sumFormula='S_n = (n+1)(u_0+u_n)/2';
   } else {
    const lead=p[deg]; const bound=polynomialOneSidedBound(p,startIndex); base.behavior='unknown'; base.convergence={converges:false,limit:null,explanation:`Le terme dominant ${rounded(lead)}n^${deg} impose ${lead>0?'+∞':'−∞'} lorsque n→+∞ ; il n’y a donc pas de limite réelle finie.`};
    base.bounded={above:bound.above,below:bound.below,supBound:bound.supBound,infBound:bound.infBound};
    base.proofSteps.push(`Le terme dominant est ${rounded(lead)}n^${deg}.`,bound.detail);
   }
   return base;
  }
  const rat=parseRationalPolynomial(expr,'n',12);
  if(rat){
   const excluded=rationalExcludedPoints(rat);
   if(!excluded.complete){base.quality={level:'warning',detail:'La limite en l’infini peut être étudiée, mais le moteur ne peut pas prouver que le dénominateur ne s’annule jamais pour un indice naturel.'};base.proofSteps=['Fraction rationnelle détectée, mais domaine discret incomplet : aucune conclusion globale n’est marquée comme vérifiée.'];return base;}
   const forbiddenNatural=excluded.points.filter(x=>isNaturalIndex(x,startIndex));
   if(forbiddenNatural.length){base.quality={level:'warning',detail:`La formule n’est pas définie pour n=${forbiddenNatural.map(x=>Math.round(x)).join(', ')}. Ce n’est donc pas une suite réelle définie pour tout n≥${startIndex}.`};base.proofSteps=[`Le dénominateur s’annule pour l’indice naturel ${forbiddenNatural.map(x=>Math.round(x)).join(', ')}.`];return base;}
   const lim=rationalLimitAtInfinity(rat,true); if(lim.exact&&lim.value!=='?'){
    const finiteLimit=!lim.value.includes('∞')?Number(lim.value):null; base.quality={level:'verified',detail:'La suite explicite est une fraction rationnelle en n ; son domaine discret et sa limite sont contrôlés algébriquement.'}; base.behavior='unknown'; base.convergence={converges:finiteLimit!==null&&Number.isFinite(finiteLimit),limit:finiteLimit!==null&&Number.isFinite(finiteLimit)?rounded(finiteLimit):null,explanation:`Étude des degrés : ${lim.detail} Limite : ${lim.value}.`};
    if(finiteLimit!==null&&Number.isFinite(finiteLimit))base.bounded={above:true,below:true,supBound:null,infBound:null};
    else if(lim.value==='+∞')base.bounded={above:false,below:true,supBound:null,infBound:null};
    else if(lim.value==='-∞')base.bounded={above:true,below:false,supBound:null,infBound:null};
    base.proofSteps=[`u_n est une fraction rationnelle en n et le dénominateur ne s’annule pas pour les indices naturels du domaine étudié.`,lim.detail,`Donc lim u_n = ${lim.value}.`]; return base;
   }
  }

 }

 const obs=observedBehavior(terms);
 const values=terms.map(t=>t.value), min=Math.min(...values),max=Math.max(...values);
 base.behavior='unknown'; // never elevate a finite observation to a global property
 base.bounded={above:false,below:false,supBound:null,infBound:null};
 base.convergence={converges:false,limit:null,explanation:`Sur les ${terms.length} termes calculés, la tendance observée est « ${obs} », mais cela ne démontre ni monotonie, ni bornes, ni convergence.`};
 base.quality={level:'approximate',detail:`${terms.length} termes ont été calculés. Aucune propriété générale n’est affirmée sans preuve algébrique.`};
 base.proofSteps=[`Observation seulement : min calculé=${rounded(min)}, max calculé=${rounded(max)}.`,`Une observation sur un nombre fini de termes ne constitue pas une preuve pour tout n.`];
 return base;
}

import { numericRoots } from './numericRoots.js';
import { safeEvaluateExpression } from './expressionCore.js';
import { parsePolynomial, polynomialDegree, polynomialSub, polynomialScale } from './polynomialEngine.js';
import { solvePolynomialInequality, intervalToFrench, type Relation } from './algebraCore.js';
import { parseRationalPolynomial, realPolynomialRoots, rationalExcludedPoints } from './rationalEngine.js';

export interface InequalityIntervalView { from:number; to:number; sign:'+'|'-'|'0'|'?'; isSolution:boolean; }
export interface InequalityResult { zeros:number[]; signIntervals:InequalityIntervalView[]; solutionIntervals:string[]; solutionSet:string; searchInterval:[number,number]; verifiedZeros:number; exact:boolean; scope:'R'|'window'; proof:'algebraic'|'numeric'; quality:'verified'|'approximate'|'warning'; steps:string[]; warning?:string; }

function safeEval(expr:string,x:number):number|null{return safeEvaluateExpression(expr,{x});}
function relationOK(v:number,rel:Relation):boolean{if(rel==='>')return v>0;if(rel==='>=')return v>=0;if(rel==='<')return v<0;return v<=0;}

function fmt(x:number):string{const r=x!==0&&Math.abs(x)<1e-8?x:Math.round(x*1e10)/1e10;return Number.isInteger(r)?String(r):String(r);}
function unique(xs:number[]):number[]{return xs.sort((a,b)=>a-b).filter((x,i,a)=>i===0||Math.abs(x-a[i-1])>1e-8);}

function exactRationalInequality(expression:string,relation:Relation,k:number,xMin:number,xMax:number):InequalityResult|null{
 const r=parseRationalPolynomial(expression,'x',12); if(!r)return null;
 const shiftedNum=polynomialSub(r.num,polynomialScale(r.den,k));
 const zeros=realPolynomialRoots(shiftedNum), polesInfo=rationalExcludedPoints(r);
 if(zeros===null||!polesInfo.complete)return null;
 const poles=polesInfo.points;
 const critical=unique([...zeros,...poles]);
 const bounds:[number|null,number|null][]=[]; let prev:number|null=null; for(const c of critical){bounds.push([prev,c]);prev=c;}bounds.push([prev,null]);
 const solved:string[]=[]; const steps:string[]=[`On met tout du même côté : (f(x)-${fmt(k)}) ${relation} 0.`,`La fonction est reconnue comme fraction rationnelle : on construit un tableau de signes exact à partir des zéros du numérateur et des zéros interdits du dénominateur.`];
 const includeZero=relation==='>='||relation==='<=';
 const intervalData:{left:number|null;right:number|null;ok:boolean;sign:number}[]=[];
 for(const [l,u] of bounds){
  let probe:number;if(l===null&&u===null)probe=0;else if(l===null)probe=(u as number)-Math.max(1,Math.abs(u as number));else if(u===null)probe=(l as number)+Math.max(1,Math.abs(l as number));else probe=(l+u)/2;
  const den=(()=>{let y=0;for(let i=r.den.length-1;i>=0;i--)y=y*probe+(r.den[i]||0);return y;})();
  const num=(()=>{let y=0;for(let i=shiftedNum.length-1;i>=0;i--)y=y*probe+(shiftedNum[i]||0);return y;})();
  const v=num/den; const sign=v>0?1:v<0?-1:0; intervalData.push({left:l,right:u,ok:relationOK(v,relation),sign});
 }
 // Build connected solution components, keeping poles excluded and roots included only for non-strict relations.
 for(const iv of intervalData){if(!iv.ok)continue;const l=iv.left,u=iv.right;let lText=l===null?']-∞':']'+fmt(l);let uText=u===null?'+∞[':fmt(u)+'[';
  if(l!==null&&!poles.some(p=>Math.abs(p-l)<1e-8)&&includeZero&&zeros.some(z=>Math.abs(z-l)<1e-8))lText='['+fmt(l);
  if(u!==null&&!poles.some(p=>Math.abs(p-u)<1e-8)&&includeZero&&zeros.some(z=>Math.abs(z-u)<1e-8))uText=fmt(u)+']';
  solved.push(`${lText} ; ${uText}`);
 }
 // Isolated equality roots can occur when both neighbouring intervals fail (e.g. x²<=0).
 if(includeZero){for(const z of zeros){if(poles.some(p=>Math.abs(p-z)<1e-8))continue;const belongs=intervalData.some(iv=>iv.ok&&(iv.left===null||z>=iv.left)&&(iv.right===null||z<=iv.right));if(!belongs)solved.push(`{${fmt(z)}}`);}}
 const viewCritical=critical.filter(c=>c>xMin&&c<xMax);const visual=[xMin,...viewCritical,xMax];const signIntervals:InequalityIntervalView[]=[];
 for(let i=0;i<visual.length-1;i++){const from=visual[i],to=visual[i+1],mid=(from+to)/2;const den=(()=>{let y=0;for(let j=r.den.length-1;j>=0;j--)y=y*mid+(r.den[j]||0);return y;})();const num=(()=>{let y=0;for(let j=shiftedNum.length-1;j>=0;j--)y=y*mid+(shiftedNum[j]||0);return y;})();const v=num/den;const sign:'+'|'-'|'0'=v>0?'+':v<0?'-':'0';signIntervals.push({from,to,sign,isSolution:relationOK(v,relation)});}
 steps.push(`Zéros du numérateur : ${zeros.length?zeros.map(fmt).join(', '):'aucun'}.`);steps.push(`Valeurs interdites : ${poles.length?poles.map(fmt).join(', '):'aucune'}.`);steps.push('Le signe est déterminé sur chaque intervalle séparé par ces points ; les valeurs interdites sont toujours exclues.');
 return{zeros,signIntervals,solutionIntervals:solved,solutionSet:solved.length?solved.join(' ∪ '):'∅',searchInterval:[xMin,xMax],verifiedZeros:zeros.filter(z=>!poles.some(p=>Math.abs(p-z)<1e-8)).length,exact:true,scope:'R',proof:'algebraic',quality:'verified',steps};
}

export function solveInequalityVerified(expression:string,relation:Relation,k:number,xMin=-20,xMax=20):InequalityResult{
 if(!(xMin<xMax)||!Number.isFinite(k))throw new Error('Paramètres invalides.');
 const exactRat=exactRationalInequality(expression,relation,k,xMin,xMax);if(exactRat)return exactRat;
 const testExpr=`(${expression})-(${k})`;
 const poly=parsePolynomial(testExpr,'x',2);
 if(poly&&polynomialDegree(poly)<=2){const a=poly[2]||0,b=poly[1]||0,c=poly[0]||0;const solved=solvePolynomialInequality(a,b,c,relation);const solutionIntervals=solved.intervals.map(intervalToFrench);const roots=solved.roots;const rootMin=roots.length?Math.min(...roots):xMin,rootMax=roots.length?Math.max(...roots):xMax;const margin=Math.max(2,(rootMax-rootMin)*.15);const viewMin=Math.min(xMin,rootMin-margin),viewMax=Math.max(xMax,rootMax+margin);const boundaries=[viewMin,...roots.filter(r=>r>viewMin&&r<viewMax),viewMax].sort((u,v)=>u-v);const signIntervals:InequalityIntervalView[]=[];for(let i=0;i<boundaries.length-1;i++){const from=boundaries[i],to=boundaries[i+1],mid=(from+to)/2,v=(a*mid+b)*mid+c,sign:'+'|'-'|'0'=v>0?'+':v<0?'-':'0';signIntervals.push({from,to,sign,isSolution:relationOK(v,relation)});}const verifiedZeros=roots.filter(r=>Math.abs((a*r+b)*r+c)<=1e-8*Math.max(1,Math.abs(a*r*r),Math.abs(b*r),Math.abs(c))).length;return{zeros:roots,signIntervals,solutionIntervals,solutionSet:solutionIntervals.length?solutionIntervals.join(' ∪ '):'∅',searchInterval:[viewMin,viewMax],verifiedZeros,exact:true,scope:'R',proof:'algebraic',quality:'verified',steps:[...solved.steps,'Conclusion obtenue sur ℝ, sans dépendre de la fenêtre du graphique.']};}
 const roots=numericRoots(testExpr,xMin,xMax);let undefinedSeen=false;for(let i=0;i<=1000;i++){if(safeEval(testExpr,xMin+(xMax-xMin)*i/1000)===null){undefinedSeen=true;break;}}
 roots.sort((u,v)=>u-v);const verifiedRoots=roots.filter(r=>Math.abs(safeEval(testExpr,r)??Infinity)<=1e-5),boundaries=[xMin,...verifiedRoots.filter(r=>r>xMin&&r<xMax),xMax],signIntervals:InequalityIntervalView[]=[];for(let i=0;i<boundaries.length-1;i++){const from=boundaries[i],to=boundaries[i+1],probes=[.2,.5,.8].map(t=>safeEval(testExpr,from+(to-from)*t));if(probes.some(v=>v===null)){signIntervals.push({from,to,sign:'?',isSolution:false});continue;}const vals=probes as number[],signs=vals.map(v=>v>0?1:v<0?-1:0),consistent=signs.every(s=>s===signs[0]),sign:'+'|'-'|'0'|'?'=!consistent?'?':signs[0]>0?'+':signs[0]<0?'-':'0';signIntervals.push({from,to,sign,isSolution:consistent&&relationOK(vals[1],relation)});}
 const strict=relation==='>'||relation==='<',solutionIntervals=signIntervals.filter(iv=>iv.isSolution).map(iv=>`${Math.abs(iv.from-xMin)<1e-10?'[':(strict?']':'[')}${iv.from.toFixed(5).replace(/0+$/,'').replace(/\.$/,'')} ; ${iv.to.toFixed(5).replace(/0+$/,'').replace(/\.$/,'')}${Math.abs(iv.to-xMax)<1e-10?']':(strict?'[':']')}`),warning=`Fonction non rationnelle simple : étude numérique uniquement sur [${xMin} ; ${xMax}]. Aucune conclusion n’est faite hors de cette fenêtre.${undefinedSeen?' Des points non définis ont été rencontrés : les zones concernées doivent être contrôlées.':''}`;
 return{zeros:verifiedRoots,signIntervals,solutionIntervals,solutionSet:solutionIntervals.length?solutionIntervals.join(' ∪ '):'∅',searchInterval:[xMin,xMax],verifiedZeros:verifiedRoots.length,exact:false,scope:'window',proof:'numeric',quality:undefinedSeen||signIntervals.some(i=>i.sign==='?')?'warning':'approximate',steps:['Recherche numérique des changements de signe sur la fenêtre demandée.','Chaque zéro candidat est recontrôlé par substitution.','Le signe est vérifié en plusieurs points de chaque intervalle.'],warning};
}

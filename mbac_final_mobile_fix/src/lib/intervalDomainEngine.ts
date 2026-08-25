import { parseExpressionCore, evaluateConstantNode, evaluateExpressionAst } from './expressionCore.js';
import { parsePolynomial, polynomialDegree, polynomialValue } from './polynomialEngine.js';
import { parseRationalPolynomial, rationalExcludedPoints } from './rationalEngine.js';
import { serializeNode, type DNode } from './derivativeEngine.js';

export interface IntervalDomainCertificate { ok:boolean; proven:boolean; detail:string; badX:number|null }
const EPS=1e-11;

function polynomialRange(expr:string,a:number,b:number):{min:number;max:number}|null{
 const p=parsePolynomial(expr,'x',2);if(!p||polynomialDegree(p)>2)return null;
 const xs=[a,b];
 if(polynomialDegree(p)===2){const A=p[2]||0,B=p[1]||0;if(Math.abs(A)>EPS){const xv=-B/(2*A);if(xv>a&&xv<b)xs.push(xv);}}
 const ys=xs.map(x=>polynomialValue(p,x));return{min:Math.min(...ys),max:Math.max(...ys)};
}
function certifyPositive(node:DNode,a:number,b:number,allowZero:boolean):IntervalDomainCertificate{
 const expr=serializeNode(node),range=polynomialRange(expr,a,b);
 if(range){const ok=allowZero?range.min>=-EPS:range.min>EPS;return{ok,proven:true,detail:ok?`L’expression ${expr} reste ${allowZero?'positive ou nulle':'strictement positive'} sur l’intervalle (minimum prouvé : ${range.min}).`:`La condition ${allowZero?'≥ 0':'> 0'} échoue sur l’intervalle (minimum : ${range.min}).`,badX:null};}
 const c=evaluateConstantNode(node);if(c!==null){const ok=allowZero?c>=0:c>0;return{ok,proven:true,detail:`L’expression est constante : ${c}.`,badX:null};}
 return{ok:false,proven:false,detail:`Le signe de ${expr} n’est pas prouvé automatiquement sur tout l’intervalle.`,badX:null};
}
function certifyNonZero(node:DNode,a:number,b:number):IntervalDomainCertificate{
 const expr=serializeNode(node),range=polynomialRange(expr,a,b);
 if(range){const ok=range.min>EPS||range.max<-EPS;return{ok,proven:true,detail:ok?`Le dénominateur ${expr} garde un signe strict sur l’intervalle.`:`Le dénominateur ${expr} peut s’annuler ou changer de signe sur l’intervalle.`,badX:null};}
 const c=evaluateConstantNode(node);if(c!==null)return{ok:Math.abs(c)>EPS,proven:true,detail:`Dénominateur constant : ${c}.`,badX:null};
 return{ok:false,proven:false,detail:`L’absence de zéro de ${expr} n’est pas prouvée automatiquement sur tout l’intervalle.`,badX:null};
}
function merge(parts:IntervalDomainCertificate[],label:string):IntervalDomainCertificate{
 const bad=parts.find(p=>!p.ok);if(bad)return bad;return{ok:true,proven:parts.every(p=>p.proven),detail:`${label} : continuité certifiée à partir de ses sous-expressions.`,badX:null};
}
function certifyNode(node:DNode,a:number,b:number):IntervalDomainCertificate{
 if(node.kind==='num'||node.kind==='sym')return{ok:true,proven:true,detail:'Expression élémentaire continue.',badX:null};
 if(node.kind==='neg')return certifyNode(node.value,a,b);
 if(node.kind==='bin'){
  const left=certifyNode(node.left,a,b);if(!left.ok)return left;
  if(node.op==='^'){
   const exponent=evaluateConstantNode(node.right);
   const right=certifyNode(node.right,a,b);if(!right.ok)return right;
   if(exponent!==null&&Number.isInteger(exponent)){
    if(exponent>=0)return merge([left,right],'Puissance entière');
    const nz=certifyNonZero(node.left,a,b);return nz.ok?merge([left,right,nz],'Puissance entière négative'):nz;
   }
   const pos=certifyPositive(node.left,a,b,false);return pos.ok?merge([left,right,pos],'Puissance réelle'):pos;
  }
  const right=certifyNode(node.right,a,b);if(!right.ok)return right;
  if(node.op==='/'){const nz=certifyNonZero(node.right,a,b);return nz.ok?merge([left,right,nz],'Quotient'):nz;}
  return merge([left,right],`Opération ${node.op}`);
 }
 const arg=certifyNode(node.arg,a,b);if(!arg.ok)return arg;
 if(node.name==='sin'||node.name==='cos'||node.name==='exp'||node.name==='abs')return merge([arg],node.name);
 if(node.name==='sqrt'){const p=certifyPositive(node.arg,a,b,true);return p.ok?merge([arg,p],'Racine carrée'):p;}
 if(node.name==='log'){const p=certifyPositive(node.arg,a,b,false);return p.ok?merge([arg,p],'Logarithme'):p;}
 if(node.name==='tan'){
  // Prove tan(ax+b) has no pole when the inner expression is affine.
  const inner=parsePolynomial(serializeNode(node.arg),'x',1);if(!inner)return{ok:false,proven:false,detail:'Les pôles de la tangente composée ne sont pas prouvés automatiquement.',badX:null};
  const slope=inner[1]||0,intercept=inner[0]||0;if(Math.abs(slope)<EPS){const c=Math.cos(intercept);return{ok:Math.abs(c)>EPS,proven:true,detail:'Argument constant de tan contrôlé.',badX:null};}
  const lo=Math.min(slope*a+intercept,slope*b+intercept),hi=Math.max(slope*a+intercept,slope*b+intercept);
  const kMin=Math.ceil((lo-Math.PI/2)/Math.PI-EPS),kMax=Math.floor((hi-Math.PI/2)/Math.PI+EPS);
  if(kMin<=kMax){const u=Math.PI/2+kMin*Math.PI,x=(u-intercept)/slope;return{ok:false,proven:true,detail:`tan n’est pas définie pour x=${x} dans l’intervalle.`,badX:x};}
  return{ok:true,proven:true,detail:'Aucun pôle de la tangente affine sur l’intervalle.',badX:null};
 }
 return{ok:false,proven:false,detail:'Fonction non certifiée pour l’intégration automatique.',badX:null};
}

export function certifyContinuousOnInterval(expr:string,a:number,b:number):IntervalDomainCertificate{
 if(!Number.isFinite(a)||!Number.isFinite(b)||a>b)return{ok:false,proven:true,detail:'Intervalle invalide.',badX:null};
 const rational=parseRationalPolynomial(expr,'x',20);
 if(rational){
  const ex=rationalExcludedPoints(rational);
  if(!ex.complete)return{ok:false,proven:false,detail:'Le dénominateur rationnel a des zéros dont la liste réelle complète n’est pas prouvée automatiquement. Intégration numérique refusée pour éviter de franchir une singularité.',badX:null};
  const bad=ex.points.find(x=>x>=a-EPS&&x<=b+EPS);
  if(bad!==undefined)return{ok:false,proven:true,detail:`Le dénominateur s’annule en x=${bad} dans l’intervalle.`,badX:bad};
  return{ok:true,proven:true,detail:ex.points.length?`Fraction rationnelle : toutes les valeurs interdites réelles sont connues et aucune n’appartient à [${a}; ${b}].`:'Fraction rationnelle : le dénominateur ne possède aucun zéro réel.',badX:null};
 }
 try{return certifyNode(parseExpressionCore(expr),a,b);}catch{return{ok:false,proven:false,detail:'Expression non analysable pour certifier le domaine sur l’intervalle.',badX:null};}
}

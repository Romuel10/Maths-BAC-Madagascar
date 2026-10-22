import {cas,expression,tex,exact,simplified,asReal,parse,evaluateNode,onlyVariables,fmt,param,domainTex} from './expression';
import type {Request,Result,Step} from './types';
import {value,integer,result,readRows,gaussian,matrixTex} from './toolkit';
import {systems} from './systems';
import {sequences} from './sequences';
import {probabilityTool} from './probability';
import {statistics} from './statistics';
import {complexes} from './complexes';
export {gaussian,matrixTex} from './toolkit';
const ex=(s:string)=>exact(s);
export function advanced(req:Request):Result{
 const p=req.params;
 if(req.operation==='system')return systems(req);
 if(req.operation==='sequence')return sequences(req);
 if(req.operation==='probability')return probabilityTool(req);
 if(req.operation==='statistics')return statistics(req);
 if(req.operation==='complex')return complexes(req);
 if(req.operation==='matrix'){
  const a=readRows(req.expression),n=a.length;if(n<2||n>4||a.some(r=>r.length!==n))throw new Error('Saisis une matrice carrée de taille 2, 3 ou 4. Sépare les coefficients par ; et les lignes par un retour à la ligne.');
  const g=gaussian(a.map((r,i)=>[...r,...Array.from({length:n},(_,j)=>String(i===j?1:0))]),n);
  const trace=ex(a.map((r,i)=>'('+r[i]+')').join('+'));
  const steps=[{title:'Calculer le déterminant',text:'L’élimination tient compte du changement de signe lors d’un échange de lignes.',latex:'\\det(A)='+tex(g.det)},{title:'Calculer la trace',text:'Additionner les coefficients de la diagonale.',latex:'\\operatorname{tr}(A)='+tex(trace)}];
  if(g.det==='0')return result('Matrice non inversible','\\det(A)=0',steps,{notes:['Un déterminant nul interdit le calcul d’une matrice inverse.']});
  const inverse=g.rows.map(r=>r.slice(n));steps.push({title:'Inverser par Gauss–Jordan',text:'Transformer [A | I] en [I | A⁻¹].',latex:'A^{-1}='+matrixTex(inverse)});
  return result('Matrice inverse','A^{-1}='+matrixTex(inverse),steps,{exact:JSON.stringify(inverse)});
 }
 if(req.operation==='geometry'){
  const rows=readRows(req.expression);if(rows.length!==2||rows.some(r=>r.length!==3))throw new Error('Saisis deux vecteurs à trois coordonnées, un par ligne : 1 ; 2 ; 3.');
  const [a,b]=rows;const dot=ex(a.map((v,i)=>'('+v+')*('+b[i]+')').join('+')),norm=(v:string[])=>ex('sqrt('+v.map(x=>'('+x+')^2').join('+')+')');
  const na=norm(a),nb=norm(b),cross=[0,1,2].map(i=>ex('('+a[(i+1)%3]+')*('+b[(i+2)%3]+')-('+a[(i+2)%3]+')*('+b[(i+1)%3]+')'));
  const angle=asReal(na)*asReal(nb)===0?null:Math.acos(Math.max(-1,Math.min(1,asReal(dot)/(asReal(na)*asReal(nb)))))*180/Math.PI;
  return result('Géométrie vectorielle','\\vec u\\cdot\\vec v='+tex(dot),[{title:'Calculer les normes',text:'Additionner les carrés des trois coordonnées puis prendre la racine.',latex:'\\|u\\|='+tex(na)+',\\quad\\|v\\|='+tex(nb)},{title:'Calculer le produit scalaire',text:'Multiplier les coordonnées correspondantes et les additionner.',latex:tex(dot)},{title:'Calculer le produit vectoriel',text:'Un produit vectoriel nul caractérise la colinéarité, y compris avec le vecteur nul.',latex:'u\\times v='+matrixTex(cross.map(x=>[x]))},{title:'Déterminer l’angle',text:angle===null?'L’angle est indéfini si l’un des vecteurs est nul.':'Utiliser cos θ = (u·v)/(‖u‖‖v‖).',latex:angle===null?undefined:'\\theta\\approx '+tex(String(angle))+'^\\circ'}],{exact:dot});
 }
 if(req.operation==='finance'){
  const capital=value(req.expression),rate=param(p,'rate','5')/100,years=param(p,'years','5'),payment=param(p,'payment','0');
  if(asReal(capital)<0||rate<=-1||years<0||years>100||payment<0)throw new Error('Le capital et le versement sont positifs ou nuls, la durée de 0 à 100 ans, et le taux supérieur à −100 %.');
  integer(years,0,100,'La durée');const q=ex('1+('+value(p.rate??'5')+')/100'),annuity=rate===0?String(years):ex('(('+q+')^'+years+'-1)/(('+q+')-1)');
  const total=ex('('+capital+')*('+q+')^'+years+'+('+value(p.payment??'0')+')*('+annuity+')');
  return result('Capital acquis','C_{'+years+'}='+tex(total)+'\\ \\text{Ar}',[{title:'Former le coefficient annuel',text:'Un taux de t % correspond à une multiplication par 1 + t/100.',latex:'q='+tex(q)},{title:'Capitaliser et ajouter les versements',text:'Les versements sont supposés effectués en fin de chaque année. Le taux reste constant.',latex:'C_n=C_0q^n+v\\frac{q^n-1}{q-1}'},{title:'Conclure',text:'Si le taux est nul, la somme des versements vaut simplement n × v.',latex:tex(total)}],{exact:total,approximate:fmt(asReal(total))+' Ar'});
 }
 if(req.operation==='arithmetic'){
  const parts=req.expression.split(/[;\s]+/).filter(Boolean);if(parts.length!==2||parts.some(v=>!/^[-+]?\d{1,100}$/.test(v)))throw new Error('Saisis deux entiers, séparés par ; (100 chiffres maximum).');
  const a=BigInt(parts[0]),b=BigInt(parts[1]);let r=a<0n?-a:a,s=b<0n?-b:b,x=1n,y=0n,u=0n,v=1n;const rows:string[][]=[];
  while(s!==0n){const q=r/s;rows.push([String(r),String(s),String(q),String(r%s)]);[r,s]=[s,r-q*s];[x,u]=[u,x-q*u];[y,v]=[v,y-q*v];}
  if(a<0n)x=-x;if(b<0n)y=-y;const l=r===0n?0n:(a*b/r<0n?-a*b/r:a*b/r);
  return result('PGCD et identité de Bézout','\\operatorname{PGCD}('+a+';'+b+')='+r,[{title:'Appliquer l’algorithme d’Euclide',text:'Répéter la division euclidienne jusqu’au reste nul. Le dernier reste non nul est le PGCD.'},{title:'Remonter les divisions',text:'Les coefficients obtenus donnent une identité de Bézout.',latex:a+'\\times('+x+')+'+b+'\\times('+y+')='+r},{title:'Calculer le PPCM',text:'Pour des entiers non tous deux nuls, PPCM(a,b) = |ab|/PGCD(a,b).',latex:'\\operatorname{PPCM}='+l}],{exact:String(r),table:{headers:['Dividende','Diviseur','Quotient','Reste'],rows}});
 }
 if(req.operation==='ode'){
  const b=value(req.expression),a=value(p.a??'2'),y0=value(p.y0??'1'),x0=value(p.x0??'0');
  const solution=a==='0'?ex('('+y0+')+('+b+')*(x-('+x0+'))'):ex('('+y0+'+('+b+')/('+a+'))*exp(('+a+')*(x-('+x0+')))-('+b+')/('+a+')');
  return result('Équation différentielle',"y(x)="+tex(solution),[{title:'Identifier le modèle',text:'Le module traite y′ = ay + b avec a et b constants.',latex:"y'="+tex(a)+'y+'+tex(b)},{title:'Résoudre puis fixer la constante',text:'Utiliser la condition initiale y(x₀) = y₀.',latex:'y('+tex(x0)+')='+tex(y0)},{title:'Vérifier',text:'La dérivée de la solution doit être égale à ay + b, et la condition initiale doit être satisfaite.',latex:tex(solution)}],{exact:solution});
 }
 throw new Error('Outil inconnu.');
}

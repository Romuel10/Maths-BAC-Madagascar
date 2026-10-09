import {cas,expression,tex,exact,simplified,asReal,parse,evaluateNode,onlyVariables,fmt,param,domainTex} from './expression';
import type {Request,Result,Step} from './types';
const ex=(s:string)=>exact(s);
function value(raw:string):string {const s=expression(raw);onlyVariables(s,[]);if(!Number.isFinite(asReal(s)))throw new Error('Tous les coefficients doivent être des nombres réels finis.');return exact(s);}
function integer(n:number,min:number,max:number,label:string){if(!Number.isInteger(n)||n<min||n>max)throw new Error(label+' doit être un entier de '+min+' à '+max+'.');}
function result(title:string,latex:string,steps:Step[],extra:Partial<Result>={}):Result{return {title,latex,steps,notes:[],...extra};}
export function gaussian(input:string[][],columns:number):{rows:string[][];pivots:number[];det:string}{
 const a=input.map(r=>[...r]);const pivots:number[]=[];let at=0,det='1';
 for(let col=0;col<columns&&at<a.length;col++){
  const found=a.findIndex((r,i)=>i>=at&&ex(r[col])!=='0');if(found<0){det='0';continue;}
  if(found!==at){[a[found],a[at]]=[a[at],a[found]];det=ex('-('+det+')');}
  const pivot=a[at][col];det=ex('('+det+')*('+pivot+')');
  a[at]=a[at].map(v=>ex('('+v+')/('+pivot+')'));
  for(let row=0;row<a.length;row++){if(row===at)continue;const scale=a[row][col];a[row]=a[row].map((v,j)=>ex('('+v+')-('+scale+')*('+a[at][j]+')'));}
  pivots.push(col);at++;
 }
 return {rows:a,pivots,det:pivots.length<columns?'0':det};
}
export function matrixTex(rows:string[][]):string{return '\\begin{pmatrix}'+rows.map(r=>r.map(tex).join('&')).join('\\\\')+'\\end{pmatrix}';}
function readRows(raw:string):string[][] {
 return raw.trim().split(/\n+/).map(row=>(row.includes(';')?row.split(';'):row.trim().split(/\s+/)).map(v=>value(v.trim())));
}
function comb(n:number,k:number):string{let v=1n;for(let i=1;i<=Math.min(k,n-k);i++)v=v*BigInt(n-i+1)/BigInt(i);return String(v);}
export function advanced(req:Request):Result{
 const p=req.params;
 if(req.operation==='system'){
  const lines=req.expression.trim().split(/\n|;/).filter(Boolean);if(lines.length<2||lines.length>3)throw new Error('Saisis 2 ou 3 équations, une par ligne.');
  const vars=lines.length===2?['x','y']:['x','y','z'];const zero=Object.fromEntries(vars.map(v=>[v,'0']));
  const rows=lines.map(line=>{const halves=line.split('=');if(halves.length!==2)throw new Error('Chaque ligne doit contenir un signe =.');const s=expression(halves[0])+'-('+expression(halves[1])+')';onlyVariables(s,vars);
   const c=cas(s,zero).toString();const co=vars.map(v=>simplified('('+cas(s,{...zero,[v]:'1'}).toString()+')-('+c+')'));
   const reconstructed=co.map((a,i)=>'('+a+')*'+vars[i]).join('+')+'+('+c+')';
   if(simplified('('+s+')-('+reconstructed+')')!=='0')throw new Error('Ce module résout les systèmes linéaires uniquement.');
   return [...co,ex('-('+c+')')];
  });
  const g=gaussian(rows,vars.length);const impossible=g.rows.some(r=>r.slice(0,vars.length).every(v=>v==='0')&&r[vars.length]!=='0');
  const steps=[{title:'Former la matrice augmentée',text:'Chaque ligne regroupe les coefficients des inconnues, puis le second membre.',latex:matrixTex(rows)},{title:'Élimination de Gauss',text:'Les échanges de lignes, les multiplications par un nombre non nul et les combinaisons de lignes conservent les solutions.',latex:matrixTex(g.rows)}];
  if(impossible)return result('Système incompatible','S=\\varnothing',steps);
  if(g.pivots.length<vars.length)return result('Une infinité de solutions','\\operatorname{rang}(A)='+g.pivots.length,steps,{notes:['Choisir les inconnues sans pivot comme paramètres libres, puis lire les autres dans la matrice réduite.']});
  return result('Solution du système','\\left\\{\\begin{aligned}'+vars.map((v,i)=>v+'&='+tex(g.rows[i][vars.length])).join('\\\\')+'\\end{aligned}\\right.',steps,{exact:g.rows.map(r=>r[vars.length]).join(';')});
 }
 if(req.operation==='matrix'){
  const a=readRows(req.expression),n=a.length;if(n<2||n>4||a.some(r=>r.length!==n))throw new Error('Saisis une matrice carrée de taille 2, 3 ou 4. Sépare les coefficients par ; et les lignes par un retour à la ligne.');
  const g=gaussian(a.map((r,i)=>[...r,...Array.from({length:n},(_,j)=>String(i===j?1:0))]),n);
  const trace=ex(a.map((r,i)=>'('+r[i]+')').join('+'));
  const steps=[{title:'Calculer le déterminant',text:'L’élimination tient compte du changement de signe lors d’un échange de lignes.',latex:'\\det(A)='+tex(g.det)},{title:'Calculer la trace',text:'Additionner les coefficients de la diagonale.',latex:'\\operatorname{tr}(A)='+tex(trace)}];
  if(g.det==='0')return result('Matrice non inversible','\\det(A)=0',steps,{notes:['Un déterminant nul interdit le calcul d’une matrice inverse.']});
  const inverse=g.rows.map(r=>r.slice(n));steps.push({title:'Inverser par Gauss–Jordan',text:'Transformer [A | I] en [I | A⁻¹].',latex:'A^{-1}='+matrixTex(inverse)});
  return result('Matrice inverse','A^{-1}='+matrixTex(inverse),steps,{exact:JSON.stringify(inverse)});
 }
 if(req.operation==='sequence'){
  const count=param(p,'count','10'),start=param(p,'start','0');integer(count,1,100,'Le nombre de termes');integer(start,0,10000,'Le rang initial');
  const raw=expression(req.expression),rec=p.kind==='recurrence';onlyVariables(raw,rec?['u','n']:['n']);
  let term=value(p.initial??'1'),sum='0';const rows:string[][]=[];
  for(let i=0;i<count;i++){const n=start+i;if(!rec)term=cas(raw,{n:String(n)}).toString();else if(i>0)term=cas(raw,{u:term,n:String(n-1)}).toString();if(!Number.isFinite(asReal(term)))throw new Error('Un terme sort du domaine réel ou dépasse la précision numérique.');sum=ex('('+sum+')+('+term+')');rows.push([String(n),term,fmt(asReal(term))]);}
  const steps:Step[]=[{title:rec?'Appliquer la récurrence':'Remplacer n par le rang',text:rec?'Le premier terme est conservé, puis la relation calcule chacun des suivants. u désigne le terme précédent.':'La formule explicite donne directement chaque terme.',latex:rec?'u_{n+1}='+tex(raw):'u_n='+tex(raw)},{title:'Additionner les termes affichés',text:'La somme porte exactement sur les '+count+' termes du tableau.',latex:'S='+tex(sum)}];
  if(rec&&!raw.includes('n')){const b=cas(raw,{u:'0'}).toString(),a=simplified('('+cas(raw,{u:'1'}).toString()+')-('+b+')');if(simplified('('+raw+')-(('+a+')*u+('+b+'))')==='0'){if(a==='1')steps.push({title:'Reconnaître une suite arithmétique',text:'La différence est constante.',latex:'u_n=u_{'+start+'}+(n-'+start+')\\times '+tex(b)});else{const fixed=ex('('+b+')/(1-('+a+'))');steps.push({title:'Passer à une suite géométrique',text:'Soustraire le point fixe ℓ transforme la récurrence en une suite géométrique de raison a.',latex:'u_n='+tex(fixed)+'+\\left('+tex(value(p.initial??'1'))+'-'+tex(fixed)+'\\right)\\left('+tex(a)+'\\right)^{n-'+start+'}'});if(Math.abs(asReal(a))<1)steps.push({title:'Déterminer la limite',text:'Puisque |a| < 1, aⁿ tend vers zéro.',latex:'\\lim u_n='+tex(fixed)});}}}
  return result('Les termes de la suite','u_{'+(start+count-1)+'}='+tex(term),steps,{exact:term,table:{headers:['Rang','Valeur exacte','Approximation'],rows}});
 }
 if(req.operation==='probability'){
  const n=param(p,'n','10'),k=param(p,'k','3'),prob=value(req.expression);integer(n,1,200,'n');integer(k,0,n,'k');if(asReal(prob)<0||asReal(prob)>1)throw new Error('Une probabilité p doit être comprise entre 0 et 1.');
  const one=(j:number)=>prob==='0'?(j===0?'1':'0'):prob==='1'?(j===n?'1':'0'):ex(comb(n,j)+'*('+prob+')^'+j+'*(1-('+prob+'))^'+(n-j));
  let v=one(k);if(p.kind==='atmost'){v='0';for(let j=0;j<=k;j++)v=ex('('+v+')+('+one(j)+')');}
  if(p.kind==='atleast'){v='0';for(let j=k;j<=n;j++)v=ex('('+v+')+('+one(j)+')');}
  const symbol=p.kind==='atmost'?'\\le':p.kind==='atleast'?'\\ge':'=';
  return result('Loi binomiale','P(X'+symbol+k+')='+tex(v),[{title:'Vérifier le modèle',text:'n épreuves indépendantes, deux issues et la même probabilité de succès p à chaque épreuve.',latex:'X\\sim\\mathcal B('+n+';'+tex(prob)+')'},{title:'Calculer une probabilité',text:'Choisir les positions des succès puis multiplier les probabilités indépendantes.',latex:'P(X=k)=\\binom nk p^k(1-p)^{n-k}'},{title:'Calculer les indicateurs',text:'L’espérance vaut np, et la variance np(1−p).',latex:'E(X)='+tex(ex(n+'*('+prob+')'))+',\\quad V(X)='+tex(ex(n+'*('+prob+')*(1-('+prob+'))'))}],{exact:v,approximate:fmt(asReal(v)),notes:p.kind==='exact'||!p.kind?[]:['La probabilité cumulée est la somme des probabilités des valeurs retenues.']});
 }
 if(req.operation==='statistics'){
  const rows=readRows(req.expression);if(rows.length<2||rows.length>200||rows.some(r=>r.length!==2))throw new Error('Saisis de 2 à 200 couples x ; y, un couple par ligne.');
  const xs=rows.map(r=>asReal(r[0])),ys=rows.map(r=>asReal(r[1])),n=rows.length,mx=xs.reduce((a,b)=>a+b)/n,my=ys.reduce((a,b)=>a+b)/n;
  const vx=xs.reduce((a,x)=>a+(x-mx)**2,0),vy=ys.reduce((a,y)=>a+(y-my)**2,0),cov=xs.reduce((a,x,i)=>a+(x-mx)*(ys[i]-my),0);
  if(vx===0)throw new Error('L’ajustement y = ax + b exige au moins deux valeurs de x différentes.');
  const a=cov/vx,b=my-a*mx,r=vy===0?NaN:cov/Math.sqrt(vx*vy);
  return result('Ajustement affine','y\\approx '+tex(String(a))+'x'+(b<0?'':'+')+tex(String(b)),[{title:'Calculer le point moyen',text:'La droite des moindres carrés passe par G(x̄ ; ȳ).',latex:'G('+tex(String(mx))+';'+tex(String(my))+')'},{title:'Calculer les coefficients',text:'a = covariance(x,y) / variance(x), puis b = ȳ − ax̄.',latex:'a\\approx '+tex(String(a))+',\\quad b\\approx '+tex(String(b))},{title:'Interpréter la corrélation',text:Number.isFinite(r)?'Plus |r| est proche de 1, plus l’alignement est marqué. Corrélation ne signifie pas causalité.':'La corrélation est indéfinie lorsque les y sont constants.',latex:Number.isFinite(r)?'r\\approx '+tex(String(r)):undefined}],{approximate:'a = '+fmt(a)+' ; b = '+fmt(b),notes:['Les statistiques sont calculées numériquement.']});
 }
 if(req.operation==='complex'){
  const s=expression(req.expression);onlyVariables(s,['i']);const z=ex(s),re=ex('realpart('+z+')'),im=ex('imagpart('+z+')'),mod=ex('sqrt(('+re+')^2+('+im+')^2)'),arg=asReal(mod)===0?null:ex('arg('+z+')');
  return result('Nombre complexe','z='+tex(z),[{title:'Écrire la forme algébrique',text:'Séparer la partie réelle a et la partie imaginaire b dans z = a + ib.',latex:'a='+tex(re)+',\\quad b='+tex(im)},{title:'Calculer le module',text:'Le module est la distance du point d’affixe z à l’origine.',latex:'|z|=\\sqrt{a^2+b^2}='+tex(mod)},{title:'Donner l’argument',text:arg?'Un argument est défini modulo 2π.':'Le nombre zéro n’a pas d’argument.',latex:arg?'\\arg(z)='+tex(arg)+'\\pmod{2\\pi}':undefined},{title:'Former le conjugué',text:'Changer le signe de la partie imaginaire.',latex:'\\overline z='+tex(ex('('+re+')-('+im+')*i'))}],{exact:z});
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

import {cas,expression,tex,exact,simplified,asReal,numeric,constraints,checkDomain,domainTex,onlyVariables,fmt,param,parse,source,numericTex} from './expression';
import {numericalRoots} from './numerical';
import type {Result,Step} from './types';
export function coefficients(s:string):string[]|null {
 try{
  const a=cas.coeffs(s,'x').elements.map((x:any)=>x.toString()) as string[];
  if(a.length>9||a.some(x=>{try{onlyVariables(x,[]);return !Number.isFinite(asReal(x));}catch{return true;}}))return null;
  const rebuilt=a.map((v,i)=>'('+v+')*x^'+i).join('+');
  return simplified('('+s+')-('+rebuilt+')')==='0'?a:null;
 }catch{return null;}
}
export function roots(s:string):{values:string[];complete:boolean;family:boolean;numeric?:boolean} {
 const co=coefficients(s);
 if(co&&co.length<=3){
  if(co.length===1)return {values:[],complete:true,family:false};
  if(co.length===2)return {values:[exact('-('+co[0]+')/('+co[1]+')')],complete:true,family:false};
  const [c,b,a]=co,d=exact('('+b+')^2-4*('+a+')*('+c+')');
  if(d==='0')return {values:[exact('-('+b+')/(2*('+a+'))')],complete:true,family:false};
  // Vieta's second root avoids subtracting nearly equal numbers.
  const q=exact('-1/2*(('+b+')'+(asReal(b)<0?'-':'+')+'sqrt('+d+'))');
  return {values:[exact('('+q+')/('+a+')'),exact('('+c+')/('+q+')')],complete:true,family:false};
 }
 let r:any;try{r=cas.solve(s,'x');}catch{return {values:[],complete:false,family:false};}
 const values=(r.toArray?.()??[]).map((x:any)=>x.toString()) as string[];
 const numerical=['numeric','numerical'].includes(r.solutionsType);
 const family=values.some(x=>x.includes('_n'));
 let complete=!r.partial&&!r.unsolved&&!numerical&&(!!co||family);
 if(co){try{const gcd=coefficients(cas.gcd(s,cas.diff(s,'x')).toString());complete=complete&&values.length===co.length-(gcd?.length??1);}catch{complete=false;}}
 return {values,complete,family,numeric:numerical};
}
function unwrap(n:any):any {return n.isParenthesisNode?unwrap(n.content):n;}
function elementaryEquation(left:string,right:string,params:Record<string,string>,steps:Step[]):Result|null {
 let node=unwrap(parse(left)),constant=right;
 try{onlyVariables(constant,[]);}catch{node=unwrap(parse(right));constant=left;try{onlyVariables(constant,[]);}catch{return null;}}
 let name=node.isFunctionNode?node.fn.name:'',argument=node.args?.[0];
 if(node.isOperatorNode&&node.op==='^'&&unwrap(node.args[0]).isSymbolNode&&unwrap(node.args[0]).name==='e'){name='exp';argument=node.args[1];}
 if(!['log','exp','sqrt','cbrt','sin','cos','tan'].includes(name)||!argument||!Number.isFinite(asReal(constant)))return null;
 const c=exact(constant),arg=source(argument);
 const empty=():Result=>({title:'Solutions réelles',method:'exact',latex:'S=\\varnothing',exact:'',steps:[...steps,{title:'Comparer avec les valeurs possibles',text:name==='exp'?'Une exponentielle est strictement positive.':name==='sqrt'?'Une racine carrée réelle est positive ou nulle.':'Les valeurs de sinus et cosinus sont comprises entre −1 et 1.'}],notes:[]});
 if((name==='exp'&&asReal(c)<=0)||(name==='sqrt'&&asReal(c)<0))return empty();
 if(['log','exp','sqrt','cbrt'].includes(name)){
  const inverse=name==='log'?'exp('+c+')':name==='exp'?'log('+c+')':'('+c+')^'+(name==='sqrt'?'2':'3');
  const r=equation(arg+'='+inverse,params);
  return {...r,steps:[...steps,{title:'Inverser la fonction',text:'Utiliser l’inverse de '+(name==='log'?'ln':name)+' en respectant ses valeurs possibles.',latex:tex(arg)+'='+tex(inverse)},...r.steps]};
 }
 if(name!=='tan'&&(asReal('('+c+')-1')>0||asReal('('+c+')+1')<0))return empty();
 const co=coefficients(arg);if(!co||co.length!==2)return null;
 const [b,a]=co;let angles:string[];
 if(name==='sin')angles=c==='0'?['n*pi']:['asin('+c+')+2*n*pi','pi-asin('+c+')+2*n*pi'];
 else if(name==='cos')angles=c==='0'?['pi/2+n*pi']:['acos('+c+')+2*n*pi','-acos('+c+')+2*n*pi'];
 else angles=['atan('+c+')+n*pi'];
 // At extrema the two branches coincide modulo 2π.
 if(name!=='tan'&&(simplified('('+c+')-1')==='0'||simplified('('+c+')+1')==='0'))angles=angles.slice(0,1);
 const solutions=angles.map(v=>exact('(('+v+')-('+b+'))/('+a+')'));
 return {title:'Famille de solutions',method:'exact',families:solutions,latex:'x\\in\\left\\{'+solutions.map(tex).join(',\\;')+'\\right\\},\\quad n\\in\\mathbb Z',steps:[...steps,{title:'Utiliser toutes les branches',text:'Tenir compte de la périodicité et isoler x dans l’argument affine.',latex:'x=\\frac{\\theta-('+tex(b)+')}{'+tex(a)+'}'}],notes:['n est un entier relatif. Chaque branche décrit une famille entière de solutions.']};
}
export function equation(raw:string,params:Record<string,string>={}):Result {
 const parts=raw.split('=');if(parts.length>2)throw new Error('Saisis une seule équation. Pour plusieurs équations, utilise « Système ».');
 const left=expression(parts[0],params.angle??'rad'),right=expression(parts[1]??'0',params.angle??'rad');onlyVariables(left,['x']);onlyVariables(right,['x']);
 const residual='('+left+')-('+right+')';const reduced=simplified(residual);
 const conditions=[...constraints(left),...constraints(right)];
 const domain=conditions.length?'Les solutions doivent aussi respecter les conditions de définition des deux membres.':'La recherche porte sur les nombres réels.';
 const steps:Step[]=[{title:'Fixer les conditions',text:domain,latex:domainTex(residual)},{title:'Ramener à zéro',text:'Soustraire le second membre aux deux membres conserve les solutions.',latex:tex(reduced)+'=0'}];
 if(reduced==='0')return {title:'Une identité',latex:domainTex(residual).replace(/^D=/,'S='),exact:'identity',steps,notes:['L’égalité est vraie pour chaque valeur où les deux membres sont définis.']};
 const elementary=elementaryEquation(left,right,params,steps);if(elementary)return elementary;
 const co=coefficients(reduced);
 if(co?.length===3){
  const [c,b,a]=co;const delta=exact('('+b+')^2-4*('+a+')*('+c+')');
  steps.push({title:'Calculer le discriminant',text:'Pour ax² + bx + c = 0, le signe de Δ détermine le nombre de racines réelles.',latex:'\\Delta=b^2-4ac='+tex(delta)});
  steps.push({title:'Appliquer la formule',text:asReal(delta)<0?'Le discriminant est négatif : aucune racine réelle.':asReal(delta)===0?'Le discriminant est nul : une racine double.':'Le discriminant est positif : deux racines réelles.',latex:asReal(delta)<0?'S=\\varnothing':asReal(delta)===0?'x_0=-\\frac{b}{2a}':'x_{1,2}=\\frac{-b\\pm\\sqrt{\\Delta}}{2a}'});
 }else if(co?.length===2)steps.push({title:'Isoler l’inconnue',text:'Diviser par le coefficient non nul de x.',latex:'x='+tex(exact('-('+co[0]+')/('+co[1]+')'))});
 else {try{const f=cas.factor(reduced).toString();if(f!==reduced)steps.push({title:'Exploiter la forme factorisée',text:'Un produit est nul si au moins un facteur est nul.',latex:tex(f)+'=0'});}catch{}}
 const solved=roots(reduced);
 // General CAS families may require restrictions on their integer parameter.
 // Only the affine trigonometric families above are exposed as complete.
 if(solved.family)solved.complete=false;
 if(solved.values.some(v=>Math.abs(asReal(v))===Infinity))throw new Error('Une solution dépasse la plage de représentation numérique du moteur. Réduis l’échelle des données.');
 const candidates=solved.values.filter(v=>Number.isFinite(asReal(v)));
 const valid=candidates.filter(v=>{const x=asReal(v);if(!checkDomain(left,x)||!checkDomain(right,x))return false;try{if(simplified(cas(residual,{x:v}).toString())==='0')return true;}catch{}const a=numeric(left,x),b=numeric(right,x);const scale=co?co.reduce((sum,c,i)=>sum+Math.abs(asReal(c)*x**i),0):Math.max(Math.abs(a),Math.abs(b));return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-10*Math.max(1e-100,scale);});
 const unique=[...new Set(valid)].sort((a,b)=>asReal(a)-asReal(b));
 if(!solved.complete){
  const xmin=param(params,'rootMin','-10'),xmax=param(params,'rootMax','10');
  if(xmin>=xmax||xmax-xmin>1e6)throw new Error('Choisis deux bornes croissantes pour la recherche numérique, avec une largeur au plus égale à 1 000 000.');
  const found=numericalRoots(left,right,xmin,xmax,candidates.map(asReal));
  steps.push({title:'Rechercher dans l’intervalle choisi',text:'Repérer les changements de signe, resserrer les encadrements par dichotomie et affiner les candidats par Newton.',latex:'x\\in['+tex(String(xmin))+';'+tex(String(xmax))+']'});
  steps.push({title:'Contrôler chaque valeur',text:'Recalculer les deux membres de l’équation initiale et rejeter les valeurs interdites. Le tableau donne leur différence.'});
  return {title:found.length?'Solutions approchées':'Aucune racine repérée',method:'numeric',numericValues:found,
   latex:found.length?'x\\approx '+found.map(numericTex).join('\\quad\\text{ou}\\quad'):'\\text{Aucune racine repérée sur }['+tex(String(xmin))+';'+tex(String(xmax))+']',
   steps,notes:['La recherche numérique est limitée à cet intervalle et peut manquer des racines rapprochées ou tangentes. L’absence de racine repérée ne prouve pas qu’il n’en existe aucune.'],
   table:{headers:['x approché','Membre gauche − membre droit'],rows:found.map(x=>[fmt(x),fmt(numeric(left,x)-numeric(right,x))])}};
 }
 steps.push({title:'Vérifier dans l’équation de départ',text:'On écarte les valeurs interdites et les racines complexes. '+(candidates.length-valid.length)+' valeur(s) candidate(s) exclue(s).',latex:unique.length?'S=\\left\\{'+unique.map(tex).join(';\\;')+'\\right\\}':'S=\\varnothing'});
 return {title:'Solutions réelles',method:'exact',latex:unique.length?'S=\\left\\{'+unique.map(tex).join(';\\;')+'\\right\\}':'S=\\varnothing',exact:unique.join(';'),steps,notes:[]};
}
export function inequality(raw:string):Result {
 const match=raw.replace(/≤/g,'<=').replace(/≥/g,'>=').match(/^(.*?)(<=|>=|<|>)(.*)$/);
 if(!match)throw new Error('Écris une inéquation, par exemple (x-1)/(x+2) >= 0.');
 const left=expression(match[1]),right=expression(match[3]),op=match[2];
 onlyVariables(left,['x']);onlyVariables(right,['x']);
 const s='('+left+')-('+right+')',r=cas(s),num=r.getNumerator().toString(),den=r.getDenominator().toString();
 if(!coefficients(num)||!coefficients(den))throw new Error('Le tableau de signes automatique traite les expressions rationnelles de degré au plus 8. Pour une autre fonction, utilise l’étude de fonction.');
 const boundaries:string[]=[];
 for(const e of [num,den,...constraints(s).map(c=>'('+c.expr+')-('+c.value+')')]){
  if(!coefficients(e))throw new Error('Le domaine nécessite une étude séparée.');
  if(simplified(e)==='0')continue;const r=roots(e);if(!r.complete||r.family)throw new Error('Les bornes ne sont pas toutes déterminées exactement.');
  boundaries.push(...r.values.filter(v=>Number.isFinite(asReal(v))));
 }
 const cuts=[...new Map(boundaries.map(v=>[asReal(v).toPrecision(13),v])).values()].sort((a,b)=>asReal(a)-asReal(b));
 const vals=[-Infinity,...cuts.map(asReal),Infinity],tokens=['-\\infty',...cuts.map(tex),'+\\infty'];const pieces:string[]=[];const rows:string[][]=[];
 const inclusive=op.includes('='),positive=op.startsWith('>');
 const pointOk=(i:number)=>{
  if(i<=0||i>=vals.length-1||!inclusive)return false;
  const x=vals[i];if(!checkDomain(s,x))return false;
  try{return simplified(cas(s,{x:cuts[i-1]}).toString())==='0';}catch{return false;}
 };
 const covered=new Set<number>();
 for(let i=0;i<vals.length-1;i++){
  const a=vals[i],b=vals[i+1],sample=!Number.isFinite(a)&&!Number.isFinite(b)?0:!Number.isFinite(a)?b-Math.max(1,Math.abs(b)+1):!Number.isFinite(b)?a+Math.max(1,Math.abs(a)+1):(a+b)/2;
  const y=numeric(s,sample),defined=checkDomain(s,sample)&&Number.isFinite(y),ok=defined&&(positive?(inclusive?y>=0:y>0):(inclusive?y<=0:y<0));
  rows.push([']'+fmt(a)+' ; '+fmt(b)+'[',defined?(y>0?'+':y<0?'−':'0'):'interdit',ok?'retenu':'exclu']);
  if(ok){const lc=pointOk(i),rc=pointOk(i+1);if(lc)covered.add(i);if(rc)covered.add(i+1);pieces.push((lc?'[':']')+tokens[i]+';'+tokens[i+1]+(rc?']':'['));}
 }
 for(let i=1;i<vals.length-1;i++)if(pointOk(i)&&!covered.has(i))pieces.push('\\{'+tokens[i]+'\\}');
 const latex='S='+ (pieces.length?pieces.join('\\;\\cup\\;'):'\\varnothing');
 return {title:'Ensemble des solutions',latex,steps:[{title:'Étudier la différence',text:'Ramener tous les termes du même côté.',latex:tex(s)+op.replace('>=','\\ge').replace('<=','\\le')+'0'},{title:'Écarter les valeurs interdites',text:'Une simplification ne rétablit jamais un dénominateur nul.',latex:domainTex(s)},{title:'Lire le signe sur chaque intervalle',text:'Les zéros du numérateur et les valeurs interdites découpent la droite réelle. Les bornes sont incluses seulement si l’inégalité est large et si l’expression est définie.',latex}],notes:[],table:{headers:['Intervalle','Signe','Décision'],rows}};
}
export function polynomialCuts(raw:string):number[]|null {
 try{const s=cas(raw).getNumerator().toString();if(!coefficients(s))return null;const r=roots(s);if(!r.complete||r.family)return null;return r.values.map(asReal).filter(Number.isFinite);}catch{return null;}
}

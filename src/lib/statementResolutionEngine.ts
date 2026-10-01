import { solveQuadraticReal } from './algebraCore.js';
import { formatPolynomial, parsePolynomial, polynomialDegree, polynomialDerivative, polynomialSub, polynomialValue } from './polynomialEngine.js';
import { solveLinearSystem, solveCramer } from './matrix.js';
import { solveLinearCongruence } from './arithmeticEngine.js';
import { deriveWithBacEngine } from './derivativeEngine.js';
import { tryExactDefiniteIntegral } from './integralEngine.js';
import { analyzeSequenceVerified } from './sequenceEngine.js';
import { binomialProbability, combinationBigInt } from './probabilityEngine.js';
import { simpleInterest, compoundFutureValue, presentValue } from './financialMathEngine.js';
import { solveAdvancedStatement } from './advancedStatementResolution.js';

export type StatementResolutionKind = 'equation' | 'inequality' | 'linear-system' | 'derivative' | 'limit' | 'integral' | 'sequence' | 'probability' | 'complex' | 'ode' | 'conic' | 'finance' | 'function-variation' | 'pgcd' | 'congruence' | 'orthogonality';

export interface StatementResolutionStep {
 title: string;
 work: string;
 why: string;
 check?: string;
}

export interface StatementResolution {
 kind: StatementResolutionKind;
 title: string;
 exact: true;
 givens: string[];
 steps: StatementResolutionStep[];
 finalAnswer: string;
 verification: string;
 scope?: string;
}

const EPS=1e-12;
const fmt=(value:number)=>{
 if(!Number.isFinite(value))return String(value);
 if(Math.abs(value)<=1e-12)return '0';
 const nearest=Math.round(value);
 if(Math.abs(value-nearest)<=1e-9*Math.max(1,Math.abs(value)))return String(nearest);
 const rounded=Math.round(value*1e10)/1e10;
 return String(rounded).replace('.',',');
};
const normalizeText=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const mathExpr=(raw:string)=>raw
 .replace(/−/g,'-').replace(/×/g,'*').replace(/÷/g,'/')
 .replace(/²/g,'^2').replace(/³/g,'^3')
 .replace(/(\d),(\d)/g,'$1.$2')
 .replace(/\s+/g,'')
 .replace(/(\d)(x)/gi,'$1*$2')
 .replace(/(\d)\(/g,'$1*(')
 .replace(/\)\(/g,')*(');

function solutionSet(roots:number[]):string{
 if(!roots.length)return 'S=∅';
 return `S={${roots.map(fmt).join(' ; ')}}`;
}

function extractEquation(statement:string):{left:string;right:string}|null{
 const plain=normalizeText(statement);
 if(!/(resou|equation|solutions?)/.test(plain))return null;
 const re=/([0-9xX().,+\-−×÷*/^²³\s]{1,120})=([0-9xX().,+\-−×÷*/^²³\s]{1,120})/g;
 let match:RegExpExecArray|null;
 while((match=re.exec(statement))){
  const before=statement.slice(0,match.index);
  if(/[fgh]\s*$/i.test(before))continue;
  const left=match[1].trim().replace(/^[,;:.]+|[,;:.]+$/g,'');
  const right=match[2].trim().replace(/^[,;:.]+|[,;:.]+$/g,'').split(/[;!?]/)[0].trim();
  if(!/[xX]/.test(left+right))continue;
  return{left:mathExpr(left),right:mathExpr(right)};
 }
 return null;
}

function solveEquationStatement(statement:string):StatementResolution|null{
 const eq=extractEquation(statement);if(!eq)return null;
 const left=parsePolynomial(eq.left,'x',2),right=parsePolynomial(eq.right,'x',2);
 if(!left||!right)return null;
 const reduced=polynomialSub(left,right);
 if(polynomialDegree(reduced)>2)return null;
 const a=reduced[2]||0,b=reduced[1]||0,c=reduced[0]||0;
 const solved=solveQuadraticReal(a,b,c);
 const reducedText=formatPolynomial(reduced,'x');
 const steps:StatementResolutionStep[]=[
  {title:'Mettre l’équation sous la forme standard',work:`${eq.left} = ${eq.right}  ⟺  ${reducedText}=0`,why:'On rassemble les termes dans un même membre pour reconnaître une équation affine ou du second degré.',check:'Le passage doit conserver exactement le même ensemble de solutions.'}
 ];
 if(solved.kind==='linear'){
  steps.push({title:'Isoler x',work:solved.steps.join('  →  '),why:'Une équation affine se résout en isolant l’inconnue sans diviser par zéro.'});
 }else if(solved.kind==='double'||solved.kind==='two'||solved.kind==='none'){
  steps.push({title:'Calculer le discriminant',work:`Δ=b²−4ac=${fmt(solved.delta??0)}`,why:'Le signe de Δ détermine le nombre de solutions réelles du trinôme.'});
  if(solved.roots.length)steps.push({title:'Calculer les racines',work:solved.roots.map((root,index)=>`x${solved.roots.length>1?index+1:''}=${fmt(root)}`).join(' ; '),why:'On applique la formule du second degré correspondant au signe de Δ.'});
  else steps.push({title:'Interpréter Δ',work:'Δ<0 : aucune solution réelle.',why:'Un trinôme réel de discriminant négatif ne s’annule pas sur ℝ.'});
 }else if(solved.kind==='all'){
  steps.push({title:'Reconnaître une identité',work:'0=0',why:'Les deux membres sont identiques : toute valeur réelle convient.'});
 }
 const verificationOk=solved.verification.every(item=>item.ok);
 if(solved.roots.length)steps.push({title:'Vérifier dans l’équation de départ',work:solved.verification.map(v=>`x=${fmt(v.x)} : résidu=${fmt(v.residual)}`).join(' ; '),why:'La substitution protège contre une erreur de transformation.',check:verificationOk?'Toutes les solutions calculées sont vérifiées.':'Une vérification a échoué.'});
 const finalAnswer=solved.kind==='all'?'S=ℝ':solutionSet(solved.roots);
 return{kind:'equation',title:'Résolution de ton équation',exact:true,givens:[`${eq.left}=${eq.right}`],steps,finalAnswer,verification:verificationOk?'Résolution algébrique et substitution cohérentes.':'Résultat à contrôler.'};
}

function extractFunction(statement:string):string|null{
 const match=statement.match(/(?:f|g|h)\s*\(\s*x\s*\)\s*=\s*([^;\n]+)/i);
 if(!match)return null;
 let candidate=match[1]
  .replace(/\.\s+(?=[A-ZÀ-Ý]).*$/u,'')
  .replace(/\s+(?:etud|étud|calcul|determin|détermin|montr|resou|trac).*$/i,'')
  .trim().replace(/[.,!?]+$/,'');
 return candidate&&/x/i.test(candidate)?mathExpr(candidate):null;
}


function solveDerivativeStatement(statement:string):StatementResolution|null{
 const plain=normalizeText(statement);
 if(!/(derive|deriver|dériv|f'\s*\(|derivee)/.test(plain)&&!statement.includes("f'"))return null;
 const expr=extractFunction(statement);if(!expr)return null;
 const result=deriveWithBacEngine(expr);if(!result.supported)return null;
 const steps:StatementResolutionStep[]=[
  {title:'Identifier la fonction à dériver',work:`f(x)=${expr}`,why:'On fixe exactement l’expression avant d’appliquer les règles de dérivation.'},
  ...result.steps.slice(0,6).map((step,index)=>({title:step.rule||`Étape de dérivation ${index+1}`,work:step.application||step.formula,why:step.formula||'On applique une règle de dérivation valide.'})),
  {title:'Simplifier la dérivée',work:`f'(x)=${result.derivative}`,why:'Une forme simplifiée facilite ensuite l’étude du signe ou des variations.'}
 ];
 return{kind:'derivative',title:'Dérivée calculée pas à pas',exact:true,givens:[`f(x)=${expr}`],steps,finalAnswer:`f'(x)=${result.derivative}`,verification:'La dérivée est produite par le moteur symbolique déterministe et couverte par les tests de régression.',scope:'Dérivées des expressions prises en charge : polynômes, quotients usuels, puissances, exp, ln, trigonométrie et compositions supportées.'};
}

function solveIntegralStatement(statement:string):StatementResolution|null{
 const plain=normalizeText(statement);
 if(!plain.includes('integrale')&&!statement.includes('∫'))return null;
 let lo:number|null=null,hi:number|null=null,expr:string|null=null;
 const symbol=statement.match(/∫\s*[_]?[({]?\s*(-?\d+(?:[,.]\d+)?)\s*[)}]?\s*\^\s*[({]?\s*(-?\d+(?:[,.]\d+)?)\s*[)}]?\s*([^\n]+?)\s*d\s*x/i);
 if(symbol){
  lo=Number(symbol[1].replace(',','.'));hi=Number(symbol[2].replace(',','.'));expr=symbol[3].replace(/^[({\[]+|[)}\]]+$/g,'').trim();
 }else{
  const text=statement.match(/integrale\s+(?:de\s+)?(-?\d+(?:[,.]\d+)?)\s+(?:a|à)\s+(-?\d+(?:[,.]\d+)?)\s+(?:de\s+)?(.+?)(?:\s+d\s*x|[.;!?]|$)/i);
  if(text){lo=Number(text[1].replace(',','.'));hi=Number(text[2].replace(',','.'));expr=text[3].trim();}
 }
 if(lo===null||hi===null||!Number.isFinite(lo)||!Number.isFinite(hi)||!expr)return null;
 const clean=mathExpr(expr.replace(/\bln\s*\(/gi,'log('));
 const result=tryExactDefiniteIntegral(clean,lo,hi);if(!result)return null;
 const steps:StatementResolutionStep[]=result.steps.map((work,index)=>({title:index===0?'Reconnaître la forme':index===1?'Trouver une primitive':index===2?'Appliquer les bornes':'Calculer et conclure',work,why:index===1?'Une primitive exacte permet d’utiliser le théorème fondamental de l’intégration.':'Chaque ligne conserve le calcul de l’intégrale demandée.'}));
 return{kind:'integral',title:'Intégrale définie calculée exactement',exact:true,givens:[`I=∫[${fmt(lo)},${fmt(hi)}] ${clean} dx`],steps,finalAnswer:`I=${result.exactResultExpr}`,verification:`Primitive utilisée : ${result.primitive}. Méthode : ${result.method}.`,scope:'Intégrales définies reconnues exactement : polynômes et plusieurs formes usuelles/composées simples.'};
}

function solveSequenceStatement(statement:string):StatementResolution|null{
 const plain=normalizeText(statement);if(!plain.includes('suite')&&!/u\s*[_]?\s*n/i.test(statement))return null;
 const numericIndices=[...statement.matchAll(/u\s*[_]?\s*(\d+)/gi)].map(m=>Number(m[1]));
 if(!numericIndices.length)return null;
 const target=numericIndices[numericIndices.length-1];if(!Number.isSafeInteger(target)||target<0||target>50)return null;
 const u0match=statement.match(/u\s*[_]?\s*0\s*=\s*(-?\d+(?:[,.]\d+)?)/i);
 const rec=statement.match(/u\s*[_]?\s*\(?\s*n\s*\+\s*1\s*\)?\s*=\s*([^;\n.]+)/i);
 if(rec&&u0match){
  const u0=Number(u0match[1].replace(',','.'));
  let expr=rec[1].trim().replace(/u\s*[_]?\s*n/gi,'x').replace(/u\s*\(\s*n\s*\)/gi,'x');
  expr=mathExpr(expr).replace(/(\d)x/gi,'$1*x');
  const result=analyzeSequenceVerified(expr,u0,'recursive',Math.max(8,target+1),0);
  if(result.quality.level!=='verified')return null;
  const term=result.terms.find(t=>t.n===target);if(!term)return null;
  const displayed=result.terms.filter(t=>t.n<=target).slice(0,8).map(t=>`u_${t.n}=${fmt(t.value)}`).join(' ; ');
  const steps:StatementResolutionStep[]=[
   {title:'Identifier la récurrence',work:`u_0=${fmt(u0)} ; u_(n+1)=${expr.replace(/x/g,'u_n')}`,why:'On part du terme initial et de la règle qui donne le terme suivant.'},
   {title:'Calculer les termes successifs utiles',work:displayed,why:'Chaque terme est obtenu en appliquant exactement la relation de récurrence.'},
   ...result.proofSteps.slice(0,3).map((work,index)=>({title:`Propriété vérifiée ${index+1}`,work,why:'Le moteur a reconnu algébriquement la forme de la suite.'}))
  ];
  return{kind:'sequence',title:`Calcul de u_${target}`,exact:true,givens:[`u_0=${fmt(u0)}`,`u_(n+1)=${expr.replace(/x/g,'u_n')}`],steps,finalAnswer:`u_${target}=${fmt(term.value)}`,verification:result.quality.detail,scope:'Suites récurrentes affines reconnues et termes jusqu’à l’indice 50.'};
 }
 const explicit=statement.match(/u\s*[_]?\s*n\s*=\s*([^;\n.]+)/i);
 if(explicit){
  const expr=mathExpr(explicit[1].trim());
  const result=analyzeSequenceVerified(expr,0,'explicit',Math.max(8,target+1),0);
  if(result.quality.level!=='verified')return null;
  const term=result.terms.find(t=>t.n===target);if(!term)return null;
  const steps:StatementResolutionStep[]=[
   {title:'Identifier la formule explicite',work:`u_n=${expr}`,why:'Une formule explicite permet de remplacer directement n par l’indice demandé.'},
   {title:`Remplacer n par ${target}`,work:`u_${target}=${expr.replace(/n/g,String(target))}`,why:'On évalue la formule exactement au rang demandé.'},
   {title:'Calculer',work:`u_${target}=${fmt(term.value)}`,why:'On effectue les opérations dans l’ordre.'}
  ];
  return{kind:'sequence',title:`Calcul de u_${target}`,exact:true,givens:[`u_n=${expr}`],steps,finalAnswer:`u_${target}=${fmt(term.value)}`,verification:result.quality.detail,scope:'Suites explicites polynomiales, géométriques et fractions rationnelles reconnues par le moteur.'};
 }
 return null;
}

function solveBinomialStatement(statement:string):StatementResolution|null{
 const plain=normalizeText(statement);if(!/(binomial|suit\s+b\s*\(|loi\s+b\s*\()/i.test(plain))return null;
 const law=statement.match(/B\s*\(\s*(\d+)\s*[;,]\s*(\d+(?:[,.]\d+)?)\s*\)/i);if(!law)return null;
 const n=Number(law[1]),p=Number(law[2].replace(',','.'));if(!Number.isSafeInteger(n)||n<0||p<0||p>1)return null;
 const exact=statement.match(/P\s*\(\s*X\s*=\s*(\d+)\s*\)/i);
 if(exact){
  const k=Number(exact[1]);if(!Number.isSafeInteger(k)||k<0||k>n)return null;
  const comb=combinationBigInt(n,k),value=binomialProbability(n,k,p);
  const steps:StatementResolutionStep[]=[
   {title:'Identifier les paramètres',work:`X~B(${n};${fmt(p)}) et k=${k}`,why:'La loi binomiale est déterminée par le nombre d’épreuves n et la probabilité de succès p.'},
   {title:'Écrire la formule',work:`P(X=${k})=C(${n},${k})×${fmt(p)}^${k}×(1−${fmt(p)})^${n-k}`,why:'On utilise la formule d’une probabilité ponctuelle binomiale.'},
   {title:'Calculer le coefficient binomial',work:`C(${n},${k})=${comb.toString()}`,why:'Il compte les positions possibles des k succès.'},
   {title:'Calculer la probabilité',work:`P(X=${k})=${fmt(value)}`,why:'Le résultat doit appartenir à [0,1].',check:value>=0&&value<=1?'Probabilité valide.':'Valeur incohérente.'}
  ];
  return{kind:'probability',title:'Probabilité binomiale calculée',exact:true,givens:[`n=${n}`,`p=${fmt(p)}`,`k=${k}`],steps,finalAnswer:`P(X=${k})=${fmt(value)}`,verification:'La formule binomiale et le coefficient combinatoire sont calculés par le moteur testé.',scope:'Probabilités P(X=k) pour une loi binomiale explicitement donnée.'};
 }
 if(/esperance|e\s*\(\s*x\s*\)/i.test(plain)){
  const value=n*p;
  return{kind:'probability',title:'Espérance d’une loi binomiale',exact:true,givens:[`X~B(${n};${fmt(p)})`],steps:[{title:'Rappeler la formule',work:'E(X)=np',why:'C’est l’espérance d’une variable binomiale.'},{title:'Remplacer les valeurs',work:`E(X)=${n}×${fmt(p)}=${fmt(value)}`,why:'On applique directement la formule.'}],finalAnswer:`E(X)=${fmt(value)}`,verification:'Calcul direct de np.',scope:'Espérance des lois binomiales explicitement données.'};
 }
 return null;
}

function extractMoneyValue(statement:string):number|null{
 const match=statement.match(/([0-9][0-9\s.]*(?:[,.]\d+)?)\s*(?:Ar|ariary)/i);
 if(!match)return null;
 const value=Number(match[1].replace(/\s+/g,'').replace(',','.'));return Number.isFinite(value)?value:null;
}

function solveFinanceStatement(statement:string):StatementResolution|null{
 const plain=normalizeText(statement);
 if(!/(interet|escompte|capitalis|actualis|valeur acquise|valeur actuelle)/.test(plain))return null;
 const amount=extractMoneyValue(statement);
 const rateMatch=statement.match(/(\d+(?:[,.]\d+)?)\s*%/);
 const timeMatch=statement.match(/(\d+(?:[,.]\d+)?)\s*(ans?|annees?|années?|mois)/i);
 if(amount===null||!rateMatch||!timeMatch)return null;
 const rate=Number(rateMatch[1].replace(',','.'))/100;
 let duration=Number(timeMatch[1].replace(',','.'));
 const unit=timeMatch[2].toLowerCase();
 if(unit.startsWith('mois'))duration/=12;
 if(!Number.isFinite(rate)||!Number.isFinite(duration)||rate<0||duration<0)return null;
 let result;
 let scope='';
 if(/interet simple|intérêt simple/.test(plain)){
  result=simpleInterest(amount,rate,duration);scope='Intérêt simple avec taux annuel et durée explicite.';
 }else if(/actualis|valeur actuelle/.test(plain)){
  if(!Number.isSafeInteger(duration))return null;
  result=presentValue(amount,rate,duration);scope='Actualisation composée sur un nombre entier de périodes annuelles.';
 }else if(/interet compose|intérêt composé|capitalis|valeur acquise/.test(plain)){
  if(!Number.isSafeInteger(duration))return null;
  result=compoundFutureValue(amount,rate,duration);scope='Capitalisation composée sur un nombre entier de périodes annuelles.';
 }else return null;
 const steps:StatementResolutionStep[]=[
  {title:'Identifier les données',work:`Montant=${fmt(amount)} Ar ; i=${fmt(rate)} ; durée=${fmt(duration)}`,why:'On transforme le taux en décimal et on harmonise l’unité de temps.'},
  {title:'Choisir la formule',work:result.formula,why:'La formule dépend du type d’opération financière demandé.'},
  ...result.steps.map((work,index)=>({title:`Calcul ${index+1}`,work,why:'On remplace les données sans arrondir avant la fin.'}))
 ];
 return{kind:'finance',title:result.title,exact:true,givens:[`Montant=${fmt(amount)} Ar`,`taux=${fmt(rate*100)} %`,`durée=${fmt(duration)} an(s)`],steps,finalAnswer:`${fmt(result.result)} Ar`,verification:result.checks.map(check=>`${check.label}: ${check.detail}`).join(' ; '),scope};
}

function solveFunctionVariation(statement:string):StatementResolution|null{
 const plain=normalizeText(statement);
 if(!/(variation|derive|etud)/.test(plain))return null;
 const expr=extractFunction(statement);if(!expr)return null;
 const poly=parsePolynomial(expr,'x',2);if(!poly||polynomialDegree(poly)>2)return null;
 const degree=polynomialDegree(poly),derivative=polynomialDerivative(poly);
 const derivText=formatPolynomial(derivative,'x');
 const steps:StatementResolutionStep[]=[
  {title:'Déterminer le domaine',work:'D_f=ℝ',why:'Une fonction polynomiale est définie pour tout réel.'},
  {title:'Calculer la dérivée',work:`f'(x)=${derivText}`,why:'Le signe de la dérivée donne le sens de variation de la fonction.',check:'La dérivée est obtenue terme à terme.'}
 ];
 let finalAnswer:string;
 if(degree===0){
  finalAnswer='f est constante sur ℝ.';
  steps.push({title:'Lire les variations',work:"f'(x)=0 pour tout x",why:'Une dérivée identiquement nulle correspond à une fonction constante.'});
 }else if(degree===1){
  const slope=derivative[0]||0;
  const direction=slope>0?'strictement croissante':'strictement décroissante';
  finalAnswer=`f est ${direction} sur ℝ.`;
  steps.push({title:'Étudier le signe de la dérivée',work:`f'(x)=${fmt(slope)} ${slope>0?'>':'<'} 0`,why:`La dérivée garde le même signe sur ℝ : f est donc ${direction}.`});
 }else{
  const a=poly[2]||0,b=poly[1]||0;
  const x0=-b/(2*a),y0=polynomialValue(poly,x0);
  const first=a>0?'décroissante':'croissante',second=a>0?'croissante':'décroissante',extreme=a>0?'minimum':'maximum';
  steps.push({title:'Trouver le point critique',work:`f'(x)=0 ⟺ x=${fmt(x0)}`,why:'Le signe de la dérivée peut changer au point où elle s’annule.'});
  steps.push({title:'Construire les variations',work:`f est ${first} sur ]−∞ ; ${fmt(x0)}] puis ${second} sur [${fmt(x0)} ; +∞[`,why:`Le coefficient de x² vaut ${fmt(a)} : le signe de f' change de part et d’autre de ${fmt(x0)}.`,check:`f(${fmt(x0)})=${fmt(y0)} : c’est un ${extreme}.`});
  finalAnswer=`f est ${first} sur ]−∞ ; ${fmt(x0)}] puis ${second} sur [${fmt(x0)} ; +∞[ ; son ${extreme} vaut ${fmt(y0)} pour x=${fmt(x0)}.`;
 }
 return{kind:'function-variation',title:'Étude construite à partir de ta fonction',exact:true,givens:[`f(x)=${expr}`],steps,finalAnswer,verification:'Domaine, dérivée et variations obtenus exactement pour ce polynôme.',scope:'Couverture automatique : domaine, dérivée et variations des polynômes de degré ≤ 2.'};
}

type LinearForm={coeffs:number[];constant:number};

function parseLinearForm(raw:string,variables:string[]):LinearForm|null{
 let text=raw.replace(/−/g,'-').replace(/(\d),(\d)/g,'$1.$2').replace(/\s+/g,'').replace(/\*/g,'');
 if(!text)return null;
 text=text.replace(/-/g,'+-');if(text.startsWith('+'))text=text.slice(1);
 const coeffs=variables.map(()=>0);let constant=0;
 for(const token of text.split('+').filter(Boolean)){
  const variableIndex=variables.findIndex(v=>token.toLowerCase().endsWith(v));
  if(variableIndex>=0){
   const rawCoeff=token.slice(0,-1);
   const coeff=rawCoeff===''?1:rawCoeff==='-'?-1:Number(rawCoeff);
   if(!Number.isFinite(coeff))return null;
   coeffs[variableIndex]+=coeff;
  }else{
   const value=Number(token);if(!Number.isFinite(value))return null;constant+=value;
  }
 }
 return{coeffs,constant};
}

function solveLinearSystemStatement(statement:string):StatementResolution|null{
 const plain=normalizeText(statement);
 if(!/(systeme|système|resou)/.test(statement.toLowerCase())&&!plain.includes('systeme'))return null;
 const segments=statement.split(/[;\n]+/).map(part=>part.trim()).filter(part=>part.includes('=')&&/[xyz]/i.test(part));
 const equations:{left:string;right:string}[]=[];
 for(const segment of segments){
  const eqPart=segment.includes(':')?segment.slice(segment.lastIndexOf(':')+1).trim():segment;
  const pieces=eqPart.split('=');
  if(pieces.length!==2)continue;
  const left=pieces[0].replace(/^[^xyz0-9+\-−]+/i,'').trim();
  const right=(pieces[1].match(/^[\s+\-−0-9.,xyzXYZ*]+/)?.[0]||pieces[1]).trim();
  if(left&&right)equations.push({left,right});
 }
 if(equations.length<2||equations.length>3)return null;
 const used=['x','y','z'].filter(v=>equations.some(eq=>new RegExp(v,'i').test(eq.left+eq.right)));
 if(used.length!==equations.length||used.length<2||used.length>3)return null;
 const a:number[][]=[],b:number[]=[];
 for(const eq of equations){
  const left=parseLinearForm(eq.left,used),right=parseLinearForm(eq.right,used);
  if(!left||!right)return null;
  a.push(left.coeffs.map((v,i)=>v-right.coeffs[i]));
  b.push(right.constant-left.constant);
 }
 let solved;
 try{solved=solveLinearSystem(a,b);}catch{return null;}
 const steps:StatementResolutionStep[]=[
  {title:'Mettre le système sous forme matricielle',work:`A=${JSON.stringify(a)} ; b=${JSON.stringify(b)}`,why:'On aligne les coefficients de '+used.join(', ')+' dans le même ordre.'}
 ];
 const cramer=solved.status==='unique'?solveCramer(a,b):null;
 if(cramer){
  steps.push({title:'Calculer le déterminant principal',work:`Δ=det(A)=${fmt(cramer.determinant)}`,why:'Comme Δ≠0, le système possède une solution unique et la méthode de Cramer est applicable.'});
  steps.push({title:'Appliquer la règle de Cramer',work:cramer.columnDeterminants.map((d,i)=>`Δ${used[i]}=${fmt(d)} ; ${used[i]}=Δ${used[i]}/Δ=${fmt(cramer.solution[i])}`).join(' ; '),why:'On remplace successivement la colonne de chaque inconnue par le second membre.'});
 }else{
  steps.push({title:'Réduire par Gauss-Jordan',work:solved.steps.slice(0,8).join(' → '),why:'Les opérations élémentaires sur les lignes conservent les solutions du système.'});
 }
 if(solved.status==='unique'&&solved.solution){
  steps.push({title:'Vérifier par substitution',work:`max |Ax−b|=${fmt(solved.residualMax??0)}`,why:'On remplace les inconnues dans les équations de départ pour contrôler la solution.'});
  const finalAnswer=used.map((v,i)=>`${v}=${fmt(solved.solution![i])}`).join(' ; ');
  return{kind:'linear-system',title:'Résolution exacte du système',exact:true,givens:equations.map(eq=>`${eq.left}=${eq.right}`),steps,finalAnswer,verification:'Le résidu numérique de substitution est '+fmt(solved.residualMax??0)+'.',scope:'Systèmes linéaires de 2 ou 3 équations en x, y, z.'};
 }
 const finalAnswer=solved.status==='none'?'Le système n’a aucune solution.':'Le système possède une infinité de solutions.';
 return{kind:'linear-system',title:'Étude exacte du système',exact:true,givens:equations.map(eq=>`${eq.left}=${eq.right}`),steps,finalAnswer,verification:`rang(A)=${solved.rankA} ; rang(A|b)=${solved.rankAugmented}.`,scope:'Systèmes linéaires de 2 ou 3 équations en x, y, z.'};
}

function solveCongruenceStatement(statement:string):StatementResolution|null{
 const normalized=statement.replace(/−/g,'-').replace(/(\d),(\d)/g,'$1.$2');
 if(!/[≡]/.test(normalized)&&!normalizeText(statement).includes('congru'))return null;
 const match=normalized.match(/([+-]?\d*)\s*x\s*≡\s*([+-]?\d+)\s*(?:\[|mod\s*)(\d+)\]?/i);
 if(!match)return null;
 const coeff=match[1]===''||match[1]==='+'?1:match[1]==='-'?-1:Number(match[1]);
 const rhs=Number(match[2]),modulus=Number(match[3]);
 if(![coeff,rhs,modulus].every(Number.isSafeInteger)||modulus<=0)return null;
 const solved=solveLinearCongruence(BigInt(coeff),BigInt(rhs),BigInt(modulus));
 const steps:StatementResolutionStep[]=solved.steps.map((work,index)=>({title:index===0?'Écrire la congruence':index===1?'Calculer le PGCD':'Poursuivre la résolution',work,why:index===1?'La divisibilité du second membre par le PGCD décide si la congruence est soluble.':'On applique les règles de congruence et l’inverse modulo n lorsque celui-ci existe.'}));
 const finalAnswer=solved.solvable?`x ≡ ${solved.representative} [${solved.solutionModulus}]`:'Aucune solution.';
 return{kind:'congruence',title:'Résolution exacte de la congruence',exact:true,givens:[`${coeff}x≡${rhs} [${modulus}]`],steps,finalAnswer,verification:solved.checks.map(check=>check.detail).join(' '),scope:'Congruences linéaires ax≡b [n].'};
}

function solvePgcd(statement:string):StatementResolution|null{
 const plain=normalizeText(statement);
 if(!plain.includes('pgcd'))return null;
 const match=plain.match(/pgcd(?:\s+de)?\s*\(?\s*(\d+)\s*(?:,|;|et)\s*(\d+)/i);if(!match)return null;
 let a=Number(match[1]),b=Number(match[2]);if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||a<=0||b<=0)return null;
 const originalA=a,originalB=b,steps:StatementResolutionStep[]=[];
 while(b!==0){
  const q=Math.floor(a/b),r=a%b;
  steps.push({title:'Division euclidienne',work:`${a}=${q}×${b}+${r}`,why:'Le PGCD de deux nombres est aussi le PGCD du diviseur et du reste.'});
  [a,b]=[b,r];
 }
 return{kind:'pgcd',title:'Calcul du PGCD avec tes nombres',exact:true,givens:[`a=${originalA}`,`b=${originalB}`],steps,finalAnswer:`PGCD(${originalA},${originalB})=${a}`,verification:`${a} divise ${originalA} et ${originalB}.`};
}

type Point={x:number;y:number};
function readPoints(statement:string):Map<string,Point>{
 const points=new Map<string,Point>();
 const semicolon=/\b([A-Z])\s*\(\s*(-?\d+(?:[.,]\d+)?)\s*;\s*(-?\d+(?:[.,]\d+)?)\s*\)/g;
 let m:RegExpExecArray|null;
 while((m=semicolon.exec(statement)))points.set(m[1].toUpperCase(),{x:Number(m[2].replace(',','.')),y:Number(m[3].replace(',','.'))});
 if(points.size)return points;
 const comma=/\b([A-Z])\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g;
 while((m=comma.exec(statement)))points.set(m[1].toUpperCase(),{x:Number(m[2]),y:Number(m[3])});
 return points;
}
function solveOrthogonality(statement:string):StatementResolution|null{
 const plain=normalizeText(statement);
 if(!/(orthogon|perpendic)/.test(plain))return null;
 const vectors=statement.match(/\b([A-Z]{2})\b\s*(?:et|,|;)\s*\b([A-Z]{2})\b/i);if(!vectors)return null;
 const [v1,v2]=[vectors[1].toUpperCase(),vectors[2].toUpperCase()];
 const points=readPoints(statement);
 const a1=points.get(v1[0]),b1=points.get(v1[1]),a2=points.get(v2[0]),b2=points.get(v2[1]);
 if(!a1||!b1||!a2||!b2)return null;
 const u={x:b1.x-a1.x,y:b1.y-a1.y},v={x:b2.x-a2.x,y:b2.y-a2.y};
 const dot=u.x*v.x+u.y*v.y,orthogonal=Math.abs(dot)<=EPS;
 const steps:StatementResolutionStep[]=[
  {title:`Calculer le vecteur ${v1}`,work:`${v1}=(${fmt(u.x)} ; ${fmt(u.y)})`,why:'On soustrait les coordonnées de l’origine à celles de l’extrémité.'},
  {title:`Calculer le vecteur ${v2}`,work:`${v2}=(${fmt(v.x)} ; ${fmt(v.y)})`,why:'On utilise le même ordre de soustraction pour éviter une erreur de signe.'},
  {title:'Calculer le produit scalaire',work:`${v1}·${v2}=${fmt(u.x)}×${fmt(v.x)}+${fmt(u.y)}×${fmt(v.y)}=${fmt(dot)}`,why:'Deux vecteurs non nuls sont orthogonaux si leur produit scalaire est nul.'}
 ];
 const finalAnswer=orthogonal?`Les vecteurs ${v1} et ${v2} sont orthogonaux.`:`Les vecteurs ${v1} et ${v2} ne sont pas orthogonaux.`;
 return{kind:'orthogonality',title:'Démonstration avec les coordonnées de ton énoncé',exact:true,givens:[...points.entries()].map(([name,p])=>`${name}(${fmt(p.x)} ; ${fmt(p.y)})`),steps,finalAnswer,verification:`Produit scalaire = ${fmt(dot)}.`};
}

export function solveStatementExactly(statement:string):StatementResolution|null{
 const text=statement.trim();if(!text)return null;
 return solveAdvancedStatement(text)||solveFinanceStatement(text)||solveBinomialStatement(text)||solveSequenceStatement(text)||solveIntegralStatement(text)||solveDerivativeStatement(text)||solveLinearSystemStatement(text)||solveCongruenceStatement(text)||solveFunctionVariation(text)||solveEquationStatement(text)||solvePgcd(text)||solveOrthogonality(text);
}

import { solveQuadraticReal } from './algebraCore.js';
import { formatPolynomial, parsePolynomial, polynomialDegree, polynomialDerivative, polynomialSub, polynomialValue } from './polynomialEngine.js';

export type StatementResolutionKind = 'equation' | 'function-variation' | 'pgcd' | 'orthogonality';

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
 const rounded=Math.abs(value)<1e-12?0:Math.round(value*1e10)/1e10;
 return Number.isInteger(rounded)?String(rounded):String(rounded).replace('.',',');
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
 return solveFunctionVariation(text)||solveEquationStatement(text)||solvePgcd(text)||solveOrthogonality(text);
}

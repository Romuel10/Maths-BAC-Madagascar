import type { StatementResolution, StatementResolutionStep } from './statementResolutionEngine.js';
import { exactLimitAtInfinity, exactElementaryBoundaryLimit } from './limitEngine.js';
import { solveInequalityVerified } from './inequalityEngine.js';
import { uniformRangeProbability, exponentialRangeProbability, exponentialSurvival, normalRangeProbability } from './probabilityEngine.js';
import { cArg, cMod, cToString, parseComplex, solveQuadraticComplex } from './complex.js';
import { solveFirstOrderHomogeneous, solveSecondOrderHomogeneous } from './differentialEquationEngine.js';
import { analyzeEllipse, analyzeHyperbola, analyzeParabola } from './conicEngine.js';
import { parsePolynomial, polynomialDegree } from './polynomialEngine.js';

const EPS=1e-12;
const fmt=(value:number)=>{
 if(!Number.isFinite(value))return String(value);
 if(Math.abs(value)<=EPS)return '0';
 const nearest=Math.round(value);
 if(Math.abs(value-nearest)<=1e-9*Math.max(1,Math.abs(value)))return String(nearest);
 return String(Math.round(value*1e10)/1e10).replace('.',',');
};
const normalize=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const mathExpr=(raw:string)=>raw
 .replace(/−/g,'-').replace(/×/g,'*').replace(/÷/g,'/')
 .replace(/²/g,'^2').replace(/³/g,'^3')
 .replace(/(\d),(\d)/g,'$1.$2')
 .replace(/\s+/g,'')
 .replace(/(\d)(x)/gi,'$1*$2')
 .replace(/(\d)\(/g,'$1*(')
 .replace(/\)\(/g,')*(');

function extractFunction(statement:string):string|null{
 const match=statement.match(/(?:f|g|h)\s*\(\s*x\s*\)\s*=\s*([^;\n]+)/i);
 if(!match)return null;
 const candidate=match[1]
  .replace(/\.\s+(?=[A-ZÀ-Ý]).*$/u,'')
  .replace(/\s+(?:quand|lorsque|pour|etud|étud|calcul|determin|détermin|montr|resou|trac).*$/i,'')
  .trim().replace(/[.,!?]+$/,'');
 return candidate&&/x/i.test(candidate)?mathExpr(candidate):null;
}

function solveLimit(statement:string):StatementResolution|null{
 const plain=normalize(statement);
 if(!plain.includes('limite')&&!/\blim\b/i.test(statement))return null;
 let expr=extractFunction(statement);
 const targetMatch=statement.match(/x\s*(?:→|->|tend\s+(?:vers|vers\s+la\s+valeur))\s*([+\-−]?\s*(?:∞|infini|-?\d+(?:[,.]\d+)?))\s*([+\-])?/i);
 if(!targetMatch)return null;
 if(!expr){
  const m=statement.match(/(?:limite|lim)\s+(?:de\s+)?(.+?)\s+(?:quand|lorsque|pour)\s+x\s*(?:→|->|tend)/i);
  if(m)expr=mathExpr(m[1].replace(/^[fgh]\s*\(\s*x\s*\)\s*=\s*/i,'').trim());
 }
 if(!expr)return null;
 const targetText=targetMatch[1].replace(/\s+/g,'');
 let result=null as ReturnType<typeof exactLimitAtInfinity>;
 let label=targetText;
 if(normalize(targetText).includes('infini')||targetText.includes('∞')){
  const positive=!/^[-−]/.test(targetText);
  result=exactLimitAtInfinity(expr,positive);
  label=positive?'+∞':'−∞';
 }else{
  const target=Number(targetText.replace('−','-').replace(',','.'));if(!Number.isFinite(target))return null;
  const side=targetMatch[2]==='-'?'left':'right';
  result=exactElementaryBoundaryLimit(expr,target,side);
  label=fmt(target)+(targetMatch[2]||'');
 }
 if(!result)return null;
 return{kind:'limit',title:'Limite calculée exactement',exact:true,givens:['f(x)='+expr,'x→'+label],steps:[
  {title:'Identifier la limite',work:'lim quand x→'+label+' de '+expr,why:'On fixe précisément l’expression et la direction de la limite.'},
  {title:'Appliquer une règle exacte',work:result.detail,why:'Le moteur valide uniquement une forme pour laquelle une règle exacte est reconnue.'},
  {title:'Conclure',work:'lim = '+result.value,why:'La valeur obtenue répond directement à la question.'}
 ],finalAnswer:'lim = '+result.value,verification:result.detail,scope:'Limites à ±∞ de fractions rationnelles et fonctions élémentaires reconnues, plus certaines limites unilatérales de ln ou sqrt.'};
}

function solveInequality(statement:string):StatementResolution|null{
 const plain=normalize(statement);
 if(!plain.includes('inequation')&&!/(résoudre|resoudre)/i.test(statement))return null;
 const body=statement.replace(/^[^:]{0,60}?(?:résoudre|resoudre)(?:\s+l['’]?inéquation|\s+l['’]?inequation)?\s*:?\s*/i,'').trim().replace(/[.;!?]+$/,'');
 const m=body.match(/^(.+?)\s*(<=|>=|≤|≥|<|>)\s*(.+)$/);if(!m||!/[xX]/.test(m[1]+m[3]))return null;
 const left=mathExpr(m[1]),right=mathExpr(m[3]);
 const relation=(m[2]==='≤'?'<=':m[2]==='≥'?'>=':m[2]) as '<='|'>='|'<'|'>';
 let result;
 try{result=solveInequalityVerified('('+left+')-('+right+')',relation,0,-20,20);}catch{return null;}
 if(!result.exact||result.quality!=='verified')return null;
 const steps=result.steps.map((work,index):StatementResolutionStep=>({title:index===0?'Mettre sous forme standard':index===1?'Construire le tableau de signes':'Étape '+(index+1),work,why:index===1?'Les zéros et valeurs interdites découpent ℝ en intervalles de signe constant.':'Chaque transformation est traitée algébriquement.'}));
 return{kind:'inequality',title:'Inéquation résolue exactement',exact:true,givens:[left+' '+m[2]+' '+right],steps,finalAnswer:'S='+result.solutionSet,verification:'Résolution exacte sur ℝ ; '+result.verifiedZeros+' zéro(x) vérifié(s).',scope:'Inéquations polynomiales de degré ≤2 et fractions rationnelles reconnues exactement.'};
}

function readProbability(statement:string,pattern:RegExp):number|null{
 const m=statement.match(pattern);return m?Number(m[1].replace(',','.')):null;
}

function solveConditionalProbability(statement:string):StatementResolution|null{
 const plain=normalize(statement);if(!/(condition|sachant|p\s*\()/i.test(plain))return null;
 const pA=readProbability(statement,/P\s*\(\s*A\s*\)\s*=\s*(\d+(?:[,.]\d+)?)/i);
 const pB=readProbability(statement,/P\s*\(\s*B\s*\)\s*=\s*(\d+(?:[,.]\d+)?)/i);
 const pInter=readProbability(statement,/P\s*\(\s*A\s*[∩&]\s*B\s*\)\s*=\s*(\d+(?:[,.]\d+)?)/i);
 const pBgivenA=readProbability(statement,/P\s*\(\s*B\s*(?:\||\/|sachant)\s*A\s*\)\s*=\s*(\d+(?:[,.]\d+)?)/i);
 if(pA!==null&&pBgivenA!==null&&/calcul.*P\s*\(\s*A\s*[∩&]\s*B\s*\)|P\s*\(\s*A\s*[∩&]\s*B\s*\)\s*\?/i.test(statement)){
  const value=pA*pBgivenA;if(value<0||value>1)return null;
  return{kind:'probability',title:'Probabilité conditionnelle',exact:true,givens:['P(A)='+fmt(pA),'P(B|A)='+fmt(pBgivenA)],steps:[
   {title:'Rappeler la formule',work:'P(A∩B)=P(A)×P(B|A)',why:'C’est la définition multiplicative de la probabilité conditionnelle.'},
   {title:'Remplacer les valeurs',work:'P(A∩B)='+fmt(pA)+'×'+fmt(pBgivenA)+'='+fmt(value),why:'On calcule la probabilité du chemin A puis B.'}
  ],finalAnswer:'P(A∩B)='+fmt(value),verification:'Résultat compris entre 0 et 1.',scope:'Intersection à partir de P(A) et P(B|A).'};
 }
 if(pB!==null&&pInter!==null&&/calcul.*P\s*\(\s*A\s*(?:\||\/|sachant)\s*B\s*\)|P\s*\(\s*A\s*(?:\||\/|sachant)\s*B\s*\)\s*\?/i.test(statement)&&pB>0){
  const value=pInter/pB;if(value<0||value>1)return null;
  return{kind:'probability',title:'Probabilité conditionnelle',exact:true,givens:['P(B)='+fmt(pB),'P(A∩B)='+fmt(pInter)],steps:[
   {title:'Rappeler la définition',work:'P(A|B)=P(A∩B)/P(B)',why:'On conditionne par B, donc P(B) doit être non nulle.'},
   {title:'Calculer',work:'P(A|B)='+fmt(pInter)+'/'+fmt(pB)+'='+fmt(value),why:'On applique directement la définition.'}
  ],finalAnswer:'P(A|B)='+fmt(value),verification:'P(B)>0 et résultat compris entre 0 et 1.',scope:'P(A|B) quand P(B) et P(A∩B) sont fournis.'};
 }
 return null;
}

function intervalProbability(statement:string):{a:number;b:number}|null{
 const m=statement.match(/P\s*\(\s*(-?\d+(?:[,.]\d+)?)\s*(?:≤|<=|<)\s*X\s*(?:≤|<=|<)\s*(-?\d+(?:[,.]\d+)?)\s*\)/i);
 if(!m)return null;
 const a=Number(m[1].replace(',','.')),b=Number(m[2].replace(',','.'));
 return Number.isFinite(a)&&Number.isFinite(b)?{a,b}:null;
}

function solveContinuousProbability(statement:string):StatementResolution|null{
 const plain=normalize(statement),interval=intervalProbability(statement);
 const uniform=statement.match(/U\s*\(\s*\[\s*(-?\d+(?:[,.]\d+)?)\s*[;,]\s*(-?\d+(?:[,.]\d+)?)\s*\]\s*\)/i);
 if(uniform&&interval){
  const min=Number(uniform[1].replace(',','.')),max=Number(uniform[2].replace(',','.'));if(!(min<max))return null;
  const value=uniformRangeProbability(interval.a,interval.b,min,max);
  return{kind:'probability',title:'Loi uniforme',exact:true,givens:['X~U(['+fmt(min)+';'+fmt(max)+'])','intervalle ['+fmt(interval.a)+';'+fmt(interval.b)+']'],steps:[
   {title:'Identifier la longueur totale',work:fmt(max)+'−'+fmt(min)+'='+fmt(max-min),why:'La densité est constante sur le support.'},
   {title:'Calculer la probabilité',work:'P('+fmt(interval.a)+'≤X≤'+fmt(interval.b)+')='+fmt(value),why:'On divise la longueur favorable par la longueur totale.'}
  ],finalAnswer:'P='+fmt(value),verification:'Probabilité uniforme calculée sur le support donné.',scope:'Loi uniforme U([a;b]) et probabilité d’intervalle.'};
 }
 const exp=statement.match(/(?:exponentielle|exponentiel).*?(?:param[eè]tre|lambda|λ)\s*(?:=|de)?\s*(\d+(?:[,.]\d+)?)/i);
 if(exp){
  const lambda=Number(exp[1].replace(',','.'));if(!(lambda>0))return null;
  if(interval){
   const value=exponentialRangeProbability(interval.a,interval.b,lambda);
   return{kind:'probability',title:'Loi exponentielle',exact:true,givens:['λ='+fmt(lambda),'['+fmt(interval.a)+';'+fmt(interval.b)+']'],steps:[
    {title:'Rappeler la fonction de répartition',work:'F(x)=1−exp(−λx), x≥0',why:'Elle permet de calculer une probabilité sur un intervalle.'},
    {title:'Calculer',work:'P('+fmt(interval.a)+'≤X≤'+fmt(interval.b)+')='+fmt(value),why:'On utilise F(b)−F(a).'}
   ],finalAnswer:'P='+fmt(value),verification:'Calcul déterministe avec λ>0.',scope:'Loi exponentielle à paramètre λ explicite.'};
  }
  const tail=statement.match(/P\s*\(\s*X\s*(?:≥|>=|>)\s*(\d+(?:[,.]\d+)?)\s*\)/i);
  if(tail){
   const x=Number(tail[1].replace(',','.')),value=exponentialSurvival(x,lambda);
   return{kind:'probability',title:'Loi exponentielle',exact:true,givens:['λ='+fmt(lambda),'x='+fmt(x)],steps:[
    {title:'Utiliser la fonction de survie',work:'P(X≥x)=exp(−λx)',why:'C’est la probabilité de dépasser x.'},
    {title:'Calculer',work:'P(X≥'+fmt(x)+')='+fmt(value),why:'On remplace λ et x.'}
   ],finalAnswer:'P='+fmt(value),verification:'Résultat compris entre 0 et 1.',scope:'Probabilité de dépassement d’une loi exponentielle.'};
  }
 }
 if(/normale/.test(plain)&&interval){
  const muM=statement.match(/moyenne\s*(?:=|de)?\s*(-?\d+(?:[,.]\d+)?)/i);
  const sigmaM=statement.match(/(?:ecart[- ]?type|écart[- ]?type|sigma|σ)\s*(?:=|de)?\s*(\d+(?:[,.]\d+)?)/i);
  if(muM&&sigmaM){
   const mu=Number(muM[1].replace(',','.')),sigma=Number(sigmaM[1].replace(',','.'));if(!(sigma>0))return null;
   const value=normalRangeProbability(interval.a,interval.b,mu,sigma);
   return{kind:'probability',title:'Loi normale',exact:true,givens:['μ='+fmt(mu),'σ='+fmt(sigma)],steps:[
    {title:'Identifier les paramètres',work:'μ='+fmt(mu)+' ; σ='+fmt(sigma),why:'La moyenne centre la loi et l’écart-type mesure sa dispersion.'},
    {title:'Centrer et réduire',work:'P(a≤X≤b)=Φ((b−μ)/σ)−Φ((a−μ)/σ)',why:'On ramène la variable à la loi normale centrée réduite.'},
    {title:'Calculer',work:'P('+fmt(interval.a)+'≤X≤'+fmt(interval.b)+')≈'+fmt(value),why:'La fonction de répartition normale donne la probabilité.'}
   ],finalAnswer:'P≈'+fmt(value),verification:'Calcul numérique contrôlé de la fonction de répartition normale.',scope:'Loi normale lorsque moyenne et écart-type sont explicitement nommés.'};
  }
 }
 return null;
}

function solveComplex(statement:string):StatementResolution|null{
 const plain=normalize(statement);if(!/(complex|module|argument|\bz\b)/.test(plain))return null;
 const eq=statement.match(/([+\-−0-9zZ.*^²\s]+)=\s*0/);
 if(eq&&/[zZ]/.test(eq[1])){
  const expr=mathExpr(eq[1]).replace(/(\d)z/gi,'$1*z');
  const p=parsePolynomial(expr,'z',2);
  if(p&&polynomialDegree(p)===2){
   const a=p[2]||0,b=p[1]||0,d=p[0]||0,solved=solveQuadraticComplex(a,b,d);
   const steps=solved.steps.map((work,index):StatementResolutionStep=>({title:index===0?'Identifier les coefficients':index===1?'Calculer le discriminant':'Résolution '+(index-1),work,why:index===1?'Dans ℂ, un discriminant négatif conduit encore à des solutions.':'On applique la formule du second degré dans ℂ.'}));
   return{kind:'complex',title:'Équation du second degré dans ℂ',exact:true,givens:[expr+'=0'],steps,finalAnswer:'S={'+cToString(solved.z1)+' ; '+cToString(solved.z2)+'}',verification:solved.verification.map(v=>cToString(v.z)+' : résidu '+fmt(v.residual)).join(' ; '),scope:'Équations az²+bz+c=0 à coefficients réels.'};
  }
 }
 const zm=statement.match(/\bz\s*=\s*([+\-−]?\d+(?:[,.]\d+)?(?:\s*[+\-−]\s*\d*(?:[,.]\d+)?i)?|[+\-−]?\d*(?:[,.]\d+)?i)/i);
 if(!zm)return null;
 const z=parseComplex(zm[1].replace(/−/g,'-').replace(/,/g,'.'));if(!z)return null;
 if(/module/.test(plain)){
  const value=cMod(z);
  return{kind:'complex',title:'Module d’un nombre complexe',exact:true,givens:['z='+cToString(z)],steps:[
   {title:'Lire les composantes',work:'a='+fmt(z.re)+' ; b='+fmt(z.im),why:'Pour z=a+bi, on utilise ses parties réelle et imaginaire.'},
   {title:'Appliquer la formule',work:'|z|=sqrt('+fmt(z.re)+'²+'+fmt(z.im)+'²)='+fmt(value),why:'Le module est la distance à l’origine.'}
  ],finalAnswer:'|z|='+fmt(value),verification:'Calcul direct par sqrt(a²+b²).',scope:'Module de z=a+bi.'};
 }
 if(/argument/.test(plain)&&cMod(z)>EPS){
  const value=cArg(z);
  return{kind:'complex',title:'Argument principal',exact:true,givens:['z='+cToString(z)],steps:[
   {title:'Repérer le point',work:'M('+fmt(z.re)+' ; '+fmt(z.im)+')',why:'L’argument est l’angle orienté du vecteur OM.'},
   {title:'Calculer l’angle',work:'arg(z)≈'+fmt(value)+' rad',why:'Le calcul tient compte du quadrant.'}
  ],finalAnswer:'arg(z)≈'+fmt(value)+' rad',verification:'Argument principal dans ]−π;π].',scope:'Argument numérique principal des nombres complexes non nuls.'};
 }
 return null;
}

const coef=(raw:string)=>raw===''||raw==='+'?1:raw==='-'?-1:Number(raw);

function solveOde(statement:string):StatementResolution|null{
 const plain=normalize(statement);if(!/(differentielle|y'|y″|y'')/.test(plain))return null;
 const body=statement.replace(/^[^:]{0,80}?(?:résoudre|resoudre)(?:\s+l['’]?équation\s+différentielle|\s+l['’]?equation\s+differentielle)?\s*:?\s*/i,'').replace(/[−–—]/g,'-').replace(/\s+/g,'').replace(/y″/g,"y''").trim().replace(/[.;!?]+$/,'');
 const second=body.match(/^([+-]?\d*(?:\.\d+)?)y''([+-]\d*(?:\.\d+)?)y'([+-]\d*(?:\.\d+)?)y=0$/i);
 if(second){
  const A=coef(second[1]),B=coef(second[2]),C=coef(second[3]);if(![A,B,C].every(Number.isFinite)||A===0)return null;
  const solved=solveSecondOrderHomogeneous(A,B,C);
  const steps=solved.steps.map((work,index):StatementResolutionStep=>({title:index===0?'Équation différentielle':index===1?'Équation caractéristique':index===2?'Discriminant':'Étape '+(index+1),work,why:index===1?'Les racines caractéristiques donnent les exponentielles de la solution.':'On applique la méthode des équations linéaires homogènes à coefficients constants.'}));
  return{kind:'ode',title:'Équation différentielle du second ordre',exact:true,givens:[body],steps,finalAnswer:solved.generalSolution,verification:'Racines caractéristiques : '+solved.roots.join(' ; ')+'.',scope:"Équations homogènes Ay''+By'+Cy=0 à coefficients réels constants."};
 }
 const first=body.match(/^y'([+-]\d*(?:\.\d+)?)y=0$/i);
 if(first){
  const a=coef(first[1]);if(!Number.isFinite(a))return null;
  const solved=solveFirstOrderHomogeneous(a);
  const steps=solved.steps.map((work,index):StatementResolutionStep=>({title:index===0?'Équation différentielle':index===1?'Séparer puis intégrer':'Solution générale',work,why:index===1?'On ramène y′/y à une constante avant intégration.':'La solution générale est vérifiable par dérivation.'}));
  return{kind:'ode',title:'Équation différentielle du premier ordre',exact:true,givens:[body],steps,finalAnswer:solved.generalSolution,verification:'Solution générale déterministe.',scope:"Équations homogènes y'+ay=0 à coefficient réel constant."};
 }
 return null;
}

function solveConic(statement:string):StatementResolution|null{
 const plain=normalize(statement);if(!/(conique|ellipse|hyperbole|parabole|foyer|directrice|asymptote)/.test(plain))return null;
 const compact=statement.replace(/[−–—]/g,'-').replace(/\s+/g,'').replace(/²/g,'^2').replace(/,/g,'.');
 let analysis;
 const ellipse=compact.match(/x\^2\/(\d+(?:\.\d+)?)\+y\^2\/(\d+(?:\.\d+)?)=1/i);
 if(ellipse){
  const a2=Number(ellipse[1]),b2=Number(ellipse[2]);if(!(a2>0&&b2>0))return null;
  analysis=analyzeEllipse(Math.sqrt(a2),Math.sqrt(b2));
 }else{
  const hx=compact.match(/x\^2\/(\d+(?:\.\d+)?)\-y\^2\/(\d+(?:\.\d+)?)=1/i);
  const hy=compact.match(/y\^2\/(\d+(?:\.\d+)?)\-x\^2\/(\d+(?:\.\d+)?)=1/i);
  if(hx){
   const a2=Number(hx[1]),b2=Number(hx[2]);if(!(a2>0&&b2>0))return null;
   analysis=analyzeHyperbola(Math.sqrt(a2),Math.sqrt(b2),false);
  }else if(hy){
   const a2=Number(hy[1]),b2=Number(hy[2]);if(!(a2>0&&b2>0))return null;
   analysis=analyzeHyperbola(Math.sqrt(a2),Math.sqrt(b2),true);
  }else{
   const px=compact.match(/y\^2=([+-]?\d+(?:\.\d+)?)x/i),py=compact.match(/x\^2=([+-]?\d+(?:\.\d+)?)y/i);
   if(px){
    const q=Number(px[1]);if(q===0)return null;
    analysis=analyzeParabola(Math.abs(q)/4,'x',q>0?1:-1);
   }else if(py){
    const q=Number(py[1]);if(q===0)return null;
    analysis=analyzeParabola(Math.abs(q)/4,'y',q>0?1:-1);
   }else return null;
  }
 }
 const steps:StatementResolutionStep[]=[
  {title:'Reconnaître la forme canonique',work:analysis.equation,why:'La forme canonique identifie le type de conique et ses paramètres.'},
  {title:'Repérer les éléments caractéristiques',work:(analysis.center?'centre '+analysis.center:'sommet O(0,0)')+' ; sommets '+analysis.vertices.join(', ')+' ; foyers '+analysis.foci.join(', '),why:'Ces éléments déterminent la géométrie de la courbe.'}
 ];
 if(analysis.directrices.length)steps.push({title:'Déterminer les directrices',work:analysis.directrices.join(' ; '),why:'Les directrices complètent la définition foyer-directrice.'});
 if(analysis.asymptotes.length)steps.push({title:'Déterminer les asymptotes',work:analysis.asymptotes.join(' ; '),why:'Une hyperbole se rapproche de ces droites à l’infini.'});
 const final=(analysis.center?'Centre : '+analysis.center+' · ':'')+'Foyer(s) : '+analysis.foci.join(' ; ')+(analysis.asymptotes.length?' · Asymptotes : '+analysis.asymptotes.join(' ; '):'')+(analysis.directrices.length?' · Directrice(s) : '+analysis.directrices.join(' ; '):'');
 return{kind:'conic',title:'Étude de la conique',exact:true,givens:[analysis.equation],steps,finalAnswer:final,verification:analysis.checks.map(item=>item.label+': '+item.detail).join(' ; '),scope:'Coniques centrées en O sous forme canonique : ellipses, hyperboles et paraboles d’axes x ou y.'};
}

export function solveAdvancedStatement(statement:string):StatementResolution|null{
 const text=statement.trim();if(!text)return null;
 return solveContinuousProbability(text)||solveConditionalProbability(text)||solveComplex(text)||solveOde(text)||solveConic(text)||solveInequality(text)||solveLimit(text);
}

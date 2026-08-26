import type { BacSubject } from './bacSubjects.js';

export const EXTRA_BAC_SUBJECTS:BacSubject[]=[
 {
  id:'type-a-2026-02',series:'A',year:2026,title:'Entraînement BAC — Série A · Sujet 2',durationMinutes:80,coefficient:2,official:false,
  sourceLabel:'Sujet original d’entraînement intégré à l’application',description:'Trinôme, statistiques descriptives et probabilités élémentaires.',
  exercises:[
   {id:'a2-algebre',title:'Exercice 1 — Trinôme',introduction:'On considère $f(x)=x^2+2x-3$.',questions:[
    {id:'a2-al-1',number:'1.a',topic:'Algèbre',points:2,prompt:'Résoudre $f(x)=0$.',hints:['Cherche une factorisation de x²+2x−3.','Le produit vaut −3 et la somme vaut 2.'],method:['Écrire f(x)=(x−1)(x+3).','Utiliser la règle du produit nul.'],check:{kind:'text',allOf:['1','-3']},finalAnswer:'Les solutions sont $x=1$ et $x=-3$.',toolExpression:'x^2+2*x-3'},
    {id:'a2-al-2',number:'1.b',topic:'Analyse',points:2,prompt:'Déterminer le minimum de f.',hints:['Le sommet a pour abscisse −b/(2a).','Calcule f(−1).'],method:['α=−2/2=−1.','f(−1)=1−2−3=−4.','Comme a>0, le sommet donne un minimum.'],check:{kind:'number',expected:-4},finalAnswer:'Le minimum vaut $-4$, atteint pour $x=-1$.',toolExpression:'x^2+2*x-3'},
   ]},
   {id:'a2-stats',title:'Exercice 2 — Statistiques',introduction:'Les notes sont 8, 10, 10, 12 et 15.',questions:[
    {id:'a2-st-1',number:'2.a',topic:'Statistiques',points:1.5,prompt:'Calculer la moyenne.',hints:['Additionne les cinq valeurs puis divise par 5.'],method:['La somme vaut 55.','55/5=11.'],check:{kind:'number',expected:11},finalAnswer:'La moyenne vaut $11$.'},
    {id:'a2-st-2',number:'2.b',topic:'Statistiques',points:1,prompt:'Déterminer la médiane.',hints:['Les données sont déjà ordonnées.','Repère la troisième valeur.'],method:['L’effectif est impair : N=5.','La valeur centrale est la troisième.'],check:{kind:'number',expected:10},finalAnswer:'La médiane vaut $10$.'},
   ]},
   {id:'a2-proba',title:'Exercice 3 — Probabilités',introduction:'Un sac contient 3 boules rouges et 2 bleues. Les tirages sont équiprobables.',questions:[
    {id:'a2-pr-1',number:'3.a',topic:'Probabilités',points:1,prompt:'Probabilité de tirer une boule rouge ?',hints:['Il y a 3 issues favorables sur 5 boules.'],method:['P(R)=nombre de rouges/nombre total.'],check:{kind:'expression',expected:'3/5'},finalAnswer:'$P(R)=3/5=0,6$.'},
    {id:'a2-pr-2',number:'3.b',topic:'Probabilités',points:1.5,prompt:'On tire deux boules sans remise. Probabilité qu’elles soient rouges ?',hints:['Après une rouge, il reste 2 rouges parmi 4 boules.'],method:['P(RR)=3/5×2/4.','Simplifier la fraction.'],check:{kind:'expression',expected:'3/10'},finalAnswer:'$P(RR)=3/10=0,3$.'},
   ]},
  ]
 },
 {
  id:'type-c-2026-02',series:'C',year:2026,title:'Entraînement BAC — Série C · Sujet 2',durationMinutes:110,coefficient:5,official:false,
  sourceLabel:'Sujet original d’entraînement intégré à l’application',description:'Complexes, fonction logarithme et géométrie analytique.',
  exercises:[
   {id:'c2-complexes',title:'Exercice 1 — Complexes',questions:[
    {id:'c2-co-1',number:'1.a',topic:'Complexes',points:1.5,prompt:'Déterminer le module de $z=1-sqrt(3)i$.',hints:['Utilise |a+bi|=sqrt(a²+b²).'],method:['|z|=sqrt(1²+(−sqrt(3))²).','|z|=sqrt(4).'],check:{kind:'number',expected:2},finalAnswer:'$|z|=2$.'},
    {id:'c2-co-2',number:'1.b',topic:'Complexes',points:1.5,prompt:'Résoudre $z^2+4=0$ dans ℂ.',hints:['Écrire z²=−4.','Les racines de −4 sont ±2i.'],method:['z²=−4.','z=±sqrt(−4)=±2i.'],check:{kind:'text',allOf:['2i','-2i']},finalAnswer:'$z=2i$ ou $z=-2i$.'},
   ]},
   {id:'c2-analyse',title:'Exercice 2 — Fonction logarithme',introduction:'On considère $f(x)=ln(x)/x$.',questions:[
    {id:'c2-an-1',number:'2.a',topic:'Analyse',points:1,prompt:'Déterminer le domaine de f.',hints:['ln(x) exige x>0.','Pour x>0, le dénominateur est non nul.'],method:['Imposer x>0.'],check:{kind:'text',anyOf:['x>0',']0;+∞[',']0,+∞[']},finalAnswer:'$D_f=]0,+∞[$.',toolExpression:'log(x)/x'},
    {id:'c2-an-2',number:'2.b',topic:'Analyse',points:2,prompt:"Calculer $f'(x)$.",hints:['Utilise la dérivée d’un quotient.'],method:["u=ln(x), u'=1/x ; v=x, v'=1.","f'=[(1/x)x−ln(x)]/x²."],check:{kind:'expression',expected:'(1-log(x))/x^2'},finalAnswer:"$f'(x)=(1-ln(x))/x^2$.",toolExpression:'log(x)/x'},
   ]},
   {id:'c2-geometry',title:'Exercice 3 — Géométrie analytique',introduction:'Dans un repère orthonormé, A(1,0) et B(3,4).',questions:[
    {id:'c2-ge-1',number:'3.a',topic:'Géométrie',points:1,prompt:'Donner les coordonnées du vecteur AB.',hints:['Soustrais les coordonnées de A à celles de B.'],method:['AB=(3−1,4−0).'],check:{kind:'text',allOf:['2','4']},finalAnswer:'$AB=(2,4)$.'},
    {id:'c2-ge-2',number:'3.b',topic:'Géométrie',points:1.5,prompt:'Calculer la distance AB.',hints:['AB=sqrt((xB−xA)²+(yB−yA)²).'],method:['AB=sqrt(2²+4²).','AB=sqrt(20)=2sqrt(5).'],check:{kind:'expression',expected:'2*sqrt(5)'},finalAnswer:'$AB=2sqrt(5)$.'},
   ]},
  ]
 },
 {
  id:'type-d-2026-02',series:'D',year:2026,title:'Entraînement BAC — Série D · Sujet 2',durationMinutes:100,coefficient:4,official:false,
  sourceLabel:'Sujet original d’entraînement intégré à l’application',description:'Exponentielle, suite arithmétique et loi binomiale.',
  exercises:[
   {id:'d2-analyse',title:'Exercice 1 — Analyse',introduction:'On considère $f(x)=(x+1)e^(-x)$ sur ℝ.',questions:[
    {id:'d2-an-1',number:'1.a',topic:'Analyse',points:1.5,prompt:"Montrer que $f'(x)=-xe^(-x)$.",hints:['Utilise la règle du produit.'],method:["f'=1×e^(-x)+(x+1)(−e^(-x)).",'Factoriser e^(-x) puis réduire.'],check:{kind:'expression',expected:'-x*exp(-x)'},finalAnswer:"$f'(x)=-xe^(-x)$.",toolExpression:'(x+1)*exp(-x)'},
    {id:'d2-an-2',number:'1.b',topic:'Analyse',points:1.5,prompt:'Déterminer le maximum de f.',hints:['e^(−x)>0 ; le signe de f′ est celui de −x.'],method:['f′>0 pour x<0 et f′<0 pour x>0.','Le maximum est atteint en 0.','f(0)=1.'],check:{kind:'number',expected:1},finalAnswer:'Le maximum vaut $1$, atteint pour $x=0$.',toolExpression:'(x+1)*exp(-x)'},
   ]},
   {id:'d2-suite',title:'Exercice 2 — Suite arithmétique',introduction:'On pose $u_0=4$ et $u_(n+1)=u_n+3$.',questions:[
    {id:'d2-su-1',number:'2.a',topic:'Suites',points:1,prompt:'Calculer $u_10$.',hints:['La suite est arithmétique de raison 3.'],method:['uₙ=u₀+nr.','u₁₀=4+10×3.'],check:{kind:'number',expected:34},finalAnswer:'$u_10=34$.'},
    {id:'d2-su-2',number:'2.b',topic:'Suites',points:1.5,prompt:'Calculer $S=u_0+u_1+...+u_10$.',hints:['Il y a 11 termes.','S=nombre de termes×(premier+dernier)/2.'],method:['S=11(4+34)/2.','S=11×19.'],check:{kind:'number',expected:209},finalAnswer:'$S=209$.'},
   ]},
   {id:'d2-proba',title:'Exercice 3 — Loi binomiale',introduction:'X suit la loi binomiale B(5;0,4).',questions:[
    {id:'d2-pr-1',number:'3.a',topic:'Probabilités',points:1.5,prompt:'Calculer $P(X=2)$.',hints:['P(X=2)=C(5,2)0,4²0,6³.'],method:['C(5,2)=10.','Calculer 10×0,16×0,216.'],check:{kind:'number',expected:0.3456,tolerance:0.0002},finalAnswer:'$P(X=2)=0,3456$.'},
    {id:'d2-pr-2',number:'3.b',topic:'Probabilités',points:1,prompt:'Calculer l’espérance de X.',hints:['Pour B(n,p), E(X)=np.'],method:['E(X)=5×0,4.'],check:{kind:'number',expected:2},finalAnswer:'$E(X)=2$.'},
   ]},
  ]
 }
];

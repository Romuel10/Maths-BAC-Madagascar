import type { BacSeries, BacTopic } from './bacSubjects.js';
import { CURRICULUM_ENRICHMENTS, EXTRA_LEARNING_QUESTIONS, type LessonSection, type WorkedExample } from './curriculumContent.js';

export interface FormulaItem {
 id: string;
 title: string;
 expression: string;
 meaning: string;
 example: string;
}

export interface LearningChapter {
 topic: BacTopic;
 title: string;
 summary: string;
 objectives: string[];
 method: string[];
 formulas: FormulaItem[];
 definitions:string[];
 lessonSections:LessonSection[];
 pitfalls:string[];
 workedExamples:WorkedExample[];
 series: BacSeries[];
 tool?: 'algebra' | 'complex' | 'probability' | 'sequence' | 'geometry' | 'arithmetic';
}

export interface LearningQuestion {
 id: string;
 topic: BacTopic;
 series: BacSeries[];
 level: 1 | 2 | 3;
 prompt: string;
 choices: string[];
 correctIndex: number;
 explanation: string;
}

type CoreLearningChapter=Omit<LearningChapter,'definitions'|'lessonSections'|'pitfalls'|'workedExamples'>;

const CORE_LEARNING_CHAPTERS: CoreLearningChapter[] = [
 {
  topic: 'Analyse', title: 'Fonctions et analyse', series: ['A','C','D','S'], tool: undefined,
  summary: 'Domaine, limites, dérivées, variations, tangentes, convexité et asymptotes.',
  objectives: ['Déterminer un domaine', 'Étudier les variations', 'Interpréter une limite et une asymptote'],
  method: ['Déterminer le domaine.', 'Calculer les limites utiles.', 'Dériver puis étudier le signe de la dérivée.', 'Dresser le tableau et conclure.'],
  formulas: [
   {id:'der-product',title:'Dérivée d’un produit',expression:"(uv)'=u'v+uv'",meaning:'La dérivée agit sur chacun des deux facteurs.',example:"(x e^x)'=e^x+x e^x"},
   {id:'der-quotient',title:'Dérivée d’un quotient',expression:"(u/v)'=(u'v-uv')/v^2",meaning:'Valable lorsque le dénominateur n’est pas nul.',example:"(x/(x+1))'=1/(x+1)^2"},
   {id:'tangent',title:'Équation de la tangente',expression:'y=f(a)+f\'(a)(x-a)',meaning:'La tangente au point d’abscisse a utilise f(a) et f’(a).',example:'f(x)=x^2, a=1 : y=2x-1'},
  ]
 },
 {
  topic: 'Algèbre', title: 'Algèbre et équations', series: ['A','C','D','S'], tool: 'algebra',
  summary: 'Développement, factorisation, équations, inéquations et systèmes.',
  objectives: ['Factoriser une expression', 'Résoudre un trinôme', 'Vérifier une solution'],
  method: ['Réduire et placer tout du même côté.', 'Identifier le degré ou une factorisation.', 'Résoudre avec la méthode adaptée.', 'Vérifier dans l’expression initiale.'],
  formulas: [
   {id:'delta',title:'Discriminant',expression:'Δ=b^2-4ac',meaning:'Il détermine le nombre de solutions réelles du trinôme.',example:'x^2-5x+6 : Δ=1'},
   {id:'roots',title:'Racines du trinôme',expression:'x=(-b±sqrt(Δ))/(2a)',meaning:'Formule utilisée lorsque Δ est positif ou nul.',example:'x^2-5x+6=0 : x=2 ou x=3'},
   {id:'identity',title:'Identité remarquable',expression:'a^2-b^2=(a-b)(a+b)',meaning:'Différence de deux carrés.',example:'x^2-9=(x-3)(x+3)'},
  ]
 },
 {
  topic: 'Complexes', title: 'Nombres complexes', series: ['C','D','S'], tool: 'complex',
  summary: 'Forme algébrique, conjugué, module, argument et équations dans ℂ.',
  objectives: ['Calculer un module', 'Utiliser le conjugué', 'Résoudre une équation dans ℂ'],
  method: ['Écrire z=a+bi.', 'Choisir forme algébrique ou trigonométrique.', 'Calculer puis vérifier parties réelle et imaginaire.'],
  formulas: [
   {id:'complex-mod',title:'Module',expression:'|z|=sqrt(a^2+b^2)',meaning:'Distance du point d’affixe z à l’origine.',example:'|3+4i|=5'},
   {id:'complex-conj',title:'Conjugué',expression:'z*conj(z)=|z|^2',meaning:'Permet notamment de rationaliser un quotient.',example:'(2+i)(2-i)=5'},
  ]
 },
 {
  topic: 'Probabilités', title: 'Probabilités', series: ['A','C','D','S'], tool: 'probability',
  summary: 'Événements, probabilités conditionnelles, arbres et loi binomiale.',
  objectives: ['Définir les événements', 'Utiliser un conditionnement', 'Reconnaître une loi binomiale'],
  method: ['Définir clairement les événements.', 'Repérer indépendance ou conditionnement.', 'Écrire la formule avant les valeurs.', 'Contrôler que le résultat appartient à [0;1].'],
  formulas: [
   {id:'union',title:'Réunion de deux événements',expression:'P(A∪B)=P(A)+P(B)-P(A∩B)',meaning:'On retire l’intersection comptée deux fois.',example:'0.5+0.4-0.2=0.7'},
   {id:'conditional',title:'Probabilité conditionnelle',expression:'P_A(B)=P(A∩B)/P(A)',meaning:'Probabilité de B sachant A, si P(A)>0.',example:'P(A∩B)=0.2 et P(A)=0.5 : P_A(B)=0.4'},
   {id:'binomial',title:'Loi binomiale',expression:'P(X=k)=C(n,k)p^k(1-p)^(n-k)',meaning:'Pour n épreuves de Bernoulli indépendantes.',example:'n=3, p=0.5, k=2 : P=3/8'},
  ]
 },
 {
  topic: 'Suites', title: 'Suites numériques', series: ['C','D','S'], tool: 'sequence',
  summary: 'Suites explicites ou récurrentes, monotonie, bornes et convergence.',
  objectives: ['Calculer un terme', 'Étudier la monotonie', 'Justifier une convergence'],
  method: ['Identifier le type de définition.', 'Calculer quelques termes.', 'Étudier u_(n+1)-u_n ou un quotient.', 'Justifier bornes et limite.'],
  formulas: [
   {id:'arith-seq',title:'Suite arithmétique',expression:'u_n=u_0+nr',meaning:'Chaque terme s’obtient en ajoutant la raison r.',example:'u_0=2, r=3 : u_4=14'},
   {id:'geo-seq',title:'Suite géométrique',expression:'u_n=u_0 q^n',meaning:'Chaque terme s’obtient en multipliant par q.',example:'u_0=3, q=2 : u_4=48'},
  ]
 },
 {
  topic: 'Géométrie', title: 'Géométrie', series: ['A','C','D','S'], tool: 'geometry',
  summary: 'Vecteurs, droites, distances, produit scalaire et configurations.',
  objectives: ['Montrer une colinéarité', 'Prouver une orthogonalité', 'Calculer une distance'],
  method: ['Faire un schéma.', 'Relever les coordonnées et données.', 'Traduire la propriété par une égalité.', 'Conclure géométriquement.'],
  formulas: [
   {id:'distance',title:'Distance dans le plan',expression:'AB=sqrt((x_B-x_A)^2+(y_B-y_A)^2)',meaning:'Longueur entre deux points du plan.',example:'A(0,0), B(3,4) : AB=5'},
   {id:'dot',title:'Produit scalaire',expression:'u·v=x_u x_v+y_u y_v',meaning:'Deux vecteurs sont orthogonaux si leur produit scalaire est nul.',example:'(1,2)·(2,-1)=0'},
  ]
 },
 {
  topic: 'Arithmétique', title: 'Arithmétique', series: ['C','D','S'], tool: 'arithmetic',
  summary: 'Divisibilité, PGCD, algorithme d’Euclide, Bézout et congruences.',
  objectives: ['Calculer un PGCD', 'Utiliser Bézout', 'Résoudre une congruence simple'],
  method: ['Identifier la divisibilité demandée.', 'Appliquer Euclide ou les congruences.', 'Écrire chaque égalité.', 'Vérifier la conclusion.'],
  formulas: [
   {id:'bezout',title:'Identité de Bézout',expression:'au+bv=PGCD(a,b)',meaning:'Le PGCD est une combinaison entière de a et b.',example:'18=252(-8)+198(11)'},
   {id:'congruence',title:'Congruence',expression:'a≡b [n] ⇔ n divise (a-b)',meaning:'a et b ont le même reste modulo n.',example:'17≡2 [5]'},
  ]
 },
 {
  topic: 'Statistiques', title: 'Statistiques', series: ['A','C','D','S'],
  summary: 'Moyenne, médiane, variance, écart-type et lecture de données.',
  objectives: ['Calculer une moyenne', 'Trouver une médiane', 'Interpréter une dispersion'],
  method: ['Ordonner et compter les valeurs.', 'Choisir l’indicateur demandé.', 'Calculer avec les effectifs.', 'Interpréter dans le contexte.'],
  formulas: [
   {id:'mean',title:'Moyenne pondérée',expression:'m=(Σ n_i x_i)/(Σ n_i)',meaning:'Chaque valeur est pondérée par son effectif.',example:'2 élèves à 10 et 3 à 14 : m=12.4'},
   {id:'variance',title:'Variance',expression:'V=(Σ n_i(x_i-m)^2)/(Σ n_i)',meaning:'Mesure la dispersion autour de la moyenne.',example:'L’écart-type est sqrt(V).'},
  ]
 },
];

const CORE_LEARNING_QUESTIONS: LearningQuestion[] = [
 {id:'diag-an-1',topic:'Analyse',series:['A','C','D','S'],level:1,prompt:'Si f\'(x)>0 sur un intervalle, que fait f ?',choices:['Elle décroît','Elle croît','Elle est nulle','On ne peut rien dire'],correctIndex:1,explanation:'Une dérivée strictement positive implique que la fonction est croissante.'},
 {id:'diag-an-2',topic:'Analyse',series:['C','D','S'],level:2,prompt:'Quelle condition impose ln(x−2) ?',choices:['x≥2','x>2','x≠2','x<2'],correctIndex:1,explanation:'L’argument d’un logarithme doit être strictement positif : x−2>0.'},
 {id:'diag-al-1',topic:'Algèbre',series:['A','C','D','S'],level:1,prompt:'Quel est le discriminant de x²−5x+6 ?',choices:['1','−1','25','49'],correctIndex:0,explanation:'Δ=b²−4ac=25−24=1.'},
 {id:'diag-al-2',topic:'Algèbre',series:['A','C','D','S'],level:2,prompt:'Quelles sont les solutions de (x−2)(x+3)=0 ?',choices:['2 et 3','−2 et 3','2 et −3','−2 et −3'],correctIndex:2,explanation:'Un produit est nul si un facteur est nul : x=2 ou x=−3.'},
 {id:'diag-co-1',topic:'Complexes',series:['C','D','S'],level:1,prompt:'Combien vaut i² ?',choices:['1','−1','i','−i'],correctIndex:1,explanation:'Par définition, i²=−1.'},
 {id:'diag-co-2',topic:'Complexes',series:['C','D','S'],level:2,prompt:'Quel est le module de 3+4i ?',choices:['7','1','5','25'],correctIndex:2,explanation:'|3+4i|=sqrt(3²+4²)=5.'},
 {id:'diag-pr-1',topic:'Probabilités',series:['A','C','D','S'],level:1,prompt:'Une probabilité peut-elle valoir 1,2 ?',choices:['Oui','Non','Seulement en pourcentage','Seulement pour une union'],correctIndex:1,explanation:'Toute probabilité appartient à l’intervalle [0;1].'},
 {id:'diag-pr-2',topic:'Probabilités',series:['C','D','S'],level:2,prompt:'Pour une loi binomiale B(n,p), quelle est l’espérance ?',choices:['n+p','np','n/p','p/n'],correctIndex:1,explanation:'L’espérance d’une loi binomiale est E(X)=np.'},
 {id:'diag-su-1',topic:'Suites',series:['C','D','S'],level:1,prompt:'Une suite géométrique de raison q vérifie :',choices:['u_(n+1)=u_n+q','u_(n+1)=q u_n','u_n=nq','u_(n+1)=u_n/q²'],correctIndex:1,explanation:'On multiplie chaque terme par la raison q.'},
 {id:'diag-su-2',topic:'Suites',series:['C','D','S'],level:2,prompt:'Si une suite est croissante et majorée, elle est :',choices:['Divergente','Périodique','Convergente','Constante'],correctIndex:2,explanation:'Le théorème de convergence monotone donne la convergence.'},
 {id:'diag-ge-1',topic:'Géométrie',series:['A','C','D','S'],level:1,prompt:'Deux vecteurs de produit scalaire nul sont :',choices:['Colinéaires','Orthogonaux','Égaux','Opposés'],correctIndex:1,explanation:'Le produit scalaire nul caractérise l’orthogonalité.'},
 {id:'diag-ge-2',topic:'Géométrie',series:['C','D','S'],level:2,prompt:'Distance entre A(0,0) et B(3,4) ?',choices:['4','5','6','7'],correctIndex:1,explanation:'AB=sqrt(3²+4²)=5.'},
 {id:'diag-ar-1',topic:'Arithmétique',series:['C','D','S'],level:1,prompt:'Quel est le PGCD de 18 et 24 ?',choices:['2','3','6','12'],correctIndex:2,explanation:'Les diviseurs communs maximaux donnent PGCD(18,24)=6.'},
 {id:'diag-ar-2',topic:'Arithmétique',series:['C','D','S'],level:2,prompt:'17 modulo 5 vaut :',choices:['1','2','3','4'],correctIndex:1,explanation:'17=3×5+2, donc le reste est 2.'},
 {id:'diag-st-1',topic:'Statistiques',series:['A','C','D','S'],level:1,prompt:'Moyenne de 8, 10 et 12 ?',choices:['9','10','11','12'],correctIndex:1,explanation:'(8+10+12)/3=10.'},
 {id:'diag-st-2',topic:'Statistiques',series:['A','C','D','S'],level:2,prompt:'Médiane de 2, 5, 7, 9, 12 ?',choices:['5','7','9','8'],correctIndex:1,explanation:'La valeur centrale de cinq nombres ordonnés est la troisième : 7.'},
];

export const LEARNING_CHAPTERS:LearningChapter[]=CORE_LEARNING_CHAPTERS.map(chapter=>{
 const enrichment=CURRICULUM_ENRICHMENTS[chapter.topic];
 return {...chapter,definitions:enrichment.definitions,lessonSections:enrichment.lessonSections,pitfalls:enrichment.pitfalls,workedExamples:enrichment.workedExamples,formulas:[...chapter.formulas,...enrichment.formulas]};
});

export const LEARNING_QUESTIONS:LearningQuestion[]=[...CORE_LEARNING_QUESTIONS,...EXTRA_LEARNING_QUESTIONS];

export function diagnosticQuestions(series: BacSeries): LearningQuestion[] {
 const counts=new Map<BacTopic,number>();
 return LEARNING_QUESTIONS.filter(question=>{
  if(!question.series.includes(series))return false;
  const count=counts.get(question.topic)||0;if(count>=2)return false;
  counts.set(question.topic,count+1);return true;
 });
}

export function chapterByTopic(topic: BacTopic): LearningChapter | undefined {
 return LEARNING_CHAPTERS.find(chapter => chapter.topic === topic);
}

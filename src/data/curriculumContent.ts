import type { BacSeries, BacTopic } from './bacSubjects.js';

export interface CurriculumFormula { id:string; title:string; expression:string; meaning:string; example:string }
export interface LessonSection { title:string; explanation:string; keyPoints:string[] }
export interface WorkedExample { title:string; statement:string; steps:string[]; answer:string }
export interface CurriculumEnrichment {
 definitions:string[];
 lessonSections:LessonSection[];
 pitfalls:string[];
 workedExamples:WorkedExample[];
 formulas:CurriculumFormula[];
}

const ALL:BacSeries[]=['A','C','D'];
const SCI:BacSeries[]=['C','D'];

export const CURRICULUM_ENRICHMENTS:Record<BacTopic,CurriculumEnrichment>={
 Analyse:{
  definitions:['Une fonction associe à chaque nombre de son domaine une unique image.','La dérivée mesure le taux de variation local et donne la pente de la tangente.','Une limite décrit le comportement d’une fonction près d’un point ou à l’infini.'],
  lessonSections:[
   {title:'Domaine et continuité',explanation:'Avant tout calcul, on repère les valeurs autorisées. Les polynômes sont définis sur ℝ ; un dénominateur doit être non nul ; un logarithme reçoit un argument strictement positif ; une racine carrée reçoit un argument positif ou nul.',keyPoints:['Écrire le domaine avant les limites','Repérer les bornes et valeurs interdites','Étudier la continuité sur chaque intervalle du domaine']},
   {title:'Limites et asymptotes',explanation:'Une limite infinie en a signale souvent une asymptote verticale x=a. Si f(x)−(ax+b) tend vers 0 à l’infini, alors y=ax+b est une asymptote.',keyPoints:['Comparer les termes dominants','Traiter séparément les limites à gauche et à droite','Justifier la nature de chaque asymptote']},
   {title:'Dérivée et variations',explanation:'Le signe de f′ commande les variations : f′ positive implique une croissance, f′ négative une décroissance. Les zéros de f′ sont des points critiques à examiner.',keyPoints:['Simplifier ou factoriser f′','Construire son tableau de signes','Reporter les valeurs de f aux bornes et points critiques']},
   {title:'Primitives et intégrales',explanation:'Une primitive F de f vérifie F′=f. L’intégrale de a à b vaut F(b)−F(a) et représente une aire algébrique.',keyPoints:['Vérifier la primitive en dérivant','Utiliser Chasles pour découper un intervalle','Employer la valeur absolue pour une aire géométrique']},
  ],
  pitfalls:['Dériver avant d’avoir déterminé le domaine.','Confondre f′(x)=0 avec f(x)=0.','Oublier qu’une aire géométrique est positive.','Conclure à une asymptote sans calculer la différence.'],
  workedExamples:[
   {title:'Étudier un trinôme',statement:'Étudier les variations de f(x)=x²−4x+1.',steps:['Df=ℝ.','f′(x)=2x−4.','f′ est négative si x<2 et positive si x>2.','f(2)=−3.'],answer:'f décroît sur ]−∞,2] puis croît sur [2,+∞[ ; son minimum vaut −3.'},
   {title:'Intégrale simple',statement:'Calculer I=∫₀²(3x²+1)dx.',steps:['Une primitive est F(x)=x³+x.','I=F(2)−F(0).','I=8+2.'],answer:'I=10.'},
  ],
  formulas:[
   {id:'chain-rule',title:'Dérivée d’une composée',expression:"(f(g(x)))'=g'(x)f'(g(x))",meaning:'On dérive la fonction extérieure puis on multiplie par la dérivée intérieure.',example:"(exp(3x))'=3exp(3x)"},
   {id:'log-derivative',title:'Dérivée du logarithme',expression:"(ln(u))'=u'/u",meaning:'Valable lorsque u est strictement positif.',example:"(ln(x^2+1))'=2x/(x^2+1)"},
   {id:'integral-fundamental',title:'Calcul d’une intégrale',expression:'∫_a^b f(x)dx=F(b)-F(a)',meaning:'F désigne une primitive de f.',example:'∫_0^2 x dx=2'},
   {id:'integration-parts',title:'Intégration par parties',expression:"∫_a^b u'v=[uv]_a^b-∫_a^b uv'",meaning:'Utile pour un produit dont un facteur se simplifie en dérivant.',example:'∫_0^1 x exp(x)dx=1'},
  ]
 },
 Algèbre:{
  definitions:['Une équation demande les valeurs qui rendent une égalité vraie.','Factoriser consiste à écrire une somme sous forme de produit.','Deux systèmes sont équivalents lorsqu’ils ont exactement les mêmes solutions.'],
  lessonSections:[
   {title:'Calcul littéral',explanation:'Développer, réduire et factoriser permettent de choisir la forme la plus utile d’une expression.',keyPoints:['Respecter les priorités','Distribuer un signe moins à tous les termes','Contrôler une factorisation en redéveloppant']},
   {title:'Équations et inéquations',explanation:'Une transformation doit conserver l’ensemble des solutions. Pour un quotient, on commence par exclure les zéros du dénominateur.',keyPoints:['Écrire les valeurs interdites','Faire un tableau de signes pour un produit ou quotient','Vérifier les solutions dans l’énoncé initial']},
   {title:'Second degré',explanation:'Le discriminant fournit les racines et la forme canonique permet de lire le sommet et les variations.',keyPoints:['Identifier a, b et c avec leurs signes','Calculer Δ sans oublier les parenthèses','Utiliser le signe de a pour le signe du trinôme']},
   {title:'Systèmes linéaires',explanation:'Substitution et élimination conduisent à une équation à une inconnue. Le déterminant permet de savoir si la solution est unique.',keyPoints:['Aligner les inconnues','Choisir les multiplicateurs les plus simples','Contrôler le couple dans les deux équations']},
  ],
  pitfalls:['Diviser une équation par une expression susceptible d’être nulle.','Changer le sens d’une inégalité sans multiplier par un nombre négatif.','Oublier le terme 2ab dans (a+b)².','Lire b sans son signe dans ax²+bx+c.'],
  workedExamples:[
   {title:'Équation rationnelle',statement:'Résoudre (x+1)/(x−2)=2.',steps:['Valeur interdite : x≠2.','x+1=2(x−2).','x+1=2x−4, donc x=5.','5 est autorisé.'],answer:'S={5}.'},
   {title:'Système 2×2',statement:'Résoudre x+y=7 et x−y=1.',steps:['Ajouter les deux équations.','2x=8, donc x=4.','Puis y=7−4.'],answer:'(x,y)=(4,3).'},
  ],
  formulas:[
   {id:'canonical-form',title:'Forme canonique',expression:'ax^2+bx+c=a(x-α)^2+β',meaning:'Le sommet de la parabole est S(α,β), avec α=−b/(2a).',example:'x²−4x+1=(x−2)²−3'},
   {id:'vieta',title:'Somme et produit des racines',expression:'x_1+x_2=-b/a ; x_1x_2=c/a',meaning:'Relations de Viète lorsqu’un trinôme possède deux racines.',example:'x²−5x+6 : somme 5, produit 6'},
   {id:'linear-determinant',title:'Déterminant d’un système',expression:'D=ad-bc',meaning:'Si D≠0, le système ax+by=e, cx+dy=f possède une solution unique.',example:'2x+y=5, x−y=1 : D=−3'},
   {id:'binomial-newton',title:'Binôme de Newton',expression:'(a+b)^n=Σ C(n,k)a^(n-k)b^k',meaning:'Développement d’une puissance entière positive.',example:'(a+b)^3=a³+3a²b+3ab²+b³'},
  ]
 },
 Complexes:{
  definitions:['Un complexe s’écrit z=a+bi avec i²=−1.','Le module |z| est une distance ; un argument mesure un angle orienté.','Le conjugué de a+bi est a−bi.'],
  lessonSections:[
   {title:'Forme algébrique',explanation:'On calcule avec i²=−1 puis on regroupe partie réelle et partie imaginaire.',keyPoints:['Réduire toutes les puissances de i','Rationaliser un quotient avec le conjugué','Identifier Re(z) et Im(z)']},
   {title:'Module et argument',explanation:'La forme trigonométrique z=r(cosθ+i sinθ) sépare longueur et direction.',keyPoints:['Calculer r=|z|','Placer le point pour choisir le bon quadrant','Un argument est défini modulo 2π']},
   {title:'Équations dans ℂ',explanation:'Les méthodes algébriques restent valables, mais un discriminant négatif possède des racines complexes.',keyPoints:['Calculer Δ','Écrire sqrt(−a)=i sqrt(a)','Vérifier somme et produit des racines']},
   {title:'Géométrie complexe',explanation:'Les affixes traduisent vecteurs, distances, angles, rotations et similitudes.',keyPoints:['z_B−z_A représente le vecteur AB','Un quotient de différences donne rapport de longueurs et angle','Module 1 : rotation sans changement d’échelle']},
  ],
  pitfalls:['Écrire i²=1.','Donner un argument sans tenir compte du quadrant.','Oublier de conjuguer tout le dénominateur.','Confondre |z₁+z₂| et |z₁|+|z₂|.'],
  workedExamples:[
   {title:'Quotient complexe',statement:'Mettre (1+i)/(1−i) sous forme algébrique.',steps:['Multiplier par (1+i)/(1+i).','Le dénominateur vaut 1−i²=2.','Le numérateur vaut (1+i)²=2i.'],answer:'(1+i)/(1−i)=i.'},
   {title:'Équation quadratique',statement:'Résoudre z²−2z+5=0.',steps:['Δ=4−20=−16.','sqrt(Δ)=4i.','z=(2±4i)/2.'],answer:'z=1−2i ou z=1+2i.'},
  ],
  formulas:[
   {id:'complex-trig',title:'Forme trigonométrique',expression:'z=r(cos(θ)+i sin(θ))',meaning:'r=|z| et θ est un argument de z.',example:'1+i=sqrt(2)(cos(π/4)+i sin(π/4))'},
   {id:'complex-product',title:'Produit en forme polaire',expression:'|z_1z_2|=|z_1||z_2| ; arg(z_1z_2)=arg(z_1)+arg(z_2)',meaning:'Les modules se multiplient et les arguments s’ajoutent.',example:'arg(i(1+i))=3π/4'},
   {id:'moivre',title:'Formule de Moivre',expression:'(cos(θ)+i sin(θ))^n=cos(nθ)+i sin(nθ)',meaning:'Permet de calculer rapidement les puissances.',example:'i^4=1'},
   {id:'euler-complex',title:'Formule d’Euler',expression:'exp(iθ)=cos(θ)+i sin(θ)',meaning:'Écriture exponentielle compacte des complexes non nuls.',example:'exp(iπ)=−1'},
  ]
 },
 Probabilités:{
  definitions:['Une probabilité appartient toujours à [0,1].','Une variable aléatoire associe un nombre à chaque issue.','Des événements A et B sont indépendants lorsque P(A∩B)=P(A)P(B).'],
  lessonSections:[
   {title:'Univers et événements',explanation:'On nomme les événements avant de calculer et on utilise complémentaire, union et intersection.',keyPoints:['Identifier l’univers','Traduire « au moins » par un complémentaire si utile','Éviter de compter deux fois une intersection']},
   {title:'Conditionnement et arbres',explanation:'Un arbre pondéré organise les probabilités conditionnelles. On multiplie le long d’une branche et on additionne les branches compatibles.',keyPoints:['La somme des branches issues d’un nœud vaut 1','Une branche correspond à une intersection','Utiliser la formule des probabilités totales']},
   {title:'Loi binomiale',explanation:'La loi B(n,p) modélise le nombre de succès dans n épreuves de Bernoulli indépendantes de même probabilité p.',keyPoints:['Vérifier indépendance et répétition identique','Repérer n, p et k','Contrôler avec E(X)=np']},
   {title:'Espérance et dispersion',explanation:'L’espérance est une moyenne théorique ; variance et écart-type mesurent la dispersion.',keyPoints:['Multiplier chaque valeur par sa probabilité','La variance est positive','L’écart-type possède la même unité que X']},
  ],
  pitfalls:['Additionner P(A) et P(B) sans retirer P(A∩B).','Confondre P(A|B) et P(B|A).','Utiliser une loi binomiale sans indépendance.','Obtenir une probabilité négative ou supérieure à 1 sans la remettre en question.'],
  workedExamples:[
   {title:'Complémentaire',statement:'Une pièce équilibrée est lancée 4 fois. Probabilité d’au moins une face ?',steps:['Utiliser l’événement contraire : aucune face.','P(aucune face)=(1/2)^4=1/16.','Soustraire à 1.'],answer:'P(au moins une face)=15/16.'},
   {title:'Probabilité totale',statement:'P(A)=0,4, P(B|A)=0,7 et P(B|non A)=0,2. Calculer P(B).',steps:['P(B)=P(A)P(B|A)+P(non A)P(B|non A).','P(B)=0,4×0,7+0,6×0,2.'],answer:'P(B)=0,40.'},
  ],
  formulas:[
   {id:'complement',title:'Événement contraire',expression:'P(contraire(A))=1-P(A)',meaning:'Très utile pour « au moins un ».',example:'P(au moins un succès)=1−P(aucun succès)'},
   {id:'total-probability',title:'Probabilités totales',expression:'P(B)=Σ P(A_i)P(B|A_i)',meaning:'Les Aᵢ forment une partition de l’univers.',example:'Arbre à deux premières branches A et contraire(A)'},
   {id:'bayes',title:'Formule de Bayes',expression:'P(A|B)=P(A)P(B|A)/P(B)',meaning:'Inverse le sens d’un conditionnement.',example:'Retrouver la probabilité d’une cause connaissant le résultat'},
   {id:'expectation-variance',title:'Espérance et variance',expression:'E(X)=Σx_ip_i ; V(X)=E(X^2)-E(X)^2',meaning:'Indicateurs centraux d’une variable aléatoire.',example:'Pour B(n,p), E=np et V=np(1−p)'},
  ]
 },
 Suites:{
  definitions:['Une suite est une fonction définie sur les entiers naturels.','Une suite croissante et majorée converge.','Une relation de récurrence permet de calculer chaque terme à partir des précédents.'],
  lessonSections:[
   {title:'Définition explicite ou récurrente',explanation:'Une formule explicite donne uₙ directement ; une récurrence nécessite un terme initial et une relation.',keyPoints:['Identifier le premier indice','Calculer quelques termes sans arrondir trop tôt','Ne pas confondre n et uₙ']},
   {title:'Suites arithmétiques et géométriques',explanation:'Une différence constante caractérise une suite arithmétique ; un quotient constant caractérise une suite géométrique.',keyPoints:['Trouver la raison','Écrire le terme général avec le bon indice initial','Utiliser les formules de somme']},
   {title:'Monotonie et bornes',explanation:'On étudie souvent uₙ₊₁−uₙ, ou uₙ₊₁/uₙ lorsque les termes sont positifs.',keyPoints:['Justifier le signe pour tout n','Distinguer majorée et croissante','Une observation numérique n’est pas une preuve']},
   {title:'Convergence',explanation:'Pour une récurrence uₙ₊₁=f(uₙ), une éventuelle limite ℓ satisfait ℓ=f(ℓ), mais il faut d’abord justifier la convergence.',keyPoints:['Prouver monotonie et borne','Résoudre l’équation du point fixe','Choisir la solution compatible avec les bornes']},
  ],
  pitfalls:['Confondre limite candidate et preuve de convergence.','Oublier le nombre de termes dans une somme.','Écrire uₙ=u₀qⁿ pour une suite arithmétique.','Diviser par uₙ sans savoir qu’il est non nul.'],
  workedExamples:[
   {title:'Suite géométrique',statement:'u₀=3 et uₙ₊₁=2uₙ. Calculer u₄.',steps:['La raison est q=2.','uₙ=3×2ⁿ.','u₄=3×16.'],answer:'u₄=48.'},
   {title:'Point fixe affine',statement:'uₙ₊₁=0,5uₙ+3 et la suite converge. Trouver sa limite.',steps:['Poser ℓ=0,5ℓ+3.','0,5ℓ=3.'],answer:'ℓ=6.'},
  ],
  formulas:[
   {id:'arith-sum',title:'Somme arithmétique',expression:'S=n(premier+dernier)/2',meaning:'n est le nombre de termes additionnés.',example:'1+2+...+10=55'},
   {id:'geo-sum',title:'Somme géométrique',expression:'1+q+...+q^n=(1-q^(n+1))/(1-q)',meaning:'Valable pour q≠1.',example:'1+2+4+8=15'},
   {id:'affine-recurrence',title:'Récurrence affine',expression:'u_(n+1)=au_n+b ; v_n=u_n-b/(1-a)',meaning:'Si a≠1, le décalage par le point fixe produit une suite géométrique.',example:'uₙ₊₁=0,5uₙ+3 : point fixe 6'},
   {id:'monotone-theorem',title:'Convergence monotone',expression:'croissante+majorée ⇒ convergente',meaning:'Théorème fondamental pour justifier une limite.',example:'0≤uₙ≤1 et uₙ croissante'},
  ]
 },
 Géométrie:{
  definitions:['Un vecteur décrit une direction, un sens et une longueur.','Le produit scalaire permet d’étudier angles et orthogonalité.','Une équation cartésienne décrit l’ensemble des points d’une droite ou d’un plan.'],
  lessonSections:[
   {title:'Coordonnées et vecteurs',explanation:'On soustrait les coordonnées pour construire un vecteur. Colinéarité et égalité de vecteurs traduisent de nombreuses propriétés.',keyPoints:['AB=(xB−xA,yB−yA)','Déterminant nul pour la colinéarité dans le plan','Toujours conclure par la propriété géométrique']},
   {title:'Produit scalaire',explanation:'Dans un repère orthonormé, u·v=xx′+yy′. Un produit scalaire nul caractérise l’orthogonalité de vecteurs non nuls.',keyPoints:['Vérifier que le repère est orthonormé','Relier norme et distance','Utiliser cos(θ)=u·v/(|u||v|)']},
   {title:'Droites et cercles',explanation:'Une droite peut être cartésienne ou paramétrique. Un cercle est défini par son centre et son rayon.',keyPoints:['Un vecteur normal (a,b) correspond à ax+by+c=0','Tester les coordonnées d’un point','Développer une équation de cercle seulement si nécessaire']},
   {title:'Géométrie dans l’espace',explanation:'Droites, plans et vecteurs se traitent par coordonnées, produits scalaires et systèmes.',keyPoints:['Deux vecteurs non colinéaires dirigent un plan','Un vecteur normal est orthogonal aux directions du plan','Résoudre le système pour une intersection']},
  ],
  pitfalls:['Utiliser les coordonnées d’un point comme celles d’un vecteur sans soustraction.','Conclure « parallèles » avec des vecteurs non colinéaires.','Employer la distance plane dans l’espace en oubliant z.','Oublier de vérifier qu’un point appartient à la figure.'],
  workedExamples:[
   {title:'Droite cartésienne',statement:'Trouver une équation de la droite passant par A(1,2) et de vecteur normal n=(2,−1).',steps:['Écrire 2(x−1)−(y−2)=0.','Développer.'],answer:'2x−y=0.'},
   {title:'Orthogonalité',statement:'u=(1,2) et v=(2,−1). Sont-ils orthogonaux ?',steps:['u·v=1×2+2×(−1).','u·v=0.'],answer:'Oui, u et v sont orthogonaux.'},
  ],
  formulas:[
   {id:'midpoint',title:'Milieu d’un segment',expression:'M((x_A+x_B)/2,(y_A+y_B)/2)',meaning:'Les coordonnées du milieu sont les moyennes des coordonnées.',example:'A(0,2), B(4,6) : M(2,4)'},
   {id:'det-collinear',title:'Déterminant dans le plan',expression:'det(u,v)=x_u y_v-y_u x_v',meaning:'Deux vecteurs sont colinéaires si et seulement si ce déterminant est nul.',example:'det((1,2),(2,4))=0'},
   {id:'line-cartesian',title:'Droite cartésienne',expression:'ax+by+c=0',meaning:'Le vecteur (a,b) est normal à la droite.',example:'2x−y=0 a pour normal (2,−1)'},
   {id:'circle-equation',title:'Équation d’un cercle',expression:'(x-a)^2+(y-b)^2=r^2',meaning:'Cercle de centre (a,b) et de rayon r.',example:'Centre (1,−2), rayon 3 : (x−1)²+(y+2)²=9'},
  ]
 },
 Arithmétique:{
  definitions:['a divise b lorsqu’il existe un entier k tel que b=ak.','Le PGCD est le plus grand diviseur commun positif.','a≡b modulo n signifie que n divise a−b.'],
  lessonSections:[
   {title:'Divisibilité',explanation:'Les règles de divisibilité et la décomposition en facteurs premiers permettent de comparer les entiers.',keyPoints:['Préciser que les quotients sont entiers','Utiliser les valuations dans la décomposition','Relier PGCD et PPCM']},
   {title:'Algorithme d’Euclide',explanation:'Les divisions successives conservent le PGCD. Le dernier reste non nul est le PGCD.',keyPoints:['Écrire chaque division euclidienne','Arrêter au reste nul','Remonter les égalités pour Bézout']},
   {title:'Bézout et Gauss',explanation:'Bézout caractérise les entiers premiers entre eux ; Gauss permet de conclure à une divisibilité.',keyPoints:['PGCD(a,b)=1 équivaut à au+bv=1','Vérifier les hypothèses avant Gauss','Distinguer existence et calcul des coefficients']},
   {title:'Congruences',explanation:'On peut additionner et multiplier des congruences de même module. Elles simplifient les restes et les puissances.',keyPoints:['Toujours écrire le module','Réduire les nombres avant le calcul','Chercher une périodicité pour les grandes puissances']},
  ],
  pitfalls:['Confondre diviseur et multiple.','Déduire a|b et a|c de a|(b+c) sans autre information.','Appliquer Gauss sans coprimalité.','Changer de module au milieu d’un calcul.'],
  workedExamples:[
   {title:'Euclide',statement:'Calculer PGCD(252,198).',steps:['252=198+54.','198=3×54+36.','54=36+18.','36=2×18.'],answer:'PGCD(252,198)=18.'},
   {title:'Grande puissance modulo 5',statement:'Trouver le reste de 2²⁰ dans la division par 5.',steps:['2⁴=16≡1 [5].','2²⁰=(2⁴)⁵≡1⁵ [5].'],answer:'Le reste vaut 1.'},
  ],
  formulas:[
   {id:'euclid',title:'Algorithme d’Euclide',expression:'PGCD(a,b)=PGCD(b,a mod b)',meaning:'Répéter jusqu’à obtenir un reste nul.',example:'PGCD(252,198)=18'},
   {id:'gcd-lcm',title:'Lien PGCD–PPCM',expression:'PGCD(a,b)PPCM(a,b)=|ab|',meaning:'Valable pour deux entiers non nuls.',example:'PGCD(12,18)=6 et PPCM=36'},
   {id:'gauss',title:'Lemme de Gauss',expression:'a|bc et PGCD(a,b)=1 ⇒ a|c',meaning:'La coprimalité est indispensable.',example:'5|2c implique 5|c'},
   {id:'congruence-operations',title:'Opérations sur les congruences',expression:'a≡b[n], c≡d[n] ⇒ a+c≡b+d[n] et ac≡bd[n]',meaning:'Permet de réduire les calculs modulo n.',example:'17²≡2²≡4 [5]'},
  ]
 },
 Statistiques:{
  definitions:['La moyenne résume le centre d’une série mais est sensible aux valeurs extrêmes.','La médiane partage une série ordonnée en deux groupes de même effectif.','L’écart-type mesure la dispersion dans la même unité que les données.'],
  lessonSections:[
   {title:'Organisation des données',explanation:'On distingue valeurs, effectifs, fréquences et effectifs cumulés. Une représentation doit respecter la nature des données.',keyPoints:['La somme des effectifs vaut N','La somme des fréquences vaut 1 ou 100 %','Ordonner les données pour médiane et quartiles']},
   {title:'Indicateurs de position',explanation:'Moyenne, médiane et quartiles répondent à des questions différentes sur le centre et la répartition.',keyPoints:['Pondérer la moyenne par les effectifs','Repérer la position médiane','Interpréter les quartiles dans le contexte']},
   {title:'Dispersion',explanation:'Étendue, écart interquartile, variance et écart-type quantifient l’hétérogénéité.',keyPoints:['La variance ne peut pas être négative','L’écart-type est la racine de la variance','Comparer des dispersions dans une même unité']},
   {title:'Ajustement affine',explanation:'Un nuage de points permet d’étudier une liaison. Une droite d’ajustement sert à interpoler avec prudence.',keyPoints:['Identifier variable explicative et variable expliquée','Une corrélation ne prouve pas une causalité','Éviter les extrapolations trop éloignées']},
  ],
  pitfalls:['Calculer une moyenne simple lorsque les effectifs diffèrent.','Chercher la médiane sans ordonner les valeurs.','Confondre variance et écart-type.','Présenter un pourcentage sans préciser l’effectif de référence.'],
  workedExamples:[
   {title:'Moyenne pondérée',statement:'Deux élèves ont 10 et trois élèves ont 14. Calculer la moyenne.',steps:['Somme pondérée : 2×10+3×14=62.','Effectif total : 5.','62/5=12,4.'],answer:'La moyenne vaut 12,4.'},
   {title:'Médiane',statement:'Trouver la médiane de 4, 9, 2, 7, 12.',steps:['Ordonner : 2,4,7,9,12.','La valeur centrale est la troisième.'],answer:'La médiane vaut 7.'},
  ],
  formulas:[
   {id:'variance-shortcut',title:'Variance par formule réduite',expression:'V=(Σn_i x_i^2)/N-m^2',meaning:'Souvent plus rapide que la somme des écarts au carré.',example:'Calculer d’abord la moyenne des carrés'},
   {id:'standard-deviation',title:'Écart-type',expression:'σ=sqrt(V)',meaning:'Mesure la dispersion dans l’unité d’origine.',example:'V=9 ⇒ σ=3'},
   {id:'interquartile',title:'Écart interquartile',expression:'I=Q_3-Q_1',meaning:'Mesure la dispersion de la moitié centrale des données.',example:'Q₁=8, Q₃=14 : I=6'},
   {id:'affine-transform-stats',title:'Transformation affine',expression:'m(aX+b)=am(X)+b ; σ(aX+b)=|a|σ(X)',meaning:'Effet d’un changement d’échelle sur moyenne et écart-type.',example:'Passer de °C à une échelle affine'},
  ]
 }
};

export interface ExtraLearningQuestion { id:string; topic:BacTopic; series:BacSeries[]; level:1|2|3; prompt:string; choices:string[]; correctIndex:number; explanation:string }
const q=(id:string,topic:BacTopic,series:BacSeries[],level:1|2|3,prompt:string,choices:string[],correctIndex:number,explanation:string):ExtraLearningQuestion=>({id,topic,series,level,prompt,choices,correctIndex,explanation});

export const EXTRA_LEARNING_QUESTIONS:ExtraLearningQuestion[]=[
 q('q-an-03','Analyse',ALL,1,'Quel est le domaine de 1/(x−3) ?', ['ℝ','ℝ sans 0','ℝ sans 3','[3,+∞['],2,'Le dénominateur doit être non nul : x≠3.'),
 q('q-an-04','Analyse',ALL,2,'Une primitive de 2x+1 est :',['x²+x','2','x²','2x²+x'],0,'La dérivée de x²+x est 2x+1.'),
 q('q-an-05','Analyse',SCI,2,'Si f(x)−(2x−1) tend vers 0 à +∞, quelle est l’asymptote ?', ['x=2','y=−1','y=2x−1','Aucune'],2,'La différence avec 2x−1 tend vers zéro.'),
 q('q-an-06','Analyse',SCI,3,'Combien vaut ∫₀¹ 3x² dx ?', ['1','2','3','1/3'],0,'Une primitive est x³, donc 1³−0³=1.'),
 q('q-an-07','Analyse',ALL,2,'La tangente à f en x=a a pour pente :',['f(a)','f′(a)','a','f′(0)'],1,'Le nombre dérivé f′(a) est la pente de la tangente.'),
 q('q-al-03','Algèbre',ALL,1,'Factoriser x²−16 :',['(x−4)²','(x−4)(x+4)','x(x−16)','(x−8)(x+2)'],1,'C’est une différence de deux carrés.'),
 q('q-al-04','Algèbre',ALL,2,'Si Δ=0 pour un trinôme, il possède :',['Aucune racine réelle','Une racine double','Deux racines distinctes','Trois racines'],1,'Une racine double vaut −b/(2a).'),
 q('q-al-05','Algèbre',ALL,2,'Résoudre 3x−5=7 :',['x=2/3','x=4','x=12','x=−4'],1,'3x=12 donc x=4.'),
 q('q-al-06','Algèbre',SCI,3,'Le sommet de y=x²−6x+5 a pour abscisse :',['−3','3','5','6'],1,'α=−b/(2a)=6/2=3.'),
 q('q-al-07','Algèbre',ALL,2,'Quand on multiplie une inégalité par −2, il faut :',['Garder le sens','Inverser le sens','Ajouter 2','Mettre au carré'],1,'La multiplication par un nombre négatif inverse le sens.'),
 q('q-co-03','Complexes',SCI,1,'Le conjugué de 2−3i est :',['−2+3i','2+3i','−2−3i','3+2i'],1,'On change uniquement le signe de la partie imaginaire.'),
 q('q-co-04','Complexes',SCI,2,'Le produit z×conj(z) vaut :',['z²','2Re(z)','|z|²','1'],2,'C’est l’identité fondamentale du conjugué.'),
 q('q-co-05','Complexes',SCI,2,'Un argument de i est :',['0','π/4','π/2','π'],2,'Le point i est sur l’axe imaginaire positif.'),
 q('q-co-06','Complexes',SCI,3,'Le module de (1+i)(2−i) est :',['sqrt(2)','sqrt(5)','sqrt(10)','3'],2,'Les modules se multiplient : √2×√5=√10.'),
 q('q-co-07','Complexes',SCI,2,'Les solutions de z²+1=0 sont :',['−1 et 1','−i et i','0 et 1','i seulement'],1,'z²=−1 donne z=±i.'),
 q('q-pr-03','Probabilités',ALL,1,'Si P(A)=0,35, combien vaut P(contraire de A) ?', ['0,35','0,65','1,35','−0,35'],1,'1−0,35=0,65.'),
 q('q-pr-04','Probabilités',ALL,2,'Dans un arbre, la probabilité d’un chemin se calcule en :',['Additionnant ses branches','Multipliant ses branches','Soustrayant ses branches','Prenant la moyenne'],1,'Un chemin représente une intersection : on multiplie.'),
 q('q-pr-05','Probabilités',SCI,2,'Si X suit B(10;0,2), E(X) vaut :',['2','5','8','0,2'],0,'E(X)=np=10×0,2=2.'),
 q('q-pr-06','Probabilités',SCI,3,'Si A et B sont indépendants, P(A∩B)= :',['P(A)+P(B)','P(A)P(B)','P(A)/P(B)','0'],1,'C’est la définition de l’indépendance.'),
 q('q-pr-07','Probabilités',ALL,2,'« Au moins un succès » se calcule souvent par :',['P(aucun succès)','1−P(aucun succès)','P(un succès exactement)','np'],1,'Le contraire de « au moins un » est « aucun ».'),
 q('q-su-03','Suites',SCI,1,'Si u₀=5 et uₙ₊₁=uₙ+3, u₂ vaut :',['8','10','11','15'],2,'u₁=8 puis u₂=11.'),
 q('q-su-04','Suites',SCI,2,'Une suite arithmétique de raison r vérifie :',['uₙ₊₁=ruₙ','uₙ₊₁=uₙ+r','uₙ=nr','uₙ₊₁=uₙ/r'],1,'On ajoute la raison à chaque étape.'),
 q('q-su-05','Suites',SCI,2,'Une suite décroissante et minorée est :',['Toujours divergente','Convergente','Toujours constante','Périodique'],1,'C’est le théorème de convergence monotone.'),
 q('q-su-06','Suites',SCI,3,'Somme 1+2+4+8 :',['8','12','15','16'],2,'Somme géométrique : 15.'),
 q('q-su-07','Suites',SCI,2,'Pour étudier la croissance de uₙ, on peut étudier :',['uₙ+1','uₙ₊₁−uₙ','uₙ² seulement','n−uₙ'],1,'Le signe de la différence donne le sens de variation.'),
 q('q-ge-03','Géométrie',ALL,1,'Le milieu de A(0,2) et B(4,6) est :',['(4,8)','(2,4)','(1,3)','(2,8)'],1,'On fait la moyenne coordonnée par coordonnée.'),
 q('q-ge-04','Géométrie',ALL,2,'Un vecteur normal à ax+by+c=0 est :',['(−b,a)','(a,b)','(c,0)','(b,a)'],1,'Les coefficients de x et y forment un vecteur normal.'),
 q('q-ge-05','Géométrie',SCI,2,'Si det(u,v)=0, alors u et v sont :',['Orthogonaux','Colinéaires','Unitaires','Opposés obligatoirement'],1,'Le déterminant nul caractérise la colinéarité.'),
 q('q-ge-06','Géométrie',ALL,2,'L’équation du cercle de centre O et rayon 3 est :',['x+y=3','x²+y²=3','x²+y²=9','(x−3)²+y²=1'],2,'Le carré du rayon vaut 9.'),
 q('q-ge-07','Géométrie',SCI,3,'La distance entre (1,2,3) et (1,2,7) vaut :',['2','3','4','10'],2,'Seule la coordonnée z change : distance 4.'),
 q('q-ar-03','Arithmétique',SCI,1,'Le reste de 23 modulo 5 est :',['2','3','4','5'],1,'23=4×5+3.'),
 q('q-ar-04','Arithmétique',SCI,2,'Deux entiers sont premiers entre eux si leur PGCD vaut :',['0','1','2','Leur produit'],1,'C’est la définition.'),
 q('q-ar-05','Arithmétique',SCI,2,'Si a≡2 [5], alors a²≡ :',['2 [5]','4 [5]','0 [5]','1 [5]'],1,'On peut multiplier les congruences : 2²=4.'),
 q('q-ar-06','Arithmétique',SCI,3,'PPCM(12,18) vaut :',['6','24','30','36'],3,'12=2²×3 et 18=2×3², donc PPCM=2²×3²=36.'),
 q('q-ar-07','Arithmétique',SCI,2,'Dans Euclide, le PGCD est :',['Le premier quotient','Le dernier reste non nul','Le dernier quotient','La somme des restes'],1,'Les divisions s’arrêtent lorsque le reste devient nul.'),
 q('q-st-03','Statistiques',ALL,1,'La somme des fréquences vaut :',['0','1','L’effectif maximal','La moyenne'],1,'Elle vaut 1, soit 100 %.'),
 q('q-st-04','Statistiques',ALL,2,'L’écart-type est :',['La variance au carré','La racine de la variance','La moyenne divisée par 2','Toujours égal à l’étendue'],1,'σ=√V.'),
 q('q-st-05','Statistiques',ALL,2,'La médiane de 1,3,8,10 est :',['3','5,5','8','22'],1,'Pour quatre valeurs, moyenne des deux centrales : (3+8)/2=5,5.'),
 q('q-st-06','Statistiques',ALL,2,'Quel indicateur est le plus sensible aux valeurs extrêmes ?', ['Médiane','Premier quartile','Moyenne','Écart interquartile'],2,'Une valeur extrême modifie fortement la moyenne.'),
 q('q-st-07','Statistiques',SCI,3,'Si V=16, l’écart-type vaut :',['4','8','16','256'],0,'σ=√16=4.'),
];

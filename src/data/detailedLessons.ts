import type { BacTopic } from './bacSubjects.js';

export interface DetailedLessonExample {
 statement:string;
 steps:string[];
 answer:string;
}

export interface DetailedLessonBlock {
 title:string;
 explanation:string;
 method:string[];
 example:DetailedLessonExample;
 bacTip:string;
}

export const DETAILED_LESSONS:Record<BacTopic,DetailedLessonBlock[]>={
 Analyse:[
  {
   title:'1. Domaine de définition et lecture de l’énoncé',
   explanation:'Avant toute limite, dérivée ou représentation graphique, il faut déterminer où la fonction existe. Un polynôme est défini sur ℝ ; un quotient impose un dénominateur non nul ; ln(u) impose u>0 ; sqrt(u) impose u≥0. Cette étape évite de calculer sur des valeurs interdites et permet d’écrire correctement les intervalles d’étude.',
   method:['Repérer les dénominateurs, logarithmes et racines.','Écrire chaque condition séparément.','Faire l’intersection de toutes les conditions.','Recopier le domaine avant les calculs suivants.'],
   example:{statement:'Déterminer le domaine de f(x)=ln(x−1)/(x−3).',steps:['ln(x−1) impose x−1>0, donc x>1.','Le dénominateur impose x−3≠0, donc x≠3.','On combine : x>1 et x≠3.'],answer:'Df=]1,3[ ∪ ]3,+∞[.'},
   bacTip:'Au BAC, écrire le domaine dès le début peut rapporter des points et évite les erreurs de limites ou de dérivation.'
  },
  {
   title:'2. Limites et asymptotes',
   explanation:'Une limite décrit le comportement de f(x) près d’une valeur ou lorsque x tend vers ±∞. Une limite infinie en x=a suggère une asymptote verticale x=a. Une limite finie L à l’infini donne une asymptote horizontale y=L. Pour une asymptote oblique y=ax+b, on vérifie que f(x)−(ax+b) tend vers 0.',
   method:['Identifier la forme de la fonction.','Comparer les termes dominants ou factoriser si nécessaire.','Calculer séparément les limites à gauche et à droite quand le domaine est coupé.','Conclure explicitement sur l’asymptote.'],
   example:{statement:'Étudier la limite de f(x)=(2x+1)/(x−3) quand x→+∞.',steps:['Diviser numérateur et dénominateur par x.','f(x)=(2+1/x)/(1−3/x).','Quand x→+∞, 1/x→0, donc f(x)→2.'],answer:'lim f(x)=2 et y=2 est une asymptote horizontale en +∞.'},
   bacTip:'Ne donne pas seulement la limite : si elle correspond à une asymptote demandée, écris son équation.'
  },
  {
   title:'3. Dérivée, signe et variations',
   explanation:'La dérivée mesure la variation locale de la fonction. Sur un intervalle, f′>0 implique que f croît, f′<0 implique qu’elle décroît et f′=0 repère les points critiques. Une étude de variations complète associe domaine, dérivée, signe de la dérivée, valeurs importantes et conclusion.',
   method:['Calculer f′ avec la règle adaptée.','Factoriser f′ autant que possible.','Résoudre f′(x)=0 et étudier son signe.','Reporter les valeurs de f dans un tableau de variations.'],
   example:{statement:'Étudier les variations de f(x)=x²−4x+3.',steps:["f′(x)=2x−4=2(x−2).","f′<0 pour x<2, f′=0 pour x=2, f′>0 pour x>2.","f(2)=4−8+3=−1."],answer:'f décroît sur ]−∞,2] puis croît sur [2,+∞[ ; son minimum vaut −1.'},
   bacTip:'Dans la conclusion, indique toujours les intervalles et la valeur de l’extremum, pas seulement le signe de f′.'
  },
  {
   title:'4. Primitives et intégrales',
   explanation:'Une primitive F de f vérifie F′=f. L’intégrale de a à b est F(b)−F(a). Pour une aire géométrique, il faut tenir compte du signe de f : une intégrale peut être négative alors qu’une aire est toujours positive. En OSE et dans les séries scientifiques, l’intégration par parties ou un changement de variable simple peut aussi intervenir.',
   method:['Reconnaître une primitive usuelle ou une forme composée.','Vérifier rapidement la primitive en la dérivant.','Calculer F(b)−F(a) sans arrondir trop tôt.','Pour une aire, découper l’intervalle si f change de signe.'],
   example:{statement:'Calculer I=∫₀²(3x²+1)dx.',steps:['Une primitive est F(x)=x³+x.','I=F(2)−F(0).','I=(8+2)−0=10.'],answer:'I=10.'},
   bacTip:'Écris la primitive avant de remplacer les bornes : la copie devient beaucoup plus lisible et vérifiable.'
  },
  {
   title:'5. Tangentes, convexité et rédaction d’une étude complète',
   explanation:'La tangente en x=a a pour équation y=f(a)+f′(a)(x−a). La dérivée seconde f″ permet d’étudier la convexité quand elle est au programme : f″>0 correspond à une fonction convexe et f″<0 à une fonction concave. Une étude complète doit rester ordonnée : domaine, limites, dérivée, variations, asymptotes, points remarquables puis graphique.',
   method:['Calculer f(a) et f′(a).','Écrire l’équation de la tangente puis simplifier.','Si demandé, calculer f″ et étudier son signe.','Relier tous les résultats dans une conclusion graphique cohérente.'],
   example:{statement:'Trouver la tangente à f(x)=x² en x=1.',steps:['f(1)=1.','f′(x)=2x donc f′(1)=2.','y=1+2(x−1)=2x−1.'],answer:'La tangente est y=2x−1.'},
   bacTip:'Une tangente doit être donnée sous forme d’équation finale ; ne t’arrête pas à f′(a).'
  }
 ],
 Algèbre:[
  {
   title:'1. Calcul littéral et transformations autorisées',
   explanation:'Une transformation algébrique n’est utile que si elle conserve le même problème. Développer sert à réduire et comparer des expressions ; factoriser sert à résoudre un produit nul, étudier un signe ou simplifier. Lorsqu’une expression contient un dénominateur, les valeurs interdites doivent être notées avant toute simplification.',
   method:['Repérer les priorités et les parenthèses.','Développer ou factoriser selon l’objectif.','Réduire les termes de même nature.','Contrôler en redéveloppant ou en substituant une valeur simple.'],
   example:{statement:'Factoriser x²−9.',steps:['Reconnaître une différence de deux carrés : a²−b².','Ici a=x et b=3.','Appliquer a²−b²=(a−b)(a+b).'],answer:'x²−9=(x−3)(x+3).'},
   bacTip:'Choisis la forme adaptée à la question : développée pour comparer, factorisée pour résoudre ou étudier un signe.'
  },
  {
   title:'2. Équations du premier et du second degré',
   explanation:'Une équation du premier degré se résout en isolant x. Pour ax²+bx+c=0 avec a≠0, le discriminant Δ=b²−4ac indique le nombre de solutions réelles. Si Δ>0 il y a deux racines, si Δ=0 une racine double, si Δ<0 aucune racine réelle.',
   method:['Mettre tous les termes dans un même membre.','Identifier a, b et c avec leurs signes.','Calculer Δ puis les racines adaptées.','Vérifier les solutions dans l’équation initiale.'],
   example:{statement:'Résoudre x²−5x+6=0.',steps:['a=1, b=−5, c=6.','Δ=25−24=1.','x₁=(5−1)/2=2 et x₂=(5+1)/2=3.'],answer:'S={2;3}.'},
   bacTip:'Écris les coefficients avec leurs signes : beaucoup d’erreurs de discriminant viennent d’un b mal recopié.'
  },
  {
   title:'3. Inéquations et tableaux de signes',
   explanation:'Pour une inéquation produit ou quotient, il faut chercher les zéros de chaque facteur puis construire un tableau de signes. Un dénominateur nul est toujours exclu. Multiplier une inégalité par un nombre négatif inverse son sens ; multiplier par une expression dont le signe est inconnu sans étude préalable est dangereux.',
   method:['Ramener l’inéquation à une comparaison avec 0.','Factoriser le numérateur et le dénominateur.','Placer zéros et valeurs interdites dans l’ordre.','Lire les intervalles correspondant au signe demandé.'],
   example:{statement:'Résoudre (x−2)(x+1)≤0.',steps:['Les zéros sont −1 et 2.','Le coefficient dominant du produit est positif : signe + à l’extérieur et − entre les racines.','On garde les points où le produit est nul car l’inégalité contient ≤.'],answer:'S=[−1;2].'},
   bacTip:'Dans un quotient, une valeur qui annule le dénominateur ne doit jamais être incluse, même avec ≤ ou ≥.'
  },
  {
   title:'4. Systèmes linéaires et méthode de Cramer',
   explanation:'Un système combine plusieurs équations qui doivent être vraies simultanément. L’élimination de Gauss est générale. Pour un système carré 2×2 ou 3×3 avec déterminant principal non nul, la méthode de Cramer donne chaque inconnue par un quotient de déterminants. Cette méthode est particulièrement importante en série L.',
   method:['Écrire les coefficients dans le même ordre.','Calculer le déterminant principal Δ.','Si Δ≠0, calculer les déterminants obtenus en remplaçant chaque colonne.','Donner les inconnues puis vérifier par substitution.'],
   example:{statement:'Résoudre x+y=5 et 2x−y=1.',steps:['Δ=1×(−1)−1×2=−3≠0.','Δx=5×(−1)−1×1=−6, donc x=2.','Δy=1×1−5×2=−9, donc y=3.'],answer:'(x,y)=(2,3).'},
   bacTip:'Pour Cramer, annonce d’abord Δ≠0 : cela justifie l’existence d’une solution unique et l’utilisation de la formule.'
  },
  {
   title:'5. Mise en équation d’un problème',
   explanation:'Un problème de BAC demande souvent de transformer un texte en équation ou système. La difficulté n’est pas le calcul mais le choix des inconnues et la traduction correcte des relations. Chaque inconnue doit avoir une signification et une unité.',
   method:['Définir clairement l’inconnue ou les inconnues.','Traduire chaque phrase utile en relation mathématique.','Résoudre le modèle obtenu.','Revenir au contexte et éliminer les solutions impossibles.'],
   example:{statement:'Deux nombres ont pour somme 20 et leur différence vaut 4.',steps:['Poser x le plus grand et y le plus petit.','Écrire x+y=20 et x−y=4.','Ajouter : 2x=24 donc x=12 puis y=8.'],answer:'Les deux nombres sont 12 et 8.'},
   bacTip:'Une réponse sans phrase de conclusion peut être mathématiquement correcte mais moins claire ; termine dans le langage de l’énoncé.'
  }
 ],
 Complexes:[
  {
   title:'1. Forme algébrique et opérations',
   explanation:'Un nombre complexe s’écrit z=a+bi avec i²=−1. Les additions et produits se calculent comme en algèbre ordinaire en remplaçant i² par −1. Pour un quotient, on multiplie souvent numérateur et dénominateur par le conjugué du dénominateur.',
   method:['Développer normalement.','Remplacer chaque i² par −1.','Regrouper partie réelle et partie imaginaire.','Pour un quotient, utiliser le conjugué si nécessaire.'],
   example:{statement:'Mettre (1+i)/(1−i) sous forme algébrique.',steps:['Multiplier par (1+i)/(1+i).','Numérateur : (1+i)²=1+2i−1=2i.','Dénominateur : (1−i)(1+i)=1−i²=2.'],answer:'(1+i)/(1−i)=i.'},
   bacTip:'La forme algébrique finale doit être a+bi, pas une fraction complexe encore non simplifiée.'
  },
  {
   title:'2. Module, argument et forme trigonométrique',
   explanation:'Le module |z|=sqrt(a²+b²) représente une distance. Un argument θ indique la direction du point d’affixe z. La forme trigonométrique z=r(cosθ+i sinθ) est particulièrement utile pour les produits, quotients, puissances et racines.',
   method:['Calculer r=|z|.','Repérer le quadrant du point (a,b).','Déterminer un argument θ.','Écrire z=r(cosθ+i sinθ).'],
   example:{statement:'Écrire z=1+i sous forme trigonométrique.',steps:['|z|=sqrt(1²+1²)=sqrt(2).','Le point (1,1) est dans le premier quadrant.','Un argument est π/4.'],answer:'z=sqrt(2)(cos(π/4)+i sin(π/4)).'},
   bacTip:'Le signe de la partie réelle et imaginaire est indispensable pour choisir le bon quadrant de l’argument.'
  },
  {
   title:'3. Équations dans ℂ',
   explanation:'Les équations polynomiales se traitent comme dans ℝ, mais un discriminant négatif n’arrête plus le calcul. On utilise sqrt(−a)=i sqrt(a) pour a>0. La somme et le produit des racines permettent ensuite un contrôle rapide.',
   method:['Mettre l’équation sous forme standard.','Calculer le discriminant.','Extraire la racine complexe du discriminant si nécessaire.','Calculer puis vérifier les racines.'],
   example:{statement:'Résoudre z²−2z+5=0.',steps:['Δ=(−2)²−4×1×5=−16.','sqrt(Δ)=4i.','z=(2±4i)/2=1±2i.'],answer:'z=1−2i ou z=1+2i.'},
   bacTip:'Dans ℂ, Δ<0 signifie des solutions complexes, pas « aucune solution ».'
  },
  {
   title:'4. Puissances, Moivre et racines n-ièmes',
   explanation:'La formule de Moivre transforme les puissances en multiplication d’arguments : [cosθ+i sinθ]^n=cos(nθ)+i sin(nθ). Pour les racines n-ièmes, le module devient r^(1/n) et on divise les arguments θ+2kπ par n.',
   method:['Mettre le complexe sous forme polaire.','Pour une puissance, élever le module et multiplier l’argument.','Pour une racine, prendre la racine n-ième du module.','Lister k=0,…,n−1 pour obtenir toutes les racines distinctes.'],
   example:{statement:'Trouver les racines cubiques de 1.',steps:['1 a pour module 1 et arguments 2kπ.','Les arguments des racines sont 2kπ/3.','Pour k=0,1,2 : 0, 2π/3, 4π/3.'],answer:'Les racines sont 1, cos(2π/3)+i sin(2π/3), cos(4π/3)+i sin(4π/3).'},
   bacTip:'Pour une racine n-ième, il faut donner exactement n racines distinctes.'
  },
  {
   title:'5. Géométrie complexe',
   explanation:'Une différence zB−zA représente le vecteur AB. Son module donne AB. Le quotient (zC−zA)/(zB−zA) permet de comparer longueurs et angles ; un quotient réel traduit un alignement et un quotient imaginaire pur peut caractériser une orthogonalité selon la configuration.',
   method:['Traduire chaque vecteur par une différence d’affixes.','Former le quotient demandé.','Étudier son module et son argument.','Revenir à la propriété géométrique recherchée.'],
   example:{statement:'A a pour affixe 0, B a pour affixe 1 et C a pour affixe i. Montrer que AB⊥AC.',steps:['zB−zA=1.','zC−zA=i.','(zC−zA)/(zB−zA)=i a pour argument π/2.'],answer:'L’angle (AB,AC) vaut π/2 : les droites sont perpendiculaires.'},
   bacTip:'Ne termine pas par un quotient complexe : explique ce que son module ou son argument signifie géométriquement.'
  }
 ],
 Probabilités:[
  {
   title:'1. Univers, événements et opérations',
   explanation:'Une probabilité est toujours comprise entre 0 et 1. Les opérations sur les événements correspondent au langage courant : A∩B signifie « A et B », A∪B signifie « A ou B », et le complémentaire signifie « non A ». La formule P(A∪B)=P(A)+P(B)−P(A∩B) évite de compter l’intersection deux fois.',
   method:['Nommer clairement les événements.','Traduire les mots de l’énoncé par union, intersection ou complémentaire.','Choisir la formule adaptée.','Vérifier que le résultat appartient à [0,1].'],
   example:{statement:'P(A)=0,6, P(B)=0,5 et P(A∩B)=0,3. Calculer P(A∪B).',steps:['Utiliser P(A∪B)=P(A)+P(B)−P(A∩B).','Remplacer : 0,6+0,5−0,3.','Calculer : 0,8.'],answer:'P(A∪B)=0,8.'},
   bacTip:'Écris les événements avant les calculs : cela rend les arbres et conditionnements beaucoup plus faciles à suivre.'
  },
  {
   title:'2. Probabilités conditionnelles et arbres',
   explanation:'P(B|A) mesure la probabilité de B lorsque A est déjà réalisé. Dans un arbre, on multiplie les probabilités le long d’un chemin et on additionne les chemins menant au même événement. Les probabilités issues d’un même nœud doivent avoir pour somme 1.',
   method:['Construire ou lire l’arbre dans l’ordre chronologique.','Multiplier le long d’une branche complète.','Additionner les branches compatibles.','Utiliser Bayes si on inverse le conditionnement.'],
   example:{statement:'P(A)=0,4, P(B|A)=0,7, P(B|non A)=0,2. Calculer P(B).',steps:['P(non A)=0,6.','P(B)=0,4×0,7+0,6×0,2.','P(B)=0,28+0,12=0,40.'],answer:'P(B)=0,40.'},
   bacTip:'Sur un arbre, une branche complète représente une intersection : ses probabilités se multiplient.'
  },
  {
   title:'3. Dénombrement et loi binomiale',
   explanation:'Le dénombrement sert à compter les issues sans les lister. Une combinaison C(n,k) s’utilise quand l’ordre ne compte pas. La loi binomiale B(n,p) modélise le nombre de succès dans n répétitions indépendantes de la même épreuve de Bernoulli.',
   method:['Vérifier si l’ordre compte.','Pour une binomiale, identifier n, p et k.','Écrire P(X=k)=C(n,k)p^k(1−p)^(n−k).','Contrôler avec E(X)=np si utile.'],
   example:{statement:'X suit B(5;0,4). Calculer P(X=2).',steps:['C(5,2)=10.','P=10×0,4²×0,6³.','P=10×0,16×0,216=0,3456.'],answer:'P(X=2)=0,3456.'},
   bacTip:'N’utilise pas une loi binomiale si les essais ne sont pas indépendants ou si la probabilité de succès change.'
  },
  {
   title:'4. Variables aléatoires, espérance et variance',
   explanation:'Une variable aléatoire associe une valeur numérique à chaque issue. Sa loi donne les valeurs xi et leurs probabilités pi. L’espérance E(X)=Σxi pi représente une moyenne théorique ; la variance V(X)=E(X²)−E(X)² mesure la dispersion et l’écart-type vaut sqrt(V).',
   method:['Vérifier que la somme des probabilités vaut 1.','Calculer E(X).','Calculer E(X²), puis la variance.','Interpréter l’espérance dans le contexte.'],
   example:{statement:'X vaut 0 avec probabilité 0,4 et 2 avec probabilité 0,6.',steps:['E(X)=0×0,4+2×0,6=1,2.','E(X²)=0+4×0,6=2,4.','V(X)=2,4−1,2²=0,96.'],answer:'E(X)=1,2 et V(X)=0,96.'},
   bacTip:'Une variance négative signale forcément une erreur de calcul.'
  },
  {
   title:'5. Lois continues de Terminale S',
   explanation:'Pour une loi continue, on calcule des probabilités par des aires sous une densité. Pour U([a,b]), la densité vaut 1/(b−a) sur [a,b]. Pour une loi exponentielle de paramètre λ, F(x)=1−e^(−λx) pour x≥0. Pour la loi normale, on centre et réduit ou on utilise directement la fonction de répartition.',
   method:['Identifier la loi et ses paramètres.','Vérifier les bornes et le domaine.','Utiliser la fonction de répartition ou la longueur relative pour l’uniforme.','Donner une probabilité entre 0 et 1 et interpréter.'],
   example:{statement:'X suit U([0,10]). Calculer P(2≤X≤6).',steps:['La longueur totale est 10−0=10.','La longueur favorable est 6−2=4.','P=4/10=0,4.'],answer:'P(2≤X≤6)=0,4.'},
   bacTip:'Avec une loi continue, P(X=a)=0 : bornes ouvertes ou fermées donnent la même probabilité sur un intervalle.'
  }
 ],
 Suites:[
  {
   title:'1. Définition explicite et récurrence',
   explanation:'Une suite explicite donne directement u_n en fonction de n. Une suite définie par récurrence donne un terme initial puis une relation permettant de construire le suivant. Il faut toujours repérer l’indice de départ : u₀ et u₁ ne conduisent pas aux mêmes formules.',
   method:['Identifier l’indice initial.','Repérer si la suite est explicite ou récurrente.','Calculer quelques termes exactement.','Ne conclure une propriété générale qu’après une preuve.'],
   example:{statement:'u₀=2 et u_(n+1)=u_n+3. Calculer u₃.',steps:['u₁=2+3=5.','u₂=5+3=8.','u₃=8+3=11.'],answer:'u₃=11.'},
   bacTip:'Écrire quelques termes aide à comprendre la suite, mais ce n’est pas une preuve de monotonie ou de convergence.'
  },
  {
   title:'2. Suites arithmétiques',
   explanation:'Une suite est arithmétique si u_(n+1)−u_n=r est constant. Alors u_n=u_p+(n−p)r. La somme de termes consécutifs vaut nombre de termes × (premier+dernier)/2.',
   method:['Calculer une différence entre deux termes consécutifs.','Identifier la raison r.','Écrire le terme général avec le bon indice initial.','Pour une somme, compter précisément le nombre de termes.'],
   example:{statement:'u₀=4, r=3. Calculer u₁₀ puis S=u₀+...+u₁₀.',steps:['u₁₀=4+10×3=34.','Il y a 11 termes de u₀ à u₁₀.','S=11(4+34)/2=209.'],answer:'u₁₀=34 et S=209.'},
   bacTip:'De u₀ à u_n, il y a n+1 termes.'
  },
  {
   title:'3. Suites géométriques',
   explanation:'Une suite est géométrique si u_(n+1)/u_n=q est constant lorsque le quotient est défini. Alors u_n=u_p q^(n−p). Pour q≠1, la somme 1+q+...+q^n vaut (1−q^(n+1))/(1−q).',
   method:['Identifier le quotient constant q.','Écrire le terme général.','Substituer l’indice demandé.','Utiliser la formule de somme si nécessaire.'],
   example:{statement:'u₀=3 et q=2. Calculer u₅ et u₀+...+u₅.',steps:['u₅=3×2⁵=96.','1+2+...+2⁵=(1−2⁶)/(1−2)=63.','La somme vaut 3×63=189.'],answer:'u₅=96 et la somme vaut 189.'},
   bacTip:'Une suite géométrique ne se traite pas avec la formule u_n=u₀+nr.'
  },
  {
   title:'4. Monotonie, bornes et convergence',
   explanation:'Pour étudier le sens de variation, on examine souvent u_(n+1)−u_n ou le quotient u_(n+1)/u_n si les termes sont positifs. Une suite croissante et majorée converge ; une suite décroissante et minorée converge. Trouver une limite candidate ne suffit pas : la convergence doit être justifiée.',
   method:['Choisir différence ou quotient selon la forme.','Déterminer son signe pour tout n du domaine.','Chercher une borne adaptée.','Appliquer un théorème de convergence avant de calculer la limite.'],
   example:{statement:'u_(n+1)=0,5u_n+3, u₀=0. Déterminer la limite.',steps:['Le point fixe vérifie L=0,5L+3, donc L=6.','u_n−6=(0,5)^n(u₀−6).','Comme (0,5)^n→0, u_n→6.'],answer:'La suite converge vers 6.'},
   bacTip:'Écrire « si la suite converge alors L=... » ne prouve pas qu’elle converge.'
  },
  {
   title:'5. Récurrence et démonstrations',
   explanation:'Une démonstration par récurrence comporte trois parties obligatoires : initialisation, hérédité et conclusion. On suppose la propriété vraie au rang n puis on prouve qu’elle est vraie au rang n+1. La conclusion doit préciser pour quels entiers la propriété est établie.',
   method:['Énoncer clairement P(n).','Vérifier P(n₀).','Supposer P(n) vraie et démontrer P(n+1).','Conclure par le principe de récurrence.'],
   example:{statement:'Montrer que 1+2+...+n=n(n+1)/2 pour n≥1.',steps:['Pour n=1 : 1=1×2/2.','Supposer S_n=n(n+1)/2. Alors S_(n+1)=n(n+1)/2+(n+1).','S_(n+1)=(n+1)(n+2)/2.'],answer:'La formule est vraie pour tout entier n≥1.'},
   bacTip:'L’hypothèse de récurrence doit être utilisée explicitement dans le passage de n à n+1.'
  }
 ],
 Géométrie:[
  {
   title:'1. Vecteurs et coordonnées',
   explanation:'Le vecteur AB se calcule en soustrayant les coordonnées de A à celles de B. Deux vecteurs sont égaux s’ils ont les mêmes coordonnées. Dans le plan, la colinéarité se vérifie par proportionnalité ou par un déterminant nul.',
   method:['Écrire les coordonnées des points.','Calculer les vecteurs par différence.','Choisir déterminant ou proportionnalité.','Traduire le résultat en propriété géométrique.'],
   example:{statement:'A(1,2), B(3,6), C(2,4). Montrer que AB et AC sont colinéaires.',steps:['AB=(2,4).','AC=(1,2).','AB=2AC.'],answer:'AB et AC sont colinéaires, donc A, B et C sont alignés.'},
   bacTip:'Ne confonds pas les coordonnées d’un point avec celles d’un vecteur : un vecteur vient d’une soustraction.'
  },
  {
   title:'2. Produit scalaire et orthogonalité',
   explanation:'Dans un repère orthonormé, u·v=xu xv+yu yv dans le plan, avec un terme supplémentaire en z dans l’espace. Si deux vecteurs non nuls ont un produit scalaire nul, ils sont orthogonaux. Le produit scalaire permet aussi de calculer un angle.',
   method:['Calculer les vecteurs nécessaires.','Effectuer le produit scalaire.','Comparer à 0 pour l’orthogonalité.','Pour un angle, utiliser cosθ=(u·v)/(|u||v|).'],
   example:{statement:'u=(1,2) et v=(2,−1). Sont-ils orthogonaux ?',steps:['u·v=1×2+2×(−1).','u·v=2−2=0.','Les deux vecteurs sont non nuls.'],answer:'u et v sont orthogonaux.'},
   bacTip:'Écris la conclusion géométrique après le calcul du produit scalaire.'
  },
  {
   title:'3. Droites, plans et équations cartésiennes',
   explanation:'Dans le plan, ax+by+c=0 possède pour vecteur normal (a,b). Dans l’espace, ax+by+cz+d=0 possède pour vecteur normal (a,b,c). Une équation doit être vérifiée par les coordonnées d’un point annoncé appartenant à la droite ou au plan.',
   method:['Trouver un vecteur normal ou directeur.','Utiliser un point connu.','Écrire l’équation sous forme point-normal.','Développer puis vérifier avec un point.'],
   example:{statement:'Donner une équation de la droite passant par A(1,2) et de normal n=(2,−1).',steps:['Écrire 2(x−1)−1(y−2)=0.','Développer : 2x−2−y+2=0.','Réduire : 2x−y=0.'],answer:'Une équation est 2x−y=0.'},
   bacTip:'Teste le point donné dans l’équation finale : c’est un contrôle rapide.'
  },
  {
   title:'4. Distances, cercles et sphères',
   explanation:'La distance entre deux points vient du théorème de Pythagore. Un cercle de centre (a,b) et de rayon r a pour équation (x−a)²+(y−b)²=r². Dans l’espace, on ajoute le terme (z−c)² pour une sphère.',
   method:['Identifier centre et rayon ou les deux points.','Écrire la formule de distance.','Simplifier seulement à la fin.','Pour une équation, vérifier que le centre donne une distance nulle au centre et r à la figure.'],
   example:{statement:'A(0,0), B(3,4). Calculer AB.',steps:['AB=sqrt((3−0)²+(4−0)²).','AB=sqrt(9+16).','AB=sqrt(25)=5.'],answer:'AB=5.'},
   bacTip:'Dans l’espace, n’oublie pas la coordonnée z dans la formule de distance.'
  },
  {
   title:'5. Géométrie dans l’espace',
   explanation:'Pour étudier une droite et un plan, on compare leurs vecteurs directeurs et le vecteur normal du plan. Une intersection se trouve en remplaçant les coordonnées paramétriques de la droite dans l’équation du plan. Deux plans parallèles ont des vecteurs normaux colinéaires.',
   method:['Écrire les données vectorielles.','Tester parallélisme ou orthogonalité avec produit scalaire/colinéarité.','Pour une intersection, substituer les paramètres.','Résoudre puis vérifier le point obtenu.'],
   example:{statement:'La droite D : (x,y,z)=(1,0,2)+t(1,1,1). Trouver son intersection avec le plan x+y+z=6.',steps:['Substituer : (1+t)+t+(2+t)=6.','3+3t=6 donc t=1.','Le point est (2,1,3).'],answer:'D coupe le plan en I(2,1,3).'},
   bacTip:'Après avoir trouvé le paramètre, vérifie toujours le point dans l’équation du plan.'
  }
 ],
 Arithmétique:[
  {
   title:'1. Divisibilité, nombres premiers et décomposition',
   explanation:'Dire que a divise b signifie qu’il existe un entier k tel que b=ak. La décomposition en facteurs premiers permet de calculer PGCD et PPCM et de raisonner sur les puissances de facteurs. Une preuve de divisibilité doit montrer explicitement qu’un quotient est entier.',
   method:['Décomposer si cela simplifie le problème.','Comparer les exposants des facteurs premiers.','Utiliser les règles de divisibilité.','Conclure avec une phrase de divisibilité précise.'],
   example:{statement:'Calculer PGCD(72,120) par décomposition.',steps:['72=2³×3².','120=2³×3×5.','Prendre les exposants minimaux communs : 2³×3=24.'],answer:'PGCD(72,120)=24.'},
   bacTip:'Pour le PPCM, on prend les exposants maximaux ; pour le PGCD, les minimaux communs.'
  },
  {
   title:'2. Algorithme d’Euclide et Bézout',
   explanation:'L’algorithme d’Euclide utilise des divisions successives : PGCD(a,b)=PGCD(b,r). Le dernier reste non nul est le PGCD. En remontant les divisions, on obtient une identité de Bézout au+bv=PGCD(a,b).',
   method:['Effectuer les divisions euclidiennes successives.','Repérer le dernier reste non nul.','Remonter les égalités si Bézout est demandé.','Vérifier la combinaison obtenue.'],
   example:{statement:'Calculer PGCD(252,198).',steps:['252=1×198+54.','198=3×54+36.','54=1×36+18 puis 36=2×18.'],answer:'PGCD(252,198)=18.'},
   bacTip:'Conserve les divisions écrites : elles servent directement si la question suivante demande Bézout.'
  },
  {
   title:'3. Théorème de Gauss et équations diophantiennes',
   explanation:'Le lemme de Gauss dit : si a divise bc et si PGCD(a,b)=1, alors a divise c. Pour ax+by=c, des solutions entières existent si et seulement si PGCD(a,b) divise c. Une solution particulière puis la solution générale donnent toutes les solutions.',
   method:['Calculer d=PGCD(a,b).','Vérifier que d divise c.','Trouver une identité de Bézout puis une solution particulière.','Écrire la famille générale des solutions entières.'],
   example:{statement:'Résoudre 6x+9y=3 dans ℤ.',steps:['PGCD(6,9)=3 et 3 divise 3.','Une solution est x=−1, y=1 car −6+9=3.','Les solutions sont x=−1+3k, y=1−2k.'],answer:'(x,y)=(−1+3k,1−2k), k∈ℤ.'},
   bacTip:'Si le PGCD ne divise pas le second membre, il n’existe aucune solution entière.'
  },
  {
   title:'4. Congruences',
   explanation:'a≡b [n] signifie que n divise a−b. On peut additionner et multiplier des congruences de même module. Pour les grandes puissances, on cherche souvent un cycle. Une congruence linéaire ax≡b [n] est soluble lorsque PGCD(a,n) divise b.',
   method:['Réduire chaque nombre modulo n.','Chercher un cycle pour les puissances.','Pour ax≡b, calculer PGCD(a,n).','Simplifier ou utiliser un inverse modulo n si possible.'],
   example:{statement:'Résoudre 3x≡1 [7].',steps:['PGCD(3,7)=1 : 3 est inversible modulo 7.','5×3=15≡1 [7], donc 5 est l’inverse de 3.','Multiplier par 5 : x≡5 [7].'],answer:'x≡5 [7].'},
   bacTip:'Écris toujours le module dans les lignes importantes ; changer de module sans justification invalide le raisonnement.'
  },
  {
   title:'5. Puissances, restes et bases de numération',
   explanation:'Pour une grande puissance, les congruences évitent des calculs impossibles. On repère une puissance simple équivalente à 1, −1 ou une petite valeur modulo n. En Terminale S, les écritures dans différentes bases peuvent aussi être reliées à la division euclidienne.',
   method:['Réduire la base modulo n.','Calculer quelques puissances pour repérer une période.','Décomposer l’exposant suivant cette période.','Réduire le résultat final modulo n.'],
   example:{statement:'Trouver le reste de 2²⁰ modulo 5.',steps:['2⁴=16≡1 [5].','2²⁰=(2⁴)⁵.','Donc 2²⁰≡1⁵≡1 [5].'],answer:'Le reste est 1.'},
   bacTip:'Cherche une période courte avant de développer une grande puissance.'
  }
 ],
 Statistiques:[
  {
   title:'1. Organisation des données et fréquences',
   explanation:'Une série statistique peut être donnée par valeurs individuelles ou par couples valeur-effectif. L’effectif total N est la somme des effectifs et la fréquence d’une valeur vaut effectif/N. Les fréquences doivent totaliser 1, ou 100 %.',
   method:['Calculer l’effectif total.','Calculer les fréquences si nécessaire.','Ordonner les valeurs pour les indicateurs de position.','Contrôler que les fréquences totalisent 1.'],
   example:{statement:'Les valeurs 10, 12, 15 ont pour effectifs 2, 3, 5.',steps:['N=2+3+5=10.','Fréquence de 15 : 5/10=0,5.','Les autres fréquences valent 0,2 et 0,3.'],answer:'La fréquence de 15 est 50 %.'},
   bacTip:'Ne confonds pas effectif et fréquence : l’un est un nombre d’individus, l’autre une proportion.'
  },
  {
   title:'2. Moyenne, médiane et quartiles',
   explanation:'La moyenne tient compte de toutes les valeurs mais est sensible aux valeurs extrêmes. La médiane partage les données ordonnées en deux groupes de même effectif. Les quartiles repèrent environ 25 % et 75 % des observations selon la convention du programme.',
   method:['Ordonner les données.','Pour la moyenne, pondérer par les effectifs.','Repérer la position de la médiane.','Déterminer les quartiles avec la convention utilisée en cours.'],
   example:{statement:'Calculer la moyenne de 10,10,14,14,14.',steps:['Somme=10+10+14+14+14=62.','Effectif N=5.','m=62/5=12,4.'],answer:'La moyenne vaut 12,4.'},
   bacTip:'Pour une série avec effectifs, une moyenne non pondérée est généralement fausse.'
  },
  {
   title:'3. Variance et écart-type',
   explanation:'La variance mesure la moyenne des carrés des écarts à la moyenne. La formule réduite V=E(X²)−m² est souvent plus rapide. L’écart-type σ=sqrt(V) s’exprime dans la même unité que les données et facilite l’interprétation de la dispersion.',
   method:['Calculer la moyenne m.','Calculer la moyenne des carrés.','Faire V=E(X²)−m².','Calculer σ=sqrt(V) et interpréter.'],
   example:{statement:'Pour 1, 3 et 5, calculer V.',steps:['m=(1+3+5)/3=3.','E(X²)=(1+9+25)/3=35/3.','V=35/3−9=8/3.'],answer:'V=8/3 et σ=sqrt(8/3).'},
   bacTip:'La variance ne peut jamais être négative ; si elle l’est, vérifie tes calculs.'
  },
  {
   title:'4. Ajustement affine par Mayer — séries A et L',
   explanation:'La méthode de Mayer partage les points, classés selon x, en deux groupes. On calcule les points moyens G₁ et G₂, puis on prend la droite passant par ces deux points comme droite d’ajustement. Elle est simple à calculer mais différente de la régression par moindres carrés.',
   method:['Classer les points selon x.','Partager en deux groupes aussi équilibrés que possible.','Calculer G₁ et G₂.','Déterminer l’équation de la droite (G₁G₂).'],
   example:{statement:'Points (1,3),(2,5),(3,7),(4,9). Trouver la droite de Mayer.',steps:['G₁=((1+2)/2,(3+5)/2)=(1,5;4).','G₂=(3,5;8).','Pente a=(8−4)/(3,5−1,5)=2 puis b=1.'],answer:'La droite de Mayer est y=2x+1.'},
   bacTip:'En série A/L, ne remplace pas automatiquement Mayer par les moindres carrés si l’énoncé demande explicitement Mayer.'
  },
  {
   title:'5. Régression linéaire et corrélation — séries D et OSE',
   explanation:'La méthode des moindres carrés choisit la droite qui minimise la somme des carrés des écarts verticaux. Le coefficient de corrélation linéaire r mesure la force de la liaison linéaire, sans prouver une causalité. Une interpolation proche des données est plus fiable qu’une extrapolation lointaine.',
   method:['Calculer x̄ et ȳ.','Calculer covariance et variance de x.','En déduire la pente a puis b=ȳ−ax̄.','Calculer r et interpréter sa valeur avec prudence.'],
   example:{statement:'Pour (1,3),(2,5),(3,7),(4,9), déterminer la droite de régression.',steps:['Les points sont exactement alignés.','À chaque augmentation de 1 de x, y augmente de 2 : a=2.','Avec (1,3), b=3−2=1.'],answer:'La droite est y=2x+1 et la corrélation est parfaite positive.'},
   bacTip:'Une forte corrélation ne signifie pas que x cause y.'
  }
 ],
 Finance:[
  {
   title:'1. Intérêt simple',
   explanation:'À intérêt simple, les intérêts sont toujours calculés sur le capital initial. La formule est I=C×i×t, avec C le capital, i le taux en écriture décimale et t la durée exprimée dans l’unité du taux. La valeur acquise est A=C+I.',
   method:['Transformer le taux en nombre décimal.','Mettre la durée dans l’unité correspondant au taux.','Calculer I=C×i×t.','Calculer A=C+I si demandé.'],
   example:{statement:'500 000 Ar sont placés à 8 % par an pendant 9 mois.',steps:['i=0,08 et t=9/12=0,75 an.','I=500000×0,08×0,75=30000.','A=500000+30000=530000.'],answer:'Intérêt : 30 000 Ar ; valeur acquise : 530 000 Ar.'},
   bacTip:'La principale erreur est d’utiliser t=9 avec un taux annuel : convertis les mois en années.'
  },
  {
   title:'2. Escompte commercial',
   explanation:'L’escompte commercial représente la retenue effectuée lorsqu’un effet est payé avant son échéance. Si N est la valeur nominale, d le taux d’escompte et t la durée, alors D=N×d×t. La valeur actuelle commerciale est VA=N−D.',
   method:['Repérer la valeur nominale N.','Convertir le taux d en décimal et la durée.','Calculer D=Ndt.','Calculer VA=N−D.'],
   example:{statement:'Un effet de 800 000 Ar est escompté à 9 % pendant 60 jours sur une base de 360 jours.',steps:['t=60/360=1/6.','D=800000×0,09×1/6=12000.','VA=800000−12000=788000.'],answer:'Escompte : 12 000 Ar ; valeur actuelle : 788 000 Ar.'},
   bacTip:'Respecte la convention de jours indiquée dans l’énoncé : 360 ou 365 ne donnent pas le même résultat.'
  },
  {
   title:'3. Intérêts composés et capitalisation',
   explanation:'À intérêts composés, les intérêts d’une période sont ajoutés au capital et produisent à leur tour des intérêts. La valeur acquise après n périodes est A=C(1+i)^n. Cette croissance est géométrique, pas linéaire.',
   method:['Identifier C, i et n.','Calculer le facteur (1+i)^n.','Multiplier par C.','Garder les décimales jusqu’au résultat final.'],
   example:{statement:'1 000 000 Ar à 10 % pendant 2 ans.',steps:['C=1000000, i=0,10, n=2.','A=1000000×(1,10)².','A=1000000×1,21=1210000.'],answer:'Valeur acquise : 1 210 000 Ar.'},
   bacTip:'Ne remplace pas (1+i)^n par 1+ni : cette dernière expression correspond à l’intérêt simple.'
  },
  {
   title:'4. Actualisation et équivalence de capitaux',
   explanation:'Actualiser consiste à rechercher aujourd’hui le capital équivalent à une somme future. Si VF est la valeur future, alors VA=VF/(1+i)^n. Deux capitaux à des dates différentes ne se comparent correctement qu’après les avoir ramenés à une même date.',
   method:['Choisir la date de comparaison.','Compter le nombre de périodes.','Utiliser capitalisation ou actualisation selon le sens du temps.','Comparer les valeurs à la même date.'],
   example:{statement:'Quelle somme aujourd’hui donnera 1 210 000 Ar dans 2 ans à 10 % ?',steps:['VF=1210000, i=0,10, n=2.','VA=1210000/(1,10)².','VA=1210000/1,21=1000000.'],answer:'Il faut placer 1 000 000 Ar aujourd’hui.'},
   bacTip:'Dessine une petite ligne du temps si plusieurs dates apparaissent dans l’énoncé.'
  },
  {
   title:'5. Annuités constantes',
   explanation:'Une annuité est un versement répété à intervalles réguliers. Pour des versements constants R de fin de période, la valeur actuelle est VA=R[1−(1+i)^(-n)]/i et la valeur acquise est VF=R[(1+i)^n−1]/i. Ces formules proviennent de sommes géométriques.',
   method:['Vérifier si les versements sont en fin ou début de période.','Identifier R, i et n.','Choisir valeur actuelle ou future.','Calculer le facteur puis multiplier par R.'],
   example:{statement:'On verse 100 000 Ar à la fin de chaque année pendant 3 ans au taux de 10 %. Calculer la valeur acquise juste après le 3e versement.',steps:['R=100000, i=0,10, n=3.','VF=100000[(1,10)³−1]/0,10.','(1,10)³=1,331 donc VF=331000.'],answer:'Valeur acquise : 331 000 Ar.'},
   bacTip:'Le moment du versement change la formule : vérifie toujours « début » ou « fin » de période.'
  }
 ]
};

export function detailedLessonFor(topic:BacTopic):DetailedLessonBlock[]{
 return DETAILED_LESSONS[topic]||[];
}

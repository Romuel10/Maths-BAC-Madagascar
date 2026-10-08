import type {Operation,Series} from '../engine/types';
export interface Lesson {id:string;title:string;intro:string;series:Series[];minutes:number;tool:Operation;example:string;parts:{title:string;text:string;formula:string}[];worked:{title:string;text:string;formula:string}[];trap:string;}
const all:Series[]=['A','C','D','L','OSE','S'],science:Series[]=['C','D','S'];
export const lessons:Lesson[]=[
 {id:'equations',title:'Équations & second degré',intro:'Passer de l’énoncé à une équation, puis justifier chaque transformation.',series:all,minutes:12,tool:'equation',example:'x^2-5*x+6=0',parts:[
 {title:'Conserver les solutions',text:'Ajouter le même terme aux deux membres conserve l’égalité. Pour diviser par une expression, il faut prouver qu’elle ne s’annule pas. Élever au carré peut ajouter des solutions : vérifier à la fin.',formula:'A=B\\ \\Longleftrightarrow\\ A-C=B-C'},
 {title:'Reconnaître le second degré',text:'Ramener l’équation à zéro et identifier a, b et c. Si a = 0, il ne s’agit plus d’une équation du second degré.',formula:'ax^2+bx+c=0,\\quad a\\ne0'},
 {title:'Utiliser le discriminant',text:'Si Δ > 0, il y a deux racines ; si Δ = 0, une racine double ; si Δ < 0, aucune racine réelle.',formula:'\\Delta=b^2-4ac,\\qquad x_{1,2}=\\frac{-b\\pm\\sqrt\\Delta}{2a}'}],worked:[
 {title:'Identifier',text:'Dans x² − 5x + 6 = 0, a = 1, b = −5 et c = 6.',formula:'\\Delta=(-5)^2-4\\times1\\times6=1'},
 {title:'Calculer les racines',text:'Le discriminant est positif.',formula:'x_1=\\frac{5-1}{2}=2,\\qquad x_2=\\frac{5+1}{2}=3'},
 {title:'Vérifier',text:'La factorisation permet de vérifier les deux valeurs.',formula:'x^2-5x+6=(x-2)(x-3),\\qquad S=\\{2;3\\}'}],trap:'Ne pas diviser une équation par x sans traiter le cas x = 0.'},
 {id:'signs',title:'Inéquations & signes',intro:'Lire les signes, exclure les valeurs interdites et écrire des intervalles.',series:all,minutes:10,tool:'inequality',example:'(x-1)/(x+2)>=0',parts:[
 {title:'Transformer avec précaution',text:'Une addition conserve le sens de l’inégalité. Multiplier ou diviser par un nombre négatif inverse ce sens. Si le signe est inconnu, utiliser un tableau.',formula:'a<b,\\ c<0\\quad\\Longrightarrow\\quad ac>bc'},
 {title:'Découper la droite',text:'Les zéros des facteurs et du dénominateur séparent les intervalles. Le dénominateur ne peut jamais s’annuler.',formula:'\\frac{A(x)}{B(x)}\\quad\\text{avec }B(x)\\ne0'},
 {title:'Traiter les bornes',text:'Une borne qui annule le numérateur peut être incluse pour ≥ ou ≤. Une valeur interdite est toujours exclue.',formula:'x\\in[a;b]\\quad\\Longleftrightarrow\\quad a\\le x\\le b'}],worked:[
 {title:'Repérer les bornes',text:'Le numérateur s’annule en 1 ; le dénominateur en −2.',formula:'x\\ne-2'},
 {title:'Combiner les signes',text:'Le quotient est positif avant −2 et après 1. Il est négatif entre ces deux bornes.',formula:'\\frac{x-1}{x+2}\\ge0'},
 {title:'Écrire la solution',text:'−2 est exclu, 1 est inclus.',formula:'S=]-\\infty;-2[\\ \\cup\\ [1;+\\infty['}],trap:'Multiplier directement par x + 2 ferait oublier que son signe change.'},
 {id:'functions',title:'Étudier une fonction',intro:'Organiser une étude complète : domaine, limites, dérivée et courbe.',series:all,minutes:15,tool:'function',example:'x^3-3*x+1',parts:[
 {title:'Commencer par le domaine',text:'Un dénominateur doit être non nul, l’argument d’un logarithme strictement positif et celui d’une racine carrée positif ou nul.',formula:'\\ln u:\\ u>0,\\qquad\\sqrt u:\\ u\\ge0'},
 {title:'Relier dérivée et variations',text:'Sur un intervalle, une dérivée positive implique une fonction croissante ; une dérivée négative implique une fonction décroissante.',formula:"f'(x)>0\\ \\Longrightarrow\\ f\\text{ croissante}"},
 {title:'Construire la représentation',text:'Placer les points remarquables et utiliser les variations. Un tracé numérique aide à visualiser ; il ne prouve pas le nombre de racines.',formula:"y=f'(a)(x-a)+f(a)"}],worked:[
 {title:'Domaine et dérivée',text:'Le polynôme est défini sur R.',formula:"f(x)=x^3-3x+1,\\quad f'(x)=3(x-1)(x+1)"},
 {title:'Signe',text:'La dérivée est positive hors de [−1 ; 1], négative entre −1 et 1.',formula:"f'(-1)=f'(1)=0"},
 {title:'Valeurs remarquables',text:'On obtient un maximum local en −1 et un minimum local en 1.',formula:'f(-1)=3,\\qquad f(1)=-1'}],trap:'Un point où f′ = 0 n’est pas automatiquement un extremum : le signe doit changer.'},
 {id:'derivatives',title:'Dérivation & tangentes',intro:'Choisir la bonne règle et garder les parenthèses des composées.',series:all,minutes:12,tool:'derivative',example:'(x^2+1)*exp(x)',parts:[
 {title:'Les dérivées usuelles',text:'La constante a une dérivée nulle. Les puissances, l’exponentielle et le logarithme sont les briques de base.',formula:"(x^n)'=nx^{n-1},\\quad(e^x)'=e^x,\\quad(\\ln x)'=1/x"},
 {title:'Produit et quotient',text:'La dérivée d’un produit n’est pas le produit des dérivées.',formula:"(uv)'=u'v+uv',\\qquad\\left(\\frac uv\\right)'=\\frac{u'v-uv'}{v^2}"},
 {title:'Fonction composée',text:'Dériver la fonction extérieure puis multiplier par la dérivée de la fonction intérieure.',formula:"(g(u(x)))'=u'(x)g'(u(x))"}],worked:[
 {title:'Nommer les facteurs',text:'On choisit u = x² + 1 et v = eˣ.',formula:"u'=2x,\\qquad v'=e^x"},
 {title:'Appliquer le produit',text:'Conserver les deux termes.',formula:"f'=2xe^x+(x^2+1)e^x"},
 {title:'Factoriser',text:'Le facteur eˣ commun rend l’étude du signe plus facile.',formula:"f'=(x+1)^2e^x"}],trap:'Pour ln(2x + 1), la dérivée est 2/(2x + 1), pas 1/(2x + 1).'},
 {id:'limits',title:'Limites & continuité',intro:'Reconnaître les formes indéterminées et justifier une limite.',series:all,minutes:14,tool:'limit',example:'sin(x)/x',parts:[
 {title:'Essayer la substitution',text:'Pour une fonction continue au point considéré, la limite est sa valeur. Une division 0/0 ne permet pas de conclure.',formula:'\\lim_{x\\to a}f(x)=f(a)\\quad\\text{si }f\\text{ est continue en }a'},
 {title:'Lever une indétermination',text:'Factoriser, utiliser une quantité conjuguée ou comparer les termes dominants.',formula:'\\frac{x^2-1}{x-1}=x+1\\quad(x\\ne1)'},
 {title:'Retenir les limites usuelles',text:'Les angles trigonométriques sont en radians.',formula:'\\lim_{x\\to0}\\frac{\\sin x}{x}=1,\\quad\\lim_{x\\to0}\\frac{e^x-1}{x}=1'}],worked:[
 {title:'Observer',text:'Dans (x² − 1)/(x − 1), la substitution x = 1 donne 0/0.',formula:'x^2-1=(x-1)(x+1)'},
 {title:'Simplifier dans un voisinage',text:'Pour x différent de 1, le quotient vaut x + 1.',formula:'\\frac{x^2-1}{x-1}=x+1'},
 {title:'Passer à la limite',text:'La limite existe même si la fonction initiale n’est pas définie en 1.',formula:'\\lim_{x\\to1}\\frac{x^2-1}{x-1}=2'}],trap:'Pour 1/x en 0, les limites à gauche et à droite sont différentes.'},
 {id:'integrals',title:'Primitives & intégrales',intro:'Relier la dérivation, l’aire et l’évaluation aux bornes.',series:['A','C','D','OSE','S'],minutes:15,tool:'integral',example:'x^2+2*x',parts:[
 {title:'Définir une primitive',text:'F est une primitive de f sur un intervalle si F′ = f sur cet intervalle. Deux primitives diffèrent d’une constante.',formula:"F'=f,\\qquad\\int x^n\\,dx=\\frac{x^{n+1}}{n+1}+C\\ (n\\ne-1)"},
 {title:'Calculer entre deux bornes',text:'Pour f continue sur [a ; b], soustraire la valeur de la primitive en a à sa valeur en b.',formula:'\\int_a^b f(x)\\,dx=F(b)-F(a)'},
 {title:'Comprendre l’aire',text:'L’intégrale est une aire algébrique. Pour obtenir une aire géométrique, tenir compte du signe de f.',formula:'\\mathcal A=\\int_a^b|f(x)|\\,dx'}],worked:[
 {title:'Primitiver terme à terme',text:'Une primitive de x² + 2x est x³/3 + x².',formula:'F(x)=\\frac{x^3}{3}+x^2'},
 {title:'Évaluer en 1 et en 0',text:'F(1) vaut 4/3 et F(0) vaut 0.',formula:'F(1)-F(0)=\\frac43'},
 {title:'Conclure',text:'Sur [0 ; 1], f est positive : l’intégrale donne aussi l’aire.',formula:'\\int_0^1(x^2+2x)\\,dx=\\frac43'}],trap:'Une valeur interdite entre les bornes empêche d’utiliser directement F(b) − F(a).'},
 {id:'sequences',title:'Suites numériques',intro:'Distinguer une formule explicite d’une relation de récurrence.',series:all,minutes:14,tool:'sequence',example:'0.8*u+3',parts:[
 {title:'Suite arithmétique',text:'Chaque terme est obtenu en ajoutant la même raison r.',formula:'u_n=u_0+nr,\\qquad\\sum_{k=0}^n u_k=(n+1)\\frac{u_0+u_n}{2}'},
 {title:'Suite géométrique',text:'Chaque terme est obtenu en multipliant par la même raison q.',formula:'u_n=u_0q^n,\\qquad\\sum_{k=0}^n u_k=u_0\\frac{1-q^{n+1}}{1-q}\\ (q\\ne1)'},
 {title:'Récurrence affine',text:'Pour uₙ₊₁ = auₙ + b et a ≠ 1, soustraire le point fixe ℓ = b/(1−a).',formula:'v_n=u_n-\\ell\\quad\\Longrightarrow\\quad v_{n+1}=av_n'}],worked:[
 {title:'Chercher le point fixe',text:'uₙ₊₁ = 0,8uₙ + 3 et u₀ = 5.',formula:'\\ell=\\frac3{1-0.8}=15'},
 {title:'Exprimer uₙ',text:'v₀ = −10 et v est géométrique de raison 0,8.',formula:'u_n=15-10(0.8)^n'},
 {title:'Étudier la convergence',text:'La raison appartient à ]−1 ; 1[.',formula:'\\lim_{n\\to+\\infty}u_n=15'}],trap:'Une somme de u₀ à uₙ contient n + 1 termes.'},
 {id:'probability',title:'Probabilités & dénombrement',intro:'Définir les événements avant de choisir une formule.',series:all,minutes:14,tool:'probability',example:'0.3',parts:[
 {title:'Compter sans confusion',text:'Un arrangement tient compte de l’ordre ; une combinaison ne tient pas compte de l’ordre.',formula:'\\binom nk=\\frac{n!}{k!(n-k)!}'},
 {title:'Conditionner',text:'P(B|A) décrit la probabilité de B sachant A, avec P(A) > 0.',formula:'P(B\\mid A)=\\frac{P(A\\cap B)}{P(A)}'},
 {title:'Reconnaître une loi binomiale',text:'Répéter n fois la même expérience à deux issues, de façon indépendante, avec une probabilité de succès p constante.',formula:'P(X=k)=\\binom nkp^k(1-p)^{n-k}'}],worked:[
 {title:'Définir X',text:'Sur 3 essais indépendants, chaque succès a une probabilité 1/2. X compte les succès.',formula:'X\\sim\\mathcal B(3;1/2)'},
 {title:'Calculer exactement deux succès',text:'Trois placements possibles pour les deux succès.',formula:'P(X=2)=\\binom32(1/2)^2(1/2)=3/8'},
 {title:'Calculer au moins un succès',text:'Passer par l’événement contraire évite une longue somme.',formula:'P(X\\ge1)=1-P(X=0)=7/8'}],trap:'« Au moins un » signifie 1 − P(aucun), pas 1 − P(un).'},
 {id:'statistics',title:'Statistiques à deux variables',intro:'Résumer un nuage de points sans confondre relation et causalité.',series:['A','D','L','OSE'],minutes:10,tool:'statistics',example:'1;2\n2;3\n3;5\n4;6',parts:[
 {title:'Le point moyen',text:'Calculer séparément les moyennes des x et des y.',formula:'G(\\bar x;\\bar y),\\qquad\\bar x=\\frac1n\\sum x_i'},
 {title:'Ajustement des moindres carrés',text:'La droite y = ax + b minimise la somme des carrés des écarts verticaux.',formula:'a=\\frac{\\sum(x_i-\\bar x)(y_i-\\bar y)}{\\sum(x_i-\\bar x)^2},\\quad b=\\bar y-a\\bar x'},
 {title:'Méthode de Mayer',text:'Lorsque l’énoncé demande Mayer, séparer les points ordonnés en deux groupes, calculer les deux points moyens et tracer la droite qui les relie.',formula:'a=\\frac{y_{G_2}-y_{G_1}}{x_{G_2}-x_{G_1}}'}],worked:[
 {title:'Données',text:'Les points (1 ; 2), (2 ; 4), (3 ; 6) sont alignés.',formula:'G(2;4)'},
 {title:'Ajustement',text:'La pente est 2 et l’ordonnée à l’origine est nulle.',formula:'y=2x'},
 {title:'Interprétation',text:'La corrélation parfaite indique ici un alignement croissant.',formula:'r=1'}],trap:'Une extrapolation très loin des observations est fragile, même si |r| est proche de 1.'},
 {id:'complex',title:'Nombres complexes',intro:'Passer de la forme algébrique à la lecture géométrique.',series:science,minutes:15,tool:'complex',example:'(2+3*i)/(1-i)',parts:[
 {title:'Calculer avec i',text:'Réduire les puissances de i et regrouper les parties réelle et imaginaire.',formula:'i^2=-1,\\qquad z=a+ib'},
 {title:'Module et conjugué',text:'Le module est une distance. Multiplier par le conjugué aide à diviser.',formula:'|z|=\\sqrt{a^2+b^2},\\quad\\bar z=a-ib,\\quad z\\bar z=|z|^2'},
 {title:'Forme exponentielle',text:'Pour z non nul, un argument est défini modulo 2π. Les modules se multiplient et les arguments s’additionnent lors d’un produit.',formula:'z=re^{i\\theta},\\qquad z^n=r^ne^{in\\theta}'}],worked:[
 {title:'Partir de z = 1 + i',text:'Le module vaut √2.',formula:'|1+i|=\\sqrt2'},
 {title:'Identifier l’angle',text:'Les parties réelle et imaginaire sont égales et positives.',formula:'\\arg(1+i)=\\pi/4\\pmod{2\\pi}'},
 {title:'Élever à la puissance 4',text:'Appliquer la formule de Moivre.',formula:'(1+i)^4=(\\sqrt2)^4e^{i\\pi}=-4'}],trap:'Le nombre zéro n’a pas d’argument. Le module est toujours positif ou nul.'},
 {id:'matrices',title:'Systèmes & matrices',intro:'Organiser les coefficients et résoudre sans arrondis intermédiaires.',series:['C','D','L','OSE','S'],minutes:12,tool:'system',example:'2*x+y=5\nx-y=1',parts:[
 {title:'Écrire AX = B',text:'Une ligne correspond à une équation ; une colonne à une inconnue.',formula:'AX=B'},
 {title:'Élimination de Gauss',text:'Les opérations sur les lignes conservent l’ensemble des solutions. Une ligne 0 = c avec c non nul rend le système impossible.',formula:'L_i\\leftarrow L_i-\\lambda L_j'},
 {title:'Inversibilité',text:'Pour une matrice carrée, un déterminant non nul garantit une solution unique pour tout B.',formula:'\\det(A)\\ne0\\quad\\Longrightarrow\\quad X=A^{-1}B'}],worked:[
 {title:'Additionner',text:'Additionner 2x + y = 5 et x − y = 1 élimine y.',formula:'3x=6'},
 {title:'Trouver x',text:'Diviser les deux membres par 3.',formula:'x=2'},
 {title:'Trouver y et vérifier',text:'Remplacer x dans la seconde équation.',formula:'y=1,\\qquad2\\times2+1=5'}],trap:'Un déterminant nul ne signifie pas toujours aucune solution : il peut y en avoir une infinité.'},
 {id:'arithmetic',title:'Arithmétique & Bézout',intro:'Utiliser la division euclidienne pour étudier les entiers.',series:['C','S'],minutes:12,tool:'arithmetic',example:'252;198',parts:[
 {title:'Division euclidienne',text:'Pour a entier et b entier strictement positif, le quotient et le reste sont uniques.',formula:'a=bq+r,\\qquad0\\le r<b'},
 {title:'Algorithme d’Euclide',text:'Le PGCD de deux entiers ne change pas si l’on remplace le plus grand par le reste de leur division.',formula:'\\operatorname{PGCD}(a,b)=\\operatorname{PGCD}(b,r)'},
 {title:'Bézout et congruences',text:'Il existe des entiers u et v tels que au + bv = PGCD(a,b). En particulier, des entiers premiers entre eux donnent une combinaison égale à 1.',formula:'a\\equiv b\\pmod n\\quad\\Longleftrightarrow\\quad n\\mid(a-b)'}],worked:[
 {title:'Diviser',text:'Appliquer Euclide à 252 et 198.',formula:'252=198+54,\\quad198=3\\times54+36'},
 {title:'Terminer',text:'Le dernier reste non nul vaut 18.',formula:'54=36+18,\\quad36=2\\times18'},
 {title:'Remonter',text:'Exprimer 18 avec les nombres initiaux.',formula:'18=4\\times252-5\\times198'}],trap:'Être premiers entre eux ne signifie pas que les deux nombres sont premiers.'},
 {id:'geometry',title:'Vecteurs dans l’espace',intro:'Traduire alignement, orthogonalité et distances par des calculs.',series:science,minutes:12,tool:'geometry',example:'1;2;3\n2;-1;1',parts:[
 {title:'Norme et distance',text:'La distance AB est la norme du vecteur AB.',formula:'\\|u\\|=\\sqrt{u_x^2+u_y^2+u_z^2}'},
 {title:'Produit scalaire',text:'Deux vecteurs non nuls sont orthogonaux si leur produit scalaire est nul.',formula:'u\\cdot v=u_xv_x+u_yv_y+u_zv_z'},
 {title:'Équation d’un plan',text:'Un vecteur normal non nul et un point du plan permettent d’écrire son équation.',formula:'a(x-x_0)+b(y-y_0)+c(z-z_0)=0'}],worked:[
 {title:'Choisir deux vecteurs',text:'u = (1 ; 2 ; 0) et v = (2 ; −1 ; 0).',formula:'u\\cdot v=1\\times2+2\\times(-1)=0'},
 {title:'Conclure',text:'Les deux vecteurs sont non nuls, donc orthogonaux.',formula:'u\\perp v'},
 {title:'Calculer les normes',text:'Ils ont la même norme.',formula:'\\|u\\|=\\|v\\|=\\sqrt5'}],trap:'Des coordonnées proportionnelles indiquent une colinéarité, pas une orthogonalité.'},
 {id:'finance',title:'Mathématiques financières',intro:'Relier pourcentage, capitalisation et suites géométriques.',series:['OSE'],minutes:12,tool:'finance',example:'100000',parts:[
 {title:'Intérêts simples',text:'Les intérêts sont calculés sur le capital initial à chaque période.',formula:'C_n=C_0(1+nt)'},
 {title:'Intérêts composés',text:'Chaque période, les intérêts sont ajoutés au capital et produisent eux aussi des intérêts.',formula:'C_n=C_0(1+t)^n'},
 {title:'Actualiser',text:'Retrouver la valeur présente d’un montant futur en divisant par le coefficient de capitalisation.',formula:'C_0=\\frac{C_n}{(1+t)^n}'}],worked:[
 {title:'Convertir le taux',text:'5 % s’écrit 0,05.',formula:'q=1.05'},
 {title:'Capitaliser deux ans',text:'Avec 100 000 Ar sans versement supplémentaire.',formula:'C_2=100\\,000\\times1.05^2'},
 {title:'Conclure',text:'Le gain total est 10 250 Ar.',formula:'C_2=110\\,250\\ \\mathrm{Ar}'}],trap:'Vérifier si le taux est annuel ou mensuel et si les versements arrivent en début ou fin de période.'},
 {id:'ode',title:'Équations différentielles',intro:'Reconnaître y′ = ay + b et utiliser une condition initiale.',series:['C','S'],minutes:12,tool:'ode',example:'3',parts:[
 {title:'Équation homogène',text:'Pour a constant, les solutions de y′ = ay sont des exponentielles.',formula:"y'=ay\\quad\\Longrightarrow\\quad y=Ce^{ax}"},
 {title:'Ajouter un second membre constant',text:'Pour a non nul, −b/a est une solution constante de y′ = ay + b.',formula:"y'=ay+b\\quad\\Longrightarrow\\quad y=Ce^{ax}-b/a"},
 {title:'Fixer la constante',text:'Remplacer x et y par les valeurs de la condition initiale, puis isoler C.',formula:'y(x_0)=y_0'}],worked:[
 {title:'Résoudre y′ = −2y + 3',text:'Une solution constante vaut 3/2.',formula:'y=Ce^{-2x}+3/2'},
 {title:'Utiliser y(0) = 1',text:'On trouve C = −1/2.',formula:'1=C+3/2'},
 {title:'Vérifier',text:'Dériver et remplacer dans l’équation.',formula:'y(x)=3/2-(1/2)e^{-2x}'}],trap:'La constante C n’est pas forcément la valeur initiale si un second membre est présent.'}
];

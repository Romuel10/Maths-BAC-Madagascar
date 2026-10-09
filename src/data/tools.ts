import type {Tool,Field} from '../engine/types';
const f=(key:string,label:string,initial:string,hint?:string):Field=>({key,label,initial,hint});
export const tools:Tool[]=[
 {id:'equation',name:'Équation',group:'Algèbre',description:'Résoudre exactement ou rechercher des solutions approchées dans un intervalle.',label:'Ton équation',expression:'x²-5x+6=0',fields:[f('rootMin','Recherche numérique : de','-10'),f('rootMax','Recherche numérique : à','10')]},
 {id:'calculate',name:'Calcul & algèbre',group:'Algèbre',description:'Calculer exactement, simplifier, développer, factoriser ou remplacer x par une valeur.',label:'Ton expression',expression:'(2/3+1/4)²',fields:[f('form','Ce que tu veux obtenir','simplify'),f('xvalue','Valeur de x','0'),f('angle','Angles des fonctions trigonométriques','rad')]},
 {id:'inequality',name:'Inéquation',group:'Algèbre',description:'Construire le tableau de signes d’une expression rationnelle.',label:'Ton inéquation',expression:'(x-1)/(x+2)>=0',fields:[]},
 {id:'system',name:'Système',group:'Algèbre',description:'Résoudre deux ou trois équations linéaires par Gauss.',label:'Une équation par ligne',expression:'2*x+y=5\nx-y=1',fields:[]},
 {id:'function',name:'Étude de fonction',group:'Analyse',description:'Domaine, dérivée, variations disponibles et courbe.',label:'f(x) =',expression:'x^3-3*x+1',fields:[f('xmin','Début de la fenêtre','-4'),f('xmax','Fin de la fenêtre','4')]},
 {id:'derivative',name:'Dérivée',group:'Analyse',description:'Dériver les fonctions usuelles et composées.',label:'f(x) =',expression:'(x^2+1)*exp(x)',fields:[f('order','Ordre','1')]},
 {id:'integral',name:'Intégrale',group:'Analyse',description:'Chercher une primitive ou calculer entre deux bornes, avec une méthode numérique si nécessaire.',label:'Fonction à intégrer',expression:'x²+2x',fields:[f('kind','Type','primitive'),f('lower','Borne inférieure','0'),f('upper','Borne supérieure','1'),f('method','Méthode','auto')]},
 {id:'limit',name:'Limite',group:'Analyse',description:'Calcul symbolique, à gauche, à droite ou des deux côtés.',label:'Expression',expression:'sin(x)/x',fields:[f('point','x tend vers','0','Un nombre, +∞ ou −∞.'),f('side','Approche','both')]},
 {id:'sequence',name:'Suites',group:'Analyse',description:'Termes exacts, sommes et méthode pour les suites affines.',label:'Formule (n = rang ; u = terme précédent)',expression:'0.8*u+3',fields:[f('kind','Définition','recurrence'),f('initial','Premier terme','5'),f('start','Premier rang','0'),f('count','Nombre de termes','10')]},
 {id:'probability',name:'Probabilités',group:'Données',description:'Loi binomiale : probabilité simple, cumulée et indicateurs.',label:'Probabilité de succès p',expression:'0.3',fields:[f('n','Nombre d’épreuves n','10'),f('k','Nombre de succès k','3'),f('kind','Événement','exact')]},
 {id:'statistics',name:'Statistiques',group:'Données',description:'Point moyen, ajustement affine et corrélation.',label:'Un couple x ; y par ligne',expression:'1;2\n2;3\n3;5\n4;6',fields:[]},
 {id:'complex',name:'Complexes',group:'Spécialités',description:'Forme algébrique, module, argument et conjugué.',label:'Nombre complexe (i² = −1)',expression:'(2+3*i)/(1-i)',fields:[]},
 {id:'matrix',name:'Matrices',group:'Spécialités',description:'Inverse exacte, déterminant et trace jusqu’à l’ordre 4.',label:'Coefficients séparés par ;, une ligne par rangée',expression:'2;1\n1;3',fields:[]},
 {id:'geometry',name:'Géométrie',group:'Spécialités',description:'Normes, produits scalaire et vectoriel, angle.',label:'Deux vecteurs de l’espace, un par ligne',expression:'1;2;3\n2;-1;1',fields:[]},
 {id:'arithmetic',name:'Arithmétique',group:'Spécialités',description:'Euclide, PGCD, PPCM et coefficients de Bézout.',label:'Deux entiers séparés par ;',expression:'252;198',fields:[]},
 {id:'ode',name:'Équation différentielle',group:'Spécialités',description:'Résoudre y′ = ay + b avec une condition initiale.',label:'Second membre constant b',expression:'3',fields:[f('a','Coefficient a','-2'),f('x0','Abscisse initiale x₀','0'),f('y0','Valeur initiale y₀','1')]},
 {id:'finance',name:'Maths financières',group:'Spécialités',description:'Capitalisation et versements annuels de fin de période.',label:'Capital initial en ariary',expression:'100000',fields:[f('rate','Taux annuel en %','5'),f('years','Durée en années','5'),f('payment','Versement annuel en ariary','0')]}
];
export const selectOptions:Record<string,Record<string,string[][]>>={
 calculate:{form:[['simplify','Simplifier ou calculer'],['expand','Développer'],['factor','Factoriser'],['evaluate','Calculer pour x = …']],angle:[['rad','Radians'],['deg','Degrés']]},
 derivative:{order:[['1','Première'],['2','Deuxième'],['3','Troisième']]},
 integral:{kind:[['primitive','Chercher une primitive'],['definite','Intégrale entre deux bornes']],method:[['auto','Exacte si possible, sinon numérique'],['numeric','Numérique']]},
 limit:{side:[['both','Des deux côtés'],['left','À gauche'],['right','À droite']]},
 sequence:{kind:[['recurrence','Par récurrence'],['explicit','Formule explicite']]},
 probability:{kind:[['exact','Exactement k'],['atmost','Au plus k'],['atleast','Au moins k']]}
};

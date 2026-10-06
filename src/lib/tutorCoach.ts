import type { SolverTopic } from './solverIntent.js';

export type TutorExplanationLevel = 'simple' | 'detail' | 'bac';

export interface TutorStepSupport {
 objective: string;
 why: string;
 action: string;
 selfCheck: string;
 microExample: string;
 pitfall: string;
 bacWriting: string;
}

export interface TutorPractice {
 title: string;
 prompt: string;
 hint: string;
 solution: string;
 checkpoint: string;
}

const SUPPORT: Record<SolverTopic, TutorStepSupport[]> = {
 Analyse: [
  {
   objective: 'Trouver les valeurs de x pour lesquelles la fonction existe.',
   why: 'Le domaine fixe les valeurs autorisées avant toute limite, dérivée ou variation.',
   action: 'Repère les dénominateurs, racines carrées et logarithmes puis écris leurs conditions.',
   selfCheck: 'As-tu exclu toute valeur qui annule un dénominateur et imposé les conditions des racines ou logarithmes ?',
   microExample: 'Pour f(x)=1/(x−2), on impose x−2≠0, donc x≠2.',
   pitfall: 'Dériver immédiatement sans avoir vérifié le domaine.',
   bacWriting: 'Commence la copie par « Domaine de définition : … » et justifie chaque restriction.'
  },
  {
   objective: 'Étudier le comportement de la fonction aux bornes utiles.',
   why: 'Les limites permettent de comprendre les extrémités de la courbe et de repérer certaines asymptotes.',
   action: 'Liste les bornes du domaine puis calcule une limite à la fois en identifiant la forme obtenue.',
   selfCheck: 'As-tu traité chaque borne du domaine et distingué une valeur finie de ±∞ ?',
   microExample: 'Si f(x)=1/x, alors quand x→+∞, 1/x→0.',
   pitfall: 'Remplacer directement par une valeur interdite sans passer par une limite.',
   bacWriting: 'Écris la limite, sa justification courte, puis l’interprétation graphique si elle est demandée.'
  },
  {
   objective: 'Obtenir une dérivée exploitable pour le signe.',
   why: 'Le signe de f’ permet ensuite de déterminer les variations de f.',
   action: 'Choisis la bonne règle de dérivation puis simplifie ou factorise autant que possible.',
   selfCheck: 'Peux-tu lire facilement le signe de la dérivée sous la forme obtenue ?',
   microExample: 'Pour f(x)=x²−4x+3, f’(x)=2x−4=2(x−2).',
   pitfall: 'Conserver une dérivée correcte mais trop compliquée pour étudier son signe.',
   bacWriting: 'Indique la règle utilisée si nécessaire, puis donne une forme simplifiée de f’.'
  },
  {
   objective: 'Transformer le signe de la dérivée en variations de la fonction.',
   why: 'f augmente là où f’ est positive et diminue là où f’ est négative.',
   action: 'Résous f’(x)=0, place les valeurs critiques puis construis le tableau de signe et de variations.',
   selfCheck: 'Chaque changement de variation correspond-il bien à un changement de signe de f’ ?',
   microExample: 'Si f’(x)=2(x−2), alors f’<0 pour x<2 et f’>0 pour x>2 : f décroît puis croît.',
   pitfall: 'Inverser le lien entre le signe de f’ et le sens de variation de f.',
   bacWriting: 'Fais apparaître les valeurs critiques, le signe de f’ puis les flèches de variation.'
  },
  {
   objective: 'Conclure avec les éléments graphiques réellement demandés.',
   why: 'Une étude de fonction doit répondre à la consigne, pas accumuler des calculs inutiles.',
   action: 'Ajoute seulement les asymptotes, tangentes, extremums ou points remarquables utiles à la question.',
   selfCheck: 'Ta conclusion reprend-elle exactement les éléments demandés dans l’énoncé ?',
   microExample: 'Si lim f(x)=0 quand x→+∞, la droite y=0 peut être une asymptote horizontale.',
   pitfall: 'Donner une asymptote sans relier le résultat à une limite.',
   bacWriting: 'Termine par une phrase d’interprétation : « Donc la droite … est asymptote … ».'
  }
 ],
 Algèbre: [
  {
   objective: 'Identifier précisément ce qu’il faut trouver.',
   why: 'La méthode change selon qu’on cherche des racines, une factorisation, un système ou une inéquation.',
   action: 'Nommer l’inconnue et réécrire la question sous une forme mathématique claire.',
   selfCheck: 'Sais-tu dire en une phrase ce que représente la réponse recherchée ?',
   microExample: '« Résoudre x²−5x+6=0 » signifie trouver toutes les valeurs de x qui rendent l’égalité vraie.',
   pitfall: 'Commencer des calculs sans savoir si l’on doit résoudre, factoriser ou seulement simplifier.',
   bacWriting: 'Annonce l’équation ou l’expression étudiée avant d’appliquer une méthode.'
  },
  {
   objective: 'Mettre l’expression sous une forme adaptée.',
   why: 'Une écriture bien choisie fait apparaître la méthode la plus simple.',
   action: 'Réduis, développe ou factorise selon l’objectif ; place tout du même côté pour une équation.',
   selfCheck: 'La nouvelle forme est-elle équivalente à l’expression de départ ?',
   microExample: 'x²−5x+6=(x−2)(x−3), ce qui rend les racines visibles.',
   pitfall: 'Changer de signe lors d’un déplacement de terme ou oublier une parenthèse.',
   bacWriting: 'Garde une ligne de calcul par transformation importante pour que le correcteur puisse suivre.'
  },
  {
   objective: 'Appliquer la méthode adaptée sans perdre de solutions.',
   why: 'Factorisation, discriminant, substitution ou élimination ne s’emploient pas dans les mêmes situations.',
   action: 'Choisis la méthode la plus directe puis écris les conditions avant les divisions éventuelles.',
   selfCheck: 'As-tu évité de diviser par une expression qui pourrait être nulle ?',
   microExample: 'Pour x²−5x+6=0, (x−2)(x−3)=0 donne x=2 ou x=3.',
   pitfall: 'Diviser par x et perdre la solution x=0 quand elle est possible.',
   bacWriting: 'Justifie le passage clé : produit nul, discriminant, substitution ou élimination.'
  },
  {
   objective: 'Vérifier puis présenter l’ensemble des solutions.',
   why: 'Certaines transformations introduisent des valeurs interdites ou des solutions parasites.',
   action: 'Remplace les solutions dans l’énoncé initial puis écris clairement l’ensemble solution.',
   selfCheck: 'Chaque valeur finale vérifie-t-elle bien le problème de départ ?',
   microExample: 'Pour (x−2)(x−3)=0, 2 et 3 vérifient bien l’équation initiale.',
   pitfall: 'S’arrêter au calcul sans écrire la réponse finale.',
   bacWriting: 'Termine par une ligne claire du type « S={…} ».'
  }
 ],
 Complexes: [
  {
   objective: 'Choisir la forme du nombre complexe adaptée à la question.',
   why: 'La forme algébrique aide pour les calculs ; module et argument servent pour la géométrie et les puissances.',
   action: 'Repère si la consigne demande une équation, un module, un argument ou une interprétation géométrique.',
   selfCheck: 'La forme choisie facilite-t-elle réellement le calcul demandé ?',
   microExample: 'Pour z=3+4i, la forme algébrique permet de lire Re(z)=3 et Im(z)=4.',
   pitfall: 'Passer en forme trigonométrique alors que la question ne le nécessite pas.',
   bacWriting: 'Annonce la forme utilisée et la raison si le changement de forme est important.'
  },
  {
   objective: 'Séparer correctement partie réelle et partie imaginaire.',
   why: 'Deux nombres complexes sont égaux si et seulement si leurs parties réelles et imaginaires sont égales.',
   action: 'Développe avec i²=−1 puis regroupe les termes réels et les termes en i.',
   selfCheck: 'As-tu remplacé chaque i² par −1 ?',
   microExample: '(1+i)(1−i)=1−i²=2.',
   pitfall: 'Oublier que i² vaut −1.',
   bacWriting: 'Présente le résultat sous la forme a+bi avant de comparer les parties.'
  },
  {
   objective: 'Résoudre ou transformer en utilisant les propriétés adaptées.',
   why: 'Le conjugué, le discriminant complexe ou la forme exponentielle peuvent simplifier fortement le problème.',
   action: 'Applique l’outil correspondant à la question puis simplifie avant de conclure.',
   selfCheck: 'Le résultat est-il dans la forme demandée par l’énoncé ?',
   microExample: 'Le conjugué de 2−3i est 2+3i et leur produit vaut 13.',
   pitfall: 'Confondre module et partie réelle.',
   bacWriting: 'Fais apparaître la propriété utilisée : conjugué, module, argument ou équation.'
  },
  {
   objective: 'Contrôler le résultat complexe.',
   why: 'Une substitution ou un contrôle géométrique permet de repérer rapidement une erreur de signe.',
   action: 'Remplace la solution dans l’équation ou vérifie module et argument.',
   selfCheck: 'Le résultat satisfait-il toutes les conditions initiales ?',
   microExample: 'Si z=i est annoncé solution de z²+1=0, alors i²+1=−1+1=0.',
   pitfall: 'Donner une solution sans vérification quand le calcul comporte plusieurs signes.',
   bacWriting: 'Ajoute une vérification courte quand elle sécurise la réponse.'
  }
 ],
 Probabilités: [
  {
   objective: 'Définir les événements et les données de l’expérience.',
   why: 'Une notation claire évite de mélanger les probabilités conditionnelles et simples.',
   action: 'Nommer les événements puis relever les probabilités connues.',
   selfCheck: 'Chaque lettre utilisée correspond-elle à un événement défini ?',
   microExample: 'On peut poser A : « la pièce est conforme » et B : « le test est positif ».',
   pitfall: 'Utiliser P(A) ou P(B) sans avoir défini A et B.',
   bacWriting: 'Définis les événements avant la première formule.'
  },
  {
   objective: 'Reconnaître le bon modèle probabiliste.',
   why: 'Arbre, conditionnement, loi binomiale et indépendance répondent à des structures différentes.',
   action: 'Cherche les mots-clés : répétitions indépendantes, sachant que, au moins, exactement k.',
   selfCheck: 'Les conditions du modèle choisi sont-elles toutes réunies ?',
   microExample: 'n épreuves indépendantes avec même probabilité p conduisent souvent à une loi binomiale.',
   pitfall: 'Utiliser une binomiale alors que la probabilité change d’une épreuve à l’autre.',
   bacWriting: 'Justifie en une phrase pourquoi la loi ou la formule s’applique.'
  },
  {
   objective: 'Écrire la formule avant de calculer.',
   why: 'Cela montre le raisonnement et limite les erreurs de saisie.',
   action: 'Écris la formule symbolique, puis seulement ensuite remplace par les valeurs.',
   selfCheck: 'La formule correspond-elle exactement à « exactement », « au moins » ou « sachant que » ?',
   microExample: 'Pour X~B(n,p), P(X=k)=C(n,k)p^k(1−p)^(n−k).',
   pitfall: 'Calculer directement à la calculatrice sans montrer la formule.',
   bacWriting: 'Laisse visible la formule générale puis la ligne numérique.'
  },
  {
   objective: 'Contrôler l’ordre de grandeur et conclure.',
   why: 'Une probabilité doit rester entre 0 et 1 et répondre précisément à l’événement demandé.',
   action: 'Vérifie 0≤P≤1 puis exprime la réponse en décimal ou pourcentage selon la consigne.',
   selfCheck: 'Le résultat est-il plausible et associé au bon événement ?',
   microExample: '0,32 correspond à 32 %, pas à 3,2 %.',
   pitfall: 'Confondre une probabilité décimale et son pourcentage.',
   bacWriting: 'Termine par « La probabilité cherchée est … », avec un arrondi justifié si nécessaire.'
  }
 ],
 Suites: [
  {
   objective: 'Identifier comment la suite est définie.',
   why: 'Une suite explicite et une suite récurrente ne se traitent pas de la même manière.',
   action: 'Repère l’indice de départ, la formule de u_n ou la relation entre u_(n+1) et u_n.',
   selfCheck: 'Connais-tu le premier terme et la règle de calcul ?',
   microExample: 'u_n=2n+1 est explicite ; u_(n+1)=0,5u_n+3 est récurrente.',
   pitfall: 'Utiliser une formule de suite géométrique sans avoir vérifié la raison constante.',
   bacWriting: 'Rappelle la définition de la suite avant les calculs importants.'
  },
  {
   objective: 'Calculer quelques termes utiles ou transformer la relation.',
   why: 'Les premiers termes peuvent suggérer une propriété, mais ne suffisent pas à la démontrer.',
   action: 'Calcule proprement les termes demandés et simplifie la relation de récurrence.',
   selfCheck: 'Chaque terme utilise-t-il le bon indice précédent ?',
   microExample: 'Si u_0=2 et u_(n+1)=u_n+3, alors u_1=5 puis u_2=8.',
   pitfall: 'Décaler les indices et calculer u_(n+1) avec le mauvais terme.',
   bacWriting: 'Montre au moins une substitution complète avant de donner les valeurs suivantes.'
  },
  {
   objective: 'Démontrer monotonie, bornes ou propriété demandée.',
   why: 'Une observation numérique ne remplace pas une preuve.',
   action: 'Étudie u_(n+1)−u_n, un quotient pertinent ou utilise une récurrence selon la question.',
   selfCheck: 'La preuve vaut-elle pour tout n du domaine annoncé ?',
   microExample: 'Si u_(n+1)−u_n=3>0 pour tout n, alors la suite est strictement croissante.',
   pitfall: 'Conclure « croissante » seulement parce que les trois premiers termes augmentent.',
   bacWriting: 'Écris clairement la quantité étudiée puis la conclusion « donc la suite est … ».'
  },
  {
   objective: 'Justifier la convergence et la limite.',
   why: 'Résoudre ℓ=f(ℓ) ne prouve pas à lui seul que la suite converge.',
   action: 'Établis d’abord la convergence par un théorème adapté, puis cherche la limite candidate.',
   selfCheck: 'As-tu distingué preuve de convergence et calcul de la limite ?',
   microExample: 'Une suite croissante et majorée converge ; ensuite seulement on peut exploiter la relation de récurrence.',
   pitfall: 'Écrire directement ℓ=f(ℓ) sans avoir justifié l’existence de ℓ.',
   bacWriting: 'Cite le théorème de convergence avant de résoudre l’équation de la limite.'
  }
 ],
 Géométrie: [
  {
   objective: 'Transformer l’énoncé en figure et en données utilisables.',
   why: 'Un schéma évite de perdre des relations géométriques importantes.',
   action: 'Dessine une figure simple et liste coordonnées, longueurs, vecteurs ou angles connus.',
   selfCheck: 'Tous les points et objets de la consigne apparaissent-ils sur ton schéma ?',
   microExample: 'Pour montrer deux droites perpendiculaires, on peut chercher leurs vecteurs directeurs.',
   pitfall: 'Faire confiance à la figure pour une propriété qui doit être démontrée.',
   bacWriting: 'Utilise le schéma pour comprendre, mais justifie toujours par un calcul ou un théorème.'
  },
  {
   objective: 'Choisir l’outil géométrique le plus simple.',
   why: 'Coordonnées, vecteurs, produit scalaire ou déterminant peuvent transformer une question géométrique en calcul court.',
   action: 'Associe la propriété demandée à son critère algébrique.',
   selfCheck: 'Le critère choisi est-il suffisant pour conclure ?',
   microExample: 'Deux vecteurs sont orthogonaux si leur produit scalaire est nul.',
   pitfall: 'Calculer beaucoup de distances quand un produit scalaire suffit.',
   bacWriting: 'Annonce le critère utilisé avant le calcul.'
  },
  {
   objective: 'Effectuer le calcul géométrique sans perdre les unités ni les coordonnées.',
   why: 'La plupart des erreurs viennent d’un signe ou d’une coordonnée mal recopiée.',
   action: 'Écris les vecteurs ou coordonnées intermédiaires avant la formule finale.',
   selfCheck: 'Les coordonnées des vecteurs sont-elles calculées dans le bon ordre ?',
   microExample: 'AB=(x_B−x_A ; y_B−y_A).',
   pitfall: 'Écrire AB=(x_A−x_B ; y_A−y_B) puis utiliser un autre ordre ailleurs.',
   bacWriting: 'Laisse visibles les coordonnées intermédiaires.'
  },
  {
   objective: 'Revenir du calcul à la conclusion géométrique.',
   why: 'Le résultat numérique n’est pas encore la réponse si la consigne demande une propriété.',
   action: 'Écris une phrase qui relie le calcul au théorème utilisé.',
   selfCheck: 'La conclusion contient-elle les objets géométriques nommés dans l’énoncé ?',
   microExample: 'AB·AC=0, donc les droites (AB) et (AC) sont perpendiculaires.',
   pitfall: 'Finir par « =0 » sans écrire ce que cela prouve.',
   bacWriting: 'Termine par « Donc… » suivi de la propriété géométrique exacte.'
  }
 ],
 Arithmétique: [
  {
   objective: 'Identifier la structure arithmétique du problème.',
   why: 'Divisibilité, PGCD, congruence et Bézout utilisent des outils différents.',
   action: 'Repère les mots-clés et les nombres concernés.',
   selfCheck: 'Sais-tu dire si l’on cherche un diviseur, un reste, un PGCD ou une solution entière ?',
   microExample: '« Montrer que 7 divise n−3 » invite souvent à travailler modulo 7.',
   pitfall: 'Lancer l’algorithme d’Euclide alors que la question porte seulement sur une congruence simple.',
   bacWriting: 'Annonce le cadre : divisibilité, modulo, PGCD ou équation diophantienne.'
  },
  {
   objective: 'Appliquer l’outil principal proprement.',
   why: 'Une suite d’égalités bien structurée rend la preuve vérifiable.',
   action: 'Utilise Euclide, une congruence ou la décomposition nécessaire.',
   selfCheck: 'Chaque reste ou congruence est-il calculé avec le bon modulo ?',
   microExample: '23=3×7+2, donc 23≡2 [7].',
   pitfall: 'Changer de modulo au milieu du calcul.',
   bacWriting: 'Écris explicitement le modulo à chaque étape importante.'
  },
  {
   objective: 'Exploiter le résultat obtenu.',
   why: 'Le PGCD ou la congruence intermédiaire doit servir à la question finale.',
   action: 'Relie le calcul à Bézout, Gauss ou au critère de divisibilité pertinent.',
   selfCheck: 'As-tu expliqué pourquoi le résultat intermédiaire permet de conclure ?',
   microExample: 'Si pgcd(a,b)=1, Bézout garantit l’existence de u,v tels que au+bv=1.',
   pitfall: 'Citer un théorème sans vérifier ses hypothèses.',
   bacWriting: 'Nomme le théorème et vérifie ses conditions avant de l’utiliser.'
  },
  {
   objective: 'Vérifier les solutions entières ou la divisibilité finale.',
   why: 'Une solution arithmétique doit respecter toutes les contraintes de l’énoncé.',
   action: 'Substitue ou vérifie le reste final.',
   selfCheck: 'Toutes les solutions proposées sont-elles entières et admissibles ?',
   microExample: 'Pour vérifier 35≡0 [5], on constate bien que 5 divise 35.',
   pitfall: 'Oublier une condition de positivité ou d’intervalle sur les entiers.',
   bacWriting: 'Conclue avec la propriété exacte demandée.'
  }
 ],
 Finance: [
  {
   objective: 'Identifier les grandeurs financières de l’énoncé.',
   why: 'Le choix de la formule dépend du capital, du taux, de la durée et de la date de comparaison.',
   action: 'Relève C ou N, le taux i ou d, la durée t ou n, puis précise s’il s’agit d’intérêt simple, composé, d’escompte, d’actualisation ou d’annuités.',
   selfCheck: 'Le taux est-il écrit en décimal et la durée utilise-t-elle la même unité que le taux ?',
   microExample: '10 % devient 0,10 ; 9 mois avec un taux annuel donnent t=9/12=0,75 an pour un intérêt simple.',
   pitfall: 'Utiliser 10 au lieu de 0,10 dans une formule.',
   bacWriting: 'Écris d’abord « Données : C=…, i=…, n=… » avec les unités.'
  },
  {
   objective: 'Choisir la bonne formule.',
   why: 'Intérêt simple et intérêt composé ne modélisent pas la même évolution du capital.',
   action: 'Utilise I=Cit pour l’intérêt simple, A=C(1+i)^n pour la capitalisation, VA=VF/(1+i)^n pour l’actualisation ou la formule d’annuités adaptée.',
   selfCheck: 'La formule choisie correspond-elle au sens du temps et au type de placement ?',
   microExample: 'Pour 1 000 000 Ar à 10 % pendant 2 ans composés : A=1 000 000×1,1².',
   pitfall: 'Remplacer (1+i)^n par 1+ni dans un problème d’intérêts composés.',
   bacWriting: 'Écris la formule symbolique avant de remplacer par les nombres.'
  },
  {
   objective: 'Effectuer le calcul sans arrondir trop tôt.',
   why: 'Les puissances et facteurs d’actualisation amplifient les erreurs d’arrondi.',
   action: 'Calcule avec toutes les décimales disponibles et arrondis seulement le résultat final selon la consigne.',
   selfCheck: 'Le résultat a-t-il un ordre de grandeur cohérent avec le capital initial ?',
   microExample: '1 000 000×1,1²=1 210 000 Ar.',
   pitfall: 'Arrondir le facteur financier avant la multiplication finale.',
   bacWriting: 'Garde une ligne avec le facteur numérique puis une ligne avec le résultat en Ariary.'
  },
  {
   objective: 'Interpréter le résultat à la bonne date.',
   why: 'Une valeur financière n’a de sens qu’avec sa date et son rôle : actuelle, acquise, nominale ou annuité.',
   action: 'Relis la question puis écris une phrase avec la date et l’unité monétaire.',
   selfCheck: 'Ta réponse précise-t-elle ce que représente la somme obtenue ?',
   microExample: '« La valeur acquise après 2 ans est 1 210 000 Ar. »',
   pitfall: 'Donner seulement un nombre sans préciser s’il s’agit d’un intérêt ou d’une valeur acquise.',
   bacWriting: 'Termine par une phrase complète avec « Ar » et la date concernée.'
  }
 ],
 Général: [
  {
   objective: 'Comprendre exactement la consigne.',
   why: 'Une grande partie du blocage vient d’une question mal reformulée.',
   action: 'Entoure le verbe de la consigne et reformule-le avec tes propres mots.',
   selfCheck: 'Peux-tu expliquer en une phrase ce qu’il faut trouver ou démontrer ?',
   microExample: '« Déterminer x » signifie trouver toutes les valeurs de x compatibles avec les données.',
   pitfall: 'Répondre à une question voisine mais différente.',
   bacWriting: 'Commence par identifier clairement l’objet recherché.'
  },
  {
   objective: 'Séparer les données utiles du reste de l’énoncé.',
   why: 'Cela réduit la charge mentale et fait apparaître les relations importantes.',
   action: 'Écris les données sous forme de petite liste avec les unités et conditions.',
   selfCheck: 'Chaque donnée que tu gardes sert-elle à la question ?',
   microExample: 'Si l’énoncé donne une longueur, un angle et demande une autre longueur, note seulement les grandeurs utiles.',
   pitfall: 'Utiliser tous les nombres uniquement parce qu’ils sont présents.',
   bacWriting: 'Recopie les données indispensables au début du raisonnement.'
  },
  {
   objective: 'Identifier le chapitre et la propriété du cours.',
   why: 'Le bon théorème transforme souvent le problème en quelques étapes simples.',
   action: 'Cherche quel chapitre contient une situation semblable et nomme la propriété avant le calcul.',
   selfCheck: 'Peux-tu citer la formule ou le théorème qui relie les données à l’inconnue ?',
   microExample: 'Une question d’orthogonalité suggère souvent un produit scalaire.',
   pitfall: 'Tester des calculs au hasard.',
   bacWriting: 'Écris la propriété avant de remplacer par les valeurs.'
  },
  {
   objective: 'Effectuer le calcul en gardant une ligne par idée.',
   why: 'Des étapes courtes facilitent la vérification et la correction d’une erreur.',
   action: 'Transforme une seule chose à la fois et vérifie les signes, unités et parenthèses.',
   selfCheck: 'Peux-tu justifier le passage d’une ligne à la suivante ?',
   microExample: '2x+4=10 → 2x=6 → x=3.',
   pitfall: 'Sauter plusieurs transformations dans une seule ligne.',
   bacWriting: 'Montre les étapes essentielles, pas seulement le résultat de la calculatrice.'
  },
  {
   objective: 'Vérifier et répondre avec une phrase finale.',
   why: 'Une réponse correcte doit aussi être interprétée dans le contexte de l’exercice.',
   action: 'Contrôle le résultat puis relis la consigne pour formuler la conclusion.',
   selfCheck: 'Ta dernière phrase répond-elle mot pour mot à ce qui était demandé ?',
   microExample: 'Après x=3, écrire « La valeur cherchée est donc x=3 ». ',
   pitfall: 'Laisser un nombre isolé comme dernière ligne.',
   bacWriting: 'Termine par une phrase de conclusion courte et précise.'
  }
 ]
};

const PRACTICE: Record<SolverTopic, TutorPractice> = {
 Analyse: {
  title: 'Mini-entraînement · fonction',
  prompt: 'On considère f(x)=x²−4x+3. Détermine le sens de variation de f.',
  hint: 'Commence par calculer f’(x), puis cherche où cette dérivée s’annule.',
  solution: 'f’(x)=2x−4=2(x−2). Elle est négative pour x<2 et positive pour x>2. Donc f décroît sur ]−∞,2] puis croît sur [2,+∞[.',
  checkpoint: 'Tu dois relier explicitement le signe de f’ au sens de variation de f.'
 },
 Algèbre: {
  title: 'Mini-entraînement · équation',
  prompt: 'Résous x²−5x+6=0.',
  hint: 'Cherche deux nombres dont la somme vaut 5 et le produit 6.',
  solution: 'x²−5x+6=(x−2)(x−3). Un produit est nul si l’un de ses facteurs est nul : x=2 ou x=3.',
  checkpoint: 'Vérifie que 2 et 3 annulent bien le polynôme initial.'
 },
 Complexes: {
  title: 'Mini-entraînement · complexes',
  prompt: 'Calcule (2+i)(2−i) et interprète le résultat avec le module de 2+i.',
  hint: 'Utilise (a+b)(a−b)=a²−b² et i²=−1.',
  solution: '(2+i)(2−i)=4−i²=5. Or |2+i|²=2²+1²=5.',
  checkpoint: 'Le produit d’un complexe par son conjugué est le carré de son module.'
 },
 Probabilités: {
  title: 'Mini-entraînement · loi binomiale',
  prompt: 'Une réussite a une probabilité 0,8. On répète 3 fois l’épreuve indépendamment. Calcule la probabilité d’obtenir exactement 2 réussites.',
  hint: 'Utilise C(3,2)×0,8²×0,2.',
  solution: 'P(X=2)=3×0,8²×0,2=0,384.',
  checkpoint: 'Le résultat doit être compris entre 0 et 1 et correspond à « exactement 2 ».'
 },
 Suites: {
  title: 'Mini-entraînement · suite',
  prompt: 'u_0=1 et u_(n+1)=u_n+2. Calcule u_1, u_2 puis indique le sens de variation.',
  hint: 'Calcule les termes puis étudie u_(n+1)−u_n.',
  solution: 'u_1=3, u_2=5 et u_(n+1)−u_n=2>0. La suite est donc strictement croissante.',
  checkpoint: 'La monotonie doit être justifiée pour tout n, pas seulement observée sur les premiers termes.'
 },
 Géométrie: {
  title: 'Mini-entraînement · vecteurs',
  prompt: 'A(0,0), B(2,1) et C(−1,2). Montre que les vecteurs AB et AC sont orthogonaux.',
  hint: 'Calcule AB et AC puis leur produit scalaire.',
  solution: 'AB=(2,1), AC=(−1,2). AB·AC=2×(−1)+1×2=0. Les vecteurs sont donc orthogonaux.',
  checkpoint: 'Après le calcul égal à 0, écris la conclusion géométrique.'
 },
 Arithmétique: {
  title: 'Mini-entraînement · congruence',
  prompt: 'Donne le reste de 38 dans la division par 7 puis écris la congruence correspondante.',
  hint: 'Cherche 38=7q+r avec 0≤r<7.',
  solution: '38=5×7+3. Donc 38≡3 [7].',
  checkpoint: 'Le reste doit être compris entre 0 et 6.'
 },
 Finance: {
  title: 'Mini-entraînement · finance OSE',
  prompt: '1 000 000 Ar sont placés à 10 % par an pendant 2 ans à intérêts composés. Calcule la valeur acquise.',
  hint: 'Transforme 10 % en 0,10 puis utilise A=C(1+i)^n.',
  solution: 'A=1 000 000×(1+0,10)^2=1 000 000×1,21=1 210 000 Ar.',
  checkpoint: 'Vérifie que tu as utilisé une puissance : c’est un placement à intérêts composés.'
 },
 Général: {
  title: 'Mini-entraînement · méthode',
  prompt: 'Résous 2x+4=10 en écrivant une seule transformation par ligne.',
  hint: 'Commence par isoler le terme contenant x.',
  solution: '2x+4=10 → 2x=6 → x=3.',
  checkpoint: 'Chaque ligne doit rester équivalente à la précédente.'
 }
};

export function getTutorStepSupport(topic: SolverTopic, stepIndex: number): TutorStepSupport {
 const steps = SUPPORT[topic] || SUPPORT.Général;
 const index = Math.max(0, Math.min(steps.length - 1, Number.isFinite(stepIndex) ? Math.trunc(stepIndex) : 0));
 return steps[index];
}

export function getTutorExplanation(topic: SolverTopic, stepIndex: number, level: TutorExplanationLevel): string[] {
 const support = getTutorStepSupport(topic, stepIndex);
 if (level === 'simple') {
  return [support.objective, support.action];
 }
 if (level === 'detail') {
  return [support.objective, support.why, support.action, `Vérifie-toi : ${support.selfCheck}`, `Exemple : ${support.microExample}`];
 }
 return [
  support.objective,
  support.why,
  support.action,
  `Sur la copie : ${support.bacWriting}`,
  `Erreur fréquente : ${support.pitfall}`,
  `Contrôle : ${support.selfCheck}`
 ];
}

export function getTutorPractice(topic: SolverTopic): TutorPractice {
 return PRACTICE[topic] || PRACTICE.Général;
}

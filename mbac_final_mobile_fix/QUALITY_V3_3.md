# Qualité mathématique — V3.3

## Principe

L’application ne doit pas masquer la nature d’un calcul. Un résultat exact, une approximation numérique et une conclusion incertaine sont affichés différemment. Lorsqu’un contrôle échoue ou qu’une méthode ne suffit pas, l’outil doit signaler la limite plutôt que fabriquer une réponse plausible.

## Contrôles intégrés

- Équations polynomiales de degré 1 et 2 : méthode exacte + substitution.
- Dérivées : résultat symbolique + contrôle numérique sur plusieurs points du domaine.
- Intégrales définies : vérification du domaine + deux calculs de Simpson + estimation d’erreur.
- Matrices : pas d’arrondi pendant les opérations ; inverse contrôlée par le produit avec la matrice initiale.
- Complexes : opérations contrôlées et racines d’équations testées dans le polynôme.
- Arithmétique et combinatoire : calcul entier exact lorsque cela est possible.
- Réponses BAC : comparaison symbolique d’abord, puis contrôle numérique strict si nécessaire ; aucun nombre n’est extrait d’une phrase au hasard.

## Limites volontairement affichées

- Une équation non polynomiale recherchée numériquement n’est garantie que sur l’intervalle affiché.
- Une inéquation ou comparaison numérique est limitée à la fenêtre choisie.
- Une suite calculée sur quelques termes donne une tendance, pas une preuve de convergence.
- Une limite numérique n’est affichée que si les échantillons sont suffisamment cohérents ; sinon l’application demande une étude analytique.
- La loi normale utilise une approximation numérique de sa fonction de répartition.

## Pour les élèves

Les écrans de résultat privilégient l’ordre suivant : **données → formule/méthode → calculs intermédiaires → contrôle → réponse finale**. Cela permet de comparer chaque étape avec le brouillon et d’identifier plus facilement une erreur de signe, de domaine ou de calcul.

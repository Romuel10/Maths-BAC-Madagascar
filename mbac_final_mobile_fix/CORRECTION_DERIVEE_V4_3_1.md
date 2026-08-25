# V4.3.1 — Correction notation et étapes de dérivation

- Corrige définitivement le rendu des primes après parenthèses : `(u/v)'`, `(u^n)'`, `(u-v)'` ne sont plus interprétés comme transposées hermitiennes `H`.
- Corrige le rendu du carré dans la formule du quotient : le dénominateur reste bien `v²`.
- Pour un quotient, remplace les micro-étapes récursives répétées par 4 étapes BAC : identifier `u` et `v`, calculer `u'` et `v'`, appliquer la formule, développer/réduire.
- Affiche les calculs réels sous forme mathématique, pas seulement dans du texte technique.
- Exemple contrôlé : pour `f(x)=(x²-1)/(x-2)`, la méthode mène à `f'(x)=(x²-4x+1)/(x-2)²` puis `f''(x)=6/(x-2)³`.

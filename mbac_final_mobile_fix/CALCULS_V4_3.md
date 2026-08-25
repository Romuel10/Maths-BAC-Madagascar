# V4.3 — Correction réelle dérivées, graphique et intégrales

## Cause corrigée
Le normaliseur des fonctions rationnelles ne traversait pas les `ParenthesisNode` produits par MathJS. Une expression comme `(x^2-1)/(x-2)` pouvait donc être dérivée correctement, mais la simplification finale rationnelle n'était pas appliquée. La V4.3 traite explicitement ces parenthèses.

## Dérivées
- chemin exact dédié aux polynômes et quotients de polynômes ;
- formule `(P/Q)'=(P'Q-PQ')/Q^2` calculée puis réduite algébriquement ;
- même normalisation pour la dérivée seconde ;
- interface réduite aux règles utiles ;
- une seule réponse finale simplifiée, séparée des calculs intermédiaires.

Cas de régression obligatoire :
`f(x)=(x^2-1)/(x-2)`
- `f'(x)=(x^2-4x+1)/(x-2)^2`
- `f''(x)=6/(x-2)^3`

## Graphique
- la courbe est recalculée sur la fenêtre visible après zoom ;
- échelle verticale robuste ;
- ruptures aux discontinuités ;
- rendu clair/sombre spécifique au repère ;
- axes, graduations, asymptotes et courbes dérivées mieux distingués.

## Intégrales
- méthode exacte prioritaire dès qu'une primitive sûre est reconnue ;
- affichage `F(b)-F(a)` puis réponse exacte ;
- Simpson seulement en secours, marqué avec `≈` et estimation d'erreur ;
- graphe de l'aire recalculé selon les bornes choisies.

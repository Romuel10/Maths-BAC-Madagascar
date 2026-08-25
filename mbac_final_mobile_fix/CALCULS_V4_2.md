# V4.2 — Dérivées, graphiques et intégrales

Cette version renforce trois blocs destinés aux élèves du BAC.

## Dérivées
- Les dérivées rationnelles polynomiales sont remises sous une fraction unique et réduite.
- Les facteurs répétés simples sont conservés sous une forme lisible, par exemple `(x-2)^2` au lieu de développer systématiquement le dénominateur.
- La réponse finale est isolée dans un bloc **Réponse finale à retenir**.
- Les étapes élémentaires inutiles sont condensées dans l'affichage ; les règles importantes (puissance, produit, quotient, chaîne) restent visibles.
- Le bug d'affichage `f^H`, `u^H`, `v^H` est corrigé : les apostrophes sont rendues comme de vraies dérivées `f'`, `f''`, `u'`, `v'`.

## Intégrales
- Priorité à une méthode exacte lorsqu'une primitive fiable est reconnue.
- Polynômes : intégration terme à terme, puis `F(b)-F(a)`.
- Cas `c/(mx+p)` : logarithme avec contrôle du domaine.
- Fonctions usuelles `sin(x)`, `cos(x)`, `exp(x)`.
- Simpson reste le repli numérique pour les cas non reconnus, avec double maillage et estimation d'erreur.
- Le résultat exact et son approximation sont distingués.

## Graphiques
- Échelle verticale robuste afin qu'une asymptote ou une valeur énorme n'écrase plus toute la courbe.
- Rupture du tracé autour des discontinuités au lieu de relier artificiellement les branches.
- Axes `x` et `y`, graduations plus lisibles et étiquettes d'asymptotes.
- Légende enrichie.
- Explications corrigées : une asymptote horizontale ou oblique peut être traversée par la courbe.

## Principe pédagogique
L'application privilégie maintenant : **méthode → remplacement → simplification → réponse finale → vérification**.

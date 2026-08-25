# Design V4.1 — Interface académique unifiée

## Direction

La V4.1 abandonne les anciens écrans multicolores et les pictogrammes emoji. L’interface suit désormais un langage visuel unique inspiré d’un support de révision et d’une copie d’examen : surfaces sobres, contraste contrôlé, accent rouge discret, vert réservé aux validations, bleu réservé aux informations et ambre réservé aux avertissements.

## Principes

1. Une seule hiérarchie visuelle sur toutes les pages.
2. Aucun emoji dans les libellés ou titres d’interface.
3. Les formules sont affichées en notation mathématique lisible via KaTeX.
4. Les calculateurs utilisent la même structure : saisie → résultat → fiabilité → étapes → clavier.
5. Les anciens composants utilisant des couleurs Tailwind codées en dur héritent désormais des variables du thème global.
6. Les outils sont regroupés par famille plutôt qu’affichés dans une grille sans hiérarchie.
7. Les modes clair et sombre conservent la même structure et le même sens des couleurs.
8. Aucun asset graphique externe ni image générée n’est utilisé.

## Organisation des outils

- Calcul et algèbre
- Analyse
- Géométrie et données
- Révision et utilitaires

## Calculatrices

Les touches ne sont plus différenciées par une multitude de couleurs. Elles suivent cinq rôles :

- nombre / saisie normale ;
- fonction ;
- opérateur ;
- action ;
- validation.

Le résultat est séparé de la saisie et les étapes sont placées après le panneau de fiabilité.

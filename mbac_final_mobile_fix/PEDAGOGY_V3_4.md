# V3.4 — Moteur pédagogique

Cette version transforme la résolution guidée en atelier de raisonnement.

## Nouveautés principales

- Trois modes : **Guidé**, **Normal**, **Autonome**.
- Saisie du raisonnement **ligne par ligne**.
- Vérification de l'équivalence entre deux lignes de calcul lorsque le moteur peut le faire de façon fiable.
- Statuts explicites : **vérifiée**, **cohérente**, **à corriger**, **à contrôler**.
- Détection de plusieurs erreurs fréquentes : carré d'une somme, signe devant parenthèses, coefficient oublié dans une puissance, racine/logarithme distribués à tort, division par zéro.
- Clavier mathématique visuel avec modèles de fraction, puissance, racine et valeur absolue.
- Aperçu immédiat en notation scolaire avec KaTeX.
- Tableaux de signes et de variations redessinés dans un format plus proche d'une correction de BAC.
- La méthode de référence peut être révélée progressivement au lieu d'afficher toute la correction d'un coup.

## Principe de fiabilité

Une vérification numérique n'est jamais présentée comme une preuve exacte. Lorsqu'une transformation ne peut pas être prouvée automatiquement, l'application affiche **À contrôler** plutôt que de valider arbitrairement la ligne.

## Limites connues

Le contrôle ligne par ligne est particulièrement fiable pour les identités algébriques et certaines équations simples. Les raisonnements rédigés, les transformations avec conditions implicites et les preuves géométriques nécessitent encore une comparaison avec la méthode de référence.

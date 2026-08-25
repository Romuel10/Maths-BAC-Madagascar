# Validation V4.5.1

## Diagnostic du retour Termux

Deux échecs de `test:integration` ont été reproduits par lecture du test :

1. attente incorrecte pour `1/(x-2)=0` ;
2. erreur de variable `iq.quality` au lieu de `iqGen.quality`.

Les moteurs eux-mêmes ont été exécutés isolément :

- `1/(x-2)=0` -> aucune solution, preuve exacte, qualité `verified` ;
- `sin(x)>0` sur `[-6,6]` -> `exact=false`, qualité `approximate`, avertissement de fenêtre présent.

## Tests exécutés après correction

- `npm run test:all-math` : réussite complète ;
- dérivées : 1 960 contrôles, 0 échec ;
- coeur mathématique : 1 130 contrôles, 0 échec ;
- outils mathématiques : 1 906 contrôles, 0 échec ;
- limites : 20 contrôles, 0 échec ;
- utilitaires : 400 contrôles, 0 échec ;
- total : 5 416 contrôles, 0 échec ;
- `npm run test:source` : 96 fichiers TS/TSX, 300 contrôles, 0 erreur.

`test:integration` nécessite les dépendances npm installées, notamment MathJS. Il doit être relancé dans Termux après `npm install`.

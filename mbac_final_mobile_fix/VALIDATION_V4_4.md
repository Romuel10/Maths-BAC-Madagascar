# Validation V4.4 — moteur de dérivation

## Portée

La V4.4 remplace le moteur de dérivation actif de l'analyse de fonctions par `src/lib/derivativeEngine.ts`.

Chemin actif vérifié :

`StepByStep.tsx` → `mathEngine.ts` → `deriveWithBacEngine()`.

L'ancien moteur récursif et la normalisation rationnelle séparée ne sont plus appelés pour produire la dérivée.

## Régression numérique permanente

Commande :

```bash
npm run test:derivatives
```

Résultat obtenu :

- 46 cas de référence ;
- 120 expressions aléatoires ;
- 980 contrôles numériques de la dérivée première ;
- 980 contrôles numériques de la dérivée seconde ;
- 1 960 contrôles numériques au total ;
- 0 échec.

## Audit symbolique indépendant

Les 46 cas de référence ont aussi été comparés à SymPy :

- 46 comparaisons de f' ;
- 46 comparaisons de f'' ;
- 92 comparaisons symboliques au total ;
- 0 divergence.

## Familles couvertes

- constantes, x et polynômes ;
- produits et quotients ;
- puissances entières, négatives et fractionnaires ;
- racines carrées ;
- exponentielles ;
- logarithmes naturels ;
- sinus, cosinus, tangente ;
- compositions ;
- puissances à exposant variable (avec conditions de validité) ;
- valeur absolue avec avertissement aux points non dérivables.

## Contrôles de sécurité mathématique

- la réponse et les étapes sont issues du même AST ;
- la dérivée première et la dérivée seconde sont contrôlées séparément ;
- un résultat non confirmé n'est pas présenté comme « vérifié » ;
- les avertissements de domaine sont transmis à l'interface ;
- MathJS reste un contrôle secondaire et ne remplace pas le moteur pédagogique.

## Validation de code

- contrôle TypeScript ciblé du nouveau moteur et de `mathEngine.ts` ;
- contrôle syntaxique de tous les fichiers TS/TSX ;
- contrôle des imports locaux ;
- `package.json` et manifeste PWA valides ;
- aucun `node_modules` ni `dist` dans l'archive de livraison.

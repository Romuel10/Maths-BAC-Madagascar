# V4.5 — Audit mathématique complet

## Objectif

La V4.5 étend la méthode utilisée pour le moteur de dérivation V4.4 à l’ensemble des outils sensibles. L’objectif n’est pas d’afficher une réponse à tout prix, mais de savoir si une réponse est **exacte**, **approchée mais contrôlée**, ou **non certifiable automatiquement**.

## Architecture retenue

Les calculs importants sont déplacés hors des composants React vers des moteurs dédiés et testables. Les composants se chargent de la saisie et de l’affichage ; ils ne doivent plus porter de logique mathématique parallèle susceptible de diverger du moteur principal.

Moteurs concernés :

- `derivativeEngine.ts` — dérivées première/seconde et étapes ;
- `equationEngine.ts` — équations exactes et recherches numériques contrôlées ;
- `inequalityEngine.ts` — inéquations exactes prises en charge et repli numérique explicitement local ;
- `polynomialEngine.ts` / `rationalEngine.ts` — algèbre polynomiale et domaine rationnel ;
- `integralEngine.ts` / `intervalDomainEngine.ts` — primitives, intégrales et certification du domaine ;
- `limitEngine.ts` — limites exactes prises en charge ;
- `sequenceEngine.ts` — suites avec preuves séparées des observations ;
- `matrix.ts` — déterminants, résolution et inversion avec contrôle ;
- `complex.ts` — calculs complexes et équations quadratiques complexes ;
- `probabilityEngine.ts` — combinatoire/probabilités/statistiques ;
- `geometryEngine.ts` — calculs de géométrie analytique ;
- `arithmeticEngine.ts` — PGCD/PPCM/factorisation/modulo/bases en entiers exacts ;
- `unitEngine.ts` — conversions d’unités avec contrôle inverse ;
- `calculatorEngine.ts` — calculatrice avec plusieurs chemins de contrôle lorsque possible.

## Corrections importantes découvertes pendant l’audit

### Domaine et équivalence

Une simplification rationnelle n’est plus considérée comme totalement équivalente si elle change le domaine. Exemple :

`(x² − 1)/(x − 1)` et `x + 1` donnent les mêmes valeurs lorsque `x ≠ 1`, mais la première expression interdit `x = 1`. Cette information est conservée.

### Inéquations / géométrie 2D

Une erreur de signe dans l’application de Cramer pouvait inverser l’intersection de deux droites. Le calcul a été remplacé par un moteur dédié et le point obtenu est maintenant substitué dans les deux équations.

### Intégrales

Un balayage de quelques points n’est plus accepté comme preuve qu’une fonction est continue sur tout l’intervalle. Une intégrale numérique est refusée si le moteur ne peut pas certifier suffisamment le domaine. Une primitive exacte reconnue est redérivée avant d’être acceptée.

### Suites

Les premiers termes ne sont plus transformés en preuve globale. Les suites polynomiales ont une analyse dédiée : `n²` est correctement reconnue comme divergente vers `+∞` et minorée par `0`, tandis que `−n²` est majorée par `0`. Le rang initial fait partie de l’analyse.

### Calculatrice

La conversion des fonctions trigonométriques imbriquées en mode degrés a été rendue récursive. Lorsque la syntaxe est prise en charge par l’évaluateur indépendant, le résultat standard et le résultat haute précision doivent également concorder avec ce troisième chemin.

### Graphique

Les courbes utilisent l’évaluateur contrôlé. Un ancien appel à un évaluateur non défini a été supprimé. Le graphique reste un outil de visualisation : aucune conclusion mathématique globale ne doit dépendre du dessin seul.

## Stratégie de preuve

1. **Exact** : calcul algébrique/déterministe et contrôles de substitution ou d’identité quand disponibles.
2. **Approché mais contrôlé** : résultat numérique accompagné de son intervalle, de sa tolérance ou d’un second calcul.
3. **À contrôler / refus** : si les hypothèses nécessaires ne peuvent pas être prouvées, le moteur n’invente pas une conclusion.

## Tests permanents

Commande principale ne nécessitant pas MathJS à l’exécution des tests :

```bash
npm run test:all-math
```

Résultat de l’audit V4.5 :

- dérivées : 1 960 contrôles ;
- cœur équations/matrices/complexes/probabilités/géométrie : 1 130 contrôles ;
- polynômes/fractions rationnelles/intégrales/suites/inéquations : 1 904 contrôles ;
- limites : 20 contrôles ;
- arithmétique/conversions : 400 contrôles ;
- **total : 5 414 contrôles ; 0 échec**.

Un audit indépendant avec SymPy a également effectué **1 080 comparaisons** sur les équations quadratiques, les matrices et les racines complexes, avec **0 divergence**.

L’audit symbolique de dérivation V4.4 reste documenté séparément dans `DERIVATIVE_AUDIT_V4_4.md`.

## Limites assumées

- Les racines réelles complètes de polynômes/rationnels de degré élevé ne sont pas toujours déterminées exactement ; le moteur doit alors réduire son niveau de certitude.
- Les inéquations transcendantes générales peuvent nécessiter une recherche numérique et ne sont pas annoncées comme solution globale.
- Les limites non reconnues exactement ne sont pas devinées à partir de quelques échantillons.
- Une intégrale numérique n’est pas lancée lorsque la continuité/définition sur tout l’intervalle ne peut pas être suffisamment certifiée.
- Le graphique n’est jamais une preuve.


## Tests d’intégration après installation

La batterie pure teste les moteurs indépendants sans MathJS. Après `npm install`, `npm run test:integration` traverse en plus les chemins applicatifs qui utilisent `mathEngine.ts` et `calculatorEngine.ts`. `npm run test:full` lance d’abord les 5 414 contrôles purs, puis cette intégration.

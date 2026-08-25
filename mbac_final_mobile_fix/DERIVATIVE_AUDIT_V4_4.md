# Audit du moteur de dérivation — V4.4

## Décision

Le moteur de dérivation précédent a été retiré du chemin principal et remplacé par `src/lib/derivativeEngine.ts`.

L'ancien système mélangeait trois sources de vérité différentes :

1. une dérivation récursive interne pour les étapes ;
2. `mathjs.derivative()` pour certaines réponses ;
3. une normalisation rationnelle séparée pour certaines formes finales.

Cette architecture pouvait produire une réponse et des étapes calculées par des chemins différents. Elle rendait aussi les corrections ponctuelles difficiles à sécuriser.

## Nouveau moteur

Le moteur V4.4 utilise un AST déterministe unique pour :

- analyser l'expression ;
- calculer `f'(x)` ;
- calculer `f''(x)` ;
- générer les étapes pédagogiques ;
- produire la forme finale affichée.

MathJS n'est plus la source de la réponse de dérivation. Il sert seulement de contrôle symbolique secondaire dans `mathEngine.ts`.

## Familles prises en charge

- constantes et fonction `x` ;
- polynômes ;
- sommes et différences ;
- produits ;
- quotients ;
- puissances `u^n` ;
- puissances à exposant variable avec condition de validité ;
- racines carrées ;
- exponentielles ;
- logarithmes naturels ;
- sinus, cosinus et tangente ;
- compositions de ces fonctions ;
- valeur absolue avec avertissement aux points non dérivables.

## Corrections importantes

- suppression du conflit entre la réponse finale et les étapes ;
- conservation des parenthèses d'une base négative avant une puissance ;
- fractions exactes privilégiées à la place de décimales inutiles ;
- formes rationnelles réduites et dénominateurs factorisés quand cela améliore la lecture ;
- correction des primes mathématiques : pas de notation `H` ;
- contrôle séparé de la dérivée première et de la dérivée seconde ;
- avertissements de domaine pour les règles qui ne sont pas valables partout ;
- le résultat est marqué « vérifié » uniquement après les contrôles indépendants.

## Audit automatisé effectué

### Corpus de référence

46 expressions de référence couvrant polynômes, quotients, produits, puissances entières, négatives et fractionnaires, racines, exponentielles, logarithmes, trigonométrie et compositions.

- ces 46 cas font partie du même test automatisé que les cas aléatoires ;
- ils sont vérifiés pour la dérivée première **et** la dérivée seconde ;
- échecs : 0.

### Audit symbolique indépendant

Les 46 expressions de référence ont été comparées indépendamment à SymPy :

- 46 dérivées premières ;
- 46 dérivées secondes ;
- 92 égalités symboliques vérifiées ;
- divergence : 0.

### Tests aléatoires

120 expressions supplémentaires générées à partir des familles prises en charge :

Le test complet (46 cas de référence + 120 expressions aléatoires) effectue :

- 980 contrôles numériques de `f'` ;
- 980 contrôles numériques de `f''` ;
- 1 960 contrôles numériques au total ;
- échec : 0.

## Exemples attendus

`(x^2-1)/(x-2)` :

- `f'(x) = (x^2-4x+1)/(x-2)^2`
- `f''(x) = 6/(x-2)^3`

`log(x^2+1)` :

- `f'(x) = 2x/(x^2+1)`
- `f''(x) = (2-2x^2)/(x^2+1)^2`

`sqrt(x^2+1)` :

- `f'(x) = x/sqrt(x^2+1)`
- `f''(x) = 1/((x^2+1)sqrt(x^2+1))`

`x*exp(-x)` :

- `f'(x) = (1-x)exp(-x)`

## Test local

Après `npm install` :

```bash
npm run test:derivatives
```

Le test doit se terminer avec `échecs=0`.

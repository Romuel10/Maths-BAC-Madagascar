# V4.5.1 — Correctif des tests d'intégration

Cette version corrige deux échecs observés dans `npm run test:integration` qui provenaient de la suite de tests, pas des moteurs mathématiques.

## 1. Équation rationnelle `1/(x-2)=0`

Le moteur prouve exactement qu'il n'existe aucune solution réelle : le numérateur vaut constamment 1 et ne peut jamais s'annuler, avec `x=2` exclu du domaine. L'ancien test attendait à tort `exact=false`. Il attend maintenant :

- `exact=true` ;
- `quality='verified'` ;
- aucune solution.

## 2. Inéquation transcendante `sin(x)>0`

Le moteur renvoie correctement une étude numérique limitée à la fenêtre demandée. Le test contenait une faute de variable : après avoir calculé `iqGen`, il vérifiait `iq.quality`, c'est-à-dire le résultat de l'inéquation polynomiale précédente.

Le test vérifie maintenant explicitement :

- `exact=false` ;
- `scope='window'` ;
- `proof='numeric'` ;
- qualité différente de `verified` ;
- présence d'un avertissement ;
- fenêtre exactement `[-6,6]`.

## Renforcement de l'interface

Les inéquations numériques ne sont plus présentées comme un ensemble solution global sur R. L'écran indique clairement la fenêtre étudiée et le graphique utilise exactement cette même fenêtre.

## Tests permanents

Les deux cas ci-dessus ont aussi été ajoutés à `npm run test:math-tools`, qui ne dépend pas de MathJS. Ils font donc désormais partie du socle de régression permanent.

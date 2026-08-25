# Validation V4.5

## Tests mathématiques exécutés

`npm run test:all-math` a été exécuté après les modifications finales.

Résultat attendu et obtenu pendant la préparation : **5 414 contrôles automatiques, 0 échec**.

Répartition :

- dérivées : 1 960 ;
- cœur algébrique/matrices/complexes/probabilités/géométrie : 1 130 ;
- polynômes/fractions rationnelles/intégrales/suites/inéquations : 1 904 ;
- limites : 20 ;
- utilitaires mathématiques (arithmétique/unités) : 400.

Audit indépendant SymPy : **1 080 comparaisons, 0 divergence** sur des jeux générés d’équations quadratiques, matrices et équations quadratiques complexes.

## Contrôle TypeScript et imports

Un contrôle TypeScript de l’ensemble des sources a été effectué avec des déclarations locales de modules afin de détecter les erreurs de symbole/import sans nécessiter l’installation des paquets externes. Deux défauts réels trouvés pendant cette passe ont été corrigés :

- appel résiduel à `evaluate(...)` non défini dans le graphique ;
- référence à un ancien helper polynomial supprimé dans `mathEngine.ts`.

Les imports locaux sont vérifiés séparément avant création de l’archive.

## Test d’intégration

Après `npm install`, exécuter :

```bash
npm run test:integration
```

Ce test traverse les chemins qui dépendent réellement de MathJS : calculatrice, analyse de fonction, équations, intégrales, limites et suites.

Pour tout exécuter :

```bash
npm run test:full
```

### Limite de l’environnement de génération

L’installation npm complète a expiré dans l’environnement de génération. Un **build Vite réel n’est donc pas prétendu comme validé ici**. Il doit être lancé dans Termux après `npm install` :

```bash
npm run build
```

La batterie `test:all-math`, elle, ne dépend pas de l’installation MathJS à l’exécution et a pu être exécutée pendant l’audit.

## Contrôle supplémentaire du test d’intégration

Le chemin TypeScript de `test:integration` a été compilé avec des stubs locaux pour les modules externes afin de vérifier la résolution de tous les imports. Les imports ESM internes de `src/lib` ont été normalisés vers des spécificateurs `.js`, compatibles avec TypeScript/NodeNext tout en restant résolus vers les sources `.ts` pendant le développement.

Le test d’intégration **n’a pas été exécuté** dans l’environnement de génération car `mathjs` n’a pas pu être installé avant expiration du téléchargement. Il est prévu précisément pour être lancé dans Termux après `npm install`.

## Contrôle final avant compression

Le dossier final nettoyé a été recontrôlé juste avant création du ZIP :

- `npm run test:source` : **96 fichiers TypeScript/TSX, 300 contrôles, 0 erreur** ;
- `npm run test:all-math` : **5 414 contrôles mathématiques, 0 échec** ;
- version applicative : **4.5.0** ;
- cache PWA : **maths-bac-madagascar-v4-5-0** ;
- aucun `node_modules` ;
- aucun `dist` ;
- aucun dossier temporaire des tests de régression dans l'archive.

Le build Vite et `test:integration` restent à exécuter après `npm install` dans Termux, car les dépendances externes n'étaient pas installées dans l'environnement de génération.

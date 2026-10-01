# Maths BAC Madagascar — v1.0.1

Application web/PWA et Android de révision et de résolution des mathématiques du Baccalauréat à Madagascar.

## Objectif

L’application aide un élève de Terminale à faire quatre choses simplement :

1. **Réviser** — cours détaillés, méthodes, exemples corrigés, diagnostic et suivi.
2. **Résoudre** — tuteur pas à pas pour comprendre et traiter un exercice.
3. **BAC** — annales référencées, entraînements guidés et simulations.
4. **Outils** — calculateurs spécialisés pour vérifier un raisonnement ou un résultat.

Les séries prises en charge sont **A, C, D, L, OSE et S**, selon le périmètre pédagogique documenté dans le projet.

## Contenus pédagogiques

Le coach couvre 9 grands thèmes : Analyse, Algèbre, Complexes, Probabilités, Suites, Géométrie, Arithmétique, Statistiques et Mathématiques financières. Les cours détaillés comportent méthode, exemples résolus, conseils de rédaction et exercices de vérification.

Le tuteur sait calculer complètement les familles qu’il peut vérifier de façon déterministe et affiche alors une **résolution complète vérifiée**. Pour une formulation non couverte ou ambiguë, il reste en **méthode guidée** plutôt que d’inventer une correction.

## Navigation v1.0.1

La barre principale est volontairement limitée à cinq entrées :

- **Accueil**
- **Réviser**
- **Résoudre**
- **BAC**
- **Outils**

Les outils avancés sont regroupés derrière une section secondaire pour éviter de surcharger l’écran.

## Qualité des réponses

Les formules sont rendues avec KaTeX : fractions, puissances, racines, ensembles, combinaisons et systèmes sont présentés dans une écriture scolaire. Les corrections sont découpées verticalement en étapes, avec une justification séparée et une réponse finale visible.

## Développement

Prérequis : Node.js 22.12 ou ultérieur.

```bash
npm ci
npm run test:full
npm run build
```

Pour tester la version de production localement :

```bash
npm run termux
```

Pour Android :

```bash
npm run cap:sync
npm run android:debug
```

Le bundle signé de publication utilise les variables de signature documentées dans [CAPACITOR_ANDROID.md](CAPACITOR_ANDROID.md).

## Version Android

- `versionName` : **1.0.1**
- `versionCode` : **701**

Le `versionCode` reste supérieur à l’ancien code 700 afin de conserver la possibilité de mettre à jour une installation Android antérieure.

## Confidentialité

Aucun compte, publicité ou analytique n’est requis. Les données d’apprentissage sont conservées localement sur l’appareil. Une photo sélectionnée dans le tuteur est préparée localement et n’est pas envoyée à un serveur par l’application.

Voir [PRIVACY_POLICY.md](PRIVACY_POLICY.md).

## Références pédagogiques

Voir [SOURCES_PEDAGOGIQUES.md](SOURCES_PEDAGOGIQUES.md).

## Licence

Le projet est distribué sous la licence décrite dans [LICENSE](LICENSE). Les dépendances tierces conservent leurs propres licences.

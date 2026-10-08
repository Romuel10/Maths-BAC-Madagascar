# Maths BAC Madagascar — 2.0.0

Application de travail pour les élèves de terminale : calculs avec étapes, cours, entraînement et carnet local. Reconstruction du code applicatif ; la version précédente reste consultable dans l’historique Git.

## Utilisation

Choisir sa série (A, C, D, L, OSE ou S), ouvrir **Résoudre**, sélectionner un outil et saisir la formule. Les 17 outils couvrent le calcul exact, les équations, inéquations, systèmes, fonctions, dérivées, intégrales, limites, suites, probabilités, statistiques, complexes, matrices, géométrie, arithmétique, équations différentielles linéaires et intérêts composés.

**Cours** contient 15 chapitres avec règles, exemples travaillés et erreurs à éviter. **Entraînement** contient 36 questions originales, des sessions chronométrées et un espace pour conserver son sujet. Une formule sélectionnée dans le sujet peut être envoyée à l’atelier. Les liens externes donnent accès aux annales et aux programmes ; ils nécessitent Internet.

Les données sont locales : exporter une sauvegarde depuis les réglages avant de changer d’appareil. Le format v2 est indépendant des sauvegardes v1 ; celles-ci ne sont pas supprimées automatiquement, mais ne sont pas importées par v2.

## Périmètre du moteur

- Calcul symbolique avec Nerdamer 2 et analyse des expressions avec math.js ; calculs exécutés dans un Web Worker avec annulation et délai maximal.
- Conservation des restrictions initiales lors des simplifications et vérification des candidats d’équations.
- Les recherches incomplètes sont indiquées. Les tableaux globaux ne sont proposés que lorsque les zéros et restrictions nécessaires sont déterminés.
- Les graphes et statistiques sont numériques. Le tracé ne constitue pas une preuve.
- Certaines expressions dépassent les méthodes implémentées. L’application ne résout pas automatiquement tout un énoncé rédigé et ne reconnaît pas les photos.
- Les exercices intégrés sont originaux ; ils ne sont pas présentés comme des sujets officiels. La sélection par série est une aide de révision, pas une certification de couverture intégrale du programme.

## Développement

Node.js >= 22.12, npm. Pour Android : Java 21 et SDK Android API 36.

```sh
npm ci
npm run dev
npm test
npm run build
npx playwright install --with-deps chromium
npm run test:ui
npm run cap:sync
npm run android:debug
```

Les tests mathématiques comprennent des oracles indépendants pour 121 couples de racines et 81 valeurs de dérivées, les restrictions, petites valeurs, limites latérales et sauvegardes. Les parcours Chromium vérifient tailles d’écran, thèmes, saisie, worker, reprise, correction, sauvegarde et cache interrompu.

## Android et diffusion

Identifiant : `mg.mathsbac.madagascar`, version `2.0.0`, code `20000`. La CI construit un APK de test après les tests web. Ce fichier utilise la signature de débogage ; pour une publication en boutique, produire une version avec la clé de signature de distribution. Une mise à jour d’une installation existante exige la même signature.

Le répertoire `dist` peut être hébergé statiquement. Le service worker précharge toutes les ressources et n’active le cache qu’après un téléchargement complet. L’APK embarque directement les ressources, sans téléchargement initial.

## Confidentialité et licences

Pas de compte, pas de publicité, pas de télémétrie. Les calculs et sauvegardes restent sur l’appareil. Les exports Android utilisent le partage natif. Voir [PRIVACY_POLICY.md](PRIVACY_POLICY.md), [LICENSE](LICENSE) et [docs/SOURCES.md](docs/SOURCES.md).

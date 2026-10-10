# Maths BAC Madagascar — 2.2.0

Application de travail pour les élèves de terminale : calculs avec étapes, cours, entraînement et carnet local. Reconstruction du code applicatif ; la version précédente reste consultable dans l’historique Git.

## Utilisation

L’application s’ouvre directement sur **Résoudre**. Choisir sa série (A, C, D, L, OSE ou S), le type de question, puis saisir ses données. Des champs séparés permettent de saisir les coefficients d’équations et de fonctions, les systèmes à deux inconnues, les suites arithmétiques, géométriques ou affines, les complexes, vecteurs et PGCD/PPCM. Les matrices 2×2 à 4×4 et les statistiques disposent de grilles. Les expressions s’éditent directement dans un champ mathématique avec fractions à deux étages et exposants. Les modes « Renseigner les données » et « Saisie texte » restent disponibles. Les 17 outils couvrent le calcul exact, les équations, inéquations, systèmes, fonctions, dérivées, intégrales, limites, suites, probabilités, statistiques, complexes, matrices, géométrie, arithmétique, équations différentielles linéaires et intérêts composés.

**Cours** contient 15 chapitres avec règles, exemples travaillés et erreurs à éviter. **Entraînement** contient 36 questions originales, des sessions chronométrées et un espace pour conserver son sujet. Une formule sélectionnée dans le sujet peut être envoyée à l’atelier. Les liens externes donnent accès aux annales et aux programmes ; ils nécessitent Internet.

Les données sont locales : exporter une sauvegarde depuis les réglages avant de changer d’appareil. Le format v2 est indépendant des sauvegardes v1 ; celles-ci ne sont pas supprimées automatiquement, mais ne sont pas importées par v2.

La saisie libre accepte notamment `3x`, `x²`, `√9`, `ln x`, `eˣ`, les virgules décimales et `f(x) = …`. L’aperçu montre la formule comprise ; les arguments composés doivent être parenthésés, par exemple `ln(2x+1)`. L’éditeur MathLive local affiche et édite les fractions, racines, ln et eˣ. Les flèches parcourent numérateur, dénominateur et exposants ; le clavier tactile propose chiffres, fonctions, inégalités et symboles. Les brouillons visuels et historiques v2 sont conservés. Les calculs trigonométriques du calculateur peuvent utiliser les degrés ou les radians. Les outils d’analyse utilisent les radians.

Une forme inchangée est signalée et un bouton permet de remplacer x par une valeur. Une équation tapée dans le calculateur est reconnue automatiquement.

## Périmètre du moteur

- Calcul symbolique avec Nerdamer 2 et analyse des expressions avec math.js ; calculs exécutés dans un Web Worker avec annulation et délai maximal.
- Conservation des restrictions initiales lors des simplifications et vérification des candidats d’équations.
- Recherche numérique de racines par balayage, dichotomie et Newton dans un intervalle choisi, avec contrôle dans les deux membres initiaux. Les résultats numériques portent le signe ≈ ; l’absence de racine repérée ne prouve pas l’absence de solution. Les familles trigonométriques à argument affine incluent toutes les branches.
- Intégrales entre bornes finies : méthode exacte si possible, puis quadrature adaptative de Gauss–Kronrod 7/15 avec contrôle de domaine par intervalles. Les singularités sont refusées ; les intégrales impropres ne sont pas traitées automatiquement. L’écart de quadrature est une estimation.
- Les recherches incomplètes sont indiquées. Les tableaux globaux ne sont proposés que lorsque les zéros et restrictions nécessaires sont déterminés.
- Étude de fonction : domaine, dérivées première et seconde, zéros, extrema, inflexions, variations, convexité, limites et asymptotes établies symboliquement. Les facteurs exponentiels et certaines équations de logarithmes sont traités par transformations inversibles ; les recherches restantes sont limitées à la fenêtre initiale et signalées comme numériques.
- Le graphe adapte son échantillonnage, coupe les segments dont le domaine continu n’est pas établi, et recalcule la courbe lors du zoom et du déplacement. Lecture de f(x) et f′(x), tangente, points remarquables, asymptotes et fenêtres en x/y sont interactifs. Le zoom ne relance pas l’étude numérique initiale. Les graphes et statistiques sont numériques ; un tracé ne constitue pas une preuve.
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

Les tests mathématiques comprennent des oracles indépendants pour 121 couples de racines et 81 valeurs de dérivées, des références d’intégrales obtenues par séries intégrées à 85 chiffres, des équations transcendantes, les branches trigonométriques, les pôles, le sous-dépassement numérique, les grands entiers, les restrictions, limites latérales et sauvegardes. Les parcours Chromium vérifient tailles d’écran, thèmes, saisie, worker, reprise, correction, sauvegarde et cache interrompu, ainsi que l’édition tactile et physique de fractions, ln, exponentielles, le zoom et la tangente. Les polices et modules de l’éditeur sont embarqués et mis en cache ; aucun service externe de calcul n’est utilisé.

## Android et diffusion

Identifiant : `mg.mathsbac.madagascar`, version `2.2.0`, code `20200`. La CI construit un APK de test après les tests web. Ce fichier utilise la signature de débogage ; pour une publication en boutique, produire une version avec la clé de signature de distribution. Une mise à jour d’une installation existante exige la même signature.

Le répertoire `dist` peut être hébergé statiquement. Le service worker précharge toutes les ressources et n’active le cache qu’après un téléchargement complet. L’APK embarque directement les ressources, sans téléchargement initial.

## Confidentialité et licences

Pas de compte, pas de publicité, pas de télémétrie. Les calculs et sauvegardes restent sur l’appareil. Les exports Android utilisent le partage natif. Voir [PRIVACY_POLICY.md](PRIVACY_POLICY.md), [LICENSE](LICENSE) et [docs/SOURCES.md](docs/SOURCES.md).

# Maths BAC Madagascar — version 7.0.0

Application mobile et web de préparation aux mathématiques du BAC à Madagascar. Elle fonctionne en français avec une navigation français/malagasy et conserve les données d’apprentissage sur l’appareil.

## Nouveautés principales

- Chargement mobile corrigé : les écrans essentiels s’ouvrent immédiatement et MathJS n’est chargé que lorsqu’un calcul avancé le demande.
- État de chargement explicite avec délai maximal pour l’analyse de fonction et bouton de reprise en cas de panne.
- 8 chapitres complets : Analyse, Algèbre, Complexes, Probabilités, Suites, Géométrie, Arithmétique et Statistiques.
- 32 sections de cours, 51 formules expliquées, 16 exemples entièrement corrigés et 56 QCM avec explications.
- 6 sujets originaux guidés de type BAC, soit 2 pour chacune des séries A, C et D et 36 questions avec indices, méthode et correction.
- Recherche dans les leçons, formules et exercices ; diagnostic par série, carnet d’erreurs et recommandations locales.
- Projet Android Capacitor 8.5.2 prêt pour un premier bundle Google Play, API 36 et Android 7 minimum.
- Icône Android, écran de démarrage, signature externe sécurisée et workflow de génération AAB inclus.

## Menu Résoudre

Le menu répond à quatre besoins d’élève : comprendre un énoncé, étudier une fonction, vérifier deux étapes de calcul et choisir une méthode par chapitre. L’analyseur de fonction calcule domaine, limites, dérivées, variations, graphe, convexité, asymptotes et outils complémentaires dans un Web Worker. Si le moteur ne répond pas en 20 secondes, l’attente s’arrête avec une consigne exploitable au lieu de rester bloquée.

## Lancer rapidement sous Termux

```bash
pkg update
pkg install nodejs-lts openjdk-21 git unzip imagemagick
# Vérifier ensuite : Node.js 22.12 ou ultérieur
cd ~/Maths-BAC-Madagascar-V7-Capacitor
npm ci
npm run termux
```

Ouvrir `http://localhost:5173`. Utiliser `npm run termux`, et non `npm run dev`, pour les essais normaux sur téléphone : la version de production est déjà optimisée et ne compile pas chaque écran au premier clic.

Commandes utiles :

```bash
npm run typecheck       # contrôle TypeScript
npm run test:full       # audits, régressions et build web
npm run cap:sync        # reconstruit puis copie le web dans Android
npm run android:debug   # APK de test si le SDK Android est installé
npm run android:bundle  # AAB signé ; variables de signature obligatoires
```

La procédure complète de signature, GitHub Actions et Google Play se trouve dans [CAPACITOR_ANDROID.md](CAPACITOR_ANDROID.md). La politique à héberger avant publication se trouve dans [PRIVACY_POLICY.md](PRIVACY_POLICY.md). La référence institutionnelle et la méthode éditoriale sont consignées dans [SOURCES_PEDAGOGIQUES.md](SOURCES_PEDAGOGIQUES.md).

## Transparence pédagogique

Le contenu intégré est un corpus original de révision structuré pour les séries A, C et D ; il ne reproduit pas des sujets officiels et ne constitue pas une validation du ministère. Les liens d’annales sont des références externes. Avant une diffusion scolaire large, faire relire les cours et corrections par un enseignant de mathématiques connaissant le programme malgache en vigueur.

La note du mode chronométré est une estimation d’entraînement. Une démonstration ou une réponse rédigée doit toujours être comparée à la correction et, si possible, validée par un enseignant.

## Données et confidentialité

- Aucun compte, serveur applicatif, outil publicitaire ou analytique n’est intégré.
- Progression, brouillons et sujets locaux restent dans le stockage de l’appareil.
- Une photo choisie dans le tuteur est compressée localement et n’est pas envoyée.
- Les liens externes nécessitent Internet et relèvent de leurs éditeurs respectifs.
- L’activation locale est désactivée par défaut et aucun secret administrateur n’est embarqué.

## Licence

Le projet est distribué sous la licence propriétaire décrite dans [LICENSE](LICENSE). Les dépendances tierces conservent leurs propres licences.

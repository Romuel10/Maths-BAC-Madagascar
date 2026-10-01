# Validation de la version 7.0.0

Mise à jour prépublication : 1 octobre 2026.

## Configuration actuellement validée par la CI

- Node.js : 22.12 ou ultérieur.
- Vite : 8.3.2.
- React / React DOM : 19.2.6.
- TypeScript : 5.9.3.
- Tailwind CSS et `@tailwindcss/vite` : 4.3.3.
- Capacitor Core / Android / CLI : 8.5.2.
- Capacitor App : 8.1.1.
- Android : `minSdk 24`, `compileSdk 36`, `targetSdk 36`.
- Identifiant Android : `mg.mathsbac.madagascar`.
- Version Android : `versionCode 700`, `versionName 7.0.0`.

## Contrôles obligatoires

Le workflow `.github/workflows/android-v7-release.yml` est la source de vérité avant publication. Une version ne doit être considérée publiable que lorsque les jobs requis sont verts.

Le job **Validation complète** exécute :

- `npm ci` ;
- `npm audit --audit-level=low` ;
- `npm run typecheck` ;
- audit des sources et de la configuration ;
- régressions dérivées première et seconde ;
- régressions algèbre, probabilités, géométrie, matrices et complexes ;
- régressions des outils mathématiques, limites, arithmétique et conversions ;
- tests d’intégration ;
- build de production et audit des ressources générées.

Le job **Vérification Android** exécute ensuite la synchronisation Capacitor et compile :

- les tests unitaires Android ;
- l’APK debug ;
- les tests instrumentés ;
- le bundle release non signé.

Sur `main`, sur un tag `v*` ou lors d’un lancement manuel, le job **Bundle Android signé** produit enfin l’AAB de publication avec les secrets GitHub de signature.

## Corrections prépublication intégrées

- intervalle d’analyse transmis correctement au graphe ;
- resynchronisation du graphe entre deux analyses et protection des données vides ;
- préférence « réduire les animations » respectée par le tracé ;
- erreurs de stockage des annales locales remontées à l’utilisateur ;
- jours d’étude calculés selon la date locale ;
- progression globale calculée sur l’ensemble du corpus ;
- cache PWA étendu à tous les modules chargés dynamiquement ;
- sauvegarde Android automatique désactivée pour les données locales ;
- tests Android déplacés dans le namespace réel de l’application ;
- scripts Gradle exécutés via Bash dans les commandes npm ;
- dépendances npm corrigées et audit de vulnérabilités intégré à la CI ;
- politique de confidentialité débarrassée de son contact provisoire ;
- mises à jour de dépendances surveillées par Dependabot.

## Publication

La branche de publication doit être fusionnée uniquement après réussite de la validation complète et de la vérification Android. Après fusion sur `main`, vérifier que le job signé produit bien l’artefact `maths-bac-madagascar-v7-aab`, puis installer cette version sur une piste Google Play de test interne avant diffusion publique.

Une vérification sur au moins un téléphone Android réel reste nécessaire pour le démarrage, la navigation, le bouton Retour, le mode hors connexion, les graphiques et la mise à jour depuis une version antérieure.

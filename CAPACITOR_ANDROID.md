# Application Android Capacitor — publication initiale

## Configuration déjà intégrée

- Capacitor `8.5.2` avec projet natif dans `android/`.
- Identifiant Android : `mg.mathsbac.madagascar`.
- Nom : `Maths BAC Madagascar`.
- Android minimum : API 24, soit Android 7.
- Compilation et cible : API 36.
- Version Android de publication : `versionCode 702`, `versionName 1.0.2`.
- Module natif `@capacitor/app` : gestion par défaut du bouton Retour Android.
- Ressources web embarquées dans l’application : aucun serveur n’est requis pour les cours et outils.
- Icône adaptative, écran de démarrage sombre et trafic HTTP en clair désactivé.

L’identifiant Android devient pratiquement définitif après le premier envoi dans Google Play Console. Si `mg.mathsbac.madagascar` doit être remplacé, le faire avant ce premier envoi dans `capacitor.config.ts`, `android/app/build.gradle` et le package Java.

## Préparer et tester depuis Termux

Après extraction de l’archive dans le stockage privé de Termux :

```bash
pkg update
pkg install nodejs-lts openjdk-21 git unzip imagemagick
cd ~/Maths-BAC-Madagascar
node -v
npm ci
npm run termux
```

Node.js doit être en version 22.12 ou ultérieure. Ouvrir l’adresse `http://localhost:5173` affichée. La commande `npm run termux` construit d’abord la version optimisée puis la sert ; elle évite les compilations lentes de `npm run dev` sur téléphone.

Après une modification du code :

```bash
npm run cap:sync
```

Cette commande reconstruit `dist/` puis copie les fichiers dans le projet Android.

## Créer une clé de publication

Créer la clé une seule fois, choisir des mots de passe forts et en conserver au moins deux sauvegardes privées. La perte de cette clé peut empêcher les futures mises à jour hors mécanisme Play App Signing.

```bash
keytool -genkeypair -v \
  -keystore ~/maths-bac-release.jks \
  -alias maths-bac \
  -keyalg RSA -keysize 4096 -validity 10000
```

Ne jamais placer le fichier `.jks` ou ses mots de passe dans le projet, l’archive ou un dépôt public.

## Méthode recommandée depuis un téléphone : GitHub Actions

Le workflow `.github/workflows/android-release.yml` valide d’abord le projet et Android, puis construit un AAB signé sur `main`, sur un tag `v*` ou lors d’un lancement manuel. Ajouter ces quatre secrets dans les paramètres GitHub du dépôt :

- `MATHS_BAC_KEYSTORE_BASE64` : résultat de `base64 -w 0 ~/maths-bac-release.jks` ;
- `MATHS_BAC_KEYSTORE_PASSWORD` ;
- `MATHS_BAC_KEY_ALIAS` : par exemple `maths-bac` ;
- `MATHS_BAC_KEY_PASSWORD`.

Lancer ensuite **Actions → Validation et Android → Run workflow**. Télécharger l’artefact `maths-bac-madagascar-v1.0.2-aab`, puis envoyer le fichier `.aab` sur une piste de test interne de Google Play Console.

## Construction locale avec un SDK Android configuré

Si Android Studio et le SDK API 36 sont installés :

```bash
export MATHS_BAC_KEYSTORE_PATH=/chemin/prive/maths-bac-release.jks
export MATHS_BAC_KEYSTORE_PASSWORD='mot-de-passe-du-keystore'
export MATHS_BAC_KEY_ALIAS='maths-bac'
export MATHS_BAC_KEY_PASSWORD='mot-de-passe-de-la-cle'
npm run android:bundle
```

Le bundle signé est créé dans `android/app/build/outputs/bundle/release/app-release.aab`. Pour un APK de test non destiné au Play Store : `npm run android:debug`.

## Liste de contrôle Google Play

1. Créer l’application dans Play Console avec l’identifiant ci-dessus et activer Play App Signing.
2. Compléter le nom, les descriptions, l’icône 512 × 512, la bannière et les captures d’écran.
3. Héberger `PRIVACY_POLICY.md` sur une URL publique et remplacer son adresse de contact provisoire.
4. Remplir la fiche **Sécurité des données** selon le comportement réel : cette version n’intègre ni compte, ni publicité, ni analytique, ni envoi de photo.
5. Déclarer le public cible et remplir le questionnaire de classification du contenu.
6. Envoyer d’abord l’AAB sur une piste de test interne, tester installation, mise à jour, mode hors ligne et bouton Retour.
7. Corriger tout rapport automatisé avant de demander la production.

Avant chaque future version, augmenter `versionCode` dans `android/app/build.gradle`, puis mettre à jour `versionName` et la version de l’application.

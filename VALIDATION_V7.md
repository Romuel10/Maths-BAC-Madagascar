# Validation de la version 7.0.0

Date : 26 août 2026

## Environnement de validation

- Node.js 24.19.0 ; exigence du projet : Node.js 22 ou ultérieur.
- npm 11.9.0.
- Vite 7.3.2, TypeScript 5.9.3, React 19.2.6.
- Capacitor Core/Android/CLI 8.5.0 et Capacitor App 8.1.1.

## Résultats automatisés

| Contrôle | Résultat |
| --- | --- |
| TypeScript `tsc --noEmit` | réussi |
| Audit source | 96 fichiers, 336 contrôles, 0 erreur |
| Dérivées première et seconde | 1 960 contrôles, 0 échec |
| Algèbre/probabilités/géométrie/matrices/complexes | 1 130 contrôles, 0 échec |
| Moteurs d’outils mathématiques | 1 908 contrôles, 0 échec |
| Limites | 20 contrôles, 0 échec |
| Arithmétique et conversions | 400 contrôles, 0 échec |
| Intégration, contenus et assistant Résoudre | 43 contrôles, 0 échec |
| Build de production | réussi |
| Audit du chargement initial | 5 ressources, 222 Kio gzip, 0 erreur |
| Synchronisation Capacitor Android | réussie, 1 plugin natif détecté |

Total des contrôles mathématiques et d’intégration : **5 461**, sans échec.

## Corpus contrôlé

- 8 chapitres uniques ;
- 32 sections de leçon ;
- 51 formules expliquées ;
- 16 exemples entièrement corrigés ;
- 56 QCM, exactement 7 par thème ;
- 6 sujets guidés, exactement 2 par série A, C et D ;
- 36 questions de sujet avec indice, méthode et réponse finale.

## Performance et fonctionnement web

- MathJS reste dans un paquet séparé et n’appartient pas aux dépendances initiales.
- Les sessions guidées et chronométrées sont chargées uniquement à leur ouverture.
- Le Worker d’analyse est présent dans `dist/assets` et inclus dans le socle hors ligne PWA.
- Le préchargement PWA ne télécharge plus d’avance tous les outils ni les formats WOFF/TTF redondants.
- Le serveur de production a répondu HTTP 200 pour l’index, la route `#solve`, le JavaScript principal, le Worker, le manifeste et le Service Worker.

## Validation Android

- Projet natif généré et synchronisé dans `android/`.
- `minSdk 24`, `compileSdk 36`, `targetSdk 36`.
- `applicationId mg.mathsbac.madagascar`, `versionCode 1`, `versionName 7.0.0`.
- Icônes et écrans de démarrage vérifiés en PNG 8 bits.
- Trafic HTTP en clair désactivé.
- La commande de publication s’arrête volontairement si la clé ou un mot de passe de signature manque.

Le bundle AAB signé n’a pas été produit dans cet environnement, car aucune clé privée de publication ni aucun SDK Android local ne doivent être embarqués dans la livraison. Le workflow GitHub Actions et la procédure Android Studio/Termux sont fournis pour cette dernière étape propriétaire.

## Actions obligatoires avant mise en production

1. Confirmer définitivement l’identifiant `mg.mathsbac.madagascar`.
2. Remplacer l’adresse e-mail provisoire dans `PRIVACY_POLICY.md`, puis publier cette politique sur une URL publique.
3. Créer et sauvegarder la clé de signature, configurer les secrets et générer l’AAB.
4. Installer l’AAB sur une piste Google Play de test interne et tester sur au moins un téléphone Android réel.
5. Faire relire le corpus 2026 par un enseignant connaissant le programme malgache en vigueur.

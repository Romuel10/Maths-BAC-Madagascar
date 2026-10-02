# Validation de publication — v1.0.1

Cette version peut être considérée comme techniquement validée lorsque les deux barrières CI applicatives sont vertes :

- **Validation complète** : TypeScript, audits source/release, régressions mathématiques, build web et audit des bundles.
- **Vérification Android** : synchronisation Capacitor, tests Android, APK debug, tests instrumentés et bundle release non signé.

Le **bundle Android signé** est volontairement séparé de la validation normale de `main`. Il s’exécute uniquement :
- lors d’un lancement manuel du workflow ;
- lors d’un tag de release `v*`.

La signature dépend de quatre secrets GitHub valides : `MATHS_BAC_KEYSTORE_BASE64`, `MATHS_BAC_KEYSTORE_PASSWORD`, `MATHS_BAC_KEY_ALIAS` et `MATHS_BAC_KEY_PASSWORD`. Un problème de secret de signature ne doit pas faire apparaître le code applicatif comme défaillant.

## Vérifications de finition

- version web/PWA : 1.0.1 ;
- Android versionName : 1.0.1 ;
- Android versionCode : 701 ;
- navigation principale limitée à cinq entrées ;
- action « Résoudre » mise en avant dans la navigation mobile ;
- en-tête simplifié avec uniquement Recherche et Calculatrice ;
- aucun ancien écran MiniLesson, RevisionSheets ou UnitConverter ;
- aucun fichier source TS/TSX orphelin hors racines autorisées ;
- séries A/C/D/L/OSE/S accessibles ;
- leçons détaillées et exemples disponibles ;
- tuteur et calculateurs conservent le rendu mathématique lisible ;
- cache PWA versionné 1.0.1 ;
- aucune vulnérabilité npm détectée par la CI.

## État de l’audit du 2 octobre 2026

Les contrôles applicatifs et Android non signés passent. Le dernier échec observé provenait uniquement du keystore de publication : « keystore illisible avec le mot de passe configuré ». Cela nécessite une correction des secrets GitHub avant de générer l’AAB signé.

Une vérification sur téléphone Android réel reste recommandée avant diffusion publique : démarrage, barre de navigation, ouverture des outils, retour Android, mode hors connexion et mise à jour depuis une installation antérieure.

# Validation de publication — v1.0.1

Cette version doit être fusionnée seulement si les deux barrières CI sont vertes :

- **Validation complète** : TypeScript, audits source/release, régressions mathématiques, build web et audit des bundles.
- **Vérification Android** : synchronisation Capacitor, tests Android, APK debug, tests instrumentés et bundle release.

## Vérifications de finition

- version web/PWA : 1.0.1 ;
- Android versionName : 1.0.1 ;
- Android versionCode : 701 ;
- navigation principale limitée à cinq entrées ;
- aucun ancien écran MiniLesson, RevisionSheets ou UnitConverter ;
- aucun fichier source TS/TSX orphelin hors racines autorisées ;
- séries A/C/D/L/OSE/S accessibles ;
- leçons détaillées et exemples disponibles ;
- tuteur et calculateurs conservent le rendu mathématique lisible ;
- cache PWA versionné 1.0.1 ;
- aucune vulnérabilité npm détectée par la CI.

Une vérification sur téléphone Android réel reste recommandée avant diffusion publique : démarrage, barre de navigation, ouverture des outils, retour Android, mode hors connexion et mise à jour depuis une installation antérieure.

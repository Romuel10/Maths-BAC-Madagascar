# Validation V4.1 — Design

Contrôles effectués avant l’archive :

- 80 fichiers TypeScript/TSX parcourus.
- Aucun diagnostic de syntaxe TypeScript de famille TS1xxx lors du contrôle sans dépendances.
- Imports locaux relatifs : 0 import manquant.
- Les composants profondément modifiés (App, Calculator, FunctionInput, Badges) ne présentent pas d’erreur de syntaxe ; les diagnostics restants du contrôle local proviennent principalement des dépendances React/mathjs/KaTeX non installées dans l’environnement de génération.
- `package.json` valide et version passée à 4.1.0.
- Clé de cache PWA passée à V4.1.
- Aucun `node_modules` ni `dist` inclus.
- Aucun asset d’image ajouté pour la refonte.

## Limite

Le build Vite complet doit toujours être exécuté dans le HOME de Termux après `npm install`, l’environnement de génération ne disposant pas des dépendances npm installées.

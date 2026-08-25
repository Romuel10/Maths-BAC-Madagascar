# Validation V3.5

Date de préparation : 23 août 2026.

Contrôles effectués avant création du ZIP :

- **73 fichiers TypeScript/TSX** transpilés individuellement avec TypeScript : **0 erreur de syntaxe**.
- Imports locaux relatifs contrôlés : **0 import manquant**.
- `package.json` et `public/manifest.json` : JSON valide.
- Feuille CSS : accolades équilibrées.
- Registre annales : **28 références A/C/D** issues du catalogue principal + **3 références 2025** explicitement classées comme sources secondaires.
- Cache PWA incrémenté vers `maths-bac-madagascar-v3.5-annales`.
- Aucun `node_modules` ni `dist` embarqué dans l'archive finale.

## Limite de validation

Le build Vite complet dépend de `npm install`. Il doit être exécuté dans le dossier HOME de Termux, conformément au fonctionnement Android déjà validé par l'utilisateur. La validation ci-dessus vérifie la structure et la syntaxe du projet sans prétendre remplacer ce build final.

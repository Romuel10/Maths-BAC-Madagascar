# Validation V3.6

## Contrôles réalisés

- 75 fichiers TypeScript/TSX analysés par le parseur TypeScript : **0 erreur de syntaxe**.
- Résolution des imports relatifs du dossier `src` : **0 import local manquant**.
- `package.json` et `public/manifest.json` : JSON valides.
- Version application : `3.6.0`.
- Cache PWA : `maths-bac-madagascar-v3.6-annales-study`.
- Aucun `node_modules` n’est livré dans l’archive.

## Vérification des sources 2022–2023

Les états affichés dans la V3.6 reposent sur les pages EDUCMAD/ACCESMAD consultées :

- C 2022/2023 : énoncés référencés.
- D 2022/2023 : énoncés référencés ; corrigés du problème référencés.
- A 2022 : énoncé référencé ; corrigés partiels référencés.
- A 2023 : corrigés partiels référencés ; énoncé non confirmé dans la section d’énoncés consultée.

## Limite du contrôle de build

`npm install --no-audit --no-fund` a été tenté dans l’environnement de validation mais a expiré avant l’installation des dépendances. Un bundle Vite complet n’a donc pas été produit ici. Le contrôle final doit être exécuté dans le dossier interne de Termux :

```bash
npm install
npm run build
```

# Validation V4.2

- Contrôle syntaxique TypeScript/TSX via transpilation TypeScript : 79 fichiers source, 0 erreur de syntaxe.
- Import local inchangé par rapport à V4.1.
- Aucun `node_modules` ni `dist` inclus.
- Le build Vite complet doit être lancé dans le dossier Termux après `npm install`.
- Correction spécifique du rendu des primes : `f'` et `f''` ne sont plus interprétés comme une transposition hermitienne.
